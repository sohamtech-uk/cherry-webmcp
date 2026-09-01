import './styles.css';
import { state, suggestMatch, approveReconciliation } from './store.js';
import { registerCherryWebMCP } from './webmcp.js';

let webMcpStatus = {
  supported: null,
  toolCount: 0,
  message: 'Checking browser WebMCP support…',
};

const money = (value) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function statusLabel(status) {
  return {
    needs_review: 'Needs review',
    pending_approval: 'Pending approval',
    matched: 'Matched',
    ignored: 'Ignored',
  }[status] || status;
}

function renderTransactions() {
  return state.transactions.map((transaction) => {
    const suggestion = transaction.status === 'needs_review' ? suggestMatch(transaction.id) : null;
    const match = suggestion?.match
      ? `${escapeHtml(suggestion.match.invoiceNumber)} · ${suggestion.confidence}%`
      : suggestion
        ? `${suggestion.confidence}% · review`
        : '—';

    return `
      <tr>
        <td><strong>${escapeHtml(transaction.merchant)}</strong><span>${escapeHtml(transaction.description)}</span></td>
        <td>${escapeHtml(transaction.bookingDate)}</td>
        <td class="amount ${transaction.direction}">${transaction.direction === 'debit' ? '−' : '+'}${money(transaction.amount)}</td>
        <td>${match}</td>
        <td><span class="status ${escapeHtml(transaction.status)}">${escapeHtml(statusLabel(transaction.status))}</span></td>
      </tr>`;
  }).join('');
}

function renderApprovals() {
  const pending = state.approvals.filter((approval) => approval.status === 'pending');
  if (!pending.length) {
    return '<div class="empty-state">No staged reconciliations. Ask your agent to prepare a confident match.</div>';
  }

  return pending.map((approval) => {
    const transaction = state.transactions.find((item) => item.id === approval.transactionId);
    const invoice = state.invoices.find((item) => item.id === approval.invoiceId);
    return `
      <article class="approval-card">
        <div>
          <span class="eyebrow">Human decision required</span>
          <h3>${escapeHtml(transaction?.merchant)} → ${escapeHtml(invoice?.number)}</h3>
          <p>${money(approval.amount)} · Prepared by the agent, not yet reconciled.</p>
        </div>
        <button class="primary" data-approve="${escapeHtml(approval.id)}">Approve reconciliation</button>
      </article>`;
  }).join('');
}

function renderPaymentDrafts() {
  if (!state.paymentDrafts.length) {
    return '<div class="empty-state">No payment drafts. Agents may prepare drafts, but this demo exposes no payment-execution tool.</div>';
  }
  return state.paymentDrafts.map((draft) => `
    <article class="draft-card">
      <div><strong>${escapeHtml(draft.payee)}</strong><span>${escapeHtml(draft.reference || 'No reference')}</span></div>
      <div><strong>${money(draft.amount)}</strong><span>Draft only · no money moved</span></div>
    </article>`).join('');
}

function renderActivity() {
  return state.activity.slice(0, 8).map((event) => `
    <li><span>${escapeHtml(event.actor)}</span><p>${escapeHtml(event.message)}</p></li>`).join('');
}

