# RBAC Middleware - Quick Reference Guide

## Quick Start

### 1. Protect a Route

Add to `PROTECTED_ROUTES` in `middleware.ts`:

```typescript
{
  path: '/admin/users',
  roles: ['ADMIN', 'SUPERADMIN'],
  requiresAuth: true,
  redirectTo: '/login',
}
```

### 2. Access User in API Route

```typescript
import { getCurrentUser } from '@/lib/middleware/auth.utils'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  return NextResponse.json({ userId: user.userId, role: user.role })
}
```

### 3. Require Specific Role

```typescript
import { requireRole } from '@/lib/middleware/auth.utils'

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireRole(['ADMIN', 'SUPERADMIN'])
    // Admin operation here
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
```

---

## Helper Functions Cheat Sheet

| Function | Purpose | Returns | Throws |
|----------|---------|---------|--------|
| `getCurrentUser()` | Get authenticated user | `UserContext \| null` | No |
| `requireAuth()` | Require authentication | `UserContext` | Yes |
| `hasRole(role)` | Check if user has role | `boolean` | No |
| `requireRole(role)` | Require specific role | `UserContext` | Yes |
| `isAdmin()` | Check if admin/superadmin | `boolean` | No |
| `isSuperAdmin()` | Check if superadmin | `boolean` | No |
| `getUserId()` | Get current user ID | `string \| null` | No |

---

## Response Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| **200** | OK | Successful request |
| **401** | Unauthorized | No token or invalid token |
| **403** | Forbidden | Valid token but insufficient permissions |
| **500** | Server Error | Unexpected error |

---

## Error Response Format

### API Routes (JSON)

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "No authentication token provided. Please log in.",
  "code": "UNAUTHORIZED",
  "statusCode": 401
}
```

### Browser Routes (Redirect)

```
Redirect to: /login?returnTo=/original-path
```

---

## Role Hierarchy

```
SUPERADMIN → Full system access
    ↓
ADMIN → Administrative access
    ↓
MEMBER → Basic user access
```

---

## Token Sources (Priority Order)

1. **Authorization Header** (API calls)
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Cookie** (Browser requests)
   ```
   Cookie: auth-session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## Common Patterns

### Pattern 1: Simple Authentication

```typescript
const user = await getCurrentUser()
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Pattern 2: Role-Based Logic

```typescript
const isAdmin = await hasRole(['ADMIN', 'SUPERADMIN'])
if (isAdmin) {
  // Admin logic
} else {
  // Regular user logic
}
```

### Pattern 3: Require Admin

```typescript
try {
  await requireRole('ADMIN')
} catch {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Pattern 4: Server Component Auth

```typescript
const user = await getCurrentUser()
if (!user) redirect('/login')

// Render protected content
return <div>Welcome, {user.name}!</div>
```

---

## Environment Variables

```bash
# Required
JWT_ACCESS_SECRET=your-secret-key-change-in-production

# Optional
NODE_ENV=development  # Enables debug logging
```

---

## Debugging

### Enable Debug Logs

Set `NODE_ENV=development` in `.env.local`:

```bash
[Middleware] ✅ Access granted: ADMIN → /admin/users
[Middleware] ❌ No token provided for: /dashboard
[Middleware] ❌ Invalid/expired token for: /api/user/profile
[Middleware] ❌ Insufficient permissions for /admin. User: MEMBER, Required: ADMIN
```

### Check Token in Browser DevTools

```javascript
// Check if cookie is set
document.cookie

// Check Authorization header (API calls)
fetch('/api/user/profile', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
```

---

## Testing Checklist

- [ ] Public routes accessible without token
- [ ] Protected routes redirect to login without token
- [ ] Protected routes return 401 for API without token
- [ ] Valid token allows access
- [ ] Expired token returns 401
- [ ] Invalid token returns 401
- [ ] Member role cannot access admin routes (403)
- [ ] Admin role can access admin routes
- [ ] Superadmin role can access all routes
- [ ] User context available in route handlers
- [ ] Return URL works after login redirect

---

## Security Checklist

- [ ] JWT secrets set in production environment
- [ ] Tokens expire (15 min for access, 7 days for refresh)
- [ ] HTTP-only cookies enabled
- [ ] HTTPS enabled in production (`secure: true`)
- [ ] SameSite cookie attribute set (`lax` or `strict`)
- [ ] Role validation on server-side only
- [ ] Sensitive operations require re-authentication
- [ ] Audit logs for admin actions
- [ ] Rate limiting on auth endpoints

---

## Common Issues & Solutions

### Issue: "Unauthorized" despite being logged in

**Solutions:**
1. Check if token is expired (15 min default)
2. Verify cookie domain matches current domain
3. Check if cookie is being sent (DevTools → Network tab)
4. Ensure JWT_ACCESS_SECRET matches between login and middleware

### Issue: "Forbidden" despite having correct role

**Solutions:**
1. Check route configuration in `PROTECTED_ROUTES`
2. Verify token contains correct role
3. Decode JWT at https://jwt.io to inspect payload
4. Check if role matches exactly (case-sensitive)

### Issue: Middleware not running

**Solutions:**
1. Check matcher config in `middleware.ts`
2. Verify route is not in `PUBLIC_ROUTES`
3. Clear Next.js cache: `rm -rf .next`
4. Restart dev server

### Issue: Cannot access user context in route handler

**Solutions:**
1. Ensure route is in `PROTECTED_ROUTES`
2. Use `await getCurrentUser()` (async)
3. Check if middleware is running for this route
4. Verify request headers contain `x-user-id`

---

## API Endpoint Examples

### Protected User Profile
```
GET /api/user/profile
Authorization: Bearer <token>

Response: 200 OK
{
  "userId": "...",
  "name": "John Doe",
  "role": "MEMBER"
}
```

### Admin Operation
```
DELETE /api/admin/users/123
Authorization: Bearer <admin-token>

Response: 200 OK
{
  "success": true,
  "message": "User deleted"
}

Response: 403 Forbidden (if not admin)
{
  "success": false,
  "error": "Insufficient permissions"
}
```

---

## File Reference

| File | Purpose |
|------|---------|
| `middleware.ts` | Main middleware logic |
| `src/types/middleware.types.ts` | TypeScript types |
| `src/lib/middleware/auth.utils.ts` | Helper functions |
| `src/lib/auth/jwt.service.ts` | JWT token utilities |
| `src/lib/rbac.ts` | Role checks |
| `src/examples/rbac-middleware-examples.ts` | Usage examples |
| `docs/STEP_7_RBAC_MIDDLEWARE.md` | Full documentation |

---

## Next Steps After Implementation

1. **Testing**
   - Write unit tests for middleware functions
   - Write integration tests for protected routes
   - Test all role combinations

2. **Monitoring**
   - Add logging for failed auth attempts
   - Track token expiration rates
   - Monitor role-based access patterns

3. **Documentation**
   - Update API documentation with auth requirements
   - Create user guide for developers
   - Document role permissions

4. **Security Audit**
   - Review JWT secret strength
   - Check token expiration times
   - Verify HTTPS is enforced
   - Test for common vulnerabilities

---

**Quick Links:**
- [Full Documentation](./STEP_7_RBAC_MIDDLEWARE.md)
- [Usage Examples](../src/examples/rbac-middleware-examples.ts)
- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)

**Last Updated**: October 22, 2025
