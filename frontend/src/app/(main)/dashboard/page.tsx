'use client';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    Calendar as CalendarIcon,
    ChevronDown,
    FileUp,
    Flame,
    Presentation
} from 'lucide-react';
import * as React from 'react';
import { DateRange } from 'react-day-picker';

import { Tabs, TabsList, TabsTrigger } from '@/components/animate-ui/components/animate/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/animate-ui/primitives/radix/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type AnalysisMode = 'forecasting' | 'clustering' | 'both';

interface AnalysisConfig {
  mode: AnalysisMode;
  dateRange: DateRange | undefined;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalysisEmptyState() {
  const [date, setDate] = React.useState<DateRange | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [mode, setMode] = React.useState<AnalysisMode>('both');

  // Close calendar only once BOTH ends of the range are picked.
  // We handle this inside onSelect rather than useEffect so it's synchronous
  // and doesn't cause a double-render flicker.
  const handleDateSelect = (range: DateRange | undefined) => {
    setDate(range);
    if (range?.from && range?.to) {
      // Small delay so the user can see the end-date highlight before the
      // popover closes — feels less abrupt.
      setTimeout(() => setIsCalendarOpen(false), 120);
    }
  };

  // Clear date selection
  const handleClearDate = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent the popover trigger from re-opening
    setDate(undefined);
  };

  // The config object that would be passed to an analysis runner / API call
  const analysisConfig: AnalysisConfig = { mode, dateRange: date };

  // Upload handler — receives the current config so it can act on it
  const handleUpload = () => {
    console.log('[Upload CSV] Current config:', analysisConfig);
    // TODO: open file picker, then pass `analysisConfig` alongside the file
  };

  const handleRunAnalysis = () => {
    if (!date?.from || !date?.to) {
      console.warn('[Run Analysis] No date range selected');
      return;
    }
    console.log('[Run Analysis] Config:', analysisConfig);
    // TODO: trigger analysis API call with `analysisConfig`
  };

  const modeLabel =
    mode === 'both' ? 'Forecasting & Clustering'
    : mode === 'forecasting' ? 'Forecasting'
    : 'Clustering';

  const isReady = !!date?.from && !!date?.to;

