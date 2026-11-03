import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toHex, fromHex } from '../src/index.js';

test('toHex unsigned basic', () => {
  assert.equal(toHex(0n), '0');
  assert.equal(toHex(255n), 'ff');
  assert.equal(toHex(4096n), '1000');
});

test('toHex unsigned with prefix', () => {
  assert.equal(toHex(255n, { prefix: true }), '0xff');
});

test('toHex signed positive', () => {
  assert.equal(toHex(127n, { signed: true, bits: 8 }), '7f');
  assert.equal(toHex(0n, { signed: true, bits: 8 }), '0');
});

test('toHex signed negative', () => {
  assert.equal(toHex(-1n, { signed: true, bits: 8 }), 'ff');
  assert.equal(toHex(-128n, { signed: true, bits: 8 }), '80');
});

test('toHex signed with padding', () => {
  assert.equal(toHex(1n, { signed: true, bits: 8, pad: true }), '01');
  assert.equal(toHex(-1n, { signed: true, bits: 16, pad: true }), 'ffff');
});

test('toHex rejects negative unsigned', () => {
  assert.throws(() => toHex(-1n), RangeError);
});

test('toHex signed requires bits', () => {
  assert.throws(() => toHex(1n, { signed: true }), RangeError);
});

test('toHex signed bits multiple of 4', () => {
  assert.throws(() => toHex(1n, { signed: true, bits: 7 }), RangeError);
});

test('toHex signed range check', () => {
  assert.throws(() => toHex(128n, { signed: true, bits: 8 }), RangeError);
  assert.throws(() => toHex(-129n, { signed: true, bits: 8 }), RangeError);
});

test('fromHex unsigned basic', () => {
  assert.equal(fromHex('0'), 0n);
  assert.equal(fromHex('ff'), 255n);
  assert.equal(fromHex('0xff'), 255n);
  assert.equal(fromHex('0XFF'), 255n);
});

test('fromHex signed positive', () => {
  assert.equal(fromHex('7f', { signed: true, bits: 8 }), 127n);
});

test('fromHex signed negative', () => {
  assert.equal(fromHex('ff', { signed: true, bits: 8 }), -1n);
  assert.equal(fromHex('80', { signed: true, bits: 8 }), -128n);
});

test('fromHex signed range check', () => {
  assert.throws(() => fromHex('100', { signed: true, bits: 8 }), RangeError);
});

test('fromHex rejects empty string', () => {
  assert.throws(() => fromHex(''), Error);
});

test('fromHex rejects invalid characters', () => {
  assert.throws(() => fromHex('gg'), Error);
});

test('round trip unsigned', () => {
  const values = [0n, 1n, 255n, 4096n, 12345678901234567890n];
  for (const v of values) {
    assert.equal(fromHex(toHex(v)), v);
  }
});

test('round trip signed', () => {
  const cases = [
    [0n, 8],
    [127n, 8],
    [-1n, 8],
    [-128n, 8],
    [32767n, 16],
    [-32768n, 16],
  ];
  for (const [v, bits] of cases) {
    assert.equal(fromHex(toHex(v, { signed: true, bits }), { signed: true, bits }), v);
  }
});
