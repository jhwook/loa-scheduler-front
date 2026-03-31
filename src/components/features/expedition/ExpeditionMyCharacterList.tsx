"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ExpeditionCharacterCard } from "@/components/features/expedition/ExpeditionCharacterCard";
import {
  postCharacterRefresh,
  postCharactersRefreshAll,
} from "@/lib/api/characters-refresh";
import { getMyCharacters } from "@/lib/api/expedition";
import { useRefreshCooldown } from "@/hooks/useRefreshCooldown";
import { ApiError } from "@/types/api";
import type { MySavedCharacter } from "@/types/expedition";

function RefreshAllSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? "h-4 w-4"}`}
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

function parseItemAvgLevel(level: string): number {
  const n = parseFloat(String(level).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

function groupByServerSorted(
  list: MySavedCharacter[],
): Map<string, MySavedCharacter[]> {
  const map = new Map<string, MySavedCharacter[]>();
  for (const c of list) {
    const prev = map.get(c.serverName) ?? [];
    prev.push(c);
    map.set(c.serverName, prev);
  }
  for (const [name, chars] of map) {
    const sorted = [...chars].sort(
      (a, b) =>
        parseItemAvgLevel(b.itemAvgLevel) - parseItemAvgLevel(a.itemAvgLevel),
    );
    map.set(name, sorted);
  }
  return map;
}

export function ExpeditionMyCharacterList() {
  const [rows, setRows] = useState<MySavedCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshingIds, setRefreshingIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [toast, setToast] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);

  const cooldown = useRefreshCooldown();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyCharacters();
      setRows(data);
    } catch (err) {
      let msg = "캐릭터 목록을 불러오지 못했습니다.";
      if (err instanceof ApiError) msg = err.message;
      else if (err instanceof Error) msg = err.message;
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshListQuiet = useCallback(async () => {
    const data = await getMyCharacters();
    setRows(data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refresh = () => {
      void load();
    };
    window.addEventListener("expedition-characters-synced", refresh);
    return () => {
      window.removeEventListener("expedition-characters-synced", refresh);
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
        await refreshListQuiet();
        setToast({ kind: "ok", text: "캐릭터 정보를 갱신했습니다." });
      } catch (err) {
        let msg = "새로고침에 실패했습니다.";
        if (err instanceof ApiError) msg = err.message;
        else if (err instanceof Error) msg = err.message;
        setToast({ kind: "err", text: msg });
      } finally {
        setRefreshingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [cooldown, refreshListQuiet],
  );

  const handleRefreshAll = useCallback(async () => {
    setRefreshingAll(true);
    try {
      const r = await postCharactersRefreshAll();
      cooldown.startAllCooldown();
      await refreshListQuiet();
      setToast({
        kind: "ok",
        text: `전체 새로고침 완료 (성공 ${r.successCount}건, 실패 ${r.failureCount}건)`,
      });
    } catch (err) {
      let msg = "전체 새로고침에 실패했습니다.";
      if (err instanceof ApiError) msg = err.message;
      else if (err instanceof Error) msg = err.message;
      setToast({ kind: "err", text: msg });
    } finally {
      setRefreshingAll(false);
    }
  }, [cooldown, refreshListQuiet]);

  const grouped = useMemo(() => groupByServerSorted(rows), [rows]);
  const serverEntries = useMemo(() => [...grouped.entries()], [grouped]);

  const allButtonDisabled =
    refreshingAll ||
    cooldown.allRemainingSec > 0 ||
    refreshingIds.size > 0;

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/80 px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
        캐릭터 목록을 불러오는 중…
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
          우측 상단 <strong className="text-slate-600">+ 원정대 추가</strong>로
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
            toast.kind === "ok"
              ? "fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-lg"
              : "fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 shadow-lg"
          }
        >
          {toast.text}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800">
          내 캐릭터{" "}
          <span className="font-normal text-slate-500">({rows.length}명)</span>
        </h2>
        <button
          type="button"
          disabled={allButtonDisabled}
          onClick={() => void handleRefreshAll()}
          title={
            cooldown.allRemainingSec > 0 && !refreshingAll
              ? `${cooldown.allRemainingSec}초 후 다시 시도`
              : "모든 캐릭터 정보 새로고침"
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
        <section key={serverName}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {serverName}{" "}
            <span className="font-normal text-slate-400">({chars.length})</span>
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
            {chars.map((c) => (
              <ExpeditionCharacterCard
                key={c.id}
                character={c}
                isRefreshing={refreshingIds.has(c.id)}
                onRefresh={() => void handleRefreshOne(c.id)}
                cooldownRemainingSec={cooldown.charRemainingSec(c.id)}
                refreshLocked={refreshingAll}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
