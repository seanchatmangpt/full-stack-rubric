/**
 * @fileoverview DOM utility functions
 */

/**
 * Waits for an element to appear in the DOM
 * @param {Object} page - Playwright page object
 * @param {string} selector - CSS selector
 * @param {Object} options - Wait options
 * @returns {Promise<Object>} Element handle
 */
export async function waitForElement(page, selector, options = {}) {
  const { timeout = 5000 } = options
  
  try {
    return await page.waitForSelector(selector, { timeout })
  } catch (error) {
    throw new Error(`Element "${selector}" not found within ${timeout}ms`)
  }
}

/**
 * Waits for navigation to complete
 * @param {Object} page - Playwright page object
 * @param {Object} options - Navigation options
 * @returns {Promise<void>}
 */
export async function waitForNavigation(page, options = {}) {
  const { timeout = 10000 } = options
  
  await page.waitForLoadState('networkidle', { timeout })
}