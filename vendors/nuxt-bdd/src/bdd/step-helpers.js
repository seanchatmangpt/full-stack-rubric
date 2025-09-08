/**
 * @fileoverview Standard Gherkin step definition helpers
 * @description Provides common step definition patterns and utilities extracted from successful BDD tests.
 * Focuses on standard Gherkin compliance with declarative patterns, no fluent chains.
 */

import { nextTick } from 'vue'
import { expect } from 'vitest'
import { bddContext, setBDDState, getBDDState } from './vitest-cucumber-bridge.js'

/**
 * @typedef {Object} StepHelperConfig
 * @property {boolean} trackPerformance - Track performance metrics
 * @property {boolean} autoAssert - Automatically assert expectations
 * @property {Object} defaults - Default values for steps
 */

/**
 * Standard step helpers for common BDD patterns
 */
export class StepHelpers {
  /**
   * Initialize step helpers with configuration
   * @param {StepHelperConfig} config - Helper configuration
   */
  constructor(config = {}) {
    this.config = {
      trackPerformance: false,
      autoAssert: true,
      defaults: {},
      ...config
    }
  }

  /**
   * Navigation and page state helpers
   */
  navigation = {
    /**
     * Navigate to a page and verify component mount
     * @param {string} pageName - Page identifier
     * @param {import('@vue/test-utils').VueWrapper} wrapper - Component wrapper
     */
    async navigateToPage(pageName, wrapper) {
      setBDDState('currentPage', pageName)
      setBDDState('navigationTime', performance.now())
      
      await nextTick()
      if (this.config.autoAssert) {
        expect(wrapper.exists()).toBe(true)
      }
      
      return wrapper
    },

    /**
     * Verify page elements are visible
     * @param {Array<string>} selectors - CSS selectors to check
     * @param {import('@vue/test-utils').VueWrapper} wrapper - Component wrapper
     */
    verifyElementsVisible(selectors, wrapper) {
      const visible = []
      const missing = []
      
      for (const selector of selectors) {
        const element = wrapper.find(selector)
        if (element.exists()) {
          visible.push(selector)
        } else {
          missing.push(selector)
        }
      }
      
      setBDDState('visibleElements', visible)
      setBDDState('missingElements', missing)
      
      if (this.config.autoAssert && missing.length > 0) {
        expect(missing).toEqual([])
      }
      
      return { visible, missing }
    },

    /**
     * Verify initial state display
     * @param {Object} expectedState - Expected state values
     * @param {import('@vue/test-utils').VueWrapper} wrapper - Component wrapper
     */
    verifyInitialState(expectedState, wrapper) {
      const actualState = {}
      const mismatches = []
      
      for (const [key, expectedValue] of Object.entries(expectedState)) {
        const actualValue = wrapper.vm[key]
        actualState[key] = actualValue
        
        if (actualValue !== expectedValue) {
          mismatches.push({ key, expected: expectedValue, actual: actualValue })
        }
      }
      
      setBDDState('initialState', actualState)
      setBDDState('stateMismatches', mismatches)
      
      if (this.config.autoAssert) {
        expect(mismatches).toEqual([])
      }
      
      return { actualState, mismatches }
    }
  }

