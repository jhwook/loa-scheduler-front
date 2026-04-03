"use client";

import type { PartyGroup } from "@/types/party";

type Props = {
  group: PartyGroup;
  selected: boolean;
  onSelect: () => void;
};

export function PartyListItem({ group, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
        selected
          ? "border-indigo-500/70 bg-indigo-950/40 ring-1 ring-indigo-500/40"
          : "border-slate-800 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-800/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate font-semibold text-slate-100">
          {group.name}
        </p>
        {group.isActive ? (
          <span className="shrink-0 rounded-md border border-emerald-600/50 bg-emerald-950/40 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
            활성
          </span>
        ) : (
          <span className="shrink-0 rounded-md border border-slate-600 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
            비활성
          </span>
        )}
      </div>
      {group.description ? (
        <p className="mt-1 line-clamp-2 text-xs text-slate-400">
          {group.description}
        </p>
      ) : (
        <p className="mt-1 text-xs text-slate-500">설명 없음</p>
      )}
      <p className="mt-2 text-[11px] text-slate-500">
        멤버 {group.memberCount}명
      </p>
    </button>
  );
}
