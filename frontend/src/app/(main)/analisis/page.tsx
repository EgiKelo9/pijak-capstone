'use client';

import { format } from 'date-fns';
import * as React from 'react';
import { DateRange } from 'react-day-picker';

import { FileUploadDemo } from '@/components/file-upload-demo';
import { analyzeColumns, getDataset, uploadDataset } from '@/lib/middle-man';
import { DataConfigState } from './column-preference';
import { EmptyStateView } from './dashboard-empty-state';
import { FilledStateView } from './dashboard-filled-state';
import { DashboardHeader } from './dashboard-header';
import type { TerminalStep } from './terminal';

type AnalysisMode = 'forecasting' | 'clustering' | 'both';

interface AnalysisConfig {
  mode: AnalysisMode;
  dateRange: DateRange | undefined;
  datasetId: number
  preferences: {
    forecastAggressiveness: number;
    clusteringConfig: { mode: 'auto' | 'manual'; clusterCount: number };
    dataConfig: DataConfigState;
  }
}

export default function AnalysisEmptyState() {
  const [date, setDate] = React.useState<DateRange | undefined>();
  const [isOpen, setIsOpen] = React.useState(false);
  const [mode, setMode] = React.useState<AnalysisMode>('both');
  const [isFileUploadOpen, setIsFileUploadOpen] = React.useState(false);
  const [activeDatasetId, setActiveDatasetId] = React.useState<number>(-1);
  const [datasetData, setDatasetData] = React.useState<any>(null);
  const [isLoadingDataset, setIsLoadingDataset] = React.useState(false);
  const [forecastAggressiveness, setForecastAggressiveness] = React.useState(50);
  const [clusteringConfig, setClusteringConfig] = React.useState<{mode: 'auto' | 'manual'; clusterCount: number}>({ mode: 'auto', clusterCount: 3 });
  const [dataConfig, setDataConfig] = React.useState<DataConfigState>({
    availableColumns: [],
    dateColumn: '',
    targetColumn: '',
    includedColumns: []
  });
  const [terminalLogs, setTerminalLogs] = React.useState<TerminalStep[]>([]);
  const [dataConfigStatus, setDataConfigStatus] = React.useState<'menunggu' | 'berhasil' | 'gagal' | 'kosong'>('menunggu');

  // Mengambil datasetId dari session storage saat pertama kali dimuat (jika ada)
  React.useEffect(() => {
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

  // Memoize the config for stable references if passed to useEffects later
  const analysisConfig = React.useMemo<AnalysisConfig>(() => ({
    mode,
    dateRange: date,
    datasetId: activeDatasetId,
    preferences: {
      forecastAggressiveness,
      clusteringConfig,
      dataConfig
    }
  }), [mode, date, activeDatasetId, forecastAggressiveness, clusteringConfig, dataConfig]);

  const handleOpenUploadModal = React.useCallback(() => {
    console.info('=== [DUMMY PAYLOAD] UNGGAH CSV ===');
    console.info('Current Config Context:', analysisConfig);
    console.info('-> Ready to trigger file upload dialog or API...');
    console.info('========================================');
    setIsFileUploadOpen(true);
  }, [analysisConfig]);

  // Fungsi orkestrasi Pipeline ML (Dipanggil otomatis setelah upload sukses)
  const runPreprocessingPipeline = React.useCallback(async (datasetId: number, currentMode: string, forceReload: boolean = false) => {
    // 1. Pre-calling: Tambahkan log Inisialisasi ke Terminal
    setTerminalLogs([
      { stepId: 'init', text: forceReload ? 'system_ready: memuat ulang analisis fitur...' : 'system_ready: memulai pipeline otomatis...', status: 'info' },
      { stepId: 'analyze_col', text: `[OpenRouter] Menganalisis metadata dataset #${datasetId}...`, status: 'loading' }
    ]);
    setDataConfigStatus('menunggu');

    try {
      const result = await analyzeColumns(datasetId, currentMode, forceReload);

      if (result.status === 'success' && result.suggested_mapping) {
        const mapping = result.suggested_mapping;
        
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
          log.stepId === 'analyze_col' ? { ...log, text: '[OpenRouter] Pemetaan kolom berhasil dianalisis.', status: 'success' } : log
        ));
      } else {
        setDataConfigStatus('gagal');
        setTerminalLogs((prev) => prev.map(log => 
          log.stepId === 'analyze_col' ? { ...log, text: '[OpenRouter] Gagal menganalisis pemetaan kolom.', status: 'error' } : log
        ));
      }

      // 3. Pre-calling Langkah 2 (Jika Anda perlu memanggil endpoint clean data terpisah)
      // setTerminalLogs((prev) => [...prev, { stepId: 'data_clean', text: 'Memulai pembersihan data...', status: 'loading' }]);
      // await fetch(...); dsb

    } catch (error: any) {
      // 4. Post-calling: Gagal - Ubah status log yang loading menjadi error
      setTerminalLogs((prev) => prev.map(log => 
        log.status === 'loading' ? { ...log, text: `Pipeline Error: ${error.message}`, status: 'error' } : log
      ));
      setDataConfigStatus('gagal');
    }
  }, []);

  const handleUploadConfirm = React.useCallback(async (file: File) => {
    try {
      const data = await uploadDataset(file);
      console.log("[Dashboard] Upload Success. Dataset ID:", data.dataset_id);
      setActiveDatasetId(data.dataset_id);
      setIsFileUploadOpen(false); // Tutup modal unggah setelah berhasil
    } catch (error: any) {
      console.error("[Dashboard] Upload Error:", error);
      const isAuthError = error.message === "Unauthorized";
      alert(isAuthError ? "Sesi Anda telah berakhir (Token kedaluwarsa). Silakan muat ulang halaman." : error.message);
    }
  }, [analysisConfig.mode, runPreprocessingPipeline]);

  const handleReloadMapping = React.useCallback(() => {
    if (activeDatasetId !== -1) {
      runPreprocessingPipeline(activeDatasetId, mode, true);
    }
  }, [activeDatasetId, mode, runPreprocessingPipeline]);

  const handleConfirmMapping = React.useCallback(async () => {
    if (activeDatasetId === -1) return;
    
    try {
      setTerminalLogs((prev) => [...prev, { stepId: 'confirm_col', text: 'Menyimpan konfigurasi kolom ke database...', status: 'loading' }]);
      
      // Mapping konfigurasi UI saat ini ke format backend (Feature schema)
      const featureMapping = {
        col_date_time: dataConfig.dateColumn || undefined,
        col_target: dataConfig.targetColumn || undefined,
        cols_to_drop: dataConfig.availableColumns.filter(
          c => c !== dataConfig.dateColumn && c !== dataConfig.targetColumn && !dataConfig.includedColumns.includes(c)
        )
      };

      // TODO: Panggil fungsi update_dataset_feature_metadata() dari lib/middle-man Anda
      // await updateDatasetFeatureMetadata(activeDatasetId, featureMapping);
      
      setTerminalLogs((prev) => prev.map(log => 
        log.stepId === 'confirm_col' ? { ...log, text: 'Konfigurasi kolom berhasil disimpan.', status: 'success' } : log
      ));
      alert("Konfigurasi kolom berhasil disimpan!");
    } catch (error: any) {
      setTerminalLogs((prev) => prev.map(log => 
        log.stepId === 'confirm_col' ? { ...log, text: `Gagal menyimpan: ${error.message}`, status: 'error' } : log
      ));
    }
  }, [activeDatasetId, dataConfig]);

  const handleRunAnalysis = React.useCallback(() => {
    if (!analysisConfig.dateRange?.from || !analysisConfig.dateRange?.to) {
      console.warn('[Dashboard] Run Analysis aborted: No valid date range selected');
      return;
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
  }, [analysisConfig]);

  const modeLabel = React.useMemo(() => {
    switch (mode) {
      case 'forecasting': return 'Forecasting';
      case 'clustering': return 'Clustering';
      case 'both':
      default: return 'Forecasting & Clustering';
    }
  }, [mode]);

  const isReady = !!date?.from && !!date?.to;

  // Centralized state monitor to track behavior updates in real-time
  React.useEffect(() => {
    console.debug('[Dashboard] State updated:', { isReady, mode, date });
  }, [isReady, mode, date]);

  // Menyimpan datasetId ke session storage secara reaktif tiap kali nilainya berubah
  React.useEffect(() => {
    if (activeDatasetId !== -1) {
      sessionStorage.setItem('pijak_active_dataset_id', activeDatasetId.toString());
    } else {
      sessionStorage.removeItem('pijak_active_dataset_id');
    }
  }, [activeDatasetId]);

  // Otomatis Fetch Dataset setiap kali activeDatasetId berubah menjadi valid
  React.useEffect(() => {
    if (activeDatasetId === -1) {
      setDatasetData(null);
      return;
    }

    const fetchDatasetInfo = async () => {
      setIsLoadingDataset(true);
      try {
        const csvString = await getDataset(activeDatasetId);

        let parsedData: any[] = [];
        if (csvString) {
          const lines = csvString.trim().split('\n');
          if (lines.length > 0) {
            // Regex ini memisahkan berdasarkan koma, kecuali jika koma tersebut ada di dalam tanda kutip ("")
            const csvRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
            const headers = lines[0].split(csvRegex).map((h: string) => h.trim().replace(/^"|"$/g, ''));
            
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
          }
        }
        console.log(`[Dashboard] Parsed ${parsedData.length} rows for preview`);
        setDatasetData(parsedData);
        
        // Ekstrak nama kolom untuk inisiasi Konfigurasi Data
        if (parsedData.length > 0) {
          const cols = Object.keys(parsedData[0]);
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
    };

    fetchDatasetInfo();

    // Jalankan pipeline otomatis saat dataset dimuat (baik dari upload baru maupun session storage)
    runPreprocessingPipeline(activeDatasetId, mode);
  }, [activeDatasetId]);

  // ... fungsi ketika menerima payload dari backend ...
  const handleBackendMessage = (incomingPayload: string) => {
    const newLog = JSON.parse(incomingPayload) as TerminalStep;

    setTerminalLogs((prevLogs) => {
      // Jika backend mengirim status success/error, kita UPDATE log yang sedang loading
      const existingLogIndex = prevLogs.findIndex(log => log.stepId === newLog.stepId);
      
      if (existingLogIndex !== -1) {
        const updatedLogs = [...prevLogs];
        updatedLogs[existingLogIndex] = newLog; // Ganti "loading" dengan "success"
        return updatedLogs;
      }

      // Jika ini adalah stepId baru, tambahkan ke baris bawah terminal
      return [...prevLogs, newLog];
    });
  };

  return (
    <div className="flex h-full flex-1 flex-col gap-3 min-h-0 min-w-0">
      <DashboardHeader
        mode={mode}
        setMode={setMode}
        date={date}
        setDate={setDate}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />

      <div className="flex h-full flex-1 flex-col min-h-0">
        {activeDatasetId !== -1 ? (
          <FilledStateView 
            tableData={datasetData || []} 
            forecastAggressiveness={forecastAggressiveness}
            setForecastAggressiveness={setForecastAggressiveness}
            clusteringConfig={clusteringConfig}
            setClusteringConfig={setClusteringConfig}
            dataConfig={dataConfig}
            setDataConfig={setDataConfig}
            terminalLogs={terminalLogs}
            cardStatuses={{ dataConfig: dataConfigStatus }}
            onConfirmMapping={handleConfirmMapping}
            onReloadMapping={handleReloadMapping}
          />
        ) : (
          <EmptyStateView
            modeLabel={modeLabel}
            isReady={isReady}
            dateRange={date}
            onUpload={handleOpenUploadModal}
            onRunAnalysis={handleRunAnalysis}
          />
        )}
      </div>
      <FileUploadDemo 
        isOpen={isFileUploadOpen} 
        onClose={() => setIsFileUploadOpen(false)} 
        onUploadConfirm={handleUploadConfirm}
      />
    </div>
  );
}