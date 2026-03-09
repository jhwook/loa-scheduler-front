import Sidebar from "./components/Sidebar";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar />

      {/* Main area */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top navigation */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur md:px-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Dashboard</span>
              <span>/</span>
              <span className="text-slate-600">Home</span>
            </div>
            <h1 className="text-base font-semibold tracking-tight text-slate-900 md:text-lg">
              홈
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:flex">
              <span>새 레이드 일정</span>
            </button>
            <div className="flex items-center gap-3">
              <button className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm hover:bg-slate-50">
                🔔
              </button>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                  U
                </div>
                <div className="hidden flex-col leading-tight sm:flex">
                  <span className="text-xs font-semibold text-slate-900">
                    게스트
                  </span>
                  <span className="text-[10px] text-slate-500">
                    로그인 전 · 기본 뷰
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Empty main content placeholder */}
        <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
          <div className="flex h-full min-h-[calc(100vh-6rem)] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 text-center">
            <div className="max-w-md space-y-3 text-sm text-slate-500">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                메인 콘텐츠 영역
              </p>
              <p className="text-base font-medium text-slate-800">
                여기부터 게임 정보, 커뮤니티 글, 레이드 일정 카드 등
                원하는 내용을 자유롭게 배치하면 됩니다.
              </p>
              <p className="text-xs text-slate-500">
                컴포넌트를 만들 때 이 영역 안에 카드, 테이블, 차트 등을
                추가하면 대시보드 스타일을 그대로 유지할 수 있어요.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
