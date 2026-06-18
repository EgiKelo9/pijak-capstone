import { useState, useMemo, useRef, useEffect } from 'react';
import { CLUSTER_COLORS, SEGMENT_LABELS, getSegmentLabel, formatNumber } from '@/lib/utils';
import { ClusteringResultData } from '@/types';

/** Resolve a segment style from an AI-generated category string. */
function getSegmentFromCategory(category: string) {
  const upper = category.toUpperCase();
  // Try to match against known SEGMENT_LABELS
  const match = SEGMENT_LABELS.find(s => upper.includes(s.label.toUpperCase()));
  if (match) return match;
  // Fallback broad matching
  if (upper.includes('FAST')) return SEGMENT_LABELS[0];
  if (upper.includes('HIGH')) return SEGMENT_LABELS[1];
  if (upper.includes('GROW')) return SEGMENT_LABELS[2];
  if (upper.includes('MEDIUM')) return SEGMENT_LABELS[3];
  if (upper.includes('STEADY')) return SEGMENT_LABELS[4];
  if (upper.includes('SLOW')) return SEGMENT_LABELS[5];
  if (upper.includes('LOW')) return SEGMENT_LABELS[6];
  if (upper.includes('RISK')) return SEGMENT_LABELS[7];
  if (upper.includes('NEARLY')) return SEGMENT_LABELS[8];
  if (upper.includes('DEAD')) return SEGMENT_LABELS[9];
  return { label: category, color: '#6b7280', bg: '#f3f4f6' };
}

interface ClusterSummaryCardsProps {
  result: ClusteringResultData;
  colFitur: string[];
  /** AI-generated category labels keyed by 0-indexed cluster number */
  categories?: Record<number, string>;
}

export function ClusterSummaryCards({ result, colFitur, categories }: ClusterSummaryCardsProps) {
  const mainFitur = colFitur[0] || '';
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const clusterStats = useMemo(() => {
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

  // Apply dynamic column count only on lg+ screens, let Tailwind handle smaller breakpoints
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => {
      el.style.gridTemplateColumns = mq.matches ? `repeat(${cols}, 1fr)` : '';
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [cols]);

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      {sorted.map(([clusterKey, stats], rankIdx) => {
        const c = parseInt(clusterKey);
        // Use AI-generated category when available, otherwise fall back to rank-based label
        const segment = categories && categories[c]
          ? getSegmentFromCategory(categories[c])
          : getSegmentLabel(rankIdx, sorted.length);
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
