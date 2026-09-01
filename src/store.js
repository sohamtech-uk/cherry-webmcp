const STORAGE_KEY = 'cherry-webmcp-sandbox-v3';
const SCHEMA_VERSION = 3;

const clone = (value) => JSON.parse(JSON.stringify(value));
const isoDay = (offset = 0) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

function createSeedState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    accounts: [
      {
        id: 'acc_business',
        name: 'Cherry Business Current',
        sortCodeMasked: '04-••-18',
        currency: 'GBP',
        balance: 12480.42,
        available: 12190.42,
        provider: 'Open Banking sandbox',
      },
      {
        id: 'acc_reserve',
        name: 'Cherry Tax Reserve',
        sortCodeMasked: '04-••-18',
        currency: 'GBP',
        balance: 4180,
        available: 4180,
        provider: 'Open Banking sandbox',
      },
    ],
    invoices: [
      { id: 'inv_1048', number: 'INV-1048', customer: 'Northstar Studio Ltd', total: 680, outstanding: 680, dueDate: isoDay(-1), status: 'unpaid' },
      { id: 'inv_1049', number: 'INV-1049', customer: 'Acorn Consulting', total: 1250, outstanding: 1250, dueDate: isoDay(2), status: 'unpaid' },
      { id: 'inv_1050', number: 'INV-1050', customer: 'Green & Co', total: 245.5, outstanding: 245.5, dueDate: isoDay(-3), status: 'unpaid' },
      { id: 'inv_1051', number: 'INV-1051', customer: 'Bluefield Design', total: 680, outstanding: 680, dueDate: isoDay(5), status: 'unpaid' },
      { id: 'inv_1044', number: 'INV-1044', customer: 'River Lane CIC', total: 910, outstanding: 0, dueDate: isoDay(-8), status: 'paid' },
    ],
    transactions: [
      {
        id: 'txn_001', accountId: 'acc_business', bookingDate: isoDay(-1), description: 'NORTHSTAR STUDIO INV-1048', merchant: 'Northstar Studio Ltd', direction: 'credit', amount: 680, status: 'needs_review',
      },
      {
        id: 'txn_002', accountId: 'acc_business', bookingDate: isoDay(-1), description: 'ACORN CONSULTING INV1049', merchant: 'Acorn Consulting', direction: 'credit', amount: 1250, status: 'needs_review',
      },
      {
        id: 'txn_003', accountId: 'acc_business', bookingDate: isoDay(-1), description: 'AWS EMEA', merchant: 'Amazon Web Services', direction: 'debit', amount: 87.42, status: 'needs_review',
      },
      {
        id: 'txn_004', accountId: 'acc_business', bookingDate: isoDay(-2), description: 'GREEN AND CO PAYMENT', merchant: 'Green & Co', direction: 'credit', amount: 245.5, status: 'needs_review',
      },
      {
        id: 'txn_005', accountId: 'acc_business', bookingDate: isoDay(-2), description: 'TFL TRAVEL', merchant: 'Transport for London', direction: 'debit', amount: 18.7, status: 'matched',
      },
      {
        id: 'txn_006', accountId: 'acc_business', bookingDate: isoDay(-3), description: 'CLIENT PAYMENT', merchant: 'Unknown sender', direction: 'credit', amount: 680, status: 'needs_review',
      },
    ],
    approvals: [],
    paymentDrafts: [],
    toolActivity: [],
    activity: [
      {
        id: 'event_seed',
        at: new Date().toISOString(),
        actor: 'Cherry',
        kind: 'system',
        message: 'Secure finance sandbox loaded. No production data or credentials are used.',
      },
    ],
  };
}

function readPersistedState() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return parsed?.schemaVersion === SCHEMA_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

export const state = readPersistedState() || createSeedState();
const listeners = new Set();

function persist() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be disabled in private or embedded browser contexts.
  }
}

