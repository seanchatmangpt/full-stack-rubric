describe('Home Page E2E Tests', () => {
  beforeEach(() => {
    cy.visitAndWait('/')
  })

  it('should load the home page successfully', () => {
    cy.get('h1').should('contain', 'Welcome to Vue UI Pattern Library')
    cy.get('body').should('be.visible')
    
    // Performance check
    cy.measurePerformance()
    cy.get('@performance').then((perf) => {
      expect(perf.domContentLoaded).to.be.lessThan(2000)
      expect(perf.firstContentfulPaint).to.be.lessThan(1500)
    })
  })

  it('should have accessible content', () => {
    cy.checkA11y()
    
    // Test heading hierarchy
    cy.get('h1').should('have.length', 1)
    cy.get('h2').should('have.length.greaterThan', 0)
    
    // Test interactive elements
    cy.get('button').should('have.attr', 'type')
    cy.get('input').should('have.attr', 'placeholder')
  })

  it('should test search functionality', () => {
    const searchTerm = 'DataTable'
    cy.testSearchBar('[data-testid="search-bar"]', searchTerm, ['DataTable'])
    
    // Verify search results update
    cy.get('[data-testid="component-table"]').should('contain', searchTerm)
  })

  it('should test filter dropdown', () => {
    cy.testFilterDropdown('[data-testid="category-filter"]', 'Data Display', 2)
    
    // Verify filtered results
    cy.get('[data-testid="component-table"] tbody tr').should('have.length', 2)
  })

  it('should test data table interactions', () => {
    const expectedColumns = ['Component Name', 'Category', 'Description']
    
    cy.testDataTable('[data-testid="component-table"]', {
      expectedColumns,
      testSorting: true,
      testSelection: true
    })
  })

  it('should test form components', () => {
    // Test form input
    cy.testFormInput('#demo-input', 'Hello World')
    cy.get('#demo-input').should('have.value', 'Hello World')
    
    // Test checkbox
    cy.get('[data-testid="demo-checkbox"]').check().should('be.checked')
    cy.get('[data-testid="demo-checkbox"]').uncheck().should('not.be.checked')
  })

  it('should test loading states', () => {
    cy.get('[data-testid="toggle-loading"]').click()
    cy.shouldBeVisible('[data-testid="loading-spinner"]')
    
    cy.get('[data-testid="toggle-loading"]').click()
    cy.shouldNotBeVisible('[data-testid="loading-spinner"]')
  })

  it('should test notification system', () => {
    // Test success notification
    cy.get('[data-testid="show-success"]').click()
    cy.testNotification('Operation completed successfully!', 'success')
    
    // Test error notification  
    cy.get('[data-testid="show-error"]').click()
    cy.testNotification('Something went wrong', 'error')
  })

  it('should work responsively across viewports', () => {
    cy.testResponsive((viewport) => {
      cy.get('h1').should('be.visible')
      cy.get('[data-testid="search-bar"]').should('be.visible')
      
      if (viewport.name === 'mobile') {
        // Mobile-specific tests
        cy.get('[data-testid="component-table"]').should('be.visible')
      }
      
      if (viewport.name === 'desktop') {
        // Desktop-specific tests  
        cy.get('[data-testid="component-table"]').should('be.visible')
        cy.get('[data-testid="category-filter"]').should('be.visible')
      }
    })
  })

  it('should handle table row clicks', () => {
    cy.get('[data-testid="component-table"] tbody tr').first().click()
    
    // Should trigger success notification
    cy.testNotification('Selected:', 'success')
  })

  it('should validate all interactive elements', () => {
    // Test all buttons are clickable
    cy.get('button').each($btn => {
      cy.wrap($btn).should('not.be.disabled')
    })
    
    // Test all inputs accept focus
    cy.get('input').each($input => {
      cy.wrap($input).focus().should('be.focused')
    })
    
    // Test all selects are functional
    cy.get('select').each($select => {
      cy.wrap($select).should('not.be.disabled')
    })
  })

  it('should test component showcase workflow', () => {
    // Step 1: Search for a component
    cy.testSearchBar('[data-testid="search-bar"]', 'Form')
    
    // Step 2: Apply category filter
    cy.testFilterDropdown('[data-testid="category-filter"]', 'Forms', 1)
    
    // Step 3: Click on filtered result
    cy.get('[data-testid="component-table"] tbody tr').first().click()
    
    // Step 4: Verify notification appears
    cy.testNotification('Selected:', 'success')
  })

  it('should persist state during navigation', () => {
    // Set search value
    cy.get('[data-testid="search-bar"] input').type('DataTable')
    
    // Set filter value
    cy.get('[data-testid="category-filter"]').select('Data Display')
    
    // Navigate to about and back
    cy.visit('/about')
    cy.go('back')
    
    // Verify state is maintained (if implemented)
    cy.get('[data-testid="search-bar"] input').should('have.value', 'DataTable')
  })
})