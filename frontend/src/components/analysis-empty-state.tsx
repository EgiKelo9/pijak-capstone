'use client';

import { LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AnalysisEmptyStateProps {
  title: string;
  description: string;
  steps: string[];
  icon: LucideIcon;
  iconColorClass?: string;
  gradientFromClass?: string;
  buttonText?: string;
  redirectTo?: string;
}

export function AnalysisEmptyState({
  title,
  description,
  steps,
  icon: Icon,
  iconColorClass = 'text-[#2BBAEE]',
  gradientFromClass = 'from-[#2BBAEE]/20',
  buttonText = 'Lanjut ke Dasbor',
  redirectTo = '/dasbor',
}: AnalysisEmptyStateProps) {
  const router = useRouter();

  return (
    <div className="flex h-full flex-1 w-full flex-col items-center justify-center rounded-2xl border border-neutral-800/20 bg-white p-6 md:p-8">
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <div className={`relative flex size-20 md:size-24 items-center justify-center rounded-2xl bg-gradient-to-b ${gradientFromClass} to-transparent shadow-inner`}>
          <Icon className={`relative size-10 md:size-12 ${iconColorClass}`} />
        </div>

        <div className="flex flex-col gap-2 items-center">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-800">
            Belum ada data untuk <span className={iconColorClass}>{title}</span>
          </h2>
          <p className="text-sm md:text-base text-neutral-800/50 leading-relaxed max-w-md">
            {description}
          </p>
        </div>

        <div className={`flex w-full flex-col gap-3 rounded-xl border border-neutral-200 bg-gradient-to-b from-neutral-50/50 to-transparent p-5 md:p-6 text-left`}>
          {steps.map((text, idx) => (
            <div key={idx} className="flex items-start gap-3.5">
              <div className={`flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 ring-1 ring-neutral-200 mt-0.5`}>
                <span className="text-sm font-bold text-neutral-600">{idx + 1}</span>
              </div>
              <p className="text-sm md:text-base font-medium text-slate-600 leading-snug pt-0.5">{text}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push(redirectTo)}
          className="flex items-center justify-center gap-2 rounded-lg border border-neutral-800/10 bg-gradient-to-b from-[#90FDF2] to-[#2BBAEE] px-6 py-2.5 text-sm font-medium text-neutral-800 hover:opacity-90 shadow-sm transition-all active:scale-95"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
