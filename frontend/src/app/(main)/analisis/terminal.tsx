'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, ChevronDown, ChevronRight, Loader2, X } from 'lucide-react';
import * as React from 'react';

export interface TerminalStep {
  stepId: string;
  text: string;
  status: 'loading' | 'success' | 'error' | 'info';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

interface TerminalLogProps {
  logs: TerminalStep[];
}

// CSS mask-image approach: the fade is a paint effect ON the scroll container itself,
// so it cannot be clipped by any parent's overflow-hidden. Works regardless of how
// many wrapping cards/divs have overflow-hidden set.
const MASK_STYLE: React.CSSProperties = {
  maskImage:
    'linear-gradient(to bottom, transparent 0%, black 10%, black 82%, transparent 100%)',
  WebkitMaskImage:
    'linear-gradient(to bottom, transparent 0%, black 10%, black 82%, transparent 100%)',
};

function InfoLogItem({ log }: { log: TerminalStep }) {
  const [isExpanded, setIsExpanded] = React.useState(!log.defaultCollapsed);

  // If it's not set as collapsible, return the standard text view
  if (!log.collapsible) {
    return (
      <div className="flex items-start gap-3 text-neutral-500">
        <ChevronRight className="mt-0.5 size-4 shrink-0 opacity-40" />
        <span className="whitespace-pre-wrap break-words">{log.text}</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-start gap-3 text-neutral-500 cursor-pointer hover:text-neutral-700 transition-colors group select-none"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {isExpanded ? (
        <ChevronDown className="mt-0.5 size-4 shrink-0 opacity-60 text-[#2BBAEE]" />
      ) : (
        <ChevronRight className="mt-0.5 size-4 shrink-0 opacity-60" />
      )}
      <div className="flex-1 min-w-0">
        <span className={`whitespace-pre-wrap break-words ${!isExpanded ? 'line-clamp-2' : ''}`}>
          {log.text}
        </span>
        {!isExpanded && (
          <span className="text-[10px] text-[#2BBAEE] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity block">
            Klik untuk memperluas
          </span>
        )}
      </div>
    </div>
  );
}

export function TerminalLog({ logs }: TerminalLogProps) {
  const endOfLogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (endOfLogRef.current) {
      // Find the specific Radix UI scroll viewport to prevent the entire page from jumping
      const viewport = endOfLogRef.current.closest('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth',
        });
      } else {
        // Fallback just in case
        endOfLogRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [logs]);

  return (
    <div className="flex h-full w-full flex-col font-mono text-sm min-h-0 bg-white">
      {/*
        The mask is applied directly to ScrollArea so it paints the fade
        as part of the element's own rendering — completely unaffected by
        any ancestor's overflow: hidden.
      */}
      <ScrollArea
        className="flex-1 min-h-0 w-full"
        style={MASK_STYLE}
      >
        <div className="flex flex-col gap-2.5 px-4 pt-6 pb-10">

          {/* Session header */}
          <div className="mb-2 flex flex-col gap-1 text-neutral-400 text-xs">
            <p>Last login: {new Date().toLocaleString()} on ttys000</p>
            <p>
              <span className="text-[#2BBAEE]">beez-engine</span>
              <span className="text-neutral-400">:~ $ </span>
              <span className="text-neutral-600">initializing_pipeline</span>
              <span className="text-[#2BBAEE] animate-pulse">▋</span>
            </p>
          </div>

          <div className="border-t border-dashed border-neutral-200 mb-1" />

          {/* Dynamic log entries */}
          {logs.map((log, index) => {

            // 1. LOADING
            if (log.status === 'loading') {
              return (
                <div
                  key={log.stepId}
                  className="flex items-start gap-3 text-neutral-600"
                >
                  <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-[#2BBAEE]" />
                  <span className="animate-pulse">{log.text}</span>
                </div>
              );
            }

            // 2. SUCCESS
            if (log.status === 'success') {
              return (
                <div
                  key={`${log.stepId}-success`}
                  className="flex items-start gap-3 text-emerald-600"
                >
                  <Check className="mt-0.5 size-4 shrink-0" strokeWidth={3} />
                  <span>{log.text}</span>
                </div>
              );
            }

            // 3. ERROR
            if (log.status === 'error') {
              return (
                <div
                  key={`${log.stepId}-error`}
                  className="flex items-start gap-3 rounded-md bg-rose-500/10 px-2 py-1.5 text-rose-500"
                >
                  <X className="mt-0.5 size-4 shrink-0" strokeWidth={3} />
                  <span className="font-medium">{log.text}</span>
                </div>
              );
            }

            // 4. INFO
            return <InfoLogItem key={log.stepId || `info-${index}`} log={log} />;
          })}

          {/* Auto-scroll anchor */}
          <div ref={endOfLogRef} className="h-px w-full shrink-0" />
        </div>
      </ScrollArea>
    </div>
  );
}