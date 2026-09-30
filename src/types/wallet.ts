/**
 * Shared wallet types used by the useWallet hook and wallet UI samples.
 */

/** Minimal EIP-1193 provider shape (MetaMask, Rabby, Coinbase Wallet, ...) */
export interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: string,
    listener: (...args: unknown[]) => void
  ) => void;
}

/** Connection lifecycle status */
export type WalletStatus =
  'unavailable' | 'disconnected' | 'connecting' | 'connected';

/** State + actions returned by useWallet */
export interface WalletState {
  status: WalletStatus;
  /** Checksum-less lowercase address of the active account */
  address: string | null;
  /** Chain ID as a decimal number */
  chainId: number | null;
  /** Balance of the active account in wei */
  balanceWei: bigint | null;
  error: Error | null;
  connect: () => Promise<string | null>;
  /** Clears local state (and revokes permission where the wallet supports it) */
  disconnect: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  refreshBalance: () => Promise<void>;
}

/** Options accepted by useWallet */
export interface UseWalletOptions {
  /** Restore an already-authorized account on mount (default: true) */
  autoConnect?: boolean;
  /** Override the provider (default: window.ethereum) */
  provider?: Eip1193Provider;
}
