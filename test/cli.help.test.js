const { exec } = require('child_process');
const path = require('path');

test('CLI help prints available commands', (done) => {
  const cli = path.join(__dirname, '..', 'dist', 'src', 'cli.js');
  exec(`node "${cli}" help`, { timeout: 5000 }, (err, stdout, stderr) => {
    if (err) {
      // If the CLI exits non-zero, still check output
      // Fail if no stdout present
      if (!stdout) return done(err);
    }

    try {
      expect(stdout).toMatch(/Available commands:/);
      expect(stdout).toMatch(/VX3 SDK/);
      done();
    } catch (e) {
      done(e);
    }
  });
});
