'use client';

import { useState, type FormEvent } from 'react';

import type { CreateRaidRequest } from '@/types/raid';

type Props = {
  pending: boolean;
  onSubmit: (payload: CreateRaidRequest) => Promise<void>;
};

export function RaidForm({ pending, onSubmit }: Props) {
  const [raidName, setRaidName] = useState('');
  const [orderNo, setOrderNo] = useState(1);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmit({
      raidName: raidName.trim(),
      description: '',
      orderNo: Number(orderNo),
      isActive: true,
    });
    setRaidName('');
    setOrderNo(1);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card border border-slate-200 bg-white text-slate-900"
    >
      <div className="card-body gap-4 p-4 md:p-5">
        <h3 className="card-title text-base">새 레이드 추가</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="form-control gap-2">
            <div className="label pb-2 pt-1">
              <span className="label-text text-slate-700">레이드명</span>
            </div>
            <input
              type="text"
              className="input input-bordered input-sm border-slate-400 bg-white pl-4 text-slate-900"
              value={raidName}
              onChange={(e) => setRaidName(e.target.value)}
              required
              maxLength={30}
            />
          </label>
          <label className="form-control gap-2">
            <div className="label pb-2 pt-1">
              <span className="label-text text-slate-700">정렬 순서</span>
            </div>
            <input
              type="number"
              min={1}
              className="input input-bordered input-sm border-slate-400 bg-white pl-4 text-slate-900"
              value={orderNo}
              onChange={(e) => setOrderNo(Number(e.target.value))}
              required
            />
          </label>
        </div>
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={pending}
          >
            {pending ? '추가 중...' : '레이드 추가'}
          </button>
        </div>
      </div>
    </form>
  );
}
