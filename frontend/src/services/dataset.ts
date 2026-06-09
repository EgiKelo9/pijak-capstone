import axiosInstance from "@/lib/axios";

export async function uploadDataset(file: File) {
  try {
    const response = await axiosInstance.post("/datasets/upload", file, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to upload dataset");
  }
}

export async function getDataset(datasetId: number) {
  try {
    const response = await axiosInstance.get(`/datasets/${datasetId}`);
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch dataset");
  }
}

export async function analyzeColumns(datasetId: number, modelType: string) {
  try {
    const response = await axiosInstance.post(`/datasets/analyze-columns/${datasetId}`, { model_type: modelType });
    return response.data;
  } catch (error) {
    throw new Error("Failed to analyze columns");
  }
}