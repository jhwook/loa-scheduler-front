"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import {
  getRaidPartyDifficultyOptions,
  patchRaidParty,
} from "@/lib/api/raid-party";
import { ApiError } from "@/types/api";
import type {
  RaidPartyDetail,
  RaidPartyDifficultyOption,
  RaidPartyListItem,
} from "@/types/raid-party";

type Props = {
  open: boolean;
  groupId: number;
  party: RaidPartyListItem | null;
  detail: RaidPartyDetail | null;
  onClose: () => void;
  onSaved: () => void;
};

export function EditRaidPartyModal({
  open,
  groupId,
  party,
  detail,
  onClose,
  onSaved,
}: Props) {
  const [difficultyOptions, setDifficultyOptions] = useState<
    RaidPartyDifficultyOption[]
  >([]);
  const [difficultyLoading, setDifficultyLoading] = useState(false);
  const [difficultyError, setDifficultyError] = useState<string | null>(null);
  const [partyTitle, setPartyTitle] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const raidInfoId = useMemo(() => {
    if (detail?.raidInfoId) return detail.raidInfoId;
    if (party?.raidInfoId) return party.raidInfoId;
    return null;
  }, [detail?.raidInfoId, party?.raidInfoId]);

  const selectedDifficultyCurrent = useMemo(
    () =>
      detail?.selectedDifficulty?.trim() ||
      party?.selectedDifficulty?.trim() ||
      "",
    [detail?.selectedDifficulty, party?.selectedDifficulty],
  );

  const loadDifficulty = useCallback(async () => {
    if (!open || !raidInfoId) return;
    setDifficultyLoading(true);
    setDifficultyError(null);
    try {
      const rows = await getRaidPartyDifficultyOptions(groupId, raidInfoId);
      setDifficultyOptions(rows);
      if (selectedDifficultyCurrent) {
        const hasCurrent = rows.some((x) => x.value === selectedDifficultyCurrent);
        setSelectedDifficulty(
          hasCurrent
            ? selectedDifficultyCurrent
            : (rows[0]?.value ?? selectedDifficultyCurrent),
        );
      } else {
        setSelectedDifficulty(rows[0]?.value ?? "");
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "난이도 목록을 불러오지 못했습니다.";
      setDifficultyError(msg);
      setDifficultyOptions([]);
      setSelectedDifficulty(selectedDifficultyCurrent);
    } finally {
      setDifficultyLoading(false);
    }
  }, [groupId, open, raidInfoId, selectedDifficultyCurrent]);

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    setPartyTitle((detail?.title ?? party?.title ?? "").trim());
    setDifficultyOptions([]);
    setDifficultyError(null);
    setSelectedDifficulty(selectedDifficultyCurrent);
    void loadDifficulty();
  }, [detail?.title, loadDifficulty, open, party?.title, selectedDifficultyCurrent]);

  if (!open || !party) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!party) return;
    setSubmitError(null);
    setSaving(true);
    try {
      await patchRaidParty(party.id, {
        title: partyTitle.trim() || null,
        selectedDifficulty: selectedDifficulty || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "파티 수정에 실패했습니다.";
      setSubmitError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md border border-base-300 bg-base-200 text-base-content shadow-xl">
        <h3 className="text-lg font-semibold text-base-content">파티 수정</h3>
        <p className="mt-1 text-xs text-base-content/60">
          제목과 난이도를 수정할 수 있습니다.
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="form-control w-full gap-1">
            <span className="label-text text-xs font-medium text-base-content/70">
              제목
            </span>
            <input
              type="text"
              className="input input-bordered input-sm w-full border-base-300 bg-base-300 text-base-content placeholder:text-base-content/40"
              value={partyTitle}
              onChange={(e) => setPartyTitle(e.target.value)}
              placeholder="비워두면 레이드명"
              maxLength={80}
              disabled={saving}
              aria-label="파티 제목"
            />
          </label>

          <label className="form-control w-full gap-1">
            <span className="label-text text-xs font-medium text-base-content/70">
              난이도
            </span>
            {difficultyLoading ? (
              <div className="flex h-9 items-center gap-2 text-sm text-base-content/60">
                <span className="loading loading-spinner loading-sm" />
                불러오는 중…
              </div>
            ) : difficultyError ? (
              <p className="text-sm text-error">{difficultyError}</p>
            ) : (
              <select
                className="select select-bordered select-sm w-full border-base-300 bg-base-300 text-base-content"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                disabled={saving || difficultyOptions.length === 0}
                aria-label="난이도 선택"
              >
                {difficultyOptions.length === 0 ? (
                  <option value="">난이도 미설정</option>
                ) : (
                  difficultyOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))
                )}
              </select>
            )}
          </label>

          {submitError ? (
            <p className="text-sm text-error" role="alert">
              {submitError}
            </p>
          ) : null}

          <div className="modal-action mt-4">
            <button
              type="button"
              className="btn btn-ghost btn-sm text-base-content/80"
              onClick={onClose}
              disabled={saving}
            >
              취소
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  저장 중…
                </>
              ) : (
                "저장"
              )}
            </button>
          </div>
        </form>
      </div>
      <div
        className="modal-backdrop bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="presentation"
        aria-hidden
      />
    </div>
  );
}

