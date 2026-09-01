#!/usr/bin/env python3
from pathlib import Path

ROOT = Path.cwd()


def require(condition, message):
    if not condition:
        raise SystemExit(f'ERROR: {message}')


def update(path, fn):
    target = ROOT / path
    require(target.exists(), f'missing {path}')
    target.write_text(fn(target.read_text()))


def patch_main(text):
    bad_guard = """async function runLiveCommand(command, promptText) {
  if (runtime.live.connected) {
    await runLiveCommand(command, promptText);
    return;
  }

  addUserMessage(promptText);
"""
    fixed_live = """async function runLiveCommand(command, promptText) {
  const history = messageHistory();
  addUserMessage(promptText);
"""
    require(bad_guard in text, 'live recursion block not found')
    text = text.replace(bad_guard, fixed_live, 1)
    text = text.replace(
        "const ai = await askLiveCherry(promptText, messageHistory());",
        "const ai = await askLiveCherry(promptText, history);",
        1,
    )

    command_anchor = """  }[command] || 'Review the finance workspace.';

  addUserMessage(promptText);
"""
    command_fixed = """  }[command] || 'Review the finance workspace.';

  if (runtime.live.connected) {
    await runLiveCommand(command, promptText);
    return;
  }

  addUserMessage(promptText);
"""
    require(command_anchor in text, 'sandbox dispatcher anchor not found')
    text = text.replace(command_anchor, command_fixed, 1)

    text = text.replace(
        """  try {
    setStatePersistence(false);
    await loginToCherryMoney(email, password);
    const payload = await refreshLive();
""",
        """  try {
    await loginToCherryMoney(email, password);
    setStatePersistence(false);
    const payload = await refreshLive();
""",
        1,
    )

    if "cherry-live-session-expired" not in text:
        init_anchor = """render();

if (hasLiveSession()) {
"""
        require(init_anchor in text, 'initialization anchor not found')
        listener = """window.addEventListener('cherry-live-session-expired', async () => {
  if (runtime.live.connected || runtime.live.loading) {
    await disconnectLive({ notifyBackend: false });
  }
});

render();

if (hasLiveSession()) {
"""
        text = text.replace(init_anchor, listener, 1)

    return text


def patch_api(text):
    old = """  if (response.status === 401) clearLiveSession();

  if (!response.ok) {
"""
    new = """  if (response.status === 401) {
    clearLiveSession();
    window.dispatchEvent(new CustomEvent('cherry-live-session-expired'));
  }

  if (!response.ok) {
"""
    require(old in text, '401 handling anchor not found')
    return text.replace(old, new, 1)


def patch_test(text):
    addition = r'''

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
'''
    if "live command routing is non-recursive" not in text:
        text = text.rstrip() + addition + '\n'
    return text


update('src/main.js', patch_main)
update('src/live-api.js', patch_api)
update('tests/live-production-bridge.test.js', patch_test)

main = (ROOT / 'src/main.js').read_text()
live_segment = main[main.index('async function runLiveCommand'):main.index('function analysisResponse')]
require('await runLiveCommand(command, promptText)' not in live_segment, 'recursion remains')
require('const history = messageHistory();' in live_segment, 'history snapshot missing')
require("window.addEventListener('cherry-live-session-expired'" in main, 'session expiry listener missing')
print('Corrected live command routing and session expiry handling.')
