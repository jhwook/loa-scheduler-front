import { apiFetch } from "@/lib/api/client";
import type {
  CreateRaidPartyRequest,
  DeleteRaidPartyResult,
  RaidInfoOption,
  RaidPartyDifficultyOption,
  RaidParty,
  RaidPartyDetail,
  RaidPartyListItem,
  RaidPartyMemberAssignment,
  RaidPartyRaidInfoRef,
  RaidPartySlotCharacter,
  RaidPartyStatus,
  UpdateRaidPartyRequest,
} from "@/types/raid-party";

const RAID_INFO_PATH = "/raid-info";
const RAID_PARTIES_PATH = "/raid-parties";

function asRecord(row: unknown): Record<string, unknown> {
  return row !== null && typeof row === "object"
    ? (row as Record<string, unknown>)
    : {};
}

function normalizePartySize(value: unknown): number {
  const n = Number(value);
  if (n === 4) return 4;
  return 8;
}

function parseStatus(value: unknown): RaidPartyStatus {
  const s = String(value ?? "DRAFT").toUpperCase();
  if (s === "CONFIRMED" || s === "COMPLETED") return s;
  return "DRAFT";
}

function mapRaidInfoOption(row: unknown): RaidInfoOption {
  const r = asRecord(row);
  return {
    id: Number(r.id),
    raidName: String(r.raidName ?? r.raid_name ?? ""),
    description:
      r.description === undefined || r.description === null
        ? null
        : String(r.description),
    partySize: normalizePartySize(r.partySize ?? r.party_size),
  };
}

function mapRaidPartyFromApi(row: unknown): RaidParty {
  const r = asRecord(row);
  const raidInfoRaw = r.raidInfo ?? r.raid_info;
  let raidInfo: RaidPartyRaidInfoRef | undefined;
  if (raidInfoRaw !== null && typeof raidInfoRaw === "object") {
    const ri = asRecord(raidInfoRaw);
    raidInfo = {
      id: Number(ri.id),
      raidName: String(ri.raidName ?? ri.raid_name ?? ""),
      partySize: normalizePartySize(ri.partySize ?? ri.party_size),
    };
  }

  return {
    id: Number(r.id),
    groupId: Number(r.groupId ?? r.group_id),
    raidInfoId: Number(r.raidInfoId ?? r.raid_info_id),
    title: r.title === undefined || r.title === null ? null : String(r.title),
    selectedDifficulty: optionalTrimmedString(
      r.selectedDifficulty ?? r.selected_difficulty,
    ),
    partySize: normalizePartySize(r.partySize ?? r.party_size),
    status: parseStatus(r.status),
    createdByUserId: Number(r.createdByUserId ?? r.created_by_user_id),
    raidInfo,
  };
}

function mapRaidPartyListItemFromApi(row: unknown): RaidPartyListItem {
  const r = asRecord(row);
  const raidInfoRaw = r.raidInfo ?? r.raid_info;
  let raidName = "";
  if (raidInfoRaw !== null && typeof raidInfoRaw === "object") {
    const ri = asRecord(raidInfoRaw);
    raidName = String(ri.raidName ?? ri.raid_name ?? "");
  }
  if (!raidName) raidName = String(r.raidName ?? r.raid_name ?? "");

  const createdByRaw = r.createdBy ?? r.created_by;
  let createdByUsername: string | null | undefined;
  if (createdByRaw !== null && typeof createdByRaw === "object") {
    const u = asRecord(createdByRaw);
    createdByUsername =
      typeof u.username === "string"
        ? u.username
        : typeof u.nickname === "string"
          ? u.nickname
          : typeof u.displayName === "string"
            ? u.displayName
            : null;
  }
  if (createdByUsername === undefined) {
    createdByUsername =
      typeof r.createdByUsername === "string"
        ? r.createdByUsername
        : typeof r.created_by_username === "string"
          ? r.created_by_username
          : null;
  }

  const placed =
    r.placedMemberCount ??
    r.placed_member_count ??
    r.memberCount ??
    r.member_count ??
    r.currentMemberCount ??
    r.current_member_count ??
    r.slotsFilled ??
    r.slots_filled;

  return {
    id: Number(r.id),
    raidInfoId: Number(r.raidInfoId ?? r.raid_info_id ?? 0),
    title: r.title === undefined || r.title === null ? null : String(r.title),
    raidName,
    selectedDifficulty: optionalTrimmedString(
      r.selectedDifficulty ?? r.selected_difficulty,
    ),
    partySize: normalizePartySize(r.partySize ?? r.party_size),
    createdByUserId: Number(r.createdByUserId ?? r.created_by_user_id),
    createdByUsername,
    placedMemberCount: Math.max(0, Number(placed ?? 0)),
    status: parseStatus(r.status),
  };
}

