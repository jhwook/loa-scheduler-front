"use client";

import { PartyListItem } from "@/components/party/party-list-item";
import type { PartyGroupDetail } from "@/types/party";

type Props = {
  groups: PartyGroupDetail[];
  selectedId: number | null;
  onSelectionChange: (id: number) => void;
};

export function PartyList({
  groups,
  selectedId,
  onSelectionChange,
}: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-950 shadow-sm">
      <div className="border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-200">내 공격대</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {groups.length}개 · 선택하면 우측에서 관리합니다
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 [scrollbar-color:rgb(71_85_105)_rgb(15_23_42)] [scrollbar-width:thin]">
        {groups.map((g) => (
          <PartyListItem
            key={g.id}
            group={g}
            selected={selectedId === g.id}
            onSelect={() => onSelectionChange(g.id)}
          />
        ))}
      </div>
    </div>
  );
}
