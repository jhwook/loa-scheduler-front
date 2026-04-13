import type { PartyGroupMemberCharacter } from "@/types/party";

/** 공대 캐릭터 풀 한 칸 (UI·정렬 단위) */
export type PartyPoolOrderedRow = {
  /** 캐릭터 소유자 표시명 (파티 편성 풀 헤더) */
  ownerDisplayName: string;
  character: PartyGroupMemberCharacter;
};

/**
 * 백엔드에 순서 저장 시 그대로 보낼 수 있는 페이로드 예시.
 * (엔드포인트 설계에 맞게 필드명만 조정하면 됨)
 */
export type PartyPoolOrderSavePayload = {
  /** 화면 위→아래, 좌→우 그리드 순서와 동일한 캐릭터 id 배열 */
  characterIdsInOrder: number[];
};

export function buildPartyPoolOrderPayload(
  characterIdsInOrder: readonly number[],
): PartyPoolOrderSavePayload {
  return { characterIdsInOrder: [...characterIdsInOrder] };
}

/** 기본 데이터를 id 순서 배열에 맞게 정렬 (없는 id는 제외 후 유지) */
export function orderPartyPoolRows(
  rows: readonly PartyPoolOrderedRow[],
  characterIdsInOrder: readonly number[],
): PartyPoolOrderedRow[] {
  const map = new Map(rows.map((r) => [r.character.id, r]));
  const ordered: PartyPoolOrderedRow[] = [];
  for (const id of characterIdsInOrder) {
    const row = map.get(id);
    if (row) ordered.push(row);
  }
  const seen = new Set(characterIdsInOrder);
  for (const r of rows) {
    if (!seen.has(r.character.id)) ordered.push(r);
  }
  return ordered;
}

/** 멤버/캐릭터 집합이 바뀌었을 때 이전 순서를 최대한 유지하고 신규 id만 뒤에 붙임 */
export function mergePartyPoolOrderIds(
  previousOrder: readonly number[],
  canonicalIds: readonly number[],
): number[] {
  const set = new Set(canonicalIds);
  const kept = previousOrder.filter((id) => set.has(id));
  const missing = canonicalIds.filter((id) => !kept.includes(id));
  return [...kept, ...missing];
}
