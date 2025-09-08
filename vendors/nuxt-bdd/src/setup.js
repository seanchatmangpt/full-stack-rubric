/**
 * @fileoverview Environment setup and teardown for BDD tests
 */

import { setup, createPage } from '@nuxt/test-utils/e2e'

/**
 * Sets up the BDD testing environment
 * @param {Object} options - Setup options
 * @param {string} options.rootDir - Root directory of the Nuxt app
 * @param {Object} options.nuxtConfig - Nuxt configuration overrides
 * @returns {Promise<void>}
 */
export async function setupBDDEnvironment(options = {}) {
  const {
    rootDir = process.cwd(),
    nuxtConfig = {}
  } = options

  await setup({
    rootDir,
    nuxtConfig: {
      // Default test configuration
      ssr: true,
      dev: false,
      ...nuxtConfig
    }
  })
}

/**
 * Cleans up the BDD testing environment
 * @returns {Promise<void>}
 */
export async function cleanupBDDEnvironment() {
  // Cleanup is handled by @nuxt/test-utils
  // This function is here for future extensibility
}