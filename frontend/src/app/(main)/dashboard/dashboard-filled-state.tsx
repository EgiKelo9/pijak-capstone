// components/FilledStateView.tsx
'use client';
import { useMemo } from 'react';

import { DynamicDataTable } from '@/components/dynamic-data-table';
import { AnalysisCard } from '@/components/main-card';
import { ClusteringPreference } from './clustering-preference';
import { DataConfigState, DataConfiguration } from './column-preference';
import { ForecastingPreference } from './forecasting-preference';
import { TerminalLog, type TerminalStep } from './terminal';

interface FilledStateViewProps {
  tableData: any;
  forecastAggressiveness: number;
  setForecastAggressiveness: (val: number) => void;
  clusteringConfig: { mode: 'auto' | 'manual'; clusterCount: number };
  setClusteringConfig: (config: { mode: 'auto' | 'manual'; clusterCount: number }) => void;
  dataConfig: DataConfigState;
  setDataConfig: (config: DataConfigState) => void;
  terminalLogs: TerminalStep[];
}

export function FilledStateView({ 
  tableData, 
  forecastAggressiveness, 
  setForecastAggressiveness, 
  clusteringConfig, 
  setClusteringConfig,
  dataConfig,
  setDataConfig,
  terminalLogs
}: FilledStateViewProps) {

  // Memoize data tabel yang sudah difilter berdasarkan kolom yang dipilih
  const filteredTableData = useMemo(() => {
    if (!tableData || tableData.length === 0) return [];

    // Kumpulkan semua kolom yang aktif
    const activeColumns = new Set([
      dataConfig.dateColumn,
      dataConfig.targetColumn,
      ...(dataConfig.includedColumns || [])
    ].filter(Boolean));

    return tableData.map((row: any) => {
      const filteredRow: any = {};
      for (const col of activeColumns) {
        if (row.hasOwnProperty(col)) {
          filteredRow[col] = row[col];
        }
      }
      return filteredRow;
    });
  }, [tableData, dataConfig]);

  return (
    // Mengubah dari flex menjadi grid untuk memaksa rasio (3:2) dan mencegah tabel mendobrak batas lebar
    <div className="grid grid-cols-1 lg:grid-cols-5 w-full gap-3 flex-1 min-h-0 min-w-0 overflow-hidden h-full">
      
      {/* Left Column: Data Table */}
      <div className="lg:col-span-3 flex flex-col rounded-3xl border border-neutral-800/20 bg-white overflow-hidden min-w-0 min-h-0">
        <div className="flex flex-col flex-1 min-h-0 min-w-0 w-full bg-neutral-50/50 p-2 sm:p-1.5">
          <DynamicDataTable data={filteredTableData}/>
        </div>
      </div>

      {/* Right Column: Configuration & Status Cards */}
      <div className="lg:col-span-2 flex flex-col gap-3 min-w-0 min-h-0 mb-2">
        
        {/* Terminal Card */}
        <AnalysisCard 
          title="Update Langkah Pemrosesan" 
          status="menunggu"
          className="flex-1 min-h-[150px]"
          innerClassName="flex flex-col h-full min-h-0 overflow-hidden p-0.5"
        >
          <TerminalLog logs={terminalLogs}/>
        </AnalysisCard>

        {/* Data Configuration Card */}
        <AnalysisCard
            title="Konfigurasi Data"
            status="berhasil"
            className="shrink-0"
            innerClassName="max-h-52.5 p-3" 
        >
            <DataConfiguration config={dataConfig} onChange={setDataConfig} />
        </AnalysisCard>


        {/* Data Quality Card */}
        <AnalysisCard title="Cek Kualitas Data" status="menunggu" className="min-h-40 shrink-0">
           <div className="h-full text-neutral-400 flex items-center justify-center">
             Quality Metrics Placeholder
           </div>
        </AnalysisCard>

        {/* Bottom Row: Preferences (Side by side) */}
        <div className="flex gap-4 shrink-0">
          <AnalysisCard title="Preferensi Forecasting" status="kosong" className="flex-1 truncate justify-center">
             <div className="w-full p-2">
                <ForecastingPreference 
                    value={forecastAggressiveness} 
                    onChange={setForecastAggressiveness} 
                />
            </div>
          </AnalysisCard>
          
          <AnalysisCard title="Preferensi Clustering" status="kosong" className="flex-1 truncate justify-center">
             <div className=" flex w-full p-2 justify-center items-center pt-5">
                <ClusteringPreference 
                    config={clusteringConfig} 
                    onChange={setClusteringConfig} 
                />
            </div>
          </AnalysisCard>
        </div>

      </div>
    </div>
  );
}