import { AdminSidebar } from '@/components/layout/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className="lg:pl-[280px] transition-all duration-300">
        <div className="container mx-auto px-4 py-6 pt-20 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
