'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNavbar } from '@/components/layout/AdminNavbar';
import { useAuthStore } from '@/store';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    // Only redirect if we're sure there's no user or not admin (not loading)
    if (!loading) {
      if (!user) {
        router.push('/auth/admin');
      } else if (user.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="spinner mb-4" />
          <p className="text-muted-foreground">Memuat admin panel...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user or not admin (will redirect)
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <main className="pt-16">
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
