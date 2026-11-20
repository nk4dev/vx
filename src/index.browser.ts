import * as data from './core/data';
import * as payment from './payment/index';
import * as nft from './nft/index';

export { data as vx, data };
export { getBlockNumber, getBalance, getGasFees } from './core/data';
export { payment };
export { sendPayment } from './payment/index';
export { nft };
export { mintNFT } from './nft/index';
export {
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
  sendETHRequestQuery,
} from './front_api/react';

const vx = {
  data,
  getBlockNumber: data.getBlockNumber,
  getBalance: data.getBalance,
  getGasFees: data.getGasFees,
  payment,
  nft,
  mintNFT: nft.mintNFT,
};

export default vx;

export type { GasFees } from './core/data';
export type { MintNFTOptions, MintNFTResult } from './types/nft';
export type {
  Eip1193Provider,
  WalletStatus,
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
export type {
  WalletState,
  ConnectWalletProps,
  GasFeeData,
  GasTrackerProps,
  NFTMinterProps,
} from './types/front_components';
