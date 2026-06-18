import { useState, useMemo, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CLUSTER_COLORS, formatNumber } from '@/lib/utils';
import { ClusteringResultData } from '@/types';

export function ClusterScatterChart({ result, colFitur }: { result: ClusteringResultData; colFitur: string[] }) {
  const [xFitur, setXFitur] = useState(colFitur[0] || '');
  const [yFitur, setYFitur] = useState(colFitur[1] || colFitur[0] || '');

  useEffect(() => {
    setXFitur(colFitur[0] || '');
    setYFitur(colFitur[1] || colFitur[0] || '');
  }, [colFitur]);

  const scatterData = useMemo(() => {
    const byCluster: Record<number, any[]> = {};
    result.cluster_data.forEach(d => {
      if (!byCluster[d.cluster]) byCluster[d.cluster] = [];
      byCluster[d.cluster].push({ x: Number(d[xFitur]) || 0, y: Number(d[yFitur]) || 0, product: d.product, cluster: d.cluster });
    });
    return byCluster;
  }, [result, xFitur, yFitur]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-lg p-3 text-xs">
          <p className="font-bold text-neutral-800 mb-1.5 max-w-36 truncate">{d.product}</p>
          <p className="text-neutral-500">{xFitur}: <span className="font-semibold text-neutral-700">{formatNumber(d.x)}</span></p>
          <p className="text-neutral-500">{yFitur}: <span className="font-semibold text-neutral-700">{formatNumber(d.y)}</span></p>
          <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-neutral-100">
            <div className="size-2 rounded-full" style={{ backgroundColor: CLUSTER_COLORS[d.cluster % CLUSTER_COLORS.length] }} />
            <span className="font-bold text-neutral-700">Klaster {d.cluster + 1}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 font-medium">Sumbu X:</span>
          <Select value={xFitur} onValueChange={setXFitur}>
            <SelectTrigger className="h-7 w-36 text-xs border-neutral-200 bg-neutral-50/50 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colFitur.map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 font-medium">Sumbu Y:</span>
          <Select value={yFitur} onValueChange={setYFitur}>
            <SelectTrigger className="h-7 w-36 text-xs border-neutral-200 bg-neutral-50/50 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colFitur.map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" dataKey="x" tick={{ fontSize: 10 }} tickFormatter={v => formatNumber(v)} name={xFitur}
            label={{ value: xFitur, position: 'insideBottom', offset: -8, fontSize: 11 }} />
          <YAxis type="number" dataKey="y" tick={{ fontSize: 10 }} tickFormatter={v => formatNumber(v)} name={yFitur}
            label={{ value: yFitur, angle: -90, position: 'insideLeft', fontSize: 11 }} />
          <ZAxis range={[35, 80]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {Object.entries(scatterData).map(([clusterKey, data]) => {
            const c = parseInt(clusterKey);
            return <Scatter key={c} name={`Klaster ${c + 1}`} data={data} fill={CLUSTER_COLORS[c % CLUSTER_COLORS.length]} fillOpacity={0.75} />;
          })}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
