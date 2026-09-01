import test from 'node:test';
import assert from 'node:assert/strict';
import {
  approveReconciliation,
  createPaymentDraft,
  getInvoice,
  getTransaction,
  resetDemo,
  stageReconciliation,
  suggestMatch,
} from '../src/store.js';

test.beforeEach(() => resetDemo({ record: false }));

test('returns a high-confidence explainable match for txn_001', () => {
  const suggestion = suggestMatch('txn_001');
  assert.equal(suggestion.match.invoiceId, 'inv_1048');
  assert.equal(suggestion.confidence, 94);
  assert.equal(suggestion.ready, true);
  assert.deepEqual(suggestion.signals, ['Exact amount', 'Invoice reference or customer match']);
});

test('refuses to guess when txn_006 matches two unpaid invoices', () => {
  const suggestion = suggestMatch('txn_006');
  assert.equal(suggestion.confidence, 68);
  assert.equal(suggestion.ready, false);
  assert.equal(suggestion.ambiguous, true);
  assert.equal(suggestion.candidates.length, 2);
});

test('stages reconciliation without completing it', () => {
  const approval = stageReconciliation('txn_001', 'inv_1048');
  assert.equal(approval.status, 'pending');
  assert.equal(getTransaction('txn_001').status, 'pending_approval');
  assert.equal(getInvoice('inv_1048').status, 'unpaid');
});

test('only the explicit human approval step completes reconciliation', () => {
  const approval = stageReconciliation('txn_001', 'inv_1048');
  approveReconciliation(approval.id);
  assert.equal(getTransaction('txn_001').status, 'matched');
  assert.equal(getInvoice('inv_1048').status, 'paid');
  assert.equal(getInvoice('inv_1048').outstanding, 0);
});

test('payment tool creates a draft and never moves money', () => {
  const draft = createPaymentDraft({ payee: 'HMRC VAT', amount: 1240, reference: 'VAT Q2' });
  assert.equal(draft.status, 'draft_only');
  assert.equal(draft.moneyMoved, false);
});
