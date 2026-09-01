import { ui, runtime } from './context.js';
import {
  state,
  getDashboardSummary,
  getInvoice,
  suggestMatch,
} from './store.js';
import {
  escapeHtml,
  formatDate,
  formatTime,
  icon,
  money,
} from './ui.js';

const todayIso = () => new Date().toISOString().slice(0, 10);

function invoiceState(invoice) {
  if (invoice.status === 'paid') return 'paid';
  if (invoice.dueDate < todayIso()) return 'overdue';
  return 'outstanding';
}

function invoiceStateLabel(invoice) {
  const status = invoiceState(invoice);
  return status === 'paid' ? 'Paid' : status === 'overdue' ? 'Overdue' : 'Outstanding';
}

function filteredInvoices() {
  const query = ui.invoiceSearch.trim().toLowerCase();
  return state.invoices.filter((invoice) => {
    const status = invoiceState(invoice);
    const filterMatches = ui.invoiceFilter === 'all'
      || ui.invoiceFilter === status
      || (ui.invoiceFilter === 'outstanding' && status !== 'paid');
    const searchMatches = !query
      || `${invoice.number} ${invoice.customer}`.toLowerCase().includes(query);
    return filterMatches && searchMatches;
  });
}

function renderInvoiceRows() {
  const invoices = filteredInvoices();
  if (!invoices.length) {
    return '<tr><td colspan="6"><div class="product-empty-row">No invoices match this view.</div></td></tr>';
  }

  return invoices.map((invoice) => {
    const status = invoiceState(invoice);
    const dueText = status === 'paid'
      ? 'Settled'
      : `Due ${formatDate(invoice.dueDate)}`;
    return `
      <tr class="product-row" data-open-invoice="${escapeHtml(invoice.id)}" tabindex="0">
        <td><span class="invoice-number">${escapeHtml(invoice.number)}</span><small>${escapeHtml(invoice.id)}</small></td>
        <td><div class="customer-cell"><span>${escapeHtml(invoice.customer.slice(0, 1))}</span><div><strong>${escapeHtml(invoice.customer)}</strong><small>${dueText}</small></div></div></td>
        <td>${money(invoice.total)}</td>
        <td class="${invoice.outstanding ? 'outstanding-money' : 'settled-money'}">${money(invoice.outstanding)}</td>
        <td><span class="invoice-status ${status}">${invoiceStateLabel(invoice)}</span></td>
        <td><button class="row-open" aria-label="Open ${escapeHtml(invoice.number)}">${icon('arrow', 16)}</button></td>
      </tr>`;
  }).join('');
}

export function renderInvoicesProduct() {
  const unpaid = state.invoices.filter((invoice) => invoice.status === 'unpaid');
  const paid = state.invoices.filter((invoice) => invoice.status === 'paid');
  const overdue = unpaid.filter((invoice) => invoice.dueDate < todayIso());
  const outstandingTotal = unpaid.reduce((sum, invoice) => sum + Number(invoice.outstanding), 0);
  const collectedTotal = paid.reduce((sum, invoice) => sum + Number(invoice.total), 0);
  const filters = [
    ['all', 'All invoices'],
    ['outstanding', 'Outstanding'],
    ['overdue', 'Overdue'],
    ['paid', 'Paid'],
  ];

  return `
    <section class="panel product-panel invoices-product" id="invoices">
      <div class="product-heading">
        <div>
          <span class="eyebrow">Cherry Money product</span>
          <h2>${icon('invoice', 22)} Invoices</h2>
          <p>Track what is due, inspect payment evidence and let Cherry connect receipts to the right invoice.</p>
        </div>
        <button class="button product-primary" data-command="review">${icon('sparkles', 17)} Match incoming payments</button>
      </div>

      <div class="product-stat-grid">
        <article><span>Outstanding</span><strong>${money(outstandingTotal)}</strong><small>${unpaid.length} unpaid invoices</small></article>
        <article><span>Overdue</span><strong>${overdue.length}</strong><small>${overdue.length ? 'Needs attention' : 'All on time'}</small></article>
        <article><span>Collected</span><strong>${money(collectedTotal)}</strong><small>Paid in this sandbox</small></article>
      </div>

      <div class="product-toolbar">
        <div class="product-tabs">${filters.map(([value, label]) => `<button class="${ui.invoiceFilter === value ? 'active' : ''}" data-invoice-filter="${value}">${label}</button>`).join('')}</div>
        <label class="product-search">${icon('search', 17)}<input data-search-invoices value="${escapeHtml(ui.invoiceSearch)}" placeholder="Search invoices" aria-label="Search invoices" /></label>
      </div>

      <div class="product-table-wrap">
        <table class="product-table invoice-table">
          <thead><tr><th>Invoice</th><th>Customer</th><th>Total</th><th>Outstanding</th><th>Status</th><th></th></tr></thead>
          <tbody>${renderInvoiceRows()}</tbody>
        </table>
      </div>
      <div class="product-footer"><span>${icon('lock', 15)} ${runtime.live.connected ? 'Authenticated Cherry Money production data' : 'Representative invoice data only'}</span><span>Click any invoice to inspect its matching evidence</span></div>
    </section>`;
}

