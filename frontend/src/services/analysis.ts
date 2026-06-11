import axiosInstance from "@/lib/axios";

export async function uploadDataset(file: File) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post("/datasets/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to upload dataset");
  }
}

export async function getDataset(datasetId: number) {
  try {
    const response = await axiosInstance.get(`/datasets/${datasetId}`);
    
    if (typeof response.data === 'string') {
      return response.data;
    } else if (response.data && response.data.data && response.data.data.dataset_file) {
      return response.data.data.dataset_file;
    }
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch dataset");
  }
}

export async function analyzeColumns(datasetId: number, modelType: string, forceReload: boolean = false) {
  try {
    const response = await axiosInstance.post(`/datasets/analyze-columns`, { 
      dataset_id: datasetId, 
      model_type: modelType,
      force_reload: forceReload
    });
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to analyze columns");
  }
}

export async function getDatasetFeatureMetadata(datasetId: number) {
  try {
    const response = await axiosInstance.get(`/datasets/feature-metadata/${datasetId}`);
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch feature metadata");
  }
}

export async function updateDatasetFeatureMetadata(datasetId: number, featureMapping: any) {
  try {
    const response = await axiosInstance.patch(`/datasets/feature-metadata-update/${datasetId}`, featureMapping);
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to update feature metadata");
  }
}

export async function runPreprocess(datasetId: number, modelType: string, forceReload: boolean = false) {
  try {
    const response = await axiosInstance.post(`/datasets/preprocess`, {
      dataset_id: datasetId,
      model_type: modelType,
      force_reload: forceReload
    });
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to run preprocess");
  }
}