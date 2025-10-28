# URGENT: Fix Render Build Command

## 🔴 The Problem
Render is using an **old build command** from its dashboard that includes the invalid `--no-lint` flag:
```bash
pnpm install --frozen-lockfile --ignore-scripts && pnpm exec prisma generate && pnpm exec next build --no-lint || true
```

This causes the build to fail with: `error: unknown option '--no-lint'`

## ✅ Solution: Update Build Command in Render Dashboard

### **STEP 1: Go to Render Dashboard**
1. Visit: https://dashboard.render.com
2. Select your **hotel-booking** service
3. Click **Settings** in the left sidebar

### **STEP 2: Update Build Command**
1. Scroll to **Build & Deploy** section
2. Find **Build Command** field
3. **REPLACE** the old command with:

```bash
pnpm install --frozen-lockfile && pnpm exec prisma generate && pnpm exec next build
```

**Important**: Remove the `--no-lint` and `|| true` parts!

### **STEP 3: Save and Deploy**
1. Click **Save Changes** button
2. Go to **Manual Deploy** tab
3. Click **Deploy latest commit** button
4. Monitor the build logs

## 📋 Correct Commands

### Build Command (Use This!)
```bash
pnpm install --frozen-lockfile && pnpm exec prisma generate && pnpm exec next build
```

### Start Command (Should Already Be Correct)
```bash
pnpm start
```

## 🔍 What to Look For

### ✅ Successful Build Output
```
✔ Generated Prisma Client
   ▲ Next.js 16.0.0
 ✓ Compiled successfully
 ✓ Creating an optimized production build
 ✓ Finalizing page optimization
   ▲ Next.js 16.0.0
   - Local:        http://localhost:10000
 ✓ Starting...
 ✓ Ready
```

### ❌ Failed Build (Old Command Still There)
```
error: unknown option '--no-lint'
Error: Could not find a production build in the '.next' directory
```

## 🎯 Alternative Method: Use Render Blueprint

If manual update doesn't work, delete and recreate the service:

1. **Delete Current Service**:
   - Go to service settings
   - Scroll to bottom
   - Click "Delete Service"

2. **Create New Service from Blueprint**:
   - Click "New +" → "Blueprint"
   - Connect your GitHub repo
   - Render will read `render.yaml` automatically
   - Click "Apply"

## 🔧 Environment Variables Checklist

Make sure these are set in Render Dashboard → Environment:

### **Required Variables**
- [ ] `DATABASE_URL` - Your Neon PostgreSQL URL
  ```
  postgresql://user:password@host.neon.tech/database?sslmode=require
  ```

- [ ] `NEXTAUTH_URL` - Your Render service URL
  ```
  https://hotel-book-ppjj.onrender.com
  ```

- [ ] `NEXT_PUBLIC_BASE_URL` - Same as NEXTAUTH_URL
  ```
  https://hotel-book-ppjj.onrender.com
  ```

- [ ] `NEXTAUTH_SECRET` - Generate with:
  ```bash
  openssl rand -base64 32
  ```

### **Optional Variables** (If Using Features)
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `IRCA_API_KEY`

## 🚨 Common Mistakes to Avoid

1. ❌ **Don't use** `--no-lint` (doesn't exist in Next.js 16)
2. ❌ **Don't use** `|| true` (hides real errors)
3. ❌ **Don't use** `--ignore-scripts` with pnpm install
4. ✅ **Do use** simple, standard commands

## 📝 Quick Copy-Paste

### For Render Dashboard Build Command Field:
```
pnpm install --frozen-lockfile && pnpm exec prisma generate && pnpm exec next build
```

### For Render Dashboard Start Command Field:
```
pnpm start
```

## 🔄 After Fixing

1. **Clear Build Cache**: Settings → Build & Deploy → "Clear build cache"
2. **Manual Deploy**: Manual Deploy → "Deploy latest commit"
3. **Monitor Logs**: Watch for successful build
4. **Test URL**: Visit https://hotel-book-ppjj.onrender.com

## 💡 Why This Happened

The build command was likely set when the service was first created, before Next.js 16 was released. The `--no-lint` flag existed in older versions but was removed in Next.js 16.

The YAML files in your repo are correct, but Render dashboard settings override them. You must update the dashboard manually.

## 📞 Need Help?

If still failing after updating the build command:

1. **Check logs** for the exact error
2. **Verify** environment variables are set
3. **Try** deleting and recreating the service
4. **Contact** Render support with build logs

---

**Status**: 🔴 Action Required  
**Priority**: HIGH  
**Time to Fix**: ~5 minutes  
**Next Deploy**: Should succeed after update
