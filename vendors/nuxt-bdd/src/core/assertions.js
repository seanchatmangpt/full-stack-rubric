/**
 * Enhanced Assertions and Matchers - Custom test assertions and matchers
 * @fileoverview Framework-agnostic assertion utilities with BDD-style expectations
 */

import { expect } from 'vitest'

/**
 * Accessibility assertion helpers
 */
export class A11yAssertions {
  /**
   * Assert element has proper ARIA attributes
   * @param {Element|Object} element - DOM element or wrapper
   */
  static hasAriaLabels(element) {
    const el = element.element || element
    const interactiveElements = el.querySelectorAll('button, input, select, textarea, a, [tabindex]')
    
    interactiveElements.forEach((interactive, index) => {
      const hasLabel = interactive.getAttribute('aria-label') || 
                      interactive.getAttribute('aria-labelledby') ||
                      interactive.getAttribute('title') ||
                      interactive.textContent.trim()
      
      expect(hasLabel, `Interactive element ${index} should have accessible label`).toBeTruthy()
    })
  }

  /**
   * Assert images have alt text
   * @param {Element|Object} element - DOM element or wrapper
   */
  static hasImageAltText(element) {
    const el = element.element || element
    const images = el.querySelectorAll('img')
    
    images.forEach((img, index) => {
      const altText = img.getAttribute('alt')
      expect(altText, `Image ${index} should have alt text`).toBeTruthy()
      expect(altText, `Image ${index} alt text should not be empty`).not.toBe('')
    })
  }

  /**
   * Assert proper heading hierarchy
   * @param {Element|Object} element - DOM element or wrapper
   */
  static hasProperHeadingHierarchy(element) {
    const el = element.element || element
    const headings = Array.from(el.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    
    if (headings.length === 0) return

    const levels = headings.map(h => parseInt(h.tagName.charAt(1)))
    
    // Should start with h1 or at least not skip levels
    let currentLevel = levels[0]
    
    for (let i = 1; i < levels.length; i++) {
      const level = levels[i]
      const jump = level - currentLevel
      
      expect(jump, `Heading level should not jump more than 1 (from h${currentLevel} to h${level})`).toBeLessThanOrEqual(1)
      currentLevel = level
    }
  }

  /**
   * Assert proper focus management
   * @param {Element|Object} element - DOM element or wrapper
   */
  static hasFocusManagement(element) {
    const el = element.element || element
    const focusableElements = el.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    
    focusableElements.forEach((focusable, index) => {
      const tabIndex = focusable.getAttribute('tabindex')
      if (tabIndex && tabIndex !== '0') {
        const tabIndexNum = parseInt(tabIndex)
        expect(tabIndexNum, `Element ${index} should not have positive tabindex`).toBeLessThan(1)
      }
    })
  }
}

/**
 * Performance assertion helpers
 */
export class PerformanceAssertions {
  /**
   * Assert operation completes within time limit
   * @param {Function} operation - Operation to test
   * @param {number} maxTime - Maximum time in ms
   * @returns {Promise<number>} Actual execution time
   */
  static async completesWithin(operation, maxTime) {
    const start = performance.now()
    await operation()
    const duration = performance.now() - start
    
    expect(duration, `Operation should complete within ${maxTime}ms`).toBeLessThan(maxTime)
    return duration
  }

  /**
   * Assert memory usage doesn't exceed threshold
   * @param {Function} operation - Operation to test
   * @param {number} maxMemoryMB - Maximum memory in MB
   */
  static async memoryUsageWithin(operation, maxMemoryMB) {
    const initialMemory = performance.memory?.usedJSHeapSize || 0
    
    await operation()
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0
    const memoryIncreaseMB = (finalMemory - initialMemory) / (1024 * 1024)
    
    expect(memoryIncreaseMB, `Memory usage should not exceed ${maxMemoryMB}MB`).toBeLessThan(maxMemoryMB)
  }
}

/**
 * Component assertion helpers
 */
export class ComponentAssertions {
  /**
   * Assert component renders without errors
   * @param {Object} wrapper - Component wrapper
   */
  static rendersWithoutErrors(wrapper) {
    expect(wrapper.exists(), 'Component should exist').toBe(true)
    expect(wrapper.html(), 'Component should have HTML content').toBeTruthy()
  }

  /**
   * Assert component contains text
   * @param {Object} wrapper - Component wrapper
   * @param {string} text - Text to find
   */
  static containsText(wrapper, text) {
    expect(wrapper.text(), `Component should contain text: "${text}"`).toContain(text)
  }

