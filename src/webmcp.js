import {
  state,
  getTransaction,
  suggestMatch,
  stageReconciliation,
  createPaymentDraft,
} from './store.js';

function toolResult(data, summary = 'Cherry Money tool completed.') {
  return {
    content: [
      {
        type: 'text',
        text: `${summary}\n${JSON.stringify(data, null, 2)}`,
      },
    ],
  };
}

function safeLimit(value, fallback = 25) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(50, Math.trunc(parsed)));
}

export async function registerCherryWebMCP({ onChange = () => {} } = {}) {
  const modelContext = document.modelContext ?? navigator.modelContext;

  if (!modelContext || typeof modelContext.registerTool !== 'function') {
    return {
      supported: false,
      toolCount: 0,
      message: 'WebMCP is not exposed by this browser. The Cherry dashboard still works normally.',
    };
  }

  const controller = new AbortController();
  const registrations = [
    {
      name: 'cherry_get_accounts',
      title: 'Get Cherry bank accounts',
      description: 'Read the bank accounts visible in the current Cherry Money workspace. This is read-only and never initiates money movement.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      execute: async () => toolResult(
        state.accounts.map(({ id, name, currency, balance, available, provider }) => ({ id, name, currency, balance, available, provider })),
        'Returned the bank accounts visible in Cherry Money.',
      ),
    },
    {
      name: 'cherry_get_transactions',
      title: 'Get bank transactions',
      description: 'Read Cherry Money bank transactions for reconciliation analysis. Filter by review state; this tool does not change transaction status.',
      inputSchema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['all', 'review', 'matched', 'pending_approval'],
            description: 'Use review for transactions that still need reconciliation attention.',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 50,
            description: 'Maximum transactions to return.',
          },
        },
        additionalProperties: false,
      },
      execute: async ({ status = 'all', limit = 25 } = {}) => {
        let transactions = [...state.transactions];
        if (status === 'review') {
          transactions = transactions.filter((item) => ['needs_review', 'pending_approval'].includes(item.status));
        } else if (status !== 'all') {
          transactions = transactions.filter((item) => item.status === status);
        }
        return toolResult(transactions.slice(0, safeLimit(limit)), `Returned ${Math.min(transactions.length, safeLimit(limit))} Cherry bank transaction(s).`);
      },
    },
    {
      name: 'cherry_search_invoices',
      title: 'Search Cherry invoices',
      description: 'Search invoices in the current Cherry Money workspace by customer, amount, invoice number or payment status. This is read-only.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Optional customer name or invoice number text.',
          },
          amount: {
            type: 'number',
            minimum: 0,
            description: 'Optional outstanding amount to match in GBP.',
          },
          status: {
            type: 'string',
            enum: ['all', 'unpaid', 'paid'],
          },
        },
        additionalProperties: false,
      },
      execute: async ({ query = '', amount, status = 'all' } = {}) => {
        const needle = String(query).trim().toLowerCase();
        let invoices = state.invoices.filter((invoice) => {
          const textMatch = !needle || `${invoice.number} ${invoice.customer}`.toLowerCase().includes(needle);
          const amountMatch = amount === undefined || Math.abs(Number(invoice.outstanding) - Number(amount)) < 0.005;
          const statusMatch = status === 'all' || invoice.status === status;
          return textMatch && amountMatch && statusMatch;
        });
        return toolResult(invoices, `Found ${invoices.length} matching invoice(s).`);
      },
    },
    {
      name: 'cherry_suggest_reconciliation',
      title: 'Suggest reconciliation',
      description: 'Analyse one bank transaction against Cherry invoices and return the best match, confidence and reason. This is advisory only and makes no financial change.',
      inputSchema: {
        type: 'object',
        properties: {
          transaction_id: {
            type: 'string',
            description: 'Cherry bank transaction ID, for example txn_001.',
          },
        },
        required: ['transaction_id'],
        additionalProperties: false,
      },
      execute: async ({ transaction_id }) => {
        const suggestion = suggestMatch(transaction_id);
        return toolResult(suggestion, suggestion.ready
          ? `A high-confidence reconciliation suggestion is available (${suggestion.confidence}%).`
          : `This transaction needs review (${suggestion.confidence}% confidence).`);
      },
    },
    {
      name: 'cherry_stage_reconciliation',
      title: 'Stage reconciliation for approval',
      description: 'Prepare a transaction-to-invoice reconciliation in Cherry Money. IMPORTANT: this only stages a pending action; a human must approve it in the Cherry UI before the transaction becomes reconciled.',
      inputSchema: {
        type: 'object',
        properties: {
          transaction_id: {
            type: 'string',
            description: 'Bank transaction ID to stage.',
          },
          invoice_id: {
            type: 'string',
            description: 'Invoice ID to stage as the match.',
          },
        },
        required: ['transaction_id', 'invoice_id'],
        additionalProperties: false,
      },
      execute: async ({ transaction_id, invoice_id }) => {
        const transaction = getTransaction(transaction_id);
        if (!transaction) throw new Error('Bank transaction not found.');
        const approval = stageReconciliation(transaction_id, invoice_id);
        onChange();
        return toolResult({
          approval,
          transactionStatus: getTransaction(transaction_id).status,
          requiresHumanApproval: true,
          nextStep: 'Ask the user to review and press Approve in the Cherry Money approval queue.',
        }, 'Reconciliation staged. No final reconciliation has occurred yet.');
      },
    },
    {
      name: 'cherry_get_exceptions',
      title: 'Get reconciliation exceptions',
      description: 'Return Cherry Money items that need human attention: low-confidence/unmatched transactions and actions waiting for explicit approval.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      execute: async () => {
        const exceptions = state.transactions
          .filter((transaction) => transaction.status === 'needs_review')
          .map((transaction) => ({ transaction, suggestion: suggestMatch(transaction.id) }))
          .filter(({ suggestion }) => !suggestion.ready);
        const pendingApprovals = state.approvals.filter((approval) => approval.status === 'pending');
        return toolResult({ exceptions, pendingApprovals }, `${exceptions.length} exception(s) and ${pendingApprovals.length} pending approval(s) require attention.`);
      },
    },
    {
      name: 'cherry_create_payment_draft',
      title: 'Create payment draft',
      description: 'Prepare a payment draft for human review. This tool NEVER executes, sends or authorises a payment and NEVER moves money.',
      inputSchema: {
        type: 'object',
        properties: {
          payee: { type: 'string', minLength: 1, description: 'Payee display name.' },
          amount: { type: 'number', exclusiveMinimum: 0, description: 'Payment amount in GBP.' },
          reference: { type: 'string', description: 'Payment reference.' },
          purpose: { type: 'string', description: 'Reason for the payment.' },
        },
        required: ['payee', 'amount'],
        additionalProperties: false,
      },
      execute: async (input) => {
        const draft = createPaymentDraft(input);
        onChange();
        return toolResult({ draft, moneyMoved: false, requiresHumanApproval: true }, 'Payment draft created. No money moved.');
      },
    },
  ];

  for (const definition of registrations) {
    await modelContext.registerTool(definition, { signal: controller.signal });
  }

  window.__cherryWebMcpController = controller;

  return {
    supported: true,
    toolCount: registrations.length,
    toolNames: registrations.map((tool) => tool.name),
    controller,
    message: `${registrations.length} Cherry Money WebMCP tools registered.`,
  };
}
