"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ExpeditionCharacterCard } from "@/components/features/expedition/ExpeditionCharacterCard";
import { getMyCharacters } from "@/lib/api/expedition";
import { ApiError } from "@/types/api";
import type { MySavedCharacter } from "@/types/expedition";

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

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const refresh = () => {
      void load();
    };
    window.addEventListener("expedition-characters-synced", refresh);
    return () =>
      window.removeEventListener("expedition-characters-synced", refresh);
  }, [load]);

  const grouped = useMemo(() => groupByServerSorted(rows), [rows]);
  const serverEntries = useMemo(() => [...grouped.entries()], [grouped]);

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
          onClick={() => load()}
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
      <h2 className="text-sm font-semibold text-slate-800">
        내 캐릭터{" "}
        <span className="font-normal text-slate-500">({rows.length}명)</span>
      </h2>

      {serverEntries.map(([serverName, chars]) => (
        <section key={serverName}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {serverName}{" "}
            <span className="font-normal text-slate-400">({chars.length})</span>
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {chars.map((c) => (
              <ExpeditionCharacterCard key={c.id} character={c} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