function render() {
  const reviewCount = state.transactions.filter((item) => item.status === 'needs_review').length;
  const matchedCount = state.transactions.filter((item) => item.status === 'matched').length;
  const pendingCount = state.approvals.filter((item) => item.status === 'pending').length;
  const totalBalance = state.accounts.reduce((sum, account) => sum + account.balance, 0);
  const supportClass = webMcpStatus.supported === true ? 'ready' : webMcpStatus.supported === false ? 'unsupported' : 'checking';

  document.querySelector('#app').innerHTML = `
    <header class="topbar">
      <a class="brand" href="#" aria-label="Cherry Money home">
        <span class="brand-mark">C</span>
        <span>Cherry Money</span>
      </a>
      <div class="header-actions">
        <span class="webmcp-pill ${supportClass}"><i></i>${escapeHtml(webMcpStatus.message)}</span>
        <a class="ghost-link" href="https://github.com/sohamtech-uk/cherry-webmcp" target="_blank" rel="noreferrer">Source ↗</a>
      </div>
    </header>

    <main>
      <section class="hero">
        <div>
          <span class="eyebrow">OpenAI WebMCP Challenge · 2026</span>
          <h1>Finance software designed for <em>humans and their agents.</em></h1>
          <p>Let an agent inspect bank feeds, find invoice matches and prepare reconciliation. Keep consequential financial decisions behind explicit human approval.</p>
        </div>
        <div class="safety-card">
          <span class="shield">✓</span>
          <div>
            <strong>Human approval boundary</strong>
            <p>Agents can prepare. They cannot silently approve reconciliation or execute a payment.</p>
          </div>
        </div>
      </section>

      <section class="metrics" aria-label="Finance summary">
        <article><span>Total bank balance</span><strong>${money(totalBalance)}</strong><small>Across ${state.accounts.length} sandbox accounts</small></article>
        <article><span>Needs review</span><strong>${reviewCount}</strong><small>Agent can analyse these</small></article>
        <article><span>Matched</span><strong>${matchedCount}</strong><small>Reconciled transactions</small></article>
        <article><span>Awaiting you</span><strong>${pendingCount}</strong><small>Explicit approval required</small></article>
      </section>

      <section class="agent-panel">
        <div>
          <span class="eyebrow">Try in ChatGPT's in-app browser</span>
          <h2>Ask the page through WebMCP</h2>
        </div>
        <div class="prompt-grid">
          <button data-copy="Check the bank transactions that need review and tell me which ones can be confidently matched.">“Check what needs review.”</button>
          <button data-copy="Find the best invoice match for txn_001 and explain the confidence.">“Match txn_001.”</button>
          <button data-copy="Prepare the confident invoice reconciliation for txn_001, but do not approve it for me.">“Prepare the match.”</button>
          <button data-copy="Show me reconciliation exceptions that need my attention.">“Show exceptions.”</button>
        </div>
        <p id="copy-feedback" class="copy-feedback" aria-live="polite"></p>
      </section>

      <section class="content-card">
        <div class="section-heading">
          <div><span class="eyebrow">Live sandbox</span><h2>Bank transactions</h2></div>
          <span class="hint">Representative demo data · no real customer information</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Transaction</th><th>Date</th><th>Amount</th><th>Agent suggestion</th><th>Status</th></tr></thead>
            <tbody>${renderTransactions()}</tbody>
          </table>
        </div>
      </section>

      <section class="two-column">
        <div class="content-card">
          <div class="section-heading"><div><span class="eyebrow">Approval queue</span><h2>Your decision</h2></div></div>
          <div class="approval-list">${renderApprovals()}</div>
        </div>
        <div class="content-card">
          <div class="section-heading"><div><span class="eyebrow">Payment safety</span><h2>Drafts only</h2></div></div>
          <div class="draft-list">${renderPaymentDrafts()}</div>
        </div>
      </section>

      <section class="content-card audit-card">
        <div class="section-heading"><div><span class="eyebrow">Audit trail</span><h2>Human + agent activity</h2></div></div>
        <ul class="activity-list">${renderActivity()}</ul>
      </section>
    </main>

    <footer>
      <strong>Cherry Agent-Native Finance</strong>
      <span>WebMCP challenge build · Actions in this sandbox are illustrative and do not move real money.</span>
    </footer>
  `;
}

document.addEventListener('click', async (event) => {
  const approveButton = event.target.closest('[data-approve]');
  if (approveButton) {
    try {
      approveReconciliation(approveButton.dataset.approve);
      render();
    } catch (error) {
      window.alert(error.message);
    }
    return;
  }

  const copyButton = event.target.closest('[data-copy]');
  if (copyButton) {
    const text = copyButton.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
      const feedback = document.querySelector('#copy-feedback');
      if (feedback) feedback.textContent = `Copied: ${text}`;
    } catch {
      const feedback = document.querySelector('#copy-feedback');
      if (feedback) feedback.textContent = text;
    }
  }
});

render();

try {
  webMcpStatus = await registerCherryWebMCP({ onChange: render });
} catch (error) {
  webMcpStatus = {
    supported: false,
    toolCount: 0,
    message: `WebMCP registration failed: ${error.message}`,
  };
}

render();
