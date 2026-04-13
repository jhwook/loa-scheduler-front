'use client';

import { useState, type FormEvent } from 'react';

import type { CreateRaidRequest, RaidPartySize } from '@/types/raid';

type Props = {
  pending: boolean;
  onSubmit: (payload: CreateRaidRequest) => Promise<void>;
};

export function RaidForm({ pending, onSubmit }: Props) {
  const [raidName, setRaidName] = useState('');
  const [partySize, setPartySize] = useState<RaidPartySize>(8);
  const [orderNo, setOrderNo] = useState(1);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmit({
      raidName: raidName.trim(),
      description: '',
      partySize,
      orderNo: Number(orderNo),
      isActive: true,
    });
    setRaidName('');
    setPartySize(8);
    setOrderNo(1);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card border border-base-300 bg-base-200 text-base-content"
    >
      <div className="card-body gap-4 p-4 md:p-5">
        <h3 className="card-title text-base">새 레이드 추가</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="form-control gap-2">
            <div className="label pb-2 pt-1">
              <span className="label-text text-slate-700">레이드명</span>
            </div>
            <input
              type="text"
              className="input input-bordered input-sm border-base-300 bg-base-200 pl-4 text-base-content"
              value={raidName}
              onChange={(e) => setRaidName(e.target.value)}
              required
              maxLength={30}
            />
          </label>
          <label className="form-control gap-2">
            <div className="label pb-2 pt-1">
              <span className="label-text text-slate-700">파티 인원</span>
            </div>
            <select
              className="select select-bordered select-sm border-base-300 bg-base-200 pl-3 text-base-content"
              value={partySize}
              onChange={(e) =>
                setPartySize(
                  Number(e.target.value) === 4 ? 4 : 8
                )
              }
              aria-label="파티 인원 수"
            >
              <option value={4}>4인</option>
              <option value={8}>8인</option>
            </select>
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
