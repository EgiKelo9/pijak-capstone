'use client';

import { ArrowLeft, FileQuestion } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50/50 p-6 md:p-8">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center rounded-3xl border border-neutral-800/10 bg-white p-8 md:p-10 shadow-sm">
        
        {/* Hero Icon */}
        <div className="relative flex size-20 md:size-24 items-center justify-center rounded-2xl bg-gradient-to-b from-[#2BBAEE]/20 to-transparent shadow-inner">
          <FileQuestion className="relative size-10 md:size-12 text-[#2BBAEE]" />
        </div>

        {/* Text Content */}
        <div className="flex flex-col gap-3 items-center">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-800">
            Halaman <span className="text-[#2BBAEE]">Tidak Ditemukan</span>
          </h2>
          <p className="text-sm md:text-base text-neutral-800/50 leading-relaxed max-w-sm">
            Aduh! Halaman yang kamu cari sepertinya tidak ada, telah dihapus, atau mungkin kamu salah memasukkan alamat.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-2 flex w-full flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-800/20 bg-gradient-to-b from-[#2BBAEE]/20 to-transparent px-6 py-3 text-sm font-medium text-neutral-800 transition-all hover:from-[#2BBAEE]/30 active:scale-95"
          >
            <ArrowLeft className="size-4 shrink-0" />
            Kembali
          </button>
        </div>

        {/* Subtle Error Code */}
        <p className="text-xs font-mono text-neutral-400 mt-2">Error 404</p>
        
      </div>
    </div>
  );
}