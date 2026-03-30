import axios from "axios";

import { getAccessToken } from "@/lib/auth/storage";

import { getApiBaseUrl } from "./client";

export const axiosApi = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 120_000,
  headers: { Accept: "application/json" },
});

axiosApi.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
