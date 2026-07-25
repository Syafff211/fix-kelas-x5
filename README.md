# X-5 SMAN 1 Purbalingga - Premium Digital Classroom Platform

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e)

**Platform manajemen kelas digital premium dengan desain Apple-quality dan fitur enterprise-grade**

[Demo](#demo) • [Fitur](#fitur) • [Instalasi](#instalasi) • [Deployment](#deployment)

</div>

---

## ✨ Fitur Utama

### 🎨 Landing Page Premium
- Hero section dengan animasi crystal 3D (Three.js)
- Particles background dengan mouse glow effect
- Glassmorphism design dengan gradient orbs
- Fully responsive dengan smooth animations
- **CMS terintegrasi** - semua konten editable dari admin panel

### 🔐 Authentication & Authorization
- Supabase Auth dengan JWT
- 2 Role: Super Admin & Student
- Row Level Security (RLS) untuk keamanan data
- Protected routes dengan middleware
- Remember me & forgot password

### 📊 Dashboard Siswa
- **Kehadiran** - Absensi dengan upload surat dokter (sakit)
- **Tugas** - Upload jawaban, tracking deadline
- **Materi** - Akses PDF, PPT, video pembelajaran
- **Nilai** - Grafik performa akademik
- **Galeri** - Foto & video kegiatan kelas
- **Jadwal** - Calendar dengan event提醒
- **Pesan** - Chat realtime antar siswa
- **Profil** - Edit informasi personal

### 🛡️ Super Admin Panel
- **Full Control** - Akses semua fitur tanpa batasan
- **Manage Students** - CRUD data siswa
- **Manage Attendance** - Approval kehadiran & sertifikat
- **Manage Assignments** - Buat & kelola tugas
- **Manage Grades** - Input & update nilai
- **Manage Gallery** - Upload foto & video
- **Manage Announcements** - Pengumuman dengan scheduling
- **Landing Page CMS** - Edit semua section tanpa coding
- **Settings** - Theme, SEO, analytics, backup

### 🎯 Teknologi Modern
- **Next.js 15** (App Router) + React 19
- **TypeScript** untuk type safety
- **Tailwind CSS v4** dengan custom design system
- **Framer Motion** untuk animasi smooth
- **GSAP** untuk advanced animations
- **Three.js** untuk 3D crystal effects
- **Zustand** untuk state management
- **TanStack Query** untuk data fetching
- **React Hook Form** + **Zod** untuk form validation
- **Supabase** untuk backend (Auth, Database, Storage, Realtime)

### 🎨 Design System
- Dark theme luxury dengan glassmorphism
- Floating crystal 3D objects
- Animated gradient backgrounds
- Mouse glow & parallax effects
- Premium typography (Inter)
- Smooth page transitions
- Micro-interactions
- Fully responsive (mobile-first)

---

## 🚀 Instalasi

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account ([daftar gratis](https://supabase.com))

### 1. Clone & Install

```bash
cd x5-sman1-purbalingga
npm install
```

### 2. Setup Supabase

1. Buat project baru di [Supabase Dashboard](https://app.supabase.com)
2. Copy credentials dari Settings > API:
   - Project URL
   - anon/public key
   - service_role key
3. Buka SQL Editor di Supabase Dashboard
4. Copy & paste isi file `prisma/supabase.sql`
5. Klik **Run** untuk execute semua query

### 3. Setup Environment Variables

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=your-jwt-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

**Cara mendapatkan DATABASE_URL:**
1. Settings > Database > Connection string
2. Pilih **Pooler** atau **Direct** connection
3. Replace `[PASSWORD]` dengan password database Anda

### 4. Generate Prisma Client

```bash
npm run db:generate
```

### 5. Create Admin User

Jalankan script ini di Supabase SQL Editor untuk membuat admin pertama:

```sql
-- Ganti email dan password sesuai kebutuhan
SELECT auth.sign_up(
  email := 'admin@sman1purbalingga.sch.id',
  password := 'admin123',
  options := jsonb_build_object(
    'data', jsonb_build_object(
      'full_name', 'Super Admin',
      'role', 'admin'
    )
  )
);
```

### 6. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## 🚢 Deployment ke Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Push code ke GitHub/GitLab
2. Login ke [Vercel](https://vercel.com)
3. Klik **New Project**
4. Import repository
5. Configure environment variables (sama seperti `.env.local`)
6. Klik **Deploy**

### Option 2: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Post-Deployment Checklist

- [ ] Set semua environment variables di Vercel Dashboard
- [ ] Verify Supabase connection
- [ ] Test login dengan admin account
- [ ] Test student login
- [ ] Verify file uploads work
- [ ] Check realtime notifications
- [ ] Test landing page CMS

---

## 📁 Struktur Project

```
x5-sman1-purbalingga/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (landing)/         # Landing page routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Student dashboard
│   │   ├── admin/             # Admin panel
│   │   ├── api/               # API routes
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── layout/            # Layout components
│   │   ├── landing/           # Landing page sections
│   │   ├── dashboard/         # Dashboard components
│   │   ├── admin/             # Admin components
│   │   └── providers/         # Context providers
│   ├── lib/
│   │   ├── supabase/          # Supabase clients
│   │   └── utils.ts           # Utility functions
│   ├── hooks/                 # Custom React hooks
│   ├── store/                 # Zustand stores
│   ├── types/                 # TypeScript types
│   └── middleware.ts          # Auth middleware
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── supabase.sql           # Supabase SQL setup
├── public/                    # Static assets
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── vercel.json
└── README.md
```

---

## 🗄️ Database Schema

### Tables
- `profiles` - User profiles (admin & students)
- `attendance` - Kehadiran dengan status (present, permission, sick, absent)
- `attendance_files` - Surat dokter untuk status sakit
- `assignments` - Tugas dari admin
- `assignment_submissions` - Jawaban siswa
- `grades` - Nilai (daily, assignment, mid_semester, final_semester)
- `materials` - Materi pembelajaran
- `announcements` - Pengumuman dengan pin & scheduling
- `gallery` & `gallery_albums` - Foto & video
- `calendar_events` - Event kalender
- `messages` - Chat antar user
- `notifications` - Notifikasi realtime
- `landing_content` - CMS untuk landing page
- `website_settings` - Pengaturan website
- `activity_logs` - Log aktivitas admin
- `storage_files` - Metadata file storage

### Storage Buckets
- `profile-images` - Foto profil (public)
- `gallery` - Foto & video galeri (public)
- `materials` - Materi pembelajaran (authenticated)
- `assignments` - File tugas (authenticated)
- `medical-certificates` - Surat dokter (private)
- `landing-assets` - Asset landing page (public)

---

## 🔒 Security Features

- **Supabase Auth** - JWT-based authentication
- **Row Level Security (RLS)** - Fine-grained access control
- **Middleware Protection** - Route-level auth checks
- **RBAC** - Role-based access (admin vs student)
- **Input Validation** - Zod schema validation
- **XSS Protection** - React's built-in escaping
- **CSRF Protection** - Supabase's built-in protection
- **Secure Cookies** - HttpOnly, Secure, SameSite
- **Rate Limiting** - Supabase's built-in rate limiting

---

## 🎨 Customization

### Change Theme Colors

Edit `src/app/globals.css`:

```css
@theme {
  --color-primary: #6366f1;      /* Change primary color */
  --color-background: #0a0a0f;   /* Change background */
  /* ... other colors */
}
```

### Modify Landing Page Content

Semua konten landing page dapat diedit dari **Admin Panel > Landing Page CMS** tanpa menyentuh code.

### Add New Features

1. Buat page baru di `src/app/`
2. Tambahkan component di `src/components/`
3. Update types di `src/types/`
4. Tambahkan API route jika diperlukan di `src/app/api/`

---

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with sample data
```

---

## 🤝 Kontribusi

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Shadcn/UI](https://ui.shadcn.com/) - UI components
- [Three.js](https://threejs.org/) - 3D graphics
- [Vercel](https://vercel.com/) - Deployment platform

---

## 📞 Support

Untuk pertanyaan atau bantuan:
- Email: x5@sman1purbalingga.sch.id
- Website: www.sman1purbalingga.sch.id

---

<div align="center">

**Made with ❤️ by Kelas X-5 SMAN 1 Purbalingga**

⭐ Star this repo if you find it helpful!

</div>
