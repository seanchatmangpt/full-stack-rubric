/**
 * @fileoverview Step definition utilities
 */

import { defineStep } from '@amiceli/vitest-cucumber'

/**
 * Defines step definitions for BDD scenarios
 * @param {Function} stepFn - Function that defines steps
 * @returns {void}
 */
export function defineSteps(stepFn) {
  if (typeof stepFn !== 'function') {
    throw new Error('defineSteps expects a function')
  }
  
  // Execute the step definition function
  stepFn({
    Given: (pattern, implementation) => defineStep('Given', pattern, implementation),
    When: (pattern, implementation) => defineStep('When', pattern, implementation),
    Then: (pattern, implementation) => defineStep('Then', implementation)
  })
}