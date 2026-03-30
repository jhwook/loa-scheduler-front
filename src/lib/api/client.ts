import { getAccessToken } from "@/lib/auth/storage";
import { ApiError } from "@/types/api";

export function getApiBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8080";
  return base.replace(/\/$/, "");
}

function getBaseUrl(): string {
  return getApiBaseUrl();
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

/**
 * JSON API 공통 호출.
 * - Bearer 토큰은 자동 첨부 (로그인 등 토큰 없이 호출하는 경우 무시됨)
 * - 백엔드가 쿠키 세션만 쓰면 credentials: 'include' 와 쿠키 관련 헤더를 여기서 확장
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { json, jsonString, headers, ...rest } = options;
  const url = `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

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
    body: bodyPayload !== undefined ? bodyPayload : rest.body,
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
