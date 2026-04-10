'use client';

import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';

import {
  createCharacterWeeklyRaids,
  getCharacterWeeklyRaids,
  getRaidInfoDetail,
  getRaidInfos,
} from '@/lib/api/raid';
import { ApiError } from '@/types/api';
import type { CharacterWeeklyRaidItem, RaidDetail, RaidSimple } from '@/types/raid';

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
  const [registeredRows, setRegisteredRows] = useState<CharacterWeeklyRaidItem[]>([]);
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
        const [list, registered] = await Promise.all([
          getRaidInfos(),
          getCharacterWeeklyRaids(characterId),
        ]);
        if (!alive) return;
        setRegisteredRows(registered);

        const registeredRaidIds = new Set(
          registered.map((row) => row.raidGateInfo.raidInfo.id),
        );
        const filtered = list.filter((r) => !registeredRaidIds.has(r.id));

        setRaids(filtered);
        setRaidId((prev) => {
          if (prev && filtered.some((r) => r.id === prev)) return prev;
          return filtered[0]?.id ?? null;
        });
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
  }, [open, characterId]);

  useEffect(() => {
    if (!open || !raidId) return;
    const selectedRaidId = raidId;
    let alive = true;
    async function loadDetail() {
      setLoadingDetail(true);
      setError(null);
      try {
        const d = await getRaidInfoDetail(selectedRaidId);
        if (!alive) return;
        const registeredGateIds = new Set(
          registeredRows.map((row) => row.raidGateInfoId),
        );
        const filteredDetail: RaidDetail = {
          ...d,
          difficulties: d.difficulties
            .map((section) => ({
              ...section,
              gates: section.gates.filter(
                (gate) => !registeredGateIds.has(gate.raidGateInfoId),
              ),
            }))
            .filter((section) => section.gates.length > 0),
        };
        setDetail(filteredDetail);
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
  }, [open, raidId, registeredRows]);

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

  const gateNoByGateId = useMemo(() => {
    const map = new Map<number, number>();
    if (!detail) return map;
    for (const section of detail.difficulties) {
      for (const gate of section.gates) {
        map.set(gate.raidGateInfoId, gate.gateNumber);
      }
    }
    return map;
  }, [detail]);

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

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.button
            type="button"
            className="absolute inset-0 bg-base-200/70"
            aria-label="닫기"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          />
          <motion.div
            className="relative z-10 flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200 text-base-content shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
        <div className="flex items-center justify-between border-b border-base-300 px-5 py-4">
          <div>
            <h3 className="text-2xl font-bold">레이드 숙제 등록</h3>
            <p className="mt-1 text-sm text-base-content/80">
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
          <div>
            <p className="mb-2 text-sm font-semibold text-base-content/80">레이드 선택</p>
            <div className="flex flex-wrap gap-2">
              {raids.map((r) => {
                const selected = raidId === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    disabled={loadingList}
                    onClick={() => setRaidId(r.id)}
                    className={`btn btn-sm rounded-full ${
                      selected
                        ? "btn-primary"
                        : "border border-base-300 bg-base-300 text-base-content hover:bg-base-300"
                    }`}
                  >
                    {r.raidName}
                  </button>
                );
              })}
            </div>
          </div>

          {loadingDetail ? (
            <div className="py-10 text-center text-base-content/80">
              레이드 정보 불러오는 중...
            </div>
          ) : detail ? (
            <div className="space-y-5">
              {detail.difficulties.length > 0 ? (
                detail.difficulties.map((section) => (
                  <RaidDifficultySection
                    key={section.difficulty}
                    section={section}
                    values={selection}
                    onToggleSelected={(gateId, selected) =>
                      setSelection((prev) => {
                        const next: SelectionState = { ...prev };
                        const gateNo = gateNoByGateId.get(gateId);

                        if (selected && gateNo !== undefined) {
                          for (const [id, no] of gateNoByGateId.entries()) {
                            if (no === gateNo && id !== gateId) {
                              next[id] = { selected: false, extra: false };
                            }
                          }
                        }

                        next[gateId] = {
                          selected,
                          extra: selected ? (prev[gateId]?.extra ?? false) : false,
                        };
                        return next;
                      })
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
                ))
              ) : (
                <div className="rounded-lg border border-base-300 bg-base-300/60 px-4 py-6 text-center text-sm text-base-content/80">
                  해당 레이드는 이미 모든 관문이 등록되어 있습니다.
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center text-base-content/80">
              {raids.length === 0
                ? '추가 가능한 레이드가 없습니다.'
                : '레이드를 선택해주세요.'}
            </div>
          )}
          {error ? <div className="alert alert-error">{error}</div> : null}
        </div>

        <div className="flex justify-end border-t border-base-300 px-5 py-4">
          <button
            type="button"
            className="btn btn-primary min-w-36"
            disabled={saving || loadingDetail}
            onClick={handleSave}
          >
            {saving ? '등록 중...' : '등록하기'}
          </button>
        </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
