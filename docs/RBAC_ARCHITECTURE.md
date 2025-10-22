# RBAC Middleware Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Hotel Booking System                            │
│                     Role-Based Access Control (RBAC)                     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         Client Layer                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Browser                          Mobile App              API Client    │
│    │                                  │                       │          │
│    │ Cookie: auth-session            │ Authorization:        │          │
│    │                                  │ Bearer <token>        │          │
│    └──────────────────────────────────┴───────────────────────┘          │
│                                  │                                       │
└──────────────────────────────────┼───────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Next.js Middleware Layer                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  middleware.ts                                                           │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                                                                 │    │
│  │  1. Extract Token                                              │    │
│  │     ├─ Authorization Header (Bearer token)                     │    │
│  │     └─ Cookie (auth-session)                                   │    │
│  │                                                                 │    │
│  │  2. Verify JWT Token                                           │    │
│  │     ├─ Signature validation                                    │    │
│  │     ├─ Expiration check                                        │    │
│  │     └─ Payload extraction                                      │    │
│  │                                                                 │    │
│  │  3. Check Route Protection                                     │    │
│  │     ├─ Public routes → Allow                                   │    │
│  │     └─ Protected routes → Verify auth                          │    │
│  │                                                                 │    │
│  │  4. Validate Role                                              │    │
│  │     ├─ Compare user role vs required roles                     │    │
│  │     └─ Grant/Deny access                                       │    │
│  │                                                                 │    │
│  │  5. Inject User Context                                        │    │
│  │     ├─ x-user-id header                                        │    │
│  │     ├─ x-user-role header                                      │    │
│  │     ├─ x-user-name header                                      │    │
│  │     └─ x-user-phone header                                     │    │
│  │                                                                 │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
        ┌───────────────────┐         ┌───────────────────┐
        │   403 Forbidden    │         │   401 Unauthorized│
        │   (Bad Role)       │         │   (No/Bad Token)  │
        └───────────────────┘         └───────────────────┘
                    │                             │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                         ┌──────────────────┐
                         │  Is API Route?   │
                         └─────────┬────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
          ┌──────────────────┐        ┌──────────────────┐
          │  Return JSON     │        │  Redirect to     │
          │  Error Response  │        │  /login          │
          └──────────────────┘        └──────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Application Layer                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Route Handlers (app/api/*/route.ts)                                    │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                                                                 │    │
│  │  import { getCurrentUser } from '@/lib/middleware/auth.utils'  │    │
│  │                                                                 │    │
│  │  export async function GET(request: NextRequest) {             │    │
│  │    const user = await getCurrentUser()                         │    │
│  │    // User context available from middleware headers           │    │
│  │    return NextResponse.json({ userId: user.userId })           │    │
│  │  }                                                              │    │
│  │                                                                 │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Server Components (app/**/page.tsx)                                    │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                                                                 │    │
│  │  export default async function DashboardPage() {               │    │
│  │    const user = await getCurrentUser()                         │    │
│  │    if (!user) redirect('/login')                               │    │
│  │    return <div>Welcome, {user.name}!</div>                     │    │
│  │  }                                                              │    │
│  │                                                                 │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌────────────┐
│   Client   │
└──────┬─────┘
       │
       │ 1. Request with JWT token
       │
       ▼
