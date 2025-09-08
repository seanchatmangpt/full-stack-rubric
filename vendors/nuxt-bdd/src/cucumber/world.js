/**
 * @fileoverview World object setup for Cucumber scenarios
 */

/**
 * Sets up the world object for scenario context
 * @param {Object} context - Initial context
 * @returns {Object} World object
 */
export function setupWorld(context = {}) {
  return {
    ...context,
    page: null,
    browser: null,
    response: null,
    data: {}
  }
}

/**
 * Tears down the world object after scenario completion
 * @param {Object} world - World object to clean up
 * @returns {Promise<void>}
 */
export async function teardownWorld(world) {
  if (world.page) {
    await world.page.close()
  }
  
  if (world.browser) {
    await world.browser.close()
  }
}