function memberGlobalSlotIndex(m: Record<string, unknown>): number {
  if (typeof m.slotIndex === "number" && Number.isFinite(m.slotIndex)) {
    return m.slotIndex;
  }
  if (typeof m.slot_index === "number" && Number.isFinite(m.slot_index)) {
    return m.slot_index;
  }
  const partyNumber = Number(m.partyNumber ?? m.party_number);
  const slotNumber = Number(m.slotNumber ?? m.slot_number);
  if (
    Number.isFinite(partyNumber) &&
    Number.isFinite(slotNumber) &&
    partyNumber >= 1 &&
    slotNumber >= 1
  ) {
    return (partyNumber - 1) * 4 + (slotNumber - 1);
  }
  const sub = Number(
    m.subPartyIndex ??
      m.sub_party_index ??
      m.teamIndex ??
      m.team_index ??
      m.partyIndex ??
      m.party_index ??
      0,
  );
  const inner = Number(
    m.slotInParty ??
      m.slot_in_party ??
      m.position ??
      m.slotPosition ??
      m.slot_position ??
      0,
  );
  if (
    m.subPartyIndex !== undefined ||
    m.sub_party_index !== undefined ||
    m.teamIndex !== undefined ||
    m.team_index !== undefined ||
    m.partyIndex !== undefined ||
    m.party_index !== undefined
  ) {
    return sub * 4 + inner;
  }
  return 0;
}

function optionalTrimmedString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s ? s : null;
}

function ownerDisplayNameFromNestedUser(row: Record<string, unknown>): string | null {
  const nested =
    row.user ??
    row.User ??
    row.member ??
    row.Member ??
    row.owner ??
    row.Owner ??
    row.assignedMember ??
    row.assigned_member;
  if (nested !== null && typeof nested === "object") {
    const u = asRecord(nested);
    return optionalTrimmedString(
      u.ownerDisplayName ??
        u.owner_display_name ??
        u.nickname ??
        u.Nickname ??
        u.displayName ??
        u.display_name ??
        u.username ??
        u.userName ??
        u.user_name,
    );
  }
  return null;
}

function groupNicknameFromNestedMember(row: Record<string, unknown>): string | null {
  const nested =
    row.partyGroupMember ??
    row.party_group_member ??
    row.member ??
    row.Member ??
    row.assignedMember ??
    row.assigned_member;
  if (nested !== null && typeof nested === "object") {
    const m = asRecord(nested);
    return optionalTrimmedString(
      m.groupNickname ??
        m.group_nickname ??
        m.memberNickname ??
        m.member_nickname ??
        m.nickname ??
        m.displayName ??
        m.display_name,
    );
  }
  return null;
}

/** 캐릭터/배치 행에서 공격대 별명(우선) */
function resolveGroupNicknameFromRecord(r: Record<string, unknown>): string | null {
  const direct = optionalTrimmedString(
    r.groupNickname ??
      r.group_nickname ??
      r.memberNickname ??
      r.member_nickname,
  );
  if (direct) return direct;
  return groupNicknameFromNestedMember(r);
}

