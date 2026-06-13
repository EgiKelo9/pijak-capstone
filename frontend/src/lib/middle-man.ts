const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const ML_BASE_URL = process.env.NEXT_PUBLIC_ML_API_URL || "http://localhost:8000/ml/v1";

/**
 * Helper to extract auth token from cookies (modern) or localStorage (legacy)
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; access_token=`);
  if (parts.length === 2) {
    const tokenCookie = parts.pop()?.split(";").shift();
    if (tokenCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(tokenCookie));
        if (parsed.accessToken) return parsed.accessToken;
      } catch {}
      try {
        const parsed = JSON.parse(tokenCookie);
        if (parsed.accessToken) return parsed.accessToken;
      } catch {}
      return tokenCookie;
    }
  }

  // Fallback to localStorage
  return localStorage.getItem("access_token");
}

/**
 * Base fetch wrapper to automatically inject auth tokens
 * and handle global 401 Unauthorized errors.
 */
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      document.cookie = "access_token=; path=/; max-age=0";
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    throw new Error("Unauthorized");
  }

  return response;
}

/**
 * Fetch wrapper explicitly for ML Services
 */
async function fetchMLWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${ML_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      document.cookie = "access_token=; path=/; max-age=0";
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    throw new Error("Unauthorized");
  }

  return response;
}

export async function getAnalysisHistory() {
  const response = await fetchWithAuth("/datasets/analysis-history/user/me");
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch analysis history");
  }
  
  return result.data;
}

export async function analyzeColumns(datasetId: number, modelType: string, forceReload: boolean = false) {
  const response = await fetchMLWithAuth("/openrouter/analyze-columns", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ dataset_id: datasetId, model_type: modelType, force_reload: forceReload }),
  });

  const catchRes = await response.json();
  console.log(catchRes);
  if (!response.ok) {
    throw new Error(`API Error: Gagal menghubungi ML Services`);
  }

  return catchRes.data;
}

export async function getDatasetFeatureMetadata(datasetId: number) {
  const response = await fetchWithAuth(`/datasets/feature-metadata/${datasetId}`);
  
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch feature metadata");
  }
  
  return result.data;
}

export async function updateDatasetFeatureMetadata(datasetId: number, featureMapping: any) {
  const response = await fetchWithAuth(`/datasets/feature-metadata-update/${datasetId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(featureMapping),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to update feature metadata");
  }
  return result.data;
}

export async function uploadDataset(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithAuth("/datasets/upload", {
    method: "POST",
    body: formData,
  });

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const textError = await response.text();
    throw new Error(`Server error: Expected JSON but received HTML/Text. Check backend logs.`);
  }

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to upload dataset");
  }

  return result.data;
}

export async function getDataset(datasetId: number) {
  const response = await fetchWithAuth(`/datasets/${datasetId}`);
  
  const contentType = response.headers.get("content-type");
  let csvString = "";

  if (contentType && contentType.includes("application/json")) {
    const result = await response.json();
    if (!response.ok || result.error) {
      throw new Error(result.message || "Failed to fetch dataset");
    }
    csvString = result.data?.dataset_file || "";
  } else {
    csvString = await response.text();
    if (!response.ok) {
      throw new Error(`Server error: ${csvString.substring(0, 100)}`);
    }
  }

  return csvString;
}

export async function mockLogin(email: string, password: string) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();
  if (response.ok && result.data?.access_token) {
    return result.data.access_token;
  } else {
    throw new Error("Failed to fetch mock token");
  }
}

export const fetchUserDatasets = async () => {
  const token = getAuthToken();
  const response = await fetch("http://localhost:5000/api/v1/datasets/user/me", {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  
  const result = await response.json();
  
  if (response.ok && result.data) {
    return Array.isArray(result.data) ? result.data : result.data.datasets || [];
  }
  
  throw new Error(result.message || "Failed to fetch datasets");
};

export const runAnalysisPipeline = async (jobId: string, datasetId: number, modelType: string) => {
  const token = getAuthToken();
  const response = await fetch("http://localhost:8000/ml/v1/preprocess/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      job_id: jobId,
      dataset_id: datasetId,
      model_type: modelType,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to start analysis pipeline");
  }

  return await response.text();
};
