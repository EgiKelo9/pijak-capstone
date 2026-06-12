import axiosInstance from '@/lib/axios';
import { 
  ForecastingRunResponse, 
  ForecastingHistoryItem, 
  ForecastingResultData 
} from '@/types';

export interface ForecastingRunPayload {
  dataset_id: number;
  col_date: string;
  col_target: string;
  col_regressors: string[];
  horizon: number;
  freq: string;
}

export const runForecasting = async (payload: ForecastingRunPayload): Promise<ForecastingRunResponse> => {
  const response = await axiosInstance.post('/forecasting/run', payload);
  // The backend wraps responses in StandardResponse. 
  // `axiosInstance` handles data extraction if properly configured, but let's assume it returns { data: { code, error, message, data } }
  return response.data.data;
};

export const getForecastingResult = async (analysisId: number): Promise<ForecastingResultData> => {
  const response = await axiosInstance.get(`/forecasting/result/${analysisId}`);
  return response.data.data;
};

export const getForecastingHistory = async (): Promise<ForecastingHistoryItem[]> => {
  const response = await axiosInstance.get('/forecasting/history');
  return response.data.data;
};
