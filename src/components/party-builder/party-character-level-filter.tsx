'use client';

import { Slider } from '@/components/ui/slider';

type Props = {
  minBound: number;
  maxBound: number;
  minValue: number;
  maxValue: number;
  step?: number;
  onChange: (next: { min: number; max: number }) => void;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function PartyCharacterLevelFilter({
  minBound,
  maxBound,
  minValue,
  maxValue,
  step = 10,
  onChange,
}: Props) {
  const safeMin = clamp(Math.min(minValue, maxValue), minBound, maxBound);
  const safeMax = clamp(Math.max(minValue, maxValue), minBound, maxBound);
  const commitMin = (nextMin: number) => {
    const clamped = clamp(nextMin, minBound, safeMax);
    onChange({ min: clamped, max: safeMax });
  };

  const commitMax = (nextMax: number) => {
    const clamped = clamp(nextMax, safeMin, maxBound);
    onChange({ min: safeMin, max: clamped });
  };

  return (
    <section className="rounded-xl border border-base-300 bg-base-300 px-3 py-3 shadow-sm">
      <div className="grid grid-cols-[96px_1fr_96px] items-center gap-2">
        <input
          type="number"
          className="input input-sm input-bordered h-10 border-base-300 bg-base-200 text-center text-base font-semibold text-base-content"
          value={safeMin}
          min={minBound}
          max={safeMax}
          step={step}
          onChange={(e) => commitMin(Number(e.target.value))}
        />

        <div className="relative px-1">
          <Slider
            min={minBound}
            max={maxBound}
            value={[safeMin, safeMax]}
            step={step}
            minStepsBetweenThumbs={0}
            onValueChange={([nextMin, nextMax]) => {
              const nMin = clamp(nextMin ?? safeMin, minBound, maxBound);
              const nMax = clamp(nextMax ?? safeMax, minBound, maxBound);
              onChange({
                min: Math.min(nMin, nMax),
                max: Math.max(nMin, nMax),
              });
            }}
          />
        </div>

        <input
          type="number"
          className="input input-sm input-bordered h-10 border-base-300 bg-base-200 text-center text-base font-semibold text-base-content"
          value={safeMax}
          min={safeMin}
          max={maxBound}
          step={step}
          onChange={(e) => commitMax(Number(e.target.value))}
        />
      </div>
    </section>
  );
}
