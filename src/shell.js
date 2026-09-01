import { ui, runtime } from './context.js';
import { escapeHtml, icon, money, renderLogo } from './ui.js';

export function renderSidebar() {
  const navItems = [
    ['overview', 'home', 'Overview'],
    ['transactions', 'transactions', 'Transactions'],
    ['approvals', 'reconcile', 'Approval queue'],
    ['tools', 'agent', 'WebMCP tools'],
    ['audit', 'audit', 'Audit trail'],
  ];
  const productItems = [
    ['invoices', 'invoice', 'Invoices'],
    ['payments', 'card', 'Payments'],
    ['connections', 'link', 'Bank connections'],
    ['reports', 'chart', 'Reports'],
  ];

  const item = ([target, iconName, label], product = false) => `
    <button class="nav-item ${ui.activeSection === target ? 'active' : ''}" data-scroll="${target}" ${ui.activeSection === target ? 'aria-current="page"' : ''}>
      ${icon(iconName, 18)}<span>${label}</span>
      ${product ? '<span class="nav-live">Live</span>' : ''}
    </button>`;

  return `
    <aside class="sidebar ${ui.mobileNavOpen ? 'open' : ''}">
      <div class="sidebar-head">
        <a class="sidebar-brand" href="#overview" data-scroll="overview">
          ${renderLogo()}
          <span><strong>Cherry</strong><small>Agent-Native Finance</small></span>
        </a>
        <button class="icon-button sidebar-close" data-action="toggle-nav" aria-label="Close navigation">${icon('close', 20)}</button>
      </div>

      <div class="workspace-switcher">
        <span class="workspace-avatar">CL</span>
        <span><strong>${escapeHtml(runtime.live.connected ? (runtime.live.company?.name || 'Cherry Money') : 'Cherry Labs Ltd')}</strong><small>${runtime.live.connected ? 'Authenticated production workspace' : 'Representative sandbox workspace'}</small></span>
        ${icon('chevron', 16)}
      </div>

      <nav class="sidebar-nav" aria-label="Primary navigation">
        <span class="nav-label">Agent workspace</span>
        ${navItems.map((entry) => item(entry)).join('')}
        <span class="nav-label product-label">Cherry Money product</span>
        ${productItems.map((entry) => item(entry, true)).join('')}
      </nav>

      <div class="sidebar-trust">
        <span class="trust-icon">${icon('shield', 18)}</span>
        <div><strong>Human-controlled by design</strong><small>Agents prepare. People approve.</small></div>
      </div>
      <a class="sidebar-source" href="https://github.com/sohamtech-uk/cherry-webmcp" target="_blank" rel="noreferrer">
        ${icon('external', 16)} View public source
      </a>
    </aside>
    <button class="nav-scrim ${ui.mobileNavOpen ? 'show' : ''}" data-action="toggle-nav" aria-label="Close navigation"></button>`;
}

export function renderTopbar() {
  const statusClass = runtime.webMcpStatus.supported === true ? 'ready' : runtime.webMcpStatus.supported === false ? 'fallback' : 'checking';
  const statusTitle = runtime.webMcpStatus.supported === true
    ? `${runtime.webMcpStatus.toolCount} tools live`
    : runtime.webMcpStatus.supported === false
      ? 'Guided demo available'
      : 'Checking WebMCP';
  const sectionLabels = {
    overview: 'Agent workspace',
    transactions: 'Bank transactions',
    approvals: 'Approval queue',
    tools: 'WebMCP tools',
    audit: 'Audit trail',
    invoices: 'Invoices',
    payments: 'Payments',
    connections: 'Bank connections',
    reports: 'Reports',
  };
  const currentLabel = sectionLabels[ui.activeSection] || 'Agent workspace';

  return `
    <header class="topbar">
      <div class="topbar-left">
        <button class="icon-button menu-button" data-action="toggle-nav" aria-label="Open navigation">${icon('menu', 20)}</button>
        <div class="breadcrumb"><span>Cherry Money</span>${icon('chevron', 14)}<strong>${escapeHtml(currentLabel)}</strong></div>
      </div>
      <div class="topbar-actions">
        <button class="live-backend-status ${runtime.live.connected ? 'connected' : runtime.live.loading ? 'loading' : ''}" data-action="${runtime.live.connected ? 'disconnect-live' : 'connect-live'}" title="${runtime.live.connected ? 'Disconnect this tab from Cherry Money production' : 'Connect an authenticated Cherry Money account'}">
          <i></i><span>${escapeHtml(runtime.live.connected ? (runtime.live.company?.name || 'Production connected') : runtime.live.loading ? 'Connecting…' : 'Connect Cherry Money')}</span>
        </button>
        <button class="webmcp-status ${statusClass}" data-action="show-tools" title="${escapeHtml(runtime.webMcpStatus.message)}">
          <i></i><span>${escapeHtml(statusTitle)}</span>${icon('chevron', 14)}
        </button>
        <button class="topbar-action" data-action="export-audit" title="Export the human + agent audit trail">${icon('download', 17)}<span>Audit export</span></button>
        <button class="topbar-action" data-action="reset-demo" title="Reset the representative sandbox">${icon('reset', 17)}<span>Reset demo</span></button>
        <span class="human-avatar" title="Human controller">SA</span>
      </div>
    </header>`;
}

