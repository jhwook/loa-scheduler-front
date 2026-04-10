import Link from 'next/link';

import { SignupForm } from '@/components/features/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
        <Link href="/" className="text-sm font-semibold text-slate-900">
          LoA Scheduler
        </Link>
        <span className="text-xs text-slate-500">회원가입</span>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <SignupForm />
      </main>
    </div>
  );
}
