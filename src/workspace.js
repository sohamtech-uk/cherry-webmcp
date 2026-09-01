import { ui, runtime } from './context.js';
import { state, getInvoice, getTransaction } from './store.js';
import { escapeHtml, formatTime, icon, money, renderLogo } from './ui.js';

function renderAgentMessages() {
  return ui.messages.map((message) => `
    <article class="chat-message ${message.role}">
      <div class="chat-avatar">${message.role === 'agent' ? renderLogo() : 'You'}</div>
      <div class="chat-bubble">
        <div class="chat-meta"><strong>${message.role === 'agent' ? 'Cherry' : 'Human controller'}</strong><span>${message.time || 'now'}</span></div>
        <div class="chat-body">${message.html ? message.html : `<p>${escapeHtml(message.text)}</p>`}</div>
        ${message.tools?.length ? `<div class="tool-chain">${message.tools.map((tool) => `<span>${icon('agent', 13)}${escapeHtml(tool)}</span>`).join(icon('arrow', 14, 'tool-arrow'))}</div>` : ''}
      </div>
    </article>`).join('');
}

function renderAgentConsole() {
  return `
    <section class="panel agent-console" id="tools">
      <div class="panel-header agent-header">
        <div>
          <span class="eyebrow">Shared human + agent workspace</span>
          <h2>${icon('sparkles', 21)} Ask Cherry through WebMCP</h2>
        </div>
        <span class="secure-pill">${icon('lock', 14)} Scoped to this page</span>
      </div>
      <div class="prompt-row">
        <button data-command="review">Review transactions</button>
        <button data-command="prepare">Prepare txn_001</button>
        <button data-command="exceptions">Explain exceptions</button>
        <button data-command="payment">Draft HMRC payment</button>
      </div>
      <div class="chat-window" id="chat-window">
        ${renderAgentMessages()}
        ${ui.agentBusy ? `<article class="chat-message agent"><div class="chat-avatar">${renderLogo()}</div><div class="chat-bubble typing"><i></i><i></i><i></i><span>Calling scoped finance tools…</span></div></article>` : ''}
      </div>
      <form class="composer" id="agent-form">
        <span>${icon('sparkles', 18)}</span>
        <input name="prompt" maxlength="240" autocomplete="off" placeholder="Ask: what needs review, prepare a match, show exceptions…" aria-label="Ask Cherry" />
        <button type="submit" aria-label="Send prompt">${icon('arrow', 18)}</button>
      </form>
      <div class="console-foot">
        <span><i class="status-light ${runtime.webMcpStatus.supported === true ? 'on' : ''}"></i>${runtime.webMcpStatus.supported === true ? 'Native WebMCP active' : 'Guided fallback uses the identical application functions'}</span>
        <button data-action="show-tools">View tool contracts ${icon('arrow', 14)}</button>
      </div>
    </section>`;
}

function renderSafetyCard() {
  return `
    <article class="panel safety-boundary">
      <div class="panel-header compact">
        <div><span class="eyebrow">Decision architecture</span><h2>${icon('shield', 20)} Safety boundary</h2></div>
        <span class="grade">A</span>
      </div>
      <p>Each capability has one clear permission level. The agent never inherits blanket access.</p>
      <div class="permission-lanes">
        <div><span class="lane-icon read">${icon('search', 16)}</span><strong>Inspect</strong><small>Accounts, transactions, invoices</small><b>Read only</b></div>
        <div><span class="lane-icon prepare">${icon('sparkles', 16)}</span><strong>Prepare</strong><small>Reconciliation and drafts</small><b>Visible state</b></div>
        <div><span class="lane-icon approve">${icon('shield', 16)}</span><strong>Approve</strong><small>Final financial decision</small><b>Human only</b></div>
      </div>
      <div class="no-execution">${icon('lock', 17)} <span><strong>No payment execution tool.</strong> The boundary is enforced by capability design, not just a warning.</span></div>
    </article>`;
}

function renderApprovalQueue() {
  const pending = state.approvals.filter((approval) => approval.status === 'pending');
  return `
    <article class="panel approval-panel ${pending.length ? 'active' : ''}" id="approvals">
      <div class="panel-header compact">
        <div><span class="eyebrow">Human decision</span><h2>${icon('reconcile', 20)} Approval queue</h2></div>
        <span class="count-badge">${pending.length}</span>
      </div>
      ${pending.length ? pending.map((approval) => {
        const transaction = getTransaction(approval.transactionId);
        const invoice = getInvoice(approval.invoiceId);
        return `
          <div class="approval-item">
            <div class="approval-top"><span class="approval-icon">${icon('invoice', 19)}</span><div><strong>${escapeHtml(transaction?.merchant)} → ${escapeHtml(invoice?.number)}</strong><small>${escapeHtml(approval.transactionId)} · staged ${formatTime(approval.createdAt)}</small></div><b>${money(approval.amount)}</b></div>
            <div class="approval-reason">${icon('agent', 15)} Prepared by WebMCP agent. No ledger state has changed yet.</div>
            <button class="button primary full" data-approve="${escapeHtml(approval.id)}">${icon('shield', 17)} Approve reconciliation</button>
            <small class="approval-note">This button has no corresponding agent tool.</small>
          </div>`;
      }).join('') : `
        <div class="empty-state compact-empty">
          <span>${icon('shield', 24)}</span>
          <strong>No staged actions</strong>
          <p>Ask Cherry to prepare txn_001. The proposal will appear here and wait for you.</p>
          <button data-command="prepare">Prepare a safe example ${icon('arrow', 14)}</button>
        </div>`}
    </article>`;
}

function renderPaymentSafety() {
  const draft = state.paymentDrafts[0];
  return `
    <article class="panel payment-panel" id="payment-safety">
      <div class="panel-header compact">
        <div><span class="eyebrow">Money movement</span><h2>${icon('card', 20)} Payment safety</h2></div>
        <span class="draft-pill">Draft only</span>
      </div>
      ${draft ? `
        <div class="payment-draft">
          <div class="draft-heading"><span>${icon('bank', 18)}</span><div><strong>${escapeHtml(draft.payee)}</strong><small>${escapeHtml(draft.purpose || 'Payment draft')}</small></div><b>${money(draft.amount)}</b></div>
          <dl><div><dt>Reference</dt><dd>${escapeHtml(draft.reference || '—')}</dd></div><div><dt>Status</dt><dd><span class="status draft_only">Draft only</span></dd></div></dl>
          <div class="money-safe">${icon('shield', 16)} moneyMoved: <strong>false</strong></div>
        </div>` : `
        <div class="empty-state compact-empty payment-empty">
          <span>${icon('lock', 24)}</span><strong>No payment drafts</strong><p>An agent may prepare a draft, but cannot send it.</p><button data-command="payment">Create demonstration draft ${icon('arrow', 14)}</button>
        </div>`}
    </article>`;
}

export function renderWorkspace() {
  return `
    <section class="workspace-grid">
      ${renderAgentConsole()}
      <aside class="workspace-side">
        ${renderSafetyCard()}
        ${renderApprovalQueue()}
        ${renderPaymentSafety()}
      </aside>
    </section>`;
}
