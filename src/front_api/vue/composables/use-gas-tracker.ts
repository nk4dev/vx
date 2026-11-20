import { ref, onMounted, onUnmounted } from 'vue';
import type { GasFeeData } from '../../../types/front_components';
import { getRpcUrl } from '../../../core/contract';

export function useGasTracker(options: { rpcUrl?: string; pollIntervalMs?: number } = {}) {
  const { rpcUrl: customRpcUrl, pollIntervalMs = 8000 } = options;
  const data = ref<GasFeeData | null>(null);
  const loading = ref<boolean>(true);
  const error = ref<string | null>(null);
  let timer: ReturnType<typeof setInterval> | null = null;

  const fetchGas = async () => {
    try {
      const url = customRpcUrl || getRpcUrl();
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
      const json = await res.json();
      if (json.error) throw new Error(json.error.message || 'RPC Error');

      const block = json.result;
      const baseFeeWei = block?.baseFeePerGas ? BigInt(block.baseFeePerGas) : BigInt(15_000_000_000);
      const priorityFeeWei = BigInt(1_500_000_000);
      const totalWei = baseFeeWei + priorityFeeWei;

      const toGwei = (wei: bigint) => (Number(wei) / 1e9).toFixed(2);
      const totalGweiNum = Number(totalWei) / 1e9;

      let congestion: 'low' | 'medium' | 'high' = 'low';
      if (totalGweiNum > 40) congestion = 'high';
      else if (totalGweiNum > 20) congestion = 'medium';

      data.value = {
        baseFeeGwei: toGwei(baseFeeWei),
        priorityFeeGwei: toGwei(priorityFeeWei),
        totalGwei: toGwei(totalWei),
        congestion,
        blockNumber: block?.number ? parseInt(block.number, 16) : 0,
      };
      error.value = null;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch gas fee';
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    fetchGas();
    timer = setInterval(fetchGas, pollIntervalMs);
  });

  onUnmounted(() => {
    if (timer) clearInterval(timer);
  });

  return {
    data,
    loading,
    error,
    refresh: fetchGas,
  };
}
