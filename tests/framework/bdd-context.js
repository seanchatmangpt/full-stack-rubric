/**
 * @fileoverview BDD Test Context for Vitest-Cucumber Integration
 * @description Creates proper test context for BDD scenarios with Given, When, Then functions
 */

import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { vi, expect } from 'vitest'
import TypingPage from '../../app/pages/typing.vue'

/**
 * @typedef {Object} BDDTestContext
 * @property {import('@vue/test-utils').VueWrapper|null} wrapper - Vue wrapper instance
 * @property {Function} Given - Given step function
 * @property {Function} When - When step function  
 * @property {Function} Then - Then step function
 * @property {Function} setupComponent - Setup component for testing
 * @property {Function} cleanupComponent - Cleanup component after testing
 * @property {Object} state - Shared test state
 */

/**
 * Creates a BDD test context with Given, When, Then functions
 * @returns {BDDTestContext} The BDD test context
 */
export function createTestContext() {
  let wrapper = null
  let originalConsoleError = null
  const state = {
    started: false,
    completed: false,
    startTime: null,
    endTime: null
  }

  /**
   * Setup component with default stubs and mocks
   * @param {Object} options - Mount options
   * @returns {Promise<import('@vue/test-utils').VueWrapper>}
   */
  const setupComponent = async (options = {}) => {
    // Mock console.error to prevent test noise
    originalConsoleError = console.error
    console.error = vi.fn()

    const defaultStubs = {
      MonacoEditor: {
        template: '<textarea v-model="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" class="w-full h-full p-4" />',
        props: ['modelValue', 'lang', 'options'],
        emits: ['update:modelValue']
      },
      UButton: { template: '<button @click="$emit(\'click\')" v-bind="$attrs"><slot /></button>' },
      UBadge: { template: '<span class="badge" v-bind="$attrs"><slot /></span>' },
      UModal: { 
        template: '<div v-if="modelValue" class="modal"><slot /></div>',
        props: ['modelValue'],
        emits: ['update:modelValue']
      },
      UCard: { 
        template: '<div class="card"><slot name="header" /><slot /><slot name="footer" /></div>'
      }
    }

    wrapper = mount(TypingPage, {
      global: {
        stubs: { ...defaultStubs, ...(options.stubs || {}) }
      },
      ...options
    })
    
    await nextTick()
    return wrapper
  }

  /**
   * Cleanup component and restore mocks
   */
  const cleanupComponent = () => {
    if (wrapper) {
      wrapper.unmount()
      wrapper = null
    }
    if (originalConsoleError) {
      console.error = originalConsoleError
      originalConsoleError = null
    }
    state.started = false
    state.completed = false
    state.startTime = null
    state.endTime = null
  }

  /**
   * Given step function for BDD scenarios
   * @param {string} step - The step description
   * @param {Function} implementation - The step implementation
   */
  const Given = (step, implementation) => {
    // Store the step for later execution
    Given._steps = Given._steps || new Map()
    Given._steps.set(step, implementation)
  }

  /**
   * When step function for BDD scenarios
   * @param {string} step - The step description
   * @param {Function} implementation - The step implementation
   */
  const When = (step, implementation) => {
    // Store the step for later execution
    When._steps = When._steps || new Map()
    When._steps.set(step, implementation)
  }

  /**
   * Then step function for BDD scenarios
   * @param {string} step - The step description
   * @param {Function} implementation - The step implementation
   */
  const Then = (step, implementation) => {
    // Store the step for later execution
    Then._steps = Then._steps || new Map()
    Then._steps.set(step, implementation)
  }

  /**
   * Execute a step by matching it against registered steps
   * @param {string} step - Step to execute
   * @param {Array} args - Arguments for the step
   * @returns {Promise<any>} Step result
   */
  const executeStep = async (step, ...args) => {
    // Check Given steps
    if (Given._steps && Given._steps.has(step)) {
      return await Given._steps.get(step)(...args)
    }
    
    // Check When steps  
    if (When._steps && When._steps.has(step)) {
      return await When._steps.get(step)(...args)
    }
    
    // Check Then steps
    if (Then._steps && Then._steps.has(step)) {
      return await Then._steps.get(step)(...args)
    }
    
    // Try pattern matching for parameterized steps
    const allSteps = new Map([
      ...(Given._steps || []),
      ...(When._steps || []),
      ...(Then._steps || [])
    ])
    
    for (const [pattern, implementation] of allSteps) {
      const regex = convertStepToRegex(pattern)
      const match = step.match(regex)
      if (match) {
        const params = match.slice(1).map((param) => {
          // Convert numeric parameters
          if (/^\d+$/.test(param)) return parseInt(param, 10)
          if (/^\d+\.\d+$/.test(param)) return parseFloat(param)
          return param.replace(/^"|"$/g, '') // Remove quotes
        })
        return await implementation(...params, ...args)
      }
    }
    
    throw new Error(`No step definition found for: ${step}`)
  }

  /**
   * Convert step pattern to regex for parameter matching
   * @param {string} pattern - Step pattern with placeholders
   * @returns {RegExp} Regex for matching
   */
  const convertStepToRegex = (pattern) => {
    return new RegExp(
      pattern
        .replace(/\{int\}/g, '(\\d+)')
        .replace(/\{float\}/g, '(\\d+\\.\\d+)')
        .replace(/\{string\}/g, '"([^"]*)"|([^\\s]+)')
        .replace(/\{word\}/g, '([^\\s]+)')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/\?/g, '\\?')
    )
  }

  return {
    wrapper: () => wrapper,
    Given,
    When,
    Then,
    setupComponent,
    cleanupComponent,
    executeStep,
    state,
    // Expose expect and other testing utilities
    expect,
    nextTick
  }
}

/**
 * Global BDD context instance
 */
export const globalContext = createTestContext()

/**
 * Export Given, When, Then functions globally
 */
export const { Given, When, Then } = globalContext
