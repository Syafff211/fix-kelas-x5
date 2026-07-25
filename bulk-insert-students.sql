-- ===== BULK INSERT STUDENTS =====
-- Jalankan ini di Supabase SQL Editor

-- Insert students ke profiles table
-- Note: user_id akan di-set nanti saat auth user dibuat via API

INSERT INTO profiles (email, full_name, nisn, role, created_at, updated_at) VALUES
('alisha@gmail.com', 'Alisha Azaria Harviyani', '36010001', 'student', NOW(), NOW()),
('anindya@gmail.com', 'Anindya Putri Palupi', '36010002', 'student', NOW(), NOW()),
('ardian@gmail.com', 'Ardian Yusuf Firdaus', '36010003', 'student', NOW(), NOW()),
('auryn@gmail.com', 'Auryn Nila Oktaviani', '36010004', 'student', NOW(), NOW()),
('ayesha@gmail.com', 'Ayesha Safarrina Triono', '36010005', 'student', NOW(), NOW()),
('cahyaningtyas@gmail.com', 'Cahyaningtyas Ridho P', '36010006', 'student', NOW(), NOW()),
('callista@gmail.com', 'Callista Keisya Nathania', '36010007', 'student', NOW(), NOW()),
('defan@gmail.com', 'Defan Dwi Valdian', '36010008', 'student', NOW(), NOW()),
('erlangga@gmail.com', 'Erlangga Dwi Revanda', '36010009', 'student', NOW(), NOW()),
('faidah@gmail.com', 'Faidah Qurrota Aini', '36010010', 'student', NOW(), NOW()),
('farah@gmail.com', 'Farah Noviana', '36010011', 'student', NOW(), NOW()),
('hafidz@gmail.com', 'Hafidz Fadillah', '36010012', 'student', NOW(), NOW()),
('halwa@gmail.com', 'Halwa Qasdina Zalmya', '36010013', 'student', NOW(), NOW()),
('hanyfa@gmail.com', 'Hanyfa Trias Maharani', '36010014', 'student', NOW(), NOW()),
('harjuna@gmail.com', 'Harjuna Ilham Kesatria Utomo', '36010015', 'student', NOW(), NOW()),
('humam@gmail.com', 'Humam Asyrafi Zada', '36010016', 'student', NOW(), NOW()),
('khalisha@gmail.com', 'Khalisha Rizqina Salsabila', '36010017', 'student', NOW(), NOW()),
('maheswari@gmail.com', 'Maheswari Wangi Azyyati Ramadhani', '36010018', 'student', NOW(), NOW()),
('marhaeni@gmail.com', 'Marhaeni', '36010019', 'student', NOW(), NOW()),
('medina@gmail.com', 'Medina Rahma', '36010020', 'student', NOW(), NOW()),
('muh@gmail.com', 'Muh Bani Safi', '36010021', 'student', NOW(), NOW()),
('muhammad@gmail.com', 'Muhammad Alva Pratama', '36010022', 'student', NOW(), NOW()),
('muhammad2@gmail.com', 'Muhammad Syafiq', '36010023', 'student', NOW(), NOW()),
('nabil@gmail.com', 'Nabil Pratama', '36010024', 'student', NOW(), NOW()),
('natalia@gmail.com', 'Natalia Aprilia Rahmawati', '36010025', 'student', NOW(), NOW()),
('nizrina@gmail.com', 'Nizrina Wafaa Darma', '36010026', 'student', NOW(), NOW()),
('panji@gmail.com', 'Panji Pamungkas', '36010027', 'student', NOW(), NOW()),
('ringgo@gmail.com', 'Ringgo Prasetyo', '36010028', 'student', NOW(), NOW()),
('safitri@gmail.com', 'Safitri Kurnia Sari', '36010029', 'student', NOW(), NOW()),
('syafa@gmail.com', 'Syafa Putri Nabila', '36010030', 'student', NOW(), NOW()),
('timur@gmail.com', 'Timur Damar Langga', '36010031', 'student', NOW(), NOW()),
('ufairah@gmail.com', 'Ufairah Hana Sakhi', '36010032', 'student', NOW(), NOW()),
('yogi@gmail.com', 'Yogi Febrian', '36010033', 'student', NOW(), NOW()),
('yulita@gmail.com', 'Yulita Nur Andini', '36010034', 'student', NOW(), NOW()),
('zahra@gmail.com', 'Zahra Anggraeny', '36010035', 'student', NOW(), NOW()),
('zahra2@gmail.com', 'Zahra Dewi Adha', '36010036', 'student', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Verify
SELECT COUNT(*) as total_students FROM profiles WHERE role = 'student';
SELECT email, full_name, nisn FROM profiles WHERE role = 'student' ORDER BY full_name;
