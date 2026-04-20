'use client';

import { useRouter } from 'next/navigation';
import {
  type WheelEvent as ReactWheelEvent,
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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

import { CharacterClassMark } from '@/components/features/expedition/character-class-mark';
import { PartyCharacterFilters } from '@/components/party-builder/party-character-filters';
import { PartyMemberCard } from '@/components/party/party-member-card';
import { PartyPoolCharacterCard } from '@/components/party/party-pool-character-card';
import {
  PartyPoolSortableGrid,
  type PartyPoolRenderableSection,
} from '@/components/party/party-pool-sortable-grid';
import { CreateRaidPartyButton } from '@/components/raid-party/create-raid-party-button';
import { CreateRaidPartyModal } from '@/components/raid-party/create-raid-party-modal';
import { RaidPartyDetailView } from '@/components/raid-party/raid-party-detail-view';
import { createPartyGroupInvite } from '@/lib/api/party-group-invites';
import {
  addPartyGroupFavorite,
  getPartyBuilderCharacters,
  getPartyGroupCharacters,
  getPartyGroupFavorites,
  leavePartyGroup,
  removePartyGroupFavorite,
  deletePartyGroup,
  updatePartyGroupMemberNickname,
  getPartyGroupMyCharacters,
  putPartyGroupMyCharacters,
} from '@/lib/api/party-groups';
import { getLevelRangeFilters } from '@/lib/api/level-range-filters';
import {
  buildLevelRangeSections,
  inLevelRange,
  parseItemLevel,
  type PositionFilter,
} from '@/lib/party-builder/level-range';
import {
  assignRaidPartySlot,
  deleteRaidParty,
  getRaidPartiesByGroup,
  getRaidPartyDifficultyOptions,
  getRaidPartyById,
  patchRaidParty,
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
import type { LevelRangeFilter } from '@/types/level-range-filter';
import {
  globalSlotIndexToPartyAndSlot,
  type RaidPartyDifficultyOption,
  type RaidPartyDetail,
  type RaidPartyListItem,
} from '@/types/raid-party';
import { normalizePartyRole } from '@/types/expedition';

type Props = {
  groupId: number;
};

type GroupDetailTab = 'status' | 'party' | 'settings';
type GroupConfirmAction = 'leave' | 'delete';

function partyTabCollisionDetection(args: Parameters<typeof closestCenter>[0]) {
  const hit = pointerWithin(args);
  return hit.length > 0 ? hit : closestCenter(args);
}

function passWheelToOuterScroll(
  e: ReactWheelEvent<HTMLDivElement>,
): void {
  const el = e.currentTarget;
  const { deltaY } = e;
  if (deltaY === 0) return;
  const atTop = el.scrollTop <= 0;
  const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
  const shouldPassDown = deltaY > 0 && atBottom;
  const shouldPassUp = deltaY < 0 && atTop;
  if (!shouldPassDown && !shouldPassUp) return;
  e.preventDefault();
  window.scrollBy({ top: deltaY });
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

export function PartyGroupPageClient({ groupId }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<GroupDetailTab>('status');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteNickname, setInviteNickname] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
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
  const [raidPartyDifficultyOptions, setRaidPartyDifficultyOptions] = useState<
    Record<number, RaidPartyDifficultyOption[]>
  >({});
  const [raidPartyDifficultyLoading, setRaidPartyDifficultyLoading] = useState<
    Record<number, boolean>
  >({});
  /** 공대 캐릭터 풀 정렬 순서 — 저장 시 `@/lib/party-pool-order`의 `buildPartyPoolOrderPayload(partyPoolOrderIds)` 사용 */
  const [partyPoolOrderIds, setPartyPoolOrderIds] = useState<number[]>([]);
  const [partyPoolRows, setPartyPoolRows] = useState<PartyPoolOrderedRow[]>([]);
  const [partyPoolLoading, setPartyPoolLoading] = useState(false);
  const [partyPoolError, setPartyPoolError] = useState<string | null>(null);
  const [levelRangeFilters, setLevelRangeFilters] = useState<
    LevelRangeFilter[]
  >([]);
  const [levelRangeFiltersError, setLevelRangeFiltersError] = useState<
    string | null
  >(null);
  const [selectedPosition, setSelectedPosition] =
    useState<PositionFilter>('ALL');
  const [levelMinBound, setLevelMinBound] = useState(1640);
  const [levelMaxBound, setLevelMaxBound] = useState(1800);
  const [selectedMinLevel, setSelectedMinLevel] = useState(1640);
  const [selectedMaxLevel, setSelectedMaxLevel] = useState(1800);
  const [partyDndActiveId, setPartyDndActiveId] = useState<string | null>(null);
  const [raidPartyAssignBusy, setRaidPartyAssignBusy] = useState<
    Record<number, boolean>
  >({});
  const raidPartyAssignFlightRef = useRef<Set<number>>(new Set());
  const [focusedRaidPartyId, setFocusedRaidPartyId] = useState<number | null>(
    null
  );
  const [raidPartyDeleteDraft, setRaidPartyDeleteDraft] = useState<{
    id: number;
    titleLabel: string;
  } | null>(null);
  const [raidPartyDeleteBusy, setRaidPartyDeleteBusy] = useState(false);
  const [selectedRaidInfoFilterId, setSelectedRaidInfoFilterId] = useState<
    number | null
  >(null);
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<
    string | null
  >(null);
  const [favoriteBusyUserIds, setFavoriteBusyUserIds] = useState<Set<number>>(
    new Set()
  );

  const publicCharGrouped = useMemo(
    () => groupPartyMyCharsByServer(publicCharRows),
    [publicCharRows]
  );
  const publicCharServerEntries = useMemo(
    () => [...publicCharGrouped.entries()],
    [publicCharGrouped]
  );

  const loadGroupDetail = useCallback(
    async (showBusy = true) => {
      if (!Number.isFinite(groupId) || groupId <= 0) {
        setError('유효하지 않은 공격대 ID 입니다.');
        setGroup(null);
        return;
      }
      if (showBusy) setBusy(true);
      setError(null);
      try {
        const [raw, favoriteQuery] = await Promise.all([
          getPartyGroupCharacters(groupId),
          getPartyGroupFavorites(groupId)
            .then((ids) => ({ ok: true as const, ids }))
            .catch(() => ({ ok: false as const, ids: [] as number[] })),
        ]);
        const mapped = mapPartyGroupCharactersResponseToViewModel(raw);
        const favoriteSet = new Set(favoriteQuery.ids);
        const nextMembers = mapped.members.map((member) => {
          const isMe =
            meUserId != null
              ? member.userId === meUserId
              : Boolean(member.isMe);
          const isFavorite = isMe
            ? false
            : favoriteQuery.ok
              ? favoriteSet.has(member.userId)
              : Boolean(member.isFavorite);
          return {
            ...member,
            isMe,
            isFavorite,
          };
        });
        setGroup({
          ...mapped,
          members: nextMembers,
        });
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
    },
    [groupId, meUserId]
  );

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

  const loadLevelRangeFilters = useCallback(async () => {
    setLevelRangeFiltersError(null);
    try {
      const list = await getLevelRangeFilters();
      setLevelRangeFilters(list);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '레벨 범위 필터를 불러오지 못했습니다.';
      setLevelRangeFiltersError(msg);
      setLevelRangeFilters([]);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'party' || !group) return;
    void loadPartyBuilderPool();
  }, [activeTab, group, loadPartyBuilderPool]);

  useEffect(() => {
    if (activeTab !== 'party' || !group) return;
    void loadLevelRangeFilters();
  }, [activeTab, group, loadLevelRangeFilters]);

  useEffect(() => {
    void loadGroupDetail(true);
  }, [loadGroupDetail]);

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

  const groupNicknameByCharacterId = useMemo(() => {
    const map = new Map<number, string>();
    if (!group) return map;
    for (const member of group.members) {
      const label =
        member.nickname?.trim() || member.displayName?.trim() || '별명 없음';
      for (const ch of member.characters) {
        map.set(ch.id, label);
      }
    }
    return map;
  }, [group]);

  const applyGroupNicknameToDetail = useCallback(
    (detail: RaidPartyDetail): RaidPartyDetail => {
      return {
        ...detail,
        members: detail.members.map((m) => {
          const resolved = groupNicknameByCharacterId
            .get(m.character.id)
            ?.trim();
          if (!resolved) return m;
          if (m.character.groupNickname?.trim() === resolved) return m;
          return {
            ...m,
            character: {
              ...m.character,
              groupNickname: resolved,
            },
          };
        }),
      };
    },
    [groupNicknameByCharacterId]
  );

  const assignCharacterToRaidPartySlot = useCallback(
    async (
      raidPartyId: number,
      slotIndex: number,
      characterId: number
    ): Promise<void> => {
      if (raidPartyAssignFlightRef.current.has(raidPartyId)) return;
      raidPartyAssignFlightRef.current.add(raidPartyId);
      setRaidPartyAssignBusy((prev) => ({ ...prev, [raidPartyId]: true }));
      try {
        const detailSnap = raidPartyDetails[raidPartyId];
        const listRow = raidPartyList.find((r) => r.id === raidPartyId);
        const partySize = detailSnap?.partySize ?? listRow?.partySize ?? 8;
        const { partyNumber, slotNumber } = globalSlotIndexToPartyAndSlot(
          slotIndex,
          partySize
        );
        const poolRow = partyPoolRows.find(
          (r) => r.character.id === characterId
        );
        const positionRole = normalizePartyRole(poolRow?.character.partyRole);

        const updatedRaw = await assignRaidPartySlot(raidPartyId, {
          characterId,
          partyNumber,
          slotNumber,
          positionRole,
        });
        const updated = applyGroupNicknameToDetail(updatedRaw);
        setRaidPartyDetails((prev) => ({ ...prev, [raidPartyId]: updated }));
        setRaidPartyList((list) =>
          list.map((row) =>
            row.id === raidPartyId
              ? { ...row, placedMemberCount: updated.members.length }
              : row
          )
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
    [applyGroupNicknameToDetail, partyPoolRows, raidPartyDetails, raidPartyList]
  );

  const moveRaidPartyMemberToSlot = useCallback(
    async (
      raidPartyId: number,
      memberId: number,
      targetSlotIndex: number
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
          (m) => m.memberId === memberId
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
          partySize
        );
        const positionRole = normalizePartyRole(assignment.character.partyRole);
        const updatedRaw = await patchRaidPartyMemberPosition(
          raidPartyId,
          memberId,
          { partyNumber, slotNumber, positionRole }
        );
        const updated = applyGroupNicknameToDetail(updatedRaw);
        setRaidPartyDetails((prev) => ({ ...prev, [raidPartyId]: updated }));
        setRaidPartyList((list) =>
          list.map((row) =>
            row.id === raidPartyId
              ? { ...row, placedMemberCount: updated.members.length }
              : row
          )
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
    [applyGroupNicknameToDetail, raidPartyDetails, raidPartyList]
  );

  const removeRaidPartyMemberFromSlot = useCallback(
    async (raidPartyId: number, memberId: number): Promise<void> => {
      if (raidPartyAssignFlightRef.current.has(raidPartyId)) return;
      raidPartyAssignFlightRef.current.add(raidPartyId);
      setRaidPartyAssignBusy((prev) => ({ ...prev, [raidPartyId]: true }));
      try {
        const updatedRaw = await removeRaidPartyMember(raidPartyId, memberId);
        const updated = applyGroupNicknameToDetail(updatedRaw);
        setRaidPartyDetails((prev) => ({ ...prev, [raidPartyId]: updated }));
        setRaidPartyList((list) =>
          list.map((row) =>
            row.id === raidPartyId
              ? { ...row, placedMemberCount: updated.members.length }
              : row
          )
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
    [applyGroupNicknameToDetail]
  );

  const ensureRaidPartyDifficultyOptions = useCallback(
    async (party: RaidPartyListItem): Promise<void> => {
      if (raidPartyDifficultyOptions[party.id]) return;
      if (raidPartyDifficultyLoading[party.id]) return;
      if (!group) return;
      const raidInfoId =
        Number.isFinite(party.raidInfoId) && party.raidInfoId > 0
          ? party.raidInfoId
          : null;
      if (!raidInfoId) return;
      setRaidPartyDifficultyLoading((prev) => ({ ...prev, [party.id]: true }));
      try {
        const rows = await getRaidPartyDifficultyOptions(group.id, raidInfoId);
        setRaidPartyDifficultyOptions((prev) => ({
          ...prev,
          [party.id]: rows,
        }));
      } catch {
        setRaidPartyDifficultyOptions((prev) => ({ ...prev, [party.id]: [] }));
      } finally {
        setRaidPartyDifficultyLoading((prev) => ({
          ...prev,
          [party.id]: false,
        }));
      }
    },
    [group, raidPartyDifficultyLoading, raidPartyDifficultyOptions]
  );

  const changeRaidPartyDifficulty = useCallback(
    async (party: RaidPartyListItem, value: string | null): Promise<void> => {
      try {
        const updated = await patchRaidParty(party.id, {
          selectedDifficulty: value,
        });
        setRaidPartyList((prev) =>
          prev.map((row) =>
            row.id === party.id
              ? {
                  ...row,
                  selectedDifficulty: updated.selectedDifficulty ?? null,
                }
              : row
          )
        );
        setRaidPartyDetails((prev) => {
          const detail = prev[party.id];
          if (!detail) return prev;
          return {
            ...prev,
            [party.id]: {
              ...detail,
              selectedDifficulty: updated.selectedDifficulty ?? null,
            },
          };
        });
        setToast({ kind: 'ok', text: '난이도를 변경했습니다.' });
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : '난이도 변경에 실패했습니다.';
        setToast({ kind: 'err', text: msg });
      }
    },
    []
  );

  const partyPoolDisplayRows = useMemo(() => {
    return partyPoolRows.map((row) => {
      const label =
        groupNicknameByCharacterId.get(row.character.id)?.trim() ||
        row.ownerDisplayName?.trim() ||
        '별명 없음';
      if (label === row.ownerDisplayName) return row;
      return { ...row, ownerDisplayName: label };
    });
  }, [partyPoolRows, groupNicknameByCharacterId]);

  const partyPoolCanonicalIds = useMemo(
    () => partyPoolDisplayRows.map((x) => x.character.id),
    [partyPoolDisplayRows]
  );

  useEffect(() => {
    if (partyPoolDisplayRows.length === 0) {
      setLevelMinBound(1640);
      setLevelMaxBound(1800);
      setSelectedMinLevel(1640);
      setSelectedMaxLevel(1800);
      return;
    }
    const levels = partyPoolDisplayRows.map((r) =>
      parseItemLevel(r.character.itemAvgLevel)
    );
    const min = Math.floor(Math.min(...levels));
    const max = Math.ceil(Math.max(...levels));
    const safeMin = Number.isFinite(min) ? Math.min(min, 1640) : 1640;
    const safeMax = Number.isFinite(max) ? Math.max(max, 1800) : 1800;
    setLevelMinBound(safeMin);
    setLevelMaxBound(safeMax);
    setSelectedMinLevel(safeMin);
    setSelectedMaxLevel(safeMax);
  }, [partyPoolDisplayRows]);

  const rowById = useMemo(() => {
    const m = new Map<number, PartyPoolOrderedRow>();
    for (const row of partyPoolDisplayRows) m.set(row.character.id, row);
    return m;
  }, [partyPoolDisplayRows]);

  const orderedPartyPoolRows = useMemo(
    () =>
      partyPoolOrderIds
        .map((id) => rowById.get(id))
        .filter(Boolean) as PartyPoolOrderedRow[],
    [partyPoolOrderIds, rowById]
  );

  const filteredPartyPoolRows = useMemo(() => {
    return orderedPartyPoolRows.filter((row) => {
      if (
        selectedPosition !== 'ALL' &&
        normalizePartyRole(row.character.partyRole) !== selectedPosition
      ) {
        return false;
      }
      const level = parseItemLevel(row.character.itemAvgLevel);
      return inLevelRange(level, selectedMinLevel, selectedMaxLevel);
    });
  }, [
    orderedPartyPoolRows,
    selectedPosition,
    selectedMinLevel,
    selectedMaxLevel,
  ]);

  const poolRenderableSections = useMemo<PartyPoolRenderableSection[]>(() => {
    const sectionData = buildLevelRangeSections({
      orderedRows: filteredPartyPoolRows,
      levelRanges: levelRangeFilters,
    });
    const picked = sectionData
      .filter((s) => s.characterIds.length > 0)
      .sort((a, b) => a.orderNo - b.orderNo)
      .map((s) => ({
        key: String(s.id ?? 'etc'),
        label: s.label,
        ids: s.characterIds,
      }));
    if (picked.length > 0) return picked;
    return [
      {
        key: 'all',
        label: '전체',
        ids: filteredPartyPoolRows.map((r) => r.character.id),
      },
    ];
  }, [filteredPartyPoolRows, levelRangeFilters]);

  const visiblePartyPoolOrderIds = useMemo(
    () => poolRenderableSections.flatMap((s) => s.ids),
    [poolRenderableSections]
  );

  const partyPoolIdsFingerprint = useMemo(
    () => [...partyPoolCanonicalIds].sort((a, b) => a - b).join(','),
    [partyPoolCanonicalIds]
  );

  const partyPoolCanonicalIdsRef = useRef(partyPoolCanonicalIds);
  partyPoolCanonicalIdsRef.current = partyPoolCanonicalIds;

  useLayoutEffect(() => {
    setPartyPoolOrderIds((prev) =>
      mergePartyPoolOrderIds(prev, partyPoolCanonicalIdsRef.current)
    );
  }, [partyPoolIdsFingerprint]);

  const partyTabDndSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const partyDndActiveRow = useMemo(() => {
    if (!partyDndActiveId) return null;
    const cid = parsePoolCharDndId(partyDndActiveId);
    if (cid == null) return null;
    return partyPoolDisplayRows.find((r) => r.character.id === cid) ?? null;
  }, [partyDndActiveId, partyPoolDisplayRows]);

  const partyDndActiveSlotDrag = useMemo(() => {
    if (!partyDndActiveId) return null;
    const parsed = parseRaidMemberDndId(partyDndActiveId);
    if (!parsed) return null;
    const detail = raidPartyDetails[parsed.raidPartyId];
    const row = detail?.members.find((m) => m.memberId === parsed.memberId);
    if (!row) return null;
    const ownerLabel =
      row.character.groupNickname?.trim() ||
      groupNicknameByCharacterId.get(row.character.id)?.trim() ||
      row.character.ownerDisplayName?.trim() ||
      '별명 없음';
    return {
      ownerLabel,
      character: row.character,
    };
  }, [partyDndActiveId, raidPartyDetails, groupNicknameByCharacterId]);

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
          toSlot.slotIndex
        );
        return;
      }

      const fromPool = parsePoolCharDndId(active.id);
      if (fromPool != null && toSlot) {
        void assignCharacterToRaidPartySlot(
          toSlot.raidPartyId,
          toSlot.slotIndex,
          fromPool
        );
        return;
      }

      // 공대 캐릭터 목록 내 카드 간 순서 변경은 허용하지 않음.
    },
    [assignCharacterToRaidPartySlot, moveRaidPartyMemberToSlot]
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

  const myMemberInGroup = useMemo(() => {
    if (!group || meUserId == null) return null;
    return group.members.find((m) => m.userId === meUserId) ?? null;
  }, [group, meUserId]);

  const myCharacterIds = useMemo(() => {
    return new Set((myMemberInGroup?.characters ?? []).map((c) => c.id));
  }, [myMemberInGroup]);

  const statusMembers = useMemo(() => {
    if (!group) return [];
    const mine: typeof group.members = [];
    const favorites: typeof group.members = [];
    const rest: typeof group.members = [];
    for (const member of group.members) {
      const resolved = {
        ...member,
        isMe:
          meUserId != null ? member.userId === meUserId : Boolean(member.isMe),
      };
      if (resolved.isMe) {
        mine.push(resolved);
        continue;
      }
      if (resolved.isFavorite) {
        favorites.push(resolved);
        continue;
      }
      rest.push(resolved);
    }
    return [...mine, ...favorites, ...rest];
  }, [group, meUserId]);

  const raidFilterOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const party of raidPartyList) {
      if (!map.has(party.raidInfoId)) {
        map.set(
          party.raidInfoId,
          party.raidName?.trim() || `레이드 #${party.raidInfoId}`
        );
      }
    }
    return [...map.entries()].map(([id, raidName]) => ({ id, raidName }));
  }, [raidPartyList]);

  const difficultyFilterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const party of raidPartyList) {
      if (
        selectedRaidInfoFilterId != null &&
        party.raidInfoId !== selectedRaidInfoFilterId
      ) {
        continue;
      }
      const difficulty = party.selectedDifficulty?.trim();
      if (difficulty) set.add(difficulty);
    }
    return [...set];
  }, [raidPartyList, selectedRaidInfoFilterId]);

  const filteredRaidPartyList = useMemo(() => {
    return raidPartyList.filter((party) => {
      if (
        selectedRaidInfoFilterId != null &&
        party.raidInfoId !== selectedRaidInfoFilterId
      ) {
        return false;
      }
      if (
        selectedDifficultyFilter &&
        party.selectedDifficulty?.trim() !== selectedDifficultyFilter
      ) {
        return false;
      }
      return true;
    });
  }, [raidPartyList, selectedRaidInfoFilterId, selectedDifficultyFilter]);

  useEffect(() => {
    if (
      selectedDifficultyFilter &&
      !difficultyFilterOptions.includes(selectedDifficultyFilter)
    ) {
      setSelectedDifficultyFilter(null);
    }
  }, [difficultyFilterOptions, selectedDifficultyFilter]);

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
      raidPartyList.map((p) => getRaidPartyById(p.id))
    ).then((results) => {
      if (cancelled) return;
      const next: Record<number, RaidPartyDetail> = {};
      const errs: Record<number, string> = {};
      raidPartyList.forEach((p, i) => {
        const r = results[i];
        if (r.status === 'fulfilled') {
          next[p.id] = applyGroupNicknameToDetail(r.value);
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
  }, [activeTab, applyGroupNicknameToDetail, raidPartyList]);

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
        : raidPartyList[0]!.id
    );
  }, [activeTab, raidPartyList]);

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

  async function onToggleFavorite(memberUserId: number) {
    if (!group) return;
    const target = group.members.find((m) => m.userId === memberUserId);
    if (!target) return;
    const isMe =
      meUserId != null ? target.userId === meUserId : Boolean(target.isMe);
    if (isMe) return;
    if (favoriteBusyUserIds.has(memberUserId)) return;

    const nextFavorite = !Boolean(target.isFavorite);
    setFavoriteBusyUserIds((prev) => {
      const next = new Set(prev);
      next.add(memberUserId);
      return next;
    });
    setGroup((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        members: prev.members.map((m) =>
          m.userId === memberUserId ? { ...m, isFavorite: nextFavorite } : m
        ),
      };
    });
    try {
      if (nextFavorite) {
        await addPartyGroupFavorite(group.id, memberUserId);
        setToast({ kind: 'ok', text: '즐겨찾기에 추가했습니다.' });
      } else {
        await removePartyGroupFavorite(group.id, memberUserId);
        setToast({ kind: 'ok', text: '즐겨찾기를 해제했습니다.' });
      }
    } catch (err) {
      setGroup((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members.map((m) =>
            m.userId === memberUserId ? { ...m, isFavorite: !nextFavorite } : m
          ),
        };
      });
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '즐겨찾기 처리에 실패했습니다.';
      setToast({ kind: 'err', text: msg });
    } finally {
      setFavoriteBusyUserIds((prev) => {
        const next = new Set(prev);
        next.delete(memberUserId);
        return next;
      });
    }
  }

  if (busy) {
    return (
      <div className="rounded-2xl border border-base-300 bg-base-300 p-6 text-base-content shadow-sm">
        <div className="space-y-3">
          <div className="skeleton h-5 w-40" />
          <div className="skeleton h-4 w-64" />
          <div className="skeleton h-4 w-52" />
        </div>
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
      <div className="navbar sticky top-16 z-30 rounded-2xl border border-base-300 bg-base-300/95 px-4 text-base-content shadow-sm backdrop-blur supports-[backdrop-filter]:bg-base-300/85">
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
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {statusMembers.map((m) => (
                <PartyMemberCard
                  key={m.id}
                  member={m}
                  isMine={
                    meUserId != null ? m.userId === meUserId : Boolean(m.isMe)
                  }
                  favoriteBusy={favoriteBusyUserIds.has(m.userId)}
                  onToggleFavorite={(member) => onToggleFavorite(member.userId)}
                />
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
                <PartyCharacterFilters
                  position={selectedPosition}
                  onPositionChange={setSelectedPosition}
                  minBound={levelMinBound}
                  maxBound={levelMaxBound}
                  minValue={selectedMinLevel}
                  maxValue={selectedMaxLevel}
                  step={10}
                  onLevelChange={({ min, max }) => {
                    setSelectedMinLevel(min);
                    setSelectedMaxLevel(max);
                  }}
                  onReset={() => {
                    setSelectedPosition('ALL');
                    setSelectedMinLevel(levelMinBound);
                    setSelectedMaxLevel(levelMaxBound);
                  }}
                />
                {levelRangeFiltersError ? (
                  <p className="mt-2 rounded-lg border border-rose-900/40 bg-rose-950/20 px-2 py-2 text-[11px] text-rose-100">
                    {levelRangeFiltersError}
                  </p>
                ) : null}
                {partyPoolError ? (
                  <p className="mt-2 rounded-xl border border-rose-900/40 bg-rose-950/20 px-3 py-6 text-center text-xs text-rose-100">
                    {partyPoolError}
                  </p>
                ) : partyPoolLoading ? (
                  <div className="mt-2 rounded-xl border border-base-300 bg-base-200/30 p-3">
                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="skeleton h-[76px] w-full rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                ) : filteredPartyPoolRows.length === 0 ? (
                  <p className="mt-2 rounded-xl border border-base-300 bg-base-200/40 px-3 py-6 text-center text-xs text-base-content/60">
                    현재 필터 조건에 맞는 캐릭터가 없습니다. 필터를 초기화해
                    주세요.
                  </p>
                ) : (
                  <div
                    className="mt-2 max-h-[60vh] overflow-y-auto pr-1"
                    onWheel={passWheelToOuterScroll}
                  >
                    <SortableContext
                      items={visiblePartyPoolOrderIds.map(poolCharDndId)}
                      strategy={rectSortingStrategy}
                    >
                      <PartyPoolSortableGrid
                        rows={partyPoolDisplayRows}
                        sections={poolRenderableSections}
                        myCharacterIds={myCharacterIds}
                      />
                    </SortableContext>
                  </div>
                )}
              </section>

              <section className="min-w-0 flex-1">
                {raidPartyListError ? (
                  <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 px-4 py-6 text-sm text-rose-100">
                    {raidPartyListError}
                  </div>
                ) : raidPartyListLoading ? (
                  <div className="rounded-xl border border-base-300 bg-base-200/30 p-4">
                    <div className="space-y-3">
                      <div className="skeleton h-10 w-full rounded-lg" />
                      <div className="skeleton h-44 w-full rounded-lg" />
                    </div>
                  </div>
                ) : raidPartyList.length === 0 ? (
                  <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-base-300 bg-base-200/30 px-4 py-10 text-center">
                    <p className="text-sm text-base-content/60">
                      생성된 파티가 없습니다.
                    </p>
                    <p className="mt-1 text-xs text-base-content/45">
                      상단{' '}
                      <strong className="text-base-content/70">
                        파티 생성
                      </strong>
                      으로 레이드를 선택해 주세요.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-base-300 bg-base-200/40 p-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge badge-ghost text-xs">
                          레이드
                        </span>
                        <div className="filter gap-1">
                          <button
                            type="button"
                            className={`btn btn-xs sm:btn-sm ${
                              selectedRaidInfoFilterId == null
                                ? 'btn-primary text-primary-content'
                                : 'btn-outline border-base-300 text-base-content'
                            }`}
                            onClick={() => {
                              setSelectedRaidInfoFilterId(null);
                              setSelectedDifficultyFilter(null);
                            }}
                          >
                            전체
                          </button>
                          {raidFilterOptions.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              className={`btn btn-xs sm:btn-sm ${
                                selectedRaidInfoFilterId === opt.id
                                  ? 'btn-primary text-primary-content'
                                  : 'btn-outline border-base-300 text-base-content'
                              }`}
                              onClick={() => {
                                setSelectedRaidInfoFilterId(opt.id);
                                setSelectedDifficultyFilter(null);
                              }}
                            >
                              {opt.raidName}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="badge badge-ghost text-xs">
                          난이도
                        </span>
                        <div className="filter gap-1">
                          <button
                            type="button"
                            className={`btn btn-xs sm:btn-sm ${
                              selectedDifficultyFilter == null
                                ? 'btn-secondary text-secondary-content'
                                : 'btn-outline border-base-300 text-base-content'
                            }`}
                            onClick={() => setSelectedDifficultyFilter(null)}
                          >
                            전체
                          </button>
                          {difficultyFilterOptions.map((difficulty) => (
                            <button
                              key={difficulty}
                              type="button"
                              className={`btn btn-xs sm:btn-sm ${
                                selectedDifficultyFilter === difficulty
                                  ? 'btn-secondary text-secondary-content'
                                  : 'btn-outline border-base-300 text-base-content'
                              }`}
                              onClick={() =>
                                setSelectedDifficultyFilter(difficulty)
                              }
                            >
                              {difficulty}
                            </button>
                          ))}
                        </div>
                      </div>
                      {selectedRaidInfoFilterId != null ||
                      selectedDifficultyFilter ? (
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => {
                              setSelectedRaidInfoFilterId(null);
                              setSelectedDifficultyFilter(null);
                            }}
                          >
                            필터 초기화
                          </button>
                        </div>
                      ) : null}
                    </div>
                    {filteredRaidPartyList.length === 0 ? (
                      <div className="alert border border-base-300 bg-base-200/40 text-base-content/80">
                        <span className="text-sm">
                          현재 필터 조건에 맞는 파티가 없습니다.
                        </span>
                      </div>
                    ) : null}
                    <div
                      className="max-h-[100vh] overflow-y-auto pr-1"
                      onWheel={passWheelToOuterScroll}
                    >
                      <div className="flex flex-wrap items-start gap-4">
                        {filteredRaidPartyList.map((p) => {
                          const detail = raidPartyDetails[p.id];
                          const rowErr = raidPartyDetailErrors[p.id];
                          return (
                            <div key={p.id} className="w-[28rem] shrink-0">
                              {raidPartyDetailsLoading && !detail && !rowErr ? (
                                <div className="rounded-xl border border-base-300 bg-base-200/30 p-3">
                                  <div className="space-y-2">
                                    <div className="skeleton h-10 w-full rounded-lg" />
                                    <div className="skeleton h-36 w-full rounded-lg" />
                                  </div>
                                </div>
                              ) : rowErr ? (
                                <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 px-4 py-6 text-sm text-rose-100">
                                  {rowErr}
                                </div>
                              ) : detail ? (
                                <RaidPartyDetailView
                                  detail={detail}
                                  myCharacterIds={myCharacterIds}
                                  isPartySelected={focusedRaidPartyId === p.id}
                                  onSelectParty={() =>
                                    setFocusedRaidPartyId(p.id)
                                  }
                                  onAssignToSlot={(slotIndex, characterId) =>
                                    void assignCharacterToRaidPartySlot(
                                      p.id,
                                      slotIndex,
                                      characterId
                                    )
                                  }
                                  onMoveMemberToSlot={(
                                    memberId,
                                    targetSlotIndex
                                  ) =>
                                    void moveRaidPartyMemberToSlot(
                                      p.id,
                                      memberId,
                                      targetSlotIndex
                                    )
                                  }
                                  onRemoveMember={(memberId) =>
                                    void removeRaidPartyMemberFromSlot(
                                      p.id,
                                      memberId
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
                                  difficultyOptions={
                                    raidPartyDifficultyOptions[p.id] ?? []
                                  }
                                  difficultyLoading={
                                    raidPartyDifficultyLoading[p.id] ?? false
                                  }
                                  onOpenDifficultyMenu={() =>
                                    void ensureRaidPartyDifficultyOptions(p)
                                  }
                                  onChangeDifficulty={(v) =>
                                    void changeRaidPartyDifficulty(p, v)
                                  }
                                  difficultyDisabled={
                                    raidPartyDeleteBusy ||
                                    (raidPartyAssignBusy[p.id] ?? false)
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
                    </div>
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
                    headerTrailing={
                      myCharacterIds.has(
                        partyDndActiveSlotDrag.character.id
                      ) ? (
                        <span className="badge badge-warning h-4 min-h-4 rounded-full px-1.5 text-[8px] leading-none text-black">
                          my
                        </span>
                      ) : undefined
                    }
                  />
                </div>
              ) : partyDndActiveRow ? (
                <div className="cursor-grabbing rounded-lg shadow-2xl ring-2 ring-primary/35 scale-[1.03] rotate-[0.5deg]">
                  <PartyPoolCharacterCard
                    memberNickname={partyDndActiveRow.ownerDisplayName}
                    character={partyDndActiveRow.character}
                    draggable={false}
                    headerTrailing={
                      myCharacterIds.has(partyDndActiveRow.character.id) ? (
                        <span className="badge badge-warning h-4 min-h-4 rounded-full px-1.5 text-[8px] leading-none text-black">
                          my
                        </span>
                      ) : undefined
                    }
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
              {myMemberInGroup ? (
                <div className="flex items-center gap-2 rounded-lg border border-base-300 bg-base-300/60 px-2 py-2">
                  <input
                    type="text"
                    value={nicknameDrafts[myMemberInGroup.id] ?? ''}
                    onChange={(e) =>
                      setNicknameDrafts((prev) => ({
                        ...prev,
                        [myMemberInGroup.id]: e.target.value,
                      }))
                    }
                    className="input input-bordered min-w-0 flex-1 border-base-300 bg-base-300 text-sm text-base-content placeholder:text-base-content/70"
                    placeholder={
                      myMemberInGroup.nickname?.trim()
                        ? myMemberInGroup.nickname
                        : '별명 없음'
                    }
                    disabled={nicknameBusyMemberId === myMemberInGroup.id}
                  />
                  <button
                    type="button"
                    className="btn btn-sm shrink-0 border-primary/40 bg-indigo-950/40 text-indigo-200 hover:bg-indigo-900/60"
                    disabled={nicknameBusyMemberId !== null}
                    onClick={() => void onSaveNickname(myMemberInGroup.id)}
                  >
                    {nicknameBusyMemberId === myMemberInGroup.id
                      ? '저장 중…'
                      : '저장'}
                  </button>
                </div>
              ) : (
                <p className="rounded-lg border border-base-300 bg-base-300/40 px-3 py-2 text-xs text-base-content/70">
                  내 멤버 정보를 확인할 수 없습니다. 새로고침 후 다시 시도해
                  주세요.
                </p>
              )}
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
