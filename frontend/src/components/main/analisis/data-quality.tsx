'use client';

import * as React from 'react';
import { DataQualityProps } from '@/types';

function DonutChart({ percentage, strokeColor, title, subtitle }: {
  percentage: number;
  strokeColor: string;
  title: string;
  subtitle: string;
}) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div
        className="relative flex size-28 items-center justify-center rounded-3xl shadow-inner"
        style={{ background: `linear-gradient(160deg, color-mix(in srgb, ${strokeColor} 12%, #f0f8ff) 0%, #f8fafc 100%)` }}
      >
        <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={r} stroke="#e2eaf2" strokeWidth="9.6" fill="none" />
          <circle cx="48" cy="48" r={r} stroke={strokeColor} strokeWidth="9.6"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" fill="none"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="relative flex flex-col items-center">
          <span className="text-base font-semibold text-neutral-600/80 tracking-tight">{Math.round(percentage)}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[11px] font-medium text-neutral-400/90 tracking-wide">{title}</p>
        <p className="text-[9px] text-neutral-300 tracking-wide">{subtitle}</p>
      </div>
    </div>
  );
}

export function DataQuality({ data }: DataQualityProps) {
  const stats = React.useMemo(() => {
    if (!data?.length) return { completeness: 0, uniqueness: 0, numeric: 0 };
    const cols = Object.keys(data[0]);
    const totalCells = data.length * cols.length;
    let missing = 0, numeric = 0;
    const rowStrings = new Set();
    data.forEach((row) => {
      rowStrings.add(JSON.stringify(row));
      cols.forEach((col) => {
        const val = row[col];
        // Catch whitespace-only strings as missing, and strictly verify numerics
        if (val === null || val === undefined || String(val).trim() === '') missing++;
        else if (typeof val === 'number' || (typeof val !== 'boolean' && !isNaN(Number(val)))) numeric++;
      });
    });
    return {
      completeness: totalCells ? ((totalCells - missing) / totalCells) * 100 : 0,
      uniqueness: data.length ? (rowStrings.size / data.length) * 100 : 0,
      numeric: totalCells ? (numeric / totalCells) * 100 : 0,
    };
  }, [data]);

  return (
    <div className="flex w-full items-center justify-around px-4 py-4 gap-2">
      <DonutChart percentage={stats.completeness} strokeColor="#2BBAEE" title="Kelengkapan" subtitle="Data terisi" />
      <DonutChart percentage={stats.uniqueness} strokeColor="#6ee7b7" title="Keunikan" subtitle="Baris tak duplikat" />
      <DonutChart percentage={stats.numeric} strokeColor="#a5b4fc" title="Numerik" subtitle="Proporsi angka" />
    </div>
  );
}