import { apiFetch } from "@/lib/api/client";
import type {
  CharacterWeeklyRaidItem,
  CreateCharacterWeeklyRaidsRequest,
  CreateRaidGateRequest,
  CreateRaidRequest,
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

type RaidListResponse = RaidInfo[] | { raids?: RaidInfo[]; data?: RaidInfo[] };
type RaidGateListResponse =
  | RaidGateInfo[]
  | { raidGates?: RaidGateInfo[]; gates?: RaidGateInfo[]; data?: RaidGateInfo[] };

function extractRaidList(raw: RaidListResponse): RaidInfo[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.raids)) return raw.raids;
  if (Array.isArray(raw.data)) return raw.data;
  return [];
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
  return extractRaidList(raw);
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
