import { useState, useEffect, useCallback, useRef } from 'react';
import type { GasFeeData } from '../../types/front_components';
import { fetchGasFeeData } from '../gas';

export function useGasTracker(options: { rpcUrl?: string; pollIntervalMs?: number } = {}) {
  const { rpcUrl: customRpcUrl, pollIntervalMs = 8000 } = options;
  const [data, setData] = useState<GasFeeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchGas = useCallback(async () => {
    try {
      const feeData = await fetchGasFeeData(customRpcUrl);
      setData(feeData);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gas fee');
    } finally {
      setLoading(false);
    }
  }, [customRpcUrl]);

  useEffect(() => {
    fetchGas();
    timerRef.current = setInterval(fetchGas, pollIntervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchGas, pollIntervalMs]);

  return {
    data,
    loading,
    error,
    refresh: fetchGas,
  };
}
