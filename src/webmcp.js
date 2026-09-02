import {
  state,
  getReviewAnalysis,
  getTransaction,
  suggestMatch,
  stageReconciliation,
  createPaymentDraft,
  logToolInvocation,
  hydrateLiveState,
} from './store.js';
import { runtime } from './context.js';
import {
  liveBootstrap,
  suggestLiveReconciliation,
  stageLiveReconciliation,
  createLivePaymentDraft,
} from './live-api.js';

export const TOOL_CATALOG = [
  {
    name: 'cherry_get_accounts',
    title: 'Get Cherry bank accounts',
    mode: 'Read only',
    risk: 'low',
    description: 'Read the bank accounts currently visible in the Cherry Money workspace. Never initiates money movement.',
  },
  {
    name: 'cherry_get_transactions',
    title: 'Get bank transactions',
    mode: 'Read only',
    risk: 'low',
    description: 'Retrieve bank transactions and filter them by reconciliation state for analysis.',
  },
  {
    name: 'cherry_search_invoices',
    title: 'Search Cherry invoices',
    mode: 'Read only',
    risk: 'low',
    description: 'Search invoices by customer, invoice number, outstanding amount or payment status.',
  },
  {
    name: 'cherry_suggest_reconciliation',
    title: 'Suggest reconciliation',
    mode: 'Advisory',
    risk: 'low',
    description: 'Explain the best transaction-to-invoice match, including confidence, signals and ambiguity.',
  },
  {
    name: 'cherry_stage_reconciliation',
    title: 'Stage reconciliation',
    mode: 'Approval required',
    risk: 'guarded',
    description: 'Prepare a reconciliation in the visible approval queue. A human must complete the decision.',
  },
  {
    name: 'cherry_get_exceptions',
    title: 'Get exceptions',
    mode: 'Read only',
    risk: 'low',
    description: 'Return ambiguous, low-confidence and approval-pending items that need human attention.',
  },
  {
    name: 'cherry_create_payment_draft',
    title: 'Create payment draft',
    mode: 'Draft only',
    risk: 'guarded',
    description: 'Prepare a payment draft for review. It cannot send, authorise or execute a payment.',
  },
];

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

const liveMode = () => runtime.live.connected;

async function refreshLiveWorkspace() {
  const payload = await liveBootstrap();
  hydrateLiveState(payload);
  runtime.live.company = payload.company || runtime.live.company;
  runtime.live.user = payload.user || runtime.live.user;
  runtime.live.model = payload.openai?.model || runtime.live.model;
  runtime.live.openaiConfigured = Boolean(payload.openai?.configured);
  runtime.live.capabilities = payload.capabilities || runtime.live.capabilities || {};
  return payload;
}

function safeLimit(value, fallback = 25) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(50, Math.trunc(parsed)));
}

function record(name, input, summary, status = 'success') {
  logToolInvocation(name, input, summary, status);
}

