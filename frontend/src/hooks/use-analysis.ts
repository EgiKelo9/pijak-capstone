import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { analyzeColumns, getDataset, getDatasetFeatureMetadata, updateDatasetFeatureMetadata, uploadDataset, runPreprocess } from '@/services/analysis';
import { runForecasting } from '@/services/forecasting';
import { useRouter } from 'next/navigation';
import type { AnalysisMode, AnalysisConfig, TerminalStep } from '@/types';
import { DataConfigState } from '@/types';
import { useTerminal } from '@/components/main/layout/main-sidebar';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const pollAnalyzeColumns = async (datasetId: number) => {
  while (true) {
    await delay(3000);
    const existingMetadata = await getDatasetFeatureMetadata(datasetId);
    if (existingMetadata && existingMetadata.analyze_status !== 'processing') {
      if (existingMetadata.analyze_status === 'error') {
        throw new Error("Layanan OpenRouter gagal memetakan kolom.");
      }
      return existingMetadata;
    }
  }
};

const pollPreprocess = async (datasetId: number) => {
  while (true) {
    await delay(3000);
    const existingMetadata = await getDatasetFeatureMetadata(datasetId);
    if (existingMetadata && existingMetadata.preprocess_status !== 'processing') {
      if (existingMetadata.preprocess_status === 'error') {
        throw new Error(`Preprocessing gagal: ${existingMetadata.error_detail || 'Unknown error'}`);
      }
      return existingMetadata;
    }
  }
};

