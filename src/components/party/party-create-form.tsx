"use client";

import { type FormEvent, useState } from "react";

import type { PartyGroupCreateInput } from "@/types/party";

type Props = {
  onSubmit: (data: PartyGroupCreateInput) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
};

/**
 * 공격대 생성 폼 (모달/패널 내부).
 * TODO: POST /party-groups 또는 백엔드 스펙에 맞는 엔드포인트 연동
 */
export function PartyCreateForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await onSubmit({
      name: trimmed,
      description: description.trim() || "",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="party-create-name"
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/60"
        >
          공격대 이름
        </label>
        <input
          id="party-create-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
          placeholder="예: 주말 격추 공대"
          className="input input-bordered w-full border-base-300 bg-base-200 text-sm text-base-content placeholder:text-base-content/60"
        />
      </div>
      <div>
        <label
          htmlFor="party-create-desc"
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/60"
        >
          설명 (선택)
        </label>
        <textarea
          id="party-create-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="모집 조건, 일정 등을 적어 두세요."
          className="textarea textarea-bordered w-full resize-none border-base-300 bg-base-200 text-sm text-base-content placeholder:text-base-content/60"
        />
      </div>
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <button
          type="button"
          className="btn btn-ghost btn-sm text-base-content/80"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          취소
        </button>
        <button
          type="submit"
          className="btn btn-primary btn-sm text-primary-content"
          disabled={isSubmitting || !name.trim()}
        >
          {isSubmitting ? "생성 중…" : "생성"}
        </button>
      </div>
    </form>
  );
}
