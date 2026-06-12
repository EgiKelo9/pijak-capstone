'use client';

import { AnalysisCard } from '@/components/main-card';
import { FeatureDetail } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface FeatureInfluenceChartProps {
  features?: FeatureDetail[];
}

/**
 * Mengurutkan fitur dengan prioritas:
 * 1. Fitur numerik (is_categorical=false/undefined) diutamakan — diurutkan desc by abs(influence)
 * 2. Fitur encoded categorical (is_categorical=true) di belakang — diurutkan desc by abs(influence)
 * Kemudian ambil top 5 setelah penggabungan.
 */
function sortedFeatures(features: FeatureDetail[]): FeatureDetail[] {
  const numerics = features
    .filter((f) => !f.is_categorical)
    .sort((a, b) => Math.abs(b.influence) - Math.abs(a.influence));
  const categoricals = features
    .filter((f) => f.is_categorical)
    .sort((a, b) => Math.abs(b.influence) - Math.abs(a.influence));
  return [...numerics, ...categoricals].slice(0, 5);
}

export function FeatureInfluenceChart({ features = [] }: FeatureInfluenceChartProps) {
  const top5 = sortedFeatures(features);

  const data = top5.map((f) => {
    const isPercentage = Math.abs(f.influence) > 1;
    return {
      name: f.name.replace(/^'|'$/g, ''),
      value: isPercentage ? f.influence : f.influence * 100,
      is_categorical: f.is_categorical ?? false,
    };
  });

  return (
    <AnalysisCard title="Fitur Berpengaruh" className="flex flex-col h-full">
      <div className="flex-1 w-full mt-2">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: '#888' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: string) => (v.length > 10 ? `${v.slice(0, 9)}…` : v)}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#888' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              formatter={(value: any, _: any, props: any) => {
                const isCat = props?.payload?.is_categorical;
                const label = typeof value === 'number'
                  ? `${value.toFixed(1)}%${isCat ? ' (kategorik)' : ''}`
                  : String(value);
                return [label, 'Pengaruh'];
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 4, 4]}>
              {data.map((entry, index) => {
                // Numerik positif → sky, numerik negatif → slate, kategorik → indigo (terang/redup)
                let fill: string;
                if (entry.is_categorical) {
                  fill = entry.value >= 0 ? '#818cf8' : '#c7d2fe';
                } else {
                  fill = entry.value >= 0 ? '#0284c7' : '#94a3b8';
                }
                return <Cell key={`cell-${index}`} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mini legend */}
      <div className="flex items-center gap-3 justify-center mt-1 pb-1 text-[10px] text-neutral-400">
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-[#0284c7]" />Numerik (+)</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-[#94a3b8]" />Numerik (−)</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-[#818cf8]" />Kategorik</span>
      </div>
    </AnalysisCard>
  );
}
