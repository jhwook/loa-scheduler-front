import axios from "axios";

import { ApiError } from "@/types/api";

import { axiosApi } from "./axios-instance";

function throwAsApiError(e: unknown): never {
  if (axios.isAxiosError(e)) {
    const status = e.response?.status ?? 0;
    const data = e.response?.data;
    let message = e.message;
    if (data && typeof data === "object" && "message" in data) {
      message = String((data as { message?: unknown }).message ?? message);
    } else if (typeof data === "string" && data.trim()) {
      message = data.trim();
    }
    throw new ApiError(message || "Request failed", status, data);
  }
  throw e;
}

export type RefreshAllCharactersResult = {
  successCount: number;
  failureCount: number;
};

function parseRefreshAllBody(data: unknown): RefreshAllCharactersResult {
  if (!data || typeof data !== "object") {
    return { successCount: 0, failureCount: 0 };
  }
  const o = data as Record<string, unknown>;
  const sc = o.successCount ?? o.success_count;
  const fc = o.failureCount ?? o.failure_count;
  return {
    successCount: typeof sc === "number" ? sc : Number(sc) || 0,
    failureCount: typeof fc === "number" ? fc : Number(fc) || 0,
  };
}

/** POST /characters/:characterId/refresh */
export async function postCharacterRefresh(characterId: number): Promise<void> {
  try {
    await axiosApi.post(`/characters/${characterId}/refresh`);
  } catch (e) {
    throwAsApiError(e);
  }
}

/** POST /characters/refresh-all */
export async function postCharactersRefreshAll(): Promise<RefreshAllCharactersResult> {
  try {
    const { data } = await axiosApi.post<unknown>("/characters/refresh-all");
    return parseRefreshAllBody(data);
  } catch (e) {
    throwAsApiError(e);
  }
}