┌────────────────────────────────────────┐
│  Next.js Middleware (middleware.ts)    │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Token Extraction                 │ │
│  │ Authorization: Bearer <token>    │ │
│  │ Cookie: auth-session=<token>     │ │
│  └──────────┬───────────────────────┘ │
│             │                          │
│             ▼                          │
│  ┌──────────────────────────────────┐ │
│  │ JWT Verification                 │ │
│  │ - Validate signature             │ │
│  │ - Check expiration               │ │
│  │ - Extract payload                │ │
│  └──────────┬───────────────────────┘ │
│             │                          │
│             ▼                          │
│  ┌──────────────────────────────────┐ │
│  │ Role Authorization               │ │
│  │ - Match route config             │ │
│  │ - Check user role                │ │
│  │ - Grant/Deny access              │ │
│  └──────────┬───────────────────────┘ │
│             │                          │
│             ▼                          │
│  ┌──────────────────────────────────┐ │
│  │ Context Injection                │ │
│  │ x-user-id: <userId>              │ │
│  │ x-user-role: <role>              │ │
│  │ x-user-name: <name>              │ │
│  └──────────┬───────────────────────┘ │
└─────────────┼────────────────────────┘
              │
              │ 2. Request with user context
              │
              ▼
┌────────────────────────────────────────┐
│  Route Handler or Server Component     │
│                                        │
│  const user = await getCurrentUser()   │
│  // Access user data from headers      │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Business Logic                   │ │
│  │ - Query database                 │ │
│  │ - Process request                │ │
│  │ - Check permissions              │ │
│  └──────────┬───────────────────────┘ │
└─────────────┼────────────────────────┘
              │
              │ 3. Response
              │
              ▼
┌────────────┐
│   Client   │
└────────────┘
```

## Role Hierarchy

```
                    ┌──────────────┐
                    │  SUPERADMIN  │
                    │  (Level 3)   │
                    └──────┬───────┘
                           │
                           │ Full System Access
                           │
                    ┌──────▼───────┐
                    │    ADMIN     │
                    │  (Level 2)   │
                    └──────┬───────┘
                           │
                           │ Administrative Access
                           │
                    ┌──────▼───────┐
                    │    MEMBER    │
                    │  (Level 1)   │
                    └──────────────┘
                           │
                           │ Basic User Access
                           │
