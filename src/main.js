import './styles.css';
import { INITIAL_MESSAGE, runtime, ui } from './context.js';
import {
  state,
  approveReconciliation,
  createPaymentDraft,
  exportAuditSnapshot,
  getDashboardSummary,
  getInvoice,
  getReviewAnalysis,
  getTransaction,
  logActivity,
  logToolInvocation,
  resetDemo,
  stageReconciliation,
  subscribe,
  suggestMatch,
} from './store.js';
import { registerCherryWebMCP } from './webmcp.js';
import { escapeHtml, icon, money, toast } from './ui.js';
import { renderFooter, renderHero, renderMetrics, renderSidebar, renderTopbar } from './shell.js';
import { renderWorkspace } from './workspace.js';
import { renderBottomGrid, renderToolRegistry, renderTransactionDrawer, renderTransactions } from './ledger.js';
import { renderInvoiceDrawer, renderProductSuite } from './product.js';

const app = document.querySelector('#app');
const sectionIds = new Set([
  'overview',
  'transactions',
  'approvals',
  'tools',
  'audit',
  'invoices',
  'payments',
  'connections',
  'reports',
]);
const initialSection = window.location.hash.replace('#', '');
if (sectionIds.has(initialSection)) ui.activeSection = initialSection;

function render() {
  const summary = getDashboardSummary();
  app.innerHTML = `
    <div class="app-shell">
      ${renderSidebar()}
      <div class="main-shell">
        ${renderTopbar()}
        <main>
          ${renderHero(summary)}
          ${renderMetrics(summary)}
          ${renderWorkspace()}
          ${renderTransactions()}
          ${renderProductSuite()}
          ${renderBottomGrid()}
        </main>
        ${renderFooter()}
      </div>
      ${renderTransactionDrawer()}
      ${renderInvoiceDrawer()}
      ${renderToolRegistry()}
      <div id="toast-region" class="toast-region" aria-live="polite"></div>
    </div>`;

  requestAnimationFrame(() => {
    const chat = document.querySelector('#chat-window');
    if (chat) chat.scrollTop = chat.scrollHeight;
  });
}

function addUserMessage(text) {
  ui.messages.push({ role: 'user', text, time: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date()), tools: [] });
}

function addAgentMessage(html, tools = []) {
  ui.messages.push({ role: 'agent', html, time: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date()), tools });
  ui.messages = ui.messages.slice(-10);
}

function analysisResponse(analysis) {
  const confident = analysis.confident.map(({ transaction, suggestion }) => `
    <li><span>${icon('check', 14)}</span><div><strong>${escapeHtml(transaction.id)} → ${escapeHtml(suggestion.match.invoiceNumber)}</strong><small>${escapeHtml(suggestion.match.customer)} · ${suggestion.confidence}% confidence</small></div><b>${money(transaction.amount)}</b></li>`).join('');
  const exceptions = analysis.exceptions.map(({ transaction, suggestion }) => `
    <li class="exception"><span>${icon('alert', 14)}</span><div><strong>${escapeHtml(transaction.id)} · ${escapeHtml(transaction.merchant)}</strong><small>${escapeHtml(suggestion.reason)}</small></div><b>${suggestion.confidence}%</b></li>`).join('');

  return `
    <p><strong>I reviewed the unresolved bank feed against outstanding invoices.</strong></p>
    <div class="agent-summary"><div><span>Confident</span><strong>${analysis.confident.length}</strong></div><div><span>Exceptions</span><strong>${analysis.exceptions.length}</strong></div><div><span>Auto-approved</span><strong>0</strong></div></div>
    ${confident ? `<h4>Ready to prepare</h4><ul class="agent-result-list">${confident}</ul>` : ''}
    ${exceptions ? `<h4>Needs human judgement</h4><ul class="agent-result-list">${exceptions}</ul>` : ''}
    <p class="agent-conclusion">I can stage a confident match, but I will not complete it without your approval.</p>`;
}

