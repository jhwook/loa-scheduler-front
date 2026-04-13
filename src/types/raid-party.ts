import { normalizeRaidPartySize } from "@/types/raid";

export type RaidPartyStatus = "DRAFT" | "CONFIRMED" | "COMPLETED";

/** GET /raid-info 행 — 파티 생성 시 레이드 선택용 */
export type RaidInfoOption = {
  id: number;
  raidName: string;
  description?: string | null;
  partySize: number;
};

export type RaidPartyRaidInfoRef = {
  id: number;
  raidName: string;
  partySize: number;
};

export type RaidParty = {
  id: number;
  groupId: number;
  raidInfoId: number;
  title: string | null;
  partySize: number;
  status: RaidPartyStatus;
  createdByUserId: number;
  raidInfo?: RaidPartyRaidInfoRef;
};

export type CreateRaidPartyRequest = {
  groupId: number;
  raidInfoId: number;
  /** 비우면 요청에서 생략 */
  title?: string;
};

/** GET /raid-parties/group/:groupId 목록 행 */
export type RaidPartyListItem = {
  id: number;
  title: string | null;
  raidName: string;
  partySize: number;
  createdByUserId: number;
  createdByUsername?: string | null;
  /** 현재 슬롯에 배치된 인원 수 */
  placedMemberCount: number;
  status: RaidPartyStatus;
};

/** 슬롯에 올라간 캐릭터 (상세) */
export type RaidPartySlotCharacter = {
  id: number;
  characterName: string;
  /** 캐릭터 소유자 표시명 (API `ownerDisplayName`) */
  ownerDisplayName?: string | null;
  partyRole?: "DEALER" | "SUPPORT" | string | null;
  characterClassName?: string | null;
  itemAvgLevel?: string | null;
  combatPower?: string | null;
};

/** GET /raid-parties/:id 의 멤버 배치 */
export type RaidPartyMemberAssignment = {
  /**
   * 레이드 파티 멤버(배치) id — PATCH/DELETE `/members/:memberId` 경로용.
   * API가 내려주지 않으면 슬롯 이동·제거 UI 비활성.
   */
  memberId?: number;
  /** 전역 슬롯 인덱스 0..partySize-1 (또는 API가 팀+슬롯으로 주면 변환) */
  slotIndex: number;
  character: RaidPartySlotCharacter;
};

/** GET /raid-parties/:id 상세 */
export type RaidPartyDetail = RaidParty & {
  members: RaidPartyMemberAssignment[];
};

/** DELETE /raid-parties/:id 성공 본문 예시 */
export type DeleteRaidPartyResult = {
  message?: string | null;
  deletedRaidParty?: {
    id: number;
    title?: string | null;
    raidInfoId?: number;
    raidName?: string | null;
  } | null;
};

/**
 * 응답 partySize 기준 슬롯 블록 — 4인 2×2, 8인 2×4(한 블록)
 */
export function buildSubPartySlotGroups(partySize: number): {
  label: string;
  slotCount: number;
}[] {
  const size = normalizeRaidPartySize(partySize);
  return [{ label: "", slotCount: size }];
}

/**
 * 그리드 전역 슬롯 인덱스(0부터) → POST members용 partyNumber·slotNumber (1부터).
 * 4인: partyNumber=1, slotNumber 1~4.
 * 8인: 0~3 → 파티1 슬롯1~4, 4~7 → 파티2 슬롯1~4.
 */
export function globalSlotIndexToPartyAndSlot(
  globalIndex: number,
  partySize: number,
): { partyNumber: number; slotNumber: number } {
  const size = normalizeRaidPartySize(partySize);
  if (size === 4) {
    return { partyNumber: 1, slotNumber: globalIndex + 1 };
  }
  const partyNumber = globalIndex < 4 ? 1 : 2;
  const slotNumber = (globalIndex % 4) + 1;
  return { partyNumber, slotNumber };
}
