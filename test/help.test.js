'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const CLI = path.resolve(__dirname, '../dist/cli.js');

describe('vx3 CLI', () => {
  it('runs without crashing when given help', () => {
    const result = spawnSync(process.execPath, [CLI, 'help'], { encoding: 'utf-8' });
    expect(result.error).toBeUndefined();
    expect(result.stdout + result.stderr).toMatch(/vx3/i);
  });

  it('prints usage on --version / -v', () => {
    const result = spawnSync(process.execPath, [CLI, '--version'], { encoding: 'utf-8' });
    expect(result.error).toBeUndefined();
    expect(result.stdout + result.stderr).toMatch(/\d+\.\d+/);
  });

  it('prints help for unknown command', () => {
    const result = spawnSync(process.execPath, [CLI, '__no_such_command__'], { encoding: 'utf-8' });
    expect(result.error).toBeUndefined();
    expect(result.stdout + result.stderr).toMatch(/Unknown command/i);
  });
});
