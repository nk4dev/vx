'use strict';

// `react` is an optional peer dependency: the package entry must load — and
// the non-React API must work — in a project that does not have it installed.
jest.mock('react', () => {
  throw new Error("Cannot find module 'react'");
});

describe('package entry without react installed', () => {
  let sdk;

  it('can be required', () => {
    expect(() => {
      sdk = require('../dist/index');
    }).not.toThrow();
  });

  it('still exposes the non-React API', () => {
    expect(typeof sdk.getBlockNumber).toBe('function');
    expect(typeof sdk.getGasFees).toBe('function');
    expect(typeof sdk.mintNFT).toBe('function');
    expect(typeof sdk.payment.sendPayment).toBe('function');
    expect(typeof sdk.instance).toBe('function');
    expect(typeof sdk.default.getBalance).toBe('function');
  });

  it('lists the React exports without loading react', () => {
    expect(Object.keys(sdk)).toEqual(
      expect.arrayContaining(['Payment', 'usePayment', 'useWallet'])
    );
  });

  it('only fails when a React export is actually used', () => {
    expect(() => sdk.useWallet).toThrow(/react/);
    expect(() => sdk.Payment).toThrow(/react/);
  });
});
