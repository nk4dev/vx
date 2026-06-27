import React, { useState } from 'react';
import type {
  PaymentProps,
  PaymentResult,
  PaymentMode,
} from '../types/payment';

/* ------------------------------------------------------------------ */
/*  Internal styles (inline CSS objects — no external CSS dependency)  */
/* ------------------------------------------------------------------ */

const styles: Record<string, React.CSSProperties> = {
  root: {
    padding: '1.5rem',
    maxWidth: '28rem',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    background: '#ffffff',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
  },
  title: { fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' },
  row: { marginBottom: '0.75rem' },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    marginBottom: '0.25rem',
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '0.375rem 0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
    boxSizing: 'border-box' as const,
  },
  btn: {
    padding: '0.5rem 1rem',
    color: '#fff',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  success: { marginTop: '1rem', fontSize: '0.875rem', color: '#16a34a' },
  error: { marginTop: '1rem', fontSize: '0.875rem', color: '#dc2626' },
  txHash: {
    wordBreak: 'break-all' as const,
    background: '#f1f5f9',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    marginTop: '0.25rem',
  },
};

/* ------------------------------------------------------------------ */
/*  Payment helpers (same logic as use-payment hook)                   */
/* ------------------------------------------------------------------ */

async function payViaApi(
  to: string,
  amount: string,
  currency: string,
  apiEndpoint: string,
  rpcUrl?: string
): Promise<PaymentResult> {
  const resp = await fetch(apiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, amountEth: amount, rpcUrl, currency }),
  });
  const data = await resp.json();
  if (!resp.ok)
    throw new Error(data?.error ?? `Payment failed (${resp.status})`);
  return { txHash: data.txHash, receipt: data.receipt };
}

async function payViaWallet(
  to: string,
  amount: string
): Promise<PaymentResult> {
  const ethereum = (globalThis as Record<string, unknown>).ethereum as
    | {
        request: (a: {
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

  const accounts = (await ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[];
  if (!accounts?.length) throw new Error('No accounts available.');

  const valueHex =
    '0x' + BigInt(Math.floor(parseFloat(amount) * 1e18)).toString(16);

  const txHash = (await ethereum.request({
    method: 'eth_sendTransaction',
    params: [{ from: accounts[0], to, value: valueHex }],
  })) as string;

  return { txHash };
}

/* ------------------------------------------------------------------ */
/*  <Payment /> component                                              */
/* ------------------------------------------------------------------ */

/**
 * Declarative cryptocurrency payment component.
 *
 * @example
 * ```tsx
 * <Payment
 *   to="0x1234...abcd"
 *   amount="0.01"
 *   currency="ETH"
 *   mode="wallet"
 *   onSuccess={(r) => console.log(r.txHash)}
 *   onError={(e) => console.error(e)}
 * />
 * ```
 */
export function Payment(props: PaymentProps): React.ReactElement {
  const {
    to,
    amount: initialAmount,
    currency = 'ETH',
    mode: initialMode = 'api',
    apiEndpoint = '/api/pay',
    rpcUrl,
    onSuccess,
    onError,
    className,
  } = props;

  const [amount, setAmount] = useState(initialAmount);
  const [mode, setMode] = useState<PaymentMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res =
        mode === 'wallet'
          ? await payViaWallet(to, amount)
          : await payViaApi(to, amount, currency, apiEndpoint, rpcUrl);
      setResult(res);
      onSuccess?.(res);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      onError?.(err instanceof Error ? err : new Error(message));
    } finally {
      setLoading(false);
    }
  }

  /* -- Render via React.createElement (no JSX build step needed) -- */
  const h = React.createElement;

  return h(
    'div',
    { style: styles.root, className },

    h('h3', { style: styles.title }, `Send ${currency}`),

    h(
      'form',
      { onSubmit: handleSubmit },

      // Recipient (read-only display)
      h(
        'div',
        { style: styles.row },
        h('label', { style: styles.label }, 'Recipient'),
        h('input', {
          style: { ...styles.input, background: '#f9fafb' },
          value: to,
          readOnly: true,
        })
      ),

      // Amount
      h(
        'div',
        { style: styles.row },
        h('label', { style: styles.label }, `Amount (${currency})`),
        h('input', {
          style: styles.input,
          type: 'text',
          value: amount,
          onChange: (ev: React.ChangeEvent<HTMLInputElement>) =>
            setAmount(ev.target.value),
        })
      ),

      // Mode selector
      h(
        'div',
        { style: styles.row },
        h('label', { style: styles.label }, 'Payment Mode'),
        h(
          'select',
          {
            style: styles.input,
            value: mode,
            onChange: (ev: React.ChangeEvent<HTMLSelectElement>) =>
              setMode(ev.target.value as PaymentMode),
          },
          h('option', { value: 'api' }, 'Backend API'),
          h('option', { value: 'wallet' }, 'Browser Wallet (MetaMask)')
        )
      ),

      // Submit
      h(
        'div',
        { style: styles.row },
        h(
          'button',
          {
            type: 'submit',
            disabled: loading,
            style: loading
              ? { ...styles.btn, ...styles.btnDisabled }
              : styles.btn,
          },
          loading ? 'Sending…' : `Pay ${amount} ${currency}`
        )
      )
    ),

    // Success
    result &&
      h(
        'div',
        { style: styles.success },
        h('div', null, '✓ Payment sent'),
        h('div', { style: styles.txHash }, result.txHash)
      ),

    // Error
    error && h('div', { style: styles.error }, `Error: ${error}`)
  );
}

export default Payment;
