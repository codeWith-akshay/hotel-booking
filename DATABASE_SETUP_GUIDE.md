# Database Setup Guide

## Problem
Your Neon database at `ep-young-wave-adg10hd0-pooler.c-2.us-east-1.aws.neon.tech` is unreachable.

## Solution: Get New Connection String

### Option 1: Neon (Recommended - Free Tier)

1. **Go to**: https://console.neon.tech/
2. **Sign in** with your account
3. **Check your project**:
   - If it exists but is paused → Click "Resume" to wake it up
   - If it doesn't exist → Create a new project
4. **Get connection string**:
   - Go to your project dashboard
   - Click "Connection Details"
   - Copy the **Pooled Connection** string (not Direct)
   - It should look like: `postgresql://user:pass@ep-xxxxx-pooler.c-2.us-east-1.aws.neon.tech/dbname?sslmode=require`
5. **Update `.env` file**:
   ```env
   DATABASE_URL="your_new_connection_string_here"
   ```

### Option 2: Supabase (Alternative - Free Tier)

1. **Go to**: https://supabase.com/
2. **Sign in** or create account
3. **Create new project**:
   - Set project name
   - Set database password (save it!)
   - Choose region (us-east-1)
4. **Get connection string**:
   - Go to Settings → Database
   - Copy "Connection Pooling" string
   - Use "Transaction" mode
5. **Update `.env` file**

### Option 3: Local PostgreSQL

If you have PostgreSQL installed locally:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/hotel_booking?schema=public"
```

## After Updating .env

1. **Stop your dev server** (Ctrl+C)
2. **Push schema to database**:
   ```bash
   npx prisma db push
   ```
3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```
4. **Seed database** (optional):
   ```bash
   npm run db:seed
   ```
5. **Restart dev server**:
   ```bash
   npm run dev
   ```

## For Vercel Deployment

After getting new connection string:

1. **Go to**: https://vercel.com/
2. **Your project** → Settings → Environment Variables
3. **Add/Update**:
   - `DATABASE_URL` = your new connection string
   - `JWT_ACCESS_SECRET` = any random 32+ character string
   - `JWT_REFRESH_SECRET` = different random 32+ character string
4. **Redeploy** from Vercel dashboard

## Generate Secure JWT Secrets

Run in terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run twice to get two different secrets.