function renderPaymentDrafts() {
  if (!state.paymentDrafts.length) {
    return `
      <div class="product-zero-state">
        <span>${icon('card', 26)}</span>
        <div><strong>No payment drafts yet</strong><p>Ask Cherry to prepare an HMRC VAT draft. The agent can populate it, but cannot send it.</p></div>
        <button class="button product-primary" data-command="payment">Create safe demo draft</button>
      </div>`;
  }

  return state.paymentDrafts.map((draft) => `
    <article class="payment-product-row">
      <span class="payment-product-icon">${icon('bank', 20)}</span>
      <div><strong>${escapeHtml(draft.payee)}</strong><small>${escapeHtml(draft.purpose || 'Payment draft')} · ${escapeHtml(draft.reference || 'No reference')}</small></div>
      <b>${money(draft.amount)}</b>
      <span class="invoice-status draft">Draft only</span>
      <span class="payment-proof">${icon('shield', 15)} moneyMoved: false</span>
    </article>`).join('');
}

export function renderPaymentsProduct() {
  return `
    <section class="panel product-panel payments-product" id="payments">
      <div class="product-heading">
        <div>
          <span class="eyebrow">Cherry Money product</span>
          <h2>${icon('card', 22)} Payments</h2>
          <p>Prepare payment instructions without exposing an agent capability that can authorise or execute money movement.</p>
        </div>
        <button class="button product-primary" data-command="payment">${icon('sparkles', 17)} Draft HMRC payment</button>
      </div>

      <div class="payment-policy-strip">
        <div><span>${icon('search', 18)}</span><strong>Inspect</strong><small>Read finance context</small></div>
        ${icon('arrow', 18)}
        <div><span>${icon('sparkles', 18)}</span><strong>Prepare</strong><small>Create visible draft</small></div>
        ${icon('arrow', 18)}
        <div class="human-step"><span>${icon('shield', 18)}</span><strong>Authorise</strong><small>Human-controlled process</small></div>
      </div>

      <div class="payment-product-list">${renderPaymentDrafts()}</div>
      <div class="payment-hard-stop">${icon('lock', 18)} <div><strong>Execution endpoint intentionally absent</strong><span>No WebMCP tool in this application can approve, authorise or send a payment.</span></div></div>
    </section>`;
}

export function renderConnectionsProduct() {
  const refreshedAt = ui.bankSyncAt || new Date().toISOString();
  return `
    <section class="panel product-panel connections-product" id="connections">
      <div class="product-heading">
        <div>
          <span class="eyebrow">Cherry Money product</span>
          <h2>${icon('link', 22)} Bank connections</h2>
          <p>See exactly which sandbox accounts are available to the human interface and the page-scoped agent tools.</p>
        </div>
        <button class="button product-secondary" data-action="refresh-connections">${icon('reset', 17)} Refresh feeds</button>
      </div>

      <div class="connection-health">
        <span class="connection-health-icon">${icon('check', 22)}</span>
        <div><strong>All sandbox feeds healthy</strong><small>Last checked ${formatTime(refreshedAt)} · read-only Open Banking representation</small></div>
        <span class="connection-live"><i></i> Connected</span>
      </div>

      <div class="account-product-grid">
        ${state.accounts.map((account) => `
          <article class="account-product-card">
            <div class="account-product-head"><span>${icon('bank', 21)}</span><span class="connection-live"><i></i> Connected</span></div>
            <strong>${escapeHtml(account.name)}</strong>
            <small>${escapeHtml(account.sortCodeMasked)} · ${escapeHtml(account.provider)}</small>
            <dl><div><dt>Balance</dt><dd>${money(account.balance)}</dd></div><div><dt>Available</dt><dd>${money(account.available)}</dd></div></dl>
            <div class="account-scope">${icon('shield', 15)} Visible to read-only WebMCP account tools</div>
          </article>`).join('')}
        <article class="connection-add-card">
          <span>${icon('link', 25)}</span><strong>Connect another bank</strong><p>Disabled in the public challenge sandbox so no banking credentials are requested.</p><button disabled>Sandbox protected</button>
        </article>
      </div>
    </section>`;
}

