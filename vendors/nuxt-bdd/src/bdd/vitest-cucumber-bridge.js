/**
 * @fileoverview Enhanced vitest-cucumber integration bridge
 * @description Provides enhanced utilities and patterns for BDD testing with @amiceli/vitest-cucumber
 * without fluent patterns, focusing on standard Gherkin compliance and declarative patterns.
 */

import { mount } from '@vue/test-utils'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { Given, When, Then, Before, After } from '@amiceli/vitest-cucumber'
import { nextTick } from 'vue'

/**
 * @typedef {Object} BDDContext
 * @property {import('@vue/test-utils').VueWrapper|null} wrapper - Vue test wrapper
 * @property {Object} state - Test state container
 * @property {Object} mocks - Mock functions container
 * @property {Object} performance - Performance metrics container
 */

/**
 * @typedef {Object} StepDefinitionConfig
 * @property {string} pattern - Gherkin pattern regex
 * @property {Function} handler - Step handler function
 * @property {string} type - Step type (given|when|then)
 * @property {string} description - Step description
 */

/**
 * @typedef {Object} ComponentMountConfig
 * @property {Object} component - Vue component to mount
 * @property {Object} props - Component props
 * @property {Object} stubs - Component stubs
 * @property {Object} global - Global test configuration
 */

/**
 * Global BDD context for sharing state across steps
 * @type {BDDContext}
 */
export const bddContext = {
  wrapper: null,
  state: {},
  mocks: {},
  performance: {}
}

/**
 * Registry for step definitions
 * @type {Map<string, StepDefinitionConfig>}
 */
const stepRegistry = new Map()

/**
 * Performance metrics tracker
 * @type {Object}
 */
const performanceTracker = {
  metrics: {},
  startTime: null,
  memoryBaseline: null
}

/**
 * Enhanced BDD bridge with utilities for vitest-cucumber integration
 */
export class VitestCucumberBridge {
  /**
   * Initialize BDD bridge with configuration
   * @param {Object} config - Bridge configuration
   * @param {boolean} config.autoCleanup - Auto cleanup after tests
   * @param {boolean} config.performanceTracking - Enable performance tracking
   * @param {Object} config.mockDefaults - Default mock configurations
   */
  constructor(config = {}) {
    this.config = {
      autoCleanup: true,
      performanceTracking: false,
      mockDefaults: {},
      ...config
    }
    
    this.setupHooks()
  }

  /**
   * Setup global test hooks for cleanup and initialization
   * @private
   */
  setupHooks() {
    if (this.config.autoCleanup) {
      afterEach(() => {
        this.cleanup()
      })
    }

    if (this.config.performanceTracking) {
      beforeEach(() => {
        this.initializePerformanceTracking()
      })
    }
  }

  /**
   * Initialize performance tracking
   * @private
   */
  initializePerformanceTracking() {
    performanceTracker.startTime = performance.now()
    performanceTracker.memoryBaseline = performance.memory?.usedJSHeapSize || 0
    performanceTracker.metrics = {
      renderTimes: [],
      inputLatency: [],
      memoryUsage: []
    }
  }

  /**
   * Clean up test environment
   * @private
   */
  cleanup() {
    if (bddContext.wrapper) {
      bddContext.wrapper.unmount()
      bddContext.wrapper = null
    }
    
    bddContext.state = {}
    bddContext.mocks = {}
    bddContext.performance = {}
  }

  /**
   * Register a step definition with the bridge
   * @param {string} type - Step type (given|when|then)
   * @param {string} pattern - Gherkin pattern
   * @param {Function} handler - Step handler function
   * @param {Object} options - Additional options
   */
  registerStep(type, pattern, handler, options = {}) {
    const stepDef = {
      pattern,
      handler,
      type: type.toLowerCase(),
      description: options.description || pattern,
      ...options
    }

    stepRegistry.set(`${type}:${pattern}`, stepDef)

    // Register with vitest-cucumber
    switch (type.toLowerCase()) {
      case 'given':
        Given(pattern, handler)
        break
      case 'when':
        When(pattern, handler)
        break
      case 'then':
        Then(pattern, handler)
        break
      default:
        throw new Error(`Invalid step type: ${type}`)
    }
  }

