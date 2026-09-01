import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('live credentials are tab-scoped and the OpenAI key is never present in browser source', () => {
  const api = read('src/live-api.js');
  const allBrowserSource = [
    api,
    read('src/main.js'),
    read('src/webmcp.js'),
    read('src/live-ui.js'),
  ].join('\n');

  assert.match(api, /sessionStorage\.setItem\(TOKEN_KEY/);
  assert.doesNotMatch(api, /localStorage\.setItem\(TOKEN_KEY/);
  assert.doesNotMatch(allBrowserSource, /OPENAI_API_KEY|sk-[A-Za-z0-9]/);
  assert.doesNotMatch(allBrowserSource, /api\.openai\.com/);
});

test('production finance state is explicitly blocked from localStorage', () => {
  const store = read('src/store.js');

  assert.match(store, /setStatePersistence\(false\)/);
  assert.match(store, /state\.source === 'cherry-money-production'/);
  assert.match(store, /localStorage\.removeItem\(STORAGE_KEY\)/);
  assert.match(store, /transaction\?\.source === 'cherry-money-production'/);
});

test('human approval and disconnect contracts call the private backend safely', () => {
  const api = read('src/live-api.js');

  assert.match(api, /confirmed_by_human: true/);
  assert.match(api, /request\('\/logout', \{ method: 'GET' \}\)/);
  assert.match(api, /credentials: 'omit'/);
  assert.match(api, /cache: 'no-store'/);
});

test('WebMCP live mode uses production read, suggestion, stage and draft endpoints without an approval tool', () => {
  const webmcp = read('src/webmcp.js');

  assert.match(webmcp, /liveBootstrap/);
  assert.match(webmcp, /suggestLiveReconciliation/);
  assert.match(webmcp, /stageLiveReconciliation/);
  assert.match(webmcp, /createLivePaymentDraft/);
  assert.doesNotMatch(webmcp, /name:\s*['"]cherry_approve/);
  assert.doesNotMatch(webmcp, /name:\s*['"]cherry_execute_payment/);
});

test('Vercel policy permits only the private Cherry API origins in addition to self', () => {
  const vercel = read('vercel.json');

  assert.match(vercel, /connect-src 'self' https:\/\/cherrybank\.money https:\/\/www\.cherrybank\.money;/);
});
