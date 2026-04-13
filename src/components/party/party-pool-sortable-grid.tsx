"use client";

import { useMemo } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { PartyPoolCharacterCard } from "@/components/party/party-pool-character-card";
import { poolCharDndId } from "@/lib/party-tab-dnd-ids";
import type { PartyPoolOrderedRow } from "@/lib/party-pool-order";

type Props = {
  rows: readonly PartyPoolOrderedRow[];
  orderIds: readonly number[];
};

/** 부모에 DndContext + SortableContext(items=orderIds.map(poolCharDndId)) 필요. */
function SortablePoolCard({
  characterId,
  row,
}: {
  characterId: number;
  row: PartyPoolOrderedRow;
}) {
  const dndId = poolCharDndId(characterId);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dndId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`min-w-0 touch-none cursor-grab active:cursor-grabbing ${isDragging ? "z-10 opacity-45" : ""}`}
    >
      <PartyPoolCharacterCard
        memberNickname={row.ownerDisplayName}
        character={row.character}
        draggable={false}
      />
    </div>
  );
}

export function PartyPoolSortableGrid({ rows, orderIds }: Props) {
  const rowById = useMemo(() => {
    const m = new Map<number, PartyPoolOrderedRow>();
    for (const r of rows) {
      m.set(r.character.id, r);
    }
    return m;
  }, [rows]);

  return (
    <div className="grid grid-cols-2 gap-2">
      {orderIds.map((id) => {
        const row = rowById.get(id);
        if (!row) return null;
        return (
          <SortablePoolCard key={id} characterId={id} row={row} />
        );
      })}
    </div>
  );
}
