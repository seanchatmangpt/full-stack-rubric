describe('User Workflows - E2E Testing', () => {
  beforeEach(() => {
    // Set up common test data
    cy.intercept('GET', '/api/user', { fixture: 'api-response.json' }).as('getUser')
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { token: 'fake-jwt-token', user: { id: 1, name: 'Test User' } }
    }).as('login')
  })

  describe('Authentication Flow', () => {
    it('should complete full login flow', () => {
      cy.visit('/')
      
      // Test performance of initial page load
      cy.testPerformance('/', {
        loadTime: 3000,
        firstContentfulPaint: 2000
      })
      
      // Navigate to login
      cy.get('[data-testid="login-link"]').click()
      cy.url().should('include', '/login')
      
      // Test form validation
      cy.testFormValidation({
        email: {
          invalid: 'invalid-email',
          expectedError: 'Please enter a valid email',
          valid: 'test@example.com'
        },
        password: {
          invalid: '123',
          expectedError: 'Password must be at least 6 characters',
          valid: 'password123'
        }
      })
      
      // Complete login
      cy.get('[data-testid="email-input"]').type('test@example.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      
      // Verify redirect and API call
      cy.wait('@login')
      cy.url().should('include', '/dashboard')
      
      // Test accessibility of dashboard
      cy.testAccessibility()
      
      // Verify user is logged in
      cy.get('[data-testid="user-menu"]').should('contain', 'Test User')
    })

    it('should handle login errors gracefully', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: { error: 'Invalid credentials' }
      }).as('loginError')
      
      cy.visit('/login')
      
      cy.get('[data-testid="email-input"]').type('wrong@example.com')
      cy.get('[data-testid="password-input"]').type('wrongpassword')
      cy.get('[data-testid="login-button"]').click()
      
      cy.wait('@loginError')
      
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Invalid credentials')
      
      // Should stay on login page
      cy.url().should('include', '/login')
    })

    it('should logout successfully', () => {
      // Login first
      cy.login()
      
      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="logout-button"]').click()
      
      // Should redirect to home and clear user data
      cy.url().should('not.include', '/dashboard')
      cy.get('[data-testid="login-link"]').should('be.visible')
    })
  })

  describe('Component Library Showcase', () => {
    beforeEach(() => {
      cy.visit('/components')
    })

    it('should display all component categories', () => {
      // Test main navigation
      const categories = [
        'buttons',
        'forms',
        'cards',
        'modals',
        'navigation',
        'feedback',
        'data-display',
        'layout'
      ]
      
      categories.forEach(category => {
        cy.get(`[data-testid="category-${category}"]`)
          .should('be.visible')
          .and('contain', category.charAt(0).toUpperCase() + category.slice(1))
      })
    })

    it('should demonstrate button variants', () => {
      cy.get('[data-testid="category-buttons"]').click()
      
      // Test different button states
      const buttonStates = [
        { variant: 'primary', size: 'small' },
        { variant: 'secondary', size: 'medium' },
        { variant: 'danger', size: 'large' },
        { variant: 'primary', disabled: true },
        { variant: 'primary', loading: true }
      ]
      
      buttonStates.forEach(state => {
        const testId = `demo-button-${state.variant}-${state.size || 'medium'}`
        cy.get(`[data-testid="${testId}"]`).should('be.visible')
        
        if (state.disabled) {
          cy.get(`[data-testid="${testId}"]`).should('be.disabled')
        }
        
        if (state.loading) {
          cy.get(`[data-testid="${testId}"]`).should('contain', 'Loading')
        }
      })
    })

    it('should test responsive design across viewports', () => {
      cy.testResponsive('[data-testid="component-showcase"]', ['mobile', 'tablet', 'desktop'])
      
      // Test mobile navigation
      cy.viewport(375, 667)
      cy.get('[data-testid="mobile-menu-button"]').should('be.visible').click()
      cy.get('[data-testid="mobile-navigation"]').should('be.visible')
      
      // Test desktop navigation
      cy.viewport(1280, 720)
      cy.get('[data-testid="desktop-navigation"]').should('be.visible')
      cy.get('[data-testid="mobile-menu-button"]').should('not.be.visible')
    })

    it('should handle interactive component demos', () => {
      // Test modal demo
      cy.get('[data-testid="category-modals"]').click()
      cy.get('[data-testid="demo-modal-trigger"]').click()
      
      cy.get('[data-testid="demo-modal"]').should('be.visible')
      cy.get('[data-testid="demo-modal-close"]').click()
      cy.get('[data-testid="demo-modal"]').should('not.exist')
      
      // Test form demo
      cy.get('[data-testid="category-forms"]').click()
      cy.get('[data-testid="demo-form-input"]').type('Test input')
      cy.get('[data-testid="demo-form-submit"]').click()
      
      cy.get('[data-testid="demo-form-result"]')
        .should('be.visible')
        .and('contain', 'Form submitted with: Test input')
    })
  })

  describe('Accessibility Compliance', () => {
    it('should meet WCAG guidelines across all pages', () => {
      const pages = ['/', '/components', '/docs']
      
      pages.forEach(page => {
        cy.visit(page)
        
        // Test with different accessibility rules
        cy.testAccessibility({
          rules: {
            'color-contrast': { enabled: true },
            'keyboard-navigation': { enabled: true },
            'focus-management': { enabled: true },
            'aria-labels': { enabled: true },
            'semantic-structure': { enabled: true }
          }
        })
      })
    })

    it('should support keyboard navigation', () => {
      cy.visit('/components')
      
      // Test tab navigation through interactive elements
      const focusableElements = [
        '[data-testid="category-buttons"]',
        '[data-testid="category-forms"]',
        '[data-testid="category-modals"]',
        '[data-testid="search-input"]',
        '[data-testid="theme-toggle"]'
      ]
      
      cy.testKeyboardNavigation(focusableElements)
      
      // Test Enter key activation
      cy.get('[data-testid="category-buttons"]').focus().type('{enter}')
      cy.url().should('include', '#buttons')
    })

    it('should provide proper ARIA labels and roles', () => {
      cy.visit('/components')
      
      // Check for essential ARIA attributes
      cy.get('[role="main"]').should('exist')
      cy.get('[role="navigation"]').should('exist')
      cy.get('[aria-label]').should('have.length.greaterThan', 0)
      
      // Test screen reader announcements
      cy.get('[data-testid="loading-state"]').should('have.attr', 'aria-busy', 'true')
      cy.get('[data-testid="error-state"]').should('have.attr', 'role', 'alert')
    })
  })

  describe('Performance Benchmarks', () => {
    it('should meet performance thresholds', () => {
      cy.visit('/')
      
      // Test Core Web Vitals
      cy.window().then((win) => {
        // Largest Contentful Paint
        cy.wrap(win.performance.getEntriesByType('largest-contentful-paint')).then((entries) => {
          if (entries.length > 0) {
            expect(entries[0].startTime).to.be.lessThan(2500)
          }
        })
        
        // Cumulative Layout Shift would need additional setup
        // First Input Delay would need user interaction timing
      })
    })

    it('should handle concurrent user interactions', () => {
      cy.visit('/components')
      
      // Simulate multiple rapid interactions
      for (let i = 0; i < 10; i++) {
        cy.get('[data-testid="category-buttons"]').click({ force: true })
        cy.get('[data-testid="category-forms"]').click({ force: true })
      }
      
      // UI should remain responsive
      cy.get('[data-testid="component-showcase"]').should('be.visible')
    })

    it('should load resources efficiently', () => {
      cy.visit('/')
      
      cy.window().then((win) => {
        // Check resource timing
        const resources = win.performance.getEntriesByType('resource')
        const totalSize = resources.reduce((sum, resource) => {
          return sum + (resource.transferSize || 0)
        }, 0)
        
        // Total page resources should be under reasonable limit
        expect(totalSize).to.be.lessThan(2 * 1024 * 1024) // 2MB
        
        // Critical resources should load quickly
        const criticalResources = resources.filter(resource => 
          resource.name.includes('.css') || resource.name.includes('.js')
        )
        
        criticalResources.forEach(resource => {
          expect(resource.duration).to.be.lessThan(1000)
        })
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', () => {
      // Simulate network failure
      cy.intercept('GET', '/api/**', { forceNetworkError: true }).as('networkError')
      
      cy.visit('/components')
      
      cy.get('[data-testid="error-boundary"]')
        .should('be.visible')
        .and('contain', 'Something went wrong')
      
      cy.get('[data-testid="retry-button"]').should('be.visible')
    })

    it('should handle slow loading states', () => {
      // Simulate slow API
      cy.intercept('GET', '/api/**', (req) => {
        req.reply((res) => {
          res.delay(3000)
          res.send({ fixture: 'api-response.json' })
        })
      }).as('slowApi')
      
      cy.visit('/components')
      
      // Should show loading state
      cy.get('[data-testid="loading-spinner"]').should('be.visible')
      cy.get('[data-testid="loading-message"]').should('contain', 'Loading components...')
      
      cy.wait('@slowApi')
      
      // Should show content after loading
      cy.get('[data-testid="component-showcase"]').should('be.visible')
      cy.get('[data-testid="loading-spinner"]').should('not.exist')
    })

    it('should validate browser compatibility', () => {
      // Test essential browser features
      cy.window().then((win) => {
        expect(win.Promise).to.exist
        expect(win.fetch).to.exist
        expect(win.localStorage).to.exist
        expect(win.sessionStorage).to.exist
        expect(win.IntersectionObserver).to.exist
      })
      
      // Test CSS features
      cy.get('body').then(($body) => {
        const computedStyle = win.getComputedStyle($body[0])
        expect(computedStyle.getPropertyValue('display')).to.not.be.empty
      })
    })
  })
})