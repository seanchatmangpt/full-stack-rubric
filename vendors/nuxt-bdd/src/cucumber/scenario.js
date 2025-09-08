/**
 * @fileoverview Scenario creation utilities
 */

/**
 * Creates a scenario context for BDD testing
 * @param {string} name - Scenario name
 * @param {Object} options - Scenario options
 * @returns {Object} Scenario context
 */
export function createScenario(name, options = {}) {
  return {
    name,
    ...options,
    context: {},
    steps: [],
    hooks: {
      before: [],
      after: [],
      beforeStep: [],
      afterStep: []
    }
  }
}