'use client';

import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';

import {
  createCharacterWeeklyRaids,
  getRaidInfoDetail,
  getRaidInfos,
} from '@/lib/api/raid';
import { ApiError } from '@/types/api';
import type { RaidDetail, RaidSimple } from '@/types/raid';

import { RaidDifficultySection } from './raid-difficulty-section';

type Props = {
  open: boolean;
  characterId: number;
  onClose: () => void;
  onSaved: () => void;
};

type SelectionState = Record<number, { selected: boolean; extra: boolean }>;

export function AddRaidModal({ open, characterId, onClose, onSaved }: Props) {
  const [mounted, setMounted] = useState(false);
  const [raids, setRaids] = useState<RaidSimple[]>([]);
  const [raidId, setRaidId] = useState<number | null>(null);
  const [detail, setDetail] = useState<RaidDetail | null>(null);
  const [selection, setSelection] = useState<SelectionState>({});
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    async function loadRaids() {
      setLoadingList(true);
      setError(null);
      try {
        const list = await getRaidInfos();
        if (!alive) return;
        setRaids(list);
        setRaidId((prev) => prev ?? list[0]?.id ?? null);
      } catch (err) {
        if (!alive) return;
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : '레이드 목록을 불러오지 못했습니다.';
        setError(msg);
      } finally {
        if (alive) setLoadingList(false);
      }
    }
    loadRaids();
    return () => {
      alive = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !raidId) return;
    let alive = true;
    async function loadDetail() {
      setLoadingDetail(true);
      setError(null);
      try {
        const d = await getRaidInfoDetail(raidId);
        if (!alive) return;
        setDetail(d);
        setSelection({});
      } catch (err) {
        if (!alive) return;
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : '레이드 상세를 불러오지 못했습니다.';
        setError(msg);
      } finally {
        if (alive) setLoadingDetail(false);
      }
    }
    loadDetail();
    return () => {
      alive = false;
    };
  }, [open, raidId]);

  const allSelected = useMemo(
    () =>
      Object.entries(selection)
        .filter(([, v]) => v.selected)
        .map(([k, v]) => ({
          raidGateInfoId: Number(k),
          isExtraRewardSelected: v.extra,
        })),
    [selection]
  );

  async function handleSave() {
    if (allSelected.length === 0) {
      setError('최소 1개 관문을 선택해 주세요.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createCharacterWeeklyRaids(characterId, {
        raidGateSelections: allSelected,
      });
      onSaved();
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '숙제 등록에 실패했습니다.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/70"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <div>
            <h3 className="text-2xl font-bold">레이드 숙제 등록</h3>
            <p className="mt-1 text-sm text-slate-300">
              레이드와 관문을 선택해주세요
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="max-w-xs">
            <select
              className="select select-bordered w-full border-slate-600 bg-slate-800 text-slate-100"
              disabled={loadingList}
              value={raidId ?? ''}
              onChange={(e) => setRaidId(Number(e.target.value))}
            >
              <option value="" disabled>
                레이드 선택
              </option>
              {raids.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.raidName}
                </option>
              ))}
            </select>
          </div>

          {loadingDetail ? (
            <div className="py-10 text-center text-slate-300">
              레이드 정보 불러오는 중...
            </div>
          ) : detail ? (
            <div className="space-y-5">
              {detail.difficulties.map((section) => (
                <RaidDifficultySection
                  key={section.difficulty}
                  section={section}
                  values={selection}
                  onToggleSelected={(gateId, selected) =>
                    setSelection((prev) => ({
                      ...prev,
                      [gateId]: {
                        selected,
                        extra: selected
                          ? (prev[gateId]?.extra ?? false)
                          : false,
                      },
                    }))
                  }
                  onToggleExtra={(gateId, extra) =>
                    setSelection((prev) => ({
                      ...prev,
                      [gateId]: {
                        selected: prev[gateId]?.selected ?? false,
                        extra,
                      },
                    }))
                  }
                />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-300">
              레이드를 선택해주세요.
            </div>
          )}
          {error ? <div className="alert alert-error">{error}</div> : null}
        </div>

        <div className="flex justify-end border-t border-slate-700 px-5 py-4">
          <button
            type="button"
            className="btn btn-primary min-w-36"
            disabled={saving || loadingDetail}
            onClick={handleSave}
          >
            {saving ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
