/**
 * BDD Step Generators for State Management (Pinia/Store)
 * Handles store state, mutations, actions, and reactive data
 * @module state-management-steps  
 */

import { registerStepGenerator } from './step-generators.js'

/**
 * State management step generator class
 */
class StateManagementStepGenerator {
  constructor() {
    this.patterns = new Map()
    this.storeStates = new Map()
  }

  /**
   * Register all state management related step generators
   */
  registerSteps() {
    // Store setup
    registerStepGenerator('given-store-exists', {
      pattern: '(?:a |the )?(?:"([^"]*)"|([^"]*)) store exists',
      type: 'Given',
      generator: this.generateGivenStoreExists.bind(this),
      tags: ['state', 'store', 'setup'],
      metadata: { description: 'Initialize store for testing' }
    })

    registerStepGenerator('given-store-has-initial-state', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) store has initial state:?\\s*([\\s\\S]*)',
      type: 'Given',
      generator: this.generateGivenStoreHasInitialState.bind(this),
      tags: ['state', 'store', 'setup', 'initial'],
      metadata: { description: 'Set initial store state' }
    })

    registerStepGenerator('given-store-state-property', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) store has "([^"]*)" set to "([^"]*)"',
      type: 'Given',
      generator: this.generateGivenStoreStateProperty.bind(this),
      tags: ['state', 'store', 'property'],
      metadata: { description: 'Set specific store property value' }
    })

    // State inspection
    registerStepGenerator('when-get-store-state', {
      pattern: 'I (?:get|check|inspect) (?:the )?(?:"([^"]*)"|([^"]*)) store state',
      type: 'When',
      generator: this.generateWhenGetStoreState.bind(this),
      tags: ['state', 'store', 'inspection'],
      metadata: { description: 'Retrieve current store state' }
    })

    registerStepGenerator('when-get-store-property', {
      pattern: 'I (?:get|check) (?:the )?(?:"([^"]*)"|([^"]*)) store property "([^"]*)"',
      type: 'When',
      generator: this.generateWhenGetStoreProperty.bind(this),
      tags: ['state', 'store', 'property'],
      metadata: { description: 'Get specific store property' }
    })

    // Store mutations/updates
    registerStepGenerator('when-update-store-property', {
      pattern: 'I (?:set|update) (?:the )?(?:"([^"]*)"|([^"]*)) store property "([^"]*)" to "([^"]*)"',
      type: 'When',
      generator: this.generateWhenUpdateStoreProperty.bind(this),
      tags: ['state', 'store', 'mutation', 'update'],
      metadata: { description: 'Update store property value' }
    })

    registerStepGenerator('when-call-store-action', {
      pattern: 'I call (?:the )?(?:"([^"]*)"|([^"]*)) store action "([^"]*)"(?:with data:?\\s*([\\s\\S]*))?',
      type: 'When',
      generator: this.generateWhenCallStoreAction.bind(this),
      tags: ['state', 'store', 'action'],
      metadata: { description: 'Execute store action' }
    })

    registerStepGenerator('when-dispatch-store-mutation', {
      pattern: 'I dispatch (?:the )?(?:"([^"]*)"|([^"]*)) store mutation "([^"]*)"(?:with payload:?\\s*([\\s\\S]*))?',
      type: 'When',
      generator: this.generateWhenDispatchStoreMutation.bind(this),
      tags: ['state', 'store', 'mutation', 'dispatch'],
      metadata: { description: 'Dispatch store mutation' }
    })

    registerStepGenerator('when-reset-store', {
      pattern: 'I reset (?:the )?(?:"([^"]*)"|([^"]*)) store',
      type: 'When',
      generator: this.generateWhenResetStore.bind(this),
      tags: ['state', 'store', 'reset'],
      metadata: { description: 'Reset store to initial state' }
    })

    // State verification
    registerStepGenerator('then-store-property-should-be', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) store property "([^"]*)" should be "([^"]*)"',
      type: 'Then',
      generator: this.generateThenStorePropertyShouldBe.bind(this),
      tags: ['state', 'store', 'verification'],
      metadata: { description: 'Verify store property value' }
    })

    registerStepGenerator('then-store-property-should-be-number', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) store property "([^"]*)" should be (\\d+)',
      type: 'Then',
      generator: this.generateThenStorePropertyShouldBeNumber.bind(this),
      tags: ['state', 'store', 'verification', 'number'],
      metadata: { description: 'Verify store property is number' }
    })

    registerStepGenerator('then-store-property-should-be-boolean', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) store property "([^"]*)" should be (true|false)',
      type: 'Then',
      generator: this.generateThenStorePropertyShouldBeBoolean.bind(this),
      tags: ['state', 'store', 'verification', 'boolean'],
      metadata: { description: 'Verify store property is boolean' }
    })

    registerStepGenerator('then-store-should-have-property', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) store should have property "([^"]*)"',
      type: 'Then',
      generator: this.generateThenStoreShouldHaveProperty.bind(this),
      tags: ['state', 'store', 'verification', 'property'],
      metadata: { description: 'Verify store has specific property' }
    })

    registerStepGenerator('then-store-should-not-have-property', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) store should not have property "([^"]*)"',
      type: 'Then',
      generator: this.generateThenStoreShouldNotHaveProperty.bind(this),
      tags: ['state', 'store', 'verification', 'property'],
      metadata: { description: 'Verify store does not have property' }
    })

    // Array/collection operations
    registerStepGenerator('when-add-item-to-store-array', {
      pattern: 'I add item "([^"]*)" to (?:the )?(?:"([^"]*)"|([^"]*)) store array "([^"]*)"',
      type: 'When',
      generator: this.generateWhenAddItemToStoreArray.bind(this),
      tags: ['state', 'store', 'array', 'add'],
      metadata: { description: 'Add item to store array' }
    })

    registerStepGenerator('when-remove-item-from-store-array', {
      pattern: 'I remove item "([^"]*)" from (?:the )?(?:"([^"]*)"|([^"]*)) store array "([^"]*)"',
      type: 'When',
      generator: this.generateWhenRemoveItemFromStoreArray.bind(this),
      tags: ['state', 'store', 'array', 'remove'],
      metadata: { description: 'Remove item from store array' }
    })

    registerStepGenerator('when-clear-store-array', {
      pattern: 'I clear (?:the )?(?:"([^"]*)"|([^"]*)) store array "([^"]*)"',
      type: 'When',
      generator: this.generateWhenClearStoreArray.bind(this),
      tags: ['state', 'store', 'array', 'clear'],
      metadata: { description: 'Clear store array' }
    })

    registerStepGenerator('then-store-array-should-have-length', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) store array "([^"]*)" should have (\\d+) items?',
      type: 'Then',
      generator: this.generateThenStoreArrayShouldHaveLength.bind(this),
      tags: ['state', 'store', 'array', 'length'],
      metadata: { description: 'Verify store array length' }
    })

    registerStepGenerator('then-store-array-should-contain', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) store array "([^"]*)" should contain "([^"]*)"',
      type: 'Then',
      generator: this.generateThenStoreArrayShouldContain.bind(this),
      tags: ['state', 'store', 'array', 'contains'],
      metadata: { description: 'Verify store array contains item' }
    })

    registerStepGenerator('then-store-array-should-not-contain', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) store array "([^"]*)" should not contain "([^"]*)"',
      type: 'Then',
      generator: this.generateThenStoreArrayShouldNotContain.bind(this),
      tags: ['state', 'store', 'array', 'contains'],
      metadata: { description: 'Verify store array does not contain item' }
    })

    // Computed/getters verification
    registerStepGenerator('then-store-getter-should-return', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) store getter "([^"]*)" should return "([^"]*)"',
      type: 'Then',
      generator: this.generateThenStoreGetterShouldReturn.bind(this),
      tags: ['state', 'store', 'getter', 'computed'],
      metadata: { description: 'Verify store getter return value' }
    })

    registerStepGenerator('then-store-computed-should-be', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) store computed "([^"]*)" should be "([^"]*)"',
      type: 'Then',
      generator: this.generateThenStoreComputedShouldBe.bind(this),
      tags: ['state', 'store', 'computed', 'verification'],
      metadata: { description: 'Verify store computed property value' }
    })

    // State persistence
    registerStepGenerator('when-persist-store-state', {
      pattern: 'I persist (?:the )?(?:"([^"]*)"|([^"]*)) store state',
      type: 'When',
      generator: this.generateWhenPersistStoreState.bind(this),
      tags: ['state', 'store', 'persistence'],
      metadata: { description: 'Persist store state to storage' }
    })

    registerStepGenerator('when-restore-store-state', {
      pattern: 'I restore (?:the )?(?:"([^"]*)"|([^"]*)) store state',
      type: 'When',
      generator: this.generateWhenRestoreStoreState.bind(this),
      tags: ['state', 'store', 'persistence'],
      metadata: { description: 'Restore store state from storage' }
    })

    // Reactivity verification
    registerStepGenerator('then-component-should-react-to-store-change', {
      pattern: '(?:the )?component should react to (?:"([^"]*)"|([^"]*)) store "([^"]*)" change',
      type: 'Then',
      generator: this.generateThenComponentShouldReactToStoreChange.bind(this),
      tags: ['state', 'store', 'reactivity', 'component'],
      metadata: { description: 'Verify component reacts to store changes' }
    })

    registerStepGenerator('then-ui-should-update-with-store', {
      pattern: '(?:the )?UI should update when (?:"([^"]*)"|([^"]*)) store changes',
      type: 'Then',
      generator: this.generateThenUiShouldUpdateWithStore.bind(this),
      tags: ['state', 'store', 'reactivity', 'ui'],
      metadata: { description: 'Verify UI updates with store changes' }
    })

    // Store loading states
    registerStepGenerator('given-store-is-loading', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) store is (?:in )?loading (?:state)?',
      type: 'Given',
      generator: this.generateGivenStoreIsLoading.bind(this),
      tags: ['state', 'store', 'loading'],
      metadata: { description: 'Set store in loading state' }
    })

    registerStepGenerator('when-store-starts-loading', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) store starts loading',
      type: 'When',
      generator: this.generateWhenStoreStartsLoading.bind(this),
      tags: ['state', 'store', 'loading'],
      metadata: { description: 'Trigger store loading state' }
    })

    registerStepGenerator('when-store-finishes-loading', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) store finishes loading',
      type: 'When',
      generator: this.generateWhenStoreFinishesLoading.bind(this),
      tags: ['state', 'store', 'loading'],
      metadata: { description: 'End store loading state' }
    })

    registerStepGenerator('then-store-should-be-loading', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) store should be loading',
      type: 'Then',
      generator: this.generateThenStoreShouldBeLoading.bind(this),
      tags: ['state', 'store', 'loading', 'verification'],
      metadata: { description: 'Verify store is in loading state' }
    })

    registerStepGenerator('then-store-should-not-be-loading', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) store should not be loading',
      type: 'Then',
      generator: this.generateThenStoreShouldNotBeLoading.bind(this),
      tags: ['state', 'store', 'loading', 'verification'],
      metadata: { description: 'Verify store is not loading' }
    })

    // Error states
    registerStepGenerator('given-store-has-error', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) store has error "([^"]*)"',
      type: 'Given',
      generator: this.generateGivenStoreHasError.bind(this),
      tags: ['state', 'store', 'error'],
      metadata: { description: 'Set store error state' }
    })

    registerStepGenerator('when-store-error-occurs', {
      pattern: '(?:an |)error occurs in (?:the )?(?:"([^"]*)"|([^"]*)) store(?:with message "([^"]*)")?',
      type: 'When',
      generator: this.generateWhenStoreErrorOccurs.bind(this),
      tags: ['state', 'store', 'error'],
      metadata: { description: 'Trigger store error state' }
    })

    registerStepGenerator('when-clear-store-error', {
      pattern: 'I clear (?:the )?(?:"([^"]*)"|([^"]*)) store error',
      type: 'When',
      generator: this.generateWhenClearStoreError.bind(this),
      tags: ['state', 'store', 'error', 'clear'],
      metadata: { description: 'Clear store error state' }
    })

    registerStepGenerator('then-store-should-have-error', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) store should have (?:an )?error(?:with message "([^"]*)")?',
      type: 'Then',
      generator: this.generateThenStoreShouldHaveError.bind(this),
      tags: ['state', 'store', 'error', 'verification'],
      metadata: { description: 'Verify store has error' }
    })

    registerStepGenerator('then-store-should-not-have-error', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) store should not have (?:an )?error',
      type: 'Then',
      generator: this.generateThenStoreShouldNotHaveError.bind(this),
      tags: ['state', 'store', 'error', 'verification'],
      metadata: { description: 'Verify store does not have error' }
    })
  }

  /**
   * Generate given store exists step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateGivenStoreExists(match, options) {
    const [, storeName1, storeName2] = match
    const storeName = storeName1 || storeName2
    
    return `// Initialize ${storeName} store for testing
const { ${this.toCamelCase(storeName)}Store } = useStores()
this.${this.toCamelCase(storeName)}Store = ${this.toCamelCase(storeName)}Store

// Initialize with Pinia testing
const pinia = createTestingPinia({
  createSpy: vi.fn
})
this.wrapper = mount(Component, {
  global: {
    plugins: [pinia]
  }
})`
  }

  /**
   * Generate given store has initial state step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateGivenStoreHasInitialState(match, options) {
    const [, storeName1, storeName2, initialState] = match
    const storeName = storeName1 || storeName2
    
    return `// Set initial state for ${storeName} store
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
const initialState = ${this.parseJsonOrString(initialState)}
${this.toCamelCase(storeName)}Store.$patch(initialState)
this.${this.toCamelCase(storeName)}Store = ${this.toCamelCase(storeName)}Store`
  }

  /**
   * Generate given store state property step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateGivenStoreStateProperty(match, options) {
    const [, storeName1, storeName2, property, value] = match
    const storeName = storeName1 || storeName2
    
    return `// Set ${storeName} store property ${property} to ${value}
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
${this.toCamelCase(storeName)}Store.${property} = ${this.parseValue(value)}
this.${this.toCamelCase(storeName)}Store = ${this.toCamelCase(storeName)}Store`
  }

  /**
   * Generate when get store state step implementation
   * @param {Array} match - Regex match results  
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateWhenGetStoreState(match, options) {
    const [, storeName1, storeName2] = match
    const storeName = storeName1 || storeName2
    
    return `// Get ${storeName} store state
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
this.currentStoreState = ${this.toCamelCase(storeName)}Store.$state
this.storeSnapshot = JSON.parse(JSON.stringify(${this.toCamelCase(storeName)}Store.$state))`
  }

  /**
   * Generate when get store property step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateWhenGetStoreProperty(match, options) {
    const [, storeName1, storeName2, property] = match
    const storeName = storeName1 || storeName2
    
    return `// Get ${storeName} store property ${property}
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
this.storePropertyValue = ${this.toCamelCase(storeName)}Store.${property}`
  }

  /**
   * Generate when update store property step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateWhenUpdateStoreProperty(match, options) {
    const [, storeName1, storeName2, property, value] = match
    const storeName = storeName1 || storeName2
    
    return `// Update ${storeName} store property ${property}
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
${this.toCamelCase(storeName)}Store.${property} = ${this.parseValue(value)}
await nextTick() // Wait for reactivity updates`
  }

  /**
   * Generate when call store action step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateWhenCallStoreAction(match, options) {
    const [, storeName1, storeName2, actionName, actionData] = match
    const storeName = storeName1 || storeName2
    const hasData = actionData && actionData.trim()
    
    return `// Call ${storeName} store action ${actionName}
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
${hasData ? 
  `const actionData = ${this.parseJsonOrString(actionData)}
this.actionResult = await ${this.toCamelCase(storeName)}Store.${actionName}(actionData)` :
  `this.actionResult = await ${this.toCamelCase(storeName)}Store.${actionName}()`
}
await nextTick() // Wait for action completion`
  }

  /**
   * Generate when dispatch store mutation step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateWhenDispatchStoreMutation(match, options) {
    const [, storeName1, storeName2, mutationName, payload] = match
    const storeName = storeName1 || storeName2
    const hasPayload = payload && payload.trim()
    
    return `// Dispatch ${storeName} store mutation ${mutationName}
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
${hasPayload ?
  `const payload = ${this.parseJsonOrString(payload)}
${this.toCamelCase(storeName)}Store.${mutationName}(payload)` :
  `${this.toCamelCase(storeName)}Store.${mutationName}()`
}
await nextTick() // Wait for mutation completion`
  }

  /**
   * Generate when reset store step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateWhenResetStore(match, options) {
    const [, storeName1, storeName2] = match
    const storeName = storeName1 || storeName2
    
    return `// Reset ${storeName} store
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
${this.toCamelCase(storeName)}Store.$reset()
await nextTick() // Wait for reset completion`
  }

  /**
   * Generate then store property should be step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateThenStorePropertyShouldBe(match, options) {
    const [, storeName1, storeName2, property, expectedValue] = match
    const storeName = storeName1 || storeName2
    
    return `// Verify ${storeName} store property ${property} equals ${expectedValue}
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
expect(${this.toCamelCase(storeName)}Store.${property}).toBe(${this.parseValue(expectedValue)})`
  }

  /**
   * Generate then store property should be number step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateThenStorePropertyShouldBeNumber(match, options) {
    const [, storeName1, storeName2, property, expectedValue] = match
    const storeName = storeName1 || storeName2
    
    return `// Verify ${storeName} store property ${property} is number ${expectedValue}
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
expect(${this.toCamelCase(storeName)}Store.${property}).toBe(${expectedValue})
expect(typeof ${this.toCamelCase(storeName)}Store.${property}).toBe('number')`
  }

  /**
   * Generate then store property should be boolean step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateThenStorePropertyShouldBeBoolean(match, options) {
    const [, storeName1, storeName2, property, expectedValue] = match
    const storeName = storeName1 || storeName2
    
    return `// Verify ${storeName} store property ${property} is boolean ${expectedValue}
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
expect(${this.toCamelCase(storeName)}Store.${property}).toBe(${expectedValue})
expect(typeof ${this.toCamelCase(storeName)}Store.${property}).toBe('boolean')`
  }

  /**
   * Generate then store should have property step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateThenStoreShouldHaveProperty(match, options) {
    const [, storeName1, storeName2, property] = match
    const storeName = storeName1 || storeName2
    
    return `// Verify ${storeName} store has property ${property}
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
expect(${this.toCamelCase(storeName)}Store).toHaveProperty('${property}')
expect(${this.toCamelCase(storeName)}Store.${property}).toBeDefined()`
  }

  /**
   * Generate then store should not have property step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateThenStoreShouldNotHaveProperty(match, options) {
    const [, storeName1, storeName2, property] = match
    const storeName = storeName1 || storeName2
    
    return `// Verify ${storeName} store does not have property ${property}
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
expect(${this.toCamelCase(storeName)}Store.${property}).toBeUndefined()`
  }

  /**
   * Generate when add item to store array step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateWhenAddItemToStoreArray(match, options) {
    const [, item, storeName1, storeName2, arrayProperty] = match
    const storeName = storeName1 || storeName2
    
    return `// Add item to ${storeName} store array ${arrayProperty}
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
if (!Array.isArray(${this.toCamelCase(storeName)}Store.${arrayProperty})) {
  ${this.toCamelCase(storeName)}Store.${arrayProperty} = []
}
${this.toCamelCase(storeName)}Store.${arrayProperty}.push(${this.parseValue(item)})
await nextTick()`
  }

  /**
   * Generate when remove item from store array step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateWhenRemoveItemFromStoreArray(match, options) {
    const [, item, storeName1, storeName2, arrayProperty] = match
    const storeName = storeName1 || storeName2
    
    return `// Remove item from ${storeName} store array ${arrayProperty}
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
const itemToRemove = ${this.parseValue(item)}
const index = ${this.toCamelCase(storeName)}Store.${arrayProperty}.findIndex(item => 
  typeof item === 'object' ? JSON.stringify(item) === JSON.stringify(itemToRemove) : item === itemToRemove
)
if (index !== -1) {
  ${this.toCamelCase(storeName)}Store.${arrayProperty}.splice(index, 1)
}
await nextTick()`
  }

  /**
   * Generate when clear store array step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateWhenClearStoreArray(match, options) {
    const [, storeName1, storeName2, arrayProperty] = match
    const storeName = storeName1 || storeName2
    
    return `// Clear ${storeName} store array ${arrayProperty}
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
${this.toCamelCase(storeName)}Store.${arrayProperty} = []
await nextTick()`
  }

  /**
   * Generate then store array should have length step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateThenStoreArrayShouldHaveLength(match, options) {
    const [, storeName1, storeName2, arrayProperty, expectedLength] = match
    const storeName = storeName1 || storeName2
    
    return `// Verify ${storeName} store array ${arrayProperty} has length ${expectedLength}
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
expect(Array.isArray(${this.toCamelCase(storeName)}Store.${arrayProperty})).toBe(true)
expect(${this.toCamelCase(storeName)}Store.${arrayProperty}.length).toBe(${expectedLength})`
  }

  /**
   * Generate then store array should contain step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateThenStoreArrayShouldContain(match, options) {
    const [, storeName1, storeName2, arrayProperty, expectedItem] = match
    const storeName = storeName1 || storeName2
    
    return `// Verify ${storeName} store array ${arrayProperty} contains ${expectedItem}
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
const expectedItem = ${this.parseValue(expectedItem)}
const found = ${this.toCamelCase(storeName)}Store.${arrayProperty}.some(item =>
  typeof item === 'object' ? JSON.stringify(item) === JSON.stringify(expectedItem) : item === expectedItem
)
expect(found).toBe(true)`
  }

  /**
   * Generate then store array should not contain step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateThenStoreArrayShouldNotContain(match, options) {
    const [, storeName1, storeName2, arrayProperty, item] = match
    const storeName = storeName1 || storeName2
    
    return `// Verify ${storeName} store array ${arrayProperty} does not contain ${item}
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
const itemToCheck = ${this.parseValue(item)}
const found = ${this.toCamelCase(storeName)}Store.${arrayProperty}.some(item =>
  typeof item === 'object' ? JSON.stringify(item) === JSON.stringify(itemToCheck) : item === itemToCheck
)
expect(found).toBe(false)`
  }

  /**
   * Generate then store getter should return step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateThenStoreGetterShouldReturn(match, options) {
    const [, storeName1, storeName2, getterName, expectedValue] = match
    const storeName = storeName1 || storeName2
    
    return `// Verify ${storeName} store getter ${getterName} returns ${expectedValue}
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
expect(${this.toCamelCase(storeName)}Store.${getterName}).toBe(${this.parseValue(expectedValue)})`
  }

  /**
   * Generate then store computed should be step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateThenStoreComputedShouldBe(match, options) {
    const [, storeName1, storeName2, computedName, expectedValue] = match
    const storeName = storeName1 || storeName2
    
    return `// Verify ${storeName} store computed ${computedName} equals ${expectedValue}
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
expect(${this.toCamelCase(storeName)}Store.${computedName}).toBe(${this.parseValue(expectedValue)})`
  }

  /**
   * Generate when persist store state step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateWhenPersistStoreState(match, options) {
    const [, storeName1, storeName2] = match
    const storeName = storeName1 || storeName2
    
    return `// Persist ${storeName} store state
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
// Mock localStorage for testing
const mockStorage = {
  setItem: vi.fn(),
  getItem: vi.fn(),
  removeItem: vi.fn()
}
global.localStorage = mockStorage

// Save state to localStorage
const stateToSave = JSON.stringify(${this.toCamelCase(storeName)}Store.$state)
localStorage.setItem('${storeName}Store', stateToSave)
this.persistedState = stateToSave`
  }

  /**
   * Generate when restore store state step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateWhenRestoreStoreState(match, options) {
    const [, storeName1, storeName2] = match
    const storeName = storeName1 || storeName2
    
    return `// Restore ${storeName} store state
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
const savedState = localStorage.getItem('${storeName}Store')
if (savedState) {
  const parsedState = JSON.parse(savedState)
  ${this.toCamelCase(storeName)}Store.$patch(parsedState)
}
await nextTick()`
  }

  /**
   * Generate then component should react to store change step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateThenComponentShouldReactToStoreChange(match, options) {
    const [, storeName1, storeName2, property] = match
    const storeName = storeName1 || storeName2
    
    return `// Verify component reacts to ${storeName} store ${property} change
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
const wrapper = mount(Component, {
  global: {
    plugins: [createTestingPinia()]
  }
})

// Capture initial state
const initialText = wrapper.text()

// Change store property
const newValue = 'changed-value'
${this.toCamelCase(storeName)}Store.${property} = newValue
await nextTick()

// Verify component updated
const updatedText = wrapper.text()
expect(updatedText).not.toBe(initialText)
expect(updatedText).toContain(newValue)`
  }

  /**
   * Generate then UI should update with store step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateThenUiShouldUpdateWithStore(match, options) {
    const [, storeName1, storeName2] = match
    const storeName = storeName1 || storeName2
    
    return `// Verify UI updates with ${storeName} store changes
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
const wrapper = mount(Component, {
  global: {
    plugins: [createTestingPinia()]
  }
})

// Watch for DOM updates
const observer = new MutationObserver(() => {
  this.domUpdated = true
})
observer.observe(wrapper.element, { childList: true, subtree: true })

// Trigger store change
${this.toCamelCase(storeName)}Store.$patch({ updated: Date.now() })
await nextTick()

// Verify DOM was updated
expect(this.domUpdated).toBe(true)
observer.disconnect()`
  }

  /**
   * Generate given store is loading step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateGivenStoreIsLoading(match, options) {
    const [, storeName1, storeName2] = match
    const storeName = storeName1 || storeName2
    
    return `// Set ${storeName} store in loading state
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
${this.toCamelCase(storeName)}Store.loading = true
${this.toCamelCase(storeName)}Store.error = null`
  }

  /**
   * Generate when store starts loading step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateWhenStoreStartsLoading(match, options) {
    const [, storeName1, storeName2] = match
    const storeName = storeName1 || storeName2
    
    return `// Start loading in ${storeName} store
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
${this.toCamelCase(storeName)}Store.setLoading(true)
await nextTick()`
  }

  /**
   * Generate when store finishes loading step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateWhenStoreFinishesLoading(match, options) {
    const [, storeName1, storeName2] = match
    const storeName = storeName1 || storeName2
    
    return `// Finish loading in ${storeName} store
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
${this.toCamelCase(storeName)}Store.setLoading(false)
await nextTick()`
  }

  /**
   * Generate then store should be loading step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateThenStoreShouldBeLoading(match, options) {
    const [, storeName1, storeName2] = match
    const storeName = storeName1 || storeName2
    
    return `// Verify ${storeName} store is loading
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
expect(${this.toCamelCase(storeName)}Store.loading).toBe(true)
expect(${this.toCamelCase(storeName)}Store.isLoading).toBe(true)`
  }

  /**
   * Generate then store should not be loading step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateThenStoreShouldNotBeLoading(match, options) {
    const [, storeName1, storeName2] = match
    const storeName = storeName1 || storeName2
    
    return `// Verify ${storeName} store is not loading
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
expect(${this.toCamelCase(storeName)}Store.loading).toBe(false)
expect(${this.toCamelCase(storeName)}Store.isLoading).toBe(false)`
  }

  /**
   * Generate given store has error step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateGivenStoreHasError(match, options) {
    const [, storeName1, storeName2, errorMessage] = match
    const storeName = storeName1 || storeName2
    
    return `// Set ${storeName} store error state
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
${this.toCamelCase(storeName)}Store.error = "${errorMessage}"
${this.toCamelCase(storeName)}Store.loading = false`
  }

  /**
   * Generate when store error occurs step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateWhenStoreErrorOccurs(match, options) {
    const [, storeName1, storeName2, errorMessage = 'An error occurred'] = match
    const storeName = storeName1 || storeName2
    
    return `// Trigger error in ${storeName} store
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
${this.toCamelCase(storeName)}Store.setError("${errorMessage}")
await nextTick()`
  }

  /**
   * Generate when clear store error step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateWhenClearStoreError(match, options) {
    const [, storeName1, storeName2] = match
    const storeName = storeName1 || storeName2
    
    return `// Clear ${storeName} store error
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
${this.toCamelCase(storeName)}Store.clearError()
await nextTick()`
  }

  /**
   * Generate then store should have error step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateThenStoreShouldHaveError(match, options) {
    const [, storeName1, storeName2, expectedMessage] = match
    const storeName = storeName1 || storeName2
    
    return `// Verify ${storeName} store has error
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
expect(${this.toCamelCase(storeName)}Store.error).toBeTruthy()
expect(${this.toCamelCase(storeName)}Store.hasError).toBe(true)
${expectedMessage ? `expect(${this.toCamelCase(storeName)}Store.error).toBe("${expectedMessage}")` : ''}`
  }

  /**
   * Generate then store should not have error step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateThenStoreShouldNotHaveError(match, options) {
    const [, storeName1, storeName2] = match
    const storeName = storeName1 || storeName2
    
    return `// Verify ${storeName} store does not have error
const ${this.toCamelCase(storeName)}Store = use${this.toPascalCase(storeName)}Store()
expect(${this.toCamelCase(storeName)}Store.error).toBeFalsy()
expect(${this.toCamelCase(storeName)}Store.hasError).toBe(false)`
  }

  /**
   * Convert string to camelCase
   * @param {string} str - String to convert
   * @returns {string} camelCase string
   */
  toCamelCase(str) {
    return str.replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
  }

  /**
   * Convert string to PascalCase
   * @param {string} str - String to convert
   * @returns {string} PascalCase string
   */
  toPascalCase(str) {
    const camelCase = this.toCamelCase(str)
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1)
  }

  /**
   * Parse value with proper type conversion
   * @param {string} value - Value to parse
   * @returns {string} Parsed value
   */
  parseValue(value) {
    if (value === 'true' || value === 'false') return value
    if (/^\d+$/.test(value)) return value
    if (value.startsWith('{') || value.startsWith('[')) return value
    return `"${value}"`
  }

  /**
   * Parse JSON string or return as string literal
   * @param {string} input - Input to parse
   * @returns {string} Parsed result
   */
  parseJsonOrString(input) {
    const trimmed = input.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return trimmed
    }
    return `"${trimmed}"`
  }
}

export const stateManagementStepGenerator = new StateManagementStepGenerator()