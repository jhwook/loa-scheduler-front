import { apiFetch } from "@/lib/api/client";
import type {
  CheckNicknameResponse,
  MeResponse,
  RegisterLostarkApiKeyRequest,
  UpdateMyProfileRequest,
} from "@/types/user";

const LOSTARK_API_KEY_PATH = "/users/me/lostark-api-key";
const USERS_ME_PATH = "/users/me";
const USERS_CHECK_NICKNAME_PATH = "/users/me/check-nickname";

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

/**
 * PATCH {BASE_URL}/users/me
 * Authorization: Bearer (accessToken) — `client.ts`에서 자동 첨부
 */
export async function updateMyProfile(
  body: UpdateMyProfileRequest,
): Promise<MeResponse> {
  return apiFetch<MeResponse>(USERS_ME_PATH, {
    method: "PATCH",
    json: body,
  });
}

/**
 * GET {BASE_URL}/users/me/check-nickname?nickname=...
 * Authorization: Bearer (accessToken) — `client.ts`에서 자동 첨부
 */
export async function checkNicknameAvailability(
  nickname: string,
): Promise<CheckNicknameResponse> {
  const q = encodeURIComponent(nickname);
  const raw = await apiFetch<unknown>(`${USERS_CHECK_NICKNAME_PATH}?nickname=${q}`, {
    method: "GET",
  });

  if (typeof raw === "boolean") {
    return { available: raw };
  }

  if (typeof raw === "object" && raw !== null) {
    const r = raw as {
      available?: unknown;
      isAvailable?: unknown;
      exists?: unknown;
      message?: unknown;
    };
    if (typeof r.available === "boolean") {
      return {
        available: r.available,
        message: typeof r.message === "string" ? r.message : undefined,
      };
    }
    if (typeof r.isAvailable === "boolean") {
      return {
        available: r.isAvailable,
        message: typeof r.message === "string" ? r.message : undefined,
      };
    }
    if (typeof r.exists === "boolean") {
      return {
        available: !r.exists,
        message: typeof r.message === "string" ? r.message : undefined,
      };
    }
  }

  return { available: false };
}
