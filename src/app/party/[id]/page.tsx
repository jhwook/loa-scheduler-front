import Sidebar from '../../components/Sidebar';

import { PartyHeader } from '@/components/party/party-header';
import { PartyGroupPageClient } from '@/components/party/party-group-page-client';
import { RequireAuth } from '@/components/features/auth/RequireAuth';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PartyGroupPage({ params }: Props) {
  const { id } = await params;
  const groupId = Number(id);

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar />

      <div className="flex min-h-screen flex-1 flex-col">
        <PartyHeader />

        <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
          <RequireAuth>
            <PartyGroupPageClient
              groupId={Number.isFinite(groupId) ? groupId : -1}
            />
          </RequireAuth>
        </main>
      </div>
    </div>
  );
}
