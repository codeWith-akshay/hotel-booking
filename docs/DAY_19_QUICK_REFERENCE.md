# Day 19: Quick Reference Guide

## 🚀 Quick Start

### 1. Environment Setup

```env
# Required
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# Cron Security
CRON_SECRET="your_random_32_char_string"

# Production (Optional for Development)
WHATSAPP_API_KEY="your_key"
EMAIL_API_KEY="your_key"
EMAIL_FROM="noreply@ircahotel.com"
```

### 2. Database Migration

```bash
npx prisma migrate dev
```

### 3. Start Development Server

```bash
pnpm dev
```

---

## 📦 Key Functions

### Send Notification Immediately

```typescript
import { createNotification } from '@/actions/notifications';

const result = await createNotification({
  userId: 'cm1user123',
  type: 'BOOKING_CONFIRMATION',
  channel: 'EMAIL',
  message: 'Your booking is confirmed!',
  subject: 'Booking Confirmed',
  scheduledAt: new Date(), // Send now
});
```

### Schedule Future Notification

```typescript
import { scheduleNotification } from '@/actions/notifications';

const result = await scheduleNotification({
  userId: 'cm1user123',
  type: 'BOOKING_REMINDER',
  channel: 'WHATSAPP',
  message: 'Your check-in is tomorrow!',
  scheduledAt: new Date('2025-01-24T09:00:00Z'),
  requestUserId: currentUser.id,
});
```

### Use Message Templates

```typescript
import { generateMessage } from '@/lib/utils/notificationUtils';

const { message, subject } = generateMessage('BOOKING_REMINDER', 'EMAIL', {
  userName: 'John Doe',
  userEmail: 'john@example.com',
  bookingId: 'cm1abc123',
  roomTypeName: 'Deluxe Room',
  checkInDate: new Date('2025-01-24'),
  checkOutDate: new Date('2025-01-27'),
  totalAmount: 15000,
});
```

### Broadcast to All Users

```typescript
import { broadcastNotification } from '@/actions/notifications';

const result = await broadcastNotification({
  adminId: superAdmin.id,
  channel: 'IN_APP',
  message: 'System maintenance tomorrow at 2 AM',
  filterByRole: 'MEMBER', // Optional: target specific role
});
```

---

## 🎨 UI Components

### Display Notification

```typescript
import NotificationCard from '@/components/notifications/NotificationCard';

<NotificationCard
  notification={notification}
  onMarkAsRead={(id) => console.log('Read:', id)}
  onCancel={(id) => console.log('Cancel:', id)}
  onRetry={(id) => console.log('Retry:', id)}
/>
```

### Loading State

```typescript
import { NotificationCardSkeleton } from '@/components/notifications/NotificationCard';

<NotificationCardSkeleton />
```

### Empty State

```typescript
import { NotificationCardEmpty } from '@/components/notifications/NotificationCard';

<NotificationCardEmpty />
```

---

## 🔗 API Endpoints

### List Notifications

```bash
GET /api/notifications?type=BOOKING_REMINDER&status=SENT&page=1&limit=20
```

### Send Notification

```bash
POST /api/notifications/send
Content-Type: application/json

{
  "userId": "cm1user123",
  "type": "BOOKING_CONFIRMATION",
  "channel": "EMAIL",
  "message": "Your booking is confirmed!",
  "subject": "Booking Confirmed"
}
```

### Broadcast

```bash
POST /api/notifications/broadcast
Content-Type: application/json

{
  "channel": "EMAIL",
  "message": "System maintenance notice",
  "filterByRole": "MEMBER"
}
```

### Trigger Cron Job

```bash
GET /api/cron/send-notifications?secret=YOUR_CRON_SECRET
# or
GET /api/cron/send-notifications
Authorization: Bearer YOUR_CRON_SECRET
```

---

## 📊 Notification Types

| Type | Use Case | Auto-Scheduled |
|------|----------|----------------|
| `BOOKING_REMINDER` | 24h before check-in | ✅ Yes |
| `PAYMENT_REMINDER` | Payment due soon | ✅ Yes |
| `WAITLIST_ALERT` | Room available | ❌ Manual |
| `BROADCAST` | Admin announcements | ❌ Manual |
| `BOOKING_CONFIRMATION` | Booking created | ❌ Manual |
| `CANCELLATION_NOTICE` | Booking cancelled | ❌ Manual |
| `INVOICE_READY` | Invoice generated | ❌ Manual |

---

## 🚦 Notification Status Flow

```
PENDING → SENT (Success)
        ↓
      FAILED → PENDING (Retry with exponential backoff)
                     ↓
                   FAILED (After 3 retries)

PENDING → CANCELLED (User/Admin cancelled)
```

---

## 🔐 RBAC Rules

