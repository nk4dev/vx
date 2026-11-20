import * as data from './core/data';
import * as payment from './payment/index';
import { buildTokenURI, deployNFT, mintNFT } from './nft/mint';

const nft = { mintNFT, deployNFT, buildTokenURI };

export { data as vx, data };
export { getBlockNumber, getBalance, getGasFees } from './core/data';
export { payment };
export { sendPayment } from './payment/index';
export { nft };
export { mintNFT, deployNFT, buildTokenURI } from './nft/mint';
export {
  Payment,
  usePayment,
  usePaymentStatus,
  usePaymentDialog,
  useWallet,
  sendETHRequestQuery,
} from './front_api/react';

const vx = {
  data,
  getBlockNumber: data.getBlockNumber,
  getBalance: data.getBalance,
  getGasFees: data.getGasFees,
  payment,
  nft,
  mintNFT,
  deployNFT,
};

export default vx;

export type { GasFees } from './core/data';
export type {
  MintNFTOptions,
  MintNFTResult,
  DeployNFTOptions,
  DeployNFTResult,
  NFTMetadata,
  QuickMintOptions,
  QuickMintResult,
} from './types/nft';
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
