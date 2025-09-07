/**
 * Cucumber Bridge - Seamless integration with vitest-cucumber
 * Maps fluent interface steps to Gherkin step definitions
 */

import { Given, When, Then } from '@amiceli/vitest-cucumber'

/**
 * Cucumber Bridge for mapping fluent steps to Gherkin
 */
export class CucumberBridge {
  constructor() {
    this.stepMappings = new Map()
    this.scenarios = new Map()
    this.globalContext = {}
  }

  /**
   * Register a scenario for Cucumber integration
   * @param {ScenarioBuilder} scenario - Scenario to register
   */
  registerScenario(scenario) {
    this.scenarios.set(scenario.description, scenario)
    this.mapStepsToGherkin(scenario)
  }

  /**
   * Map fluent interface steps to Gherkin step definitions
   * @param {ScenarioBuilder} scenario - Scenario with steps
   * @private
   */
  mapStepsToGherkin(scenario) {
    for (const step of scenario.steps) {
      const stepKey = `${step.type}:${step.description}`
      
      if (!this.stepMappings.has(stepKey)) {
        this.createGherkinStep(step.type, step.description, step.implementation)
        this.stepMappings.set(stepKey, true)
      }
    }
  }

  /**
   * Create Gherkin step definition from fluent step
   * @param {string} type - Step type (given/when/then)
   * @param {string} description - Step description
   * @param {Function} implementation - Step implementation
   * @private
   */
  createGherkinStep(type, description, implementation) {
    // Convert fluent description to Gherkin pattern
    const pattern = this.convertToGherkinPattern(description)
    
    switch (type) {
      case 'given':
        Given(pattern, implementation)
        break
      case 'when':
        When(pattern, implementation)
        break
      case 'then':
        Then(pattern, implementation)
        break
    }
  }

  /**
   * Convert fluent description to Gherkin regex pattern
   * @param {string} description - Fluent description
   * @returns {string|RegExp} - Gherkin pattern
   * @private
   */
  convertToGherkinPattern(description) {
    // Handle parameterized descriptions
    let pattern = description
      .replace(/\{([^}]+)\}/g, '(.+)')  // {param} -> capture group
      .replace(/"/g, '"([^"]*)"')       // "value" -> capture group
      
    return new RegExp(`^${pattern}$`)
  }

  /**
   * Auto-generate step definitions from common patterns
   */
  generateCommonSteps() {
    // User authentication steps
    Given(/^user is logged out$/, async (context) => {
      context.user = { isAuthenticated: false, token: null }
    })

    Given(/^user is logged in$/, async (context) => {
      context.user = { isAuthenticated: true, token: 'mock-token', role: 'user' }
    })

    Given(/^user is logged in as "([^"]*)"$/, async (context, role) => {
      context.user = { isAuthenticated: true, token: 'mock-token', role }
    })