function percentage(value, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

export function renderReportsProduct() {
  const summary = getDashboardSummary();
  const outstanding = state.invoices.reduce((sum, invoice) => sum + Number(invoice.outstanding), 0);
  const overdue = state.invoices
    .filter((invoice) => invoice.status === 'unpaid' && invoice.dueDate < todayIso())
    .reduce((sum, invoice) => sum + Number(invoice.outstanding), 0);
  const dueSoon = Math.max(0, outstanding - overdue);
  const paidTotal = state.invoices
    .filter((invoice) => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.total, 0);
  const totalTransactions = state.transactions.length;
  const readiness = percentage(summary.confidentCount, summary.reviewCount);
  const reconciled = percentage(summary.matchedCount, totalTransactions);

  return `
    <section class="panel product-panel reports-product" id="reports">
      <div class="product-heading">
        <div>
          <span class="eyebrow">Cherry Money product</span>
          <h2>${icon('chart', 22)} Reports</h2>
          <p>Translate shared finance state into a concise cash, invoice and reconciliation readiness report.</p>
        </div>
        <div class="product-heading-actions">
          <button class="button product-secondary" data-command="review">${icon('sparkles', 17)} Analyse with Cherry</button>
          <button class="button product-primary" data-action="export-report">${icon('download', 17)} Export report</button>
        </div>
      </div>

      <div class="report-highlight-grid">
        <article><span>Available cash</span><strong>${money(summary.availableBalance)}</strong><small>Across ${state.accounts.length} connected ${runtime.live.connected ? 'production' : 'sandbox'} accounts</small></article>
        <article><span>Invoice exposure</span><strong>${money(outstanding)}</strong><small>${money(overdue)} is overdue</small></article>
        <article><span>Agent readiness</span><strong>${readiness}%</strong><small>${summary.confidentCount} of ${summary.reviewCount} unresolved items are safe to prepare</small></article>
      </div>

      <div class="report-grid">
        <article class="report-card">
          <div class="report-card-head"><div><span class="eyebrow">Receivables</span><h3>Invoice ageing</h3></div><b>${money(outstanding)}</b></div>
          <div class="report-bars">
            <div><span>Overdue</span><i><em class="overdue" style="--bar:${percentage(overdue, outstanding)}%"></em></i><b>${money(overdue)}</b></div>
            <div><span>Due soon</span><i><em class="soon-bar" style="--bar:${percentage(dueSoon, outstanding)}%"></em></i><b>${money(dueSoon)}</b></div>
            <div><span>Paid</span><i><em class="paid" style="--bar:${percentage(paidTotal, outstanding + paidTotal)}%"></em></i><b>${state.invoices.filter((invoice) => invoice.status === 'paid').length}</b></div>
          </div>
        </article>

        <article class="report-card">
          <div class="report-card-head"><div><span class="eyebrow">Reconciliation</span><h3>Control readiness</h3></div><b>${reconciled}%</b></div>
          <div class="readiness-ring" style="--progress:${reconciled * 3.6}deg"><span><strong>${summary.matchedCount}</strong><small>matched</small></span></div>
          <ul class="report-checks">
            <li>${icon('check', 15)} ${summary.confidentCount} confident matches identified</li>
            <li>${icon('alert', 15)} ${summary.exceptionCount} exceptions need judgement</li>
            <li>${icon('shield', 15)} ${summary.pendingCount} human approvals pending</li>
          </ul>
        </article>

        <article class="report-card report-narrative">
          <div class="report-card-head"><div><span class="eyebrow">Agent summary</span><h3>What matters now</h3></div>${icon('sparkles', 20)}</div>
          <p>Cherry can prepare the high-confidence receipt matches, surface the ambiguous £680 payment and keep the final accounting decision in the approval queue.</p>
          <button data-command="review">Ask Cherry for the evidence ${icon('arrow', 15)}</button>
        </article>
      </div>
    </section>`;
}

export function renderProductSuite() {
  return `
    <section class="product-suite-intro">
      <span class="eyebrow">Connected product surface</span>
      <h2>The Cherry Money links now open real, shared-state workflows.</h2>
      <p>${runtime.live.connected ? 'Invoices, payments, bank connections and reports are hydrated from the authenticated Cherry Money backend and share that state with the WebMCP tools.' : 'Invoices, payments, bank connections and reports all use the same representative finance state as the WebMCP tools.'}</p>
    </section>
    ${renderInvoicesProduct()}
    ${renderPaymentsProduct()}
    ${renderConnectionsProduct()}
    ${renderReportsProduct()}`;
}

export function renderInvoiceDrawer() {
  if (!ui.selectedInvoiceId) return '';
  const invoice = getInvoice(ui.selectedInvoiceId);
  if (!invoice) return '';

  const related = state.transactions.flatMap((transaction) => {
    const approval = state.approvals.find((item) => item.transactionId === transaction.id && item.invoiceId === invoice.id);
    if (approval) {
      return [{ transaction, confidence: approval.status === 'approved' ? 100 : 94, label: approval.status === 'approved' ? 'Approved match' : 'Pending approval' }];
    }
    if (transaction.status !== 'needs_review') return [];
    const suggestion = suggestMatch(transaction.id);
    const candidate = suggestion.candidates?.find((item) => item.invoiceId === invoice.id);
    return candidate ? [{ transaction, confidence: suggestion.confidence, label: suggestion.ambiguous ? 'Possible match' : 'Suggested match' }] : [];
  });
  const status = invoiceState(invoice);

  return `
    <button class="drawer-scrim" data-action="close-invoice" aria-label="Close invoice details"></button>
    <aside class="drawer product-drawer" aria-label="Invoice details">
      <div class="drawer-head"><div><span class="eyebrow">Invoice workspace</span><h2>${escapeHtml(invoice.number)}</h2></div><button class="icon-button" data-action="close-invoice" aria-label="Close">${icon('close', 20)}</button></div>
      <div class="invoice-drawer-hero">
        <span>${icon('invoice', 23)}</span>
        <div><strong>${escapeHtml(invoice.customer)}</strong><small>Due ${formatDate(invoice.dueDate, { day: 'numeric', month: 'long', year: 'numeric' })}</small></div>
        <b>${money(invoice.total)}</b>
      </div>
      <div class="invoice-drawer-stats">
        <div><span>Status</span><strong class="invoice-status ${status}">${invoiceStateLabel(invoice)}</strong></div>
        <div><span>Outstanding</span><strong>${money(invoice.outstanding)}</strong></div>
      </div>
      <section class="drawer-section">
        <h3>Bank evidence</h3>
        ${related.length ? `<div class="invoice-evidence-list">${related.map(({ transaction, confidence, label }) => `
          <article><span class="merchant-logo ${transaction.direction}">${escapeHtml(transaction.merchant.slice(0, 1))}</span><div><strong>${escapeHtml(transaction.id)} · ${escapeHtml(transaction.merchant)}</strong><small>${escapeHtml(transaction.description)}</small></div><b>${confidence}%<small>${label}</small></b></article>`).join('')}</div>` : '<div class="invoice-no-evidence">No matching bank evidence has been identified yet.</div>'}
      </section>
      ${invoice.status === 'unpaid' ? `<button class="button product-primary full" data-command="review">${icon('sparkles', 17)} Ask Cherry to analyse receipts</button>` : ''}
      <div class="drawer-safety">${icon('shield', 17)} Invoice state changes only after an explicit human-approved reconciliation.</div>
    </aside>`;
}
