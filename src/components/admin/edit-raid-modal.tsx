'use client';

import { useEffect, useState } from 'react';

import type { RaidInfo, UpdateRaidRequest } from '@/types/raid';

type Props = {
  open: boolean;
  raid: RaidInfo | null;
  pending: boolean;
  onClose: () => void;
  onSubmit: (raidId: number, payload: UpdateRaidRequest) => Promise<void>;
};

type FormState = {
  raidName: string;
  orderNo: number;
  isActive: boolean;
};

export function EditRaidModal({
  open,
  raid,
  pending,
  onClose,
  onSubmit,
}: Props) {
  const [state, setState] = useState<FormState | null>(null);

  useEffect(() => {
    if (!raid) {
      setState(null);
      return;
    }
    setState({
      raidName: raid.raidName,
      orderNo: raid.orderNo,
      isActive: raid.isActive,
    });
  }, [raid]);

  if (!open || !raid || !state) return null;

  async function handleSave() {
    await onSubmit(raid.id, {
      raidName: state.raidName.trim(),
      orderNo: Number(state.orderNo),
      isActive: state.isActive,
    });
    onClose();
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg bg-base-200 text-base-content">
        <h3 className="text-lg font-semibold">레이드 수정</h3>
        <div className="mt-4 grid gap-3">
          <label className="form-control gap-2">
            <div className="label py-0">
              <span className="label-text text-slate-700">레이드명</span>
            </div>
            <input
              type="text"
              className="input input-bordered input-sm border-base-300 bg-base-200 pl-4 text-base-content"
              value={state.raidName}
              onChange={(e) =>
                setState((prev) =>
                  prev ? { ...prev, raidName: e.target.value } : prev
                )
              }
              maxLength={30}
            />
          </label>
          <label className="form-control gap-2">
            <div className="label py-0">
              <span className="label-text text-slate-700">정렬 순서</span>
            </div>
            <input
              type="number"
              min={1}
              className="input input-bordered input-sm border-base-300 bg-base-200 pl-4 text-base-content"
              value={state.orderNo}
              onChange={(e) =>
                setState((prev) =>
                  prev ? { ...prev, orderNo: Number(e.target.value) } : prev
                )
              }
            />
          </label>
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={state.isActive}
              onChange={(e) =>
                setState((prev) =>
                  prev ? { ...prev, isActive: e.target.checked } : prev
                )
              }
            />
            <span className="label-text text-slate-700">활성화</span>
          </label>
        </div>
        <div className="modal-action">
          <button
            type="button"
            className="btn btn-ghost text-slate-700"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={pending}
          >
            {pending ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} aria-label="닫기" />
    </div>
  );
}
