import { useState, useEffect, useCallback } from 'react';
import type {
  Eip1193Provider,
  UseWalletOptions,
  WalletState,
  WalletStatus,
} from './wallet-types';

function getInjectedProvider(): Eip1193Provider | undefined {
  return (globalThis as Record<string, unknown>).ethereum as
    Eip1193Provider | undefined;
}

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

/**
 * React hook that connects to a browser wallet via the EIP-1193 provider
 * (`window.ethereum`) and keeps account / chain / balance in sync.
 *
 * @example
 * ```tsx
 * const wallet = useWallet();
 * if (wallet.status === 'connected') return <p>{wallet.address}</p>;
 * return <button onClick={wallet.connect}>Connect</button>;
 * ```
 */
export function useWallet(options: UseWalletOptions = {}): WalletState {
  const { autoConnect = true } = options;
  const provider = options.provider ?? getInjectedProvider();

  const [status, setStatus] = useState<WalletStatus>(
    provider ? 'disconnected' : 'unavailable'
  );
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balanceWei, setBalanceWei] = useState<bigint | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const applyAccounts = useCallback((accounts: string[]) => {
    const next = accounts[0]?.toLowerCase() ?? null;
    setAddress(next);
    setStatus(next ? 'connected' : 'disconnected');
    if (!next) setBalanceWei(null);
  }, []);

  const loadChainId = useCallback(async () => {
    if (!provider) return;
    const hex = (await provider.request({ method: 'eth_chainId' })) as string;
    setChainId(parseInt(hex, 16));
  }, [provider]);

  const refreshBalance = useCallback(async () => {
    if (!provider || !address) return;
    try {
      const hex = (await provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      })) as string;
      setBalanceWei(BigInt(hex));
    } catch (err) {
      setError(toError(err));
    }
  }, [provider, address]);

  const connect = useCallback(async (): Promise<string | null> => {
    if (!provider) {
      const err = new Error(
        'No wallet provider found. Please install MetaMask or a compatible wallet.'
      );
      setError(err);
      return null;
    }
    setError(null);
    setStatus('connecting');
    try {
      const accounts = (await provider.request({
        method: 'eth_requestAccounts',
      })) as string[];
      applyAccounts(accounts);
      await loadChainId();
      return accounts[0]?.toLowerCase() ?? null;
    } catch (err) {
      // 4001 = user rejected the request
      setError(toError(err));
      setStatus('disconnected');
      return null;
    }
  }, [provider, applyAccounts, loadChainId]);

  const disconnect = useCallback(async () => {
    // Dapps cannot force-disconnect an injected wallet; revoke if supported.
    try {
      await provider?.request({
        method: 'wallet_revokePermissions',
        params: [{ eth_accounts: {} }],
      });
    } catch {
      /* not supported by this wallet — local reset only */
    }
    applyAccounts([]);
    setChainId(null);
    setError(null);
  }, [provider, applyAccounts]);

  const switchChain = useCallback(
    async (target: number) => {
      if (!provider) return;
      setError(null);
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x' + target.toString(16) }],
        });
      } catch (err) {
        // 4902 = chain not added to the wallet; caller should wallet_addEthereumChain
        setError(toError(err));
        throw err;
      }
    },
    [provider]
  );

  // Restore an existing authorization without prompting the user.
  useEffect(() => {
    if (!provider || !autoConnect) return;
    let cancelled = false;
    (async () => {
      try {
        const accounts = (await provider.request({
          method: 'eth_accounts',
        })) as string[];
        if (cancelled) return;
        applyAccounts(accounts);
        if (accounts.length) await loadChainId();
      } catch (err) {
        if (!cancelled) setError(toError(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [provider, autoConnect, applyAccounts, loadChainId]);

  // Follow account / chain changes made inside the wallet.
  useEffect(() => {
    if (!provider?.on) return;
    const onAccounts = (...args: unknown[]) =>
      applyAccounts((args[0] as string[]) ?? []);
    const onChain = (...args: unknown[]) =>
      setChainId(parseInt(String(args[0]), 16));
    const onDisconnect = () => applyAccounts([]);

    provider.on('accountsChanged', onAccounts);
    provider.on('chainChanged', onChain);
    provider.on('disconnect', onDisconnect);
    return () => {
      provider.removeListener?.('accountsChanged', onAccounts);
      provider.removeListener?.('chainChanged', onChain);
      provider.removeListener?.('disconnect', onDisconnect);
    };
  }, [provider, applyAccounts]);

  // Re-fetch balance whenever the account or chain changes.
  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance, chainId]);

  return {
    status,
    address,
    chainId,
    balanceWei,
    error,
    connect,
    disconnect,
    switchChain,
    refreshBalance,
  };
}
