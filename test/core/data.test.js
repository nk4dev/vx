'use strict';

const mockGetFeeData = jest.fn();
const mockGetBlock = jest.fn();

jest.mock('ethers', () => {
  const actual = jest.requireActual('ethers');
  return {
    ...actual,
    ethers: {
      ...actual.ethers,
      JsonRpcProvider: jest.fn().mockImplementation(() => ({
        getFeeData: mockGetFeeData,
        getBlock: mockGetBlock,
        getBlockNumber: jest.fn().mockResolvedValue(123),
      })),
    },
  };
});

const { getGasFees, getBlockNumber } = require('../../dist/core/data/index');

describe('getGasFees()', () => {
  beforeEach(() => {
    mockGetFeeData.mockResolvedValue({
      gasPrice: 20000000000n,
      maxFeePerGas: 30000000000n,
      maxPriorityFeePerGas: 1000000000n,
    });
    mockGetBlock.mockResolvedValue({ baseFeePerGas: 15000000000n });
  });

  it('returns gwei strings and wei strings — no BigInt in the shape', async () => {
    const fees = await getGasFees('http://localhost:8545');
    expect(fees.baseFeePerGasGwei).toBe('15.0');
    expect(fees.maxFeePerGasGwei).toBe('30.0');
    expect(fees.raw.gasPrice).toBe('20000000000');
    expect(typeof fees.raw.baseFeePerGas).toBe('string');
  });

  it('is plain JSON-serializable without a custom toJSON', async () => {
    const fees = await getGasFees('http://localhost:8545');
    expect(fees.toJSON).toBeUndefined();
    expect(() => JSON.stringify(fees)).not.toThrow();
    const round = JSON.parse(JSON.stringify(fees));
    expect(round.raw.maxPriorityFeePerGas).toBe('1000000000');
  });

  it('tolerates a missing base fee (pre-EIP-1559 / null block)', async () => {
    mockGetBlock.mockResolvedValue(null);
    mockGetFeeData.mockResolvedValue({
      gasPrice: 5000000000n,
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
    });
    const fees = await getGasFees('http://localhost:8545');
    expect(fees.baseFeePerGasGwei).toBeUndefined();
    expect(fees.raw.maxFeePerGas).toBeNull();
    expect(fees.gasPriceGwei).toBe('5.0');
  });
});

describe('getBlockNumber()', () => {
  it('resolves the provider block number', async () => {
    await expect(getBlockNumber('http://localhost:8545')).resolves.toBe(123);
  });
});
