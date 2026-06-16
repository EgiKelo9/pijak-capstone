import axiosInstance from '@/lib/axios';
import { TargetTask } from '@/types';

export interface ChatbotRequestPayload {
  task_id: string;
  message: string;
  attachment?: any;
}

export interface ChatbotResponseData {
  message: string;
  metadata?: any;
}

export const sendChatbotMessage = async (
  targetTask: TargetTask,
  payload: ChatbotRequestPayload
): Promise<ChatbotResponseData> => {
  const response = await axiosInstance.post(`/chatbot/${targetTask}`, payload);
  return response.data.data;
};

export interface ChatMessageData {
  message: string;
  role: 'user' | 'assistant';
  created_at: string;
}

export const getChatbotHistory = async (
  analysisId: number
): Promise<ChatMessageData[]> => {
  const response = await axiosInstance.get(`/chatbot/history/${analysisId}`);
  return response.data.data;
};
