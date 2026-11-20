import type { CSSProperties } from 'react';

export interface WalletState {
  address: string | null;
  chainId: string | null;
  isConnecting: boolean;
  copied: boolean;
  error: string | null;
}

export interface ConnectWalletProps {
  className?: string;
  style?: CSSProperties;
  onConnect?: (address: string, chainId: string | null) => void;
  onDisconnect?: () => void;
}

export interface GasFeeData {
  baseFeeGwei: string;
  priorityFeeGwei: string;
  totalGwei: string;
  congestion: 'low' | 'medium' | 'high';
  blockNumber: number;
}

export interface GasTrackerProps {
  rpcUrl?: string;
  pollIntervalMs?: number;
  className?: string;
  style?: CSSProperties;
  onUpdate?: (data: GasFeeData) => void;
}

export interface NFTMinterProps {
  contractAddress: string;
  priceEth: string;
  rpcUrl?: string;
  maxPerWallet?: number;
  className?: string;
  style?: CSSProperties;
  onMintSuccess?: (result: { txHash: string; quantity: number }) => void;
  onMintError?: (error: Error) => void;
}
