/** localStorage key for JWT / access token (client-only). */
export const AUTH_TOKEN_STORAGE_KEY =
  process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY ?? "loa_scheduler_access_token";

/** 로그인 응답의 hasApiToken 캐시 (client-only). "true" | "false" 문자열 */
export const HAS_API_TOKEN_STORAGE_KEY =
  "loa_scheduler_has_api_token";

/** 로그인 응답의 lostarkApiToken 캐시 (client-only). */
export const LOSTARK_API_TOKEN_STORAGE_KEY =
  "loa_scheduler_lostark_api_token";
