'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ExpeditionCharacterCard } from '@/components/features/expedition/ExpeditionCharacterCard';
import {
  postCharacterRefresh,
  postCharactersRefreshAll,
} from '@/lib/api/characters-refresh';
import { getCharactersDashboard } from '@/lib/api/expedition';
import { useRefreshCooldown } from '@/hooks/useRefreshCooldown';
import { ApiError } from '@/types/api';
import {
  mapDashboardCharacterToMySaved,
  type CharacterDashboardRow,
  type CharactersDashboardResponse,
  type PartyRole,
} from '@/types/expedition';

function RefreshAllSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? 'h-4 w-4'}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function parseItemAvgLevel(level: string | null | undefined): number {
  const n = parseFloat(
    String(level ?? '')
      .replace(/,/g, '')
      .trim()
  );
  return Number.isFinite(n) ? n : 0;
}

function groupByServerSorted(
  list: CharacterDashboardRow[]
): Map<string, CharacterDashboardRow[]> {
  const map = new Map<string, CharacterDashboardRow[]>();
  for (const c of list) {
    const key = c.serverName?.trim() ? c.serverName : '';
    const prev = map.get(key) ?? [];
    prev.push(c);
    map.set(key, prev);
  }
  for (const [name, chars] of map) {
    const sorted = [...chars].sort(
      (a, b) =>
        parseItemAvgLevel(b.itemAvgLevel) - parseItemAvgLevel(a.itemAvgLevel)
    );
    map.set(name, sorted);
  }
  return map;
}

