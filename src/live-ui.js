import { runtime, ui } from './context.js';
import { escapeHtml, icon } from './ui.js';
import { LIVE_API_BASE } from './live-api.js';

export function renderLiveConnectionModal() {
  if (!ui.showLiveLogin) return '';

  return `
    <button class="modal-scrim" data-action="close-live-login" aria-label="Close Cherry Money connection"></button>
    <section class="modal live-login-modal" role="dialog" aria-modal="true" aria-labelledby="live-login-title">
      <div class="modal-head">
        <div>
          <span class="eyebrow">Authenticated production connection</span>
          <h2 id="live-login-title">Connect this tab to Cherry Money</h2>
          <p>Your password is sent directly to the private Cherry Money API over HTTPS and is never stored. The Sanctum token remains only in this browser tab.</p>
        </div>
        <button class="icon-button" data-action="close-live-login" aria-label="Close">${icon('close', 20)}</button>
      </div>
      <form class="live-login-form" id="live-login-form">
        <label><span>Email</span><input name="email" type="email" autocomplete="username" required maxlength="255" placeholder="judge-demo@cherrybank.money" /></label>
        <label><span>Password</span><input name="password" type="password" autocomplete="current-password" required minlength="6" placeholder="Cherry Money password" /></label>
        ${runtime.live.error ? `<div class="live-login-error">${icon('alert', 17)}${escapeHtml(runtime.live.error)}</div>` : ''}
        <button class="button primary full" type="submit" ${runtime.live.loading ? 'disabled' : ''}>${icon('link', 18)} ${runtime.live.loading ? 'Connecting…' : 'Connect securely'}</button>
      </form>
      <div class="live-login-foot">
        <span>${icon('shield', 16)} Use the dedicated judge/demo company. Do not connect an organisation containing real customer or bank data for public judging.</span>
        <span>${icon('lock', 16)} Production finance data stays in memory for this tab and is never written to localStorage.</span>
        <code>${escapeHtml(LIVE_API_BASE)}</code>
      </div>
    </section>`;
}

export function renderLiveModeBanner() {
  if (!runtime.live.connected) {
    return `
      <div class="live-mode-banner sandbox">
        <span>${icon('shield', 17)}</span>
        <div><strong>Representative sandbox</strong><small>No production records or OpenAI request is used until an authenticated Cherry Money account is connected.</small></div>
        <button data-action="connect-live">Connect production</button>
      </div>`;
  }

  const aiLabel = runtime.live.openaiProvider === 'openai'
    ? `OpenAI response verified${runtime.live.model ? ` · ${runtime.live.model}` : ''}`
    : runtime.live.openaiConfigured
      ? `OpenAI configured${runtime.live.model ? ` · ${runtime.live.model}` : ''} · not yet called in this tab`
      : 'OpenAI not configured for this company';

  return `
    <div class="live-mode-banner connected">
      <span>${icon('check', 17)}</span>
      <div><strong>${escapeHtml(runtime.live.company?.name || 'Cherry Money production')} connected</strong><small>Authenticated backend · ${escapeHtml(aiLabel)} · tab-scoped session</small></div>
      <button data-action="disconnect-live">Disconnect</button>
    </div>`;
}
