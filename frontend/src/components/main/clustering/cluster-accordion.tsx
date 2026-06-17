import { useState } from 'react';
import { ChevronDown, Tag } from 'lucide-react';
import { cn, SEGMENT_LABELS } from '@/lib/utils';

interface ClusterAccordionProps {
  clusterIndex: number;
  color: string;
  productCount: number;
  category?: string;
  insight: string;
}

/** Returns a segment style matching SEGMENT_LABELS for consistent colors across components. */
function getCategorySegment(category: string) {
  const upper = category.toUpperCase();
  const match = SEGMENT_LABELS.find(s => upper.includes(s.label.toUpperCase()));
  if (match) return match;
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

export function ClusterAccordion({ clusterIndex, color, productCount, category, insight }: ClusterAccordionProps) {
  const [open, setOpen] = useState(clusterIndex === 0);
  const [hovered, setHovered] = useState(false);

  const catSegment = category ? getCategorySegment(category) : null;

  // Split insight into sentences for cleaner display
  const sentences = insight
    ? insight
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(Boolean)
    : [];

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
        <div className="flex items-center gap-3 flex-wrap">
          <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-sm font-semibold text-neutral-800">Klaster {clusterIndex + 1}</span>
          <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">{productCount} produk</span>
          {category && catSegment && (
            <span
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: catSegment.bg,
                color: catSegment.color,
                borderColor: catSegment.color + '30',
              }}>
              <Tag className="size-2.5" />
              {category}
            </span>
          )}
        </div>
        <ChevronDown className={cn('size-4 text-neutral-400 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 bg-neutral-50/30 border-t border-neutral-100">
          {sentences.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {sentences.map((sentence, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-neutral-600 leading-relaxed">
                  <span className="shrink-0 mt-1.5 size-1.5 rounded-full" style={{ backgroundColor: color, opacity: 0.5 }} />
                  <span>{sentence}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-400 italic">Insight tidak tersedia.</p>
          )}
        </div>
      )}
    </div>
  );
}
