import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

import {
  clearSessionAndRedirectToLogin,
  getApiBaseUrl,
  refreshAuthSession,
} from "./client";
import {
  getAccessToken,
  getRefreshToken,
} from "@/lib/auth/storage";

export const axiosApi = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 120_000,
  headers: { Accept: "application/json" },
});

type RetryConfig = InternalAxiosRequestConfig & { _auth401Retried?: boolean };

axiosApi.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

axiosApi.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const cfg = error.config as RetryConfig | undefined;
    const status = error.response?.status;

    if (!cfg || status !== 401 || cfg._auth401Retried) {
      return Promise.reject(error);
    }

    const rel = String(cfg.url ?? "");
    if (
      rel.includes("/auth/login") ||
      rel.includes("/auth/signup") ||
      rel.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    if (!getRefreshToken()) {
      return Promise.reject(error);
    }

    cfg._auth401Retried = true;
    const ok = await refreshAuthSession();
    if (!ok) {
      clearSessionAndRedirectToLogin();
      return Promise.reject(error);
    }

    const token = getAccessToken();
    if (token) {
      cfg.headers.set("Authorization", `Bearer ${token}`);
    }

    return axiosApi(cfg);
  },
);
