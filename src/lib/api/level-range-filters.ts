import { apiFetch } from "@/lib/api/client";
import type {
  CreateLevelRangeFilterRequest,
  LevelRangeFilter,
  UpdateLevelRangeFilterRequest,
} from "@/types/level-range-filter";

const ADMIN_LEVEL_RANGE_FILTERS_PATH = "/level-range-filters/admin";
const ADMIN_LEVEL_RANGE_FILTER_PATH = (id: number) =>
  `${ADMIN_LEVEL_RANGE_FILTERS_PATH}/${id}`;

function asObjectRecord(row: unknown): Record<string, unknown> {
  return row !== null && typeof row === "object"
    ? (row as Record<string, unknown>)
    : {};
}

function extractFilterListRaw(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const k of [
      "filters",
      "levelRangeFilters",
      "level_range_filters",
      "data",
      "items",
    ] as const) {
      const list = o[k];
      if (Array.isArray(list)) return list;
    }
  }
  return [];
}

function parseMaxLevel(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** GET 응답 snake_case·camelCase 혼용 가능 */
export function mapLevelRangeFilterFromApi(row: unknown): LevelRangeFilter {
  const r = asObjectRecord(row);
  return {
    id: Number(r.id),
    label: String(r.label ?? ""),
    minLevel: Number(r.minLevel ?? r.min_level ?? 0),
    maxLevel: parseMaxLevel(r.maxLevel ?? r.max_level),
    orderNo: Number(r.orderNo ?? r.order_no ?? 0),
    isActive: Boolean(r.isActive ?? r.is_active ?? false),
  };
}

export async function getAdminLevelRangeFilters(): Promise<LevelRangeFilter[]> {
  const raw = await apiFetch<unknown>(ADMIN_LEVEL_RANGE_FILTERS_PATH, {
    method: "GET",
  });
  return extractFilterListRaw(raw).map(mapLevelRangeFilterFromApi);
}

export async function createLevelRangeFilter(
  body: CreateLevelRangeFilterRequest,
): Promise<void> {
  await apiFetch<unknown>(ADMIN_LEVEL_RANGE_FILTERS_PATH, {
    method: "POST",
    json: body,
  });
}

export async function updateLevelRangeFilter(
  id: number,
  body: UpdateLevelRangeFilterRequest,
): Promise<void> {
  await apiFetch<unknown>(ADMIN_LEVEL_RANGE_FILTER_PATH(id), {
    method: "PATCH",
    json: body,
  });
}

export async function deleteLevelRangeFilter(id: number): Promise<void> {
  await apiFetch<unknown>(ADMIN_LEVEL_RANGE_FILTER_PATH(id), {
    method: "DELETE",
  });
}
