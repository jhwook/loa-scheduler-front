/** 파티 탭 단일 DndContext에서 풀·슬롯 id 충돌 방지 */

const POOL_PREFIX = "pool-char-";
const SLOT_PREFIX = "raid-slot-";
const MEMBER_PREFIX = "raid-member-";

export function poolCharDndId(characterId: number): string {
  return `${POOL_PREFIX}${characterId}`;
}

export function raidSlotDndId(raidPartyId: number, slotIndex: number): string {
  return `${SLOT_PREFIX}${raidPartyId}-${slotIndex}`;
}

export function parsePoolCharDndId(id: string | number): number | null {
  const s = String(id);
  if (!s.startsWith(POOL_PREFIX)) return null;
  const n = Number(s.slice(POOL_PREFIX.length));
  return Number.isFinite(n) ? n : null;
}

export function parseRaidSlotDndId(
  id: string | number,
): { raidPartyId: number; slotIndex: number } | null {
  const s = String(id);
  const m = /^raid-slot-(\d+)-(\d+)$/.exec(s);
  if (!m) return null;
  const raidPartyId = Number(m[1]);
  const slotIndex = Number(m[2]);
  if (!Number.isFinite(raidPartyId) || !Number.isFinite(slotIndex)) return null;
  return { raidPartyId, slotIndex };
}

/** 슬롯에 배치된 멤버(파티 내 이동·스왑) 드래그 id */
export function raidMemberDndId(raidPartyId: number, memberId: number): string {
  return `${MEMBER_PREFIX}${raidPartyId}-${memberId}`;
}

export function parseRaidMemberDndId(
  id: string | number,
): { raidPartyId: number; memberId: number } | null {
  const s = String(id);
  const m = /^raid-member-(\d+)-(\d+)$/.exec(s);
  if (!m) return null;
  const raidPartyId = Number(m[1]);
  const memberId = Number(m[2]);
  if (!Number.isFinite(raidPartyId) || !Number.isFinite(memberId)) return null;
  return { raidPartyId, memberId };
}
