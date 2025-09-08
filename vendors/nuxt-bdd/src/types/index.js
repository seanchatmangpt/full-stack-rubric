/**
 * @fileoverview Type definitions and constants for BDD testing
 */

/**
 * BDD Step types
 * @readonly
 * @enum {string}
 */
export const STEP_TYPES = {
  GIVEN: 'Given',
  WHEN: 'When', 
  THEN: 'Then',
  AND: 'And',
  BUT: 'But'
}

/**
 * Test environment types
 * @readonly
 * @enum {string}
 */
export const TEST_ENVIRONMENTS = {
  JSDOM: 'jsdom',
  HAPPY_DOM: 'happy-dom',
  NODE: 'node'
}

/**
 * Common selectors for BDD testing
 * @readonly
 * @enum {string}
 */
export const BDD_SELECTORS = {
  SUBMIT_BUTTON: '[type="submit"], button[type="submit"], .submit-button',
  FORM: 'form',
  INPUT: 'input',
  BUTTON: 'button',
  LINK: 'a',
  MODAL: '.modal, [role="dialog"]',
  LOADING: '.loading, [aria-label*="loading"], [aria-busy="true"]',
  ERROR: '.error, [role="alert"], .alert-error',
  SUCCESS: '.success, .alert-success'
}

/**
 * Default timeout values
 * @readonly
 * @enum {number}
 */
export const TIMEOUTS = {
  SHORT: 1000,
  MEDIUM: 5000,
  LONG: 10000,
  NETWORK: 30000
}

/**
 * @typedef {Object} BDDStep
 * @property {string} type - Step type (Given, When, Then, etc.)
 * @property {string} text - Step text description
 * @property {Function} [implementation] - Step implementation function
 */

/**
 * @typedef {Object} BDDScenario  
 * @property {string} name - Scenario name
 * @property {BDDStep[]} steps - Array of steps
 * @property {Object} [context] - Scenario context data
 * @property {string[]} [tags] - Scenario tags
 */

/**
 * @typedef {Object} BDDFeature
 * @property {string} name - Feature name
 * @property {string} [description] - Feature description
 * @property {BDDScenario[]} scenarios - Array of scenarios
 * @property {string[]} [tags] - Feature tags
 */

/**
 * @typedef {Object} BDDPageObject
 * @property {Function} waitForBDDElement - Wait for element to appear
 * @property {Function} shouldHaveText - Assert element has specific text
 * @property {Function} fillField - Fill form field
 * @property {Function} click - Click on element
 * @property {Function} url - Get current URL
 * @property {Function} textContent - Get text content
 * @property {Function} close - Close page/browser
 */

/**
 * @typedef {Object} BDDMountWrapper
 * @property {Function} findByTestId - Find element by test ID
 * @property {Function} shouldHaveEmitted - Assert component emitted event
 * @property {Function} find - Find element by selector
 * @property {Function} exists - Check if wrapper exists
 * @property {Function} emitted - Get emitted events
 */