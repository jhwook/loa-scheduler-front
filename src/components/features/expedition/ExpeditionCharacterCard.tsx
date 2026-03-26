"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AddRaidModal } from "@/components/raid/add-raid-modal";
import { getCharacterWeeklyRaids } from "@/lib/api/raid";
import { ApiError } from "@/types/api";
import type { MySavedCharacter } from "@/types/expedition";
import type { CharacterWeeklyRaidItem } from "@/types/raid";

type Props = {
  character: MySavedCharacter;
};

function formatLvText(itemAvgLevel: string): string {
  const raw = String(itemAvgLevel ?? "").replace(/,/g, "");
  const n = Number(raw);
  if (!Number.isFinite(n)) return itemAvgLevel;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/**
 * 쇼핑몰 상품 카드처럼 상단 이미지 + 하단 정보
 */
export function ExpeditionCharacterCard({ character: c }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const [raidModalOpen, setRaidModalOpen] = useState(false);
  const [weeklyRaids, setWeeklyRaids] = useState<CharacterWeeklyRaidItem[]>([]);
  const src = c.characterImage?.trim();
  const showImage = Boolean(src) && !imageFailed;
  const lvText = formatLvText(c.itemAvgLevel);
  const classMark = (c.characterClassName?.[0] ?? "?").toUpperCase();

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

  useEffect(() => {
    const refresh = () => {
      void loadWeeklyRaids();
    };
    window.addEventListener("character-weekly-raids-synced", refresh);
    return () =>
      window.removeEventListener("character-weekly-raids-synced", refresh);
  }, [loadWeeklyRaids]);

  const raidGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        raidName: string;
        orderNo: number;
        items: CharacterWeeklyRaidItem[];
      }
    >();
    for (const row of weeklyRaids) {
      const raidName = row.raidGateInfo.raidInfo.raidName;
      const prev = map.get(raidName) ?? {
        raidName,
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
          (a, b) => a.raidGateInfo.gateNumber - b.raidGateInfo.gateNumber,
        ),
      }))
      .sort((a, b) => a.orderNo - b.orderNo);
  }, [weeklyRaids]);

  const totalGold = useMemo(() => {
    return weeklyRaids.reduce((acc, row) => {
      const base = row.raidGateInfo.rewardGold + row.raidGateInfo.boundGold;
      const extraCost =
        row.isExtraRewardSelected
          ? (row.extraRewardCostSnapshot ?? row.raidGateInfo.extraRewardCost ?? 0)
          : 0;
      return acc + Math.max(0, base - extraCost);
    }, 0);
  }, [weeklyRaids]);

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
              {(c.characterName[0] ?? "?").toUpperCase()}
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
              <span className="font-semibold text-rose-400">{c.combatPower}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-slate-950">
        <div className="border-t border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-3 py-3">
          <p className="text-center text-[14px] font-bold text-amber-300">
            106,000 <span className="font-medium text-slate-300">/ 156,000G</span>
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-700">
            <div className="h-full w-2/3 rounded-full bg-amber-400" />
          </div>
        </div>

        <div className="border-t border-slate-800 bg-slate-900 px-3 py-3">
          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-2.5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-300">일일</p>
              <div className="flex items-center gap-1.5">
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300">가던</span>
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300">가토</span>
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300">+</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-300">주간</p>
              <div className="flex items-center gap-1.5">
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300">천상</span>
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300">혈석</span>
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300">싱글</span>
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300">+</span>
              </div>
            </div>
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
              <p className="text-[15px] font-medium text-slate-400">레이드 없음</p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {raidGroups.map((group, idx) => (
                <div
                  key={group.raidName}
                  className={idx === 0 ? "" : "border-t border-slate-800 pt-3"}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[15px] font-semibold text-slate-100">
                        {group.raidName}
                      </p>
                      <p className="mt-1 text-[24px] leading-none text-amber-300">
                        <span className="text-[22px] font-bold">
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
                        <span className="ml-1 text-[12px]">G</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {group.items.map((row) => (
                        <div
                          key={row.id}
                          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-[16px] font-semibold text-slate-200"
                        >
                          {row.raidGateInfo.gateNumber}
                          {row.raidGateInfo.canExtraReward ? (
                            <span className="absolute -right-1 -top-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-emerald-500 text-[10px] leading-none text-emerald-400">
                              +
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <div className="border-t border-slate-800 pt-2 text-right">
                <p className="text-[14px] font-bold text-amber-300">
                  {totalGold.toLocaleString()} G
                </p>
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
          window.dispatchEvent(new CustomEvent("character-weekly-raids-synced"));
        }}
      />
    </article>
  );
}
