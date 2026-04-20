'use client';

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
  formatRaidPartySizeLabel,
  normalizeRaidPartySize,
  type RaidInfo,
} from '@/types/raid';

type Props = {
  raids: RaidInfo[];
  selectedRaidId: number | null;
  loading: boolean;
  isSavingOrder: boolean;
  onSelect: (raidId: number) => void;
  onReorder: (nextRaidIds: number[]) => Promise<void> | void;
  togglePendingRaidId: number | null;
  deletePendingRaidId: number | null;
  updatePendingRaidId: number | null;
  onToggleActive: (raidId: number, nextActive: boolean) => Promise<void>;
  onEdit: (raid: RaidInfo) => void;
  onDelete: (raidId: number) => Promise<void>;
};

function sortableRaidId(raidId: number): string {
  return `admin-raid-${raidId}`;
}

function parseRaidIdFromSortableId(id: string): number | null {
  if (!id.startsWith('admin-raid-')) return null;
  const n = Number(id.slice('admin-raid-'.length));
  return Number.isFinite(n) ? n : null;
}

type SortableRaidRowProps = {
  raid: RaidInfo;
  selectedRaidId: number | null;
  isSavingOrder: boolean;
  togglePendingRaidId: number | null;
  deletePendingRaidId: number | null;
  updatePendingRaidId: number | null;
  onSelect: (raidId: number) => void;
  onToggleActive: (raidId: number, nextActive: boolean) => Promise<void>;
  onEdit: (raid: RaidInfo) => void;
  onDelete: (raidId: number) => Promise<void>;
};

function SortableRaidRow({
  raid,
  selectedRaidId,
  isSavingOrder,
  togglePendingRaidId,
  deletePendingRaidId,
  updatePendingRaidId,
  onSelect,
  onToggleActive,
  onEdit,
  onDelete,
}: SortableRaidRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableRaidId(raid.id), disabled: isSavingOrder });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  async function confirmDelete(raidId: number) {
    const ok = window.confirm('해당 레이드를 삭제하시겠습니까?');
    if (!ok) return;
    await onDelete(raidId);
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`${selectedRaidId === raid.id ? 'bg-base-200/80' : 'bg-base-200'} ${isDragging ? 'opacity-60' : ''}`}
    >
      <td className="w-10">
        <button
          type="button"
          className={`btn btn-ghost btn-xs h-7 w-7 p-0 ${isSavingOrder ? 'cursor-progress' : 'cursor-grab active:cursor-grabbing'}`}
          aria-label="순서 드래그 핸들"
          title="드래그해서 순서 변경"
          {...attributes}
          {...listeners}
        >
          <span className="text-base-content/70">⋮⋮</span>
        </button>
      </td>
      <td className="font-medium text-base-content">{raid.raidName}</td>
      <td className="whitespace-nowrap text-base-content/90">
        {formatRaidPartySizeLabel(normalizeRaidPartySize(raid.partySize))}
      </td>
      <td>
        <span className="badge badge-ghost badge-sm">{raid.orderNo}</span>
      </td>
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
            disabled={togglePendingRaidId === raid.id || isSavingOrder}
            onChange={(e) => onToggleActive(raid.id, e.target.checked)}
          />
        </label>
      </td>
      <td>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`btn btn-xs ${
              selectedRaidId === raid.id ? 'btn-neutral' : 'btn-outline'
            }`}
            onClick={() => onSelect(raid.id)}
          >
            선택
          </button>
          <button
            type="button"
            className="btn btn-xs btn-outline border-base-300"
            onClick={() => onEdit(raid)}
            disabled={updatePendingRaidId === raid.id || isSavingOrder}
          >
            {updatePendingRaidId === raid.id ? '수정 중' : '수정'}
          </button>
          <button
            type="button"
            className="btn btn-xs btn-outline border-error/40 text-error"
            onClick={() => void confirmDelete(raid.id)}
            disabled={deletePendingRaidId === raid.id || isSavingOrder}
          >
            {deletePendingRaidId === raid.id ? '삭제 중' : '삭제'}
          </button>
        </div>
      </td>
    </tr>
  );
}

export function RaidList({
  raids,
  selectedRaidId,
  loading,
  isSavingOrder,
  onSelect,
  onReorder,
  togglePendingRaidId,
  deletePendingRaidId,
  updatePendingRaidId,
  onToggleActive,
  onEdit,
  onDelete,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    if (isSavingOrder) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = parseRaidIdFromSortableId(String(active.id));
    const overId = parseRaidIdFromSortableId(String(over.id));
    if (activeId == null || overId == null) return;
    const ids = raids.map((r) => r.id);
    const oldIndex = ids.indexOf(activeId);
    const newIndex = ids.indexOf(overId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
    const next = arrayMove(ids, oldIndex, newIndex);
    void onReorder(next);
  }

  return (
    <section className="card h-full border border-base-300 bg-base-200 text-base-content">
      <div className="card-body p-4 md:p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="card-title text-base">레이드 목록</h3>
          <div className="flex items-center gap-2">
            {isSavingOrder ? (
              <span className="badge badge-info gap-1 text-info-content">
                <span className="loading loading-spinner loading-xs" />
                순서 저장 중
              </span>
            ) : null}
            {loading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : null}
          </div>
        </div>
        {raids.length === 0 ? (
          <p className="text-sm text-base-content/60">
            등록된 레이드가 없습니다.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="overflow-x-auto rounded-lg border border-base-300">
              <table className="table table-sm bg-base-200 text-base-content">
                <thead className="text-slate-700">
                  <tr>
                    <th className="w-10"></th>
                    <th>레이드명</th>
                    <th>인원</th>
                    <th>순서</th>
                    <th>상태</th>
                    <th>활성화</th>
                    <th className="w-40">관리</th>
                  </tr>
                </thead>
                <SortableContext
                  items={raids.map((raid) => sortableRaidId(raid.id))}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody>
                    {raids.map((raid) => (
                      <SortableRaidRow
                        key={raid.id}
                        raid={raid}
                        selectedRaidId={selectedRaidId}
                        isSavingOrder={isSavingOrder}
                        togglePendingRaidId={togglePendingRaidId}
                        deletePendingRaidId={deletePendingRaidId}
                        updatePendingRaidId={updatePendingRaidId}
                        onSelect={onSelect}
                        onToggleActive={onToggleActive}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </div>
          </DndContext>
        )}
      </div>
    </section>
  );
}
