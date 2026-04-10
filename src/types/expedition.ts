import type { CharacterWeeklyRaidItem } from "@/types/raid";

/** POST /users/me/expedition-preview 응답 항목 */
export type ExpeditionPreviewCharacter = {
  serverName: string;
  characterName: string;
  characterLevel: number;
  characterClassName: string;
  itemAvgLevel: string;
};

/** 미리보기 검색 요청 (POST /users/me/expedition-preview) */
export type ExpeditionPreviewRequest = {
  representativeCharacterName: string;
};

/** 캐릭터 동기화 (POST /users/me/characters/sync) */
export type CharactersSyncRequest = {
  characterNames: string[];
};

/** GET /users/me/characters 응답 본문 */
export type MyCharactersListResponse = {
  count: number;
  characters: MySavedCharacter[];
};

/** GET /users/me/characters 의 characters[] 항목 */
export type MySavedCharacter = {
  id: number;
  characterName: string;
  serverName: string;
  characterClassName: string;
  characterLevel: number;
  /** 캐릭터 초상 이미지 URL (없으면 플레이스홀더) */
  characterImage?: string | null;
  itemAvgLevel: string;
  itemMaxLevel: string | null;
  expeditionLevel: number;
  /** HTML 문자열 (표시 시 sanitize 권장) */
  title: string;
  guildName: string | null;
  townName: string | null;
  pvpGradeName: string | null;
  combatPower: string;
  /** 서버에서 마지막으로 동기화된 시각 (ISO 8601) */
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

/** GET /characters/dashboard 의 characters[] 항목 */
export type CharacterDashboardRow = {
  id: number;
  characterName: string;
  /** 캐릭터 초상 이미지 URL (API 제공 시 사용) */
  characterImage?: string | null;
  serverName: string | null;
  characterClassName: string | null;
  characterLevel: number | null;
  itemAvgLevel: string | null;
  itemMaxLevel: string | null;
  combatPower: string | null;
  lastSyncedAt: string | null;
  weeklyGoldTotal: number;
  weeklyBoundGoldTotal: number;
  weeklyRaids: CharacterWeeklyRaidItem[];
};

/** GET /characters/dashboard 응답 */
export type CharactersDashboardResponse = {
  totalCharacterCount: number;
  totalWeeklyGold: number;
  totalWeeklyBoundGold: number;
  characters: CharacterDashboardRow[];
};

/** DELETE /characters/:characterId 응답 */
export type DeleteCharacterResponse = {
  message?: string;
  deletedCharacter?: {
    id: number;
    characterName: string;
  };
};

/** 대시보드 한 행 → 카드용 `MySavedCharacter` (미제공 필드는 빈 값) */
export function mapDashboardCharacterToMySaved(
  c: CharacterDashboardRow,
): MySavedCharacter {
  return {
    id: c.id,
    characterName: c.characterName,
    serverName: c.serverName ?? "",
    characterClassName: c.characterClassName ?? "",
    characterLevel: c.characterLevel ?? 0,
    characterImage: c.characterImage ?? null,
    itemAvgLevel: c.itemAvgLevel ?? "",
    itemMaxLevel: c.itemMaxLevel,
    expeditionLevel: 0,
    title: "",
    guildName: null,
    townName: null,
    pvpGradeName: null,
    combatPower: c.combatPower ?? "",
    lastSyncedAt: c.lastSyncedAt,
    createdAt: "",
    updatedAt: "",
  };
}
