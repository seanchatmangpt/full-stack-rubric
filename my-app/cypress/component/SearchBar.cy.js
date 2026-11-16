import SearchBar from '@/components/ui/SearchBar.vue'

describe('SearchBar Component Tests', () => {
  it('should mount and render correctly', () => {
    cy.mount(SearchBar, {
      props: {
        placeholder: 'Search components...'
      }
    })
    
    cy.get('input').should('exist')
    cy.get('input').should('have.attr', 'placeholder', 'Search components...')
  })

  it('should handle user input with debouncing', () => {
    const onSearch = cy.stub()
    
    cy.mount(SearchBar, {
      props: {
        'onUpdate:modelValue': onSearch,
        onSearch: onSearch,
        debounce: 100
      }
    })
    
    cy.get('input').type('test query')
    cy.wait(150) // Wait for debounce
    
    cy.then(() => {
      expect(onSearch).to.have.been.calledWith('test query')
    })
  })

  it('should show and hide suggestions', () => {
    const suggestions = ['SearchBar', 'SearchFilters', 'DataTable']
    
    cy.mount(SearchBar, {
      props: {
        suggestions,
        showSuggestions: true
      }
    })
    
    cy.get('input').type('Search')
    
    // Suggestions should appear
    cy.get('[data-testid="suggestions-dropdown"]').should('be.visible')
    cy.get('[data-testid="suggestion-item"]').should('have.length', 2)
    cy.get('[data-testid="suggestion-item"]').first().should('contain.text', 'SearchBar')
  })

  it('should handle keyboard navigation in suggestions', () => {
    const suggestions = ['SearchBar', 'SearchFilters', 'DataTable']
    const onSuggestionSelect = cy.stub()
    
    cy.mount(SearchBar, {
      props: {
        suggestions,
        onSuggestionSelect
      }
    })
    
    cy.get('input').type('Search')
    
    // Navigate with arrow keys
    cy.get('input').type('{downarrow}')
    cy.get('[data-testid="suggestion-item"].highlighted').should('exist')
    
    cy.get('input').type('{downarrow}')
    cy.get('[data-testid="suggestion-item"].highlighted').should('contain.text', 'SearchFilters')
    
    // Select with enter
    cy.get('input').type('{enter}')
    cy.then(() => {
      expect(onSuggestionSelect).to.have.been.calledWith('SearchFilters')
    })
  })

  it('should handle loading state', () => {
    cy.mount(SearchBar, {
      props: {
        loading: true
      }
    })
    
    cy.get('[data-testid="search-loading"]').should('be.visible')
    cy.get('input').should('have.attr', 'disabled')
  })

  it('should handle clear functionality', () => {
    const onClear = cy.stub()
    
    cy.mount(SearchBar, {
      props: {
        modelValue: 'test query',
        showClear: true,
        onClear
      }
    })
    
    cy.get('[data-testid="clear-button"]').should('be.visible')
    cy.get('[data-testid="clear-button"]').click()
    
    cy.then(() => {
      expect(onClear).to.have.been.called
    })
  })

  it('should be accessible', () => {
    cy.mount(SearchBar, {
      props: {
        label: 'Search Components',
        placeholder: 'Enter search term...'
      }
    })
    
    cy.testComponentA11y(SearchBar, {
      label: 'Search Components',
      placeholder: 'Enter search term...'
    })
  })

  it('should work responsively', () => {
    cy.mount(SearchBar, {
      props: {
        placeholder: 'Search...'
      }
    })
    
    cy.testResponsive((viewport) => {
      cy.get('input').should('be.visible')
      
      if (viewport.name === 'mobile') {
        // Mobile specific tests
        cy.get('input').should('have.css', 'width').and('not.equal', '0px')
      }
    })
  })

  it('should test component performance', () => {
    cy.testComponentPerformance(SearchBar, {
      placeholder: 'Performance test'
    })
  })

  it('should handle prop reactivity', () => {
    cy.testPropReactivity(
      SearchBar, 
      'placeholder', 
      'Initial placeholder', 
      'Updated placeholder'
    )
  })

  it('should test component events', () => {
    cy.testComponentEvent(
      SearchBar,
      () => {
        cy.get('input').type('test')
        cy.wait(350) // Debounce delay
      },
      'update:modelValue',
      'test'
    )
  })

  it('should test slots customization', () => {
    cy.testComponentSlots(SearchBar, {
      prepend: '<div data-testid="prepend-slot">🔍</div>',
      append: '<div data-testid="append-slot">Clear</div>'
    })
    
    cy.get('[data-testid="prepend-slot"]').should('contain.text', '🔍')
    cy.get('[data-testid="append-slot"]').should('contain.text', 'Clear')
  })

  it('should handle edge cases', () => {
    // Test with null/undefined values
    cy.mount(SearchBar, {
      props: {
        modelValue: null,
        suggestions: undefined
      }
    })
    
    cy.get('input').should('have.value', '')
    
    // Test with empty suggestions
    cy.mount(SearchBar, {
      props: {
        suggestions: []
      }
    })
    
    cy.get('input').type('test')
    cy.get('[data-testid="suggestions-dropdown"]').should('not.exist')
  })

  it('should integrate with form validation', () => {
    const onValidate = cy.stub()
    
    cy.mount(SearchBar, {
      props: {
        required: true,
        validator: (value) => value.length >= 3 ? null : 'Minimum 3 characters required',
        onValidate
      }
    })
    
    // Test validation on short input
    cy.get('input').type('ab')
    cy.get('input').blur()
    
    cy.get('[data-testid="validation-error"]').should('contain.text', 'Minimum 3 characters')
    
    // Test valid input
    cy.get('input').clear().type('valid search')
    cy.get('input').blur()
    
    cy.get('[data-testid="validation-error"]').should('not.exist')
  })
})