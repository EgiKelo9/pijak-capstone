// components/preferences/forecasting-preference.tsx
'use client';
import * as React from 'react';

interface ForecastingPreferenceProps {
  value: number;
  onChange: (value: number) => void;
}

const SEGMENTS = [
  {
    label: 'Konservatif',
    feedback: 'Stabil, hindari lonjakan ekstrem.',
    trackColor: 'bg-blue-400',
    textColor: 'text-blue-600',
  },
  {
    label: 'Seimbang',
    feedback: 'Titik tengah stabilitas & respons.',
    trackColor: 'bg-violet-400',
    textColor: 'text-violet-600',
  },
  {
    label: 'Agresif',
    feedback: 'Sensitif terhadap perubahan tren.',
    trackColor: 'bg-rose-400',
    textColor: 'text-rose-600',
  },
] as const;

const getActiveIdx = (val: number) => (val < 33 ? 0 : val < 66 ? 1 : 2);

export function ForecastingPreference({ value, onChange }: ForecastingPreferenceProps) {
  const activeIdx = getActiveIdx(value);
  const seg = SEGMENTS[activeIdx];

  return (
    <div className="flex h-full w-full flex-col justify-between">

      {/* Track + labels */}
      <div className="flex flex-col gap-2 pt-1">

        {/* Segmented rail with invisible native input on top */}
        <div className="relative w-full" style={{ padding: '8px 6px' }}>

          {/* Three segment pills */}
          <div className="flex w-full gap-[3px] h-[4px]">
            {SEGMENTS.map((s, i) => (
              <div
                key={s.label}
                className={[
                  'flex-1 rounded-full transition-all duration-200',
                  // Segments left of (and including) active fill with that segment's color
                  // Segments to the right stay neutral
                  i <= activeIdx
                    ? i === activeIdx ? s.trackColor : 'bg-neutral-300'
                    : 'bg-neutral-200',
                ].join(' ')}
              />
            ))}
          </div>

          {/* Native range — invisible, captures interaction */}
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label="Agresivitas prediksi"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              opacity: 0,
              cursor: 'pointer',
              margin: 0,
              padding: 0,
            }}
          />

          {/* Custom thumb — centered using calc so it stays within the 6px inset on each side */}
          <div
            className={['pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[14px] h-[14px] rounded-full border-[2.5px] border-white shadow transition-all duration-150', seg.trackColor].join(' ')}
            style={{ left: `calc(6px + ${value} * (100% - 12px) / 100)` }}
          />
        </div>

        {/* 3-column labels */}
        <div className="grid grid-cols-3 w-full">
          {SEGMENTS.map((s, i) => (
            <span
              key={s.label}
              className={[
                'text-[10px] font-medium leading-none transition-colors duration-150',
                i === 0 ? 'text-left' : i === 1 ? 'text-center' : 'text-right',
                i === activeIdx ? `${s.textColor} font-semibold` : 'text-neutral-400',
              ].join(' ')}
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Feedback — color-coded to segment, never clips */}
      <p
        key={activeIdx}
        className={['text-[10px] font-medium italic leading-snug line-clamp-2', seg.textColor].join(' ')}
      >
        * {seg.feedback}
      </p>
    </div>
  );
}