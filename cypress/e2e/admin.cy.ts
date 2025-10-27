/**
 * E2E Test: Admin Operations
 * Tests admin-specific features like marking offline payments
 */

describe('Admin Operations', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
  })

  it('should access admin dashboard', () => {
    cy.url().should('include', '/admin')
    cy.contains('Admin Dashboard').should('be.visible')
  })

  it('should view all bookings', () => {
    cy.visit('/admin/bookings')
    cy.waitForPageLoad()
    
    cy.get('[data-testid="bookings-table"]').should('be.visible')
    cy.get('[data-testid="booking-row"]').should('have.length.greaterThan', 0)
  })

  it('should filter bookings by status', () => {
    cy.visit('/admin/bookings')
    
    // Select CONFIRMED status filter
    cy.get('[data-testid="status-filter"]').select('CONFIRMED')
    
    // All visible bookings should be confirmed
    cy.get('[data-testid="booking-status"]').each(($el) => {
      cy.wrap($el).should('contain', 'Confirmed')
    })
  })

  it('should mark offline payment as completed', () => {
    cy.visit('/admin/bookings')
    
    // Find a pending booking
    cy.contains('Pending Payment').parent().within(() => {
      cy.get('button').contains('Mark as Paid').click()
    })
    
    // Confirm offline payment modal
    cy.get('[data-testid="offline-payment-modal"]').should('be.visible')
    cy.get('select[name="paymentMethod"]').select('CASH')
    cy.get('input[name="transactionId"]').type('OFFLINE_' + Date.now())
    cy.get('textarea[name="notes"]').type('Payment received at front desk')
    
    cy.get('button').contains('Confirm Payment').click()
    
    // Should show success message
    cy.contains('Payment marked as completed').should('be.visible')
    
    // Booking status should update
    cy.contains('Confirmed').should('be.visible')
  })

  it('should view booking details', () => {
    cy.visit('/admin/bookings')
    
    // Click on first booking
    cy.get('[data-testid="booking-row"]').first().click()
    
    // Should show booking details modal/page
    cy.get('[data-testid="booking-details"]').should('be.visible')
    cy.contains('Booking ID').should('be.visible')
    cy.contains('Guest Name').should('be.visible')
    cy.contains('Room Type').should('be.visible')
  })

  it('should cancel a booking', () => {
    cy.visit('/admin/bookings')
    
    // Find a confirmed booking
    cy.contains('Confirmed').parent().within(() => {
      cy.get('button[data-testid="cancel-booking"]').click()
    })
    
    // Confirm cancellation
    cy.get('[data-testid="cancel-modal"]').should('be.visible')
    cy.get('textarea[name="reason"]').type('Customer requested cancellation')
    cy.get('button').contains('Confirm Cancellation').click()
    
    // Should show success
    cy.contains('Booking cancelled').should('be.visible')
  })

  it('should manage room inventory', () => {
    cy.visit('/admin/inventory')
    
    cy.get('[data-testid="inventory-calendar"]').should('be.visible')
    
    // Select a date
    cy.get('[data-date="2025-11-01"]').click()
    
    // Update availability
    cy.get('input[name="availableRooms"]').clear().type('8')
    cy.get('button').contains('Update').click()
    
    // Should show success
    cy.contains('Inventory updated').should('be.visible')
  })

  it('should view payment reports', () => {
    cy.visit('/admin/reports/payments')
    
    cy.contains('Payment Reports').should('be.visible')
    cy.get('[data-testid="total-revenue"]').should('be.visible')
    cy.get('[data-testid="successful-payments"]').should('be.visible')
    cy.get('[data-testid="failed-payments"]').should('be.visible')
  })

  it('should search for bookings', () => {
    cy.visit('/admin/bookings')
    
    // Search by booking ID
    cy.get('input[name="search"]').type('BK123')
    cy.get('button[type="submit"]').click()
    
    // Should filter results
    cy.get('[data-testid="booking-row"]').should('have.length.lessThan', 10)
  })

  it('should export bookings data', () => {
    cy.visit('/admin/bookings')
    
    cy.get('button').contains('Export').click()
    
    // Should trigger download
    cy.get('[data-testid="export-dropdown"]').should('be.visible')
    cy.contains('CSV').click()
  })

  it('should handle bulk operations', () => {
    cy.visit('/admin/bookings')
    
    // Select multiple bookings
    cy.get('[data-testid="select-booking"]').first().check()
    cy.get('[data-testid="select-booking"]').eq(1).check()
    
    // Bulk action
    cy.get('[data-testid="bulk-actions"]').should('be.visible')
    cy.get('button').contains('Send Reminders').click()
    
    // Should show confirmation
    cy.contains('Reminders sent').should('be.visible')
  })
})
