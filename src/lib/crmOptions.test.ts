import test from 'node:test';
import assert from 'node:assert/strict';
import { formatINR } from './crmOptions';

test('formatINR uses Indian grouping with a readable amount suffix', () => {
  assert.equal(formatINR(100000), '1,00,000 (1 Lakh)');
  assert.equal(formatINR(12000), '12,000 (12K)');
  assert.equal(formatINR(3540000), '35,40,000 (35.4 Lakh)');
  assert.equal(formatINR(640000), '6,40,000 (6.4 Lakh)');
  assert.equal(formatINR(10000000), '1,00,00,000 (1 Crore)');
});
