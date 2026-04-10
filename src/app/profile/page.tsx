import Sidebar from '../components/Sidebar';

import { ProfileForm } from '@/components/features/auth/ProfileForm';
import { UserMenu } from '@/components/features/auth/UserMenu';
import { RequireAuth } from '@/components/features/auth/RequireAuth';

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar />

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur md:px-6">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Account</span>
              <span>/</span>
              <span className="text-slate-600">프로필</span>
            </div>
            <h1 className="text-base font-semibold tracking-tight text-slate-900 md:text-lg">
              프로필
            </h1>
          </div>
          <div className="shrink-0">
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
          <RequireAuth>
            <div className="flex min-h-[calc(100vh-6rem)] items-start">
              <ProfileForm />
            </div>
          </RequireAuth>
        </main>
      </div>
    </div>
  );
}
