import instance from './core/contract';
import * as data from './core/data';
import { getRpcUrl } from './core/contract';
import * as payment from './payment/index';
import * as nft from './nft/index';

// owner by @nk4dev
// this file is vx sdk entry point.
// Keep named exports for backward compatibility

export { instance };
export { data as vx };

// Default export for `import vx from "..."` usage
const vx = {
  // high-level helpers
  getRpcUrl,
  // data helpers (also exposed flat for convenience)
  data,
  getBlockNumber: data.getBlockNumber,
  getBalance: data.getBalance,
  getGasFees: data.getGasFees,
  // payment API
  payment,
  // NFT API
  nft,
  mintNFT: nft.mintNFT,
  quickMint: nft.quickMint,
  deployNFT: nft.deployNFT,
  // legacy
  instance,
};

export default vx;
export { payment };
export { mintNFT, quickMint, deployNFT, buildTokenURI } from './nft/index';
export type {
  MintNFTOptions,
  MintNFTResult,
  DeployNFTOptions,
  DeployNFTResult,
  NFTMetadata,
  QuickMintOptions,
  QuickMintResult,
} from './types/nft';

// React component & hooks. `react` is an optional peer dependency, so these
// are declared here for typing only and attached to module.exports as lazy
// getters below — `require('vx3')` must work without React installed.
// `vx3/react` exposes the same API eagerly.
type ReactApi = typeof import('./front_api/react');
export declare const Payment: ReactApi['Payment'];
export declare const usePayment: ReactApi['usePayment'];
export declare const usePaymentStatus: ReactApi['usePaymentStatus'];
export declare const usePaymentDialog: ReactApi['usePaymentDialog'];
export declare const useWallet: ReactApi['useWallet'];
const REACT_EXPORTS = [
  'Payment',
  'usePayment',
  'usePaymentStatus',
  'usePaymentDialog',
  'useWallet',
] as const;
export type { GasFees } from './core/data';
export type {
  Eip1193Provider,
  WalletStatus,
  WalletState,
  UseWalletOptions,
} from './types/wallet';
export type {
  PaymentMode,
  PaymentStatus,
  PaymentResult,
  PaymentOptions,
  PaymentProps,
  PaymentState,
  PaymentDialogControl,
} from './types/payment';

// CJS interop: the build targets CommonJS, so merge the named exports onto the
// default-export object and re-expose them as module.exports. This lets both
// `require('vx3')` and `import vx from 'vx3'` resolve to the same usable object.
declare const module: NodeModule | undefined;
try {
  if (typeof module !== 'undefined' && module?.exports) {
    const merged = Object.assign(
      {},
      module.exports,
      { default: vx, instance, vx: data },
      vx
    );
    for (const name of REACT_EXPORTS) {
      Object.defineProperty(merged, name, {
        enumerable: true,
        configurable: true,
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        get: () => (require('./front_api/react') as ReactApi)[name],
      });
    }
    module.exports = merged;
  }
} catch {
  /* pure ESM context — nothing to merge */
}
