import { apiFetch } from "@/lib/api/client";
import type { PartyPoolOrderedRow } from "@/lib/party-pool-order";
import type {
  PartyGroupCreateInput,
  PartyGroupDetail,
  PartyGroupMyCharacterItem,
} from "@/types/party";
import type { PartyGroupCharactersResponse } from "@/types/party-api";
import { normalizePartyRole } from "@/types/expedition";

const PARTY_GROUPS_PATH = "/party-groups";
const PARTY_GROUPS_MY_PATH = "/party-groups/my";
const PARTY_GROUPS_DETAIL_PATH = (groupId: number) => `/party-groups/${groupId}`;
const PARTY_GROUPS_LEAVE_PATH = (groupId: number) => `/party-groups/${groupId}/leave`;
const PARTY_GROUP_MEMBER_NICKNAME_PATH = (groupId: number, memberId: number) =>
  `/party-groups/${groupId}/members/${memberId}/nickname`;
const PARTY_GROUP_MY_CHARACTERS_PATH = (groupId: number) =>
  `/party-groups/${groupId}/my-characters`;
const PARTY_GROUP_FAVORITES_PATH = (groupId: number) =>
  `/party-groups/${groupId}/favorites`;
const PARTY_GROUP_FAVORITE_PATH = (groupId: number, favoriteUserId: number) =>
  `/party-groups/${groupId}/favorites/${favoriteUserId}`;

type RawPartyGroup = {
  id?: number | string;
  name?: string;
  description?: string | null;
  memberCount?: number | string | null;
  isActive?: boolean | string | number | null;
};

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

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function normalizePartyGroup(raw: RawPartyGroup): PartyGroupDetail {
  const id = toNumber(raw.id) ?? 0;
  const memberCount = toNumber(raw.memberCount) ?? 0;
  const active = normalizeBooleanLike(raw.isActive) ?? true;
  return {
    id,
    name: raw.name ?? "",
    description: raw.description ?? null,
    memberCount,
    isActive: active,
    // 목록 API(/my)는 보통 멤버/캐릭터 상세를 안 내려줌 → 상세 페이지에서 채우면 됨
    members: [],
  };
}

/**
 * POST {BASE_URL}/party-groups
 * Authorization: Bearer — `apiFetch`에서 자동 첨부
 * body: { name, description }
 */
export async function createPartyGroup(
  body: PartyGroupCreateInput,
): Promise<PartyGroupDetail> {
  const raw = await apiFetch<RawPartyGroup>(PARTY_GROUPS_PATH, {
    method: "POST",
    json: {
      name: body.name,
      description: body.description,
    },
  });
  return normalizePartyGroup(raw);
}

/**
 * GET {BASE_URL}/party-groups/my
 * Authorization: Bearer — `apiFetch`에서 자동 첨부
 */
export async function getMyPartyGroups(): Promise<PartyGroupDetail[]> {
  const raw = await apiFetch<RawPartyGroup[]>(PARTY_GROUPS_MY_PATH, {
    method: "GET",
  });
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizePartyGroup);
}

/**
 * GET {BASE_URL}/party-groups/:groupId
 * Authorization: Bearer — `apiFetch`에서 자동 첨부
 */
export async function getPartyGroupDetail(groupId: number): Promise<unknown> {
  return apiFetch<unknown>(PARTY_GROUPS_DETAIL_PATH(groupId), {
    method: "GET",
  });
}

const PARTY_GROUP_CHARACTERS_PATH = (groupId: number) =>
  `${PARTY_GROUPS_DETAIL_PATH(groupId)}/characters`;

const PARTY_GROUP_PARTY_BUILDER_CHARACTERS_PATH = (groupId: number) =>
  `${PARTY_GROUPS_DETAIL_PATH(groupId)}/party-builder-characters`;

/**
 * GET {BASE_URL}/party-groups/:groupId/characters
 * 공격대에 공개된 캐릭터 기준 멤버·로스터
 */
