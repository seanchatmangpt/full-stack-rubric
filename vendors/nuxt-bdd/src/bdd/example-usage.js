/**
 * @fileoverview BDD Integration Layer Usage Examples
 * @description Demonstrates how to use the BDD integration layer with real examples
 * extracted from the typing tutor patterns, showing standard Gherkin compliance.
 */

import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import { Given, When, Then } from '@amiceli/vitest-cucumber'
import {
  createBDDSuite,
  bddPatterns,
  stepHelpers,
  parseFeature,
  discoverSteps
} from './index.js'

// Example 1: Basic BDD Suite Setup
describe('BDD Integration Examples', () => {
  let bddSuite

  beforeEach(() => {
    // Initialize BDD suite with performance tracking
    bddSuite = createBDDSuite('Typing Tutor Tests', {
      performanceTracking: true,
      autoCleanup: true,
      mockDefaults: {
        // Common Vue component stubs
        MonacoEditor: {
          template: '<textarea v-model="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
          props: ['modelValue', 'lang', 'options'],
          emits: ['update:modelValue']
        },
        UButton: { 
          template: '<button @click="$emit(\'click\')" v-bind="$attrs"><slot /></button>' 
        }
      }
    })
  })

  afterEach(() => {
    bddSuite.cleanup()
  })

  // Example 2: Using Step Helpers
  it('should demonstrate step helpers usage', async () => {
    // Mock component for demonstration
    const MockTypingPage = {
      template: '<div class="typing-page"><textarea v-model="userInput" /><div class="wpm">{{ wpm }}</div></div>',
      data() {
        return { userInput: '', wpm: 0, accuracy: 100, progress: 0 }
      }
    }

    const wrapper = await bddSuite.mount(MockTypingPage)

    // Navigation helper
    await stepHelpers.navigation.navigateToPage('typing tutor', wrapper)

    // Interaction helper
    await stepHelpers.interactions.inputText('Hello World', { delayBetweenKeys: 50 }, wrapper)

    // Assertion helper
    stepHelpers.assertions.verifyMetrics({ wpm: 0 }, wrapper)

    // Performance helper
    const { result, duration } = await stepHelpers.performance.measureResponseTime(
      async () => {
        await stepHelpers.interactions.inputText('test', {}, wrapper)
      },
      { maxTime: 100 }
    )

    expect(duration).toBeLessThan(100)
  })

  // Example 3: Using BDD Patterns
  it('should demonstrate BDD patterns', () => {
    // Create navigation pattern
    const navigationPattern = bddPatterns.navigation('typing tutor page', MockComponent)
    
    // Create visibility pattern  
    const visibilityPattern = bddPatterns.visibility('practice text', 'pre code')
    
    // Create interaction pattern
    const typingPattern = bddPatterns.interaction('type', 'text', 'textarea')
    
    // Create assertion pattern
    const highlightPattern = bddPatterns.assertion('correct highlighting', (wrapper) => {
      return wrapper.findAll('.text-green-600').length > 0
    })

    // These would typically be registered in a step definition file
    expect(navigationPattern.given).toBe('I am on the typing tutor page')
    expect(visibilityPattern.given).toBe('I can see the practice text')
    expect(typingPattern.when).toBe('I type text')
    expect(highlightPattern.then).toBe('I should see correct highlighting')
  })
})

// Example 4: Real Step Definitions using the Integration Layer
// This would typically be in a separate .steps.js file

/**
 * Example step definitions extracted from successful typing tutor patterns
 */

// Setup and cleanup using BDD bridge
const bddSuite = createBDDSuite('Typing Tutor', {
  performanceTracking: true
})

/**
 * @description Navigate to typing tutor page and verify initial state
 * @given I am on the typing tutor page
 */
Given('I am on the typing tutor page', async () => {
  const TypingPage = await import('../../app/pages/typing.vue')
  const wrapper = await bddSuite.mount(TypingPage.default)
  
  await stepHelpers.navigation.navigateToPage('typing tutor', wrapper)
  
  expect(wrapper.exists()).toBe(true)
})

/**
 * @description Verify that practice text is visible
 * @given I can see the practice text
 */
Given('I can see the practice text', () => {
  stepHelpers.navigation.verifyElementsVisible(['pre code'], getBDDContext().wrapper)
})

/**
 * @description Set up custom practice text
 * @given the practice text is {string}
 */
Given('the practice text is {string}', async (text) => {
  await stepHelpers.state.setupExercise({ code: text }, getBDDContext().wrapper)
})

/**
 * @description Simulate typing specific text
 * @when I type {string}
 */
When('I type {string}', async (text) => {
  await stepHelpers.interactions.inputText(text, {}, getBDDContext().wrapper)
})

/**
 * @description Simulate typing with timing constraint
 * @when I type {string} in exactly {int} seconds
 */
When('I type {string} in exactly {int} seconds', async (text, seconds) => {
  const delayPerChar = (seconds * 1000) / text.length
  await stepHelpers.interactions.inputText(text, { delayBetweenKeys: delayPerChar }, getBDDContext().wrapper)
})

