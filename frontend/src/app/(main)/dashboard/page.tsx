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

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/animate/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type AnalysisMode = 'forecasting' | 'clustering' | 'both';

interface AnalysisConfig {
  mode: AnalysisMode;
  dateRange: DateRange | undefined;
}

// --- Sub-components for better debugging and separation of concerns ---
function DashboardHeader({
  mode,
  setMode,
  date,
  setDate,
  isOpen,
  setIsOpen
}: {
  mode: AnalysisMode;
  setMode: (mode: AnalysisMode) => void;
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const handleDateSelect = (range: DateRange | undefined) => {
    console.debug('[DashboardHeader] Date selected:', range);
    setDate(range);
    
    // Fix: Prevent auto-closing on the first click if the start and end dates are the same.
    // Wait for a distinct range selection before auto-closing.
    if (range?.from && range?.to) {
      const isSameDay = range.from.getTime() === range.to.getTime();
      if (!isSameDay) {
        setTimeout(() => setIsOpen(false), 150);
      }
    }
  };

  const handleClearDate = (e: React.MouseEvent) => {
    console.debug('[DashboardHeader] Clearing date');
    e.stopPropagation();
    e.preventDefault();
    setDate(undefined);
  };

  const handleModeChange = (v: string) => {
    console.debug('[DashboardHeader] Mode changed:', v);
    setMode(v as AnalysisMode);
  }

  return (
    <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {/* Tab Switch */}
      <div className="w-full md:w-[360px]">
        <Tabs
          value={mode}
          onValueChange={handleModeChange}
          className="w-full !gap-0"
        >
          <TabsList
            className={cn(
              'relative flex w-full flex-row items-center h-11 md:h-12 p-1 gap-1 rounded-xl px-2',
              'bg-neutral-100', // Refactored from !bg-[#F3F3F3]
              '[&>[data-slot=highlight]]:!rounded-[10px]',
              '[&>[data-slot=highlight]]:bg-[#2BBAEE]',
              '[&>[data-slot=highlight]]:shadow-sm',
            )}
          >
            <TabsTrigger
              value="forecasting"
              className="relative z-10 flex-1 inline-flex h-full items-center justify-center rounded-[10px] text-sm font-medium transition-colors duration-300 ease-out data-[state=active]:text-primary data-[state=inactive]:text-neutral-800/60"
            >
              Forecasting
            </TabsTrigger>
            <TabsTrigger
              value="clustering"
              className="relative z-10 flex-1 inline-flex h-full items-center justify-center rounded-[10px] text-sm font-medium transition-colors duration-300 ease-out data-[state=active]:text-primary data-[state=inactive]:text-neutral-800/60"
            >
              Clustering
            </TabsTrigger>
            <TabsTrigger
              value="both"
              className="relative z-10 flex-1 inline-flex h-full items-center justify-center gap-1.5 rounded-[10px] text-sm font-medium transition-colors duration-300 ease-out data-[state=active]:text-primary data-[state=inactive]:text-neutral-800/60"
            >
              Both <Flame className="size-3.5" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Date Range Picker */}
      <div className="w-full md:w-[380px]">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-between rounded-xl border-neutral-800/20 bg-gradient-to-b from-white to-[#2BBAEE]/10 px-4 h-11 md:h-12 text-left text-sm font-medium hover:bg-[#2BBAEE]/5 transition-all',
                !date && 'text-neutral-800/60',
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <CalendarIcon className="size-4 text-black/50 shrink-0" />
                <span className="truncate">
                  {date?.from ? (
                    date.to
                      ? `${format(date.from, 'dd LLL y', { locale: id })} — ${format(date.to, 'dd LLL y', { locale: id })}`
                      : format(date.from, 'dd LLL y', { locale: id })
                  ) : (
                    'Pilih Rentang Tanggal'
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
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
                <ChevronDown className={cn(
                  'size-4 text-black/40 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )} />
              </div>
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            sideOffset={6}
            className={cn(
              'w-[95vw] sm:w-auto p-2 bg-white border border-black/10 rounded-xl shadow-xl z-50',
              'overflow-y-auto max-h-[85vh]',
              '!animate-none',
              'transition-[opacity,transform] duration-200 ease-out',
              'data-[state=open]:opacity-100 data-[state=open]:translate-y-0',
              'data-[state=closed]:opacity-0 data-[state=closed]:-translate-y-1',
              'will-change-transform',
            )}
          >
            <Calendar
              mode="range"
              defaultMonth={date?.from ?? new Date()}
              selected={date}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              locale={id}
            />
            <div className="flex items-center justify-between border-t border-black/5 pt-3 px-2 mt-2">
              <span className="text-xs text-black/40">
                {date?.from && date?.to
                  ? `${Math.round((date.to.getTime() - date.from.getTime()) / 86_400_000)} hari dipilih`
                  : 'Pilih tanggal mulai & akhir'}
              </span>
              <div className="flex items-center gap-3">
                {date && (
                  <button
                    onClick={() => {
                      console.debug('[DashboardHeader] Resetting calendar selection');
                      setDate(undefined);
                    }}
                    className="text-xs font-medium text-[#2BBAEE] hover:underline transition-colors"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-medium text-black/60 hover:text-black transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export default function AnalysisEmptyState() {
  const [date, setDate] = React.useState<DateRange | undefined>();
  const [isOpen, setIsOpen] = React.useState(false);
  const [mode, setMode] = React.useState<AnalysisMode>('both');

  // Memoize the config for stable references if passed to useEffects later
  const analysisConfig = React.useMemo<AnalysisConfig>(() => ({
    mode,
    dateRange: date
  }), [mode, date]);

  const handleUpload = React.useCallback(() => {
    console.info('=== [DUMMY PAYLOAD] UNGGAH CSV ===');
    console.info('Current Config Context:', analysisConfig);
    console.info('-> Ready to trigger file upload dialog or API...');
    console.info('========================================');
    // Add your upload logic here
  }, [analysisConfig]);

  const handleRunAnalysis = React.useCallback(() => {
    if (!analysisConfig.dateRange?.from || !analysisConfig.dateRange?.to) {
      console.warn('[Dashboard] Run Analysis aborted: No valid date range selected');
      return;
    }

    // EXTRACT AND FORMAT VALUES
    const payload = {
      mode: analysisConfig.mode,
      startDate: format(analysisConfig.dateRange.from, 'yyyy-MM-dd'),
      endDate: format(analysisConfig.dateRange.to, 'yyyy-MM-dd'),
      timestamp: new Date().toISOString()
    };

    console.info('=== [DUMMY PAYLOAD] MULAI ANALISIS ===');
    console.info('These are the extracted values ready to be passed to your backend/API:');
    console.table(payload);
    console.info('Raw Analysis Config:', analysisConfig);
    console.info('========================================');

    // Add your analysis execution logic here
  }, [analysisConfig]);

  const modeLabel = React.useMemo(() => {
    switch (mode) {
      case 'forecasting': return 'Forecasting';
      case 'clustering': return 'Clustering';
      case 'both':
      default: return 'Forecasting & Clustering';
    }
  }, [mode]);

  const isReady = !!date?.from && !!date?.to;

  // Centralized state monitor to track behavior updates in real-time
  React.useEffect(() => {
    console.debug('[Dashboard] State updated:', { isReady, mode, date });
  }, [isReady, mode, date]);

  return (
    <div className="flex h-full flex-1 flex-col gap-3">
      <DashboardHeader
        mode={mode}
        setMode={setMode}
        date={date}
        setDate={setDate}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />

      <div className="flex h-full flex-1 flex-col min-h-0">
        <EmptyStateView
          modeLabel={modeLabel}
          isReady={isReady}
          dateRange={date}
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
  dateRange: DateRange | undefined;
  onUpload: () => void;
  onRunAnalysis: () => void;
}

function EmptyStateView({ modeLabel, isReady, dateRange, onUpload, onRunAnalysis }: EmptyStateViewProps) {
  const steps = [
    'Upload a CSV or Excel file containing your historical sales or inventory metrics.',
    'Select your analysis mode (Forecasting, Clustering, or both) and set the date range in the controls above.',
    "Hit 'Mulai Analisis' in the top-right corner to generate a full suite of interactive visualizations.",
  ];

  return (
    <div className="flex h-full flex-1 w-full flex-col items-center justify-center rounded-2xl border border-neutral-800/20 bg-white p-6 md:p-8">
      <div className="flex w-full max-w-xl flex-col items-center gap-6 text-center">

        {/* Hero Icon */}
        <div className="relative flex size-20 md:size-24 items-center justify-center rounded-2xl bg-gradient-to-b from-[#2BBAEE]/20 to-transparent shadow-inner">
          <Presentation className="relative size-10 md:size-12 text-[#2BBAEE]" />
        </div>

        {/* Title */}
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-800">
            Ready for{' '}
            <span className="text-[#2BBAEE]">{modeLabel}</span>{' '}
            insights?
          </h2>
          <p className="text-sm md:text-base text-neutral-800/50 leading-relaxed max-w-md">
            Upload your data and configure the analysis above.
            Our engine will automatically detect patterns and trends.
          </p>
        </div>

        {/* Steps */}
        <div className="flex w-full flex-col gap-3 rounded-xl border border-[#2BBAEE]/15 bg-gradient-to-b from-[#2BBAEE]/8 to-transparent p-5 md:p-6 text-left">
          {steps.map((text, idx) => (
            <div key={idx} className="flex items-start gap-3.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2BBAEE]/25 mt-0.5 ring-1 ring-[#2BBAEE]/20">
                <span className="text-sm font-bold text-[#1a9fd4]">{idx + 1}</span>
              </div>
              <p className="text-sm md:text-base font-medium text-slate-600 leading-snug pt-0.5">{text}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onUpload}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg border border-neutral-800/20 bg-gradient-to-b from-[#2BBAEE]/20 to-transparent px-6 py-2.5 text-sm font-medium text-neutral-800 transition-all hover:from-[#2BBAEE]/30 active:scale-95"
          >
            <FileUp className="size-4 shrink-0" />
            Unggah CSV
          </button>

          <button
            onClick={onRunAnalysis}
            disabled={!isReady}
            title={!isReady ? 'Pilih rentang tanggal terlebih dahulu' : undefined}
            className={cn(
              'w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg border px-6 py-2.5 text-sm font-medium transition-all active:scale-95',
              isReady
                ? 'border-neutral-800/10 bg-gradient-to-b from-[#90FDF2] to-[#2BBAEE] text-neutral-800 hover:opacity-90 shadow-sm'
                : 'border-neutral-800/10 bg-neutral-100 text-neutral-800/30 cursor-not-allowed',
            )}
          >
            Mulai Analisis
          </button>
        </div>

        {/* Ready-state hint */}
        <p className={cn(
          'text-xs transition-opacity duration-300 -mt-1',
          isReady ? 'text-[#2BBAEE]/70' : 'text-neutral-800/30'
        )}>
          {isReady && dateRange?.from && dateRange?.to
            ? `${Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / 86_400_000)} hari dipilih — siap untuk dianalisis`
            : 'Pilih rentang tanggal untuk mengaktifkan analisis'}
        </p>

      </div>
    </div>
  );
}