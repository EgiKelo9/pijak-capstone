'use client';

interface AnalysisLoadingStateProps {
  title?: string;
  subtitle?: string;
}

export function AnalysisLoadingState({
  title = 'Sedang menjalankan analisis...',
  subtitle = 'Proses ini mungkin memerlukan waktu beberapa saat',
}: AnalysisLoadingStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-4 w-full h-full min-h-[400px]">
      <div className="flex flex-col items-center justify-center gap-4 bg-white rounded-2xl border border-neutral-800/20 w-full h-full py-16 px-6 shadow-sm">
        <div className="relative">
          <div className="size-16 rounded-full border-4 border-[#2BBAEE]/20" />
          <div className="absolute inset-0 size-16 rounded-full border-4 border-t-[#2BBAEE] animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-neutral-700">{title}</p>
          <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
