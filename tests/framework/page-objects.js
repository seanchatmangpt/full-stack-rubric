/**
 * Page object model generators for Nuxt pages
 * Provides high-level API for interacting with pages and components
 */

import { mountWithExpectations } from './core-utils.js'
import { nextTick } from 'vue'
import { expect } from 'vitest'

/**
 * Base page object class with common functionality
 */
export class PageObject {
  constructor(wrapper) {
    this.wrapper = wrapper
    this.selectors = {}
    this.actions = {}
    this.validations = {}
  }

  /**
   * Find element by selector
   * @param {string} selector - CSS selector or registered name
   * @returns {Object} Vue test utils wrapper
   */
  find(selector) {
    const actualSelector = this.selectors[selector] || selector
    return this.wrapper.find(actualSelector)
  }

  /**
   * Find all elements by selector
   * @param {string} selector - CSS selector or registered name
   * @returns {Array} Array of Vue test utils wrappers
   */
  findAll(selector) {
    const actualSelector = this.selectors[selector] || selector
    return this.wrapper.findAll(actualSelector)
  }

  /**
   * Check if element exists
   * @param {string} selector - CSS selector or registered name
   * @returns {boolean} Whether element exists
   */
  exists(selector) {
    return this.find(selector).exists()
  }

  /**
   * Get element text
   * @param {string} selector - CSS selector or registered name
   * @returns {string} Element text content
   */
  text(selector) {
    return this.find(selector).text()
  }

  /**
   * Click element
   * @param {string} selector - CSS selector or registered name
   * @returns {Promise<PageObject>} Page object for chaining
   */
  async click(selector) {
    await this.find(selector).trigger('click')
    await nextTick()
    return this
  }

  /**
   * Type text into input
   * @param {string} selector - CSS selector or registered name
   * @param {string} text - Text to type
   * @returns {Promise<PageObject>} Page object for chaining
   */
  async type(selector, text) {
    const input = this.find(selector)
    await input.setValue(text)
    await input.trigger('input')
    await nextTick()
    return this
  }

  /**
   * Select option from dropdown
   * @param {string} selector - CSS selector or registered name
   * @param {string} value - Option value to select
   * @returns {Promise<PageObject>} Page object for chaining
   */
  async select(selector, value) {
    const select = this.find(selector)
    await select.setValue(value)
    await select.trigger('change')
    await nextTick()
    return this
  }

  /**
   * Submit form
   * @param {string} selector - Form selector (optional)
   * @returns {Promise<PageObject>} Page object for chaining
   */
  async submit(selector = 'form') {
    await this.find(selector).trigger('submit')
    await nextTick()
    return this
  }

  /**
   * Wait for element to appear
   * @param {string} selector - CSS selector or registered name
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<PageObject>} Page object for chaining
   */
  async waitFor(selector, timeout = 1000) {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      if (this.exists(selector)) {
        return this
      }
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    throw new Error(`Element ${selector} not found within ${timeout}ms`)
  }

  /**
   * Wait for element to disappear
   * @param {string} selector - CSS selector or registered name
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<PageObject>} Page object for chaining
   */
  async waitForDisappear(selector, timeout = 1000) {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      if (!this.exists(selector)) {
        return this
      }
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    throw new Error(`Element ${selector} still exists after ${timeout}ms`)
  }

  /**
   * Assert element contains text
   * @param {string} selector - CSS selector or registered name
   * @param {string} text - Expected text
   * @returns {PageObject} Page object for chaining
   */
  shouldContain(selector, text) {
    expect(this.text(selector)).toContain(text)
    return this
  }

  /**
   * Assert element has specific text
   * @param {string} selector - CSS selector or registered name
   * @param {string} text - Expected exact text
   * @returns {PageObject} Page object for chaining
   */
  shouldHaveText(selector, text) {
    expect(this.text(selector)).toBe(text)
    return this
  }

  /**
   * Assert element exists
   * @param {string} selector - CSS selector or registered name
   * @returns {PageObject} Page object for chaining
   */
  shouldExist(selector) {
    expect(this.exists(selector)).toBe(true)
    return this
  }

  /**
   * Assert element does not exist
   * @param {string} selector - CSS selector or registered name
   * @returns {PageObject} Page object for chaining
   */
  shouldNotExist(selector) {
    expect(this.exists(selector)).toBe(false)
    return this
  }

