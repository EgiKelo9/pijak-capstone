// 'use client';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Flame,
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
      <div className="w-full md:w-90">
        <Tabs
          value={mode}
          onValueChange={handleModeChange}
          className="w-full gap-0!"
        >
          <TabsList
            className={cn(
              'relative flex w-full flex-row items-center h-11 md:h-12 p-1 gap-1 rounded-xl px-2',
              'bg-neutral-100', // Refactored from !bg-[#F3F3F3]
              '*:data-[slot=highlight]:rounded-[10px]!',
              '*:data-[slot=highlight]:bg-[#2BBAEE]',
              '*:data-[slot=highlight]:shadow-sm',
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
      <div className="w-full md:w-55 xl:w-100">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-between rounded-xl border-neutral-800/20 bg-gradient-to-b from-white to-[#2BBAEE]/10 px-4 h-11 md:h-12 text-left text-sm font-medium transition-all duration-200 ease-out hover:to-[#2BBAEE]/20 hover:shadow-md hover:-translate-y-0.5 active:scale-95',
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
              'animate-none!',
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

export { DashboardHeader };