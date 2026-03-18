# 🔐 Complete Authentication System Guide

## Overview

This application now uses **Email/Password authentication** with **Role-Based Access Control (RBAC)** instead of OTP-based login.

---

## 🎯 Authentication Features

### ✅ Implemented Features

1. **Email/Password Authentication**
   - Secure signup with email validation
   - Login with email and password
   - Password hashing using bcrypt (10 salt rounds)
   - JWT tokens with HTTP-only cookies

2. **Role-Based Access Control (RBAC)**
   - Three roles: MEMBER, ADMIN, SUPERADMIN
   - Role hierarchy system (SUPERADMIN > ADMIN > MEMBER)
   - Protected routes and API endpoints
   - Middleware for role verification

3. **Security Features**
   - Password strength validation
   - HTTP-only cookies for tokens
   - JWT access (15min) and refresh (7days) tokens
   - Secure password hashing with bcrypt

---

## 🚀 Quick Start

### Default Admin Accounts

After running `pnpm db:seed`, you'll have these accounts:

1. **Admin Account**
   - Email: `admin@hotel.com`
   - Password: `Admin@123456`
   - Role: ADMIN

2. **Super Admin Account**
   - Email: `superadmin@hotel.com`
   - Password: `SuperAdmin@123456`
   - Role: SUPERADMIN

### Testing Authentication Flow

1. **Start the development server:**
   ```bash
   pnpm dev
   ```

2. **Open browser to:**
   - Signup: `http://localhost:3000/signup`
   - Login: `http://localhost:3000/login`

3. **Test Signup:**
   - Navigate to `/signup`
   - Fill in name, email, password (8+ chars, uppercase, lowercase, number, special char)
   - Confirm password
   - Click "Sign Up"
   - Auto-redirects to `/dashboard` (MEMBER role)

4. **Test Login:**
   - Navigate to `/login`
   - Enter email and password
   - Click "Login"
   - Redirects based on role:
     - SUPERADMIN → `/superadmin/dashboard`
     - ADMIN → `/admin/dashboard`
     - MEMBER → `/dashboard`

---

## 📁 File Structure

### Backend Files

```
src/
├── actions/auth/
│   ├── signup.action.ts          # User registration server action
│   └── login.action.ts           # User authentication server action
│
├── app/api/auth/
│   ├── signup/route.ts           # POST /api/auth/signup
│   └── login/route.ts            # POST /api/auth/login
│
├── lib/
│   ├── auth/
│   │   ├── password.service.ts   # Password hashing/verification
│   │   ├── jwt.service.ts        # JWT token generation/verification
│   │   └── rbac.utils.ts         # RBAC middleware and utilities
│   │
│   └── validation/
│       └── auth.schemas.ts       # Zod validation schemas
```

### Frontend Files

```
src/app/(auth)/
├── login/
│   └── page.tsx                  # Login page
└── signup/
    └── page.tsx                  # Signup page
```

---

## 🔧 Implementation Details

### 1. Password Service (`password.service.ts`)

```typescript
// Hash a password
const hashedPassword = await hashPassword('MyPassword123!')

// Verify password during login
const isValid = await verifyPassword('MyPassword123!', hashedPassword)

// Validate password strength
const validation = validatePasswordStrength('weak')
// Returns: { isValid: false, errors: [...] }
```

### 2. Signup Action (`signup.action.ts`)

**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "data": {
    "userId": "cm...",
    "name": "John Doe",
    "email": "john@example.com",
    "roleId": 1,
    "roleName": "MEMBER"
  },
  "message": "Account created successfully"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### 3. Login Action (`login.action.ts`)

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "admin@hotel.com",
  "password": "Admin@123456"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm...",
      "name": "Admin User",
      "email": "admin@hotel.com",
      "roleId": 2,
      "role": {
        "id": 2,
        "name": "ADMIN",
        "permissions": ["read", "write", "delete"]
      }
    }
  },
  "message": "Login successful"
}
```

**Error Responses:**
- `400` - Validation error (invalid email/password format)
- `401` - Invalid credentials (wrong email or password)
- `500` - Server error

---

## 🛡️ RBAC System

### Role Hierarchy

```
SUPERADMIN (3) - Full system access
    ↓
ADMIN (2) - Manage bookings, rooms, users
    ↓
MEMBER (1) - Basic booking access
```

### Using RBAC Utilities (`rbac.utils.ts`)

#### 1. Check Role Access in Server Actions

```typescript
import { hasRole, isAdmin, isSuperAdmin } from '@/lib/auth/rbac.utils'

// Check if user has specific role
export async function someAction() {
  const user = await hasRole('ADMIN')
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }
  // Continue with admin logic
}

// Shorthand for checking admin role
export async function adminOnlyAction() {
  const admin = await isAdmin()
  if (!admin) {
    return { success: false, error: 'Admin access required' }
  }
  // Admin-only logic
}

// Check for superadmin
export async function superAdminAction() {
  const superadmin = await isSuperAdmin()
  if (!superadmin) {
    return { success: false, error: 'Superadmin access required' }
  }
  // Superadmin-only logic
}
```

#### 2. Protect API Routes with Middleware

```typescript
import { protectRoute } from '@/lib/auth/rbac.utils'

// Admin-only API route
export const POST = protectRoute(async (request, user) => {
  // user object is automatically provided
  // and verified to be ADMIN or higher
  
  return NextResponse.json({
    success: true,
    data: { message: 'Admin action completed' }
  })
}, 'ADMIN')

// Superadmin-only API route
export const DELETE = protectRoute(async (request, user) => {
  // Only SUPERADMIN can access this
  
  return NextResponse.json({
    success: true,
    data: { message: 'Superadmin action completed' }
  })
}, 'SUPERADMIN')

