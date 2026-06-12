'use client';

import { AnalysisCard } from '@/components/main-card';
import { TrendDataPoint } from '@/types';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TimeFilter, AggType } from '@/hooks/use-forecasting';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ForecastingChartProps {
  data?: TrendDataPoint[];
  timeFilter: TimeFilter;
  setTimeFilter: (v: TimeFilter) => void;
  aggType?: AggType;
  setAggType?: (v: AggType) => void;
  isFixedFilter?: boolean;
}

export function ForecastingChart({ 
  data = [], 
  timeFilter, 
  setTimeFilter, 
  aggType, 
  setAggType,
  isFixedFilter = false 
}: ForecastingChartProps) {

  const formatXAxis = (tickItem: any) => {
    try {
      const date = new Date(tickItem);
      if (isNaN(date.getTime())) return String(tickItem);
      return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    } catch {
      return String(tickItem);
    }
  };

  return (
    <AnalysisCard title="Analisis Forecasting" className="flex flex-col relative w-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 w-full gap-2 overflow-x-auto">
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
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {setAggType && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 hidden sm:inline">Tipe Forecasting:</span>
            <Select value={aggType} onValueChange={(v) => setAggType(v as AggType)}>
              <SelectTrigger className="w-[160px] h-8 text-xs bg-white">
                <SelectValue placeholder="Pilih Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mean" className="text-xs">Mean (Rata-rata)</SelectItem>
                <SelectItem value="sum" className="text-xs">Sum (Total)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex-1 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis} 
                tick={{ fontSize: 10, fill: '#a3a3a3' }} 
                axisLine={false} 
                tickLine={false}
                minTickGap={20}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #f5f5f5', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                labelFormatter={formatXAxis}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#38bdf8" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center w-full h-[260px] text-sm text-neutral-400">
            Belum ada data trend
          </div>
        )}
      </div>
    </AnalysisCard>
  );
}
