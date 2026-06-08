'use client';

import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';

export type StatusType = 'menunggu' | 'berhasil' | 'gagal' | 'kosong' | 'none';

interface AnalysisCardProps {
  title: string;
  status?: StatusType;
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  /** When true the header becomes a toggle that collapses/expands the body */
  collapsible?: boolean;
  /** Initial open state when collapsible. Default: true */
  defaultOpen?: boolean;
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
  status = 'none',
  children,
  className,
  innerClassName,
  collapsible = false,
  defaultOpen = true,
}: AnalysisCardProps) {
  const config = status !== 'none' ? statusConfig[status] : null;
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  // 'auto' while expanded (allows natural growth); px number while animating
  const [shellHeight, setShellHeight] = React.useState<number | 'auto'>(
    defaultOpen ? 'auto' : 0
  );
  // Tracks whether we are mid-transition to suppress redundant onTransitionEnd calls
  const animating = React.useRef(false);
  const shellRef = React.useRef<HTMLDivElement>(null);

  // ── Measurement ref ────────────────────────────────────────────────────────
  // This div lives OUTSIDE the animated shell so it is never constrained by
  // the shell's height. It renders the children invisibly at their natural
  // size, giving us a reliable scrollHeight even when innerClassName has
  // max-h-*, overflow-hidden, flex-1, or any other constraining class.
  const measureRef = React.useRef<HTMLDivElement>(null);
  const [naturalHeight, setNaturalHeight] = React.useState(0);

  React.useLayoutEffect(() => {
    if (!collapsible || !measureRef.current) return;
    const el = measureRef.current;
    const update = () => setNaturalHeight(el.scrollHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [collapsible, children]);

  // ── Toggle ─────────────────────────────────────────────────────────────────
  const toggle = () => {
    if (!collapsible || animating.current) return;
    animating.current = true;

    if (isOpen) {
      // Collapse: freeze to px first so the browser has a from-value, then
      // set to 0 in the next paint.
      // Use the actual rendered height if constrained by flexbox, falling back to naturalHeight
      const currentHeight = shellRef.current?.getBoundingClientRect().height || naturalHeight;
      setShellHeight(currentHeight);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setIsOpen(false);
          setShellHeight(0);
        })
      );
    } else {
      // Expand: go from 0 → naturalHeight px, then 'auto' when done
      setIsOpen(true);
      setShellHeight(naturalHeight);
    }
  };

  const handleTransitionEnd = () => {
    animating.current = false;
    if (isOpen) setShellHeight('auto'); // restore natural growth once expanded
  };

  // ── Shared inner-div classes ───────────────────────────────────────────────
  const innerCls = cn(
    'w-full bg-white',
    'rounded-b-3xl rounded-t-[20px]',
    'shadow-[0px_-5px_18px_-3px_rgba(0,0,0,0.05)]',
    'p-4',
    innerClassName
  );

  return (
    <div
      className={cn(
        'flex flex-col min-h-0 rounded-3xl border border-neutral-800/20 bg-neutral-900/3 pt-2 overflow-hidden',
        className
      )}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex shrink-0 items-center justify-between px-4 pb-2',
          collapsible && 'cursor-pointer select-none'
        )}
        onClick={toggle}
        role={collapsible ? 'button' : undefined}
        aria-expanded={collapsible ? isOpen : undefined}
      >
        <h3 className="text-base font-semibold text-neutral-800 tracking-tight truncate pr-2">
          {title}
        </h3>

        <div className="flex shrink-0 items-center gap-2">
          {/* Status badge */}
          {config && (
            <div className={cn('flex items-center gap-1.5 rounded-lg px-2 py-0.5', config.bg)}>
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
          )}

          {collapsible && (
            <ChevronDown
              className={cn(
                'size-4 text-neutral-400 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
                isOpen ? 'rotate-0' : '-rotate-90'
              )}
            />
          )}
        </div>
      </div>

      {/* ── Invisible measurement node (collapsible only) ────────────────────
          Rendered at natural size, outside the animated shell, with NO
          constraining styles. ResizeObserver keeps naturalHeight in sync.   */}
      {collapsible && (
        <div
          ref={measureRef}
          aria-hidden
          className={cn('flex flex-col min-h-0', innerCls, 'absolute invisible pointer-events-none')}
          // Strip any max-h-* the caller puts in innerClassName so we always
          // measure the true content height.
          style={{ maxHeight: 'none', height: 'auto', position: 'absolute', visibility: 'hidden' }}
        >
          {children}
        </div>
      )}

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      {collapsible ? (
        <div
          ref={shellRef}
          className={cn("flex flex-col min-h-0", shellHeight === 'auto' && "flex-1")}
          style={{
            height: shellHeight === 'auto' ? 'auto' : `${shellHeight}px`,
            overflow: 'hidden',
            transition: 'height 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          <div className={cn('flex flex-col flex-1 min-h-0', innerCls)}>{children}</div>
        </div>
      ) : (
        /* Non-collapsible: keep original flex-1 grow behaviour */
        <div className={cn('flex flex-col flex-1 min-h-0', innerCls)}>{children}</div>
      )}
    </div>
  );
}