  /**
   * Create enhanced Vue component mount with BDD context integration
   * @param {ComponentMountConfig} config - Mount configuration
   * @returns {Promise<import('@vue/test-utils').VueWrapper>} Mounted wrapper
   */
  async mountComponent(config) {
    const { component, props = {}, stubs = {}, global = {} } = config
    
    const defaultStubs = {
      MonacoEditor: {
        template: '<textarea v-model="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" class="w-full h-full p-4" />',
        props: ['modelValue', 'lang', 'options'],
        emits: ['update:modelValue']
      },
      UButton: { 
        template: '<button @click="$emit(\'click\')" v-bind="$attrs"><slot /></button>' 
      },
      UBadge: { 
        template: '<span class="badge" v-bind="$attrs"><slot /></span>' 
      },
      UModal: { 
        template: '<div v-if="modelValue" class="modal"><slot /></div>',
        props: ['modelValue'],
        emits: ['update:modelValue']
      },
      UCard: { 
        template: '<div class="card"><slot name="header" /><slot /><slot name="footer" /></div>'
      },
      ...this.config.mockDefaults,
      ...stubs
    }

    const mountConfig = {
      props,
      global: {
        stubs: defaultStubs,
        ...global
      }
    }

    const startTime = performance.now()
    bddContext.wrapper = mount(component, mountConfig)
    
    await nextTick()
    
    const loadTime = performance.now() - startTime
    if (this.config.performanceTracking) {
      performanceTracker.metrics.renderTimes.push(loadTime)
    }

    return bddContext.wrapper
  }

  /**
   * Get current performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...performanceTracker.metrics,
      currentMemory: performance.memory?.usedJSHeapSize || 0,
      memoryDiff: (performance.memory?.usedJSHeapSize || 0) - performanceTracker.memoryBaseline,
      totalTime: performance.now() - performanceTracker.startTime
    }
  }

  /**
   * Track memory usage with label
   * @param {string} label - Memory usage label
   */
  trackMemory(label) {
    if (!this.config.performanceTracking) return
    
    const memoryUsage = performance.memory?.usedJSHeapSize || 0
    performanceTracker.metrics.memoryUsage.push({
      label,
      usage: memoryUsage,
      timestamp: performance.now(),
      diff: memoryUsage - performanceTracker.memoryBaseline
    })
  }

  /**
   * Get all registered steps
   * @returns {Map<string, StepDefinitionConfig>} Step registry
   */
  getStepRegistry() {
    return new Map(stepRegistry)
  }

  /**
   * Validate that all steps in a feature file have corresponding definitions
   * @param {string} featureContent - Feature file content
   * @returns {Object} Validation result
   */
  validateFeatureSteps(featureContent) {
    const steps = this.extractStepsFromFeature(featureContent)
    const missing = []
    const found = []

    for (const step of steps) {
      const registered = Array.from(stepRegistry.values())
        .find(def => new RegExp(def.pattern).test(step.text))
      
      if (registered) {
        found.push({ step, definition: registered })
      } else {
        missing.push(step)
      }
    }

    return {
      isValid: missing.length === 0,
      missing,
      found,
      totalSteps: steps.length
    }
  }

  /**
   * Extract step definitions from feature file content
   * @param {string} featureContent - Feature file content
   * @returns {Array<Object>} Extracted steps
   */
  extractStepsFromFeature(featureContent) {
    const steps = []
    const lines = featureContent.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      const stepMatch = line.match(/^\s*(Given|When|Then|And|But)\s+(.+)$/)
      
      if (stepMatch) {
        steps.push({
          type: stepMatch[1],
          text: stepMatch[2],
          line: i + 1,
          originalLine: line
        })
      }
    }
    
