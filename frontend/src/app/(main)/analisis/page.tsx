'use client';

import { FileUploadDemo } from '@/components/file-upload-demo';
import { EmptyStateView } from '@/components/main/analisis/dashboard-empty-state';
import { FilledStateView } from '@/components/main/analisis/dashboard-filled-state';
import { DashboardHeader } from '@/components/main/analisis/dashboard-header';
import { useAnalysis } from '@/hooks/use-analysis';

export default function AnalysisPage() {
  const {
    mode, setMode,
    date, setDate,
    isOpen, setIsOpen,
    activeDatasetId,
    datasetData,
    forecastAggressiveness, setForecastAggressiveness,
    clusteringConfig, setClusteringConfig,
    dataConfig, setDataConfig,
    terminalLogs,
    dataConfigStatus,
    handleConfirmMapping,
    handleReloadMapping,
    modeLabel,
    isReady,
    handleOpenUploadModal,
    handleRunAnalysis,
    isFileUploadOpen, setIsFileUploadOpen,
    handleUploadConfirm
  } = useAnalysis();

  return (
    <div className="flex h-auto flex-1 flex-col gap-3 min-h-0 min-w-0 overflow-hidden">
      <DashboardHeader
        mode={mode}
        setMode={setMode}
        date={date}
        setDate={setDate}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />

      <div className="flex h-full flex-1 flex-col min-h-0">
        {activeDatasetId !== -1 ? (
          <FilledStateView 
            tableData={datasetData || []} 
            forecastAggressiveness={forecastAggressiveness}
            setForecastAggressiveness={setForecastAggressiveness}
            clusteringConfig={clusteringConfig}
            setClusteringConfig={setClusteringConfig}
            dataConfig={dataConfig}
            setDataConfig={setDataConfig}
            terminalLogs={terminalLogs}
            cardStatuses={{ dataConfig: dataConfigStatus }}
            onConfirmMapping={handleConfirmMapping}
            onReloadMapping={handleReloadMapping}
          />
        ) : (
          <EmptyStateView
            modeLabel={modeLabel}
            isReady={isReady}
            dateRange={date}
            onUpload={handleOpenUploadModal}
            onRunAnalysis={handleRunAnalysis}
          />
        )}
      </div>
      <FileUploadDemo 
        isOpen={isFileUploadOpen} 
        onClose={() => setIsFileUploadOpen(false)} 
        onUploadConfirm={handleUploadConfirm}
      />
    </div>
  );
}