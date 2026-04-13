'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createLevelRangeFilter,
  deleteLevelRangeFilter,
  getAdminLevelRangeFilters,
  updateLevelRangeFilter,
} from '@/lib/api/level-range-filters';
import { ApiError } from '@/types/api';
import type { LevelRangeFilter } from '@/types/level-range-filter';

import { LevelRangeFilterFormModal } from './level-range-filter-form-modal';

function formatMaxLevel(max: number | null): string {
  if (max === null) return '제한 없음';
  return String(max);
}

export function LevelRangeFilterManagementPage() {
  const [filters, setFilters] = useState<LevelRangeFilter[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglePendingId, setTogglePendingId] = useState<number | null>(null);
  const [deletePendingId, setDeletePendingId] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<LevelRangeFilter | null>(null);
  const [savePending, setSavePending] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const sortedFilters = useMemo(
    () => [...filters].sort((a, b) => a.orderNo - b.orderNo),
    [filters],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getAdminLevelRangeFilters();
      setFilters(list);
    } catch (err) {
      const text =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '목록을 불러오지 못했습니다.';
      setMessage({ type: 'error', text });
      setFilters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(null), 2800);
    return () => window.clearTimeout(t);
  }, [message]);

  async function handleToggleActive(id: number, next: boolean) {
    setTogglePendingId(id);
    setMessage(null);
    try {
      await updateLevelRangeFilter(id, { isActive: next });
      await refresh();
      setMessage({ type: 'success', text: '활성 상태를 변경했습니다.' });
    } catch (err) {
      const text =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '변경에 실패했습니다.';
      setMessage({ type: 'error', text });
    } finally {
      setTogglePendingId(null);
    }
  }

  async function handleDelete(id: number) {
    const ok = window.confirm('이 레벨 범위 필터를 삭제할까요?');
    if (!ok) return;
    setDeletePendingId(id);
    setMessage(null);
    try {
      await deleteLevelRangeFilter(id);
      await refresh();
      setMessage({ type: 'success', text: '삭제했습니다.' });
    } catch (err) {
      const text =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '삭제에 실패했습니다.';
      setMessage({ type: 'error', text });
    } finally {
      setDeletePendingId(null);
    }
  }

  async function handleModalSubmit(values: {
    label: string;
    minLevel: number;
    maxLevel: number | null;
    orderNo: number;
    isActive: boolean;
  }) {
    setSavePending(true);
    setMessage(null);
    try {
      if (modalMode === 'create') {
        await createLevelRangeFilter(values);
        setMessage({ type: 'success', text: '필터를 추가했습니다.' });
      } else if (modalMode === 'edit' && editing) {
        await updateLevelRangeFilter(editing.id, values);
        setMessage({ type: 'success', text: '필터를 수정했습니다.' });
      }
      setModalMode(null);
      setEditing(null);
      await refresh();
    } catch (err) {
      const text =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '저장에 실패했습니다.';
      setMessage({ type: 'error', text });
    } finally {
      setSavePending(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setModalMode('create');
  }

  function openEdit(row: LevelRangeFilter) {
    setEditing(row);
    setModalMode('edit');
  }

  function closeModal() {
    if (savePending) return;
    setModalMode(null);
    setEditing(null);
  }

  return (
    <div className="space-y-4 text-base-content">
      {message ? (
        <div className="pointer-events-none fixed left-1/2 top-4 z-[200] -translate-x-1/2">
          <div
            className={`alert pointer-events-auto min-w-[280px] shadow-lg ${
              message.type === 'success' ? 'alert-success' : 'alert-error'
            }`}
          >
            <span>{message.text}</span>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-base-content">
            레벨 범위 필터 관리
          </h2>
          <p className="mt-1 text-sm text-base-content/60">
            공대 캐릭터 목록·구분선 등에서 쓰는 장비 레벨 구간을 관리합니다.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm shrink-0"
          onClick={openCreate}
        >
          필터 추가
        </button>
      </div>

      <section className="card border border-base-300 bg-base-200 text-base-content">
        <div className="card-body p-4 md:p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="card-title text-base">등록된 필터</h3>
            {loading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : null}
          </div>

          {sortedFilters.length === 0 && !loading ? (
            <p className="text-sm text-base-content/60">
              등록된 레벨 범위 필터가 없습니다.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-base-300">
              <table className="table table-sm bg-base-200 text-base-content">
                <thead className="text-slate-700">
                  <tr>
                    <th>표시 이름</th>
                    <th>최소</th>
                    <th>최대</th>
                    <th>순서</th>
                    <th>상태</th>
                    <th>활성</th>
                    <th className="w-36">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFilters.map((row) => (
                    <tr key={row.id} className="bg-base-200">
                      <td className="font-medium text-base-content">
                        {row.label}
                      </td>
                      <td className="tabular-nums">{row.minLevel}</td>
                      <td className="tabular-nums text-base-content/90">
                        {formatMaxLevel(row.maxLevel)}
                      </td>
                      <td className="tabular-nums">{row.orderNo}</td>
                      <td>
                        <span
                          className={`badge badge-sm ${
                            row.isActive
                              ? 'badge-success text-success'
                              : 'border border-base-300 bg-base-300 text-slate-700'
                          }`}
                        >
                          {row.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td>
                        <label className="label cursor-pointer justify-start gap-2 py-0">
                          <input
                            type="checkbox"
                            className="toggle toggle-xs border-base-content/20 bg-base-300 text-slate-700 checked:border-primary checked:bg-primary"
                            checked={row.isActive}
                            disabled={togglePendingId === row.id}
                            onChange={(e) =>
                              void handleToggleActive(row.id, e.target.checked)
                            }
                          />
                          {togglePendingId === row.id ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : null}
                        </label>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => openEdit(row)}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-error"
                            disabled={deletePendingId === row.id}
                            onClick={() => void handleDelete(row.id)}
                          >
                            {deletePendingId === row.id ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              '삭제'
                            )}
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

      <LevelRangeFilterFormModal
        open={modalMode !== null}
        mode={modalMode === 'edit' ? 'edit' : 'create'}
        initial={editing}
        pending={savePending}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}
