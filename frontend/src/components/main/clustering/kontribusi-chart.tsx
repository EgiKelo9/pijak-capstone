import { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CLUSTER_COLORS, formatNumber } from '@/lib/utils';
import { ClusteringResultData } from '@/types';

export function KontribusiChart({ result, colFitur }: { result: ClusteringResultData; colFitur: string[] }) {
  const mainFitur = colFitur[0] || '';
  const data = useMemo(() => {
    const totals: Record<number, number> = {};
    result.cluster_data.forEach(d => { totals[d.cluster] = (totals[d.cluster] || 0) + (Number(d[mainFitur]) || 0); });
    return Object.entries(totals)
      .map(([k, v]) => ({ name: `Klaster ${parseInt(k) + 1}`, value: Math.round(v), cluster: parseInt(k) }))
      .sort((a, b) => b.value - a.value);
  }, [result, mainFitur]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => formatNumber(v)} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
        <Tooltip formatter={(v: any) => [formatNumber(v), mainFitur]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
          {data.map((d, i) => <Cell key={i} fill={CLUSTER_COLORS[d.cluster % CLUSTER_COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
