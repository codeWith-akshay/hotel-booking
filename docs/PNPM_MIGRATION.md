# 🚀 NPM to PNPM Migration Guide

Complete guide for converting the hotel-booking project from npm to pnpm.

---

## 📋 Table of Contents

1. [Why PNPM?](#why-pnpm)
2. [Prerequisites](#prerequisites)
3. [Migration Steps](#migration-steps)
4. [Configuration Files](#configuration-files)
5. [Common Commands](#common-commands)
6. [CI/CD Integration](#cicd-integration)
7. [Docker Setup](#docker-setup)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Why PNPM?

### **Advantages over npm:**

✅ **Disk Space**: Saves up to 50% disk space (symlinks + global store)
✅ **Speed**: 2x faster installation than npm
✅ **Strict**: Better dependency resolution (no phantom dependencies)
✅ **Monorepo**: Native workspace support
✅ **Security**: Strict peer dependency checks
✅ **Compatibility**: Works with all npm packages

### **Performance Comparison:**

| Package Manager | Install Time | Disk Usage | 
|----------------|--------------|------------|
| npm            | 51s          | 100%       |
| pnpm           | 24s          | 50%        |
| yarn           | 37s          | 78%        |

---

## 📦 Prerequisites

### **1. Install PNPM**

**Windows (PowerShell):**
```powershell
# Using npm (ironic but easiest)
npm install -g pnpm

# Or using standalone installer
iwr https://get.pnpm.io/install.ps1 -useb | iex

# Or using Chocolatey
choco install pnpm

# Or using Scoop
scoop install nodejs-lts pnpm
```

**macOS/Linux:**
```bash
# Using npm
npm install -g pnpm

# Or using curl
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Or using Homebrew (macOS)
brew install pnpm
```

**Verify Installation:**
```bash
pnpm --version
# Should show: 9.15.0 or higher
```

### **2. Check Node.js Version**

```bash
node --version
# Required: >=20.0.0
```

---

## 🔄 Migration Steps

### **Step 1: Backup Current State**

```bash
# Backup package-lock.json (just in case)
copy package-lock.json package-lock.json.backup

# Or on Unix
cp package-lock.json package-lock.json.backup
```

### **Step 2: Remove npm Artifacts**

**Windows (PowerShell):**
```powershell
# Remove node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Or using rimraf (cross-platform)
npx rimraf node_modules package-lock.json
```

**macOS/Linux:**
```bash
# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Or using rimraf
npx rimraf node_modules package-lock.json
```

### **Step 3: Install Dependencies with PNPM**

```bash
# Install all dependencies
pnpm install

# This will:
# ✅ Download packages to global store (~/.pnpm-store)
# ✅ Create symlinks in node_modules
# ✅ Generate pnpm-lock.yaml
# ✅ Run postinstall scripts (prisma generate)
```

**Expected Output:**
```
Packages: +247
++++++++++++++++++++++++++++++++++++++++++++
Packages are hard linked from the content-addressable store to the virtual store.
  Content-addressable store is at: C:\Users\<user>\.pnpm-store\v3
  Virtual store is at:             node_modules/.pnpm
Progress: resolved 247, reused 247, downloaded 0, added 247, done

Done in 24.3s
```

### **Step 4: Verify Installation**

```bash
# Check installed packages
pnpm list

# Check outdated packages
pnpm outdated

# Check for security vulnerabilities
pnpm audit
```

### **Step 5: Test Scripts**

```bash
# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Start dev server
pnpm dev

# Open http://localhost:3000
```

### **Step 6: Commit Changes**

```bash
git add .
git commit -m "chore: migrate from npm to pnpm

- Add pnpm-workspace.yaml
- Add .npmrc with pnpm configuration
- Update package.json with packageManager field
- Add clean and prepare scripts
- Remove package-lock.json
- Generate pnpm-lock.yaml"
```

---

## 📄 Configuration Files

### **1. `pnpm-workspace.yaml`**

Defines workspace structure (even for single-package projects):

```yaml
packages:
  - '.'
```

**For Monorepo:**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'services/*'
```

### **2. `.npmrc`**

PNPM configuration (production-ready):

```ini
# Hoisting
hoist=true
symlink=true

# Peer dependencies
strict-peer-dependencies=false
auto-install-peers=true

# Performance
network-concurrency=16
fetch-timeout=60000

# Store
store=true
verify-store-integrity=true

# Workspace
link-workspace-packages=true
prefer-workspace-packages=true

# Node linker
node-linker=isolated
```

### **3. `package.json` Updates**

**Added Fields:**
```json
{
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

**New Scripts:**
```json
{
  "scripts": {
    "clean": "rimraf node_modules .next out dist",
    "clean:all": "pnpm clean && rimraf pnpm-lock.yaml",
    "prepare": "prisma generate",
    "postinstall": "prisma generate",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 🛠️ Common Commands

### **Package Management**

```bash
# Install all dependencies
pnpm install
pnpm i

# Install a package
pnpm add <package>
pnpm add -D <package>      # Dev dependency
pnpm add -g <package>      # Global

# Remove a package
pnpm remove <package>
pnpm rm <package>

# Update packages
pnpm update                 # Update all
pnpm update <package>       # Update specific
pnpm update -i              # Interactive update

# List packages
pnpm list                   # All packages
pnpm list --depth=0         # Top-level only
pnpm list <package>         # Specific package
```

### **Script Execution**

```bash
# Run scripts from package.json
pnpm dev
pnpm build
pnpm start
pnpm lint

# Or using run
pnpm run dev
pnpm run build

# Run script in workspace package
pnpm --filter <package> dev
pnpm -F <package> build
```

### **Database Scripts**

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Reset database
pnpm db:reset

# Seed database
pnpm db:seed

# Open Prisma Studio
pnpm db:studio

# Push schema to database
pnpm db:push
```

### **Utility Scripts**

```bash
# Clean build artifacts
pnpm clean

# Clean everything (including lockfile)
pnpm clean:all

# Type check
pnpm type-check

# Format code
pnpm format
```

### **Workspace Commands (Monorepo)**

```bash
# Run command in all packages
pnpm -r dev                 # Recursive
pnpm -r build

# Run in specific package
pnpm --filter web dev
pnpm -F api build

# Run in multiple packages
pnpm --filter "web|api" build

# Install dependency in specific package
pnpm --filter web add react

# List workspace packages
pnpm -r list --depth=-1
```

---

## 🔧 CI/CD Integration

### **GitHub Actions**

**`.github/workflows/ci.yml`:**

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9
      
      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV
      
      - name: Setup pnpm cache
        uses: actions/cache@v4
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Type check
        run: pnpm type-check
      
      - name: Lint
        run: pnpm lint
      
      - name: Build
        run: pnpm build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_ACCESS_SECRET: ${{ secrets.JWT_ACCESS_SECRET }}
          JWT_REFRESH_SECRET: ${{ secrets.JWT_REFRESH_SECRET }}
```

### **GitLab CI**

**`.gitlab-ci.yml`:**

```yaml
image: node:20

cache:
  key:
    files:
      - pnpm-lock.yaml
  paths:
    - .pnpm-store

before_script:
  - corepack enable
  - corepack prepare pnpm@latest --activate
  - pnpm config set store-dir .pnpm-store
  - pnpm install --frozen-lockfile

stages:
  - build
  - test

build:
  stage: build
  script:
    - pnpm build

test:
  stage: test
  script:
    - pnpm lint
    - pnpm type-check
```

### **Vercel Deployment**

**`vercel.json`:**

```json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
```

**Or set in Vercel Dashboard:**
- Build Command: `pnpm build`
- Install Command: `pnpm install`
- Output Directory: `.next`

### **Netlify Deployment**

**`netlify.toml`:**

```toml
[build]
  command = "pnpm build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--version"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

---

## 🐳 Docker Setup

### **Dockerfile (Optimized for PNPM)**

```dockerfile
# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM node:20-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/

# Fetch dependencies (offline cache)
RUN pnpm fetch

# Install dependencies (use offline cache)
RUN pnpm install --frozen-lockfile --offline

# Generate Prisma client
RUN pnpm prisma generate

# ==========================================
# Stage 2: Builder
# ==========================================
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ==========================================
# Stage 3: Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### **Docker Compose**

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      - db
  
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: hotel_booking
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 🐛 Troubleshooting

### **Issue 1: "pnpm: command not found"**

**Solution:**
```bash
# Reinstall pnpm globally
npm install -g pnpm

# Add pnpm to PATH (Windows)
setx PATH "%PATH%;%APPDATA%\npm"

# Add pnpm to PATH (Unix)
export PATH="$HOME/.local/share/pnpm:$PATH"
```

---

### **Issue 2: Symlinks not working on Windows**

**Solution:**

Enable Developer Mode in Windows:
1. Settings → Update & Security → For developers
2. Enable "Developer Mode"

Or use copy mode:
```ini
# In .npmrc
package-import-method=copy
```

---

### **Issue 3: "Peer dependency warnings"**

**Solution:**
```bash
# Auto-install peer dependencies
pnpm install --auto-install-peers

# Or configure in .npmrc
auto-install-peers=true
```

---

### **Issue 4: "Cannot find module"**

**Solution:**
```bash
# Clean and reinstall
pnpm clean:all
pnpm install

# Or rebuild node_modules
rm -rf node_modules
pnpm install
```

---

### **Issue 5: Slow installation**

**Solution:**
```bash
# Increase network concurrency
pnpm config set network-concurrency 32

# Use offline mode (if packages cached)
pnpm install --offline

# Use prefer-offline mode
pnpm install --prefer-offline
```

---

### **Issue 6: Prisma client not generated**

**Solution:**
```bash
# Manually generate
pnpm db:generate

# Or reinstall with postinstall
pnpm install --force
```

---

### **Issue 7: "EACCES" permission errors**

**Solution:**
```bash
# Fix npm permissions (Unix)
sudo chown -R $(whoami) ~/.pnpm-store

# Or use different store location
pnpm config set store-dir ~/my-pnpm-store
```

---

## 📊 Verification Checklist

After migration, verify:

- [ ] `pnpm-lock.yaml` exists
- [ ] `package-lock.json` removed
- [ ] `node_modules` contains `.pnpm` folder
- [ ] `pnpm dev` starts dev server
- [ ] `pnpm build` creates production build
- [ ] `pnpm start` runs production server
- [ ] All database scripts work (`pnpm db:migrate`, etc.)
- [ ] No "phantom dependency" errors
- [ ] CI/CD pipeline updated (if applicable)
- [ ] Team members can install with `pnpm install`

---

## 🎉 Migration Complete!

Your project is now using pnpm! Enjoy faster installs and better dependency management.

### **Quick Reference:**

```bash
# Development
pnpm install          # Install dependencies
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
pnpm db:studio        # Open Prisma Studio

# Maintenance
pnpm update           # Update dependencies
pnpm audit            # Check security
pnpm clean            # Clean build artifacts
```

---

**Need Help?**
- PNPM Docs: https://pnpm.io/
- Discord: https://discord.gg/pnpm
- GitHub: https://github.com/pnpm/pnpm
