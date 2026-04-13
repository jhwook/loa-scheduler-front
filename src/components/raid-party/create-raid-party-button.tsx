"use client";

type Props = {
  onClick: () => void;
  disabled?: boolean;
};

export function CreateRaidPartyButton({ onClick, disabled }: Props) {
  return (
    <button
      type="button"
      className="btn btn-primary btn-sm shrink-0"
      onClick={onClick}
      disabled={disabled}
    >
      파티 생성
    </button>
  );
}
