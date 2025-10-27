/**
 * E2E Test: User Authentication Flow
 * Tests OTP-based login and logout
 */

describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should show login page', () => {
    cy.visit('/auth/login')
    cy.contains('Login').should('be.visible')
    cy.get('input[name="phone"]').should('be.visible')
  })

  it('should login with OTP successfully', () => {
    cy.loginWithOTP(Cypress.env('testUser').phone)
    
    // Verify logged in state
    cy.contains('Dashboard').should('be.visible')
    cy.get('[data-testid="user-menu"]').should('be.visible')
  })

  it('should handle invalid OTP', () => {
    cy.visit('/auth/login')
    
    // Enter phone number
    cy.get('input[name="phone"]').type(Cypress.env('testUser').phone)
    cy.get('button[type="submit"]').click()
    
    // Enter wrong OTP
    cy.get('input[name="otp"]').type('000000')
    cy.get('button[type="submit"]').click()
    
    // Should show error message
    cy.contains('Invalid OTP').should('be.visible')
  })

  it('should logout successfully', () => {
    cy.loginWithOTP(Cypress.env('testUser').phone)
    
    // Click logout
    cy.get('[data-testid="user-menu"]').click()
    cy.contains('Logout').click()
    
    // Verify logged out
    cy.url().should('include', '/auth/login')
  })

  it('should redirect to login when accessing protected route', () => {
    cy.visit('/dashboard')
    cy.url().should('include', '/auth/login')
  })
})
