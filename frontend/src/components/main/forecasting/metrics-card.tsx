'use client';

import { AnalysisCard } from '@/components/main-card';
import { ForecastingMetrics } from '@/types';

interface MetricsCardProps {
  metrics?: ForecastingMetrics;
}

export function MetricsCard({ metrics }: MetricsCardProps) {
  const mapeValue = metrics?.mape || 0;
  // If MAPE is already in percentage format (e.g. 21.88 instead of 0.2188), do not multiply by 100.
  const displayMape = mapeValue > 1 ? mapeValue : mapeValue * 100;

  return (
    <AnalysisCard title="Evaluasi Model" className="flex flex-col h-full w-full">
      <div className="flex-1 grid grid-cols-3 gap-4 mt-2">
        <div className="flex flex-col items-center justify-center p-4 bg-neutral-50 rounded-xl border border-neutral-100">
          <span className="text-xs text-neutral-500 font-medium mb-1">R² Score</span>
          <span className="text-2xl font-bold text-sky-500">{metrics?.r2 ? metrics.r2.toFixed(3) : '-'}</span>
        </div>
        <div className="flex flex-col items-center justify-center p-4 bg-neutral-50 rounded-xl border border-neutral-100">
          <span className="text-xs text-neutral-500 font-medium mb-1">RMSE</span>
          <span className="text-2xl font-bold text-neutral-700">{metrics?.rmse ? metrics.rmse.toFixed(1) : '-'}</span>
        </div>
        <div className="flex flex-col items-center justify-center p-4 bg-neutral-50 rounded-xl border border-neutral-100">
          <span className="text-xs text-neutral-500 font-medium mb-1">MAPE</span>
          <span className="text-2xl font-bold text-neutral-700">
            {metrics?.mape ? `${displayMape.toFixed(1)}%` : '-'}
          </span>
        </div>
      </div>
    </AnalysisCard>
  );
}
