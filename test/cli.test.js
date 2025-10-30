/**
 * End-to-end CLI tests for @vx/sdk
 * - Executes dist/cli.js in child processes
 * - Uses a temp working directory for file-system side effects
 * - Verifies stdout/stderr/exit codes and observable behavior
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const cliPath = path.resolve(rootDir, 'dist', 'src', 'cli.js');
const repoConfigPath = path.resolve(rootDir, 'vx.config.json');

function runCLI(args, options = {}) {
  return new Promise((resolve) => {
    const proc = spawn(process.execPath, [cliPath, ...args], {
      cwd: options.cwd || rootDir,
      env: { ...process.env, ...(options.env || {}) },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => (stdout += d.toString()))
    proc.stderr.on('data', (d) => (stderr += d.toString()))

    const timer = options.timeout
      ? setTimeout(() => {
          // best-effort kill on timeout
          try { proc.kill(); } catch {}
        }, options.timeout)
      : null;

    proc.on('close', (code, signal) => {
      if (timer) clearTimeout(timer);
      resolve({ code, signal, stdout, stderr });
    });
  });
}

function waitForOutput(proc, regex, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    let buf = '';
    const onData = (d) => {
      buf += d.toString();
      if (regex.test(buf)) {
        cleanup();
        resolve(buf);
      }
    };
    const onErr = (d) => {
      buf += d.toString();
      if (regex.test(buf)) {
        cleanup();
        resolve(buf);
      }
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout waiting for output: ${regex}`));
    }, timeoutMs);
    function cleanup() {
      clearTimeout(timer);
      proc.stdout.off('data', onData);
      proc.stderr.off('data', onErr);
    }
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onErr);
  });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      })
      .on('error', reject);
  });
}

async function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(() => {});
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

describe('vx CLI e2e', () => {
  let workDir;

  beforeAll(() => {
    // Ensure dist/cli.js exists
    if (!fs.existsSync(cliPath)) {
      throw new Error(`cli not found at ${cliPath}. Build the package first.`);
    }

    // Ensure dist/template exists for init command (fallback from src/template)
    const distTemplate = path.resolve(rootDir, 'dist', 'template');
    const srcTemplate = path.resolve(rootDir, 'src', 'template');
    if (!fs.existsSync(distTemplate) && fs.existsSync(srcTemplate)) {
      copyDir(srcTemplate, distTemplate);
    }

    // Create an isolated working directory for FS-affecting commands
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vx-cli-test-'));
  });

  afterAll(() => {
    // Clean up temp working directory
    try {
      if (workDir && fs.existsSync(workDir)) {
        // recursive delete
        fs.rmSync(workDir, { recursive: true, force: true });
      }
    } catch {}
  });

  test('help shows command list', async () => {
    const res = await runCLI(['help']);
    expect(res.code).toBe(0);
  expect(res.stdout).toMatch(/Available commands:/);
  expect(res.stdout).toMatch(/VX3 SDK v/);
  });

  test('--version prints version', async () => {
    const res = await runCLI(['--version']);
    expect(res.code).toBe(0);
    expect(res.stdout).toMatch(/version:/i);
  });

  test('-v prints version (short flag)', async () => {
    const res = await runCLI(['-v']);
    expect(res.code).toBe(0);
    expect(res.stdout).toMatch(/version:/i);
  });

  test('rpc init + view operate in temp dir', async () => {
    // create vx.config.json in working dir
    let res = await runCLI(['rpc', 'init'], { cwd: workDir });
    expect(res.code).toBe(0);
    expect(fs.existsSync(path.join(workDir, 'vx.config.json'))).toBe(true);

    // view should print RPC URL
    res = await runCLI(['rpc', 'view'], { cwd: workDir });
    expect(res.code).toBe(0);
    expect(res.stdout).toMatch(/RPC\s*:\s*http:\/\/localhost:8575/);
  });

  test('init creates project directory and copies template', async () => {
    const projectName = 'my-vx-project-e2e';
    const res = await runCLI(['init', projectName], { cwd: workDir });
    expect(res.code).toBe(0);
    const projectPath = path.join(workDir, projectName);
    expect(fs.existsSync(projectPath)).toBe(true);
    // Expect at least one template file to exist
    const files = fs.readdirSync(projectPath);
    expect(files.length).toBeGreaterThan(0);
  });

  test('serve starts server and responds to /api then exits when killed', async () => {
    const port = await findFreePort();
    const host = '127.0.0.1';
  const args = ['serve', '--host', host, '--port', String(port), '--debug'];
    const proc = spawn(process.execPath, [cliPath, ...args], { cwd: rootDir, stdio: ['ignore', 'pipe', 'pipe'] });

    // wait for server log line
    await waitForOutput(proc, new RegExp(`Server on http:\/\/${host}:${port}`), 8000);

    // request /api and assert response
    const res = await httpGet(`http://${host}:${port}/api`);
    expect(res.status).toBe(200);
    const json = JSON.parse(res.body);
    expect(json).toMatchObject({ status: 'success' });

    // stop the server process
    proc.kill();
  });

  test('unknown command prints error and help', async () => {
    const res = await runCLI(['unknown']);
    expect(res.code).toBe(0); // CLI prints help after error then exits 0
    expect(res.stdout + res.stderr).toMatch(/Unknown command/);
    expect(res.stdout + res.stderr).toMatch(/Available commands:/);
  });
});
