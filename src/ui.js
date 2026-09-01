const iconPaths = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9 21v-7h6v7"/>',
  transactions: '<path d="M4 7h16M4 12h16M4 17h10"/><path d="m17 15 3 3-3 3"/>',
  invoice: '<path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/>',
  reconcile: '<path d="M20 7h-6V1"/><path d="M20 7a9 9 0 1 0 1 8"/><path d="m4 17 4-4 3 3"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20V7"/>',
  agent: '<rect x="4" y="7" width="16" height="13" rx="4"/><path d="M12 3v4M8 12h.01M16 12h.01M8 16h8"/>',
  rules: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="11" cy="18" r="2"/>',
  audit: '<path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.2.36.31.76.31 1.17V10h.1v4h-.1c0 .41-.11.81-.31 1z"/>',
  sparkles: '<path d="m12 3 1.2 3.3L16.5 7.5l-3.3 1.2L12 12l-1.2-3.3-3.3-1.2 3.3-1.2zM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8zM19 14l.7 1.8 1.8.7-1.8.7L19 19l-.7-1.8-1.8-.7 1.8-.7z"/>',
  shield: '<path d="M12 2 20 5v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
  bank: '<path d="m3 10 9-6 9 6"/><path d="M5 10h14M6 10v8M10 10v8M14 10v8M18 10v8M4 20h16"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
  alert: '<path d="M12 3 2.5 20h19z"/><path d="M12 9v4M12 17h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6H5V6h6"/>',
  reset: '<path d="M20 6v5h-5"/><path d="M19 11a8 8 0 1 0 1 5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="m5 5 14 14M19 5 5 19"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
  chevron: '<path d="m8 10 4 4 4-4"/>',
  dot: '<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>',
};

export function icon(name, size = 18, extraClass = '') {
  return `<svg class="icon ${extraClass}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.dot}</svg>`;
}

export const money = (value) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(value));
export const formatDate = (value, options = { day: 'numeric', month: 'short' }) => new Intl.DateTimeFormat('en-GB', options).format(new Date(`${value}T12:00:00`));
export const formatTime = (value) => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
export const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export function statusLabel(status) {
  return {
    needs_review: 'Needs review',
    pending_approval: 'Pending approval',
    matched: 'Matched',
    ignored: 'Ignored',
  }[status] || status;
}

export function toast(message, tone = 'success') {
  const region = document.querySelector('#toast-region');
  if (!region) return;
  const item = document.createElement('div');
  item.className = `toast ${tone}`;
  item.innerHTML = `${icon(tone === 'error' ? 'alert' : 'check', 17)}<span>${escapeHtml(message)}</span>`;
  region.append(item);
  requestAnimationFrame(() => item.classList.add('show'));
  setTimeout(() => {
    item.classList.remove('show');
    setTimeout(() => item.remove(), 220);
  }, 3600);
}

export function renderLogo() {
  return `
    <span class="cherry-logo" aria-hidden="true">
      <svg viewBox="0 0 52 52" role="img">
        <path d="M27 19c2-7 6-11 14-12" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M25 19c-1-7-4-11-10-14" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M36 8c4-1 8 0 10 3-4 2-8 2-11 0" fill="currentColor" opacity=".78"/>
        <circle cx="19" cy="31" r="10" fill="currentColor" opacity=".95"/>
        <circle cx="35" cy="32" r="9" fill="currentColor" opacity=".72"/>
      </svg>
    </span>`;
}
