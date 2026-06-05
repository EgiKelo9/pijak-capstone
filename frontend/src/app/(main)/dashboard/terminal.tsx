// components/terminal-log.tsx
'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, ChevronRight, Loader2, X } from 'lucide-react';
import * as React from 'react';

// Tipe Data Payload dari Backend
export interface TerminalStep {
  stepId: string;
  text: string;
  status: 'loading' | 'success' | 'error' | 'info';
}

interface TerminalLogProps {
  logs: TerminalStep[];
}

export function TerminalLog({ logs }: TerminalLogProps) {
  // Fitur wajib terminal: Auto-scroll ke bawah
  const endOfLogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endOfLogRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    // 1. Tambahkan 'relative' di container utama agar overlay absolut terkurung di sini
    <div className="relative flex h-full w-full flex-col bg-white font-mono text-sm min-h-0">

      {/* 2. Floating Gradient Overlay (pointer-events-none agar tidak memblokir scroll/klik) */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-16 bg-gradient-to-b from-white to-transparent" />
      <div className="pointer-events-none absolute left-0 right-0 bot-0 z-10 h-16 bg-gradient-to-b from-white to-transparent" />

      {/* Body Terminal */}
      <ScrollArea className="flex-1 min-h-0 w-full p-4">
        {/* Tambahkan sedikit padding-top (pt-4) agar teks awal tidak tertutup pekatnya gradient */}
        <div className="flex flex-col gap-2.5 pt-4">

          <div className="mb-2 flex flex-col gap-1 text-neutral-500">
            <p>Last login: {new Date().toLocaleString()} on ttys00</p>
            <p className="text-[#2BBAEE]">beez-engine:~ $ initializing_pipeline...</p>
          </div>
          
          {/* Render dinamis berdasarkan status */}
          {logs.map((log, index) => {
              
            // 1. Status LOADING (Spinner berputar)
            if (log.status === 'loading') {
              return (
                <div key={log.stepId} className="flex items-start gap-3 text-neutral-700">
                  <Loader2 className="mt-0.5 size-4 animate-spin text-[#2BBAEE] shrink-0" />
                  <span className="animate-pulse">{log.text}</span>
                </div>
              );
            }
            
            // 2. Status SUCCESS (Centang hijau terang)
            if (log.status === 'success') {
              return (
                <div key={`${log.stepId}-success`} className="flex items-start gap-3 text-emerald-600">
                  <Check className="mt-0.5 size-4 shrink-0" strokeWidth={3} />
                  <span>{log.text}</span>
                </div>
              );
            }
            
            // 3. Status ERROR (Silang merah)
            if (log.status === 'error') {
              return (
                <div key={`${log.stepId}-error`} className="flex items-start gap-3 rounded-md bg-rose-500/10 p-2 text-rose-500">
                  <X className="mt-0.5 size-4 shrink-0" strokeWidth={3} />
                  <span className="font-medium">{log.text}</span>
                </div>
              );
            }

            // 4. Status INFO (Teks biasa dengan chevron)
            return (
              <div key={`info-${index}`} className="flex items-start gap-3 text-neutral-600">
                <ChevronRight className="mt-0.5 size-4 shrink-0 opacity-50" />
                <span>{log.text}</span>
              </div>
            );
          })}

          {/* Anchor untuk auto-scroll */}
          <div ref={endOfLogRef} className="h-1 shrink-0" />
        </div>
      </ScrollArea>
    </div>
  );
}