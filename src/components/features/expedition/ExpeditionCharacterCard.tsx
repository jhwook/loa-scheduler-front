'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { SupporterRoleMark } from '@/components/ui/supporter-role-mark';
import { AddRaidModal } from '@/components/raid/add-raid-modal';
import { EditWeeklyRaidModal } from '@/components/raid/edit-weekly-raid-modal';
import { deleteCharacter, patchCharacterPartyRole } from '@/lib/api/expedition';
import {
  patchCharacterWeeklyRaidClear,
  patchCharacterWeeklyRaidsOrder,
} from '@/lib/api/raid';
import { getClassIconSrc, resolveClassIconBasename } from '@/lib/class-icon';
import { ApiError } from '@/types/api';
import type { MySavedCharacter, PartyRole } from '@/types/expedition';
import { normalizePartyRole } from '@/types/expedition';
import type { CharacterWeeklyRaidItem } from '@/types/raid';

type Props = {
  character: MySavedCharacter;
  /** GET /characters/dashboard 에서 내려준 주간 레이드 행 */
  weeklyRaids: CharacterWeeklyRaidItem[];
  weeklyGoldTotal: number;
  weeklyBoundGoldTotal: number;
  /** 레이드 추가·편집 등 목록이 바뀐 뒤 대시보드 재조회 */
  reloadDashboard: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  cooldownRemainingSec: number;
  /** 전체 새로고침 등으로 개별 버튼을 잠글 때 */
  refreshLocked: boolean;
  /** 삭제 성공 후 목록 갱신·토스트 등 */
  onCharacterDeleted: (result: { message?: string }) => void;
  /** 삭제 실패 시 메시지 표시용 */
  onDeleteFailed: (message: string) => void;
  /** 역할 변경 성공 시 부모 대시보드 상태만 갱신 (전체 재조회 없음) */
  onPartyRoleUpdated?: (characterId: number, partyRole: PartyRole) => void;
};

type WeeklyRaidGroup = {
  raidName: string;
  raidId: number;
  items: CharacterWeeklyRaidItem[];
};

function raidGroupSortableId(raidId: number): string {
  return `raid-group-${raidId}`;
}

function parseRaidIdFromSortableId(value: string): number | null {
  if (!value.startsWith('raid-group-')) return null;
  const n = Number(value.slice('raid-group-'.length));
  return Number.isFinite(n) ? n : null;
}

function SortableRaidGroup({
  raidId,
  disabled,
  className,
  children,
}: {
  raidId: number;
  disabled: boolean;
  className: string;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: raidGroupSortableId(raidId),
      disabled,
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`${className} touch-none ${isDragging ? 'z-10 opacity-60' : ''} ${disabled ? 'cursor-progress' : 'cursor-grab active:cursor-grabbing'}`}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

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
    return 'border-neutral bg-neutral text-neutral-content';
  }
  return 'border-neutral bg-neutral text-neutral-content';
}

/**
 * 쇼핑몰 상품 카드처럼 상단 이미지 + 하단 정보
 */
