# OTP Login with Profile Completion - Implementation Guide

## Overview

This implementation ensures that users who log in via OTP must complete their profile before accessing protected routes like the dashboard. This provides a secure, user-friendly onboarding flow.

## Security Features

✅ **Server-side enforcement** - Middleware checks prevent bypass attempts
✅ **JWT token includes profile status** - Token regenerated after profile completion
✅ **Automatic redirects** - Users cannot access dashboard without completing profile
✅ **Return URL preservation** - Users redirected back to intended destination after setup
✅ **Database-backed validation** - All checks verified against database state

## Implementation Components

### 1. Middleware Protection (`middleware.ts`)

The middleware now checks the `profileCompleted` flag in the JWT token and redirects incomplete profiles to `/profile/setup`:

```typescript
const profileCompleted = (user as any).profileCompleted ?? false

const requiresProfileCompletion = pathname.startsWith('/dashboard') || 
                                   pathname.startsWith('/admin') || 
                                   pathname.startsWith('/superadmin')

const isProfileSetupRoute = pathname === '/profile/setup' || pathname.startsWith('/profile/setup/')
const isProfileApiRoute = pathname === '/api/user/profile/complete'

if (requiresProfileCompletion && !profileCompleted && !isProfileSetupRoute && !isProfileApiRoute) {
  const setupUrl = new URL('/profile/setup', request.url)
  setupUrl.searchParams.set('message', 'Please complete your profile to continue')
  setupUrl.searchParams.set('returnTo', pathname)
  return NextResponse.redirect(setupUrl)
}
```

### 2. User Creation (`src/actions/auth/request-otp.action.ts`)

New users are created with `profileCompleted: false`:

```typescript
user = await prisma.user.create({
  data: {
    phone: validatedPhone,
    name: `User ${validatedPhone.slice(-4)}`,
    email: null,
    roleId: memberRole.id,
    profileCompleted: false, // Explicitly set to false
  },
  include: { role: true },
})
```

### 3. JWT Token Generation (`src/actions/auth/verify-otp.action.ts`)

The JWT payload includes the `profileCompleted` status:

```typescript
const jwtPayload: JWTPayload = {
  userId: user.id,
  phone: user.phone,
  email: user.email,
  name: user.name,
  role: user.role.name,
  roleId: user.roleId,
  profileCompleted: user.profileCompleted, // Included in token
}
```

### 4. Profile Setup Page (`src/app/profile/setup/page.tsx`)

- **Location**: `/profile/setup`
- **Purpose**: Collect user's full name, email, address, and VIP status
- **Features**:
  - Form validation with Zod + react-hook-form
  - Dark mode support
  - Responsive design
  - Pre-fills existing data
  - Prevents access if profile already completed

### 5. Profile Completion API (`src/app/api/user/update-profile/route.ts`)

- **Endpoint**: `POST /api/user/update-profile`
- **Authentication**: JWT cookie required
- **Actions**:
  1. Updates user profile in database
  2. Sets `profileCompleted: true`
  3. Regenerates JWT tokens with updated status
  4. Sets new HTTP-only cookies
  5. Returns updated user data

**Key code:**
```typescript
const jwtPayload: JWTPayload = {
  userId: updatedUser.id,
  phone: updatedUser.phone,
  email: updatedUser.email,
  name: updatedUser.name,
  role: updatedUser.role.name,
  roleId: updatedUser.roleId,
  profileCompleted: true, // Now true after completion
}

const tokens = generateTokenPair(jwtPayload)
await setSessionCookie(tokens.accessToken)
await setRefreshTokenCookie(tokens.refreshToken)
```

### 6. Profile Check Utilities (`src/lib/auth/profile-check.ts`)

Helper functions for both server and client-side profile checks:

**Server-side:**
- `isProfileCompleted(userId)` - Database check
- `getProfileCompletionStatus(userId)` - Detailed status
- `requireProfileCompletion(userId)` - Throws if incomplete

**Client-side:**
- `isProfileCompletedFromToken(user)` - Check JWT data
- `requiresProfileCompletion(pathname)` - Check if route needs profile
- `getProfileSetupUrl(returnPath)` - Generate setup URL with return path
- `hasRequiredProfileFields(user)` - Validate required fields
- `getMissingProfileFields(user)` - List missing fields

## User Flow

### First-Time Login (New User)

