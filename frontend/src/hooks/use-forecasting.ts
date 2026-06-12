import { useState, useEffect, useCallback } from 'react';
import { getForecastingHistory, getForecastingResult } from '@/services/forecasting';
import { ForecastingResultData, ForecastingHistoryItem } from '@/types';

export type TimeFilter = 'daily' | 'weekly' | 'monthly';
export type AggType = 'mean' | 'sum';
export type ConfidenceType = 'percentage' | 'value';
export type ForecastAggressiveness = 'aggressive' | 'balance' | 'conservative';

export function useForecasting() {
  const [data, setData] = useState<ForecastingResultData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('monthly');
  const [aggType, setAggType] = useState<AggType>('mean');
  const [confidenceType, setConfidenceType] = useState<ConfidenceType>('percentage');
  const [aggressiveness, setAggressiveness] = useState<ForecastAggressiveness>('balance');

  const fetchLatestResult = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Get history to find the latest analysis_id
      const history = await getForecastingHistory();
      if (!history || history.length === 0) {
        setError("Belum ada riwayat forecasting. Silakan mulai analisis dari halaman Dasbor.");
        setIsLoading(false);
        return;
      }

      // Sort history descending by created_at
      const sortedHistory = history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const latest = sortedHistory[0];

      // 2. Poll or fetch the result
      if (latest.status === 'berhasil' && latest.result) {
        setData(latest.result);
      } else if (latest.status === 'gagal') {
        setError("Proses forecasting terakhir gagal.");
      } else {
        // Pending or running, fetch from result endpoint which might have the latest status
        const result = await getForecastingResult(latest.analysis_id);
        setData(result);
      }
    } catch (err: any) {
      console.error("Failed to fetch forecasting data:", err);
      setError(err.message || "Gagal memuat data forecasting.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLatestResult();
  }, [fetchLatestResult]);

  return {
    data,
    isLoading,
    error,
    timeFilter, setTimeFilter,
    aggType, setAggType,
    confidenceType, setConfidenceType,
    aggressiveness, setAggressiveness,
    refetch: fetchLatestResult
  };
}
