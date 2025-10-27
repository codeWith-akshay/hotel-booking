// ==========================================
// PAYMENT BUTTON COMPONENT
// ==========================================
// Initiates Stripe checkout session and redirects to payment

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createPaymentSession } from '@/actions/payments/createSession.action'
import { Loader2, CreditCard } from 'lucide-react'

// ==========================================
// TYPES
// ==========================================

export interface PaymentButtonProps {
  /** ID of the booking to pay for */
  bookingId: string
  /** Amount to charge in smallest currency unit (e.g., cents for USD) */
  amount: number
  /** Currency code (e.g., 'USD', 'INR') */
  currency?: string
  /** Button text */
  label?: string
  /** Button variant */
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link'
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /** Optional callback on success */
  onSuccess?: () => void
  /** Optional callback on error */
  onError?: (error: string) => void
}

// ==========================================
// COMPONENT
// ==========================================

/**
 * Payment button that creates a Stripe checkout session and redirects
 * 
 * Usage:
 * ```tsx
 * <PaymentButton
 *   bookingId="booking_123"
 *   amount={10000} // $100.00 in cents
 *   currency="USD"
 *   label="Pay Now"
 * />
 * ```
 * 
 * Features:
 * - Loading states with disabled button
 * - Error handling with toast/alert
 * - Automatic redirect to Stripe Checkout
 * - Success/cancel URL handling
 */
export function PaymentButton({
  bookingId,
  amount,
  currency = 'USD',
  label = 'Pay Now',
  variant = 'default',
  size = 'default',
  onSuccess,
  onError,
}: PaymentButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Create payment session
      const result = await createPaymentSession({
        bookingId,
        amount,
        currency,
      })

      if (!result.success) {
        setError(result.error || 'Payment failed')
        onError?.(result.error || 'Payment failed')
        return
      }

      // Redirect to Stripe Checkout
      if (result.data?.url) {
        // Call success callback before redirect
        onSuccess?.()
        
        // Redirect to Stripe
        window.location.href = result.data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handlePayment}
        disabled={isLoading}
        variant={variant}
        size={size}
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            {label}
          </>
        )}
      </Button>

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

// ==========================================
// EXPORTS
// ==========================================

export default PaymentButton
