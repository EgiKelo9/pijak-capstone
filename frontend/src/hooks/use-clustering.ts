import { useState, useEffect, useCallback } from 'react';
import { getClusteringHistory, getClusteringResult, runClustering } from '@/services/clustering';
import { getDataset } from '@/services/analysis';
import { ClusteringResultData } from '@/types';

export function useClustering() {
  const [datasetId, setDatasetId] = useState<number | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [colProduct, setColProduct] = useState('');
  const [colFitur, setColFitur] = useState<string[]>([]);
  const [rawData, setRawData] = useState<Record<string, any>[]>([]);
  const [result, setResult] = useState<ClusteringResultData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'hasil' | 'pengujian'>('hasil');
  const [filterCluster, setFilterCluster] = useState('all');
  const [customK, setCustomK] = useState(3);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  const fetchLatestResult = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const history = await getClusteringHistory();
      if (!history || history.length === 0) {
        setIsLoading(false);
        return;
      }

      const sortedHistory = history.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const latest = sortedHistory[0];

      if (latest.status === 'berhasil' && latest.result) {
        setResult(latest.result);
        setCustomK(latest.result.cluster_amount);
        if (latest.result.cluster_data && latest.result.cluster_data.length > 0) {
          const sample = latest.result.cluster_data[0];
          const keys = Object.keys(sample);
          setColProduct('product');
          setColFitur(keys.filter(k => k !== 'product' && k !== 'cluster' && typeof sample[k] === 'number'));
        }
      } else if (latest.status === 'gagal') {
        setError("Proses clustering terakhir gagal.");
      } else {
        const resData = await getClusteringResult(latest.analysis_id);
        setResult(resData);
        setCustomK(resData.cluster_amount);
        if (resData.cluster_data && resData.cluster_data.length > 0) {
          const sample = resData.cluster_data[0];
          const keys = Object.keys(sample);
          setColProduct('product');
          setColFitur(keys.filter(k => k !== 'product' && k !== 'cluster' && typeof sample[k] === 'number'));
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch clustering data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRunClustering = useCallback(async (nClusters?: number) => {
    if (!colProduct || colFitur.length === 0 || !datasetId) return;
    setIsLoading(true);
    setError(null);
    try {
      // 1. Kirim request run ke backend
      const response = await runClustering({
        dataset_id: datasetId,
        col_product: colProduct,
        col_fitur: colFitur,
        n_clusters: nClusters ?? null,
      });

      const newAnalysisId = (response as any)?.analysis_id;
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

        const history = await getClusteringHistory();
        const entry = history?.find((h) => h.analysis_id === newAnalysisId);

        if (!entry) {
          await new Promise((r) => setTimeout(r, 8000));
          return poll();
        }

        if (entry.status === 'berhasil' && entry.result) {
          setResult(entry.result);
          setCustomK(entry.result.cluster_amount);
          setActiveTab('hasil');
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
    } catch (e: any) {
      setError(e.message || "Clustering gagal");
    } finally {
      setIsLoading(false);
      setIsReanalyzing(false);
    }
  }, [colProduct, colFitur, datasetId]);

  useEffect(() => {
    const storedId = sessionStorage.getItem('pijak_cleaned_clustering_id') || sessionStorage.getItem('pijak_active_dataset_id');
    if (storedId) {
      const id = parseInt(storedId, 10);
      setDatasetId(id);

      const loadData = async () => {
        try {
          const csvString = await getDataset(id);
          if (csvString) {
            const parseCSVLine = (line: string): string[] => {
              const res: string[] = [];
              let current = '';
              let inQuotes = false;
              for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                  if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
                  else inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                  res.push(current.trim());
                  current = '';
                } else {
                  current += char;
                }
              }
              res.push(current.trim());
              return res;
            };

            const lines = csvString.split('\n').filter(Boolean);
            const headers = parseCSVLine(lines[0]);
            setColumns(headers);
            const data = lines.slice(1).map((line: string) => {
              const vals = parseCSVLine(line);
              return headers.reduce((acc, h, i) => {
                const raw = vals[i] ?? '';
                acc[h] = isNaN(Number(raw)) || raw === '' ? raw.replace(/^"+|"+$/g, '') : Number(raw);
                return acc;
              }, {} as Record<string, any>);
            });
            setRawData(data);
          }
        } catch (e) {
          console.error("Gagal memuat atau mem-parsing dataset:", e);
        }
      };

      loadData();
    }

    fetchLatestResult();
  }, [fetchLatestResult]);

  useEffect(() => {
    if (result && rawData.length > 0) {
      const sample = result.cluster_data[0];
      if (sample) {
        const keys = Object.keys(sample);
        const sampleRaw = rawData[0];
        const numericKeys = keys.filter(k => {
          if (k === 'product' || k === 'cluster') return false;
          const rawCol = Object.keys(sampleRaw).find(rk => rk.toLowerCase() === k.toLowerCase());
          if (rawCol) {
            return typeof sampleRaw[rawCol] === 'number';
          }
          return typeof sample[k] === 'number';
        });
        setColProduct('product');
        setColFitur(numericKeys);
      }
    }
  }, [result, rawData]);

  return {
    datasetId,
    columns,
    colProduct,
    setColProduct,
    colFitur,
    setColFitur,
    rawData,
    result,
    setResult,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    filterCluster,
    setFilterCluster,
    customK,
    setCustomK,
    isReanalyzing,
    setIsReanalyzing,
    runClustering: handleRunClustering,
    refetch: fetchLatestResult,
  };
}
