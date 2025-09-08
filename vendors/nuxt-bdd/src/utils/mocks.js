/**
 * @fileoverview Mock utilities for testing
 */

const activeMocks = new Map()

/**
 * Mocks an API endpoint
 * @param {string} endpoint - API endpoint to mock
 * @param {*} response - Mock response
 * @param {Object} options - Mock options
 * @returns {Function} Cleanup function
 */
export function mockApi(endpoint, response, options = {}) {
  const { method = 'GET', status = 200 } = options
  const mockId = `${method}:${endpoint}`
  
  const mockImplementation = async () => ({
    status,
    json: async () => response,
    text: async () => JSON.stringify(response)
  })
  
  activeMocks.set(mockId, mockImplementation)
  
  return () => activeMocks.delete(mockId)
}

/**
 * Resets all active mocks
 * @returns {void}
 */
export function resetMocks() {
  activeMocks.clear()
}