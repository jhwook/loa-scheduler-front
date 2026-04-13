import { RequireAuth } from "@/components/features/auth/RequireAuth";
import { PartyPageClient } from "@/components/party/party-page-client";

export default function PartyPage() {
  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <main className="px-4 py-4 md:px-6 md:py-6">
        <RequireAuth>
          <PartyPageClient />
        </RequireAuth>
      </main>
    </div>
  );
}
