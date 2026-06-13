'use client';

import { useState, useCallback, useRef } from 'react';
import { AnalysisCard } from '@/components/main-card';
import { TrendDataPoint, FreqKey } from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Brush,
  ReferenceArea,
  CartesianGrid,
} from 'recharts';
import { TimeFilter } from '@/hooks/use-forecasting';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ForecastingChartProps {
  data?: Record<string, TrendDataPoint[]>;
  timeFilter: TimeFilter;
  setTimeFilter: (v: TimeFilter) => void;
  isFixedFilter?: boolean;
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  const fmt = (val: any) =>
    val != null ? Number(val).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '—';
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-neutral-200/60 rounded-xl shadow-lg px-4 py-3 text-xs min-w-[175px]">
      <p className="font-semibold text-neutral-700 mb-2 border-b border-neutral-100 pb-1.5">{label}</p>
      {payload.map((entry: any) => {
        if (entry.value == null) return null;
        return (
          <div key={entry.dataKey} className="flex items-center gap-2 mt-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: entry.color }}
            />
            <span className="text-neutral-500">{entry.name}:</span>
            <span className="font-medium text-neutral-800 ml-auto pl-2">{fmt(entry.value)}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export function ForecastingChart({
  data = {},
  timeFilter,
  setTimeFilter,
  isFixedFilter = false,
}: ForecastingChartProps) {
  const freqKey = timeFilter as FreqKey;
  const rawData: TrendDataPoint[] = data[freqKey] ?? [];

  // ── Zoom state ──
  const [zoomLeft, setZoomLeft] = useState<string | null>(null);
  const [zoomRight, setZoomRight] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [viewRange, setViewRange] = useState<{ start: number; end: number } | null>(null);
  const [brushIndex, setBrushIndex] = useState<{ startIndex?: number; endIndex?: number }>({});

  // Reset zoom when timeFilter changes
  const prevTimeFilter = useRef(timeFilter);
  if (prevTimeFilter.current !== timeFilter) {
    prevTimeFilter.current = timeFilter;
    setViewRange(null);
    setBrushIndex({});
    setZoomLeft(null);
    setZoomRight(null);
    setIsDragging(false);
  }

  // ── Build chart data ──
  const chartData = (() => {
    if (rawData.length === 0) return [];
    const result = rawData.map((d) => ({
      date: d.date,
      actual_value: d.actual_value ?? null,
      predicted_value: d.predicted_value ?? null,
    }));

    // Bridge: buat sambungan mulus di titik transisi historis → prediksi masa depan
    // (titik di mana actual_value=null dan predicted_value!=null untuk pertama kali)
    const lastActualIdx = result.reduce((last, d, i) => (d.actual_value != null ? i : last), -1);
    const firstFuturePredIdx = result.findIndex(
      (d, i) => i > lastActualIdx && d.actual_value === null && d.predicted_value != null
    );
    if (lastActualIdx >= 0 && firstFuturePredIdx > lastActualIdx) {
      result[firstFuturePredIdx] = {
        ...result[firstFuturePredIdx],
        actual_value: result[lastActualIdx].actual_value,
      };
    }
    return result;
  })();

  // Slice data sesuai viewRange (hasil zoom drag dengan ReferenceArea)
  const displayData = viewRange
    ? chartData.slice(viewRange.start, viewRange.end + 1)
    : chartData;

  // ── Format X Axis ──
  const formatXAxis = (tickItem: any) => {
    try {
      const date = new Date(tickItem);
      if (isNaN(date.getTime())) return String(tickItem);
      if (timeFilter === 'monthly')
        return date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      if (timeFilter === 'weekly')
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    } catch {
      return String(tickItem);
    }
  };

  // ── Zoom handlers (drag to zoom) ──
  const handleMouseDown = (e: any) => {
    if (e && e.activeLabel) {
      setZoomLeft(e.activeLabel);
      setZoomRight(null);
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: any) => {
    if (isDragging && e && e.activeLabel) {
      setZoomRight(e.activeLabel);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || !zoomLeft || !zoomRight) {
      setIsDragging(false);
      return;
    }
    setIsDragging(false);

    const idxLeft = displayData.findIndex((d) => d.date === zoomLeft);
    const idxRight = displayData.findIndex((d) => d.date === zoomRight);
    if (idxLeft < 0 || idxRight < 0 || idxLeft === idxRight) {
      setZoomLeft(null);
      setZoomRight(null);
      return;
    }

    const [lo, hi] = idxLeft < idxRight ? [idxLeft, idxRight] : [idxRight, idxLeft];
    if (hi - lo < 2) {
      setZoomLeft(null);
      setZoomRight(null);
      return;
    }

    // Konversi ke index dalam chartData asli
    const baseOffset = viewRange?.start ?? 0;
    setViewRange({ start: baseOffset + lo, end: baseOffset + hi });
    setZoomLeft(null);
    setZoomRight(null);
  };

  const handleResetZoom = () => {
    setViewRange(null);
    setBrushIndex({});
    setZoomLeft(null);
    setZoomRight(null);
    setIsDragging(false);
  };

  const isZoomed = viewRange !== null;

  const FILTER_LABELS: Record<TimeFilter, string> = {
    daily: 'Harian',
    weekly: 'Mingguan',
    monthly: 'Bulanan',
  };

  const hasData = displayData.length > 0;

  return (
    <AnalysisCard
      title="Analisis Forecasting"
      className="flex flex-col relative w-full overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3 w-full gap-2 flex-wrap">
        {/* Filter tab */}
        <div className="flex bg-neutral-100/50 p-1 rounded-lg border border-neutral-200/60">
          {(['daily', 'weekly', 'monthly'] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              disabled={isFixedFilter && filter !== 'monthly'}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                timeFilter === filter
                  ? 'bg-white text-neutral-800 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed'
              }`}
            >
              {FILTER_LABELS[filter]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-5 h-0.5 rounded-full bg-[#38bdf8]" />
              Aktual
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-5 border-t-2 border-dashed"
                style={{ borderColor: '#f59e0b' }}
              />
              Prediksi
            </span>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 border border-neutral-200/60 rounded-lg p-0.5 bg-neutral-50/80">
            <button
              title="Geser & sorot area pada grafik untuk zoom in"
              className="px-2 py-1 text-xs text-neutral-500 rounded-md hover:bg-white hover:text-neutral-700 hover:shadow-sm transition-all flex items-center gap-1"
              onClick={() => {}} // hint only; actual zoom via drag
            >
              <ZoomIn className="size-3" />
              <span className="hidden sm:inline">Drag to zoom</span>
            </button>
            <button
              title="Reset zoom"
              disabled={!isZoomed}
              onClick={handleResetZoom}
              className={`px-2 py-1 text-xs rounded-md transition-all flex items-center gap-1 ${
                isZoomed
                  ? 'text-sky-600 hover:bg-white hover:shadow-sm'
                  : 'text-neutral-300 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="size-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Chart ── */}
      <div className="flex-1 w-full select-none">
        {hasData ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={displayData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />

              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 10, fill: '#a3a3a3' }}
                axisLine={false}
                tickLine={false}
                minTickGap={30}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#a3a3a3' }}
                axisLine={false}
                tickLine={false}
                width={52}
                tickFormatter={(v) =>
                  Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                }
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Drag-to-zoom selection highlight */}
              {isDragging && zoomLeft && zoomRight && (
                <ReferenceArea
                  x1={zoomLeft}
                  x2={zoomRight}
                  strokeOpacity={0.3}
                  fill="#38bdf8"
                  fillOpacity={0.1}
                />
              )}

              {/* Garis aktual — solid, sky blue */}
              <Line
                type="monotone"
                dataKey="actual_value"
                name="Aktual"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                activeDot={{ r: 5, fill: '#38bdf8', stroke: 'white', strokeWidth: 2 }}
              />

              {/* Garis prediksi — dashed, amber */}
              <Line
                type="monotone"
                dataKey="predicted_value"
                name="Prediksi"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                connectNulls={false}
                activeDot={{ r: 5, fill: '#f59e0b', stroke: 'white', strokeWidth: 2 }}
              />

              {/* Brush — range navigator bawah untuk scroll & zoom */}
              {!isZoomed && chartData.length > 20 && (
                <Brush
                  dataKey="date"
                  height={22}
                  stroke="#e5e7eb"
                  fill="#fafafa"
                  travellerWidth={6}
                  tickFormatter={formatXAxis}
                  startIndex={brushIndex.startIndex}
                  endIndex={brushIndex.endIndex}
                  onChange={(range) => {
                    if (range && typeof range.startIndex === 'number') {
                      setBrushIndex({ startIndex: range.startIndex, endIndex: range.endIndex });
                    }
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-[255px] text-sm text-neutral-400 gap-2">
            <svg className="w-10 h-10 text-neutral-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span>Belum ada data forecasting untuk periode ini</span>
          </div>
        )}
      </div>

      {/* Zoom hint */}
      {hasData && (
        <p className="text-[10px] text-neutral-400 text-center mt-1">
          {isZoomed
            ? `Menampilkan ${displayData.length} dari ${chartData.length} titik data · `
            : 'Sorot area pada grafik untuk zoom in · '}
          {chartData.length > 20 && !isZoomed && 'Gunakan navigator bawah untuk scroll'}
        </p>
      )}
    </AnalysisCard>
  );
}
