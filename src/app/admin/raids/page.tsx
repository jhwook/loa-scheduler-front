import Sidebar from "@/app/components/Sidebar";
import { RaidManagementPage } from "@/components/admin/raid-management-page";
import { RequireAdmin } from "@/components/features/auth/RequireAdmin";

export default function AdminRaidsPage() {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar />

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur md:px-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>관리자</span>
              <span>/</span>
              <span className="text-slate-600">레이드 관리</span>
            </div>
            <h1 className="text-base font-semibold tracking-tight text-slate-900 md:text-lg">
              관리자 레이드 관리
            </h1>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
          <RequireAdmin>
            <RaidManagementPage />
          </RequireAdmin>
        </main>
      </div>
    </div>
  );
}
