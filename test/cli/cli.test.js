'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const CLI = path.resolve(__dirname, '../../dist/cli.js');

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

  it('pay --json emits a JSON error instead of prose on bad input', () => {
    const r = run('pay', '--json');
    expect(r.status).not.toBe(0);
    const parsed = JSON.parse(r.stdout.trim());
    expect(parsed.error).toMatch(/Usage: vx3 pay/);
  });

  it.each([
    [['pay', '0x' + '1'.repeat(40), '0.1', '--rpc'], '--rpc'],
    [['pay', '0x' + '1'.repeat(40), '0.1', '--rpc', '--json'], '--rpc'],
    [['pay', '0x' + '1'.repeat(40), '0.1', '-k'], '-k'],
    [['nft', 'mint', '0x' + '1'.repeat(40), '--id', '1', '--rpc'], '--rpc'],
    [['nft', 'mint', '0x' + '1'.repeat(40), '--id'], '--id'],
    [['nft', 'mint', '0x' + '1'.repeat(40), '--to', '--id', '1'], '--to'],
  ])('refuses %j: a value flag without a value never falls back', (args, flag) => {
    const r = run(...args);
    expect(r.status).not.toBe(0);
    expect(r.stdout + r.stderr).toContain(`Missing value for ${flag}`);
  });

  it('lists "mint" in help and documents "mint nft"', () => {
    expect(run('help').stdout).toMatch(/\bmint\b.*vx3 mint nft/);
    const r = run('mint', 'nft', '--help');
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/Usage:\s+vx3 mint nft \[contractAddress\]/);
  });

  it('"mint" without a kind points at "mint nft"', () => {
    const r = run('mint', 'token', '--json');
    expect(r.status).not.toBe(0);
    expect(JSON.parse(r.stdout.trim()).error).toMatch(/vx3 mint nft/);
  });

  it.each([
    [['mint', 'nft', '--bogus'], 'Unknown option --bogus'],
    [['mint', 'nft', '0x' + '1'.repeat(40), 'extra'], 'Unexpected argument extra'],
    [['mint', 'nft', '--uri'], 'Missing value for --uri'],
    [['mint', 'nft', '--id', 'abc'], 'Invalid --id abc'],
    [['mint', 'nft', '--uri', 'x', '--name', 'y'], 'either --uri or --name'],
    [['mint', 'nft', '0x' + '1'.repeat(40), '--deploy'], 'either a contract address or --deploy'],
  ])('refuses %j before touching the network', (args, message) => {
    const r = run(...args);
    expect(r.status).not.toBe(0);
    expect(r.stdout + r.stderr).toContain(message);
  });

  it('nft --json emits a JSON error for an unknown subcommand', () => {
    const r = run('nft', 'bogus', '--json');
    expect(r.status).not.toBe(0);
    expect(JSON.parse(r.stdout.trim())).toHaveProperty('error');
  });
});
