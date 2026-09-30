'use strict';

// The CJS interop block at the bottom of src/index.ts reassigns module.exports;
// make sure the React named exports survive it for both require() and
// bundlers that read module.exports (Vite / esbuild).
const sdk = require('../dist/index');

describe('package entry exports', () => {
  it.each(['useWallet', 'usePayment', 'usePaymentStatus', 'usePaymentDialog', 'Payment', 'mintNFT'])(
    'exposes %s as a named export',
    (name) => {
      expect(typeof sdk[name]).toBe('function');
    }
  );

  it('keeps the default and legacy exports', () => {
    expect(sdk.default).toBeDefined();
    expect(typeof sdk.default.getBalance).toBe('function');
    expect(sdk.instance).toBeDefined();
    expect(sdk.vx).toBeDefined();
    expect(typeof sdk.getBalance).toBe('function');
  });
});
