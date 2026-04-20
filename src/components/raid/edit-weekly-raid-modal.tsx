"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";

import {
  deleteCharacterWeeklyRaidsByRaid,
  getRaidInfoDetail,
  putCharacterWeeklyRaidsByRaid,
} from "@/lib/api/raid";
import { ApiError } from "@/types/api";
import type {
  CharacterWeeklyRaidItem,
  RaidDetail,
  WeeklyRaidGateSelection,
} from "@/types/raid";

import { RaidDifficultySection } from "./raid-difficulty-section";

type Props = {
  open: boolean;
  characterId: number;
  raidId: number | null;
  raidName: string;
  weeklyRows: CharacterWeeklyRaidItem[];
  onClose: () => void;
  onSaved: () => void;
};

type SelectionState = Record<number, { selected: boolean; extra: boolean }>;

function resolveRaidGateInfoId(row: CharacterWeeklyRaidItem): number | null {
  const raw = (
    row as CharacterWeeklyRaidItem & { raidGateInfold?: unknown }
  ).raidGateInfoId ??
    (row as CharacterWeeklyRaidItem & { raidGateInfold?: unknown }).raidGateInfold ??
    row.raidGateInfo?.id;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function EditWeeklyRaidModal({
  open,
  characterId,
  raidId,
  raidName,
  weeklyRows,
  onClose,
  onSaved,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [detail, setDetail] = useState<RaidDetail | null>(null);
  const [selection, setSelection] = useState<SelectionState>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmError, setDeleteConfirmError] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setDeleteConfirmOpen(false);
      setDeleteConfirmError(null);
    }
  }, [open]);

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

  useEffect(() => {
    if (!open || !raidId) return;
    const selectedRaidId = raidId;
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const d = await getRaidInfoDetail(selectedRaidId);
        if (!alive) return;
        // 수정 모달에서는 난이도 변경이 가능해야 하므로 전체 관문을 노출
        setDetail(d);
        const init: SelectionState = {};
        for (const row of weeklyRows) {
          const gateId = resolveRaidGateInfoId(row);
          if (gateId === null) continue;
          init[gateId] = {
            selected: true,
            extra: row.isExtraRewardSelected,
          };
        }
        setSelection(init);
      } catch (err) {
        if (!alive) return;
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "레이드 정보를 불러오지 못했습니다.";
        setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [open, raidId, weeklyRows]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const selectedByGateNo = new Map<number, number>();
      if (detail) {
        for (const section of detail.difficulties) {
          for (const gate of section.gates) {
            const state = selection[gate.raidGateInfoId];
            if (state?.selected) {
              selectedByGateNo.set(gate.gateNumber, gate.raidGateInfoId);
            }
          }
        }
      }

      const requiredGateNos = new Set(
        weeklyRows.map((row) => row.raidGateInfo.gateNumber),
      );
      const hasAllGateNos = [...requiredGateNos].every((gateNo) =>
        selectedByGateNo.has(gateNo),
      );
      if (!hasAllGateNos) {
        setError(
          `난이도/관문 변경 시 기존 등록 수와 동일하게 ${weeklyRows.length}개를 선택해 주세요.`,
        );
        return;
      }

      const currentRaidSelections: WeeklyRaidGateSelection[] = detail
        ? detail.difficulties.flatMap((section) =>
            section.gates
              .filter((gate) => selection[gate.raidGateInfoId]?.selected)
              .map((gate) => ({
                raidGateInfoId: Number(gate.raidGateInfoId),
                isExtraRewardSelected: Boolean(
                  selection[gate.raidGateInfoId]?.extra ?? false,
                ),
              }))
              .filter(
                (row) =>
                  Number.isInteger(row.raidGateInfoId) && row.raidGateInfoId > 0,
              ),
          )
        : [];

      const payload = {
        raidGateSelections: currentRaidSelections,
      };
      console.log(
        'weekly raid update payload',
        JSON.stringify(payload, null, 2),
      );
      if (raidId == null) {
        setError("수정할 레이드 정보를 찾을 수 없습니다.");
        return;
      }
      await putCharacterWeeklyRaidsByRaid(characterId, raidId, payload);
      onSaved();
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "레이드 설정 수정에 실패했습니다.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function performDelete() {
    if (raidId === null || weeklyRows.length === 0) return;
    setDeleting(true);
    setDeleteConfirmError(null);
    try {
      await deleteCharacterWeeklyRaidsByRaid(characterId, {
        raidInfoId: raidId,
      });
      setDeleteConfirmOpen(false);
      onSaved();
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "레이드 숙제 삭제에 실패했습니다.";
      setDeleteConfirmError(msg);
    } finally {
      setDeleting(false);
    }
  }

  if (!mounted || !raidId) return null;

  return createPortal(
    <>
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <motion.button
            type="button"
            className="absolute inset-0 bg-base-200/70"
            onClick={onClose}
            aria-label="닫기"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          />
          <motion.div
            className="relative z-10 flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200 text-base-content"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
        <div className="flex items-center justify-between border-b border-base-300 px-5 py-4">
          <div>
            <h3 className="text-2xl font-bold">레이드 숙제 수정</h3>
            <p className="mt-1 text-sm text-base-content/80">{raidName}</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="py-10 text-center text-base-content/80">불러오는 중...</div>
          ) : detail ? (
            <div className="space-y-5">
              {detail.difficulties.map((section) => (
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
                        selected: true,
                        extra,
                      },
                    }))
                  }
                />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-base-content/80">등록된 레이드가 없습니다.</div>
          )}
          {error ? <div className="alert alert-error">{error}</div> : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-base-300 px-5 py-4">
          <button
            type="button"
            className="btn btn-outline btn-error btn-sm sm:btn-md"
            disabled={deleting || saving || loading || weeklyRows.length === 0}
            onClick={() => {
              setDeleteConfirmError(null);
              setDeleteConfirmOpen(true);
            }}
          >
            레이드 삭제
          </button>
          <button
            type="button"
            className="btn btn-primary min-w-36"
            disabled={saving || deleting || loading}
            onClick={handleSave}
          >
            {saving ? "수정 중..." : "수정하기"}
          </button>
        </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>

    <AnimatePresence>
      {open && deleteConfirmOpen ? (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
          <motion.button
            type="button"
            className="absolute inset-0 bg-base-300/80"
            aria-label="닫기"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            disabled={deleting}
            onClick={() => {
              if (!deleting) setDeleteConfirmOpen(false);
            }}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="raid-delete-confirm-title"
            aria-describedby="raid-delete-confirm-desc"
            className="relative z-10 w-full max-w-md rounded-2xl border border-base-300 bg-base-200 p-5 text-base-content shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4
              id="raid-delete-confirm-title"
              className="text-lg font-bold text-base-content"
            >
              레이드 숙제 삭제
            </h4>
            <p
              id="raid-delete-confirm-desc"
              className="mt-3 text-sm leading-relaxed text-base-content/80"
            >
              <span className="font-semibold text-amber-200/90">
                &quot;{raidName}&quot;
              </span>
              {" "}레이드 숙제를 모두 삭제할까요?
              <br />
              <span className="text-base-content/60">
                이 레이드에 등록된 모든 관문이 제거됩니다.
              </span>
            </p>
            {deleteConfirmError ? (
              <div className="alert alert-error mt-3 text-sm">
                {deleteConfirmError}
              </div>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={deleting}
                onClick={() => setDeleteConfirmOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="btn btn-error btn-sm"
                disabled={deleting}
                onClick={() => void performDelete()}
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
    </>,
    document.body,
  );
}
