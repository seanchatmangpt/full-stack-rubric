/**
 * @fileoverview Main BDD test composable
 */

import { ref, reactive } from 'vue'

/**
 * BDD test composable
 * @param {Object} options - Test options
 * @returns {Object} BDD test utilities
 */
export function useBDDTest(options = {}) {
  const isRunning = ref(false)
  const results = reactive({
    passed: 0,
    failed: 0,
    skipped: 0,
    total: 0
  })
  
  const context = reactive({})
  
  /**
   * Runs a BDD scenario
   * @param {string} scenarioName - Name of the scenario
   * @param {Function} scenarioFn - Scenario function
   * @returns {Promise<Object>} Test result
   */
  async function runScenario(scenarioName, scenarioFn) {
    isRunning.value = true
    
    try {
      await scenarioFn(context)
      results.passed++
      return { status: 'passed', scenario: scenarioName }
    } catch (error) {
      results.failed++
      return { status: 'failed', scenario: scenarioName, error }
    } finally {
      results.total++
      isRunning.value = false
    }
  }
  
  /**
   * Sets context data
   * @param {string} key - Context key
   * @param {*} value - Context value
   */
  function setContext(key, value) {
    context[key] = value
  }
  
  /**
   * Gets context data
   * @param {string} key - Context key
   * @returns {*} Context value
   */
  function getContext(key) {
    return context[key]
  }
  
  return {
    isRunning,
    results,
    context,
    runScenario,
    setContext,
    getContext
  }
}