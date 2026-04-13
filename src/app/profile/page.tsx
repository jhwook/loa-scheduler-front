import { ProfileForm } from "@/components/features/auth/ProfileForm";
import { RequireAuth } from "@/components/features/auth/RequireAuth";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <main className="px-4 py-4 md:px-6 md:py-6">
        <RequireAuth>
          <div className="flex min-h-[calc(100dvh-6rem)] items-start">
            <ProfileForm />
          </div>
        </RequireAuth>
      </main>
    </div>
  );
}
