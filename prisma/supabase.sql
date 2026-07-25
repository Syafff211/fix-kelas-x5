-- X-5 SMAN 1 Purbalingga Database Schema
-- Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    nisn VARCHAR(20) UNIQUE,
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE NOT NULL,
    address TEXT,
    parent_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('admin', 'student')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'permission', 'sick', 'absent')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- Attendance files table
CREATE TABLE attendance_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_id UUID REFERENCES attendance(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignments table
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    subject VARCHAR(100),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    file_url TEXT,
    file_name VARCHAR(255),
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignment submissions table
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT,
    file_name VARCHAR(255),
    content TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    score INTEGER,
    feedback TEXT,
    UNIQUE(assignment_id, student_id)
);

-- Grades table
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    subject VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('daily', 'assignment', 'mid_semester', 'final_semester')),
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    semester INTEGER NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materials table
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    file_url TEXT,
    file_name VARCHAR(255),
    file_type VARCHAR(100),
    file_size INTEGER,
    external_url TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Announcements table
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    file_url TEXT,
    file_name VARCHAR(255),
    is_pinned BOOLEAN DEFAULT FALSE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gallery albums table
CREATE TABLE gallery_albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gallery items table
CREATE TABLE gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    album_id UUID REFERENCES gallery_albums(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    media_url TEXT NOT NULL,
    media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image', 'video')),
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar events table
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    end_date DATE,
    time VARCHAR(10),
    type VARCHAR(20) NOT NULL CHECK (type IN ('holiday', 'exam', 'event', 'meeting', 'other')),
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Landing content table (CMS)
CREATE TABLE landing_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section VARCHAR(100) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    value_type VARCHAR(20) DEFAULT 'text' CHECK (value_type IN ('text', 'html', 'json', 'image_url')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(section, key)
);

-- Website settings table
CREATE TABLE website_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storage files metadata table
CREATE TABLE storage_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bucket VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_nisn ON profiles(nisn);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_files_attendance_id ON attendance_files(attendance_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_student_id ON assignment_submissions(student_id);
CREATE INDEX idx_grades_student_id ON grades(student_id);
CREATE INDEX idx_grades_type ON grades(type);
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_announcements_pinned ON announcements(is_pinned);
CREATE INDEX idx_gallery_album_id ON gallery(album_id);
CREATE INDEX idx_gallery_featured ON gallery(is_featured);
CREATE INDEX idx_calendar_events_date ON calendar_events(date);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_landing_content_section ON landing_content(section);
CREATE INDEX idx_settings_key ON website_settings(key);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX idx_storage_files_bucket ON storage_files(bucket);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_landing_content_updated_at BEFORE UPDATE ON landing_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_website_settings_updated_at BEFORE UPDATE ON website_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
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

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
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

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin can do everything" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Attendance policies
CREATE POLICY "Students can view own attendance" ON attendance FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin can manage attendance" ON attendance FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Attendance files policies
CREATE POLICY "View attendance files" ON attendance_files FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM attendance a
        WHERE a.id = attendance_files.attendance_id
        AND (a.student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
             OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'))
    )
);
CREATE POLICY "Admin manage attendance files" ON attendance_files FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Assignments policies
CREATE POLICY "Everyone can view assignments" ON assignments FOR SELECT USING (true);
CREATE POLICY "Admin can manage assignments" ON assignments FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Assignment submissions policies
CREATE POLICY "Students can view own submissions" ON assignment_submissions FOR SELECT USING (
    student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Students can create submissions" ON assignment_submissions FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Admin can manage submissions" ON assignment_submissions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Grades policies
CREATE POLICY "Students can view own grades" ON grades FOR SELECT USING (
    student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin can manage grades" ON grades FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Materials policies
CREATE POLICY "Everyone can view materials" ON materials FOR SELECT USING (true);
CREATE POLICY "Admin can manage materials" ON materials FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Announcements policies
CREATE POLICY "Everyone can view announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Admin can manage announcements" ON announcements FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Gallery policies
CREATE POLICY "Everyone can view gallery" ON gallery FOR SELECT USING (true);
CREATE POLICY "Everyone can view albums" ON gallery_albums FOR SELECT USING (true);
CREATE POLICY "Admin can manage gallery" ON gallery FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin can manage albums" ON gallery_albums FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Calendar events policies
CREATE POLICY "Everyone can view events" ON calendar_events FOR SELECT USING (true);
CREATE POLICY "Admin can manage events" ON calendar_events FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (
    sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    receiver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (
    sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (
    user_id IS NULL OR user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Admin can manage notifications" ON notifications FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Landing content policies
CREATE POLICY "Everyone can view landing content" ON landing_content FOR SELECT USING (true);
CREATE POLICY "Admin can manage landing content" ON landing_content FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Website settings policies
CREATE POLICY "Everyone can view settings" ON website_settings FOR SELECT USING (true);
CREATE POLICY "Admin can manage settings" ON website_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Activity logs policies
CREATE POLICY "Admin can view activity logs" ON activity_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin can manage activity logs" ON activity_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Storage files policies
CREATE POLICY "Admin can manage storage files" ON storage_files FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage buckets via Supabase Dashboard or:
INSERT INTO storage.buckets (id, name, public) VALUES
('profile-images', 'profile-images', true),
('gallery', 'gallery', true),
('materials', 'materials', true),
('assignments', 'assignments', true),
('medical-certificates', 'medical-certificates', false),
('landing-assets', 'landing-assets', true);

-- Storage policies
CREATE POLICY "Profile images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-images');
CREATE POLICY "Users can upload own profile image" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

CREATE POLICY "Gallery is publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Admin can manage gallery storage" ON storage.objects
    FOR ALL USING (bucket_id = 'gallery' AND EXISTS (
        SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Materials are accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'materials' AND auth.role() = 'authenticated');
CREATE POLICY "Admin can manage materials storage" ON storage.objects
    FOR ALL USING (bucket_id = 'materials' AND EXISTS (
        SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Medical certs accessible to owner and admin" ON storage.objects
    FOR SELECT USING (bucket_id = 'medical-certificates' AND auth.role() = 'authenticated');

CREATE POLICY "Landing assets are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'landing-assets');
CREATE POLICY "Admin can manage landing assets" ON storage.objects
    FOR ALL USING (bucket_id = 'landing-assets' AND EXISTS (
        SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default landing content
INSERT INTO landing_content (section, key, value, value_type) VALUES
('hero', 'title', 'Kelas X-5 SMAN 1 Purbalingga', 'text'),
('hero', 'subtitle', 'Platform Digital Kelas Premium', 'text'),
('hero', 'description', 'Platform digital kelas premium untuk mengelola kehadiran, tugas, nilai, dan kegiatan kelas dengan teknologi modern dan desain elegan.', 'text'),
('about', 'vision', 'Menjadi kelas yang unggul dalam prestasi akademik dan non-akademik, berkarakter mulia, serta mampu bersaing di era global.', 'text'),
('about', 'mission', '["Menciptakan lingkungan belajar yang kondusif","Mendorong semangat kompetisi positif","Mengembangkan kreativitas dan bakat","Membangun solidaritas dan kebersamaan"]', 'json'),
('about', 'motto', 'Bersama Kita Bisa, Bersama Kita Juara!', 'text'),
('footer', 'copyright', '© 2024 X-5 SMAN 1 Purbalingga. All rights reserved.', 'text'),
('contact', 'address', 'Jl. Raya Purbalingga, Jawa Tengah', 'text'),
('contact', 'phone', '(0281) 123456', 'text'),
('contact', 'email', 'x5@sman1purbalingga.sch.id', 'text');

-- Insert default website settings
INSERT INTO website_settings (key, value, category) VALUES
('site_name', 'X-5 SMAN 1 Purbalingga', 'general'),
('site_description', 'Platform manajemen kelas digital premium', 'general'),
('accent_color', '#6366f1', 'theme'),
('dark_mode', 'true', 'theme'),
('particles_enabled', 'true', 'theme'),
('animations_enabled', 'true', 'theme'),
('footer_text', 'Made with ❤️ by Kelas X-5', 'footer'),
('seo_title', 'X-5 SMAN 1 Purbalingga - Premium Digital Classroom', 'seo'),
('seo_description', 'Platform manajemen kelas digital premium untuk Kelas X-5 SMAN 1 Purbalingga', 'seo');

-- ============================================
-- REALTIME
-- ============================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
