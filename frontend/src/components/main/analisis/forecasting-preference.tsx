'use client';

interface ForecastingPreferenceProps {
  value: number;
  onChange: (value: number) => void;
}

const SEGMENTS = [
  {
    label: 'Conservative',
    value: 0,
    feedback: 'Stabil, hindari lonjakan ekstrem.',
    activeColor: 'bg-neutral-500 text-white',
    inactiveColor: 'bg-white text-neutral-500 hover:bg-neutral-50 border-neutral-200',
    feedbackColor: 'text-neutral-500',
  },
  {
    label: 'Balance',
    value: 50,
    feedback: 'Titik tengah stabilitas & respons.',
    activeColor: 'bg-sky-400 text-white',
    inactiveColor: 'bg-white text-neutral-500 hover:bg-neutral-50 border-neutral-200',
    feedbackColor: 'text-sky-400',
  },
  {
    label: 'Aggressive',
    value: 100,
    feedback: 'Sensitif terhadap perubahan tren.',
    activeColor: 'bg-sky-500 text-white',
    inactiveColor: 'bg-white text-neutral-500 hover:bg-neutral-50 border-neutral-200',
    feedbackColor: 'text-sky-500',
  },
] as const;

const getActiveIdx = (val: number) => (val < 33 ? 0 : val < 66 ? 1 : 2);

export function ForecastingPreference({ value, onChange }: ForecastingPreferenceProps) {
  const activeIdx = getActiveIdx(value);
  const seg = SEGMENTS[activeIdx];

  return (
    <div className="flex h-full w-full flex-col justify-between pt-1">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2 w-full">
          {SEGMENTS.map((s, i) => {
            const isActive = i === activeIdx;
            return (
              <button
                key={s.label}
                onClick={() => onChange(s.value)}
                className={[
                  'py-1.5 px-1 text-sm font-medium rounded-md border transition-all duration-200',
                  isActive ? `border-transparent shadow-sm ${s.activeColor}` : s.inactiveColor,
                ].join(' ')}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback */}
      <p
        key={activeIdx}
        className={['text-[10px] font-medium italic leading-snug line-clamp-2 mt-2', seg.feedbackColor].join(' ')}
      >
        * {seg.feedback}
      </p>
    </div>
  );
}