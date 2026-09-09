import { ethers } from 'ethers';

export function getBlockNumber(provider: string): Promise<number> {
  return new ethers.JsonRpcProvider(provider).getBlockNumber();
}

export async function getBalance(
  provider: string,
  address: string
): Promise<number> {
  if (!address || address.trim() === '') {
    throw new Error('Invalid address: Address cannot be empty');
  }
  const balanceWei = await new ethers.JsonRpcProvider(provider).getBalance(
    address
  );
  return balanceWei ? parseFloat(ethers.formatEther(balanceWei)) : 0;
}

/**
 * Gas fee data. Every numeric value is a decimal string (gwei for the `*Gwei`
 * fields, wei for `raw.*`) so the whole object is plain JSON — no BigInt, no
 * custom `toJSON`.
 */
export type GasFees = {
  unit: 'gwei';
  gasPriceGwei?: string;
  maxFeePerGasGwei?: string;
  maxPriorityFeePerGasGwei?: string;
  baseFeePerGasGwei?: string;
  /** Raw values in wei, as decimal strings. */
  raw: {
    gasPrice: string | null;
    maxFeePerGas: string | null;
    maxPriorityFeePerGas: string | null;
    baseFeePerGas: string | null;
  };
};

/**
 * Get current gas fee data from an EVM RPC.
 * Uses EIP-1559 fields when available and falls back to legacy gasPrice.
 */
export async function getGasFees(provider: string): Promise<GasFees> {
  const rpcProvider = new ethers.JsonRpcProvider(provider);

  const [feeData, latestBlock] = await Promise.all([
    rpcProvider.getFeeData(),
    rpcProvider.getBlock('latest'),
  ]);

  const baseFee = latestBlock?.baseFeePerGas ?? null;

  const toGwei = (v: bigint | null | undefined) =>
    v != null ? ethers.formatUnits(v, 'gwei') : undefined;
  const toWei = (v: bigint | null | undefined) =>
    v != null ? v.toString() : null;

  return {
    unit: 'gwei',
    gasPriceGwei: toGwei(feeData.gasPrice),
    maxFeePerGasGwei: toGwei(feeData.maxFeePerGas),
    maxPriorityFeePerGasGwei: toGwei(feeData.maxPriorityFeePerGas),
    baseFeePerGasGwei: toGwei(baseFee),
    raw: {
      gasPrice: toWei(feeData.gasPrice),
      maxFeePerGas: toWei(feeData.maxFeePerGas),
      maxPriorityFeePerGas: toWei(feeData.maxPriorityFeePerGas),
      baseFeePerGas: toWei(baseFee),
    },
  };
}
