/**
 * E2E Test: Complete Booking Flow
 * Tests room selection, availability check, and booking creation
 */

describe('Booking Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.loginWithOTP(Cypress.env('testUser').phone)
  })

  it('should display available rooms', () => {
    cy.visit('/rooms')
    cy.waitForPageLoad()
    
    // Should show room listings
    cy.get('[data-testid="room-card"]').should('have.length.greaterThan', 0)
    cy.contains('Deluxe Room').should('be.visible')
  })

  it('should check room availability', () => {
    cy.visit('/rooms')
    
    // Select dates
    cy.get('[data-testid="date-picker"]').click()
    cy.selectDates('2025-11-01', '2025-11-05')
    
    // Check availability
    cy.get('button').contains('Check Availability').click()
    
    // Should show available rooms
    cy.contains('Available').should('be.visible')
    cy.get('[data-testid="available-rooms-count"]').should('exist')
  })

  it('should create a provisional booking', () => {
    cy.visit('/rooms')
    
    // Select dates
    cy.get('[data-testid="date-picker"]').click()
    cy.selectDates('2025-11-01', '2025-11-05')
    
    // Complete booking
    cy.completeBooking('Deluxe Room')
    
    // Verify on payment page
    cy.url().should('include', '/payment')
    cy.contains('Booking Summary').should('be.visible')
    cy.get('[data-testid="total-amount"]').should('be.visible')
  })

  it('should validate guest count', () => {
    cy.visit('/rooms')
    
    // Select dates
    cy.get('[data-testid="date-picker"]').click()
    cy.selectDates('2025-11-01', '2025-11-05')
    
    // Select room
    cy.contains('Deluxe Room').click()
    
    // Try to enter 0 guests
    cy.get('input[name="guests"]').clear().type('0')
    cy.get('button').contains('Continue').click()
    
    // Should show validation error
    cy.contains('At least 1 guest is required').should('be.visible')
  })

  it('should show booking rules notification', () => {
    cy.visit('/rooms')
    
    // Select dates too far in advance
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 100)
    
    cy.get('[data-testid="date-picker"]').click()
    // Attempt to select date beyond limit
    
    // Should show error about booking rules
    cy.contains('maximum advance booking', { matchCase: false }).should('be.visible')
  })

  it('should display booking confirmation details', () => {
    cy.visit('/rooms')
    
    // Complete booking flow
    cy.get('[data-testid="date-picker"]').click()
    cy.selectDates('2025-11-01', '2025-11-05')
    cy.completeBooking('Deluxe Room')
    
    // Verify booking details
    cy.contains('Check-in').should('be.visible')
    cy.contains('Check-out').should('be.visible')
    cy.contains('2025-11-01').should('be.visible')
    cy.contains('2025-11-05').should('be.visible')
  })

  it('should handle sold out dates', () => {
    // Mock sold out inventory
    cy.intercept('GET', '**/api/rooms/availability**', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          isAvailable: false,
          unavailableDates: ['2025-11-02', '2025-11-03'],
        },
      },
    }).as('checkAvailability')
    
    cy.visit('/rooms')
    cy.get('[data-testid="date-picker"]').click()
    cy.selectDates('2025-11-01', '2025-11-05')
    
    cy.wait('@checkAvailability')
    
    // Should show sold out message
    cy.contains('Not available', { matchCase: false }).should('be.visible')
  })
})
