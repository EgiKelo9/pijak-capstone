import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { CLUSTER_COLORS, formatNumber } from '@/lib/utils';
import { ClusteringResultData } from '@/types';

type TooltipState = { x: number; y: number; data: Record<string, any> } | null;

function ProductRow({
  row,
  barColor,
  max,
  mainFitur,
  onHover,
  onLeave,
}: {
  row: Record<string, any>;
  barColor: string;
  max: number;
  mainFitur: string;
  onHover: (e: React.MouseEvent, row: Record<string, any>) => void;
  onLeave: () => void;
}) {
  const [hov, setHov] = useState(false);
  const val = Number(row[mainFitur]) || 0;
  return (
    <div
      onMouseEnter={(e) => { setHov(true); onHover(e, row); }}
      onMouseLeave={() => { setHov(false); onLeave(); }}
      onMouseMove={(e) => onHover(e, row)}
      className="flex flex-col gap-1 rounded-lg px-2 py-1.5 cursor-pointer"
      style={{
        backgroundColor: hov ? 'rgba(43,186,238,0.06)' : 'transparent',
        transition: 'background 0.15s ease, transform 0.15s ease',
        transform: hov ? 'translateX(2px)' : 'translateX(0)',
      }}>
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
}

export function TopBottomProducts({ result, colFitur }: { result: ClusteringResultData; colFitur: string[] }) {
  const [activeCluster, setActiveCluster] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mainFitur = colFitur[0] || '';

  // Clear tooltip when data/cluster changes
  useEffect(() => {
    setTooltip(null);
  }, [result, activeCluster, colFitur]);

  // Robust: dismiss tooltip when cursor leaves the container via document-level listener
  useEffect(() => {
    if (!tooltip) return;

    const handleDocMouseMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // 4px margin to avoid flickering at edges
      if (
        e.clientX < rect.left - 4 ||
        e.clientX > rect.right + 4 ||
        e.clientY < rect.top - 4 ||
        e.clientY > rect.bottom + 4
      ) {
        setTooltip(null);
      }
    };

    document.addEventListener('mousemove', handleDocMouseMove);
    return () => document.removeEventListener('mousemove', handleDocMouseMove);
  }, [tooltip]);

  const uniqueClusters = useMemo(() => 
    [...new Set(result.cluster_data.map(d => d.cluster))].sort((a, b) => a - b),
    [result.cluster_data]
  );

  const clusterData = useMemo(() => 
    result.cluster_data.filter(d => d.cluster === activeCluster),
    [result.cluster_data, activeCluster]
  );

  const sorted = useMemo(() => 
    [...clusterData].sort((a, b) => (Number(b[mainFitur]) || 0) - (Number(a[mainFitur]) || 0)),
    [clusterData, mainFitur]
  );

  const top5 = useMemo(() => sorted.slice(0, 5), [sorted]);
  const bottom5 = useMemo(() => sorted.slice(-5).reverse(), [sorted]);

  const handleHover = useCallback((e: React.MouseEvent, row: Record<string, any>) => {
    setTooltip({ x: e.clientX, y: e.clientY, data: row });
  }, []);

  const handleLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col gap-3 relative" onMouseLeave={handleLeave}>
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
            <ProductRow key={row.product ?? i} row={row} barColor={CLUSTER_COLORS[activeCluster % CLUSTER_COLORS.length]}
              max={Number(top5[0]?.[mainFitur]) || 1} mainFitur={mainFitur} onHover={handleHover} onLeave={handleLeave} />
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="size-4 text-rose-500" />
            <span className="text-xs font-semibold text-neutral-600">Bottom 5 Produk</span>
          </div>
          {bottom5.map((row, i) => (
            <ProductRow key={row.product ?? i} row={row} barColor="#fca5a5"
              max={Number(top5[0]?.[mainFitur]) || 1} mainFitur={mainFitur} onHover={handleHover} onLeave={handleLeave} />
          ))}
        </div>
      </div>
    </div>
  );
}
