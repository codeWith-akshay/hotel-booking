# Notification System Setup Guide

## Overview
Comprehensive notification system using **NodeMailer** for email and **Twilio WhatsApp API** for messaging.

## Features
✅ Email notifications via NodeMailer  
✅ WhatsApp notifications via Twilio  
✅ Multiple notification types (booking, payment, reminders, waitlist)  
✅ Database storage with status tracking  
✅ Admin dashboard for monitoring  
✅ Automatic triggers on booking events  

## Architecture

### Components
1. **notification-sender.service.ts** - Handles actual sending via NodeMailer/Twilio
2. **notification-trigger.service.ts** - Triggers notifications for specific events
3. **notification.service.ts** - Creates and manages notification records
4. **Admin Dashboard** - `/admin/notifications` - View logs and statuses

### Database Schema
```prisma
model Notification {
  id            String              @id @default(cuid())
  userId        String
  bookingId     String?
  type          NotificationType    // BOOKING_CONFIRMATION, PAYMENT_REMINDER, etc.
  channel       NotificationChannel // EMAIL, WHATSAPP, SMS, IN_APP
  status        NotificationStatus  // PENDING, SENT, DELIVERED, FAILED, CANCELLED
  subject       String?
  message       String
  metadata      String?
  createdAt     DateTime            @default(now())
  sentAt        DateTime?
  failureReason String?
  
  user     User     @relation(fields: [userId], references: [id])
  booking  Booking? @relation(fields: [bookingId], references: [id])
}
```

## Setup Instructions

### 1. Install Dependencies
Dependencies are already included in `package.json`:
```bash
pnpm install
```

- `nodemailer` - Email sending
- `@types/nodemailer` - TypeScript types
- `twilio` - WhatsApp/SMS API

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# ==========================================
# NOTIFICATION SYSTEM
# ==========================================

# NodeMailer SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Hotel Booking <your-email@gmail.com>"

# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=+14155238886
```

### 3. Gmail Setup (for Email)

#### Option A: App Password (Recommended)
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Generate App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other (Custom name)" → "Hotel Booking"
   - Copy the 16-character password
4. Use the app password in `SMTP_PASS`

#### Option B: Less Secure Apps (Not Recommended)
1. Enable "Less secure app access" in Gmail settings
2. Use your regular Gmail password

### 4. Twilio WhatsApp Setup

1. **Sign up for Twilio**
   - Go to: https://www.twilio.com/try-twilio
   - Create free account

2. **Get WhatsApp Sandbox**
   - Navigate to: Console → Messaging → Try it out → WhatsApp
   - Or: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
   - Join sandbox by sending code to: `+14155238886`

3. **Get Credentials**
   - Account SID: Console → Account Info
   - Auth Token: Console → Account Info
   - WhatsApp Number: Sandbox number (`+14155238886`)

4. **Production Setup** (Optional)
   - Apply for WhatsApp Business API
   - Get approved sender number
   - Update `TWILIO_WHATSAPP_NUMBER` in production

## Notification Types

### 1. Booking Confirmation
**Trigger:** After successful booking creation  
**Channels:** Email + WhatsApp  
**Function:** `sendBookingConfirmation(bookingId)`

```typescript
import { sendBookingConfirmation } from '@/lib/services/notification-trigger.service'

// After creating booking
await sendBookingConfirmation(booking.id)
```

### 2. Payment Success
**Trigger:** After successful payment  
**Channels:** Email + WhatsApp  
**Function:** `sendPaymentSuccess(paymentId)`

```typescript
import { sendPaymentSuccess } from '@/lib/services/notification-trigger.service'

// After payment succeeds
await sendPaymentSuccess(payment.id)
```

### 3. Payment Failure
**Trigger:** After failed payment  
**Channels:** Email + WhatsApp  
**Function:** `sendPaymentFailure(paymentId)`

```typescript
import { sendPaymentFailure } from '@/lib/services/notification-trigger.service'

// After payment fails
await sendPaymentFailure(payment.id)
```

### 4. Check-in Reminder (24 hours before)
**Trigger:** Scheduled via cron job  
**Channels:** Email + WhatsApp  
**Function:** `sendCheckInReminder(bookingId)`

```typescript
// Set up cron job (runs daily)
import { sendCheckInReminder } from '@/lib/services/notification-trigger.service'

// For all bookings with check-in tomorrow
await sendCheckInReminder(booking.id)
```

### 5. Waitlist Confirmation
**Trigger:** When user added to waitlist  
**Channels:** Email + WhatsApp  
**Function:** `sendWaitlistConfirmation(waitlistId)`

```typescript
import { sendWaitlistConfirmation } from '@/lib/services/notification-trigger.service'

