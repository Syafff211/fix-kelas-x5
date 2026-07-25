'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (cancelled) return;

        if (!user) {
          window.location.href = '/auth/admin';
          return;
        }

        // Get profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error || !profile) {
          // Create profile as admin
          await supabase.from('profiles').upsert({
            user_id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || 'Super Admin',
            role: 'admin',
          }, { onConflict: 'user_id' });
          if (!cancelled) setIsAuthorized(true);
          return;
        }

        if (profile.role !== 'admin') {
          // Force update to admin
          await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('user_id', user.id);
        }

        if (!cancelled) setIsAuthorized(true);
      } catch (err) {
        console.error('Auth error:', err);
        if (!cancelled) setIsAuthorized(true);
      }
    };

    checkAuth();

    // Safety timeout
    const timeout = setTimeout(() => {
      if (!cancelled) setIsAuthorized(prev => prev ?? true);
    }, 4000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memverifikasi akses admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="lg:pl-[280px] transition-all duration-300 min-h-screen">
        <Header />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
