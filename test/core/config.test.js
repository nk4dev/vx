'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const ORIGINAL_CWD = process.cwd();

function freshModule() {
  jest.resetModules();
  return require('../../dist/core/config');
}

function makeTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'vx-config-'));
}

function write(dir, cfg) {
  fs.writeFileSync(
    path.join(dir, 'vx.config.json'),
    typeof cfg === 'string' ? cfg : JSON.stringify(cfg)
  );
}

describe('loadVxConfig()', () => {
  let tmp;
  beforeEach(() => {
    tmp = makeTmp();
    process.chdir(tmp);
  });
  afterEach(() => {
    process.chdir(ORIGINAL_CWD);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('returns the parsed array', () => {
    const cfg = [{ host: 'localhost', port: 8545, protocol: 'http', type: 'rpc' }];
    write(tmp, cfg);
    expect(freshModule().loadVxConfig()).toEqual(cfg);
  });

  it('wraps a single object in an array', () => {
    write(tmp, { host: 'localhost', port: 8545, protocol: 'http' });
    const result = freshModule().loadVxConfig();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
  });

  it('throws VxConfigError when the file is missing', () => {
    const { loadVxConfig, VxConfigError } = freshModule();
    expect(() => loadVxConfig()).toThrow(VxConfigError);
    expect(() => loadVxConfig()).toThrow(/not found/i);
  });

  it('returns [] when the file is missing and optional:true', () => {
    expect(freshModule().loadVxConfig({ optional: true })).toEqual([]);
  });

  it('throws on invalid JSON', () => {
    write(tmp, '{ not json');
    expect(() => freshModule().loadVxConfig()).toThrow(/invalid JSON/i);
  });

  it('throws on invalid JSON even with optional:true', () => {
    write(tmp, '{ not json');
    expect(() => freshModule().loadVxConfig({ optional: true })).toThrow(
      /invalid JSON/i
    );
  });

  it('throws when an RPC entry is missing required fields', () => {
    write(tmp, [{ host: 'localhost' }]);
    expect(() => freshModule().loadVxConfig()).toThrow(/required fields/i);
  });

  it('reads an explicit path', () => {
    const p = path.join(tmp, 'custom.json');
    fs.writeFileSync(p, JSON.stringify([{ host: 'h', port: 1, protocol: 'http' }]));
    expect(freshModule().loadVxConfig({ path: p })).toHaveLength(1);
  });
});

describe('getFirstRpcUrl() / getRpcEndpoints() / toRpcUrl()', () => {
  let tmp;
  beforeEach(() => {
    tmp = makeTmp();
    process.chdir(tmp);
  });
  afterEach(() => {
    process.chdir(ORIGINAL_CWD);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('builds the URL from the first RPC entry, skipping IPFS entries', () => {
    write(tmp, [
      { type: 'ipfs', gateway: 'https://ipfs.io' },
      { host: 'localhost', port: 8545, protocol: 'http', type: 'rpc' },
    ]);
    expect(freshModule().getFirstRpcUrl()).toBe('http://localhost:8545');
  });

  it('throws when no RPC endpoint is configured', () => {
    write(tmp, [{ type: 'ipfs', gateway: 'https://ipfs.io' }]);
    expect(() => freshModule().getFirstRpcUrl()).toThrow(/no rpc endpoint/i);
  });

  it('toRpcUrl builds proto://host:port', () => {
    expect(
      freshModule().toRpcUrl({ protocol: 'https', host: 'x.io', port: 443 })
    ).toBe('https://x.io:443');
  });
});

describe('writeVxConfig()', () => {
  let tmp;
  beforeEach(() => {
    tmp = makeTmp();
  });
  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('writes a valid default config that loads back', () => {
    const { writeVxConfig, loadVxConfig, DEFAULT_VX_CONFIG } = freshModule();
    const p = path.join(tmp, 'vx.config.json');
    writeVxConfig(DEFAULT_VX_CONFIG, p);
    expect(loadVxConfig({ path: p }).length).toBe(DEFAULT_VX_CONFIG.length);
  });

  it('rejects an invalid config without writing', () => {
    const { writeVxConfig } = freshModule();
    const p = path.join(tmp, 'vx.config.json');
    expect(() => writeVxConfig([{ host: 'only-host' }], p)).toThrow();
    expect(fs.existsSync(p)).toBe(false);
  });
});