async function runCommand(command, customPrompt = '') {
  if (ui.agentBusy) return;
  const promptText = customPrompt || {
    guided: 'Run the guided reconciliation demo and show me the safety boundary.',
    review: 'Check what needs review and explain the confident matches.',
    prepare: 'Prepare txn_001 against its best invoice match, but do not approve it.',
    exceptions: 'Show me the reconciliation exceptions and explain why they need me.',
    payment: 'Prepare a £1,240 HMRC VAT payment draft with reference VAT Q2. Do not send it.',
  }[command] || 'Review the finance workspace.';

  addUserMessage(promptText);
  ui.agentBusy = true;
  render();
  await new Promise((resolve) => setTimeout(resolve, command === 'guided' ? 850 : 520));

  try {
    if (command === 'guided' || command === 'review') {
      const analysis = getReviewAnalysis();
      logToolInvocation('cherry_get_transactions', { status: 'review', limit: 25 }, `Returned ${analysis.confident.length + analysis.exceptions.length} unresolved transactions.`);
      logToolInvocation('cherry_suggest_reconciliation', { batch: true }, `Found ${analysis.confident.length} confident matches and ${analysis.exceptions.length} exceptions.`);
      addAgentMessage(analysisResponse(analysis), ['cherry_get_transactions', 'cherry_search_invoices', 'cherry_suggest_reconciliation']);

      if (command === 'guided') {
        const current = getTransaction('txn_001');
        if (current?.status === 'needs_review') {
          const suggestion = suggestMatch('txn_001');
          const approval = stageReconciliation('txn_001', suggestion.match.invoiceId);
          logToolInvocation('cherry_stage_reconciliation', { transaction_id: 'txn_001', invoice_id: suggestion.match.invoiceId }, 'Staged a pending reconciliation; human approval required.');
          addAgentMessage(`
            <p><strong>I prepared the safest next action.</strong></p>
            <div class="staged-result">${icon('shield', 18)}<div><span>${escapeHtml(approval.transactionId)} → ${escapeHtml(getInvoice(approval.invoiceId).number)}</span><strong>${money(approval.amount)}</strong><small>Pending approval · no final reconciliation yet</small></div></div>
            <p>Look at the approval queue: only you can complete this decision.</p>`, ['cherry_stage_reconciliation']);
        } else {
          addAgentMessage('<p>The demonstration match has already been staged or approved. Use <strong>Reset demo</strong> to replay the full journey.</p>', []);
        }
      }
    } else if (command === 'prepare') {
      const transaction = getTransaction('txn_001');
      if (transaction.status === 'matched') {
        addAgentMessage('<p><strong>txn_001 is already reconciled.</strong> I did not create a duplicate action. Reset the sandbox to replay it.</p>', ['cherry_suggest_reconciliation']);
      } else {
        const suggestion = suggestMatch('txn_001');
        logToolInvocation('cherry_suggest_reconciliation', { transaction_id: 'txn_001' }, `${suggestion.confidence}% confidence; ready=${suggestion.ready}.`);
        const approval = stageReconciliation('txn_001', suggestion.match.invoiceId);
        logToolInvocation('cherry_stage_reconciliation', { transaction_id: 'txn_001', invoice_id: suggestion.match.invoiceId }, 'Reconciliation staged; human approval required.');
        addAgentMessage(`
          <p><strong>Prepared—not approved.</strong></p>
          <div class="staged-result">${icon('shield', 18)}<div><span>txn_001 → ${escapeHtml(getInvoice(approval.invoiceId).number)}</span><strong>${money(approval.amount)}</strong><small>${suggestion.confidence}% confidence · awaiting the human controller</small></div></div>
          <p>I cannot press the approval button. That capability is intentionally absent from the agent contract.</p>`, ['cherry_suggest_reconciliation', 'cherry_stage_reconciliation']);
      }
    } else if (command === 'exceptions') {
      const analysis = getReviewAnalysis();
      logToolInvocation('cherry_get_exceptions', {}, `${analysis.exceptions.length} exceptions and ${analysis.pendingApprovals.length} pending approvals.`);
      const ambiguous = analysis.exceptions.find(({ suggestion }) => suggestion.ambiguous);
      addAgentMessage(`
        <p><strong>${analysis.exceptions.length} items need human judgement.</strong></p>
        <ul class="agent-result-list">${analysis.exceptions.map(({ transaction, suggestion }) => `<li class="exception"><span>${icon('alert', 14)}</span><div><strong>${escapeHtml(transaction.id)} · ${escapeHtml(transaction.merchant)}</strong><small>${escapeHtml(suggestion.reason)}</small></div><b>${suggestion.confidence}%</b></li>`).join('')}</ul>
        ${ambiguous ? `<div class="message-callout amber"><span>Why I stopped</span> ${escapeHtml(ambiguous.transaction.id)} matches ${ambiguous.suggestion.candidates.length} unpaid invoices for ${money(ambiguous.transaction.amount)}. Choosing one would be guessing.</div>` : ''}`, ['cherry_get_exceptions', 'cherry_suggest_reconciliation']);
      if (ambiguous) ui.selectedTransactionId = ambiguous.transaction.id;
    } else if (command === 'payment') {
      const draft = createPaymentDraft({ payee: 'HMRC VAT', amount: 1240, reference: 'VAT Q2', purpose: 'Quarterly VAT payment' });
      logToolInvocation('cherry_create_payment_draft', { payee: draft.payee, amount: draft.amount, reference: draft.reference }, 'Payment draft created; no money moved.');
      addAgentMessage(`
        <p><strong>Payment draft created with the safety boundary intact.</strong></p>
        <div class="staged-result payment">${icon('card', 18)}<div><span>${escapeHtml(draft.payee)} · ${escapeHtml(draft.reference)}</span><strong>${money(draft.amount)}</strong><small>Draft only · moneyMoved: false</small></div></div>
        <p>There is no WebMCP tool that can authorise or execute this payment.</p>`, ['cherry_create_payment_draft']);
      toast('Payment draft prepared. No money moved.');
    }
  } catch (error) {
    addAgentMessage(`<p><strong>I stopped safely.</strong></p><p>${escapeHtml(error.message)}</p>`, []);
    toast(error.message, 'error');
  } finally {
    ui.agentBusy = false;
    render();
  }
}

