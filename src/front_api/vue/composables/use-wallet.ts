import { ref, onMounted, onUnmounted } from 'vue';
import type { WalletState } from '../../../types/front_components';

export function useWallet() {
  const address = ref<string | null>(null);
  const chainId = ref<string | null>(null);
  const isConnecting = ref<boolean>(false);
  const copied = ref<boolean>(false);
  const error = ref<string | null>(null);

  const getEthereum = () => {
    return typeof window !== 'undefined' ? (window as any).ethereum : null;
  };

  const checkConnection = async () => {
    const eth = getEthereum();
    if (!eth) return;
    try {
      const accounts: string[] = await eth.request({ method: 'eth_accounts' });
      const currentChainId: string = await eth.request({ method: 'eth_chainId' });
      if (accounts.length > 0) {
        address.value = accounts[0];
        chainId.value = currentChainId;
        error.value = null;
      }
    } catch (err: any) {
      error.value = err?.message || 'Failed to check wallet';
    }
  };

  const handleAccounts = (accounts: string[]) => {
    address.value = accounts[0] || null;
    error.value = null;
  };

  const handleChain = (newChainId: string) => {
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
      const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
      const currentChainId: string = await eth.request({ method: 'eth_chainId' });
      address.value = accounts[0] || null;
      chainId.value = currentChainId;
      return { address: address.value, chainId: currentChainId };
    } catch (err: any) {
      error.value = err?.message || 'Connection rejected';
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