export async function getPartyGroupCharacters(
  groupId: number,
): Promise<PartyGroupCharactersResponse> {
  return apiFetch<PartyGroupCharactersResponse>(PARTY_GROUP_CHARACTERS_PATH(groupId), {
    method: "GET",
  });
}

function extractPartyBuilderCharactersArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const keys = [
      "characters",
      "partyBuilderCharacters",
      "data",
      "items",
      "rows",
    ] as const;
    for (const k of keys) {
      const list = o[k];
      if (Array.isArray(list)) return list;
    }
  }
  return [];
}

function formatItemAvgLevelPartyBuilder(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(value);
  }
  if (typeof value === "string") {
    const t = value.replace(/,/g, "").trim();
    if (t) return t;
  }
  return "0";
}

function formatCombatPowerPartyBuilder(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string") {
    const t = value.trim();
    return t || null;
  }
  return null;
}

function normalizePartyBuilderPoolRow(raw: unknown): PartyPoolOrderedRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  /** 공개 캐릭터 API와 동일하게 `characterId`로 올 수 있음 */
  const id = toNumber(r.id) ?? toNumber(r.characterId);
  if (id === null || id <= 0) return null;
  const characterName =
    typeof r.characterName === "string" ? r.characterName.trim() : "";
  const ownerRaw =
    typeof r.ownerDisplayName === "string" ? r.ownerDisplayName.trim() : "";
  const ownerDisplayName = ownerRaw || "—";
  const serverName =
    typeof r.serverName === "string" && r.serverName.trim()
      ? r.serverName.trim()
      : "";
  const characterClassName =
    typeof r.characterClassName === "string" && r.characterClassName.trim()
      ? r.characterClassName.trim()
      : null;
  const character: PartyPoolOrderedRow["character"] = {
    id,
    characterName: characterName || `캐릭터 #${id}`,
    serverName,
    itemAvgLevel: formatItemAvgLevelPartyBuilder(r.itemAvgLevel),
    characterClassName,
    combatPower: formatCombatPowerPartyBuilder(r.combatPower),
    partyRole: normalizePartyRole(r.partyRole),
  };
  return { ownerDisplayName, character };
}

/**
 * GET {BASE_URL}/party-groups/:groupId/party-builder-characters
 * 파티 편성용 공개 캐릭터 전체 목록 (장비 레벨 내림차순, 서버 정렬 순서 유지)
 */
export async function getPartyBuilderCharacters(
  groupId: number,
): Promise<PartyPoolOrderedRow[]> {
  const raw = await apiFetch<unknown>(
    PARTY_GROUP_PARTY_BUILDER_CHARACTERS_PATH(groupId),
    { method: "GET" },
  );
  return extractPartyBuilderCharactersArray(raw)
    .map(normalizePartyBuilderPoolRow)
    .filter((x): x is PartyPoolOrderedRow => x !== null);
}

type PartyGroupActionResponse = {
  message?: string;
};

/**
 * POST {BASE_URL}/party-groups/:groupId/leave
 * 일반 공대원 탈퇴. (공대장은 조건에 따라 실패할 수 있음)
 */
export async function leavePartyGroup(
  groupId: number,
): Promise<PartyGroupActionResponse> {
  return apiFetch<PartyGroupActionResponse>(PARTY_GROUPS_LEAVE_PATH(groupId), {
    method: "POST",
  });
}

/**
 * DELETE {BASE_URL}/party-groups/:groupId
 * 공대장 전용 공격대 삭제.
 */
export async function deletePartyGroup(
  groupId: number,
): Promise<PartyGroupActionResponse> {
  return apiFetch<PartyGroupActionResponse>(PARTY_GROUPS_DETAIL_PATH(groupId), {
    method: "DELETE",
  });
}

/**
 * PATCH {BASE_URL}/party-groups/:groupId/members/:memberId/nickname
 * 그룹 내 별명 수정
 */
