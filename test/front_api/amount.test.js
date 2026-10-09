'use strict';

const { ethToWei, ethToWeiHex } = require('../../dist/front_api/amount');

describe('ethToWei()', () => {
  it.each([
    ['1', 1000000000000000000n],
    ['0.01', 10000000000000000n],
    ['.5', 500000000000000000n],
    ['5.', 5000000000000000000n],
    ['0', 0n],
    [' 2 ', 2000000000000000000n],
    ['0.000000000000000001', 1n],
  ])('converts %s', (amount, wei) => {
    expect(ethToWei(amount)).toBe(wei);
  });

  // Each of these is wrong with parseFloat(amount) * 1e18.
  it.each([
    ['0.57', 570000000000000000n],
    ['0.07', 70000000000000000n],
    ['1.1', 1100000000000000000n],
    ['4.35', 4350000000000000000n],
    ['1000000', 1000000000000000000000000n],
    ['0.123456789012345678', 123456789012345678n],
  ])('is exact for %s', (amount, wei) => {
    expect(ethToWei(amount)).toBe(wei);
  });

  it.each(['', ' ', '.', 'abc', '-1', '1e18', '1,5', '0x10', '1.2.3', 'NaN'])(
    'rejects %p',
    (amount) => {
      expect(() => ethToWei(amount)).toThrow(/Invalid amount/);
    }
  );

  it('rejects more than 18 decimal places instead of truncating', () => {
    expect(() => ethToWei('0.1234567890123456789')).toThrow(/18 decimal places/);
  });
});

describe('ethToWeiHex()', () => {
  it('returns the 0x-prefixed hex wallets expect', () => {
    expect(ethToWeiHex('0.57')).toBe('0x7e90bfae1f90000');
    expect(ethToWeiHex('0')).toBe('0x0');
  });
});
