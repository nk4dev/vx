'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '..');
const nodeBin = path.basename(process.execPath).startsWith('node')
  ? process.execPath
  : 'node';

const { buildTokenURI } = require('../dist/nft/mint');

describe('SDK ESM & TypeScript declaration outputs', () => {
  it('emits expected .d.ts files for root, browser, react, and core/config', () => {
    const expectedTypes = [
      'dist/index.d.ts',
      'dist/index.browser.d.ts',
      'dist/front_api/react.d.ts',
      'dist/core/config.d.ts',
    ];
    for (const rel of expectedTypes) {
      expect(fs.existsSync(path.join(rootDir, rel))).toBe(true);
    }
  });

  it('keeps browser ESM bundles free of Node.js built-ins', () => {
    const reactCode = fs.readFileSync(
      path.join(rootDir, 'dist/esm/front_api/react.mjs'),
      'utf-8'
    );
    const browserCode = fs.readFileSync(
      path.join(rootDir, 'dist/esm/index.browser.mjs'),
      'utf-8'
    );

    for (const code of [reactCode, browserCode]) {
      expect(code).not.toMatch(/\bnode:(fs|path|module|buffer)\b/);
      expect(code).not.toMatch(/from\s+["'](fs|path|buffer|node:fs|node:path|node:buffer)["']/);
      expect(code).not.toMatch(/require\(["'](fs|path|buffer|node:fs|node:path|node:buffer)["']\)/);
    }
  });

  it('produces identical buildTokenURI output with and without global Buffer (UTF-8)', () => {
    const metadata = {
      name: 'テスト NFT #1',
      description: 'ブラウザ互換チェック 🚀',
      image: 'https://example.com/1.png',
    };
    const withBuffer = buildTokenURI(metadata);
    const originalBuffer = global.Buffer;
    try {
      global.Buffer = undefined;
      const withoutBuffer = buildTokenURI(metadata);
      expect(withoutBuffer).toBe(withBuffer);
    } finally {
      global.Buffer = originalBuffer;
    }
  });

  it('supports native Node ESM named imports on root, browser, and react entries', () => {
    const script = `
      import vxDefault, {
        instance,
        vx,
        data,
        getRpcUrl,
        getBlockNumber,
        getBalance,
        getGasFees,
        payment,
        cloud,
        nft,
        mintNFT,
        quickMint,
        deployNFT,
        buildTokenURI,
        Payment,
        usePayment,
        usePaymentStatus,
        usePaymentDialog,
        useWallet,
      } from './dist/esm/index.mjs';
      import browserDefault, {
        mintNFT as browserMintNFT,
        deployNFT as browserDeployNFT,
        buildTokenURI as browserBuildTokenURI,
        payment as browserPayment,
        Payment as BrowserPayment,
        usePayment as browserUsePayment,
        usePaymentStatus as browserUsePaymentStatus,
        usePaymentDialog as browserUsePaymentDialog,
        useWallet as browserUseWallet,
      } from './dist/esm/index.browser.mjs';
      import {
        Payment as ReactPayment,
        usePayment as reactUsePayment,
        usePaymentStatus as reactUsePaymentStatus,
        usePaymentDialog as reactUsePaymentDialog,
        useWallet as reactUseWallet,
      } from './dist/esm/front_api/react.mjs';

      const assert = (cond, msg) => {
        if (!cond) throw new Error(msg);
      };

      assert(typeof vxDefault.getBalance === 'function', 'vxDefault.getBalance');
      assert(typeof instance === 'function', 'instance');
      assert(typeof vx.getGasFees === 'function', 'vx.getGasFees');
      assert(typeof data.getBlockNumber === 'function', 'data.getBlockNumber');
      assert(typeof getRpcUrl === 'function', 'getRpcUrl');
      assert(typeof getBlockNumber === 'function', 'getBlockNumber');
      assert(typeof getBalance === 'function', 'getBalance');
      assert(typeof getGasFees === 'function', 'getGasFees');
      assert(typeof payment.sendPayment === 'function', 'payment.sendPayment');
      assert(typeof cloud.syncProjectToCloud === 'function', 'cloud.syncProjectToCloud');
      assert(typeof nft.mintNFT === 'function', 'nft.mintNFT');
      for (const [name, fn] of Object.entries({
        mintNFT,
        quickMint,
        deployNFT,
        buildTokenURI,
        Payment,
        usePayment,
        usePaymentStatus,
        usePaymentDialog,
        useWallet,
      })) {
        assert(typeof fn === 'function', 'root ' + name);
      }

      assert(typeof browserDefault.getBalance === 'function', 'browserDefault.getBalance');
      assert(typeof browserPayment.sendPayment === 'function', 'browserPayment.sendPayment');
      for (const [name, fn] of Object.entries({
        browserMintNFT,
        browserDeployNFT,
        browserBuildTokenURI,
        BrowserPayment,
        browserUsePayment,
        browserUsePaymentStatus,
        browserUsePaymentDialog,
        browserUseWallet,
      })) {
        assert(typeof fn === 'function', 'browser ' + name);
      }

      for (const [name, fn] of Object.entries({
        ReactPayment,
        reactUsePayment,
        reactUsePaymentStatus,
        reactUsePaymentDialog,
        reactUseWallet,
      })) {
        assert(typeof fn === 'function', 'react ' + name);
      }
      console.log('SDK_ESM_OK');
    `;

    const out = execFileSync(nodeBin, ['--input-type=module', '-e', script], {
      cwd: rootDir,
      encoding: 'utf-8',
    });
    expect(out.trim()).toBe('SDK_ESM_OK');
  });
});