function sparkline() {
  return `
    <svg class="sparkline" viewBox="0 0 160 48" preserveAspectRatio="none" aria-label="Seven-day balance trend">
      <defs><linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".22"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
      <path class="spark-area" d="M0 39 C18 35 22 27 38 29 S61 35 76 23 102 8 118 15 139 22 160 7 L160 48 L0 48 Z" fill="url(#sparkFill)"/>
      <path d="M0 39 C18 35 22 27 38 29 S61 35 76 23 102 8 118 15 139 22 160 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="160" cy="7" r="3.5" fill="currentColor"/>
    </svg>`;
}

export function renderMetrics(summary) {
  return `
    <section class="metric-grid" aria-label="Finance overview">
      <article class="metric-card balance-card">
        <div class="metric-head"><span class="metric-icon rose">${icon('bank', 18)}</span><span>Available cash</span><small>${runtime.live.connected ? 'Production' : 'Live sandbox'}</small></div>
        <strong>${money(summary.availableBalance)}</strong>
        <div class="metric-foot"><span class="positive">+8.4%</span><span>vs. last 7 days</span></div>
        ${sparkline()}
      </article>
      <article class="metric-card">
        <div class="metric-head"><span class="metric-icon amber">${icon('alert', 18)}</span><span>Needs review</span></div>
        <strong>${summary.reviewCount}</strong>
        <div class="metric-foot"><span>${summary.confidentCount} agent-ready</span><span>·</span><span>${summary.exceptionCount} exceptions</span></div>
        <div class="mini-progress"><i style="--width:${summary.reviewCount ? Math.round((summary.confidentCount / summary.reviewCount) * 100) : 0}%"></i></div>
      </article>
      <article class="metric-card">
        <div class="metric-head"><span class="metric-icon green">${icon('check', 18)}</span><span>Reconciled</span></div>
        <strong>${summary.matchedCount}</strong>
        <div class="metric-foot"><span class="positive">Audit-ready</span><span>transactions</span></div>
        <div class="metric-badge">Shared human + agent state</div>
      </article>
      <article class="metric-card attention-card ${summary.pendingCount ? 'has-pending' : ''}">
        <div class="metric-head"><span class="metric-icon plum">${icon('shield', 18)}</span><span>Awaiting you</span></div>
        <strong>${summary.pendingCount}</strong>
        <div class="metric-foot"><span>${summary.pendingCount ? 'A decision is ready' : 'Nothing waiting'}</span></div>
        <button class="text-button" data-scroll="approvals">${summary.pendingCount ? 'Review approval' : 'View safety boundary'} ${icon('arrow', 15)}</button>
      </article>
    </section>`;
}

export function renderHero(summary) {
  return `
    <section class="hero" id="overview">
      <div class="hero-copy">
        <div class="hero-kicker"><span class="live-dot"></span> OpenAI WebMCP Challenge · Production demo</div>
        <h1>Close the books with an agent.<br/><em>Keep the controls.</em></h1>
        <p>Cherry gives browser agents structured access to bank feeds, invoices and reconciliation logic—then stops at the exact point where human judgement matters.</p>
        <div class="hero-actions">
          <button class="button primary" data-command="guided">${icon('sparkles', 18)} Run the 60-second guided demo</button>
          <button class="button secondary" data-action="show-tools">${icon('agent', 18)} Inspect all 7 tools</button>
        </div>
        <div class="hero-proof">
          <span>${icon('check', 16)} Explainable confidence</span>
          <span>${icon('check', 16)} Persistent shared state</span>
          <span>${icon('check', 16)} No autonomous payments</span>
        </div>
      </div>
      <div class="hero-visual" aria-label="Human and agent safety architecture">
        <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
        <div class="agent-core">
          <span>${icon('agent', 31)}</span>
          <strong>Cherry Agent</strong>
          <small>${summary.confidentCount} confident matches ready</small>
        </div>
        <div class="flow-node node-bank">${icon('bank', 20)}<span>Bank feeds</span></div>
        <div class="flow-node node-invoice">${icon('invoice', 20)}<span>Invoices</span></div>
        <div class="flow-node node-exception">${icon('alert', 20)}<span>Exceptions</span></div>
        <div class="human-gate">
          <span>${icon('shield', 22)}</span>
          <div><strong>Human approval gate</strong><small>Consequential actions stop here</small></div>
        </div>
      </div>
    </section>`;
}

export function renderFooter() {
  return `
    <footer>
      <div>${renderLogo()}<span><strong>Cherry Agent-Native Finance</strong><small>Built after 25 August 2026 for the OpenAI WebMCP Challenge.</small></span></div>
      <div class="footer-links"><a href="https://github.com/sohamtech-uk/cherry-webmcp" target="_blank" rel="noreferrer">Source ${icon('external', 13)}</a><button data-action="show-tools">Tool registry</button><span>Representative data only</span></div>
    </footer>`;
}
