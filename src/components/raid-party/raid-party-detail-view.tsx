"use client";

import { useMemo } from "react";

import { normalizeRaidPartySize } from "@/types/raid";
import type {
  RaidPartyDetail,
  RaidPartyDifficultyOption,
} from "@/types/raid-party";

import { RaidPartySlotGrid } from "./raid-party-slot-grid";

type Props = {
  detail: RaidPartyDetail;
  onAssignToSlot?: (
    slotIndex: number,
    characterId: number,
  ) => void | Promise<void>;
  assignmentBusy?: boolean;
  /** 슬롯 간 이동·스왑 (부모 DndContext에서 raid-member → raid-slot 처리) */
  onMoveMemberToSlot?: (
    memberId: number,
    targetSlotIndex: number,
  ) => void | Promise<void>;
  onRemoveMember?: (memberId: number) => void | Promise<void>;
  /** 레이드 파티 통째로 삭제(확인은 부모) — 보통 선택된 카드에만 표시 */
  onDeleteRaidParty?: () => void;
  deletePartyDisabled?: boolean;
  /** 카드(제목 영역) 선택 — 삭제 대상 지정 */
  onSelectParty?: () => void;
  isPartySelected?: boolean;
  myCharacterIds?: ReadonlySet<number>;
  difficultyOptions?: RaidPartyDifficultyOption[];
  difficultyLoading?: boolean;
  onOpenDifficultyMenu?: () => void;
  onChangeDifficulty?: (value: string | null) => void;
  difficultyDisabled?: boolean;
};

export function RaidPartyDetailView({
  detail,
  onAssignToSlot,
  assignmentBusy = false,
  onMoveMemberToSlot,
  onRemoveMember,
  onDeleteRaidParty,
  deletePartyDisabled = false,
  onSelectParty,
  isPartySelected = false,
  myCharacterIds,
  difficultyOptions = [],
  difficultyLoading = false,
  onOpenDifficultyMenu,
  onChangeDifficulty,
  difficultyDisabled = false,
}: Props) {
  const memberBySlot = useMemo(() => {
    const m = new Map<
      number,
      {
        character: RaidPartyDetail["members"][number]["character"];
        memberId?: number;
      }
    >();
    for (const row of detail.members) {
      m.set(row.slotIndex, {
        character: row.character,
        memberId: row.memberId,
      });
    }
    return m;
  }, [detail.members]);

  const slotCount = normalizeRaidPartySize(detail.partySize);

  const cells = useMemo(
    () =>
      Array.from({ length: slotCount }, (_, i) => {
        const hit = memberBySlot.get(i);
        return {
          displayIndex: i + 1,
          character: hit?.character ?? null,
          memberId: hit?.memberId,
        };
      }),
    [memberBySlot, slotCount],
  );

  const displayTitle =
    detail.title?.trim() ||
    detail.raidInfo?.raidName ||
    "레이드 파티";
  const difficulty = detail.selectedDifficulty?.trim() ?? "";

  const showDelete =
    Boolean(onDeleteRaidParty) &&
    (isPartySelected || !onSelectParty);
  /** 삭제 버튼 유무와 관계없이 헤더 높이·폭 유지 */
  const reserveDeleteSlot =
    Boolean(onSelectParty) && Boolean(onDeleteRaidParty);

  return (
    <div
      className={`flex min-h-0 w-full min-w-0 flex-col rounded-xl border bg-base-200/40 p-3 shadow-sm ${
        onSelectParty && isPartySelected
          ? "border-primary/50 ring-2 ring-primary/35"
          : "border-base-300"
      }`}
    >
      <div
        className={`relative mb-2 h-10 w-full min-w-0 shrink-0 overflow-visible rounded-lg border border-primary/35 transition-colors sm:h-11 ${
          onSelectParty && isPartySelected
            ? "bg-primary/15"
            : "bg-primary/10"
        } ${onSelectParty ? "hover:bg-primary/20" : ""}`}
      >
        {onSelectParty ? (
          <button
            type="button"
            className={`absolute inset-y-0 left-0 z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/45 ${
              reserveDeleteSlot
                ? "right-[5.5rem] rounded-l-lg sm:right-[5.75rem]"
                : "right-0 rounded-lg"
            }`}
            onClick={() => onSelectParty()}
            aria-label={`${displayTitle} 파티 선택`}
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center px-3 sm:px-4">
          <span
            className={`max-w-full truncate text-center text-sm font-bold text-base-content ${
              reserveDeleteSlot ? "px-10 sm:px-12" : ""
            }`}
          >
            {displayTitle}
          </span>
        </div>
        <div className="absolute inset-y-0 right-0 z-[2] flex w-[5.5rem] items-center justify-end pr-1.5 sm:w-[5.75rem] sm:pr-2">
          {showDelete ? (
            <button
              type="button"
              className="btn btn-ghost btn-xs pointer-events-auto shrink-0 border border-rose-500/35 bg-rose-950/25 px-2 text-[11px] font-semibold text-rose-200/95 hover:border-rose-400/50 hover:bg-rose-950/45"
              disabled={deletePartyDisabled}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDeleteRaidParty?.();
              }}
            >
              파티 삭제
            </button>
          ) : reserveDeleteSlot ? (
            <span
              className="invisible h-7 min-w-[4.25rem] shrink-0 px-2 text-[11px] font-semibold"
              aria-hidden
            >
              파티 삭제
            </span>
          ) : null}
        </div>
        <div className="absolute left-2 top-1/2 z-[2] -translate-y-1/2">
          <div className="dropdown dropdown-bottom">
            <button
              type="button"
              className="badge badge-sm h-6 border border-primary/35 bg-base-200/70 px-2 text-[10px] font-semibold text-primary hover:bg-base-200"
              disabled={difficultyDisabled}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenDifficultyMenu?.();
              }}
            >
              {difficulty || "난이도 선택"}
            </button>
            <ul
              tabIndex={0}
              className="menu dropdown-content z-[200] mt-1 w-36 rounded-box border border-base-300 bg-base-200 p-1 shadow-lg"
              role="menu"
              aria-label="난이도 선택"
            >
              {difficultyLoading ? (
                <li className="pointer-events-none px-2 py-1 text-xs text-base-content/70">
                  불러오는 중…
                </li>
              ) : (
                <>
                  {difficultyOptions.map((opt) => (
                    <li key={opt.value}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onChangeDifficulty?.(opt.value);
                        }}
                        className={difficulty === opt.value ? "active font-semibold" : ""}
                      >
                        {opt.label}
                      </button>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
      <RaidPartySlotGrid
        label=""
        cells={cells}
        myCharacterIds={myCharacterIds}
        raidPartyId={detail.id}
        useDndKitDrop
        onDropCharacter={onAssignToSlot}
        dropBusy={assignmentBusy}
        enablePlacedReorder={Boolean(onMoveMemberToSlot)}
        onRemovePlacedMember={onRemoveMember}
      />
    </div>
  );
}