function downloadJson(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportAudit() {
  downloadJson(
    `cherry-human-agent-audit-${new Date().toISOString().slice(0, 10)}.json`,
    exportAuditSnapshot(),
  );
  toast('Audit trail exported as JSON.');
}

function exportFinanceReport() {
  const summary = getDashboardSummary();
  const report = {
    generatedAt: new Date().toISOString(),
    environment: 'representative sandbox',
    summary,
    accounts: state.accounts,
    invoices: state.invoices,
    reconciliation: getReviewAnalysis(),
    paymentDrafts: state.paymentDrafts,
    safetyBoundary: {
      paymentExecutionToolExposed: false,
      reconciliationApprovalToolExposed: false,
      humanApprovalRequired: true,
    },
  };
  downloadJson(
    `cherry-finance-report-${new Date().toISOString().slice(0, 10)}.json`,
    report,
  );
  logActivity('Human', 'Exported the Cherry Money finance readiness report.', 'report');
  toast('Finance report exported as JSON.');
}

app.addEventListener('click', async (event) => {
  const commandButton = event.target.closest('[data-command]');
  if (commandButton) {
    if (commandButton.closest('.product-drawer')) ui.selectedInvoiceId = null;
    await runCommand(commandButton.dataset.command);
    return;
  }

  const actionButton = event.target.closest('[data-action]');
  if (actionButton) {
    const action = actionButton.dataset.action;
    if (action === 'toggle-nav') {
      ui.mobileNavOpen = !ui.mobileNavOpen;
      render();
    } else if (action === 'show-tools') {
      ui.showToolRegistry = true;
      render();
    } else if (action === 'close-tools') {
      ui.showToolRegistry = false;
      render();
    } else if (action === 'close-drawer') {
      ui.selectedTransactionId = null;
      render();
    } else if (action === 'close-invoice') {
      ui.selectedInvoiceId = null;
      render();
    } else if (action === 'reset-demo') {
      resetDemo();
      ui.messages = [INITIAL_MESSAGE];
      ui.selectedTransactionId = null;
      ui.selectedInvoiceId = null;
      ui.invoiceFilter = 'all';
      ui.invoiceSearch = '';
      ui.bankSyncAt = new Date().toISOString();
      render();
      toast('Sandbox reset. The full demo is ready to replay.');
    } else if (action === 'export-audit') {
      exportAudit();
    } else if (action === 'export-report') {
      exportFinanceReport();
    } else if (action === 'refresh-connections') {
      ui.bankSyncAt = new Date().toISOString();
      logActivity('Human', 'Refreshed the sandbox bank feed status.', 'sync');
      render();
      toast('Bank feeds refreshed. Both sandbox connections are healthy.');
    }
    return;
  }

  const scrollButton = event.target.closest('[data-scroll]');
  if (scrollButton) {
    event.preventDefault();
    const targetId = scrollButton.dataset.scroll;
    ui.activeSection = targetId;
    ui.mobileNavOpen = false;
    window.history.replaceState(null, '', `#${targetId}`);
    render();
    requestAnimationFrame(() => {
      document.querySelector(`#${CSS.escape(targetId)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return;
  }

  const filterButton = event.target.closest('[data-filter]');
  if (filterButton) {
    ui.filter = filterButton.dataset.filter;
    render();
    return;
  }

  const invoiceFilterButton = event.target.closest('[data-invoice-filter]');
  if (invoiceFilterButton) {
    ui.invoiceFilter = invoiceFilterButton.dataset.invoiceFilter;
    render();
    return;
  }

  const invoiceRow = event.target.closest('[data-open-invoice]');
  if (invoiceRow) {
    ui.selectedInvoiceId = invoiceRow.dataset.openInvoice;
    ui.selectedTransactionId = null;
    render();
    return;
  }

  const row = event.target.closest('[data-open-transaction]');
  if (row) {
    ui.selectedTransactionId = row.dataset.openTransaction;
    ui.selectedInvoiceId = null;
    render();
    return;
  }

  const stageButton = event.target.closest('[data-stage-transaction]');
  if (stageButton) {
    try {
      stageReconciliation(stageButton.dataset.stageTransaction, stageButton.dataset.stageInvoice);
      logToolInvocation('cherry_stage_reconciliation', { transaction_id: stageButton.dataset.stageTransaction, invoice_id: stageButton.dataset.stageInvoice }, 'Reconciliation staged from evidence drawer; human approval required.');
      render();
      toast('Match staged. It is waiting for human approval.');
    } catch (error) {
      toast(error.message, 'error');
    }
    return;
  }

  const approveButton = event.target.closest('[data-approve]');
  if (approveButton) {
    try {
      approveReconciliation(approveButton.dataset.approve);
      render();
      toast('Reconciliation approved by the human controller.');
    } catch (error) {
      toast(error.message, 'error');
    }
  }
});

app.addEventListener('keydown', (event) => {
  const transactionRow = event.target.closest('[data-open-transaction]');
  if (transactionRow && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    ui.selectedTransactionId = transactionRow.dataset.openTransaction;
    ui.selectedInvoiceId = null;
    render();
  }

  const invoiceRow = event.target.closest('[data-open-invoice]');
  if (invoiceRow && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    ui.selectedInvoiceId = invoiceRow.dataset.openInvoice;
    ui.selectedTransactionId = null;
    render();
  }

  if (event.key === 'Escape') {
    if (ui.showToolRegistry) ui.showToolRegistry = false;
    else if (ui.selectedInvoiceId) ui.selectedInvoiceId = null;
    else if (ui.selectedTransactionId) ui.selectedTransactionId = null;
    else if (ui.mobileNavOpen) ui.mobileNavOpen = false;
    render();
  }
});

app.addEventListener('input', (event) => {
  if (event.target.matches('[data-search-transactions]')) {
    const cursor = event.target.selectionStart;
    ui.search = event.target.value;
    render();
    requestAnimationFrame(() => {
      const replacement = document.querySelector('[data-search-transactions]');
      if (replacement) {
        replacement.focus();
        replacement.setSelectionRange(cursor, cursor);
      }
    });
    return;
  }

  if (event.target.matches('[data-search-invoices]')) {
    const cursor = event.target.selectionStart;
    ui.invoiceSearch = event.target.value;
    render();
    requestAnimationFrame(() => {
      const replacement = document.querySelector('[data-search-invoices]');
      if (replacement) {
        replacement.focus();
        replacement.setSelectionRange(cursor, cursor);
      }
    });
  }
});

app.addEventListener('submit', async (event) => {
  if (event.target.id !== 'agent-form') return;
  event.preventDefault();
  const input = event.target.elements.prompt;
  const prompt = input.value.trim();
  if (!prompt) return;
  input.value = '';
  const lower = prompt.toLowerCase();
  const command = /payment|hmrc|draft/.test(lower)
    ? 'payment'
    : /exception|ambiguous|uncertain|attention/.test(lower)
      ? 'exceptions'
      : /prepare|stage|txn_001|reconcile/.test(lower)
        ? 'prepare'
        : 'review';
  await runCommand(command, prompt);
});

window.addEventListener('hashchange', () => {
  const next = window.location.hash.replace('#', '');
  if (!sectionIds.has(next)) return;
  ui.activeSection = next;
  render();
  requestAnimationFrame(() => {
    document.querySelector(`#${CSS.escape(next)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

subscribe(() => {
  // WebMCP calls can mutate state outside normal DOM events.
});

render();

try {
  runtime.webMcpStatus = await registerCherryWebMCP({ onChange: render });
} catch (error) {
  runtime.webMcpStatus = {
    supported: false,
    toolCount: 0,
    message: `WebMCP registration failed safely: ${error.message}`,
  };
}
render();
