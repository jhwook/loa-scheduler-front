"use client";

import { createPortal } from "react-dom";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  postCharactersSync,
  postExpeditionPreview,
} from "@/lib/api/expedition";
import { ApiError } from "@/types/api";
import type { ExpeditionPreviewCharacter } from "@/types/expedition";

function characterKey(c: ExpeditionPreviewCharacter): string {
  return `${c.serverName}::${c.characterName}`;
}

/** "1,712.50" 등 → 숫자 (정렬용) */
function parseItemAvgLevel(level: string): number {
  const n = parseFloat(String(level).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

function groupByServer(
  list: ExpeditionPreviewCharacter[],
): Map<string, ExpeditionPreviewCharacter[]> {
  const map = new Map<string, ExpeditionPreviewCharacter[]>();
  for (const c of list) {
    const prev = map.get(c.serverName) ?? [];
    prev.push(c);
    map.set(c.serverName, prev);
  }
  for (const [serverName, chars] of map) {
    const sorted = [...chars].sort(
      (a, b) =>
        parseItemAvgLevel(b.itemAvgLevel) - parseItemAvgLevel(a.itemAvgLevel),
    );
    map.set(serverName, sorted);
  }
  return map;
}

type Props = {
  open: boolean;
  onClose: () => void;
};

/** 서버 행: 전체 선택 여부를 체크 표시 + 부분 선택 시 indeterminate */
function ServerSelectAllCheckbox({
  serverName,
  allSelected,
  indeterminate,
  onToggle,
}: {
  serverName: string;
  allSelected: boolean;
  indeterminate: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate, allSelected]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className="checkbox checkbox-sm checkbox-neutral h-5 w-5 shrink-0 border-slate-600"
      checked={allSelected}
      onChange={onToggle}
      title={
        allSelected
          ? `${serverName} 전체 해제`
          : `${serverName} 전체 선택`
      }
      aria-label={`${serverName} 캐릭터 전체 선택`}
    />
  );
}

export function ExpeditionPreviewModal({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ExpeditionPreviewCharacter[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  /** 접힌 서버(serverName) */
  const [collapsedServers, setCollapsedServers] = useState<Set<string>>(
    new Set(),
  );
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    kind: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const grouped = useMemo(() => groupByServer(rows), [rows]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setRows([]);
      setSelected(new Set());
      setError(null);
      setCollapsedServers(new Set());
      setConfirmSaveOpen(false);
      setSaveFeedback(null);
    }
  }, [open]);

  /** 검색 결과가 바뀌면 접기 상태 초기화 */
  useEffect(() => {
    setCollapsedServers(new Set());
  }, [rows]);

  async function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = new FormData(e.currentTarget).get(
      "representativeCharacterName",
    );
    const name = String(raw ?? query ?? "").trim();
    if (!name) {
      setError("대표 캐릭터명을 입력해 주세요.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const list = await postExpeditionPreview(name);
      setRows(list);
      const all = new Set(list.map(characterKey));
      setSelected(all);
    } catch (err) {
      let msg = "검색에 실패했습니다.";
      if (err instanceof ApiError) msg = err.message;
      else if (err instanceof Error) msg = err.message;
      setError(msg);
      setRows([]);
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  }

  function toggle(key: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function toggleServerCollapse(serverName: string) {
    setCollapsedServers((prev) => {
      const next = new Set(prev);
      if (next.has(serverName)) next.delete(serverName);
      else next.add(serverName);
      return next;
    });
  }

  /** 해당 서버 캐릭터 전체 선택 / 전체 해제 토글 */
  function toggleServerSelectAll(chars: ExpeditionPreviewCharacter[]) {
    const keys = chars.map(characterKey);
    setSelected((prev) => {
      const allSelected = keys.length > 0 && keys.every((k) => prev.has(k));
      const next = new Set(prev);
      if (allSelected) {
        keys.forEach((k) => next.delete(k));
      } else {
        keys.forEach((k) => next.add(k));
      }
      return next;
    });
  }

  function handleSaveClick() {
    if (rows.length === 0) return;
    const names = rows
      .filter((c) => selected.has(characterKey(c)))
      .map((c) => c.characterName);
    if (names.length === 0) {
      setSaveFeedback({
        kind: "error",
        title: "선택 없음",
        message: "저장할 캐릭터를 한 명 이상 선택해 주세요.",
      });
      return;
    }
    setConfirmSaveOpen(true);
  }

  async function handleConfirmSave() {
    const names = rows
      .filter((c) => selected.has(characterKey(c)))
      .map((c) => c.characterName);
    if (names.length === 0) {
      setConfirmSaveOpen(false);
      return;
    }
    setSaving(true);
    setConfirmSaveOpen(false);
    try {
      await postCharactersSync(names);
      setSaveFeedback({
        kind: "success",
        title: "저장 완료",
        message: "선택한 캐릭터가 서버에 반영되었습니다.",
      });
    } catch (err) {
      let msg = "저장에 실패했습니다.";
      if (err instanceof ApiError) msg = err.message;
      else if (err instanceof Error) msg = err.message;
      setSaveFeedback({
        kind: "error",
        title: "저장 실패",
        message: msg,
      });
    } finally {
      setSaving(false);
    }
  }

  const serverEntries = useMemo(
    () => [...grouped.entries()],
    [grouped],
  );

  if (!open || !mounted) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-100 flex min-h-dvh items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="expedition-preview-title"
      >
        <button
          type="button"
          className="absolute inset-0 bg-slate-900/50"
          aria-label="닫기"
          onClick={onClose}
        />
        <div
          className="relative z-10 flex max-h-[min(90dvh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 pr-1">
                <h2
                  id="expedition-preview-title"
                  className="text-base font-semibold text-slate-900"
                >
                  원정대 캐릭터 검색
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  대표 캐릭터명으로 검색하면 원정대에 속한 캐릭터 목록을
                  불러옵니다.
                </p>
              </div>
              <button
                type="button"
                className="flex h-9 min-h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-lg font-semibold leading-none text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onClose}
                disabled={saving}
                aria-label="닫기"
              >
                <span aria-hidden>×</span>
              </button>
            </div>

            <form
              onSubmit={onSearch}
              className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end"
            >
              <label className="block min-w-0 flex-1">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  대표 캐릭터명
                </span>
                <input
                  type="text"
                  name="representativeCharacterName"
                  autoComplete="off"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="input input-bordered w-full border-slate-400 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-500"
                  placeholder="예: 뿔코a"
                  disabled={loading}
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-neutral shrink-0 rounded-xl sm:mb-0"
              >
                {loading ? "검색 중…" : "검색"}
              </button>
            </form>

            {error ? (
              <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {error}
              </p>
            ) : null}
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-color:rgb(100_116_139)_rgb(226_232_240)] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-500 hover:[&::-webkit-scrollbar-thumb]:bg-slate-600"
          >
            {rows.length === 0 && !loading ? (
              <p className="py-8 text-center text-sm text-slate-500">
                검색 결과가 여기에 표시됩니다.
              </p>
            ) : null}

            {serverEntries.map(([serverName, chars]) => {
              const collapsed = collapsedServers.has(serverName);
              const keys = chars.map(characterKey);
              const allInServerSelected =
                keys.length > 0 && keys.every((k) => selected.has(k));
              const someInServerSelected = keys.some((k) => selected.has(k));
              const serverCheckboxIndeterminate =
                someInServerSelected && !allInServerSelected;

              return (
                <section key={serverName} className="mb-6 last:mb-0">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs h-8 min-h-8 w-8 shrink-0 px-0 text-base font-bold text-slate-700"
                        aria-expanded={!collapsed}
                        aria-label={
                          collapsed
                            ? `${serverName} 목록 펼치기`
                            : `${serverName} 목록 접기`
                        }
                        onClick={() => toggleServerCollapse(serverName)}
                      >
                        <span className="leading-none" aria-hidden>
                          {collapsed ? "▶" : "▼"}
                        </span>
                      </button>
                      <h3 className="text-sm font-semibold text-slate-800">
                        {serverName}
                      </h3>
                      <span className="text-xs text-slate-400">
                        ({chars.length})
                      </span>
                    </div>
                    {chars.length > 0 ? (
                      <ServerSelectAllCheckbox
                        serverName={serverName}
                        allSelected={allInServerSelected}
                        indeterminate={serverCheckboxIndeterminate}
                        onToggle={() => toggleServerSelectAll(chars)}
                      />
                    ) : null}
                  </div>

                  {!collapsed ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {chars.map((c) => {
                        const key = characterKey(c);
                        const on = selected.has(key);
                        return (
                          <label
                            key={key}
                            className={`flex cursor-pointer items-stretch gap-3 rounded-xl border p-3 text-left shadow-sm ${
                              on
                                ? "border-slate-300 bg-slate-50 hover:border-slate-300 hover:bg-slate-50"
                                : "border-slate-200 bg-white opacity-80 hover:border-slate-200 hover:bg-white hover:opacity-80"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="checkbox checkbox-sm checkbox-neutral mt-0.5 h-5 w-5 shrink-0 border-slate-600"
                              checked={on}
                              onChange={(e) => toggle(key, e.target.checked)}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="inline-flex max-w-[45%] shrink-0 items-center truncate rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-800">
                                  {c.characterClassName}
                                </span>
                                <p className="min-w-0 truncate text-sm font-semibold text-slate-900">
                                  {c.characterName}
                                </p>
                              </div>
                              <p className="mt-1 text-xs text-slate-600">
                                Level{" "}
                                <span className="font-semibold text-slate-800">
                                  {c.itemAvgLevel}
                                </span>
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-5 py-3">
            <p className="text-xs text-slate-500">
              선택 {selected.size} / {rows.length}명 · 체크 해제한 캐릭터는 저장에서
              제외됩니다.
            </p>
            <button
              type="button"
              disabled={saving || rows.length === 0}
              className="btn btn-sm rounded-lg border border-slate-400 bg-white px-5 font-semibold text-slate-900 shadow-sm hover:bg-slate-100 disabled:opacity-50"
              onClick={handleSaveClick}
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      </div>

      {confirmSaveOpen ? (
        <div
          className="fixed inset-0 z-120 flex min-h-dvh items-center justify-center bg-slate-900/55 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="expedition-save-confirm-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <p
              id="expedition-save-confirm-title"
              className="text-center text-base font-semibold text-slate-900"
            >
              저장하시겠습니까?
            </p>
            <p className="mt-2 text-center text-xs text-slate-500">
              체크된 캐릭터 이름만 서버로 전송됩니다.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <button
                type="button"
                className="btn btn-outline flex-1 border-slate-300 font-semibold text-slate-800"
                disabled={saving}
                onClick={() => setConfirmSaveOpen(false)}
              >
                아니오
              </button>
              <button
                type="button"
                className="btn btn-neutral flex-1 font-semibold"
                disabled={saving}
                onClick={handleConfirmSave}
              >
                예
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {saveFeedback ? (
        <div
          className="fixed inset-0 z-130 flex min-h-dvh items-center justify-center bg-slate-900/55 p-4"
          role="alertdialog"
          aria-modal="true"
        >
          <div
            className={`w-full max-w-sm rounded-2xl border bg-white p-6 shadow-2xl ${
              saveFeedback.kind === "success"
                ? "border-emerald-200"
                : "border-rose-200"
            }`}
          >
            <h3
              className={`text-base font-semibold ${
                saveFeedback.kind === "success"
                  ? "text-emerald-900"
                  : "text-rose-900"
              }`}
            >
              {saveFeedback.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {saveFeedback.message}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="btn btn-neutral px-8 font-semibold"
                onClick={() => {
                  const wasSuccess = saveFeedback.kind === "success";
                  setSaveFeedback(null);
                  if (wasSuccess) {
                    window.dispatchEvent(
                      new CustomEvent("expedition-characters-synced"),
                    );
                    onClose();
                  }
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>,
    document.body,
  );
}
