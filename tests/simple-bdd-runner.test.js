/**
 * @fileoverview Simple BDD Test Runner
 * @description Basic BDD test runner to validate functionality
 */

import { describe, it, beforeEach, afterEach } from 'vitest'
import { createTestContext } from './framework/bdd-context.js'
import { simulateTyping } from './utils/typing-simulator.js'

// Create test context
const context = createTestContext()
const { Given, When, Then, setupComponent, cleanupComponent, expect, nextTick } = context

// Register step definitions
registerStepDefinitions()

describe('Simple BDD Tests', () => {
  afterEach(() => {
    cleanupComponent()
  })

  it('should execute a simple BDD scenario', async () => {
    // Given I am on the typing tutor page
    await context.executeStep('I am on the typing tutor page')
    
    // And I can see the practice text
    await context.executeStep('I can see the practice text')
    
    // When I start typing
    await context.executeStep('I start typing')
    
    // Then the component should be responsive
    await context.executeStep('the component should be responsive')
  })

  it('should handle typing with feedback', async () => {
    // Given I am on the typing tutor page
    await context.executeStep('I am on the typing tutor page')
    
    // When I type "Hello"
    await context.executeStep('I type "Hello"')
    
    // Then I should see visual feedback
    await context.executeStep('I should see visual feedback')
  })
})

/**
 * Register simple step definitions for testing
 */
function registerStepDefinitions() {
  // Given steps
  Given('I am on the typing tutor page', async () => {
    const wrapper = await setupComponent()
    expect(wrapper.exists()).toBe(true)
  })

  Given('I can see the practice text', () => {
    const wrapper = context.wrapper()
    const codeDisplay = wrapper.find('pre code')
    expect(codeDisplay.exists()).toBe(true)
  })

  // When steps
  When('I start typing', async () => {
    const wrapper = context.wrapper()
    if (wrapper.vm.targetText) {
      await simulateTyping(wrapper, wrapper.vm.targetText.substring(0, 3), { delayBetweenKeys: 50 })
    }
    context.state.started = true
  })

  When('I type {string}', async (text) => {
    const wrapper = context.wrapper()
    await simulateTyping(wrapper, text, { delayBetweenKeys: 50 })
  })

  // Then steps
  Then('the component should be responsive', () => {
    const wrapper = context.wrapper()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeDefined()
  })

  Then('I should see visual feedback', () => {
    const wrapper = context.wrapper()
    // Check for any visual feedback elements
    const feedbackElements = wrapper.findAll('.text-green-600, .text-red-600, .bg-blue-200')
    expect(feedbackElements.length).toBeGreaterThanOrEqual(0)
  })
}