  /**
   * Assert component has CSS class
   * @param {Object} wrapper - Component wrapper
   * @param {string} className - CSS class name
   */
  static hasClass(wrapper, className) {
    expect(wrapper.classes(), `Component should have class: "${className}"`).toContain(className)
  }

  /**
   * Assert component emitted event
   * @param {Object} wrapper - Component wrapper
   * @param {string} eventName - Event name
   * @param {*} expectedPayload - Expected event payload
   */
  static emittedEvent(wrapper, eventName, expectedPayload = undefined) {
    const emitted = wrapper.emitted(eventName)
    expect(emitted, `Component should emit event: "${eventName}"`).toBeTruthy()
    
    if (expectedPayload !== undefined) {
      const lastEmit = emitted[emitted.length - 1]
      expect(lastEmit, `Event "${eventName}" should have expected payload`).toEqual(expectedPayload)
    }
  }

  /**
   * Assert component has attribute
   * @param {Object} wrapper - Component wrapper
   * @param {string} attribute - Attribute name
   * @param {string} expectedValue - Expected attribute value
   */
  static hasAttribute(wrapper, attribute, expectedValue = undefined) {
    const attrs = wrapper.attributes()
    expect(attrs, `Component should have attribute: "${attribute}"`).toHaveProperty(attribute)
    
    if (expectedValue !== undefined) {
      expect(attrs[attribute], `Attribute "${attribute}" should have expected value`).toBe(expectedValue)
    }
  }

  /**
   * Assert component props are valid
   * @param {Object} wrapper - Component wrapper
   * @param {Object} component - Component definition
   */
  static hasValidProps(wrapper, component) {
    const componentProps = component.props || {}
    const wrapperProps = wrapper.props()
    
    Object.entries(componentProps).forEach(([propName, propConfig]) => {
      if (propConfig.required) {
        expect(wrapperProps, `Required prop "${propName}" should be defined`).toHaveProperty(propName)
        expect(wrapperProps[propName], `Required prop "${propName}" should not be null/undefined`).toBeDefined()
      }
      
      if (propConfig.validator && wrapperProps[propName] !== undefined) {
        const isValid = propConfig.validator(wrapperProps[propName])
        expect(isValid, `Prop "${propName}" should pass validation`).toBe(true)
      }
    })
  }
}

/**
 * API assertion helpers
 */
export class APIAssertions {
  /**
   * Assert API response has correct structure
   * @param {Object} response - API response
   * @param {Object} expectedStructure - Expected response structure
   */
  static hasStructure(response, expectedStructure) {
    Object.keys(expectedStructure).forEach(key => {
      expect(response, `Response should have property: "${key}"`).toHaveProperty(key)
      
      if (typeof expectedStructure[key] === 'object' && expectedStructure[key] !== null) {
        this.hasStructure(response[key], expectedStructure[key])
      }
    })
  }

  /**
   * Assert paginated response structure
   * @param {Object} response - API response
   */
  static isPaginated(response) {
    expect(response, 'Response should have data property').toHaveProperty('data')
    expect(response, 'Response should have pagination property').toHaveProperty('pagination')
    
    const { pagination } = response
    expect(pagination, 'Pagination should have page').toHaveProperty('page')
    expect(pagination, 'Pagination should have limit').toHaveProperty('limit')
    expect(pagination, 'Pagination should have total').toHaveProperty('total')
    expect(pagination.page, 'Page should be a number').toBeTypeOf('number')
    expect(pagination.limit, 'Limit should be a number').toBeTypeOf('number')
    expect(pagination.total, 'Total should be a number').toBeTypeOf('number')
  }

  /**
   * Assert error response structure
   * @param {Object} response - API error response
   * @param {number} expectedStatus - Expected status code
   */
  static isError(response, expectedStatus = undefined) {
    expect(response, 'Response should have error property').toHaveProperty('error')
    
    const { error } = response
    expect(error, 'Error should have message').toHaveProperty('message')
    expect(error.message, 'Error message should be a string').toBeTypeOf('string')
    
    if (expectedStatus !== undefined) {
      expect(error, 'Error should have status').toHaveProperty('status')
      expect(error.status, `Error status should be ${expectedStatus}`).toBe(expectedStatus)
    }
  }
}

/**
 * Form assertion helpers
 */
export class FormAssertions {
  /**
   * Assert form field has validation error
   * @param {Object} wrapper - Component wrapper
   * @param {string} fieldName - Field name or selector
   * @param {string} expectedError - Expected error message
   */
  static hasValidationError(wrapper, fieldName, expectedError = undefined) {
    const errorSelector = `[data-testid="${fieldName}-error"], .error[data-field="${fieldName}"], .field-error`
    const errorElement = wrapper.find(errorSelector)
    
    expect(errorElement.exists(), `Field "${fieldName}" should have validation error`).toBe(true)
    
    if (expectedError !== undefined) {
      expect(errorElement.text(), `Validation error should match expected message`).toContain(expectedError)
    }
  }

