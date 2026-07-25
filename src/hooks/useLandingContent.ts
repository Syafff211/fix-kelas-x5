'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface LandingContent {
  section: string;
  key: string;
  value: string;
  value_type: string;
}

export interface WebsiteSettings {
  key: string;
  value: string;
  category: string;
}

export function useLandingContent() {
  const [content, setContent] = useState<Record<string, Record<string, string>>>({});
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    try {
      const [contentRes, settingsRes] = await Promise.all([
        supabase.from('landing_content').select('*'),
        supabase.from('website_settings').select('*'),
      ]);

      if (contentRes.data) {
        const contentMap: Record<string, Record<string, string>> = {};
        contentRes.data.forEach((item: LandingContent) => {
          if (!contentMap[item.section]) {
            contentMap[item.section] = {};
          }
          contentMap[item.section][item.key] = item.value;
        });
        setContent(contentMap);
      }

      if (settingsRes.data) {
        const settingsMap: Record<string, string> = {};
        settingsRes.data.forEach((item: WebsiteSettings) => {
          settingsMap[item.key] = item.value;
        });
        setSettings(settingsMap);
      }
    } catch (error) {
      console.error('Error fetching landing content:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();

    // Subscribe to real-time changes
    try {
      const channel = supabase
        .channel('landing_content_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'landing_content',
          },
          () => {
            fetchContent();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'website_settings',
          },
          () => {
            fetchContent();
          }
        )
        .subscribe();

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch (err) {
          console.error('Error removing channel:', err);
        }
      };
    } catch (err) {
      console.error('Error setting up realtime subscription:', err);
    }
  }, [fetchContent]);

  const getContent = (section: string, key: string, defaultValue = '') => {
    return content[section]?.[key] || defaultValue;
  };

  const getSetting = (key: string, defaultValue = '') => {
    return settings[key] || defaultValue;
  };

  return {
    content,
    settings,
    loading,
    getContent,
    getSetting,
    refetch: fetchContent,
  };
}
