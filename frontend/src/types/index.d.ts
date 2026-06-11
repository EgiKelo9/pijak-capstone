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

export interface EmptyStateViewProps {
  modeLabel: string;
  isReady: boolean;
  dateRange: DateRange | undefined;
  onUpload: () => void;
  onRunAnalysis: () => void;
}

export type AnalysisMode = 'forecasting' | 'clustering' | 'both';

export interface AnalysisConfig {
  mode: AnalysisMode;
  dateRange: DateRange | undefined;
  datasetId: number
  preferences: {
    forecastAggressiveness: number;
    clusteringConfig: { mode: 'auto' | 'manual'; clusterCount: number };
    dataConfig: DataConfigState;
  }
}

export interface TerminalStep {
  stepId: string;
  text: string;
  status: 'loading' | 'success' | 'error' | 'info';
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