// Custom Cypress commands for UI component testing

// Component mounting for component tests
import { mount } from '@cypress/vue'

Cypress.Commands.add('mount', (component, options = {}) => {
  const defaultOptions = {
    global: {
      plugins: [],
      components: {},
      directives: {}
    },
    ...options
  }
  
  return mount(component, defaultOptions)
})

// Search component testing
Cypress.Commands.add('testSearchBar', (selector, searchTerm, expectedResults) => {
  cy.get(selector)
    .find('input')
    .clear()
    .type(searchTerm)
    
  // Wait for debounced search
  cy.wait(350)
  
  if (expectedResults && expectedResults.length > 0) {
    expectedResults.forEach(result => {
      cy.contains(result).should('be.visible')
    })
  }
})

// Filter testing
Cypress.Commands.add('testFilterDropdown', (selector, filterValue, expectedCount) => {
  cy.get(selector).click()
  cy.get('[data-testid="dropdown-option"]')
    .contains(filterValue)
    .click()
    
  if (expectedCount !== undefined) {
    cy.get('[data-testid="filtered-results"]')
      .should('have.length', expectedCount)
  }
})

// Table component testing
Cypress.Commands.add('testDataTable', (tableSelector, options = {}) => {
  const {
    shouldHaveRows = true,
    testSorting = true,
    testSelection = false,
    expectedColumns = []
  } = options
  
  // Check table exists and has content
  cy.get(tableSelector).should('exist')
  
  if (shouldHaveRows) {
    cy.get(`${tableSelector} tbody tr`).should('have.length.greaterThan', 0)
  }
  
  // Test column headers
  if (expectedColumns.length > 0) {
    expectedColumns.forEach((column, index) => {
      cy.get(`${tableSelector} thead th`).eq(index).should('contain.text', column)
    })
  }
  
  // Test sorting functionality
  if (testSorting) {
    cy.get(`${tableSelector} thead th[data-sortable="true"]`).first().as('sortableColumn')
    cy.get('@sortableColumn').click()
    
    // Verify sort indicator appears
    cy.get('@sortableColumn')
      .should('have.attr', 'data-sort-direction')
      .and('match', /asc|desc/)
  }
  
  // Test row selection
  if (testSelection) {
    cy.get(`${tableSelector} tbody tr`).first().click()
    cy.get(`${tableSelector} tbody tr`).first().should('have.class', 'selected')
  }
})

// Form component testing
Cypress.Commands.add('testFormInput', (inputSelector, testValue, options = {}) => {
  const {
    shouldValidate = true,
    expectedError = null,
    clearFirst = true
  } = options
  
  const input = cy.get(inputSelector)
  
  if (clearFirst) {
    input.clear()
  }
  
  input.type(testValue)
  
  // Test value is set
  input.should('have.value', testValue)
  
  if (shouldValidate) {
    // Trigger validation (blur event)
    input.blur()
    
    if (expectedError) {
      cy.get(`${inputSelector}-error, [data-testid="${inputSelector.replace('#', '')}-error"]`)
        .should('be.visible')
        .and('contain.text', expectedError)
    } else {
      // Should not have error
      cy.get(`${inputSelector}-error, [data-testid="${inputSelector.replace('#', '')}-error"]`)
        .should('not.exist')
    }
  }
})

