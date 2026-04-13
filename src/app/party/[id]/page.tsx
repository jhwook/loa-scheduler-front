import { RequireAuth } from "@/components/features/auth/RequireAuth";
import { PartyGroupPageClient } from "@/components/party/party-group-page-client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PartyGroupPage({ params }: Props) {
  const { id } = await params;
  const groupId = Number(id);

  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <main className="px-4 py-4 md:px-6 md:py-6">
        <RequireAuth>
          <PartyGroupPageClient
            groupId={Number.isFinite(groupId) ? groupId : -1}
          />
        </RequireAuth>
      </main>
    </div>
  );
}
