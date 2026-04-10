"use client";

type Props = {
  onCreateClick: () => void;
};

export function PartyEmptyState({ onCreateClick }: Props) {
  return (
    <div className="flex min-h-[min(70vh,560px)] flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-300 px-6 py-16 text-center shadow-sm">
      <div className="mx-auto max-w-md space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-base-300 bg-base-200/80 text-3xl">
          ⚔️
        </div>
        <h2 className="text-xl font-bold text-base-content">
          아직 속한 공격대가 없습니다
        </h2>
      </div>

      <div className="mt-10 w-full max-w-lg space-y-4">
        {/* 검색 기능 연결 전까지 임시 비활성화 */}
        {/* <PartySearchPanel className="w-full" /> */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="btn btn-primary btn-sm text-primary-content"
            onClick={onCreateClick}
          >
            공격대 생성
          </button>
        </div>
      </div>
    </div>
  );
}
