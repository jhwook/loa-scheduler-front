type Props = {
  label: string;
  count: number;
};

export function PartyCharacterSection({ label, count }: Props) {
  return (
    <header className="mb-2 mt-4 first:mt-0">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold tracking-wide text-base-content/75">
          {label}
        </h4>
        <span className="badge badge-sm border-base-300 bg-base-300 text-base-content/70">
          {count}
        </span>
      </div>
      <div className="mt-1 h-px w-full bg-base-300/80" />
    </header>
  );
}
