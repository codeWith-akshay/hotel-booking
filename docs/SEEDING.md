# Database Seeding Documentation

## Overview
The seed script (`prisma/seed.ts`) populates the database with initial data required for the authentication system.

## What Gets Seeded

### 1. Roles (3 roles)

#### MEMBER Role
- **Permissions:**
  - `booking:create` - Create bookings
  - `booking:read:own` - View own bookings
  - `booking:update:own` - Update own bookings
  - `profile:read:own` - View own profile
  - `profile:update:own` - Update own profile

#### ADMIN Role
- **Permissions:**
  - `booking:create` - Create bookings
  - `booking:read:all` - View all bookings
  - `booking:update:all` - Update any booking
  - `booking:delete` - Delete bookings
  - `user:read:all` - View all users
  - `room:create` - Create rooms
  - `room:update` - Update rooms
  - `room:delete` - Delete rooms
  - `dashboard:access` - Access admin dashboard

#### SUPERADMIN Role
- **Permissions:**
  - `all:*` - Full system access (wildcard)
  - `system:settings` - Manage system settings
  - `user:create` - Create users
  - `user:update` - Update users
  - `user:delete` - Delete users
  - `role:manage` - Manage roles
  - `audit:access` - Access audit logs
  - `reports:generate` - Generate reports

### 2. Admin Users (2 users)

#### Admin User
- **Phone:** +1234567890
- **Email:** admin@hotelbooking.com
- **Name:** System Administrator
- **Role:** ADMIN
- **Test OTP:** 123456 (expires in 10 minutes)

#### Super Admin User
- **Phone:** +1987654321
- **Email:** superadmin@hotelbooking.com
- **Name:** Super Administrator
- **Role:** SUPERADMIN

## Running the Seed Script

### First Time Setup
```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database
npm run db:seed
```

### Re-seeding
```bash
# Just run the seed script (uses upsert, safe to run multiple times)
npm run db:seed
```

### Complete Database Reset
```bash
# Reset database and re-run all migrations and seeds
npm run db:reset
```

## Available NPM Scripts

```bash
npm run db:seed       # Run seed script
npm run db:reset      # Reset database, migrations, and re-seed
npm run db:migrate    # Create and apply new migration
npm run db:generate   # Generate Prisma Client
npm run db:studio     # Open Prisma Studio (database GUI)
```

## Seed Script Features

✅ **Idempotent** - Safe to run multiple times (uses `upsert`)
✅ **Error Handling** - Proper try-catch with detailed error messages
✅ **Connection Management** - Automatically closes DB connection
✅ **Console Logging** - Clear progress indicators and summary
✅ **Security** - Passwords/OTPs are properly hashed using bcrypt
✅ **Async/Await** - Proper async handling throughout

## Testing Credentials

### Admin Login
```
Phone: +1234567890
Email: admin@hotelbooking.com
Test OTP: 123456 (for development only)
```

### Super Admin Login
```
Phone: +1987654321
Email: superadmin@hotelbooking.com
```

## Security Notes

⚠️ **IMPORTANT FOR PRODUCTION:**
- Change default admin credentials
- Use environment variables for sensitive data
- Implement proper OTP generation (not hardcoded)
- Use secure password hashing (bcrypt with high rounds)
- Remove test OTP code from seed script

## Verification

After seeding, verify the data:

1. **Via Prisma Studio:**
   ```bash
   npm run db:studio
   ```
   Open http://localhost:5555

2. **Via Database Query:**
   ```bash
   npx prisma db execute --stdin < verify.sql
   ```

3. **Check logs in terminal** - The seed script outputs detailed information about created records

## Troubleshooting

### Error: "Role not found"
- Ensure migrations are applied: `npm run db:migrate`
- Check database connection in `.env`

### Error: "Unique constraint violation"
- Database already seeded, this is expected
- Script uses `upsert` so it's safe to re-run

### Error: "Cannot connect to database"
- Verify `DATABASE_URL` in `.env`
- Ensure database server is running
- Check network connectivity

## Next Steps

After successful seeding:
1. ✅ Verify data in Prisma Studio
2. ✅ Test authentication with seeded users
3. ✅ Implement OTP generation logic
4. ✅ Build login/authentication endpoints
5. ✅ Create RBAC middleware using seeded roles
