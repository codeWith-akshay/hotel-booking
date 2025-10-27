# Role-Based Access Control (RBAC) System

## Overview

Comprehensive role-based access control implementation across frontend and backend with full audit logging for all administrative actions.

## Table of Contents

1. [Role Hierarchy](#role-hierarchy)
2. [Architecture](#architecture)
3. [Middleware Protection](#middleware-protection)
4. [Permission System](#permission-system)
5. [Audit Logging](#audit-logging)
6. [API Routes Protection](#api-routes-protection)
7. [Server Actions](#server-actions)
8. [Implementation Guide](#implementation-guide)
9. [Best Practices](#best-practices)

---

## Role Hierarchy

### 1. MEMBER (Basic User)
**Access Level**: Lowest  
**Permissions**:
- View own bookings
- Create new bookings
- Update own profile
- View room availability
- Process own payments
- Receive notifications

**Restrictions**:
- Cannot access admin routes
- Cannot view other users' data
- Cannot modify system settings

### 2. ADMIN (Administrator)
**Access Level**: Medium  
**Permissions**: All MEMBER permissions plus:
- View all bookings
- Override booking rules
- Force check-in/check-out
- Manage rooms and room types
- Manage inventory
- Process refunds
- View payment information
- Send notifications
- Generate reports
- Manage waitlist
- View audit logs (own actions)

**Restrictions**:
- Cannot change user roles
- Cannot delete users
- Cannot access superadmin routes
- Cannot modify system settings
- Cannot view all audit logs

### 3. SUPERADMIN (Super Administrator)
**Access Level**: Highest  
**Permissions**: All ADMIN permissions plus:
- Change user roles
- Delete users
- Modify system settings
- Backup/restore database
- Export all data
- Override payment rules
- View all audit logs
- System maintenance

**Restrictions**: None

---

## Architecture

### Components

```
┌──────────────┐
│   Middleware │  ← JWT verification, role checking, audit context
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  API Routes  │  ← Request handlers with RBAC checks
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Utilities  │  ← requireAuth(), requireAdmin(), logAction()
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Permissions │  ← Fine-grained permission checks
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Audit     │  ← Audit log creation and queries
└──────────────┘
```

### Request Flow

1. **Request arrives** → Middleware intercepts
2. **Middleware checks**:
   - Is route public? → Allow
   - Is route protected? → Verify JWT token
   - Does user have required role? → Allow/Deny
   - Inject user context into headers
   - Add audit tracking headers
3. **API Route handler**:
   - Extract user context
   - Check permissions
   - Execute business logic
   - Log action to audit trail
4. **Response** → Return result

---

## Middleware Protection

### File: `middleware.ts`

### Protected Route Configuration

```typescript
const PROTECTED_ROUTES: RouteConfig[] = [
  // Member routes (all authenticated users)
  {
    path: '/api/bookings/my-bookings',
    roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  
  // Admin routes
  {
    path: '/api/admin/bookings',
    roles: ['ADMIN', 'SUPERADMIN'],
    requiresAuth: true,
  },
  
  // SuperAdmin routes
  {
    path: '/api/superadmin/users/role',
    roles: ['SUPERADMIN'],
    requiresAuth: true,
  },
]
```

### Public Routes

Routes accessible without authentication:

- `/` - Homepage
- `/login` - Login page
- `/verify-otp` - OTP verification
- `/api/auth/*` - Authentication endpoints
- `/_next/*` - Next.js static files
- `/favicon.ico` - Favicon

### Headers Injected by Middleware

#### User Context Headers
- `x-user-id` - User ID
- `x-user-role` - User role (MEMBER/ADMIN/SUPERADMIN)
- `x-user-phone` - User phone number
- `x-user-name` - User name
- `x-user-email` - User email (optional)

#### Audit Context Headers (API routes only)
- `x-audit-ip` - Client IP address
- `x-audit-user-agent` - User agent string
- `x-audit-route` - Request route path
- `x-audit-method` - HTTP method (GET/POST/PUT/DELETE)
- `x-audit-timestamp` - Request timestamp
- `x-audit-required` - Flag for admin/superadmin actions

---

## Permission System

### File: `src/lib/auth/permissions.ts`

### Permission Format

```typescript
{
  name: 'resource:action',
  description: 'Human-readable description',
  roles: ['ADMIN', 'SUPERADMIN'],
  resource: 'RESOURCE_TYPE',
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE'
}
```

### Available Permissions

#### User Management
- `users:create` - Create new users (ADMIN, SUPERADMIN)
- `users:read` - View user information (ADMIN, SUPERADMIN)
- `users:update` - Update user information (ADMIN, SUPERADMIN)
- `users:delete` - Delete users (SUPERADMIN only)
- `users:change-role` - Change user roles (SUPERADMIN only)

#### Booking Management
- `bookings:create` - Create bookings (ALL)
- `bookings:read` - View own bookings (ALL)
- `bookings:read-all` - View all bookings (ADMIN, SUPERADMIN)
- `bookings:update` - Update bookings (ADMIN, SUPERADMIN)
- `bookings:delete` - Delete bookings (ADMIN, SUPERADMIN)
- `bookings:override` - Override booking rules (ADMIN, SUPERADMIN)
- `bookings:force-checkin` - Force check-in (ADMIN, SUPERADMIN)
- `bookings:force-checkout` - Force check-out (ADMIN, SUPERADMIN)

#### Room Management
- `rooms:create` - Create rooms (ADMIN, SUPERADMIN)
- `rooms:read` - View rooms (ALL)
- `rooms:update` - Update rooms (ADMIN, SUPERADMIN)
- `rooms:delete` - Delete rooms (SUPERADMIN only)
- `room-types:manage` - Manage room types (ADMIN, SUPERADMIN)

#### Payment Management
- `payments:create` - Process payments (ALL)
- `payments:read` - View payments (ADMIN, SUPERADMIN)
- `payments:refund` - Process refunds (ADMIN, SUPERADMIN)
- `payments:override` - Override payment rules (SUPERADMIN only)

#### Inventory Management
- `inventory:read` - View inventory (ADMIN, SUPERADMIN)
- `inventory:update` - Update inventory (ADMIN, SUPERADMIN)
- `inventory:override` - Override inventory limits (ADMIN, SUPERADMIN)

#### System Management
- `system:settings` - Manage settings (SUPERADMIN only)
- `system:backup` - Backup database (SUPERADMIN only)
- `system:restore` - Restore database (SUPERADMIN only)
- `system:maintenance` - System maintenance (SUPERADMIN only)
- `audit-logs:read` - View audit logs (ADMIN, SUPERADMIN)

### Permission Checking Functions

```typescript
// Check if user has permission
const result = await checkPermission(user, 'bookings:override')
if (!result.granted) {
  throw new Error(result.reason)
}

// Require permission (throws if not granted)
await requirePermission(user, 'bookings:override', true)

// Check resource-level permission
const canUpdate = await checkResourcePermission(
  user,
  'BOOKING',
  'UPDATE',
  bookingId
)

// Check role
if (isAdmin(user.role)) {
  // Admin-only logic
}

// Require role (throws if not granted)
requireSuperAdmin(user.role)
```

---

## Audit Logging

### File: `src/lib/services/audit.service.ts`

### Audit Actions

All admin/superadmin actions are logged with:
- **Who**: Admin user ID and role
- **What**: Action performed
- **When**: Timestamp
- **Where**: IP address, user agent, request URL
- **Why**: Reason for action (required for overrides)
- **Changes**: Before/after state

### Action Types

#### Authentication & Authorization
- `LOGIN` - User login
- `LOGOUT` - User logout
- `ACCESS_GRANTED` - Access granted to resource
- `ACCESS_DENIED` - Access denied to resource
- `PERMISSION_CHECK` - Permission verification

#### User Management
- `USER_CREATE` - User created
- `USER_UPDATE` - User updated
- `USER_DELETE` - User deleted
- `USER_ROLE_CHANGE` - User role changed
- `USER_STATUS_CHANGE` - User status changed

#### Booking Management
- `BOOKING_CREATE` - Booking created
- `BOOKING_UPDATE` - Booking updated
- `BOOKING_DELETE` - Booking deleted
- `BOOKING_OVERRIDE_CONFIRM` - Booking confirmed by admin
- `BOOKING_OVERRIDE_CANCEL` - Booking cancelled by admin
- `BOOKING_STATUS_CHANGE` - Booking status changed
- `BOOKING_FORCE_CHECKIN` - Forced check-in
- `BOOKING_FORCE_CHECKOUT` - Forced check-out

#### Payment Management
- `PAYMENT_CREATE` - Payment processed
- `PAYMENT_UPDATE` - Payment updated
- `PAYMENT_DELETE` - Payment deleted
- `PAYMENT_REFUND` - Refund processed
- `PAYMENT_OVERRIDE` - Payment rule overridden

#### System Management
- `SYSTEM_SETTINGS_UPDATE` - Settings updated
- `SYSTEM_CONFIG_CHANGE` - Configuration changed
- `DATABASE_BACKUP` - Database backed up
- `DATABASE_RESTORE` - Database restored

### Audit Log Functions

```typescript
// Create audit log
await createAuditLog({
  adminId: user.id,
  adminRole: user.role,
  action: AuditAction.BOOKING_OVERRIDE_CONFIRM,
  targetType: AuditTargetType.BOOKING,
  targetId: booking.id,
  reason: 'Customer special request',
  changes: {
    before: { status: 'PENDING' },
    after: { status: 'CONFIRMED' }
  },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
})

// Query audit logs
const logs = await getAuditLogs({
  adminId: user.id,
  action: AuditAction.BOOKING_OVERRIDE_CONFIRM,
  startDate: new Date('2025-01-01'),
  limit: 50
})

// Get audit statistics
const stats = await getAuditLogStats(user.id)

// Get user activity timeline
const timeline = await getUserAuditTimeline(user.id, 100)

// Export audit logs to CSV
const csv = await exportAuditLogsToCsv({
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31')
})
```

### Database Schema

```prisma
model AdminAuditLog {
  id          String   @id @default(cuid())
  adminId     String
  action      String   // Action performed
  targetType  String   // Resource type
  targetId    String   // Resource ID
  changes     String?  // JSON: before/after values
  reason      String   // Required reason
  metadata    String?  // JSON: additional info
  adminIp     String?  // IP address
  createdAt   DateTime @default(now())
  
  @@index([adminId])
  @@index([action])
  @@index([targetType, targetId])
  @@index([createdAt])
}
```

---

## API Routes Protection

### File: `src/lib/utils/api-request.ts`

### Implementation Pattern

```typescript
import { requireAuth, requireAdmin, logAction } from '@/lib/utils/api-request'
import { AuditAction, AuditTargetType } from '@/lib/services/audit.service'

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication & Authorization
    const user = await requireAuth()
    await requireAdmin()
    
    // 2. Parse & Validate
    const body = await request.json()
    const validated = schema.parse(body)
    
    // 3. Permission Check (optional - for fine-grained control)
    await requirePermission(user, 'bookings:override', true)
    
    // 4. Execute Business Logic
    const result = await performAction(validated)
    
    // 5. Audit Logging
    await logAction(
      AuditAction.BOOKING_UPDATE,
      AuditTargetType.BOOKING,
      result.id,
      {
        reason: validated.reason,
        changes: { before: oldState, after: newState },
        metadata: { adminName: user.name }
      }
    )
    
    return NextResponse.json({ success: true, data: result })
    
  } catch (error) {
    // Error handling
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### Available Utilities

#### Authentication
```typescript
// Get authenticated user (returns null if not authenticated)
const user = await getRequestUser()

// Require authentication (throws if not authenticated)
const user = await requireAuth()

// Get user context for permission checks
const context = await getUserContext()
```

#### Role Checking
```typescript
// Check if user has role
if (await hasRole(['ADMIN', 'SUPERADMIN'])) {
  // Admin logic
}

// Require specific role (throws if not granted)
await requireRole(['ADMIN', 'SUPERADMIN'])

// Convenience functions
await requireAdmin()        // Requires ADMIN or SUPERADMIN
await requireSuperAdmin()   // Requires SUPERADMIN only
```

#### Audit Logging
```typescript
// Log action with full context
await logAction(
  AuditAction.BOOKING_UPDATE,
  AuditTargetType.BOOKING,
  bookingId,
  { reason: 'Admin override', changes: {...} }
)

// Auto-log only for admin/superadmin
await autoLogAction(...)
```

#### Audit Context
```typescript
// Get audit context
const audit = await getAuditContext()
console.log(audit.ipAddress, audit.userAgent)

// Check if audit required
if (await isAuditRequired()) {
  // Log this action
}
```

---

## Server Actions

### Implementation Pattern

Server actions should include permission checks using the utilities:

```typescript
'use server'

import { requirePermission } from '@/lib/auth/permissions'
import { createAuditLog } from '@/lib/services/audit.service'

export async function updateBooking(userId: string, bookingId: string, data: any) {
  // 1. Get user from database
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')
  
  // 2. Check permission
  await requirePermission(
    { id: user.id, role: user.role, phone: user.phone, email: user.email },
    'bookings:update',
    true // Log permission check
  )
  
  // 3. Execute action
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data
  })
  
  // 4. Audit log
  await createAuditLog({
    adminId: user.id,
    adminRole: user.role,
    action: 'BOOKING_UPDATE',
    targetType: 'BOOKING',
    targetId: bookingId,
    reason: 'Admin update',
    changes: { before: oldBooking, after: booking }
  })
  
  return booking
}
```

---

## Implementation Guide

### Step 1: Protect an API Route

```typescript
// 1. Add route to middleware PROTECTED_ROUTES
{
  path: '/api/admin/my-route',
  roles: ['ADMIN', 'SUPERADMIN'],
  requiresAuth: true,
}

// 2. Add RBAC to route handler
import { requireAuth, requireAdmin, logAction } from '@/lib/utils/api-request'

export async function POST(request: NextRequest) {
  const user = await requireAuth()
  await requireAdmin()
  
  // Your logic here
  
  await logAction(AuditAction.MY_ACTION, AuditTargetType.MY_RESOURCE, id)
  
  return NextResponse.json({ success: true })
}
```

### Step 2: Add Permission Check

```typescript
import { requirePermission } from '@/lib/auth/permissions'

// In your route handler
await requirePermission(user, 'resource:action', true)
```

### Step 3: Add Audit Logging

```typescript
import { logAction, AuditAction, AuditTargetType } from '@/lib/utils/api-request'

await logAction(
  AuditAction.MY_ACTION,
  AuditTargetType.MY_RESOURCE,
  resourceId,
  {
    reason: 'Why this action was performed',
    changes: { before: oldState, after: newState },
    metadata: { additionalInfo: 'value' }
  }
)
```

### Step 4: Test

1. **Test as MEMBER**: Should get 403 Forbidden
2. **Test as ADMIN**: Should succeed (if ADMIN allowed)
3. **Test as SUPERADMIN**: Should succeed
4. **Check audit logs**: Verify action logged in `admin_audit_logs` table

---

## Best Practices

### 1. Always Use Middleware Protection
All sensitive routes must be in `PROTECTED_ROUTES` configuration.

### 2. Fail Securely
- Use `requireAuth()` instead of `getRequestUser()` for protected routes
- Use `requireRole()` instead of `hasRole()` when role is mandatory
- Always validate permissions before executing actions

### 3. Log All Admin Actions
- Override operations
- Status changes
- Deletions
- Role changes
- System configuration changes

### 4. Provide Reasons
Always require a reason for override actions:
```typescript
{ reason: 'Customer called to request early check-in' }
```

### 5. Store Before/After State
Log what changed:
```typescript
{
  changes: {
    before: { status: 'PENDING', total: 1000 },
    after: { status: 'CONFIRMED', total: 900 }
  }
}
```

### 6. Use Proper HTTP Status Codes
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized)
- `404` - Not found
- `400` - Bad request (validation error)
- `500` - Internal server error

### 7. Don't Log Sensitive Data
Never log:
- Passwords
- API keys
- Credit card numbers
- Full phone numbers (mask: `+1*****1234`)

### 8. Implement Audit Log Retention
Clean up old logs periodically:
```typescript
// Keep logs for 90 days
await cleanupOldAuditLogs(90)
```

### 9. Monitor Audit Logs
- Review denied access attempts
- Monitor unusual patterns
- Alert on suspicious activity

### 10. Test RBAC Thoroughly
- Test each role's access
- Test permission boundaries
- Verify audit logs created
- Test error responses

---

## Common Patterns

### Pattern 1: Simple Admin Route

```typescript
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    await requireAdmin()
    
    const body = await request.json()
    const result = await doSomething(body)
    
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error.message.includes('required')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### Pattern 2: Route with Permission Check

```typescript
export async function POST(request: NextRequest) {
  const user = await requireAuth()
  const context = await getUserContext()
  
  await requirePermission(context, 'bookings:override', true)
  
  // Your logic
}
```

### Pattern 3: Route with Audit Logging

```typescript
export async function POST(request: NextRequest) {
  const user = await requireAuth()
  await requireAdmin()
  
  const body = await request.json()
  const result = await updateResource(body)
  
  await logAction(
    AuditAction.RESOURCE_UPDATE,
    AuditTargetType.RESOURCE,
    result.id,
    { reason: body.reason, changes: { before, after } }
  )
  
  return NextResponse.json({ success: true })
}
```

---

## Troubleshooting

### Issue: 401 Unauthorized
- Check if JWT token is present in Authorization header or cookie
- Verify token is not expired
- Check JWT_ACCESS_SECRET matches between systems

### Issue: 403 Forbidden
- Verify user has required role
- Check PROTECTED_ROUTES configuration
- Ensure permission is granted for user's role

### Issue: Audit Logs Not Created
- Check if route has `x-audit-required` header
- Verify logAction() is called
- Check database connection
- Review Prisma client logs

### Issue: Permission Check Fails
- Verify permission exists in PERMISSIONS object
- Check user role matches permission's required roles
- Ensure permission name is correct (format: `resource:action`)

---

## Security Considerations

1. **JWT Secret**: Use strong, random secret in production
2. **Token Expiration**: Set appropriate expiration times
3. **HTTPS Only**: Always use HTTPS in production
4. **Rate Limiting**: Implement rate limiting on API routes
5. **Input Validation**: Validate all inputs with Zod schemas
6. **SQL Injection**: Use Prisma parameterized queries
7. **XSS Protection**: Sanitize user inputs
8. **CSRF Protection**: Use CSRF tokens for state-changing operations

---

## Related Files

- `middleware.ts` - Route protection and JWT verification
- `src/lib/auth/permissions.ts` - Permission definitions and checking
- `src/lib/services/audit.service.ts` - Audit logging functions
- `src/lib/utils/api-request.ts` - Request context utilities
- `src/app/api/_examples/rbac-protected-route-example.ts` - Implementation template
- `prisma/schema.prisma` - Database schema (AdminAuditLog model)

---

## Maintenance Tasks

### Daily
- Monitor audit logs for suspicious activity
- Review failed authentication attempts

### Weekly
- Review admin actions
- Check for unusual patterns
- Verify audit logs are being created

### Monthly
- Audit permission assignments
- Review role assignments
- Clean up old audit logs (retention policy)
- Review and update permissions as needed

### Quarterly
- Security audit of RBAC implementation
- Review and update documentation
- Test all protected routes
- Verify audit log completeness

---

## Version History

- **v1.0** (2025-10-27) - Initial RBAC implementation
  - Middleware protection for all routes
  - Permission system with 30+ permissions
  - Audit logging for all admin actions
  - Request context utilities
  - Complete documentation

---

## Support

For questions or issues with RBAC implementation:
1. Check this documentation
2. Review example implementations
3. Check audit logs for errors
4. Test permissions in development environment
5. Review middleware logs for debugging

---

**Last Updated**: October 27, 2025  
**Version**: 1.0.0  
**Author**: Hotel Booking System Team
