import axios from "axios";
import { AuthCookieValue } from "@/types";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

function getCookie(name: string): string | null {
  if (typeof window === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }

  return null;
}

function getAuthorizationHeader(): string | null {
  const tokenCookie = getCookie("access_token");

  if (!tokenCookie) return null;

  let accessToken = tokenCookie;
  let tokenType = "Bearer";

  try {
    const parsedCookie = JSON.parse(tokenCookie) as Partial<AuthCookieValue>;

    if (typeof parsedCookie.accessToken === "string") {
      accessToken = parsedCookie.accessToken;
    }

    if (typeof parsedCookie.tokenType === "string" && parsedCookie.tokenType.trim()) {
      tokenType = parsedCookie.tokenType;
    }
  } catch {
    const tokenTypeCookie = getCookie("token_type");

    if (tokenTypeCookie?.trim()) {
      tokenType = tokenTypeCookie;
    }
  }

  return `${tokenType} ${accessToken}`;
}

axiosInstance.interceptors.request.use(
  (config) => {
    const authorization = getAuthorizationHeader();

    if (authorization) {
      config.headers.Authorization = authorization;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;