    return steps
  }

  /**
   * Generate step definition template from feature file
   * @param {string} featureContent - Feature file content
   * @returns {string} Generated step definitions
   */
  generateStepDefinitions(featureContent) {
    const validation = this.validateFeatureSteps(featureContent)
    const templates = []

    for (const step of validation.missing) {
      const template = this.generateStepTemplate(step)
      templates.push(template)
    }

    return templates.join('\n\n')
  }

  /**
   * Generate individual step definition template
   * @param {Object} step - Step information
   * @returns {string} Step template
   */
  generateStepTemplate(step) {
    const { type, text } = step
    const parameterizedText = this.parameterizeStep(text)
    const functionName = this.generateFunctionName(text)
    
    return `/**
 * @description ${text}
 * @${type.toLowerCase()} ${parameterizedText}
 */
${type}('${parameterizedText}', ${functionName})

async function ${functionName}(${this.extractParameters(parameterizedText).join(', ')}) {
  // Implementation needed
  throw new Error('Step definition not implemented: ${text}')
}`
  }

  /**
   * Convert step text to parameterized version
   * @param {string} text - Step text
   * @returns {string} Parameterized text
   */
  parameterizeStep(text) {
    return text
      .replace(/\d+/g, '{int}')
      .replace(/\d+\.\d+/g, '{float}')
      .replace(/"([^"]+)"/g, '{string}')
      .replace(/'([^']+)'/g, '{string}')
  }

  /**
   * Extract parameter names from parameterized step
   * @param {string} parameterizedText - Parameterized step text
   * @returns {Array<string>} Parameter names
   */
  extractParameters(parameterizedText) {
    const params = []
    const matches = parameterizedText.matchAll(/\{(int|float|string)\}/g)
    
    let intCount = 0
    let floatCount = 0
    let stringCount = 0
    
    for (const match of matches) {
      switch (match[1]) {
        case 'int':
          params.push(`int${intCount > 0 ? intCount + 1 : ''}`)
          intCount++
          break
        case 'float':
          params.push(`float${floatCount > 0 ? floatCount + 1 : ''}`)
          floatCount++
          break
        case 'string':
          params.push(`string${stringCount > 0 ? stringCount + 1 : ''}`)
          stringCount++
          break
      }
    }
    
    return params
  }

  /**
   * Generate function name from step text
   * @param {string} text - Step text
   * @returns {string} Function name
   */
  generateFunctionName(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 50)
  }
}

/**
 * Default BDD bridge instance
 */
export const bddBridge = new VitestCucumberBridge()

/**
 * Convenience function to register Given steps
 * @param {string} pattern - Gherkin pattern
 * @param {Function} handler - Step handler
 * @param {Object} options - Additional options
 */
export function registerGiven(pattern, handler, options = {}) {
  bddBridge.registerStep('given', pattern, handler, options)
}

/**
 * Convenience function to register When steps
 * @param {string} pattern - Gherkin pattern  
 * @param {Function} handler - Step handler
 * @param {Object} options - Additional options
 */
export function registerWhen(pattern, handler, options = {}) {
  bddBridge.registerStep('when', pattern, handler, options)
}

/**
 * Convenience function to register Then steps
 * @param {string} pattern - Gherkin pattern
 * @param {Function} handler - Step handler
 * @param {Object} options - Additional options
 */
export function registerThen(pattern, handler, options = {}) {
  bddBridge.registerStep('then', pattern, handler, options)
}

/**
 * Helper function to mount Vue components with BDD context
 * @param {Object} component - Vue component
 * @param {Object} options - Mount options
 * @returns {Promise<import('@vue/test-utils').VueWrapper>} Mounted wrapper
 */
export async function mountWithBDD(component, options = {}) {
  return bddBridge.mountComponent({ component, ...options })
}

/**
 * Helper function to get current BDD context
 * @returns {BDDContext} Current context
 */
export function getBDDContext() {
  return bddContext
}

/**
 * Helper function to set BDD context state
 * @param {string} key - State key
 * @param {*} value - State value
 */
export function setBDDState(key, value) {
  bddContext.state[key] = value
}

/**
 * Helper function to get BDD context state
 * @param {string} key - State key
 * @returns {*} State value
 */
export function getBDDState(key) {
  return bddContext.state[key]
}

export default bddBridge