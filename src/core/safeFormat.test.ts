import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  safeToFixed,
  safeToLocaleString,
  safeCurrency,
  safeSurplus,
  safeFormatNonce,
} from './safeFormat';

test('safeToFixed produces byte-identical output for finite numbers', () => {
  assert.equal(safeToFixed(123.456, 2), (123.456).toFixed(2));
  assert.equal(safeToFixed(0, 2), (0).toFixed(2));
  assert.equal(safeToFixed(-50.1, 2), (-50.1).toFixed(2));
  assert.equal(safeToFixed(180, 2), (180).toFixed(2));
});

test('safeToFixed falls back to UNAVAILABLE or custom string on non-finite or missing input', () => {
  assert.equal(safeToFixed(undefined), 'UNAVAILABLE');
  assert.equal(safeToFixed(null), 'UNAVAILABLE');
  assert.equal(safeToFixed(NaN), 'UNAVAILABLE');
  assert.equal(safeToFixed(Infinity), 'UNAVAILABLE');
  assert.equal(safeToFixed('123'), 'UNAVAILABLE');
  assert.equal(safeToFixed(undefined, 2, '--'), '--');
});

test('safeToLocaleString produces byte-identical output for finite numbers with options', () => {
  const num = 1420000.5;
  const opts = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  assert.equal(safeToLocaleString(num, 'en-US', opts), num.toLocaleString('en-US', opts));
  assert.equal(safeToLocaleString(0, 'en-US'), (0).toLocaleString('en-US'));
});

test('safeToLocaleString falls back safely on invalid values', () => {
  assert.equal(safeToLocaleString(undefined), 'UNAVAILABLE');
  assert.equal(safeToLocaleString(null), 'UNAVAILABLE');
  assert.equal(safeToLocaleString(NaN), 'UNAVAILABLE');
  assert.equal(safeToLocaleString(undefined, 'en-US', undefined, '--'), '--');
});

test('safeCurrency formats currency strings identically to standard toLocaleString', () => {
  const num = 50000;
  assert.equal(
    safeCurrency(num, '$', { minimumFractionDigits: 2 }),
    `$${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  );
  assert.equal(safeCurrency(undefined), 'UNAVAILABLE');
  assert.equal(safeCurrency(null, '$', {}, '--'), '--');
});

test('safeSurplus calculates valid surplus and returns null on missing fields', () => {
  assert.equal(safeSurplus(450000, 400000), 50000);
  assert.equal(safeSurplus(350000, 400000), 0);
  assert.equal(safeSurplus(undefined, 400000), null);
  assert.equal(safeSurplus(450000, undefined), null);
  assert.equal(safeSurplus(NaN, 400000), null);
});

test('safeFormatNonce formats valid nonces and falls back safely', () => {
  assert.equal(safeFormatNonce(1), 'NONCE #1');
  assert.equal(safeFormatNonce(42, 'NONCE #'), 'NONCE #42');
  assert.equal(safeFormatNonce(undefined), 'UNAVAILABLE');
  assert.equal(safeFormatNonce(null), 'UNAVAILABLE');
  assert.equal(safeFormatNonce(undefined, 'NONCE #', 'NONCE #--'), 'NONCE #--');
});
