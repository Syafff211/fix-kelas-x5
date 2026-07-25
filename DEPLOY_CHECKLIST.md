# 🚀 Deploy Checklist - Fix Client-Side Error

## ✅ Step 1: Check Environment Variables (PALING PENTING!)

Buka **Vercel Dashboard → Project → Settings → Environment Variables**

Pastikan SEMUA ini ada untuk **Production**:

| Variable | Required | Example |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ YES | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ YES | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ YES | `eyJhbGci...` |
| `DATABASE_URL` | ✅ YES | `postgresql://...` |
| `DIRECT_URL` | ✅ YES | `postgresql://...` |

**Kalau ada yang hilang:**
1. Klik **Add New**
2. Paste variable name & value
3. Select **Production**
4. Click **Save**

## ✅ Step 2: Redeploy After Adding Env Vars

Setelah tambah env vars:
1. Go to **Deployments** tab
2. Click **⋮** (3 dots) on latest deployment
3. Click **Redeploy**
4. Wait for build to complete

## ✅ Step 3: Check Browser Console

Buka website → Tekan **F12** → Tab **Console**

**Kalau masih error:**
- Screenshot error message
- Kirim ke saya untuk debug

**Kalau ada warning "Missing Supabase environment variables":**
- Artinya env vars belum ter-set di Vercel
- Kembali ke Step 1

## ✅ Step 4: Push Latest Code Updates

Saya sudah update 3 file untuk better error handling:

```bash
cd x5-sman1-purbalingga
git add src/lib/supabase/client.ts
git add src/hooks/useLandingContent.ts
git add src/hooks/useRealtimeNotifications.ts
git commit -m "fix: add error handling for Supabase client and hooks"
git push
```

## ✅ Step 5: Test After Deploy

Setelah deploy selesai:

1. **Landing Page** → Should load without error
2. **Admin Login** → Should work
3. **Student Login** → Should work
4. **Dark Mode** → Click toggle, should change theme
5. **Notifications** → Should show dropdown

## 🐛 Common Errors & Solutions

### Error: "Missing Supabase environment variables"
**Solution:** Add env vars di Vercel (Step 1)

### Error: "Cannot read property 'channel' of undefined"
**Solution:** Push latest code dengan error handling (Step 4)

### Error: "Module not found"
**Solution:** 
```bash
npm install
git add package*.json
git commit -m "fix: update dependencies"
git push
```

### Error: "Application error: a client-side exception has occurred"
**Solution:** 
1. Check browser console (F12)
2. Screenshot error
3. Verify env vars di Vercel
4. Redeploy

## ✅ Success Checklist

- [ ] All 5 env vars added di Vercel
- [ ] Redeploy completed successfully
- [ ] Landing page loads without error
- [ ] Can login as admin
- [ ] Can login as student
- [ ] Dark mode toggle works
- [ ] Notifications dropdown works
- [ ] Landing CMS updates appear real-time

---

**Last Updated:** 2026-07-23
**Status:** Ready to Deploy
