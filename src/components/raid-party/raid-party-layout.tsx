"use client";

import { useMemo } from "react";

import { formatRaidPartySizeLabel, normalizeRaidPartySize } from "@/types/raid";
import { buildSubPartySlotGroups, type RaidParty } from "@/types/raid-party";

import { RaidPartySlotGrid } from "./raid-party-slot-grid";

type Props = {
  raidParty: RaidParty;
};

export function RaidPartyLayout({ raidParty }: Props) {
  const groups = useMemo(
    () => buildSubPartySlotGroups(raidParty.partySize),
    [raidParty.partySize],
  );

  const slotBlocks = useMemo(() => {
    return groups.map((g) => ({
      key: g.label,
      label: groups.length > 1 ? g.label : "",
      cells: Array.from({ length: g.slotCount }, (_, i) => ({
        displayIndex: i + 1,
        character: null,
      })),
    }));
  }, [groups]);

  const displayTitle =
    raidParty.title?.trim() ||
    raidParty.raidInfo?.raidName ||
    "레이드 파티";

  const sizeLabel = formatRaidPartySizeLabel(
    normalizeRaidPartySize(raidParty.partySize),
  );

  return (
    <div className="flex h-full min-w-0 flex-col rounded-xl border border-base-300 bg-base-200/40 p-3 shadow-sm sm:p-4">
      <div className="mb-2 rounded-lg border border-primary/35 bg-primary/10 px-3 py-2">
        <p className="min-w-0 truncate text-center text-sm font-bold text-base-content">
          {displayTitle}
        </p>
      </div>
      <p className="mb-3 text-center text-[10px] text-base-content/50">
        {raidParty.raidInfo?.raidName ?? "—"} · {sizeLabel}
      </p>
      <div className="space-y-2.5">
        {slotBlocks.map((b) => (
          <RaidPartySlotGrid
            key={b.key}
            label={b.label}
            cells={b.cells}
          />
        ))}
      </div>
    </div>
  );
}
