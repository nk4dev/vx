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
    default:
      throw new Error(`Unknown setup target: ${target}`);
  }
}