export function ExpeditionCharacterCard({
  character: c,
  weeklyRaids: weeklyRaidsProp,
  weeklyGoldTotal,
  weeklyBoundGoldTotal,
  reloadDashboard,
  isRefreshing,
  onRefresh,
  cooldownRemainingSec,
  refreshLocked,
  onCharacterDeleted,
  onDeleteFailed,
  onPartyRoleUpdated,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const [classIconFailed, setClassIconFailed] = useState(false);
  const [raidModalOpen, setRaidModalOpen] = useState(false);
  const [weeklyRaids, setWeeklyRaids] = useState<CharacterWeeklyRaidItem[]>(
    () => weeklyRaidsProp
  );
  const [editModalRaidId, setEditModalRaidId] = useState<number | null>(null);
  const [editModalRaidName, setEditModalRaidName] = useState('');
  const [pendingClearIds, setPendingClearIds] = useState<Set<number>>(
    new Set()
  );
  const [animatedCurrentClearGold, setAnimatedCurrentClearGold] = useState(0);
  const animatedCurrentClearGoldRef = useRef(0);
  const [raidOrderIds, setRaidOrderIds] = useState<number[]>([]);
  const [raidOrderSaving, setRaidOrderSaving] = useState(false);
  const dndSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );
  const src = c.characterImage?.trim();
  const showImage = Boolean(src) && !imageFailed;
  const lvText = formatLvText(c.itemAvgLevel);
  const classMark = (c.characterClassName?.[0] ?? '?').toUpperCase();
  const classIconBasename = useMemo(
    () => resolveClassIconBasename(c.characterClassName),
    [c.characterClassName]
  );
  const classIconSrc = classIconBasename
    ? getClassIconSrc(classIconBasename)
    : null;

  useEffect(() => {
    setClassIconFailed(false);
  }, [classIconSrc]);
  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const refreshDisabled =
    isRefreshing || cooldownRemainingSec > 0 || refreshLocked;

  const [deleting, setDeleting] = useState(false);

  const [partyRole, setPartyRole] = useState<PartyRole>(() =>
    normalizePartyRole(c.partyRole)
  );
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    setPartyRole(normalizePartyRole(c.partyRole));
  }, [c.id, c.partyRole]);

  async function handlePartyRoleChange(next: PartyRole) {
    if (roleSaving || next === partyRole) return;
    setRoleError(null);
    const previous = partyRole;
    setPartyRole(next);
    setRoleSaving(true);
    try {
      const res = await patchCharacterPartyRole(c.id, next);
      const resolved = normalizePartyRole(res.character?.partyRole ?? next);
      setPartyRole(resolved);
      onPartyRoleUpdated?.(c.id, resolved);
    } catch (err) {
      setPartyRole(previous);
      let msg = '역할 변경에 실패했습니다.';
      if (err instanceof ApiError) msg = err.message;
      else if (err instanceof Error) msg = err.message;
      setRoleError(msg);
    } finally {
      setRoleSaving(false);
    }
  }

  async function handleDelete() {
    if (deleting || refreshLocked) return;
    const ok = window.confirm(
      `「${c.characterName}」 캐릭터를 원정대에서 삭제할까요?\n삭제 후 되돌릴 수 없습니다.`
    );
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await deleteCharacter(c.id);
      onCharacterDeleted({ message: res.message });
    } catch (err) {
      let msg = '캐릭터 삭제에 실패했습니다.';
      if (err instanceof ApiError) msg = err.message;
      else if (err instanceof Error) msg = err.message;
      onDeleteFailed(msg);
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    setWeeklyRaids(weeklyRaidsProp);
  }, [weeklyRaidsProp]);

  const raidGroups = useMemo<WeeklyRaidGroup[]>(() => {
    const map = new Map<string, WeeklyRaidGroup>();
    for (const row of weeklyRaids) {
      const raidName = row.raidGateInfo.raidInfo.raidName;
      const prev = map.get(raidName) ?? {
        raidName,
        raidId: row.raidGateInfo.raidInfo.id,
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
      }));
  }, [weeklyRaids]);

  useEffect(() => {
    const canonicalIds = raidGroups.map((g) => g.raidId);
    setRaidOrderIds((prev) => {
      const kept = prev.filter((id) => canonicalIds.includes(id));
      const missing = canonicalIds.filter((id) => !kept.includes(id));
      return [...kept, ...missing];
    });
  }, [raidGroups]);

  const orderedRaidGroups = useMemo(() => {
    const map = new Map(raidGroups.map((g) => [g.raidId, g] as const));
    const ordered = raidOrderIds
      .map((id) => map.get(id))
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
    if (ordered.length === raidGroups.length) return ordered;
    return raidGroups;
  }, [raidGroups, raidOrderIds]);

  async function persistRaidOrder(next: number[], before: number[]) {
    setRaidOrderSaving(true);
    try {
      await patchCharacterWeeklyRaidsOrder(c.id, {
        raidOrders: next.map((raidInfoId, index) => ({
          raidInfoId,
          orderNo: index + 1,
        })),
      });
      reloadDashboard();
    } catch {
      setRaidOrderIds(before);
    } finally {
      setRaidOrderSaving(false);
    }
  }

  function handleRaidSortEnd(event: DragEndEvent) {
    if (raidOrderSaving) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeRaidId = parseRaidIdFromSortableId(String(active.id));
    const overRaidId = parseRaidIdFromSortableId(String(over.id));
    if (activeRaidId == null || overRaidId == null) return;

    const before =
      raidOrderIds.length > 0 ? raidOrderIds : raidGroups.map((g) => g.raidId);
    const oldIndex = before.indexOf(activeRaidId);
    const newIndex = before.indexOf(overRaidId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

    const next = arrayMove(before, oldIndex, newIndex);
    setRaidOrderIds(next);
    void persistRaidOrder(next, before);
  }

  const totalGold = useMemo(
    () => ({
      normal: weeklyGoldTotal,
      bound: weeklyBoundGoldTotal,
    }),
    [weeklyGoldTotal, weeklyBoundGoldTotal]
  );

  const clearGoldProgress = useMemo(() => {
    const fromRaids = weeklyRaids.reduce(
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
    const cap = weeklyGoldTotal + weeklyBoundGoldTotal;
    return {
      current: fromRaids.current,
      total: cap > 0 ? cap : fromRaids.total,
    };
  }, [weeklyRaids, weeklyGoldTotal, weeklyBoundGoldTotal]);

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

  async function toggleClear(targetRow: CharacterWeeklyRaidItem) {
    const weeklyRaidId = targetRow.id;
    if (pendingClearIds.has(weeklyRaidId)) return;
    const target = weeklyRaids.find((row) => row.id === weeklyRaidId);
    if (!target) return;
    const nextIsCleared = !target.isCleared;

    const targetRaidInfoId = target.raidGateInfo.raidInfo.id;
    const targetDifficulty = target.raidGateInfo.difficulty;
    const targetGate = target.raidGateInfo.gateNumber;

    const affectedIds = weeklyRaids
      .filter(
        (row) =>
          row.raidGateInfo.raidInfo.id === targetRaidInfoId &&
          row.raidGateInfo.difficulty === targetDifficulty &&
          (nextIsCleared
            ? row.raidGateInfo.gateNumber <= targetGate
            : row.raidGateInfo.gateNumber >= targetGate)
      )
      .map((row) => row.id);
    if (affectedIds.length === 0) return;

    setPendingClearIds((prev) => {
      const next = new Set(prev);
      for (const id of affectedIds) next.add(id);
      return next;
    });
    const prevRows = weeklyRaids;
    setWeeklyRaids((prev) =>
      prev.map((row) =>
        affectedIds.includes(row.id)
          ? { ...row, isCleared: nextIsCleared }
          : row
      )
    );
    try {
      await Promise.all(
        affectedIds.map((id) => patchCharacterWeeklyRaidClear(id, nextIsCleared))
      );
    } catch {
      setWeeklyRaids(prevRows);
    } finally {
      setPendingClearIds((prev) => {
        const next = new Set(prev);
        for (const id of affectedIds) next.delete(id);
        return next;
      });
    }
  }

  const editModalWeeklyRows = useMemo(() => {
    if (!editModalRaidId) return [];
    return weeklyRaids.filter(
      (row) => row.raidGateInfo.raidInfo.id === editModalRaidId
    );
  }, [editModalRaidId, weeklyRaids]);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-base-300 bg-base-300 shadow-sm">
      <div className="relative aspect-[3/4] w-full shrink-0 bg-base-200">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- 외부/가변 도메인 URL 대응
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover object-top"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-base-300 via-base-200 to-base-300">
            <span className="select-none text-5xl font-bold text-base-content/60/90">
              {(c.characterName[0] ?? '?').toUpperCase()}
            </span>
          </div>
        )}
        <span className="absolute left-2 top-2 z-[1] max-w-[calc(100%-5.5rem)] truncate rounded-md bg-base-200/85 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          {c.serverName}
        </span>
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
          <button
            type="button"
            aria-label="캐릭터 새로고침"
            title={
              cooldownRemainingSec > 0 && !isRefreshing
                ? `${cooldownRemainingSec}초 후 다시 시도`
                : '캐릭터 정보 새로고침'
            }
            disabled={refreshDisabled || deleting}
            onClick={onRefresh}
            className="flex h-7 min-w-7 items-center justify-center gap-0.5 rounded-md border border-base-300/80 bg-base-200/90 px-1 text-base-content shadow backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRefreshing ? (
              <InlineSpinner className="h-3 w-3 text-base-content" />
            ) : (
              <svg
                className="h-3 w-3"
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
          <button
            type="button"
            aria-label="캐릭터 삭제"
            title="원정대에서 삭제"
            disabled={deleting || refreshLocked || isRefreshing}
            onClick={() => void handleDelete()}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-rose-500/70 bg-rose-950/90 text-rose-400 shadow backdrop-blur-sm hover:bg-rose-900/95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? (
              <InlineSpinner className="h-3 w-3 text-rose-300" />
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
                  d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="border-t border-base-300 bg-base-200 px-3 py-2.5">
        <div className="flex items-start gap-2.5">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-visible rounded-full border border-base-content/20 bg-base-300 text-[12px] font-bold text-base-content">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full">
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
            {partyRole === 'SUPPORT' ? (
              <SupporterRoleMark size="md" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="flex min-w-0 items-center justify-between gap-2"
              aria-busy={roleSaving}
            >
              <h3 className="min-w-0 flex-1 truncate text-[clamp(14px,1.15vw,17px)] font-bold leading-tight text-base-content">
                {c.characterName}
              </h3>
              <div className="dropdown dropdown-end shrink-0">
                <div
                  tabIndex={roleSaving || deleting ? -1 : 0}
                  role="button"
                  className={`badge badge-sm h-7 min-h-7 gap-1 px-2.5 text-[11px] font-bold leading-none ${
                    partyRole === 'SUPPORT'
                      ? 'border border-emerald-500/80 bg-emerald-900/75 text-emerald-200'
                      : 'border border-base-300/70 bg-base-300 text-base-content/90'
                  } ${roleSaving || deleting ? 'pointer-events-none opacity-60' : 'cursor-pointer hover:opacity-90'}`}
                  aria-label={
                    partyRole === 'SUPPORT'
                      ? '현재 서포터. 역할 변경 메뉴 열기'
                      : '현재 딜러. 역할 변경 메뉴 열기'
                  }
                  aria-haspopup="menu"
                >
                  {roleSaving ? (
                    <InlineSpinner className="h-3 w-3 shrink-0 opacity-80" />
                  ) : null}
                  {partyRole === 'SUPPORT' ? '서포터' : '딜러'}
                </div>
                <ul
                  tabIndex={0}
                  className="menu dropdown-content menu-sm z-50 mt-1 w-32 rounded-box border border-base-300 bg-base-200 p-1 shadow-lg"
                  role="menu"
                  aria-label="역할 선택"
                >
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      disabled={roleSaving || deleting}
                      className={
                        partyRole === 'DEALER' ? 'active font-semibold' : ''
                      }
                      aria-label="딜러로 변경"
                      onClick={() => void handlePartyRoleChange('DEALER')}
                    >
                      딜러
                    </button>
                  </li>
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      disabled={roleSaving || deleting}
                      className={
                        partyRole === 'SUPPORT' ? 'active font-semibold' : ''
                      }
                      aria-label="서포터로 변경"
                      onClick={() => void handlePartyRoleChange('SUPPORT')}
                    >
                      서포터
                    </button>
                  </li>
                </ul>
              </div>
            </div>
            <p className="mt-0.5 truncate text-[clamp(11px,0.9vw,13px)] text-base-content/80">
              <span>{c.serverName}</span>
              <span className="mx-1.5 text-base-content/60">/</span>
              <span>Lv.{lvText}</span>
              <span className="mx-1.5 text-base-content/60">/</span>
              <span className="font-semibold text-rose-400">
                {c.combatPower}
              </span>
            </p>
            {roleError ? (
              <p
                className="mt-1 text-right text-[clamp(10px,0.8vw,11px)] text-rose-400"
                role="alert"
              >
                {roleError}
              </p>
            ) : null}
            <p className="mt-1 text-[clamp(9px,0.75vw,10px)] text-base-content/60">
              최근 업데이트: <RelativeLastSynced at={c.lastSyncedAt} />
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-base-300">
        {/* 일일 / 주간 UI (추후 연동 시 복구)
        <div className="border-t border-base-300 bg-base-200 px-3 py-3">
          <div className="rounded-lg border border-base-300 bg-base-300/80 p-2.5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-base-content/80">일일</p>
              <div className="flex items-center gap-1.5">
                <span className="rounded-md border border-base-300 bg-base-300 px-2 py-1 text-[11px] text-base-content/80">
                  가던
                </span>
                <span className="rounded-md border border-base-300 bg-base-300 px-2 py-1 text-[11px] text-base-content/80">
                  가토
                </span>
                <span className="rounded-md border border-base-300 bg-base-300 px-2 py-1 text-[11px] text-base-content/80">
                  +
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-base-content/80">주간</p>
              <div className="flex items-center gap-1.5">
                <span className="rounded-md border border-base-300 bg-base-300 px-2 py-1 text-[11px] text-base-content/80">
                  천상
                </span>
                <span className="rounded-md border border-base-300 bg-base-300 px-2 py-1 text-[11px] text-base-content/80">
                  혈석
                </span>
                <span className="rounded-md border border-base-300 bg-base-300 px-2 py-1 text-[11px] text-base-content/80">
                  싱글
                </span>
                <span className="rounded-md border border-base-300 bg-base-300 px-2 py-1 text-[11px] text-base-content/80">
                  +
                </span>
              </div>
            </div>
          </div>
        </div>
        */}

        <div className="border-t border-base-300 bg-gradient-to-r from-base-200 via-base-300 to-base-200 px-3 py-3">
          <p className="flex items-end justify-center gap-1 text-[clamp(12px,0.95vw,14px)] font-bold text-amber-300">
            <span className="inline-flex items-center">
              {animatedCurrentClearGold.toLocaleString()}
            </span>
            <span className="font-medium text-base-content/80">
              / {clearGoldProgress.total.toLocaleString()} G
            </span>
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-base-content/20">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-300"
              style={{ width: `${clearGoldProgressPercent}%` }}
            />
          </div>
        </div>

        <div className="border-t border-base-300 bg-gradient-to-r from-base-200 via-base-300 to-base-200 px-3 py-3">
          <div className="flex items-center justify-between border-b border-base-300 pb-2">
            <p className="text-[clamp(13px,1vw,15px)] font-semibold text-primary">
              레이드
            </p>
            <button
              type="button"
              className="rounded-md border border-base-300 bg-base-300/70 px-2 py-0.5 text-[11px] font-semibold text-base-content"
              onClick={() => setRaidModalOpen(true)}
            >
              레이드 추가
            </button>
          </div>

          {raidGroups.length === 0 ? (
            <div className="mt-3 rounded-xl border border-base-300 bg-base-300/80 px-3 py-5 text-center">
              <p className="text-[15px] font-medium text-base-content/60">
                레이드 없음
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <DndContext
                sensors={dndSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleRaidSortEnd}
              >
                <SortableContext
                  items={orderedRaidGroups.map((group) =>
                    raidGroupSortableId(group.raidId)
                  )}
                  strategy={verticalListSortingStrategy}
                >
                  {orderedRaidGroups.map((group, idx) => (
                    <SortableRaidGroup
                      key={group.raidId}
                      raidId={group.raidId}
                      disabled={raidOrderSaving}
                      className={idx === 0 ? '' : 'border-t border-base-300 pt-3'}
                    >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[clamp(11px,0.9vw,13px)] font-semibold text-base-content">
                          {group.raidName}
                        </p>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs min-h-0 h-6 w-6 shrink-0 p-0 text-base-content/80"
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
                        <span className="ml-1 text-[clamp(10px,0.8vw,11px)]">
                          G
                        </span>
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
                                : 'border-base-300 bg-base-300 text-base-content'
                            } ${pendingClearIds.has(row.id) ? 'opacity-60' : ''}`}
                            onClick={() => void toggleClear(row)}
                            disabled={pendingClearIds.has(row.id)}
                            aria-label={`${group.raidName} ${row.raidGateInfo.gateNumber}관문 클리어 토글`}
                          >
                            {row.raidGateInfo.gateNumber}
                            {row.isExtraRewardSelected ? (
                              <span className="badge badge-xs badge-outline indicator-item border-emerald-500 bg-base-200 px-1.5 text-[10px] leading-none text-emerald-400">
                                +
                              </span>
                            ) : null}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                    </SortableRaidGroup>
                  ))}
                </SortableContext>
              </DndContext>

              <div className="flex items-end justify-between border-t border-base-300 pt-2">
                <span className="text-[clamp(13px,1vw,16px)] font-bold text-amber-300">
                  합계
                </span>
                <div className="inline-flex items-end gap-2 text-[clamp(12px,0.95vw,14px)] font-bold text-amber-300">
                  <span className="inline-flex flex-col items-start">
                    <span className="badge badge-warning mb-0.5 h-4 min-h-4 rounded-full px-1 text-[8px] leading-none text-black">
                      귀속
                    </span>
                    <span>{totalGold.bound.toLocaleString()} G</span>
                  </span>
                  <span className="text-base-content/60">/</span>
                  <span>{(totalGold.bound + totalGold.normal).toLocaleString()} G</span>
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
          reloadDashboard();
        }}
      />
      <EditWeeklyRaidModal
        open={Boolean(editModalRaidId)}
        characterId={c.id}
        raidId={editModalRaidId}
        raidName={editModalRaidName}
        weeklyRows={editModalWeeklyRows}
        onClose={() => {
          setEditModalRaidId(null);
          setEditModalRaidName('');
        }}
        onSaved={() => {
          reloadDashboard();
        }}
      />
    </article>
  );
}
