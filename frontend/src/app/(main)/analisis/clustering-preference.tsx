// components/preferences/clustering-preference.tsx
'use client';
import * as React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ClusteringConfig {
  mode: 'auto' | 'manual';
  clusterCount: number;
}

interface ClusteringPreferenceProps {
  config: ClusteringConfig;
  onChange: (config: ClusteringConfig) => void;
}

export function ClusteringPreference({ config, onChange }: ClusteringPreferenceProps) {
  const isAuto = config.mode === 'auto';

  const handleModeChange = (val: 'auto' | 'manual') => {
    onChange({ ...config, mode: val });
  };

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) val = 3;
    val = Math.max(2, Math.min(15, val));
    onChange({ ...config, clusterCount: val });
  };

  // Clicking the number input activates manual mode automatically
  const handleInputFocus = () => {
    if (isAuto) handleModeChange('manual');
  };

  return (
    // h-full matches the forecasting card height in a side-by-side layout
    <div className="flex h-full w-full flex-col justify-center">
      <RadioGroup
        value={config.mode}
        onValueChange={handleModeChange}
        className="flex flex-col gap-3"
      >
        {/* Auto */}
        <div className="flex items-center gap-2.5">
          <RadioGroupItem value="auto" id="r-auto" className="shrink-0" />
          <Label
            htmlFor="r-auto"
            className="text-sm font-medium text-neutral-700 cursor-pointer leading-none select-none"
          >
            Biarkan sistem menentukan.
          </Label>
        </div>

        {/* Manual — inline flex, won't wrap or overflow */}
        <div className="flex items-center gap-2.5">
          <RadioGroupItem value="manual" id="r-manual" className="shrink-0" />
          <Label
            htmlFor="r-manual"
            className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 cursor-pointer leading-none select-none"
          >
            <span className="shrink-0 whitespace-nowrap">Saya tahu,</span>
            <Input
              type="number"
              min={2}
              max={15}
              value={config.clusterCount}
              onChange={handleCountChange}
              onFocus={handleInputFocus}
              // Stop label's htmlFor from double-triggering the radio
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'w-12 h-7 text-center text-sm px-1 py-0 rounded-md border',
                'transition-opacity duration-150',
                // Visually dim when auto; still focusable to auto-switch mode
                isAuto ? 'opacity-40' : 'opacity-100'
              )}
            />
            <span className="shrink-0 whitespace-nowrap">kelompok.</span>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}