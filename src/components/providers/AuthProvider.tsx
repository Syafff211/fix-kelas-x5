'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store';
import type { Profile } from '@/types';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      try {
        setLoading(true);
        
        // Get current session first (faster than getUser)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          console.log('No active session');
          setUser(null);
          setLoading(false);
          setIsInitialized(true);
          return;
        }

        console.log('Active session found:', session.user.email);

        // Fetch profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setUser(null);
          setLoading(false);
          setIsInitialized(true);
          return;
        }

        console.log('Profile loaded:', { email: profile?.email, role: profile?.role });

        if (profile) {
          setUser(profile as Profile);
        } else {
          setUser(null);
        }
        
        setLoading(false);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error in getUser:', error);
        setUser(null);
        setLoading(false);
        setIsInitialized(true);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (!error && profile) {
            console.log('Profile on sign in:', { email: profile.email, role: profile.role });
            setUser(profile as Profile);
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setUser(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          // Refresh profile on token refresh
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            
            if (profile) {
              console.log('Profile refreshed on token refresh');
              setUser(profile as Profile);
            }
          }
        } else if (event === 'INITIAL_SESSION') {
          // Handle initial session check
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            
            if (profile) {
              setUser(profile as Profile);
            }
          }
          setLoading(false);
          setIsInitialized(true);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  // Show loading screen while initializing auth
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="spinner mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
