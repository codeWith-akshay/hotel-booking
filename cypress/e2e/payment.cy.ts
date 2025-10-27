/**
 * E2E Test: Payment Flow
 * Tests payment processing with mock payment provider
 */

describe('Payment Flow', () => {
  beforeEach(() => {
    cy.loginWithOTP(Cypress.env('testUser').phone)
    
    // Navigate to payment page by creating a booking
    cy.visit('/rooms')
    cy.get('[data-testid="date-picker"]').click()
    cy.selectDates('2025-11-01', '2025-11-05')
    cy.completeBooking('Deluxe Room')
  })

  it('should display payment summary', () => {
    cy.contains('Payment Summary').should('be.visible')
    cy.get('[data-testid="subtotal"]').should('be.visible')
    cy.get('[data-testid="tax"]').should('be.visible')
    cy.get('[data-testid="total-amount"]').should('be.visible')
  })

  it('should process successful online payment', () => {
    // Mock successful payment
    cy.mockSuccessfulPayment()
    
    // Select online payment method
    cy.get('input[value="ONLINE"]').check()
    
    // Enter card details (mock)
    cy.get('input[name="cardNumber"]').type('4242424242424242')
    cy.get('input[name="expiry"]').type('12/25')
    cy.get('input[name="cvv"]').type('123')
    
    // Submit payment
    cy.get('button').contains('Pay Now').click()
    
    // Wait for payment confirmation
    cy.wait('@confirmPayment')
    
    // Should redirect to success page
    cy.url().should('include', '/booking/success')
    cy.contains('Booking Confirmed').should('be.visible')
    cy.get('[data-testid="booking-id"]').should('be.visible')
  })

  it('should handle failed payment', () => {
    // Mock failed payment
    cy.mockFailedPayment()
    
    cy.get('input[value="ONLINE"]').check()
    cy.get('input[name="cardNumber"]').type('4000000000000002') // Decline test card
    cy.get('input[name="expiry"]').type('12/25')
    cy.get('input[name="cvv"]').type('123')
    
    cy.get('button').contains('Pay Now').click()
    
    cy.wait('@failedPayment')
    
    // Should show error message
    cy.contains('Payment failed', { matchCase: false }).should('be.visible')
    cy.contains('Insufficient funds').should('be.visible')
    
    // Should stay on payment page
    cy.url().should('include', '/payment')
  })

  it('should allow retry after failed payment', () => {
    cy.mockFailedPayment()
    
    // First attempt (fails)
    cy.get('input[value="ONLINE"]').check()
    cy.get('input[name="cardNumber"]').type('4000000000000002')
    cy.get('input[name="expiry"]').type('12/25')
    cy.get('input[name="cvv"]').type('123')
    cy.get('button').contains('Pay Now').click()
    
    cy.wait('@failedPayment')
    
    // Retry with successful mock
    cy.mockSuccessfulPayment()
    
    cy.get('button').contains('Try Again').click()
    cy.get('input[name="cardNumber"]').clear().type('4242424242424242')
    cy.get('button').contains('Pay Now').click()
    
    cy.wait('@confirmPayment')
    
    // Should succeed
    cy.url().should('include', '/booking/success')
  })

  it('should calculate correct total with taxes', () => {
    // Get subtotal
    cy.get('[data-testid="subtotal"]').invoke('text').then((subtotalText) => {
      const subtotal = parseFloat(subtotalText.replace(/[^0-9.]/g, ''))
      
      // Get tax
      cy.get('[data-testid="tax"]').invoke('text').then((taxText) => {
        const tax = parseFloat(taxText.replace(/[^0-9.]/g, ''))
        
        // Get total
        cy.get('[data-testid="total-amount"]').invoke('text').then((totalText) => {
          const total = parseFloat(totalText.replace(/[^0-9.]/g, ''))
          
          // Verify calculation
          expect(total).to.equal(subtotal + tax)
        })
      })
    })
  })

  it('should support multiple payment methods', () => {
    cy.get('input[value="ONLINE"]').should('exist')
    cy.get('input[value="UPI"]').should('exist')
    cy.get('input[value="CARD"]').should('exist')
  })

  it('should show processing state during payment', () => {
    cy.mockSuccessfulPayment()
    
    cy.get('input[value="ONLINE"]').check()
    cy.get('input[name="cardNumber"]').type('4242424242424242')
    cy.get('input[name="expiry"]').type('12/25')
    cy.get('input[name="cvv"]').type('123')
    
    cy.get('button').contains('Pay Now').click()
    
    // Should show loading state
    cy.get('button').contains('Processing...').should('be.visible')
    cy.get('button').should('be.disabled')
  })

  it('should display booking reference on success page', () => {
    cy.mockSuccessfulPayment()
    
    cy.get('input[value="ONLINE"]').check()
    cy.get('input[name="cardNumber"]').type('4242424242424242')
    cy.get('input[name="expiry"]').type('12/25')
    cy.get('input[name="cvv"]').type('123')
    cy.get('button').contains('Pay Now').click()
    
    cy.wait('@confirmPayment')
    
    cy.url().should('include', '/booking/success')
    
    // Verify success page content
    cy.get('[data-testid="booking-reference"]').should('be.visible')
    cy.get('[data-testid="booking-reference"]').should('match', /^BK[A-Z0-9]+$/)
    cy.contains('Check-in').should('be.visible')
    cy.contains('Check-out').should('be.visible')
  })

  it('should allow downloading booking confirmation', () => {
    cy.mockSuccessfulPayment()
    
    cy.get('input[value="ONLINE"]').check()
    cy.get('input[name="cardNumber"]').type('4242424242424242')
    cy.get('input[name="expiry"]').type('12/25')
    cy.get('input[name="cvv"]').type('123')
    cy.get('button').contains('Pay Now').click()
    
    cy.wait('@confirmPayment')
    
    cy.url().should('include', '/booking/success')
    
    // Download confirmation
    cy.get('button').contains('Download Confirmation').should('be.visible')
  })
})
