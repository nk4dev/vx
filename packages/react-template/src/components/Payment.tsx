import React, { useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Payment communication mode */
type PaymentMode = 'api' | 'wallet';

/** Result returned after a successful payment */
interface PaymentResult {
  txHash: string;
  receipt?: Record<string, unknown>;
}

/** Props for the <Payment /> component */
interface PaymentProps {
  to: string;
  amount: string;
  currency?: string;
  mode?: PaymentMode;
  /** Backend API endpoint used when mode is "api" (default: "/api/pay") */
  apiEndpoint?: string;
  rpcUrl?: string;
  onSuccess?: (result: PaymentResult) => void;
  onError?: (error: Error) => void;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Inline styles (no Tailwind / external CSS required)                */
/* ------------------------------------------------------------------ */

const s: Record<string, React.CSSProperties> = {
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
  label: { display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', color: '#374151' },
  input: {
    width: '100%',
    padding: '0.375rem 0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
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
  ok: { marginTop: '1rem', fontSize: '0.875rem', color: '#16a34a' },
  err: { marginTop: '1rem', fontSize: '0.875rem', color: '#dc2626' },
  hash: {
    wordBreak: 'break-all',
    background: '#f1f5f9',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    marginTop: '0.25rem',
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function payViaApi(
  to: string,
  amount: string,
  currency: string,
  endpoint: string,
  rpcUrl?: string,
): Promise<PaymentResult> {
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, amountEth: amount, rpcUrl, currency }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error ?? `Payment failed (${resp.status})`);
  return { txHash: data.txHash, receipt: data.receipt };
}

async function payViaWallet(to: string, amount: string): Promise<PaymentResult> {
  const ethereum = (window as any).ethereum as
    | { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> }
    | undefined;

  if (!ethereum) {
    throw new Error('No wallet provider found. Please install MetaMask or a compatible wallet.');
  }

  const accounts = (await ethereum.request({ method: 'eth_requestAccounts' })) as string[];
  if (!accounts?.length) throw new Error('No accounts available.');

  const valueHex = '0x' + BigInt(Math.floor(parseFloat(amount) * 1e18)).toString(16);

  const txHash = (await ethereum.request({
    method: 'eth_sendTransaction',
    params: [{ from: accounts[0], to, value: valueHex }],
  })) as string;

  return { txHash };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Declarative cryptocurrency payment component.
 *
 * Usage:
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
export function Payment({
  to,
  amount: initialAmount,
  currency = 'ETH',
  mode: initialMode = 'api',
  apiEndpoint = '/api/pay',
  rpcUrl,
  onSuccess,
  onError,
  className,
}: PaymentProps) {
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      onError?.(err instanceof Error ? err : new Error(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.root} className={className}>
      <h3 style={s.title}>Send {currency}</h3>

      <form onSubmit={handleSubmit}>
        {/* Recipient */}
        <div style={s.row}>
          <label style={s.label}>Recipient</label>
          <input style={{ ...s.input, background: '#f9fafb' }} value={to} readOnly />
        </div>

        {/* Amount */}
        <div style={s.row}>
          <label style={s.label}>Amount ({currency})</label>
          <input
            style={s.input}
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Mode */}
        <div style={s.row}>
          <label style={s.label}>Payment Mode</label>
          <select
            style={s.input}
            value={mode}
            onChange={(e) => setMode(e.target.value as PaymentMode)}
          >
            <option value="api">Backend API</option>
            <option value="wallet">Browser Wallet (MetaMask)</option>
          </select>
        </div>

        {/* Submit */}
        <div style={s.row}>
          <button
            type="submit"
            disabled={loading}
            style={loading ? { ...s.btn, ...s.btnDisabled } : s.btn}
          >
            {loading ? 'Sending…' : `Pay ${amount} ${currency}`}
          </button>
        </div>
      </form>

      {/* Success */}
      {result && (
        <div style={s.ok}>
          <div>✓ Payment sent</div>
          <div style={s.hash}>{result.txHash}</div>
        </div>
      )}

      {/* Error */}
      {error && <div style={s.err}>Error: {error}</div>}
    </div>
  );
}

export default Payment;