| Action | Member | Admin | SuperAdmin |
|--------|--------|-------|------------|
| View own notifications | ✅ | ✅ | ✅ |
| View all notifications | ❌ | ✅ | ✅ |
| Send to self | ✅ | ✅ | ✅ |
| Send to any user | ❌ | ✅ | ✅ |
| Schedule notifications | ❌ | ✅ | ✅ |
| Broadcast | ❌ | ❌ | ✅ |
| Retry failed | ❌ | ✅ | ✅ |

---

## ⏰ Cron Schedule

| Job | Schedule | Description |
|-----|----------|-------------|
| Send pending | `*/5 * * * *` | Every 5 minutes |
| Booking reminders | `0 9 * * *` | Daily at 9 AM |
| Payment reminders | `0 10 * * *` | Daily at 10 AM |
| Cleanup old | `0 2 * * 0` | Sunday at 2 AM |

---

## 🐛 Debug Commands

```bash
# Check pending notifications
SELECT * FROM Notification WHERE status = 'PENDING' ORDER BY scheduledAt;

# Check failed notifications
SELECT * FROM Notification WHERE status = 'FAILED' ORDER BY createdAt DESC LIMIT 10;

# Success rate by channel
SELECT 
  channel,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) as sent,
  ROUND(SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as success_rate
FROM Notification
GROUP BY channel;
```

---

## 📝 Message Template Placeholders

Available placeholders for `generateMessage()`:

- `{userName}` - User's full name
- `{userEmail}` - User's email
- `{userPhone}` - User's phone
- `{bookingId}` - Booking ID
- `{roomTypeName}` - Room type name
- `{checkInDate}` - Check-in date (formatted)
- `{checkOutDate}` - Check-out date (formatted)
- `{totalAmount}` - Total amount (formatted as currency)
- `{dueDate}` - Payment due date (formatted)
- `{paymentLink}` - Link to payment page
- `{bookingLink}` - Link to booking details
- `{invoiceLink}` - Link to invoice
- `{invoiceNumber}` - Invoice number
- `{broadcastSubject}` - Broadcast subject
- `{broadcastMessage}` - Broadcast message

---

## 🎯 Common Patterns

### Pattern 1: Booking Flow Integration

```typescript
// After booking is created
async function afterBookingCreated(booking: Booking) {
  // 1. Send confirmation
  await sendBookingConfirmation(booking);
  
  // 2. Schedule 24h reminder
  await scheduleBookingReminder(booking);
  
  // 3. Schedule payment reminders (if unpaid)
  if (booking.paymentStatus === 'UNPAID') {
    await schedulePaymentReminders(booking);
  }
}
```

### Pattern 2: Waitlist Integration

```typescript
// When room becomes available
async function onRoomAvailable(room: Room) {
  const waitlistUsers = await getWaitlistUsers(room);
  
  for (const user of waitlistUsers) {
    await sendWaitlistAlert(user, room);
  }
}
```

### Pattern 3: Admin Announcements

```typescript
// Send system-wide announcement
async function sendAnnouncement(message: string, role?: Role) {
  await broadcastNotification({
    adminId: currentAdmin.id,
    channel: 'IN_APP',
    message,
    filterByRole: role,
  });
}
```

---

## 🔄 Production Checklist

- [ ] Replace mock WhatsApp service with Twilio/MessageBird
- [ ] Replace mock Email service with SendGrid/AWS SES
- [ ] Set `CRON_SECRET` environment variable
- [ ] Configure Vercel Cron Jobs or external cron service
- [ ] Set up monitoring/alerting for failed notifications
- [ ] Enable cleanup job for old notifications
- [ ] Test notification delivery in production
- [ ] Set up email/SMS rate limiting
- [ ] Configure notification preferences UI
- [ ] Add analytics tracking

---

## 📚 File Locations

| Component | Path |
|-----------|------|
| Prisma Schema | `prisma/schema.prisma` |
| Utilities | `src/lib/utils/notificationUtils.ts` |
| WhatsApp Service | `src/lib/services/whatsapp.ts` |
| Email Service | `src/lib/services/email.ts` |
| Validation | `src/lib/validation/notification.validation.ts` |
| Server Actions | `src/actions/notifications/index.ts` |
| Cron Scheduler | `src/lib/cron/notificationScheduler.ts` |
| API Routes | `src/app/api/notifications/` |
| UI Components | `src/components/notifications/` |
| Member Page | `src/app/(member)/notifications/page.tsx` |
| Admin Broadcast | `src/app/admin/broadcast/page.tsx` |

---

## 🎓 Learn More

- [Full Implementation Guide](./DAY_19_NOTIFICATIONS_IMPLEMENTATION.md)
- [Summary](./DAY_19_SUMMARY.md)
- [Prisma Docs](https://www.prisma.io/docs)
- [node-cron](https://www.npmjs.com/package/node-cron)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
