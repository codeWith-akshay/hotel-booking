# Day 19: Notifications Engine & Scheduled Reminders - Implementation Summary

## Overview
Implemented a comprehensive notifications and scheduled reminders system for the hotel booking platform with automated booking/payment reminders, waitlist alerts, admin broadcasts, and mock WhatsApp/Email integrations.

## ✅ Completed Features (So Far)

### 1. Database Layer
- ✅ **Prisma Notification Model** - Full schema with enums
  - NotificationType enum (7 types: BOOKING_REMINDER, PAYMENT_REMINDER, WAITLIST_ALERT, BROADCAST, BOOKING_CONFIRMATION, CANCELLATION_NOTICE, INVOICE_READY)
  - NotificationChannel enum (EMAIL, WHATSAPP, SMS, IN_APP)
  - NotificationStatus enum (PENDING, SENT, FAILED, CANCELLED)
  - User and Booking relations
  - Scheduling fields (scheduledAt, sentAt)
  - Retry tracking (retryCount, errorMessage)
  - Metadata storage (JSON)

### 2. Utility Functions
- ✅ **notificationUtils.ts** (~500 lines)
  - **Message Templates**: 7 notification types × 4 channels = 28 templates
  - `generateMessage()` - Template rendering with placeholder replacement
  - `replacePlaceholders()` - Smart data injection (dates, currency, etc.)
  - `calculateBookingReminderTime()` - 24h before check-in
  - `calculatePaymentReminderTime()` - 3 days, 1 day, due date
  - `shouldSendNow()` - Scheduling logic
  - `canRetryNotification()` - Retry eligibility
  - `calculateRetryTime()` - Exponential backoff
  - Type/status helpers for UI display

### 3. Mock Service Integrations
- ✅ **whatsapp.ts** (~200 lines)
  - `sendWhatsAppMessage()` - Mock API with 5% random failure rate
  - `sendBulkWhatsAppMessages()` - Batch sending with rate limiting
  - `validateWhatsAppMessage()` - Content validation (4096 char limit)
  - `formatPhoneNumber()` - International format enforcement
  - Production integration template (commented out for Twilio/MessageBird)

- ✅ **email.ts** (~350 lines)
  - `sendEmail()` - Mock API with 3% random failure rate
  - `sendBulkEmails()` - Batch sending
  - `isValidEmail()` - Email validation
  - `createEmailTemplate()` - Professional HTML template with styling
  - `textToHtml()` - Plain text converter
  - Production templates for SendGrid and AWS SES (commented out)

## 📦 Packages Installed
- ✅ **date-fns** - Already installed (date manipulation)

## 📁 Files Created (5 files so far)

### Database (1 migration)
1. `prisma/migrations/20251023124753_add_notification_model/` - Notification schema with enums

### Core Business Logic (4 files)
2. `src/lib/utils/notificationUtils.ts` - Message templates and scheduling
3. `src/lib/services/whatsapp.ts` - WhatsApp mock integration
4. `src/lib/services/email.ts` - Email mock integration
5. (Schema update) `prisma/schema.prisma` - Added Notification model and enums

**Total so far: 5 files created/updated, ~1,100+ lines of code**

## 🎯 Message Template System

### Supported Notification Types
1. **BOOKING_REMINDER** - 24 hours before check-in
2. **PAYMENT_REMINDER** - For unpaid bookings (3 days, 1 day, due date)
3. **WAITLIST_ALERT** - When room becomes available
4. **BROADCAST** - Admin announcements
5. **BOOKING_CONFIRMATION** - Booking confirmed notification
6. **CANCELLATION_NOTICE** - Booking cancelled notification
7. **INVOICE_READY** - Invoice generated notification

### Channels Supported
- **EMAIL** - HTML emails with professional templates
- **WHATSAPP** - Concise messages with emojis
- **SMS** - Ultra-short text messages
- **IN_APP** - Dashboard notifications

### Template Features
- **Placeholder Replacement**: `{userName}`, `{checkInDate}`, `{totalAmount}`, etc.
- **Smart Formatting**:
  - Dates: "January 23, 2025"
  - Currency: "$150.00", "₹5,000.00"
  - Auto-detection based on field names
- **Multi-language Ready**: Easy to extend with i18n

### Example Templates

