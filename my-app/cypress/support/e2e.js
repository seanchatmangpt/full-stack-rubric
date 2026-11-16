// Cypress E2E support file
import './commands'
import 'cypress-axe'
// Visual regression removed for compatibility

// Global before hook
beforeEach(() => {
  // Inject axe-core for accessibility testing
  cy.injectAxe()
  
  // Set viewport for consistent testing
  cy.viewport(1280, 720)
  
  // Clear local storage before each test
  cy.clearLocalStorage()
})

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Don't fail tests on Vue dev warnings or specific expected errors
  if (err.message.includes('Vue warn') || 
      err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  return true
})

// Custom commands for common patterns
Cypress.Commands.add('visitAndWait', (url) => {
  cy.visit(url)
  cy.wait(500) // Wait for Vue to hydrate
})

// Performance testing commands  
Cypress.Commands.add('measurePerformance', () => {
  cy.window().then((win) => {
    const navigation = win.performance.getEntriesByType('navigation')[0]
    const paint = win.performance.getEntriesByType('paint')
    
    cy.wrap({
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
    }).as('performance')
  })
})

// Accessibility testing
Cypress.Commands.add('checkA11y', (selector = null, options = {}) => {
  const defaultOptions = {
    rules: {
      'color-contrast': { enabled: true },
      'focus-order-semantics': { enabled: true },
      'landmark-one-main': { enabled: true }
    },
    ...options
  }
  
  cy.checkAxe(selector, defaultOptions)
})

// Component visibility helpers
Cypress.Commands.add('shouldBeVisible', (selector) => {
  cy.get(selector)
    .should('be.visible')
    .and('not.have.css', 'opacity', '0')
    .and('not.have.css', 'visibility', 'hidden')
})

Cypress.Commands.add('shouldNotBeVisible', (selector) => {
  cy.get(selector).should('not.be.visible')
})

// Form testing helpers
Cypress.Commands.add('fillForm', (formData) => {
  Object.keys(formData).forEach(key => {
    const value = formData[key]
    const element = cy.get(`[data-testid="${key}"], [name="${key}"], #${key}`)
    
    if (typeof value === 'boolean') {
      if (value) element.check()
      else element.uncheck()
    } else {
      element.clear().type(value)
    }
  })
})

// Wait for component to be ready
Cypress.Commands.add('waitForComponent', (selector, timeout = 10000) => {
  cy.get(selector, { timeout })
    .should('exist')
    .and('be.visible')
    .then(($el) => {
      // Wait for Vue component to be fully rendered
      cy.wrap($el).should('have.length.greaterThan', 0)
    })
})

// Screenshot comparison removed for compatibility

// Mobile viewport testing
Cypress.Commands.add('testResponsive', (callback) => {
  const viewports = [
    { width: 375, height: 667, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' }, 
    { width: 1280, height: 720, name: 'desktop' }
  ]
  
  viewports.forEach(viewport => {
    cy.viewport(viewport.width, viewport.height)
    cy.log(`Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`)
    callback(viewport)
  })
})

// Table testing helpers
Cypress.Commands.add('testTableSorting', (tableSelector, columnIndex, expectedOrder) => {
  cy.get(`${tableSelector} thead th`)
    .eq(columnIndex)
    .click()
    
  cy.get(`${tableSelector} tbody tr`)
    .should('have.length.greaterThan', 0)
    
  expectedOrder.forEach((expectedText, index) => {
    cy.get(`${tableSelector} tbody tr`)
      .eq(index)
      .should('contain.text', expectedText)
  })
})

// Loading state testing
Cypress.Commands.add('waitForLoadingToComplete', (loadingSelector = '[data-testid="loading"]') => {
  cy.get('body').then($body => {
    if ($body.find(loadingSelector).length > 0) {
      cy.get(loadingSelector).should('not.exist', { timeout: 10000 })
    }
  })
})