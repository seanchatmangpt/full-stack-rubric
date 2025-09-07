/**
 * BDD Step Generators for Component Interactions
 * Handles clicking, typing, form interactions, and component state
 * @module component-steps
 */

import { registerStepGenerator } from './step-generators.js'

/**
 * Component step generator class
 */
class ComponentStepGenerator {
  constructor() {
    this.patterns = new Map()
  }

  /**
   * Register all component-related step generators
   */
  registerSteps() {
    // Click interactions
    registerStepGenerator('click-button', {
      pattern: 'I click (?:the|on) "([^"]*)" button',
      type: 'When',
      generator: this.generateClickButton.bind(this),
      tags: ['component', 'interaction', 'click'],
      metadata: { description: 'Click a button by text or data-testid' }
    })

    registerStepGenerator('click-link', {
      pattern: 'I click (?:the|on) "([^"]*)" link',
      type: 'When', 
      generator: this.generateClickLink.bind(this),
      tags: ['component', 'interaction', 'navigation'],
      metadata: { description: 'Click a link by text or href' }
    })

    registerStepGenerator('click-element', {
      pattern: 'I click (?:the|on) element "([^"]*)"',
      type: 'When',
      generator: this.generateClickElement.bind(this),
      tags: ['component', 'interaction', 'generic'],
      metadata: { description: 'Click any element by selector' }
    })

    // Form interactions
    registerStepGenerator('fill-input', {
      pattern: 'I (?:fill|enter|type) "([^"]*)" (?:in|into) (?:the )?(?:"([^"]*)"|([^"]*)) (?:field|input)',
      type: 'When',
      generator: this.generateFillInput.bind(this),
      tags: ['component', 'form', 'input'],
      metadata: { description: 'Fill input field with value' }
    })

    registerStepGenerator('clear-input', {
      pattern: 'I clear (?:the )?(?:"([^"]*)"|([^"]*)) (?:field|input)',
      type: 'When',
      generator: this.generateClearInput.bind(this),
      tags: ['component', 'form', 'input'],
      metadata: { description: 'Clear input field value' }
    })

    registerStepGenerator('select-option', {
      pattern: 'I select "([^"]*)" from (?:the )?(?:"([^"]*)"|([^"]*)) (?:dropdown|select)',
      type: 'When',
      generator: this.generateSelectOption.bind(this),
      tags: ['component', 'form', 'select'],
      metadata: { description: 'Select option from dropdown' }
    })

    registerStepGenerator('check-checkbox', {
      pattern: 'I (?:check|tick) (?:the )?(?:"([^"]*)"|([^"]*)) checkbox',
      type: 'When',
      generator: this.generateCheckCheckbox.bind(this),
      tags: ['component', 'form', 'checkbox'],
      metadata: { description: 'Check a checkbox' }
    })

    registerStepGenerator('uncheck-checkbox', {
      pattern: 'I (?:uncheck|untick) (?:the )?(?:"([^"]*)"|([^"]*)) checkbox',
      type: 'When',
      generator: this.generateUncheckCheckbox.bind(this),
      tags: ['component', 'form', 'checkbox'],
      metadata: { description: 'Uncheck a checkbox' }
    })

    // Component state verification
    registerStepGenerator('should-see-text', {
      pattern: 'I should see (?:the )?text "([^"]*)"',
      type: 'Then',
      generator: this.generateShouldSeeText.bind(this),
      tags: ['component', 'verification', 'text'],
      metadata: { description: 'Verify text is visible on page' }
    })

    registerStepGenerator('should-not-see-text', {
      pattern: 'I should not see (?:the )?text "([^"]*)"',
      type: 'Then',
      generator: this.generateShouldNotSeeText.bind(this),
      tags: ['component', 'verification', 'text'],
      metadata: { description: 'Verify text is not visible on page' }
    })

    registerStepGenerator('should-see-element', {
      pattern: 'I should see (?:the|an?) "([^"]*)" (?:element|component)',
      type: 'Then',
      generator: this.generateShouldSeeElement.bind(this),
      tags: ['component', 'verification', 'element'],
      metadata: { description: 'Verify element is visible' }
    })

    registerStepGenerator('should-not-see-element', {
      pattern: 'I should not see (?:the|an?) "([^"]*)" (?:element|component)',
      type: 'Then',
      generator: this.generateShouldNotSeeElement.bind(this),
      tags: ['component', 'verification', 'element'],
      metadata: { description: 'Verify element is not visible' }
    })

    registerStepGenerator('element-should-be-enabled', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) (?:element|button|input) should be enabled',
      type: 'Then',
      generator: this.generateElementShouldBeEnabled.bind(this),
      tags: ['component', 'verification', 'state'],
      metadata: { description: 'Verify element is enabled' }
    })

    registerStepGenerator('element-should-be-disabled', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) (?:element|button|input) should be disabled',
      type: 'Then',
      generator: this.generateElementShouldBeDisabled.bind(this),
      tags: ['component', 'verification', 'state'],
      metadata: { description: 'Verify element is disabled' }
    })

    // Component props and events
    registerStepGenerator('component-should-emit', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) component should emit "([^"]*)" event',
      type: 'Then',
      generator: this.generateComponentShouldEmit.bind(this),
      tags: ['component', 'events', 'verification'],
      metadata: { description: 'Verify component emits specific event' }
    })

    registerStepGenerator('component-should-have-prop', {
      pattern: '(?:the )?(?:"([^"]*)"|([^"]*)) component should have prop "([^"]*)" with value "([^"]*)"',
      type: 'Then',
      generator: this.generateComponentShouldHaveProp.bind(this),
      tags: ['component', 'props', 'verification'],
      metadata: { description: 'Verify component has prop with specific value' }
    })

    // Hover and focus interactions
    registerStepGenerator('hover-element', {
      pattern: 'I hover over (?:the )?(?:"([^"]*)"|([^"]*)) (?:element|component)',
      type: 'When',
      generator: this.generateHoverElement.bind(this),
      tags: ['component', 'interaction', 'hover'],
      metadata: { description: 'Hover over an element' }
    })

    registerStepGenerator('focus-element', {
      pattern: 'I focus (?:on )?(?:the )?(?:"([^"]*)"|([^"]*)) (?:element|input|field)',
      type: 'When',
      generator: this.generateFocusElement.bind(this),
      tags: ['component', 'interaction', 'focus'],
      metadata: { description: 'Focus on an element' }
    })
  }

  /**
   * Generate click button step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateClickButton(match, options) {
    const [, buttonText] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.getByRole('button', { name: '${buttonText}' }).click()`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
await wrapper.find('[data-testid="${this.kebabCase(buttonText)}"]').trigger('click')
// Or find by text if no data-testid
const button = wrapper.findAll('button').find(btn => btn.text().includes('${buttonText}'))
if (button) await button.trigger('click')
else throw new Error('Button "${buttonText}" not found')`
  }

  /**
   * Generate click link step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateClickLink(match, options) {
    const [, linkText] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.getByRole('link', { name: '${linkText}' }).click()`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const link = wrapper.find('a[href*="${linkText}"], a:contains("${linkText}")')
if (link.exists()) await link.trigger('click')
else throw new Error('Link "${linkText}" not found')`
  }

  /**
   * Generate click element step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateClickElement(match, options) {
    const [, selector] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.locator('${selector}').click()`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const element = wrapper.find('${selector}')
if (element.exists()) await element.trigger('click')
else throw new Error('Element "${selector}" not found')`
  }

  /**
   * Generate fill input step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateFillInput(match, options) {
    const [, value, fieldName1, fieldName2] = match
    const fieldName = fieldName1 || fieldName2
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.getByLabel('${fieldName}').fill('${value}')
// Or by placeholder
await page.getByPlaceholder('${fieldName}').fill('${value}')`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const input = wrapper.find('[data-testid="${this.kebabCase(fieldName)}"], input[name="${fieldName}"], input[placeholder*="${fieldName}"]')
if (input.exists()) {
  await input.setValue('${value}')
  await input.trigger('input')
} else {
  throw new Error('Input field "${fieldName}" not found')
}`
  }

  /**
   * Generate clear input step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateClearInput(match, options) {
    const [, fieldName1, fieldName2] = match
    const fieldName = fieldName1 || fieldName2
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.getByLabel('${fieldName}').clear()`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const input = wrapper.find('[data-testid="${this.kebabCase(fieldName)}"], input[name="${fieldName}"]')
if (input.exists()) {
  await input.setValue('')
  await input.trigger('input')
} else {
  throw new Error('Input field "${fieldName}" not found')
}`
  }

  /**
   * Generate select option step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateSelectOption(match, options) {
    const [, optionValue, selectName1, selectName2] = match
    const selectName = selectName1 || selectName2
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.getByLabel('${selectName}').selectOption('${optionValue}')`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const select = wrapper.find('select[name="${selectName}"], [data-testid="${this.kebabCase(selectName)}"] select')
if (select.exists()) {
  await select.setValue('${optionValue}')
  await select.trigger('change')
} else {
  throw new Error('Select "${selectName}" not found')
}`
  }

  /**
   * Generate check checkbox step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateCheckCheckbox(match, options) {
    const [, checkboxName1, checkboxName2] = match
    const checkboxName = checkboxName1 || checkboxName2
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.getByLabel('${checkboxName}').check()`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const checkbox = wrapper.find('input[type="checkbox"][name="${checkboxName}"], [data-testid="${this.kebabCase(checkboxName)}"] input[type="checkbox"]')
if (checkbox.exists()) {
  await checkbox.setChecked(true)
  await checkbox.trigger('change')
} else {
  throw new Error('Checkbox "${checkboxName}" not found')
}`
  }

  /**
   * Generate uncheck checkbox step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateUncheckCheckbox(match, options) {
    const [, checkboxName1, checkboxName2] = match
    const checkboxName = checkboxName1 || checkboxName2
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.getByLabel('${checkboxName}').uncheck()`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const checkbox = wrapper.find('input[type="checkbox"][name="${checkboxName}"], [data-testid="${this.kebabCase(checkboxName)}"] input[type="checkbox"]')
if (checkbox.exists()) {
  await checkbox.setChecked(false)
  await checkbox.trigger('change')
} else {
  throw new Error('Checkbox "${checkboxName}" not found')
}`
  }

  /**
   * Generate should see text step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldSeeText(match, options) {
    const [, text] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await expect(page.getByText('${text}')).toBeVisible()`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
expect(wrapper.text()).toContain('${text}')`
  }

  /**
   * Generate should not see text step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldNotSeeText(match, options) {
    const [, text] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await expect(page.getByText('${text}')).not.toBeVisible()`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
expect(wrapper.text()).not.toContain('${text}')`
  }

  /**
   * Generate should see element step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldSeeElement(match, options) {
    const [, elementName] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await expect(page.locator('[data-testid="${this.kebabCase(elementName)}"]')).toBeVisible()`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const element = wrapper.find('[data-testid="${this.kebabCase(elementName)}"]')
expect(element.exists()).toBe(true)
expect(element.isVisible()).toBe(true)`
  }

  /**
   * Generate should not see element step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldNotSeeElement(match, options) {
    const [, elementName] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await expect(page.locator('[data-testid="${this.kebabCase(elementName)}"]')).not.toBeVisible()`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const element = wrapper.find('[data-testid="${this.kebabCase(elementName)}"]')
expect(element.exists()).toBe(false)`
  }

  /**
   * Generate element should be enabled step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateElementShouldBeEnabled(match, options) {
    const [, elementName1, elementName2] = match
    const elementName = elementName1 || elementName2
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await expect(page.locator('[data-testid="${this.kebabCase(elementName)}"]')).toBeEnabled()`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const element = wrapper.find('[data-testid="${this.kebabCase(elementName)}"]')
expect(element.attributes('disabled')).toBeFalsy()`
  }

  /**
   * Generate element should be disabled step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateElementShouldBeDisabled(match, options) {
    const [, elementName1, elementName2] = match
    const elementName = elementName1 || elementName2
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await expect(page.locator('[data-testid="${this.kebabCase(elementName)}"]')).toBeDisabled()`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const element = wrapper.find('[data-testid="${this.kebabCase(elementName)}"]')
expect(element.attributes('disabled')).toBeTruthy()`
  }

  /**
   * Generate component should emit step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateComponentShouldEmit(match, options) {
    const [, componentName1, componentName2, eventName] = match
    const componentName = componentName1 || componentName2
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const component = wrapper.findComponent({ name: '${componentName}' })
expect(component.emitted('${eventName}')).toBeTruthy()
expect(component.emitted('${eventName}').length).toBeGreaterThan(0)`
  }

  /**
   * Generate component should have prop step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateComponentShouldHaveProp(match, options) {
    const [, componentName1, componentName2, propName, propValue] = match
    const componentName = componentName1 || componentName2
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const component = wrapper.findComponent({ name: '${componentName}' })
expect(component.props('${propName}')).toBe('${propValue}')`
  }

  /**
   * Generate hover element step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateHoverElement(match, options) {
    const [, elementName1, elementName2] = match
    const elementName = elementName1 || elementName2
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.locator('[data-testid="${this.kebabCase(elementName)}"]').hover()`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const element = wrapper.find('[data-testid="${this.kebabCase(elementName)}"]')
await element.trigger('mouseenter')
await element.trigger('mouseover')`
  }

  /**
   * Generate focus element step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateFocusElement(match, options) {
    const [, elementName1, elementName2] = match
    const elementName = elementName1 || elementName2
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.locator('[data-testid="${this.kebabCase(elementName)}"]').focus()`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const element = wrapper.find('[data-testid="${this.kebabCase(elementName)}"]')
await element.trigger('focus')`
  }

  /**
   * Convert string to kebab-case for data-testid attributes
   * @param {string} str - String to convert
   * @returns {string} Kebab-case string
   */
  kebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase()
  }
}

export const componentStepGenerator = new ComponentStepGenerator()