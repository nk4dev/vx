import { useState, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PaymentResult {
  txHash: string;
  receipt?: Record<string, unknown>;
}

type PaymentState =
  | { status: 'idle' }
  | { status: 'pending'; txHash?: string }
  | { status: 'success'; txHash: string; receipt?: Record<string, unknown> }
  | { status: 'error'; error: Error };

/* ------------------------------------------------------------------ */
/*  usePaymentStatus                                                   */
/* ------------------------------------------------------------------ */

/**
 * Hook that tracks the status of the most recent payment transaction.
 *
 * @example
 * ```tsx
 * const { status, setSuccess, setError, reset } = usePaymentStatus();
 * ```
 */
export function usePaymentStatus() {
  const [state, setState] = useState<PaymentState>({ status: 'idle' });

  const setPending = useCallback((txHash?: string) => {
    setState({ status: 'pending', txHash });
  }, []);

  const setSuccess = useCallback((result: PaymentResult) => {
    setState({ status: 'success', txHash: result.txHash, receipt: result.receipt });
  }, []);

  const setError = useCallback((error: Error) => {
    setState({ status: 'error', error });
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return { ...state, setPending, setSuccess, setError, reset };
}
