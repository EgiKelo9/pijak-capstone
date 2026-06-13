'use client';

import { DynamicDataTable } from '@/components/dynamic-data-table';
import { AnalysisCard, StatusType } from '@/components/main-card';
import { useEffect, useMemo, useState } from 'react';
import { ClusteringPreference } from '@/components/main/analisis/clustering-preference';
import { DataConfiguration } from '@/components/main/analisis/column-preference';
import { DataQuality } from '@/components/main/analisis/data-quality';
import { ForecastingPreference } from '@/components/main/analisis/forecasting-preference';
import { TerminalLog } from '@/components/main/analisis/terminal';
import { CardId, CardStatusMap, FilledStateViewProps } from '@/types';

const CARD_DEFAULTS: Record<CardId, StatusType> = {
  terminal:    'menunggu',
  dataConfig:  'menunggu',
  dataQuality: 'menunggu',
  forecasting: 'kosong',
  clustering:  'kosong',
};

function resolveStatuses(overrides?: CardStatusMap): Record<CardId, StatusType> {
  return { ...CARD_DEFAULTS, ...overrides };
}

// ── Component ───────────────────────────────────────────────────────────────
export function FilledStateView({
  tableData,
  forecastAggressiveness,
  setForecastAggressiveness,
  clusteringConfig,
  setClusteringConfig,
  dataConfig,
  setDataConfig,
  terminalLogs,
  cardStatuses,
  onConfirmMapping,
  onReloadMapping,
}: FilledStateViewProps) {
  const [activeAccordion, setActiveAccordion] = useState<'config' | 'quality' | null>(null);
  const [hasInteractedForecasting, setHasInteractedForecasting] = useState(true);
  const [hasInteractedClustering, setHasInteractedClustering] = useState(true);

  const statuses = resolveStatuses(cardStatuses);

  const filteredTableData = useMemo(() => {
    if (!tableData || tableData.length === 0) return [];
    const activeColumns = new Set(
      [dataConfig.dateColumn, dataConfig.targetColumn, ...(dataConfig.includedColumns || [])].filter(Boolean)
    );
    return tableData.map((row: any) => {
      const filteredRow: any = {};
      for (const col of activeColumns) {
        if (Object.prototype.hasOwnProperty.call(row, col)) filteredRow[col] = row[col];
      }
      return filteredRow;
    });
  }, [tableData, dataConfig]);

  const finalDataQualityStatus = filteredTableData.length > 0 ? 'berhasil' : statuses.dataQuality;
  
  useEffect(() => {
    if (forecastAggressiveness !== 'balance') setHasInteractedForecasting(true);
  }, [forecastAggressiveness]);

  useEffect(() => {
    if (clusteringConfig.mode !== 'auto' || clusteringConfig.clusterCount !== 3) {
      setHasInteractedClustering(true);
    }
  }, [clusteringConfig]);

  const finalForecastingStatus = hasInteractedForecasting ? 'berhasil' : statuses.forecasting;
  const finalClusteringStatus = hasInteractedClustering ? 'berhasil' : statuses.clustering;

  console.log(dataConfig)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 w-full gap-3 flex-1 min-h-0 min-w-0 overflow-hidden h-full">

      {/* ── Left: Data Table ─────────────────────────────────────────────── */}
      <div className="lg:col-span-3 flex flex-col rounded-3xl border border-neutral-800/20 bg-white overflow-hidden min-w-0 min-h-0 max-h-[85vh] overflow-y-auto">
        <div className="flex flex-col flex-1 min-h-0 min-w-0 w-full bg-neutral-50/50 p-2 sm:p-1.5">
          <DynamicDataTable data={filteredTableData} />
        </div>
      </div>

      {/* ── Right: Config & Status Cards ─────────────────────────────────── */}
      <div className="lg:col-span-2 flex flex-col gap-3 min-w-0 min-h-0 max-h-[85vh] overflow-y-auto mb-2 overflow-hidden">

        {/* Terminal — non-collapsible, flex-1 to fill remaining height */}
        <AnalysisCard
          title="Update Langkah Pemrosesan"
          status={statuses.terminal}
          className="flex-1 min-h-37.5"
          innerClassName="flex flex-col h-full min-h-0 overflow-hidden p-0.5"
        >
          <TerminalLog logs={terminalLogs} />
        </AnalysisCard>

        {/* Data Configuration — collapsible.
            Strategy: give the card a fixed max-height via className so the
            outer shell is bounded. innerClassName carries h-full + flex so
            the DataConfiguration's internal flex+ScrollArea chain resolves
            against a real pixel height instead of an unbounded parent.     */}
        <AnalysisCard
          title="Konfigurasi Data"
          status={statuses.dataConfig}
          className="shrink-0 max-h-64"
          innerClassName="p-3 flex flex-col h-full min-h-0"
          collapsible
          defaultOpen={false}
          open={activeAccordion === 'config'}
          onOpenChange={(open) => setActiveAccordion(open ? 'config' : null)}
        >
          <DataConfiguration 
            config={dataConfig} 
            onChange={setDataConfig} 
            onConfirm={onConfirmMapping}
            onReload={onReloadMapping}
            isProcessing={statuses.dataConfig === 'menunggu'}
          />
        </AnalysisCard>

        {/* Data Quality — collapsible, closed by default */}
        <AnalysisCard
          title="Cek Kualitas Data"
          status={finalDataQualityStatus}
          className="shrink-0"
          collapsible
          defaultOpen={false}
          open={activeAccordion === 'quality'}
          onOpenChange={(open) => setActiveAccordion(open ? 'quality' : null)}
        >
          <DataQuality data={filteredTableData} />
        </AnalysisCard>

        {/* Preferences row */}
        <div className="flex gap-4 shrink-0">
          <AnalysisCard
            title="Preferensi Forecasting"
            status={finalForecastingStatus}
            className="flex-1 truncate justify-center"
            defaultOpen
          >
            <div className="w-full p-2">
              <ForecastingPreference
                value={forecastAggressiveness}
                onChange={setForecastAggressiveness}
              />
            </div>
          </AnalysisCard>

          <AnalysisCard
            title="Preferensi Clustering"
            status={finalClusteringStatus}
            className="flex-1 truncate justify-center"
            defaultOpen
          >
            <div className="flex w-full p-2 justify-center items-center pt-5">
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