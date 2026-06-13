'use client';

import { AnalysisCard } from '@/components/main-card';
import { TrendDataPoint } from '@/types';

interface HistoricalHeatmapProps {
  data?: TrendDataPoint[];
}

export function HistoricalHeatmap({ data = [] }: HistoricalHeatmapProps) {
  // Generate dummy data if no data provided just for visualization purposes
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  
  // Create 52 columns for weeks
  const weeks = Array.from({ length: 52 }, (_, i) => i);
  
  return (
    <AnalysisCard title="Pola Historis Penjualan" className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex-1 w-full overflow-x-auto mt-2 pb-2">
        <div className="flex gap-1.5 min-w-max">
          <div className="flex flex-col gap-1.5 text-[9px] text-neutral-400 font-medium justify-around py-1 pr-2">
            {days.map(d => <span key={d}>{d}</span>)}
          </div>
          
          <div className="flex gap-1.5">
            {weeks.map(w => (
              <div key={w} className="flex flex-col gap-1.5">
                {days.map((_, d) => {
                  // Random intensity for mock if data is empty
                  const intensity = Math.random();
                  let bgColor = 'bg-sky-50';
                  if (intensity > 0.8) bgColor = 'bg-sky-400';
                  else if (intensity > 0.5) bgColor = 'bg-sky-300';
                  else if (intensity > 0.2) bgColor = 'bg-sky-200';
                  
                  return (
                    <div 
                      key={`${w}-${d}`} 
                      className={`w-3 h-3 rounded-sm ${bgColor} hover:ring-1 ring-sky-500 transition-all cursor-pointer`}
                      title={`Week ${w+1}, ${days[d]}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnalysisCard>
  );
}
