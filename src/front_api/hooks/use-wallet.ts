import { useState, useEffect, useCallback } from 'react';
import type { WalletState } from '../../types/front_components';
import type { Eip1193Provider } from '../../types/wallet';

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnecting: false,
    copied: false,
    error: null,
  });

  const getEthereum = useCallback(() => {
    return typeof window !== 'undefined' ? window.ethereum : null;
  }, []);

  const checkConnection = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) return;
    try {
      const accounts = (await eth.request({ method: 'eth_accounts' })) as string[];
      const chainId = (await eth.request({ method: 'eth_chainId' })) as string;
      if (accounts.length > 0) {
        setState((prev) => ({
          ...prev,
          address: accounts[0],
          chainId,
          error: null,
        }));
      }
    } catch (err: unknown) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to check wallet',
      }));
    }
  }, [getEthereum]);

  useEffect(() => {
    checkConnection();
    const eth = getEthereum();
    if (!eth?.on) return;

    const handleAccounts = (...args: unknown[]) => {
      const accounts = Array.isArray(args[0]) ? (args[0] as string[]) : [];
      setState((prev) => ({
        ...prev,
        address: accounts[0] || null,
        error: null,
      }));
    };

    const handleChain = (...args: unknown[]) => {
      const chainId = typeof args[0] === 'string' ? args[0] : null;
      setState((prev) => ({ ...prev, chainId, error: null }));
    };

    eth.on('accountsChanged', handleAccounts);
    eth.on('chainChanged', handleChain);

    return () => {
      eth.removeListener?.('accountsChanged', handleAccounts);
      eth.removeListener?.('chainChanged', handleChain);
    };
  }, [getEthereum, checkConnection]);

  const connect = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) {
      const err = 'No Ethereum wallet found. Please install MetaMask or another Web3 extension.';
      setState((prev) => ({ ...prev, error: err }));
      throw new Error(err);
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
      const chainId = (await eth.request({ method: 'eth_chainId' })) as string;
      const address = accounts[0] || null;
      setState((prev) => ({
        ...prev,
        address,
        chainId,
        isConnecting: false,
        error: null,
      }));
      return { address, chainId };
    } catch (err: unknown) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: err instanceof Error ? err.message : 'Connection rejected',
      }));
      throw err;
    }
  }, [getEthereum]);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      chainId: null,
      isConnecting: false,
      copied: false,
      error: null,
    });
  }, []);

  const copyAddress = useCallback(() => {
    if (!state.address) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(state.address);
      setState((prev) => ({ ...prev, copied: true }));
      setTimeout(() => {
        setState((prev) => ({ ...prev, copied: false }));
      }, 2000);
    }
  }, [state.address]);

  return {
    ...state,
    connect,
    disconnect,
    copyAddress,
  };
}
