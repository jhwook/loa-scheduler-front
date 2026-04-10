import Sidebar from '../components/Sidebar';

import { RequireAuth } from '@/components/features/auth/RequireAuth';
import { ExpeditionAddButton } from '@/components/features/expedition/ExpeditionAddButton';
import { ExpeditionHeader } from '@/components/features/expedition/ExpeditionHeader';
import { ExpeditionMyCharacterList } from '@/components/features/expedition/ExpeditionMyCharacterList';

export default function ExpeditionPage() {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar />

      <div className="flex min-h-screen flex-1 flex-col">
        <ExpeditionHeader />

        <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
          <RequireAuth>
            <div className="flex min-h-[calc(100vh-6rem)] flex-col gap-6">
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <p className="order-2 max-w-2xl flex-1 text-sm leading-relaxed text-slate-600 sm:order-1">
                    <strong className="text-slate-800">+ 원정대 추가</strong>로
                    대표 캐릭터명을 검색한 뒤, 서버별 캐릭터를 확인하고 체크를
                    조정할 수 있습니다. 체크된 캐릭터만 저장됩니다.
                  </p>
                  <div className="order-1 flex shrink-0 justify-end sm:order-2 sm:pt-0">
                    <ExpeditionAddButton />
                  </div>
                </div>
              </div>

              <ExpeditionMyCharacterList />
            </div>
          </RequireAuth>
        </main>
      </div>
    </div>
  );
}
