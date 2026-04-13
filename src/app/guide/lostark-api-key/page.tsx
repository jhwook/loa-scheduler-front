import Link from "next/link";

/** 추후 API KEY 발급 가이드 콘텐츠로 채웁니다. */
export default function LostarkApiKeyGuidePage() {
  return (
    <div className="min-h-screen bg-base-100 px-4 py-10 text-base-content">
      <div className="mx-auto max-w-2xl rounded-2xl border border-base-300 bg-base-200 p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
          가이드
        </p>
        <h1 className="mt-2 text-xl font-semibold text-base-content">
          Lostark API KEY 발급 방법
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-base-content/70">
          이 페이지는 준비 중입니다. 발급 절차·스크린샷 등을 여기에 정리하면
          됩니다.
        </p>
        <Link
          href="/expedition"
          className="btn btn-outline btn-sm mt-6 border-base-300"
        >
          원정대 설정으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