  return (
    <div className="flex w-full flex-col items-start gap-3 pb-4">

      {/* ── HEADER CONTROLS ── */}
      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">

        {/* Tab Switch */}
        <div className="w-full md:w-[360px]">
          <Tabs value={mode} onValueChange={(v) => setMode(v as AnalysisMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-xl bg-[#F3F3F3] p-1 h-11 md:h-12">
              <TabsTrigger
                value="forecasting"
                className="rounded-lg text-sm font-medium data-[state=active]:bg-[#2BBAEE] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
              >
                Forecasting
              </TabsTrigger>
              <TabsTrigger
                value="clustering"
                className="rounded-lg text-sm font-medium data-[state=active]:bg-[#2BBAEE] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
              >
                Clustering
              </TabsTrigger>
              <TabsTrigger
                value="both"
                className="rounded-lg text-sm font-medium flex items-center gap-1.5 data-[state=active]:bg-[#2BBAEE] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
              >
                Both <Flame className="size-3.5" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Date Range Picker */}
        <div className="w-full md:w-[380px]">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-between rounded-xl border-[#272727]/20 bg-gradient-to-b from-white to-[#2BBAEE]/10 px-4 h-11 md:h-12 text-left text-sm font-medium hover:bg-[#2BBAEE]/5 transition-all',
                  !date && 'text-[#272727]/60'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CalendarIcon className="size-4 text-black/50 shrink-0" />
                  <span className="truncate">
                    {date?.from ? (
                      date.to ? (
                        `${format(date.from, 'dd LLL y', { locale: id })} — ${format(date.to, 'dd LLL y', { locale: id })}`
                      ) : (
                        format(date.from, 'dd LLL y', { locale: id })
                      )
                    ) : (
                      'Pilih Rentang Tanggal'
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Clear button — only shown when a date is set */}
                  {date && (
                    <span
                      role="button"
                      onClick={handleClearDate}
                      className="flex size-5 items-center justify-center rounded-full text-black/30 hover:text-black/70 hover:bg-black/10 transition-colors text-xs leading-none select-none"
                      aria-label="Hapus tanggal"
                    >
                      ✕
                    </span>
                  )}
                  <ChevronDown className={cn('size-4 text-black/40 transition-transform duration-200', isCalendarOpen && 'rotate-180')} />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-2 bg-white border border-black/10 rounded-xl shadow-xl z-50"
              align="end"
              sideOffset={6}
            >
              <Calendar
                mode="range"
                defaultMonth={date?.from ?? new Date()}
                selected={date}
                onSelect={handleDateSelect}
                numberOfMonths={2}
                locale={id}
                // Disable future dates if desired — remove if not needed
                // disabled={{ after: new Date() }}
              />
              {/* Footer row inside the popover */}
              <div className="flex items-center justify-between border-t border-black/5 pt-2 px-1 mt-1">
                <span className="text-xs text-black/40">
                  {date?.from && date?.to
                    ? `${Math.round((date.to.getTime() - date.from.getTime()) / 86_400_000)} hari dipilih`
                    : 'Pilih tanggal mulai & akhir'}
                </span>
                {date && (
                  <button
                    onClick={() => { setDate(undefined); }}
                    className="text-xs text-[#2BBAEE] hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="w-full">
        <EmptyStateView
          modeLabel={modeLabel}
          isReady={isReady}
          onUpload={handleUpload}
          onRunAnalysis={handleRunAnalysis}
        />
      </div>

    </div>
  );
}

// ─── Empty State View ─────────────────────────────────────────────────────────

interface EmptyStateViewProps {
  modeLabel: string;
  isReady: boolean;
  onUpload: () => void;
  onRunAnalysis: () => void;
}

function EmptyStateView({ modeLabel, isReady, onUpload, onRunAnalysis }: EmptyStateViewProps) {
  const steps = [
    'Upload a CSV or Excel file containing your historical sales or inventory metrics.',
    'Select your analysis mode (Forecasting, Clustering, or both) and set the date range in the controls above.',
    "Hit 'Mulai Analisis' in the top-right corner to generate a full suite of interactive visualizations.",
  ];

  return (
    <div className="flex w-full min-h-[58vh] md:min-h-[72vh] flex-col items-center justify-center rounded-2xl border border-[#272727]/20 bg-white p-6 md:p-8">

      <div className="flex max-w-xl flex-col items-center gap-5 text-center">

        {/* Hero Icon */}
        <div className="flex size-20 md:size-24 items-center justify-center rounded-2xl bg-gradient-to-b from-[#2BBAEE]/20 to-transparent shadow-inner">
          <Presentation className="size-10 md:size-12 text-[#2BBAEE]" />
        </div>

        {/* Title block */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#272727]">
            Ready for{' '}
            <span className="text-[#2BBAEE]">{modeLabel}</span>{' '}
            insights?
          </h2>
          <p className="text-sm md:text-base text-[#272727]/50 leading-relaxed">
            Upload your data and configure the analysis above to see results here.
            Our engine will automatically detect patterns and trends.
          </p>
        </div>

        {/* 3-Step Instruction Box */}
        <div className="flex w-full flex-col gap-3 rounded-xl border border-slate-100 bg-gradient-to-b from-[#2BBAEE]/8 to-transparent p-5 md:p-6 text-left">
          {steps.map((text, idx) => (
            <div key={idx} className="flex items-start gap-3.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2BBAEE]/30 mt-0.5">
                <span className="text-sm font-bold text-[#1a9fd4]">{idx + 1}</span>
              </div>
              <p className="text-sm md:text-base font-medium text-slate-600 leading-snug">
                {text}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          {/* Upload CSV */}
          <button
            onClick={onUpload}
            className="flex items-center gap-2 rounded-lg border border-[#272727]/20 bg-gradient-to-b from-[#2BBAEE]/20 to-transparent px-5 py-2.5 text-sm font-medium text-[#272727] transition-all hover:bg-[#2BBAEE]/10 active:scale-95"
          >
            <FileUp className="size-4 shrink-0" />
            Unggah CSV
          </button>

          {/* Run Analysis — enabled only when date range is set */}
          <button
            onClick={onRunAnalysis}
            disabled={!isReady}
            title={!isReady ? 'Pilih rentang tanggal terlebih dahulu' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-all active:scale-95',
              isReady
                ? 'border-[#272727]/10 bg-gradient-to-b from-[#90FDF2] to-[#2BBAEE] text-[#272727] hover:opacity-90 shadow-sm'
                : 'border-[#272727]/10 bg-[#F3F3F3] text-[#272727]/30 cursor-not-allowed'
            )}
          >
            Mulai Analisis
          </button>
        </div>

        {/* Subtle ready-state hint */}
        {!isReady && (
          <p className="text-xs text-[#272727]/30 -mt-2">
            Pilih rentang tanggal untuk mengaktifkan analisis
          </p>
        )}

      </div>
    </div>
  );
}