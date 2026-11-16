import { getRpcUrl } from '../core/contract';

interface SendETHRequest {
  to: string;
  from: string;
  amountEth: string;
  rpcUrl?: string;
  privateKey?: string;
}

export function sendETHRequestQuery({
  to,
  from,
  amountEth,
  rpcUrl,
  privateKey,
}: SendETHRequest) {
  return { to, from, amountEth, rpcUrl, privateKey };
}

// React UI Components
export { Payment } from './payment';
export { SendPayment } from './components/SendPayment';
export { ConnectWallet } from './components/ConnectWallet';
export { GasTracker } from './components/GasTracker';
export { NFTMinter } from './components/NFTMinter';

// React Hooks
export { usePayment } from './hooks/use-payment';
export { usePaymentStatus } from './hooks/use-payment-status';
export { usePaymentDialog } from './hooks/use-payment-dialog';
export { useWallet } from './hooks/use-wallet';
export { useGasTracker } from './hooks/use-gas-tracker';

// Types
export type {
  PaymentMode,
  PaymentStatus,
  PaymentResult,
  PaymentOptions,
  PaymentProps,
  PaymentState,
  PaymentDialogControl,
} from '../types/payment';

export type {
  WalletState,
  ConnectWalletProps,
  GasFeeData,
  GasTrackerProps,
  NFTMinterProps,
} from '../types/front_components';
