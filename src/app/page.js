export default function Home() {
  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <main className="px-4 py-4 md:px-6 md:py-6">
        <div className="flex h-full min-h-[calc(100dvh-6rem)] items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-200/80 text-center">
          <div className="max-w-md space-y-3 text-sm text-base-content/60">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-base-content/50">
              메인 콘텐츠 영역
            </p>
            <p className="text-base font-medium text-base-content">
              여기부터 게임 정보, 커뮤니티 글, 레이드 일정 카드 등 원하는
              내용을 자유롭게 배치하면 됩니다.
            </p>
            <p className="text-xs text-base-content/60">
              컴포넌트를 만들 때 이 영역 안에 카드, 테이블, 차트 등을 추가하면
              대시보드 스타일을 그대로 유지할 수 있어요.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
