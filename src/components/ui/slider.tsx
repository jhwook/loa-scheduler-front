'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

type SliderProps = React.ComponentProps<typeof SliderPrimitive.Root>;

export function Slider({ className, ...props }: SliderProps) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={`relative flex w-full touch-none select-none items-center ${className ?? ''}`}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-2 w-full grow overflow-hidden rounded-full bg-base-100/70"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full bg-base-content/35"
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        className="block size-5 rounded-full border-2 border-base-content bg-base-100 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:pointer-events-none disabled:opacity-50"
      />
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        className="block size-5 rounded-full border-2 border-base-content bg-base-100 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:pointer-events-none disabled:opacity-50"
      />
    </SliderPrimitive.Root>
  );
}
