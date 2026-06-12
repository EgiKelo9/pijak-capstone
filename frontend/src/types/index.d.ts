import { DateRange } from 'react-day-picker';

export type AuthCookieValue = {
  accessToken: string;
  tokenType?: string;
};

export interface User extends AuthCookieValue {
  id?: string;
  name: string;
  email: string;
  password?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date;
}

export interface ITerminalContext {
  logs: TerminalStep[];
  setLogs: React.Dispatch<React.SetStateAction<TerminalStep[]>>;
  isAnalysisReady: boolean;
  setIsAnalysisReady: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface EmptyStateViewProps {
  modeLabel: string;
  isReady: boolean;
  dateRange: DateRange | undefined;
  onUpload: () => void;
  onRunAnalysis: () => void;
}

export type AnalysisMode = 'forecasting' | 'clustering' | 'both';
export type ForecastAggressivenessType = 'aggressive' | 'balance' | 'conservative';

export interface ForecastingPreferenceProps {
  value: ForecastAggressivenessType;
  onChange: (value: ForecastAggressivenessType) => void;
}

export interface AnalysisConfig {
  mode: AnalysisMode;
  dateRange: DateRange | undefined;
  datasetId: number
  preferences: {
    forecastAggressiveness: ForecastAggressivenessType;
    clusteringConfig: { mode: 'auto' | 'manual'; clusterCount: number };
    dataConfig: DataConfigState;
  }
}

export interface TerminalStep {
  stepId: string;
  text: string;
  status: 'loading' | 'success' | 'error' | 'info';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export interface TerminalLogProps {
  logs: TerminalStep[];
}

export interface DataQualityProps {
  data: any[];
}

export interface DataConfigState {
  availableColumns: string[];
  dateColumn: string;
  targetColumn: string;
  includedColumns: string[];
}

export interface DataConfigurationProps {
  config: DataConfigState;
  onChange: (newConfig: DataConfigState) => void;
  onConfirm?: () => void;
  onReload?: () => void;
  isProcessing?: boolean;
}

export interface AnalysisConfig {
  mode: AnalysisMode;
  dateRange: DateRange | undefined;
  datasetId: number
  preferences: {
    forecastAggressiveness: ForecastAggressivenessType;
    clusteringConfig: { mode: 'auto' | 'manual'; clusterCount: number };
    dataConfig: DataConfigState;
  }
}

export type CardId = 'terminal' | 'dataConfig' | 'dataQuality' | 'forecasting' | 'clustering';
export type CardStatusMap = Partial<Record<CardId, StatusType>>;

export interface ProcessDatasetRequest {
  dataset_id: number;
  model_type: string;
  force_reload?: boolean;
  job_id?: string;
}

export interface FilledStateViewProps {
  tableData: any;
  forecastAggressiveness: ForecastAggressivenessType;
  setForecastAggressiveness: (val: ForecastAggressivenessType) => void;
  clusteringConfig: ClusteringConfig;
  setClusteringConfig: (config: ClusteringConfig) => void;
  dataConfig: DataConfigState;
  setDataConfig: (config: DataConfigState) => void;
  terminalLogs: TerminalStep[];
  cardStatuses?: CardStatusMap;
  onConfirmMapping?: () => void;
  onReloadMapping?: () => void;
}

export interface TrendDataPoint {
  date: string;
  value: number;
}

export interface FeatureDetail {
  name: string;
  mode: number;
  mean: number;
  max: number;
  min: number;
  influence: number;
}

export interface ForecastingMetrics {
  confidence_percentage: number;
  confidence_value: number;
  mae: number;
  mape: number;
  mse: number;
  rmse: number;
  r2: number;
}

export interface ForecastingResultData {
  metrics: ForecastingMetrics;
  trend_data: TrendDataPoint[];
  feature_importances: FeatureDetail[];
  insight_summary: string;
}

export interface ForecastingRunResponse {
  analysis_id: number;
  status: string;
  result: ForecastingResultData;
}

export interface ForecastingHistoryItem {
  analysis_id: number;
  dataset_id: number | null;
  status: string;
  created_at: string;
  result: ForecastingResultData | null;
}

export interface ClusteringConfig {
  mode: 'auto' | 'manual';
  clusterCount: number;
}

export interface ClusteringPreferenceProps {
  config: ClusteringConfig;
  onChange: (config: ClusteringConfig) => void;
}