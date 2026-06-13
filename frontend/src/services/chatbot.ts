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
