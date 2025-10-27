// ***********************************************************
// Cypress E2E Support File
// ***********************************************************

// Import commands
import './commands'

// Hide fetch/XHR requests in command log
const app = window.top

if (app && !app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style')
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }'
  style.setAttribute('data-hide-command-log-request', '')
  app.document.head.appendChild(style)
}

// Preserve cookies between tests
Cypress.Cookies.defaults({
  preserve: ['next-auth.session-token', 'next-auth.csrf-token', '__Secure-next-auth.session-token'],
})

// Global before hook
beforeEach(() => {
  // Clear local storage before each test
  cy.clearLocalStorage()
  
  // Intercept and stub external API calls if needed
  cy.intercept('POST', '**/api/stripe/**', {
    statusCode: 200,
    body: { success: true },
  }).as('stripeAPI')
})

// Global after hook
afterEach(function () {
  if ((this as Mocha.Context).currentTest?.state === 'failed') {
    // Log additional information on failure
    cy.log('Test failed:', (this as Mocha.Context).currentTest?.title ?? '')
  }
})

// Suppress ResizeObserver errors (common in Next.js apps)
const resizeObserverLoopErrRe = /^[^(ResizeObserver loop limit exceeded)]/
Cypress.on('uncaught:exception', (err: Error) => {
  if (resizeObserverLoopErrRe.test(err.message)) {
    return false
  }
  return true
})
