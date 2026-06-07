// components/preferences/data-configuration.tsx
'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface DataConfigState {
  availableColumns: string[];
  dateColumn: string;
  targetColumn: string;
  includedColumns: string[];
}

interface DataConfigurationProps {
  config: DataConfigState;
  onChange: (newConfig: DataConfigState) => void;
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest leading-none">
    {children}
  </span>
);

export function DataConfiguration({ config, onChange }: DataConfigurationProps) {
  const handleDateChange = (val: string) => onChange({ ...config, dateColumn: val });
  const handleTargetChange = (val: string) => onChange({ ...config, targetColumn: val });

  const handleFeatureToggle = (col: string, checked: boolean) => {
    const next = checked
      ? [...config.includedColumns, col]
      : config.includedColumns.filter((c) => c !== col);
    onChange({ ...config, includedColumns: next });
  };

  const featureColumns = config.availableColumns.filter(
    (col) => col !== config.dateColumn && col !== config.targetColumn
  );

  const allChecked = featureColumns.length > 0 && featureColumns.every((c) => config.includedColumns.includes(c));
  const someChecked = featureColumns.some((c) => config.includedColumns.includes(c));

  const handleToggleAll = () => {
    const next = allChecked
      ? config.includedColumns.filter((c) => !featureColumns.includes(c))
      : [...new Set([...config.includedColumns, ...featureColumns])];
    onChange({ ...config, includedColumns: next });
  };

  const validColumns = config.availableColumns.filter((col) => col && col.trim() !== '');

  return (
    <div className="flex h-full w-full flex-col gap-0 overflow-hidden">

      {/* ── Dropdowns ── fixed height, never scrolls */}
      <div className="shrink-0 grid grid-cols-2 gap-2 pb-2.5 border-b border-neutral-100">
        <div className="flex flex-col gap-1">
          <SectionLabel>Tanggal</SectionLabel>
          <Select value={config.dateColumn || undefined} onValueChange={handleDateChange}>
            <SelectTrigger className="h-7 text-xs border-neutral-200 bg-neutral-50/50 px-2">
              <SelectValue placeholder="Pilih kolom…" />
            </SelectTrigger>
            <SelectContent>
              {validColumns.map((col) => (
                <SelectItem key={col} value={col} className="text-xs">
                  {col}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <SectionLabel>Target</SectionLabel>
          <Select value={config.targetColumn || undefined} onValueChange={handleTargetChange}>
            <SelectTrigger className="h-7 text-xs border-neutral-200 bg-neutral-50/50 px-2">
              <SelectValue placeholder="Pilih kolom…" />
            </SelectTrigger>
            <SelectContent>
              {validColumns.map((col) => (
                <SelectItem key={col} value={col} className="text-xs">
                  {col}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Feature checkboxes ── this section scrolls */}
      <div className="flex flex-col gap-1 pt-2 flex-1 min-h-0 overflow-hidden">

        {/* Header row: label + select-all */}
        <div className="shrink-0 flex items-center justify-between">
          <SectionLabel>Kolom Fitur</SectionLabel>
          {featureColumns.length > 0 && (
            <button
              onClick={handleToggleAll}
              className="text-[9px] font-medium text-[#2BBAEE] hover:text-[#1a9fd4] transition-colors leading-none"
            >
              {allChecked ? 'Hapus semua' : 'Pilih semua'}
            </button>
          )}
        </div>

        {/* Scrollable list */}
        <ScrollArea className="flex-1 min-h-0 w-full">
          <div className="flex flex-col gap-0 pr-1">
            {featureColumns.length === 0 ? (
              <p className="text-[10px] text-neutral-400 italic pt-1">
                Tidak ada fitur tambahan.
              </p>
            ) : (
              featureColumns.map((col) => {
                const checked = config.includedColumns.includes(col);
                return (
                  <label
                    key={col}
                    htmlFor={`chk-${col}`}
                    className={[
                      'flex items-center gap-2 px-1.5 py-1.5 rounded-md cursor-pointer',
                      'transition-colors hover:bg-neutral-100/70 group',
                    ].join(' ')}
                  >
                    <Checkbox
                      id={`chk-${col}`}
                      checked={checked}
                      onCheckedChange={(v) => handleFeatureToggle(col, v as boolean)}
                      className="h-3.5 w-3.5 shrink-0 data-[state=checked]:bg-[#2BBAEE] data-[state=checked]:border-[#2BBAEE]"
                    />
                    <span
                      className={[
                        'text-xs leading-none transition-colors truncate',
                        checked ? 'text-neutral-800 font-medium' : 'text-neutral-400',
                      ].join(' ')}
                    >
                      {col}
                    </span>
                    {checked && (
                      <span className="ml-auto shrink-0 w-1 h-1 rounded-full bg-[#2BBAEE]" />
                    )}
                  </label>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer: count of selected features */}
        {featureColumns.length > 0 && (
          <div className="shrink-0 pt-1 border-t border-neutral-100">
            <span className="text-[9px] text-neutral-400">
              {config.includedColumns.filter((c) => featureColumns.includes(c)).length}
              {' / '}
              {featureColumns.length} kolom dipilih
            </span>
          </div>
        )}
      </div>
    </div>
  );
}