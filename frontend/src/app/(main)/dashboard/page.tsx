'use client';

import { format } from 'date-fns';
import * as React from 'react';
import { DateRange } from 'react-day-picker';

import { FileUploadDemo } from '@/components/file-upload-demo';
import { DataConfigState } from './column-preference';
import { EmptyStateView } from './dashboard-empty-state';
import { FilledStateView } from './dashboard-filled-state';
import { DashboardHeader } from './dashboard-header';

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

  // Mengambil datasetId dari session storage saat pertama kali dimuat (jika ada)
  React.useEffect(() => {
    const storedId = sessionStorage.getItem('pijak_active_dataset_id');
    if (storedId) {
      setActiveDatasetId(parseInt(storedId, 10));
    }
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

  const handleUploadConfirm = React.useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    // TODO: Retrieve token dynamically from your auth provider (e.g. NextAuth or cookies)
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJleHAiOjE3ODA1MDMyMjh9.gV4t4FejMZeJrDjyf8aCxJGMHWi5x2pYUOPCOpVySX4'; 
    
    // TODO: Use environment variables instead of hardcoded localhost
    const response = await fetch("http://localhost:5000/api/v1/datasets/upload", {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    // Cek apakah response benar-benar JSON (mencegah SyntaxError JSON.parse)
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const textError = await response.text();
      console.error("[Dashboard] Non-JSON response from upload:", textError);
      throw new Error(`Server error: Expected JSON but received HTML/Text. Check backend logs.`);
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to upload dataset");
    }

    console.log("[Dashboard] Upload Success. Dataset ID:", result.data.dataset_id);
    setActiveDatasetId(result.data.dataset_id);
  }, []);

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
        // TODO: Retrieve token dynamically from your auth provider
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJleHAiOjE3ODA1MDMyMjh9.gV4t4FejMZeJrDjyf8aCxJGMHWi5x2pYUOPCOpVySX4'; 
        
        const response = await fetch(`http://localhost:5000/api/v1/datasets/${activeDatasetId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const contentType = response.headers.get("content-type");
        let csvString = "";

        if (contentType && contentType.includes("application/json")) {
          const result = await response.json();
          if (!response.ok || result.error) {
            throw new Error(result.message || "Failed to fetch dataset");
          }
          console.log("[Dashboard] Fetch Dataset Success (JSON):", result.data);
          csvString = result.data?.dataset_file || "";
        } else {
          // Fallback jika API mengembalikan raw text / CSV langsung
          csvString = await response.text();
          if (!response.ok) {
            throw new Error(`Server error: ${csvString.substring(0, 100)}`);
          }
          console.log("[Dashboard] Fetch Dataset Success (Raw Text/CSV). Length:", csvString.length);
        }

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
          setDataConfig({
            availableColumns: cols,
            dateColumn: cols[0] || '', // Set default kolom pertama sebagai tanggal
            targetColumn: cols.length > 1 ? cols[1] : (cols[0] || ''), // Set default kolom kedua sebagai target
            includedColumns: cols.length > 2 ? cols.slice(2) : [] // Sisanya dimasukkan sebagai fitur
          });
        }
      } catch (error) {
        console.error("[Dashboard] Fetch Dataset Error:", error);
      } finally {
        setIsLoadingDataset(false);
      }
    };

    fetchDatasetInfo();
  }, [activeDatasetId]);

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