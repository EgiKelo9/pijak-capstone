import {
  FileUp,
  Presentation
} from 'lucide-react';
import { EmptyStateViewProps } from '@/types';
import { cn } from '@/lib/utils';


function EmptyStateView({ modeLabel, isReady, dateRange, onUpload, onRunAnalysis }: EmptyStateViewProps) {
  const steps = [
    'Mulai dengan mengunggah file CSV yang berisi riwayat penjualan atau stok barangmu.',
    'Pilih mode analisis (Forecasting, Clustering, atau keduanya), lalu atur rentang tanggal di bagian atas.',
    'Klik \'Mulai Analisis\' dan biarkan kami menyajikan visualisasi data yang interaktif untukmu.',
  ];

  return (
    <div className="flex h-full flex-1 w-full flex-col items-center justify-center rounded-2xl border border-neutral-800/20 bg-white p-4 2xl:p-8 overflow-hidden">
      <div className="flex w-full max-w-2xl flex-col items-center gap-4 2xl:gap-6 text-center my-auto py-1">

        {/* Hero Icon */}
        <div className="relative flex size-16 2xl:size-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[#2BBAEE]/20 to-transparent shadow-inner">
          <Presentation className="relative size-8 2xl:size-12 text-[#2BBAEE]" />
        </div>

        {/* Title */}
        <div className="flex flex-col gap-2 items-center">
          <h2 className="text-2xl 2xl:text-4xl font-semibold tracking-tight text-neutral-800">
            Mari temukan wawasan baru dari{' '}
            <span className="text-[#2BBAEE]">{modeLabel}</span>{' '}
            bisnismu!
          </h2>
          <p className="text-sm 2xl:text-base text-neutral-800/50 leading-relaxed max-w-md">
            Unggah datamu dan atur konfigurasinya di atas. Sistem kami akan otomatis
            menemukan pola dan tren menarik tersembunyi untukmu.
          </p>
        </div>

        {/* Steps */}
        <div className="flex w-full flex-col gap-3 2xl:gap-4 rounded-xl border border-[#2BBAEE]/15 bg-gradient-to-b from-[#2BBAEE]/8 to-transparent p-4 2xl:p-6 text-left">
          {steps.map((text, idx) => (
            <div key={idx} className="flex items-start gap-3 2xl:gap-4">
              <div className="flex size-6 2xl:size-8 shrink-0 items-center justify-center rounded-full bg-[#2BBAEE]/25 mt-0.5 ring-1 ring-[#2BBAEE]/20">
                <span className="text-xs 2xl:text-sm font-bold text-[#1a9fd4]">{idx + 1}</span>
              </div>
              <p className="text-xs 2xl:text-sm font-medium text-slate-600 leading-snug pt-0.5">{text}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onUpload}
            className="text-sm 2xl:text-base font-medium w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg border border-neutral-800/20 bg-gradient-to-b from-[#2BBAEE]/20 to-transparent px-5 2xl:px-6 py-2 2xl:py-2.5 text-neutral-800 transition-all hover:from-[#2BBAEE]/30 active:scale-95"
          >
            <FileUp className="size-4 shrink-0" />
            Unggah CSV
          </button>

          <button
            onClick={onRunAnalysis}
            disabled={!isReady}
            title={!isReady ? 'Pastikan dataset, rentang tanggal, dan preferensi analisis telah diatur' : undefined}
            className={cn(
              'text-sm 2xl:text-base font-medium w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg border px-5 2xl:px-6 py-2 2xl:py-2.5 transition-all active:scale-95',
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
          'text-xs 2xl:text-sm transition-opacity duration-300 mt-1 max-w-[280px] sm:max-w-none mx-auto',
          isReady ? 'text-[#2BBAEE]/70' : 'text-neutral-800/30'
        )}>
          {isReady && dateRange?.from && dateRange?.to
            ? `${Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / 86_400_000)} hari telah dipilih — siap untuk dianalisis!`
            : 'Yuk, unggah dataset dan lengkapi preferensi analisisnya terlebih dahulu'}
        </p>

      </div>
    </div>
  );
}

export { EmptyStateView };
