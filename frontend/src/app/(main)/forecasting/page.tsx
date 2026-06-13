'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/animate-ui/components/animate/tabs";
import { useForecasting } from '@/hooks/use-forecasting';
import { ConfidenceCard } from '@/components/main/forecasting/confidence-card';
import { FeatureInfluenceChart } from '@/components/main/forecasting/feature-influence-chart';
import { FeatureDetailTable } from '@/components/main/forecasting/feature-detail-table';
import { ForecastingChart } from '@/components/main/forecasting/forecasting-chart';
import { HistoricalHeatmap } from '@/components/main/forecasting/historical-heatmap';
import { MetricsCard } from '@/components/main/forecasting/metrics-card';
import { AggressivenessControl } from '@/components/main/forecasting/aggressiveness-control';
import { ChartSpline, CheckCircle2 } from 'lucide-react';

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

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center text-neutral-500">Memuat data forecasting...</div>;
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center flex-col gap-2">
        <div className="text-rose-500 font-medium">Gagal memuat data</div>
        <div className="text-neutral-500 text-sm">{error}</div>
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

      <div className="relative flex-1 min-h-0 w-full mt-2">
        {/* Tab: Hasil */}
        <div className={`absolute inset-0 transition-opacity duration-300 flex flex-col gap-4 overflow-y-auto pb-6 ${activeTab === 'hasil' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          
          {/* Row 1: Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[300px] min-h-[220px] shrink-0">
            <div className="lg:col-span-3 h-full min-h-0">
              <ConfidenceCard metrics={data?.metrics} />
            </div>
            <div className="lg:col-span-4 h-full min-h-0">
              <FeatureInfluenceChart features={data?.feature_importances} />
            </div>
            <div className="lg:col-span-5 h-full min-h-0">
              <FeatureDetailTable features={data?.feature_importances} />
            </div>
          </div>

          {/* Row 2: Chart */}
          <div className="w-full h-[350px] shrink-0">
            <ForecastingChart 
              data={data?.trend_data} 
              timeFilter={timeFilter} 
              setTimeFilter={setTimeFilter}
            />
          </div>

          {/* Row 3: Heatmap */}
          {/* <div className="w-full h-[220px] shrink-0">
            <HistoricalHeatmap data={data?.trend_data} />
          </div> */}
        </div>

        {/* Tab: Pengujian */}
        <div className={`absolute inset-0 transition-opacity duration-300 flex flex-col gap-4 overflow-y-auto pb-6 ${activeTab === 'pengujian' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          
          {/* Row 1: Metrics & Config */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:h-[220px] min-h-[200px] shrink-0">
            <div className="h-full min-h-0">
              <MetricsCard metrics={data?.metrics} />
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

          {/* Row 2: Fixed Monthly Chart */}
          <div className="w-full h-[400px] shrink-0">
            <ForecastingChart 
              data={data?.trend_data} 
              timeFilter={timeFilter} 
              setTimeFilter={setTimeFilter}
            />
          </div>
        </div>
      </div>
    </div>
  );
}