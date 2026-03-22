"use client";

import { useState } from "react";

import { ExpeditionPreviewModal } from "@/components/features/expedition/ExpeditionPreviewModal";

export function ExpeditionAddButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-sm rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50 md:btn-md md:text-sm"
      >
        + 원정대 추가
      </button>
      <ExpeditionPreviewModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
