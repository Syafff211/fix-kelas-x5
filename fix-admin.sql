-- ====== FIX ADMIN ROLE & STORAGE ======
-- Jalankan ini di Supabase SQL Editor

-- 1. Fix role admin (ubah email sesuai yang kamu pakai)
UPDATE profiles SET role = 'admin', full_name = 'Super Admin' WHERE email = 'admin@x5sman1.com';

-- 2. Kalau belum ada profile, buat manual (ganti user_id dengan UUID dari auth.users)
-- Cek dulu: SELECT id, email FROM auth.users;
-- Lalu jalankan:
-- INSERT INTO profiles (user_id, email, full_name, role)
-- SELECT id, email, 'Super Admin', 'admin' FROM auth.users WHERE email = 'admin@x5sman1.com'
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin', full_name = 'Super Admin';

-- 3. Buat storage buckets (kalau belum ada)
INSERT INTO storage.buckets (id, name, public) VALUES
('profile-images', 'profile-images', true),
('gallery', 'gallery', true),
('materials', 'materials', true),
('assignments', 'assignments', true),
('medical-certificates', 'medical-certificates', false),
('landing-assets', 'landing-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Verifikasi
SELECT '=== PROFILES ===' as info;
SELECT id, email, full_name, role FROM profiles;

SELECT '=== STORAGE BUCKETS ===' as info;
SELECT id, name, public FROM storage.buckets;

SELECT '=== TABLES ===' as info;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
