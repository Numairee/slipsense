import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseTextToSlipFields } from '../src/utils/slipFields.js';

for (const row of readFileSync(new URL('./amount-cases.tsv', import.meta.url), 'utf8').trim().split('\n')) {
  if (!row.trim() || row.startsWith('#')) continue;
  const [expected, input] = row.split('\t');
  test(`shared amount: ${input}`, () => assert.equal(parseTextToSlipFields(input.replaceAll('\\n', '\n')).amount, expected === 'null' ? null : Number(expected)));
}
