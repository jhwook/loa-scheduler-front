'use client';

import { useState, type FormEvent } from 'react';

import type { CreateRaidGateRequest } from '@/types/raid';

type Props = {
  raidId: number | null;
  pending: boolean;
  onSubmit: (raidId: number, payload: CreateRaidGateRequest) => Promise<void>;
};

export function RaidGateForm({ raidId, pending, onSubmit }: Props) {
  const [difficulty, setDifficulty] = useState('하드');
  const [gateNumber, setGateNumber] = useState(1);
  const [gateName, setGateName] = useState('1관문');
  const [minItemLevel, setMinItemLevel] = useState(1730);
  const [rewardGold, setRewardGold] = useState(5000);
  const [boundGold, setBoundGold] = useState(2500);
  const [isSingleMode, setIsSingleMode] = useState(false);
  const [canExtraReward, setCanExtraReward] = useState(true);
  const [extraRewardCost, setExtraRewardCost] = useState(1600);
  const [orderNo, setOrderNo] = useState(1);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!raidId) return;
    await onSubmit(raidId, {
      difficulty: difficulty.trim(),
      gateNumber: Number(gateNumber),
      gateName: gateName.trim(),
      minItemLevel: Number(minItemLevel),
      rewardGold: Number(rewardGold),
      boundGold: Number(boundGold),
      isSingleMode,
      canExtraReward,
      extraRewardCost: canExtraReward ? Number(extraRewardCost) : 0,
      orderNo: Number(orderNo),
      isActive: true,
    });
    setGateNumber((prev) => prev + 1);
    setGateName(`${gateNumber + 1}관문`);
    setOrderNo((prev) => prev + 1);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card border border-base-300 bg-base-200 text-base-content"
    >
      <div className="card-body p-4 md:p-5">
        <h3 className="card-title text-base">관문 추가</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="form-control gap-2">
            <div className="label pb-2 pt-1">
              <span className="label-text text-slate-700">난이도</span>
            </div>
            <input
              type="text"
              className="input input-bordered input-sm border-base-300 bg-base-200 pl-4 text-base-content"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              required
            />
          </label>
          <label className="form-control gap-2">
            <div className="label pb-2 pt-1">
              <span className="label-text text-slate-700">관문 번호</span>
            </div>
            <input
              type="number"
              min={1}
              className="input input-bordered input-sm border-base-300 bg-base-200 pl-4 text-base-content"
              value={gateNumber}
              onChange={(e) => setGateNumber(Number(e.target.value))}
              required
            />
          </label>
          <label className="form-control gap-2">
            <div className="label pb-2 pt-1">
              <span className="label-text text-slate-700">관문명</span>
            </div>
            <input
              type="text"
              className="input input-bordered input-sm border-base-300 bg-base-200 pl-4 text-base-content"
              value={gateName}
              onChange={(e) => setGateName(e.target.value)}
              required
            />
          </label>
          <label className="form-control gap-2">
            <div className="label pb-2 pt-1">
              <span className="label-text text-slate-700">
                최소 아이템 레벨
              </span>
            </div>
            <input
              type="number"
              min={0}
              className="input input-bordered input-sm border-base-300 bg-base-200 pl-4 text-base-content"
              value={minItemLevel}
              onChange={(e) => setMinItemLevel(Number(e.target.value))}
              required
            />
          </label>
          <label className="form-control gap-2">
            <div className="label pb-2 pt-1">
              <span className="label-text text-slate-700">골드</span>
            </div>
            <input
              type="number"
              min={0}
              className="input input-bordered input-sm border-base-300 bg-base-200 pl-4 text-base-content"
              value={rewardGold}
              onChange={(e) => setRewardGold(Number(e.target.value))}
              required
            />
          </label>
          <label className="form-control gap-2">
            <div className="label pb-2 pt-1">
              <span className="label-text text-slate-700">귀속 골드</span>
            </div>
            <input
              type="number"
              min={0}
              className="input input-bordered input-sm border-base-300 bg-base-200 pl-4 text-base-content"
              value={boundGold}
              onChange={(e) => setBoundGold(Number(e.target.value))}
              required
            />
          </label>
          <label className="form-control gap-2">
            <div className="label pb-2 pt-1">
              <span className="label-text text-slate-700">정렬 순서</span>
            </div>
            <input
              type="number"
              min={1}
              className="input input-bordered input-sm border-base-300 bg-base-200 pl-4 text-base-content"
              value={orderNo}
              onChange={(e) => setOrderNo(Number(e.target.value))}
              required
            />
          </label>
          <label className="form-control gap-2">
            <div className="label pb-2 pt-1">
              <span className="label-text text-slate-700">
                더보기 골드 비용
              </span>
            </div>
            <input
              type="number"
              min={0}
              className="input input-bordered input-sm border-base-300 bg-base-200 pl-4 text-base-content disabled:bg-base-200"
              value={extraRewardCost}
              onChange={(e) => setExtraRewardCost(Number(e.target.value))}
              disabled={!canExtraReward}
              required={canExtraReward}
            />
          </label>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="label cursor-pointer justify-start gap-2">
              <input
                type="checkbox"
                className="toggle toggle-sm toggle-primary"
                checked={canExtraReward}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setCanExtraReward(checked);
                  if (!checked) setExtraRewardCost(0);
                }}
              />
              <span className="label-text text-slate-700">더보기 가능</span>
            </label>
            <label className="label cursor-pointer justify-start gap-2">
              <input
                type="checkbox"
                className="toggle toggle-sm toggle-primary"
                checked={isSingleMode}
                onChange={(e) => setIsSingleMode(e.target.checked)}
              />
              <span className="label-text text-slate-700">싱글 모드</span>
            </label>
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!raidId || pending}
          >
            {pending ? '추가 중...' : '관문 추가'}
          </button>
        </div>
      </div>
    </form>
  );
}
