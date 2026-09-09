'use strict';

jest.mock('ethers', () => {
  const mockMint = jest.fn();
  const mockSafeMint = jest.fn();
  const MockContract = jest.fn().mockImplementation(() => ({
    mint: mockMint,
    safeMint: mockSafeMint,
  }));
  MockContract.__mint = mockMint;
  MockContract.__safeMint = mockSafeMint;
  return {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({})),
    Wallet: jest
      .fn()
      .mockImplementation(() => ({ address: '0xSignerAddress' })),
    Contract: MockContract,
    parseUnits: jest.fn((v) => BigInt(v) * 1000000000n),
  };
});

const { mintNFT } = require('../dist/nft/index');
const { Contract } = require('ethers');
const mint = Contract.__mint;
const safeMint = Contract.__safeMint;

const BASE = {
  rpcUrl: 'http://localhost:8545',
  privateKey: '0x' + 'a'.repeat(64),
  contractAddress: '0x' + 'c'.repeat(40),
};

beforeEach(() => {
  mint.mockClear().mockResolvedValue({
    hash: '0xminthash',
    wait: jest.fn().mockResolvedValue({ blockNumber: 5 }),
  });
  safeMint.mockClear().mockResolvedValue({
    hash: '0xsafehash',
    wait: jest.fn().mockResolvedValue({ blockNumber: 6 }),
  });
});

describe('mintNFT() — validation', () => {
  it.each(['rpcUrl', 'privateKey', 'contractAddress'])(
    'throws when %s is missing',
    async (key) => {
      const opts = { ...BASE };
      delete opts[key];
      await expect(mintNFT(opts)).rejects.toThrow(new RegExp(key));
    }
  );
});

describe('mintNFT() — function selection', () => {
  it('uses mint(to, tokenId) when only tokenId is given', async () => {
    const res = await mintNFT({ ...BASE, to: '0xTo', tokenId: 7n });
    expect(mint).toHaveBeenCalledWith('0xTo', 7n, {});
    expect(res.txHash).toBe('0xminthash');
  });

  it('uses safeMint(to, tokenURI) when only tokenURI is given', async () => {
    await mintNFT({ ...BASE, to: '0xTo', tokenURI: 'ipfs://x' });
    expect(safeMint).toHaveBeenCalledWith('0xTo', 'ipfs://x', {});
  });

  it('defaults the recipient to the signer address', async () => {
    await mintNFT({ ...BASE, tokenId: 1n });
    expect(mint).toHaveBeenCalledWith('0xSignerAddress', 1n, {});
  });

  it('honours an explicit functionName', async () => {
    await mintNFT({ ...BASE, to: '0xTo', functionName: 'mint' });
    expect(mint).toHaveBeenCalledWith('0xTo', {});
  });

  it('returns the receipt from tx.wait()', async () => {
    const res = await mintNFT({ ...BASE, tokenId: 1n });
    expect(res.receipt).toMatchObject({ blockNumber: 5 });
  });
});
