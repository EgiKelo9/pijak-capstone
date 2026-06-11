import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { analyzeColumns, getDataset, getDatasetFeatureMetadata, updateDatasetFeatureMetadata, uploadDataset, runPreprocess } from '@/services/analysis';
import { runForecasting } from '@/services/forecasting';
import { useRouter } from 'next/navigation';
import type { AnalysisMode, AnalysisConfig, TerminalStep } from '@/types';
import { DataConfigState } from '@/types';

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
  const [terminalLogs, setTerminalLogs] = useState<TerminalStep[]>([]);
  const [dataConfigStatus, setDataConfigStatus] = useState<'menunggu' | 'berhasil' | 'gagal' | 'kosong'>('menunggu');
  const [rawFeatureMapping, setRawFeatureMapping] = useState<any | null>(null);

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
  }, []);

  const runPreprocessingPipeline = useCallback(async (datasetId: number, currentMode: string, forceReload: boolean = false) => {
    setTerminalLogs([
      { stepId: 'init', text: forceReload ? 'system_ready: memuat ulang analisis fitur...' : 'system_ready: memulai pipeline otomatis...', status: 'info' },
      { stepId: 'analyze_col', text: forceReload ? `[OpenRouter] Menganalisis ulang metadata dataset #${datasetId}...` : `Memeriksa konfigurasi kolom dataset #${datasetId}...`, status: 'loading' }
    ]);
    setDataConfigStatus('menunggu');

    try {
      let mapping: any = null;
      let shouldAnalyze = true;

      if (!forceReload) {
        try {
          const existingMetadata = await getDatasetFeatureMetadata(datasetId);
          if (existingMetadata && Object.keys(existingMetadata).length > 0) {
            if (existingMetadata.analyze_status === 'processing') {
              mapping = await pollAnalyzeColumns(datasetId);
              shouldAnalyze = false;
            } else if (existingMetadata.analyze_status !== 'error') {
              mapping = existingMetadata;
              shouldAnalyze = false;
            }
          }
        } catch (err) {
          console.warn("[Dashboard] Gagal memuat metadata dari database, beralih ke analisis ML...");
        }
      }

      if (shouldAnalyze) {
        setTerminalLogs((prev) => prev.map(log => 
          log.stepId === 'analyze_col' ? { ...log, text: `[OpenRouter] Menganalisis metadata dataset #${datasetId}...` } : log
        ));
        
        const response = await analyzeColumns(datasetId, currentMode, forceReload);
        const result = response.data;
        if (result.status === 'success' && result.suggested_mapping) {
          mapping = result.suggested_mapping;
        } else if (result.status === 'processing') {
          mapping = await pollAnalyzeColumns(datasetId);
        } else {
          throw new Error("Layanan OpenRouter gagal memetakan kolom.");
        }
      }

      setRawFeatureMapping(mapping);
        
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
        setTerminalLogs((prev) => prev.map(log => 
          log.stepId === 'analyze_col' ? { ...log, text: 'Konfigurasi kolom berhasil dimuat.', status: 'success' } : log
        ));

    } catch (error: any) {
      setRawFeatureMapping(null);
      setTerminalLogs((prev) => prev.map(log => 
        log.status === 'loading' ? { ...log, text: `Pipeline Error: ${error.message}`, status: 'error' } : log
      ));
      setDataConfigStatus('gagal');
    }
  }, []);

  const handleUploadConfirm = useCallback(async (file: File) => {
    try {
      const data = await uploadDataset(file);
      setActiveDatasetId(data.dataset_id);
      setIsFileUploadOpen(false);
    } catch (error: any) {
      const isAuthError = error.message === "Unauthorized";
      alert(isAuthError ? "Sesi Anda telah berakhir (Token kedaluwarsa). Silakan muat ulang halaman." : error.message);
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

  const isReady = !!date?.from && !!date?.to;

  // Auto-set date range based on dataset and selected date column
  useEffect(() => {
    if (activeDatasetId === -1 || !dataConfig.dateColumn) return;

    const computeDateRange = async () => {
      try {
        const csvString = await getDataset(activeDatasetId);
        if (!csvString) return;

        const lines = csvString.trim().split('\n');
        if (lines.length < 2) return;

        const csvRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
        const headers = lines[0].split(csvRegex).map((h: string) => h.trim().replace(/^"|"$/g, ''));
        const dateColIndex = headers.indexOf(dataConfig.dateColumn);

        if (dateColIndex === -1) return;

        let minDate: Date | null = null;
        let maxDate: Date | null = null;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          
          const values = line.split(csvRegex);
          const dateStr = values[dateColIndex]?.trim().replace(/^"|"$/g, '');
          if (!dateStr) continue;

          // Parse using Date
          const dateObj = new Date(dateStr);
          if (isNaN(dateObj.getTime())) continue;

          if (!minDate || dateObj < minDate) minDate = dateObj;
          if (!maxDate || dateObj > maxDate) maxDate = dateObj;
        }

        if (minDate && maxDate) {
          setDate({ from: minDate, to: maxDate });
        }
      } catch (error) {
        console.error("[Dashboard] Failed to compute date range:", error);
      }
    };

    computeDateRange();
  }, [activeDatasetId, dataConfig.dateColumn]);

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
          }
        }
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
      } finally {
        setIsLoadingDataset(false);
      }

      runPreprocessingPipeline(activeDatasetId, mode);
    };

    initDataAndPipeline();
  }, [activeDatasetId, mode, runPreprocessingPipeline]);

  const modeLabel = useMemo(() => {
    switch (mode) {
      case 'forecasting': return 'Forecasting';
      case 'clustering': return 'Clustering';
      case 'both':
      default: return 'Forecasting & Clustering';
    }
  }, [mode]);

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
    handleRunAnalysis
  };
}
