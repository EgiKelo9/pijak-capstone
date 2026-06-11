'use client';

import * as React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ClusteringConfig, ClusteringPreferenceProps } from '@/types';

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

  const handleInputFocus = () => {
    if (isAuto) handleModeChange('manual');
  };

  return (
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

        {/* Manual */}
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
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'w-12 h-7 text-center text-sm px-1 py-0 rounded-md border',
                'transition-opacity duration-150',
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