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

function dotColor(difficulty: string): string {
  if (difficulty.includes("나이트")) return "bg-fuchsia-500";
  if (difficulty.includes("하드")) return "bg-orange-400";
  if (difficulty.includes("노말")) return "bg-sky-400";
  return "bg-slate-400";
}

export function RaidDifficultySection({
  section,
  values,
  onToggleSelected,
  onToggleExtra,
}: Props) {
  return (
    <section className="space-y-2.5">
      <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-200">
        <span className={`inline-block h-3.5 w-3.5 rounded-full ${dotColor(section.difficulty)}`} />
        {section.difficulty}
      </h4>
      <div className="grid gap-2 sm:grid-cols-2">
        {section.gates.map((gate) => {
          const state = values[gate.raidGateInfoId] ?? { selected: false, extra: false };
          return (
            <RaidGateCard
              key={gate.raidGateInfoId}
              gate={gate}
              selected={state.selected}
              extraSelected={state.extra}
              onChangeSelected={(next) => onToggleSelected(gate.raidGateInfoId, next)}
              onChangeExtra={(next) => onToggleExtra(gate.raidGateInfoId, next)}
            />
          );
        })}
      </div>
    </section>
  );
}
