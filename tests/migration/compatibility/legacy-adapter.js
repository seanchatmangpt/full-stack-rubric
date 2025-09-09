/**
 * @fileoverview Compatibility layer for smooth transition to micro-framework
 * Provides backward compatibility while encouraging migration to new patterns
 */

import { quickTest, scenario, factories } from '@/tests/framework'
import { mount as originalMount, shallowMount } from '@vue/test-utils'

/**
 * Legacy compatibility wrapper for smooth migration
 */
class LegacyAdapter {
  constructor() {
    this.deprecationWarnings = new Set()
    this.migrationStats = {
      legacyCalls: 0,
      modernCalls: 0,
      patterns: new Map()
    }
  }

  /**
   * Backward compatible mount() with migration hints
   */
  mount(component, options = {}) {
    this.trackLegacyUsage('mount')
    this.showDeprecationWarning('mount', 'Use quickTest() for better performance and features')
    
    // If options suggest this could use quickTest, provide migration hint
    if (this.shouldSuggestQuickTest(options)) {
      console.warn(`💡 Migration Hint: This test could be simplified with quickTest('${component.name || 'Component'}', component, options)`)
    }
    
    // Enhance legacy mount with framework features if possible
    const enhancedOptions = this.enhanceLegacyOptions(options)
    return originalMount(component, enhancedOptions)
  }

  /**
   * Enhanced shallowMount with compatibility
   */
  shallowMount(component, options = {}) {
    this.trackLegacyUsage('shallowMount')
    this.showDeprecationWarning('shallowMount', 'Consider quickTest() with shallow option')
    
    return shallowMount(component, this.enhanceLegacyOptions(options))
  }

  /**
   * Cucumber Given/When/Then compatibility
   */
  Given(pattern, implementation) {
    this.trackLegacyUsage('cucumber-given')
    this.showDeprecationWarning('Given', 'Use fluent scenario().given API')
    
    // Store for potential auto-migration
    this.storeLegacyStep('given', pattern, implementation)
    
    // Return legacy implementation while tracking usage
    return this.createLegacyStepWrapper('given', pattern, implementation)
  }

  When(pattern, implementation) {
    this.trackLegacyUsage('cucumber-when')
    this.showDeprecationWarning('When', 'Use fluent scenario().when API')
    
    this.storeLegacyStep('when', pattern, implementation)
    return this.createLegacyStepWrapper('when', pattern, implementation)
  }

  Then(pattern, implementation) {
    this.trackLegacyUsage('cucumber-then')
    this.showDeprecationWarning('Then', 'Use fluent scenario().then API')
    
    this.storeLegacyStep('then', pattern, implementation)
    return this.createLegacyStepWrapper('then', pattern, implementation)
  }

  /**
   * Mock/stub compatibility with factory suggestions
   */
  createMockUser(overrides = {}) {
    this.trackLegacyUsage('mock-user')
    this.showDeprecationWarning('createMockUser', 'Use factories.user() for smarter test data')
    
    // Provide both legacy and modern implementations
    const legacyUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      ...overrides
    }
    
    // Suggest modern equivalent
    console.warn('💡 Modern equivalent: factories.user(', JSON.stringify(overrides, null, 2), ')')
    
