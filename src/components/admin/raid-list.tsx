'use client';

import {
  formatRaidPartySizeLabel,
  normalizeRaidPartySize,
  type RaidInfo,
} from '@/types/raid';

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
    const ok = window.confirm('해당 레이드를 삭제하시겠습니까?');
    if (!ok) return;
    await onDelete(raidId);
  }

  return (
    <section className="card h-full border border-base-300 bg-base-200 text-base-content">
      <div className="card-body p-4 md:p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="card-title text-base">레이드 목록</h3>
          {loading ? (
            <span className="loading loading-spinner loading-xs" />
          ) : null}
        </div>
        {raids.length === 0 ? (
          <p className="text-sm text-base-content/60">
            등록된 레이드가 없습니다.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-base-300">
            <table className="table table-sm bg-base-200 text-base-content">
              <thead className="text-slate-700">
                <tr>
                  <th>레이드명</th>
                  <th>인원</th>
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
                    className={
                      selectedRaidId === raid.id
                        ? 'bg-base-200/80'
                        : 'bg-base-200'
                    }
                  >
                    <td className="font-medium text-base-content">
                      {raid.raidName}
                    </td>
                    <td className="whitespace-nowrap text-base-content/90">
                      {formatRaidPartySizeLabel(
                        normalizeRaidPartySize(raid.partySize),
                      )}
                    </td>
                    <td>{raid.orderNo}</td>
                    <td>
                      <span
                        className={`badge badge-sm ${
                          raid.isActive
                            ? 'badge-success text-success'
                            : 'border border-base-300 bg-base-300 text-slate-700'
                        }`}
                      >
                        {raid.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td>
                      <label className="label cursor-pointer justify-start gap-2 py-0">
                        <input
                          type="checkbox"
                          className="toggle toggle-xs border-base-content/20 bg-base-300 text-slate-700 checked:border-primary checked:bg-primary"
                          checked={raid.isActive}
                          disabled={togglePendingRaidId === raid.id}
                          onChange={(e) =>
                            onToggleActive(raid.id, e.target.checked)
                          }
                        />
                      </label>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className={`btn btn-xs ${
                            selectedRaidId === raid.id
                              ? 'btn-neutral'
                              : 'btn-outline'
                          }`}
                          onClick={() => onSelect(raid.id)}
                        >
                          선택
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline border-base-300"
                          onClick={() => onEdit(raid)}
                          disabled={updatePendingRaidId === raid.id}
                        >
                          {updatePendingRaidId === raid.id ? '수정 중' : '수정'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline border-error/40 text-error"
                          onClick={() => confirmDelete(raid.id)}
                          disabled={deletePendingRaidId === raid.id}
                        >
                          {deletePendingRaidId === raid.id ? '삭제 중' : '삭제'}
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
