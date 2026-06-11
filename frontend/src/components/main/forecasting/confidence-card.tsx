'use client';

import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { AnalysisCard } from '@/components/main-card';
import { ForecastingMetrics } from '@/types';

interface ConfidenceCardProps {
  metrics?: ForecastingMetrics;
}

export function ConfidenceCard({ metrics }: ConfidenceCardProps) {
  const [showPercentage, setShowPercentage] = useState(false);

  const confidenceValue = metrics?.confidence_value || 0;
  const confidencePercentage = metrics?.confidence_percentage || 0;

  const displayValue = showPercentage 
    ? `${confidencePercentage.toFixed(1)}%` 
    : `±Rp ${confidenceValue.toLocaleString('id-ID')}`;

  let label = "Moderat";
  if (confidencePercentage > 85) label = "Tinggi";
  else if (confidencePercentage < 60) label = "Rendah";

  return (
    <AnalysisCard title="Forecasting Confidence" className="flex flex-col relative h-full">
      <button 
        onClick={() => setShowPercentage(!showPercentage)}
        className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-neutral-100 transition-colors text-neutral-500"
        title="Toggle nilai/persentase"
      >
        <ArrowLeftRight className="size-4" />
      </button>
      
      <div className="flex flex-col items-center justify-center flex-1 py-8">
        <div className="text-4xl font-bold text-sky-200 tracking-tight">
          {displayValue}
        </div>
        <div className="text-neutral-400 mt-2 text-sm font-medium">
          {label}
        </div>
      </div>
      
      <div className="text-[10px] text-neutral-300 mt-auto flex items-center gap-1 opacity-60">
        <span className="text-sky-300">✧</span> Berdasarkan pengujian terhadap data latih
      </div>
    </AnalysisCard>
  );
}
