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

// React component & hooks
export { Payment } from './payment';
export { usePayment } from './hooks/use-payment';
export { usePaymentStatus } from './hooks/use-payment-status';
export { usePaymentDialog } from './hooks/use-payment-dialog';
export { useWallet } from './hooks/use-wallet';

// Payment types
export type {
  PaymentMode,
  PaymentStatus,
  PaymentResult,
  PaymentOptions,
  PaymentProps,
  PaymentState,
  PaymentDialogControl,
} from '../types/payment';

// Wallet types
export type {
  Eip1193Provider,
  WalletStatus,
  WalletState,
  UseWalletOptions,
} from '../types/wallet';
