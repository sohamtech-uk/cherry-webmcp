const now = new Date();
const isoDay = (offset = 0) => {
  const date = new Date(now);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

export const state = {
  accounts: [
    { id: 'acc_business', name: 'Cherry Business Current', currency: 'GBP', balance: 12480.42, available: 12190.42, provider: 'Open Banking sandbox' },
    { id: 'acc_reserve', name: 'Cherry Tax Reserve', currency: 'GBP', balance: 4180.00, available: 4180.00, provider: 'Open Banking sandbox' },
  ],
  invoices: [
    { id: 'inv_1048', number: 'INV-1048', customer: 'Northstar Studio Ltd', total: 680.00, outstanding: 680.00, dueDate: isoDay(-1), status: 'unpaid' },
    { id: 'inv_1049', number: 'INV-1049', customer: 'Acorn Consulting', total: 1250.00, outstanding: 1250.00, dueDate: isoDay(2), status: 'unpaid' },
    { id: 'inv_1050', number: 'INV-1050', customer: 'Green & Co', total: 245.50, outstanding: 245.50, dueDate: isoDay(-3), status: 'unpaid' },
    { id: 'inv_1051', number: 'INV-1051', customer: 'Bluefield Design', total: 680.00, outstanding: 680.00, dueDate: isoDay(5), status: 'unpaid' },
    { id: 'inv_1044', number: 'INV-1044', customer: 'River Lane CIC', total: 910.00, outstanding: 0, dueDate: isoDay(-8), status: 'paid' },
  ],
  transactions: [
    { id: 'txn_001', accountId: 'acc_business', bookingDate: isoDay(-1), description: 'NORTHSTAR STUDIO INV-1048', merchant: 'Northstar Studio Ltd', direction: 'credit', amount: 680.00, status: 'needs_review' },
    { id: 'txn_002', accountId: 'acc_business', bookingDate: isoDay(-1), description: 'ACORN CONSULTING INV1049', merchant: 'Acorn Consulting', direction: 'credit', amount: 1250.00, status: 'needs_review' },
    { id: 'txn_003', accountId: 'acc_business', bookingDate: isoDay(-1), description: 'AWS EMEA', merchant: 'Amazon Web Services', direction: 'debit', amount: 87.42, status: 'needs_review' },
    { id: 'txn_004', accountId: 'acc_business', bookingDate: isoDay(-2), description: 'GREEN AND CO PAYMENT', merchant: 'Green & Co', direction: 'credit', amount: 245.50, status: 'needs_review' },
    { id: 'txn_005', accountId: 'acc_business', bookingDate: isoDay(-2), description: 'TFL TRAVEL', merchant: 'Transport for London', direction: 'debit', amount: 18.70, status: 'matched' },
    { id: 'txn_006', accountId: 'acc_business', bookingDate: isoDay(-3), description: 'CLIENT PAYMENT', merchant: 'Unknown sender', direction: 'credit', amount: 680.00, status: 'needs_review' },
  ],
  approvals: [],
  paymentDrafts: [],
  activity: [
    { at: new Date().toISOString(), actor: 'Cherry', message: 'Finance sandbox loaded. No production data is used.' },
  ],
};

const money = (value) => Number(Number(value).toFixed(2));
const normalise = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function getTransaction(id) {
  return state.transactions.find((item) => item.id === id);
}

export function getInvoice(id) {
  return state.invoices.find((item) => item.id === id);
}

export function suggestMatch(transactionId) {
  const transaction = getTransaction(transactionId);
  if (!transaction) throw new Error('Bank transaction not found.');

  if (transaction.direction !== 'credit') {
    return {
      transactionId,
      match: null,
      confidence: 58,
      ready: false,
      reason: 'This is a debit. It should be reviewed against an expense or supplier bill, not a sales invoice.',
      suggestedCategory: /aws|google|microsoft/i.test(`${transaction.description} ${transaction.merchant}`)
        ? 'Software and subscriptions'
        : 'General expense',
    };
  }

  const candidates = state.invoices
    .filter((invoice) => invoice.status === 'unpaid' && money(invoice.outstanding) === money(transaction.amount))
    .map((invoice) => {
      let confidence = 82;
      const haystack = normalise(`${transaction.description} ${transaction.merchant}`);
      const invoiceNo = normalise(invoice.number);
      const customer = normalise(invoice.customer);
      const referenceHit = (invoiceNo && haystack.includes(invoiceNo)) || (customer && haystack.includes(customer));
      if (referenceHit) confidence = 94;
      return { invoice, confidence, referenceHit };
    })
    .sort((a, b) => b.confidence - a.confidence);

  if (!candidates.length) {
    return {
      transactionId,
      match: null,
      confidence: 45,
      ready: false,
      reason: 'No unpaid invoice has the same outstanding amount.',
    };
  }

  const best = candidates[0];
  const ambiguous = candidates.filter((candidate) => candidate.confidence === best.confidence).length > 1;
  const confidence = ambiguous && !best.referenceHit ? 68 : best.confidence;

  return {
    transactionId,
    match: {
      invoiceId: best.invoice.id,
      invoiceNumber: best.invoice.number,
      customer: best.invoice.customer,
      amount: best.invoice.outstanding,
    },
    confidence,
    ready: confidence >= 80,
    ambiguous,
    reason: best.referenceHit
      ? 'Amount and bank reference point to the same unpaid invoice.'
      : ambiguous
        ? 'The amount matches more than one unpaid invoice, so human review is required.'
        : 'Exact amount matches an unpaid invoice.',
  };
}

export function stageReconciliation(transactionId, invoiceId) {
  const transaction = getTransaction(transactionId);
  const invoice = getInvoice(invoiceId);
  if (!transaction) throw new Error('Bank transaction not found.');
  if (!invoice) throw new Error('Invoice not found.');
  if (transaction.status === 'matched') throw new Error('Transaction is already reconciled.');
  if (transaction.direction !== 'credit') throw new Error('Sales invoice reconciliation can only be staged for a credit transaction.');
  if (money(transaction.amount) !== money(invoice.outstanding)) throw new Error('Transaction and invoice outstanding amounts do not match.');

  const existing = state.approvals.find((item) => item.transactionId === transactionId && item.status === 'pending');
  if (existing) return existing;

  const approval = {
    id: `approval_${Date.now()}`,
    type: 'reconciliation',
    transactionId,
    invoiceId,
    amount: transaction.amount,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  state.approvals.unshift(approval);
  transaction.status = 'pending_approval';
  logActivity('Agent', `Staged ${transactionId} → ${invoice.number}. Human approval required.`);
  return approval;
}

export function approveReconciliation(approvalId) {
  const approval = state.approvals.find((item) => item.id === approvalId);
  if (!approval || approval.status !== 'pending') throw new Error('Pending approval not found.');
  const transaction = getTransaction(approval.transactionId);
  const invoice = getInvoice(approval.invoiceId);
  approval.status = 'approved';
  approval.approvedAt = new Date().toISOString();
  transaction.status = 'matched';
  invoice.status = 'paid';
  invoice.outstanding = 0;
  logActivity('Human', `Approved ${transaction.id} → ${invoice.number}. Transaction is now reconciled.`);
  return approval;
}

export function createPaymentDraft({ payee, amount, reference, purpose }) {
  const numericAmount = money(amount);
  if (!payee || numericAmount <= 0) throw new Error('A payee and positive amount are required.');
  const draft = {
    id: `payment_${Date.now()}`,
    payee: String(payee),
    amount: numericAmount,
    reference: String(reference || ''),
    purpose: String(purpose || ''),
    status: 'draft_only',
    createdAt: new Date().toISOString(),
  };
  state.paymentDrafts.unshift(draft);
  logActivity('Agent', `Prepared payment draft for ${draft.payee} (£${draft.amount.toFixed(2)}). No money moved.`);
  return draft;
}

export function logActivity(actor, message) {
  state.activity.unshift({ at: new Date().toISOString(), actor, message });
}
