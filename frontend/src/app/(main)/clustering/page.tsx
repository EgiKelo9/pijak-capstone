'use client';

import * as React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine,
  BarChart, Bar, ScatterChart, Scatter, ZAxis, Area, AreaChart,
} from 'recharts';
import {
  ChevronDown, RefreshCw, Play, Loader2,
  Search, ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
} from 'lucide-react';
import { AnalysisCard } from '@/components/main-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { ClusteringEmptyState } from './clustering-empty-state';

interface ClusteringResult {
  cluster_amount: number;
  optimal_k: number;
  silhouette_score: number;
  silhouette_list: number[];
  wcss_score: number;
  wcss_list: number[];
  k_range: number[];
  cluster_data: Record<string, any>[];
  insight_summary: string;
}

const CLUSTER_COLORS = ['#2BBAEE', '#5DD9C1', '#94a3b8', '#7dd3fc', '#a5b4fc', '#86efac', '#fcd34d', '#f9a8d4', '#c4b5fd'];
const SEGMENT_LABELS = [
  { label: 'Fast Moving',   color: '#10b981', bg: '#d1fae5' },
  { label: 'High Moving',   color: '#34d399', bg: '#ecfdf5' },
  { label: 'Growing',       color: '#2BBAEE', bg: '#e0f7ff' },
  { label: 'Medium Moving', color: '#60a5fa', bg: '#eff6ff' },
  { label: 'Steady',        color: '#a78bfa', bg: '#f5f3ff' },
  { label: 'Slowing Down',  color: '#f59e0b', bg: '#fef3c7' },
  { label: 'Low Moving',    color: '#fb923c', bg: '#fff7ed' },
  { label: 'At Risk',       color: '#f87171', bg: '#fef2f2' },
  { label: 'Nearly Dead',   color: '#ef4444', bg: '#fee2e2' },
  { label: 'Dead Stock',    color: '#991b1b', bg: '#fecaca' },
];

