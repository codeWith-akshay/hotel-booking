// ==========================================
// PAYMENT SUCCESS PAGE
// ==========================================
// Displays booking confirmation after successful payment

import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware/auth.utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Download, Calendar, CreditCard, MapPin, Users } from 'lucide-react'
import { format } from 'date-fns'

// ==========================================
// PAGE COMPONENT
// ==========================================

/**
 * Payment Success Page
 * 
 * Shows:
 * - Payment confirmation
 * - Booking details
 * - Download invoice button
 * - Next steps
 * 
 * URL: /payments/success?session_id=cs_test_xxx
 */
export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const sessionId = searchParams.session_id
  
  return (
    <Suspense fallback={<LoadingState />}>
      {sessionId ? (
        <PaymentSuccessContent sessionId={sessionId} />
      ) : (
        <ErrorState message="Missing session ID" />
      )}
    </Suspense>
  )
}

// ==========================================
// CONTENT COMPONENT
// ==========================================

async function PaymentSuccessContent({
  sessionId,
}: {
  sessionId: string
}) {
  // Require authentication
  const user = await requireAuth()

  // Validate session ID - already validated by parent
  // Find payment by Stripe session ID
  const payment = await prisma.payment.findFirst({
    where: {
      metadata: {
        contains: sessionId,
      },
      userId: user.userId,
    },
    include: {
      booking: {
        include: {
          roomType: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (!payment || !payment.booking) {
    return <ErrorState message="Payment not found" />
  }

  // Calculate nights
  const checkIn = new Date(payment.booking.startDate)
  const checkOut = new Date(payment.booking.endDate)
  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="container max-w-4xl py-8">
      {/* Success Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="mb-2 text-3xl font-bold">Payment Successful!</h1>
        <p className="text-muted-foreground">
          Your booking has been confirmed. Check your email for details.
        </p>
      </div>

      {/* Booking Details Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Booking Confirmation</CardTitle>
          <CardDescription>
            Booking ID: {payment.booking.id}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Room Details */}
          <div className="flex items-start gap-3">
            <MapPin className="mt-1 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{payment.booking.roomType.name}</p>
              <p className="text-sm text-muted-foreground">
                {payment.booking.roomType.description}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-start gap-3">
            <Calendar className="mt-1 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Check-in & Check-out</p>
              <p className="text-sm text-muted-foreground">
                {format(checkIn, 'PPP')} - {format(checkOut, 'PPP')}
              </p>
              <p className="text-sm text-muted-foreground">
                {nights} {nights === 1 ? 'night' : 'nights'}
              </p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="flex items-start gap-3">
            <CreditCard className="mt-1 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Payment Details</p>
              <p className="text-sm text-muted-foreground">
                Amount: {payment.currency} {(payment.amount / 100).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                Status: {payment.status}
              </p>
              <p className="text-sm text-muted-foreground">
                Paid: {payment.paidAt ? format(new Date(payment.paidAt), 'PPP p') : 'N/A'}
              </p>
            </div>
          </div>

          {/* Invoice Download */}
          {payment.invoicePath && (
            <div className="border-t pt-4">
              <a
                href={payment.invoicePath}
                download
                className="inline-flex items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Download className="h-4 w-4" />
                Download Invoice
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Steps Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-1 h-4 w-4 text-green-500" />
            <p className="text-sm">Confirmation email sent to your registered email</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-1 h-4 w-4 text-green-500" />
            <p className="text-sm">Check-in time: 2:00 PM</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-1 h-4 w-4 text-green-500" />
            <p className="text-sm">Check-out time: 11:00 AM</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-1 h-4 w-4 text-green-500" />
            <p className="text-sm">Bring a valid ID proof for verification</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Link href="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
        <Link href="/booking">
          <Button variant="outline">Make Another Booking</Button>
        </Link>
      </div>
    </div>
  )
}

// ==========================================
// LOADING STATE
// ==========================================

function LoadingState() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-16 w-16 rounded-full bg-muted mx-auto" />
        <div className="h-8 w-64 rounded bg-muted mx-auto" />
        <div className="h-4 w-96 rounded bg-muted mx-auto" />
      </div>
    </div>
  )
}

// ==========================================
// ERROR STATE
// ==========================================

function ErrorState({ message }: { message: string }) {
  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{message}</p>
          <Link href="/dashboard" className="mt-4 inline-block">
            <Button>Go to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

// ==========================================
// METADATA
// ==========================================

export const metadata = {
  title: 'Payment Successful',
  description: 'Your booking has been confirmed',
}
