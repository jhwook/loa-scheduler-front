"use client";

/** 직업 원(h-9) 기준 십자 크기 */
const boxClass = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-3.5 w-3.5 sm:h-4 sm:w-4",
} as const;

type SizeKey = keyof typeof boxClass;

type Props = {
  size?: SizeKey;
  className?: string;
};

/**
 * 직업 아이콘 원 **왼쪽 하단** — 테두리·박스 없이 초록 십자선만.
 * 밝은 아이콘 위 가독용으로 얇은 그림자만 둠.
 */
export function SupporterRoleMark({ size = "md", className = "" }: Props) {
  return (
    <span
      className={`pointer-events-none absolute -bottom-0.5 -left-0.5 z-1 flex items-center justify-center ${className}`}
      title="서포터"
      aria-label="서포터"
      role="img"
    >
      <svg
        viewBox="0 0 14 14"
        className={`shrink-0 text-emerald-400 drop-shadow-[0_0_1.5px_rgba(0,0,0,0.85)] ${boxClass[size]}`}
        fill="none"
        aria-hidden
      >
        <path
          d="M7 2.25v9.5M2.25 7h9.5"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
