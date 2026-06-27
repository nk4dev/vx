'use strict';

// jest.mock() is hoisted by Jest to run before any require(), so the mock is
// in place when payment/index.js is first required below.
jest.mock('ethers', () => {
  const mockWait = jest.fn().mockResolvedValue({ blockNumber: 42 });
  const mockSendTransaction = jest.fn().mockResolvedValue({
    hash: '0xdeadbeef',
    wait: mockWait,
  });
  const MockWallet = jest.fn().mockImplementation(() => ({ sendTransaction: mockSendTransaction }));
  // Expose internal mocks so tests can inspect / reconfigure them.
  MockWallet.__mockSend = mockSendTransaction;
  MockWallet.__mockWait = mockWait;

  return {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({})),
    Wallet: MockWallet,
    parseEther: jest.fn((val) => BigInt(Math.round(parseFloat(val) * 1e18))),
  };
});

const { sendPayment } = require('../dist/src/payment/index');
const { Wallet } = require('ethers');

const VALID_OPTS = {
  rpcUrl: 'http://localhost:8545',
  privateKey: '0x' + 'a'.repeat(64),
  to: '0x' + '1'.repeat(40),
  amountEth: '0.1',
};

describe('sendPayment() — validation', () => {
  it('throws when rpcUrl is missing', async () => {
    const { rpcUrl: _, ...rest } = VALID_OPTS;
    await expect(sendPayment(rest)).rejects.toThrow(/rpcUrl/);
  });

  it('throws when privateKey is missing', async () => {
    const { privateKey: _, ...rest } = VALID_OPTS;
    await expect(sendPayment(rest)).rejects.toThrow(/privateKey/);
  });

  it('throws when to address is missing', async () => {
    const { to: _, ...rest } = VALID_OPTS;
    await expect(sendPayment(rest)).rejects.toThrow(/to/);
  });

  it('throws when amountEth is missing', async () => {
    const { amountEth: _, ...rest } = VALID_OPTS;
    await expect(sendPayment(rest)).rejects.toThrow(/amountEth/);
  });
});

describe('sendPayment() — happy path', () => {
  it('returns txHash and receipt on success', async () => {
    const result = await sendPayment(VALID_OPTS);
    expect(result.txHash).toBe('0xdeadbeef');
    expect(result.receipt).toMatchObject({ blockNumber: 42 });
  });

  it('constructs a Wallet with the provided privateKey', async () => {
    await sendPayment(VALID_OPTS);
    expect(Wallet).toHaveBeenCalledWith(VALID_OPTS.privateKey, expect.anything());
  });

  it('calls sendTransaction with the correct recipient', async () => {
    await sendPayment(VALID_OPTS);
    const callArg = Wallet.__mockSend.mock.calls[0][0];
    expect(callArg.to).toBe(VALID_OPTS.to);
  });

  it('converts ETH amount via parseEther', async () => {
    const { parseEther } = require('ethers');
    await sendPayment({ ...VALID_OPTS, amountEth: '1.5' });
    expect(parseEther).toHaveBeenCalledWith('1.5');
  });
});

describe('sendPayment() — optional overrides', () => {
  it('forwards gasLimit when provided', async () => {
    await sendPayment({ ...VALID_OPTS, gasLimit: 21000 });
    const callArg = Wallet.__mockSend.mock.calls[0][0];
    expect(callArg.gasLimit).toBe(21000);
  });

  it('does not set gasLimit when not provided', async () => {
    await sendPayment(VALID_OPTS);
    const callArg = Wallet.__mockSend.mock.calls[0][0];
    expect(callArg.gasLimit).toBeUndefined();
  });
});
