/**
 * 백엔드 `GET /party-groups/:groupId` 응답 타입 (raw).
 * 프론트 렌더링용 타입(`types/party.ts`)으로 변환해 사용한다.
 */

export type PartyGroupDetailResponse = {
  id: number;
  name: string;
  description: string | null;
  ownerUserId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members: PartyGroupMemberResponse[];
};

export type PartyGroupMemberResponse = {
  id: number;
  userId: number;
  username: string;
  nickname: string | null;
  displayName: string;
  role: "OWNER" | "MEMBER" | string;
  isFavorite?: boolean;
  isMe?: boolean;
  joinedAt: string;
  characters: PartyCharacterResponse[];
};

export type PartyCharacterResponse = {
  id: number;
  characterName: string;
  serverName: string;
  characterClassName: string | null;
  characterLevel: number | null;
  itemAvgLevel: string | null;
  combatPower: string | null;
  lastSyncedAt: string | null;
  weeklyRaids: PartyWeeklyRaidResponse[] | null;
  partyRole?: string | null;
};

export type PartyWeeklyRaidResponse = {
  id: number;
  isCleared: boolean;
  isGoldEarned: boolean;
  isExtraRewardSelected: boolean;
  extraRewardCostSnapshot: number | null;
  raidGateInfo: {
    id: number;
    difficulty: string;
    gateNumber: number;
    gateName: string;
    rewardGold: number;
    boundGold: number;
    isSingleMode: boolean;
    raidInfo: {
      id: number;
      raidName: string;
    };
  };
};

/** GET /party-groups/:groupId/characters — 공개 캐릭터 기준 로스터 */
export type PartyGroupPublicCharacterResponse = {
  characterId: number;
  characterName: string;
  characterClassName: string | null;
  serverName: string | null;
  characterLevel: number | null;
  itemAvgLevel: string | null;
  itemMaxLevel: string | null;
  combatPower: string | null;
  lastSyncedAt: string | null;
  weeklyRaids: PartyWeeklyRaidResponse[] | null;
  partyRole?: string | null;
};

export type PartyGroupCharactersMemberResponse = {
  memberId: number;
  userId: number;
  username: string;
  nickname: string | null;
  displayName: string;
  role: string;
  isFavorite?: boolean;
  isMe?: boolean;
  characters: PartyGroupPublicCharacterResponse[];
};

export type PartyGroupCharactersResponse = {
  groupId: number;
  groupName: string;
  members: PartyGroupCharactersMemberResponse[];
};

