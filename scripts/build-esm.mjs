import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bunBin = path.basename(process.execPath).startsWith('bun')
  ? process.execPath
  : 'bun';

const targets = [
  {
    entry: 'src/front_api/react.ts',
    outfile: 'dist/esm/front_api/react.mjs',
    target: 'browser',
  },
  {
    entry: 'src/index.browser.ts',
    outfile: 'dist/esm/index.browser.mjs',
    target: 'browser',
  },
  {
    entry: 'src/core/config.ts',
    outfile: 'dist/esm/core/config.mjs',
    target: 'node',
  },
];

for (const item of targets) {
  const outPath = path.join(rootDir, item.outfile);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  execFileSync(
    bunBin,
    [
      'build',
      path.join(rootDir, item.entry),
      `--target=${item.target}`,
      '--format=esm',
      '--packages=external',
      `--outfile=${outPath}`,
    ],
    { cwd: rootDir, stdio: 'inherit' }
  );
}

const esmRootWrapper = `import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const cjs = require('../index.js');

export const instance = cjs.instance;
export const vx = cjs.vx;
export const data = cjs.data;
export const getRpcUrl = cjs.getRpcUrl;
export const getBlockNumber = cjs.getBlockNumber;
export const getBalance = cjs.getBalance;
export const getGasFees = cjs.getGasFees;
export const payment = cjs.payment;
export const cloud = cjs.cloud;
export const nft = cjs.nft;
export const mintNFT = cjs.mintNFT;
export const quickMint = cjs.quickMint;
export const deployNFT = cjs.deployNFT;
export const buildTokenURI = cjs.buildTokenURI;
export default cjs.default;

let reactApi = null;
let reactLoadError = null;
try {
  reactApi = require('../front_api/react.js');
} catch (err) {
  reactLoadError = err;
}

function makeReactExport(name) {
  if (reactApi) return reactApi[name];
  return function missingReact() {
    throw reactLoadError;
  };
}

export const Payment = makeReactExport('Payment');
export const usePayment = makeReactExport('usePayment');
export const usePaymentStatus = makeReactExport('usePaymentStatus');
export const usePaymentDialog = makeReactExport('usePaymentDialog');
export const useWallet = makeReactExport('useWallet');
`;

const esmIndexPath = path.join(rootDir, 'dist/esm/index.mjs');
fs.mkdirSync(path.dirname(esmIndexPath), { recursive: true });
fs.writeFileSync(esmIndexPath, esmRootWrapper, 'utf-8');
