'use client';

import { useState, useMemo } from 'react';
import { AnalysisCard } from '@/components/main-card';
import { TrendDataPoint } from '@/types';

interface HistoricalHeatmapProps {
  data?: Record<string, TrendDataPoint[]>;
  timeFilter?: 'daily' | 'weekly';
  hideFilterButtons?: boolean;
}

// Helper to get week of year (1 to 53)
const getWeekOfYear = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime() + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60000;
  const oneDay = 24 * 60 * 60 * 1000;
  const dayOfYear = Math.floor(diff / oneDay) + 1;
  return Math.ceil(dayOfYear / 7);
};

export function HistoricalHeatmap({ 
  data = {}, 
  timeFilter = 'daily',
  hideFilterButtons = false,
}: HistoricalHeatmapProps) {
  const [localFilter, setLocalFilter] = useState<'daily' | 'weekly'>('daily');
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  const activeFilter = hideFilterButtons ? timeFilter : localFilter;

  // 1. Get raw points for selected local filter
  const rawPoints = data[activeFilter] ?? [];

  // 2. Filter and sort historical points
  const historicalPoints = useMemo(() => {
    return rawPoints.filter((d) => d.actual_value != null && d.actual_value !== undefined);
  }, [rawPoints]);

  const sortedPoints = useMemo(() => {
    return [...historicalPoints].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [historicalPoints]);

  const isDummy = sortedPoints.length === 0;

  // 3. Find min/max values for color scaling
  const { minVal, maxVal } = useMemo(() => {
    if (isDummy) return { minVal: 0, maxVal: 100 };
    let min = Infinity;
    let max = -Infinity;
    sortedPoints.forEach((p) => {
      if (p.actual_value != null) {
        if (p.actual_value < min) min = p.actual_value;
        if (p.actual_value > max) max = p.actual_value;
      }
    });
    return {
      minVal: min === Infinity ? 0 : min,
      maxVal: max === -Infinity ? 1 : max,
    };
  }, [sortedPoints, isDummy]);

  // 4. Build daily calendar cell data (entire range of weeks in dataset)
  const dailyCellData = useMemo(() => {
    if (activeFilter !== 'daily') return [];
    
    const valueMap = new Map<string, number>();
    if (!isDummy) {
      sortedPoints.forEach((p) => {
        if (p.actual_value != null) {
          try {
            const dStr = new Date(p.date).toISOString().split('T')[0];
            valueMap.set(dStr, p.actual_value);
          } catch (_) {}
        }
      });
    }

    const firstPointDate = !isDummy ? new Date(sortedPoints[0].date) : new Date();
    const latestDate = !isDummy ? new Date(sortedPoints[sortedPoints.length - 1].date) : new Date();
    
    // Start of week (Monday) for the first date
    const startOfWeekDate = new Date(firstPointDate.getTime());
    const startDay = startOfWeekDate.getDay();
    const startDiff = startDay === 0 ? 6 : startDay - 1;
    startOfWeekDate.setDate(startOfWeekDate.getDate() - startDiff);

    // End of week (Sunday) for the last date
    const endOfWeekDate = new Date(latestDate.getTime());
    const endDay = endOfWeekDate.getDay();
    const endDiff = endDay === 0 ? 0 : 7 - endDay;
    endOfWeekDate.setDate(endOfWeekDate.getDate() + endDiff);

    const totalDays = Math.round((endOfWeekDate.getTime() - startOfWeekDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));

    const grid = [];
    for (let w = 0; w < totalWeeks; w++) {
      const weekCells = [];
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(startOfWeekDate.getTime());
        cellDate.setDate(cellDate.getDate() + (w * 7 + d));
        
        let dateStr = "";
        try {
          dateStr = cellDate.toISOString().split('T')[0];
        } catch (_) {}

        let value: number | null = null;
        if (isDummy) {
          const intensity = Math.random();
          value = intensity > 0.3 ? Math.round(intensity * 100) : null;
        } else {
          value = valueMap.get(dateStr) ?? null;
        }

        const formattedDate = cellDate.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        weekCells.push({ dateStr, value, formattedDate });
      }
      grid.push(weekCells);
    }
    return grid;
  }, [sortedPoints, isDummy, activeFilter]);

  // 5. Build weekly grid data (years as rows, 53 weeks as columns)
  const weeklyCellData = useMemo(() => {
    if (activeFilter !== 'weekly') return { years: [], grid: [] };

    const years = !isDummy 
      ? [...new Set(sortedPoints.map(p => new Date(p.date).getFullYear()))].sort((a, b) => a - b)
      : [new Date().getFullYear()];

    const grid: { year: number; week: number; value: number | null; label: string }[][] = [];
    const valueMap = new Map<string, number>();

    if (!isDummy) {
      sortedPoints.forEach((p) => {
        if (p.actual_value != null) {
          const d = new Date(p.date);
          const y = d.getFullYear();
          const w = Math.min(53, getWeekOfYear(d));
          valueMap.set(`${y}-${w}`, p.actual_value);
        }
      });
    }

    years.forEach((year) => {
      const yearCells = [];
      for (let w = 1; w <= 53; w++) {
        let value: number | null = null;
        if (isDummy) {
          const intensity = Math.random();
          value = intensity > 0.2 ? Math.round(intensity * 100) : null;
        } else {
          value = valueMap.get(`${year}-${w}`) ?? null;
        }

        const label = `Tahun ${year} - Minggu ke-${w}`;
        yearCells.push({ year, week: w, value, label });
      }
      grid.push(yearCells);
    });

    return { years, grid };
  }, [sortedPoints, isDummy, activeFilter]);

  // 6. Get Tailwind classes based on intensity
  const getBgColor = (val: number | null) => {
    if (val === null) return 'bg-sky-100 border border-neutral-200/10 hover:bg-neutral-200/50';
    const range = maxVal - minVal;
    const ratio = range > 0 ? (val - minVal) / range : 1;
    
    if (ratio < 0.25) return 'bg-sky-200 hover:bg-sky-200 border border-sky-200/10';
    if (ratio < 0.5) return 'bg-sky-400 hover:bg-sky-400 border border-sky-400/10';
    if (ratio < 0.75) return 'bg-sky-600 hover:bg-sky-600 border border-sky-500/10';
    return 'bg-sky-700 border border-sky-700 hover:bg-sky-700';
  };

  return (
    <AnalysisCard title="Pola Historis Penjualan" className="flex flex-col h-full w-full overflow-hidden">
      {/* Local Filter Tabs & Description */}
      {!hideFilterButtons && (
        <div className="flex items-center justify-between mb-4 w-full gap-2 flex-wrap shrink-0">
          <div className="flex bg-sky-100/50 p-1 rounded-lg border border-neutral-200/60">
            {(['daily', 'weekly'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setLocalFilter(filter)}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                  localFilter === filter
                    ? 'bg-white text-neutral-800 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {filter === 'daily' ? 'Harian' : 'Mingguan'}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-neutral-400 font-medium">
            * Rata-rata nominal penjualan per {localFilter === 'daily' ? 'hari' : 'minggu'}
          </span>
        </div>
      )}

      {hideFilterButtons && (
        <div className="flex items-center justify-end mb-4 w-full shrink-0">
          <span className="text-[10px] text-neutral-400 font-medium">
            * Rata-rata nominal penjualan per {activeFilter === 'daily' ? 'hari' : 'minggu'}
          </span>
        </div>
      )}

      <div className="flex-1 w-full overflow-auto pb-2 min-h-0">
        {activeFilter === 'daily' ? (
          /* DAILY CALENDAR HEATMAP (entire range of weeks in dataset) */
          <div className="flex gap-2 min-w-max pr-4">
            {/* Day labels */}
            <div className="flex flex-col gap-1.5 text-[9px] text-neutral-400 font-medium justify-around py-1 pr-2">
              {days.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-1.5">
              {dailyCellData.map((weekCells, w) => (
                <div key={w} className="flex flex-col gap-1.5">
                  {weekCells.map((cell, d) => {
                    const bgColor = getBgColor(cell.value);
                    const displayTooltip = cell.value !== null
                      ? `${cell.formattedDate}: $ ${Number(cell.value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : `${cell.formattedDate}: Tidak ada transaksi`;

                    return (
                      <div
                        key={`${w}-${d}`}
                        className={`w-3.5 h-3.5 rounded-sm ${bgColor} transition-all cursor-pointer hover:ring-2 hover:ring-sky-500/40`}
                        title={displayTooltip}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* WEEKLY HEATMAP (years as rows, 53 weeks as columns) */
          <div className="flex gap-2 min-w-max pr-4">
            {/* Year labels */}
            <div className="flex flex-col gap-1.5 text-[9px] text-neutral-400 font-medium justify-around py-1 pr-2">
              {weeklyCellData.years.map((y) => (
                <span key={y} className="h-3.5 flex items-center">{y}</span>
              ))}
            </div>

            {/* Grid */}
            <div className="flex flex-col gap-1.5">
              {weeklyCellData.grid.map((yearCells, r) => (
                <div key={r} className="flex gap-1.5">
                  {yearCells.map((cell, w) => {
                    const bgColor = getBgColor(cell.value);
                    const displayTooltip = cell.value !== null
                      ? `${cell.label}: $ ${Number(cell.value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : `${cell.label}: Tidak ada transaksi`;

                    return (
                      <div
                        key={w}
                        className={`w-3.5 h-3.5 rounded-sm ${bgColor} transition-all cursor-pointer hover:ring-2 hover:ring-sky-500/40`}
                        title={displayTooltip}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-2 justify-end mt-3 text-[10px] text-neutral-400 shrink-0">
        <span>Kurang</span>
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-sky-100 border border-neutral-200/10" />
          <div className="w-2.5 h-2.5 rounded-sm bg-sky-200" />
          <div className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
          <div className="w-2.5 h-2.5 rounded-sm bg-sky-600" />
          <div className="w-2.5 h-2.5 rounded-sm bg-sky-700" />
        </div>
        <span>Banyak</span>
      </div>
    </AnalysisCard>
  );
}
