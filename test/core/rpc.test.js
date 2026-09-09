'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  saveRpcConfig,
  loadRpcConfig,
  listRpcConfigs,
  createDefaultRpcConfig,
  addRpcEndpoint,
} = require('../../dist/core/rpc/manager');

function makeTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'vx-rpc-'));
}

describe('saveRpcConfig()', () => {
  let tmp;
  beforeEach(() => { tmp = makeTmp(); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('creates the rpcs directory if it does not exist', () => {
    const dir = path.join(tmp, 'rpcs');
    saveRpcConfig([{ host: 'localhost', port: 8545, protocol: 'http' }], 'main', dir);
    expect(fs.existsSync(dir)).toBe(true);
  });

  it('writes a valid JSON file at <rpcsDir>/<filename>.json', () => {
    const dir = path.join(tmp, 'rpcs');
    const cfg = [{ host: 'localhost', port: 8545, protocol: 'http' }];
    saveRpcConfig(cfg, 'local', dir);
    const content = JSON.parse(fs.readFileSync(path.join(dir, 'local.json'), 'utf8'));
    expect(content).toEqual(cfg);
  });

  it('wraps a single object in an array', () => {
    const dir = path.join(tmp, 'rpcs');
    saveRpcConfig({ host: 'localhost', port: 8545, protocol: 'http' }, 'single', dir);
    const content = JSON.parse(fs.readFileSync(path.join(dir, 'single.json'), 'utf8'));
    expect(Array.isArray(content)).toBe(true);
    expect(content).toHaveLength(1);
  });

  it('overwrites an existing file', () => {
    const dir = path.join(tmp, 'rpcs');
    saveRpcConfig([{ host: 'old', port: 1, protocol: 'http' }], 'cfg', dir);
    saveRpcConfig([{ host: 'new', port: 2, protocol: 'http' }], 'cfg', dir);
    const content = JSON.parse(fs.readFileSync(path.join(dir, 'cfg.json'), 'utf8'));
    expect(content[0].host).toBe('new');
  });
});

describe('loadRpcConfig()', () => {
  let tmp;
  beforeEach(() => { tmp = makeTmp(); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('reads back what saveRpcConfig wrote', () => {
    const cfg = [{ host: 'localhost', port: 8545, protocol: 'http' }];
    saveRpcConfig(cfg, 'local', tmp);
    const result = loadRpcConfig('local', tmp);
    expect(result).toEqual(cfg);
  });

  it('throws when the config file does not exist', () => {
    expect(() => loadRpcConfig('nonexistent', tmp)).toThrow();
  });

  it('throws when a required field is missing from an RPC entry', () => {
    fs.writeFileSync(
      path.join(tmp, 'bad.json'),
      JSON.stringify([{ host: 'localhost' }])
    );
    expect(() => loadRpcConfig('bad', tmp)).toThrow(/missing required fields/);
  });

  it('throws when the file is not a JSON array', () => {
    fs.writeFileSync(path.join(tmp, 'obj.json'), JSON.stringify({ host: 'x', port: 1, protocol: 'http' }));
    expect(() => loadRpcConfig('obj', tmp)).toThrow(/array/);
  });

  it('accepts a valid IPFS gateway entry', () => {
    const cfg = [{ type: 'ipfs', gateway: 'https://ipfs.io' }];
    saveRpcConfig(cfg, 'ipfs', tmp);
    const result = loadRpcConfig('ipfs', tmp);
    expect(result[0].gateway).toBe('https://ipfs.io');
  });

  it('throws for an IPFS entry missing both gateway and api', () => {
    fs.writeFileSync(path.join(tmp, 'bad-ipfs.json'), JSON.stringify([{ type: 'ipfs' }]));
    expect(() => loadRpcConfig('bad-ipfs', tmp)).toThrow(/gateway.*api|api.*gateway/i);
  });
});

describe('listRpcConfigs()', () => {
  let tmp;
  beforeEach(() => { tmp = makeTmp(); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('returns empty array when directory does not exist', () => {
    expect(listRpcConfigs(path.join(tmp, 'no-such-dir'))).toEqual([]);
  });

  it('lists filenames without extension', () => {
    saveRpcConfig([{ host: 'a', port: 1, protocol: 'http' }], 'alpha', tmp);
    saveRpcConfig([{ host: 'b', port: 2, protocol: 'http' }], 'beta', tmp);
    const names = listRpcConfigs(tmp);
    expect(names).toContain('alpha');
    expect(names).toContain('beta');
  });

  it('ignores non-.json files', () => {
    fs.writeFileSync(path.join(tmp, 'notes.txt'), 'hello');
    saveRpcConfig([{ host: 'x', port: 1, protocol: 'http' }], 'real', tmp);
    const names = listRpcConfigs(tmp);
    expect(names).not.toContain('notes');
    expect(names).toContain('real');
  });
});

describe('createDefaultRpcConfig()', () => {
  let tmp;
  beforeEach(() => { tmp = makeTmp(); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('creates a localhost:8545 http entry', () => {
    createDefaultRpcConfig('localhost', tmp);
    const result = loadRpcConfig('localhost', tmp);
    expect(result[0]).toMatchObject({ host: 'localhost', port: 8545, protocol: 'http' });
  });
});

describe('addRpcEndpoint()', () => {
  let tmp;
  beforeEach(() => { tmp = makeTmp(); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('appends an endpoint to an existing config', () => {
    saveRpcConfig([{ host: 'first', port: 1, protocol: 'http' }], 'multi', tmp);
    addRpcEndpoint('multi', { host: 'second', port: 2, protocol: 'http' }, tmp);
    const result = loadRpcConfig('multi', tmp);
    expect(result).toHaveLength(2);
    expect(result[1].host).toBe('second');
  });

  it('creates a new file when none exists', () => {
    addRpcEndpoint('fresh', { host: 'only', port: 9, protocol: 'http' }, tmp);
    const result = loadRpcConfig('fresh', tmp);
    expect(result[0].host).toBe('only');
  });
});
