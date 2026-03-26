"use client";

import { useEffect, useState } from "react";

import type { RaidGateInfo, UpdateRaidGateRequest } from "@/types/raid";

type Props = {
  open: boolean;
  gate: RaidGateInfo | null;
  pending: boolean;
  onClose: () => void;
  onSubmit: (gateId: number, payload: UpdateRaidGateRequest) => Promise<void>;
};

type FormState = {
  difficulty: string;
  gateNumber: number;
  gateName: string;
  minItemLevel: number;
  rewardGold: number;
  boundGold: number;
  isSingleMode: boolean;
  canExtraReward: boolean;
  extraRewardCost: number;
  orderNo: number;
  isActive: boolean;
};

export function EditRaidGateModal({ open, gate, pending, onClose, onSubmit }: Props) {
  const [state, setState] = useState<FormState | null>(null);

  useEffect(() => {
    if (!gate) {
      setState(null);
      return;
    }
    setState({
      difficulty: gate.difficulty,
      gateNumber: gate.gateNumber,
      gateName: gate.gateName,
      minItemLevel: gate.minItemLevel,
      rewardGold: gate.rewardGold,
      boundGold: gate.boundGold,
      isSingleMode: gate.isSingleMode,
      canExtraReward: gate.canExtraReward,
      extraRewardCost: gate.extraRewardCost ?? 0,
      orderNo: gate.orderNo,
      isActive: gate.isActive,
    });
  }, [gate]);

  if (!open || !gate || !state) return null;

  async function handleSave() {
    const payload: UpdateRaidGateRequest = {
      difficulty: state.difficulty.trim(),
      gateNumber: Number(state.gateNumber),
      gateName: state.gateName.trim(),
      minItemLevel: Number(state.minItemLevel),
      rewardGold: Number(state.rewardGold),
      boundGold: Number(state.boundGold),
      isSingleMode: state.isSingleMode,
      canExtraReward: state.canExtraReward,
      extraRewardCost: state.canExtraReward ? Number(state.extraRewardCost) : 0,
      orderNo: Number(state.orderNo),
      isActive: state.isActive,
    };
    await onSubmit(gate.id, payload);
    onClose();
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl bg-white text-slate-900">
        <h3 className="text-lg font-semibold">관문 수정</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            className="input input-bordered input-sm border-slate-400 bg-white pl-4 text-slate-900"
            value={state.difficulty}
            onChange={(e) => setState((p) => (p ? { ...p, difficulty: e.target.value } : p))}
            placeholder="난이도"
          />
          <input
            type="number"
            className="input input-bordered input-sm border-slate-400 bg-white pl-4 text-slate-900"
            value={state.gateNumber}
            onChange={(e) =>
              setState((p) => (p ? { ...p, gateNumber: Number(e.target.value) } : p))
            }
            placeholder="관문 번호"
          />
          <input
            className="input input-bordered input-sm border-slate-400 bg-white pl-4 text-slate-900"
            value={state.gateName}
            onChange={(e) => setState((p) => (p ? { ...p, gateName: e.target.value } : p))}
            placeholder="관문명"
          />
          <input
            type="number"
            className="input input-bordered input-sm border-slate-400 bg-white pl-4 text-slate-900"
            value={state.minItemLevel}
            onChange={(e) =>
              setState((p) => (p ? { ...p, minItemLevel: Number(e.target.value) } : p))
            }
            placeholder="최소 아이템 레벨"
          />
          <input
            type="number"
            className="input input-bordered input-sm border-slate-400 bg-white pl-4 text-slate-900"
            value={state.rewardGold}
            onChange={(e) =>
              setState((p) => (p ? { ...p, rewardGold: Number(e.target.value) } : p))
            }
            placeholder="기본 골드"
          />
          <input
            type="number"
            className="input input-bordered input-sm border-slate-400 bg-white pl-4 text-slate-900"
            value={state.boundGold}
            onChange={(e) =>
              setState((p) => (p ? { ...p, boundGold: Number(e.target.value) } : p))
            }
            placeholder="귀속 골드"
          />
          <input
            type="number"
            className="input input-bordered input-sm border-slate-400 bg-white pl-4 text-slate-900"
            value={state.orderNo}
            onChange={(e) => setState((p) => (p ? { ...p, orderNo: Number(e.target.value) } : p))}
            placeholder="정렬 순서"
          />
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={state.canExtraReward}
              onChange={(e) =>
                setState((p) =>
                  p
                    ? {
                        ...p,
                        canExtraReward: e.target.checked,
                        extraRewardCost: e.target.checked ? p.extraRewardCost || 0 : 0,
                      }
                    : p,
                )
              }
            />
            <span className="label-text text-slate-700">더보기 가능</span>
          </label>
          <input
            type="number"
            className="input input-bordered input-sm border-slate-400 bg-white pl-4 text-slate-900 disabled:bg-slate-100"
            value={state.extraRewardCost}
            onChange={(e) =>
              setState((p) => (p ? { ...p, extraRewardCost: Number(e.target.value) } : p))
            }
            disabled={!state.canExtraReward}
            placeholder="더보기 골드 비용"
          />
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={state.isActive}
              onChange={(e) => setState((p) => (p ? { ...p, isActive: e.target.checked } : p))}
            />
            <span className="label-text text-slate-700">활성화</span>
          </label>
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={state.isSingleMode}
              onChange={(e) =>
                setState((p) => (p ? { ...p, isSingleMode: e.target.checked } : p))
              }
            />
            <span className="label-text text-slate-700">싱글 모드</span>
          </label>
        </div>
        <div className="modal-action">
          <button type="button" className="btn btn-ghost text-slate-700" onClick={onClose}>
            취소
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={pending}>
            {pending ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} aria-label="닫기" />
    </div>
  );
}