// Modal testing
Cypress.Commands.add('testModal', (triggerSelector, modalSelector, options = {}) => {
  const {
    testEscapeKey = true,
    testBackdropClick = true,
    testFocusTrap = true
  } = options
  
  // Open modal
  cy.get(triggerSelector).click()
  cy.get(modalSelector).should('be.visible')
  
  // Test focus trap
  if (testFocusTrap) {
    cy.get(modalSelector).within(() => {
      cy.get('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
        .first()
        .should('be.focused')
    })
  }
  
  // Test escape key
  if (testEscapeKey) {
    cy.get('body').type('{esc}')
    cy.get(modalSelector).should('not.exist')
    
    // Reopen for backdrop test
    if (testBackdropClick) {
      cy.get(triggerSelector).click()
      cy.get(modalSelector).should('be.visible')
    }
  }
  
  // Test backdrop click
  if (testBackdropClick) {
    cy.get(modalSelector).click('topLeft')
    cy.get(modalSelector).should('not.exist')
  }
})

// Navigation testing
Cypress.Commands.add('testNavigation', (navSelector, expectedLinks) => {
  cy.get(navSelector).should('exist')
  
  expectedLinks.forEach(link => {
    cy.get(navSelector).within(() => {
      cy.contains(link.text)
        .should('be.visible')
        .and('have.attr', 'href')
        .and('include', link.href)
    })
  })
})

// Loading states testing
Cypress.Commands.add('testLoadingState', (containerSelector, triggerAction) => {
  // Execute action that triggers loading
  triggerAction()
  
  // Check loading indicator appears
  cy.get(containerSelector).within(() => {
    cy.get('[data-testid="loading"], .loading, [role="status"]')
      .should('exist')
      .and('be.visible')
  })
  
  // Wait for loading to complete
  cy.get(containerSelector).within(() => {
    cy.get('[data-testid="loading"], .loading, [role="status"]')
      .should('not.exist', { timeout: 10000 })
  })
})

// Notification testing
Cypress.Commands.add('testNotification', (expectedMessage, type = 'info') => {
  cy.get(`[data-testid="notification"], .notification, [role="alert"]`)
    .should('be.visible')
    .and('contain.text', expectedMessage)
  
  if (type) {
    cy.get(`[data-testid="notification"], .notification, [role="alert"]`)
      .should('have.attr', 'data-type', type)
      .or('have.class', `notification-${type}`)
  }
})

// Pagination testing
Cypress.Commands.add('testPagination', (paginationSelector, options = {}) => {
  const { testPageNavigation = true, testPageSizes = false } = options
  
  cy.get(paginationSelector).should('exist')
  
  if (testPageNavigation) {
    // Test next page
    cy.get(paginationSelector).within(() => {
      cy.get('[data-testid="next-page"], .page-next').click()
    })
    
    cy.url().should('include', 'page=2')
    
    // Test previous page
    cy.get(paginationSelector).within(() => {
      cy.get('[data-testid="prev-page"], .page-prev').click()
    })
    
    cy.url().should('include', 'page=1')
  }
  
  if (testPageSizes) {
    cy.get(paginationSelector).within(() => {
      cy.get('[data-testid="page-size-select"], select').select('20')
    })
    
    cy.url().should('include', 'limit=20')
  }
})

// Drag and drop testing
Cypress.Commands.add('dragAndDrop', (dragSelector, dropSelector) => {
  cy.get(dragSelector).trigger('dragstart')
  cy.get(dropSelector).trigger('drop')
})

// File upload testing
Cypress.Commands.add('uploadFile', (inputSelector, fileName, fileType = 'text/plain') => {
  cy.fixture(fileName).then(fileContent => {
    const blob = new Blob([fileContent], { type: fileType })
    const file = new File([blob], fileName, { type: fileType })
    
    cy.get(inputSelector).then(input => {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      input[0].files = dataTransfer.files
      
      cy.wrap(input).trigger('change', { force: true })
    })
  })
})

// Component state testing
Cypress.Commands.add('testComponentState', (selector, expectedState) => {
  cy.get(selector).should($el => {
    const element = $el[0]
    const vueInstance = element.__vueParentComponent || element.__vue__
    
    if (vueInstance) {
      Object.keys(expectedState).forEach(key => {
        expect(vueInstance.setupState[key] || vueInstance[key]).to.deep.equal(expectedState[key])
      })
    }
  })
})

// Wait for Vue component to be ready
Cypress.Commands.add('waitForVue', (selector = '[data-cy-root]') => {
  cy.get(selector).should($el => {
    expect($el[0].__vueParentComponent || $el[0].__vue__).to.exist
  })
})