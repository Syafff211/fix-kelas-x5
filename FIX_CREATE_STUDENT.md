# 🚨 Fix: "Gagal Membuat Akun" Error

## ⚠️ Masalah Umum

Error "Gagal membuat akun: {}" biasanya karena **Supabase Auth settings** yang salah.

---

## ✅ Step 1: Fix Supabase Auth Settings (PALING PENTING!)

### 1. Buka Supabase Dashboard
- Login ke https://app.supabase.com
- Pilih project kamu

### 2. Go to Authentication Settings
- Klik **Authentication** di sidebar kiri
- Klik **Providers** di top menu
- Klik **Email**

### 3. Update Email Provider Settings

Pastikan settings ini:

```
✅ Enable Email provider: ON
✅ Confirm email: OFF  ← INI YANG PALING PENTING!
✅ Secure email change: OFF (optional)
✅ Secure password change: OFF (optional)
```

**Kenapa "Confirm email" harus OFF?**
- Kalau ON, user yang dibuat butuh email verification
- API kita tidak bisa auto-confirm tanpa email server
- Hasilnya: user created tapi tidak bisa login

### 4. Save Settings

Klik **Save** setelah update settings.

---

## 🔑 Step 2: Verify Service Role Key

### 1. Get Service Role Key
- Buka **Settings** → **API**
- Scroll ke **Project API keys**
- Copy **service_role** key (yang ada label "secret")

**Ciri-ciri service role key yang benar:**
- Panjang ~200+ karakter
- Start dengan `eyJ...`
- Ada text "service_role" di dalamnya (bisa di-decode di jwt.io)

### 2. Update di Vercel
- Buka Vercel → Project → Settings → Environment Variables
- Edit `SUPABASE_SERVICE_ROLE_KEY`
- Paste key yang baru (pastikan tidak ada spasi!)
- Save

### 3. Redeploy
- Go to Deployments
- Click ⋮ → Redeploy
- Wait ~2 menit

---

## 🚀 Step 3: Push Code Terbaru

```bash
cd x5-sman1-purbalingga
git add .
git commit -m "fix: improve create student API with better error handling"
git push
```

---

## 🧪 Step 4: Test dengan Instruksi Jelas

### Test Case: Tambah Student Baru

**Data:**
```
Nama: Test Student
Email: test.student@example.com
Password: test123456
NISN: 1234567890
```

**Expected Flow:**
1. Admin klik "Tambah Siswa"
2. Isi form dengan data di atas
3. Klik "Tambah Siswa"
4. Loading spinner muncul
5. Toast: "Siswa berhasil ditambahkan"
6. Modal close
7. Student muncul di list

### Verifikasi Student Bisa Login

1. Buka incognito window
2. Go to `/auth/login`
3. Login dengan:
   - Email: test.student@example.com
   - Password: test123456
4. Should redirect to `/dashboard`
5. Should see student dashboard

---

## 🐛 Debug Checklist

Kalau masih error, cek ini:

### 1. Browser Console (F12)
- Buka Console tab
- Cari error message
- Screenshot error

### 2. Vercel Logs
- Buka Vercel → Project → Logs
- Filter: `create student`
- Cari log dengan emoji (📝, 🔐, ✅, ❌)
- Screenshot log

### 3. Supabase Logs
- Buka Supabase → Logs → Auth
- Cari log saat create user
- Screenshot log

### 4. Network Tab
- Buka DevTools → Network tab
- Refresh page
- Klik "Tambah Siswa"
- Cari request ke `/api/admin/create-student`
- Click request → Response tab
- Screenshot response

---

## 📋 Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Gagal membuat akun: {}` | Supabase Auth settings salah | Turn OFF "Confirm email" |
| `Email sudah terdaftar` | Email sudah ada di database | Pakai email lain atau hapus user lama |
| `Server configuration error` | Service role key missing/invalid | Verify key di Vercel env vars |
| `User confirmed` | Email confirmation masih ON | Turn OFF di Supabase Auth settings |
| `Invalid API key` | Service role key salah | Copy ulang dari Supabase Dashboard |
| `No user data` | signUp failed silently | Check Supabase Auth logs |

---

## 🔍 Advanced Debug

### Check Supabase Auth Logs

1. Buka Supabase Dashboard
2. Go to **Logs** → **Auth**
3. Filter by time (last 5 minutes)
4. Look for:
   - `user_signup_requested` - API call received
   - `user_created` - User successfully created
   - `user_signup_failed` - Error occurred

### Test Service Role Key

Buat test endpoint untuk verify key:

```typescript
// src/app/api/test-service-role/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    userCount: data.users.length 
  });
}
```

Test dengan buka: `https://your-domain.com/api/test-service-role`

Expected: `{"success":true,"userCount":5}`

---

## ✅ Success Indicators

Kalau semua benar, kamu akan lihat:

### Browser Console
```
Creating student with data: { email: '...', full_name: '...', hasPassword: true }
Response status: 200
Response data: { success: true, message: '...', data: {...} }
```

### Vercel Logs
```
📝 Creating student: { email: '...', full_name: '...' }
🔐 Creating auth user...
✅ Auth user created: xxx-xxx-xxx
📧 Confirming email...
⏳ Waiting for profile creation...
📝 Updating profile...
✅ Profile updated: xxx-xxx-xxx
```

### Supabase Database
- `auth.users` table: New user with email
- `profiles` table: New profile with user_id linked

---

## 🆘 Still Not Working?

Kalau masih error setelah semua step di atas:

1. **Screenshot semua ini:**
   - Supabase Auth settings (Email provider)
   - Vercel environment variables (service role key)
   - Browser console error
   - Vercel logs
   - Supabase Auth logs

2. **Kirim ke saya:**
   - Semua screenshot di atas
   - Email yang dipakai untuk test
   - Exact error message

3. **Saya akan bantu debug lebih lanjut**

---

## 📚 Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase Admin API](https://supabase.com/docs/reference/javascript/auth-admin)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Last Updated:** 2026-07-23  
**Status:** Ready to Debug