  /**
   * Get URL from router
   * @returns {string} Current route path
   */
  getCurrentPath() {
    return this.wrapper.vm.$route?.path || '/'
  }

  /**
   * Navigate to path
   * @param {string} path - Path to navigate to
   * @returns {Promise<PageObject>} Page object for chaining
   */
  async navigateTo(path) {
    await this.wrapper.vm.$router?.push(path)
    await nextTick()
    return this
  }
}

/**
 * Form page object with form-specific methods
 */
export class FormPageObject extends PageObject {
  constructor(wrapper) {
    super(wrapper)
    this.fields = {}
    this.validationMessages = {}
  }

  /**
   * Register form field selector
   * @param {string} name - Field name
   * @param {string} selector - Field selector
   * @returns {FormPageObject} Form page object
   */
  withField(name, selector) {
    this.fields[name] = selector
    return this
  }

  /**
   * Register validation message selector
   * @param {string} field - Field name
   * @param {string} selector - Validation message selector
   * @returns {FormPageObject} Form page object
   */
  withValidation(field, selector) {
    this.validationMessages[field] = selector
    return this
  }

  /**
   * Fill form field
   * @param {string} field - Field name
   * @param {string} value - Field value
   * @returns {Promise<FormPageObject>} Form page object for chaining
   */
  async fillField(field, value) {
    const selector = this.fields[field] || field
    await this.type(selector, value)
    return this
  }

  /**
   * Fill multiple fields
   * @param {Object} data - Object mapping field names to values
   * @returns {Promise<FormPageObject>} Form page object for chaining
   */
  async fillForm(data) {
    for (const [field, value] of Object.entries(data)) {
      await this.fillField(field, value)
    }
    return this
  }

  /**
   * Clear form field
   * @param {string} field - Field name
   * @returns {Promise<FormPageObject>} Form page object for chaining
   */
  async clearField(field) {
    const selector = this.fields[field] || field
    await this.type(selector, '')
    return this
  }

  /**
   * Get field value
   * @param {string} field - Field name
   * @returns {string} Field value
   */
  getFieldValue(field) {
    const selector = this.fields[field] || field
    const element = this.find(selector)
    return element.element.value || element.text()
  }

  /**
   * Check if field has error
   * @param {string} field - Field name
   * @returns {boolean} Whether field has validation error
   */
  hasFieldError(field) {
    const selector = this.validationMessages[field]
    return selector ? this.exists(selector) : false
  }

  /**
   * Get field error message
   * @param {string} field - Field name
   * @returns {string} Error message
   */
  getFieldError(field) {
    const selector = this.validationMessages[field]
    return selector ? this.text(selector) : ''
  }

  /**
   * Assert field has specific error
   * @param {string} field - Field name
   * @param {string} message - Expected error message
   * @returns {FormPageObject} Form page object for chaining
   */
  shouldHaveFieldError(field, message) {
    expect(this.hasFieldError(field)).toBe(true)
    if (message) {
      expect(this.getFieldError(field)).toContain(message)
    }
    return this
  }

  /**
   * Assert form is valid (no errors)
   * @returns {FormPageObject} Form page object for chaining
   */
  shouldBeValid() {
    for (const field of Object.keys(this.validationMessages)) {
      expect(this.hasFieldError(field)).toBe(false)
    }
    return this
  }
}

/**
 * List page object for handling lists and tables
 */
export class ListPageObject extends PageObject {
  constructor(wrapper) {
    super(wrapper)
    this.itemSelector = ''
    this.itemActions = {}
  }

  /**
   * Set item selector
   * @param {string} selector - Selector for list items
   * @returns {ListPageObject} List page object
   */
  withItems(selector) {
    this.itemSelector = selector
    return this
  }

  /**
   * Register item action
   * @param {string} name - Action name
   * @param {string} selector - Action selector (relative to item)
   * @returns {ListPageObject} List page object
   */
  withItemAction(name, selector) {
    this.itemActions[name] = selector
    return this
  }

  /**
   * Get all items
   * @returns {Array} Array of item wrappers
   */
  getItems() {
    return this.findAll(this.itemSelector)
  }

