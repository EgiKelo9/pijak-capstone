'use client';

import { AnalysisCard } from '@/components/main-card';
import { TrendDataPoint } from '@/types';
import { useMemo } from 'react';

interface HistoricalHeatmapProps {
  data?: TrendDataPoint[];
}

export function HistoricalHeatmap({ data = [] }: HistoricalHeatmapProps) {
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  // 1. Filter dan urutkan data historis riil
  const historicalPoints = useMemo(() => {
    return (data || []).filter((d) => d.actual_value != null && d.actual_value !== undefined);
  }, [data]);

  const sortedPoints = useMemo(() => {
    return [...historicalPoints].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [historicalPoints]);

  const isDummy = sortedPoints.length === 0;

  // 2. Petakan data riil atau buat dummy jika kosong
  const valueMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!isDummy) {
      sortedPoints.forEach((p) => {
        if (p.actual_value != null) {
          try {
            const dStr = new Date(p.date).toISOString().split('T')[0];
            map.set(dStr, p.actual_value);
          } catch (_) {}
        }
      });
    }
    return map;
  }, [sortedPoints, isDummy]);

  // 3. Cari rentang nilai (min/max) untuk skala warna
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

  // 4. Cari tanggal akhir dan buat tanggal referensi
  const latestDate = useMemo(() => {
    if (isDummy) return new Date();
    const d = new Date(sortedPoints[sortedPoints.length - 1].date);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [sortedPoints, isDummy]);

  // Hari Minggu terdekat setelah atau pada latestDate
  const endOfWeekDate = useMemo(() => {
    const d = new Date(latestDate.getTime());
    const day = d.getDay();
    const diff = day === 0 ? 0 : 7 - day;
    d.setDate(d.getDate() + diff);
    return d;
  }, [latestDate]);

  // Tanggal mulai 52 minggu lalu (Senin)
  const startOfWeekDate = useMemo(() => {
    const d = new Date(endOfWeekDate.getTime());
    d.setDate(d.getDate() - 363); // 52 minggu * 7 hari - 1
    return d;
  }, [endOfWeekDate]);

  // 5. Susun grid sel 52 minggu x 7 hari
  const cellData = useMemo(() => {
    const grid: { dateStr: string; value: number | null; formattedDate: string }[][] = [];
    for (let w = 0; w < 52; w++) {
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
          // Generate mock patterns if no real data exists
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
  }, [startOfWeekDate, valueMap, isDummy]);

  // 6. Skala warna Tailwind CSS berdasarkan intensitas data
  const getBgColor = (val: number | null) => {
    if (val === null) return 'bg-neutral-100/40 border border-neutral-200/10 hover:bg-neutral-200/50';
    const range = maxVal - minVal;
    const ratio = range > 0 ? (val - minVal) / range : 1;
    
    if (ratio < 0.25) return 'bg-sky-100/50 hover:bg-sky-100 border border-sky-200/10';
    if (ratio < 0.5) return 'bg-sky-300/60 hover:bg-sky-300 border border-sky-400/10';
    if (ratio < 0.75) return 'bg-sky-400 hover:bg-sky-500 border border-sky-500/10';
    return 'bg-sky-600 border border-sky-700 hover:bg-sky-700';
  };

  return (
    <AnalysisCard title="Pola Historis Penjualan" className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex-1 w-full overflow-x-auto mt-2 pb-2">
        <div className="flex gap-2 min-w-max">
          {/* Label Hari */}
          <div className="flex flex-col gap-1.5 text-[9px] text-neutral-400 font-medium justify-around py-1 pr-2">
            {days.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Grid Kontribusi Kontinu */}
          <div className="flex gap-1.5">
            {cellData.map((weekCells, w) => (
              <div key={w} className="flex flex-col gap-1.5">
                {weekCells.map((cell, d) => {
                  const bgColor = getBgColor(cell.value);
                  const displayTooltip = cell.value !== null
                    ? `${cell.formattedDate}: ${Number(cell.value).toLocaleString('id-ID')} unit`
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
      </div>
      
      {/* Keterangan Skala */}
      <div className="flex items-center gap-2 justify-end mt-2 text-[10px] text-neutral-400">
        <span>Kurang</span>
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-neutral-100/40 border border-neutral-200/10" />
          <div className="w-2.5 h-2.5 rounded-sm bg-sky-100/50" />
          <div className="w-2.5 h-2.5 rounded-sm bg-sky-300/60" />
          <div className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
          <div className="w-2.5 h-2.5 rounded-sm bg-sky-600" />
        </div>
        <span>Banyak</span>
      </div>
    </AnalysisCard>
  );
}
