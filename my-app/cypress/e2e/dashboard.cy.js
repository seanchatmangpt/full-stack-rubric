describe('Dashboard E2E Tests', () => {
  beforeEach(() => {
    cy.visitAndWait('/dashboard')
  })

  it('should load dashboard with all components', () => {
    cy.get('h1').should('contain', 'UI Component Dashboard')
    
    // Check statistics cards
    cy.get('[data-testid="stats-grid"]').should('exist')
    cy.get('[data-testid="total-components"]').should('contain.text', '38')
    cy.get('[data-testid="categories"]').should('contain.text', '6')
    
    // Performance validation
    cy.measurePerformance()
    cy.get('@performance').then((perf) => {
      expect(perf.domContentLoaded).to.be.lessThan(3000)
    })
  })

  it('should test comprehensive search and filtering', () => {
    // Test search functionality
    cy.get('[data-testid="search-input"]').type('Search')
    cy.wait(350) // Debounce delay
    
    cy.get('[data-testid="results-table"] tbody tr').should('have.length.greaterThan', 0)
    
    // Test category filtering
    cy.get('[data-testid="category-filter"]').select('Search & Filter')
    cy.get('[data-testid="results-table"] tbody tr').should('contain.text', 'search')
    
    // Test status filtering
    cy.get('[data-testid="status-filter"]').select('Stable')
    cy.get('[data-testid="results-table"] tbody tr').should('contain.text', 'stable')
    
    // Clear filters
    cy.get('[data-testid="clear-filters"]').click()
    cy.get('[data-testid="results-table"] tbody tr').should('have.length.greaterThan', 5)
  })

  it('should test data table functionality', () => {
    const expectedColumns = ['Name', 'Category', 'Status', 'Size (bytes)', 'Description']
    
    cy.testDataTable('[data-testid="results-table"]', {
      expectedColumns,
      testSorting: true,
      shouldHaveRows: true
    })
  })

  it('should test pagination', () => {
    cy.testPagination('[data-testid="pagination"]', {
      testPageNavigation: true,
      testPageSizes: true
    })
  })

  it('should test component detail modal', () => {
    // Click on first component row
    cy.get('[data-testid="results-table"] tbody tr').first().click()
    
    // Modal should open
    cy.get('[data-testid="component-modal"]').should('be.visible')
    
    // Test modal content
    cy.get('[data-testid="modal-title"]').should('contain.text', 'SearchBar')
    cy.get('[data-testid="component-description"]').should('exist')
    cy.get('[data-testid="component-features"]').should('exist')
    cy.get('[data-testid="component-props"]').should('exist')
    
    // Test modal interactions
    cy.testModal(
      '[data-testid="results-table"] tbody tr:first', 
      '[data-testid="component-modal"]'
    )
  })

  it('should test refresh functionality', () => {
    cy.testLoadingState('[data-testid="dashboard-container"]', () => {
      cy.get('[data-testid="refresh-button"]').click()
    })
  })

  it('should test export functionality', () => {
    // Mock download
    cy.window().then((win) => {
      cy.stub(win, 'open').as('windowOpen')
    })
    
    cy.get('[data-testid="export-button"]').click()
    
    // Verify download was triggered (in a real app, this would download a file)
    cy.get('@windowOpen').should('have.been.called')
  })

  it('should test responsive dashboard layout', () => {
    cy.testResponsive((viewport) => {
      // Statistics should always be visible
      cy.get('[data-testid="stats-grid"]').should('be.visible')
      
      if (viewport.name === 'mobile') {
        // Mobile layout adaptations
        cy.get('[data-testid="search-filters"]').should('be.visible')
        // Table might be horizontally scrollable on mobile
        cy.get('[data-testid="results-table"]').should('be.visible')
      }
      
      if (viewport.name === 'desktop') {
        // Desktop layout should show all filters in a row
        cy.get('[data-testid="filters-row"]').should('be.visible')
        cy.get('[data-testid="results-table"]').should('be.visible')
      }
    })
  })

  it('should validate accessibility compliance', () => {
    cy.checkA11y()
    
    // Test keyboard navigation
    cy.get('[data-testid="search-input"]').focus().should('be.focused')
    cy.get('[data-testid="search-input"]').tab()
    cy.get('[data-testid="category-filter"]').should('be.focused')
    
    // Test ARIA labels
    cy.get('[data-testid="results-table"]').should('have.attr', 'role', 'table')
    cy.get('[data-testid="pagination"]').should('have.attr', 'role', 'navigation')
  })

  it('should test advanced filtering combinations', () => {
    // Complex filter scenario
    cy.get('[data-testid="search-input"]').type('Form')
    cy.get('[data-testid="category-filter"]').select('Forms & Modals')
    cy.get('[data-testid="status-filter"]').select('Stable')
    
    // Should show filtered results
    cy.get('[data-testid="results-table"] tbody tr').should('have.length.greaterThan', 0)
    cy.get('[data-testid="results-count"]').should('contain.text', 'items')
    
    // Verify all results match filters
    cy.get('[data-testid="results-table"] tbody tr').each($row => {
      cy.wrap($row).should('contain.text', 'forms')
      cy.wrap($row).should('contain.text', 'stable')
    })
  })

  it('should test component props table in modal', () => {
    // Open component modal
    cy.get('[data-testid="results-table"] tbody tr').first().click()
    
    // Test props table within modal
    cy.get('[data-testid="component-modal"]').within(() => {
      cy.testDataTable('[data-testid="props-table"]', {
        expectedColumns: ['Prop Name', 'Type', 'Required', 'Default'],
        shouldHaveRows: true,
        testSorting: false
      })
    })
  })

  it('should handle error states gracefully', () => {
    // Simulate network error by intercepting API calls
    cy.intercept('GET', '/api/components', { statusCode: 500 }).as('getComponentsError')
    
    cy.get('[data-testid="refresh-button"]').click()
    
    // Should show error message
    cy.get('[data-testid="error-message"]').should('be.visible')
    cy.get('[data-testid="error-message"]').should('contain.text', 'Failed to load')
  })

  it('should maintain filter state during component interaction', () => {
    // Set filters
    cy.get('[data-testid="search-input"]').type('Data')
    cy.get('[data-testid="category-filter"]').select('Data Display')
    
    // Open and close modal
    cy.get('[data-testid="results-table"] tbody tr').first().click()
    cy.get('[data-testid="component-modal"] [data-testid="close-button"]').click()
    
    // Verify filters are maintained
    cy.get('[data-testid="search-input"]').should('have.value', 'Data')
    cy.get('[data-testid="category-filter"]').should('have.value', 'data')
  })
})