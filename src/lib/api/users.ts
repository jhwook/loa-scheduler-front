import { apiFetch } from "@/lib/api/client";
import type { MeResponse, RegisterLostarkApiKeyRequest } from "@/types/user";

const LOSTARK_API_KEY_PATH = "/users/me/lostark-api-key";
const USERS_ME_PATH = "/users/me";

/**
 * POST {BASE_URL}/users/me/lostark-api-key
 * Authorization: Bearer (accessToken) — `client.ts`에서 자동 첨부
 */
export async function registerLostarkApiKey(
  body: RegisterLostarkApiKeyRequest,
): Promise<void> {
  await apiFetch<unknown>(LOSTARK_API_KEY_PATH, {
    method: "POST",
    json: body,
  });
}

function normalizeBooleanLike(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true" || v === "1" || v === "y" || v === "yes") return true;
    if (v === "false" || v === "0" || v === "n" || v === "no") return false;
  }
  return null;
}

/**
 * GET {BASE_URL}/users/me
 * Authorization: Bearer (accessToken) — `client.ts`에서 자동 첨부
 */
export async function getMeHasApiToken(): Promise<boolean> {
  const raw = await apiFetch<MeResponse>(USERS_ME_PATH, {
    method: "GET",
  });

  const root = normalizeBooleanLike(raw.hasApiToken);
  if (root !== null) return root;

  const nested = normalizeBooleanLike(raw.user?.hasApiToken);
  if (nested !== null) return nested;

  return false;
}

export async function getMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>(USERS_ME_PATH, {
    method: "GET",
  });
}
