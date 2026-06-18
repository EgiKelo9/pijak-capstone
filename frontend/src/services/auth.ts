import axiosInstance from "../lib/axios";

export const register = async (name: string, email: string, password: string, passwordConfirmation: string) => {
  try {
    const passwordsMatch = password === passwordConfirmation;
    if (!passwordsMatch) {
      throw new Error("Passwords do not match");
    }

    const response = await axiosInstance.post("/auth/register", {
      name,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw new Error("Registration failed");
  }
}

export const login = async (email: string, password: string) => {
  try {
    const response = await axiosInstance.post("/auth/login", {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw new Error("Login failed");
  }
}

export const logout = async () => {
  try {
    const response = await axiosInstance.post("/auth/logout");
    return response.data;
  } catch (error) {
    throw new Error("Logout failed");
  }
}

/** Helper untuk dev SSO login — mengembalikan access_token string secara langsung */
export const mockLogin = async (email: string, password: string): Promise<string> => {
  try {
    const response = await axiosInstance.post("/auth/login", { email, password });
    const token = response.data?.data?.access_token;
    if (!token) throw new Error("Token not found in response");
    return token;
  } catch (error) {
    throw new Error("Failed to fetch mock token");
  }
}