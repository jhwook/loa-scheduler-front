'use client';

import type { PositionFilter } from '@/lib/party-builder/level-range';

import { PartyCharacterLevelFilter } from '@/components/party-builder/party-character-level-filter';
import { PartyCharacterPositionFilter } from '@/components/party-builder/party-character-position-filter';

type Props = {
  position: PositionFilter;
  onPositionChange: (next: PositionFilter) => void;
  onlyMine?: boolean;
  onToggleMine?: () => void;
  minBound: number;
  maxBound: number;
  minValue: number;
  maxValue: number;
  step?: number;
  onLevelChange: (next: { min: number; max: number }) => void;
  onReset: () => void;
};

export function PartyCharacterFilters({
  position,
  onPositionChange,
  onlyMine = false,
  onToggleMine,
  minBound,
  maxBound,
  minValue,
  maxValue,
  step,
  onLevelChange,
  onReset,
}: Props) {
  return (
    <section className="space-y-3 rounded-2xl border border-base-300 bg-base-200/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-base-content">캐릭터 필터</h3>
        <button
          type="button"
          onClick={onReset}
          className="btn btn-xs border-base-300 bg-base-300 text-base-content hover:bg-base-100"
        >
          초기화
        </button>
      </div>
      <PartyCharacterPositionFilter
        value={position}
        onChange={onPositionChange}
        onlyMine={onlyMine}
        onToggleMine={onToggleMine}
      />
      <PartyCharacterLevelFilter
        minBound={minBound}
        maxBound={maxBound}
        minValue={minValue}
        maxValue={maxValue}
        step={step}
        onChange={onLevelChange}
      />
    </section>
  );
}