function notify() {
  persist();
  for (const listener of listeners) listener(state);
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetDemo({ record = true } = {}) {
  const fresh = createSeedState();
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, fresh);
  if (record) {
    logActivity('Human', 'Reset the sandbox to its original demonstration state.', 'reset', false);
  }
  notify();
  return state;
}

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
    const category = /aws|google|microsoft|software|hosting/i.test(`${transaction.description} ${transaction.merchant}`)
      ? 'Software and subscriptions'
      : /tfl|train|uber|travel|bus/i.test(`${transaction.description} ${transaction.merchant}`)
        ? 'Travel'
        : 'General expense';

    return {
      transactionId,
      match: null,
      candidates: [],
      confidence: category === 'General expense' ? 52 : 58,
      ready: false,
      ambiguous: false,
      reason: 'This is a debit and should be reviewed against an expense or supplier bill rather than a sales invoice.',
      suggestedCategory: category,
      recommendedAction: 'Review expense category',
      signals: ['Debit direction', `Suggested category: ${category}`],
    };
  }

  const candidates = state.invoices
    .filter((invoice) => invoice.status === 'unpaid' && money(invoice.outstanding) === money(transaction.amount))
    .map((invoice) => {
      const haystack = normalise(`${transaction.description} ${transaction.merchant}`);
      const referenceHit = Boolean(
        (normalise(invoice.number) && haystack.includes(normalise(invoice.number)))
        || (normalise(invoice.customer) && haystack.includes(normalise(invoice.customer))),
      );
      const confidence = referenceHit ? 94 : 82;
      return {
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        customer: invoice.customer,
        amount: invoice.outstanding,
        dueDate: invoice.dueDate,
        confidence,
        referenceHit,
      };
    })
    .sort((left, right) => right.confidence - left.confidence);

  if (!candidates.length) {
    return {
      transactionId,
      match: null,
      candidates: [],
      confidence: 45,
      ready: false,
      ambiguous: false,
      reason: 'No unpaid invoice has the same outstanding amount.',
      recommendedAction: 'Search or create a manual match',
      signals: ['No exact amount match'],
    };
  }

  const best = candidates[0];
  const tiedBest = candidates.filter((candidate) => candidate.confidence === best.confidence);
  const ambiguous = tiedBest.length > 1 && !best.referenceHit;
  const confidence = ambiguous ? 68 : best.confidence;

  return {
    transactionId,
    match: {
      invoiceId: best.invoiceId,
      invoiceNumber: best.invoiceNumber,
      customer: best.customer,
      amount: best.amount,
    },
    candidates,
    confidence,
    ready: confidence >= 80 && !ambiguous,
    ambiguous,
    reason: best.referenceHit
      ? 'Amount and bank reference point to the same unpaid invoice.'
      : ambiguous
        ? 'The amount matches more than one unpaid invoice, so human review is required.'
        : 'The amount uniquely matches an unpaid invoice.',
    recommendedAction: ambiguous ? 'Ask the human to choose the correct invoice' : 'Stage for human approval',
    signals: best.referenceHit
      ? ['Exact amount', 'Invoice reference or customer match']
      : ambiguous
        ? ['Exact amount', `${tiedBest.length} equally plausible invoices`]
        : ['Exact amount', 'Unique unpaid invoice'],
  };
}

export function getReviewAnalysis() {
  const reviewed = state.transactions
    .filter((transaction) => transaction.status === 'needs_review')
    .map((transaction) => ({ transaction, suggestion: suggestMatch(transaction.id) }));

  return {
    confident: reviewed.filter(({ suggestion }) => suggestion.ready),
    exceptions: reviewed.filter(({ suggestion }) => !suggestion.ready),
    pendingApprovals: state.approvals.filter((approval) => approval.status === 'pending'),
  };
}

