'use client';

import { LayoutGrid } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function ClusteringEmptyState() {
  const router = useRouter();

  const steps = [
    'Buka halaman Dasbor dan unggah file CSV yang berisi data penjualan atau produk.',
    'Setelah data berhasil diunggah, kembali ke halaman ini.',
    'Pilih kolom produk dan fitur, lalu klik "Jalankan Clustering".',
  ];

  return (
    <div className="flex h-full flex-1 w-full flex-col items-center justify-center rounded-2xl border border-neutral-800/20 bg-white p-6 md:p-8">
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <div className="relative flex size-20 md:size-24 items-center justify-center rounded-2xl bg-gradient-to-b from-[#2BBAEE]/20 to-transparent shadow-inner">
          <LayoutGrid className="relative size-10 md:size-12 text-[#2BBAEE]" />
        </div>

        <div className="flex flex-col gap-2 items-center">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-800">
            Belum ada data untuk{' '}
            <span className="text-[#2BBAEE]">dianalisis</span>
          </h2>
          <p className="text-sm md:text-base text-neutral-800/50 leading-relaxed max-w-md">
            Upload data CSV di halaman Dasboard terlebih dahulu sebelum menjalankan clustering.
          </p>
        </div>

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

        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center justify-center gap-2 rounded-lg border border-neutral-800/10 bg-gradient-to-b from-[#90FDF2] to-[#2BBAEE] px-6 py-2.5 text-sm font-medium text-neutral-800 hover:opacity-90 shadow-sm transition-all active:scale-95"
        >
          Lanjut ke Dashboard
        </button>
      </div>
    </div>
  );
}