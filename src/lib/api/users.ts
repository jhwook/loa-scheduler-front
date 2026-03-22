import { apiFetch } from "@/lib/api/client";
import type { RegisterLostarkApiKeyRequest } from "@/types/user";

const LOSTARK_API_KEY_PATH = "/users/me/lostark-api-key";

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
