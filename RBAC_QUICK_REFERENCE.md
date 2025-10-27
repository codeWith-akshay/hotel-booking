# RBAC Quick Reference Card

## 🚀 Quick Start

### Protect an API Route

```typescript
import { requireAuth, requireAdmin, logAction } from '@/lib/utils/api-request'
import { AuditAction, AuditTargetType } from '@/lib/services/audit.service'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()      // Throws if not authenticated
    await requireAdmin()                   // Throws if not ADMIN/SUPERADMIN
    
    const body = await request.json()
    const result = await doSomething(body)
    
    await logAction(                       // Log admin action
      AuditAction.MY_ACTION,
      AuditTargetType.MY_RESOURCE,
      result.id,
      { reason: body.reason }
    )
    
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error.message.includes('required')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

## 🔑 Common Functions

### Authentication
```typescript
const user = await getRequestUser()      // Returns null if not authenticated
const user = await requireAuth()         // Throws if not authenticated
const context = await getUserContext()   // Get user for permission checks
```

### Authorization
```typescript
await requireRole(['ADMIN', 'SUPERADMIN'])  // Require specific roles
await requireAdmin()                         // Require ADMIN or SUPERADMIN
await requireSuperAdmin()                    // Require SUPERADMIN only

if (await isAdmin()) { ... }                 // Check if admin
if (await isSuperAdmin()) { ... }            // Check if superadmin
if (await hasRole(['ADMIN'])) { ... }        // Check specific role
```

### Permissions
```typescript
import { requirePermission, checkPermission } from '@/lib/auth/permissions'

// Check permission (throws if denied)
await requirePermission(user, 'bookings:override', true)

// Check permission (returns boolean)
const result = await checkPermission(user, 'bookings:override')
if (!result.granted) {
  throw new Error(result.reason)
}
```

### Audit Logging
```typescript
import { logAction, AuditAction, AuditTargetType } from '@/lib/utils/api-request'

// Log action with full context
await logAction(
  AuditAction.BOOKING_UPDATE,
  AuditTargetType.BOOKING,
  bookingId,
  {
    reason: 'Admin override',
    changes: { before: oldState, after: newState },
    metadata: { adminName: user.name }
  }
)

// Auto-log (only logs for admin/superadmin)
await autoLogAction(AuditAction.MY_ACTION, AuditTargetType.MY_RESOURCE, id)
```

---

## 🎭 Roles & Permissions

### Role Hierarchy
1. **SUPERADMIN** - Highest (all permissions)
2. **ADMIN** - Medium (admin permissions)
3. **MEMBER** - Lowest (basic user permissions)

### Quick Permission Reference
```typescript
// User Management
'users:create'      // ADMIN, SUPERADMIN
'users:read'        // ADMIN, SUPERADMIN
'users:update'      // ADMIN, SUPERADMIN
'users:delete'      // SUPERADMIN only
'users:change-role' // SUPERADMIN only

// Booking Management
'bookings:create'        // ALL
'bookings:read'          // ALL (own bookings)
'bookings:read-all'      // ADMIN, SUPERADMIN
'bookings:update'        // ADMIN, SUPERADMIN
'bookings:delete'        // ADMIN, SUPERADMIN
'bookings:override'      // ADMIN, SUPERADMIN
'bookings:force-checkin' // ADMIN, SUPERADMIN

// System Management
'system:settings'   // SUPERADMIN only
'system:backup'     // SUPERADMIN only
'audit-logs:read'   // ADMIN, SUPERADMIN
```

---

## 📝 Audit Actions

### Common Actions
```typescript
// Authentication
AuditAction.LOGIN
AuditAction.LOGOUT
AuditAction.ACCESS_GRANTED
AuditAction.ACCESS_DENIED

// Bookings
AuditAction.BOOKING_CREATE
AuditAction.BOOKING_UPDATE
AuditAction.BOOKING_DELETE
AuditAction.BOOKING_OVERRIDE_CONFIRM
AuditAction.BOOKING_FORCE_CHECKIN

// Payments
AuditAction.PAYMENT_REFUND
AuditAction.PAYMENT_OVERRIDE

// System
AuditAction.SYSTEM_SETTINGS_UPDATE
AuditAction.DATABASE_BACKUP
```

### Resource Types
```typescript
AuditTargetType.USER
AuditTargetType.BOOKING
AuditTargetType.ROOM
AuditTargetType.PAYMENT
AuditTargetType.SYSTEM
AuditTargetType.API_ROUTE
```

---

## 🛠 Middleware Configuration

### Add Protected Route
In `middleware.ts`:

```typescript
const PROTECTED_ROUTES: RouteConfig[] = [
  // Your new route
  {
    path: '/api/admin/my-route',
    roles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
]
```

### Public Routes
In `middleware.ts`:

```typescript
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/api/auth/*',
]
```

---

## 🧪 Testing

### Test Authentication
```bash
# No token (401)
curl http://localhost:3000/api/admin/test

# MEMBER token (403)
curl -H "Authorization: Bearer MEMBER_TOKEN" http://localhost:3000/api/admin/test

# ADMIN token (200)
curl -H "Authorization: Bearer ADMIN_TOKEN" http://localhost:3000/api/admin/test
```

### Verify Audit Logs
```sql
SELECT * FROM admin_audit_logs 
WHERE adminId = 'user_id' 
ORDER BY createdAt DESC 
LIMIT 10;
```

---

## ⚠️ Common Errors

### 401 Unauthorized
- **Cause**: No JWT token or invalid token
- **Fix**: Include Authorization header or check token validity

### 403 Forbidden
- **Cause**: User doesn't have required role
- **Fix**: Check route requires correct role in middleware.ts

### Permission Denied
- **Cause**: User lacks specific permission
- **Fix**: Verify permission exists and role has permission

---

## 📚 Full Documentation

See **RBAC_DOCUMENTATION.md** for complete details:
- Role hierarchy
- All permissions
- Implementation patterns
- Best practices
- Troubleshooting guide

---

## 🎯 Checklist for New Route

- [ ] Add to `middleware.ts` PROTECTED_ROUTES
- [ ] Import `requireAuth`, `requireAdmin`, `logAction`
- [ ] Add authentication check
- [ ] Add role/permission check
- [ ] Add business logic
- [ ] Add audit logging
- [ ] Handle RBAC errors (401/403)
- [ ] Test with all roles
- [ ] Verify audit log created

---

## 💡 Pro Tips

1. **Always use `requireAuth()`** for protected routes (throws if not authenticated)
2. **Log all admin actions** - Especially overrides, deletes, role changes
3. **Provide reasons** - Always include reason for override actions
4. **Store before/after** - Log what changed in audit logs
5. **Test thoroughly** - Test with MEMBER, ADMIN, and SUPERADMIN roles
6. **Check audit logs** - Verify logs are created for all admin actions

---

## 🔗 Quick Links

- **Full Documentation**: [RBAC_DOCUMENTATION.md](./RBAC_DOCUMENTATION.md)
- **Implementation Summary**: [RBAC_IMPLEMENTATION_SUMMARY.md](./RBAC_IMPLEMENTATION_SUMMARY.md)
- **Example Route**: [rbac-protected-route-example.ts](./src/app/api/_examples/rbac-protected-route-example.ts)
- **Updated Route**: [override/route.ts](./src/app/api/admin/bookings/override/route.ts)

---

**Last Updated**: October 27, 2025  
**Keep this card handy while implementing RBAC!** 🚀
