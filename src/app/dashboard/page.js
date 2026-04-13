export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <main className="px-4 py-4 md:px-6 md:py-6">
        <div className="flex h-full min-h-[calc(100dvh-6rem)] items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-200/80 text-center">
          <div className="max-w-md space-y-3 text-sm text-base-content/60">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-base-content/50">
              대시보드 메인 영역
            </p>
            <p className="text-base font-medium text-base-content">
              추후 여기에서 게임 전체 현황, 오늘 해야 할 콘텐츠, 공지 등을
              한눈에 볼 수 있도록 카드와 차트를 배치하면 됩니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
