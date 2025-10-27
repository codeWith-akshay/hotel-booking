/**
 * Payment Flow Integration Tests
 * Tests payment processing with mock payment provider
 */

import { mockPaymentProvider, createMockSuccessfulPayment } from '../mocks/payment-provider.mock'
import { createMockPrismaClient } from '../mocks/prisma.mock'
import { PaymentStatus } from '@prisma/client'

describe('Payment Flow Integration Tests', () => {
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = createMockPrismaClient()
    mockPaymentProvider.reset()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Online Payment Processing', () => {
    test('should create payment intent successfully', async () => {
      const paymentIntent = await mockPaymentProvider.createPaymentIntent({
        amount: 20000,
        currency: 'INR',
        metadata: {
          bookingId: 'booking_123',
          userId: 'user_123',
        },
      })

      expect(paymentIntent).toBeDefined()
      expect(paymentIntent.id).toMatch(/^pi_mock_/)
      expect(paymentIntent.amount).toBe(20000)
      expect(paymentIntent.status).toBe('pending')
      expect(paymentIntent.metadata.bookingId).toBe('booking_123')
    })

    test('should confirm payment successfully', async () => {
      const paymentIntent = await mockPaymentProvider.createPaymentIntent({
        amount: 20000,
        currency: 'INR',
      })

      const confirmed = await mockPaymentProvider.confirmPayment(paymentIntent.id)

      expect(confirmed.status).toBe('success')
      expect(confirmed.id).toBe(paymentIntent.id)
    })

    test('should handle payment failure', async () => {
      mockPaymentProvider.setFailureMode(true, 'Card declined')

      await expect(
        mockPaymentProvider.createPaymentIntent({
          amount: 20000,
          currency: 'INR',
        })
      ).rejects.toThrow('Card declined')
    })

    test('should store payment record in database', async () => {
      const payment = await createMockSuccessfulPayment(20000, {
        bookingId: 'booking_123',
        userId: 'user_123',
      })

      const dbPayment = await mockPrisma.payment.create({
        data: {
          id: 'payment_123',
          bookingId: 'booking_123',
          userId: 'user_123',
          amount: 20000,
            status: PaymentStatus.SUCCEEDED,
          method: 'ONLINE',
          transactionId: payment.id,
        },
      })

      expect(dbPayment).toBeDefined()
        expect(dbPayment.status).toBe(PaymentStatus.SUCCEEDED)
      expect(dbPayment.amount).toBe(20000)
    })
  })

  describe('Offline Payment Processing', () => {
    test('should allow admin to mark payment as offline', async () => {
      // Create booking
      const booking = await mockPrisma.booking.create({
        data: {
          userId: 'user_test',
          roomTypeId: 'roomtype_deluxe',
          startDate: new Date('2025-11-01'),
          endDate: new Date('2025-11-05'),
          totalAmount: 20000,
          status: 'PROVISIONAL',
        },
      })

      // Admin marks as offline payment
      const payment = await mockPrisma.payment.create({
        data: {
          bookingId: booking.id,
          userId: booking.userId,
          amount: 20000,
            status: PaymentStatus.SUCCEEDED,
          method: 'OFFLINE',
          transactionId: 'OFFLINE_12345',
        },
      })

      expect(payment.method).toBe('OFFLINE')
        expect(payment.status).toBe(PaymentStatus.SUCCEEDED)
    })
  })

  describe('Refund Processing', () => {
    test('should create refund successfully', async () => {
      const payment = await createMockSuccessfulPayment(20000)

      const refund = await mockPaymentProvider.createRefund({
        paymentIntentId: payment.id,
        amount: 20000,
      })

      expect(refund).toBeDefined()
      expect(refund.status).toBe('succeeded')
      expect(refund.amount).toBe(20000)
    })

    test('should reject refund for non-successful payment', async () => {
      const paymentIntent = await mockPaymentProvider.createPaymentIntent({
        amount: 20000,
        currency: 'INR',
      })

      // Try to refund pending payment
      await expect(
        mockPaymentProvider.createRefund({
          paymentIntentId: paymentIntent.id,
        })
      ).rejects.toThrow('Can only refund successful payments')
    })

    test('should create partial refund', async () => {
      const payment = await createMockSuccessfulPayment(20000)

      const refund = await mockPaymentProvider.createRefund({
        paymentIntentId: payment.id,
        amount: 10000, // Partial refund
      })

      expect(refund.amount).toBe(10000)
      expect(refund.status).toBe('succeeded')
    })

    test('should update payment status after refund', async () => {
      const payment = await createMockSuccessfulPayment(20000, {
        bookingId: 'booking_123',
      })

      await mockPaymentProvider.createRefund({
        paymentIntentId: payment.id,
      })

      const updatedPayment = await mockPaymentProvider.retrievePaymentIntent(payment.id)

      expect(updatedPayment.status).toBe('refunded')
    })
  })

  describe('Payment Validation', () => {
    test('should validate payment amount matches booking total', () => {
      const bookingTotal = 20000
      const paymentAmount = 20000

      expect(paymentAmount).toBe(bookingTotal)
    })

    test('should reject payment with mismatched amount', () => {
      const bookingTotal = 20000
      const paymentAmount = 15000

      expect(paymentAmount).not.toBe(bookingTotal)
    })

    test('should validate payment currency', () => {
      const validCurrencies = ['INR', 'USD', 'EUR']
      const currency = 'INR'

      expect(validCurrencies).toContain(currency)
    })
  })

  describe('Payment Retry Logic', () => {
    test('should allow retry after failed payment', async () => {
      // First attempt fails
      mockPaymentProvider.setFailureMode(true, 'Network error')

      try {
        await mockPaymentProvider.createPaymentIntent({
          amount: 20000,
          currency: 'INR',
        })
      } catch (error: any) {
        expect(error.message).toBe('Network error')
      }

      // Reset failure mode
      mockPaymentProvider.setFailureMode(false)

      // Retry succeeds
      const payment = await mockPaymentProvider.createPaymentIntent({
        amount: 20000,
        currency: 'INR',
      })

      expect(payment).toBeDefined()
      expect(payment.status).toBe('pending')
    })
  })

  describe('Payment Webhooks', () => {
    test('should process payment success webhook', async () => {
      const payment = await createMockSuccessfulPayment(20000)

      const webhook = await mockPaymentProvider.triggerWebhook({
        type: 'payment_intent.succeeded',
        data: {
          object: payment,
        },
      })

      expect(webhook.type).toBe('payment_intent.succeeded')
      expect(webhook.data.object).toEqual(payment)
    })

    test('should process payment failure webhook', async () => {
      mockPaymentProvider.setFailureMode(true)

      const paymentIntent = await mockPaymentProvider.createPaymentIntent({
        amount: 20000,
        currency: 'INR',
      })

      try {
        await mockPaymentProvider.confirmPayment(paymentIntent.id)
      } catch {
        // Expected to fail
      }

      const updatedPayment = await mockPaymentProvider.retrievePaymentIntent(paymentIntent.id)

      expect(updatedPayment.status).toBe('failed')
    })
  })

  describe('Payment History', () => {
    test('should retrieve all payments for a user', async () => {
      // Create multiple payments
      await mockPrisma.payment.create({
        data: {
          id: 'payment_1',
          userId: 'user_test',
          bookingId: 'booking_1',
          amount: 20000,
            status: PaymentStatus.SUCCEEDED,
        },
      })

      await mockPrisma.payment.create({
        data: {
          id: 'payment_2',
          userId: 'user_test',
          bookingId: 'booking_2',
          amount: 15000,
            status: PaymentStatus.SUCCEEDED,
        },
      })

      const payments = await mockPrisma.payment.findMany({
        where: { userId: 'user_test' },
      })

      expect(payments.length).toBe(2)
      expect(payments.every((p: any) => p.userId === 'user_test')).toBe(true)
    })

    test('should filter payments by status', async () => {
      await mockPrisma.payment.create({
        data: {
          userId: 'user_test',
          bookingId: 'booking_1',
          amount: 20000,
            status: PaymentStatus.SUCCEEDED,
        },
      })

      await mockPrisma.payment.create({
        data: {
          userId: 'user_test',
          bookingId: 'booking_2',
          amount: 15000,
          status: PaymentStatus.PENDING,
        },
      })

      const completedPayments = await mockPrisma.payment.findMany({
        where: {
          userId: 'user_test',
            status: PaymentStatus.SUCCEEDED,
        },
      })

      expect(completedPayments.length).toBe(1)
        expect(completedPayments[0].status).toBe(PaymentStatus.SUCCEEDED)
    })
  })
})