// Any authenticated user
export const GET = protectRoute(async (request, user) => {
  // Any logged-in user can access this
  
  return NextResponse.json({
    success: true,
    data: { userId: user.id, role: user.role.name }
  })
}, 'MEMBER')
```

#### 3. Manual Role Checking

```typescript
import { hasRoleAccess } from '@/lib/auth/rbac.utils'

// Check if user has sufficient role
const canAccess = hasRoleAccess('ADMIN', 'MEMBER')
// Returns: true (ADMIN can access MEMBER resources)

const canAccess2 = hasRoleAccess('MEMBER', 'ADMIN')
// Returns: false (MEMBER cannot access ADMIN resources)
```

---

## 🧪 Testing Examples

### Test Signup Flow

```bash
# Using curl
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!"
  }'
```

### Test Login Flow

```bash
# Login as admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "admin@hotel.com",
    "password": "Admin@123456"
  }'

# Use cookies for authenticated request
curl -X GET http://localhost:3000/api/user/profile \
  -b cookies.txt
```

### Test Protected Route

```javascript
// In browser console (after login)
fetch('/api/admin/dashboard', {
  credentials: 'include' // Include cookies
})
  .then(r => r.json())
  .then(console.log)
```

---

## 🔐 Security Best Practices

### Implemented Security Features

1. **Password Security**
   - Bcrypt hashing with 10 salt rounds
   - Strong password requirements enforced
   - No plain-text password storage

2. **Token Security**
   - HTTP-only cookies (prevents XSS)
   - Short-lived access tokens (15min)
   - Long-lived refresh tokens (7days)
   - JWT signed with secret key

3. **Role Security**
   - Role hierarchy enforcement
   - Server-side role validation
   - Protected API routes with middleware

4. **Input Validation**
   - Zod schemas for all inputs
   - Email format validation
   - Password strength validation
   - SQL injection prevention via Prisma

---

## 📋 Common Use Cases

### 1. Create a Member-Only Page

```typescript
// src/app/members-only/page.tsx
import { hasRole } from '@/lib/auth/rbac.utils'
import { redirect } from 'next/navigation'

export default async function MembersOnlyPage() {
  const user = await hasRole('MEMBER')
  
  if (!user) {
    redirect('/login')
  }
  
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>This is a members-only page.</p>
    </div>
  )
}
```

### 2. Create an Admin API Endpoint

```typescript
// src/app/api/admin/analytics/route.ts
import { NextResponse } from 'next/server'
import { protectRoute } from '@/lib/auth/rbac.utils'
import { prisma } from '@/lib/prisma'

export const GET = protectRoute(async (request, user) => {
  // Only admins can access analytics
  
  const bookingCount = await prisma.booking.count()
  const userCount = await prisma.user.count()
  
  return NextResponse.json({
    success: true,
    data: {
      bookings: bookingCount,
      users: userCount,
      requestedBy: user.email
    }
  })
}, 'ADMIN')
```

### 3. Check Role in Frontend

```typescript
'use client'

import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  
  useEffect(() => {
    fetch('/api/user/profile', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setUser(data.data)
        }
      })
  }, [])
  
  if (!user) return <div>Loading...</div>
  
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Your role: {user.role.name}</p>
      
      {user.role.name === 'ADMIN' && (
        <div>
          <h2>Admin Controls</h2>
          {/* Admin-only UI */}
        </div>
      )}
    </div>
  )
}
```

---

## 🐛 Troubleshooting

### Login not working?

1. Check credentials - passwords are case-sensitive
2. Verify database has been seeded: `pnpm db:seed`
3. Check browser console for errors
4. Verify cookies are enabled in browser

### "Unauthorized" errors?

1. Ensure you're logged in
2. Check if your role has sufficient permissions
3. Verify JWT token hasn't expired (15min for access token)
4. Try logging out and logging back in

### Role checks failing?

1. Verify user has correct role in database
2. Check role hierarchy (MEMBER < ADMIN < SUPERADMIN)
3. Ensure `hasRole()` or `protectRoute()` is used correctly
4. Review role name spelling (case-sensitive)

---

## 📚 Additional Resources

### Related Files

- Database Schema: `prisma/schema.prisma`
- Seed Data: `prisma/seed.ts`
- JWT Configuration: `.env` (JWT_SECRET, JWT_EXPIRES_IN)
- Middleware: `middleware.ts`

### Environment Variables

```env
# Required for authentication
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
```

---

## ✅ What Changed From OTP System

### Removed
- ❌ OTP model and table
- ❌ Phone-based authentication
- ❌ SMS/OTP generation
- ❌ `/api/auth/request-otp`
- ❌ `/api/auth/verify-otp`
- ❌ `/verify-otp` page
- ❌ OTP service files
- ❌ OTP validation schemas

### Added
- ✅ Email/password authentication
- ✅ Password hashing with bcrypt
- ✅ Comprehensive RBAC system
- ✅ Role hierarchy and permissions
- ✅ `/api/auth/signup`
- ✅ `/api/auth/login`
- ✅ `/signup` page
- ✅ New `/login` page (email/password)
- ✅ Password strength validation
- ✅ RBAC utilities and middleware

---

## 🎉 Summary

Your hotel booking application now has a **production-ready authentication system** with:

1. ✅ Secure email/password authentication
2. ✅ Role-based access control (RBAC)
3. ✅ Three-tier role hierarchy
4. ✅ JWT token-based sessions
5. ✅ Password hashing with bcrypt
6. ✅ Protected routes and API endpoints
7. ✅ Input validation and security
8. ✅ Clean, maintainable code

**Ready to use in development and production!**

---

*Generated: March 18, 2026*
*Authentication System Version: 2.0 (Email/Password + RBAC)*
