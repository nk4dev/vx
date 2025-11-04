// Minimal sanity test for CLI help using built artifact
const path = require('path');
const { spawnSync } = require('child_process');

describe('vx3 help (smoke)', () => {
  test('prints help and exits 0', () => {
    const cli = path.resolve(__dirname, 'dist', 'src', 'cli.js');
    const res = spawnSync(process.execPath, [cli, 'help'], { encoding: 'utf-8' });
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/Available commands:/);
  });
});