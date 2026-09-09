'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const CLI = path.resolve(__dirname, '../../dist/src/cli.js');

function run(...args) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf-8' });
}

describe('vx3 CLI (commander)', () => {
  it('shows help with no arguments', () => {
    const r = run();
    expect(r.stdout + r.stderr).toMatch(/Usage: vx3/);
    expect(r.stdout + r.stderr).toMatch(/Commands:/);
  });

  it('lists the "api" command in help', () => {
    const r = run('help');
    expect(r.stdout + r.stderr).toMatch(/\bapi\b/);
  });

  it('reports the package version on --version', () => {
    const pkg = require('../../package.json');
    const r = run('--version');
    expect(r.stdout.trim()).toBe(pkg.version);
  });

  it('errors on an unknown command', () => {
    const r = run('__nope__');
    expect(r.status).not.toBe(0);
    expect(r.stdout + r.stderr).toMatch(/unknown command/i);
  });

  it('runs "sol hello"', () => {
    const r = run('sol', 'hello');
    expect(r.stdout).toMatch(/hello world/);
  });

  it('per-command help still works for pass-through commands', () => {
    const r = run('compile', '--help');
    expect(r.stdout + r.stderr).toMatch(/vx3 compile/);
  });
});
