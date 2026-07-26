'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store';

const supabase = createClient();

interface PresenceUser {
  id: string;
  full_name: string;
  avatar_url?: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
  current_page?: string;
}

export function usePresence(page?: string) {
  const { user } = useAuthStore();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('presence')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = Object.values(state).flat().map((p: any) => ({
          id: p.user_id,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          status: p.status,
          last_seen: p.last_seen,
          current_page: p.current_page,
        }));
        setOnlineUsers(users);
        setIsLoading(false);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            full_name: user.full_name,
            avatar_url: user.avatar_url,
            status: 'online',
            last_seen: new Date().toISOString(),
            current_page: page || window.location.pathname,
          });
        }
      });

    // Update presence every 30 seconds
    const interval = setInterval(async () => {
      if (channel) {
        await channel.track({
          user_id: user.id,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          status: 'online',
          last_seen: new Date().toISOString(),
          current_page: page || window.location.pathname,
        });
      }
    }, 30000);

    // Set status to away when tab is hidden
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        await channel.track({
          user_id: user.id,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          status: 'away',
          last_seen: new Date().toISOString(),
          current_page: page || window.location.pathname,
        });
      } else {
        await channel.track({
          user_id: user.id,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          status: 'online',
          last_seen: new Date().toISOString(),
          current_page: page || window.location.pathname,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [user, page]);

  const getOnlineCount = () => {
    return onlineUsers.filter(u => u.status === 'online').length;
  };

  const getUsersOnPage = (pagePath: string) => {
    return onlineUsers.filter(u => u.current_page === pagePath);
  };

  return {
    onlineUsers,
    isLoading,
    getOnlineCount,
    getUsersOnPage,
  };
}
