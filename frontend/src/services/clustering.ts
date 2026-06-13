import axiosInstance from '@/lib/axios';
import {
  ClusteringRunResponse,
  ClusteringHistoryItem,
  ClusteringResultData
} from '@/types';

export interface ClusteringRunPayload {
  dataset_id: number;
  col_product: string;
  col_fitur: string[];
  data?: Record<string, any>[];
  n_clusters?: number | null;
}

export const runClustering = async (payload: ClusteringRunPayload): Promise<ClusteringRunResponse> => {
  const response = await axiosInstance.post('/clustering/run', payload);
  return response.data.data;
};

export const getClusteringResult = async (analysisId: number): Promise<ClusteringResultData> => {
  const response = await axiosInstance.get(`/clustering/result/${analysisId}`);
  return response.data.data;
};

export const getClusteringHistory = async (): Promise<ClusteringHistoryItem[]> => {
  const response = await axiosInstance.get('/clustering/history');
  return response.data.data;
};
