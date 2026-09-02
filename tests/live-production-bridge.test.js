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

  assert.match(api, /'X-Cherry-Human-Approval': 'confirmed'/);
  assert.match(api, /body: \{ confirmation: true \}/);
  assert.doesNotMatch(api, /confirmed_by_human: true/);
  assert.match(api, /request\('\/logout', \{ method: 'GET' \}\)/);
  assert.match(api, /credentials: 'omit'/);
  assert.match(api, /cache: 'no-store'/);
});

test('Google sign-in uses the Cherry Money OAuth bridge and a one-time code exchange', () => {
  const api = read('src/live-api.js');
  const liveUi = read('src/live-ui.js');
  const allBrowserSource = `${api}\n${liveUi}`;

  assert.match(api, /new URL\('\/webmcp\/google\/redirect', LIVE_APP_ORIGIN\)/);
  assert.match(api, /return_origin/);
  assert.match(api, /request\('\/webmcp\/google\/exchange'/);
  assert.match(api, /GOOGLE_CODE_KEY = 'google-auth'/);
  assert.match(api, /window\.history\.replaceState/);
  assert.match(liveUi, /Continue with Google/);
  assert.match(liveUi, /short-lived, single-use code/);
  assert.doesNotMatch(allBrowserSource, /GOOGLE_CLIENT_SECRET|accounts\.google\.com\/gsi/);
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

test('production bridge uses cherrymoney.co.uk and contains no legacy API-domain reference', () => {
  const api = read('src/live-api.js');
  const liveUi = read('src/live-ui.js');
  const vercel = read('vercel.json');
  const documentation = read('docs/live-production-bridge.md');
  const productionBridgeSurface = [api, liveUi, vercel, documentation].join('\n');

  assert.match(api, /const DEFAULT_API_BASE = 'https:\/\/cherrymoney\.co\.uk\/api'/);
  assert.match(api, /'https:\/\/cherrymoney\.co\.uk'/);
  assert.match(api, /'https:\/\/www\.cherrymoney\.co\.uk'/);
  assert.match(liveUi, /you@cherrymoney\.co\.uk/);
  assert.match(vercel, /connect-src 'self' https:\/\/cherrymoney\.co\.uk https:\/\/www\.cherrymoney\.co\.uk;/);
  assert.match(documentation, /https:\/\/cherrymoney\.co\.uk\/api\/login/);
  assert.doesNotMatch(productionBridgeSurface, /cherrybank\.money/i);
});

test('live command routing is non-recursive and does not duplicate the current prompt in history', () => {
  const main = read('src/main.js');
  const liveStart = main.indexOf('async function runLiveCommand');
  const liveEnd = main.indexOf('function analysisResponse', liveStart);
  const dispatcherStart = main.indexOf('async function runCommand');
  const dispatcherEnd = main.indexOf('function downloadJson', dispatcherStart);
  const liveCommand = main.slice(liveStart, liveEnd);
  const dispatcher = main.slice(dispatcherStart, dispatcherEnd);

  assert.doesNotMatch(liveCommand, /await runLiveCommand\(command, promptText\)/);
  assert.match(liveCommand, /const history = messageHistory\(\);[\s\S]*addUserMessage\(promptText\)/);
  assert.match(liveCommand, /askLiveCherry\(promptText, history\)/);
  assert.match(dispatcher, /if \(runtime\.live\.connected\)[\s\S]*await runLiveCommand\(command, promptText\)/);
});
