"use client";

import { useState } from "react";

import { useDraggable, useDroppable } from "@dnd-kit/core";

import { PartyPoolCharacterCard } from "@/components/party/party-pool-character-card";
import { readPartyPoolCharacterIdFromDrag } from "@/lib/party-pool-dnd";
import {
  raidMemberDndId,
  raidSlotDndId,
} from "@/lib/party-tab-dnd-ids";
import type { RaidPartySlotCharacter } from "@/types/raid-party";

export type RaidPartySlotCell = {
  displayIndex: number;
  character?: RaidPartySlotCharacter | null;
  /** PATCH/DELETE용 멤버 id — 없으면 슬롯 내 드래그·제거 비활성 */
  memberId?: number;
};

type Props = {
  label: string;
  cells: RaidPartySlotCell[];
  raidPartyId?: number;
  useDndKitDrop?: boolean;
  onDropCharacter?: (slotIndex: number, characterId: number) => void | Promise<void>;
  dropBusy?: boolean;
  /** 슬롯에 배치된 캐릭터를 같은 파티 안에서 드래그해 옮김 */
  enablePlacedReorder?: boolean;
  onRemovePlacedMember?: (memberId: number) => void | Promise<void>;
};

function slotOwnerHeaderLabel(c: RaidPartySlotCharacter): string {
  const t = c.ownerDisplayName?.trim();
  return t ? t : "별명 없음";
}

function RemovePlacedButton({
  onRemove,
  disabled,
}: {
  onRemove: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void onRemove();
      }}
      className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border border-base-100/25 bg-base-100/10 p-0 text-base-content/75 transition hover:border-rose-500/45 hover:bg-rose-500/15 hover:text-rose-200 disabled:pointer-events-none disabled:opacity-40"
      aria-label="파티에서 제거"
      title="파티에서 제거"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-2.5 w-2.5"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149-.023a.75.75 0 00-.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}

