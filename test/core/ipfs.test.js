'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

// Capture the real cwd so we can restore it after each test.
const ORIGINAL_CWD = process.cwd();

function makeTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'vx-ipfs-'));
}

function writeVxConfig(dir, cfg) {
  fs.writeFileSync(path.join(dir, 'vx.config.json'), JSON.stringify(cfg));
}

// Re-require the module fresh so loadVxConfig() sees the current cwd.
function freshModule() {
  jest.resetModules();
  return require('../../dist/core/ipfs');
}

function makeFetchMock({ ok = true, contentType = 'text/plain', body = 'hello' } = {}) {
  return jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 404,
    statusText: ok ? 'OK' : 'Not Found',
    headers: { get: jest.fn().mockReturnValue(contentType) },
    text: jest.fn().mockResolvedValue(body),
    arrayBuffer: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4]).buffer),
  });
}

describe('loadVxConfig()', () => {
  let tmp;
  beforeEach(() => { tmp = makeTmp(); process.chdir(tmp); });
  afterEach(() => { process.chdir(ORIGINAL_CWD); fs.rmSync(tmp, { recursive: true, force: true }); });

  it('returns empty array when vx.config.json does not exist', () => {
    const { loadVxConfig } = freshModule();
    expect(loadVxConfig()).toEqual([]);
  });

  it('returns the parsed array from vx.config.json', () => {
    const cfg = [{ host: 'localhost', port: 8545, protocol: 'http', type: 'rpc' }];
    writeVxConfig(tmp, cfg);
    const { loadVxConfig } = freshModule();
    expect(loadVxConfig()).toEqual(cfg);
  });

  it('wraps an object config in an array', () => {
    const cfg = { host: 'localhost', port: 8545, protocol: 'http' };
    writeVxConfig(tmp, cfg);
    const { loadVxConfig } = freshModule();
    const result = loadVxConfig();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toMatchObject(cfg);
  });
});

describe('findIpfsEntries()', () => {
  let tmp;
  beforeEach(() => { tmp = makeTmp(); process.chdir(tmp); });
  afterEach(() => { process.chdir(ORIGINAL_CWD); fs.rmSync(tmp, { recursive: true, force: true }); });

  it('returns only entries that look like IPFS config', () => {
    writeVxConfig(tmp, [
      { type: 'rpc', host: 'localhost', port: 8545, protocol: 'http' },
      { type: 'ipfs', gateway: 'https://ipfs.io' },
    ]);
    const { findIpfsEntries } = freshModule();
    const entries = findIpfsEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].gateway).toBe('https://ipfs.io');
  });

  it('returns empty array when no IPFS entries exist', () => {
    writeVxConfig(tmp, [{ type: 'rpc', host: 'localhost', port: 8545, protocol: 'http' }]);
    const { findIpfsEntries } = freshModule();
    expect(findIpfsEntries()).toHaveLength(0);
  });
});

describe('fetchFromGateway()', () => {
  beforeEach(() => { global.fetch = makeFetchMock(); });
  afterEach(() => { delete global.fetch; });

  it('constructs the correct IPFS URL and returns text', async () => {
    const { fetchFromGateway } = freshModule();
    const result = await fetchFromGateway('QmHash123', 'https://ipfs.io');
    expect(global.fetch).toHaveBeenCalledWith('https://ipfs.io/ipfs/QmHash123');
    expect(result).toBe('hello');
  });

  it('strips trailing slash from gateway before building URL', async () => {
    const { fetchFromGateway } = freshModule();
    await fetchFromGateway('QmAbc', 'https://ipfs.io/');
    const url = global.fetch.mock.calls[0][0];
    // Trailing slash must be removed so the path does not contain a double slash
    expect(url).toBe('https://ipfs.io/ipfs/QmAbc');
    expect(url).not.toContain('//ipfs/');
  });

  it('returns binary data for non-text content type', async () => {
    global.fetch = makeFetchMock({ contentType: 'application/octet-stream' });
    const { fetchFromGateway } = freshModule();
    const result = await fetchFromGateway('QmBin', 'https://ipfs.io');
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('throws when the gateway returns a non-ok HTTP status', async () => {
    global.fetch = makeFetchMock({ ok: false });
    const { fetchFromGateway } = freshModule();
    await expect(fetchFromGateway('QmBad', 'https://ipfs.io')).rejects.toThrow(/HTTP 404/);
  });
});

describe('fetchCid()', () => {
  let tmp;
  beforeEach(() => {
    tmp = makeTmp();
    process.chdir(tmp);
    global.fetch = makeFetchMock();
  });
  afterEach(() => {
    process.chdir(ORIGINAL_CWD);
    fs.rmSync(tmp, { recursive: true, force: true });
    delete global.fetch;
  });

  it('uses the explicitly provided gateway', async () => {
    const { fetchCid } = freshModule();
    const result = await fetchCid('QmTest', 'https://custom.gw');
    expect(result.source).toBe('https://custom.gw');
    expect(result.data).toBe('hello');
  });

  it('falls back to gateway from vx.config.json', async () => {
    writeVxConfig(tmp, [{ type: 'ipfs', gateway: 'https://from-config.io' }]);
    const { fetchCid } = freshModule();
    const result = await fetchCid('QmFromCfg');
    expect(result.source).toBe('https://from-config.io');
  });

  it('throws when no gateway is provided and config has no IPFS entry', async () => {
    writeVxConfig(tmp, [{ type: 'rpc', host: 'localhost', port: 8545, protocol: 'http' }]);
    const { fetchCid } = freshModule();
    await expect(fetchCid('QmNoGateway')).rejects.toThrow(/gateway/i);
  });

  it('throws when vx.config.json does not exist and no gateway provided', async () => {
    const { fetchCid } = freshModule();
    await expect(fetchCid('QmOrphan')).rejects.toThrow(/gateway/i);
  });
});
