import { useState, useEffect, useCallback } from 'react';
import { getForecastingHistory, getForecastingResult, runForecasting } from '@/services/forecasting';
import { getDatasetContext } from './use-analysis';
import { ForecastingResultData, ForecastingHistoryItem } from '@/types';

export type TimeFilter = 'daily' | 'weekly';
export type AggType = 'mean' | 'sum';
export type ConfidenceType = 'percentage' | 'value';
export type ForecastAggressiveness = 'aggressive' | 'balance' | 'conservative';

/** Baca konfigurasi forecasting terakhir dari localStorage */
function loadForecastConfig() {
  const context = getDatasetContext();
  return context?.forecast_config || null;
}

export function useForecasting() {
  const [data, setData] = useState<ForecastingResultData | null>(null);
  const [analysisId, setAnalysisId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRerunning, setIsRerunning] = useState<boolean>(false);

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('weekly');
  const [aggType, setAggType] = useState<AggType>('mean');
  const [confidenceType, setConfidenceType] = useState<ConfidenceType>('percentage');
  const [aggressiveness, setAggressiveness] = useState<ForecastAggressiveness>('balance');

  // ─── Fetch hasil terbaru (by history + result) ───────────────────────────
  const fetchLatestResult = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const history = await getForecastingHistory();
      if (!history || history.length === 0) {
        setError("Belum ada riwayat forecasting. Silakan mulai analisis dari halaman Dasbor.");
        setIsLoading(false);
        return;
      }

      const sortedHistory = history.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const latest = sortedHistory[0];
      setAnalysisId(latest.analysis_id);

      if (latest.status === 'berhasil' && latest.result) {
        setData(latest.result);
      } else if (latest.status === 'gagal') {
        setError("Proses forecasting terakhir gagal.");
      } else {
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

  // ─── Analisis ulang: re-run dengan aggressiveness baru ───────────────────
  const rerunForecasting = useCallback(async () => {
    const config = loadForecastConfig();
    if (!config) {
      setError("Konfigurasi forecasting belum tersedia. Silakan jalankan analisis dari halaman Dasbor terlebih dahulu.");
      return;
    }

    setIsRerunning(true);
    setError(null);

    try {
      const mappedMode =
        aggressiveness === 'balance' ? 'balanced' : aggressiveness;

      // 1. Kirim request re-run ke backend
      const runResp = await runForecasting({
        dataset_id: config.dataset_id,
        col_date: config.col_date,
        col_target: config.col_target,
        col_regressors: config.col_regressors,
        forecasting_mode: mappedMode as 'conservative' | 'balanced' | 'aggressive',
      });

      const newAnalysisId = (runResp as any)?.analysis_id;
      if (!newAnalysisId) {
        throw new Error("Gagal mendapatkan ID analisis baru dari server.");
      }

      // 2. Poll hingga status 'berhasil' atau 'gagal' (max 5 menit, poll setiap 8 detik)
      const MAX_ATTEMPTS = 37; // ~5 menit
      let attempts = 0;

      const poll = async (): Promise<void> => {
        if (attempts >= MAX_ATTEMPTS) {
          throw new Error("Waktu tunggu analisis ulang habis. Coba refresh halaman.");
        }
        attempts++;

        const history = await getForecastingHistory();
        const entry = history?.find((h) => h.analysis_id === newAnalysisId);

        if (!entry) {
          await new Promise((r) => setTimeout(r, 8000));
          return poll();
        }

        if (entry.status === 'berhasil' && entry.result) {
          setData(entry.result);
          setAnalysisId(newAnalysisId);
          return;
        } else if (entry.status === 'gagal') {
          throw new Error("Proses analisis ulang gagal di server.");
        } else {
          // Masih dalam proses
          await new Promise((r) => setTimeout(r, 8000));
          return poll();
        }
      };

      await poll();
    } catch (err: any) {
      console.error("Rerun forecasting failed:", err);
      setError(err.message || "Gagal menjalankan analisis ulang.");
    } finally {
      setIsRerunning(false);
    }
  }, [aggressiveness]);

  useEffect(() => {
    fetchLatestResult();
  }, [fetchLatestResult]);

  return {
    data,
    analysisId,
    isLoading,
    error,
    isRerunning,
    timeFilter, setTimeFilter,
    aggType, setAggType,
    confidenceType, setConfidenceType,
    aggressiveness, setAggressiveness,
    refetch: fetchLatestResult,
    rerun: rerunForecasting,
  };
}
