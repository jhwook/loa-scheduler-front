"use client";

import { PartySearchPanel } from "@/components/party/party-search-panel";

type Props = {
  onCreateClick: () => void;
};

export function PartyEmptyState({ onCreateClick }: Props) {
  return (
    <div className="flex min-h-[min(70vh,560px)] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 px-6 py-16 text-center shadow-inner">
      <div className="mx-auto max-w-md space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/80 text-3xl">
          ⚔️
        </div>
        <h2 className="text-xl font-bold text-slate-100">
          아직 속한 공격대가 없습니다
        </h2>
        <p className="text-sm leading-relaxed text-slate-400">
          공격대에 참여하면 레이드 일정·편성을 함께 관리할 수 있습니다. 기존
          공격대를 검색하거나, 새 공격대를 만들어 보세요.
        </p>
      </div>

      <div className="mt-10 w-full max-w-lg space-y-4">
        <PartySearchPanel className="w-full" />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="btn btn-outline btn-sm border-slate-600 text-slate-200 hover:bg-slate-800"
            onClick={() => {
              /* placeholder: 검색 패널 포커스는 필요 시 ref로 확장 */
              document.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
            }}
          >
            공격대 검색
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm text-slate-950"
            onClick={onCreateClick}
          >
            공격대 생성
          </button>
        </div>
      </div>

      <p className="mt-8 max-w-md text-xs text-slate-500">
        목업 모드: 주소에 <code className="rounded bg-slate-800 px-1 py-0.5">?mock=with</code>{" "}
        를 붙이면 목록 화면을 미리 볼 수 있습니다.
      </p>
    </div>
  );
}
