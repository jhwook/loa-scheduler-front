"use client";

import { useState } from "react";

import type { MySavedCharacter } from "@/types/expedition";

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type Props = {
  character: MySavedCharacter;
};

/**
 * 쇼핑몰 상품 카드처럼 상단 이미지 + 하단 정보
 */
export function ExpeditionCharacterCard({ character: c }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const src = c.characterImage?.trim();
  const showImage = Boolean(src) && !imageFailed;

  const titlePlain = stripHtml(c.title);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[3/4] w-full shrink-0 bg-slate-100">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- 외부/가변 도메인 URL 대응
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover object-top"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300">
            <span className="select-none text-5xl font-bold text-slate-400/90">
              {(c.characterName[0] ?? "?").toUpperCase()}
            </span>
          </div>
        )}
        <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-md bg-slate-900/85 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          {c.serverName}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900">
          {c.characterName}
        </h3>

        <p className="text-xs text-slate-600">
          <span className="font-semibold text-slate-800">
            {c.characterClassName}
          </span>
          <span className="text-slate-400"> · </span>
          <span>캐릭터 Lv.{c.characterLevel}</span>
        </p>

        <p className="text-sm font-bold text-slate-900">
          Level {c.itemAvgLevel}
        </p>

        {c.itemMaxLevel ? (
          <p className="text-[11px] text-slate-500">
            최고 Lv. {c.itemMaxLevel}
          </p>
        ) : null}

        <p className="text-[11px] text-slate-500">
          원정대 Lv. {c.expeditionLevel}
        </p>

        {c.guildName ? (
          <p className="text-[11px] text-slate-600">
            길드 <span className="font-medium">{c.guildName}</span>
          </p>
        ) : null}

        {c.townName ? (
          <p className="text-[11px] text-slate-500 line-clamp-1">
            영지 {c.townName}
          </p>
        ) : null}

        <p className="text-[11px] font-medium text-slate-700">
          전투력 {c.combatPower}
        </p>

        {titlePlain ? (
          <p className="line-clamp-2 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
            {titlePlain}
          </p>
        ) : null}
      </div>
    </article>
  );
}
