import React from 'react';
import { useWallet } from './hooks';

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum Mainnet',
  11155111: 'Sepolia',
  137: 'Polygon',
  8453: 'Base',
  31337: 'Hardhat (local)',
};

const styles: Record<string, React.CSSProperties> = {
  root: {
    padding: '1.5rem',
    marginBottom: '1.5rem',
    background: '#ffffff',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
  },
  title: { fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' },
  row: { marginBottom: '0.5rem', fontSize: '0.875rem' },
  mono: { fontFamily: 'monospace', wordBreak: 'break-all' },
  actions: { display: 'flex', gap: '0.5rem', marginTop: '1rem' },
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
  btnSecondary: { backgroundColor: '#6b7280' },
  error: { marginTop: '1rem', fontSize: '0.875rem', color: '#dc2626' },
};

function formatEth(wei: bigint): string {
  const whole = wei / 10n ** 18n;
  const frac = (wei % 10n ** 18n).toString().padStart(18, '0').slice(0, 4);
  return `${whole}.${frac}`;
}

function shorten(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Sample: connect a browser wallet with the VX3 `useWallet` hook.
 */
export function WalletConnect() {
  const wallet = useWallet();

  if (wallet.status === 'unavailable') {
    return (
      <div style={styles.root}>
        <h3 style={styles.title}>Wallet</h3>
        <p style={styles.row}>
          No wallet detected. Install{' '}
          <a href="https://metamask.io" target="_blank" rel="noreferrer">
            MetaMask
          </a>{' '}
          or another EIP-1193 wallet.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <h3 style={styles.title}>Wallet</h3>

      {wallet.status === 'connected' && wallet.address ? (
        <>
          <div style={styles.row}>
            Address:{' '}
            <span style={styles.mono} title={wallet.address}>
              {shorten(wallet.address)}
            </span>
          </div>
          <div style={styles.row}>
            Network:{' '}
            {wallet.chainId !== null
              ? `${CHAIN_NAMES[wallet.chainId] ?? 'Unknown'} (${wallet.chainId})`
              : '—'}
          </div>
          <div style={styles.row}>
            Balance:{' '}
            {wallet.balanceWei !== null
              ? `${formatEth(wallet.balanceWei)} ETH`
              : '—'}
          </div>

          <div style={styles.actions}>
            <button style={styles.btn} onClick={() => wallet.refreshBalance()}>
              Refresh
            </button>
            {wallet.chainId !== 11155111 && (
              <button
                style={styles.btn}
                onClick={() => wallet.switchChain(11155111).catch(() => {})}
              >
                Switch to Sepolia
              </button>
            )}
            <button
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={() => wallet.disconnect()}
            >
              Disconnect
            </button>
          </div>
        </>
      ) : (
        <button
          style={styles.btn}
          disabled={wallet.status === 'connecting'}
          onClick={() => wallet.connect()}
        >
          {wallet.status === 'connecting' ? 'Connecting…' : 'Connect Wallet'}
        </button>
      )}

      {wallet.error && (
        <div style={styles.error}>Error: {wallet.error.message}</div>
      )}
    </div>
  );
}

export default WalletConnect;
