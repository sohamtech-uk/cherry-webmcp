import { ui, runtime } from './context.js';
import { state, getInvoice, getTransaction, suggestMatch } from './store.js';
import { TOOL_CATALOG } from './webmcp.js';
import { escapeHtml, formatDate, formatTime, icon, money, statusLabel } from './ui.js';

function transactionRows() {
  const query = ui.search.trim().toLowerCase();
  const filtered = state.transactions.filter((transaction) => {
    const matchesFilter = ui.filter === 'all'
      || (ui.filter === 'review' && transaction.status === 'needs_review')
      || (ui.filter === 'ready' && transaction.status === 'needs_review' && suggestMatch(transaction.id).ready)
      || (ui.filter === 'exceptions' && transaction.status === 'needs_review' && !suggestMatch(transaction.id).ready)
      || transaction.status === ui.filter;
    const matchesSearch = !query || `${transaction.id} ${transaction.merchant} ${transaction.description}`.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  if (!filtered.length) {
    return `<tr><td colspan="7"><div class="table-empty">No transactions match this view.</div></td></tr>`;
  }

  return filtered.map((transaction) => {
    const suggestion = transaction.status === 'needs_review' ? suggestMatch(transaction.id) : null;
    const confidence = suggestion?.confidence;
    const suggestionText = suggestion?.match
      ? `${suggestion.match.invoiceNumber}<small>${suggestion.match.customer}</small>`
      : suggestion?.suggestedCategory
        ? `${suggestion.suggestedCategory}<small>Expense review</small>`
        : '—';
    const directionSign = transaction.direction === 'debit' ? '−' : '+';

    return `
      <tr class="transaction-row ${transaction.id === ui.selectedTransactionId ? 'selected' : ''}" data-open-transaction="${transaction.id}" tabindex="0">
        <td><span class="transaction-id">${escapeHtml(transaction.id)}</span><small>${formatDate(transaction.bookingDate)}</small></td>
        <td><div class="merchant-cell"><span class="merchant-logo ${transaction.direction}">${escapeHtml(transaction.merchant.slice(0, 1))}</span><div><strong>${escapeHtml(transaction.merchant)}</strong><small>${escapeHtml(transaction.description)}</small></div></div></td>
        <td><span class="direction ${transaction.direction}">${transaction.direction}</span></td>
        <td class="amount ${transaction.direction}">${directionSign}${money(transaction.amount)}</td>
        <td class="suggested-match">${suggestionText}</td>
        <td>${confidence !== undefined ? `<div class="confidence"><span><b>${confidence}%</b><small>${suggestion.ready ? 'Confident' : suggestion.ambiguous ? 'Ambiguous' : 'Review'}</small></span><i><em style="--score:${confidence}%"></em></i></div>` : '<span class="muted-dash">—</span>'}</td>
        <td><span class="status ${transaction.status}">${statusLabel(transaction.status)}</span></td>
      </tr>`;
  }).join('');
}

export function renderTransactions() {
  const filters = [
    ['all', 'All'],
    ['review', 'Needs review'],
    ['ready', 'Agent-ready'],
    ['exceptions', 'Exceptions'],
    ['matched', 'Matched'],
  ];
  return `
    <section class="panel transactions-panel" id="transactions">
      <div class="panel-header transactions-head">
        <div><span class="eyebrow">Explainable reconciliation</span><h2>${icon('transactions', 21)} Bank transactions</h2></div>
        <div class="table-actions">
          <label class="search-box">${icon('search', 16)}<input data-search-transactions value="${escapeHtml(ui.search)}" placeholder="Search transactions" aria-label="Search transactions" /></label>
          <button class="icon-button" data-action="export-audit" title="Export audit JSON">${icon('download', 18)}</button>
        </div>
      </div>
      <div class="filter-bar">
        <div class="filter-chips">${filters.map(([value, label]) => `<button class="${ui.filter === value ? 'active' : ''}" data-filter="${value}">${label}</button>`).join('')}</div>
        <span>${state.transactions.length} representative transactions · click a row for evidence</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID / date</th><th>Merchant / reference</th><th>Flow</th><th>Amount</th><th>Agent suggestion</th><th>Confidence</th><th>Status</th></tr></thead>
          <tbody>${transactionRows()}</tbody>
        </table>
      </div>
      <div class="table-footer"><span>${icon('lock', 14)} Representative data only · no bank credentials</span><button data-command="review">Analyse this queue with Cherry ${icon('arrow', 14)}</button></div>
    </section>`;
}

function renderActivity() {
  const items = state.activity.slice(0, 6);
  return `
    <section class="panel audit-panel" id="audit">
      <div class="panel-header compact">
        <div><span class="eyebrow">Accountability</span><h2>${icon('audit', 20)} Human + agent audit trail</h2></div>
        <button class="text-button" data-action="export-audit">Export JSON ${icon('download', 14)}</button>
      </div>
      <div class="timeline">
        ${items.map((event) => `
          <article>
            <span class="timeline-icon ${event.kind}">${icon(event.actor === 'Human' ? 'shield' : event.actor === 'Agent' ? 'agent' : 'check', 16)}</span>
            <div><strong>${escapeHtml(event.actor)}</strong><p>${escapeHtml(event.message)}</p><small>${formatTime(event.at)}</small></div>
          </article>`).join('')}
      </div>
    </section>`;
}

function renderToolActivity() {
  const calls = state.toolActivity.slice(0, 6);
  return `
    <section class="panel tool-activity">
      <div class="panel-header compact">
        <div><span class="eyebrow">Observability</span><h2>${icon('agent', 20)} Tool invocation log</h2></div>
        <span class="live-label"><i></i> Live</span>
      </div>
      ${calls.length ? `<div class="tool-log">${calls.map((call) => `
        <article><span class="tool-status ${call.status}">${icon('check', 15)}</span><div><strong>${escapeHtml(call.toolName)}</strong><p>${escapeHtml(call.summary)}</p></div><small>${formatTime(call.at)}</small></article>`).join('')}</div>` : `
        <div class="empty-state tool-empty"><span>${icon('agent', 24)}</span><strong>No tool calls yet</strong><p>Run the guided demo to watch the same contracts an agent uses.</p><button data-command="guided">Start guided demo ${icon('arrow', 14)}</button></div>`}
    </section>`;
}

function renderDecisionFlow() {
  return `
    <section class="panel decision-flow">
      <div class="panel-header compact"><div><span class="eyebrow">Why this is agent-native</span><h2>${icon('rules', 20)} One workflow, two interfaces</h2></div></div>
      <p>The human UI and WebMCP tools operate on the same state. There is no shadow automation layer to drift out of sync.</p>
      <div class="flow-diagram">
        <div><span>${icon('transactions', 18)}</span><strong>Observe</strong><small>Bank feed + invoices</small></div>${icon('arrow', 17)}
        <div><span>${icon('sparkles', 18)}</span><strong>Reason</strong><small>Confidence + evidence</small></div>${icon('arrow', 17)}
        <div><span>${icon('reconcile', 18)}</span><strong>Prepare</strong><small>Pending action</small></div>${icon('arrow', 17)}
        <div class="human"><span>${icon('shield', 18)}</span><strong>Approve</strong><small>Human judgement</small></div>
      </div>
      <div class="architecture-note"><code>document.modelContext.registerTool()</code><span>7 narrowly scoped capabilities</span></div>
    </section>`;
}

export function renderBottomGrid() {
  return `<section class="bottom-grid">${renderActivity()}${renderToolActivity()}${renderDecisionFlow()}</section>`;
}

export function renderTransactionDrawer() {
  if (!ui.selectedTransactionId) return '';
  const transaction = getTransaction(ui.selectedTransactionId);
  if (!transaction) return '';
  const suggestion = transaction.status === 'needs_review' ? suggestMatch(transaction.id) : null;
  const pending = state.approvals.find((approval) => approval.transactionId === transaction.id && approval.status === 'pending');

  return `
    <button class="drawer-scrim" data-action="close-drawer" aria-label="Close transaction details"></button>
    <aside class="drawer" aria-label="Transaction evidence">
      <div class="drawer-head"><div><span class="eyebrow">Evidence review</span><h2>${escapeHtml(transaction.id)}</h2></div><button class="icon-button" data-action="close-drawer" aria-label="Close">${icon('close', 20)}</button></div>
      <div class="drawer-transaction">
        <span class="merchant-logo ${transaction.direction}">${escapeHtml(transaction.merchant.slice(0, 1))}</span>
        <div><strong>${escapeHtml(transaction.merchant)}</strong><small>${escapeHtml(transaction.description)} · ${formatDate(transaction.bookingDate, { day: 'numeric', month: 'long', year: 'numeric' })}</small></div>
        <b class="amount ${transaction.direction}">${transaction.direction === 'debit' ? '−' : '+'}${money(transaction.amount)}</b>
      </div>
      ${suggestion ? `
        <section class="drawer-section">
          <div class="confidence-hero ${suggestion.ready ? 'ready' : 'review'}">
            <span><strong>${suggestion.confidence}%</strong><small>${suggestion.ready ? 'Ready to stage' : suggestion.ambiguous ? 'Ambiguous' : 'Human review'}</small></span>
            <div><i><em style="--score:${suggestion.confidence}%"></em></i><p>${escapeHtml(suggestion.reason)}</p></div>
          </div>
        </section>
        <section class="drawer-section">
          <h3>Evidence signals</h3>
          <div class="signal-list">${suggestion.signals.map((signal) => `<span>${icon('check', 14)}${escapeHtml(signal)}</span>`).join('')}</div>
        </section>
        ${suggestion.candidates?.length ? `
          <section class="drawer-section"><h3>${suggestion.ambiguous ? 'Possible matches' : 'Proposed invoice'}</h3><div class="candidate-list">
            ${suggestion.candidates.map((candidate) => `<article class="candidate ${suggestion.match?.invoiceId === candidate.invoiceId ? 'best' : ''}"><span>${icon('invoice', 18)}</span><div><strong>${escapeHtml(candidate.invoiceNumber)}</strong><small>${escapeHtml(candidate.customer)} · due ${formatDate(candidate.dueDate)}</small></div><b>${money(candidate.amount)}</b>${candidate.referenceHit ? '<em>Reference match</em>' : ''}</article>`).join('')}
          </div></section>` : ''}
        ${suggestion.ready && !pending ? `<button class="button primary full drawer-action" data-stage-transaction="${transaction.id}" data-stage-invoice="${suggestion.match.invoiceId}">${icon('sparkles', 17)} Stage this match for approval</button>` : ''}
        ${pending ? `<div class="drawer-pending">${icon('shield', 18)} This match is waiting in the human approval queue.</div>` : ''}
      ` : `<div class="drawer-complete">${icon('check', 24)}<strong>${statusLabel(transaction.status)}</strong><p>This transaction no longer needs agent analysis.</p></div>`}
      <div class="drawer-safety">${icon('lock', 17)} Opening or analysing this record does not change accounting state.</div>
    </aside>`;
}

export function renderToolRegistry() {
  if (!ui.showToolRegistry) return '';
  return `
    <button class="modal-scrim" data-action="close-tools" aria-label="Close tool registry"></button>
    <section class="modal tool-modal" role="dialog" aria-modal="true" aria-labelledby="tool-modal-title">
      <div class="modal-head"><div><span class="eyebrow">Agent contract surface</span><h2 id="tool-modal-title">Seven deliberately narrow WebMCP tools</h2><p>${escapeHtml(runtime.webMcpStatus.message)}</p></div><button class="icon-button" data-action="close-tools" aria-label="Close">${icon('close', 20)}</button></div>
      <div class="tool-grid">
        ${TOOL_CATALOG.map((tool, index) => `
          <article>
            <div class="tool-number">0${index + 1}</div>
            <div class="tool-title"><span>${icon(tool.risk === 'guarded' ? 'shield' : 'agent', 18)}</span><div><strong>${escapeHtml(tool.title)}</strong><code>${escapeHtml(tool.name)}</code></div></div>
            <p>${escapeHtml(tool.description)}</p>
            <div class="tool-tags"><span class="${tool.risk}">${escapeHtml(tool.mode)}</span><span>${tool.risk === 'guarded' ? 'Visible side effect' : 'No state change'}</span></div>
          </article>`).join('')}
      </div>
      <div class="modal-safety">${icon('shield', 19)} <span><strong>Missing on purpose:</strong> approve reconciliation, authorise payment and execute payment. Those capabilities are not agent tools.</span></div>
    </section>`;
}
