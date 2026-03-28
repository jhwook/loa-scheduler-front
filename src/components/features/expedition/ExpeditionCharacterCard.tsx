'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AddRaidModal } from '@/components/raid/add-raid-modal';
import { EditWeeklyRaidModal } from '@/components/raid/edit-weekly-raid-modal';
import {
  getCharacterWeeklyRaids,
  patchCharacterWeeklyRaidClear,
} from '@/lib/api/raid';
import { ApiError } from '@/types/api';
import type { MySavedCharacter } from '@/types/expedition';
import type { CharacterWeeklyRaidItem } from '@/types/raid';

type Props = {
  character: MySavedCharacter;
};

function formatLvText(itemAvgLevel: string): string {
  const raw = String(itemAvgLevel ?? '').replace(/,/g, '');
  const n = Number(raw);
  if (!Number.isFinite(n)) return itemAvgLevel;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function difficultyBadgeClass(difficulty: string): string {
  if (
    difficulty.includes('나메') ||
    difficulty.includes('나이트') ||
    difficulty.includes('3단계')
  ) {
    return 'border-fuchsia-400/60 bg-fuchsia-600 text-white';
  }
  if (difficulty.includes('하드') || difficulty.includes('2단계')) {
    return 'border-rose-400/60 bg-rose-600 text-white';
  }
  if (difficulty.includes('노말') || difficulty.includes('1단계')) {
    return 'border-slate-500 bg-slate-700 text-white';
  }
  return 'border-slate-500 bg-slate-700 text-white';
}

/**
 * 쇼핑몰 상품 카드처럼 상단 이미지 + 하단 정보
 */
export function ExpeditionCharacterCard({ character: c }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const [raidModalOpen, setRaidModalOpen] = useState(false);
  const [weeklyRaids, setWeeklyRaids] = useState<CharacterWeeklyRaidItem[]>([]);
  const [editModalRaidId, setEditModalRaidId] = useState<number | null>(null);
  const [editModalRaidName, setEditModalRaidName] = useState('');
  const [pendingClearIds, setPendingClearIds] = useState<Set<number>>(
    new Set()
  );
  const [animatedCurrentClearGold, setAnimatedCurrentClearGold] = useState(0);
  const animatedCurrentClearGoldRef = useRef(0);
  const src = c.characterImage?.trim();
  const showImage = Boolean(src) && !imageFailed;
  const lvText = formatLvText(c.itemAvgLevel);
  const classMark = (c.characterClassName?.[0] ?? '?').toUpperCase();

  const loadWeeklyRaids = useCallback(async () => {
    try {
      const rows = await getCharacterWeeklyRaids(c.id);
      setWeeklyRaids(rows);
    } catch (err) {
      // 카드 UI는 에러를 조용히 무시하고 빈 상태로 표시
      if (err instanceof ApiError || err instanceof Error) {
        setWeeklyRaids([]);
      }
    }
  }, [c.id]);

  useEffect(() => {
    void loadWeeklyRaids();
  }, [loadWeeklyRaids]);

  const raidGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        raidName: string;
        raidId: number;
        orderNo: number;
        items: CharacterWeeklyRaidItem[];
      }
    >();
    for (const row of weeklyRaids) {
      const raidName = row.raidGateInfo.raidInfo.raidName;
      const prev = map.get(raidName) ?? {
        raidName,
        raidId: row.raidGateInfo.raidInfo.id,
        orderNo: row.raidGateInfo.raidInfo.orderNo ?? 999,
        items: [],
      };
      prev.items.push(row);
      map.set(raidName, prev);
    }
    return [...map.values()]
      .map((g) => ({
        ...g,
        items: [...g.items].sort(
          (a, b) => a.raidGateInfo.gateNumber - b.raidGateInfo.gateNumber
        ),
      }))
      .sort((a, b) => a.orderNo - b.orderNo);
  }, [weeklyRaids]);

  const totalGold = useMemo(() => {
    return weeklyRaids.reduce(
      (acc, row) => {
        const extraCost = row.isExtraRewardSelected
          ? (row.extraRewardCostSnapshot ??
            row.raidGateInfo.extraRewardCost ??
            0)
          : 0;
        const normalGold = Math.max(0, row.raidGateInfo.rewardGold - extraCost);
        const boundGold = Math.max(0, row.raidGateInfo.boundGold);
        return {
          normal: acc.normal + normalGold,
          bound: acc.bound + boundGold,
        };
      },
      { normal: 0, bound: 0 }
    );
  }, [weeklyRaids]);

  const clearGoldProgress = useMemo(() => {
    return weeklyRaids.reduce(
      (acc, row) => {
        const extraCost = row.isExtraRewardSelected
          ? (row.extraRewardCostSnapshot ??
            row.raidGateInfo.extraRewardCost ??
            0)
          : 0;
        const normalGold = Math.max(0, row.raidGateInfo.rewardGold - extraCost);
        const boundGold = Math.max(0, row.raidGateInfo.boundGold);
        const clearGold = normalGold + boundGold;
        return {
          current: acc.current + (row.isCleared ? clearGold : 0),
          total: acc.total + clearGold,
        };
      },
      { current: 0, total: 0 }
    );
  }, [weeklyRaids]);

  const clearGoldProgressPercent = useMemo(() => {
    if (clearGoldProgress.total <= 0) return 0;
    return Math.min(
      100,
      (clearGoldProgress.current / clearGoldProgress.total) * 100
    );
  }, [clearGoldProgress]);
  const targetCurrentClearGold = clearGoldProgress.current;

  useEffect(() => {
    animatedCurrentClearGoldRef.current = animatedCurrentClearGold;
  }, [animatedCurrentClearGold]);

  useEffect(() => {
    const start = animatedCurrentClearGoldRef.current;
    const end = targetCurrentClearGold;
    if (start === end) return;

    const frames = 10;
    let f = 0;
    const timer = window.setInterval(() => {
      f += 1;
      const next = Math.round(start + ((end - start) * f) / frames);
      setAnimatedCurrentClearGold(next);
      if (f >= frames) {
        window.clearInterval(timer);
        setAnimatedCurrentClearGold(end);
      }
    }, 25);
    return () => window.clearInterval(timer);
  }, [targetCurrentClearGold]);

  async function toggleClear(weeklyRaidId: number) {
    if (pendingClearIds.has(weeklyRaidId)) return;
    const target = weeklyRaids.find((row) => row.id === weeklyRaidId);
    if (!target) return;
    const nextIsCleared = !target.isCleared;
    setPendingClearIds((prev) => new Set(prev).add(weeklyRaidId));
    const prevRows = weeklyRaids;
    setWeeklyRaids((prev) =>
      prev.map((row) =>
        row.id === weeklyRaidId ? { ...row, isCleared: !row.isCleared } : row
      )
    );
    try {
      await patchCharacterWeeklyRaidClear(weeklyRaidId, nextIsCleared);
    } catch {
      setWeeklyRaids(prevRows);
    } finally {
      setPendingClearIds((prev) => {
        const next = new Set(prev);
        next.delete(weeklyRaidId);
        return next;
      });
    }
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-sm">
      <div className="relative aspect-[3/4] w-full shrink-0 bg-slate-100">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- 외부/가변 도메인 URL 대응
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover object-top"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300">
            <span className="select-none text-5xl font-bold text-slate-400/90">
              {(c.characterName[0] ?? '?').toUpperCase()}
            </span>
          </div>
        )}
        <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-md bg-slate-900/85 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          {c.serverName}
        </span>
      </div>

      <div className="border-t border-slate-800 bg-slate-900 px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-500 bg-slate-800 text-[12px] font-bold text-slate-100">
            {classMark}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[17px] font-bold leading-tight text-slate-100">
              {c.characterName}
            </h3>
            <p className="mt-0.5 truncate text-[13px] text-slate-300">
              <span>{c.serverName}</span>
              <span className="mx-1.5 text-slate-500">/</span>
              <span>Lv.{lvText}</span>
              <span className="mx-1.5 text-slate-500">/</span>
              <span className="font-semibold text-rose-400">
                {c.combatPower}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-slate-950">
        <div className="border-t border-slate-800 bg-slate-900 px-3 py-3">
          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-2.5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-300">일일</p>
              <div className="flex items-center gap-1.5">
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300">
                  가던
                </span>
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300">
                  가토
                </span>
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300">
                  +
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-300">주간</p>
              <div className="flex items-center gap-1.5">
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300">
                  천상
                </span>
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300">
                  혈석
                </span>
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300">
                  싱글
                </span>
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300">
                  +
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-3 py-3">
          <p className="flex items-end justify-center gap-1 text-[14px] font-bold text-amber-300">
            <span className="inline-flex items-center">
              {animatedCurrentClearGold.toLocaleString()}
            </span>
            <span className="font-medium text-slate-300">
              / {clearGoldProgress.total.toLocaleString()} G
            </span>
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-300"
              style={{ width: `${clearGoldProgressPercent}%` }}
            />
          </div>
        </div>

        <div className="border-t border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-3 py-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <p className="text-[15px] font-semibold text-indigo-300">레이드</p>
            <button
              type="button"
              className="rounded-md border border-slate-600 bg-slate-800/70 px-2 py-0.5 text-[11px] font-semibold text-slate-200"
              onClick={() => setRaidModalOpen(true)}
            >
              레이드 추가
            </button>
          </div>

          {raidGroups.length === 0 ? (
            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-5 text-center">
              <p className="text-[15px] font-medium text-slate-400">
                레이드 없음
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {raidGroups.map((group, idx) => (
                <div
                  key={group.raidName}
                  className={idx === 0 ? '' : 'border-t border-slate-800 pt-3'}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-semibold text-slate-100">
                          {group.raidName}
                        </p>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs min-h-0 h-6 w-6 shrink-0 p-0 text-slate-300"
                          onClick={() => {
                            setEditModalRaidId(group.raidId);
                            setEditModalRaidName(group.raidName);
                          }}
                          aria-label={`${group.raidName} 설정`}
                        >
                          <span className="text-lg leading-none">⚙</span>
                        </button>
                      </div>
                      <p className="mt-0.5 text-[20px] leading-none text-amber-300">
                        <span className="text-[18px] font-bold">
                          {group.items
                            .reduce((acc, row) => {
                              const base =
                                row.raidGateInfo.rewardGold +
                                row.raidGateInfo.boundGold;
                              const extraCost = row.isExtraRewardSelected
                                ? (row.extraRewardCostSnapshot ??
                                  row.raidGateInfo.extraRewardCost ??
                                  0)
                                : 0;
                              return acc + Math.max(0, base - extraCost);
                            }, 0)
                            .toLocaleString()}
                        </span>
                        <span className="ml-1 text-[11px]">G</span>
                      </p>
                    </div>
                    <div className="flex items-end gap-1.5">
                      {group.items.map((row) => (
                        <div
                          key={row.id}
                          className="flex w-12 flex-col items-center gap-1"
                        >
                          <span
                            className={`badge border h-4 min-h-4 rounded-md px-1 text-[8px] leading-none ${difficultyBadgeClass(
                              row.raidGateInfo.difficulty
                            )}`}
                          >
                            {row.raidGateInfo.difficulty}
                          </span>
                          <button
                            type="button"
                            className={`indicator relative flex h-10 w-10 items-center justify-center rounded-md border text-[16px] font-semibold ${
                              row.isCleared
                                ? 'border-emerald-500 bg-emerald-900/40 text-emerald-200'
                                : 'border-slate-700 bg-slate-950 text-slate-200'
                            } ${pendingClearIds.has(row.id) ? 'opacity-60' : ''}`}
                            onClick={() => toggleClear(row.id)}
                            disabled={pendingClearIds.has(row.id)}
                            aria-label={`${group.raidName} ${row.raidGateInfo.gateNumber}관문 클리어 토글`}
                          >
                            {row.raidGateInfo.gateNumber}
                            {row.isExtraRewardSelected ? (
                              <span className="badge badge-xs badge-outline indicator-item border-emerald-500 bg-slate-900 px-1.5 text-[10px] leading-none text-emerald-400">
                                +
                              </span>
                            ) : null}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-end justify-between border-t border-slate-800 pt-2">
                <span className="text-[16px] font-bold text-amber-300">
                  합계
                </span>
                <div className="inline-flex items-end gap-2 text-[14px] font-bold text-amber-300">
                  <span>{totalGold.normal.toLocaleString()} G</span>
                  <span className="text-slate-500">/</span>
                  <span className="inline-flex flex-col items-start">
                    <span className="badge badge-warning mb-0.5 h-4 min-h-4 rounded-full px-1 text-[8px] leading-none text-slate-900">
                      귀속
                    </span>
                    <span>{totalGold.bound.toLocaleString()} G</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <AddRaidModal
        open={raidModalOpen}
        characterId={c.id}
        onClose={() => setRaidModalOpen(false)}
        onSaved={() => {
          void loadWeeklyRaids();
        }}
      />
      <EditWeeklyRaidModal
        open={Boolean(editModalRaidId)}
        characterId={c.id}
        allWeeklyRows={weeklyRaids}
        raidId={editModalRaidId}
        raidName={editModalRaidName}
        weeklyRows={
          editModalRaidId
            ? weeklyRaids.filter(
                (row) => row.raidGateInfo.raidInfo.id === editModalRaidId
              )
            : []
        }
        onClose={() => {
          setEditModalRaidId(null);
          setEditModalRaidName('');
        }}
        onSaved={() => {
          void loadWeeklyRaids();
        }}
      />
    </article>
  );
}
