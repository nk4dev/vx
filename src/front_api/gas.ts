import type { GasFeeData } from '../types/front_components';
import type { Eip1193Provider } from '../types/wallet';

export const DEFAULT_BROWSER_RPC_URL = 'http://localhost:8545';

interface RpcBlock {
  baseFeePerGas?: string;
  number?: string;
}

interface JsonRpcBlockResponse {
  error?: { message?: string };
  result?: RpcBlock | null;
}

function parseBlockToGasFeeData(block: RpcBlock | null | undefined): GasFeeData {
  const baseFeeWei = block?.baseFeePerGas
    ? BigInt(block.baseFeePerGas)
    : BigInt(15_000_000_000);
  const priorityFeeWei = BigInt(1_500_000_000); // 1.5 Gwei default fallback
  const totalWei = baseFeeWei + priorityFeeWei;

  const toGwei = (wei: bigint) => (Number(wei) / 1e9).toFixed(2);
  const totalGweiNum = Number(totalWei) / 1e9;

  let congestion: 'low' | 'medium' | 'high' = 'low';
  if (totalGweiNum > 40) congestion = 'high';
  else if (totalGweiNum > 20) congestion = 'medium';

  return {
    baseFeeGwei: toGwei(baseFeeWei),
    priorityFeeGwei: toGwei(priorityFeeWei),
    totalGwei: toGwei(totalWei),
    congestion,
    blockNumber: block?.number ? parseInt(block.number, 16) : 0,
  };
}

/**
 * Fetch current gas fee data in browser or Node environments without reading
 * `vx.config.json` from disk.
 *
 * Resolution order when `rpcUrl` is omitted:
 * 1. `window.ethereum` (`eth_getBlockByNumber`) when available
 * 2. {@link DEFAULT_BROWSER_RPC_URL} (`http://localhost:8545`) over HTTP JSON-RPC
 */
export async function fetchGasFeeData(rpcUrl?: string): Promise<GasFeeData> {
  const trimmedUrl = rpcUrl?.trim();

  if (!trimmedUrl && typeof window !== 'undefined') {
    const eth = (window as { ethereum?: Eip1193Provider }).ethereum;
    if (eth) {
      const block = (await eth.request({
        method: 'eth_getBlockByNumber',
        params: ['latest', false],
      })) as RpcBlock | null;
      return parseBlockToGasFeeData(block);
    }
  }

  const url = trimmedUrl || DEFAULT_BROWSER_RPC_URL;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'eth_getBlockByNumber',
      params: ['latest', false],
    }),
  });

  if (!res.ok) throw new Error(`RPC HTTP error: ${res.status}`);
  const json = (await res.json()) as JsonRpcBlockResponse;
  if (json.error) throw new Error(json.error.message || 'RPC Error');

  return parseBlockToGasFeeData(json.result);
}
