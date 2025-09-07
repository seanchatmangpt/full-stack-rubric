/**
 * @fileoverview Cucumber BDD Test Runner for Vitest
 * @description Executes Cucumber feature files using vitest-cucumber library
 */

import { loadFeature, defineFeature } from '@amiceli/vitest-cucumber'
import { describe } from 'vitest'

// Import step definitions
import './steps/typing-tutor.steps.js'
import './steps/performance.steps.js'

/**
 * Load and execute typing tutor feature tests
 */
describe('Typing Tutor Features', () => {
  const typingTutorFeature = loadFeature('tests/features/typing-tutor.feature')
  
  defineFeature(typingTutorFeature, (test) => {
    // The step definitions in typing-tutor.steps.js will be automatically matched
    // No additional test code needed - steps handle all the test logic
  })
})

/**
 * Load and execute performance feature tests
 */
describe('Performance Features', () => {
  const performanceFeature = loadFeature('tests/features/performance.feature')
  
  defineFeature(performanceFeature, (test) => {
    // The step definitions in performance.steps.js will be automatically matched
    // No additional test code needed - steps handle all the test logic
  })
})