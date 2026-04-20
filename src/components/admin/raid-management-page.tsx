"use client";

import { useEffect, useMemo, useState } from "react";

import {
  createRaid,
  createRaidGate,
  deleteRaid,
  deleteRaidGate,
  getAdminRaids,
  patchAdminRaidOrder,
  getRaidGatesByRaidId,
  updateRaid,
  updateRaidGate,
} from "@/lib/api/raid";
import { ApiError } from "@/types/api";
import {
  formatRaidPartySizeLabel,
  normalizeRaidPartySize,
  type CreateRaidGateRequest,
  type CreateRaidRequest,
  type RaidGateInfo,
  type RaidInfo,
  type UpdateRaidGateRequest,
  type UpdateRaidRequest,
} from "@/types/raid";

import { RaidForm } from "./raid-form";
import { EditRaidModal } from "./edit-raid-modal";
import { EditRaidGateModal } from "./edit-raid-gate-modal";
import { RaidGateForm } from "./raid-gate-form";
import { RaidGateList } from "./raid-gate-list";
import { RaidList } from "./raid-list";

export function RaidManagementPage() {
  const [raids, setRaids] = useState<RaidInfo[]>([]);
  const [selectedRaidId, setSelectedRaidId] = useState<number | null>(null);
  const [gates, setGates] = useState<RaidGateInfo[]>([]);

  const [raidsLoading, setRaidsLoading] = useState(false);
  const [gatesLoading, setGatesLoading] = useState(false);
  const [createRaidPending, setCreateRaidPending] = useState(false);
  const [createGatePending, setCreateGatePending] = useState(false);
  const [updatePendingGateId, setUpdatePendingGateId] = useState<number | null>(null);
  const [deletePendingGateId, setDeletePendingGateId] = useState<number | null>(null);
  const [togglePendingRaidId, setTogglePendingRaidId] = useState<number | null>(null);
  const [togglePendingGateId, setTogglePendingGateId] = useState<number | null>(null);
  const [deletePendingRaidId, setDeletePendingRaidId] = useState<number | null>(null);
  const [updatePendingRaidId, setUpdatePendingRaidId] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [editingRaid, setEditingRaid] = useState<RaidInfo | null>(null);
  const [editingGate, setEditingGate] = useState<RaidGateInfo | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const selectedRaid = useMemo(
    () => raids.find((r) => r.id === selectedRaidId) ?? null,
    [raids, selectedRaidId],
  );

  async function refreshRaids(nextRaidId?: number) {
    setRaidsLoading(true);
    try {
      const list = await getAdminRaids();
      const sorted = [...list].sort((a, b) => a.orderNo - b.orderNo);
      setRaids(sorted);

      if (nextRaidId) {
        setSelectedRaidId(nextRaidId);
      } else if (!selectedRaidId && sorted.length > 0) {
        setSelectedRaidId(sorted[0].id);
      } else if (
        selectedRaidId &&
        !sorted.some((raid) => raid.id === selectedRaidId) &&
        sorted.length > 0
      ) {
        setSelectedRaidId(sorted[0].id);
      }
    } catch (err) {
      const text =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "레이드 목록 조회에 실패했습니다.";
      setMessage({ type: "error", text });
    } finally {
      setRaidsLoading(false);
    }
  }

  async function refreshGates(raidId: number) {
    setGatesLoading(true);
    try {
      const list = await getRaidGatesByRaidId(raidId);
      const sorted = [...list].sort((a, b) => a.orderNo - b.orderNo);
      setGates(sorted);
    } catch (err) {
      const text =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "관문 목록 조회에 실패했습니다.";
      setMessage({ type: "error", text });
      setGates([]);
    } finally {
      setGatesLoading(false);
    }
  }

  useEffect(() => {
    refreshRaids();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedRaidId) {
      setGates([]);
      return;
    }
    refreshGates(selectedRaidId);
  }, [selectedRaidId]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => {
      setMessage(null);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function handleCreateRaid(payload: CreateRaidRequest) {
    setCreateRaidPending(true);
    setMessage(null);
    try {
      await createRaid(payload);
      await refreshRaids();
      setMessage({ type: "success", text: "레이드가 추가되었습니다." });
    } catch (err) {
      const text =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "레이드 추가에 실패했습니다.";
      setMessage({ type: "error", text });
      throw err;
    } finally {
      setCreateRaidPending(false);
    }
  }

  async function handleCreateGate(raidId: number, payload: CreateRaidGateRequest) {
    setCreateGatePending(true);
    setMessage(null);
    try {
      await createRaidGate(raidId, payload);
      await refreshGates(raidId);
      await refreshRaids(raidId);
      setMessage({ type: "success", text: "관문이 추가되었습니다." });
    } catch (err) {
      const text =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "관문 추가에 실패했습니다.";
      setMessage({ type: "error", text });
      throw err;
    } finally {
      setCreateGatePending(false);
    }
  }

  async function handleUpdateGate(gateId: number, payload: UpdateRaidGateRequest) {
    if (!selectedRaidId) return;
    setUpdatePendingGateId(gateId);
    setMessage(null);
    try {
      await updateRaidGate(gateId, payload);
      await refreshGates(selectedRaidId);
      setMessage({ type: "success", text: "관문 정보가 수정되었습니다." });
    } catch (err) {
      const text =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "관문 수정에 실패했습니다.";
      setMessage({ type: "error", text });
      throw err;
    } finally {
      setUpdatePendingGateId(null);
    }
  }

  async function handleToggleRaidActive(raidId: number, nextActive: boolean) {
    setTogglePendingRaidId(raidId);
    setMessage(null);
    try {
      const payload: UpdateRaidRequest = { isActive: nextActive };
      await updateRaid(raidId, payload);
      await refreshRaids(raidId);
      setMessage({
        type: "success",
        text: `레이드가 ${nextActive ? "활성화" : "비활성화"}되었습니다.`,
      });
    } catch (err) {
      const text =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "레이드 활성화 변경에 실패했습니다.";
      setMessage({ type: "error", text });
    } finally {
      setTogglePendingRaidId(null);
    }
  }

  async function handleToggleGateActive(gateId: number, nextActive: boolean) {
    if (!selectedRaidId) return;
    setTogglePendingGateId(gateId);
    setMessage(null);
    try {
      await updateRaidGate(gateId, { isActive: nextActive });
      await refreshGates(selectedRaidId);
      setMessage({
        type: "success",
        text: `관문이 ${nextActive ? "활성화" : "비활성화"}되었습니다.`,
      });
    } catch (err) {
      const text =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "관문 활성화 변경에 실패했습니다.";
      setMessage({ type: "error", text });
    } finally {
      setTogglePendingGateId(null);
    }
  }

  async function handleDeleteGate(gateId: number) {
    if (!selectedRaidId) return;
    setDeletePendingGateId(gateId);
    setMessage(null);
    try {
      await deleteRaidGate(gateId);
      await refreshGates(selectedRaidId);
      setMessage({ type: "success", text: "관문이 삭제되었습니다." });
    } catch (err) {
      const text =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "관문 삭제에 실패했습니다.";
      setMessage({ type: "error", text });
      throw err;
    } finally {
      setDeletePendingGateId(null);
    }
  }

  async function handleDeleteRaid(raidId: number) {
    setDeletePendingRaidId(raidId);
    setMessage(null);
    try {
      await deleteRaid(raidId);
      await refreshRaids();
      if (selectedRaidId === raidId) {
        setGates([]);
      }
      setMessage({ type: "success", text: "레이드가 삭제되었습니다." });
    } catch (err) {
      const text =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "레이드 삭제에 실패했습니다.";
      setMessage({ type: "error", text });
    } finally {
      setDeletePendingRaidId(null);
    }
  }

  async function handleUpdateRaid(raidId: number, payload: UpdateRaidRequest) {
    setUpdatePendingRaidId(raidId);
    setMessage(null);
    try {
      await updateRaid(raidId, payload);
      await refreshRaids(raidId);
      setMessage({ type: "success", text: "레이드 정보가 수정되었습니다." });
    } catch (err) {
      const text =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "레이드 수정에 실패했습니다.";
      setMessage({ type: "error", text });
      throw err;
    } finally {
      setUpdatePendingRaidId(null);
    }
  }

  async function handleReorderRaids(nextRaidIds: number[]) {
    if (isSavingOrder) return;
    const before = raids;
    const byId = new Map(before.map((r) => [r.id, r] as const));
    const reordered = nextRaidIds
      .map((id) => byId.get(id))
      .filter((x): x is RaidInfo => Boolean(x))
      .map((raid, index) => ({ ...raid, orderNo: index + 1 }));
    if (reordered.length !== before.length) return;

    setRaids(reordered);
    setIsSavingOrder(true);
    setMessage(null);
    try {
      await patchAdminRaidOrder({
        raidOrders: reordered.map((raid, index) => ({
          raidInfoId: raid.id,
          orderNo: index + 1,
        })),
      });
      await refreshRaids(selectedRaidId ?? undefined);
      setMessage({ type: "success", text: "레이드 순서를 저장했습니다." });
    } catch (err) {
      setRaids(before);
      const text =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "레이드 순서 저장에 실패했습니다.";
      setMessage({ type: "error", text });
    } finally {
      setIsSavingOrder(false);
    }
  }

  return (
    <div className="space-y-4 text-base-content">
      <div>
        <h2 className="text-base font-semibold text-base-content">
          레이드 관리
        </h2>
        <p className="mt-1 text-sm text-base-content/60">
          레이드·관문 정보를 등록하고 활성화합니다.
        </p>
      </div>

      {message ? (
        <div className="pointer-events-none fixed left-1/2 top-4 z-[200] -translate-x-1/2">
          <div
            className={`alert pointer-events-auto min-w-[280px] shadow-lg ${
              message.type === "success" ? "alert-success" : "alert-error"
            }`}
          >
            <span>{message.text}</span>
          </div>
        </div>
      ) : null}

      <RaidForm pending={createRaidPending} onSubmit={handleCreateRaid} />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <RaidList
            raids={raids}
            selectedRaidId={selectedRaidId}
            loading={raidsLoading}
            isSavingOrder={isSavingOrder}
            onSelect={setSelectedRaidId}
            onReorder={handleReorderRaids}
            togglePendingRaidId={togglePendingRaidId}
            deletePendingRaidId={deletePendingRaidId}
            updatePendingRaidId={updatePendingRaidId}
            onToggleActive={handleToggleRaidActive}
            onEdit={setEditingRaid}
            onDelete={handleDeleteRaid}
          />
        </div>

        <div className="space-y-4 lg:col-span-8">
          <div className="rounded-xl border border-base-300 bg-base-200/80 p-3 text-sm text-base-content/70">
            {selectedRaid ? (
              <p>
                선택한 레이드:{" "}
                <strong className="text-base-content">
                  {selectedRaid.raidName}
                </strong>
                <span className="ml-2 text-base-content/60">
                  ·{" "}
                  {formatRaidPartySizeLabel(
                    normalizeRaidPartySize(selectedRaid.partySize),
                  )}
                </span>
              </p>
            ) : (
              <p>좌측 레이드 목록에서 레이드를 선택해 주세요.</p>
            )}
          </div>
          <RaidGateList
            gates={gates}
            loading={gatesLoading}
            deletePendingGateId={deletePendingGateId}
            togglePendingGateId={togglePendingGateId}
            onEdit={setEditingGate}
            onDelete={handleDeleteGate}
            onToggleActive={handleToggleGateActive}
          />
          <RaidGateForm
            raidId={selectedRaidId}
            pending={createGatePending}
            onSubmit={handleCreateGate}
          />
        </div>
      </div>

      <EditRaidGateModal
        open={Boolean(editingGate)}
        gate={editingGate}
        pending={updatePendingGateId === editingGate?.id}
        onClose={() => setEditingGate(null)}
        onSubmit={handleUpdateGate}
      />

      <EditRaidModal
        open={Boolean(editingRaid)}
        raid={editingRaid}
        pending={updatePendingRaidId === editingRaid?.id}
        onClose={() => setEditingRaid(null)}
        onSubmit={handleUpdateRaid}
      />
    </div>
  );
}
