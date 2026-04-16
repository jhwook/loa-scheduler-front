'use client';

import type { PositionFilter } from '@/lib/party-builder/level-range';

type Props = {
  value: PositionFilter;
  onChange: (v: PositionFilter) => void;
};

const OPTIONS: Array<{ value: PositionFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'DEALER', label: '딜러' },
  { value: 'SUPPORT', label: '서포터' },
];

export function PartyCharacterPositionFilter({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-xl border border-base-300 bg-base-300 p-1 shadow-sm">
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
  );
}
