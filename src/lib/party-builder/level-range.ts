import type { PartyPoolOrderedRow } from '@/lib/party-pool-order';
import type { LevelRangeFilter } from '@/types/level-range-filter';

export type PositionFilter = 'ALL' | 'DEALER' | 'SUPPORT';

export type LevelRangeSection = {
  id: number | null;
  label: string;
  orderNo: number;
  characterIds: number[];
};

export function parseItemLevel(value: string | null | undefined): number {
  if (!value) return 0;
  const normalized = value.replace(/,/g, '').trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function inLevelRange(level: number, min: number, max: number): boolean {
  return level >= min && level <= max;
}

export function inNamedRange(
  level: number,
  min: number,
  max: number | null,
): boolean {
  if (max === null) return level >= min;
  return inLevelRange(level, min, max);
}

type BuildLevelRangeSectionsParams = {
  orderedRows: readonly PartyPoolOrderedRow[];
  levelRanges: readonly LevelRangeFilter[];
};

export function buildLevelRangeSections({
  orderedRows,
  levelRanges,
}: BuildLevelRangeSectionsParams): LevelRangeSection[] {
  const activeRanges = [...levelRanges]
    .filter((range) => range.isActive)
    .sort((a, b) => a.orderNo - b.orderNo);

  const sections: LevelRangeSection[] = activeRanges.map((range) => ({
    id: range.id,
    label: range.label,
    orderNo: range.orderNo,
    characterIds: [],
  }));

  const unmatchedIds: number[] = [];

  for (const row of orderedRows) {
    const itemLevel = parseItemLevel(row.character.itemAvgLevel);
    const matchingSection = sections.find((section, index) => {
      const range = activeRanges[index];
      return inNamedRange(itemLevel, range.minLevel, range.maxLevel);
    });

    if (matchingSection) {
      matchingSection.characterIds.push(row.character.id);
    } else {
      unmatchedIds.push(row.character.id);
    }
  }

  sections.push({
    id: null,
    label: '기타',
    orderNo: 9999,
    characterIds: unmatchedIds,
  });

  return sections;
}
