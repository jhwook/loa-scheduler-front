"use client";

import { useEffect, useState } from "react";

import type { RaidGateDetail } from "@/types/raid";

type Props = {
  gate: RaidGateDetail;
  /** 관문이 3개 이상 한 줄 배치일 때 약간 좁은 레이아웃 */
  compact?: boolean;
  selected: boolean;
  extraSelected: boolean;
  onChangeSelected: (next: boolean) => void;
  onChangeExtra: (next: boolean) => void;
};

export function RaidGateCard({
  gate,
  compact = false,
  selected,
  extraSelected,
  onChangeSelected,
  onChangeExtra,
}: Props) {
  const usesBoundGold = gate.boundGold > 0 && gate.rewardGold <= 0;
  const baseGold = usesBoundGold ? gate.boundGold : gate.rewardGold;
  const finalGold = Math.max(
    0,
    baseGold - (extraSelected && gate.canExtraReward ? gate.extraRewardCost : 0),
  );
  const [displayGold, setDisplayGold] = useState(finalGold);

  useEffect(() => {
    const start = displayGold;
    const end = finalGold;
    if (start === end) return;
    const frames = 10;
    let f = 0;
    const timer = window.setInterval(() => {
      f += 1;
      const next = Math.round(start + ((end - start) * f) / frames);
      setDisplayGold(next);
      if (f >= frames) {
        window.clearInterval(timer);
        setDisplayGold(end);
      }
    }, 25);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalGold]);

  return (
    <label
      className={`card cursor-pointer border ${
        selected ? "border-indigo-500 bg-slate-800/90" : "border-slate-700 bg-slate-900/70"
      }`}
    >
      <div
        className={`card-body gap-2 ${compact ? "gap-1.5 p-2" : "p-3"}`}
      >
        <div
          className={`flex items-start justify-between ${compact ? "gap-1.5" : "gap-3"}`}
        >
          <div className="min-w-0">
            <p
              className={`font-bold text-slate-100 ${compact ? "truncate text-base" : "text-2xl"}`}
            >
              {gate.gateName}
            </p>
            <p className={`text-slate-400 ${compact ? "text-[10px]" : "text-xs"}`}>
              Lv. {gate.minItemLevel}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p
              className={`inline-flex flex-wrap items-center justify-end gap-1 font-bold text-amber-300 ${compact ? "text-sm" : "gap-1.5 text-xl"}`}
            >
              {usesBoundGold ? (
                <span
                  className={`badge badge-warning border-0 font-bold text-slate-900 ${compact ? "badge-xs px-1 py-0.5 text-[9px]" : "badge-xs px-1.5 py-1 text-[10px]"}`}
                >
                  귀속
                </span>
              ) : null}
              {displayGold.toLocaleString()}
              <span className={compact ? "text-[10px]" : "ml-1 text-sm"}>G</span>
            </p>
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between gap-1">
          <label className="label min-w-0 cursor-pointer gap-1 p-0 text-[10px] sm:text-xs">
            <input
              type="checkbox"
              className="checkbox checkbox-sm checkbox-primary"
              checked={selected}
              onChange={(e) => onChangeSelected(e.target.checked)}
            />
            <span className="text-slate-300">선택</span>
          </label>

          <label className="label min-w-0 shrink-0 cursor-pointer gap-1 p-0 text-[10px] sm:text-xs">
            <input
              type="checkbox"
              className="toggle toggle-xs toggle-primary"
              checked={extraSelected}
              onChange={(e) => onChangeExtra(e.target.checked)}
              disabled={!selected || !gate.canExtraReward}
            />
            <span className="text-slate-300">더보기</span>
          </label>
        </div>
      </div>
    </label>
  );
}
