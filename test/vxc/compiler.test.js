'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { VXCompiler } = require('../../packages/vxc/dist/compiler');

// Minimal mock that mirrors the solc Standard JSON API.
function makeBackend(overrides = {}) {
  return {
    compile(inputJson) {
      const input = JSON.parse(inputJson);
      const contracts = {};
      for (const src of Object.keys(input.sources)) {
        contracts[src] = {
          MockContract: {
            abi: [{ type: 'constructor', inputs: [] }],
            evm: {
              bytecode: { object: 'deadbeef' },
              deployedBytecode: { object: 'cafebabe' },
            },
          },
        };
      }
      return JSON.stringify({ contracts, errors: [] });
    },
    version: () => 'mock-backend-0.8.0',
    ...overrides,
  };
}

function makeTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'vxc-compiler-'));
}

function writeSol(dir, name, content) {
  fs.writeFileSync(path.join(dir, name), content);
}

describe('VXCompiler.compile()', () => {
  let tmp;
  beforeEach(() => { tmp = makeTmp(); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('returns at least one artifact for a simple contract', () => {
    writeSol(tmp, 'Token.sol', 'pragma solidity ^0.8.0;\ncontract Token {}');
    const c = new VXCompiler(makeBackend());
    const result = c.compile({ entry: 'Token.sol', basePath: tmp, emitArtifacts: false });
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
    expect(result.artifacts.length).toBeGreaterThan(0);
  });

  it('artifact has expected shape', () => {
    writeSol(tmp, 'Token.sol', 'pragma solidity ^0.8.0;\ncontract Token {}');
    const c = new VXCompiler(makeBackend());
    const { artifacts } = c.compile({ entry: 'Token.sol', basePath: tmp, emitArtifacts: false });
    const a = artifacts[0];
    expect(a.contractName).toBe('MockContract');
    expect(a.bytecode).toBe('0xdeadbeef');
    expect(a.deployedBytecode).toBe('0xcafebabe');
    expect(a.compiler.name).toBe('vxc');
    expect(a.compiler.backend).toMatch(/mock/);
  });

  it('propagates backend error entries', () => {
    writeSol(tmp, 'Bad.sol', 'pragma solidity ^0.8.0;\ncontract Bad {}');
    const errBackend = makeBackend({
      compile: () => JSON.stringify({
        contracts: {},
        errors: [
          { severity: 'error', message: 'syntax error', formattedMessage: 'SyntaxError: bad token at 3:1' },
        ],
      }),
    });
    const c = new VXCompiler(errBackend);
    const result = c.compile({ entry: 'Bad.sol', basePath: tmp, emitArtifacts: false });
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].severity).toBe('error');
    expect(result.errors[0].message).toMatch(/SyntaxError/);
  });

  it('propagates backend warning entries', () => {
    writeSol(tmp, 'Warn.sol', 'pragma solidity ^0.8.0;\ncontract Warn {}');
    const warnBackend = makeBackend({
      compile: (inp) => {
        const base = JSON.parse(makeBackend().compile(inp));
        base.errors = [{ severity: 'warning', message: 'unused var', formattedMessage: 'unused var' }];
        return JSON.stringify(base);
      },
    });
    const c = new VXCompiler(warnBackend);
    const result = c.compile({ entry: 'Warn.sol', basePath: tmp, emitArtifacts: false });
    expect(result.errors[0].severity).toBe('warning');
  });

  it('writes artifact JSON and manifest to outDir', () => {
    writeSol(tmp, 'Token.sol', 'pragma solidity ^0.8.0;\ncontract Token {}');
    const outDir = path.join(tmp, 'build');
    const c = new VXCompiler(makeBackend());
    c.compile({ entry: 'Token.sol', basePath: tmp, outDir });
    expect(fs.existsSync(path.join(outDir, 'MockContract.json'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'vxc.manifest.json'))).toBe(true);
  });

  it('manifest lists correct source paths and contract names', () => {
    fs.writeFileSync(path.join(tmp, 'Lib.sol'), 'library Lib {}');
    writeSol(tmp, 'Token.sol', 'import "./Lib.sol";\ncontract Token {}');
    const outDir = path.join(tmp, 'build');
    const c = new VXCompiler(makeBackend());
    c.compile({ entry: 'Token.sol', basePath: tmp, outDir });
    const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'vxc.manifest.json'), 'utf8'));
    expect(manifest.compiler).toBe('vxc');
    expect(manifest.sources).toContain('Token.sol');
    expect(manifest.sources).toContain('Lib.sol');
    expect(manifest.contracts[0].name).toBe('MockContract');
  });

  it('result.sources lists all resolved source virtual paths', () => {
    fs.writeFileSync(path.join(tmp, 'Lib.sol'), 'library Lib {}');
    writeSol(tmp, 'Token.sol', 'import "./Lib.sol";\ncontract Token {}');
    const c = new VXCompiler(makeBackend());
    const { sources } = c.compile({ entry: 'Token.sol', basePath: tmp, emitArtifacts: false });
    expect(sources).toContain('Token.sol');
    expect(sources).toContain('Lib.sol');
  });

  it('passes remappings to the resolver', () => {
    fs.mkdirSync(path.join(tmp, 'vendor'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'vendor/Math.sol'), 'library Math {}');
    writeSol(tmp, 'Token.sol', 'import "@lib/Math.sol";\ncontract Token {}');
    const c = new VXCompiler(makeBackend());
    const result = c.compile({
      entry: 'Token.sol',
      basePath: tmp,
      remappings: { '@lib/': 'vendor/' },
      emitArtifacts: false,
    });
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
    expect(result.sources.some(s => s.includes('Math'))).toBe(true);
  });
});