  /**
   * Assert form is in loading state
   * @param {Object} wrapper - Component wrapper
   */
  static isLoading(wrapper) {
    const submitButton = wrapper.find('[type="submit"], button[type="submit"]')
    const form = wrapper.find('form')
    
    // Check for disabled submit button
    if (submitButton.exists()) {
      expect(submitButton.attributes('disabled'), 'Submit button should be disabled during loading').toBeDefined()
    }
    
    // Check for loading class or attribute
    const hasLoadingState = form.classes().includes('loading') || 
                           form.attributes('data-loading') === 'true' ||
                           wrapper.find('[data-testid="loading"]').exists()
    
    expect(hasLoadingState, 'Form should be in loading state').toBe(true)
  }

  /**
   * Assert form fields are populated correctly
   * @param {Object} wrapper - Component wrapper
   * @param {Object} expectedData - Expected form data
   */
  static hasFormData(wrapper, expectedData) {
    Object.entries(expectedData).forEach(([fieldName, expectedValue]) => {
      const field = wrapper.find(`[name="${fieldName}"], [data-testid="${fieldName}"]`)
      expect(field.exists(), `Form field "${fieldName}" should exist`).toBe(true)
      
      const actualValue = field.element.value || field.element.textContent
      expect(actualValue, `Field "${fieldName}" should have expected value`).toBe(String(expectedValue))
    })
  }
}

/**
 * Custom matchers for Vitest
 */
export const customMatchers = {
  toBeAccessible(received) {
    try {
      A11yAssertions.hasAriaLabels(received)
      A11yAssertions.hasImageAltText(received)
      return {
        pass: true,
        message: () => 'Element is accessible'
      }
    } catch (error) {
      return {
        pass: false,
        message: () => `Element is not accessible: ${error.message}`
      }
    }
  },

  toRenderWithoutErrors(received) {
    try {
      ComponentAssertions.rendersWithoutErrors(received)
      return {
        pass: true,
        message: () => 'Component renders without errors'
      }
    } catch (error) {
      return {
        pass: false,
        message: () => `Component has rendering errors: ${error.message}`
      }
    }
  },

  toHaveValidProps(received, component) {
    try {
      ComponentAssertions.hasValidProps(received, component)
      return {
        pass: true,
        message: () => 'Component has valid props'
      }
    } catch (error) {
      return {
        pass: false,
        message: () => `Component has invalid props: ${error.message}`
      }
    }
  }
}

/**
 * BDD-style expectation wrapper
 */
export class BDDExpectations {
  constructor(subject) {
    this.subject = subject
  }

  /**
   * Component should render
   */
  toRender() {
    ComponentAssertions.rendersWithoutErrors(this.subject)
    return this
  }

  /**
   * Component should contain text
   * @param {string} text - Text to find
   */
  toContain(text) {
    ComponentAssertions.containsText(this.subject, text)
    return this
  }

  /**
   * Component should have CSS class
   * @param {string} className - CSS class name
   */
  toHaveClass(className) {
    ComponentAssertions.hasClass(this.subject, className)
    return this
  }

  /**
   * Component should emit event
   * @param {string} eventName - Event name
   * @param {*} payload - Expected payload
   */
  toEmit(eventName, payload) {
    ComponentAssertions.emittedEvent(this.subject, eventName, payload)
    return this
  }

  /**
   * Component should be accessible
   */
  toBeAccessible() {
    A11yAssertions.hasAriaLabels(this.subject)
    A11yAssertions.hasImageAltText(this.subject)
    return this
  }
}

/**
 * Create BDD-style expectation
 * @param {*} subject - Subject to test
 * @returns {BDDExpectations} BDD expectations wrapper
 */
export function should(subject) {
  return new BDDExpectations(subject)
}

/**
 * Export all assertion classes
 */
export {
  A11yAssertions as a11y,
  PerformanceAssertions as performance,
  ComponentAssertions as component,
  APIAssertions as api,
  FormAssertions as form
}