**Booking Reminder (WhatsApp)**:
```
Hi {userName}! 👋

Reminder: Your check-in at {roomTypeName} is tomorrow ({checkInDate}).

Booking ID: {bookingId}

See you soon! 🏨
```

**Payment Reminder (Email)**:
```
Dear {userName},

This is a reminder that payment for your booking is pending.

Booking Details:
- Booking ID: {bookingId}
- Room Type: {roomTypeName}
- Amount Due: {totalAmount}
- Due Date: {dueDate}

Please complete the payment to confirm your reservation.
```

## ⚙️ Database Schema

```prisma
model Notification {
  id            String              @id @default(cuid())
  userId        String
  bookingId     String?
  type          NotificationType
  channel       NotificationChannel
  message       String
  subject       String?
  status        NotificationStatus  @default(PENDING)
  scheduledAt   DateTime
  sentAt        DateTime?
  retryCount    Int                 @default(0)
  errorMessage  String?
  metadata      String?
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([bookingId])
  @@index([type])
  @@index([channel])
  @@index([status])
  @@index([scheduledAt])
}
```

## 🚀 How It Works

### Scheduling Logic

**Booking Reminders**:
```typescript
const reminderTime = subDays(checkInDate, 1); // 24h before
```

**Payment Reminders** (3 reminders):
```typescript
// 1st reminder: 3 days before due date
// 2nd reminder: 1 day before due date
// 3rd reminder: On due date
```

**Retry Logic** (exponential backoff):
```typescript
// Retry 1: +5 minutes
// Retry 2: +10 minutes
// Retry 3: +20 minutes
// Max retries: 3
```

### Notification Flow
```
1. Event Trigger (Booking confirmed, Payment due, etc.)
        ↓
2. Create notification in DB (status: PENDING)
        ↓
3. Calculate scheduledAt time
        ↓
4. Cron job checks for pending notifications
        ↓
5. If scheduledAt <= now, attempt delivery
        ↓
6. Call WhatsApp/Email service
        ↓
7. Update status (SENT/FAILED) and sentAt
        ↓
8. If FAILED, schedule retry with backoff
```

## 📊 Mock Service Behavior

### WhatsApp Service
- **Success Rate**: 95%
- **Response Time**: ~500ms
- **Rate Limit**: 100ms between messages
- **Validation**: International phone format (+[country code][number])
- **Max Length**: 4096 characters

### Email Service
- **Success Rate**: 97%
- **Response Time**: ~300ms
- **Rate Limit**: 50ms between emails
- **Features**: HTML templates, attachments, CC/BCC
- **Styling**: Professional branded templates

Both services log to console for debugging:
```
[WhatsApp MOCK] Message sent: { messageId: 'wa_123...', to: '+1234567890', ... }
[Email MOCK] Email sent: { messageId: 'email_456...', to: 'user@example.com', ... }
```

## 📝 Configuration

### Environment Variables (Add to `.env`)
```env
# WhatsApp API (for production)
WHATSAPP_API_URL=https://api.whatsapp.com/v1
WHATSAPP_API_KEY=your_api_key_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_id

# Email API (for production)
EMAIL_API_URL=https://api.sendgrid.com/v3
EMAIL_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@ircahotel.com
EMAIL_FROM_NAME="IRCA Hotel Booking"

# Or for AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Notification Config
NOTIFICATION_MAX_RETRIES=3
NOTIFICATION_BATCH_SIZE=50
```

## 🔧 Still TODO

### Server Actions (Next Steps)
- [ ] `actions/notifications/index.ts` - CRUD operations with RBAC
  - `sendNotification()` - Send single notification
  - `scheduleNotification()` - Schedule future notification
  - `sendBulkNotifications()` - Broadcast to multiple users
  - `getNotifications()` - List user notifications
  - `markAsRead()` - Mark in-app notifications as read
  - `cancelNotification()` - Cancel scheduled notification

### Cron Job Scheduler
- [ ] `lib/cron/notificationScheduler.ts` - Background job
  - Runs every 5 minutes
  - Fetches PENDING notifications where scheduledAt <= now
  - Sends via appropriate channel
  - Updates status and handles retries

### API Routes
- [ ] `POST /api/notifications/send` - Send single notification
- [ ] `POST /api/notifications/schedule` - Schedule notification
- [ ] `GET /api/notifications` - List notifications
- [ ] `POST /api/notifications/broadcast` - Admin broadcast
- [ ] `GET /api/cron/send-notifications` - Cron trigger endpoint

