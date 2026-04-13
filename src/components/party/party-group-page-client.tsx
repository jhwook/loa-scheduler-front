'use client';

import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

import { CharacterClassMark } from '@/components/features/expedition/character-class-mark';
import { PartyMemberCard } from '@/components/party/party-member-card';
import { PartyPoolCharacterCard } from '@/components/party/party-pool-character-card';
import { PartyPoolSortableGrid } from '@/components/party/party-pool-sortable-grid';
import { CreateRaidPartyButton } from '@/components/raid-party/create-raid-party-button';
import { CreateRaidPartyModal } from '@/components/raid-party/create-raid-party-modal';
import { RaidPartyDetailView } from '@/components/raid-party/raid-party-detail-view';
import {
  cancelPartyGroupInvite,
  createPartyGroupInvite,
  getSentPartyGroupInvites,
} from '@/lib/api/party-group-invites';
import {
  getPartyBuilderCharacters,
  getPartyGroupCharacters,
  leavePartyGroup,
  deletePartyGroup,
  updatePartyGroupMemberNickname,
  getPartyGroupMyCharacters,
  putPartyGroupMyCharacters,
} from '@/lib/api/party-groups';
import {
  assignRaidPartySlot,
  deleteRaidParty,
  getRaidPartiesByGroup,
  getRaidPartyById,
  patchRaidPartyMemberPosition,
  removeRaidPartyMember,
} from '@/lib/api/raid-party';
import { getMe } from '@/lib/api/users';
import {
  mapPartyGroupCharactersResponseToViewModel,
  getTotalCharacterCount,
} from '@/lib/party/party-mapper';
import {
  mergePartyPoolOrderIds,
  type PartyPoolOrderedRow,
} from '@/lib/party-pool-order';
import {
  parsePoolCharDndId,
  parseRaidMemberDndId,
  parseRaidSlotDndId,
  poolCharDndId,
} from '@/lib/party-tab-dnd-ids';
import { ApiError } from '@/types/api';
import type {
  PartyGroupDetail,
  PartyGroupMyCharacterItem,
} from '@/types/party';
import type { PartySentInviteItem } from '@/types/party-invite';
import {
  globalSlotIndexToPartyAndSlot,
  type RaidPartyDetail,
  type RaidPartyListItem,
} from '@/types/raid-party';
import { normalizePartyRole } from '@/types/expedition';

type Props = {
  groupId: number;
};

type GroupDetailTab = 'status' | 'party' | 'settings';
type InviteModalTab = 'create' | 'sent';
type GroupConfirmAction = 'leave' | 'delete';

function partyTabCollisionDetection(
  args: Parameters<typeof closestCenter>[0],
) {
  const hit = pointerWithin(args);
  return hit.length > 0 ? hit : closestCenter(args);
}

function parseItemAvgLevelParty(level: string | null | undefined): number {
  const n = parseFloat(
    String(level ?? '')
      .replace(/,/g, '')
      .trim()
  );
  return Number.isFinite(n) ? n : 0;
}

function groupPartyMyCharsByServer(
  list: PartyGroupMyCharacterItem[]
): Map<string, PartyGroupMyCharacterItem[]> {
  const map = new Map<string, PartyGroupMyCharacterItem[]>();
  for (const c of list) {
    const key = c.serverName?.trim() ? c.serverName.trim() : '기타';
    const prev = map.get(key) ?? [];
    prev.push(c);
    map.set(key, prev);
  }
  for (const [serverName, chars] of map) {
    const sorted = [...chars].sort(
      (a, b) =>
        parseItemAvgLevelParty(b.itemAvgLevel) -
        parseItemAvgLevelParty(a.itemAvgLevel)
    );
    map.set(serverName, sorted);
  }
  return map;
}

function PublicCharServerSelectAllCheckbox({
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
      className="checkbox checkbox-sm h-5 w-5 shrink-0 border-base-300 bg-base-300"
      checked={allSelected}
      onChange={onToggle}
      title={
        allSelected ? `${serverName} 전체 해제` : `${serverName} 전체 선택`
      }
      aria-label={`${serverName} 캐릭터 전체 선택`}
    />
  );
}

function inviteStatusBadgeClass(status: string): string {
  switch (status) {
    case 'ACCEPTED':
      return 'badge badge-success badge-sm text-white';
    case 'REJECTED':
      return 'badge badge-error badge-sm text-white';
    case 'CANCELED':
      return 'badge badge-neutral badge-sm text-white';
    case 'PENDING':
    default:
      return 'badge badge-warning badge-sm text-primary-content';
  }
}

