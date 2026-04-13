/** 공대 캐릭터 카드 → 레이드 파티 슬롯 HTML5 DnD 페이로드 */

export const PARTY_POOL_DRAG_MIME = "application/x-loa-party-pool-character";

export type PartyPoolDragPayload = {
  characterId: number;
};

export function setPartyPoolDragData(
  dataTransfer: DataTransfer,
  characterId: number,
): void {
  const payload: PartyPoolDragPayload = { characterId };
  dataTransfer.setData(PARTY_POOL_DRAG_MIME, JSON.stringify(payload));
  dataTransfer.setData("text/plain", String(characterId));
  dataTransfer.effectAllowed = "copy";
}

export function readPartyPoolCharacterIdFromDrag(e: {
  dataTransfer: DataTransfer | null;
}): number | null {
  const dt = e.dataTransfer;
  if (!dt) return null;
  const raw = dt.getData(PARTY_POOL_DRAG_MIME);
  if (raw) {
    try {
      const o = JSON.parse(raw) as { characterId?: unknown };
      const id = Number(o.characterId);
      if (Number.isFinite(id)) return id;
    } catch {
      /* fall through */
    }
  }
  const plain = dt.getData("text/plain").trim();
  if (plain) {
    const id = Number(plain);
    if (Number.isFinite(id)) return id;
  }
  return null;
}