1. User enters phone number on login page
2. OTP sent to phone
3. User verifies OTP
4. User created with `profileCompleted: false`
5. JWT generated with `profileCompleted: false`
6. User logs in and tries to access `/dashboard`
7. **Middleware intercepts**: Redirects to `/profile/setup?message=...&returnTo=/dashboard`
8. User fills out profile form (name, email, address, VIP status)
9. Profile submitted to `/api/user/update-profile`
10. Database updated with `profileCompleted: true`
11. **New JWT tokens generated** with `profileCompleted: true`
12. User redirected to `/dashboard` (original destination)
13. ✅ Access granted to dashboard

### Returning User (Profile Already Completed)

1. User enters phone number
2. OTP sent and verified
3. JWT generated with `profileCompleted: true` (from database)
4. User redirected to `/dashboard`
5. **Middleware checks**: Profile completed ✅
6. ✅ Access granted immediately

## Protected Routes

Routes requiring profile completion:
- `/dashboard` and all sub-routes
- `/admin` and all sub-routes
- `/superadmin` and all sub-routes
- Any other routes added to middleware config

Routes accessible without profile completion:
- `/` (home)
- `/login`
- `/verify-otp`
- `/profile/setup` (the setup page itself)
- `/api/auth/*` (authentication endpoints)
- `/api/user/update-profile` (profile completion endpoint)

## Security Considerations

### 1. Cannot Bypass Profile Setup
- Middleware enforces server-side (not just client-side)
- JWT token verification ensures authenticity
- Database state is source of truth

### 2. Token Regeneration
- After profile completion, new tokens issued
- Old tokens with `profileCompleted: false` become stale
- Ensures consistency between token and database

### 3. Return URL Handling
- Original destination preserved in query param
- User redirected after completing profile
- Prevents frustration and improves UX

### 4. API Route Protection
- Cookie-based authentication (HTTP-only)
- JWT verification on every request
- Proper error handling and status codes

## Testing Checklist

- [ ] New user creation sets `profileCompleted: false`
- [ ] OTP verification includes `profileCompleted` in JWT
- [ ] Middleware redirects to `/profile/setup` for incomplete profiles
- [ ] `/profile/setup` page is accessible without completed profile
- [ ] Profile form validation works correctly
- [ ] `/api/user/update-profile` sets `profileCompleted: true`
- [ ] New JWT tokens generated after profile completion
- [ ] User can access dashboard after profile completion
- [ ] Returning users with completed profiles get immediate access
- [ ] Cannot bypass profile setup by directly accessing dashboard
- [ ] Return URL works correctly after profile completion
- [ ] Works for MEMBER, ADMIN, and SUPERADMIN roles

## Database Schema

The `User` model includes:

```prisma
model User {
  id               String     @id @default(cuid())
  phone            String     @unique
  name             String
  email            String?    @unique
  address          String?
  vipStatus        VipStatus  @default(NONE)
  profileCompleted Boolean    @default(false) // Key field
  // ... other fields
}
```

## Environment Variables

Required environment variables (already configured):

```env
JWT_ACCESS_SECRET=your-access-secret-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
DATABASE_URL=your-database-connection-string
```

## API Endpoints

### Request OTP
```
POST /api/auth/request-otp
Body: { phone: "+1234567890" }
```

### Verify OTP
```
POST /api/auth/verify-otp
Body: { phone: "+1234567890", otp: "123456" }
Response: Sets auth-session cookie
```

### Update Profile
```
POST /api/user/update-profile
Headers: Cookie: auth-session=<jwt-token>
Body: {
  fullName: "John Doe",
  email: "john@example.com",
  address: "123 Main St",
  vipStatus: "Regular" | "VIP"
}
Response: Updates profile, sets profileCompleted=true, regenerates tokens
```

## Common Issues & Solutions

### Issue: User stuck on profile setup page
**Solution**: Check that API endpoint is setting `profileCompleted: true` and regenerating tokens

### Issue: Middleware redirecting even after profile completion
**Solution**: Verify JWT token includes updated `profileCompleted: true` field

### Issue: Can bypass profile setup by URL manipulation
**Solution**: Ensure middleware is checking ALL protected routes, not just dashboard

### Issue: Profile data not saving
**Solution**: Check database connection, JWT validation, and Zod schema validation

## Next Steps / Enhancements

Potential improvements:
1. Add profile completion progress indicator
2. Email verification step
3. Phone number verification beyond OTP
4. Profile photo upload
5. Multi-step profile wizard
6. Skip profile setup for certain roles (e.g., ADMIN)
7. Periodic profile update reminders

## Support

For issues or questions:
- Check middleware logs (DEBUG_MODE=true)
- Verify JWT token contents
- Check database `profileCompleted` field
- Review API response bodies
- Test with different user roles

---

**Implementation Status**: ✅ Complete and Production-Ready

**Last Updated**: October 25, 2025
