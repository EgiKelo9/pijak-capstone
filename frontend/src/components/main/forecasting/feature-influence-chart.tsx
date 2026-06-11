'use client';

import { AnalysisCard } from '@/components/main-card';
import { FeatureDetail } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface FeatureInfluenceChartProps {
  features?: FeatureDetail[];
}

export function FeatureInfluenceChart({ features = [] }: FeatureInfluenceChartProps) {
  // Take top 5 features by absolute influence
  const data = [...features]
    .sort((a, b) => Math.abs(b.influence) - Math.abs(a.influence))
    .slice(0, 5)
    .map(f => ({
      name: f.name.replace(/^'|'$/g, ''), // Remove quotes if any
      value: f.influence * 100 // Convert to percentage
    }));

  return (
    <AnalysisCard title="Fitur Berpengaruh" className="flex flex-col h-full relative">
      <div className="flex-1 min-h-[200px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              formatter={(value: any) => {
                if (typeof value === 'number') return [`${value.toFixed(1)}%`, 'Pengaruh'];
                return [value, 'Pengaruh'];
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 4, 4]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#7dd3fc' : '#d4d4d8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </AnalysisCard>
  );
}
