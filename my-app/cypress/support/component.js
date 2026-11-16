// Cypress component testing support
import './commands'
import { mount } from '@cypress/vue'

// Global component testing setup
beforeEach(() => {
  // Set consistent viewport for component tests  
  cy.viewport(1280, 720)
})

// Register global mount command
Cypress.Commands.add('mount', (component, options = {}) => {
  const defaultOptions = {
    global: {
      plugins: [],
      components: {},
      directives: {},
      provide: {},
      mocks: {}
    },
    props: {},
    slots: {},
    ...options
  }
  
  return mount(component, defaultOptions)
})

// Component-specific testing utilities
Cypress.Commands.add('mountWithProps', (component, props = {}, options = {}) => {
  return cy.mount(component, {
    props,
    ...options
  })
})

Cypress.Commands.add('mountWithSlots', (component, slots = {}, options = {}) => {
  return cy.mount(component, {
    slots,
    ...options
  })
})

// Test component props reactivity
Cypress.Commands.add('testPropReactivity', (component, propName, initialValue, newValue) => {
  cy.mount(component, {
    props: {
      [propName]: initialValue
    }
  })
  
  // Verify initial value
  cy.get('[data-cy-root]').should('contain', initialValue)
  
  // Update prop and verify reactivity
  cy.get('[data-cy-root]').then(() => {
    Cypress.vueWrapper.setProps({
      [propName]: newValue
    })
  })
  
  cy.get('[data-cy-root]').should('contain', newValue)
})

// Test component events
Cypress.Commands.add('testComponentEvent', (component, triggerAction, expectedEvent, expectedPayload) => {
  const onEvent = cy.stub()
  
  cy.mount(component, {
    props: {
      [`on${expectedEvent.charAt(0).toUpperCase() + expectedEvent.slice(1)}`]: onEvent
    }
  })
  
  triggerAction()
  
  cy.then(() => {
    if (expectedPayload !== undefined) {
      expect(onEvent).to.have.been.calledWith(expectedPayload)
    } else {
      expect(onEvent).to.have.been.called
    }
  })
})

// Test component slots
Cypress.Commands.add('testComponentSlots', (component, slots) => {
  cy.mount(component, { slots })
  
  Object.keys(slots).forEach(slotName => {
    const slotContent = slots[slotName]
    cy.get('[data-cy-root]').should('contain', slotContent)
  })
})

// Accessibility testing for components
Cypress.Commands.add('testComponentA11y', (component, props = {}) => {
  cy.mount(component, { props })
  cy.injectAxe()
  cy.checkAxe('[data-cy-root]')
})

// Test component responsive behavior
Cypress.Commands.add('testComponentResponsive', (component, props = {}) => {
  const viewports = [
    { width: 375, height: 667, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1280, height: 720, name: 'desktop' }
  ]
  
  cy.mount(component, { props })
  
  viewports.forEach(viewport => {
    cy.viewport(viewport.width, viewport.height)
    cy.get('[data-cy-root]').should('be.visible')
    // Add specific responsive checks here
  })
})

// Mock common dependencies
const mockRouter = {
  push: cy.stub(),
  replace: cy.stub(),
  go: cy.stub(),
  back: cy.stub(),
  forward: cy.stub(),
  currentRoute: {
    value: {
      path: '/',
      name: 'home',
      params: {},
      query: {},
      meta: {}
    }
  }
}

const mockStore = {
  state: {},
  getters: {},
  dispatch: cy.stub(),
  commit: cy.stub()
}

// Helper to mount component with common mocks
Cypress.Commands.add('mountWithMocks', (component, options = {}) => {
  return cy.mount(component, {
    global: {
      mocks: {
        $router: mockRouter,
        $route: mockRouter.currentRoute.value,
        $store: mockStore,
        ...options.mocks
      },
      ...options.global
    },
    ...options
  })
})

// Performance testing for components
Cypress.Commands.add('testComponentPerformance', (component, props = {}, iterations = 100) => {
  cy.window().then(win => {
    const startTime = win.performance.now()
    
    for (let i = 0; i < iterations; i++) {
      cy.mount(component, { props })
    }
    
    const endTime = win.performance.now()
    const averageTime = (endTime - startTime) / iterations
    
    cy.log(`Average mount time: ${averageTime.toFixed(2)}ms`)
    expect(averageTime).to.be.lessThan(50) // Should mount in less than 50ms
  })
})