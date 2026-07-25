-- ====== BAGIAN 3: BUAT AKUN ADMIN ======
-- Jalankan ini SETELAH Bagian 1 & 2 berhasil
-- Ganti email dan password sesuai keinginan kamu!

-- Cara termudah: Buat user via Supabase Dashboard dulu, lalu set role admin

-- ATAU jalankan SQL ini untuk buat admin langsung:
-- Pastikan email belum terdaftar di auth.users

-- Hapus admin lama kalau ada (opsional)
-- DELETE FROM auth.users WHERE email = 'admin@x5sman1.com';

-- Buat admin user baru
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@x5sman1.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Super Admin", "role": "admin"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);
