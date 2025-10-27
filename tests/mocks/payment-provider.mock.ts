/**
 * Mock Payment Provider for Testing
 * Simulates payment gateway behavior without real transactions
 */

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded'

export interface MockPaymentIntent {
  id: string
  amount: number
  currency: string
  status: PaymentStatus
  metadata: Record<string, string>
  createdAt: Date
}

export interface MockRefund {
  id: string
  paymentIntentId: string
  amount: number
  status: 'pending' | 'succeeded' | 'failed'
  createdAt: Date
}

export class MockPaymentProvider {
  private payments: Map<string, MockPaymentIntent> = new Map()
  private refunds: Map<string, MockRefund> = new Map()
  private shouldFail: boolean = false
  private failureReason: string = 'Payment failed'

  /**
   * Configure provider to simulate failures
   */
  setFailureMode(shouldFail: boolean, reason?: string) {
    this.shouldFail = shouldFail
    if (reason) {
      this.failureReason = reason
    }
  }

  /**
   * Create a payment intent (simulates Stripe's payment intent creation)
   */
  async createPaymentIntent(params: {
    amount: number
    currency: string
    metadata?: Record<string, string>
  }): Promise<MockPaymentIntent> {
    if (this.shouldFail) {
      throw new Error(this.failureReason)
    }

    const paymentIntent: MockPaymentIntent = {
      id: `pi_mock_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      amount: params.amount,
      currency: params.currency,
      status: 'pending',
      metadata: params.metadata || {},
      createdAt: new Date(),
    }

    this.payments.set(paymentIntent.id, paymentIntent)
    return paymentIntent
  }

  /**
   * Confirm a payment intent (simulates successful payment)
   */
  async confirmPayment(paymentIntentId: string): Promise<MockPaymentIntent> {
    const payment = this.payments.get(paymentIntentId)
    
    if (!payment) {
      throw new Error('Payment intent not found')
    }

    if (this.shouldFail) {
      payment.status = 'failed'
      throw new Error(this.failureReason)
    }

    payment.status = 'success'
    this.payments.set(paymentIntentId, payment)
    
    return payment
  }

  /**
   * Retrieve a payment intent
   */
  async retrievePaymentIntent(paymentIntentId: string): Promise<MockPaymentIntent> {
    const payment = this.payments.get(paymentIntentId)
    
    if (!payment) {
      throw new Error('Payment intent not found')
    }

    return payment
  }

  /**
   * Create a refund
   */
  async createRefund(params: {
    paymentIntentId: string
    amount?: number
  }): Promise<MockRefund> {
    const payment = this.payments.get(params.paymentIntentId)
    
    if (!payment) {
      throw new Error('Payment intent not found')
    }

    if (payment.status !== 'success') {
      throw new Error('Can only refund successful payments')
    }

    if (this.shouldFail) {
      throw new Error(this.failureReason)
    }

    const refund: MockRefund = {
      id: `re_mock_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      paymentIntentId: params.paymentIntentId,
      amount: params.amount || payment.amount,
      status: 'succeeded',
      createdAt: new Date(),
    }

    this.refunds.set(refund.id, refund)
    payment.status = 'refunded'
    
    return refund
  }

  /**
   * List all payments (for testing)
   */
  listPayments(): MockPaymentIntent[] {
    return Array.from(this.payments.values())
  }

  /**
   * List all refunds (for testing)
   */
  listRefunds(): MockRefund[] {
    return Array.from(this.refunds.values())
  }

  /**
   * Clear all data (for test cleanup)
   */
  reset() {
    this.payments.clear()
    this.refunds.clear()
    this.shouldFail = false
    this.failureReason = 'Payment failed'
  }

  /**
   * Simulate webhook event
   */
  async triggerWebhook(event: {
    type: 'payment_intent.succeeded' | 'payment_intent.failed' | 'refund.succeeded'
    data: {
      object: MockPaymentIntent | MockRefund
    }
  }) {
    // In a real implementation, this would call a webhook URL
    // For testing, we just return the event
    return {
      id: `evt_mock_${Date.now()}`,
      type: event.type,
      data: event.data,
      created: Date.now(),
    }
  }
}

// Singleton instance for tests
export const mockPaymentProvider = new MockPaymentProvider()

/**
 * Helper function to create a successful payment for testing
 */
export async function createMockSuccessfulPayment(
  amount: number,
  metadata?: Record<string, string>
): Promise<MockPaymentIntent> {
  const intent = await mockPaymentProvider.createPaymentIntent({
    amount,
    currency: 'INR',
    metadata,
  })
  
  return await mockPaymentProvider.confirmPayment(intent.id)
}

/**
 * Helper function to simulate a failed payment
 */
export async function createMockFailedPayment(
  amount: number,
  reason?: string
): Promise<void> {
  mockPaymentProvider.setFailureMode(true, reason)
  
  const intent = await mockPaymentProvider.createPaymentIntent({
    amount,
    currency: 'INR',
  })

  try {
    await mockPaymentProvider.confirmPayment(intent.id)
  } finally {
    mockPaymentProvider.setFailureMode(false)
  }
}
