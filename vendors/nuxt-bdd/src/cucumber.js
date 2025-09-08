/**
 * @fileoverview Cucumber BDD utilities for Nuxt.js applications
 */

import { Given, When, Then, Before, After } from '@amiceli/vitest-cucumber'
import { createBDDPage, setupNuxtBDD } from './vitest.js'

let currentPage = null
let nuxtContext = null

/**
 * Setup Cucumber environment before scenarios
 */
Before(async () => {
  if (!nuxtContext) {
    await setupNuxtBDD()
    nuxtContext = true
  }
})

/**
 * Cleanup after scenarios
 */
After(async () => {
  if (currentPage) {
    await currentPage.close()
    currentPage = null
  }
})

/**
 * Common Given steps for Nuxt applications
 */
Given('I am on the {string} page', async (pagePath) => {
  currentPage = await createBDDPage(pagePath)
})

Given('the application is running', async () => {
  // Nuxt setup is handled in Before hook
  expect(nuxtContext).toBeTruthy()
})

/**
 * Common When steps for user interactions
 */
When('I click on {string}', async (selector) => {
  if (!currentPage) {
    throw new Error('BDD Step Error: No page is currently loaded. Use "Given I am on the..." first')
  }
  
  const element = await currentPage.waitForBDDElement(selector)
  await element.click()
})

When('I fill {string} with {string}', async (selector, value) => {
  if (!currentPage) {
    throw new Error('BDD Step Error: No page is currently loaded. Use "Given I am on the..." first')
  }
  
  await currentPage.fillField(selector, value)
})

When('I submit the form', async () => {
  if (!currentPage) {
    throw new Error('BDD Step Error: No page is currently loaded. Use "Given I am on the..." first')
  }
  
  const submitButton = await currentPage.waitForBDDElement('[type="submit"], button[type="submit"], .submit-button')
  await submitButton.click()
})

When('I navigate to {string}', async (path) => {
  if (currentPage) {
    await currentPage.close()
  }
  currentPage = await createBDDPage(path)
})

/**
 * Common Then steps for assertions
 */
Then('I should see {string}', async (text) => {
  if (!currentPage) {
    throw new Error('BDD Step Error: No page is currently loaded')
  }
  
  const content = await currentPage.textContent('body')
  if (!content.includes(text)) {
    throw new Error(`BDD Assertion Failed: Expected to see "${text}" on the page, but it was not found`)
  }
})

Then('I should see an element {string}', async (selector) => {
  if (!currentPage) {
    throw new Error('BDD Step Error: No page is currently loaded')
  }
  
  await currentPage.waitForBDDElement(selector)
})

Then('the element {string} should contain {string}', async (selector, expectedText) => {
  if (!currentPage) {
    throw new Error('BDD Step Error: No page is currently loaded')
  }
  
  await currentPage.shouldHaveText(selector, expectedText)
})

Then('I should be redirected to {string}', async (expectedPath) => {
  if (!currentPage) {
    throw new Error('BDD Step Error: No page is currently loaded')
  }
  
  const currentUrl = await currentPage.url()
  const urlPath = new URL(currentUrl).pathname
  
  if (urlPath !== expectedPath) {
    throw new Error(`BDD Assertion Failed: Expected to be on "${expectedPath}" but was on "${urlPath}"`)
  }
})

/**
 * Export common step utilities for custom step definitions
 */
export {
  Given,
  When, 
  Then,
  Before,
  After
}

/**
 * Get current page instance for custom steps
 * @returns {Object|null} Current page instance
 */
export function getCurrentPage() {
  return currentPage
}

/**
 * Set current page instance (for advanced usage)
 * @param {Object} page - Page instance
 */
export function setCurrentPage(page) {
  currentPage = page
}