-- ===== CHECK & ENABLE REALTIME SAFELY =====
-- Jalankan ini di Supabase SQL Editor

-- 1. Cek table mana yang sudah di-enable
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- 2. Enable realtime untuk tables yang diperlukan (akan skip yang sudah ada)
DO $$
BEGIN
  -- landing_content
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'landing_content'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE landing_content;
    RAISE NOTICE 'Added landing_content to supabase_realtime';
  ELSE
    RAISE NOTICE 'landing_content already in supabase_realtime';
  END IF;

  -- website_settings
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'website_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE website_settings;
    RAISE NOTICE 'Added website_settings to supabase_realtime';
  ELSE
    RAISE NOTICE 'website_settings already in supabase_realtime';
  END IF;

  -- notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    RAISE NOTICE 'Added notifications to supabase_realtime';
  ELSE
    RAISE NOTICE 'notifications already in supabase_realtime';
  END IF;

  -- announcements
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'announcements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
    RAISE NOTICE 'Added announcements to supabase_realtime';
  ELSE
    RAISE NOTICE 'announcements already in supabase_realtime';
  END IF;
END $$;

-- 3. Verifikasi hasil
SELECT 'Realtime setup complete!' as status;
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('landing_content', 'website_settings', 'notifications', 'announcements')
ORDER BY tablename;
