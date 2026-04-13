export default function RaidSchedulePage() {
  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <main className="px-4 py-4 md:px-6 md:py-6">
        <div className="flex h-full min-h-[calc(100dvh-6rem)] items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-200/80 text-center">
          <div className="max-w-md space-y-3 text-sm text-base-content/60">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-base-content/50">
              레이드 일정 영역
            </p>
            <p className="text-base font-medium text-base-content">
              추후 길드/파티별 레이드 캘린더, 신청 카드, 완료 체크 등을 이
              영역에 구성하면 됩니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
