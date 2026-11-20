'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '..');
const nodeBin = path.basename(process.execPath).startsWith('node')
  ? process.execPath
  : 'node';

describe('ESM & TypeScript declaration outputs', () => {
  it('emits expected .d.ts files for root and subpaths', () => {
    const expectedTypes = [
      'dist/index.d.ts',
      'dist/index.browser.d.ts',
      'dist/front_api/react.d.ts',
      'dist/front_api/vue.d.ts',
      'dist/core/config.d.ts',
    ];
    for (const rel of expectedTypes) {
      expect(fs.existsSync(path.join(rootDir, rel))).toBe(true);
    }
  });

  it('keeps browser ESM bundles free of Node.js built-ins and cross-framework imports', () => {
    const reactCode = fs.readFileSync(
      path.join(rootDir, 'dist/esm/front_api/react.mjs'),
      'utf-8'
    );
    const vueCode = fs.readFileSync(
      path.join(rootDir, 'dist/esm/front_api/vue.mjs'),
      'utf-8'
    );
    const browserCode = fs.readFileSync(
      path.join(rootDir, 'dist/esm/index.browser.mjs'),
      'utf-8'
    );

    for (const code of [reactCode, vueCode, browserCode]) {
      expect(code).not.toMatch(/\bnode:(fs|path|module)\b/);
      expect(code).not.toMatch(/from\s+["'](fs|path|node:fs|node:path)["']/);
      expect(code).not.toMatch(/require\(["'](fs|path|node:fs|node:path)["']\)/);
    }

    expect(vueCode).not.toMatch(/from\s+["']react["']/);
    expect(reactCode).not.toMatch(/from\s+["']vue["']/);
  });

  it('supports native Node ESM named imports on root, browser, react, and vue entries', () => {
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
        nft,
        mintNFT,
        Payment,
        SendPayment,
        ConnectWallet,
        GasTracker,
        NFTMinter,
        usePayment,
        usePaymentStatus,
        usePaymentDialog,
        useWallet,
        useGasTracker,
      } from './dist/esm/index.mjs';
      import browserDefault, {
        mintNFT as browserMintNFT,
        payment as browserPayment,
        Payment as BrowserPayment,
        SendPayment as BrowserSendPayment,
        ConnectWallet as BrowserConnectWallet,
        GasTracker as BrowserGasTracker,
        NFTMinter as BrowserNFTMinter,
        useWallet as browserUseWallet,
        useGasTracker as browserUseGasTracker,
      } from './dist/esm/index.browser.mjs';
      import {
        Payment as ReactPayment,
        SendPayment as ReactSendPayment,
        ConnectWallet as ReactConnectWallet,
        GasTracker as ReactGasTracker,
        NFTMinter as ReactNFTMinter,
        usePayment as reactUsePayment,
        usePaymentStatus as reactUsePaymentStatus,
        usePaymentDialog as reactUsePaymentDialog,
        useWallet as reactUseWallet,
        useGasTracker as reactUseGasTracker,
      } from './dist/esm/front_api/react.mjs';
      import {
        ConnectWallet as VueConnectWallet,
        GasTracker as VueGasTracker,
        NFTMinter as VueNFTMinter,
        SendPayment as VueSendPayment,
        useWallet as vueUseWallet,
        useGasTracker as vueUseGasTracker,
      } from './dist/esm/front_api/vue.mjs';

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
      assert(typeof nft.mintNFT === 'function', 'nft.mintNFT');
      assert(typeof mintNFT === 'function', 'mintNFT');
      for (const [name, fn] of Object.entries({
        Payment,
        SendPayment,
        ConnectWallet,
        GasTracker,
        NFTMinter,
        usePayment,
        usePaymentStatus,
        usePaymentDialog,
        useWallet,
        useGasTracker,
      })) {
        assert(typeof fn === 'function', 'root ' + name);
      }

      assert(typeof browserDefault.getBalance === 'function', 'browserDefault.getBalance');
      assert(typeof browserMintNFT === 'function', 'browserMintNFT');
      assert(typeof browserPayment.sendPayment === 'function', 'browserPayment.sendPayment');
      for (const [name, fn] of Object.entries({
        BrowserPayment,
        BrowserSendPayment,
        BrowserConnectWallet,
        BrowserGasTracker,
        BrowserNFTMinter,
        browserUseWallet,
        browserUseGasTracker,
      })) {
        assert(typeof fn === 'function', 'browser ' + name);
      }

      for (const [name, fn] of Object.entries({
        ReactPayment,
        ReactSendPayment,
        ReactConnectWallet,
        ReactGasTracker,
        ReactNFTMinter,
        reactUsePayment,
        reactUsePaymentStatus,
        reactUsePaymentDialog,
        reactUseWallet,
        reactUseGasTracker,
      })) {
        assert(typeof fn === 'function', 'react ' + name);
      }

      for (const [name, comp] of Object.entries({
        VueConnectWallet,
        VueGasTracker,
        VueNFTMinter,
        VueSendPayment,
      })) {
        assert(typeof comp === 'object' && comp !== null, 'vue ' + name);
      }
      assert(typeof vueUseWallet === 'function', 'vueUseWallet');
      assert(typeof vueUseGasTracker === 'function', 'vueUseGasTracker');
      console.log('ESM_OK');
    `;

    const out = execFileSync(nodeBin, ['--input-type=module', '-e', script], {
      cwd: rootDir,
      encoding: 'utf-8',
    });
    expect(out.trim()).toBe('ESM_OK');
  });
});
