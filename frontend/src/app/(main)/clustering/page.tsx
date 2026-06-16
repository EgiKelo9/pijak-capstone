'use client';

import { useState, useMemo, CSSProperties } from 'react';
import { RefreshCw, Play, Loader2, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { AnalysisCard } from '@/components/main-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { AnalysisEmptyState } from '@/components/analysis-empty-state';
import { AnalysisLoadingState } from '@/components/analysis-loading-state';
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

export function useHoverStyle(baseStyle?: CSSProperties) {
  const [hovered, setHovered] = useState(false);
  const style: CSSProperties = {
    ...baseStyle,
    transform: hovered ? 'translateY(-3px) scale(1.01)' : 'translateY(0) scale(1)',
    boxShadow: hovered ? '0 12px 32px rgba(43,186,238,0.13)' : '0 1px 4px rgba(0,0,0,0.06)',
    transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
    cursor: 'pointer',
  };
  return { hovered, setHovered, style };
}

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

  const parsedInsight = useMemo(() => {
    if (!result) return { categories: {} as Record<number, string>, insights: {} as Record<number, string>, priorities: [] as string[] };
    const text = result.insight_summary || '';
    
    const categories: Record<number, string> = {};
    const insights: Record<number, string> = {};
    const priorities: string[] = [];
    
    // ── Strategy 1: Split by well-known section headers ────────────────────
    const sections = text.split(/(?=KATEGORI CLUSTER:|INSIGHT PER CLUSTER:|PRIORITAS AKSI BISNIS:)/gi);
    
    sections.forEach(section => {
      const cleanSec = section.trim();

      // ── KATEGORI CLUSTER ────────────────────────────────────────────────
      if (cleanSec.toUpperCase().startsWith("KATEGORI CLUSTER:")) {
        const content = cleanSec.replace(/KATEGORI CLUSTER:\s*/i, '');
        // Try line-by-line first
        const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
        const tempCats: { num: number; val: string }[] = [];

        if (lines.length > 1) {
          // Multi-line format: each line is "Klaster N: Category"
          lines.forEach(line => {
            const m = line.match(/(?:Cluster|Klaster)\s*(\d+)\s*:\s*(.*)/i);
            if (m) tempCats.push({ num: parseInt(m[1]), val: m[2].trim() });
          });
        } else {
          // Single-line format: "Klaster 1: Slow Moving Klaster 2: Fast Moving"
          const parts = content.split(/(?=(?:Cluster|Klaster)\s*\d+\s*:)/gi).filter(Boolean);
          parts.forEach(part => {
            const m = part.match(/(?:Cluster|Klaster)\s*(\d+)\s*:\s*(.*)/i);
            if (m) tempCats.push({ num: parseInt(m[1]), val: m[2].trim() });
          });
        }
        
        // Auto-detect 1-indexed and normalize to 0-indexed
        const nums = tempCats.map(x => x.num);
        const isOneIndexed = nums.length > 0 && Math.min(...nums) === 1 && !nums.includes(0);
        tempCats.forEach(({ num, val }) => {
          categories[isOneIndexed ? num - 1 : num] = val;
        });
      }

      // ── INSIGHT PER CLUSTER ─────────────────────────────────────────────
      else if (cleanSec.toUpperCase().startsWith("INSIGHT PER CLUSTER")) {
        const content = cleanSec.replace(/INSIGHT PER CLUSTER[^:]*:\s*/i, '');
        const tempInsights: { num: number; val: string }[] = [];

        // Split on "Klaster N:" boundaries
        const parts = content.split(/(?=(?:Cluster|Klaster)\s*\d+\s*:)/gi).filter(Boolean);
        parts.forEach(part => {
          const m = part.match(/(?:Cluster|Klaster)\s*(\d+)\s*:\s*([\s\S]*)/i);
          if (m) tempInsights.push({ num: parseInt(m[1]), val: m[2].trim() });
        });

        const nums = tempInsights.map(x => x.num);
        const isOneIndexed = nums.length > 0 && Math.min(...nums) === 1 && !nums.includes(0);
        tempInsights.forEach(({ num, val }) => {
          insights[isOneIndexed ? num - 1 : num] = val;
        });
      }

      // ── PRIORITAS AKSI BISNIS ───────────────────────────────────────────
      else if (cleanSec.toUpperCase().startsWith("PRIORITAS AKSI BISNIS")) {
        const content = cleanSec.replace(/PRIORITAS AKSI BISNIS[^:]*:\s*/i, '');
        // Try line-by-line first (original working approach)
        const lines = content.split('\n');
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
            priorities.push(trimmed);
          }
        });
        // Fallback for single-line: split on " - Produk" boundaries
        if (priorities.length === 0 && content.includes('- ')) {
          const parts = content.split(/\s+(?=-\s*Produk)/gi).filter(Boolean);
          parts.forEach(part => {
            const trimmed = part.trim();
            if (trimmed) priorities.push(trimmed);
          });
        }
      }
    });
    
    // ── Strategy 2 (fallback): if section headers were not found, ─────────
    //    try to extract per-cluster insights from the raw text directly
    if (Object.keys(insights).length === 0 && text.length > 0) {
      const parts = text.split(/(?=(?:Cluster|Klaster)\s*\d+)/gi).filter(Boolean);
      parts.forEach(part => {
        const m = part.match(/(?:Cluster|Klaster)\s*(\d+)\s*[:\-]?\s*([\s\S]*)/i);
        if (m) {
          const num = parseInt(m[1]);
          const val = m[2].trim();
          if (val) insights[num] = val;
        }
      });
      // Normalize to 0-indexed if needed
      const nums = Object.keys(insights).map(Number);
      if (nums.length > 0 && Math.min(...nums) === 1 && !nums.includes(0)) {
        const copy = { ...insights };
        Object.keys(copy).forEach(k => {
          const n = Number(k);
          delete insights[n];
          insights[n - 1] = copy[n];
        });
      }
    }
    
    return { categories, insights, priorities };
  }, [result]);

  const elbowData = useMemo(() =>
    result?.k_range.map((k, i) => ({ k, wcss: result.wcss_list[i] })) ?? [],
    [result]
  );

  const silhouetteData = useMemo(() =>
    result?.k_range.map((k, i) => ({ k, silhouette: result.silhouette_list[i] })) ?? [],
    [result]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full p-4 pt-12">
        <AnalysisLoadingState
          title="Sedang menjalankan clustering..."
          subtitle="Proses ini mungkin memerlukan waktu beberapa saat"
        />
      </div>
    );
  }

  if (!datasetId) {
    return (
      <div className="flex flex-col h-full w-full p-4">
        <AnalysisEmptyState
          title="dianalisis (Clustering)"
          description="Upload data CSV di halaman Dasbor terlebih dahulu sebelum menjalankan clustering."
          steps={[
            'Buka halaman Dasbor dan unggah file CSV yang berisi data penjualan atau produk.',
            'Setelah data berhasil diunggah, kembali ke halaman ini.',
            'Pilih kolom produk dan fitur, lalu klik "Jalankan Clustering".',
          ]}
          icon={LayoutGrid}
          redirectTo="/dasbor"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full h-auto relative pt-12">

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
        <div className="flex-1 overflow-y-auto min-h-screen p-4 flex flex-col gap-3">
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
                <div className="flex flex-col gap-1 overflow-y-auto border border-neutral-100 rounded-lg p-2 bg-neutral-50/50">
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

      {/* Main Tab Panels */}
      {result && !isLoading && (
        <div className="relative flex-1 h-auto min-h-screen w-full mt-2">

          {/* TAB HASIL */}
          <div className={cn(
            "absolute inset-0 transition-opacity duration-300 flex flex-col gap-4 overflow-y-auto pb-6",
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

            <ClusterSummaryCards result={result} colFitur={colFitur} categories={parsedInsight.categories} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <AnalysisCard title="Distribusi Produk per Klaster" status="berhasil">
                <DistribusiChart result={result} />
              </AnalysisCard>
              <AnalysisCard title={`Kontribusi ${colFitur[0] || 'Nilai'} per Klaster`} status="berhasil">
                <KontribusiChart result={result} colFitur={colFitur} />
              </AnalysisCard>
            </div>

            <div>
              <AnalysisCard title={`Top & Bottom Produk berdasarkan ${colFitur[0] || 'Fitur Utama'}`} status="berhasil">
                <TopBottomProducts result={result} colFitur={colFitur} />
              </AnalysisCard>
            </div>

            <div>
              <AnalysisCard title="Detail Semua Produk" status="berhasil">
                <ProductTable data={filteredData} colFitur={colFitur} />
              </AnalysisCard>
            </div>

            <div>
              <AnalysisCard title="Analisis & Insight per Klaster" status="berhasil">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    {uniqueClusters.map((c, i) => (
                      <ClusterAccordion key={c} clusterIndex={c}
                        color={CLUSTER_COLORS[i % CLUSTER_COLORS.length]}
                        productCount={clusterSizes[c] || 0}
                        category={parsedInsight.categories[c]}
                        insight={parsedInsight.insights[c] || ''} />
                    ))}
                  </div>

                  {parsedInsight.priorities.length > 0 && (
                    <div className="mt-2 border-t border-neutral-100 pt-4">
                      <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block mb-3">Prioritas Aksi Bisnis</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {parsedInsight.priorities.map((priority, idx) => {
                          const cleanPriority = priority.replace(/^[-*\d.\s]+/, ''); // remove bullet
                          const parts = cleanPriority.split(':');
                          const title = parts[0]?.trim();
                          const desc = parts.slice(1).join(':')?.trim();
                          
                          let borderColor = 'border-neutral-200';
                          let titleColor = 'text-neutral-700';
                          let bgHex = 'rgba(0,0,0,0.02)';
                          if (title.toUpperCase().includes('RESTOCK')) {
                            borderColor = 'border-emerald-200';
                            titleColor = 'text-emerald-700';
                            bgHex = 'rgba(16,185,129,0.04)';
                          } else if (title.toUpperCase().includes('DISKON')) {
                            borderColor = 'border-blue-200';
                            titleColor = 'text-blue-700';
                            bgHex = 'rgba(59,130,246,0.04)';
                          } else if (title.toUpperCase().includes('EVALUASI')) {
                            borderColor = 'border-amber-200';
                            titleColor = 'text-amber-700';
                            bgHex = 'rgba(245,158,11,0.04)';
                          }
                          
                          return (
                            <div key={idx} className="rounded-xl border p-4 flex flex-col gap-1" style={{ borderColor, backgroundColor: bgHex }}>
                              <span className={cn("text-xs font-bold uppercase tracking-wider", titleColor)}>{title}</span>
                              {desc && <span className="text-xs text-neutral-600 leading-relaxed">{desc}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </AnalysisCard>
            </div>
          </div>

          {/* TAB PENGUJIAN */}
          <div className={cn(
            "absolute inset-0 transition-opacity duration-300 flex flex-col gap-4 overflow-y-auto pb-6",
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

            <div>
              <AnalysisCard title="Visualisasi Sebaran Klaster" status="berhasil">
                <ClusterScatterChart result={result} colFitur={colFitur} />
              </AnalysisCard>
            </div>

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
