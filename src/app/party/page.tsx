import Sidebar from "../components/Sidebar";

import { PartyHeader } from "@/components/party/party-header";
import { PartyPageClient } from "@/components/party/party-page-client";
import { RequireAuth } from "@/components/features/auth/RequireAuth";

export default function PartyPage() {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar />

      <div className="flex min-h-screen flex-1 flex-col">
        <PartyHeader />

        <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
          <RequireAuth>
            <PartyPageClient />
          </RequireAuth>
        </main>
      </div>
    </div>
  );
}
