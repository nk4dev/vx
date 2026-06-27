'use strict';

const { lex, extractPragmaVersion } = require('../../packages/vxc/dist/lexer');

describe('lex()', () => {
  it('extracts pragma solidity', () => {
    const tokens = lex('pragma solidity ^0.8.20;');
    expect(tokens).toEqual([{ kind: 'pragma', value: 'solidity ^0.8.20', line: 1 }]);
  });

  it('extracts import with named specifier (from syntax)', () => {
    const src = 'import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";';
    const tokens = lex(src);
    expect(tokens).toContainEqual(
      expect.objectContaining({ kind: 'import', path: '@openzeppelin/contracts/token/ERC20/ERC20.sol' })
    );
  });

  it('extracts bare import', () => {
    const tokens = lex('import "./utils/Math.sol";');
    expect(tokens).toContainEqual(expect.objectContaining({ kind: 'import', path: './utils/Math.sol' }));
  });

  it('extracts wildcard import (import * as X from "…")', () => {
    const tokens = lex('import * as Lib from "./Lib.sol";');
    expect(tokens).toContainEqual(expect.objectContaining({ kind: 'import', path: './Lib.sol' }));
  });

  it('extracts contract name', () => {
    const tokens = lex('contract Token is ERC20 {');
    expect(tokens).toContainEqual(expect.objectContaining({ kind: 'contract', name: 'Token' }));
  });

  it('extracts library name', () => {
    const tokens = lex('library SafeMath {');
    expect(tokens).toContainEqual(expect.objectContaining({ kind: 'contract', name: 'SafeMath' }));
  });

  it('extracts interface name', () => {
    const tokens = lex('interface IERC20 {');
    expect(tokens).toContainEqual(expect.objectContaining({ kind: 'contract', name: 'IERC20' }));
  });

  it('strips // line comments — tokens inside are not parsed', () => {
    const tokens = lex('// import "./fake.sol";\npragma solidity ^0.8.0;');
    expect(tokens.filter(t => t.kind === 'import')).toHaveLength(0);
    expect(tokens).toContainEqual(expect.objectContaining({ kind: 'pragma' }));
  });

  it('strips /* */ block comments', () => {
    const tokens = lex('/* import "./fake.sol"; */\nimport "./real.sol";');
    const imports = tokens.filter(t => t.kind === 'import');
    expect(imports).toHaveLength(1);
    expect(imports[0].path).toBe('./real.sol');
  });

  it('does not parse import paths inside string literals', () => {
    const src = 'string s = "import \'./fake.sol\';";\nimport "./real.sol";';
    const tokens = lex(src);
    const imports = tokens.filter(t => t.kind === 'import');
    expect(imports).toHaveLength(1);
    expect(imports[0].path).toBe('./real.sol');
  });

  it('records correct 1-based line numbers', () => {
    const src = 'pragma solidity ^0.8.0;\n\nimport "./Lib.sol";';
    const tokens = lex(src);
    const pragma = tokens.find(t => t.kind === 'pragma');
    const imp = tokens.find(t => t.kind === 'import');
    expect(pragma.line).toBe(1);
    expect(imp.line).toBe(3);
  });

  it('returns empty array for empty source', () => {
    expect(lex('')).toEqual([]);
  });

  it('handles a complete multi-declaration source', () => {
    const src = [
      'pragma solidity ^0.8.20;',
      'import "./Lib.sol";',
      'interface IToken {}',
      'contract Token is IToken {}',
    ].join('\n');
    const tokens = lex(src);
    expect(tokens.filter(t => t.kind === 'pragma')).toHaveLength(1);
    expect(tokens.filter(t => t.kind === 'import')).toHaveLength(1);
    expect(tokens.filter(t => t.kind === 'contract')).toHaveLength(2);
  });
});

describe('extractPragmaVersion()', () => {
  it('extracts the version constraint from a solidity pragma', () => {
    const tokens = lex('pragma solidity ^0.8.20;');
    expect(extractPragmaVersion(tokens)).toBe('^0.8.20');
  });

  it('extracts range version constraint', () => {
    const tokens = lex('pragma solidity >=0.7.0 <0.9.0;');
    expect(extractPragmaVersion(tokens)).toBe('>=0.7.0 <0.9.0');
  });

  it('returns null when only a non-solidity pragma is present', () => {
    const tokens = lex('pragma abicoder v2;');
    expect(extractPragmaVersion(tokens)).toBeNull();
  });

  it('returns null for empty token list', () => {
    expect(extractPragmaVersion([])).toBeNull();
  });
});