    return legacyUser
  }

  /**
   * API mock compatibility
   */
  mockApiResponse(data, status = 200) {
    this.trackLegacyUsage('mock-api')
    this.showDeprecationWarning('mockApiResponse', 'Use factories.apiResponse() for smarter mocking')
    
    return {
      data,
      status,
      headers: {},
      statusText: status === 200 ? 'OK' : 'Error'
    }
  }

  /**
   * Check if legacy options suggest quickTest usage
   */
  shouldSuggestQuickTest(options) {
    return (
      !options.global || 
      !options.attachTo ||
      Object.keys(options).every(key => ['props', 'slots', 'attrs'].includes(key))
    )
  }

  /**
   * Enhance legacy options with framework features
   */
  enhanceLegacyOptions(options) {
    const enhanced = { ...options }
    
    // Add framework global components if not present
    if (!enhanced.global) {
      enhanced.global = {}
    }
    
    // Add common test utilities
    if (!enhanced.global.plugins) {
      enhanced.global.plugins = []
    }
    
    // Add performance monitoring if not disabled
    if (!enhanced.performance === false) {
      enhanced.performance = true
    }
    
    return enhanced
  }

  /**
   * Track legacy usage patterns
   */
  trackLegacyUsage(pattern) {
    this.migrationStats.legacyCalls++
    this.migrationStats.patterns.set(pattern, (this.migrationStats.patterns.get(pattern) || 0) + 1)
  }

  /**
   * Show deprecation warning (once per pattern)
   */
  showDeprecationWarning(method, suggestion) {
    const key = `${method}-deprecation`
    if (!this.deprecationWarnings.has(key)) {
      console.warn(`⚠️  DEPRECATED: ${method}() is deprecated. ${suggestion}`)
      this.deprecationWarnings.add(key)
    }
  }

  /**
   * Store legacy step for potential migration
   */
  storeLegacyStep(type, pattern, implementation) {
    if (typeof window !== 'undefined') {
      window.__legacySteps = window.__legacySteps || []
      window.__legacySteps.push({ type, pattern, implementation })
    }
  }

  /**
   * Create wrapper for legacy step definitions
   */
  createLegacyStepWrapper(type, pattern, implementation) {
    return function(...args) {
      // Track usage
      console.log(`📊 Legacy step executed: ${type} "${pattern}"`)
      
      // Execute original implementation
      return implementation.apply(this, args)
    }
  }

  /**
   * Generate migration suggestions based on usage
   */
  generateMigrationSuggestions() {
    const suggestions = []
    
    this.migrationStats.patterns.forEach((count, pattern) => {
      switch (pattern) {
        case 'mount':
          if (count > 5) {
            suggestions.push({
              pattern: 'mount() calls',
              count,
              suggestion: 'Batch migrate to quickTest() using the codemod',
              priority: 'high',
              automation: 'Available via TestFrameworkMigrator'
            })
          }
          break
          
        case 'cucumber-given':
        case 'cucumber-when':  
        case 'cucumber-then':
          suggestions.push({
            pattern: 'Cucumber step definitions',
            count,
            suggestion: 'Migrate to fluent BDD scenario() API',
            priority: 'medium',
            automation: 'Partial automation available'
          })
          break
          
        case 'mock-user':
        case 'mock-api':
          suggestions.push({
            pattern: 'Manual mocking',
            count,
            suggestion: 'Replace with smart factories',
            priority: 'low',
            automation: 'Pattern detection available'
          })
          break
      }
    })
    
    return suggestions
  }

  /**
   * Generate compatibility report
   */
  generateCompatibilityReport() {
    return {
      usage: {
        legacyCalls: this.migrationStats.legacyCalls,
        modernCalls: this.migrationStats.modernCalls,
        ratio: this.migrationStats.legacyCalls / (this.migrationStats.modernCalls || 1)
      },
      patterns: Object.fromEntries(this.migrationStats.patterns),
      suggestions: this.generateMigrationSuggestions(),
      deprecationWarnings: Array.from(this.deprecationWarnings),
      readinessScore: this.calculateReadinessScore()
    }
  }

  /**
   * Calculate migration readiness score
   */
  calculateReadinessScore() {
    const totalCalls = this.migrationStats.legacyCalls + this.migrationStats.modernCalls
    if (totalCalls === 0) return 100
    
    const modernRatio = this.migrationStats.modernCalls / totalCalls
    return Math.round(modernRatio * 100)
  }

  /**
   * Auto-migrate legacy steps to fluent BDD
   */
  suggestFluentMigration() {
    if (typeof window !== 'undefined' && window.__legacySteps) {
      const steps = window.__legacySteps
      const fluentCode = this.generateFluentCode(steps)
      
      console.log('💡 Suggested fluent BDD migration:')
      console.log(fluentCode)
      
      return fluentCode
    }
    
    return null
  }

  /**
   * Generate fluent BDD code from legacy steps
   */
  generateFluentCode(steps) {
    const scenarios = this.groupStepsIntoScenarios(steps)
    
    return scenarios.map(scenario => {
      const chainCalls = scenario.steps.map((step, index) => {
        const method = index === 0 ? step.type : 'and'
        const fluentMethod = this.convertToFluentMethod(step.type, step.pattern)
        return `  .${method}.${fluentMethod}`
      }).join('\n')
      
      return `await scenario('${scenario.name}')\n${chainCalls}\n  .execute()`
    }).join('\n\n')
  }

  /**
   * Group legacy steps into logical scenarios
   */
  groupStepsIntoScenarios(steps) {
    // Simple grouping by Given/When/Then sequence
    const scenarios = []
    let currentScenario = null
    
    steps.forEach(step => {
      if (step.type === 'given' || !currentScenario) {
        currentScenario = {
          name: this.extractScenarioName(step.pattern),
          steps: []
        }
        scenarios.push(currentScenario)
      }
      currentScenario.steps.push(step)
    })
    
    return scenarios
  }

  /**
   * Extract scenario name from step pattern
   */
  extractScenarioName(pattern) {
    const match = pattern.match(/^(.*?)\s+(is|are|should|will)/i)
    return match ? match[1] : 'Test Scenario'
  }

  /**
   * Convert legacy pattern to fluent method
   */
  convertToFluentMethod(type, pattern) {
    // Simplified conversion - real implementation would be more sophisticated
    const patterns = {
      given: 'user.is',
      when: 'user.clicks', 
      then: 'page.shouldDisplay'
    }
    
    return patterns[type] || 'custom.action'
  }
}

// Create global compatibility instance
const legacyAdapter = new LegacyAdapter()

// Export compatibility functions
export const mount = legacyAdapter.mount.bind(legacyAdapter)
export const shallowMount = legacyAdapter.shallowMount.bind(legacyAdapter)
export const Given = legacyAdapter.Given.bind(legacyAdapter)
export const When = legacyAdapter.When.bind(legacyAdapter)
export const Then = legacyAdapter.Then.bind(legacyAdapter)
export const createMockUser = legacyAdapter.createMockUser.bind(legacyAdapter)
export const mockApiResponse = legacyAdapter.mockApiResponse.bind(legacyAdapter)

// Migration utilities
export const generateMigrationSuggestions = () => legacyAdapter.generateMigrationSuggestions()
export const generateCompatibilityReport = () => legacyAdapter.generateCompatibilityReport()
export const suggestFluentMigration = () => legacyAdapter.suggestFluentMigration()

export default legacyAdapter