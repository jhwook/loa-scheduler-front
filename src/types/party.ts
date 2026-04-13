/**
 * 공격대(파티 그룹) 도메인 타입.
 * API 연동 시 응답 스키마에 맞춰 조정하면 됩니다.
 */

import type { PartyRole } from "@/types/expedition";

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
  role?: "OWNER" | "MEMBER" | string;
};

/** 공대원 현황 카드에 표시할 주간 레이드 숙제 (레이드명·관문만, 더보기 골드 등은 제외) */
export type PartyCharacterWeeklyRaidHomework = {
  /** 체크 상태 토글·API 동기화용 안정 키 */
  id: string;
  raidName: string;
  /** 예: "3단계", "하드", "나메" */
  difficulty?: string | null;
  /** 관문 번호 (예: 1,2,3...) */
  gateNumber?: number | null;
  /** 예: "1~4관", "하드 1~3관" */
  gatesLabel: string;
  /** 해당 레이드 주간 숙제 완료 여부 */
  isCleared: boolean;
};

/** 멤버가 등록한 캐릭터 (공대 편성·표시용) */
export type PartyGroupMemberCharacter = {
  id: number;
  characterName: string;
  serverName: string;
  /** 아이템 레벨(표시용 문자열, API와 동일 형태 권장) */
  itemAvgLevel: string;
  /** 직업명 — `class-icon` 매핑용 */
  characterClassName?: string | null;
  /** 캐릭터 레벨 (예: 1770) */
  characterLevel?: number;
  /** 전투력 표시 문자열 */
  combatPower?: string | null;
  /** 파티 역할 (미응답 시 DEALER) */
  partyRole: PartyRole;
  /** 주간 레이드 숙제 요약 (관문·난이도만) */
  weeklyRaids?: PartyCharacterWeeklyRaidHomework[];
};

export type PartyGroupMemberWithRoster = PartyGroupMember & {
  characters: PartyGroupMemberCharacter[];
};

/** 목록 + 상세에서 쓰는 확장 모델 */
export type PartyGroupDetail = PartyGroup & {
  ownerUserId?: number;
  members: PartyGroupMemberWithRoster[];
};

/** 공격대 생성 요청 본문 (예시) */
export type PartyGroupCreateInput = {
  name: string;
  description: string;
};

/** GET/PUT /party-groups/:groupId/my-characters 행 */
export type PartyGroupMyCharacterItem = {
  characterId: number;
  characterName: string;
  characterClassName: string | null;
  itemAvgLevel: string | null;
  combatPower: string | null;
  selected: boolean;
  /** API가 내려주면 서버별 그룹 표시 */
  serverName?: string | null;
};