export async function updatePartyGroupMemberNickname(
  groupId: number,
  memberId: number,
  nickname: string,
): Promise<PartyGroupActionResponse> {
  return apiFetch<PartyGroupActionResponse>(
    PARTY_GROUP_MEMBER_NICKNAME_PATH(groupId, memberId),
    {
      method: "PATCH",
      json: { nickname },
    },
  );
}

function normalizeMyCharacterRow(raw: unknown): PartyGroupMyCharacterItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const characterId = toNumber(r.characterId);
  if (characterId === null) return null;
  const selected = normalizeBooleanLike(r.selected) ?? false;
  return {
    characterId,
    characterName: typeof r.characterName === "string" ? r.characterName : "",
    characterClassName:
      typeof r.characterClassName === "string" ? r.characterClassName : null,
    itemAvgLevel: typeof r.itemAvgLevel === "string" ? r.itemAvgLevel : null,
    combatPower: typeof r.combatPower === "string" ? r.combatPower : null,
    selected,
    serverName:
      typeof r.serverName === "string" && r.serverName.trim()
        ? r.serverName.trim()
        : null,
  };
}

function extractMyCharactersArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const list = (raw as { characters?: unknown }).characters;
    if (Array.isArray(list)) return list;
  }
  return [];
}

/**
 * GET {BASE_URL}/party-groups/:groupId/my-characters
 */
export async function getPartyGroupMyCharacters(
  groupId: number,
): Promise<PartyGroupMyCharacterItem[]> {
  const raw = await apiFetch<unknown>(PARTY_GROUP_MY_CHARACTERS_PATH(groupId), {
    method: "GET",
  });
  return extractMyCharactersArray(raw)
    .map(normalizeMyCharacterRow)
    .filter((x): x is PartyGroupMyCharacterItem => x !== null);
}

/**
 * PUT {BASE_URL}/party-groups/:groupId/my-characters
 * 체크된 캐릭터 id만 전달 (미선택 시 빈 배열)
 */
export async function putPartyGroupMyCharacters(
  groupId: number,
  characterIds: number[],
): Promise<unknown> {
  return apiFetch<unknown>(PARTY_GROUP_MY_CHARACTERS_PATH(groupId), {
    method: "PUT",
    json: { characterIds },
  });
}

function extractFavoriteUserId(row: unknown): number | null {
  if (typeof row === "number" && Number.isFinite(row)) return row;
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const id =
    toNumber(r.favoriteUserId) ??
    toNumber(r.favorite_user_id) ??
    toNumber(r.userId) ??
    toNumber(r.user_id) ??
    toNumber(r.id);
  return id ?? null;
}

/** GET /party-groups/:groupId/favorites */
export async function getPartyGroupFavorites(groupId: number): Promise<number[]> {
  const raw = await apiFetch<unknown>(PARTY_GROUP_FAVORITES_PATH(groupId), {
    method: "GET",
  });
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? ((raw as { favorites?: unknown[]; data?: unknown[] }).favorites ??
        (raw as { favorites?: unknown[]; data?: unknown[] }).data ??
        [])
      : [];
  return list
    .map(extractFavoriteUserId)
    .filter((id): id is number => typeof id === "number" && id > 0);
}

/** POST /party-groups/:groupId/favorites */
export async function addPartyGroupFavorite(
  groupId: number,
  favoriteUserId: number,
): Promise<void> {
  await apiFetch<unknown>(PARTY_GROUP_FAVORITES_PATH(groupId), {
    method: "POST",
    json: { favoriteUserId },
  });
}

/** DELETE /party-groups/:groupId/favorites/:favoriteUserId */
export async function removePartyGroupFavorite(
  groupId: number,
  favoriteUserId: number,
): Promise<void> {
  await apiFetch<unknown>(PARTY_GROUP_FAVORITE_PATH(groupId, favoriteUserId), {
    method: "DELETE",
  });
}

