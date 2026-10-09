'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CLI = path.resolve(__dirname, '../../dist/cli.js');
const config = require('../../dist/config');

function run(cwd, ...args) {
  // `input: ''` closes stdin so commands that don't call process.exit() still end.
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: 'utf-8',
    input: '',
    timeout: 20000,
  });
}

function readPkg(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
}

let tmp;
beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vx-generate-'));
});
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

describe('SDK dependency constants', () => {
  it('defaults generated projects to the latest published release', () => {
    expect(config.SDK_PACKAGE_NAME).toBe('vx3');
    expect(config.SDK_DEPENDENCY_RANGE).toBe('latest');
  });

  it('does not derive the dependency from the local (possibly unpublished) version', () => {
    expect(config.SDK_VERSION).toBe(require('../../package.json').version);
    expect(config.SDK_DEPENDENCY_RANGE).not.toContain(config.SDK_VERSION);
  });
});

describe('vx3 generate', () => {
  it('lists the available templates', () => {
    const r = run(tmp, 'generate', 'list');
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/template\/react/);
    expect(r.stdout).toMatch(/template\/vue/);
  });

  it('documents --sdk-version in its help', () => {
    const r = run(tmp, 'generate', '--help');
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/--sdk-version <version>/);
  });

  it('template/react depends on vx3@latest by default', () => {
    const out = path.join(tmp, 'app');
    const r = run(tmp, 'generate', 'template/react', out);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/Using vx3 dependency: latest/);

    const pkg = readPkg(out);
    expect(pkg.dependencies.vx3).toBe('latest');
    expect(pkg.dependencies.react).toBeDefined();
    expect(pkg.dependencies['react-dom']).toBeDefined();
    expect(pkg.dependencies.ethers).toBeUndefined();
    expect(pkg.name).toBe('app');
    expect(pkg.private).toBe(true);
    expect(fs.existsSync(path.join(out, 'src'))).toBe(true);
  });

  it('template/vue depends on vx3@latest by default and keeps ethers', () => {
    const out = path.join(tmp, 'vue-app');
    const r = run(tmp, 'generate', 'template/vue', out);
    expect(r.status).toBe(0);

    const pkg = readPkg(out);
    expect(pkg.dependencies.vx3).toBe('latest');
    expect(pkg.dependencies.vue).toBeDefined();
    expect(pkg.dependencies.ethers).toBeDefined();
  });

  it('generates into the current directory when no target is given', () => {
    const r = run(tmp, 'generate', 'template/react');
    expect(r.status).toBe(0);
    expect(readPkg(tmp).dependencies.vx3).toBe('latest');
  });

  it('--sdk-version <version> pins the dependency explicitly', () => {
    const out = path.join(tmp, 'app');
    const r = run(tmp, 'generate', 'template/react', out, '--sdk-version', '^0.1.1');
    expect(r.status).toBe(0);
    expect(readPkg(out).dependencies.vx3).toBe('^0.1.1');
  });

  it('--sdk-version=<version> is accepted too', () => {
    const out = path.join(tmp, 'app');
    const r = run(tmp, 'generate', 'template/react', out, '--sdk-version=0.1.1');
    expect(r.status).toBe(0);
    expect(readPkg(out).dependencies.vx3).toBe('0.1.1');
  });

  it('accepts --sdk-version before the target directory', () => {
    const out = path.join(tmp, 'app');
    const r = run(tmp, 'generate', 'template/react', '--sdk-version', '0.1.1', out);
    expect(r.status).toBe(0);
    expect(readPkg(out).dependencies.vx3).toBe('0.1.1');
  });

  it('fails when --sdk-version has no value', () => {
    const out = path.join(tmp, 'app');
    const r = run(tmp, 'generate', 'template/react', out, '--sdk-version');
    expect(r.status).not.toBe(0);
    expect(r.stdout + r.stderr).toMatch(/--sdk-version requires a value/);
  });

  it('--debug links the local SDK with a file: dependency', () => {
    const out = path.join(tmp, 'app');
    const r = run(tmp, 'generate', 'template/react', out, '--debug');
    expect(r.status).toBe(0);
    expect(readPkg(out).dependencies.vx3).toMatch(/^file:/);
  });

  it('--sdk-version takes precedence over --debug', () => {
    const out = path.join(tmp, 'app');
    const r = run(tmp, 'generate', 'template/react', out, '--debug', '--sdk-version', '0.1.1');
    expect(r.status).toBe(0);
    expect(readPkg(out).dependencies.vx3).toBe('0.1.1');
  });

  it('merges into an existing package.json without clobbering it', () => {
    fs.writeFileSync(
      path.join(tmp, 'package.json'),
      JSON.stringify({
        name: 'keep-me',
        scripts: { dev: 'custom-dev' },
        dependencies: { react: '^18.0.0', vx3: '^0.0.19' },
      })
    );
    const r = run(tmp, 'generate', 'template/react');
    expect(r.status).toBe(0);

    const pkg = readPkg(tmp);
    expect(pkg.name).toBe('keep-me');
    expect(pkg.scripts.dev).toBe('custom-dev');
    expect(pkg.scripts.build).toBeDefined();
    expect(pkg.dependencies.react).toBe('^18.0.0');
    // generate always rewrites the SDK dependency
    expect(pkg.dependencies.vx3).toBe('latest');
  });

  it('rejects an unknown template', () => {
    const r = run(tmp, 'generate', 'template/svelte');
    expect(r.status).not.toBe(0);
    expect(r.stdout + r.stderr).toMatch(/Unknown template: svelte/);
  });

  it('rejects an unknown subcommand', () => {
    const r = run(tmp, 'generate', 'bogus');
    expect(r.status).not.toBe(0);
    expect(r.stdout + r.stderr).toMatch(/Unknown generate subcommand/);
  });
});

describe('vx3 setup react', () => {
  it('adds vx3@latest when the project has no SDK dependency', () => {
    const r = run(tmp, 'setup', 'react');
    expect(r.status).toBe(0);

    const pkg = readPkg(tmp);
    expect(pkg.dependencies.vx3).toBe('latest');
    expect(pkg.dependencies.react).toBeDefined();
    expect(pkg.scripts.dev).toBe('vite');
  });

  it('keeps an existing vx3 version when --sdk-version is omitted', () => {
    fs.writeFileSync(
      path.join(tmp, 'package.json'),
      JSON.stringify({ name: 'x', dependencies: { vx3: '^0.1.1' } })
    );
    const r = run(tmp, 'setup', 'react');
    expect(r.status).toBe(0);
    expect(readPkg(tmp).dependencies.vx3).toBe('^0.1.1');
  });

  it('--sdk-version overrides an existing vx3 version', () => {
    fs.writeFileSync(
      path.join(tmp, 'package.json'),
      JSON.stringify({ name: 'x', dependencies: { vx3: '^0.0.19' } })
    );
    const r = run(tmp, 'setup', 'react', '--sdk-version', '0.1.1');
    expect(r.status).toBe(0);
    expect(readPkg(tmp).dependencies.vx3).toBe('0.1.1');
  });

  it('lists --sdk-version in the setup help', () => {
    const r = run(tmp, 'setup', '--help');
    expect(r.stdout + r.stderr).toMatch(/--sdk-version <version>/);
  });

  it('rejects an unknown setup target', () => {
    const r = run(tmp, 'setup', 'svelte');
    expect(r.status).not.toBe(0);
    expect(r.stdout + r.stderr).toMatch(/Unknown setup target/);
    expect(fs.existsSync(path.join(tmp, 'package.json'))).toBe(false);
  });
});