export function PartyGroupPageClient({ groupId }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<GroupDetailTab>('status');
  const [inviteModalTab, setInviteModalTab] =
    useState<InviteModalTab>('create');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteNickname, setInviteNickname] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [sentInvites, setSentInvites] = useState<PartySentInviteItem[]>([]);
  const [sentLoading, setSentLoading] = useState(false);
  const [sentError, setSentError] = useState<string | null>(null);
  const [cancelBusyId, setCancelBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    kind: 'ok' | 'err';
    text: string;
  } | null>(null);

  const [group, setGroup] = useState<PartyGroupDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meUserId, setMeUserId] = useState<number | null>(null);
  const [groupActionBusy, setGroupActionBusy] = useState<
    'leave' | 'delete' | null
  >(null);
  const [confirmAction, setConfirmAction] = useState<GroupConfirmAction | null>(
    null
  );
  const [nicknameDrafts, setNicknameDrafts] = useState<Record<number, string>>(
    {}
  );
  const [nicknameBusyMemberId, setNicknameBusyMemberId] = useState<
    number | null
  >(null);
  const [publicCharModalOpen, setPublicCharModalOpen] = useState(false);
  const [publicCharRows, setPublicCharRows] = useState<
    PartyGroupMyCharacterItem[]
  >([]);
  const [publicCharLoading, setPublicCharLoading] = useState(false);
  const [publicCharError, setPublicCharError] = useState<string | null>(null);
  const [publicCharSelected, setPublicCharSelected] = useState<Set<number>>(
    () => new Set()
  );
  const [publicCharSaveBusy, setPublicCharSaveBusy] = useState(false);
  const [collapsedPublicCharServers, setCollapsedPublicCharServers] = useState<
    Set<string>
  >(() => new Set());
  const [raidPartyList, setRaidPartyList] = useState<RaidPartyListItem[]>([]);
  const [raidPartyDetails, setRaidPartyDetails] = useState<
    Record<number, RaidPartyDetail>
  >({});
  const [raidPartyDetailErrors, setRaidPartyDetailErrors] = useState<
    Record<number, string>
  >({});
  const [raidPartyListLoading, setRaidPartyListLoading] = useState(false);
  const [raidPartyDetailsLoading, setRaidPartyDetailsLoading] = useState(false);
  const [raidPartyListError, setRaidPartyListError] = useState<string | null>(
    null
  );
  const [createRaidPartyModalOpen, setCreateRaidPartyModalOpen] =
    useState(false);
  /** 공대 캐릭터 풀 정렬 순서 — 저장 시 `@/lib/party-pool-order`의 `buildPartyPoolOrderPayload(partyPoolOrderIds)` 사용 */
  const [partyPoolOrderIds, setPartyPoolOrderIds] = useState<number[]>([]);
  const [partyPoolRows, setPartyPoolRows] = useState<PartyPoolOrderedRow[]>(
    [],
  );
  const [partyPoolLoading, setPartyPoolLoading] = useState(false);
  const [partyPoolError, setPartyPoolError] = useState<string | null>(null);
  const [partyDndActiveId, setPartyDndActiveId] = useState<string | null>(null);
  const [raidPartyAssignBusy, setRaidPartyAssignBusy] = useState<
    Record<number, boolean>
  >({});
  const raidPartyAssignFlightRef = useRef<Set<number>>(new Set());
  const [focusedRaidPartyId, setFocusedRaidPartyId] = useState<number | null>(
    null,
  );
  const [raidPartyDeleteDraft, setRaidPartyDeleteDraft] = useState<{
    id: number;
    titleLabel: string;
  } | null>(null);
  const [raidPartyDeleteBusy, setRaidPartyDeleteBusy] = useState(false);

  const publicCharGrouped = useMemo(
    () => groupPartyMyCharsByServer(publicCharRows),
    [publicCharRows]
  );
  const publicCharServerEntries = useMemo(
    () => [...publicCharGrouped.entries()],
    [publicCharGrouped]
  );

  async function loadGroupDetail(showBusy = true) {
    if (!Number.isFinite(groupId) || groupId <= 0) {
      setError('유효하지 않은 공격대 ID 입니다.');
      setGroup(null);
      return;
    }
    if (showBusy) setBusy(true);
    setError(null);
    try {
      const raw = await getPartyGroupCharacters(groupId);
      const mapped = mapPartyGroupCharactersResponseToViewModel(raw);
      setGroup(mapped);
      setNicknameDrafts(
        Object.fromEntries(mapped.members.map((m) => [m.id, '']))
      );
    } catch (e) {
      const message =
        e instanceof Error ? e.message : '공격대 정보를 불러오지 못했습니다.';
      setError(message);
      setGroup(null);
    } finally {
      if (showBusy) setBusy(false);
    }
  }

  const loadRaidPartyList = useCallback(async () => {
    if (!group) return;
    setRaidPartyListLoading(true);
    setRaidPartyListError(null);
    try {
      const list = await getRaidPartiesByGroup(group.id);
      setRaidPartyList(list);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '파티 목록을 불러오지 못했습니다.';
      setRaidPartyListError(msg);
      setRaidPartyList([]);
    } finally {
      setRaidPartyListLoading(false);
    }
  }, [group]);

  const loadPartyBuilderPool = useCallback(async () => {
    if (!Number.isFinite(groupId) || groupId <= 0) return;
    setPartyPoolLoading(true);
    setPartyPoolError(null);
    try {
      const rows = await getPartyBuilderCharacters(groupId);
      setPartyPoolRows(rows);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '파티 편성 캐릭터 목록을 불러오지 못했습니다.';
      setPartyPoolError(msg);
      setPartyPoolRows([]);
    } finally {
      setPartyPoolLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (activeTab !== 'party' || !group) return;
    void loadPartyBuilderPool();
  }, [activeTab, group, loadPartyBuilderPool]);

  useEffect(() => {
    void loadGroupDetail(true);
  }, [groupId]);

  useEffect(() => {
    async function loadMe() {
      try {
        const me = await getMe();
        setMeUserId(typeof me.id === 'number' ? me.id : null);
      } catch {
        setMeUserId(null);
      }
    }
    void loadMe();
  }, []);

  const totalCharacters = useMemo(
    () => (group ? getTotalCharacterCount(group) : 0),
    [group]
  );

  const assignCharacterToRaidPartySlot = useCallback(
    async (
      raidPartyId: number,
      slotIndex: number,
      characterId: number,
    ): Promise<void> => {
      if (raidPartyAssignFlightRef.current.has(raidPartyId)) return;
      raidPartyAssignFlightRef.current.add(raidPartyId);
      setRaidPartyAssignBusy((prev) => ({ ...prev, [raidPartyId]: true }));
      try {
        const detailSnap = raidPartyDetails[raidPartyId];
        const listRow = raidPartyList.find((r) => r.id === raidPartyId);
        const partySize =
          detailSnap?.partySize ?? listRow?.partySize ?? 8;
        const { partyNumber, slotNumber } = globalSlotIndexToPartyAndSlot(
          slotIndex,
          partySize,
        );
        const poolRow = partyPoolRows.find(
          (r) => r.character.id === characterId,
        );
        const positionRole = normalizePartyRole(poolRow?.character.partyRole);

        const updated = await assignRaidPartySlot(raidPartyId, {
          characterId,
          partyNumber,
          slotNumber,
          positionRole,
        });
        setRaidPartyDetails((prev) => ({ ...prev, [raidPartyId]: updated }));
        setRaidPartyList((list) =>
          list.map((row) =>
            row.id === raidPartyId
              ? { ...row, placedMemberCount: updated.members.length }
              : row,
          ),
        );
        setToast({ kind: 'ok', text: '파티 슬롯에 배치했습니다.' });
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : '슬롯 배치에 실패했습니다.';
        setToast({ kind: 'err', text: msg });
      } finally {
        raidPartyAssignFlightRef.current.delete(raidPartyId);
        setRaidPartyAssignBusy((prev) => ({ ...prev, [raidPartyId]: false }));
      }
    },
    [partyPoolRows, raidPartyDetails, raidPartyList],
  );

  const moveRaidPartyMemberToSlot = useCallback(
    async (
      raidPartyId: number,
      memberId: number,
      targetSlotIndex: number,
    ): Promise<void> => {
      if (raidPartyAssignFlightRef.current.has(raidPartyId)) return;
      raidPartyAssignFlightRef.current.add(raidPartyId);
      setRaidPartyAssignBusy((prev) => ({ ...prev, [raidPartyId]: true }));
      try {
        const detailSnap = raidPartyDetails[raidPartyId];
        if (!detailSnap) {
          setToast({ kind: 'err', text: '파티 정보를 불러올 수 없습니다.' });
          return;
        }
        const assignment = detailSnap.members.find(
          (m) => m.memberId === memberId,
        );
        if (!assignment?.memberId) {
          setToast({
            kind: 'err',
            text: '배치 정보가 없어 위치를 바꿀 수 없습니다. 새로고침 후 다시 시도해 주세요.',
          });
          return;
        }
        if (assignment.slotIndex === targetSlotIndex) return;
        const partySize =
          detailSnap.partySize ??
          raidPartyList.find((r) => r.id === raidPartyId)?.partySize ??
          8;
        const { partyNumber, slotNumber } = globalSlotIndexToPartyAndSlot(
          targetSlotIndex,
          partySize,
        );
        const positionRole = normalizePartyRole(assignment.character.partyRole);
        const updated = await patchRaidPartyMemberPosition(
          raidPartyId,
          memberId,
          { partyNumber, slotNumber, positionRole },
        );
        setRaidPartyDetails((prev) => ({ ...prev, [raidPartyId]: updated }));
        setRaidPartyList((list) =>
          list.map((row) =>
            row.id === raidPartyId
              ? { ...row, placedMemberCount: updated.members.length }
              : row,
          ),
        );
        setToast({ kind: 'ok', text: '슬롯 위치를 변경했습니다.' });
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : '슬롯 이동에 실패했습니다.';
        setToast({ kind: 'err', text: msg });
      } finally {
        raidPartyAssignFlightRef.current.delete(raidPartyId);
        setRaidPartyAssignBusy((prev) => ({ ...prev, [raidPartyId]: false }));
      }
    },
    [raidPartyDetails, raidPartyList],
  );

  const removeRaidPartyMemberFromSlot = useCallback(
    async (raidPartyId: number, memberId: number): Promise<void> => {
      if (raidPartyAssignFlightRef.current.has(raidPartyId)) return;
      raidPartyAssignFlightRef.current.add(raidPartyId);
      setRaidPartyAssignBusy((prev) => ({ ...prev, [raidPartyId]: true }));
      try {
        const updated = await removeRaidPartyMember(raidPartyId, memberId);
        setRaidPartyDetails((prev) => ({ ...prev, [raidPartyId]: updated }));
        setRaidPartyList((list) =>
          list.map((row) =>
            row.id === raidPartyId
              ? { ...row, placedMemberCount: updated.members.length }
              : row,
          ),
        );
        setToast({ kind: 'ok', text: '파티에서 제거했습니다.' });
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : '파티에서 제거하지 못했습니다.';
        setToast({ kind: 'err', text: msg });
      } finally {
        raidPartyAssignFlightRef.current.delete(raidPartyId);
        setRaidPartyAssignBusy((prev) => ({ ...prev, [raidPartyId]: false }));
      }
    },
    [],
  );

  const partyPoolCanonicalIds = useMemo(
    () => partyPoolRows.map((x) => x.character.id),
    [partyPoolRows],
  );

  const partyPoolIdsFingerprint = useMemo(
    () => [...partyPoolCanonicalIds].sort((a, b) => a - b).join(','),
    [partyPoolCanonicalIds],
  );

  const partyPoolCanonicalIdsRef = useRef(partyPoolCanonicalIds);
  partyPoolCanonicalIdsRef.current = partyPoolCanonicalIds;

  useLayoutEffect(() => {
    setPartyPoolOrderIds((prev) =>
      mergePartyPoolOrderIds(prev, partyPoolCanonicalIdsRef.current),
    );
  }, [partyPoolIdsFingerprint]);

  const partyTabDndSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const partyDndActiveRow = useMemo(() => {
    if (!partyDndActiveId) return null;
    const cid = parsePoolCharDndId(partyDndActiveId);
    if (cid == null) return null;
    return partyPoolRows.find((r) => r.character.id === cid) ?? null;
  }, [partyDndActiveId, partyPoolRows]);

  const partyDndActiveSlotDrag = useMemo(() => {
    if (!partyDndActiveId) return null;
    const parsed = parseRaidMemberDndId(partyDndActiveId);
    if (!parsed) return null;
    const detail = raidPartyDetails[parsed.raidPartyId];
    const row = detail?.members.find((m) => m.memberId === parsed.memberId);
    if (!row) return null;
    const ownerLabel = row.character.ownerDisplayName?.trim()
      ? row.character.ownerDisplayName.trim()
      : '별명 없음';
    return {
      ownerLabel,
      character: row.character,
    };
  }, [partyDndActiveId, raidPartyDetails]);

  const handlePartyTabDragStart = useCallback((e: DragStartEvent) => {
    setPartyDndActiveId(String(e.active.id));
  }, []);

  const handlePartyTabDragEnd = useCallback(
    (e: DragEndEvent) => {
      setPartyDndActiveId(null);
      const { active, over } = e;
      if (!over) return;

      const fromMember = parseRaidMemberDndId(active.id);
      const toSlot = parseRaidSlotDndId(over.id);
      if (fromMember != null && toSlot != null) {
        if (fromMember.raidPartyId !== toSlot.raidPartyId) return;
        void moveRaidPartyMemberToSlot(
          fromMember.raidPartyId,
          fromMember.memberId,
          toSlot.slotIndex,
        );
        return;
      }

      const fromPool = parsePoolCharDndId(active.id);
      if (fromPool != null && toSlot) {
        void assignCharacterToRaidPartySlot(
          toSlot.raidPartyId,
          toSlot.slotIndex,
          fromPool,
        );
        return;
      }

      const overPool = parsePoolCharDndId(over.id);
      if (fromPool != null && overPool != null) {
        const oldIndex = partyPoolOrderIds.indexOf(fromPool);
        const newIndex = partyPoolOrderIds.indexOf(overPool);
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
        setPartyPoolOrderIds(
          arrayMove([...partyPoolOrderIds], oldIndex, newIndex),
        );
      }
    },
    [
      assignCharacterToRaidPartySlot,
      moveRaidPartyMemberToSlot,
      partyPoolOrderIds,
    ],
  );

  const handlePartyTabDragCancel = useCallback(() => {
    setPartyDndActiveId(null);
  }, []);

  const isOwner = useMemo(() => {
    if (!group) return false;
    if (typeof meUserId === 'number' && typeof group.ownerUserId === 'number') {
      return meUserId === group.ownerUserId;
    }
    return group.members.some(
      (m) =>
        m.role === 'OWNER' &&
        (typeof meUserId === 'number' ? m.userId === meUserId : true)
    );
  }, [group, meUserId]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (activeTab !== 'party') setCreateRaidPartyModalOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'party' || !group) return;
    void loadRaidPartyList();
  }, [activeTab, group, loadRaidPartyList]);

  useEffect(() => {
    if (activeTab !== 'party') {
      setRaidPartyDetails({});
      setRaidPartyDetailErrors({});
      setRaidPartyDetailsLoading(false);
      return;
    }
    if (raidPartyList.length === 0) {
      setRaidPartyDetails({});
      setRaidPartyDetailErrors({});
      setRaidPartyDetailsLoading(false);
      return;
    }
    let cancelled = false;
    setRaidPartyDetailsLoading(true);
    setRaidPartyDetailErrors({});
    void Promise.allSettled(
      raidPartyList.map((p) => getRaidPartyById(p.id)),
    ).then((results) => {
      if (cancelled) return;
      const next: Record<number, RaidPartyDetail> = {};
      const errs: Record<number, string> = {};
      raidPartyList.forEach((p, i) => {
        const r = results[i];
        if (r.status === 'fulfilled') {
          next[p.id] = r.value;
        } else {
          const reason = r.reason;
          errs[p.id] =
            reason instanceof ApiError
              ? reason.message
              : reason instanceof Error
                ? reason.message
                : '파티 정보를 불러오지 못했습니다.';
        }
      });
      setRaidPartyDetails(next);
      setRaidPartyDetailErrors(errs);
      setRaidPartyDetailsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [activeTab, raidPartyList]);

  useEffect(() => {
    if (activeTab !== 'party') {
      setFocusedRaidPartyId(null);
      return;
    }
    if (raidPartyList.length === 0) {
      setFocusedRaidPartyId(null);
      return;
    }
    setFocusedRaidPartyId((prev) =>
      prev != null && raidPartyList.some((r) => r.id === prev)
        ? prev
        : raidPartyList[0]!.id,
    );
  }, [activeTab, raidPartyList]);

  async function loadSentInvites() {
    setSentLoading(true);
    setSentError(null);
    try {
      const rows = await getSentPartyGroupInvites();
      setSentInvites(rows);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '보낸 초대 현황을 불러오지 못했습니다.';
      setSentError(msg);
      setSentInvites([]);
    } finally {
      setSentLoading(false);
    }
  }

  async function onInviteSubmit() {
    if (!group) return;
    const nickname = inviteNickname.trim();
    if (!nickname) {
      setInviteError('닉네임을 입력해 주세요.');
      return;
    }

    setInviteBusy(true);
    setInviteError(null);
    try {
      await createPartyGroupInvite(group.id, {
        nickname,
        message: inviteMessage.trim(),
      });
      setInviteNickname('');
      setInviteMessage('');
      setToast({ kind: 'ok', text: '초대 전송 완료' });
      if (inviteModalTab === 'sent') {
        await loadSentInvites();
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '초대 전송에 실패했습니다.';
      setInviteError(msg);
      setToast({ kind: 'err', text: msg });
    } finally {
      setInviteBusy(false);
    }
  }

  async function onCancelInvite(inviteId: number) {
    setCancelBusyId(inviteId);
    try {
      await cancelPartyGroupInvite(inviteId);
      await loadSentInvites();
      setToast({ kind: 'ok', text: '초대를 취소했습니다.' });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '초대 취소에 실패했습니다.';
      setToast({ kind: 'err', text: msg });
    } finally {
      setCancelBusyId(null);
    }
  }

  async function onLeaveGroup() {
    if (!group) return;
    setGroupActionBusy('leave');
    try {
      await leavePartyGroup(group.id);
      setToast({ kind: 'ok', text: '공격대에서 탈퇴했습니다.' });
      router.replace('/party');
    } catch (err) {
      let msg = '공격대 탈퇴에 실패했습니다.';
      if (isOwner) {
        msg = '그룹장을 넘기거나 공격대를 삭제해주세요';
      } else if (err instanceof ApiError) {
        msg = err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setToast({ kind: 'err', text: msg });
    } finally {
      setGroupActionBusy(null);
    }
  }

  async function onDeleteGroup() {
    if (!group) return;
    setGroupActionBusy('delete');
    try {
      await deletePartyGroup(group.id);
      setToast({ kind: 'ok', text: '공격대를 삭제했습니다.' });
      router.replace('/party');
    } catch (err) {
      let msg = '공격대 삭제에 실패했습니다.';
      if (err instanceof ApiError) msg = err.message;
      else if (err instanceof Error) msg = err.message;
      setToast({ kind: 'err', text: msg });
    } finally {
      setGroupActionBusy(null);
    }
  }

  async function openPublicCharModal() {
    if (!group) return;
    setPublicCharModalOpen(true);
    setCollapsedPublicCharServers(new Set());
    setPublicCharLoading(true);
    setPublicCharError(null);
    try {
      const rows = await getPartyGroupMyCharacters(group.id);
      setPublicCharRows(rows);
      setPublicCharSelected(
        new Set(rows.filter((r) => r.selected).map((r) => r.characterId))
      );
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '캐릭터 목록을 불러오지 못했습니다.';
      setPublicCharError(msg);
      setPublicCharRows([]);
      setPublicCharSelected(new Set());
    } finally {
      setPublicCharLoading(false);
    }
  }

  function togglePublicCharacter(characterId: number) {
    setPublicCharSelected((prev) => {
      const next = new Set(prev);
      if (next.has(characterId)) next.delete(characterId);
      else next.add(characterId);
      return next;
    });
  }

  function togglePublicCharServerCollapse(serverName: string) {
    setCollapsedPublicCharServers((prev) => {
      const next = new Set(prev);
      if (next.has(serverName)) next.delete(serverName);
      else next.add(serverName);
      return next;
    });
  }

  function togglePublicCharServerSelectAll(chars: PartyGroupMyCharacterItem[]) {
    const ids = chars.map((c) => c.characterId);
    setPublicCharSelected((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  async function savePublicCharacters() {
    if (!group) return;
    const ids = publicCharRows
      .filter((r) => publicCharSelected.has(r.characterId))
      .map((r) => r.characterId);
    setPublicCharSaveBusy(true);
    setPublicCharError(null);
    try {
      await putPartyGroupMyCharacters(group.id, ids);
      await loadGroupDetail(false);
      void loadPartyBuilderPool();
      setToast({ kind: 'ok', text: '공개 캐릭터 설정을 저장했습니다.' });
      setPublicCharModalOpen(false);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '저장에 실패했습니다.';
      setPublicCharError(msg);
      setToast({ kind: 'err', text: msg });
    } finally {
      setPublicCharSaveBusy(false);
    }
  }

  async function onSaveNickname(memberId: number) {
    if (!group) return;
    const member = group.members.find((mm) => mm.id === memberId);
    const draft = (nicknameDrafts[memberId] ?? '').trim();
    const current = member?.nickname?.trim() ?? '';
    const nickname = draft || current;
    if (!nickname) {
      setToast({ kind: 'err', text: '별명을 입력해 주세요.' });
      return;
    }
    setNicknameBusyMemberId(memberId);
    try {
      await updatePartyGroupMemberNickname(group.id, memberId, nickname);
      await loadGroupDetail(false);
      setToast({ kind: 'ok', text: '별명을 수정했습니다.' });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '별명 수정에 실패했습니다.';
      setToast({ kind: 'err', text: msg });
    } finally {
      setNicknameBusyMemberId(null);
    }
  }

  if (busy) {
    return (
      <div className="rounded-2xl border border-base-300 bg-base-300 p-6 text-base-content shadow-sm">
        <p className="text-sm text-base-content/60">불러오는 중…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-900/40 bg-rose-950/20 p-6 text-rose-100 shadow-sm">
        <h2 className="text-lg font-semibold">
          공격대 정보를 불러오지 못했습니다.
        </h2>
        <p className="mt-2 text-sm text-error/80/80">{error}</p>
        <button
          type="button"
          className="btn btn-sm mt-4"
          onClick={() => router.push('/party')}
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="rounded-2xl border border-base-300 bg-base-300 p-6 text-base-content shadow-sm">
        <h2 className="text-lg font-semibold">데이터가 없습니다.</h2>
        <p className="mt-2 text-sm text-base-content/60">
          요청한 공격대가 없거나 접근 권한이 없습니다.
        </p>
        <button
          type="button"
          className="btn btn-sm mt-4"
          onClick={() => router.push('/party')}
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col gap-6">
      <div className="navbar rounded-2xl border border-base-300 bg-base-300 px-4 text-base-content shadow-sm">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm text-base-content/80"
              onClick={() => router.push('/party')}
            >
              ← 뒤로가기
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'status' ? 'btn-primary text-primary-content' : 'btn-ghost text-base-content/80'}`}
              onClick={() => setActiveTab('status')}
            >
              공대원 현황
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'party' ? 'btn-primary text-primary-content' : 'btn-ghost text-base-content/80'}`}
              onClick={() => setActiveTab('party')}
            >
              파티
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'settings' ? 'btn-primary text-primary-content' : 'btn-ghost text-base-content/80'}`}
              onClick={() => setActiveTab('settings')}
            >
              설정
            </button>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline border-base-300 text-base-content"
            onClick={() => {
              setInviteModalTab('create');
              setInviteOpen(true);
            }}
          >
            멤버 초대
          </button>
        </div>
      </div>

      {activeTab === 'status' ? (
        <div className="rounded-2xl border border-base-300 bg-base-300 p-5 shadow-sm">
          <div className="border-b border-base-300 pb-3">
            <h2 className="text-lg font-bold text-base-content">
              {group.name}
            </h2>
            <p className="mt-1 text-sm text-base-content/60">
              {group.description ?? '설명 없음'}
            </p>
            <p className="mt-2 text-xs text-base-content/60">
              멤버 {group.members.length}명 · 캐릭터 {totalCharacters}명
            </p>
          </div>

          {group.members.length === 0 ? (
            <p className="mt-6 text-center text-sm text-base-content/60">
              공대원이 없습니다.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {group.members.map((m) => (
                <PartyMemberCard key={m.id} member={m} />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {activeTab === 'party' ? (
        <div className="rounded-2xl border border-base-300 bg-base-300 p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 border-b border-base-300 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-base-content">파티</h2>
              <p className="mt-1 text-sm text-base-content/60">
                공대 캐릭터는 드래그해 순서를 바꾸거나 파티 슬롯에 놓아 배치할 수
                있습니다. 슬롯 안 카드는 다른 슬롯으로 옮기거나(덮어쓰면 위치
                교환), 휴지통으로 파티에서 뺄 수 있습니다. 상단 초록 헤더 영역을
                눌러 파티를 선택한 뒤{' '}
                <strong className="text-base-content/75">파티 삭제</strong>
                로 해당 레이드 파티 전체를 지울 수 있습니다. 공개 캐릭터만 목록에
                나타납니다.
              </p>
            </div>
            <CreateRaidPartyButton
              onClick={() => setCreateRaidPartyModalOpen(true)}
            />
          </div>

          <DndContext
            sensors={partyTabDndSensors}
            collisionDetection={partyTabCollisionDetection}
            onDragStart={handlePartyTabDragStart}
            onDragEnd={handlePartyTabDragEnd}
            onDragCancel={handlePartyTabDragCancel}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
              <section className="w-full min-w-0 shrink-0 lg:max-w-[24rem] xl:max-w-[26rem]">
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-base-content/50">
                  공대 캐릭터
                </h3>
                {partyPoolError ? (
                  <p className="rounded-xl border border-rose-900/40 bg-rose-950/20 px-3 py-6 text-center text-xs text-rose-100">
                    {partyPoolError}
                  </p>
                ) : partyPoolLoading ? (
                  <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-base-300 bg-base-200/30">
                    <span className="flex items-center gap-2 text-xs text-base-content/60">
                      <span className="loading loading-spinner loading-sm" />
                      캐릭터 목록 불러오는 중…
                    </span>
                  </div>
                ) : partyPoolRows.length === 0 ? (
                  <p className="rounded-xl border border-base-300 bg-base-200/40 px-3 py-6 text-center text-xs text-base-content/60">
                    공개된 캐릭터가 없습니다. 설정 탭에서 공개 캐릭터를 등록해
                    주세요.
                  </p>
                ) : (
                  <SortableContext
                    items={partyPoolOrderIds.map(poolCharDndId)}
                    strategy={rectSortingStrategy}
                  >
                    <PartyPoolSortableGrid
                      rows={partyPoolRows}
                      orderIds={partyPoolOrderIds}
                    />
                  </SortableContext>
                )}
              </section>

              <section className="min-w-0 flex-1">
              {raidPartyListError ? (
                <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 px-4 py-6 text-sm text-rose-100">
                  {raidPartyListError}
                </div>
              ) : raidPartyListLoading ? (
                <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-base-300 bg-base-200/30">
                  <span className="flex items-center gap-2 text-sm text-base-content/60">
                    <span className="loading loading-spinner loading-md" />
                    파티 목록 불러오는 중…
                  </span>
                </div>
              ) : raidPartyList.length === 0 ? (
                <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-base-300 bg-base-200/30 px-4 py-10 text-center">
                  <p className="text-sm text-base-content/60">
                    생성된 파티가 없습니다.
                  </p>
                  <p className="mt-1 text-xs text-base-content/45">
                    상단{' '}
                    <strong className="text-base-content/70">파티 생성</strong>
                    으로 레이드를 선택해 주세요.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {raidPartyList.map((p) => {
                    const detail = raidPartyDetails[p.id];
                    const rowErr = raidPartyDetailErrors[p.id];
                    return (
                      <div
                        key={p.id}
                        className="w-full min-w-[22rem] max-w-xl flex-[1_1_360px]"
                      >
                        {raidPartyDetailsLoading && !detail && !rowErr ? (
                          <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-base-300 bg-base-200/30">
                            <span className="flex items-center gap-2 text-sm text-base-content/60">
                              <span className="loading loading-spinner loading-md" />
                              불러오는 중…
                            </span>
                          </div>
                        ) : rowErr ? (
                          <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 px-4 py-6 text-sm text-rose-100">
                            {rowErr}
                          </div>
                        ) : detail ? (
                          <RaidPartyDetailView
                            detail={detail}
                            isPartySelected={focusedRaidPartyId === p.id}
                            onSelectParty={() => setFocusedRaidPartyId(p.id)}
                            onAssignToSlot={(slotIndex, characterId) =>
                              void assignCharacterToRaidPartySlot(
                                p.id,
                                slotIndex,
                                characterId,
                              )
                            }
                            onMoveMemberToSlot={(memberId, targetSlotIndex) =>
                              void moveRaidPartyMemberToSlot(
                                p.id,
                                memberId,
                                targetSlotIndex,
                              )
                            }
                            onRemoveMember={(memberId) =>
                              void removeRaidPartyMemberFromSlot(
                                p.id,
                                memberId,
                              )
                            }
                            onDeleteRaidParty={() =>
                              setRaidPartyDeleteDraft({
                                id: p.id,
                                titleLabel:
                                  detail.title?.trim() ||
                                  detail.raidInfo?.raidName ||
                                  p.raidName ||
                                  `파티 #${p.id}`,
                              })
                            }
                            deletePartyDisabled={
                              raidPartyDeleteBusy ||
                              (raidPartyAssignBusy[p.id] ?? false)
                            }
                            assignmentBusy={
                              raidPartyAssignBusy[p.id] ?? false
                            }
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
              </section>
            </div>
            <DragOverlay dropAnimation={null}>
              {partyDndActiveSlotDrag ? (
                <div className="cursor-grabbing rounded-lg shadow-2xl ring-2 ring-primary/35 scale-[1.03] rotate-[0.5deg]">
                  <PartyPoolCharacterCard
                    memberNickname={partyDndActiveSlotDrag.ownerLabel}
                    character={partyDndActiveSlotDrag.character}
                    draggable={false}
                    variant="slot"
                  />
                </div>
              ) : partyDndActiveRow ? (
                <div className="cursor-grabbing rounded-lg shadow-2xl ring-2 ring-primary/35 scale-[1.03] rotate-[0.5deg]">
                  <PartyPoolCharacterCard
                    memberNickname={partyDndActiveRow.ownerDisplayName}
                    character={partyDndActiveRow.character}
                    draggable={false}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      ) : null}

      {activeTab === 'settings' ? (
        <div className="rounded-2xl border border-base-300 bg-base-300 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-base-content">
            공격대 설정
          </h2>
          <p className="mt-1 text-sm text-base-content/60">
            공개 캐릭터, 그룹 내 별명, 공격대 탈퇴/삭제를 설정할 수 있습니다.
          </p>
          <div className="mt-5 rounded-xl border border-base-300 bg-base-200/40 p-4">
            <h3 className="text-sm font-semibold text-base-content">
              공격대 캐릭터 설정
            </h3>
            <p className="mt-1 text-xs text-base-content/60">
              이 공격대에 보여 줄 원정대 캐릭터를 선택합니다.
            </p>
            <button
              type="button"
              className="btn btn-sm mt-3 border-base-300 bg-base-300 text-base-content hover:bg-base-300"
              onClick={() => void openPublicCharModal()}
            >
              공개 캐릭터 설정
            </button>
          </div>
          <div className="mt-5 max-w-md rounded-xl border border-base-300 bg-base-200/40 p-4">
            <h3 className="text-sm font-semibold text-base-content">
              그룹 내 별명 수정
            </h3>
            <p className="mt-1 text-xs text-base-content/60">
              수정 후 저장하면 최신 공대원 정보로 다시 조회됩니다.
            </p>
            <div className="mt-3 space-y-2">
              {group.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 rounded-lg border border-base-300 bg-base-300/60 px-2 py-2"
                >
                  <input
                    type="text"
                    value={nicknameDrafts[m.id] ?? ''}
                    onChange={(e) =>
                      setNicknameDrafts((prev) => ({
                        ...prev,
                        [m.id]: e.target.value,
                      }))
                    }
                    className="input input-bordered min-w-0 flex-1 border-base-300 bg-base-300 text-sm text-base-content placeholder:text-base-content/70"
                    placeholder={m.nickname?.trim() ? m.nickname : '별명 없음'}
                    disabled={nicknameBusyMemberId === m.id}
                  />
                  <button
                    type="button"
                    className="btn btn-sm shrink-0 border-primary/40 bg-indigo-950/40 text-indigo-200 hover:bg-indigo-900/60"
                    disabled={nicknameBusyMemberId !== null}
                    onClick={() => void onSaveNickname(m.id)}
                  >
                    {nicknameBusyMemberId === m.id ? '저장 중…' : '저장'}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-base-300 bg-base-200/40 p-4">
            {isOwner ? (
              <div className="space-y-2">
                <p className="text-xs text-base-content/60">
                  공대장은 공격대를 탈퇴할 수 없으며, 필요한 경우 공격대를
                  삭제해야 합니다.
                </p>
                <button
                  type="button"
                  className="btn btn-sm border-rose-500/50 bg-rose-950/40 text-error/80 hover:bg-rose-900/60"
                  disabled={groupActionBusy !== null}
                  onClick={() => setConfirmAction('delete')}
                >
                  {groupActionBusy === 'delete' ? '삭제 중…' : '공격대 삭제'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-base-content/60">
                  탈퇴하면 현재 공격대에서 즉시 제외됩니다.
                </p>
                <button
                  type="button"
                  className="btn btn-sm border-amber-500/50 bg-amber-950/40 text-amber-200 hover:bg-amber-900/60"
                  disabled={groupActionBusy !== null}
                  onClick={() => setConfirmAction('leave')}
                >
                  {groupActionBusy === 'leave' ? '탈퇴 처리 중…' : '탈퇴하기'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {raidPartyDeleteDraft ? (
        <div
          className="fixed inset-0 z-10000 grid place-items-center bg-base-300/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="raid-party-delete-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-base-300 bg-base-200 p-5 shadow-2xl">
            <h3
              id="raid-party-delete-title"
              className="text-base font-semibold text-base-content"
            >
              레이드 파티 삭제
            </h3>
            <p className="mt-2 text-sm text-base-content/80">
              <span className="font-medium text-base-content">
                {raidPartyDeleteDraft.titleLabel}
              </span>
              을(를) 삭제할까요? 파티에 배치된 캐릭터도 모두 빠지며, 되돌릴 수
              없습니다.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm text-base-content/80"
                disabled={raidPartyDeleteBusy}
                onClick={() => setRaidPartyDeleteDraft(null)}
              >
                취소
              </button>
              <button
                type="button"
                className="btn btn-sm border-rose-500/50 bg-rose-950/40 text-error/80 hover:bg-rose-900/60"
                disabled={raidPartyDeleteBusy}
                onClick={() => {
                  const draft = raidPartyDeleteDraft;
                  if (!draft || raidPartyDeleteBusy) return;
                  void (async () => {
                    setRaidPartyDeleteBusy(true);
                    try {
                      const result = await deleteRaidParty(draft.id);
                      raidPartyAssignFlightRef.current.delete(draft.id);
                      setRaidPartyAssignBusy((prev) => {
                        const next = { ...prev };
                        delete next[draft.id];
                        return next;
                      });
                      setRaidPartyDetails((prev) => {
                        const next = { ...prev };
                        delete next[draft.id];
                        return next;
                      });
                      setRaidPartyDetailErrors((prev) => {
                        const next = { ...prev };
                        delete next[draft.id];
                        return next;
                      });
                      setRaidPartyDeleteDraft(null);
                      await loadRaidPartyList();
                      const msg =
                        result.message?.trim() ||
                        '공격대 파티가 삭제되었습니다.';
                      setToast({ kind: 'ok', text: msg });
                    } catch (err) {
                      const msg =
                        err instanceof ApiError
                          ? err.message
                          : err instanceof Error
                            ? err.message
                            : '파티를 삭제하지 못했습니다.';
                      setToast({ kind: 'err', text: msg });
                    } finally {
                      setRaidPartyDeleteBusy(false);
                    }
                  })();
                }}
              >
                {raidPartyDeleteBusy ? '삭제 중…' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmAction ? (
        <div
          className="fixed inset-0 z-10000 grid place-items-center bg-base-300/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-base-300 bg-base-200 p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-base-content">
              {confirmAction === 'leave'
                ? '공격대 탈퇴 확인'
                : '공격대 삭제 확인'}
            </h3>
            <p className="mt-2 text-sm text-base-content/80">
              {confirmAction === 'leave'
                ? '정말 이 공격대에서 탈퇴하시겠습니까?'
                : '정말 이 공격대를 삭제하시겠습니까? 삭제 후 되돌릴 수 없습니다.'}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm text-base-content/80"
                disabled={groupActionBusy !== null}
                onClick={() => setConfirmAction(null)}
              >
                취소
              </button>
              <button
                type="button"
                className={`btn btn-sm ${
                  confirmAction === 'leave'
                    ? 'border-amber-500/50 bg-amber-950/40 text-amber-200 hover:bg-amber-900/60'
                    : 'border-rose-500/50 bg-rose-950/40 text-error/80 hover:bg-rose-900/60'
                }`}
                disabled={groupActionBusy !== null}
                onClick={() => {
                  const action = confirmAction;
                  setConfirmAction(null);
                  if (action === 'leave') {
                    void onLeaveGroup();
                    return;
                  }
                  void onDeleteGroup();
                }}
              >
                {confirmAction === 'leave' ? '탈퇴하기' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {publicCharModalOpen ? (
        <div className="fixed inset-0 z-10000 flex min-h-dvh items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-base-300/70"
            aria-label="닫기"
            onClick={() => {
              setPublicCharModalOpen(false);
              setPublicCharError(null);
            }}
          />
          <div
            className="relative z-10 flex max-h-[min(90dvh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="public-char-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-base-300 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 pr-1">
                  <h3
                    id="public-char-modal-title"
                    className="text-base font-semibold text-base-content"
                  >
                    공격대에 공개할 캐릭터
                  </h3>
                  <p className="mt-1 text-xs text-base-content/60">
                    체크한 캐릭터만 이 공격대에 원정대 정보로 공개됩니다.
                  </p>
                </div>
                <button
                  type="button"
                  className="flex h-9 min-h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-lg font-semibold leading-none text-base-content/60 hover:text-base-content disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => {
                    setPublicCharModalOpen(false);
                    setPublicCharError(null);
                  }}
                  disabled={publicCharSaveBusy}
                  aria-label="닫기"
                >
                  <span aria-hidden>×</span>
                </button>
              </div>
              {publicCharError &&
              publicCharRows.length === 0 &&
              !publicCharLoading ? (
                <p className="mt-3 rounded-lg bg-rose-950/40 px-3 py-2 text-xs text-error/80">
                  {publicCharError}
                </p>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-base-300/40 px-5 py-4 [scrollbar-color:rgb(71_85_105)_rgb(15_23_42)] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-base-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-600 hover:[&::-webkit-scrollbar-thumb]:bg-slate-500">
              {publicCharLoading ? (
                <p className="py-10 text-center text-sm text-base-content/60">
                  불러오는 중…
                </p>
              ) : publicCharRows.length === 0 && !publicCharError ? (
                <p className="py-8 text-center text-sm text-base-content/60">
                  등록된 원정대 캐릭터가 없습니다.
                </p>
              ) : null}

              {!publicCharLoading && publicCharRows.length > 0
                ? publicCharServerEntries.map(([serverName, chars]) => {
                    const collapsed =
                      collapsedPublicCharServers.has(serverName);
                    const ids = chars.map((c) => c.characterId);
                    const allInServerSelected =
                      ids.length > 0 &&
                      ids.every((id) => publicCharSelected.has(id));
                    const someInServerSelected = ids.some((id) =>
                      publicCharSelected.has(id)
                    );
                    const serverCheckboxIndeterminate =
                      someInServerSelected && !allInServerSelected;

                    return (
                      <section key={serverName} className="mb-6 last:mb-0">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs h-8 min-h-8 w-8 shrink-0 px-0 text-base font-bold text-base-content/80"
                              aria-expanded={!collapsed}
                              aria-label={
                                collapsed
                                  ? `${serverName} 목록 펼치기`
                                  : `${serverName} 목록 접기`
                              }
                              onClick={() =>
                                togglePublicCharServerCollapse(serverName)
                              }
                            >
                              <span className="leading-none" aria-hidden>
                                {collapsed ? '▶' : '▼'}
                              </span>
                            </button>
                            <h4 className="text-sm font-semibold text-base-content">
                              {serverName}
                            </h4>
                            <span className="text-xs text-base-content/60">
                              ({chars.length})
                            </span>
                          </div>
                          {chars.length > 0 ? (
                            <PublicCharServerSelectAllCheckbox
                              serverName={serverName}
                              allSelected={allInServerSelected}
                              indeterminate={serverCheckboxIndeterminate}
                              onToggle={() =>
                                togglePublicCharServerSelectAll(chars)
                              }
                            />
                          ) : null}
                        </div>

                        {!collapsed ? (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {chars.map((row) => {
                              const on = publicCharSelected.has(
                                row.characterId
                              );
                              return (
                                <label
                                  key={row.characterId}
                                  className={`flex cursor-pointer items-stretch gap-3 rounded-xl border p-3 text-left shadow-sm ${
                                    on
                                      ? 'border-primary/50 bg-indigo-950/25 hover:border-indigo-400/60 hover:bg-indigo-950/35'
                                      : 'border-base-300 bg-base-200/60 hover:border-base-300 hover:bg-base-200'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm mt-0.5 h-5 w-5 shrink-0 border-base-300 bg-base-300"
                                    checked={on}
                                    onChange={() =>
                                      togglePublicCharacter(row.characterId)
                                    }
                                    disabled={publicCharSaveBusy}
                                  />
                                  <CharacterClassMark
                                    characterClassName={
                                      row.characterClassName ?? ''
                                    }
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-base-content">
                                      {row.characterName}
                                    </p>
                                    <p className="mt-1 text-xs text-base-content/60">
                                      Level{' '}
                                      <span className="font-semibold tabular-nums text-base-content">
                                        {row.itemAvgLevel?.trim() || '—'}
                                      </span>
                                      <span className="mx-1.5 text-base-content/70">
                                        ·
                                      </span>
                                      <span className="text-base-content/60">
                                        전투력
                                      </span>{' '}
                                      <span className="font-semibold tabular-nums text-rose-400">
                                        {row.combatPower?.trim() || '—'}
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
                  })
                : null}
            </div>

            {publicCharError && publicCharRows.length > 0 ? (
              <p className="border-t border-base-300 px-5 py-2 text-xs text-error/80">
                {publicCharError}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 bg-base-200/90 px-5 py-3">
              <p className="text-xs text-base-content/60">
                선택 {publicCharSelected.size} / {publicCharRows.length}명 ·
                체크한 캐릭터만 저장됩니다.
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-base-content/80"
                  disabled={publicCharSaveBusy}
                  onClick={() => {
                    setPublicCharModalOpen(false);
                    setPublicCharError(null);
                  }}
                >
                  닫기
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm text-primary-content"
                  disabled={
                    publicCharSaveBusy ||
                    publicCharLoading ||
                    publicCharRows.length === 0
                  }
                  onClick={() => void savePublicCharacters()}
                >
                  {publicCharSaveBusy ? '저장 중…' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {inviteOpen ? (
        <div className="fixed inset-0 z-10000 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-base-300/55"
            aria-label="닫기"
            onClick={() => setInviteOpen(false)}
          />
          <div
            className="relative z-10 flex w-full max-w-md flex-col rounded-2xl border border-base-300 bg-base-200 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="party-invite-modal-title"
          >
            <h3
              id="party-invite-modal-title"
              className="text-base font-semibold text-base-content"
            >
              멤버 초대
            </h3>

            <div
              role="tablist"
              className="tabs tabs-box mt-4 w-fit bg-base-300/80"
            >
              <button
                type="button"
                role="tab"
                className={`tab text-white ${inviteModalTab === 'create' ? 'tab-active text-white!' : ''}`}
                onClick={() => setInviteModalTab('create')}
              >
                초대하기
              </button>
              <button
                type="button"
                role="tab"
                className={`tab text-white ${inviteModalTab === 'sent' ? 'tab-active text-white!' : ''}`}
                onClick={() => {
                  setInviteModalTab('sent');
                  void loadSentInvites();
                }}
              >
                초대현황
              </button>
            </div>

            {inviteModalTab === 'create' ? (
              <div className="mt-4">
                <p className="text-xs text-base-content/60">
                  닉네임으로 공격대 초대를 보냅니다.
                </p>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-base-content/60">
                      닉네임
                    </label>
                    <input
                      type="text"
                      value={inviteNickname}
                      onChange={(e) => setInviteNickname(e.target.value)}
                      className="input input-bordered w-full border-base-300 bg-base-300 text-sm text-base-content"
                      placeholder="예: 브붕이"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-base-content/60">
                      메시지
                    </label>
                    <textarea
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      className="textarea textarea-bordered w-full border-base-300 bg-base-300 text-sm text-base-content"
                      rows={3}
                      placeholder="예: 같이 종막 가요!"
                    />
                  </div>
                </div>

                {inviteError ? (
                  <p className="mt-3 rounded-lg bg-rose-950/30 px-3 py-2 text-xs text-error/80">
                    {inviteError}
                  </p>
                ) : null}

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-base-content/80"
                    onClick={() => setInviteOpen(false)}
                    disabled={inviteBusy}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm text-primary-content"
                    onClick={() => void onInviteSubmit()}
                    disabled={inviteBusy}
                  >
                    {inviteBusy ? '전송 중…' : '초대 전송'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 max-h-[min(50vh,320px)] overflow-y-auto rounded-xl border border-base-300 bg-base-300/50 p-3 [scrollbar-color:rgb(71_85_105)_rgb(15_23_42)] [scrollbar-width:thin]">
                {sentLoading ? (
                  <p className="py-6 text-center text-sm text-base-content/60">
                    불러오는 중…
                  </p>
                ) : sentError ? (
                  <p className="rounded-lg bg-rose-950/30 px-3 py-2 text-xs text-error/80">
                    {sentError}
                  </p>
                ) : sentInvites.length === 0 ? (
                  <p className="py-6 text-center text-sm text-base-content/60">
                    보낸 초대가 없습니다.
                  </p>
                ) : (
                  <div className="space-y-3 pr-1">
                    {sentInvites.map((inv) => (
                      <div
                        key={inv.id}
                        className="rounded-xl border border-base-300 bg-base-200/60 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-base-content">
                              {inv.groupName}
                            </p>
                            <p className="mt-1 text-xs text-base-content/60">
                              초대받은 사람: {inv.invitedUserName}
                            </p>
                          </div>
                          <span className={inviteStatusBadgeClass(inv.status)}>
                            {inv.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-base-content/80">
                          {inv.message?.trim() ? inv.message : '메시지 없음'}
                        </p>
                        <p className="mt-1 text-xs text-base-content/60">
                          생성일:{' '}
                          {inv.createdAt
                            ? new Date(inv.createdAt).toLocaleString()
                            : '-'}
                        </p>
                        {inv.status === 'PENDING' ? (
                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline border-rose-500/50 text-rose-300 hover:bg-rose-900/30"
                              onClick={() => void onCancelInvite(inv.id)}
                              disabled={cancelBusyId === inv.id}
                            >
                              {cancelBusyId === inv.id
                                ? '취소 중…'
                                : '초대 취소'}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {group ? (
        <CreateRaidPartyModal
          open={createRaidPartyModalOpen}
          groupId={group.id}
          onClose={() => setCreateRaidPartyModalOpen(false)}
          onCreated={() => {
            setToast({ kind: 'ok', text: '파티가 생성되었습니다.' });
            void loadRaidPartyList();
          }}
        />
      ) : null}

      {toast ? (
        <div
          role="status"
          className={
            toast.kind === 'ok'
              ? 'fixed bottom-4 right-4 z-10000 rounded-lg border border-emerald-700/40 bg-emerald-950/80 px-4 py-2 text-sm text-emerald-100 shadow-xl'
              : 'fixed bottom-4 right-4 z-10000 rounded-lg border border-rose-700/40 bg-rose-950/80 px-4 py-2 text-sm text-rose-100 shadow-xl'
          }
        >
          {toast.text}
        </div>
      ) : null}
    </div>
  );
}
