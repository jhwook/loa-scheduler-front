import {
  AUTH_TOKEN_STORAGE_KEY,
  HAS_API_TOKEN_STORAGE_KEY,
  LOSTARK_API_TOKEN_STORAGE_KEY,
} from "@/lib/constants";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setAccessToken(token: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearAccessToken(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

/** 로그인 시 받은 hasApiToken (또는 등록 완료 후 true로 갱신) */
export function getHasApiToken(): boolean {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(HAS_API_TOKEN_STORAGE_KEY) === "true";
}

export function setHasApiToken(value: boolean): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(HAS_API_TOKEN_STORAGE_KEY, value ? "true" : "false");
}

export function getLostarkApiToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(LOSTARK_API_TOKEN_STORAGE_KEY);
}

export function setLostarkApiToken(value: string | null): void {
  if (!isBrowser()) return;
  if (value && value.trim()) {
    window.localStorage.setItem(LOSTARK_API_TOKEN_STORAGE_KEY, value.trim());
    return;
  }
  window.localStorage.removeItem(LOSTARK_API_TOKEN_STORAGE_KEY);
}

/** 토큰·hasApiToken 플래그 함께 제거 (로그아웃 등) */
export function clearAuthStorage(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(HAS_API_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(LOSTARK_API_TOKEN_STORAGE_KEY);
}