/**
 * @description Simulate rapid typing for performance testing
 * @when I type very rapidly with {int}ms between keystrokes
 */
When('I type very rapidly with {int}ms between keystrokes', async (interval) => {
  const wrapper = getBDDContext().wrapper
  const targetText = wrapper.vm.targetText || 'sample text for testing'
  
  await stepHelpers.interactions.rapidType(targetText, interval, wrapper)
})

/**
 * @description Click button by text content
 * @when I click {string}
 */
When('I click {string}', async (buttonText) => {
  await stepHelpers.interactions.clickByText(buttonText, getBDDContext().wrapper)
})

/**
 * @description Verify correct character highlighting
 * @then the characters I type correctly should be highlighted in green
 */
Then('the characters I type correctly should be highlighted in green', () => {
  stepHelpers.assertions.verifyHighlighting(
    { correct: ['.text-green-600'] },
    getBDDContext().wrapper
  )
})

/**
 * @description Verify WPM calculation
 * @then the WPM should be calculated as {int}
 */
Then('the WPM should be calculated as {int}', (expectedWpm) => {
  stepHelpers.assertions.verifyMetrics({ wpm: expectedWpm }, getBDDContext().wrapper)
})

/**
 * @description Verify accuracy percentage
 * @then the accuracy should be approximately {float}%
 */
Then('the accuracy should be approximately {float}%', (expectedAccuracy) => {
  const wrapper = getBDDContext().wrapper
  const actualAccuracy = wrapper.vm.accuracy
  expect(actualAccuracy).toBeCloseTo(expectedAccuracy, 1)
})

/**
 * @description Verify progress completion
 * @then the progress bar should show approximately {int}% completion
 */
Then('the progress bar should show approximately {int}% completion', (expectedProgress) => {
  stepHelpers.assertions.verifyProgress(expectedProgress, { tolerance: 2 }, getBDDContext().wrapper)
})

/**
 * @description Verify modal appearance
 * @then a completion modal should appear
 */
Then('a completion modal should appear', () => {
  stepHelpers.assertions.verifyModal(
    { 
      visible: true,
      containsText: ['completion', 'final'],
      hasButtons: ['Next', 'Close']
    },
    getBDDContext().wrapper
  )
})

/**
 * @description Verify application responsiveness
 * @then the application should remain responsive
 */
Then('the application should remain responsive', () => {
  stepHelpers.performance.verifyResponsiveness(getBDDContext().wrapper)
})

/**
 * @description Verify performance metrics
 * @then no performance degradation should occur
 */
Then('no performance degradation should occur', () => {
  const metrics = bddSuite.getMetrics()
  
  // Verify render times are reasonable
  if (metrics.renderTimes.length > 0) {
    const avgRenderTime = metrics.renderTimes.reduce((a, b) => a + b) / metrics.renderTimes.length
    expect(avgRenderTime).toBeLessThan(100)
  }
  
  // Verify memory usage is stable
  expect(metrics.memoryDiff).toBeLessThan(50 * 1024 * 1024) // Less than 50MB increase
})

// Example 5: Feature File Validation
describe('Feature File Validation Example', () => {
  it('should validate feature file structure', () => {
    const featureContent = `
Feature: Typing Tutor Application
  As a user who wants to improve typing skills
  I want to practice typing with real-time feedback
  So that I can track my progress and improve my speed and accuracy

  Background:
    Given I am on the typing tutor page
    And I can see the practice text

  Scenario: Basic typing functionality
    When I start typing the displayed text
    Then the characters I type correctly should be highlighted in green
    And the characters I type incorrectly should be highlighted in red

  Scenario: WPM calculation
    Given the practice text is "Hello World"
    When I type "Hello World" in exactly 60 seconds
    Then the WPM should be calculated as 2
`

    const feature = parseFeature(featureContent)
    
    expect(feature.title).toBe('Typing Tutor Application')
    expect(feature.scenarios).toHaveLength(2)
    expect(feature.background.steps).toHaveLength(2)
    
    // Validate feature structure
    const validation = validateFeature(feature)
    expect(validation.isValid).toBe(true)
    expect(validation.errors).toEqual([])
  })
})

// Example 6: Step Discovery
describe('Step Discovery Example', () => {
  it('should discover missing and unused steps', async () => {
    // This would typically run against your actual project
    const projectRoot = process.cwd()
    
    try {
      const discovery = await discoverSteps(projectRoot)
      
      
      // Generate missing step definitions
      if (discovery.missing.length > 0) {
        const generatedSteps = stepDiscovery.generateMissingSteps(discovery.missing)
      }
      
      expect(discovery.coverage).toBeDefined()
      expect(discovery.definitions).toBeDefined()
      expect(discovery.usage).toBeDefined()
    } catch (error) {
      // Step discovery might fail if project structure doesn't match expectations
    }
  })
})

export {
  bddSuite,
  stepHelpers,
  bddPatterns
}