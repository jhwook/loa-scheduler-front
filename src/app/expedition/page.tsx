import { RequireAuth } from "@/components/features/auth/RequireAuth";
import { ExpeditionAddButton } from "@/components/features/expedition/ExpeditionAddButton";
import { ExpeditionMyCharacterList } from "@/components/features/expedition/ExpeditionMyCharacterList";

export default function ExpeditionPage() {
  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <main className="px-4 py-4 md:px-6 md:py-6">
        <RequireAuth>
          <div className="flex min-h-[calc(100dvh-6rem)] flex-col gap-6">
            <div className="rounded-2xl border border-base-300 bg-base-200/90 p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <p className="order-2 max-w-2xl flex-1 text-sm leading-relaxed text-base-content/70 sm:order-1">
                  <strong className="text-base-content">+ 원정대 추가</strong>로
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
  );
}
