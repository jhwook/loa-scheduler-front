"use client";

import type { RaidInfo } from "@/types/raid";

type Props = {
  raids: RaidInfo[];
  selectedRaidId: number | null;
  loading: boolean;
  onSelect: (raidId: number) => void;
  togglePendingRaidId: number | null;
  deletePendingRaidId: number | null;
  updatePendingRaidId: number | null;
  onToggleActive: (raidId: number, nextActive: boolean) => Promise<void>;
  onEdit: (raid: RaidInfo) => void;
  onDelete: (raidId: number) => Promise<void>;
};

export function RaidList({
  raids,
  selectedRaidId,
  loading,
  onSelect,
  togglePendingRaidId,
  deletePendingRaidId,
  updatePendingRaidId,
  onToggleActive,
  onEdit,
  onDelete,
}: Props) {
  async function confirmDelete(raidId: number) {
    const ok = window.confirm("해당 레이드를 삭제하시겠습니까?");
    if (!ok) return;
    await onDelete(raidId);
  }

  return (
    <section className="card h-full border border-slate-200 bg-white text-slate-900">
      <div className="card-body p-4 md:p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="card-title text-base">레이드 목록</h3>
          {loading ? <span className="loading loading-spinner loading-xs" /> : null}
        </div>
        {raids.length === 0 ? (
          <p className="text-sm text-slate-500">등록된 레이드가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="table table-sm bg-white text-slate-800">
              <thead className="text-slate-700">
                <tr>
                  <th>레이드명</th>
                  <th>순서</th>
                  <th>상태</th>
                  <th>활성화</th>
                  <th className="w-40">관리</th>
                </tr>
              </thead>
              <tbody>
                {raids.map((raid) => (
                  <tr
                    key={raid.id}
                    className={selectedRaidId === raid.id ? "bg-slate-100/80" : "bg-white"}
                  >
                    <td className="font-medium text-slate-900">{raid.raidName}</td>
                    <td>{raid.orderNo}</td>
                    <td>
                      <span
                        className={`badge badge-sm ${
                          raid.isActive
                            ? "badge-success text-emerald-900"
                            : "border border-slate-400 bg-slate-200 text-slate-700"
                        }`}
                      >
                        {raid.isActive ? "활성" : "비활성"}
                      </span>
                    </td>
                    <td>
                      <label className="label cursor-pointer justify-start gap-2 py-0">
                        <input
                          type="checkbox"
                          className="toggle toggle-xs border-slate-500 bg-slate-300 text-slate-700 checked:border-indigo-600 checked:bg-indigo-600"
                          checked={raid.isActive}
                          disabled={togglePendingRaidId === raid.id}
                          onChange={(e) => onToggleActive(raid.id, e.target.checked)}
                        />
                      </label>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className={`btn btn-xs ${
                            selectedRaidId === raid.id ? "btn-neutral" : "btn-outline"
                          }`}
                          onClick={() => onSelect(raid.id)}
                        >
                          선택
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline border-slate-300"
                          onClick={() => onEdit(raid)}
                          disabled={updatePendingRaidId === raid.id}
                        >
                          {updatePendingRaidId === raid.id ? "수정 중" : "수정"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline border-rose-300 text-rose-700"
                          onClick={() => confirmDelete(raid.id)}
                          disabled={deletePendingRaidId === raid.id}
                        >
                          {deletePendingRaidId === raid.id ? "삭제 중" : "삭제"}
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
