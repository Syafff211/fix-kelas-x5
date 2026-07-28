'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudentNavbar } from '@/components/layout/StudentNavbar';
import { useAuthStore } from '@/store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for auth to finish loading
    if (!loading) {
      setIsChecking(false);
      
      // Only redirect if we're sure there's no user
      if (!user) {
        router.replace('/auth/login');
      }
    }
  }, [user, loading, router]);

  // Show loading screen while checking auth OR still loading
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="spinner mb-4" />
          <p className="text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentNavbar />
      <main className="pt-16">
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