### UI Components
- [ ] `NotificationCard` component - Display notification
- [ ] `NotificationBell` - Header notification icon with badge
- [ ] Member notifications page - View all notifications
- [ ] Admin broadcast page - Send bulk notifications

### Integrations
- [ ] Connect to booking confirmation flow
- [ ] Connect to payment reminder flow
- [ ] Connect to waitlist availability check
- [ ] Connect to invoice generation

## 🎨 UI Features (Planned)

### Member Dashboard
- Notification bell icon with unread count
- Notification list with filters (type, read/unread)
- Mark as read functionality
- Delete notifications
- In-app notification toasts

### Admin Dashboard
- Broadcast page for sending announcements
- Notification analytics (sent, failed, pending counts)
- Retry failed notifications
- View notification logs
- Schedule future broadcasts

## 💡 Usage Examples

### Send Booking Reminder
```typescript
import { generateMessage } from '@/lib/utils/notificationUtils';
import { sendWhatsAppMessage } from '@/lib/services/whatsapp';

const { message } = generateMessage('BOOKING_REMINDER', 'WHATSAPP', {
  userName: 'John Doe',
  userPhone: '+1234567890',
  bookingId: 'cm1abc123',
  roomTypeName: 'Deluxe Room',
  checkInDate: new Date('2025-01-24'),
  checkOutDate: new Date('2025-01-27'),
});

await sendWhatsAppMessage({
  to: '+1234567890',
  message,
});
```

### Send Email with Template
```typescript
import { sendEmail, createEmailTemplate, textToHtml } from '@/lib/services/email';

const htmlContent = createEmailTemplate(`
  <h2>Booking Confirmed!</h2>
  <p>Dear John,</p>
  <p>Your booking has been confirmed.</p>
  <a href="#" class="button">View Booking</a>
`, 'Booking Confirmation');

await sendEmail({
  to: 'john@example.com',
  subject: 'Booking Confirmed',
  html: htmlContent,
});
```

### Schedule Payment Reminder
```typescript
import { calculatePaymentReminderTime } from '@/lib/utils/notificationUtils';
import { prisma } from '@/lib/prisma';

const dueDate = new Date('2025-02-01');
const reminderTime = calculatePaymentReminderTime(dueDate, 1); // 3 days before

await prisma.notification.create({
  data: {
    userId: 'cm1user123',
    bookingId: 'cm1booking456',
    type: 'PAYMENT_REMINDER',
    channel: 'EMAIL',
    message: '...',
    status: 'PENDING',
    scheduledAt: reminderTime,
  },
});
```

## 🔐 Production Integration

### WhatsApp Business API (Twilio)
1. Sign up for Twilio WhatsApp Business
2. Get API credentials
3. Uncomment production code in `whatsapp.ts`
4. Update environment variables
5. Test with sandbox number first

### Email (SendGrid)
1. Sign up for SendGrid
2. Create API key
3. Verify sender domain
4. Uncomment SendGrid code in `email.ts`
5. Update environment variables

### Email (AWS SES)
1. Set up AWS SES in your region
2. Verify email addresses/domains
3. Request production access (exit sandbox)
4. Configure AWS credentials
5. Uncomment SES code in `email.ts`

## 📖 Next Steps

1. **Create server actions** for notification CRUD operations
2. **Build cron job** for automated sending
3. **Create API routes** for HTTP access
4. **Build UI components** for member/admin dashboards
5. **Integrate with booking flow** for automatic notifications
6. **Add analytics** for tracking delivery rates
7. **Implement rate limiting** to prevent abuse
8. **Add notification preferences** (user can opt-out of certain types)

## ✨ Summary
**Day 19 Progress: 40% Complete**
- ✅ Database schema with enums (Notification model)
- ✅ 28 message templates (7 types × 4 channels)
- ✅ Scheduling logic with smart reminders
- ✅ Mock WhatsApp service with validation
- ✅ Mock Email service with HTML templates
- ✅ Template rendering system
- ✅ Retry logic with exponential backoff

**Ready for:** Server actions, cron jobs, API routes, and UI components!

**Files created: 5 | Lines of code: ~1,100+**
