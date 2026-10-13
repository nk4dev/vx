'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('ethers', () => {
  const mocks = {
    safeMint: jest.fn(),
    mint: jest.fn(),
    getCode: jest.fn(),
    send: jest.fn(),
    deploy: jest.fn(),
  };
  const nodeSigner = { getAddress: async () => '0xNodeAccount' };
  return {
    __mocks: mocks,
    __nodeSigner: nodeSigner,
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getCode: mocks.getCode,
      send: mocks.send,
      getSigner: jest.fn().mockResolvedValue(nodeSigner),
    })),
    Wallet: jest.fn().mockImplementation(() => ({
      getAddress: async () => '0xKeyAccount',
    })),
    Contract: jest.fn().mockImplementation(() => ({
      'mint(address,uint256)': mocks.mint,
      'safeMint(address,string)': mocks.safeMint,
    })),
    ContractFactory: jest.fn().mockImplementation(() => ({
      deploy: mocks.deploy,
    })),
    parseUnits: jest.fn(),
  };
});

const ethers = require('ethers');
const { quickMint, buildTokenURI } = require('../dist/nft/index');
const m = ethers.__mocks;

const DEPLOYED = '0x' + 'd'.repeat(40);
const TRANSFER =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const KEY = '0x' + 'a'.repeat(64);

let cwd;
let chainId;
const savedKey = process.env.PRIVATE_KEY;

function mintTx(contractAddress, tokenId) {
  return {
    hash: '0xminthash',
    wait: jest.fn().mockResolvedValue({
      blockNumber: 9,
      logs: [
        {
          address: contractAddress,
          topics: [
            TRANSFER,
            '0x' + '0'.repeat(64),
            '0x' + '1'.repeat(64),
            '0x' + tokenId.toString(16).padStart(64, '0'),
          ],
        },
      ],
    }),
  };
}

beforeEach(() => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'vx-quickmint-'));
  chainId = 31337;
  delete process.env.PRIVATE_KEY;
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({ result: '0x' + chainId.toString(16) }),
  }));
  m.getCode.mockReset().mockResolvedValue('0x6080');
  m.send.mockReset().mockResolvedValue(['0xNodeAccount']);
  m.safeMint.mockReset().mockResolvedValue(mintTx(DEPLOYED, 1));
  m.mint.mockReset().mockResolvedValue(mintTx(DEPLOYED, 7));
  m.deploy.mockReset().mockResolvedValue({
    waitForDeployment: jest.fn().mockResolvedValue(undefined),
    getAddress: jest.fn().mockResolvedValue(DEPLOYED),
    deploymentTransaction: () => ({ hash: '0xdeployhash' }),
  });
});

afterEach(() => {
  fs.rmSync(cwd, { recursive: true, force: true });
  if (savedKey === undefined) delete process.env.PRIVATE_KEY;
  else process.env.PRIVATE_KEY = savedKey;
});

const store = () =>
  JSON.parse(fs.readFileSync(path.join(cwd, 'vx.nft.json'), 'utf-8'));

describe('quickMint() — zero-config on a local dev chain', () => {
  it('deploys a collection, saves it, and mints to the node account', async () => {
    const res = await quickMint({ cwd });

    expect(global.fetch.mock.calls[0][0]).toBe('http://localhost:8545');
    expect(m.deploy).toHaveBeenCalledWith('VX Collection', 'VXC');
    expect(m.safeMint).toHaveBeenCalledWith('0xNodeAccount', '', {});
    expect(res).toMatchObject({
      txHash: '0xminthash',
      tokenId: '1',
      to: '0xNodeAccount',
      contractAddress: DEPLOYED,
      chainId: '31337',
      rpcUrl: 'http://localhost:8545',
      deployed: { contractAddress: DEPLOYED, txHash: '0xdeployhash' },
    });
    expect(store()['31337']).toEqual({
      address: DEPLOYED,
      name: 'VX Collection',
      symbol: 'VXC',
    });
  });

  it('reuses the saved collection on the next mint', async () => {
    await quickMint({ cwd });
    m.deploy.mockClear();
    const res = await quickMint({ cwd, tokenURI: 'ipfs://x' });

    expect(m.deploy).not.toHaveBeenCalled();
    expect(res.deployed).toBeUndefined();
    expect(res.contractAddress).toBe(DEPLOYED);
    expect(m.safeMint).toHaveBeenLastCalledWith('0xNodeAccount', 'ipfs://x', {});
  });

  it('redeploys when the saved contract is gone (restarted dev node)', async () => {
    fs.writeFileSync(
      path.join(cwd, 'vx.nft.json'),
      JSON.stringify({ 31337: { address: '0xGone', name: 'n', symbol: 's' } })
    );
    m.getCode.mockImplementation(async (a) => (a === '0xGone' ? '0x' : '0x6080'));

    const res = await quickMint({ cwd });
    expect(res.deployed).toBeDefined();
    expect(store()['31337'].address).toBe(DEPLOYED);
  });

  it('uses custom collection name / symbol and inlines metadata', async () => {
    const metadata = { name: 'Hello', image: 'https://example.com/a.png' };
    const res = await quickMint({
      cwd,
      collectionName: 'Mine',
      collectionSymbol: 'MN',
      metadata,
    });

    expect(m.deploy).toHaveBeenCalledWith('Mine', 'MN');
    expect(res.tokenURI).toBe(buildTokenURI(metadata));
    const json = Buffer.from(res.tokenURI.split(',')[1], 'base64').toString();
    expect(JSON.parse(json)).toEqual(metadata);
  });
});

