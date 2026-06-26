'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { ImportResolver } = require('../../packages/vxc/dist/resolver');

function makeTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'vxc-resolver-'));
}

function write(dir, rel, content) {
  const dest = path.join(dir, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
}

describe('ImportResolver', () => {
  let tmp;
  beforeEach(() => { tmp = makeTmp(); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('resolveEntry reads a single file and returns its content', () => {
    write(tmp, 'Token.sol', 'pragma solidity ^0.8.0;\ncontract Token {}');
    const r = new ImportResolver({ basePath: tmp });
    const src = r.resolveEntry('Token.sol');
    expect(src.virtualPath).toBe('Token.sol');
    expect(src.content).toContain('Token');
    expect(src.tokens).toContainEqual(expect.objectContaining({ kind: 'pragma' }));
  });

  it('resolveGraph includes the entry file', () => {
    write(tmp, 'A.sol', 'contract A {}');
    const r = new ImportResolver({ basePath: tmp });
    const graph = r.resolveGraph('A.sol');
    expect([...graph.keys()]).toContain('A.sol');
  });

  it('resolveGraph follows a relative import', () => {
    write(tmp, 'lib/Math.sol', 'library Math {}');
    write(tmp, 'Token.sol', 'import "./lib/Math.sol";\ncontract Token {}');
    const r = new ImportResolver({ basePath: tmp });
    const graph = r.resolveGraph('Token.sol');
    expect([...graph.keys()]).toContain('Token.sol');
    expect([...graph.keys()]).toContain('lib/Math.sol');
  });

  it('resolveGraph follows transitive imports', () => {
    write(tmp, 'c.sol', 'contract C {}');
    write(tmp, 'b.sol', 'import "./c.sol";');
    write(tmp, 'a.sol', 'import "./b.sol";');
    const r = new ImportResolver({ basePath: tmp });
    const graph = r.resolveGraph('a.sol');
    expect([...graph.keys()]).toContain('c.sol');
  });

  it('applies remappings to resolve aliased paths', () => {
    write(tmp, 'vendor/SafeMath.sol', 'library SafeMath {}');
    write(tmp, 'Token.sol', 'import "@lib/SafeMath.sol";\ncontract Token {}');
    const r = new ImportResolver({ basePath: tmp, remappings: { '@lib/': 'vendor/' } });
    const graph = r.resolveGraph('Token.sol');
    expect([...graph.keys()].some(k => k.includes('SafeMath'))).toBe(true);
  });

  it('caches files — circular imports do not loop infinitely', () => {
    write(tmp, 'A.sol', 'import "./B.sol";');
    write(tmp, 'B.sol', 'import "./A.sol";');
    const r = new ImportResolver({ basePath: tmp });
    expect(() => r.resolveGraph('A.sol')).not.toThrow();
    const graph = r.resolveGraph('A.sol');
    expect(graph.size).toBe(2);
  });

  it('throws a VXC error when an import cannot be resolved', () => {
    write(tmp, 'Token.sol', 'import "./NonExistent.sol";');
    const r = new ImportResolver({ basePath: tmp });
    expect(() => r.resolveGraph('Token.sol')).toThrow(/VXC/);
  });

  it('throws when the entry file does not exist', () => {
    const r = new ImportResolver({ basePath: tmp });
    expect(() => r.resolveEntry('Missing.sol')).toThrow(/VXC/);
  });
});
