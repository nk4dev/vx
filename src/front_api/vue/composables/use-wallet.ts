import { ref, onMounted, onUnmounted } from 'vue';
import type { Eip1193Provider } from '../../../types/wallet';

export function useWallet() {
  const address = ref<string | null>(null);
  const chainId = ref<string | null>(null);
  const isConnecting = ref<boolean>(false);
  const copied = ref<boolean>(false);
  const error = ref<string | null>(null);

  const getEthereum = (): Eip1193Provider | null => {
    return typeof window !== 'undefined'
      ? ((window as { ethereum?: Eip1193Provider }).ethereum ?? null)
      : null;
  };

  const checkConnection = async () => {
    const eth = getEthereum();
    if (!eth) return;
    try {
      const accounts = (await eth.request({ method: 'eth_accounts' })) as string[];
      const currentChainId = (await eth.request({ method: 'eth_chainId' })) as string;
      if (accounts.length > 0) {
        address.value = accounts[0];
        chainId.value = currentChainId;
        error.value = null;
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to check wallet';
    }
  };

  const handleAccounts = (...args: unknown[]) => {
    const accounts = Array.isArray(args[0]) ? (args[0] as string[]) : [];
    address.value = accounts[0] || null;
    error.value = null;
  };

  const handleChain = (...args: unknown[]) => {
    const newChainId = typeof args[0] === 'string' ? args[0] : null;
    chainId.value = newChainId;
    error.value = null;
  };

  onMounted(() => {
    checkConnection();
    const eth = getEthereum();
    if (eth?.on) {
      eth.on('accountsChanged', handleAccounts);
      eth.on('chainChanged', handleChain);
    }
  });

  onUnmounted(() => {
    const eth = getEthereum();
    if (eth?.removeListener) {
      eth.removeListener('accountsChanged', handleAccounts);
      eth.removeListener('chainChanged', handleChain);
    }
  });

  const connect = async () => {
    const eth = getEthereum();
    if (!eth) {
      const msg = 'No Ethereum wallet found. Please install MetaMask or another Web3 extension.';
      error.value = msg;
      throw new Error(msg);
    }

    isConnecting.value = true;
    error.value = null;
    try {
      const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
      const currentChainId = (await eth.request({ method: 'eth_chainId' })) as string;
      address.value = accounts[0] || null;
      chainId.value = currentChainId;
      return { address: address.value, chainId: currentChainId };
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Connection rejected';
      throw err;
    } finally {
      isConnecting.value = false;
    }
  };

  const disconnect = () => {
    address.value = null;
    chainId.value = null;
    isConnecting.value = false;
    copied.value = false;
    error.value = null;
  };

  const copyAddress = () => {
    if (!address.value) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(address.value);
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 2000);
    }
  };

  return {
    address,
    chainId,
    isConnecting,
    copied,
    error,
    connect,
    disconnect,
    copyAddress,
  };
}
