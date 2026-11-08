import test from 'node:test';
import assert from 'node:assert/strict';
import { Storage } from '../src/utils/storage.js';

test('batch import preserves existing transactions', () => {
  const values = new Map([['pygmy_transactions_v1', JSON.stringify([{ id: 'old' }])]]);
  globalThis.localStorage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  assert.deepEqual(Storage.addBatchTransactions([{ id: 'new' }]).map(tx => tx.id), ['new', 'old']);
  assert.equal(JSON.parse(values.get('pygmy_transactions_v1')).length, 2);
});

test('failed batch write reports failure and preserves saved data', () => {
  const original = JSON.stringify([{ id: 'old' }]);
  globalThis.localStorage = { getItem: () => original, setItem: () => { throw new Error('QuotaExceededError'); } };
  const previousError = console.error;
  console.error = () => {};
  try {
    assert.throws(() => Storage.addBatchTransactions([{ id: 'new' }]), /ไม่สามารถบันทึก/);
    assert.equal(localStorage.getItem('pygmy_transactions_v1'), original);
  } finally { console.error = previousError; }
});
