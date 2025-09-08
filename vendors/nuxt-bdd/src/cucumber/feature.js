/**
 * @fileoverview Feature definition utilities
 */

import { loadFeature } from '@amiceli/vitest-cucumber'

/**
 * Defines a feature for BDD testing
 * @param {string} featurePath - Path to the feature file
 * @param {Object} options - Feature options
 * @returns {Object} Feature definition
 */
export function defineFeature(featurePath, options = {}) {
  const feature = loadFeature(featurePath)
  
  return {
    ...feature,
    ...options,
    scenarios: feature.scenarios || []
  }
}