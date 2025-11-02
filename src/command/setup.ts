import * as fs from 'fs';
import * as path from 'path';

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function copyRecursiveSync(src: string, dest: string) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, entry), path.join(dest, entry));
    }
  } else if (stat.isFile()) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

function upsertJSON(filePath: string, updater: (obj: any) => any) {
  let current: any = {};
  if (fs.existsSync(filePath)) {
    try { current = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { current = {}; }
  }
  const next = updater(current) ?? current;
  fs.writeFileSync(filePath, JSON.stringify(next, null, 2));
}

async function setupHardhat() {
  const cwd = process.cwd();
  const pkgPath = path.join(cwd, 'package.json');

  // 1) add scripts + devDependencies
  upsertJSON(pkgPath, (pkg) => {
    pkg.scripts = pkg.scripts || {};
    pkg.scripts.hh = pkg.scripts.hh || 'hardhat';
    pkg.scripts['hh:compile'] = pkg.scripts['hh:compile'] || 'hardhat compile';
    pkg.scripts['hh:test'] = pkg.scripts['hh:test'] || 'hardhat test';
    pkg.scripts['hh:node'] = pkg.scripts['hh:node'] || 'hardhat node';
    pkg.scripts['hh:deploy'] = pkg.scripts['hh:deploy'] || 'hardhat run scripts/deploy.ts --network localhost';

    pkg.devDependencies = pkg.devDependencies || {};
    pkg.devDependencies.hardhat = pkg.devDependencies.hardhat || '^2.22.0';
    pkg.devDependencies['@nomicfoundation/hardhat-toolbox'] = pkg.devDependencies['@nomicfoundation/hardhat-toolbox'] || '^3.0.0';
    return pkg;
  });

  // 2) copy template files
  const candidates = [
    path.resolve(__dirname, '../../packages/hardhat'),
    path.resolve(__dirname, '../../../packages/hardhat'),
    path.resolve(cwd, 'packages/hardhat'),
  ];
  const templateRoot = candidates.find((p) => fs.existsSync(p));
  if (!templateRoot) {
    console.warn('Hardhat template not found. Skipping file copy.');
  } else {
    const files = [
      ['hardhat.config.ts', 'hardhat.config.ts'],
      ['contracts', 'contracts'],
      ['scripts', 'scripts'],
    ];
    for (const [srcRel, destRel] of files) {
      const src = path.join(templateRoot, srcRel);
      const dest = path.join(cwd, destRel);
      if (fs.existsSync(src)) copyRecursiveSync(src, dest);
    }
  }

  console.log('Hardhat setup complete. Next steps:');
  console.log('  1) Install dev deps: npm install -D hardhat @nomicfoundation/hardhat-toolbox');
  console.log('  2) Try: npm run hh:node | npm run hh:compile | npm run hh:deploy');
}

export async function setup(target: string) {
  switch (target) {
    case 'hardhat':
      await setupHardhat();
      break;
    case 'react':
      await setupReact();
      break;
    default:
      throw new Error(`Unknown setup target: ${target}`);
  }
}

// React template setup
async function setupReact() {
  const cwd = process.cwd();
  const pkgPath = path.join(cwd, 'package.json');

  // 1) add scripts + devDependencies
  upsertJSON(pkgPath, (pkg) => {
    pkg.scripts = pkg.scripts || {};
    pkg.scripts.dev = pkg.scripts.dev || 'vite';
    pkg.scripts.build = pkg.scripts.build || 'vite build';
    pkg.scripts.preview = pkg.scripts.preview || 'vite preview';

    pkg.devDependencies = pkg.devDependencies || {};
    pkg.devDependencies.vite = pkg.devDependencies.vite || '^5.0.0';
    pkg.devDependencies.typescript = pkg.devDependencies.typescript || '^5.0.0';
    pkg.devDependencies.tailwindcss = pkg.devDependencies.tailwindcss || '^3.4.0';
    pkg.devDependencies.postcss = pkg.devDependencies.postcss || '^8.0.0';
    pkg.devDependencies.autoprefixer = pkg.devDependencies.autoprefixer || '^10.0.0';

    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies.react = pkg.dependencies.react || '^18.2.0';
    pkg.dependencies['react-dom'] = pkg.dependencies['react-dom'] || '^18.2.0';
    pkg.dependencies['@nk4dev/vx'] = pkg.dependencies['@nk4dev/vx'] || '0.0.18';

    return pkg;
  });

  // 2) copy template files
  const candidates = [
    path.resolve(__dirname, '../../packages/react-template'),
    path.resolve(__dirname, '../../../packages/react-template'),
    path.resolve(cwd, 'packages/react-template'),
  ];
  const templateRoot = candidates.find((p) => fs.existsSync(p));
  if (!templateRoot) {
    console.warn('React template not found. Skipping file copy.');
  } else {
    // copy entire template
    if (fs.existsSync(templateRoot)) copyRecursiveSync(templateRoot, cwd);
  }

  console.log('React setup complete. Next steps:');
  console.log('  1) Install dependencies: npm install');
  console.log('  2) Start dev server: npm run dev');
}
