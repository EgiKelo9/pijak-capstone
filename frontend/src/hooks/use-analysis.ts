import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { analyzeColumns, getDataset, getDatasetFeatureMetadata, updateDatasetFeatureMetadata, uploadDataset, runAnalysisPipeline, getAnalysisHistory, getCleanedDatasetIds } from '@/services/analysis';
import { runForecasting, getForecastingResult } from '@/services/forecasting';
import { runClustering, getClusteringResult } from '@/services/clustering';
import type { AnalysisMode, AnalysisConfig, TerminalStep, ForecastAggressivenessType, ClusteringConfig } from '@/types';
import { DataConfigState } from '@/types';
import { useTerminal } from '@/components/main/layout/main-sidebar';

/**
 * Safely extract a single string from col_product which may be string or string[].
 * Backend expects col_product as a single string, but LLM may return an array.
 */
function extractColProduct(value: any, fallback = 'product'): string {
  if (Array.isArray(value)) return value[0] || fallback;
  if (typeof value === 'string') return value;
  return fallback;
}

/**
 * Get the context of the dataset from localStorage
 */
export function getDatasetContext(): {
  raw_dataset_id: number;
  forecast_config: {
    dataset_id: number;
    col_date: string;
    col_target: string;
    col_regressors: string[];
  } | null;
} | null {
  try {
    const raw = localStorage.getItem('pijak_dataset_context');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.raw_dataset_id === 'number') {
      return parsed as {
        raw_dataset_id: number;
        forecast_config: {
          dataset_id: number;
          col_date: string;
          col_target: string;
          col_regressors: string[];
        } | null;
      };
    }
  } catch (e) {
    console.error("Failed to parse dataset context:", e);
  }
  return null;
}

