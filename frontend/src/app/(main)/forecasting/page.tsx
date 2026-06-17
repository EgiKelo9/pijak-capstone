'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/animate-ui/components/animate/tabs";
import { useForecasting, TimeFilter } from '@/hooks/use-forecasting';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfidenceCard } from '@/components/main/forecasting/confidence-card';
import { FeatureInfluenceChart } from '@/components/main/forecasting/feature-influence-chart';
import { FeatureDetailTable } from '@/components/main/forecasting/feature-detail-table';
import { ForecastingChart } from '@/components/main/forecasting/forecasting-chart';
import { HistoricalHeatmap } from '@/components/main/forecasting/historical-heatmap';
import { MetricsCard } from '@/components/main/forecasting/metrics-card';
import { AggressivenessControl } from '@/components/main/forecasting/aggressiveness-control';
import { ChartSpline, CheckCircle2 } from 'lucide-react';
import { AnalysisCard } from '@/components/main-card';
import { cn } from '@/lib/utils';
import { AnalysisEmptyState } from '@/components/analysis-empty-state';
import { AnalysisLoadingState } from '@/components/analysis-loading-state';

export default function ForecastingDashboardPage() {
  const [activeTab, setActiveTab] = useState<'hasil' | 'pengujian'>('hasil');
  const { 
    data, 
    isLoading, 
    error,
    isRerunning,
    timeFilter, setTimeFilter,
    aggressiveness, setAggressiveness,
    rerun
  } = useForecasting();

  const currentMetrics = data?.metrics?.[timeFilter] || data?.metrics?.['weekly'] || undefined;
  const currentFeatures = data?.feature_importances?.[timeFilter] || data?.feature_importances?.['weekly'] || undefined;

  const parsedForecastingInsight = useMemo(() => {
    if (!data || !data.insight_summary) return { trend: '', performa: '', rekomendasi: [] };
    const text = data.insight_summary;
    
    let trend = '';
    let performa = '';
    const rekomendasi: string[] = [];
    
    // Split by section titles
    const sections = text.split(/(?=TREN KESELURUHAN:|ANALISIS PERFORMA:|REKOMENDASI AKSI:)/gi);
    
    sections.forEach(section => {
      const cleanSec = section.trim();
      if (cleanSec.toUpperCase().startsWith("TREN KESELURUHAN:")) {
        trend = cleanSec.replace(/TREN KESELURUHAN:/i, "").trim();
      } else if (cleanSec.toUpperCase().startsWith("ANALISIS PERFORMA:")) {
        performa = cleanSec.replace(/ANALISIS PERFORMA:/i, "").trim();
      } else if (cleanSec.toUpperCase().startsWith("REKOMENDASI AKSI:")) {
        const lines = cleanSec.replace(/REKOMENDASI AKSI:/i, "").trim().split('\n');
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
            rekomendasi.push(trimmed);
          } else if (trimmed) {
            rekomendasi.push(trimmed);
          }
        });
      }
    });
    
    // Fallback if structured parsing fails
    if (!trend && !performa && rekomendasi.length === 0) {
      trend = text;
    }
    
    return { trend, performa, rekomendasi };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full p-4 pt-12">
        <AnalysisLoadingState
          title="Memuat data forecasting..."
          subtitle="Proses ini mungkin memerlukan waktu beberapa saat"
        />
      </div>
    );
  }

  // Render Empty State if no data has been generated yet, or if the history is empty
  const isNoHistory = !data || (error && error.includes("Belum ada riwayat"));
  
  if (isNoHistory) {
    return (
      <div className="flex flex-col h-full w-full p-4 pt-12">
        <AnalysisEmptyState
          title="dianalisis (Forecasting)"
          description="Silakan jalankan analisis forecasting di halaman Dasbor terlebih dahulu sebelum melihat hasil forecasting."
          steps={[
            'Buka halaman Dasbor dan unggah file CSV data penjualan.',
            'Pilih modul Forecasting pada analisis cepat di Dasbor.',
            'Tentukan tanggal target, kolom target, dan regressor, lalu jalankan analisis.',
            'Setelah forecasting selesai diproses, hasil proyeksi akan tampil di sini.'
          ]}
          icon={ChartSpline}
          redirectTo="/dasbor"
        />
      </div>
    );
  }

  // Render error card for real system failures
  if (error) {
    return (
      <div className="flex flex-col h-full w-full p-4 pt-12">
        <div className="flex flex-col items-center justify-center gap-4 bg-white rounded-2xl border border-rose-200 w-full h-full py-16 px-6 shadow-sm">
          <div className="flex size-16 items-center justify-center rounded-full bg-rose-50">
            <span className="text-rose-500 text-2xl font-bold">!</span>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-rose-600">Gagal Memuat Data Forecasting</p>
            <p className="text-xs text-neutral-400 mt-1">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-all"
          >
            Muat Ulang Halaman
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full h-full relative pt-12">
      {/* Tabs Header - Absolute positioned at top like in Analisis */}
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
              <ChartSpline className="size-3.5" />
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

      {/* Floating Dropdown Time Filter */}
      {data && (
        <div className="absolute top-0 right-0 z-20">
          <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
            <SelectTrigger className="h-9 w-44 rounded-xl border-neutral-800/20 text-xs shadow-sm bg-white/80 backdrop-blur-sm">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Harian</SelectItem>
              <SelectItem value="weekly">Mingguan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="relative flex-1 h-auto w-full mt-2">
        {/* Tab: Hasil */}
        <div className={`absolute inset-0 transition-opacity duration-300 flex flex-col gap-4 h-auto overflow-y-auto pb-6 ${activeTab === 'hasil' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          
          {/* Row 1: Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[300px] min-h-[220px] shrink-0">
            <div className="lg:col-span-3 h-full min-h-0">
              <ConfidenceCard metrics={currentMetrics} />
            </div>
            <div className="lg:col-span-4 h-full min-h-0">
              <FeatureInfluenceChart features={currentFeatures} />
            </div>
            <div className="lg:col-span-5 h-full min-h-0">
              <FeatureDetailTable features={currentFeatures} />
            </div>
          </div>

          {/* Row 2: Chart */}
          <div className="w-full h-auto shrink-0">
            <ForecastingChart 
              data={data?.trend_data} 
              timeFilter={timeFilter} 
              setTimeFilter={setTimeFilter}
              hideFilterButtons={true}
            />
          </div>

          {/* Row 3: Analisis & Insight */}
          {data?.insight_summary && (
            <div className="shrink-0">
              <AnalysisCard title="Analisis & Insight Forecasting" status="berhasil">
                <div className="flex flex-col gap-4">
                  {/* Grid for Tren & Performa */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {parsedForecastingInsight.trend && (
                      <div className="rounded-xl border border-neutral-100 bg-neutral-50/30 p-4 flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Tren Keseluruhan</span>
                        <p className="text-xs text-neutral-600 leading-relaxed">{parsedForecastingInsight.trend}</p>
                      </div>
                    )}
                    {parsedForecastingInsight.performa && (
                      <div className="rounded-xl border border-neutral-100 bg-neutral-50/30 p-4 flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Analisis Performa</span>
                        <p className="text-xs text-neutral-600 leading-relaxed">{parsedForecastingInsight.performa}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Rekomendasi Aksi */}
                  {parsedForecastingInsight.rekomendasi.length > 0 && (
                    <div className="border-t border-neutral-100 pt-4">
                      <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block mb-3">Rekomendasi Aksi</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {parsedForecastingInsight.rekomendasi.map((rec, idx) => {
                          const cleanRec = rec.replace(/^[-*\d.\s]+/, ''); // remove bullet
                          const parts = cleanRec.split(':');
                          
                          let title = '';
                          let desc = '';
                          if (parts.length > 1 && parts[0].length < 40) {
                            title = parts[0]?.trim();
                            desc = parts.slice(1).join(':')?.trim();
                          } else {
                            desc = cleanRec;
                          }
                          
                          // Style based on keywords
                          let borderColor = 'border-neutral-200';
                          let titleColor = 'text-neutral-700';
                          let bgHex = 'rgba(0,0,0,0.02)';
                          
                          const checkText = (title || desc).toUpperCase();
                          if (checkText.includes('STOK') || checkText.includes('KETERSEDIAAN') || checkText.includes('RESTOCK') || checkText.includes('TINGKATKAN') || checkText.includes('PERSONEL')) {
                            borderColor = 'border-emerald-200';
                            titleColor = 'text-emerald-700';
                            bgHex = 'rgba(16,185,129,0.04)';
                            if (!title) title = "Optimalisasi Stok & Ketersediaan";
                          } else if (checkText.includes('PROMOSI') || checkText.includes('DISKON') || checkText.includes('LOYALITAS') || checkText.includes('PROMO') || checkText.includes('PROGRAM')) {
                            borderColor = 'border-blue-200';
                            titleColor = 'text-blue-700';
                            bgHex = 'rgba(59,130,246,0.04)';
                            if (!title) title = "Promosi & Program Loyalitas";
                          } else if (checkText.includes('EVALUASI') || checkText.includes('PERBAIKI') || checkText.includes('PROSES') || checkText.includes('SISTEM') || checkText.includes('BAHAN BAKU') || checkText.includes('PEMESANAN')) {
                            borderColor = 'border-amber-200';
                            titleColor = 'text-amber-700';
                            bgHex = 'rgba(245,158,11,0.04)';
                            if (!title) title = "Evaluasi & Perbaikan Proses";
                          } else {
                            if (!title) title = "Aksi Rekomendasi";
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
          )}
        </div>

        {/* Tab: Pengujian */}
        <div className={`absolute inset-0 transition-opacity duration-300 flex flex-col gap-4 overflow-y-auto pb-6 ${activeTab === 'pengujian' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          
          {/* Row 1: Metrics & Config */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:h-[220px] min-h-[200px] shrink-0">
            <div className="h-full min-h-0">
              <MetricsCard metrics={currentMetrics} />
            </div>
            <div className="h-full min-h-0">
              <AggressivenessControl 
                value={aggressiveness} 
                onChange={setAggressiveness} 
                onApply={rerun}
                isLoading={isRerunning}
              />
            </div>
          </div>

          {/* Row 2: Supporting Chart (Historical Heatmap) */}
          <div className="w-full h-auto shrink-0">
            <HistoricalHeatmap 
              data={data?.trend_data} 
              timeFilter={timeFilter}
              hideFilterButtons={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}