import { apiFetch } from "@/lib/api/client";
import type {
  PatchAdminRaidOrderRequest,
  CharacterWeeklyRaidItem,
  CreateCharacterWeeklyRaidsRequest,
  CreateRaidGateRequest,
  CreateRaidRequest,
  DeleteCharacterWeeklyRaidsByRaidRequest,
  PatchCharacterWeeklyRaidsOrderRequest,
  PutCharacterWeeklyRaidsRequest,
  RaidDetail,
  RaidSimple,
  RaidGateInfo,
  RaidInfo,
  UpdateRaidRequest,
  UpdateRaidGateRequest,
  UpdateCharacterWeeklyRaidRequest,
} from "@/types/raid";

const ADMIN_RAIDS_PATH = "/raid-info/admin/raids";
const ADMIN_GATES_PATH = "/raid-info/admin/gates";
const ADMIN_RAID_ORDER_PATH = "/raid-info/admin/order";

type RaidListResponse =
  | unknown[]
  | { raids?: unknown[]; data?: unknown[] };
type RaidGateListResponse =
  | RaidGateInfo[]
  | { raidGates?: RaidGateInfo[]; gates?: RaidGateInfo[]; data?: RaidGateInfo[] };

function extractRaidListRaw(raw: RaidListResponse): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray(raw.raids)) return raw.raids;
  if (raw && typeof raw === "object" && Array.isArray(raw.data)) return raw.data;
  return [];
}

function asObjectRecord(row: unknown): Record<string, unknown> {
  return row !== null && typeof row === "object"
    ? (row as Record<string, unknown>)
    : {};
}

/** GET 응답은 snake_case·camelCase 혼용 가능 → RaidInfo로 통일 */
function mapAdminRaidFromApi(row: unknown): RaidInfo {
  const r = asObjectRecord(row);
  const partyRaw = r.partySize ?? r.party_size;
  let partySize: number | undefined;
  if (partyRaw !== undefined && partyRaw !== null) {
    const n = Number(partyRaw);
    if (n === 4 || n === 8) partySize = n;
  }

  return {
    id: Number(r.id),
    raidName: String(r.raidName ?? r.raid_name ?? ""),
    description: String(r.description ?? ""),
    ...(partySize !== undefined ? { partySize } : {}),
    orderNo: Number(r.orderNo ?? r.order_no ?? 0),
    isActive: Boolean(r.isActive ?? r.is_active ?? false),
  };
}

function extractRaidGateList(raw: RaidGateListResponse): RaidGateInfo[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.raidGates)) return raw.raidGates;
  if (Array.isArray(raw.gates)) return raw.gates;
  if (Array.isArray(raw.data)) return raw.data;
  return [];
}

export async function getAdminRaids(): Promise<RaidInfo[]> {
  const raw = await apiFetch<RaidListResponse>(ADMIN_RAIDS_PATH, {
    method: "GET",
  });
  return extractRaidListRaw(raw).map(mapAdminRaidFromApi);
}

export async function createRaid(payload: CreateRaidRequest): Promise<void> {
  await apiFetch<unknown>(ADMIN_RAIDS_PATH, {
    method: "POST",
    json: payload,
  });
}

export async function updateRaid(
  raidId: number,
  payload: UpdateRaidRequest,
): Promise<void> {
  await apiFetch<unknown>(`${ADMIN_RAIDS_PATH}/${raidId}`, {
    method: "PATCH",
    json: payload,
  });
}

export async function deleteRaid(raidId: number): Promise<void> {
  await apiFetch<unknown>(`${ADMIN_RAIDS_PATH}/${raidId}`, {
    method: "DELETE",
  });
}

export async function patchAdminRaidOrder(
  payload: PatchAdminRaidOrderRequest,
): Promise<void> {
  await apiFetch<unknown>(ADMIN_RAID_ORDER_PATH, {
    method: "PATCH",
    json: payload,
  });
}