export function useAnalysis() {
  const [date, setDate] = useState<DateRange | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AnalysisMode>('both');
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [activeDatasetId, setActiveDatasetId] = useState<number>(-1);
  const [datasetData, setDatasetData] = useState<any>(null);
  const [isLoadingDataset, setIsLoadingDataset] = useState(false);
  const [forecastAggressiveness, setForecastAggressiveness] = useState<ForecastAggressivenessType>('balance');
  const [clusteringConfig, setClusteringConfig] = useState<ClusteringConfig>({ mode: 'auto', clusterCount: 3 });
  const [dataConfig, setDataConfig] = useState<DataConfigState>({
    availableColumns: [],
    dateColumn: '',
    targetColumn: '',
    includedColumns: []
  });
  const { logs: terminalLogs, setLogs: setTerminalLogs, setIsAnalysisReady } = useTerminal();
  const [dataConfigStatus, setDataConfigStatus] = useState<'menunggu' | 'berhasil' | 'gagal' | 'kosong'>('menunggu');
  const [rawFeatureMapping, setRawFeatureMapping] = useState<any | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    const context = getDatasetContext();
    if (context) {
      setActiveDatasetId(context.raw_dataset_id);
    } else {
      const storedId = localStorage.getItem('pijak_active_dataset_id');
      if (storedId) {
        const id = parseInt(storedId, 10);
        setActiveDatasetId(id);
        localStorage.setItem('pijak_dataset_context', JSON.stringify({
          raw_dataset_id: id,
          forecast_config: null
        }));
      }
    }

    const handleDatasetChanged = () => {
      const newStoredId = localStorage.getItem('pijak_active_dataset_id');
      if (newStoredId) {
        const id = parseInt(newStoredId, 10);
        setActiveDatasetId(id);
        localStorage.setItem('pijak_dataset_context', JSON.stringify({
          raw_dataset_id: id,
          forecast_config: null
        }));
      }
    };
    const openUploadModalEvent = () => setIsFileUploadOpen(true);

    window.addEventListener('dataset_changed', handleDatasetChanged);
    window.addEventListener('open_upload_modal', openUploadModalEvent);

    // Using a wrapper so that it can access the latest handleRunAnalysis
    const runAnalysisEvent = () => window.dispatchEvent(new Event('internal_run_analysis'));
    window.addEventListener('run_analysis_pipeline', runAnalysisEvent);
    return () => {
      window.removeEventListener('dataset_changed', handleDatasetChanged);
      window.removeEventListener('open_upload_modal', openUploadModalEvent);
      window.removeEventListener('run_analysis_pipeline', runAnalysisEvent);
    };
  }, []);

  const analysisConfig = useMemo<AnalysisConfig>(() => ({
    mode,
    dateRange: date,
    datasetId: activeDatasetId,
    preferences: {
      forecastAggressiveness,
      clusteringConfig,
      dataConfig
    }
  }), [mode, date, activeDatasetId, forecastAggressiveness, clusteringConfig, dataConfig]);

  const handleOpenUploadModal = useCallback(() => {
    setIsFileUploadOpen(true);
  }, [analysisConfig]);

  const runPreprocessingPipeline = useCallback(async (datasetId: number, currentMode: string, forceReload: boolean = false) => {
    // 1. Pre-calling: Tambahkan log Inisialisasi ke Terminal
    setTerminalLogs((prev) => [
      ...prev,
      { stepId: `init-${Date.now()}`, text: forceReload ? 'system_ready: memuat ulang analisis fitur...' : 'system_ready: memulai pipeline otomatis...', status: 'info' as const },
      { stepId: 'analyze_col', text: forceReload ? `[OpenRouter] Menganalisis ulang metadata dataset #${datasetId}...` : `Memeriksa konfigurasi kolom dataset #${datasetId}...`, status: 'loading' as const }
    ]);
    setDataConfigStatus('menunggu');

    try {
      let mapping: any = null;

      // 1. Coba fetch metadata dari database terlebih dahulu jika bukan force reload
      if (!forceReload) {
        try {
          const existingMetadata = await getDatasetFeatureMetadata(datasetId);
          const existingStatus = existingMetadata?.analyze_status;

          // Hanya gunakan cache jika statusnya 'done' (bukan processing/error/undefined)
          if (existingMetadata && Object.keys(existingMetadata).length > 0 && existingStatus === 'done') {
            mapping = existingMetadata;
          } else if (existingStatus === 'processing') {
            // Metadata sedang diproses — tunggu hingga selesai
            let isProcessing = true;
            let attempts = 0;
            while (isProcessing && attempts < 30) {
              await new Promise(r => setTimeout(r, 5000));
              const currentMeta = await getDatasetFeatureMetadata(datasetId);
              if (currentMeta?.analyze_status === 'done') {
                mapping = currentMeta;
                isProcessing = false;
                break;
              }
              if (currentMeta?.analyze_status === 'error') {
                isProcessing = false;
                break; // Fall through to retry
              }
              attempts++;
            }
            if (isProcessing) {
              throw new Error("Waktu tunggu analisis kolom habis.");
            }
          }
          // Jika status undefined/null/error, jatuh ke langkah 2 (panggil OpenRouter)
        } catch (err: any) {
          if (err.message?.includes("habis")) throw err;
          console.warn("[Dashboard] Gagal memuat metadata dari database atau metadata berstatus error, beralih ke analisis ML...");
          setTerminalLogs((prev) => [...prev, { stepId: `meta_warn-${Date.now()}`, text: 'Memicu ulang analisis kolom via layanan ML...', status: 'info' as const }]);
        }
      }

      // 2. Jika tidak ada di database, panggil layanan ML OpenRouter
      if (!mapping) {
        setTerminalLogs((prev) => prev.map(log =>
          log.stepId === 'analyze_col' ? { ...log, text: `[OpenRouter] Menganalisis metadata dataset #${datasetId}...` } : log
        ));

        const result = await analyzeColumns(datasetId, currentMode, forceReload);
        if (result.status === 'processing') {
          // Poll hingga processing selesai
          let isProcessing = true;
          let attempts = 0;
          while (isProcessing && attempts < 30) {
            await new Promise(r => setTimeout(r, 5000));
            const currentMeta = await getDatasetFeatureMetadata(datasetId);
            if (currentMeta?.analyze_status === 'done') {
              mapping = currentMeta;
              isProcessing = false;
              break;
            }
            if (currentMeta?.analyze_status === 'error') {
              throw new Error("Layanan OpenRouter gagal memetakan kolom.");
            }
            attempts++;
          }
          if (isProcessing) {
            throw new Error("Waktu tunggu analisis kolom habis.");
          }
        } else if (result.status === 'success' && result.suggested_mapping) {
          mapping = result.suggested_mapping;
        } else {
          throw new Error("Layanan OpenRouter gagal memetakan kolom.");
        }
      }

      setRawFeatureMapping(mapping); // Store the full raw mapping from the API

      setDataConfig((prev) => {
        let dateCol = prev.dateColumn;
        if (typeof mapping.col_date_time === 'string') {
          if (prev.availableColumns.includes(mapping.col_date_time)) dateCol = mapping.col_date_time;
        } else if (mapping.col_date_time?.col_whole) {
          const extractedDate = Array.isArray(mapping.col_date_time.col_whole)
            ? mapping.col_date_time.col_whole[0]
            : mapping.col_date_time.col_whole;
          if (extractedDate && prev.availableColumns.includes(extractedDate)) dateCol = extractedDate;
        }

        let targetCol = prev.targetColumn;
        if (mapping.col_target && prev.availableColumns.includes(mapping.col_target)) {
          targetCol = mapping.col_target;
        }

        let colsToDrop: string[] = [];
        if (Array.isArray(mapping.cols_to_drop)) colsToDrop = mapping.cols_to_drop;
        else if (typeof mapping.cols_to_drop === 'string') colsToDrop = [mapping.cols_to_drop];

        const includedCols = prev.availableColumns.filter(
          (col) => col !== dateCol && col !== targetCol && !colsToDrop.includes(col)
        );

        return {
          ...prev,
          dateColumn: dateCol,
          targetColumn: targetCol,
          includedColumns: includedCols,
        };
      });
      setDataConfigStatus('berhasil');
      setTerminalLogs((prev) => {
        const logs = prev.map(log =>
          log.stepId === 'analyze_col' ? { ...log, text: 'Konfigurasi kolom berhasil dimuat.', status: 'success' as const } : log
        );
        if (mapping.reasonings) {
          logs.push({
            stepId: `reasoning-${Date.now()}`,
            text: `Keputusan AI: ${mapping.reasonings}`,
            status: 'info' as const,
            collapsible: true,
            defaultCollapsed: true
          });
        }
        return logs;
      });

    } catch (error: any) {
      // Post-calling: Gagal - Ubah status log yang loading menjadi error
      setRawFeatureMapping(null); // Clear raw mapping on critical error
      setTerminalLogs((prev) => prev.map(log =>
        log.status === 'loading' ? { ...log, text: `Pipeline Error: ${error.message}`, status: 'error' as const } : log
      ));
      setDataConfigStatus('gagal');
    }
  }, []);

  const handleUploadConfirm = useCallback(async (file: File) => {
    const uploadStepId = `upload-${Date.now()}`;
    try {
      setTerminalLogs((prev) => [...prev, { stepId: uploadStepId, text: `Mengunggah file ${file.name}...`, status: 'loading' }]);
      const data = await uploadDataset(file);
      console.log("[Dashboard] Upload Success. Dataset ID:", data.dataset_id);
      setTerminalLogs((prev) => prev.map(log => log.stepId === uploadStepId ? { ...log, text: 'File berhasil diunggah.', status: 'success' } : log));
      
      // Update session storage context
      localStorage.setItem('pijak_dataset_context', JSON.stringify({
        raw_dataset_id: data.dataset_id,
        forecast_config: null
      }));

      setActiveDatasetId(data.dataset_id);
      setIsFileUploadOpen(false); // Tutup modal unggah setelah berhasil
    } catch (error: any) {
      console.error("[Dashboard] Upload Error:", error);
      setTerminalLogs((prev) => prev.map(log => log.stepId === uploadStepId ? { ...log, text: `Gagal mengunggah: ${error.message}`, status: 'error' } : log));
      const isAuthError = error.message === "Unauthorized";
      alert(isAuthError ? "Sesi Anda telah berakhir (Token kedaluwarsa). Silakan muat ulang halaman." : error.message);
    }
  }, [analysisConfig.mode, runPreprocessingPipeline]);

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const data = await getAnalysisHistory();
      if (data) {
        setHistoryData(data);
      }
    } catch (error) {
      console.error("Failed to fetch analysis history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const handleReloadMapping = useCallback(() => {
    if (activeDatasetId !== -1) {
      runPreprocessingPipeline(activeDatasetId, mode, true);
    }
  }, [activeDatasetId, mode, runPreprocessingPipeline]);

  const handleConfirmMapping = useCallback(async () => {
    if (activeDatasetId === -1 || !rawFeatureMapping) {
      alert("Tidak ada data analisis untuk disimpan. Coba muat ulang atau jalankan analisis terlebih dahulu.");
      return;
    }

    const uniqueStepId = `confirm_col-${Date.now()}`;
    try {
      setTerminalLogs((prev) => [...prev, { stepId: uniqueStepId, text: 'Menyimpan konfigurasi kolom ke database...', status: 'loading' as const }]);

      // Buat salinan dari mapping mentah yang disimpan di state
      const updatedMapping = JSON.parse(JSON.stringify(rawFeatureMapping));

      // Timpa (aggregate) field yang dikontrol oleh UI berdasarkan state `dataConfig` saat ini
      // Ini memastikan field lain yang tidak ditampilkan di UI (misal: col_to_numerical) tetap ada
      updatedMapping.col_date_time = dataConfig.dateColumn || null;
      updatedMapping.col_target = dataConfig.targetColumn || null;
      updatedMapping.cols_to_drop = dataConfig.availableColumns.filter(
        c => c !== dataConfig.dateColumn && c !== dataConfig.targetColumn && !dataConfig.includedColumns.includes(c)
      );

      await updateDatasetFeatureMetadata(activeDatasetId, updatedMapping);
      console.log("Updated mapping to be saved:", updatedMapping); // For debugging

      setTerminalLogs((prev) => prev.map(log =>
        log.stepId === uniqueStepId ? { ...log, text: 'Konfigurasi kolom berhasil disimpan.', status: 'success' as const } : log
      ));
      alert("Konfigurasi kolom berhasil disimpan!");
    } catch (error: any) {
      setTerminalLogs((prev) => prev.map(log =>
        log.stepId === uniqueStepId ? { ...log, text: `Gagal menyimpan: ${error.message}`, status: 'error' as const } : log
      ));
    }
  }, [activeDatasetId, dataConfig, rawFeatureMapping]);

  const trackForecastingProgress = useCallback((analysisId: number) => {
    const startId = `forecast-progress-${Date.now()}`;
    setTerminalLogs((prev) => [
      ...prev,
      { stepId: `${startId}-1`, text: 'Forecasting: Menginisialisasi training model XGBoost...', status: 'loading' as const }
    ]);

    let step = 1;
    const interval = setInterval(() => {
      step++;
      if (step === 2) {
        setTerminalLogs((prev) => [
          ...prev.map(l => l.stepId === `${startId}-1` ? { ...l, text: 'Forecasting: Training model XGBoost diinisialisasi.', status: 'success' as const } : l),
          { stepId: `${startId}-2`, text: 'Forecasting: Menjalankan kombinasi pipeline (Daily & Weekly)...', status: 'loading' as const }
        ]);
      } else if (step === 3) {
        setTerminalLogs((prev) => [
          ...prev.map(l => l.stepId === `${startId}-2` ? { ...l, text: 'Forecasting: Pipeline harian (daily) dan mingguan (weekly) selesai dilatih.', status: 'success' as const } : l),
          { stepId: `${startId}-3`, text: 'Forecasting: Menganalisis hasil dan meminta ringkasan insight dari LLM...', status: 'loading' as const }
        ]);
      }
    }, 4000);

    const checkStatus = async () => {
      try {
        const data = await getForecastingResult(analysisId) as any;
        const status = data?.status;

        if (status === 'berhasil') {
          clearInterval(interval);
          setTerminalLogs((prev) => {
            const list = prev.map(l => {
              if (l.stepId?.startsWith(startId) && l.status === 'loading') {
                return { ...l, text: l.text.replace('...', '') + ' selesai.', status: 'success' as const };
              }
              return l;
            });
            list.push({
              stepId: `${startId}-success`,
              text: 'Forecasting: Seluruh kombinasi model berhasil dilatih dan insight LLM selesai digenerasi!',
              status: 'success' as const
            });
            return list;
          });
          return true;
        } else if (status === 'gagal') {
          clearInterval(interval);
          setTerminalLogs((prev) => {
            const list = prev.map(l => {
              if (l.stepId?.startsWith(startId) && l.status === 'loading') {
                return { ...l, text: l.text.replace('...', '') + ' gagal.', status: 'error' as const };
              }
              return l;
            });
            list.push({
              stepId: `${startId}-fail`,
              text: 'Forecasting: Proses training gagal di backend / ML service.',
              status: 'error' as const
            });
            return list;
          });
          return true;
        }
      } catch (err) {
        console.error("Error polling forecasting status:", err);
      }
      return false;
    };

    const pollInterval = setInterval(async () => {
      const finished = await checkStatus();
      if (finished) {
        clearInterval(pollInterval);
      }
    }, 5000);
  }, [setTerminalLogs]);

  const trackClusteringProgress = useCallback((analysisId: number) => {
    const startId = `cluster-progress-${Date.now()}`;
    setTerminalLogs((prev) => [
      ...prev,
      { stepId: `${startId}-1`, text: 'Clustering: Mempersiapkan data untuk model pengelompokan KMeans...', status: 'loading' as const }
    ]);

    let step = 1;
    const interval = setInterval(() => {
      step++;
      if (step === 2) {
        setTerminalLogs((prev) => [
          ...prev.map(l => l.stepId === `${startId}-1` ? { ...l, text: 'Clustering: Data berhasil dipersiapkan.', status: 'success' as const } : l),
          { stepId: `${startId}-2`, text: 'Clustering: Mencari K optimal (Elbow & Silhouette) dan melakukan clustering...', status: 'loading' as const }
        ]);
      } else if (step === 3) {
        setTerminalLogs((prev) => [
          ...prev.map(l => l.stepId === `${startId}-2` ? { ...l, text: 'Clustering: Pengelompokan KMeans berhasil diselesaikan.', status: 'success' as const } : l),
          { stepId: `${startId}-3`, text: 'Clustering: Menganalisis karakteristik cluster dan meminta ringkasan insight dari LLM...', status: 'loading' as const }
        ]);
      }
    }, 4000);

    const checkStatus = async () => {
      try {
        const data = await getClusteringResult(analysisId) as any;
        const status = data?.status;

        if (status === 'berhasil') {
          clearInterval(interval);
          setTerminalLogs((prev) => {
            const list = prev.map(l => {
              if (l.stepId?.startsWith(startId) && l.status === 'loading') {
                return { ...l, text: l.text.replace('...', '') + ' selesai.', status: 'success' as const };
              }
              return l;
            });
            list.push({
              stepId: `${startId}-success`,
              text: 'Clustering: Proses pengelompokan produk selesai dan insight LLM berhasil dibuat!',
              status: 'success' as const
            });
            return list;
          });
          return true;
        } else if (status === 'gagal') {
          clearInterval(interval);
          setTerminalLogs((prev) => {
            const list = prev.map(l => {
              if (l.stepId?.startsWith(startId) && l.status === 'loading') {
                return { ...l, text: l.text.replace('...', '') + ' gagal.', status: 'error' as const };
              }
              return l;
            });
            list.push({
              stepId: `${startId}-fail`,
              text: 'Clustering: Proses clustering gagal di backend / ML service.',
              status: 'error' as const
            });
            return list;
          });
          return true;
        }
      } catch (err) {
        console.error("Error polling clustering status:", err);
      }
      return false;
    };

    const pollInterval = setInterval(async () => {
      const finished = await checkStatus();
      if (finished) {
        clearInterval(pollInterval);
      }
    }, 5000);
  }, [setTerminalLogs]);

  const handleRunAnalysis = useCallback(async () => {
    if (!analysisConfig.dateRange?.from || !analysisConfig.dateRange?.to) {
      console.warn('[Dashboard] Run Analysis aborted: No valid date range selected');
      return;
    }

    let forecastingId: number | null = null;
    let clusteringId: number | null = null;
    if (activeDatasetId !== -1) {
      try {
        const cleanedIds = await getCleanedDatasetIds(activeDatasetId);
        forecastingId = cleanedIds.forecasting;
        clusteringId = cleanedIds.clustering;
      } catch (err) {
        console.error("Failed to fetch cleaned dataset IDs from backend:", err);
      }
    }

    const hasCleanedForecast = forecastingId !== null;
    const hasCleanedCluster = clusteringId !== null;

    const shouldDirectRun =
      (mode === 'forecasting' && hasCleanedForecast) ||
      (mode === 'clustering' && hasCleanedCluster) ||
      (mode === 'both' && hasCleanedForecast && hasCleanedCluster);

    if (shouldDirectRun) {
      const runDirect = async () => {
        const runId = `direct-${Date.now()}`;
        const colsToDrop = Array.isArray(rawFeatureMapping?.cols_to_drop)
          ? rawFeatureMapping.cols_to_drop
          : [];
        setTerminalLogs((prev) => [
          ...prev,
          { stepId: runId, text: 'Menyinkronkan data: memuat berkas hasil preprocessing dari cache...', status: 'loading' as const }
        ]);

        try {
          if ((mode === 'forecasting' || mode === 'both') && forecastingId) {
            const cleanedForecastId = forecastingId;
            const colDate = dataConfig.dateColumn || 'date';
            const colTarget = dataConfig.targetColumn || 'qty';
            const colRegressors = dataConfig.includedColumns || [];
            const colProduct = extractColProduct(rawFeatureMapping?.col_product);

            setTerminalLogs((prev) => [
              ...prev.map(l => l.stepId === runId ? { ...l, text: 'Data hasil preprocessing berhasil dimuat.', status: 'success' as const } : l),
              { stepId: `forecast-direct-start-${Date.now()}`, text: 'Sistem memicu model forecasting: memulai proses training XGBoost...', status: 'loading' as const }
            ]);

            const forecastPayload = {
              dataset_id: cleanedForecastId,
              col_date: colDate,
              col_target: colTarget,
              col_regressors: colRegressors.filter((c: string) => c && c !== colDate && c !== colTarget && c !== colProduct && !colsToDrop.includes(c)),
              forecasting_mode: (forecastAggressiveness === 'balance' ? 'balanced' : forecastAggressiveness) as 'conservative' | 'balanced' | 'aggressive',
            };
            const runResp = await runForecasting(forecastPayload);
            
            // Simpan konfigurasi agar halaman Forecasting bisa re-run ulang
            const currentContext = getDatasetContext();
            const contextToSet = currentContext || {
              raw_dataset_id: activeDatasetId,
              forecast_config: null
            };
            contextToSet.forecast_config = {
              dataset_id: forecastPayload.dataset_id,
              col_date: forecastPayload.col_date,
              col_target: forecastPayload.col_target,
              col_regressors: forecastPayload.col_regressors,
            };
            localStorage.setItem('pijak_dataset_context', JSON.stringify(contextToSet));

            setTerminalLogs((prev) => [
              ...prev.map(l => l.status === 'loading' ? { ...l, text: 'Model forecasting berhasil dijalankan.', status: 'success' as const } : l)
            ]);

            const analysisId = (runResp as any)?.analysis_id;
            if (analysisId) {
              trackForecastingProgress(analysisId);
            }
          }

          if ((mode === 'clustering' || mode === 'both') && clusteringId) {
            const cleanedClusterId = clusteringId;
            const colProduct = extractColProduct(rawFeatureMapping?.col_product);
            const colFitur = dataConfig.includedColumns || [];
            const colDate = dataConfig.dateColumn || 'date';
            const colTarget = dataConfig.targetColumn || 'qty';

            setTerminalLogs((prev) => [
              ...prev,
              { stepId: `cluster-direct-start-${Date.now()}`, text: 'Sistem memicu model clustering: memulai pengelompokan KMeans...', status: 'loading' as const }
            ]);

            const filteredFitur = colFitur.filter(
              (c: string) => c && c !== colProduct && c !== colDate && c !== colTarget && !colsToDrop.includes(c)
            );

            const runResp = await runClustering({
              dataset_id: cleanedClusterId,
              col_product: colProduct,
              col_fitur: filteredFitur,
              n_clusters: clusteringConfig.mode === 'auto' ? null : clusteringConfig.clusterCount
            });

            setTerminalLogs((prev) => [
              ...prev.map(l => l.status === 'loading' ? { ...l, text: 'Model clustering berhasil dijalankan.', status: 'success' as const } : l)
            ]);

            const analysisId = (runResp as any)?.analysis_id;
            if (analysisId) {
              trackClusteringProgress(analysisId);
            }
          }

          // Final success message
          setTerminalLogs((prev) => [
            ...prev,
            { stepId: `direct-done-${Date.now()}`, text: 'Seluruh proses analisis model berhasil diselesaikan.', status: 'success' as const }
          ]);

        } catch (error: any) {
          console.error("Direct run failed:", error);
          setTerminalLogs((prev) => [
            ...prev.map(l => l.status === 'loading' ? { ...l, text: `Gagal menjalankan analisis langsung: ${error.message}`, status: 'error' as const } : l)
          ]);
        }
      };

      runDirect();
      return; // Skip preprocessing!
    }

    // EXTRACT AND FORMAT VALUES
    const payload = {
      datasetId: analysisConfig.datasetId,
      mode: analysisConfig.mode,
      startDate: format(analysisConfig.dateRange.from, 'yyyy-MM-dd'),
      endDate: format(analysisConfig.dateRange.to, 'yyyy-MM-dd'),
      preferences: {
        forecasting_learning_rate: analysisConfig.preferences.forecastAggressiveness,
        clustering_target: analysisConfig.preferences.clusteringConfig.mode === 'auto' ? null : analysisConfig.preferences.clusteringConfig.clusterCount,
        data_config: analysisConfig.preferences.dataConfig
      },
      timestamp: new Date().toISOString()
    };

    console.info('=== [DUMMY PAYLOAD] MULAI ANALISIS ===');
    console.info('These are the extracted values ready to be passed to your backend/API:');
    console.table(payload);
    console.info('Raw Analysis Config:', analysisConfig);
    console.info('========================================');

    // Add your analysis execution logic here
    const run = async () => {
      const jobId = `job-${Date.now()}`;
      const wsUrl = process.env.NEXT_PUBLIC_API_URL?.replace('http://', 'ws://').replace('https://', 'wss://') || 'ws://localhost:5000/api/v1';
      const ws = new WebSocket(`${wsUrl}/datasets/preprocess/ws/${jobId}`);

      ws.onmessage = (event) => {
        try {
          handleBackendMessage(event.data);
        } catch (e) {
          console.error("Failed to parse WS message", e);
        }
      };

      ws.onopen = async () => {
        try {
          await runAnalysisPipeline(jobId, analysisConfig.datasetId, analysisConfig.mode);
        } catch (error: any) {
          setTerminalLogs((prev) => prev.map(log => log.stepId === jobId ? { ...log, text: `Gagal menjalankan pipeline: ${error.message}`, status: 'error' as const } : log));
          ws.close();
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket Error:", error);
        setTerminalLogs((prev) => prev.map(log => log.stepId === jobId ? { ...log, text: 'Koneksi WebSocket terputus atau gagal.', status: 'error' as const } : log));
      };
    };

    run();

  }, [analysisConfig, rawFeatureMapping, mode, dataConfig, clusteringConfig, trackForecastingProgress, trackClusteringProgress]);

  useEffect(() => {
    const handleInternalRun = () => handleRunAnalysis();
    window.addEventListener('internal_run_analysis', handleInternalRun);
    return () => window.removeEventListener('internal_run_analysis', handleInternalRun);
  }, [handleRunAnalysis]);

  const modeLabel = useMemo(() => {
    switch (mode) {
      case 'forecasting': return 'Forecasting';
      case 'clustering': return 'Clustering';
      case 'both':
      default: return 'Forecasting & Clustering';
    }
  }, [mode]);

  const [hasInteractedForecasting, setHasInteractedForecasting] = useState(true);
  const [hasInteractedClustering, setHasInteractedClustering] = useState(true);

  useEffect(() => {
    if (forecastAggressiveness !== 'balance') setHasInteractedForecasting(true);
  }, [forecastAggressiveness]);

  useEffect(() => {
    if (clusteringConfig.mode !== 'auto' || clusteringConfig.clusterCount !== 3) {
      setHasInteractedClustering(true);
    }
  }, [clusteringConfig]);

  const isPreferencesReady = (mode === 'forecasting' && hasInteractedForecasting) || (mode === 'clustering' && hasInteractedClustering) || (mode === 'both' && hasInteractedForecasting && hasInteractedClustering);

  const isReady = !!date?.from && !!date?.to && activeDatasetId !== -1 && isPreferencesReady;

  useEffect(() => {
    setIsAnalysisReady(isReady);
  }, [isReady, setIsAnalysisReady]);

  useEffect(() => {
    console.debug('[Dashboard] State updated:', { isReady, mode, date });
  }, [isReady, mode, date]);



  useEffect(() => {
    if (activeDatasetId === -1) {
      setDatasetData(null);
      return;
    }

    const initDataAndPipeline = async () => {
      setIsLoadingDataset(true);
      const fetchStepId = `fetch-${activeDatasetId}`;
      setTerminalLogs((prev) => [...prev, { stepId: fetchStepId, text: `Memuat dataset #${activeDatasetId} dari server...`, status: 'loading' as const }]);
      try {
        const csvString = await getDataset(activeDatasetId);

        let parsedData: any[] = [];
        let cols: string[] = [];
        if (csvString) {
          const lines = csvString.trim().split('\n');
          if (lines.length > 0) {
            // Regex ini memisahkan berdasarkan koma, kecuali jika koma tersebut ada di dalam tanda kutip ("")
            const csvRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
            const headers = lines[0].split(csvRegex).map((h: string) => h.trim().replace(/^"|"$/g, ''));
            cols = headers;

            // Batasi hanya menampilkan 50 baris data pertama untuk menghemat RAM (Tampilan Preview)
            const maxRows = Math.min(lines.length, 51); // 1 header + 50 baris data

            for (let i = 1; i < maxRows; i++) {
              const line = lines[i];
              if (!line.trim()) continue; // Abaikan baris kosong

              const values = line.split(csvRegex);
              const obj: any = {};
              headers.forEach((header: string, index: number) => {
                obj[header] = values[index]?.trim().replace(/^"|"$/g, '');
              });
              parsedData.push(obj);
            }

            // [AUTO-FILL] Ekstraksi rentang waktu secara efisien dari keseluruhan data
            let minDate: Date | null = null;
            let maxDate: Date | null = null;
            let dateColIdx = -1;

            // 1. Moduler: Cari index kolom tanggal dengan sampel hingga 5 baris pertama
            for (let r = 1; r < Math.min(lines.length, 6); r++) {
              if (!lines[r].trim()) continue;
              const sampleValues = lines[r].split(csvRegex).map((v: string) => v.trim().replace(/^"|"$/g, ''));
              for (let j = 0; j < sampleValues.length; j++) {
                const val = sampleValues[j];
                // Cek agar bukan murni angka (spt nominal harga/ID) dan Valid Date
                if (val && isNaN(Number(val)) && !isNaN(new Date(val).getTime())) {
                  dateColIdx = j;
                  break;
                }
              }
              if (dateColIdx !== -1) break;
            }

            // 2. Terapkan pencarian ke seluruh data (original dataset)
            if (dateColIdx !== -1) {
              for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                if (!line.trim()) continue;

                let dateStr = "";
                // Optimasi fast-path: Jika baris tanpa kutip ganda, split(',') murni jauh lebih kilat
                if (!line.includes('"')) {
                  const fastValues = line.split(',');
                  dateStr = fastValues[dateColIdx] ? fastValues[dateColIdx].trim() : "";
                } else {
                  const safeValues = line.split(csvRegex);
                  dateStr = safeValues[dateColIdx] ? safeValues[dateColIdx].trim().replace(/^"|"$/g, '') : "";
                }

                if (dateStr) {
                  const d = new Date(dateStr);
                  if (!isNaN(d.getTime())) {
                    if (!minDate || d < minDate) minDate = d;
                    if (!maxDate || d > maxDate) maxDate = d;
                  }
                }
              }
            }

            if (minDate && maxDate) setDate({ from: minDate, to: maxDate });
          }
        }
        console.log(`[Dashboard] Parsed ${parsedData.length} rows for preview`);
        setTerminalLogs((prev) => prev.map(log => log.stepId === fetchStepId ? { ...log, text: `Dataset dimuat (${parsedData.length} baris diproses).`, status: 'success' as const } : log));
        setDatasetData(parsedData);

        // Ekstrak nama kolom untuk inisiasi Konfigurasi Data
        if (parsedData.length > 0) {
          setDataConfig(prev => {
            if (prev.availableColumns.join(',') !== cols.join(',')) {
              return {
                availableColumns: cols,
                dateColumn: cols[0] || '',
                targetColumn: cols.length > 1 ? cols[1] : (cols[0] || ''),
                includedColumns: cols.length > 2 ? cols.slice(2) : []
              };
            }
            return prev;
          });
        }
      } catch (error: any) {
        console.error("[Dashboard] Fetch Dataset Error:", error);
        setTerminalLogs((prev) => prev.map(log => log.stepId === fetchStepId ? { ...log, text: `Gagal memuat dataset: ${error.message}`, status: 'error' as const } : log));
      } finally {
        setIsLoadingDataset(false);
      }

      // SEKARANG kita jalankan pipeline setelah data (dan kolom) selesai di-parse!
      // Ini mencegah LLM Mapping gagal mengkonfigurasi UI karena availableColumns sebelumnya masih kosong
      runPreprocessingPipeline(activeDatasetId, mode);
    };

    initDataAndPipeline();
  }, [activeDatasetId]);

  const handleBackendMessage = (incomingPayload: string) => {
    let parsed: any;
    try {
      parsed = JSON.parse(incomingPayload);
    } catch {
      console.warn('[WS] Failed to parse message:', incomingPayload);
      return;
    }

    // Normalize: support both TerminalStep format {stepId, text, status} and legacy {message}
    const newLog: TerminalStep = parsed.stepId
      ? parsed as TerminalStep
      : {
        stepId: `ws-${Date.now()}`,
        text: parsed.message || JSON.stringify(parsed),
        status: parsed.status || 'info',
      };

    setTerminalLogs((prevLogs) => {
      const existingLogIndex = prevLogs.findIndex(log => log.stepId === newLog.stepId);
      if (existingLogIndex !== -1) {
        const updatedLogs = [...prevLogs];
        updatedLogs[existingLogIndex] = newLog;
        return updatedLogs;
      }
      return [...prevLogs, newLog];
    });

    // Handle completed preprocessing pipeline
    if (parsed.status === 'success' && parsed.stepId?.endsWith('-done')) {
      const cleanedForecastId = parsed.cleaned_forecast_id;
      const cleanedClusterId = parsed.cleaned_cluster_id;

      // Auto-trigger model pipeline based on current mode
      if ((mode === 'forecasting' || mode === 'both') && cleanedForecastId) {
        const colDate = parsed.feature_metadata?.col_dt_whole || dataConfig.dateColumn;
        const colTarget = parsed.feature_metadata?.col_target || dataConfig.targetColumn;
        const colProduct = extractColProduct(parsed.feature_metadata?.col_product);
        const colRegressors: string[] = (Array.isArray(parsed.feature_metadata?.col_to_num) && parsed.feature_metadata.col_to_num.length > 0)
          ? parsed.feature_metadata.col_to_num
          : dataConfig.includedColumns;
        const colsToDrop = Array.isArray(parsed.feature_metadata?.cols_to_drop)
          ? parsed.feature_metadata.cols_to_drop
          : [];

        if (!colDate || !colTarget) {
          setTerminalLogs((prev) => [
            ...prev,
            {
              stepId: `forecast-auto-skip-${Date.now()}`,
              text: `Forecasting dilewati: kolom tanggal atau target tidak terdeteksi. Harap konfirmasi mapping kolom terlebih dahulu.`,
              status: 'error' as const
            }
          ]);
          return;
        }

        const validRegressors = colRegressors.filter(
          (c: string) => c && c !== colDate && c !== colTarget && c !== colProduct && !colsToDrop.includes(c)
        );

        const forecastPayloadWs = {
          dataset_id: cleanedForecastId,
          col_date: colDate,
          col_target: colTarget,
          col_regressors: validRegressors,
          forecasting_mode: (forecastAggressiveness === 'balance' ? 'balanced' : forecastAggressiveness) as 'conservative' | 'balanced' | 'aggressive',
        };
        runForecasting(forecastPayloadWs)
          .then((runResp) => {
            // Simpan konfigurasi agar halaman Forecasting bisa re-run ulang
            const currentContext = getDatasetContext();
            const contextToSet = currentContext || {
              raw_dataset_id: activeDatasetId,
              forecast_config: null
            };
            contextToSet.forecast_config = {
              dataset_id: forecastPayloadWs.dataset_id,
              col_date: forecastPayloadWs.col_date,
              col_target: forecastPayloadWs.col_target,
              col_regressors: forecastPayloadWs.col_regressors,
            };
            localStorage.setItem('pijak_dataset_context', JSON.stringify(contextToSet));
            const analysisId = (runResp as any)?.analysis_id;
            if (analysisId) {
              trackForecastingProgress(analysisId);
            }
          }).catch((err: any) => {
            console.error("Auto forecasting failed:", err);
            setTerminalLogs((prev) => [
              ...prev,
              { stepId: `forecast-auto-fail-${Date.now()}`, text: `Gagal memicu forecasting otomatis: ${err.message}`, status: 'error' as const }
            ]);
          });
      }

      if ((mode === 'clustering' || mode === 'both') && cleanedClusterId) {
        const colProduct = extractColProduct(parsed.feature_metadata?.col_product);
        const colFitur = (Array.isArray(parsed.feature_metadata?.col_to_num) && parsed.feature_metadata.col_to_num.length > 0)
          ? parsed.feature_metadata.col_to_num
          : (dataConfig.includedColumns || []);
        const colDate = parsed.feature_metadata?.col_dt_whole || dataConfig.dateColumn;
        const colTarget = parsed.feature_metadata?.col_target || dataConfig.targetColumn;
        const colsToDrop = Array.isArray(parsed.feature_metadata?.cols_to_drop)
          ? parsed.feature_metadata.cols_to_drop
          : [];

        const filteredFitur = colFitur.filter(
          (c: string) => c && c !== colProduct && c !== colDate && c !== colTarget && !colsToDrop.includes(c)
        );

        runClustering({
          dataset_id: cleanedClusterId,
          col_product: colProduct,
          col_fitur: filteredFitur,
          n_clusters: clusteringConfig.mode === 'auto' ? null : clusteringConfig.clusterCount
        })
          .then((runResp) => {
            const analysisId = (runResp as any)?.analysis_id;
            if (analysisId) {
              trackClusteringProgress(analysisId);
            }
          })
          .catch((err: any) => {
            console.error("Auto clustering failed:", err);
            setTerminalLogs((prev) => [
              ...prev.map(l => l.status === 'loading' ? { ...l, text: `Gagal memicu clustering otomatis: ${err.message}`, status: 'error' as const } : l)
            ]);
          });
      }
    }
  };

  return {
    date, setDate,
    isOpen, setIsOpen,
    mode, setMode, modeLabel,
    isFileUploadOpen, setIsFileUploadOpen,
    activeDatasetId, setActiveDatasetId,
    datasetData, setDatasetData,
    isLoadingDataset, setIsLoadingDataset,
    forecastAggressiveness, setForecastAggressiveness,
    clusteringConfig, setClusteringConfig,
    dataConfig, setDataConfig,
    dataConfigStatus, setDataConfigStatus,
    rawFeatureMapping, setRawFeatureMapping,
    terminalLogs, setTerminalLogs,
    isReady, setIsAnalysisReady,
    analysisConfig,
    runPreprocessingPipeline,
    hasInteractedForecasting, setHasInteractedForecasting,
    hasInteractedClustering, setHasInteractedClustering,
    isPreferencesReady,
    handleOpenUploadModal,
    handleUploadConfirm,
    handleReloadMapping,
    handleConfirmMapping,
    handleRunAnalysis,
    handleBackendMessage,
    historyData,
    isLoadingHistory,
    fetchHistory
  };
}