  /**
   * Get item count
   * @returns {number} Number of items
   */
  getItemCount() {
    return this.getItems().length
  }

  /**
   * Get specific item by index
   * @param {number} index - Item index
   * @returns {Object} Item wrapper
   */
  getItem(index) {
    const items = this.getItems()
    if (index >= items.length) {
      throw new Error(`Item at index ${index} not found. Only ${items.length} items exist.`)
    }
    return items[index]
  }

  /**
   * Get item by text content
   * @param {string} text - Text to search for
   * @returns {Object|null} Item wrapper or null if not found
   */
  getItemByText(text) {
    const items = this.getItems()
    return items.find(item => item.text().includes(text)) || null
  }

  /**
   * Perform action on specific item
   * @param {number} index - Item index
   * @param {string} action - Action name
   * @returns {Promise<ListPageObject>} List page object for chaining
   */
  async performItemAction(index, action) {
    const item = this.getItem(index)
    const actionSelector = this.itemActions[action]
    
    if (!actionSelector) {
      throw new Error(`Action ${action} not registered`)
    }

    const actionElement = item.find(actionSelector)
    await actionElement.trigger('click')
    await nextTick()
    return this
  }

  /**
   * Assert list has specific number of items
   * @param {number} count - Expected count
   * @returns {ListPageObject} List page object for chaining
   */
  shouldHaveItemCount(count) {
    expect(this.getItemCount()).toBe(count)
    return this
  }

  /**
   * Assert list contains item with text
   * @param {string} text - Text to search for
   * @returns {ListPageObject} List page object for chaining
   */
  shouldContainItem(text) {
    expect(this.getItemByText(text)).toBeTruthy()
    return this
  }
}

/**
 * Navigation page object for handling navigation components
 */
export class NavigationPageObject extends PageObject {
  constructor(wrapper) {
    super(wrapper)
    this.links = {}
    this.dropdowns = {}
  }

  /**
   * Register navigation link
   * @param {string} name - Link name
   * @param {string} selector - Link selector
   * @returns {NavigationPageObject} Navigation page object
   */
  withLink(name, selector) {
    this.links[name] = selector
    return this
  }

  /**
   * Register dropdown menu
   * @param {string} name - Dropdown name
   * @param {Object} config - Dropdown configuration
   * @returns {NavigationPageObject} Navigation page object
   */
  withDropdown(name, config) {
    this.dropdowns[name] = config
    return this
  }

  /**
   * Click navigation link
   * @param {string} linkName - Link name
   * @returns {Promise<NavigationPageObject>} Navigation page object for chaining
   */
  async clickLink(linkName) {
    const selector = this.links[linkName]
    if (!selector) {
      throw new Error(`Link ${linkName} not registered`)
    }
    await this.click(selector)
    return this
  }

  /**
   * Open dropdown menu
   * @param {string} dropdownName - Dropdown name
   * @returns {Promise<NavigationPageObject>} Navigation page object for chaining
   */
  async openDropdown(dropdownName) {
    const config = this.dropdowns[dropdownName]
    if (!config) {
      throw new Error(`Dropdown ${dropdownName} not registered`)
    }
    
    await this.click(config.trigger)
    await this.waitFor(config.menu)
    return this
  }

  /**
   * Click dropdown item
   * @param {string} dropdownName - Dropdown name
   * @param {string} itemName - Item name or selector
   * @returns {Promise<NavigationPageObject>} Navigation page object for chaining
   */
  async clickDropdownItem(dropdownName, itemName) {
    const config = this.dropdowns[dropdownName]
    if (!config) {
      throw new Error(`Dropdown ${dropdownName} not registered`)
    }

    await this.openDropdown(dropdownName)
    
    const itemSelector = config.items?.[itemName] || itemName
    await this.click(itemSelector)
    return this
  }

  /**
   * Assert active link
   * @param {string} linkName - Link name
   * @param {string} activeClass - Active CSS class
   * @returns {NavigationPageObject} Navigation page object for chaining
   */
  shouldHaveActiveLink(linkName, activeClass = 'active') {
    const selector = this.links[linkName]
    const element = this.find(selector)
    expect(element.classes()).toContain(activeClass)
    return this
  }
}

/**
 * Page object factory functions
 */

