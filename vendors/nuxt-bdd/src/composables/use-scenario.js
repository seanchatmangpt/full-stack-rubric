/**
 * @fileoverview Scenario management composable
 */

import { ref, reactive } from 'vue'

/**
 * Scenario composable
 * @param {string} scenarioName - Scenario name
 * @returns {Object} Scenario utilities
 */
export function useScenario(scenarioName) {
  const isActive = ref(false)
  const steps = reactive([])
  const context = reactive({})
  
  /**
   * Adds a step to the scenario
   * @param {string} type - Step type (Given, When, Then)
   * @param {string} description - Step description
   * @param {Function} implementation - Step implementation
   */
  function addStep(type, description, implementation) {
    steps.push({
      type,
      description,
      implementation,
      status: 'pending'
    })
  }
  
  /**
   * Executes the scenario
   * @returns {Promise<Object>} Execution result
   */
  async function execute() {
    isActive.value = true
    const results = []
    
    for (const step of steps) {
      try {
        step.status = 'running'
        await step.implementation(context)
        step.status = 'passed'
        results.push({ step: step.description, status: 'passed' })
      } catch (error) {
        step.status = 'failed'
        results.push({ step: step.description, status: 'failed', error })
        break
      }
    }
    
    isActive.value = false
    return {
      scenario: scenarioName,
      results,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length
    }
  }
  
  return {
    isActive,
    steps,
    context,
    addStep,
    execute
  }
}