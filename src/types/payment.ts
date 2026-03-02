/**
 * Shared payment types used by React components, hooks, and the core SDK.
 */

/** Payment communication mode */
export type PaymentMode = 'api' | 'wallet';

/** Transaction lifecycle status */
export type PaymentStatus = 'idle' | 'pending' | 'success' | 'error';

/** Result returned after a successful payment */
export interface PaymentResult {
  txHash: string;
  receipt?: Record<string, unknown>;
}

/** Options accepted by the usePayment hook and Payment component */
export interface PaymentOptions {
  to: string;
  amount: string;
  currency?: string;
  mode?: PaymentMode;
  /** Backend API endpoint used when mode is "api" (default: "/api/pay") */
  apiEndpoint?: string;
  rpcUrl?: string;
  privateKey?: string;
}

/** Props for the <Payment /> React component */
export interface PaymentProps {
  to: string;
  amount: string;
  currency?: string;
  mode?: PaymentMode;
  apiEndpoint?: string;
  rpcUrl?: string;
  onSuccess?: (result: PaymentResult) => void;
  onError?: (error: Error) => void;
  /** Optional CSS class name applied to the root container */
  className?: string;
}

/** State shape returned by usePaymentStatus */
export type PaymentState =
  | { status: 'idle' }
  | { status: 'pending'; txHash?: string }
  | { status: 'success'; txHash: string; receipt?: Record<string, unknown> }
  | { status: 'error'; error: Error };

/** Dialog control shape returned by usePaymentDialog */
export interface PaymentDialogControl {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}
