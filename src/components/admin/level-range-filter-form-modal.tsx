'use client';

import { useEffect, useState, type FormEvent } from 'react';

import type { LevelRangeFilter } from '@/types/level-range-filter';

export type LevelRangeFilterFormValues = {
  label: string;
  minLevel: string;
  maxLevel: string;
  orderNo: string;
  isActive: boolean;
};

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  initial: LevelRangeFilter | null;
  pending: boolean;
  onClose: () => void;
  onSubmit: (values: {
    label: string;
    minLevel: number;
    maxLevel: number | null;
    orderNo: number;
    isActive: boolean;
  }) => Promise<void>;
};

function filterToDraft(f: LevelRangeFilter | null): LevelRangeFilterFormValues {
  if (!f) {
    return {
      label: '',
      minLevel: '',
      maxLevel: '',
      orderNo: '',
      isActive: true,
    };
  }
  return {
    label: f.label,
    minLevel: String(f.minLevel),
    maxLevel: f.maxLevel === null ? '' : String(f.maxLevel),
    orderNo: String(f.orderNo),
    isActive: f.isActive,
  };
}

export function LevelRangeFilterFormModal({
  open,
  mode,
  initial,
  pending,
  onClose,
  onSubmit,
}: Props) {
  const [draft, setDraft] = useState<LevelRangeFilterFormValues>(() =>
    filterToDraft(initial),
  );
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(filterToDraft(initial));
      setLocalError(null);
    }
  }, [open, initial]);

  if (!open) return null;

  function parseIntStrict(s: string, field: string): number | null {
    const t = s.trim();
    if (!t) {
      setLocalError(`${field}을(를) 입력해 주세요.`);
      return null;
    }
    const n = Number(t);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      setLocalError(`${field}은(는) 정수여야 합니다.`);
      return null;
    }
    return n;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);

    const label = draft.label.trim();
    if (!label) {
      setLocalError('표시 이름을 입력해 주세요.');
      return;
    }

    const minLevel = parseIntStrict(draft.minLevel, '최소 레벨');
    if (minLevel === null) return;

    const orderNo = parseIntStrict(draft.orderNo, '정렬 순서');
    if (orderNo === null) return;

    let maxLevel: number | null = null;
    const maxRaw = draft.maxLevel.trim();
    if (maxRaw) {
      const n = Number(maxRaw);
      if (!Number.isFinite(n) || !Number.isInteger(n)) {
        setLocalError('최대 레벨은 정수이거나 비워 두어야 합니다.');
        return;
      }
      maxLevel = n;
    }

    if (maxLevel !== null && minLevel > maxLevel) {
      setLocalError('최소 레벨은 최대 레벨보다 클 수 없습니다.');
      return;
    }

    await onSubmit({
      label,
      minLevel,
      maxLevel,
      orderNo,
      isActive: draft.isActive,
    });
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-base-300/70"
        aria-label="닫기"
        onClick={pending ? undefined : onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lrf-modal-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-base-300 bg-base-200 p-5 shadow-2xl"
        onClick={(ev) => ev.stopPropagation()}
      >
        <h2
          id="lrf-modal-title"
          className="text-lg font-semibold text-base-content"
        >
          {mode === 'create' ? '필터 추가' : '필터 수정'}
        </h2>

        <form className="mt-4 space-y-3" onSubmit={(e) => void handleSubmit(e)}>
          <label className="form-control w-full">
            <span className="label-text text-xs text-base-content/80">
              표시 이름 (label)
            </span>
            <input
              type="text"
              className="input input-bordered input-sm w-full border-base-300 bg-base-300 text-base-content"
              value={draft.label}
              onChange={(e) =>
                setDraft((d) => ({ ...d, label: e.target.value }))
              }
              placeholder="예: 1750+"
              disabled={pending}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="form-control w-full">
              <span className="label-text text-xs text-base-content/80">
                최소 레벨
              </span>
              <input
                type="number"
                inputMode="numeric"
                className="input input-bordered input-sm w-full border-base-300 bg-base-300 text-base-content"
                value={draft.minLevel}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, minLevel: e.target.value }))
                }
                disabled={pending}
              />
            </label>
            <label className="form-control w-full">
              <span className="label-text text-xs text-base-content/80">
                최대 레벨 (비우면 제한 없음)
              </span>
              <input
                type="number"
                inputMode="numeric"
                className="input input-bordered input-sm w-full border-base-300 bg-base-300 text-base-content"
                value={draft.maxLevel}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, maxLevel: e.target.value }))
                }
                placeholder="—"
                disabled={pending}
              />
            </label>
          </div>

          <label className="form-control w-full">
            <span className="label-text text-xs text-base-content/80">
              정렬 순서 (orderNo)
            </span>
            <input
              type="number"
              inputMode="numeric"
              className="input input-bordered input-sm w-full border-base-300 bg-base-300 text-base-content"
              value={draft.orderNo}
              onChange={(e) =>
                setDraft((d) => ({ ...d, orderNo: e.target.value }))
              }
              disabled={pending}
            />
          </label>

          <label className="label cursor-pointer justify-start gap-3 py-1">
            <input
              type="checkbox"
              className="checkbox checkbox-sm border-base-300"
              checked={draft.isActive}
              onChange={(e) =>
                setDraft((d) => ({ ...d, isActive: e.target.checked }))
              }
              disabled={pending}
            />
            <span className="label-text text-sm text-base-content">
              활성 (isActive)
            </span>
          </label>

          {localError ? (
            <p className="text-sm text-error">{localError}</p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              disabled={pending}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={pending}
            >
              {pending ? (
                <span className="loading loading-spinner loading-xs" />
              ) : mode === 'create' ? (
                '추가'
              ) : (
                '저장'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
