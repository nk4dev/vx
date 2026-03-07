const { spawnSync } = require('child_process');
const path = require('path');

describe('vx3 CLI', () => {
  it('should display help with --help', () => {
    // vx3コマンドのパスを取得（必要に応じて修正）
    const vx3Path = path.resolve(__dirname, '../path/to/vx3'); // 実際のパスに合わせて修正

    const result = spawnSync('node', [vx3Path, '--help'], {
      encoding: 'utf-8',
    });

    expect(result.status).toBe(1);
  });
});