function DraggablePlacedCard({
  raidPartyId,
  memberId,
  character,
  disabled,
  onRemove,
}: {
  raidPartyId: number;
  memberId: number;
  character: RaidPartySlotCharacter;
  disabled: boolean;
  onRemove?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: raidMemberDndId(raidPartyId, memberId),
      disabled,
    });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative w-full min-w-0 touch-none ${
        isDragging ? "z-20 opacity-50" : ""
      } ${
        disabled
          ? ""
          : "rounded-lg ring-2 ring-transparent transition-[box-shadow,opacity] hover:ring-primary/40"
      }`}
    >
      <div {...listeners} {...attributes} className="w-full min-w-0">
        <PartyPoolCharacterCard
          memberNickname={slotOwnerHeaderLabel(character)}
          character={{
            id: character.id,
            characterName: character.characterName,
            itemAvgLevel: character.itemAvgLevel ?? undefined,
            characterClassName: character.characterClassName,
            combatPower: character.combatPower,
            partyRole: character.partyRole,
          }}
          draggable={false}
          className="w-full"
          variant="slot"
          headerTrailing={
            onRemove ? (
              <RemovePlacedButton onRemove={onRemove} disabled={disabled} />
            ) : undefined
          }
        />
      </div>
    </div>
  );
}

/**
 * 크기: 슬롯 캐릭터 카드와 동일 박스 모델(invisible 골격).
 * 모양: 예전처럼 단일 점선 영역 + 가운데 "빈 슬롯" 문구만.
 */
function EmptySlotPlaceholder() {
  return (
    <div className="relative w-full min-w-0 self-start">
      <article
        className="invisible flex min-w-0 w-full flex-col overflow-visible rounded-lg"
        aria-hidden
      >
        <div className="flex min-w-0 items-center gap-0.5 px-2.5 py-1 text-[10px] font-semibold leading-snug">
          <span className="min-w-0 flex-1 truncate text-center">빈 슬롯</span>
          <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center" />
        </div>
        <div className="flex items-start gap-2 px-2.5 pb-2 pt-1.5">
          <div className="h-9 w-9 shrink-0 rounded-full" aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="min-h-[2.125rem] text-[12px] leading-snug" aria-hidden />
            <div className="mt-0.5 h-2.5 text-[10px] leading-none" aria-hidden />
          </div>
        </div>
      </article>
      <div
        className="absolute inset-0 flex items-center justify-center rounded-lg border border-dashed border-base-300/70 bg-base-200/35 px-2 py-1.5 text-center text-[10px] leading-tight text-base-content/45"
        aria-hidden
      >
        <span>빈 슬롯</span>
      </div>
    </div>
  );
}

function SlotBody({
  cell,
  raidPartyId,
  enablePlacedReorder,
  onRemovePlacedMember,
  dropBusy,
}: {
  cell: RaidPartySlotCell;
  raidPartyId: number;
  enablePlacedReorder: boolean;
  onRemovePlacedMember?: (memberId: number) => void | Promise<void>;
  dropBusy: boolean;
}) {
  const c = cell.character;
  const memberId = cell.memberId;
  const canDragPlaced =
    enablePlacedReorder && memberId != null && !dropBusy && raidPartyId > 0;
  const removeHandler =
    memberId != null && onRemovePlacedMember
      ? () => void onRemovePlacedMember(memberId)
      : undefined;

  return (
    <div className="flex w-full min-w-0 flex-col">
      {c ? (
        canDragPlaced ? (
          <DraggablePlacedCard
            raidPartyId={raidPartyId}
            memberId={memberId}
            character={c}
            disabled={dropBusy}
            onRemove={removeHandler}
          />
        ) : (
          <PartyPoolCharacterCard
            memberNickname={slotOwnerHeaderLabel(c)}
            character={{
              id: c.id,
              characterName: c.characterName,
              itemAvgLevel: c.itemAvgLevel ?? undefined,
              characterClassName: c.characterClassName,
              combatPower: c.combatPower,
              partyRole: c.partyRole,
            }}
            draggable={false}
            className="w-full"
            variant="slot"
            headerTrailing={
              removeHandler ? (
                <RemovePlacedButton
                  onRemove={removeHandler}
                  disabled={dropBusy}
                />
              ) : undefined
            }
          />
        )
      ) : (
        <EmptySlotPlaceholder />
      )}
    </div>
  );
}

function DndKitSlotCell({
  raidPartyId,
  slotIndex,
  cellClass,
  cell,
  disabled,
  enablePlacedReorder,
  onRemovePlacedMember,
}: {
  raidPartyId: number;
  slotIndex: number;
  cellClass: string;
  cell: RaidPartySlotCell;
  disabled: boolean;
  enablePlacedReorder: boolean;
  onRemovePlacedMember?: (memberId: number) => void | Promise<void>;
}) {
  const id = raidSlotDndId(raidPartyId, slotIndex);
  const { setNodeRef, isOver } = useDroppable({ id, disabled });

  const highlight =
    isOver && !disabled
      ? "ring-2 ring-primary/60 ring-inset bg-primary/10"
      : "";

  const hoverIdle =
    !disabled && !isOver
      ? "hover:bg-base-300/40 hover:ring-1 hover:ring-inset hover:ring-primary/30"
      : "";

  return (
    <div
      ref={setNodeRef}
      className={`${cellClass} ${highlight} ${hoverIdle} transition-[background-color,box-shadow]`}
      aria-label={
        cell.character
          ? `${cell.character.characterName} 슬롯`
          : "빈 슬롯, 캐릭터를 놓아 배치"
      }
    >
      <SlotBody
        cell={cell}
        raidPartyId={raidPartyId}
        enablePlacedReorder={enablePlacedReorder}
        onRemovePlacedMember={onRemovePlacedMember}
        dropBusy={disabled}
      />
    </div>
  );
}

function Html5SlotCell({
  cellClass,
  cell,
  slotIndex,
  canDrop,
  onDropCharacter,
  raidPartyId,
  enablePlacedReorder,
  onRemovePlacedMember,
  dropBusy,
}: {
  cellClass: string;
  cell: RaidPartySlotCell;
  slotIndex: number;
  canDrop: boolean;
  onDropCharacter: (slotIndex: number, characterId: number) => void | Promise<void>;
  raidPartyId: number;
  enablePlacedReorder: boolean;
  onRemovePlacedMember?: (memberId: number) => void | Promise<void>;
  dropBusy: boolean;
}) {
  const [dragOverSlot, setDragOverSlot] = useState(false);

  const highlight =
    canDrop && dragOverSlot
      ? "ring-2 ring-primary/60 ring-inset bg-primary/10"
      : "";

  const hoverIdle =
    canDrop && !dragOverSlot
      ? "hover:bg-base-300/40 hover:ring-1 hover:ring-inset hover:ring-primary/30"
      : "";

  return (
    <div
      className={`${cellClass} ${highlight} ${hoverIdle} ${canDrop ? "transition-[background-color,box-shadow]" : ""}`}
      onDragOver={
        canDrop
          ? (e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }
          : undefined
      }
      onDragEnter={
        canDrop
          ? (e) => {
              e.preventDefault();
              setDragOverSlot(true);
            }
          : undefined
      }
      onDragLeave={
        canDrop
          ? (e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverSlot(false);
              }
            }
          : undefined
      }
      onDrop={
        canDrop
          ? (e) => {
              e.preventDefault();
              setDragOverSlot(false);
              const id = readPartyPoolCharacterIdFromDrag(e);
              if (id == null) return;
              void onDropCharacter(slotIndex, id);
            }
          : undefined
      }
      aria-label={
        cell.character
          ? `${cell.character.characterName} 슬롯`
          : "빈 슬롯, 캐릭터를 놓아 배치"
      }
    >
      <SlotBody
        cell={cell}
        raidPartyId={raidPartyId}
        enablePlacedReorder={enablePlacedReorder}
        onRemovePlacedMember={onRemovePlacedMember}
        dropBusy={dropBusy}
      />
    </div>
  );
}

export function RaidPartySlotGrid({
  label,
  cells,
  raidPartyId,
  useDndKitDrop = false,
  onDropCharacter,
  dropBusy = false,
  enablePlacedReorder = false,
  onRemovePlacedMember,
}: Props) {
  const isEight = cells.length === 8;
  /** items-start + 셀 높이는 콘텐츠 기준 — 빈 슬롯은 카드와 비슷한 min-height만 사용 */
  const cellClass = isEight
    ? "flex w-full min-w-0 flex-col rounded-sm border border-base-300/90 bg-base-200/90 p-0.5 sm:p-1"
    : "flex w-full min-w-0 flex-col rounded-sm border border-base-300/90 bg-base-200/90 p-0.5 sm:p-1";

  const dndKit =
    Boolean(useDndKitDrop && onDropCharacter && raidPartyId != null) &&
    !dropBusy;
  const html5 =
    Boolean(onDropCharacter && !useDndKitDrop) && !dropBusy;

  const placedReorderEnabled = Boolean(
    enablePlacedReorder && raidPartyId != null,
  );
  const rid = raidPartyId ?? 0;

  return (
    <div className="overflow-hidden rounded-lg border-2 border-base-300/90 bg-base-300/25">
      {label.trim() ? (
        <div className="border-b-2 border-base-300/90 bg-base-300/45 px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-base-content/80">
          {label}
        </div>
      ) : null}
      <div className="grid grid-cols-2 items-start gap-1 p-1 sm:gap-1.5 sm:p-1.5 sm:bg-base-300">
        {cells.map((cell, i) => {
          if (dndKit && raidPartyId != null && onDropCharacter) {
            return (
              <DndKitSlotCell
                key={i}
                raidPartyId={raidPartyId}
                slotIndex={i}
                cellClass={cellClass}
                cell={cell}
                disabled={dropBusy}
                enablePlacedReorder={placedReorderEnabled}
                onRemovePlacedMember={onRemovePlacedMember}
              />
            );
          }
          if (html5 && onDropCharacter) {
            return (
              <Html5SlotCell
                key={i}
                cellClass={cellClass}
                cell={cell}
                slotIndex={i}
                canDrop={html5}
                onDropCharacter={onDropCharacter}
                raidPartyId={rid}
                enablePlacedReorder={placedReorderEnabled}
                onRemovePlacedMember={onRemovePlacedMember}
                dropBusy={dropBusy}
              />
            );
          }
          return (
            <div
              key={i}
              className={`${cellClass} hover:bg-base-300/40 hover:ring-1 hover:ring-inset hover:ring-primary/30 transition-[background-color,box-shadow]`}
              aria-label={
                cell.character
                  ? `${cell.character.characterName} 슬롯`
                  : "빈 슬롯"
              }
            >
              <SlotBody
                cell={cell}
                raidPartyId={rid}
                enablePlacedReorder={placedReorderEnabled}
                onRemovePlacedMember={onRemovePlacedMember}
                dropBusy={dropBusy}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
