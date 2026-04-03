/**
 * 공격대(파티 그룹) 도메인 타입.
 * API 연동 시 응답 스키마에 맞춰 조정하면 됩니다.
 */

export type PartyGroup = {
  id: number;
  name: string;
  description: string | null;
  memberCount: number;
  isActive: boolean;
};

export type PartyGroupMember = {
  id: number;
  userId: number;
  username: string;
  nickname?: string | null;
  displayName: string;
};

/** 멤버가 등록한 캐릭터 (공대 편성·표시용) */
export type PartyGroupMemberCharacter = {
  id: number;
  characterName: string;
  serverName: string;
  itemAvgLevel: string;
};

export type PartyGroupMemberWithRoster = PartyGroupMember & {
  characters: PartyGroupMemberCharacter[];
};

/** 목록 + 상세에서 쓰는 확장 모델 */
export type PartyGroupDetail = PartyGroup & {
  members: PartyGroupMemberWithRoster[];
};

/** 공격대 생성 요청 본문 (예시) */
export type PartyGroupCreateInput = {
  name: string;
  description: string;
};