/** 캐릭터/배치 행에서 소유자 표시명 */
function resolveOwnerDisplayNameFromRecord(r: Record<string, unknown>): string | null {
  const primary = optionalTrimmedString(
    r.ownerDisplayName ?? r.owner_display_name,
  );
  if (primary) return primary;

  const legacy = optionalTrimmedString(r.ownerNickname ?? r.owner_nickname ?? r.nickname);
  if (legacy) return legacy;

  return ownerDisplayNameFromNestedUser(r);
}

function mapSlotCharacterFromApi(row: unknown): RaidPartySlotCharacter {
  const c = asRecord(row);
  return {
    id: Number(c.id ?? c.characterId ?? c.character_id),
    characterName: String(
      c.characterName ?? c.character_name ?? c.name ?? "",
    ),
    groupNickname: resolveGroupNicknameFromRecord(c),
    ownerDisplayName: resolveOwnerDisplayNameFromRecord(c),
    partyRole:
      c.partyRole !== undefined && c.partyRole !== null
        ? String(c.partyRole)
        : c.party_role !== undefined && c.party_role !== null
          ? String(c.party_role)
          : c.positionRole !== undefined && c.positionRole !== null
            ? String(c.positionRole)
            : c.position_role !== undefined && c.position_role !== null
              ? String(c.position_role)
              : null,
    characterClassName:
      c.characterClassName !== undefined && c.characterClassName !== null
        ? String(c.characterClassName)
        : c.character_class_name !== undefined && c.character_class_name !== null
          ? String(c.character_class_name)
          : null,
    itemAvgLevel: optionalTrimmedString(
      c.itemAvgLevel ?? c.item_avg_level,
    ),
    combatPower: optionalTrimmedString(
      c.combatPower ?? c.combat_power,
    ),
  };
}

function raidPartyDetailFromResponseOrRefetch(
  raw: unknown,
  raidPartyId: number,
): Promise<RaidPartyDetail> {
  if (
    raw !== null &&
    typeof raw === "object" &&
    Array.isArray((raw as { members?: unknown }).members)
  ) {
    return Promise.resolve(mapRaidPartyDetailFromApi(raw));
  }
  return getRaidPartyById(raidPartyId);
}

function mapRaidPartyMemberFromApi(row: unknown): RaidPartyMemberAssignment | null {
  const m = asRecord(row);
  const rawMemberId = m.id ?? m.memberId ?? m.member_id;
  const memberIdNum = Number(rawMemberId);
  const memberId =
    Number.isFinite(memberIdNum) && memberIdNum > 0 ? memberIdNum : undefined;

  let character: RaidPartySlotCharacter | null = null;
  const charRaw = m.character ?? m.Character ?? m.characterInfo;
  if (charRaw !== null && typeof charRaw === "object") {
    character = mapSlotCharacterFromApi(charRaw);
  } else if (m.characterId !== undefined && m.characterId !== null) {
    character = mapSlotCharacterFromApi({
      ...m,
      id: m.characterId,
      characterId: m.characterId,
    });
  } else if (m.character_id !== undefined && m.character_id !== null) {
    character = mapSlotCharacterFromApi({
      ...m,
      id: m.character_id,
      character_id: m.character_id,
    });
  }
  if (!character) return null;

  const slotRole = optionalTrimmedString(
    m.positionRole ?? m.position_role,
  );
  if (
    slotRole &&
    (character.partyRole == null || String(character.partyRole).trim() === "")
  ) {
    character = { ...character, partyRole: slotRole };
  }

  if (!optionalTrimmedString(character.ownerDisplayName ?? undefined)) {
    const fromRow = resolveOwnerDisplayNameFromRecord(m);
    if (fromRow) {
      character = { ...character, ownerDisplayName: fromRow };
    }
  }
  if (!optionalTrimmedString(character.groupNickname ?? undefined)) {
    const fromRow = resolveGroupNicknameFromRecord(m);
    if (fromRow) {
      character = { ...character, groupNickname: fromRow };
    }
  }

  return {
    memberId,
    slotIndex: memberGlobalSlotIndex(m),
    character,
  };
}

