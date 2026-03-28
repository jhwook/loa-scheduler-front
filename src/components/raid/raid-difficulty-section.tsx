"use client";

import type { RaidDifficultySection } from "@/types/raid";

import { RaidGateCard } from "./raid-gate-card";

type SelectionState = Record<number, { selected: boolean; extra: boolean }>;

type Props = {
  section: RaidDifficultySection;
  values: SelectionState;
  onToggleSelected: (gateId: number, selected: boolean) => void;
  onToggleExtra: (gateId: number, selected: boolean) => void;
};

function difficultyBadgeClass(difficulty: string): string {
  if (difficulty.includes("나메") || difficulty.includes("나이트") || difficulty.includes("3단계")) {
    return "border-fuchsia-400/70 bg-fuchsia-600 text-white";
  }
  if (difficulty.includes("하드") || difficulty.includes("2단계")) {
    return "border-rose-400/70 bg-rose-600 text-white";
  }
  if (difficulty.includes("노말") || difficulty.includes("1단계")) {
    return "border-slate-500 bg-slate-700 text-white";
  }
  return "border-slate-500 bg-slate-700 text-white";
}

export function RaidDifficultySection({
  section,
  values,
  onToggleSelected,
  onToggleExtra,
}: Props) {
  const gateCount = section.gates.length;
  const gridColsClass =
    gateCount <= 1
      ? "grid-cols-1"
      : gateCount === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1 sm:grid-cols-3";
  const compact = gateCount >= 3;

  return (
    <section className="space-y-2.5">
      <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-200">
        <span className={`badge badge-sm border ${difficultyBadgeClass(section.difficulty)}`}>
          {section.difficulty}
        </span>
      </h4>
      <div className={`grid gap-2 ${gridColsClass}`}>
        {section.gates.map((gate) => {
          const state = values[gate.raidGateInfoId] ?? { selected: false, extra: false };
          return (
            <div key={gate.raidGateInfoId} className="min-w-0">
              <RaidGateCard
                gate={gate}
                compact={compact}
                selected={state.selected}
                extraSelected={state.extra}
                onChangeSelected={(next) => onToggleSelected(gate.raidGateInfoId, next)}
                onChangeExtra={(next) => onToggleExtra(gate.raidGateInfoId, next)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