// After adding to waitlist
await sendWaitlistConfirmation(waitlist.id)
```

## Admin Dashboard

### Access
Navigate to: `/admin/notifications`

### Features
- **Statistics Cards**: Total, Pending, Sent, Failed counts
- **Filters**: By type, channel, status
- **Notification Table**: Full history with timestamps
- **Status Indicators**: Visual badges for quick status identification
- **Pagination**: Handle large datasets efficiently

### Columns
- **Time**: When notification was created
- **User**: Recipient name and contact
- **Type**: Notification category
- **Channel**: EMAIL / WHATSAPP / SMS / IN_APP
- **Status**: PENDING / SENT / DELIVERED / FAILED / CANCELLED
- **Message**: Preview of notification content

## Status Flow

```
PENDING → SENT → DELIVERED
          ↓
        FAILED
```

- **PENDING**: Created, waiting to send
- **SENT**: Successfully sent to provider
- **DELIVERED**: Confirmed delivered (WhatsApp only)
- **FAILED**: Failed to send (check `failureReason`)
- **CANCELLED**: Manually cancelled

## Testing

### Test Email
```typescript
import { sendEmail } from '@/lib/services/notification-sender.service'

const result = await sendEmail(
  'test@example.com',
  'Test Notification',
  '<p>This is a test email</p>',
  'This is a test email'
)

console.log(result) // { success: true, messageId: '...' }
```

### Test WhatsApp
```typescript
import { sendWhatsApp } from '@/lib/services/notification-sender.service'

const result = await sendWhatsApp(
  '+1234567890',
  'This is a test WhatsApp message'
)

console.log(result) // { success: true, messageSid: '...' }
```

### Development Mode
If credentials not configured:
- Notifications marked as sent (mock success)
- Console warnings logged
- No actual emails/messages sent
- Safe for local development

## Monitoring

### Check Notification Status
```sql
-- View recent notifications
SELECT * FROM notifications 
ORDER BY createdAt DESC 
LIMIT 50;

-- Count by status
SELECT status, COUNT(*) 
FROM notifications 
GROUP BY status;

-- Failed notifications
SELECT * FROM notifications 
WHERE status = 'FAILED';
```

### Retry Failed Notifications
```typescript
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/services/notification.service'

// Get failed notifications
const failed = await prisma.notification.findMany({
  where: { status: 'FAILED' }
})

// Retry
for (const notification of failed) {
  await sendNotification(notification.id)
}
```

## Troubleshooting

### Email Not Sending
1. **Check SMTP credentials** - Verify `SMTP_USER` and `SMTP_PASS`
2. **App Password** - Use app password for Gmail, not regular password
3. **Firewall** - Ensure port 587 is not blocked
4. **Check logs** - Look for error messages in console

### WhatsApp Not Sending
1. **Join Sandbox** - Must send join code to Twilio number first
2. **E.164 Format** - Phone must include country code (+1234567890)
3. **Verify credentials** - Check `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
4. **Sandbox limits** - Free tier has message limits

### Notifications Stuck in PENDING
- Check that notification cron jobs are running
- Verify environment variables are loaded
- Check server logs for errors

## Production Considerations

### Email
- Use dedicated email service (SendGrid, AWS SES, Postmark)
- Set up SPF, DKIM, DMARC records
- Monitor bounce rates
- Implement rate limiting

### WhatsApp
- Apply for WhatsApp Business API
- Get approved business number
- Set up message templates
- Handle delivery webhooks

### Database
- Index notification queries
- Archive old notifications
- Set up monitoring alerts
- Regular cleanup of old records

### Performance
- Queue notifications for bulk sending
- Implement retry logic with exponential backoff
- Use background jobs for non-critical notifications
- Monitor API rate limits

## API Endpoints

### Send Test Notification
```typescript
// POST /api/notifications/test
{
  "userId": "cm1user123",
  "type": "BOOKING_CONFIRMATION",
  "channel": "EMAIL"
}
```

### Get Notification Status
```typescript
// GET /api/notifications/:id
Response: {
  "id": "cm1notif123",
  "status": "SENT",
  "sentAt": "2025-10-27T10:00:00Z"
}
```

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Review environment variables
3. Test connectivity to SMTP/Twilio services
4. Consult documentation: 
   - NodeMailer: https://nodemailer.com/
   - Twilio: https://www.twilio.com/docs/whatsapp

---

**Last Updated:** October 27, 2025  
**Version:** 1.0.0
