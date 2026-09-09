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
  // legacy
  instance,
};

export default vx;
export { payment };
export { mintNFT } from './nft/index';
export type { MintNFTOptions, MintNFTResult } from './types/nft';

// React component, hooks & types
export { Payment } from './front_api/payment';
export { usePayment } from './front_api/hooks/use-payment';
export { usePaymentStatus } from './front_api/hooks/use-payment-status';
export { usePaymentDialog } from './front_api/hooks/use-payment-dialog';
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
    module.exports = Object.assign(
      {},
      { default: vx, instance, vx: data },
      vx
    );
  }
} catch {
  /* pure ESM context — nothing to merge */
}
