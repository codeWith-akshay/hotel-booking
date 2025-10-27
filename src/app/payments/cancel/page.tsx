// ==========================================
// PAYMENT CANCELLED PAGE
// ==========================================
// Shows when user cancels Stripe checkout

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { XCircle, ArrowLeft } from 'lucide-react'

// ==========================================
// PAGE COMPONENT
// ==========================================

/**
 * Payment Cancelled Page
 * 
 * Shows when user clicks "Back" in Stripe Checkout
 * 
 * URL: /payments/cancel
 */
export default function PaymentCancelPage() {
  return (
    <div className="container max-w-2xl py-8">
      {/* Cancel Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <XCircle className="h-16 w-16 text-orange-500" />
        </div>
        <h1 className="mb-2 text-3xl font-bold">Payment Cancelled</h1>
        <p className="text-muted-foreground">
          Your payment was not completed. No charges have been made.
        </p>
      </div>

      {/* Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What Happened?</CardTitle>
          <CardDescription>
            You cancelled the payment process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Your booking is still in a <strong>provisional</strong> state and will be held for 
            a limited time. You can complete the payment anytime before it expires.
          </p>
          
          <div className="border-t pt-4">
            <h3 className="mb-2 font-medium">Need Help?</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Check if your payment method is valid</li>
              <li>Ensure sufficient balance in your account</li>
              <li>Try a different payment method</li>
              <li>Contact support if you continue to face issues</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link href="/dashboard">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Link href="/booking">
          <Button variant="outline">Try Again</Button>
        </Link>
      </div>
    </div>
  )
}

// ==========================================
// METADATA
// ==========================================

export const metadata = {
  title: 'Payment Cancelled',
  description: 'Your payment was cancelled',
}
