import { ref, onMounted, onUnmounted } from 'vue';
import type { GasFeeData } from '../../../types/front_components';
import { fetchGasFeeData } from '../../gas';

export function useGasTracker(options: { rpcUrl?: string; pollIntervalMs?: number } = {}) {
  const { rpcUrl: customRpcUrl, pollIntervalMs = 8000 } = options;
  const data = ref<GasFeeData | null>(null);
  const loading = ref<boolean>(true);
  const error = ref<string | null>(null);
  let timer: ReturnType<typeof setInterval> | null = null;

  const fetchGas = async () => {
    try {
      data.value = await fetchGasFeeData(customRpcUrl);
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
