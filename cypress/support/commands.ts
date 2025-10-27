// ***********************************************************
// Cypress Custom Commands
// ***********************************************************

/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login via OTP
       * @param phone - Phone number for OTP login
       * @example cy.loginWithOTP('+919876543210')
       */
      loginWithOTP(phone: string): Chainable<void>

      /**
       * Custom command to login as admin
       * @example cy.loginAsAdmin()
       */
      loginAsAdmin(): Chainable<void>

      /**
       * Custom command to select dates in booking calendar
       * @param checkIn - Check-in date
       * @param checkOut - Check-out date
       * @example cy.selectDates('2025-11-01', '2025-11-05')
       */
      selectDates(checkIn: string, checkOut: string): Chainable<void>

      /**
       * Custom command to complete booking
       * @param roomType - Room type to book
       * @example cy.completeBooking('Deluxe Room')
       */
      completeBooking(roomType: string): Chainable<void>

      /**
       * Custom command to mock successful payment
       * @example cy.mockSuccessfulPayment()
       */
      mockSuccessfulPayment(): Chainable<void>

      /**
       * Custom command to mock failed payment
       * @example cy.mockFailedPayment()
       */
      mockFailedPayment(): Chainable<void>

      /**
       * Custom command to wait for page load
       * @example cy.waitForPageLoad()
       */
      waitForPageLoad(): Chainable<void>

      /**
       * Custom command to check accessibility
       * @example cy.checkA11y()
       */
      checkA11y(): Chainable<void>
    }
  }
}

/**
 * Login with OTP - simulates OTP flow
 */
Cypress.Commands.add('loginWithOTP', (phone: string) => {
  cy.visit('/auth/login')
  
  // Enter phone number
  cy.get('input[name="phone"]').type(phone)
  cy.get('button[type="submit"]').contains('Send OTP').click()
  
  // Wait for OTP input to appear
  cy.get('input[name="otp"]').should('be.visible')
  
  // Mock OTP verification - enter test OTP
  cy.get('input[name="otp"]').type('123456')
  cy.get('button[type="submit"]').contains('Verify').click()
  
  // Wait for redirect to dashboard
  cy.url().should('include', '/dashboard')
  cy.contains('Welcome').should('be.visible')
})

/**
 * Login as admin user
 */
Cypress.Commands.add('loginAsAdmin', () => {
  cy.visit('/auth/login')
  
  cy.get('input[name="email"]').type(Cypress.env('adminUser').email)
  cy.get('input[name="password"]').type('admin123')
  cy.get('button[type="submit"]').click()
  
  cy.url().should('include', '/admin')
})

/**
 * Select dates in booking calendar
 */
Cypress.Commands.add('selectDates', (checkIn: string, checkOut: string) => {
  // Click on check-in date
  cy.get(`[data-date="${checkIn}"]`).click()
  
  // Click on check-out date
  cy.get(`[data-date="${checkOut}"]`).click()
  
  // Verify dates are selected
  cy.get('[data-testid="selected-checkin"]').should('contain', checkIn)
  cy.get('[data-testid="selected-checkout"]').should('contain', checkOut)
})

/**
 * Complete booking process
 */
Cypress.Commands.add('completeBooking', (roomType: string) => {
  // Select room type
  cy.contains(roomType).click()
  
  // Fill guest details
  cy.get('input[name="guests"]').clear().type('2')
  cy.get('textarea[name="notes"]').type('Test booking from Cypress')
  
  // Proceed to payment
  cy.get('button').contains('Continue to Payment').click()
  
  // Verify payment page
  cy.url().should('include', '/payment')
  cy.contains('Payment Summary').should('be.visible')
})

/**
 * Mock successful payment
 */
Cypress.Commands.add('mockSuccessfulPayment', () => {
  cy.intercept('POST', '**/api/payment/create-intent', {
    statusCode: 200,
    body: {
      success: true,
      data: {
        clientSecret: 'pi_mock_123456_secret',
        paymentIntentId: 'pi_mock_123456',
      },
    },
  }).as('createPaymentIntent')

  cy.intercept('POST', '**/api/payment/confirm', {
    statusCode: 200,
    body: {
      success: true,
      data: {
        status: 'succeeded',
        paymentIntentId: 'pi_mock_123456',
      },
    },
  }).as('confirmPayment')
})

/**
 * Mock failed payment
 */
Cypress.Commands.add('mockFailedPayment', () => {
  cy.intercept('POST', '**/api/payment/confirm', {
    statusCode: 400,
    body: {
      success: false,
      message: 'Payment failed: Insufficient funds',
    },
  }).as('failedPayment')
})

/**
 * Wait for page load
 */
Cypress.Commands.add('waitForPageLoad', () => {
  cy.window().its('document.readyState').should('equal', 'complete')
})

/**
 * Check accessibility (basic check)
 */
Cypress.Commands.add('checkA11y', () => {
  // Check for alt text on images
  cy.get('img').each(($img) => {
    cy.wrap($img).should('have.attr', 'alt')
  })
  
  // Check for labels on inputs
  cy.get('input').each(($input) => {
    const id = $input.attr('id')
    if (id) {
      cy.get(`label[for="${id}"]`).should('exist')
    }
  })
})

export {}