describe('quickMint() — resolution order', () => {
  it('takes the RPC URL from vx.config.json', async () => {
    fs.writeFileSync(
      path.join(cwd, 'vx.config.json'),
      JSON.stringify([{ host: 'node.test', port: 9000, protocol: 'http' }])
    );
    const res = await quickMint({ cwd });
    expect(res.rpcUrl).toBe('http://node.test:9000');
  });

  it('prefers PRIVATE_KEY from .env over the node account', async () => {
    fs.writeFileSync(path.join(cwd, '.env'), `PRIVATE_KEY="${KEY}"\n`);
    const res = await quickMint({ cwd });
    expect(ethers.Wallet).toHaveBeenCalledWith(KEY, expect.anything());
    expect(res.to).toBe('0xKeyAccount');
    expect(m.send).not.toHaveBeenCalled();
  });

  it('mints on an explicit contract without touching vx.nft.json', async () => {
    const contractAddress = '0x' + 'c'.repeat(40);
    await quickMint({ cwd, contractAddress, tokenId: 7n });
    expect(m.deploy).not.toHaveBeenCalled();
    expect(m.mint).toHaveBeenCalledWith('0xNodeAccount', 7n, {});
    expect(fs.existsSync(path.join(cwd, 'vx.nft.json'))).toBe(false);
  });
});

describe('quickMint() — nothing implicit off a local chain', () => {
  beforeEach(() => {
    chainId = 1;
  });

  it('never borrows the node account', async () => {
    await expect(quickMint({ cwd })).rejects.toThrow(/Private key not provided/);
    expect(m.send).not.toHaveBeenCalled();
  });

  it('refuses to deploy unless asked to', async () => {
    await expect(quickMint({ cwd, privateKey: KEY })).rejects.toThrow(
      /No NFT collection known for chain 1.*--deploy/
    );
    expect(m.deploy).not.toHaveBeenCalled();
  });

  it('deploys with deploy: true', async () => {
    const res = await quickMint({ cwd, privateKey: KEY, deploy: true });
    expect(res.deployed).toBeDefined();
    expect(store()['1'].address).toBe(DEPLOYED);
  });

  it('does not silently replace a saved contract that has no code', async () => {
    fs.writeFileSync(
      path.join(cwd, 'vx.nft.json'),
      JSON.stringify({ 1: { address: '0xGone', name: 'n', symbol: 's' } })
    );
    m.getCode.mockResolvedValue('0x');
    await expect(quickMint({ cwd, privateKey: KEY })).rejects.toThrow(
      /no contract exists there/
    );
    expect(m.deploy).not.toHaveBeenCalled();
  });
});

describe('quickMint() — unreachable node', () => {
  it('fails fast with a hint instead of retrying forever', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('fetch failed'));
    await expect(quickMint({ cwd })).rejects.toThrow(
      /Cannot reach an EVM node at http:\/\/localhost:8545 \(fetch failed\)/
    );
  });

  it('reports a non-JSON-RPC HTTP endpoint', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
    await expect(quickMint({ cwd })).rejects.toThrow(/HTTP 404/);
  });
});
