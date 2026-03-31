'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AddRaidModal } from '@/components/raid/add-raid-modal';
import { EditWeeklyRaidModal } from '@/components/raid/edit-weekly-raid-modal';
import {
  getCharacterWeeklyRaids,
  patchCharacterWeeklyRaidClear,
} from '@/lib/api/raid';
import { getClassIconSrc, resolveClassIconBasename } from '@/lib/class-icon';
import { ApiError } from '@/types/api';
import type { MySavedCharacter } from '@/types/expedition';
import type { CharacterWeeklyRaidItem } from '@/types/raid';

type Props = {
  character: MySavedCharacter;
  isRefreshing: boolean;
  onRefresh: () => void;
  cooldownRemainingSec: number;
  /** 전체 새로고침 등으로 개별 버튼을 잠글 때 */
  refreshLocked: boolean;
};

function InlineSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? 'h-3.5 w-3.5'}`}
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

function formatRelativeLastSynced(iso?: string | null): string {
  if (!iso?.trim()) return '기록 없음';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '기록 없음';
  const sec = Math.floor((Date.now() - t) / 1000);
  if (sec < 0) return '방금';
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  return `${day}일 전`;
}

function RelativeLastSynced({ at }: { at?: string | null }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span>{formatRelativeLastSynced(at)}</span>;
}

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
export function ExpeditionCharacterCard({
  character: c,
  isRefreshing,
  onRefresh,
  cooldownRemainingSec,
  refreshLocked,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const [classIconFailed, setClassIconFailed] = useState(false);
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
  const classIconBasename = useMemo(
    () => resolveClassIconBasename(c.characterClassName),
    [c.characterClassName],
  );
  const classIconSrc = classIconBasename
    ? getClassIconSrc(classIconBasename)
    : null;

  useEffect(() => {
    setClassIconFailed(false);
  }, [classIconSrc]);

  const refreshDisabled =
    isRefreshing ||
    cooldownRemainingSec > 0 ||
    refreshLocked;

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

  const editModalWeeklyRows = useMemo(() => {
    if (!editModalRaidId) return [];
    return weeklyRaids.filter(
      (row) => row.raidGateInfo.raidInfo.id === editModalRaidId,
    );
  }, [editModalRaidId, weeklyRaids]);

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
        <span className="absolute left-2 top-2 z-[1] max-w-[calc(100%-4rem)] truncate rounded-md bg-slate-900/85 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          {c.serverName}
        </span>
        <button
          type="button"
          aria-label="캐릭터 새로고침"
          title={
            cooldownRemainingSec > 0 && !isRefreshing
              ? `${cooldownRemainingSec}초 후 다시 시도`
              : '캐릭터 정보 새로고침'
          }
          disabled={refreshDisabled}
          onClick={onRefresh}
          className="absolute right-2 top-2 z-10 flex min-h-8 min-w-8 items-center justify-center gap-0.5 rounded-md border border-slate-600/80 bg-slate-900/90 px-1.5 text-slate-100 shadow backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRefreshing ? (
            <InlineSpinner className="h-3.5 w-3.5 text-slate-100" />
          ) : (
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          )}
          {cooldownRemainingSec > 0 && !isRefreshing ? (
            <span className="text-[9px] font-semibold tabular-nums">
              {cooldownRemainingSec}s
            </span>
          ) : null}
        </button>
      </div>

      <div className="border-t border-slate-800 bg-slate-900 px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-500 bg-slate-800 text-[12px] font-bold text-slate-100">
            {classIconSrc && !classIconFailed ? (
              // eslint-disable-next-line @next/next/no-img-element -- public 정적 직업 아이콘
              <img
                src={classIconSrc}
                alt=""
                className="h-full w-full object-cover brightness-0 invert"
                onError={() => setClassIconFailed(true)}
              />
            ) : (
              classMark
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[clamp(14px,1.15vw,17px)] font-bold leading-tight text-slate-100">
              {c.characterName}
            </h3>
            <p className="mt-0.5 truncate text-[clamp(11px,0.9vw,13px)] text-slate-300">
              <span>{c.serverName}</span>
              <span className="mx-1.5 text-slate-500">/</span>
              <span>Lv.{lvText}</span>
              <span className="mx-1.5 text-slate-500">/</span>
              <span className="font-semibold text-rose-400">
                {c.combatPower}
              </span>
            </p>
            <p className="mt-1 text-[clamp(9px,0.75vw,10px)] text-slate-500">
              최근 업데이트:{' '}
              <RelativeLastSynced at={c.lastSyncedAt} />
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
          <p className="flex items-end justify-center gap-1 text-[clamp(12px,0.95vw,14px)] font-bold text-amber-300">
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
            <p className="text-[clamp(13px,1vw,15px)] font-semibold text-indigo-300">레이드</p>
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
                        <p className="truncate text-[clamp(11px,0.9vw,13px)] font-semibold text-slate-100">
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
                      <p className="mt-0.5 text-[clamp(15px,1.3vw,20px)] leading-none text-amber-300">
                        <span className="text-[clamp(14px,1.15vw,18px)] font-bold">
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
                        <span className="ml-1 text-[clamp(10px,0.8vw,11px)]">G</span>
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
                            className={`indicator relative flex h-10 w-10 items-center justify-center rounded-md border text-[clamp(13px,1vw,16px)] font-semibold ${
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
                <span className="text-[clamp(13px,1vw,16px)] font-bold text-amber-300">
                  합계
                </span>
                <div className="inline-flex items-end gap-2 text-[clamp(12px,0.95vw,14px)] font-bold text-amber-300">
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
        weeklyRows={editModalWeeklyRows}
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
