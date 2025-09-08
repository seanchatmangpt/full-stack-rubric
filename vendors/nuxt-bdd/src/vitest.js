/**
 * @fileoverview Vitest utilities for Nuxt BDD testing
 */

import { setup, createPage } from '@nuxt/test-utils'
import { mount } from '@vue/test-utils'

/**
 * Setup Nuxt testing environment with BDD configuration
 * @param {Object} options - Setup options
 * @param {string} options.rootDir - Root directory for Nuxt app
 * @param {Object} options.nuxtConfig - Nuxt configuration overrides
 * @returns {Promise<void>}
 */
export async function setupNuxtBDD(options = {}) {
  await setup({
    rootDir: options.rootDir || process.cwd(),
    nuxtConfig: {
      ssr: true,
      ...options.nuxtConfig
    }
  })
}

/**
 * Create a test page for BDD scenarios
 * @param {string} path - Page path to test
 * @param {Object} options - Page options
 * @returns {Promise<Object>} Page object with testing utilities
 */
export async function createBDDPage(path, options = {}) {
  const page = await createPage(path, options)
  
  return {
    ...page,
    
    /**
     * Wait for element with BDD-friendly error messages
     * @param {string} selector - Element selector
     * @param {Object} options - Wait options
     */
    async waitForBDDElement(selector, options = {}) {
      try {
        return await page.waitForSelector(selector, options)
      } catch (error) {
        throw new Error(`BDD Step Failed: Could not find element "${selector}" on page "${path}"`)
      }
    },
    
    /**
     * Assert element text matches expected value
     * @param {string} selector - Element selector
     * @param {string} expectedText - Expected text content
     */
    async shouldHaveText(selector, expectedText) {
      const element = await this.waitForBDDElement(selector)
      const actualText = await element.textContent()
      
      if (actualText.trim() !== expectedText.trim()) {
        throw new Error(`BDD Assertion Failed: Expected "${expectedText}" but got "${actualText}"`)
      }
    },
    
    /**
     * Fill form field with BDD error handling
     * @param {string} selector - Input selector
     * @param {string} value - Value to fill
     */
    async fillField(selector, value) {
      const element = await this.waitForBDDElement(selector)
      await element.fill(value)
    }
  }
}

/**
 * Mount Vue component with BDD testing utilities
 * @param {Object} component - Vue component
 * @param {Object} options - Mount options
 * @returns {Object} Enhanced wrapper with BDD utilities
 */
export function mountBDD(component, options = {}) {
  const wrapper = mount(component, {
    global: {
      stubs: {
        NuxtLink: true,
        NuxtPage: true,
        ...options.global?.stubs
      }
    },
    ...options
  })
  
  return {
    ...wrapper,
    
    /**
     * Find element by test ID with BDD error messages
     * @param {string} testId - Test ID attribute value
     */
    findByTestId(testId) {
      const element = wrapper.find(`[data-testid="${testId}"]`)
      if (!element.exists()) {
        throw new Error(`BDD Component Test Failed: Could not find element with test-id "${testId}"`)
      }
      return element
    },
    
    /**
     * Assert component emitted event
     * @param {string} eventName - Event name
     * @param {any} expectedPayload - Expected event payload
     */
    shouldHaveEmitted(eventName, expectedPayload = undefined) {
      const emitted = wrapper.emitted(eventName)
      if (!emitted) {
        throw new Error(`BDD Component Test Failed: Component did not emit "${eventName}" event`)
      }
      
      if (expectedPayload !== undefined) {
        const lastEmission = emitted[emitted.length - 1]
        if (JSON.stringify(lastEmission[0]) !== JSON.stringify(expectedPayload)) {
          throw new Error(`BDD Component Test Failed: Expected event payload "${JSON.stringify(expectedPayload)}" but got "${JSON.stringify(lastEmission[0])}"`)
        }
      }
    }
  }
}