function getSegmentLabel(rank: number, total: number) {
  if (total === 1) return SEGMENT_LABELS[0];
  const idx = Math.round((rank / (total - 1)) * (SEGMENT_LABELS.length - 1));
  return SEGMENT_LABELS[Math.min(idx, SEGMENT_LABELS.length - 1)];
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}rb`;
  return n.toFixed(1);
}

// Hover card style helper
function useHoverStyle(baseStyle?: React.CSSProperties) {
  const [hovered, setHovered] = React.useState(false);
  const style: React.CSSProperties = {
    ...baseStyle,
    transform: hovered ? 'translateY(-3px) scale(1.01)' : 'translateY(0) scale(1)',
    boxShadow: hovered ? '0 12px 32px rgba(43,186,238,0.13)' : '0 1px 4px rgba(0,0,0,0.06)',
    transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
    cursor: 'pointer',
  };
  return { hovered, setHovered, style };
}

// KPI Card with colored background
function KpiCard({ title, value, sub, opacity }: { title: string; value: string | number; sub: string; opacity: number }) {
  const { hovered, setHovered, style } = useHoverStyle();
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#2BBAEE]/20 p-6 text-center overflow-hidden"
      style={{
        ...style,
        background: `linear-gradient(135deg, rgba(43,186,238,${opacity}) 0%, rgba(144,253,242,${opacity * 0.7}) 100%)`,
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ background: 'linear-gradient(90deg, #2BBAEE, #90FDF2)' }} />
      <div className="absolute -bottom-4 -right-4 size-20 rounded-full blur-2xl pointer-events-none"
        style={{ backgroundColor: '#2BBAEE', opacity: hovered ? 0.12 : 0.06, transition: 'opacity 0.3s' }} />
      <p className="text-[11px] font-bold text-[#1a7fa8] uppercase tracking-widest relative z-10">{title}</p>
      <p className="text-5xl font-black tabular-nums leading-none relative z-10"
        style={{ color: `rgba(14,116,144,${Math.min(opacity * 6, 1)})` }}>{value}</p>
      <p className="text-xs relative z-10" style={{ color: `rgba(14,116,144,${Math.min(opacity * 5, 0.75)})` }}>{sub}</p>
    </div>
  );
}

// Cluster Summary Cards
function ClusterSummaryCards({ result, colFitur }: { result: ClusteringResult; colFitur: string[] }) {
  const mainFitur = colFitur[0] || '';
  const [hoveredCard, setHoveredCard] = React.useState<number | null>(null);

  const clusterStats = React.useMemo(() => {
    const stats: Record<number, { count: number; total: number }> = {};
    result.cluster_data.forEach(d => {
      if (!stats[d.cluster]) stats[d.cluster] = { count: 0, total: 0 };
      stats[d.cluster].count++;
      stats[d.cluster].total += Number(d[mainFitur]) || 0;
    });
    return stats;
  }, [result, mainFitur]);

  const sorted = Object.entries(clusterStats).sort(([, a], [, b]) => b.total - a.total);
  const totalProducts = result.cluster_data.length;
  const totalSales = Object.values(clusterStats).reduce((s, v) => s + v.total, 0);
  const cols = Math.min(result.cluster_amount, 5);

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {sorted.map(([clusterKey, stats], rankIdx) => {
        const c = parseInt(clusterKey);
        const segment = getSegmentLabel(rankIdx, sorted.length);
        const pct = totalProducts > 0 ? Math.round((stats.count / totalProducts) * 100) : 0;
        const salesPct = totalSales > 0 ? Math.round((stats.total / totalSales) * 100) : 0;
        const isHovered = hoveredCard === c;

        return (
          <div key={c}
            onMouseEnter={() => setHoveredCard(c)}
            onMouseLeave={() => setHoveredCard(null)}
            className="relative flex flex-col gap-3 rounded-2xl border bg-white p-5 overflow-hidden"
            style={{
              borderColor: isHovered ? CLUSTER_COLORS[c % CLUSTER_COLORS.length] + '60' : 'rgba(0,0,0,0.08)',
              transform: isHovered ? 'translateY(-3px) scale(1.01)' : 'translateY(0) scale(1)',
              boxShadow: isHovered ? `0 12px 32px ${CLUSTER_COLORS[c % CLUSTER_COLORS.length]}25` : '0 1px 4px rgba(0,0,0,0.05)',
              transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
              cursor: 'pointer',
            }}>
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
              style={{ backgroundColor: CLUSTER_COLORS[c % CLUSTER_COLORS.length] }} />
            <div className="absolute -top-8 -right-8 size-24 rounded-full pointer-events-none"
              style={{ backgroundColor: CLUSTER_COLORS[c % CLUSTER_COLORS.length], opacity: isHovered ? 0.08 : 0.03, filter: 'blur(16px)', transition: 'opacity 0.3s' }} />

            <div className="flex items-center justify-between flex-wrap gap-1 relative z-10">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: CLUSTER_COLORS[c % CLUSTER_COLORS.length] }} />
                <span className="text-sm font-bold text-neutral-800">Klaster {c + 1}</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{ backgroundColor: segment.bg, color: segment.color }}>{segment.label}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 relative z-10">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">Produk</span>
                <span className="text-xl font-bold text-neutral-800 tabular-nums">{stats.count}</span>
                <span className="text-[11px] text-neutral-400">{pct}% total</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider truncate">{mainFitur || 'Nilai'}</span>
                <span className="text-xl font-bold text-neutral-800 tabular-nums">{formatNumber(stats.total)}</span>
                <span className="text-[11px] text-neutral-400">{salesPct}% kontribusi</span>
              </div>
            </div>

            <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden relative z-10">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CLUSTER_COLORS[c % CLUSTER_COLORS.length], transition: 'width 0.8s ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Top & Bottom Products with tooltip
function TopBottomProducts({ result, colFitur }: { result: ClusteringResult; colFitur: string[] }) {
  const [activeCluster, setActiveCluster] = React.useState(0);
  const [tooltip, setTooltip] = React.useState<{ x: number; y: number; data: Record<string, any> } | null>(null);
  const mainFitur = colFitur[0] || '';
  const uniqueClusters = [...new Set(result.cluster_data.map(d => d.cluster))].sort();

  const clusterData = result.cluster_data.filter(d => d.cluster === activeCluster);
  const sorted = [...clusterData].sort((a, b) => (Number(b[mainFitur]) || 0) - (Number(a[mainFitur]) || 0));
  const top5 = sorted.slice(0, 5);
  const bottom5 = sorted.slice(-5).reverse();

  const handleMouseMove = (e: React.MouseEvent, row: Record<string, any>) => {
    setTooltip({ x: e.clientX, y: e.clientY, data: row });
  };
  const handleMouseLeave = () => setTooltip(null);

  const ProductRow = ({ row, barColor, max }: { row: Record<string, any>; barColor: string; max: number }) => {
    const [hov, setHov] = React.useState(false);
    const val = Number(row[mainFitur]) || 0;
    return (
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => { setHov(false); handleMouseLeave(); }}
        onMouseMove={e => handleMouseMove(e, row)}
        className="flex flex-col gap-1 rounded-lg px-2 py-1.5 cursor-pointer"
        style={{ backgroundColor: hov ? 'rgba(43,186,238,0.06)' : 'transparent', transition: 'background 0.15s ease', transform: hov ? 'translateX(2px)' : 'translateX(0)', transition2: 'transform 0.15s ease' } as any}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-700 truncate max-w-48 font-medium">{row.product}</span>
          <span className="text-xs font-bold text-neutral-800 tabular-nums ml-2">{formatNumber(val)}</span>
        </div>
        <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(val / max) * 100}%`, backgroundColor: barColor, opacity: hov ? 1 : 0.8 }} />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 relative">
      {tooltip && (
        <div className="fixed z-50 pointer-events-none rounded-xl border border-neutral-200 bg-white shadow-xl p-3 text-xs"
          style={{ left: tooltip.x + 14, top: tooltip.y - 70, minWidth: 190 }}>
          <p className="font-bold text-neutral-800 mb-2 truncate max-w-40">{tooltip.data.product}</p>
          {colFitur.map(f => (
            <div key={f} className="flex justify-between gap-4 py-0.5">
              <span className="text-neutral-400">{f}</span>
              <span className="font-semibold text-neutral-700 tabular-nums">
                {typeof tooltip.data[f] === 'number' ? formatNumber(tooltip.data[f]) : tooltip.data[f] ?? '-'}
              </span>
            </div>
          ))}
          <div className="flex justify-between gap-4 mt-1.5 pt-1.5 border-t border-neutral-100">
            <span className="text-neutral-400">Klaster</span>
            <span className="font-bold" style={{ color: CLUSTER_COLORS[tooltip.data.cluster % CLUSTER_COLORS.length] }}>
              {tooltip.data.cluster + 1}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-1.5 flex-wrap">
        {uniqueClusters.map(c => (
          <button key={c} onClick={() => setActiveCluster(c)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 hover:opacity-90 active:scale-95"
            style={activeCluster === c
              ? { backgroundColor: CLUSTER_COLORS[c % CLUSTER_COLORS.length], color: 'white' }
              : { backgroundColor: '#f5f5f5', color: '#6b7280' }}>
            Klaster {c + 1}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="size-4 text-emerald-500" />
            <span className="text-xs font-semibold text-neutral-600">Top 5 Produk</span>
          </div>
          {top5.map((row, i) => (
            <ProductRow key={i} row={row} barColor={CLUSTER_COLORS[activeCluster % CLUSTER_COLORS.length]} max={Number(top5[0]?.[mainFitur]) || 1} />
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="size-4 text-rose-500" />
            <span className="text-xs font-semibold text-neutral-600">Bottom 5 Produk</span>
          </div>
          {bottom5.map((row, i) => (
            <ProductRow key={i} row={row} barColor="#fca5a5" max={Number(top5[0]?.[mainFitur]) || 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Distribusi Chart
function DistribusiChart({ result }: { result: ClusteringResult }) {
  const { hovered, setHovered, style } = useHoverStyle();
  const data = React.useMemo(() => {
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

// Kontribusi Chart
function KontribusiChart({ result, colFitur }: { result: ClusteringResult; colFitur: string[] }) {
  const mainFitur = colFitur[0] || '';
  const data = React.useMemo(() => {
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

// Cluster Scatter Chart with axis selector
function ClusterScatterChart({ result, colFitur }: { result: ClusteringResult; colFitur: string[] }) {
  const [xFitur, setXFitur] = React.useState(colFitur[0] || '');
  const [yFitur, setYFitur] = React.useState(colFitur[1] || colFitur[0] || '');

  React.useEffect(() => {
    setXFitur(colFitur[0] || '');
    setYFitur(colFitur[1] || colFitur[0] || '');
  }, [colFitur]);

  const scatterData = React.useMemo(() => {
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

// Gradient Area Line Chart
function GradientLineChart({ data, dataKey, color, endColor, gradientId, label, optimalK, yLabel }: {
  data: any[]; dataKey: string; color: string; endColor: string; gradientId: string;
  label: string; optimalK?: number; yLabel?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-neutral-400">
        Data tidak tersedia.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
        <defs>
          <linearGradient id={`${gradientId}Line`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
          <linearGradient id={`${gradientId}Area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="90%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="k" tick={{ fontSize: 11 }}
          label={{ value: 'Jumlah Klaster (K)', position: 'insideBottom', offset: -12, fontSize: 11 }} />
        <YAxis tick={{ fontSize: 10 }} label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fontSize: 10 } : undefined} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
          formatter={(v: any) => [typeof v === 'number' ? v.toFixed(4) : v, label]} />
        {optimalK && (
          <ReferenceLine x={optimalK} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={2}
            label={{ value: `K=${optimalK}`, position: 'top', fontSize: 10, fill: '#f59e0b' }} />
        )}
        <Area type="monotone" dataKey={dataKey}
          stroke={`url(#${gradientId}Line)`} strokeWidth={2.5}
          fill={`url(#${gradientId}Area)`}
          dot={({ cx, cy, payload }: any) => (
            <circle key={payload.k} cx={cx} cy={cy}
              r={payload.k === optimalK ? 7 : 4}
              fill={payload.k === optimalK ? '#f59e0b' : color}
              stroke="white" strokeWidth={2} />
          )} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Accordion
function ClusterAccordion({ clusterIndex, color, productCount, insight }: {
  clusterIndex: number; color: string; productCount: number; insight: string;
}) {
  const [open, setOpen] = React.useState(clusterIndex === 0);
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="border rounded-xl overflow-hidden"
      style={{
        borderColor: hovered ? color + '50' : '#f5f5f5',
        boxShadow: hovered ? `0 4px 16px ${color}18` : 'none',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'all 0.2s ease',
      }}>
      <button onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 bg-white transition-colors"
        style={{ backgroundColor: hovered ? color + '06' : 'white' }}>
        <div className="flex items-center gap-3">
          <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-sm font-semibold text-neutral-800">Klaster {clusterIndex + 1}</span>
          <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">{productCount} produk</span>
        </div>
        <ChevronDown className={cn('size-4 text-neutral-400 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 bg-neutral-50/30 text-sm text-neutral-600 leading-relaxed border-t border-neutral-100">
          {insight || 'Insight tidak tersedia.'}
        </div>
      )}
    </div>
  );
}

// Product Table
function ProductTable({ data, colFitur }: { data: Record<string, any>[]; colFitur: string[] }) {
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [hoveredRow, setHoveredRow] = React.useState<number | null>(null);
  const [tooltip, setTooltip] = React.useState<{ x: number; y: number; data: Record<string, any> } | null>(null);
  const perPage = 10;

  const filtered = React.useMemo(() =>
    data.filter(row => String(row.product).toLowerCase().includes(search.toLowerCase())),
    [data, search]
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const displayCols = colFitur.slice(0, 3);
  React.useEffect(() => setPage(1), [search]);

  return (
    <div className="flex flex-col gap-3">
      {tooltip && (
        <div className="fixed z-50 pointer-events-none rounded-xl border border-neutral-200 bg-white shadow-xl p-3 text-xs"
          style={{ left: tooltip.x + 14, top: tooltip.y - 70, minWidth: 190 }}>
          <p className="font-bold text-neutral-800 mb-2 truncate max-w-40">{tooltip.data.product}</p>
          {colFitur.map(f => (
            <div key={f} className="flex justify-between gap-4 py-0.5">
              <span className="text-neutral-400">{f}</span>
              <span className="font-semibold text-neutral-700 tabular-nums">
                {typeof tooltip.data[f] === 'number' ? formatNumber(tooltip.data[f]) : tooltip.data[f] ?? '-'}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-neutral-100">
            <div className="size-2 rounded-full" style={{ backgroundColor: CLUSTER_COLORS[tooltip.data.cluster % CLUSTER_COLORS.length] }} />
            <span className="font-bold text-neutral-700">Klaster {tooltip.data.cluster + 1}</span>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama produk..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-lg bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-[#2BBAEE]/50 transition-all" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-100">
        <table className="w-full text-xs">
          <thead className="bg-neutral-50/80 border-b border-neutral-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-neutral-500">Produk</th>
              {displayCols.map(f => <th key={f} className="text-right px-4 py-3 font-semibold text-neutral-500 whitespace-nowrap">{f}</th>)}
              <th className="text-center px-4 py-3 font-semibold text-neutral-500">Klaster</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0
              ? <tr><td colSpan={displayCols.length + 2} className="text-center py-10 text-neutral-400">Tidak ada produk ditemukan</td></tr>
              : paginated.map((row, i) => (
                <tr key={i}
                  onMouseEnter={() => { setHoveredRow(i); }}
                  onMouseMove={e => setTooltip({ x: e.clientX, y: e.clientY, data: row })}
                  onMouseLeave={() => { setHoveredRow(null); setTooltip(null); }}
                  className="border-b border-neutral-50 transition-all duration-150"
                  style={{
                    backgroundColor: hoveredRow === i ? 'rgba(43,186,238,0.05)' : 'transparent',
                    transform: hoveredRow === i ? 'translateX(2px)' : 'translateX(0)',
                  }}>
                  <td className="px-4 py-2.5 font-medium text-neutral-700 max-w-52 truncate">{row.product}</td>
                  {displayCols.map(f => (
                    <td key={f} className="px-4 py-2.5 text-right text-neutral-600 tabular-nums">
                      {typeof row[f] === 'number' ? formatNumber(row[f]) : row[f] ?? '-'}
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-center">
                    <span className="inline-flex items-center justify-center rounded-full w-6 h-6 text-[10px] font-bold transition-all duration-150"
                      style={{
                        backgroundColor: CLUSTER_COLORS[row.cluster % CLUSTER_COLORS.length] + (hoveredRow === i ? '40' : '25'),
                        color: CLUSTER_COLORS[row.cluster % CLUSTER_COLORS.length],
                        transform: hoveredRow === i ? 'scale(1.15)' : 'scale(1)',
                      }}>
                      {row.cluster + 1}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-400">{filtered.length} produk · hal. {page}/{totalPages}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex size-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 transition-colors">
              <ChevronLeft className="size-3.5" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={cn('flex size-7 items-center justify-center rounded-lg text-xs font-semibold transition-all',
                    p === page ? 'text-white shadow-sm' : 'border border-neutral-200 text-neutral-500 hover:bg-neutral-50')}
                  style={p === page ? { backgroundColor: '#2BBAEE' } : {}}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex size-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 transition-colors">
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Metrik Table
function MetrikTable({ result }: { result: ClusteringResult }) {
  const kRange = result.k_range ?? [];
  const wcssList = result.wcss_list ?? [];
  const silhouetteList = result.silhouette_list ?? [];

  if (kRange.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-neutral-400 rounded-xl border border-neutral-100">
        Data metrik per K tidak tersedia untuk hasil ini.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-100">
      <table className="w-full text-xs">
        <thead className="bg-neutral-50 border-b border-neutral-100">
          <tr>
            <th className="text-center px-4 py-2.5 font-semibold text-neutral-500">K</th>
            <th className="text-right px-4 py-2.5 font-semibold text-neutral-500">WCSS Score</th>
            <th className="text-right px-4 py-2.5 font-semibold text-neutral-500">Silhouette Score</th>
            <th className="text-center px-4 py-2.5 font-semibold text-neutral-500">Status</th>
          </tr>
        </thead>
        <tbody>
          {kRange.map((k, i) => {
            const isOptimal = result.optimal_k != null && k === result.optimal_k;
            const isUsed = k === result.cluster_amount;
            return (
              <tr key={k} className={cn('border-b border-neutral-50 transition-colors',
                isOptimal ? 'bg-amber-50' : isUsed ? 'bg-[#2BBAEE]/5' : 'hover:bg-neutral-50/60')}>
                <td className="px-4 py-2 text-center font-bold text-neutral-800">{k}</td>
                <td className="px-4 py-2 text-right tabular-nums text-neutral-600">{wcssList[i]?.toFixed(1) ?? '-'}</td>
                <td className="px-4 py-2 text-right tabular-nums text-neutral-600">{silhouetteList[i]?.toFixed(4) ?? '-'}</td>
                <td className="px-4 py-2 text-center">
                  {isOptimal && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">Optimal</span>}
                  {isUsed && !isOptimal && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2BBAEE]/15 text-[#2BBAEE]">Dipakai</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Main Page
export default function ClusteringPage() {
  const [datasetId, setDatasetId] = React.useState<number | null>(null);
  const [columns, setColumns] = React.useState<string[]>([]);
  const [colProduct, setColProduct] = React.useState('');
  const [colFitur, setColFitur] = React.useState<string[]>([]);
  const [rawData, setRawData] = React.useState<Record<string, any>[]>([]);
  const [result, setResult] = React.useState<ClusteringResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'hasil' | 'pengujian'>('hasil');
  const [filterCluster, setFilterCluster] = React.useState('all');
  const [customK, setCustomK] = React.useState(3);
  const [isReanalyzing, setIsReanalyzing] = React.useState(false);
  const [lastAnalysisId, setLastAnalysisId] = React.useState<number | null>(null);

  // Load dataset (kolom + raw data) dari sessionStorage saat pertama kali dimuat
  React.useEffect(() => {
    const storedId = sessionStorage.getItem('pijak_active_dataset_id');
    if (storedId) {
      const id = parseInt(storedId, 10);
      setDatasetId(id);
      fetchDataset(id);
    }
  }, []);

  // Load hasil clustering terakhir (jika ada) dari sessionStorage saat pertama kali dimuat
  React.useEffect(() => {
    const storedClusteringId = sessionStorage.getItem('pijak_last_clustering_id');
    const storedColProduct = sessionStorage.getItem('pijak_clustering_col_product');
    const storedColFitur = sessionStorage.getItem('pijak_clustering_col_fitur');

    if (storedColProduct) setColProduct(storedColProduct);
    if (storedColFitur) {
      try {
        const parsed = JSON.parse(storedColFitur);
        if (Array.isArray(parsed)) setColFitur(parsed);
      } catch (e) {
        console.error('Gagal parse colFitur dari sessionStorage:', e);
      }
    }

    if (storedClusteringId) {
      fetchLastClusteringResult(parseInt(storedClusteringId, 10));
    }
  }, []);

  const fetchDataset = async (id: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/datasets/${id}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error('Gagal fetch dataset');
      const text = await res.text();

      // Parser CSV robust — handle quoted fields dengan koma di dalamnya
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const lines = text.split('\n').filter(Boolean);
      const headers = parseCSVLine(lines[0]).map(h => h.replace(/^["']|["']$/g, ''));
      setColumns(headers);
      const data = lines.slice(1).map(line => {
        const vals = parseCSVLine(line);
        return headers.reduce((acc, h, i) => {
          const raw = (vals[i] ?? '').replace(/^"+|"+$/g, '');
          acc[h] = isNaN(Number(raw)) || raw === '' ? raw : Number(raw);
          return acc;
        }, {} as Record<string, any>);
      });
      setRawData(data);
    } catch (e) { console.error(e); }
  };

  // Ambil hasil clustering terakhir dari backend (untuk persist saat reload)
  const fetchLastClusteringResult = async (analysisId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/clustering/result/${analysisId}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) return;
      const json = await res.json();
      const resultData = json.data.result;
      setResult(resultData);
      setLastAnalysisId(analysisId);
      setCustomK(resultData.cluster_amount);
    } catch (e) {
      console.error('Gagal fetch hasil clustering terakhir:', e);
    }
  };

  const runClustering = async (nClusters?: number) => {
    if (!colProduct || colFitur.length === 0 || !datasetId) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/clustering/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          dataset_id: datasetId,
          col_product: colProduct,
          col_fitur: colFitur,
          data: rawData,
          n_clusters: nClusters ?? null,
        }),
      });
      if (!res.ok) throw new Error('Clustering gagal');
      const json = await res.json();
      const resultData = json.data.result;
      setResult(resultData);
      setLastAnalysisId(json.data.analysis_id);

      // Persist analysis_id + konfigurasi kolom agar bisa direstore saat reload
      sessionStorage.setItem('pijak_last_clustering_id', String(json.data.analysis_id));
      sessionStorage.setItem('pijak_clustering_col_product', colProduct);
      sessionStorage.setItem('pijak_clustering_col_fitur', JSON.stringify(colFitur));

      setCustomK(resultData.cluster_amount);
      setActiveTab('hasil');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
      setIsReanalyzing(false);
    }
  };

  const filteredData = React.useMemo(() => {
    if (!result) return [];
    if (filterCluster === 'all') return result.cluster_data;
    return result.cluster_data.filter(d => String(d.cluster) === filterCluster);
  }, [result, filterCluster]);

  const uniqueClusters = result ? [...new Set(result.cluster_data.map(d => d.cluster))].sort() : [];

  const clusterSizes = React.useMemo(() => {
    if (!result) return {};
    const counts: Record<number, number> = {};
    result.cluster_data.forEach(d => { counts[d.cluster] = (counts[d.cluster] || 0) + 1; });
    return counts;
  }, [result]);

  const clusterInsights = React.useMemo(() => {
    if (!result) return [];
    const text = result.insight_summary;
    const parts = text.split(/(?=Cluster \d+|Klaster \d+)/gi).filter(Boolean);
    return parts.length > 1 ? parts : uniqueClusters.map(() => text);
  }, [result, uniqueClusters]);

  const elbowData = (result?.k_range && result?.wcss_list)
    ? result.k_range.map((k, i) => ({ k, wcss: result.wcss_list[i] }))
    : [];
  const silhouetteData = (result?.k_range && result?.silhouette_list)
    ? result.k_range.map((k, i) => ({ k, silhouette: result.silhouette_list[i] }))
    : [];
  const hasMetrikData = !!(result?.k_range && result?.wcss_list && result?.silhouette_list);

  if (!datasetId) return <div className="flex flex-col h-full w-full p-4"><ClusteringEmptyState /></div>;

  return (
    <div className="flex flex-col h-full w-full p-4 gap-3 overflow-y-auto">

      {/* Header Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div className="flex rounded-xl border border-neutral-800/20 bg-white p-1 gap-1 shadow-sm">
          {(['hasil', 'pengujian'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95',
                activeTab === tab ? 'text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50')}
              style={activeTab === tab ? { background: 'linear-gradient(135deg, #2BBAEE, #90FDF2)' } : {}}>
              {tab === 'hasil' ? 'Hasil' : 'Pengujian'}
            </button>
          ))}
        </div>
      </div>

      {/* Konfigurasi */}
      <AnalysisCard title="Konfigurasi Clustering" status={result ? 'berhasil' : 'menunggu'}
        className="shrink-0" collapsible={!!result} defaultOpen={!result}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">Kolom Produk</span>
            <p className="text-xs text-neutral-400">Kolom yang berisi nama atau ID unik produk</p>
            <Select value={colProduct || undefined} onValueChange={setColProduct}>
              <SelectTrigger className="h-9 text-sm border-neutral-200 bg-neutral-50/50">
                <SelectValue placeholder="Pilih kolom produk..." />
              </SelectTrigger>
              <SelectContent>
                {columns.filter(c => c).map(col => <SelectItem key={col} value={col} className="text-sm">{col}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">Kolom Fitur</span>
            <p className="text-xs text-neutral-400">Kolom numerik sebagai dasar pengelompokan</p>
            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto border border-neutral-100 rounded-lg p-2 bg-neutral-50/50">
              {columns.filter(c => c && c !== colProduct).map(col => (
                <label key={col} className="flex items-center gap-2 cursor-pointer hover:bg-white rounded-md px-2 py-1 transition-colors">
                  <Checkbox checked={colFitur.includes(col)}
                    onCheckedChange={v => setColFitur(prev => v ? [...prev, col] : prev.filter(c => c !== col))}
                    className="h-3.5 w-3.5 shrink-0 data-[state=checked]:bg-[#2BBAEE] data-[state=checked]:border-[#2BBAEE]" />
                  <span className="text-sm text-neutral-700">{col}</span>
                </label>
              ))}
            </div>
            {colFitur.length > 0 && <span className="text-[11px] text-[#2BBAEE] font-medium">{colFitur.length} kolom dipilih</span>}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <div className="ml-auto">
            <button onClick={() => runClustering()} disabled={!colProduct || colFitur.length === 0 || isLoading}
              className={cn('flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all active:scale-95 shadow-sm',
                colProduct && colFitur.length > 0 && !isLoading
                  ? 'text-neutral-800 hover:opacity-90'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed')}
              style={colProduct && colFitur.length > 0 && !isLoading
                ? { background: 'linear-gradient(135deg, #90FDF2, #2BBAEE)' } : {}}>
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : result ? <RefreshCw className="size-4" /> : <Play className="size-4" />}
              {isLoading ? 'Memproses...' : result ? 'Analisis Ulang' : 'Jalankan Clustering'}
            </button>
          </div>
        </div>
      </AnalysisCard>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-neutral-800/20 bg-white min-h-72">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="size-16 rounded-full border-4 border-[#2BBAEE]/20" />
              <div className="absolute inset-0 size-16 rounded-full border-4 border-t-[#2BBAEE] animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-neutral-700">Sedang menjalankan clustering...</p>
              <p className="text-xs text-neutral-400 mt-1">Proses ini mungkin memerlukan waktu beberapa saat</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB HASIL */}
      {result && !isLoading && activeTab === 'hasil' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #2BBAEE, #90FDF2)' }}>
              K yang digunakan: {result.cluster_amount}
            </div>
            {result.optimal_k != null && result.cluster_amount !== result.optimal_k && (
              <span className="text-xs text-neutral-400 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                K optimal sistem: {result.optimal_k}
              </span>
            )}
          </div>

          <ClusterSummaryCards result={result} colFitur={colFitur} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <AnalysisCard title="Distribusi Produk per Klaster" status="berhasil">
              <DistribusiChart result={result} />
            </AnalysisCard>
            <AnalysisCard title={`Kontribusi ${colFitur[0] || 'Nilai'} per Klaster`} status="berhasil">
              <KontribusiChart result={result} colFitur={colFitur} />
            </AnalysisCard>
          </div>

          <AnalysisCard title={`Top & Bottom Produk berdasarkan ${colFitur[0] || 'Fitur Utama'}`} status="berhasil">
            <TopBottomProducts result={result} colFitur={colFitur} />
          </AnalysisCard>

          <AnalysisCard title="Detail Semua Produk" status="berhasil">
            {result && (
              <div className="flex justify-end mb-2">
                <Select value={filterCluster} onValueChange={setFilterCluster}>
                  <SelectTrigger className="h-8 w-44 rounded-lg border-neutral-200 bg-neutral-50/50 text-xs">
                    <SelectValue placeholder="Filter Cluster" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Semua Klaster</SelectItem>
                    {uniqueClusters.map(c => (
                      <SelectItem key={c} value={String(c)} className="text-xs">
                        <span className="inline-flex items-center gap-2">
                          <span className="size-2 rounded-full inline-block" style={{ backgroundColor: CLUSTER_COLORS[c % CLUSTER_COLORS.length] }} />
                          Klaster {c + 1}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <ProductTable data={filteredData} colFitur={colFitur} />
          </AnalysisCard>

          <AnalysisCard title="Analisis & Insight per Klaster" status="berhasil">
            <div className="flex flex-col gap-2">
              {uniqueClusters.map((c, i) => (
                <ClusterAccordion key={c} clusterIndex={c}
                  color={CLUSTER_COLORS[i % CLUSTER_COLORS.length]}
                  productCount={clusterSizes[c] || 0}
                  insight={clusterInsights[i] || result.insight_summary} />
              ))}
            </div>
          </AnalysisCard>
        </div>
      )}

      {/* TAB PENGUJIAN */}
      {result && !isLoading && activeTab === 'pengujian' && (
        <div className="flex flex-col gap-4">

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KpiCard title="Silhouette Score" value={result.silhouette_score?.toFixed(4) ?? '-'} sub="Semakin tinggi semakin baik (maks 1)" opacity={0.12} />
            <KpiCard title="WCSS Score" value={result.wcss_score?.toFixed(1) ?? '-'} sub="Semakin rendah semakin baik" opacity={0.08} />
            <KpiCard title="K Optimal" value={result.optimal_k ?? '-'} sub="Rekomendasi sistem" opacity={0.16} />
          </div>

          {hasMetrikData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <AnalysisCard title="Analisis Elbow (WCSS)" status="berhasil">
                <GradientLineChart data={elbowData} dataKey="wcss" color="#2BBAEE" endColor="#90FDF2"
                  gradientId="elbowGrad" label="WCSS" optimalK={result.optimal_k ?? undefined} yLabel="WCSS" />
                <p className="text-xs text-neutral-400 text-center mt-1">
                  <span className="inline-block size-2.5 rounded-full bg-amber-400 mr-1.5 align-middle" />
                  K optimal = {result.optimal_k ?? '-'}
                </p>
              </AnalysisCard>
              <AnalysisCard title="Analisis Silhouette Score" status="berhasil">
                <GradientLineChart data={silhouetteData} dataKey="silhouette" color="#10b981" endColor="#86efac"
                  gradientId="silhouetteGrad" label="Silhouette" optimalK={result.optimal_k ?? undefined} yLabel="Score" />
                <p className="text-xs text-neutral-400 text-center mt-1">
                  <span className="inline-block size-2.5 rounded-full bg-amber-400 mr-1.5 align-middle" />
                  K optimal = {result.optimal_k ?? '-'}
                </p>
              </AnalysisCard>
            </div>
          ) : (
            <AnalysisCard title="Analisis Elbow & Silhouette" status="kosong">
              <div className="flex items-center justify-center py-10 text-sm text-neutral-400">
                Data elbow/silhouette tidak tersedia untuk hasil ini. Jalankan ulang clustering untuk melihat grafik.
              </div>
            </AnalysisCard>
          )}

          <AnalysisCard title="Visualisasi Sebaran Klaster" status="berhasil">
            <ClusterScatterChart result={result} colFitur={colFitur} />
          </AnalysisCard>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            <AnalysisCard title="Perbandingan Metrik per K" status="berhasil" className="lg:col-span-3">
              <MetrikTable result={result} />
            </AnalysisCard>
            <AnalysisCard title="Penyesuaian K" status="kosong" className="lg:col-span-2">
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-neutral-700">Jumlah Klaster</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Coba Nilai K sesuai kebutuhan bisnis Anda</p>
                  </div>
                  <span className="text-3xl font-bold tabular-nums" style={{ color: '#2BBAEE' }}>K = {customK}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 9 }, (_, i) => i + 2).map(n => (
                    <button key={n} onClick={() => setCustomK(n)}
                      className={cn('flex size-8 items-center justify-center rounded-lg text-xs font-bold transition-all active:scale-90',
                        n === customK ? 'text-white shadow-sm' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200')}
                      style={n === customK ? { background: 'linear-gradient(135deg, #2BBAEE, #90FDF2)' } : {}}>
                      {n}
                    </button>
                  ))}
                </div>
                <Slider min={2} max={10} step={1} value={[customK]} onValueChange={([v]) => setCustomK(v)} />
                <button onClick={() => { setIsReanalyzing(true); runClustering(customK); }} disabled={isReanalyzing}
                  className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-neutral-800 hover:opacity-90 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #90FDF2, #2BBAEE)' }}>
                  {isReanalyzing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  Analisis Kembali
                </button>
              </div>
            </AnalysisCard>
          </div>
        </div>
      )}
    </div>
  );
}