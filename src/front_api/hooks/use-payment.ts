import { useState, useCallback } from 'react';
import type {
  PaymentOptions,
  PaymentResult,
  PaymentState,
} from '../../types/payment';
import { ethToWeiHex } from '../amount';

/** Parse an API response body, tolerating empty / non-JSON bodies. */
async function readJson(resp: Response): Promise<{
  error?: string;
  txHash?: string;
  receipt?: Record<string, unknown>;
}> {
  const text = await resp.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

/**
 * Send a payment via the backend API (`/api/pay` by default).
 */
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
  const data = await readJson(resp);
  if (!resp.ok) {
    throw new Error(
      data.error ?? `Payment API request failed (${resp.status})`
    );
  }
  if (!data.txHash) throw new Error('Payment API returned no txHash');
  return { txHash: data.txHash, receipt: data.receipt };
}

/**
 * Send a payment directly through the browser wallet (MetaMask etc.)
 * using the EIP-1193 provider exposed at `window.ethereum`.
 */
async function payViaWallet(opts: PaymentOptions): Promise<PaymentResult> {
  const ethereum = (globalThis as Record<string, unknown>).ethereum as
    | {
        request: (args: {
          method: string;
          params?: unknown[];
        }) => Promise<unknown>;
      }
    | undefined;

  if (!ethereum) {
    throw new Error(
      'No wallet provider found. Please install MetaMask or a compatible wallet.'
    );
  }

  // Request account access
  const accounts = (await ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[];
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts available. Please unlock your wallet.');
  }

  const from = accounts[0];

  const valueHex = ethToWeiHex(opts.amount);

  const txHash = (await ethereum.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: opts.to, value: valueHex }],
  })) as string;

  return { txHash };
}

/**
 * React hook that returns an async function to execute a cryptocurrency payment.
 *
 * @example
 * ```tsx
 * const pay = usePayment();
 * await pay({ to: '0x...', amount: '0.01', mode: 'wallet' });
 * ```
 */
export function usePayment() {
  const [state, setState] = useState<PaymentState>({ status: 'idle' });

  const pay = useCallback(
    async (opts: PaymentOptions): Promise<PaymentResult> => {
      setState({ status: 'pending' });
      try {
        const mode = opts.mode ?? 'api';
        const result =
          mode === 'wallet' ? await payViaWallet(opts) : await payViaApi(opts);
        setState({
          status: 'success',
          txHash: result.txHash,
          receipt: result.receipt,
        });
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ status: 'error', error });
        throw error;
      }
    },
    []
  );

  return { pay, state };
}
