'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { buildPackageJson, createPackageJson } = require('../../dist/libs/builder');

describe('buildPackageJson()', () => {
  it('names the package after the target directory', () => {
    const pkg = buildPackageJson('/tmp/my-cool-app');
    expect(pkg.name).toBe('my-cool-app');
  });

  it('wires the dev script to the current CLI command (vx3 api)', () => {
    const pkg = buildPackageJson('/tmp/x');
    expect(pkg.scripts.dev).toBe('vx3 api --debug');
    expect(pkg.scripts.dev).not.toContain('serve');
  });

  it('pins a current typescript devDependency', () => {
    const pkg = buildPackageJson('/tmp/x');
    expect(pkg.devDependencies.typescript).toMatch(/^\^5\./);
  });
});

describe('createPackageJson()', () => {
  let tmp;
  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vx-builder-'));
  });
  afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

  it('writes valid JSON that parses back', () => {
    createPackageJson(tmp);
    const raw = fs.readFileSync(path.join(tmp, 'package.json'), 'utf8');
    expect(() => JSON.parse(raw)).not.toThrow();
    expect(JSON.parse(raw).name).toBe(path.basename(tmp));
  });

  it('does not overwrite an existing package.json', () => {
    const p = path.join(tmp, 'package.json');
    fs.writeFileSync(p, '{"name":"keep-me"}');
    createPackageJson(tmp);
    expect(JSON.parse(fs.readFileSync(p, 'utf8')).name).toBe('keep-me');
  });
});