export function buildToolDefinitions({ onChange = () => {} } = {}) {
  return [
    {
      name: 'cherry_get_accounts',
      title: 'Get Cherry bank accounts',
      description: 'Use this read-only tool to inspect the bank accounts visible in the current Cherry Money workspace. It never initiates or prepares money movement.',
      annotations: { readOnlyHint: true },
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: async (input = {}) => {
        if (liveMode()) await refreshLiveWorkspace();
        const accounts = state.accounts.map(({ id, name, sortCodeMasked, currency, balance, available, provider, status, lastSyncedAt }) => ({
          id, name, sortCodeMasked, currency, balance, available, provider, status, lastSyncedAt,
        }));
        record('cherry_get_accounts', input, `Returned ${accounts.length} bank accounts.`);
        return toolResult(accounts, `Returned ${accounts.length} bank accounts visible in Cherry Money.`);
      },
    },
    {
      name: 'cherry_get_transactions',
      title: 'Get bank transactions',
      description: 'Use this read-only tool to inspect bank transactions for reconciliation. Set status to review when the user asks what still needs attention. This tool never changes a transaction.',
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['all', 'review', 'matched', 'pending_approval'],
            description: 'Filter by reconciliation state. Use review for unresolved transactions.',
          },
          limit: { type: 'integer', minimum: 1, maximum: 50, description: 'Maximum number of transactions to return.' },
        },
        additionalProperties: false,
      },
      execute: async ({ status = 'all', limit = 25 } = {}) => {
        if (liveMode()) await refreshLiveWorkspace();
        let transactions = [...state.transactions];
        if (status === 'review') {
          transactions = transactions.filter((item) => ['needs_review', 'pending_approval'].includes(item.status));
        } else if (status !== 'all') {
          transactions = transactions.filter((item) => item.status === status);
        }
        const result = transactions.slice(0, safeLimit(limit));
        record('cherry_get_transactions', { status, limit }, `Returned ${result.length} transactions.`);
        return toolResult(result, `Returned ${result.length} Cherry bank transaction(s).`);
      },
    },
    {
      name: 'cherry_search_invoices',
      title: 'Search Cherry invoices',
      description: 'Use this read-only tool to find invoices by invoice number, customer, outstanding amount or payment status. It does not change invoice state.',
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', maxLength: 120, description: 'Optional customer name or invoice number.' },
          amount: { type: 'number', minimum: 0, maximum: 10000000, description: 'Optional outstanding amount in GBP.' },
          status: { type: 'string', enum: ['all', 'unpaid', 'paid'], description: 'Invoice payment status.' },
        },
        additionalProperties: false,
      },
      execute: async ({ query = '', amount, status = 'all' } = {}) => {
        if (liveMode()) await refreshLiveWorkspace();
        const needle = String(query).trim().toLowerCase();
        const invoices = state.invoices.filter((invoice) => {
          const textMatch = !needle || `${invoice.number} ${invoice.customer}`.toLowerCase().includes(needle);
          const amountMatch = amount === undefined || Math.abs(Number(invoice.outstanding) - Number(amount)) < 0.005;
          const statusMatch = status === 'all' || invoice.status === status;
          return textMatch && amountMatch && statusMatch;
        });
        record('cherry_search_invoices', { query, amount, status }, `Found ${invoices.length} invoices.`);
        return toolResult(invoices, `Found ${invoices.length} matching invoice(s).`);
      },
    },
    {
      name: 'cherry_suggest_reconciliation',
      title: 'Suggest reconciliation',
      description: 'Use this advisory tool to analyse one bank transaction and explain the best invoice match, confidence, signals and ambiguity. It makes no financial change.',
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: 'object',
        properties: {
          transaction_id: { type: 'string', maxLength: 191, description: 'Cherry transaction ID, for example txn_001.' },
        },
        required: ['transaction_id'],
        additionalProperties: false,
      },
      execute: async ({ transaction_id }) => {
        const suggestion = liveMode()
          ? (await suggestLiveReconciliation(transaction_id)).suggestion
          : suggestMatch(transaction_id);
        record('cherry_suggest_reconciliation', { transaction_id }, `${suggestion.confidence}% confidence; ready=${suggestion.ready}.`);
        return toolResult(
          suggestion,
          suggestion.ready
            ? `A high-confidence reconciliation suggestion is available (${suggestion.confidence}%).`
            : `This transaction requires human review (${suggestion.confidence}% confidence).`,
        );
      },
    },
    {
      name: 'cherry_stage_reconciliation',
      title: 'Stage reconciliation for approval',
      description: 'Use this guarded tool only after identifying the intended transaction and invoice. It prepares a pending reconciliation in the Cherry UI but does not approve or complete it. Tell the user that explicit human approval is still required.',
      annotations: { readOnlyHint: false },
      inputSchema: {
        type: 'object',
        properties: {
          transaction_id: { type: 'string', maxLength: 191, description: 'Bank transaction ID to stage.' },
          invoice_id: { type: 'string', maxLength: 191, description: 'Invoice ID to stage as the proposed match.' },
        },
        required: ['transaction_id', 'invoice_id'],
        additionalProperties: false,
      },
      execute: async ({ transaction_id, invoice_id }) => {
        let approval;
        if (liveMode()) {
          const result = await stageLiveReconciliation(transaction_id, invoice_id);
          approval = result.approval;
          await refreshLiveWorkspace();
        } else {
          const transaction = getTransaction(transaction_id);
          if (!transaction) throw new Error('Bank transaction not found.');
          approval = stageReconciliation(transaction_id, invoice_id);
        }
        record('cherry_stage_reconciliation', { transaction_id, invoice_id }, 'Reconciliation staged; human approval required.');
        onChange();
        return toolResult(
          {
            approval,
            transactionStatus: getTransaction(transaction_id)?.status || 'pending_approval',
            requiresHumanApproval: true,
            reconciliationCompleted: false,
            nextStep: 'Ask the user to review the visible approval queue and press Approve reconciliation themselves.',
          },
          'Reconciliation staged. It has not been approved or completed.',
        );
      },
    },
    {
      name: 'cherry_get_exceptions',
      title: 'Get reconciliation exceptions',
      description: 'Use this read-only tool when the user asks what needs attention. It returns ambiguous or low-confidence transactions plus staged actions awaiting explicit human approval.',
      annotations: { readOnlyHint: true },
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: async (input = {}) => {
        if (liveMode()) await refreshLiveWorkspace();
        const analysis = getReviewAnalysis();
        const payload = {
          exceptions: analysis.exceptions,
          pendingApprovals: analysis.pendingApprovals,
        };
        record('cherry_get_exceptions', input, `${payload.exceptions.length} exceptions; ${payload.pendingApprovals.length} pending approvals.`);
        return toolResult(
          payload,
          `${payload.exceptions.length} exception(s) and ${payload.pendingApprovals.length} pending approval(s) require attention.`,
        );
      },
    },
    {
      name: 'cherry_create_payment_draft',
      title: 'Create payment draft',
      description: 'Use this guarded tool to prepare a payment draft for visible human review. It never sends, executes or authorises a payment, and no payment-execution tool is exposed by this application.',
      annotations: { readOnlyHint: false },
      inputSchema: {
        type: 'object',
        properties: {
          payee: { type: 'string', minLength: 1, maxLength: 120, description: 'Payee display name.' },
          amount: { type: 'number', exclusiveMinimum: 0, maximum: 10000000, description: 'Payment amount in GBP.' },
          reference: { type: 'string', maxLength: 35, description: 'Payment reference.' },
          purpose: { type: 'string', maxLength: 240, description: 'Reason for the payment.' },
        },
        required: ['payee', 'amount'],
        additionalProperties: false,
      },
      execute: async (input) => {
        const draft = liveMode()
          ? (await createLivePaymentDraft(input)).draft
          : createPaymentDraft(input);
        if (liveMode()) await refreshLiveWorkspace();
        record('cherry_create_payment_draft', input, 'Payment draft created; no money moved.');
        onChange();
        return toolResult(
          {
            draft,
            moneyMoved: false,
            paymentExecuted: false,
            requiresHumanApproval: true,
            safetyBoundary: 'No WebMCP payment execution or authorisation tool exists in this application.',
          },
          'Payment draft created. No money moved.',
        );
      },
    },
  ];
}

export async function registerCherryWebMCP({ onChange = () => {} } = {}) {
  const modelContext = document.modelContext ?? navigator.modelContext;

  if (!modelContext || typeof modelContext.registerTool !== 'function') {
    return {
      supported: false,
      toolCount: 0,
      toolNames: [],
      message: 'WebMCP is not exposed by this browser. Use the guided demo or open this page in ChatGPT’s browser / Chrome 149+ with WebMCP enabled.',
    };
  }

  const controller = new AbortController();
  const definitions = buildToolDefinitions({ onChange });

  for (const definition of definitions) {
    await modelContext.registerTool(definition, { signal: controller.signal });
  }

  window.__cherryWebMcpController = controller;

  return {
    supported: true,
    toolCount: definitions.length,
    toolNames: definitions.map((tool) => tool.name),
    controller,
    message: `${definitions.length} WebMCP tools are live and discoverable.`,
  };
}
