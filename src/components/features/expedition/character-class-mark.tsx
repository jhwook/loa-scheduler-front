"use client";

import { useEffect, useMemo, useState } from "react";

import { getClassIconSrc, resolveClassIconBasename } from "@/lib/class-icon";

export function CharacterClassMark({
  characterClassName,
}: {
  characterClassName: string;
}) {
  const [iconFailed, setIconFailed] = useState(false);
  const basename = useMemo(
    () => resolveClassIconBasename(characterClassName),
    [characterClassName],
  );
  const iconSrc = basename ? getClassIconSrc(basename) : null;
  const letter = (characterClassName?.[0] ?? "?").toUpperCase();

  useEffect(() => {
    setIconFailed(false);
  }, [iconSrc]);

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-base-300 bg-base-300 text-[11px] font-bold text-base-content">
      {iconSrc && !iconFailed ? (
        // eslint-disable-next-line @next/next/no-img-element -- public 직업 아이콘
        <img
          src={iconSrc}
          alt=""
          className="h-full w-full object-cover brightness-0 invert"
          onError={() => setIconFailed(true)}
        />
      ) : (
        letter
      )}
    </div>
  );
}
