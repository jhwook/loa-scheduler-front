"use client";

import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { PartyCreateForm } from "@/components/party/party-create-form";
import { PartyEmptyState } from "@/components/party/party-empty-state";
import { getMyPartyGroups, createPartyGroup } from "@/lib/api/party-groups";
import type { PartyGroupCreateInput, PartyGroupDetail } from "@/types/party";

type PartyViewTab = "my" | "create";

/**
 * 공격대 페이지 클라이언트 래퍼 (useSearchParams → Suspense로 감싸서 사용)
 */
function PartyPageClientInner() {
  const router = useRouter();

  const [groups, setGroups] = useState<PartyGroupDetail[]>([]);
  const [loadBusy, setLoadBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [createBusy, setCreateBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<PartyViewTab>("my");

  /** 초기 로딩: 기본은 서버(/party-groups/my), mock 쿼리면 목 데이터 */
  useEffect(() => {
    async function load() {
      setLoadError(null);
      setLoadBusy(true);
      try {
        const data = await getMyPartyGroups();
        setGroups(data);
      } catch (e) {
        const message = e instanceof Error ? e.message : "내 공격대를 불러오지 못했습니다.";
        setLoadError(message);
        setGroups([]);
      } finally {
        setLoadBusy(false);
      }
    }
    void load();
  }, []);

  const hasGroups = groups.length > 0;

  /** POST /party-groups — 성공 시 내 공격대 재조회 */
  async function handleCreateSubmit(data: PartyGroupCreateInput) {
    setCreateBusy(true);
    try {
      await createPartyGroup(data);
      const next = await getMyPartyGroups();
      setGroups(next);
      setActiveTab("my");
    } finally {
      setCreateBusy(false);
    }
  }

  function openPartyGroup(groupId: number) {
    // TODO: 상세 라우트/페이지 구현 시 실제 관리 화면으로 연결
    router.push(`/party/${groupId}`);
  }

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col gap-6">
      <div className="navbar rounded-2xl border border-base-300 bg-base-300 px-4 text-base-content shadow-sm">
        <div className="flex w-full flex-wrap items-center gap-2">
          <button
            type="button"
            className={`btn btn-sm ${activeTab === "my" ? "btn-primary text-primary-content" : "btn-ghost text-base-content/80"}`}
            onClick={() => setActiveTab("my")}
          >
            내 공격대
          </button>
          {/* 검색 기능 연결 전까지 임시 비활성화 */}
          {/* <button
            type="button"
            className={`btn btn-sm ${activeTab === "search" ? "btn-primary text-primary-content" : "btn-ghost text-base-content/80"}`}
            onClick={() => setActiveTab("search")}
          >
            검색
          </button> */}
          <button
            type="button"
            className={`btn btn-sm ${activeTab === "create" ? "btn-primary text-primary-content" : "btn-ghost text-base-content/80"}`}
            onClick={() => setActiveTab("create")}
          >
            생성
          </button>
        </div>
      </div>

      {activeTab === "my" ? (
        loadBusy ? (
          <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-base-300 bg-base-300 text-sm text-base-content/60">
            불러오는 중…
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-rose-900/40 bg-rose-950/20 p-5 text-error/80">
            <p className="text-sm font-semibold">내 공격대를 불러오지 못했습니다.</p>
            <p className="mt-1 text-xs text-error/80/80">{loadError}</p>
          </div>
        ) : hasGroups ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => openPartyGroup(g.id)}
                className="rounded-2xl border border-base-300 bg-base-300 p-5 text-left shadow-sm transition-colors hover:border-base-300 hover:bg-base-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="truncate text-lg font-bold text-base-content">{g.name}</h2>
                  <span className="text-xs text-base-content/60">#{g.id}</span>
                </div>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm text-base-content/60">
                  {g.description ?? "설명이 없습니다."}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-base-content/60">멤버 {g.memberCount}명</span>
                  <span
                    className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                      g.isActive
                        ? "border border-emerald-600/50 bg-emerald-950/40 text-emerald-300"
                        : "border border-base-300 bg-base-300 text-base-content/60"
                    }`}
                  >
                    {g.isActive ? "활성" : "비활성"}
                  </span>
                </div>
                <p className="mt-3 text-right text-xs text-primary">공대 화면으로 이동 →</p>
              </button>
            ))}
          </div>
        ) : (
          <PartyEmptyState onCreateClick={() => setActiveTab("create")} />
        )
      ) : null}

      {/* 검색 기능 연결 전까지 임시 비활성화 */}

      {activeTab === "create" ? (
        <div className="rounded-2xl border border-base-300 bg-base-300 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-base-content">공격대 생성</h2>
          <p className="mt-1 text-xs text-base-content/60">
            TODO: 생성 API 연동 후 성공 시 목록을 서버 데이터로 새로고침
          </p>
          <div className="mt-4 max-w-xl">
            <PartyCreateForm
              onSubmit={(d) => void handleCreateSubmit(d)}
              onCancel={() => setActiveTab("my")}
              isSubmitting={createBusy}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PartyPageClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-base-300 bg-base-200/90 text-sm text-base-content/60">
          불러오는 중…
        </div>
      }
    >
      <PartyPageClientInner />
    </Suspense>
  );
}
