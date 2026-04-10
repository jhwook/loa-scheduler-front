'use client';

import type { RaidGateInfo } from '@/types/raid';

type Props = {
  gates: RaidGateInfo[];
  loading: boolean;
  deletePendingGateId: number | null;
  togglePendingGateId: number | null;
  onEdit: (gate: RaidGateInfo) => void;
  onDelete: (gateId: number) => Promise<void>;
  onToggleActive: (gateId: number, nextActive: boolean) => Promise<void>;
};

export function RaidGateList({
  gates,
  loading,
  deletePendingGateId,
  togglePendingGateId,
  onEdit,
  onDelete,
  onToggleActive,
}: Props) {
  async function confirmDelete(gateId: number) {
    const ok = window.confirm('해당 관문을 삭제하시겠습니까?');
    if (!ok) return;
    await onDelete(gateId);
  }

  return (
    <section className="card border border-base-300 bg-base-200 text-base-content">
      <div className="card-body p-4 md:p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="card-title text-base">관문 목록</h3>
          {loading ? (
            <span className="loading loading-spinner loading-xs" />
          ) : null}
        </div>
        {gates.length === 0 ? (
          <p className="text-sm text-base-content/60">
            선택된 레이드의 관문이 없습니다.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-base-300">
            <table className="table table-sm bg-base-200 text-base-content">
              <thead className="text-slate-700">
                <tr>
                  <th>순서</th>
                  <th>난이도</th>
                  <th>모드</th>
                  <th>관문</th>
                  <th>최소 레벨</th>
                  <th>골드</th>
                  <th>귀속 골드</th>
                  <th>더보기</th>
                  <th>상태</th>
                  <th>활성화</th>
                  <th className="w-40">관리</th>
                </tr>
              </thead>
              <tbody>
                {gates.map((gate) => (
                  <tr key={gate.id} className="bg-base-200">
                    <td>{gate.orderNo}</td>
                    <td>{gate.difficulty}</td>
                    <td>{gate.isSingleMode ? '싱글' : '일반'}</td>
                    <td>
                      {gate.gateNumber}관 / {gate.gateName}
                    </td>
                    <td>{gate.minItemLevel}</td>
                    <td>{gate.rewardGold.toLocaleString()}</td>
                    <td>{gate.boundGold.toLocaleString()}</td>
                    <td>
                      {gate.canExtraReward ? (
                        <span>
                          가능 / {(gate.extraRewardCost ?? 0).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-base-content/60">없음</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge badge-sm ${
                          gate.isActive ? 'badge-success' : 'badge-ghost'
                        }`}
                      >
                        {gate.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td>
                      <label className="label cursor-pointer justify-start gap-2 py-0">
                        <input
                          type="checkbox"
                          className="toggle toggle-xs border-base-content/20 bg-base-300 text-slate-700 checked:border-primary checked:bg-primary"
                          checked={gate.isActive}
                          disabled={togglePendingGateId === gate.id}
                          onChange={(e) =>
                            onToggleActive(gate.id, e.target.checked)
                          }
                        />
                      </label>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-xs btn-outline border-base-300"
                          onClick={() => onEdit(gate)}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline border-error/40 text-error"
                          onClick={() => confirmDelete(gate.id)}
                          disabled={deletePendingGateId === gate.id}
                        >
                          {deletePendingGateId === gate.id ? '삭제 중' : '삭제'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