function mapRaidPartyDetailFromApi(row: unknown): RaidPartyDetail {
  const base = mapRaidPartyFromApi(row);
  const r = asRecord(row);
  const rawMembers = r.members ?? r.Members ?? r.assignments ?? r.slotAssignments;
  const list = Array.isArray(rawMembers) ? rawMembers : [];
  const members: RaidPartyMemberAssignment[] = [];
  for (const item of list) {
    const mapped = mapRaidPartyMemberFromApi(item);
    if (mapped) members.push(mapped);
  }
  members.sort((a, b) => a.slotIndex - b.slotIndex);
  return { ...base, members };
}

function extractRaidPartyList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.parties)) return o.parties;
    if (Array.isArray(o.data)) return o.data;
    if (Array.isArray(o.items)) return o.items;
  }
  return [];
}

/** GET /raid-info — 레이드 선택( partySize 포함 ) */
export async function getRaidInfoOptions(): Promise<RaidInfoOption[]> {
  const raw = await apiFetch<unknown>(RAID_INFO_PATH, { method: "GET" });
  const list = Array.isArray(raw) ? raw : [];
  return list.map(mapRaidInfoOption);
}

/** POST /raid-parties */
export async function createRaidParty(
  payload: CreateRaidPartyRequest,
): Promise<RaidParty> {
  const body: Record<string, unknown> = {
    groupId: payload.groupId,
    raidInfoId: payload.raidInfoId,
  };
  const t = payload.title?.trim();
  if (t) body.title = t;
  const d = payload.selectedDifficulty?.trim();
  if (d) body.selectedDifficulty = d;

  const data = await apiFetch<unknown>(RAID_PARTIES_PATH, {
    method: "POST",
    json: body,
  });
  return mapRaidPartyFromApi(data);
}

export async function patchRaidParty(
  raidPartyId: number,
  payload: UpdateRaidPartyRequest,
): Promise<RaidParty> {
  const body: Record<string, unknown> = {};
  if (payload.title !== undefined) {
    const t = payload.title?.trim();
    body.title = t ? t : null;
  }
  if (payload.selectedDifficulty !== undefined) {
    const d = payload.selectedDifficulty?.trim();
    body.selectedDifficulty = d ? d : null;
  }
  const data = await apiFetch<unknown>(`${RAID_PARTIES_PATH}/${raidPartyId}`, {
    method: "PATCH",
    json: body,
  });
  return mapRaidPartyFromApi(data);
}

/** GET /raid-parties/group/:groupId/raid-info/:raidInfoId/difficulties */
export async function getRaidPartyDifficultyOptions(
  groupId: number,
  raidInfoId: number,
): Promise<RaidPartyDifficultyOption[]> {
  const raw = await apiFetch<unknown>(
    `${RAID_PARTIES_PATH}/group/${groupId}/raid-info/${raidInfoId}/difficulties`,
    { method: "GET" },
  );
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map((row) => {
      const r = asRecord(row);
      const label = optionalTrimmedString(r.label);
      const value = optionalTrimmedString(r.value);
      if (!value) return null;
      return {
        label: label ?? value,
        value,
      } satisfies RaidPartyDifficultyOption;
    })
    .filter((x): x is RaidPartyDifficultyOption => Boolean(x));
}

/** GET /raid-parties/group/:groupId */
export async function getRaidPartiesByGroup(
  groupId: number,
): Promise<RaidPartyListItem[]> {
  const raw = await apiFetch<unknown>(
    `${RAID_PARTIES_PATH}/group/${groupId}`,
    { method: "GET" },
  );
  return extractRaidPartyList(raw).map(mapRaidPartyListItemFromApi);
}

/** GET /raid-parties/:raidPartyId */
export async function getRaidPartyById(
  raidPartyId: number,
): Promise<RaidPartyDetail> {
  const data = await apiFetch<unknown>(`${RAID_PARTIES_PATH}/${raidPartyId}`, {
    method: "GET",
  });
  return mapRaidPartyDetailFromApi(data);
}

/** POST /raid-parties/:id/members 요청 본문 (slotIndex 금지) */
export type AssignRaidPartyMemberBody = {
  characterId: number;
  partyNumber: number;
  slotNumber: number;
  positionRole: "DEALER" | "SUPPORT";
};

