'use client';

import { useState, useMemo } from 'react';
import { RefreshCw, Play, Loader2, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { AnalysisCard } from '@/components/main-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { ClusteringEmptyState } from './clustering-empty-state';
import { useClustering } from '@/hooks/use-clustering';
import { CLUSTER_COLORS } from '@/lib/utils';
import { KpiCard } from '@/components/main/clustering/kpi-card';
import { ClusterSummaryCards } from '@/components/main/clustering/cluster-summary-cards';
import { DistribusiChart } from '@/components/main/clustering/distribusi-chart';
import { KontribusiChart } from '@/components/main/clustering/kontribusi-chart';
import { TopBottomProducts } from '@/components/main/clustering/top-bottom-products';
import { ProductTable } from '@/components/main/clustering/product-table';
import { ClusterAccordion } from '@/components/main/clustering/cluster-accordion';
import { GradientLineChart } from '@/components/main/clustering/gradient-line-chart';
import { ClusterScatterChart } from '@/components/main/clustering/cluster-scatter-chart';
import { MetrikTable } from '@/components/main/clustering/metrik-table';
import { Tabs, TabsList, TabsTrigger } from "@/components/animate-ui/components/animate/tabs";

export default function ClusteringPage() {
  const {
    datasetId,
    columns,
    colProduct,
    setColProduct,
    colFitur,
    setColFitur,
    result,
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
    runClustering,
  } = useClustering();

  const filteredData = useMemo(() => {
    if (!result) return [];
    if (filterCluster === 'all') return result.cluster_data;
    return result.cluster_data.filter(d => String(d.cluster) === filterCluster);
  }, [result, filterCluster]);

  const uniqueClusters = useMemo(() => 
    result ? [...new Set(result.cluster_data.map(d => d.cluster))].sort((a, b) => a - b) : [],
    [result]
  );

  const clusterSizes = useMemo(() => {
    if (!result) return {};
    const counts: Record<number, number> = {};
    result.cluster_data.forEach(d => { counts[d.cluster] = (counts[d.cluster] || 0) + 1; });
    return counts;
  }, [result]);

  const clusterInsights = useMemo(() => {
    if (!result) return [];
    const text = result.insight_summary;
    const parts = text.split(/(?=Cluster \d+|Klaster \d+)/gi).filter(Boolean);
    return parts.length > 1 ? parts : uniqueClusters.map(() => text);
  }, [result, uniqueClusters]);

  const elbowData = useMemo(() => 
    result?.k_range.map((k, i) => ({ k, wcss: result.wcss_list[i] })) ?? [],
    [result]
  );
  
  const silhouetteData = useMemo(() => 
    result?.k_range.map((k, i) => ({ k, silhouette: result.silhouette_list[i] })) ?? [],
    [result]
  );

  if (!datasetId) return <div className="flex flex-col h-full w-full p-4"><ClusteringEmptyState /></div>;

  return (
    <div className="flex flex-col h-full w-full p-4 gap-3 overflow-y-auto">

      {/* Tabs Header - Absolute positioned at top like in Forecasting */}
      {result && (
        <div className="absolute top-0 inset-x-0 z-20 flex justify-center">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'hasil' | 'pengujian')}
          >
            <TabsList className="shadow-md backdrop-blur-md bg-white/85 border border-neutral-200/60 gap-1 p-1">
              <TabsTrigger
                value="hasil"
                className="flex items-center gap-1.5 text-xs px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <LayoutGrid className="size-3.5" />
                Hasil
              </TabsTrigger>
              <TabsTrigger
                value="pengujian"
                className="flex items-center gap-1.5 text-xs px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <CheckCircle2 className="size-3.5" />
                Pengujian
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Floating Dropdown Filter Cluster (Hanya muncul di Tab Hasil) */}
      {result && activeTab === 'hasil' && (
        <div className="absolute top-0 right-0 z-20">
          <Select value={filterCluster} onValueChange={setFilterCluster}>
            <SelectTrigger className="h-9 w-44 rounded-xl border-neutral-800/20 text-xs shadow-sm bg-white/80 backdrop-blur-sm">
              <SelectValue placeholder="Filter Cluster" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Klaster</SelectItem>
              {uniqueClusters.map(c => <SelectItem key={c} value={String(c)}>Klaster {c + 1}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Konfigurasi Awal (Hanya muncul jika belum ada hasil analisis) */}
      {!result && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          <AnalysisCard title="Konfigurasi Clustering" status="menunggu">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">Kolom Produk</span>
            <p className="text-xs text-neutral-400">Kolom yang berisi nama atau ID unik produk</p>
            <Select value={colProduct || undefined} onValueChange={setColProduct}>
              <SelectTrigger className="h-9 text-sm border-neutral-200 bg-neutral-50/50">
                <SelectValue placeholder="Pilih kolom produk..." />
              </SelectTrigger>
              <SelectContent>
                {columns.filter(c => c).map(col => <SelectItem key={col} value={col} className="text-sm">{col}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">Kolom Fitur</span>
            <p className="text-xs text-neutral-400">Kolom numerik sebagai dasar pengelompokan</p>
            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto border border-neutral-100 rounded-lg p-2 bg-neutral-50/50">
              {columns.filter(c => c && c !== colProduct).map(col => (
                <label key={col} className="flex items-center gap-2 cursor-pointer hover:bg-white rounded-md px-2 py-1 transition-colors">
                  <Checkbox checked={colFitur.includes(col)}
                    onCheckedChange={v => setColFitur(prev => v ? [...prev, col] : prev.filter(c => c !== col))}
                    className="h-3.5 w-3.5 shrink-0 data-[state=checked]:bg-[#2BBAEE] data-[state=checked]:border-[#2BBAEE]" />
                  <span className="text-sm text-neutral-700">{col}</span>
                </label>
              ))}
            </div>
            {colFitur.length > 0 && <span className="text-[11px] text-[#2BBAEE] font-medium">{colFitur.length} kolom dipilih</span>}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <div className="ml-auto">
            <button onClick={() => runClustering()} disabled={!colProduct || colFitur.length === 0 || isLoading}
              className={cn('flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all active:scale-95 shadow-sm',
                colProduct && colFitur.length > 0 && !isLoading
                  ? 'text-neutral-800 hover:opacity-90'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed')}
              style={colProduct && colFitur.length > 0 && !isLoading
                ? { background: 'linear-gradient(135deg, #90FDF2, #2BBAEE)' } : {}}>
                  {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                  {isLoading ? 'Memproses...' : 'Jalankan Clustering'}
            </button>
          </div>
        </div>
      </AnalysisCard>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-4 bg-white rounded-2xl border border-neutral-800/20 w-full py-16">
            <div className="relative">
              <div className="size-16 rounded-full border-4 border-[#2BBAEE]/20" />
              <div className="absolute inset-0 size-16 rounded-full border-4 border-t-[#2BBAEE] animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-neutral-700">Sedang menjalankan clustering...</p>
              <p className="text-xs text-neutral-400 mt-1">Proses ini mungkin memerlukan waktu beberapa saat</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab Panels */}
      {result && !isLoading && (
        <div className="relative flex-1 min-h-0 w-full mt-2">
          
      {/* TAB HASIL */}
          <div className={cn(
            "absolute inset-0 transition-opacity duration-300 flex flex-col gap-4 overflow-y-auto pb-6 px-4",
            activeTab === 'hasil' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
          )}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #2BBAEE, #90FDF2)' }}>
              K yang digunakan: {result.cluster_amount}
            </div>
            {result.cluster_amount !== result.optimal_k && (
              <span className="text-xs text-neutral-400 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                K optimal sistem: {result.optimal_k}
              </span>
            )}
          </div>

          <ClusterSummaryCards result={result} colFitur={colFitur} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <AnalysisCard title="Distribusi Produk per Klaster" status="berhasil">
              <DistribusiChart result={result} />
            </AnalysisCard>
            <AnalysisCard title={`Kontribusi ${colFitur[0] || 'Nilai'} per Klaster`} status="berhasil">
              <KontribusiChart result={result} colFitur={colFitur} />
            </AnalysisCard>
          </div>

          <AnalysisCard title={`Top & Bottom Produk berdasarkan ${colFitur[0] || 'Fitur Utama'}`} status="berhasil">
            <TopBottomProducts result={result} colFitur={colFitur} />
          </AnalysisCard>

          <AnalysisCard title="Detail Semua Produk" status="berhasil">
            <ProductTable data={filteredData} colFitur={colFitur} />
          </AnalysisCard>

          <AnalysisCard title="Analisis & Insight per Klaster" status="berhasil">
            <div className="flex flex-col gap-2">
              {uniqueClusters.map((c, i) => (
                <ClusterAccordion key={c} clusterIndex={c}
                  color={CLUSTER_COLORS[i % CLUSTER_COLORS.length]}
                  productCount={clusterSizes[c] || 0}
                  insight={clusterInsights[i] || result.insight_summary} />
              ))}
            </div>
          </AnalysisCard>
        </div>

      {/* TAB PENGUJIAN */}
          <div className={cn(
            "absolute inset-0 transition-opacity duration-300 flex flex-col gap-4 overflow-y-auto pb-6 px-4",
            activeTab === 'pengujian' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
          )}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KpiCard title="Silhouette Score" value={result.silhouette_score} sub="Semakin tinggi semakin baik (maks 1)" opacity={0.12} />
            <KpiCard title="WCSS Score" value={result.wcss_score.toFixed(1)} sub="Semakin rendah semakin baik" opacity={0.08} />
            <KpiCard title="K Optimal" value={result.optimal_k} sub="Rekomendasi sistem" opacity={0.16} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <AnalysisCard title="Analisis Elbow (WCSS)" status="berhasil">
              <GradientLineChart data={elbowData} dataKey="wcss" color="#2BBAEE" endColor="#90FDF2"
                gradientId="elbowGrad" label="WCSS" optimalK={result.optimal_k} yLabel="WCSS" />
              <p className="text-xs text-neutral-400 text-center mt-1">
                <span className="inline-block size-2.5 rounded-full bg-amber-400 mr-1.5 align-middle" />
                K optimal = {result.optimal_k}
              </p>
            </AnalysisCard>
            <AnalysisCard title="Analisis Silhouette Score" status="berhasil">
              <GradientLineChart data={silhouetteData} dataKey="silhouette" color="#10b981" endColor="#86efac"
                gradientId="silhouetteGrad" label="Silhouette" optimalK={result.optimal_k} yLabel="Score" />
              <p className="text-xs text-neutral-400 text-center mt-1">
                <span className="inline-block size-2.5 rounded-full bg-amber-400 mr-1.5 align-middle" />
                K optimal = {result.optimal_k}
              </p>
            </AnalysisCard>
          </div>

          <AnalysisCard title="Visualisasi Sebaran Klaster" status="berhasil">
            <ClusterScatterChart result={result} colFitur={colFitur} />
          </AnalysisCard>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            <AnalysisCard title="Perbandingan Metrik per K" status="berhasil" className="lg:col-span-3">
              <MetrikTable result={result} />
            </AnalysisCard>

              {/* Satu-satunya Card Konfigurasi Analisis Ulang (Gabungan Column & K Selection) */}
              <AnalysisCard title="Konfigurasi & Analisis Ulang" status="kosong" className="lg:col-span-2">
                <div className="flex flex-col gap-4">
                  {/* Pilihan Kolom Produk */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Kolom Produk</span>
                    <Select value={colProduct || undefined} onValueChange={setColProduct}>
                      <SelectTrigger className="h-9 text-xs border-neutral-200 bg-neutral-50/50">
                        <SelectValue placeholder="Pilih kolom produk..." />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.filter(c => c).map(col => <SelectItem key={col} value={col} className="text-xs">{col}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pilihan Kolom Fitur */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Kolom Fitur</span>
                    <div className="flex flex-col gap-1 max-h-28 overflow-y-auto border border-neutral-100 rounded-lg p-2 bg-neutral-50/50">
                      {columns.filter(c => c && c !== colProduct).map(col => (
                        <label key={col} className="flex items-center gap-2 cursor-pointer hover:bg-white rounded-md px-2 py-0.5 transition-colors">
                          <Checkbox checked={colFitur.includes(col)}
                            onCheckedChange={v => setColFitur(prev => v ? [...prev, col] : prev.filter(c => c !== col))}
                            className="h-3.5 w-3.5 shrink-0 data-[state=checked]:bg-[#2BBAEE] data-[state=checked]:border-[#2BBAEE]" />
                          <span className="text-xs text-neutral-700">{col}</span>
                        </label>
                      ))}
                </div>
                  </div>

                  {/* Penyesuaian K */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Jumlah Klaster (K)</span>
                      <span className="text-xl font-bold tabular-nums" style={{ color: '#2BBAEE' }}>K = {customK}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 9 }, (_, i) => i + 2).map(n => (
                    <button key={n} onClick={() => setCustomK(n)}
                          className={cn('flex size-7 items-center justify-center rounded-lg text-xs font-bold transition-all active:scale-90',
                        n === customK ? 'text-white shadow-sm' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200')}
                      style={n === customK ? { background: 'linear-gradient(135deg, #2BBAEE, #90FDF2)' } : {}}>
                      {n}
                    </button>
                  ))}
                </div>
                <Slider min={2} max={10} step={1} value={[customK]} onValueChange={([v]) => setCustomK(v)} />
                  </div>

                  {/* Tombol Analisis Ulang */}
                  <button onClick={() => { setIsReanalyzing(true); runClustering(customK); }}
                    disabled={!colProduct || colFitur.length === 0 || isReanalyzing}
                    className="flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-neutral-800 hover:opacity-90 shadow-sm transition-all active:scale-95 disabled:opacity-50 mt-2"
                  style={{ background: 'linear-gradient(135deg, #90FDF2, #2BBAEE)' }}>
                  {isReanalyzing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  Analisis Kembali
                </button>
              </div>
            </AnalysisCard>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
