/**
 * @fileoverview Test helper utilities
 */

/**
 * Generates test data
 * @param {string} type - Type of data to generate
 * @param {Object} options - Generation options
 * @returns {*} Generated test data
 */
export function generateTestData(type, options = {}) {
  const generators = {
    user: () => ({
      id: Math.random().toString(36).substr(2, 9),
      name: `Test User ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      ...options
    }),
    
    post: () => ({
      id: Math.random().toString(36).substr(2, 9),
      title: `Test Post ${Date.now()}`,
      content: 'This is test content',
      created: new Date().toISOString(),
      ...options
    })
  }
  
  const generator = generators[type]
  if (!generator) {
    throw new Error(`Unknown test data type: ${type}`)
  }
  
  return generator()
}

/**
 * Cleanup utility for test data
 * @param {Array} items - Items to cleanup
 * @returns {Promise<void>}
 */
export async function cleanup(items = []) {
  for (const item of items) {
    if (typeof item.cleanup === 'function') {
      await item.cleanup()
    }
  }
}