import Sidebar from "../components/Sidebar";

export default function RaidSchedulePage() {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar />

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur md:px-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Dashboard</span>
              <span>/</span>
              <span className="text-slate-600">Raid Schedule</span>
            </div>
            <h1 className="text-base font-semibold tracking-tight text-slate-900 md:text-lg">
              레이드 일정
            </h1>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
          <div className="flex h-full min-h-[calc(100vh-6rem)] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 text-center">
            <div className="max-w-md space-y-3 text-sm text-slate-500">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                레이드 일정 영역
              </p>
              <p className="text-base font-medium text-slate-800">
                추후 길드/파티별 레이드 캘린더, 신청 카드, 완료 체크 등을
                이 영역에 구성하면 됩니다.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

