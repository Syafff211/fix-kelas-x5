-- ====== BAGIAN 2: TRIGGER, RLS, INDEXES, SEED ======
-- Jalankan ini SETELAH Bagian 1 berhasil

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance;
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_materials_updated_at ON materials;
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_landing_content_updated_at ON landing_content;
CREATE TRIGGER update_landing_content_updated_at BEFORE UPDATE ON landing_content FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_website_settings_updated_at ON website_settings;
CREATE TRIGGER update_website_settings_updated_at BEFORE UPDATE ON website_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can do everything" ON profiles;
DROP POLICY IF EXISTS "Students can view own attendance" ON attendance;
DROP POLICY IF EXISTS "Admin can manage attendance" ON attendance;
DROP POLICY IF EXISTS "View attendance files" ON attendance_files;
DROP POLICY IF EXISTS "Admin manage attendance files" ON attendance_files;
DROP POLICY IF EXISTS "Everyone can view assignments" ON assignments;
DROP POLICY IF EXISTS "Admin can manage assignments" ON assignments;
DROP POLICY IF EXISTS "Students can view own submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Students can create submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Admin can manage submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Students can view own grades" ON grades;
DROP POLICY IF EXISTS "Admin can manage grades" ON grades;
DROP POLICY IF EXISTS "Everyone can view materials" ON materials;
DROP POLICY IF EXISTS "Admin can manage materials" ON materials;
DROP POLICY IF EXISTS "Everyone can view announcements" ON announcements;
DROP POLICY IF EXISTS "Admin can manage announcements" ON announcements;
DROP POLICY IF EXISTS "Everyone can view gallery" ON gallery;
DROP POLICY IF EXISTS "Everyone can view albums" ON gallery_albums;
DROP POLICY IF EXISTS "Admin can manage gallery" ON gallery;
DROP POLICY IF EXISTS "Admin can manage albums" ON gallery_albums;
DROP POLICY IF EXISTS "Everyone can view events" ON calendar_events;
DROP POLICY IF EXISTS "Admin can manage events" ON calendar_events;
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Admin can manage notifications" ON notifications;
DROP POLICY IF EXISTS "Everyone can view landing content" ON landing_content;
DROP POLICY IF EXISTS "Admin can manage landing content" ON landing_content;
DROP POLICY IF EXISTS "Everyone can view settings" ON website_settings;
DROP POLICY IF EXISTS "Admin can manage settings" ON website_settings;
DROP POLICY IF EXISTS "Admin can view activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Admin can manage activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Admin can manage storage files" ON storage_files;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin can do everything" ON profiles FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Students can view own attendance" ON attendance FOR SELECT USING (student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can manage attendance" ON attendance FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "View attendance files" ON attendance_files FOR SELECT USING (true);
CREATE POLICY "Admin manage attendance files" ON attendance_files FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Everyone can view assignments" ON assignments FOR SELECT USING (true);
CREATE POLICY "Admin can manage assignments" ON assignments FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Students can view own submissions" ON assignment_submissions FOR SELECT USING (student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Students can create submissions" ON assignment_submissions FOR INSERT WITH CHECK (student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admin can manage submissions" ON assignment_submissions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Students can view own grades" ON grades FOR SELECT USING (student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can manage grades" ON grades FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Everyone can view materials" ON materials FOR SELECT USING (true);
CREATE POLICY "Admin can manage materials" ON materials FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Everyone can view announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Admin can manage announcements" ON announcements FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Everyone can view gallery" ON gallery FOR SELECT USING (true);
CREATE POLICY "Everyone can view albums" ON gallery_albums FOR SELECT USING (true);
CREATE POLICY "Admin can manage gallery" ON gallery FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can manage albums" ON gallery_albums FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Everyone can view events" ON calendar_events FOR SELECT USING (true);
CREATE POLICY "Admin can manage events" ON calendar_events FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR receiver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id IS NULL OR user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admin can manage notifications" ON notifications FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Everyone can view landing content" ON landing_content FOR SELECT USING (true);
CREATE POLICY "Admin can manage landing content" ON landing_content FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Everyone can view settings" ON website_settings FOR SELECT USING (true);
CREATE POLICY "Admin can manage settings" ON website_settings FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can view activity logs" ON activity_logs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can manage activity logs" ON activity_logs FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can manage storage files" ON storage_files FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Seed landing content
INSERT INTO landing_content (section, key, value, value_type) VALUES
('hero', 'title', 'Kelas X-5 SMAN 1 Purbalingga', 'text'),
('hero', 'subtitle', 'Platform Digital Kelas Premium', 'text'),
('hero', 'description', 'Platform digital kelas premium untuk mengelola kehadiran, tugas, nilai, dan kegiatan kelas.', 'text'),
('about', 'vision', 'Menjadi kelas yang unggul dalam prestasi akademik dan non-akademik.', 'text'),
('about', 'motto', 'Bersama Kita Bisa, Bersama Kita Juara!', 'text'),
('footer', 'copyright', '2024 X-5 SMAN 1 Purbalingga. All rights reserved.', 'text')
ON CONFLICT (section, key) DO NOTHING;

-- Seed website settings
INSERT INTO website_settings (key, value, category) VALUES
('site_name', 'X-5 SMAN 1 Purbalingga', 'general'),
('accent_color', '#6366f1', 'theme'),
('dark_mode', 'true', 'theme'),
('particles_enabled', 'true', 'theme')
ON CONFLICT (key) DO NOTHING;

-- Enable realtime
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'announcements') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'attendance') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
    END IF;
END $$;