/**
 * Create basic page object
 * @param {Object} component - Vue component or wrapper
 * @param {Object} options - Mount options
 * @returns {Promise<PageObject>} Page object
 */
export async function createPageObject(component, options = {}) {
  const wrapper = component.wrapper ? component : await mountWithExpectations(component, options)
  return new PageObject(wrapper)
}

/**
 * Create form page object
 * @param {Object} component - Vue component or wrapper
 * @param {Object} options - Mount options
 * @returns {Promise<FormPageObject>} Form page object
 */
export async function createFormPageObject(component, options = {}) {
  const wrapper = component.wrapper ? component : await mountWithExpectations(component, options)
  return new FormPageObject(wrapper)
}

/**
 * Create list page object
 * @param {Object} component - Vue component or wrapper
 * @param {Object} options - Mount options
 * @returns {Promise<ListPageObject>} List page object
 */
export async function createListPageObject(component, options = {}) {
  const wrapper = component.wrapper ? component : await mountWithExpectations(component, options)
  return new ListPageObject(wrapper)
}

/**
 * Create navigation page object
 * @param {Object} component - Vue component or wrapper
 * @param {Object} options - Mount options
 * @returns {Promise<NavigationPageObject>} Navigation page object
 */
export async function createNavigationPageObject(component, options = {}) {
  const wrapper = component.wrapper ? component : await mountWithExpectations(component, options)
  return new NavigationPageObject(wrapper)
}

/**
 * Auto-generate page object based on component analysis
 * @param {Object} component - Vue component
 * @param {Object} options - Generation options
 * @returns {Promise<PageObject>} Generated page object
 */
export async function generatePageObject(component, options = {}) {
  const wrapper = await mountWithExpectations(component, options.mountOptions)
  
  // Analyze component to determine appropriate page object type
  const hasForm = wrapper.find('form').exists()
  const hasList = wrapper.findAll('[data-testid*="item"], .list-item, li').length > 0
  const hasNavigation = wrapper.find('nav').exists() || 
                       wrapper.findAll('a, [role="menuitem"]').length > 2

  if (hasForm) {
    const formPageObject = new FormPageObject(wrapper)
    
    // Auto-detect form fields
    const inputs = wrapper.findAll('input, textarea, select')
    inputs.forEach((input, index) => {
      const name = input.attributes('name') || 
                  input.attributes('id') || 
                  input.attributes('data-testid') || 
                  `field-${index}`
      
      formPageObject.withField(name, `[name="${name}"], #${name}, [data-testid="${name}"]`)
      
      // Look for validation messages
      const validationSelector = `[data-testid="${name}-error"], .error-${name}, .field-error`
      if (wrapper.find(validationSelector).exists()) {
        formPageObject.withValidation(name, validationSelector)
      }
    })
    
    return formPageObject
  }

  if (hasList) {
    const listPageObject = new ListPageObject(wrapper)
    
    // Auto-detect list items
    const itemSelectors = [
      '[data-testid*="item"]',
      '.list-item',
      'li',
      'tr',
      '.card'
    ]
    
    for (const selector of itemSelectors) {
      if (wrapper.find(selector).exists()) {
        listPageObject.withItems(selector)
        break
      }
    }
    
    return listPageObject
  }

  if (hasNavigation) {
    const navPageObject = new NavigationPageObject(wrapper)
    
    // Auto-detect navigation links
    const links = wrapper.findAll('a, [role="menuitem"]')
    links.forEach((link, index) => {
      const name = link.text().toLowerCase().replace(/\s+/g, '-') || `link-${index}`
      navPageObject.withLink(name, link.selector || `a:nth-child(${index + 1})`)
    })
    
    return navPageObject
  }

  // Default to basic page object
  return new PageObject(wrapper)
}

/**
 * Batch create multiple page objects
 * @param {Object} components - Object mapping names to components
 * @param {Object} options - Shared options
 * @returns {Promise<Object>} Object mapping names to page objects
 */
export async function createPageObjects(components, options = {}) {
  const pageObjects = {}
  
  for (const [name, component] of Object.entries(components)) {
    pageObjects[name] = await generatePageObject(component, {
      ...options,
      mountOptions: options.mountOptions?.[name] || options.mountOptions
    })
  }
  
  return pageObjects
}