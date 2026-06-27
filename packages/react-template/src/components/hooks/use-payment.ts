import { useState, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PaymentMode = 'api' | 'wallet';

interface PaymentResult {
  txHash: string;
  receipt?: Record<string, unknown>;
}

interface PaymentOptions {
  to: string;
  amount: string;
  currency?: string;
  mode?: PaymentMode;
  apiEndpoint?: string;
  rpcUrl?: string;
}

type PaymentState =
  | { status: 'idle' }
  | { status: 'pending'; txHash?: string }
  | { status: 'success'; txHash: string; receipt?: Record<string, unknown> }
  | { status: 'error'; error: Error };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function payViaApi(opts: PaymentOptions): Promise<PaymentResult> {
  const endpoint = opts.apiEndpoint ?? '/api/pay';
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: opts.to,
      amountEth: opts.amount,
      rpcUrl: opts.rpcUrl,
      currency: opts.currency ?? 'ETH',
    }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error ?? `Payment failed (${resp.status})`);
  return { txHash: data.txHash, receipt: data.receipt };
}

async function payViaWallet(opts: PaymentOptions): Promise<PaymentResult> {
  const ethereum = (window as any).ethereum as
    | { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> }
    | undefined;

  if (!ethereum) {
    throw new Error('No wallet provider found. Please install MetaMask or a compatible wallet.');
  }

  const accounts = (await ethereum.request({ method: 'eth_requestAccounts' })) as string[];
  if (!accounts?.length) throw new Error('No accounts available.');

  const valueHex = '0x' + BigInt(Math.floor(parseFloat(opts.amount) * 1e18)).toString(16);

  const txHash = (await ethereum.request({
    method: 'eth_sendTransaction',
    params: [{ from: accounts[0], to: opts.to, value: valueHex }],
  })) as string;

  return { txHash };
}

/* ------------------------------------------------------------------ */
/*  usePayment                                                         */
/* ------------------------------------------------------------------ */

/**
 * Hook that returns an async function to execute a cryptocurrency payment.
 *
 * @example
 * ```tsx
 * const { pay, state } = usePayment();
 * await pay({ to: '0x...', amount: '0.01', mode: 'wallet' });
 * ```
 */
export function usePayment() {
  const [state, setState] = useState<PaymentState>({ status: 'idle' });

  const pay = useCallback(async (opts: PaymentOptions): Promise<PaymentResult> => {
    setState({ status: 'pending' });
    try {
      const mode = opts.mode ?? 'api';
      const result = mode === 'wallet' ? await payViaWallet(opts) : await payViaApi(opts);
      setState({ status: 'success', txHash: result.txHash, receipt: result.receipt });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState({ status: 'error', error });
      throw error;
    }
  }, []);

  return { pay, state };
}