/**
 * 슬롯에 캐릭터 배치.
 * POST /raid-parties/:raidPartyId/members
 */
export async function assignRaidPartySlot(
  raidPartyId: number,
  payload: AssignRaidPartyMemberBody,
): Promise<RaidPartyDetail> {
  const data = await apiFetch<unknown>(
    `${RAID_PARTIES_PATH}/${raidPartyId}/members`,
    {
      method: "POST",
      json: {
        characterId: payload.characterId,
        partyNumber: payload.partyNumber,
        slotNumber: payload.slotNumber,
        positionRole: payload.positionRole,
      },
    },
  );
  return raidPartyDetailFromResponseOrRefetch(data, raidPartyId);
}

export type PatchRaidPartyMemberPositionBody = {
  partyNumber: number;
  slotNumber: number;
  positionRole?: "DEALER" | "SUPPORT";
};

/**
 * 슬롯 위치 변경(빈 슬롯 이동·다른 슬롯과 스왑 등은 백엔드 규칙 따름).
 * PATCH /raid-parties/:raidPartyId/members/:memberId/position
 */
export async function patchRaidPartyMemberPosition(
  raidPartyId: number,
  memberId: number,
  payload: PatchRaidPartyMemberPositionBody,
): Promise<RaidPartyDetail> {
  const body: Record<string, unknown> = {
    partyNumber: payload.partyNumber,
    slotNumber: payload.slotNumber,
  };
  if (payload.positionRole !== undefined) {
    body.positionRole = payload.positionRole;
  }
  const data = await apiFetch<unknown>(
    `${RAID_PARTIES_PATH}/${raidPartyId}/members/${memberId}/position`,
    { method: "PATCH", json: body },
  );
  return raidPartyDetailFromResponseOrRefetch(data, raidPartyId);
}

/**
 * 파티에서 멤버 제거.
 * DELETE /raid-parties/:raidPartyId/members/:memberId
 */
export async function removeRaidPartyMember(
  raidPartyId: number,
  memberId: number,
): Promise<RaidPartyDetail> {
  const data = await apiFetch<unknown>(
    `${RAID_PARTIES_PATH}/${raidPartyId}/members/${memberId}`,
    { method: "DELETE" },
  );
  return raidPartyDetailFromResponseOrRefetch(data, raidPartyId);
}

function mapDeleteRaidPartyResultFromApi(raw: unknown): DeleteRaidPartyResult {
  if (raw === null || typeof raw !== "object") {
    return {};
  }
  const r = asRecord(raw);
  const msg = optionalTrimmedString(r.message);
  const delRaw = r.deletedRaidParty ?? r.deleted_raid_party;
  let deletedRaidParty: DeleteRaidPartyResult["deletedRaidParty"];
  if (delRaw !== null && typeof delRaw === "object") {
    const d = asRecord(delRaw);
    const idNum = Number(d.id);
    if (Number.isFinite(idNum)) {
      const infoNum = Number(d.raidInfoId ?? d.raid_info_id);
      deletedRaidParty = {
        id: idNum,
        title:
          d.title === undefined || d.title === null ? null : String(d.title),
        raidInfoId: Number.isFinite(infoNum) ? infoNum : undefined,
        raidName: optionalTrimmedString(d.raidName ?? d.raid_name) ?? undefined,
      };
    }
  }
  return {
    message: msg,
    deletedRaidParty,
  };
}

/**
 * 레이드 파티(공격대 파티) 통째로 삭제. 슬롯 배치도 서버에서 함께 제거.
 * DELETE /raid-parties/:raidPartyId
 */
export async function deleteRaidParty(
  raidPartyId: number,
): Promise<DeleteRaidPartyResult> {
  const data = await apiFetch<unknown>(
    `${RAID_PARTIES_PATH}/${raidPartyId}`,
    { method: "DELETE" },
  );
  return mapDeleteRaidPartyResultFromApi(data);
}