export function stageReconciliation(transactionId, invoiceId) {
  const transaction = getTransaction(transactionId);
  const invoice = getInvoice(invoiceId);
  if (!transaction) throw new Error('Bank transaction not found.');
  if (!invoice) throw new Error('Invoice not found.');
  if (transaction.status === 'matched') throw new Error('Transaction is already reconciled.');
  if (transaction.direction !== 'credit') throw new Error('Sales invoice reconciliation can only be staged for a credit transaction.');
  if (invoice.status !== 'unpaid') throw new Error('The selected invoice is no longer unpaid.');
  if (money(transaction.amount) !== money(invoice.outstanding)) throw new Error('Transaction and invoice outstanding amounts do not match.');

  const existing = state.approvals.find(
    (item) => item.transactionId === transactionId && item.status === 'pending',
  );
  if (existing) return existing;

  const approval = {
    id: `approval_${Date.now()}`,
    type: 'reconciliation',
    transactionId,
    invoiceId,
    amount: transaction.amount,
    status: 'pending',
    createdAt: new Date().toISOString(),
    preparedBy: 'WebMCP agent',
  };

  state.approvals.unshift(approval);
  transaction.status = 'pending_approval';
  logActivity('Agent', `Staged ${transaction.id} → ${invoice.number}. Human approval is required.`, 'approval', false);
  notify();
  return approval;
}

export function approveReconciliation(approvalId) {
  const approval = state.approvals.find((item) => item.id === approvalId);
  if (!approval || approval.status !== 'pending') throw new Error('Pending approval not found.');

  const transaction = getTransaction(approval.transactionId);
  const invoice = getInvoice(approval.invoiceId);
  if (!transaction || !invoice) throw new Error('The staged reconciliation is no longer valid.');

  approval.status = 'approved';
  approval.approvedAt = new Date().toISOString();
  transaction.status = 'matched';
  invoice.status = 'paid';
  invoice.outstanding = 0;
  logActivity('Human', `Approved ${transaction.id} → ${invoice.number}. The reconciliation is now complete.`, 'approved', false);
  notify();
  return approval;
}

export function createPaymentDraft({ payee, amount, reference = '', purpose = '' }) {
  const numericAmount = money(amount);
  if (!String(payee || '').trim() || numericAmount <= 0) {
    throw new Error('A payee and positive amount are required.');
  }

  const duplicate = state.paymentDrafts.find(
    (draft) => draft.status === 'draft_only'
      && normalise(draft.payee) === normalise(payee)
      && money(draft.amount) === numericAmount
      && normalise(draft.reference) === normalise(reference),
  );
  if (duplicate) return duplicate;

  const draft = {
    id: `payment_${Date.now()}`,
    payee: String(payee).trim(),
    amount: numericAmount,
    reference: String(reference || '').trim(),
    purpose: String(purpose || '').trim(),
    status: 'draft_only',
    createdAt: new Date().toISOString(),
    moneyMoved: false,
  };

  state.paymentDrafts.unshift(draft);
  logActivity('Agent', `Prepared a payment draft for ${draft.payee} (£${draft.amount.toFixed(2)}). No money moved.`, 'payment', false);
  notify();
  return draft;
}

export function logToolInvocation(toolName, input, summary, status = 'success') {
  state.toolActivity.unshift({
    id: `tool_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    at: new Date().toISOString(),
    toolName,
    input: clone(input || {}),
    summary,
    status,
  });
  state.toolActivity = state.toolActivity.slice(0, 20);
  notify();
}

export function logActivity(actor, message, kind = 'info', shouldNotify = true) {
  state.activity.unshift({
    id: `event_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    at: new Date().toISOString(),
    actor,
    kind,
    message,
  });
  state.activity = state.activity.slice(0, 30);
  if (shouldNotify) notify();
}

export function getDashboardSummary() {
  const analysis = getReviewAnalysis();
  return {
    totalBalance: state.accounts.reduce((sum, account) => sum + Number(account.balance), 0),
    availableBalance: state.accounts.reduce((sum, account) => sum + Number(account.available), 0),
    reviewCount: state.transactions.filter((item) => item.status === 'needs_review').length,
    matchedCount: state.transactions.filter((item) => item.status === 'matched').length,
    pendingCount: state.approvals.filter((item) => item.status === 'pending').length,
    confidentCount: analysis.confident.length,
    exceptionCount: analysis.exceptions.length,
  };
}

export function exportAuditSnapshot() {
  return clone({
    exportedAt: new Date().toISOString(),
    environment: 'representative sandbox',
    approvals: state.approvals,
    paymentDrafts: state.paymentDrafts,
    toolActivity: state.toolActivity,
    activity: state.activity,
  });
}