export function ExpeditionMyCharacterList() {
  const [dashboard, setDashboard] =
    useState<CharactersDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshingIds, setRefreshingIds] = useState<Set<number>>(
    () => new Set()
  );
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [toast, setToast] = useState<{
    kind: 'ok' | 'err';
    text: string;
  } | null>(null);

  const cooldown = useRefreshCooldown();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCharactersDashboard();
      setDashboard(data);
    } catch (err) {
      let msg = '캐릭터 목록을 불러오지 못했습니다.';
      if (err instanceof ApiError) msg = err.message;
      else if (err instanceof Error) msg = err.message;
      setError(msg);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshDashboardQuiet = useCallback(async () => {
    try {
      const data = await getCharactersDashboard();
      setDashboard(data);
    } catch (err) {
      let msg = '목록 갱신에 실패했습니다.';
      if (err instanceof ApiError) msg = err.message;
      else if (err instanceof Error) msg = err.message;
      setToast({ kind: 'err', text: msg });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refresh = () => {
      void load();
    };
    window.addEventListener('expedition-characters-synced', refresh);
    return () => {
      window.removeEventListener('expedition-characters-synced', refresh);
    };
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const handleRefreshOne = useCallback(
    async (id: number) => {
      setRefreshingIds((prev) => new Set(prev).add(id));
      try {
        await postCharacterRefresh(id);
        cooldown.startCharCooldown(id);
        await refreshDashboardQuiet();
        setToast({ kind: 'ok', text: '캐릭터 정보를 갱신했습니다.' });
      } catch (err) {
        let msg = '새로고침에 실패했습니다.';
        if (err instanceof ApiError) msg = err.message;
        else if (err instanceof Error) msg = err.message;
        setToast({ kind: 'err', text: msg });
      } finally {
        setRefreshingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [cooldown, refreshDashboardQuiet]
  );

  const handlePartyRoleUpdated = useCallback(
    (characterId: number, partyRole: PartyRole) => {
      setDashboard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          characters: prev.characters.map((row) =>
            row.id === characterId ? { ...row, partyRole } : row
          ),
        };
      });
    },
    []
  );

  const handleRefreshAll = useCallback(async () => {
    setRefreshingAll(true);
    try {
      const r = await postCharactersRefreshAll();
      cooldown.startAllCooldown();
      await refreshDashboardQuiet();
      setToast({
        kind: 'ok',
        text: `전체 새로고침 완료 (성공 ${r.successCount}건, 실패 ${r.failureCount}건)`,
      });
    } catch (err) {
      let msg = '전체 새로고침에 실패했습니다.';
      if (err instanceof ApiError) msg = err.message;
      else if (err instanceof Error) msg = err.message;
      setToast({ kind: 'err', text: msg });
    } finally {
      setRefreshingAll(false);
    }
  }, [cooldown, refreshDashboardQuiet]);

  const rows = dashboard?.characters ?? [];
  const totalCharacterCount = dashboard?.totalCharacterCount ?? 0;
  const grouped = useMemo(() => groupByServerSorted(rows), [rows]);
  const serverEntries = useMemo(() => [...grouped.entries()], [grouped]);

  const allButtonDisabled =
    refreshingAll || cooldown.allRemainingSec > 0 || refreshingIds.size > 0;

  if (loading) {
    return (
      <div className="rounded-2xl border border-base-300 bg-base-200/80 px-6 py-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="skeleton h-5 w-28" />
            <div className="skeleton h-8 w-24 rounded-lg" />
          </div>
          <div className="skeleton h-10 w-full rounded-lg" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="skeleton h-28 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-6 py-6 text-sm text-rose-800 shadow-sm">
        <p>{error}</p>
        <button
          type="button"
          className="mt-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          onClick={() => void load()}
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
        아직 저장된 캐릭터가 없습니다.
        <br />
        <span className="text-xs text-slate-400">
          우측 상단 <strong className="text-slate-600">+ 캐릭터 추가</strong>로
          검색·저장해 보세요.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div
          role="status"
          className={
            toast.kind === 'ok'
              ? 'fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-lg'
              : 'fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 shadow-lg'
          }
        >
          {toast.text}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800">
          내 캐릭터{' '}
          <span className="font-normal text-slate-500">
            ({totalCharacterCount}명)
          </span>
        </h2>
        <button
          type="button"
          disabled={allButtonDisabled}
          onClick={() => void handleRefreshAll()}
          title={
            cooldown.allRemainingSec > 0 && !refreshingAll
              ? `${cooldown.allRemainingSec}초 후 다시 시도`
              : '모든 캐릭터 정보 새로고침'
          }
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshingAll ? (
            <RefreshAllSpinner className="h-4 w-4 text-slate-700" />
          ) : null}
          <span>전체 새로고침</span>
          {cooldown.allRemainingSec > 0 && !refreshingAll ? (
            <span className="text-xs font-normal tabular-nums text-slate-500">
              ({cooldown.allRemainingSec}초)
            </span>
          ) : null}
        </button>
      </div>

      {serverEntries.map(([serverName, chars]) => (
        <section key={serverName || '__none'}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {serverName.trim() ? serverName : '서버 미지정'}{' '}
            <span className="font-normal text-slate-400">({chars.length})</span>
          </h3>
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(254px,1fr))]">
            {chars.map((c) => (
              <ExpeditionCharacterCard
                key={c.id}
                character={mapDashboardCharacterToMySaved(c)}
                weeklyRaids={c.weeklyRaids}
                weeklyGoldTotal={c.weeklyGoldTotal}
                weeklyBoundGoldTotal={c.weeklyBoundGoldTotal}
                reloadDashboard={() => void refreshDashboardQuiet()}
                isRefreshing={refreshingIds.has(c.id)}
                onRefresh={() => void handleRefreshOne(c.id)}
                cooldownRemainingSec={cooldown.charRemainingSec(c.id)}
                refreshLocked={refreshingAll}
                onCharacterDeleted={({ message }) => {
                  void refreshDashboardQuiet();
                  setToast({
                    kind: 'ok',
                    text: message?.trim() ?? '캐릭터가 삭제되었습니다.',
                  });
                }}
                onDeleteFailed={(msg) => setToast({ kind: 'err', text: msg })}
                onPartyRoleUpdated={handlePartyRoleUpdated}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
