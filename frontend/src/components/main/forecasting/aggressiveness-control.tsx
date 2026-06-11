'use client';

import { AnalysisCard } from '@/components/main-card';
import { ForecastAggressiveness } from '@/hooks/use-forecasting';
import { Settings2 } from 'lucide-react';

interface AggressivenessControlProps {
  value: ForecastAggressiveness;
  onChange: (value: ForecastAggressiveness) => void;
  onApply: () => void;
}

export function AggressivenessControl({ value, onChange, onApply }: AggressivenessControlProps) {
  return (
    <AnalysisCard title="Penyesuaian Model" className="flex flex-col h-full w-full">
      <div className="flex flex-col gap-4 mt-2 flex-1">
        <p className="text-xs text-neutral-500">
          Sesuaikan tingkat keagresifan prediksi berdasarkan toleransi risiko dan tren pasar.
        </p>
        
        <div className="grid grid-cols-3 gap-2">
          {(['conservative', 'balance', 'aggressive'] as ForecastAggressiveness[]).map((level) => (
            <button
              key={level}
              onClick={() => onChange(level)}
              className={`py-2 px-1 text-[10px] sm:text-xs font-medium rounded-lg border transition-all ${
                value === level
                  ? 'bg-sky-50 border-sky-200 text-sky-700 shadow-sm'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>

        <button 
          onClick={onApply}
          className="mt-auto flex items-center justify-center gap-2 w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Settings2 className="size-3.5" />
          Analisis Ulang
        </button>
      </div>
    </AnalysisCard>
  );
}
