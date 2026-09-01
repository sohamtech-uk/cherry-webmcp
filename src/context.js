export const runtime = {
  webMcpStatus: {
    supported: null,
    toolCount: 0,
    message: 'Checking this browser for WebMCP…',
  },
  live: {
    connected: false,
    loading: false,
    company: null,
    user: null,
    model: null,
    openaiConfigured: false,
    openaiProvider: null,
    capabilities: {},
    error: null,
  },
};

export const INITIAL_MESSAGE = {
  role: 'agent',
  html: `
    <p><strong>I’m ready to close the reconciliation loop safely.</strong></p>
    <p>I can inspect transactions, explain invoice matches, surface uncertainty and prepare actions for your approval.</p>
    <div class="message-callout"><span>Safety contract</span> I can prepare. You approve. No payment execution tool exists.</div>
  `,
  tools: [],
};

export const ui = {
  activeSection: 'overview',
  filter: 'all',
  search: '',
  invoiceFilter: 'all',
  invoiceSearch: '',
  selectedTransactionId: null,
  selectedInvoiceId: null,
  showToolRegistry: false,
  showLiveLogin: false,
  mobileNavOpen: false,
  agentBusy: false,
  bankSyncAt: new Date().toISOString(),
  messages: [INITIAL_MESSAGE],
};
