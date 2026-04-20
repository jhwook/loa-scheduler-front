'use client';

import type { PositionFilter } from '@/lib/party-builder/level-range';

type Props = {
  value: PositionFilter;
  onChange: (v: PositionFilter) => void;
  onlyMine?: boolean;
  onToggleMine?: () => void;
};

const OPTIONS: Array<{ value: PositionFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'DEALER', label: '딜러' },
  { value: 'SUPPORT', label: '서포터' },
];

export function PartyCharacterPositionFilter({
  value,
  onChange,
  onlyMine = false,
  onToggleMine,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-base-300 bg-base-300 p-1 shadow-sm">
      <div className="inline-flex">
        {OPTIONS.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`btn btn-sm min-w-20 border-0 ${
                active
                  ? 'bg-primary text-primary-content hover:bg-primary'
                  : 'bg-transparent text-base-content/80 hover:bg-base-200'
              }`}
              onClick={() => onChange(option.value)}
              aria-pressed={active}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {onToggleMine ? (
        <button
          type="button"
          className={`btn btn-sm min-w-14 border-0 ${
            onlyMine
              ? 'bg-warning text-black hover:bg-warning'
              : 'bg-transparent text-base-content/80 hover:bg-base-200'
          }`}
          onClick={onToggleMine}
          aria-pressed={onlyMine}
        >
          my
        </button>
      ) : null}
    </div>
  );
}