    // Navigation steps
    When(/^user navigates to "([^"]*)"$/, async (context, path) => {
      await context.router?.push(path)
      context.currentPath = path
    })

    When(/^user visits page "([^"]*)"$/, async (context, path) => {
      await context.router?.push(path)
      context.currentPath = path
    })

    // Form interaction steps
    When(/^user fills "([^"]*)" with "([^"]*)"$/, async (context, field, value) => {
      if (!context.formData) context.formData = {}
      context.formData[field] = value
    })

    When(/^user submits the form$/, async (context) => {
      // Implementation would submit the form
      context.formSubmitted = true
    })

    // Assertion steps
    Then(/^user should see "([^"]*)"$/, async (context, text) => {
      expect(context.pageContent).toContain(text)
    })

    Then(/^user should be redirected to "([^"]*)"$/, async (context, path) => {
      expect(context.currentPath).toBe(path)
    })

    Then(/^response status should be (\d+)$/, async (context, status) => {
      expect(context.lastResponse?.status).toBe(parseInt(status))
    })

    // API interaction steps
    When(/^user calls API "([^"]*)"$/, async (context, endpoint) => {
      const response = await context.$fetch(endpoint)
      context.lastResponse = response
    })

    When(/^user calls API "([^"]*)" with method "([^"]*)"$/, async (context, endpoint, method) => {
      const response = await context.$fetch(endpoint, { method })
      context.lastResponse = response
    })

    // Page state steps
    Then(/^page should display "([^"]*)"$/, async (context, content) => {
      expect(context.pageContent).toContain(content)
    })

    Then(/^page title should be "([^"]*)"$/, async (context, title) => {
      expect(context.pageTitle).toBe(title)
    })

    // Component interaction steps
    When(/^user clicks "([^"]*)"$/, async (context, selector) => {
      context.lastClickedElement = selector
      context.interactions = context.interactions || []
      context.interactions.push({ type: 'click', target: selector })
    })

    When(/^user types "([^"]*)" in "([^"]*)"$/, async (context, text, selector) => {
      if (!context.inputValues) context.inputValues = {}
      context.inputValues[selector] = text
    })

    // Wait and timing steps
    When(/^user waits for (\d+) seconds$/, async (context, seconds) => {
      await new Promise(resolve => setTimeout(resolve, parseInt(seconds) * 1000))
    })

    When(/^user waits for "([^"]*)" to appear$/, async (context, selector) => {
      // Implementation would wait for element
      context.waitedForElement = selector
    })
  }

  /**
   * Create step definition with parameter extraction
   * @param {string} type - Step type
   * @param {string} pattern - Gherkin pattern
   * @param {Function} handler - Step handler
   */
  defineStep(type, pattern, handler) {
    const stepFunction = type === 'given' ? Given : 
                       type === 'when' ? When : Then

    stepFunction(pattern, async function(...args) {
      // Merge global context with scenario context
      const context = { ...this.globalContext, ...this }
      
      // Call handler with context and extracted parameters
      await handler(context, ...args)
      
      // Update global context if needed
      Object.assign(this.globalContext, context)
    })
  }

  /**
   * Convert feature file to fluent scenario
   * @param {string} featureContent - Gherkin feature content
   * @returns {ScenarioBuilder[]}
   */
  parseFeatureToScenarios(featureContent) {
    const scenarios = []
    const lines = featureContent.split('\n')
    
    let currentScenario = null
    let stepType = null
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      if (trimmed.startsWith('Scenario:')) {
        const description = trimmed.replace('Scenario:', '').trim()
        const { scenario } = require('../core')
        currentScenario = scenario(description)
        scenarios.push(currentScenario)
      }
      
      if (trimmed.match(/^(Given|When|Then|And)\s/)) {
        const match = trimmed.match(/^(Given|When|Then|And)\s(.+)$/)
        if (match && currentScenario) {
          const [, keyword, stepText] = match
          stepType = keyword.toLowerCase() === 'and' ? stepType : keyword.toLowerCase()
          
          // Add step to fluent scenario
          currentScenario.addStep(stepType, stepText, this.getStepImplementation(stepText))
        }
      }
    }
    
    return scenarios
  }

  /**
   * Get step implementation from registered mappings
   * @param {string} stepText - Step text
   * @returns {Function} - Step implementation
   * @private
   */
  getStepImplementation(stepText) {
    // Find matching step implementation
    for (const [key, impl] of this.stepMappings.entries()) {
      if (key.includes(stepText) || this.matchesPattern(stepText, key)) {
        return impl
      }
    }
    
    // Return default implementation
    return async (context) => {
      console.warn(`No implementation found for step: ${stepText}`)
    }
  }

  /**
   * Check if step text matches a pattern
   * @param {string} text - Step text
   * @param {string} pattern - Pattern to match
   * @returns {boolean}
   * @private
   */
  matchesPattern(text, pattern) {
    // Simple pattern matching - could be enhanced with regex
    return pattern.toLowerCase().includes(text.toLowerCase())
  }

  /**
   * Initialize cucumber integration
   * @param {Object} options - Integration options
   */
  initialize(options = {}) {
    // Generate common step definitions
    this.generateCommonSteps()
    
    // Setup global hooks
    this.setupGlobalHooks(options)
    
    // Setup scenario hooks
    this.setupScenarioHooks(options)
  }

  /**
   * Setup global cucumber hooks
   * @param {Object} options - Hook options
   * @private
   */
  setupGlobalHooks(options) {
    // Implementation would setup BeforeAll, AfterAll hooks
  }

  /**
   * Setup scenario-level hooks
   * @param {Object} options - Hook options
   * @private
   */
  setupScenarioHooks(options) {
    // Implementation would setup Before, After hooks for each scenario
  }
}

/**
 * Global cucumber bridge instance
 */
let globalCucumberBridge = null

/**
 * Get or create global cucumber bridge
 * @param {Object} options - Bridge options
 * @returns {CucumberBridge}
 */
export function getCucumberBridge(options = {}) {
  if (!globalCucumberBridge) {
    globalCucumberBridge = new CucumberBridge()
    globalCucumberBridge.initialize(options)
  }
  return globalCucumberBridge
}

/**
 * Register fluent scenario with Cucumber
 * @param {ScenarioBuilder} scenario - Scenario to register
 */
export function registerScenario(scenario) {
  const bridge = getCucumberBridge()
  bridge.registerScenario(scenario)
}

/**
 * Parse Gherkin feature file and create fluent scenarios
 * @param {string} featureFile - Path to feature file
 * @returns {ScenarioBuilder[]}
 */
export function parseFeature(featureFile) {
  const fs = require('fs')
  const content = fs.readFileSync(featureFile, 'utf-8')
  const bridge = getCucumberBridge()
  return bridge.parseFeatureToScenarios(content)
}

/**
 * Utility function to create parameterized steps
 * @param {string} pattern - Step pattern with parameters
 * @param {Function} implementation - Step implementation
 * @returns {Object} - Step definition object
 */
export function defineParameterizedStep(pattern, implementation) {
  return {
    pattern: new RegExp(pattern.replace(/\{(\w+)\}/g, '(.+)')),
    implementation
  }
}