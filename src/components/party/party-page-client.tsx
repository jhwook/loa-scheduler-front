"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { PartyCreateForm } from "@/components/party/party-create-form";
import { PartyEmptyState } from "@/components/party/party-empty-state";
import { PartySearchPanel } from "@/components/party/party-search-panel";
import { MOCK_PARTY_GROUPS_WITH_DATA } from "@/lib/party/mock-data";
import type { PartyGroupCreateInput, PartyGroupDetail } from "@/types/party";

type PartyViewTab = "my" | "search" | "create";

/**
 * 공격대 페이지 클라이언트 래퍼 (useSearchParams → Suspense로 감싸서 사용)
 */
function PartyPageClientInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mockParam = searchParams.get("mock");

  const [groups, setGroups] = useState<PartyGroupDetail[]>(() =>
    mockParam === "empty" ? [] : MOCK_PARTY_GROUPS_WITH_DATA,
  );

  const [createBusy, setCreateBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<PartyViewTab>("my");

  /** 쿼리 mock 전환 시 목 데이터 동기화 (개발용) */
  useEffect(() => {
    if (mockParam === "empty") {
      setGroups([]);
      return;
    }
    setGroups(MOCK_PARTY_GROUPS_WITH_DATA);
  }, [mockParam]);

  const hasGroups = groups.length > 0;

  /** TODO: POST /party-groups — 성공 시 목록 갱신 */
  async function handleCreateSubmit(data: PartyGroupCreateInput) {
    setCreateBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      const nextId = groups.reduce((m, g) => Math.max(m, g.id), 0) + 1;
      const newGroup: PartyGroupDetail = {
        id: nextId,
        name: data.name,
        description: data.description || null,
        memberCount: 1,
        isActive: true,
        members: [
          {
            id: nextId * 1000,
            userId: 0,
            username: "me",
            nickname: null,
            displayName: "나",
            characters: [],
          },
        ],
      };
      setGroups((prev) => [...prev, newGroup]);
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
      <div className="navbar rounded-2xl border border-slate-800 bg-slate-950 px-4 text-slate-200 shadow-sm">
        <div className="flex w-full flex-wrap items-center gap-2">
          <button
            type="button"
            className={`btn btn-sm ${activeTab === "my" ? "btn-primary text-slate-950" : "btn-ghost text-slate-300"}`}
            onClick={() => setActiveTab("my")}
          >
            내 공격대
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === "search" ? "btn-primary text-slate-950" : "btn-ghost text-slate-300"}`}
            onClick={() => setActiveTab("search")}
          >
            검색
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === "create" ? "btn-primary text-slate-950" : "btn-ghost text-slate-300"}`}
            onClick={() => setActiveTab("create")}
          >
            생성
          </button>
        </div>
      </div>

      {activeTab === "my" ? (
        hasGroups ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => openPartyGroup(g.id)}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-left shadow-sm transition-colors hover:border-slate-600 hover:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="truncate text-lg font-bold text-slate-100">{g.name}</h2>
                  <span className="text-xs text-slate-500">#{g.id}</span>
                </div>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-400">
                  {g.description ?? "설명이 없습니다."}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-500">멤버 {g.memberCount}명</span>
                  <span
                    className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                      g.isActive
                        ? "border border-emerald-600/50 bg-emerald-950/40 text-emerald-300"
                        : "border border-slate-700 bg-slate-800 text-slate-400"
                    }`}
                  >
                    {g.isActive ? "활성" : "비활성"}
                  </span>
                </div>
                <p className="mt-3 text-right text-xs text-indigo-300">공대 화면으로 이동 →</p>
              </button>
            ))}
          </div>
        ) : (
          <PartyEmptyState onCreateClick={() => setActiveTab("create")} />
        )
      ) : null}

      {activeTab === "search" ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-100">공격대 검색</h2>
          <p className="mt-1 text-sm text-slate-400">
            이름으로 공격대를 조회하고 참여 요청할 수 있도록 확장할 예정입니다.
          </p>
          <div className="mt-4">
            <PartySearchPanel />
          </div>
          <div className="mt-5 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-8 text-center">
            <p className="text-sm text-slate-400">검색 결과 영역 (예정)</p>
          </div>
        </div>
      ) : null}

      {activeTab === "create" ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-100">공격대 생성</h2>
          <p className="mt-1 text-xs text-slate-500">
            TODO: 생성 API 연동 후 성공 시 목록을 서버 데이터로 새로고침
          </p>
          <div className="mt-4 max-w-xl">
            <PartyCreateForm
              onSubmit={(d) => void handleCreateSubmit(d)}
              onCancel={() => setActiveTab(hasGroups ? "my" : "search")}
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
        <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-sm text-slate-500">
          불러오는 중…
        </div>
      }
    >
      <PartyPageClientInner />
    </Suspense>
  );
}
