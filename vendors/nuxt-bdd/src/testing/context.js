/**
 * @fileoverview Test context management
 */

/**
 * Test context class
 */
export class TestContext {
  constructor() {
    this.data = new Map()
    this.cleanup = []
  }
  
  /**
   * Sets context data
   * @param {string} key - Data key
   * @param {*} value - Data value
   */
  set(key, value) {
    this.data.set(key, value)
  }
  
  /**
   * Gets context data
   * @param {string} key - Data key
   * @returns {*} Data value
   */
  get(key) {
    return this.data.get(key)
  }
  
  /**
   * Adds cleanup function
   * @param {Function} fn - Cleanup function
   */
  addCleanup(fn) {
    this.cleanup.push(fn)
  }
  
  /**
   * Runs cleanup functions
   * @returns {Promise<void>}
   */
  async runCleanup() {
    for (const fn of this.cleanup) {
      try {
        await fn()
      } catch (error) {
      }
    }
    this.cleanup = []
  }
}