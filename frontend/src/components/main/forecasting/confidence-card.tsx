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
  // If the backend returns fraction (<= 1), convert to percentage (0-100)
  const rawPercentage = metrics?.confidence_percentage || 0;
  const confidencePercentage = rawPercentage <= 1 ? rawPercentage * 100 : rawPercentage;

  const displayValue = showPercentage 
    ? `${confidencePercentage.toFixed(1)}%` 
    : `±$ ${confidenceValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  let label = "Moderat";
  if (confidencePercentage > 85) label = "Tinggi";
  else if (confidencePercentage < 60) label = "Rendah";

  return (
    <AnalysisCard 
      title="Forecasting Confidence" 
      className="flex flex-col h-full"
      innerClassName="relative flex-1"
    >
      <button 
        onClick={() => setShowPercentage(!showPercentage)}
        className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-neutral-100 transition-colors text-neutral-500 z-10"
        title="Toggle nilai/persentase"
      >
        <ArrowLeftRight className="size-4" />
      </button>
      
      <div className="flex flex-col items-center justify-center h-[180px] py-2">
        <div className="text-3xl font-extrabold text-sky-500 tracking-tight">
          {displayValue}
        </div>
        <div className="text-neutral-600 mt-1 text-sm font-medium">
          {label}
        </div>
      </div>
      
      <div className="text-[10px] text-neutral-400 mt-2 flex items-center gap-1 opacity-70">
        <span className="text-sky-500">✧</span> Berdasarkan pengujian terhadap data latih
      </div>
    </AnalysisCard>
  );
}
