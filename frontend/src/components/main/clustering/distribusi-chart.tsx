import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CLUSTER_COLORS } from '@/lib/utils';
import { ClusteringResultData } from '@/types';
import { useHoverStyle } from '@/app/(main)/clustering/page';

export function DistribusiChart({ result }: { result: ClusteringResultData }) {
  const { hovered, setHovered, style } = useHoverStyle();
  const data = useMemo(() => {
    const counts: Record<number, number> = {};
    result.cluster_data.forEach(d => { counts[d.cluster] = (counts[d.cluster] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({
      name: `Klaster ${parseInt(k) + 1}`, value: v, cluster: parseInt(k),
      pct: Math.round((v / result.cluster_data.length) * 100),
    }));
  }, [result]);

  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, pct }: any) => {
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return pct > 5 ? <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>{pct}%</text> : null;
  };

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className="rounded-xl" style={{ transition: 'all 0.2s ease' }}>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={hovered ? 93 : 90} dataKey="value"
            labelLine={false} label={renderLabel} paddingAngle={2}
            style={{ transition: 'all 0.3s ease' }}>
            {data.map((_, i) => <Cell key={i} fill={CLUSTER_COLORS[i % CLUSTER_COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v, n) => [`${v} produk`, n]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
