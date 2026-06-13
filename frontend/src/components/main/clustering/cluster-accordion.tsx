import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ClusterAccordion({ clusterIndex, color, productCount, insight }: {
  clusterIndex: number; color: string; productCount: number; insight: string;
}) {
  const [open, setOpen] = useState(clusterIndex === 0);
  const [hovered, setHovered] = useState(false);
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