export function useAnalysis() {
  const router = useRouter();
  const [date, setDate] = useState<DateRange | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AnalysisMode>('both');
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [activeDatasetId, setActiveDatasetId] = useState<number>(-1);
  const [datasetData, setDatasetData] = useState<any>(null);
  const [isLoadingDataset, setIsLoadingDataset] = useState(false);
  const [forecastAggressiveness, setForecastAggressiveness] = useState(50);
  const [clusteringConfig, setClusteringConfig] = useState<{mode: 'auto' | 'manual'; clusterCount: number}>({ mode: 'auto', clusterCount: 3 });
  const [dataConfig, setDataConfig] = useState<DataConfigState>({
    availableColumns: [],
    dateColumn: '',
    targetColumn: '',
    includedColumns: []
  });
  const { logs: terminalLogs, setLogs: setTerminalLogs, setIsAnalysisReady } = useTerminal();
  const [dataConfigStatus, setDataConfigStatus] = useState<'menunggu' | 'berhasil' | 'gagal' | 'kosong'>('menunggu');
  const [rawFeatureMapping, setRawFeatureMapping] = useState<any | null>(null);

  const [hasInteractedForecasting, setHasInteractedForecasting] = useState(false);
  const [hasInteractedClustering, setHasInteractedClustering] = useState(false);

  useEffect(() => {
    const storedId = sessionStorage.getItem('pijak_active_dataset_id');
    if (storedId) {
      setActiveDatasetId(parseInt(storedId, 10));
    }

    const handleDatasetChanged = () => {
      const newStoredId = sessionStorage.getItem('pijak_active_dataset_id');
      if (newStoredId) {
        setActiveDatasetId(parseInt(newStoredId, 10));
      }
    };
    const openUploadModalEvent = () => setIsFileUploadOpen(true);

    window.addEventListener('dataset_changed', handleDatasetChanged);
    window.addEventListener('open_upload_modal', openUploadModalEvent);
    return () => {
      window.removeEventListener('dataset_changed', handleDatasetChanged);
      window.removeEventListener('open_upload_modal', openUploadModalEvent);
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
    const analyzeStepId = `analyze_col-${Date.now()}`;
    // 1. Pre-calling: Tambahkan log Inisialisasi ke Terminal
    setTerminalLogs((prev) => [
      ...prev,
      { stepId: `init-${Date.now()}`, text: forceReload ? 'system_ready: memuat ulang analisis fitur...' : 'system_ready: memulai pipeline otomatis...', status: 'info' },
      { stepId: analyzeStepId, text: forceReload ? `[OpenRouter] Menganalisis ulang metadata dataset #${datasetId}...` : `Memeriksa konfigurasi kolom dataset #${datasetId}...`, status: 'loading' }
    ]);
    setDataConfigStatus('menunggu');

    try {
      let mapping: any = null;

      // 1. Coba fetch metadata dari database terlebih dahulu jika bukan force reload
      if (!forceReload) {
        try {
          const existingMetadata = await getDatasetFeatureMetadata(datasetId);
          if (existingMetadata && Object.keys(existingMetadata).length > 0) {
            mapping = existingMetadata;
          }
        } catch (err) {
          console.warn("[Dashboard] Gagal memuat metadata dari database, beralih ke analisis ML...");
          setTerminalLogs((prev) => [...prev, { stepId: `meta_warn-${Date.now()}`, text: 'Metadata tidak ditemukan di database, beralih ke layanan ML...', status: 'info' }]);
        }
      }

      // 2. Jika tidak ada di database, panggil layanan ML OpenRouter
      if (!mapping) {
        setTerminalLogs((prev) => prev.map(log => 
          log.stepId === analyzeStepId ? { ...log, text: `[OpenRouter] Menganalisis metadata dataset #${datasetId}...` } : log
        ));
        
        const result = await analyzeColumns(datasetId, currentMode, forceReload);
        if (result.status === 'success' && result.suggested_mapping) {
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
          log.stepId === analyzeStepId ? { ...log, text: 'Konfigurasi kolom berhasil dimuat.', status: 'success' as const } : log
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
        log.status === 'loading' ? { ...log, text: `Pipeline Error: ${error.message}`, status: 'error' } : log
      ));
      setDataConfigStatus('gagal');
    }
  }, []);

  const handleUploadConfirm = useCallback(async (file: File) => {
    const uploadStepId = `upload-${Date.now()}`;
    try {
      setTerminalLogs((prev) => [...prev, { stepId: uploadStepId, text: `Mengunggah file ${file.name}...`, status: 'loading' }]);
      const data = await uploadDataset(file);
      setTerminalLogs((prev) => prev.map(log => log.stepId === uploadStepId ? { ...log, text: 'File berhasil diunggah.', status: 'success' } : log));
      setActiveDatasetId(data.dataset_id);
      setIsFileUploadOpen(false);
    } catch (error: any) {
      setTerminalLogs((prev) => prev.map(log => log.stepId === uploadStepId ? { ...log, text: `Gagal mengunggah: ${error.message}`, status: 'error' } : log));
      const isAuthError = error.message === "Unauthorized";
      alert(isAuthError ? "Sesi Anda telah berakhir (Token kedaluwarsa). Silakan muat ulang halaman." : error.message);
    }
  }, [analysisConfig.mode, runPreprocessingPipeline]);

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
      setTerminalLogs((prev) => [...prev, { stepId: uniqueStepId, text: 'Menyimpan konfigurasi kolom ke database...', status: 'loading' }]);
      
      const updatedMapping = JSON.parse(JSON.stringify(rawFeatureMapping));
      updatedMapping.col_date_time = dataConfig.dateColumn || null;
      updatedMapping.col_target = dataConfig.targetColumn || null;
      updatedMapping.cols_to_drop = dataConfig.availableColumns.filter(
          c => c !== dataConfig.dateColumn && c !== dataConfig.targetColumn && !dataConfig.includedColumns.includes(c)
      );

      await updateDatasetFeatureMetadata(activeDatasetId, updatedMapping);
      
      setTerminalLogs((prev) => prev.map(log => 
        log.stepId === uniqueStepId ? { ...log, text: 'Konfigurasi kolom berhasil disimpan.', status: 'success' } : log
      ));
      alert("Konfigurasi kolom berhasil disimpan!");
    } catch (error: any) {
      setTerminalLogs((prev) => prev.map(log => 
        log.stepId === uniqueStepId ? { ...log, text: `Gagal menyimpan: ${error.message}`, status: 'error' } : log
      ));
    }
  }, [activeDatasetId, dataConfig, rawFeatureMapping]);

  const handleRunAnalysis = useCallback(async () => {
    if (!analysisConfig.dateRange?.from || !analysisConfig.dateRange?.to) {
      console.warn('[Dashboard] Run Analysis aborted: No valid date range selected');
      return;
    }

    if (mode === 'forecasting' || mode === 'both') {
      try {
        const preprocessStepId = `run_preprocess-${Date.now()}`;
        setTerminalLogs((prev) => [...prev, { stepId: preprocessStepId, text: 'Melakukan preprocessing data...', status: 'loading' }]);
        
        const preprocessResult = await runPreprocess(analysisConfig.datasetId, mode);
        
        // Wait for background preprocessing
        const finalMetadata = await pollPreprocess(analysisConfig.datasetId);
        const insight = finalMetadata;
        const cleanedDatasetId = finalMetadata.cleaned_dataset_id || analysisConfig.datasetId;

        // Simpan dataset_id dari cleaned dataset ke state, yang juga akan disimpan ke session storage via useEffect
        setActiveDatasetId(cleanedDatasetId);

        setTerminalLogs((prev) => prev.map(log => 
          log.stepId === preprocessStepId ? { ...log, text: 'Preprocessing berhasil!', status: 'success' } : log
        ));

        const forecastStepId = `run_forecast-${Date.now()}`;
        setTerminalLogs((prev) => [...prev, { stepId: forecastStepId, text: 'Memulai pipeline forecasting...', status: 'loading' }]);
        
        let newColDate = analysisConfig.preferences.dataConfig.dateColumn;
        if (insight?.col_date_time) {
          if (typeof insight.col_date_time === 'string') {
            newColDate = insight.col_date_time;
          } else if (insight.col_date_time.col_whole) {
            newColDate = Array.isArray(insight.col_date_time.col_whole) 
              ? insight.col_date_time.col_whole[0] 
              : insight.col_date_time.col_whole;
          }
        }

        let newColTarget = analysisConfig.preferences.dataConfig.targetColumn;
        if (insight?.col_target) {
          newColTarget = insight.col_target;
        }

        const payload = {
          dataset_id: cleanedDatasetId,
          col_date: newColDate,
          col_product: newColTarget, // using target as product for now
          col_target: newColTarget,
          col_regressors: analysisConfig.preferences.dataConfig.includedColumns,
          horizon: 30, // Default to 30 periods
          freq: 'D'
        };
        
        console.info('Running Forecasting with payload:', payload);
        await runForecasting(payload);
        
        setTerminalLogs((prev) => prev.map(log => 
          log.stepId === forecastStepId ? { ...log, text: 'Forecasting berhasil dimulai!', status: 'success' } : log
        ));

        // Redirect to dashboard forecasting page
        router.push('/dasbor/forecasting');
      } catch (error: any) {
        setTerminalLogs((prev) => prev.map(log => 
          log.status === 'loading' ? { ...log, text: `Gagal menjalankan proses: ${error.message}`, status: 'error' } : log
        ));
      }
    }
  }, [analysisConfig, mode, router]);

  useEffect(() => {
    const handleRunAnalysisEvent = () => handleRunAnalysis();
    window.addEventListener('run_analysis_pipeline', handleRunAnalysisEvent);
    return () => {
      window.removeEventListener('run_analysis_pipeline', handleRunAnalysisEvent);
    };
  }, [handleRunAnalysis]);

  useEffect(() => {
    if (forecastAggressiveness !== 50) setHasInteractedForecasting(true);
  }, [forecastAggressiveness]);

  useEffect(() => {
    if (clusteringConfig.mode !== 'auto' || clusteringConfig.clusterCount !== 3) {
      setHasInteractedClustering(true);
    }
  }, [clusteringConfig]);

  const isPreferencesReady = (mode === 'forecasting' && hasInteractedForecasting) || 
                             (mode === 'clustering' && hasInteractedClustering) || 
                             (mode === 'both' && hasInteractedForecasting && hasInteractedClustering);

  const isReady = !!date?.from && !!date?.to && activeDatasetId !== -1 && isPreferencesReady;

  useEffect(() => {
    setIsAnalysisReady(isReady);
  }, [isReady, setIsAnalysisReady]);

  useEffect(() => {
    console.debug('[Dashboard] State updated:', { isReady, mode, date });
  }, [isReady, mode, date]);

  useEffect(() => {
    if (activeDatasetId !== -1) {
      sessionStorage.setItem('pijak_active_dataset_id', activeDatasetId.toString());
    } else {
      sessionStorage.removeItem('pijak_active_dataset_id');
    }
  }, [activeDatasetId]);

  useEffect(() => {
    if (activeDatasetId === -1) {
      setDatasetData(null);
      return;
    }

    const initDataAndPipeline = async () => {
      setIsLoadingDataset(true);
      const fetchStepId = `fetch-${activeDatasetId}-${Date.now()}`;
      setTerminalLogs((prev: TerminalStep[]) => [...prev, { stepId: fetchStepId, text: `Memuat dataset #${activeDatasetId} dari server...`, status: 'loading' }]);
      
      try {
        const csvString = await getDataset(activeDatasetId);

        let parsedData: any[] = [];
        let cols: string[] = [];
        if (csvString) {
          const lines = csvString.trim().split('\n');
          if (lines.length > 0) {
            const csvRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
            const headers = lines[0].split(csvRegex).map((h: string) => h.trim().replace(/^"|"$/g, ''));
            cols = headers;
            
            const maxRows = Math.min(lines.length, 51);
            
            for (let i = 1; i < maxRows; i++) {
              const line = lines[i];
              if (!line.trim()) continue; 
              
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
        setTerminalLogs((prev: TerminalStep[]) => prev.map((log: TerminalStep) => log.stepId === fetchStepId ? { ...log, text: `Dataset dimuat (${parsedData.length} baris diproses).`, status: 'success' } : log));
        setDatasetData(parsedData);
        
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
      } catch (error) {
        console.error("[Dashboard] Fetch Dataset Error:", error);
        setTerminalLogs((prev: TerminalStep[]) => prev.map((log: TerminalStep) => log.stepId === fetchStepId ? { ...log, text: `Gagal memuat dataset: ${(error as any).message}`, status: 'error' } : log));
      } finally {
        setIsLoadingDataset(false);
      }

      runPreprocessingPipeline(activeDatasetId, mode);
    };

    initDataAndPipeline();
  }, [activeDatasetId, mode, runPreprocessingPipeline, setTerminalLogs]);

  const modeLabel = useMemo(() => {
    switch (mode) {
      case 'forecasting': return 'Forecasting';
      case 'clustering': return 'Clustering';
      case 'both':
      default: return 'Forecasting & Clustering';
    }
  }, [mode]);

  const handleBackendMessage = useCallback((incomingPayload: string) => {
    const newLog = JSON.parse(incomingPayload) as TerminalStep;

    setTerminalLogs((prevLogs) => {
      const existingLogIndex = prevLogs.findIndex(log => log.stepId === newLog.stepId);
      
      if (existingLogIndex !== -1) {
        const updatedLogs = [...prevLogs];
        updatedLogs[existingLogIndex] = newLog;
        return updatedLogs;
      }

      return [...prevLogs, newLog];
    });
  }, [setTerminalLogs]);

  return {
    date, setDate,
    isOpen, setIsOpen,
    mode, setMode, modeLabel,
    isFileUploadOpen, setIsFileUploadOpen,
    activeDatasetId, datasetData, isLoadingDataset,
    forecastAggressiveness, setForecastAggressiveness,
    clusteringConfig, setClusteringConfig,
    dataConfig, setDataConfig, dataConfigStatus,
    terminalLogs,
    isReady,
    handleOpenUploadModal,
    handleUploadConfirm,
    handleReloadMapping,
    handleConfirmMapping,
    handleRunAnalysis,
    handleBackendMessage
  };
}
