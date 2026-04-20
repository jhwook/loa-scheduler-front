'use client';

import { useMemo, useState } from 'react';

import { SupporterRoleMark } from '@/components/ui/supporter-role-mark';
import { getClassIconSrc, resolveClassIconBasename } from '@/lib/class-icon';
import type {
  PartyGroupMemberCharacter,
  PartyGroupMemberWithRoster,
} from '@/types/party';

type Props = {
  member: PartyGroupMemberWithRoster;
  isMine?: boolean;
  favoriteBusy?: boolean;
  onToggleFavorite?: (member: PartyGroupMemberWithRoster) => void | Promise<void>;
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

function extractGateNumberFallback(label?: string | null): number | null {
  if (!label?.trim()) return null;
  const m = label.match(/(\d+)\s*관/);
  if (m?.[1]) return Number(m[1]);
  return null;
}

function CharacterCard({
  character: c,
}: {
  character: PartyGroupMemberCharacter;
}) {
  const [classIconFailed, setClassIconFailed] = useState(false);
  const classMark = (c.characterClassName?.[0] ?? '?').toUpperCase();

  const iconBasename = useMemo(
    () => resolveClassIconBasename(c.characterClassName),
    [c.characterClassName]
  );
  const classIconSrc = iconBasename ? getClassIconSrc(iconBasename) : null;

  const homework = useMemo(() => c.weeklyRaids ?? [], [c.weeklyRaids]);

  const lvCombat = (
    <span className="shrink-0 whitespace-nowrap text-[13px] tabular-nums">
      <span className="text-base-content/60">Lv.</span>
      <span className="text-base-content">
        {c.itemAvgLevel?.trim() ? formatLvText(c.itemAvgLevel) : '—'}
      </span>
      <span className="text-base-content/60"> {' / '} </span>
      <span className="font-semibold text-rose-400">
        {c.combatPower ?? '—'}
      </span>
    </span>
  );

  const raidGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        raidName: string;
        difficultyLabel: string | null;
        items: typeof homework;
      }
    >();

    for (const row of homework) {
      const raidName = row.raidName || '알 수 없는 레이드';
      const diff = (row.difficulty ?? '').trim();
      const prev =
        map.get(raidName) ??
        ({
          raidName,
          difficultyLabel: diff || null,
          items: [],
        } satisfies {
          raidName: string;
          difficultyLabel: string | null;
          items: typeof homework;
        });
      prev.items.push(row);
      if (!prev.difficultyLabel && diff) prev.difficultyLabel = diff;
      map.set(raidName, prev);
    }

    return [...map.values()].map((g) => ({
      ...g,
      items: [...g.items].sort((a, b) => {
        const an =
          typeof a.gateNumber === 'number'
            ? a.gateNumber
            : (extractGateNumberFallback(a.gatesLabel) ?? 999);
        const bn =
          typeof b.gateNumber === 'number'
            ? b.gateNumber
            : (extractGateNumberFallback(b.gatesLabel) ?? 999);
        return an - bn;
      }),
    }));
  }, [homework]);

  return (
    <div className="flex min-h-0 min-w-[252px] flex-col rounded-xl border border-base-content/20 bg-base-200/50">
      <div className="flex items-start gap-2.5 border-b border-base-content/15 px-2.5 py-2.5 sm:px-3">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-visible rounded-full border border-base-300 bg-base-300 text-[11px] font-bold text-base-content sm:h-10 sm:w-10 sm:text-[12px]">
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full">
            {classIconSrc && !classIconFailed ? (
              // eslint-disable-next-line @next/next/no-img-element -- public 직업 아이콘
              <img
                key={classIconSrc}
                src={classIconSrc}
                alt=""
                className="h-full w-full object-cover brightness-0 invert"
                onError={() => setClassIconFailed(true)}
              />
            ) : (
              classMark
            )}
          </div>
          {c.partyRole === 'SUPPORT' ? <SupporterRoleMark size="lg" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-[14px] font-bold leading-tight text-base-content sm:text-[15px]">
            {c.characterName}
          </h4>
          <div className="mt-0.5 flex min-w-0 items-baseline justify-between gap-2">
            <p className="min-w-0 truncate text-[11px] text-base-content/60">
              {c.serverName}
            </p>
            {lvCombat}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col space-y-1.5 px-2.5 py-2.5 sm:px-3 sm:py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-base-content/60">
          주간 레이드 숙제
        </p>
        {homework.length === 0 ? (
          <p className="text-xs text-base-content/60">
            남은 레이드 숙제가 없습니다.
          </p>
        ) : (
          <div className="divide-y divide-base-300/60 rounded-xl border border-base-300/70 bg-base-300/40">
            {raidGroups.map((g) => (
              <div
                key={g.raidName}
                className="flex items-center justify-between gap-3 px-2.5 py-2 sm:px-3"
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="min-w-0 truncate text-[12px] font-semibold text-base-content">
                      {g.raidName}
                    </div>
                    {g.difficultyLabel ? (
                      <span
                        className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold leading-none ${difficultyBadgeClass(
                          g.difficultyLabel
                        )}`}
                      >
                        {g.difficultyLabel}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  {g.items.map((r) => {
                    const cleared = r.isCleared;
                    const gate =
                      typeof r.gateNumber === 'number'
                        ? r.gateNumber
                        : extractGateNumberFallback(r.gatesLabel);
                    return (
                      <div
                        key={r.id}
                        className="flex flex-col items-center gap-1"
                      >
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-2xl border-2 text-[14px] font-extrabold ${
                            cleared
                              ? 'border-emerald-400 bg-emerald-500/15 text-emerald-200'
                              : 'border-base-300 bg-base-300/40 text-base-content'
                          }`}
                          aria-label={`${g.raidName} ${gate ?? '?'}관 ${cleared ? '완료' : '미완료'}`}
                        >
                          {gate ?? '?'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FavoriteStarIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M12 2.25l2.93 5.93 6.55.95-4.74 4.62 1.12 6.52L12 17.77l-5.86 3.08 1.12-6.52-4.74-4.62 6.55-.95L12 2.25z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current fill-none" aria-hidden="true">
      <path
        d="M12 2.25l2.93 5.93 6.55.95-4.74 4.62 1.12 6.52L12 17.77l-5.86 3.08 1.12-6.52-4.74-4.62 6.55-.95L12 2.25z"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PartyMemberCard({
  member,
  isMine = false,
  favoriteBusy = false,
  onToggleFavorite,
}: Props) {
  const sortedCharacters = useMemo(() => {
    const list = [...member.characters];
    // itemAvgLevel 높은 순(내림차순) 정렬
    list.sort((a, b) => {
      const an = parseNumberLike(a.itemAvgLevel);
      const bn = parseNumberLike(b.itemAvgLevel);
      if (an === null && bn === null) return 0;
      if (an === null) return 1;
      if (bn === null) return -1;
      return bn - an;
    });
    return list;
  }, [member.characters]);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-base-content/25 bg-base-300 shadow-sm">
      <div className="border-b border-base-content/20 bg-base-200 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-base font-bold text-base-content">
            {member.nickname?.trim() || '별명 없음'}
          </h3>
          {isMine ? (
            <span className="badge badge-warning h-6 min-h-6 rounded-full px-2 text-[10px] font-semibold text-black">
              my
            </span>
          ) : onToggleFavorite ? (
            <div
              className="tooltip tooltip-left"
              data-tip={member.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            >
              <button
                type="button"
                className={`btn btn-ghost btn-xs h-7 min-h-7 w-7 rounded-full p-0 ${
                  member.isFavorite ? 'text-warning' : 'text-base-content/60'
                }`}
                onClick={() => void onToggleFavorite(member)}
                disabled={favoriteBusy}
                aria-label={member.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              >
                {favoriteBusy ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <FavoriteStarIcon active={Boolean(member.isFavorite)} />
                )}
              </button>
            </div>
          ) : null}
        </div>
        <p className="mt-1 text-[11px] text-base-content/60">
          캐릭터 {member.characters.length}명
        </p>
      </div>

      <div className="flex-1 bg-base-300 p-3">
        {sortedCharacters.length === 0 ? (
          <p className="py-4 text-center text-sm text-base-content/60">
            공개할 캐릭터를 설정해주세요.
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(252px,1fr))] gap-3">
            {sortedCharacters.map((c) => (
              <CharacterCard key={c.id} character={c} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
