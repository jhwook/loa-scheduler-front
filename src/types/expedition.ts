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
  createdAt: string;
  updatedAt: string;
};
