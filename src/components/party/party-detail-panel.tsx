"use client";

import type { PartyGroupDetail } from "@/types/party";

type Props = {
  group: PartyGroupDetail | null;
  onAddMember?: () => void;
  onRemoveMember?: (memberId: number) => void;
};

/**
 * 선택된 공격대 관리 패널.
 * TODO: 공대 편성(직업/관문 배치) UI는 이 패널 하단 reserved 영역에 추가
 */
export function PartyDetailPanel({
  group,
  onAddMember,
  onRemoveMember,
}: Props) {
  if (!group) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/80 px-6 py-12 text-center">
        <p className="text-sm font-medium text-slate-400">
          왼쪽 목록에서 공격대를 선택하세요
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-950 shadow-sm">
      <div className="border-b border-slate-800 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-100">{group.name}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {group.description ?? "설명이 없습니다."}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              멤버 {group.memberCount}명
              {group.isActive ? (
                <span className="ml-2 text-emerald-400">· 활성</span>
              ) : null}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm border-slate-600 text-slate-200"
              onClick={() => onAddMember?.()}
            >
              멤버 추가
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-color:rgb(71_85_105)_rgb(15_23_42)] [scrollbar-width:thin]">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          멤버
        </h3>
        <ul className="mt-3 space-y-3">
          {group.members.map((m) => (
            <li
              key={m.id}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-100">{m.displayName}</p>
                  <p className="text-xs text-slate-500">
                    @{m.username}
                    {m.nickname ? ` · ${m.nickname}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs text-rose-400 hover:bg-rose-950/40"
                  onClick={() => onRemoveMember?.(m.id)}
                >
                  삭제
                </button>
              </div>
              <div className="mt-3 border-t border-slate-800 pt-3">
                <p className="text-[11px] font-semibold text-slate-500">
                  캐릭터
                </p>
                {m.characters.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">
                    등록된 캐릭터가 없습니다.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {m.characters.map((c) => (
                      <li
                        key={c.id}
                        className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-slate-300"
                      >
                        <span className="truncate font-medium text-slate-200">
                          {c.characterName}
                        </span>
                        <span className="shrink-0 text-slate-500">
                          {c.serverName} · {c.itemAvgLevel}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-xl border border-dashed border-slate-700 bg-slate-900/30 px-4 py-6 text-center">
          <p className="text-xs font-semibold text-slate-500">
            공대 편성 (예약 영역)
          </p>
          <p className="mt-1 text-[11px] text-slate-600">
            레이드별 관문·직업 배치 UI는 이후 이 영역에 배치할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
