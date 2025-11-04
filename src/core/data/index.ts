import { ethers } from "ethers";

export function getBlockNumber(provider: string): Promise<number> {
    let balance: number = 0;
    const rpcProvider = new ethers.JsonRpcProvider(provider);
    return rpcProvider.getBlockNumber().then((number) => {
        balance = number;
        return balance;
    });
}

export function getBalance(provider: string, useraddres: string): Promise<number> {
    let balance;
    const rpcProvider = new ethers.JsonRpcProvider(provider);
    // Check if address is valid before making the request
    if (!useraddres || useraddres.trim() === '') {
        throw new Error('Invalid address: Address cannot be empty');
    }
    return rpcProvider.getBalance(useraddres).then((userbalance) => {
        balance = userbalance ? parseFloat(ethers.formatEther(userbalance)) : 0;
        return balance;
    }).catch((error) => {
        console.error(`Error fetching balance for address ${useraddres}:`, (error as Error).message);
        throw error;
    });
}

export type GasFees = {
    unit: 'gwei' | 'wei';
    gasPriceGwei?: string;
    maxFeePerGasGwei?: string;
    maxPriorityFeePerGasGwei?: string;
    baseFeePerGasGwei?: string;
    raw: {
        gasPrice?: bigint | null;
        maxFeePerGas?: bigint | null;
        maxPriorityFeePerGas?: bigint | null;
        baseFeePerGas?: bigint | null;
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
        rpcProvider.getBlock('latest')
    ]);

    const baseFee = (latestBlock as any)?.baseFeePerGas ?? null; // bigint | null

    const toGwei = (v?: bigint | null) => (v != null ? ethers.formatUnits(v, 'gwei') : undefined);

    const result: GasFees = {
        unit: 'gwei',
        gasPriceGwei: toGwei(feeData.gasPrice ?? null),
        maxFeePerGasGwei: toGwei(feeData.maxFeePerGas ?? null),
        maxPriorityFeePerGasGwei: toGwei(feeData.maxPriorityFeePerGas ?? null),
        baseFeePerGasGwei: toGwei(baseFee),
        raw: {
            gasPrice: feeData.gasPrice ?? null,
            maxFeePerGas: feeData.maxFeePerGas ?? null,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? null,
            baseFeePerGas: baseFee
        }
    };

    // Provide JSON-safe serialization to avoid "Do not know how to serialize a BigInt"
    // JSON.stringify will call toJSON if present on the object
    (result as unknown as { toJSON: () => unknown }).toJSON = () => ({
        unit: result.unit,
        gasPriceGwei: result.gasPriceGwei,
        maxFeePerGasGwei: result.maxFeePerGasGwei,
        maxPriorityFeePerGasGwei: result.maxPriorityFeePerGasGwei,
        baseFeePerGasGwei: result.baseFeePerGasGwei,
        raw: {
            gasPrice: result.raw.gasPrice != null ? String(result.raw.gasPrice) : null,
            maxFeePerGas: result.raw.maxFeePerGas != null ? String(result.raw.maxFeePerGas) : null,
            maxPriorityFeePerGas: result.raw.maxPriorityFeePerGas != null ? String(result.raw.maxPriorityFeePerGas) : null,
            baseFeePerGas: result.raw.baseFeePerGas != null ? String(result.raw.baseFeePerGas) : null,
        },
    });

    return result;
}
// ...existing code...