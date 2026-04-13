import { apiFetch } from "@/lib/api/client";
import {
  normalizePartyRole,
  type CharacterDashboardRow,
  type CharactersDashboardResponse,
  type DeleteCharacterResponse,
  type ExpeditionPreviewCharacter,
  type MyCharactersListResponse,
  type MySavedCharacter,
  type PartyRole,
  type PatchCharacterPartyRoleResponse,
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

const CHARACTERS_DASHBOARD_PATH = "/characters/dashboard";

/**
 * GET {BASE_URL}/characters/dashboard
 * 원정대 탭용 캐릭터·주간 레이드·골드 요약 일괄 조회
 */
export async function getCharactersDashboard(): Promise<CharactersDashboardResponse> {
  const data = await apiFetch<CharactersDashboardResponse>(
    CHARACTERS_DASHBOARD_PATH,
    { method: "GET" },
  );
  const raw = Array.isArray(data?.characters) ? data.characters : [];
  const characters: CharacterDashboardRow[] = raw.map((row) => {
    const r = row as CharacterDashboardRow;
    return {
      ...r,
      partyRole: normalizePartyRole(r.partyRole),
      weeklyRaids: Array.isArray(r.weeklyRaids) ? r.weeklyRaids : [],
    };
  });
  return {
    totalCharacterCount: data?.totalCharacterCount ?? 0,
    totalWeeklyGold: data?.totalWeeklyGold ?? 0,
    totalWeeklyBoundGold: data?.totalWeeklyBoundGold ?? 0,
    characters,
  };
}

const CHARACTER_PATH = (characterId: number) => `/characters/${characterId}`;

/**
 * DELETE {BASE_URL}/characters/:characterId
 * Authorization: Bearer — `client.ts`에서 자동 첨부
 */
export async function deleteCharacter(
  characterId: number,
): Promise<DeleteCharacterResponse> {
  return apiFetch<DeleteCharacterResponse>(CHARACTER_PATH(characterId), {
    method: "DELETE",
  });
}

const CHARACTER_PARTY_ROLE_PATH = (characterId: number) =>
  `/characters/${characterId}/party-role`;

/**
 * PATCH {BASE_URL}/characters/:characterId/party-role
 * Body: { "partyRole": "DEALER" | "SUPPORT" }
 */
export async function patchCharacterPartyRole(
  characterId: number,
  partyRole: PartyRole,
): Promise<PatchCharacterPartyRoleResponse> {
  return apiFetch<PatchCharacterPartyRoleResponse>(
    CHARACTER_PARTY_ROLE_PATH(characterId),
    {
      method: "PATCH",
      json: { partyRole },
    },
  );
}
