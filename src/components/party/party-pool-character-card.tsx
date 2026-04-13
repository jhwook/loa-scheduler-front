'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { SupporterRoleMark } from '@/components/ui/supporter-role-mark';
import { getClassIconSrc, resolveClassIconBasename } from '@/lib/class-icon';
import { setPartyPoolDragData } from '@/lib/party-pool-dnd';
import type { PartyGroupMemberCharacter } from '@/types/party';

/** 풀·레이드 슬롯 카드 공통 표시 필드 */
export type PartyPoolCharacterCardCharacter = {
  id: number;
  characterName: string;
  itemAvgLevel?: string | null;
  characterClassName?: string | null;
  combatPower?: string | null;
  partyRole?: PartyGroupMemberCharacter['partyRole'] | string | null;
};

type Props = {
  /** 공격대 멤버 별명 또는 소유자 표시명(헤더) */
  memberNickname: string;
  character: PartyPoolCharacterCardCharacter;
  /** 파티 슬롯으로 드래그해 배치 */
  draggable?: boolean;
  className?: string;
  /** 슬롯: 직업 아이콘·서포터 배지 여유를 위해 하단 패딩 유지 */
  variant?: 'default' | 'slot';
  /** 헤더 오른쪽(제거 버튼 등) */
  headerTrailing?: ReactNode;
};

function parseNumberLike(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const raw = value.replace(/,/g, '').trim();
    if (!raw) return null;
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function formatLvText(itemAvgLevel: string): string {
  const n = parseNumberLike(itemAvgLevel);
  if (n === null) return itemAvgLevel;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function PartyPoolCharacterCard({
  memberNickname,
  character: c,
  draggable = false,
  className,
  variant = 'default',
  headerTrailing,
}: Props) {
  const [classIconFailed, setClassIconFailed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const classMark = (c.characterClassName?.[0] ?? '?').toUpperCase();
  const iconBasename = useMemo(
    () => resolveClassIconBasename(c.characterClassName),
    [c.characterClassName]
  );
  const classIconSrc = iconBasename ? getClassIconSrc(iconBasename) : null;

  useEffect(() => {
    setClassIconFailed(false);
  }, [classIconSrc]);

  return (
    <article
      draggable={draggable}
      onDragStart={
        draggable
          ? (e) => {
              setPartyPoolDragData(e.dataTransfer, c.id);
              setIsDragging(true);
            }
          : undefined
      }
      onDragEnd={draggable ? () => setIsDragging(false) : undefined}
      className={`flex min-w-0 flex-col overflow-visible rounded-lg border border-base-300 bg-base-300 shadow-sm ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragging ? 'opacity-60' : ''} ${className ?? ''}`}
    >
      <div
        className={`flex min-w-0 items-center bg-neutral px-2.5 font-semibold leading-tight text-neutral-content ${
          variant === 'slot'
            ? 'gap-0.5 py-1 text-[10px] leading-snug'
            : 'gap-1 py-1.5 text-[11px]'
        }`}
      >
        <span className="min-w-0 flex-1 truncate">{memberNickname}</span>
        {headerTrailing ? (
          <span className="flex shrink-0 items-center">{headerTrailing}</span>
        ) : null}
      </div>
      <div
        className={`flex items-start gap-2 bg-base-200 px-2.5 ${variant === 'slot' ? 'pb-2 pt-1.5' : 'py-1.5'}`}
      >
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-visible rounded-full border border-base-300 bg-base-300 text-[11px] font-bold text-base-content">
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full">
            {classIconSrc && !classIconFailed ? (
              // eslint-disable-next-line @next/next/no-img-element -- public 직업 아이콘
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
          {c.partyRole === 'SUPPORT' ? <SupporterRoleMark size="sm" /> : null}
        </div>
        <div className="min-w-0 flex-1 overflow-visible">
          <h3 className="line-clamp-2 text-[12px] font-bold leading-snug text-base-content">
            {c.characterName}
          </h3>
          <div className="mt-0.5 flex min-w-0 items-baseline justify-between gap-2 text-[10px] leading-none text-base-content/70">
            <p className="shrink-0">
              <span className="text-base-content/50">Lv.</span>{' '}
              <span className="font-medium text-base-content">
                {c.itemAvgLevel?.trim() ? formatLvText(c.itemAvgLevel) : '—'}
              </span>
            </p>
            <p className="min-w-0 flex-1 break-all text-right font-semibold tabular-nums text-rose-400">
              {c.combatPower?.trim() ? c.combatPower.trim() : '—'}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
