import assert from 'node:assert/strict';
import { parseMetafieldBoolean } from '../lib/metafield.ts';

const cases: Array<{ input: unknown; expected: boolean; label: string }> = [
  { input: true, expected: true, label: 'boolean true' },
  { input: false, expected: false, label: 'boolean false' },
  { input: 1, expected: true, label: 'number one' },
  { input: 0, expected: false, label: 'number zero' },
  { input: 'true', expected: true, label: 'string true' },
  { input: 'TRUE', expected: true, label: 'string TRUE' },
  { input: ' yes ', expected: true, label: 'string yes padded' },
  { input: 'on', expected: true, label: 'string on' },
  { input: 'false', expected: false, label: 'string false' },
  { input: '0', expected: false, label: 'string zero' },
  { input: 'no', expected: false, label: 'string no' },
  { input: 'off', expected: false, label: 'string off' },
  { input: '', expected: false, label: 'empty string' },
  { input: undefined, expected: false, label: 'undefined' },
  { input: null, expected: false, label: 'null' },
  { input: 'random', expected: false, label: 'unknown string defaults false' },
];

for (const { input, expected, label } of cases) {
  const actual = parseMetafieldBoolean(input);
  assert.equal(actual, expected, `${label}: expected ${expected}, got ${actual}`);
}

console.log(`parseMetafieldBoolean: ${cases.length} cases passed`);