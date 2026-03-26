"use client";

import { useEffect, useState } from "react";

import type { RaidGateDetail } from "@/types/raid";

type Props = {
  gate: RaidGateDetail;
  selected: boolean;
  extraSelected: boolean;
  onChangeSelected: (next: boolean) => void;
  onChangeExtra: (next: boolean) => void;
};

export function RaidGateCard({
  gate,
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
      <div className="card-body gap-2 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-2xl font-bold text-slate-100">{gate.gateName}</p>
            <p className="text-xs text-slate-400">Lv. {gate.minItemLevel}</p>
          </div>
          <div className="text-right">
            <p className="inline-flex items-center gap-1.5 text-xl font-bold text-amber-300">
              {usesBoundGold ? (
                <span className="badge badge-warning badge-xs border-0 px-1.5 py-1 text-[10px] font-bold text-slate-900">
                  귀속
                </span>
              ) : null}
              {displayGold.toLocaleString()}
              <span className="ml-1 text-sm">G</span>
            </p>
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between">
          <label className="label cursor-pointer gap-2 p-0 text-xs">
            <input
              type="checkbox"
              className="checkbox checkbox-sm checkbox-primary"
              checked={selected}
              onChange={(e) => onChangeSelected(e.target.checked)}
            />
            <span className="text-slate-300">선택</span>
          </label>

          <label className="label cursor-pointer gap-2 p-0 text-xs">
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
