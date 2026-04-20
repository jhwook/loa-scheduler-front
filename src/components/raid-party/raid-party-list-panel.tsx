"use client";

import { formatRaidPartySizeLabel, normalizeRaidPartySize } from "@/types/raid";
import type { RaidPartyListItem } from "@/types/raid-party";

type Props = {
  items: RaidPartyListItem[];
  selectedId: number | null;
  loading: boolean;
  error: string | null;
  onSelect: (id: number) => void;
};

export function RaidPartyListPanel({
  items,
  selectedId,
  loading,
  error,
  onSelect,
}: Props) {
  return (
    <div className="flex w-full min-w-0 flex-col rounded-xl border border-base-300 bg-base-200/50 lg:w-56 lg:max-w-[15rem] lg:shrink-0">
      <div className="border-b border-base-300 px-2 py-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-base-content/55">
          파티 목록
        </h3>
      </div>
      <div className="max-h-[min(60vh,28rem)] overflow-y-auto p-2 [scrollbar-color:rgb(82_82_91)_rgb(39_39_42)] [scrollbar-width:thin]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-base-content/60">
            <span className="loading loading-spinner loading-sm" />
            불러오는 중…
          </div>
        ) : error ? (
          <p className="rounded-lg bg-rose-950/30 px-2 py-2 text-xs text-error/90">
            {error}
          </p>
        ) : items.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-base-content/50">
            생성된 파티가 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {items.map((p) => {
              const selected = selectedId === p.id;
              const title =
                p.title?.trim() || p.raidName || `파티 #${p.id}`;
              const titleWithDifficulty = p.selectedDifficulty?.trim()
                ? `${title} (${p.selectedDifficulty.trim()})`
                : title;
              const creator =
                p.createdByUsername?.trim() ||
                `회원 #${p.createdByUserId}`;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(p.id)}
                    className={`w-full rounded-lg border px-2 py-2 text-left text-xs transition-colors ${
                      selected
                        ? "border-primary/50 bg-primary/15 text-base-content"
                        : "border-base-300/80 bg-base-300/40 text-base-content/90 hover:bg-base-300/70"
                    }`}
                  >
                    <p className="line-clamp-2 font-semibold leading-snug">
                      {titleWithDifficulty}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-base-content/55">
                      {p.raidName}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-base-content/50">
                      <span>
                        {formatRaidPartySizeLabel(
                          normalizeRaidPartySize(p.partySize),
                        )}
                      </span>
                      <span>·</span>
                      <span>
                        배치 {p.placedMemberCount}명
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[10px] text-base-content/45">
                      생성: {creator}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