  /**
   * User interaction helpers
   */
  interactions = {
    /**
     * Simulate text input with timing control
     * @param {string} text - Text to input
     * @param {Object} options - Input options
     * @param {number} options.delayBetweenKeys - Delay between keystrokes
     * @param {number} options.errorsToMake - Number of errors to introduce
     * @param {import('@vue/test-utils').VueWrapper} wrapper - Component wrapper
     */
    async inputText(text, options = {}, wrapper) {
      const { delayBetweenKeys = 100, errorsToMake = 0 } = options
      const textarea = wrapper.find('textarea, input[type="text"]')
      
      if (!textarea.exists()) {
        throw new Error('Text input element not found')
      }

      let currentText = ''
      const errors = []
      
      // Randomly select positions for errors
      if (errorsToMake > 0) {
        const errorPositions = new Set()
        while (errorPositions.size < errorsToMake) {
          errorPositions.add(Math.floor(Math.random() * text.length))
        }
        errors.push(...errorPositions)
      }

      setBDDState('inputStartTime', performance.now())

      for (let i = 0; i < text.length; i++) {
        // Add error if this position should have one
        if (errors.includes(i)) {
          const wrongChar = String.fromCharCode(text.charCodeAt(i) + 1)
          currentText += wrongChar
          textarea.setValue(currentText)
          await nextTick()
          
          // Simulate backspace to correct
          await nextTick()
          currentText = currentText.slice(0, -1)
          textarea.setValue(currentText)
        }

        // Add correct character
        currentText += text[i]
        textarea.setValue(currentText)
        await textarea.trigger('input')
        await nextTick()
      }

      setBDDState('inputEndTime', performance.now())
      setBDDState('inputText', currentText)
      setBDDState('inputErrors', errorsToMake)

      return {
        finalText: currentText,
        errorsIntroduced: errorsToMake
      }
    },

    /**
     * Simulate rapid typing for performance testing
     * @param {string} text - Text to type rapidly
     * @param {number} intervalMs - Interval between keystrokes
     * @param {import('@vue/test-utils').VueWrapper} wrapper - Component wrapper
     */
    async rapidType(text, intervalMs = 10, wrapper) {
      const textarea = wrapper.find('textarea, input[type="text"]')
      
      if (!textarea.exists()) {
        throw new Error('Text input element not found')
      }

      let currentText = ''
      const startTime = performance.now()
      
      for (const char of text) {
        currentText += char
        textarea.setValue(currentText)
        await textarea.trigger('input')
        await nextTick()
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      setBDDState('rapidTypingTime', totalTime)
      setBDDState('rapidTypingSpeed', text.length / (totalTime / 1000))
      
      return {
        finalText: currentText,
        totalTime,
        charactersPerSecond: text.length / (totalTime / 1000)
      }
    },

    /**
     * Simulate backspace corrections
     * @param {number} backspaces - Number of backspaces
     * @param {number} delayMs - Delay between backspaces
     * @param {import('@vue/test-utils').VueWrapper} wrapper - Component wrapper
     */
    async simulateCorrections(backspaces, delayMs = 50, wrapper) {
      const textarea = wrapper.find('textarea, input[type="text"]')
      
      if (!textarea.exists()) {
        throw new Error('Text input element not found')
      }

      let currentText = textarea.element.value
      const startTime = performance.now()
      
      for (let i = 0; i < backspaces; i++) {
        currentText = currentText.slice(0, -1)
        textarea.setValue(currentText)
        await textarea.trigger('input')
        await nextTick()
      }
      
      const endTime = performance.now()
      
      setBDDState('correctionTime', endTime - startTime)
      setBDDState('correctionsApplied', backspaces)
      
      return {
        finalText: currentText,
        backspacesApplied: backspaces,
        totalTime: endTime - startTime
      }
    },

    /**
     * Click element by text content
     * @param {string} buttonText - Text content to find
     * @param {import('@vue/test-utils').VueWrapper} wrapper - Component wrapper
     */
    async clickByText(buttonText, wrapper) {
      const buttons = wrapper.findAll('button, a, [role="button"]')
      const targetElement = buttons.find(element => 
        element.text().includes(buttonText) || 
        element.attributes('aria-label')?.includes(buttonText)
      )
      
      if (!targetElement) {
        throw new Error(`Element with text "${buttonText}" not found`)
      }
      
      await targetElement.trigger('click')
      await nextTick()
      
      setBDDState('lastClickedElement', buttonText)
      setBDDState('clickTime', performance.now())
      
      return targetElement
    }
  }

  /**
   * Assertion and verification helpers
   */
  assertions = {
    /**
     * Verify visual highlighting patterns
     * @param {Object} expectations - Expected highlighting
     * @param {Array<string>} expectations.correct - Selectors for correct elements
     * @param {Array<string>} expectations.incorrect - Selectors for incorrect elements
     * @param {Array<string>} expectations.current - Selectors for current position
     * @param {import('@vue/test-utils').VueWrapper} wrapper - Component wrapper
     */
    verifyHighlighting(expectations, wrapper) {
      const results = {}
      
      if (expectations.correct) {
        results.correctElements = wrapper.findAll(expectations.correct.join(', '))
        if (this.config.autoAssert) {
          expect(results.correctElements.length).toBeGreaterThan(0)
        }
      }
      
      if (expectations.incorrect) {
        results.incorrectElements = wrapper.findAll(expectations.incorrect.join(', '))
        if (this.config.autoAssert) {
          expect(results.incorrectElements.length).toBeGreaterThan(0)
        }
      }
      
      if (expectations.current) {
        results.currentElements = wrapper.findAll(expectations.current.join(', '))
        if (this.config.autoAssert) {
          expect(results.currentElements.length).toBeGreaterThan(0)
        }
      }
      
      setBDDState('highlightingResults', results)
      return results
    },

    /**
     * Verify metric calculations
     * @param {Object} expectedMetrics - Expected metric values
     * @param {import('@vue/test-utils').VueWrapper} wrapper - Component wrapper
     */
    verifyMetrics(expectedMetrics, wrapper) {
      const actualMetrics = {}
      const mismatches = []
      
      for (const [metric, expectedValue] of Object.entries(expectedMetrics)) {
        const actualValue = wrapper.vm[metric]
        actualMetrics[metric] = actualValue
        
        if (typeof expectedValue === 'number') {
          // For numeric values, allow small tolerance
          const tolerance = expectedValue * 0.1 // 10% tolerance
          if (Math.abs(actualValue - expectedValue) > tolerance) {
            mismatches.push({ 
              metric, 
              expected: expectedValue, 
              actual: actualValue,
              tolerance 
            })
          }
        } else if (actualValue !== expectedValue) {
          mismatches.push({ metric, expected: expectedValue, actual: actualValue })
        }
      }
      
      setBDDState('metricResults', { actualMetrics, mismatches })
      
      if (this.config.autoAssert && mismatches.length > 0) {
        throw new Error(`Metric mismatches: ${JSON.stringify(mismatches, null, 2)}`)
      }
      
      return { actualMetrics, mismatches }
    },

    /**
     * Verify progress indicators
     * @param {number} expectedProgress - Expected progress percentage
     * @param {Object} options - Verification options
     * @param {number} options.tolerance - Allowed tolerance
     * @param {import('@vue/test-utils').VueWrapper} wrapper - Component wrapper
     */
    verifyProgress(expectedProgress, options = {}, wrapper) {
      const { tolerance = 1 } = options
      const actualProgress = wrapper.vm.progress
      
      const isWithinTolerance = Math.abs(actualProgress - expectedProgress) <= tolerance
      
      setBDDState('progressCheck', {
        expected: expectedProgress,
        actual: actualProgress,
        tolerance,
        isValid: isWithinTolerance
      })
      
      if (this.config.autoAssert) {
        expect(actualProgress).toBeCloseTo(expectedProgress, tolerance)
      }
      
      return {
        expected: expectedProgress,
        actual: actualProgress,
        isValid: isWithinTolerance
      }
    },

    /**
     * Verify modal or dialog display
     * @param {Object} modalExpectations - Expected modal properties
     * @param {boolean} modalExpectations.visible - Should be visible
     * @param {Array<string>} modalExpectations.containsText - Text that should be present
     * @param {Array<string>} modalExpectations.hasButtons - Buttons that should be present
     * @param {import('@vue/test-utils').VueWrapper} wrapper - Component wrapper
     */
    verifyModal(modalExpectations, wrapper) {
      const modal = wrapper.find('.modal, [role="dialog"]')
      const results = {
        exists: modal.exists(),
        visible: modal.exists() && !modal.classes('hidden'),
        text: modal.exists() ? modal.text() : '',
        buttons: []
      }
      
      if (modal.exists()) {
        const buttons = modal.findAll('button')
        results.buttons = buttons.map(btn => btn.text())
      }
      
      if (this.config.autoAssert) {
        if (modalExpectations.visible !== undefined) {
          expect(results.visible).toBe(modalExpectations.visible)
        }
        
        if (modalExpectations.containsText) {
          for (const text of modalExpectations.containsText) {
            expect(results.text).toContain(text)
          }
        }
        
        if (modalExpectations.hasButtons) {
          for (const buttonText of modalExpectations.hasButtons) {
            expect(results.buttons.some(btn => btn.includes(buttonText))).toBe(true)
          }
        }
      }
      
      setBDDState('modalResults', results)
      return results
    }
  }

  /**
   * Performance testing helpers
   */
  performance = {
    /**
     * Measure response time for operations
     * @param {Function} operation - Operation to measure
     * @param {Object} expectations - Performance expectations
     * @param {number} expectations.maxTime - Maximum allowed time in ms
     */
    async measureResponseTime(operation, expectations = {}) {
      const startTime = performance.now()
      const result = await operation()
      const endTime = performance.now()
      const duration = endTime - startTime
      
      setBDDState('lastOperationTime', duration)
      
      if (expectations.maxTime && this.config.autoAssert) {
        expect(duration).toBeLessThan(expectations.maxTime)
      }
      
      return { result, duration }
    },

    /**
     * Track memory usage during operation
     * @param {Function} operation - Operation to track
     * @param {Object} expectations - Memory expectations
     * @param {number} expectations.maxIncrease - Max memory increase in bytes
     */
    async trackMemoryUsage(operation, expectations = {}) {
      const initialMemory = performance.memory?.usedJSHeapSize || 0
      
      const result = await operation()
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory
      
      setBDDState('memoryTracking', {
        initial: initialMemory,
        final: finalMemory,
        increase: memoryIncrease
      })
      
      if (expectations.maxIncrease && this.config.autoAssert) {
        expect(memoryIncrease).toBeLessThan(expectations.maxIncrease)
      }
      
      return { result, memoryIncrease }
    },

    /**
     * Verify application responsiveness
     * @param {import('@vue/test-utils').VueWrapper} wrapper - Component wrapper
     */
    verifyResponsiveness(wrapper) {
      const checks = {
        componentMounted: wrapper.exists(),
        hasMetrics: wrapper.vm.wpm !== undefined,
        metricsValid: wrapper.vm.wpm >= 0,
        accuracyValid: wrapper.vm.accuracy >= 0 && wrapper.vm.accuracy <= 100
      }
      
      const isResponsive = Object.values(checks).every(check => check === true)
      
      setBDDState('responsivenessCheck', { checks, isResponsive })
      
      if (this.config.autoAssert) {
        expect(isResponsive).toBe(true)
      }
      
      return { checks, isResponsive }
    }
  }

  /**
   * State management helpers
   */
  state = {
    /**
     * Setup test exercise with custom configuration
     * @param {Object} exerciseConfig - Exercise configuration
     * @param {string} exerciseConfig.title - Exercise title
     * @param {string} exerciseConfig.code - Exercise code content
     * @param {string} exerciseConfig.language - Programming language
     * @param {import('@vue/test-utils').VueWrapper} wrapper - Component wrapper
     */
    async setupExercise(exerciseConfig, wrapper) {
      const defaultExercise = {
        title: 'Test Exercise',
        description: 'Test description',
        difficulty: 'easy',
        category: 'test',
        language: 'javascript',
        ...exerciseConfig
      }
      
      wrapper.vm.currentExercise = defaultExercise
      await nextTick()
      
      setBDDState('currentExercise', defaultExercise)
      return defaultExercise
    },

    /**
     * Reset component state to initial values
     * @param {import('@vue/test-utils').VueWrapper} wrapper - Component wrapper
     */
    async resetState(wrapper) {
      const initialState = {
        userInput: '',
        wpm: 0,
        accuracy: 100,
        errors: 0,
        progress: 0,
        isComplete: false
      }
      
      Object.assign(wrapper.vm, initialState)
      await nextTick()
      
      setBDDState('stateReset', true)
      setBDDState('resetTime', performance.now())
      
      return initialState
    }
  }
}

/**
 * Default step helpers instance
 */
export const stepHelpers = new StepHelpers()

/**
 * Common step definition patterns
 */
export const commonSteps = {
  /**
   * Standard navigation step
   * @param {string} pageName - Page name
   */
  navigateToPage: (pageName) => `I am on the ${pageName} page`,
  
  /**
   * Standard visibility check step
   * @param {string} element - Element description
   */
  canSeeElement: (element) => `I can see the ${element}`,
  
  /**
   * Standard interaction step
   * @param {string} action - Action to perform
   * @param {string} target - Target element
   */
  performAction: (action, target) => `I ${action} ${target}`,
  
  /**
   * Standard verification step
   * @param {string} expected - Expected outcome
   */
  shouldSee: (expected) => `I should see ${expected}`,
  
  /**
   * Standard metric verification step
   * @param {string} metric - Metric name
   * @param {number} value - Expected value
   */
  metricShouldBe: (metric, value) => `the ${metric} should be ${value}`,
  
  /**
   * Standard performance step
   * @param {string} condition - Performance condition
   */
  performanceCheck: (condition) => `${condition} should occur`
}

export default stepHelpers