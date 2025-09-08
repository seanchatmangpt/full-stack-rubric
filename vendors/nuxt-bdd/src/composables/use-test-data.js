/**
 * @fileoverview Test data management composable
 */

import { ref, reactive } from 'vue'
import { generateTestData } from '../utils/test-helpers.js'

/**
 * Test data composable
 * @returns {Object} Test data utilities
 */
export function useTestData() {
  const testData = reactive(new Map())
  const isLoading = ref(false)
  
  /**
   * Creates test data
   * @param {string} type - Data type
   * @param {Object} options - Creation options
   * @returns {*} Generated data
   */
  function createTestData(type, options = {}) {
    const data = generateTestData(type, options)
    const key = `${type}_${data.id}`
    testData.set(key, data)
    return data
  }
  
  /**
   * Gets test data by key
   * @param {string} key - Data key
   * @returns {*} Test data
   */
  function getTestData(key) {
    return testData.get(key)
  }
  
  /**
   * Clears all test data
   */
  function clearTestData() {
    testData.clear()
  }
  
  return {
    testData,
    isLoading,
    createTestData,
    getTestData,
    clearTestData
  }
}