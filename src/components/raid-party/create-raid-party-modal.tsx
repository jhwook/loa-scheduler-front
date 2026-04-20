"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import {
  createRaidParty,
  getRaidInfoOptions,
  getRaidPartyDifficultyOptions,
} from "@/lib/api/raid-party";
import { ApiError } from "@/types/api";
import type {
  RaidInfoOption,
  RaidParty,
  RaidPartyDifficultyOption,
} from "@/types/raid-party";

type Props = {
  open: boolean;
  groupId: number;
  onClose: () => void;
  onCreated: (party: RaidParty) => void;
};

export function CreateRaidPartyModal({
  open,
  groupId,
  onClose,
  onCreated,
}: Props) {
  const [raidOptions, setRaidOptions] = useState<RaidInfoOption[]>([]);
  const [raidsLoading, setRaidsLoading] = useState(false);
  const [raidsError, setRaidsError] = useState<string | null>(null);
  const [selectedRaidInfoId, setSelectedRaidInfoId] = useState<number | "">("");
  const [difficultyOptions, setDifficultyOptions] = useState<
    RaidPartyDifficultyOption[]
  >([]);
  const [difficultyLoading, setDifficultyLoading] = useState(false);
  const [difficultyError, setDifficultyError] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [partyTitle, setPartyTitle] = useState("");
  const [isCreatingRaidParty, setIsCreatingRaidParty] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadRaids = useCallback(async () => {
    setRaidsLoading(true);
    setRaidsError(null);
    try {
      const list = await getRaidInfoOptions();
      setRaidOptions(list);
      setSelectedRaidInfoId(list.length > 0 ? list[0].id : "");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "레이드 목록을 불러오지 못했습니다.";
      setRaidsError(msg);
      setRaidOptions([]);
      setSelectedRaidInfoId("");
    } finally {
      setRaidsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    setPartyTitle("");
    setDifficultyOptions([]);
    setDifficultyError(null);
    setSelectedDifficulty("");
    void loadRaids();
  }, [open, loadRaids]);

  useEffect(() => {
    if (!open || selectedRaidInfoId === "") {
      setDifficultyOptions([]);
      setDifficultyError(null);
      setSelectedDifficulty("");
      return;
    }
    let cancelled = false;
    setDifficultyLoading(true);
    setDifficultyError(null);
    setDifficultyOptions([]);
    setSelectedDifficulty("");
    void getRaidPartyDifficultyOptions(groupId, Number(selectedRaidInfoId))
      .then((rows) => {
        if (cancelled) return;
        setDifficultyOptions(rows);
        setSelectedDifficulty(rows[0]?.value ?? "");
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "난이도 목록을 불러오지 못했습니다.";
        setDifficultyError(msg);
        setDifficultyOptions([]);
        setSelectedDifficulty("");
      })
      .finally(() => {
        if (cancelled) return;
        setDifficultyLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [groupId, open, selectedRaidInfoId]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (selectedRaidInfoId === "" || !Number.isFinite(Number(selectedRaidInfoId))) {
      setSubmitError("레이드를 선택해 주세요.");
      return;
    }
    setSubmitError(null);
    setIsCreatingRaidParty(true);
    try {
      const created = await createRaidParty({
        groupId,
        raidInfoId: Number(selectedRaidInfoId),
        title: partyTitle.trim() || undefined,
        selectedDifficulty: selectedDifficulty || undefined,
      });
      onCreated(created);
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "파티 생성에 실패했습니다.";
      setSubmitError(msg);
    } finally {
      setIsCreatingRaidParty(false);
    }
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md border border-base-300 bg-base-200 text-base-content shadow-xl">
        <h3 className="text-lg font-semibold text-base-content">파티 생성</h3>
        <p className="mt-1 text-xs text-base-content/60">
          레이드를 선택하면 서버에 저장된 인원(4인/8인)에 맞춰 파티가
          만들어집니다.
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="form-control w-full gap-1">
            <span className="label-text text-xs font-medium text-base-content/70">
              레이드
            </span>
            {raidsLoading ? (
              <div className="flex h-9 items-center gap-2 text-sm text-base-content/60">
                <span className="loading loading-spinner loading-sm" />
                불러오는 중…
              </div>
            ) : raidsError ? (
              <p className="text-sm text-error">{raidsError}</p>
            ) : (
              <select
                className="select select-bordered select-sm w-full border-base-300 bg-base-300 text-base-content"
                value={selectedRaidInfoId === "" ? "" : String(selectedRaidInfoId)}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedRaidInfoId(v === "" ? "" : Number(v));
                }}
                required
                disabled={raidOptions.length === 0 || isCreatingRaidParty}
                aria-label="레이드 선택"
              >
                {raidOptions.length === 0 ? (
                  <option value="">등록된 레이드 없음</option>
                ) : (
                  raidOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.raidName}
                    </option>
                  ))
                )}
              </select>
            )}
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
                disabled={isCreatingRaidParty || difficultyOptions.length === 0}
                aria-label="난이도 선택"
              >
                {difficultyOptions.length === 0 ? (
                  <option value="">난이도 없음</option>
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

          <label className="form-control w-full gap-1">
            <span className="label-text text-xs font-medium text-base-content/70">
              제목 (선택)
            </span>
            <input
              type="text"
              className="input input-bordered input-sm w-full border-base-300 bg-base-300 text-base-content placeholder:text-base-content/40"
              value={partyTitle}
              onChange={(e) => setPartyTitle(e.target.value)}
              placeholder="비워두면 서버 기본값"
              maxLength={80}
              disabled={isCreatingRaidParty}
              aria-label="파티 제목"
            />
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
              disabled={isCreatingRaidParty}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={
                isCreatingRaidParty ||
                raidsLoading ||
                Boolean(raidsError) ||
                raidOptions.length === 0 ||
                selectedRaidInfoId === "" ||
                difficultyLoading
              }
            >
              {isCreatingRaidParty ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  생성 중…
                </>
              ) : (
                "생성"
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
