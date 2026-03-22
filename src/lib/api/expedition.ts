import { apiFetch } from "@/lib/api/client";
import type {
  ExpeditionPreviewCharacter,
  MyCharactersListResponse,
  MySavedCharacter,
} from "@/types/expedition";

const EXPEDITION_PREVIEW_PATH = "/users/me/expedition-preview";

/**
 * POST {BASE_URL}/users/me/expedition-preview
 * Body: `{"representativeCharacterName":"..."}` (UTF-8 JSON)
 * Authorization: Bearer — `client.ts`에서 자동 첨부
 */
export async function postExpeditionPreview(
  representativeCharacterName: string,
): Promise<ExpeditionPreviewCharacter[]> {
  const trimmed = representativeCharacterName.trim();
  if (!trimmed) {
    throw new Error("representativeCharacterName이 비어 있습니다.");
  }

  const jsonString = JSON.stringify({
    representativeCharacterName: trimmed,
  });

  const data = await apiFetch<ExpeditionPreviewCharacter[]>(
    EXPEDITION_PREVIEW_PATH,
    {
      method: "POST",
      jsonString,
    },
  );
  return Array.isArray(data) ? data : [];
}

const CHARACTERS_SYNC_PATH = "/users/me/characters/sync";

/**
 * POST {BASE_URL}/users/me/characters/sync
 * Body: { "characterNames": ["이름1", "이름2"] }
 */
export async function postCharactersSync(characterNames: string[]): Promise<void> {
  const jsonString = JSON.stringify({ characterNames });
  await apiFetch<unknown>(CHARACTERS_SYNC_PATH, {
    method: "POST",
    jsonString,
  });
}

const MY_CHARACTERS_PATH = "/users/me/characters";

/**
 * GET {BASE_URL}/users/me/characters
 * 응답: { count, characters }
 * Authorization: Bearer
 */
export async function getMyCharacters(): Promise<MySavedCharacter[]> {
  const data = await apiFetch<MyCharactersListResponse>(MY_CHARACTERS_PATH, {
    method: "GET",
  });
  if (!data || !Array.isArray(data.characters)) {
    return [];
  }
  return data.characters;
}
