import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/lib/auth/storage";
import { ApiError } from "@/types/api";

export function getApiBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8080";
  return base.replace(/\/$/, "");
}

function normalizeApiPath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

type JsonBody = Record<string, unknown> | unknown[] | null;

function buildAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export type RequestOptions = Omit<RequestInit, "body"> & {
  json?: JsonBody;
  /** `json`과 동일한 용도이지만, 직렬화된 문자열을 그대로 보낼 때 사용 */
  jsonString?: string;
};

/** 로그인·토큰 재발급 등 — 401 시 refresh 재시도하지 않음 */
function isAuthExemptPath(path: string): boolean {
  const p = normalizeApiPath(path);
  return (
    p === "/auth/login" ||
    p === "/auth/signup" ||
    p === "/auth/refresh"
  );
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * POST /auth/refresh — fetch 직접 사용(apiFetch와 순환·재귀 방지).
 * 동시 401 시 한 번만 호출되도록 공유 Promise 사용.
 */
export function refreshAuthSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  const run = (async (): Promise<boolean> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    const url = `${getApiBaseUrl()}/auth/refresh`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Accept: "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      const isJson = contentType.includes("application/json");
      const parsed = isJson
        ? await res.json().catch(() => null)
        : await res.text();

      if (!res.ok) return false;
      if (!parsed || typeof parsed !== "object") return false;

      const o = parsed as Record<string, unknown>;
      const access =
        typeof o.accessToken === "string"
          ? o.accessToken
          : typeof o.token === "string"
            ? o.token
            : null;
      const nextRefresh =
        typeof o.refreshToken === "string"
          ? o.refreshToken
          : typeof o.refresh_token === "string"
            ? o.refresh_token
            : null;

      if (!access || !nextRefresh) return false;
      setAccessToken(access);
      setRefreshToken(nextRefresh);
      return true;
    } catch {
      return false;
    }
  })();

  refreshInFlight = run.finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export function clearSessionAndRedirectToLogin(): void {
  clearAuthStorage();
  if (typeof window === "undefined") return;
  const path = window.location.pathname || "";
  if (path === "/login" || path.startsWith("/login/")) return;
  window.location.assign("/login");
}

async function executeJsonFetchOnce<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  const { json, jsonString, headers, ...rest } = options;
  const url = `${getApiBaseUrl()}${normalizeApiPath(path)}`;

  const initHeaders = new Headers(headers);
  if (json !== undefined || jsonString !== undefined) {
    initHeaders.set("Content-Type", "application/json; charset=utf-8");
  }
  const authHeaders = new Headers(buildAuthHeaders());
  authHeaders.forEach((value, key) => {
    initHeaders.set(key, value);
  });

  const bodyPayload =
    jsonString !== undefined
      ? jsonString
      : json !== undefined
        ? JSON.stringify(json)
        : undefined;

  const res = await fetch(url, {
    ...rest,
    headers: initHeaders,
    body: bodyPayload,
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const parsed = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    let message = res.statusText;
    if (typeof parsed === "object" && parsed !== null && "message" in parsed) {
      message = String(
        (parsed as { message?: unknown }).message ?? res.statusText,
      );
    } else if (typeof parsed === "string") {
      const t = parsed.trim();
      if (t.startsWith("{")) {
        try {
          const j = JSON.parse(t) as { message?: string; statusCode?: number };
          if (typeof j.message === "string") message = j.message;
        } catch {
          /* ignore */
        }
      } else if (t) {
        message = t;
      }
    }
    throw new ApiError(message || "Request failed", res.status, parsed);
  }

  return parsed as T;
}

/**
 * JSON API 공통 호출.
 * - Bearer 토큰은 자동 첨부 (로그인 등 토큰 없이 호출하는 경우 무시됨)
 * - 401 시 refresh 후 1회 재시도
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const exempt = isAuthExemptPath(path);

  try {
    return await executeJsonFetchOnce<T>(path, options);
  } catch (err) {
    if (
      !(err instanceof ApiError) ||
      err.status !== 401 ||
      exempt ||
      !getRefreshToken()
    ) {
      throw err;
    }

    const refreshed = await refreshAuthSession();
    if (!refreshed) {
      clearSessionAndRedirectToLogin();
      throw err;
    }

    return await executeJsonFetchOnce<T>(path, options);
  }
}