export async function getRaidGatesByRaidId(raidId: number): Promise<RaidGateInfo[]> {
  const raw = await apiFetch<RaidGateListResponse>(
    `${ADMIN_RAIDS_PATH}/${raidId}/gates`,
    {
      method: "GET",
    },
  );
  return extractRaidGateList(raw);
}

export async function createRaidGate(
  raidId: number,
  payload: CreateRaidGateRequest,
): Promise<void> {
  await apiFetch<unknown>(`${ADMIN_RAIDS_PATH}/${raidId}/gates`, {
    method: "POST",
    json: payload,
  });
}

export async function updateRaidGate(
  gateId: number,
  payload: UpdateRaidGateRequest,
): Promise<void> {
  await apiFetch<unknown>(`${ADMIN_GATES_PATH}/${gateId}`, {
    method: "PATCH",
    json: payload,
  });
}

export async function deleteRaidGate(gateId: number): Promise<void> {
  await apiFetch<unknown>(`${ADMIN_GATES_PATH}/${gateId}`, {
    method: "DELETE",
  });
}

const RAID_INFO_PATH = "/raid-info";

export async function getRaidInfos(): Promise<RaidSimple[]> {
  return apiFetch<RaidSimple[]>(RAID_INFO_PATH, { method: "GET" });
}

export async function getRaidInfoDetail(raidId: number): Promise<RaidDetail> {
  return apiFetch<RaidDetail>(`${RAID_INFO_PATH}/${raidId}`, { method: "GET" });
}

export async function createCharacterWeeklyRaids(
  characterId: number,
  payload: CreateCharacterWeeklyRaidsRequest,
): Promise<void> {
  await apiFetch<unknown>(`/characters/${characterId}/weekly-raids`, {
    method: "POST",
    json: payload,
  });
}

export async function putCharacterWeeklyRaids(
  characterId: number,
  payload: PutCharacterWeeklyRaidsRequest,
): Promise<void> {
  await apiFetch<unknown>(`/characters/${characterId}/weekly-raids`, {
    method: "PUT",
    json: payload,
  });
}

export async function putCharacterWeeklyRaidsByRaid(
  characterId: number,
  raidInfoId: number,
  payload: PutCharacterWeeklyRaidsRequest,
): Promise<void> {
  await apiFetch<unknown>(
    `/characters/${characterId}/weekly-raids/raid/${raidInfoId}`,
    {
      method: "PUT",
      json: payload,
    },
  );
}

export async function deleteCharacterWeeklyRaidsByRaid(
  characterId: number,
  payload: DeleteCharacterWeeklyRaidsByRaidRequest,
): Promise<void> {
  await apiFetch<unknown>(`/characters/${characterId}/weekly-raids/raid`, {
    method: "DELETE",
    json: payload,
  });
}

export async function getCharacterWeeklyRaids(
  characterId: number,
): Promise<CharacterWeeklyRaidItem[]> {
  return apiFetch<CharacterWeeklyRaidItem[]>(`/characters/${characterId}/weekly-raids`, {
    method: "GET",
  });
}

export async function patchCharacterWeeklyRaidClear(
  id: number,
  isCleared: boolean,
): Promise<void> {
  await apiFetch<unknown>(`/characters/weekly-raids/${id}/clear`, {
    method: "PATCH",
    json: { isCleared },
  });
}

export async function patchCharacterWeeklyRaid(
  id: number,
  payload: UpdateCharacterWeeklyRaidRequest,
): Promise<void> {
  await apiFetch<unknown>(`/characters/weekly-raids/${id}`, {
    method: "PATCH",
    json: payload,
  });
}

export async function patchCharacterWeeklyRaidsOrder(
  characterId: number,
  payload: PatchCharacterWeeklyRaidsOrderRequest,
): Promise<void> {
  await apiFetch<unknown>(`/characters/${characterId}/weekly-raids/order`, {
    method: "PATCH",
    json: payload,
  });
}
