// components/ui/analysis-card.tsx
'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

export type StatusType = 'menunggu' | 'berhasil' | 'gagal' | 'kosong';

interface AnalysisCardProps {
  title: string;
  status: StatusType;
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

const statusConfig = {
  menunggu: {
    bg: 'bg-amber-100/50',
    text: 'text-amber-600',
    dotOuter: 'bg-amber-600/30',
    dotInner: 'bg-amber-600/60',
    label: 'Menunggu',
  },
  berhasil: {
    bg: 'bg-emerald-100/50',
    text: 'text-emerald-600',
    dotOuter: 'bg-emerald-600/30',
    dotInner: 'bg-emerald-600/60',
    label: 'Berhasil',
  },
  gagal: {
    bg: 'bg-rose-100/50',
    text: 'text-rose-600',
    dotOuter: 'bg-rose-600/30',
    dotInner: 'bg-rose-600/60',
    label: 'Gagal',
  },
  kosong: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-500',
    dotOuter: 'bg-neutral-400/30',
    dotInner: 'bg-neutral-400/60',
    label: 'Kosong',
  },
};

export function AnalysisCard({
  title,
  status,
  children,
  className,
  innerClassName,
}: AnalysisCardProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        // Key fix: flex-col + min-h-0 so the card can live inside a flex parent
        // without expanding unboundedly. overflow-hidden clips the rounded corners.
        'flex flex-col min-h-0 rounded-3xl border border-neutral-800/20 bg-neutral-900/3 pt-2 overflow-hidden',
        className
      )}
    >
      {/* Header — fixed height, never shrinks */}
      <div className="flex shrink-0 items-center justify-between px-4 pb-2">
        <h3 className="text-base font-semibold text-neutral-800 tracking-tight truncate pr-2">
          {title}
        </h3>

        {/* Status Badge */}
        <div
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-0.5',
            config.bg
          )}
        >
          <div
            className={cn(
              'relative flex size-[11px] shrink-0 items-center justify-center rounded-full',
              config.dotOuter
            )}
          >
            <div className={cn('size-[7px] rounded-full', config.dotInner)} />
          </div>
          <span className={cn('font-mono text-[13px] font-medium leading-tight', config.text)}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Inner content — takes remaining vertical space, scrolls if needed */}
      <div
        className={cn(
          // flex-1 + min-h-0 = grows to fill available space without overflowing the card
          // overflow-auto so content that genuinely can't fit scrolls rather than clips
          'flex flex-col flex-1 min-h-0 w-full bg-white',
          'rounded-b-3xl rounded-t-[20px]',
          'shadow-[0px_-5px_18px_-3px_rgba(0,0,0,0.05)]',
          // p-4 is default; consumers can override via innerClassName
          'p-4',
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}