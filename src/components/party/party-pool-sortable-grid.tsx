'use client';

import { useMemo } from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { PartyCharacterSection } from '@/components/party-builder/party-character-section';
import { PartyPoolCharacterCard } from '@/components/party/party-pool-character-card';
import { poolCharDndId } from '@/lib/party-tab-dnd-ids';
import type { PartyPoolOrderedRow } from '@/lib/party-pool-order';

export type PartyPoolRenderableSection = {
  key: string;
  label: string;
  ids: readonly number[];
};

type SortablePoolCardProps = {
  row: PartyPoolOrderedRow;
};

function SortablePoolCard({ row }: SortablePoolCardProps) {
  const sortableId = poolCharDndId(row.character.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: sortableId });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`min-w-0 touch-none cursor-grab active:cursor-grabbing ${isDragging ? 'z-10 opacity-45' : ''}`}
    >
      <div {...attributes} {...listeners}>
        <PartyPoolCharacterCard
          memberNickname={row.ownerDisplayName}
          character={row.character}
          draggable={false}
        />
      </div>
    </div>
  );
}

type Props = {
  rows: readonly PartyPoolOrderedRow[];
  sections: readonly PartyPoolRenderableSection[];
};

export function PartyPoolSortableGrid({ rows, sections }: Props) {
  const rowsById = useMemo(
    () => new Map(rows.map((row) => [row.character.id, row] as const)),
    [rows],
  );

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        if (section.ids.length === 0) return null;

        return (
          <section key={section.key}>
            <PartyCharacterSection label={section.label} count={section.ids.length} />
            <div className="grid grid-cols-2 gap-2">
              {section.ids.map((id) => {
                const row = rowsById.get(id);
                if (!row) return null;
                return <SortablePoolCard key={id} row={row} />;
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
