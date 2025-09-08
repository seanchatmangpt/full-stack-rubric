/**
 * @fileoverview Test environment creation
 */

import { setupBDDEnvironment, cleanupBDDEnvironment } from '../setup.js'

/**
 * Creates a test environment
 * @param {Object} config - Environment configuration
 * @returns {Object} Test environment
 */
export async function createTestEnvironment(config = {}) {
  await setupBDDEnvironment(config)
  
  return {
    config,
    cleanup: cleanupBDDEnvironment,
    isReady: true
  }
}