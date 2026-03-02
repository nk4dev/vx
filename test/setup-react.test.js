/**
 * Tests for `vx3 setup react` command.
 *
 * Verifies that:
 * 1. The command exits successfully and prints expected guidance.
 * 2. Template files are copied into the target directory.
 * 3. package.json is updated with correct dependencies and scripts.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const cliPath = path.resolve(rootDir, 'dist', 'src', 'cli.js');

function runCLI(args, options = {}) {
  return new Promise((resolve) => {
    const proc = spawn(process.execPath, [cliPath, ...args], {
      cwd: options.cwd || rootDir,
      env: { ...process.env, ...(options.env || {}) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));

    proc.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

describe('vx3 setup react', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vx3-react-'));
    // Seed an empty package.json so upsertJSON has something to work with
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'test-react-app', version: '0.0.1' }, null, 2),
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('exits with code 0 and prints guidance', async () => {
    const { code, stdout } = await runCLI(['setup', 'react'], { cwd: tmpDir });
    expect(code).toBe(0);
    expect(stdout).toContain('React setup complete');
    expect(stdout).toContain('npm install');
    expect(stdout).toContain('npm run dev');
  });

  test('updates package.json with react dependencies and scripts', async () => {
    await runCLI(['setup', 'react'], { cwd: tmpDir });

    const pkg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf8'));

    // scripts
    expect(pkg.scripts.dev).toBe('vite');
    expect(pkg.scripts.build).toContain('vite build');

    // dependencies
    expect(pkg.dependencies.react).toBeDefined();
    expect(pkg.dependencies['react-dom']).toBeDefined();
    expect(pkg.dependencies.ethers).toBeDefined();
    expect(pkg.dependencies['@nk4dev/vx']).toBeDefined();

    // devDependencies
    expect(pkg.devDependencies.vite).toBeDefined();
    expect(pkg.devDependencies['@vitejs/plugin-react']).toBeDefined();
    expect(pkg.devDependencies['@types/react']).toBeDefined();
    expect(pkg.devDependencies['@types/react-dom']).toBeDefined();
  });

  test('copies template files into the target directory', async () => {
    await runCLI(['setup', 'react'], { cwd: tmpDir });

    // Check key files exist
    expect(fs.existsSync(path.join(tmpDir, 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'vite.config.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'src', 'App.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'src', 'main.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'src', 'components', 'Payment.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'src', 'components', 'hooks', 'use-payment.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'src', 'components', 'hooks', 'use-payment-status.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'src', 'components', 'hooks', 'use-payment-dialog.ts'))).toBe(true);
  });

  test('Payment component contains expected props interface', async () => {
    await runCLI(['setup', 'react'], { cwd: tmpDir });

    const paymentSrc = fs.readFileSync(
      path.join(tmpDir, 'src', 'components', 'Payment.tsx'),
      'utf8',
    );

    // Verify key interface members
    expect(paymentSrc).toContain('to: string');
    expect(paymentSrc).toContain('amount: string');
    expect(paymentSrc).toContain("mode?: PaymentMode");
    expect(paymentSrc).toContain('onSuccess');
    expect(paymentSrc).toContain('onError');

    // Verify both payment modes are handled
    expect(paymentSrc).toContain('payViaApi');
    expect(paymentSrc).toContain('payViaWallet');
    expect(paymentSrc).toContain('eth_sendTransaction');
    expect(paymentSrc).toContain('eth_requestAccounts');
  });
});
