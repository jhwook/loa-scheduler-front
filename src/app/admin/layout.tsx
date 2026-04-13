import { AdminSubnav } from '@/components/admin/admin-subnav';
import { RequireAdmin } from '@/components/features/auth/RequireAdmin';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <RequireAdmin>
        <main className="px-4 py-4 md:px-6 md:py-6">
          <AdminSubnav />
          {children}
        </main>
      </RequireAdmin>
    </div>
  );
}