```

### Permission Matrix

| Route | MEMBER | ADMIN | SUPERADMIN |
|-------|--------|-------|------------|
| `/` (Home) | ✅ | ✅ | ✅ |
| `/login` | ✅ | ✅ | ✅ |
| `/dashboard` | ✅ | ✅ | ✅ |
| `/api/user/profile` | ✅ | ✅ | ✅ |
| `/admin` | ❌ | ✅ | ✅ |
| `/api/admin/*` | ❌ | ✅ | ✅ |
| `/superadmin` | ❌ | ❌ | ✅ |

## Component Interaction

```
┌─────────────────────────────────────────────────────────────┐
│                    middleware.ts                             │
│  Main middleware logic, token verification, role checking    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ imports
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Types      │ │  JWT Service │ │  Auth Utils  │
│ ────────     │ │ ──────────── │ │ ───────────  │
│ middleware   │ │ Token gen    │ │ getCurrentU  │
│ .types.ts    │ │ Token verify │ │ requireAuth  │
│              │ │ Cookie mgmt  │ │ hasRole      │
│ RouteConfig  │ │              │ │ requireRole  │
│ Middleware   │ │ jwt.service  │ │              │
│ Context      │ │ .ts          │ │ auth.utils   │
│ Error        │ │              │ │ .ts          │
│ Response     │ │              │ │              │
└──────────────┘ └──────────────┘ └──────┬───────┘
                                         │
                                         │ used by
                                         │
                            ┌────────────┴────────────┐
                            │                         │
                            ▼                         ▼
                  ┌──────────────────┐     ┌──────────────────┐
                  │  API Routes      │     │ Server Components│
                  │  ──────────      │     │ ──────────────── │
                  │  route.ts files  │     │  page.tsx files  │
                  │                  │     │                  │
                  │  GET, POST,      │     │  async function  │
                  │  PUT, DELETE     │     │  components      │
                  └──────────────────┘     └──────────────────┘
```

## Token Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Authentication Flow                      │
└─────────────────────────────────────────────────────────────┘

1. Login
   ┌────────┐                    ┌────────────┐
   │ Client │──── Login ────────>│   Server   │
   └────────┘   (Phone + OTP)    │            │
        ▲                        │ Verify OTP │
        │                        │ Generate   │
        │                        │ JWT Token  │
        │                        └─────┬──────┘
        │                              │
        │ Response with token          │
        │ + Set cookie                 │
        └──────────────────────────────┘

2. Subsequent Requests
   ┌────────┐                    ┌────────────────┐
   │ Client │─── Request ───────>│  Middleware    │
   │        │  (with token)      │                │
   │        │                    │ 1. Extract     │
   │        │                    │ 2. Verify      │
   │        │                    │ 3. Authorize   │
   │        │                    │ 4. Inject      │
   │        │                    └────┬───────────┘
   │        │                         │
   │        │                         ▼
   │        │                    ┌────────────────┐
   │        │<─── Response ──────│  Route Handler │
   │        │                    │  (with user)   │
   └────────┘                    └────────────────┘

3. Token Expiration
   ┌────────┐                    ┌────────────────┐
   │ Client │─── Request ───────>│  Middleware    │
   │        │  (expired token)   │                │
   │        │                    │ Verify fails   │
   │        │                    └────┬───────────┘
   │        │                         │
   │        │<─── 401 Unauthorized ───┤
   │        │     Redirect to /login  │
   └────────┘                         │
        │                             │
        │ Redirect to login           │
        └─────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Error Scenarios                         │
└─────────────────────────────────────────────────────────────┘

Scenario 1: No Token
   Request → Middleware → No token found
      │
      ├─ API Route? → Yes → 401 JSON Response
      └─ Browser? → Yes → Redirect to /login

Scenario 2: Invalid Token
   Request → Middleware → Invalid signature/format
      │
      ├─ API Route? → Yes → 401 JSON Response
      └─ Browser? → Yes → Redirect to /login

Scenario 3: Expired Token
   Request → Middleware → Token expired
      │
      ├─ API Route? → Yes → 401 JSON Response
      └─ Browser? → Yes → Redirect to /login

Scenario 4: Insufficient Permissions
   Request → Middleware → Valid token, wrong role
      │
      ├─ API Route? → Yes → 403 JSON Response
      └─ Browser? → Yes → Redirect to /dashboard?error=forbidden
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Security Stack                           │
└─────────────────────────────────────────────────────────────┘

Layer 1: Transport Security
   ├─ HTTPS in production
   ├─ Secure cookie flag
   └─ SameSite cookie attribute

Layer 2: Token Security
   ├─ JWT signature verification (HS256)
   ├─ Token expiration (15 min)
   ├─ Strong secret key (32+ chars)
   └─ HTTP-only cookies (XSS protection)

Layer 3: Authorization
   ├─ Role-based access control
   ├─ Route-level protection
   ├─ Server-side validation only
   └─ Fail-safe strategy

Layer 4: Application Security
   ├─ Input validation
   ├─ SQL injection prevention (Prisma)
   ├─ CSRF protection (SameSite cookies)
   └─ Rate limiting (future enhancement)
```

## Performance Optimization

```
┌─────────────────────────────────────────────────────────────┐
│                  Performance Strategy                        │
└─────────────────────────────────────────────────────────────┘

1. Efficient Route Matching
   ├─ O(n) lookup for public routes
   ├─ Early return for public routes
   └─ Prefix matching for grouped routes

2. Single Token Verification
   ├─ Verify once per request
   ├─ Cache in request headers
   └─ No repeated database calls

3. Minimal Overhead
   ├─ Runs only for matched routes
   ├─ Skip static assets (_next/*, images)
   └─ Debug logs only in development

4. Optimized for Edge
   ├─ No database calls in middleware
   ├─ Stateless JWT verification
   └─ Fast response times (<10ms)
```

---

**Legend:**
- ✅ Allowed
- ❌ Denied
- → Data flow
- ├─ Decision branch
- └─ End of branch
- ▼ Flow direction

---

**Last Updated**: October 22, 2025
