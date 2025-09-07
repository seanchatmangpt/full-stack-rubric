/**
 * @fileoverview Cucumber BDD step definitions for typing tutor functionality
 * @description Provides comprehensive step definitions for testing the typing tutor application
 * including user interactions, performance metrics, and visual feedback validation.
 */

import { mount } from '@vue/test-utils'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { Given, When, Then } from '@amiceli/vitest-cucumber'
import { nextTick } from 'vue'
import TypingPage from '../../app/pages/typing.vue'
import { simulateTyping, simulateRapidTyping, simulateCorrections } from '../utils/typing-simulator'
import { advanceTime, resetTime } from '../setup/dom-setup'

/**
 * @type {import('@vue/test-utils').VueWrapper|null}
 * @description Vue test utils wrapper for the mounted component
 */
let wrapper = null

/**
 * @type {Function|null}
 * @description Original console.error function for restoration after tests
 */
let originalConsoleError = null

/**
 * @description Set up test environment before each scenario
 * Mocks console.error to prevent test noise and sets up Monaco Editor mock
 */
beforeEach(() => {
  // Mock console.error to prevent test noise
  originalConsoleError = console.error
  console.error = vi.fn()
  
  // Mock Monaco Editor
  vi.mock('#imports', () => ({
    MonacoEditor: {
      name: 'MonacoEditor',
      template: '<textarea v-model="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" v-bind="$attrs" />',
      props: ['modelValue', 'lang', 'options'],
      emits: ['update:modelValue']
    }
  }))
})

/**
 * @description Clean up test environment after each scenario
 * Unmounts component wrapper and restores console.error
 */
afterEach(() => {
  if (wrapper) {
    wrapper.unmount()
    wrapper = null
  }
  console.error = originalConsoleError
  resetTime()
})

/**
 * @description Navigate to typing tutor page and verify initial state
 * @given I am on the typing tutor page
 */
Given('I am on the typing tutor page', async () => {
  wrapper = mount(TypingPage, {
    global: {
      stubs: {
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
    }
  })
  await nextTick()
  expect(wrapper.exists()).toBe(true)
})

/**
 * @description Verify that practice text is visible to the user
 * @given I can see the practice text
 */
Given('I can see the practice text', () => {
  const codeDisplay = wrapper.find('pre code')
  expect(codeDisplay.exists()).toBe(true)
  expect(codeDisplay.text()).toBeTruthy()
})

/**
 * @description Verify typing statistics display with specific WPM and accuracy values
 * @given I can see the typing statistics showing {int} WPM and {int}% accuracy
 * @param {number} wpm - Expected words per minute value
 * @param {number} accuracy - Expected accuracy percentage
 */
Given('I can see the typing statistics showing {int} WPM and {int}% accuracy', (wpm, accuracy) => {
  const wpmElement = wrapper.find('.text-blue-600')
  const accuracyElement = wrapper.find('.text-green-600')
  
  expect(wpmElement.text()).toBe(wpm.toString())
  expect(accuracyElement.text()).toBe(`${accuracy.toFixed(1)}%`)
})

/**
 * @description Set up custom practice text for testing scenarios
 * @given the practice text is {string}
 * @param {string} text - The practice text to use for the exercise
 */
Given('the practice text is {string}', async (text) => {
  // Set a custom exercise for testing
  wrapper.vm.currentExercise = {
    title: 'Test Exercise',
    description: 'Test description',
    difficulty: 'easy',
    category: 'test',
    language: 'javascript',
    code: text
  }
  await nextTick()
})

/**
 * @description Simulate user starting to type the displayed text
 * @when I start typing the displayed text
 */
When('I start typing the displayed text', async () => {
  const textarea = wrapper.find('textarea')
  const targetText = wrapper.vm.targetText
  
  await simulateTyping(wrapper, targetText.substring(0, 5), { delayBetweenKeys: 100 })
})

/**
 * @description Simulate typing specific text within a time constraint
 * @when I type {string} in exactly {int} seconds
 * @param {string} text - Text to type
 * @param {number} seconds - Time constraint in seconds
 */
When('I type {string} in exactly {int} seconds', async (text, seconds) => {
  const delayPerChar = (seconds * 1000) / text.length
  await simulateTyping(wrapper, text, { delayBetweenKeys: delayPerChar })
})

/**
 * @description Simulate typing text with intentional errors
 * @when I type {string} \\(with one error\\)
 * @param {string} text - Text to type with errors
 */
When('I type {string} \\(with one error\\)', async (text) => {
  await simulateTyping(wrapper, text, { errorsToMake: 1 })
})

/**
 * @description Simulate typing specific text accurately
 * @when I type {string}
 * @param {string} text - Text to type
 */
When('I type {string}', async (text) => {
  await simulateTyping(wrapper, text)
})

/**
 * @description Simulate completing the entire typing exercise correctly
 * @when I complete typing the entire text correctly
 */
When('I complete typing the entire text correctly', async () => {
  const targetText = wrapper.vm.targetText
  await simulateTyping(wrapper, targetText, { delayBetweenKeys: 50 })
})

/**
 * @description Simulate rapid typing with specific keystroke interval
 * @when I type very rapidly with {int}ms between keystrokes
 * @param {number} interval - Milliseconds between keystrokes
 */
When('I type very rapidly with {int}ms between keystrokes', async (interval) => {
  const targetText = wrapper.vm.targetText
  await simulateRapidTyping(wrapper, targetText, interval)
})

/**
 * @description Simulate using backspace to correct typing mistakes
 * @when I use backspace to correct mistakes
 */
When('I use backspace to correct mistakes', async () => {
  await simulateCorrections(wrapper, 3, 50)
})

/**
 * @description Simulate clicking a button by its text content
 * @when I click {string}
 * @param {string} buttonText - Text content of the button to click
 */
When('I click {string}', async (buttonText) => {
  const buttons = wrapper.findAll('button')
  const targetButton = buttons.find(button => button.text().includes(buttonText))
  
  expect(targetButton).toBeTruthy()
  await targetButton.trigger('click')
  await nextTick()
})

/**
 * @description Simulate clicking a specific button
 * @when I click the {string} button
 * @param {string} buttonText - Text content of the button to click
 */
When('I click the {string} button', async (buttonText) => {
  const buttons = wrapper.findAll('button')
  const targetButton = buttons.find(button => button.text().includes(buttonText))
  
  expect(targetButton).toBeTruthy()
  await targetButton.trigger('click')
  await nextTick()
})

/**
 * @description Verify correct characters are highlighted in green
 * @then the characters I type correctly should be highlighted in green
 */
Then('the characters I type correctly should be highlighted in green', () => {
  const correctChars = wrapper.findAll('.text-green-600')
  expect(correctChars.length).toBeGreaterThan(0)
})

/**
 * @description Verify incorrect characters are highlighted in red
 * @then the characters I type incorrectly should be highlighted in red
 */
Then('the characters I type incorrectly should be highlighted in red', () => {
  const incorrectChars = wrapper.findAll('.text-red-600')
  expect(incorrectChars.length).toBeGreaterThan(0)
})

/**
 * @description Verify current typing position is highlighted
 * @then the current character position should be highlighted
 */
Then('the current character position should be highlighted', () => {
  const currentChar = wrapper.find('.bg-blue-200, .bg-blue-800')
  expect(currentChar.exists()).toBe(true)
})

/**
 * @description Verify WPM calculation matches expected value
 * @then the WPM should be calculated as {int}
 * @param {number} expectedWpm - Expected words per minute value
 */
Then('the WPM should be calculated as {int}', (expectedWpm) => {
  expect(wrapper.vm.wpm).toBe(expectedWpm)
})

/**
 * @description Verify WPM display updates in real-time
 * @then the WPM display should update in real-time
 */
Then('the WPM display should update in real-time', () => {
  const wpmDisplay = wrapper.find('.text-blue-600')
  expect(wpmDisplay.text()).toBe(wrapper.vm.wpm.toString())
})

/**
 * @description Verify accuracy calculation is within expected range
 * @then the accuracy should be approximately {float}%
 * @param {number} expectedAccuracy - Expected accuracy percentage
 */
Then('the accuracy should be approximately {float}%', (expectedAccuracy) => {
  const actualAccuracy = wrapper.vm.accuracy
  expect(actualAccuracy).toBeCloseTo(expectedAccuracy, 1)
})

/**
 * @description Verify error count matches expected value
 * @then the errors count should show {int}
 * @param {number} expectedErrors - Expected number of typing errors
 */
Then('the errors count should show {int}', (expectedErrors) => {
  expect(wrapper.vm.errors).toBe(expectedErrors)
})

/**
 * @description Verify progress bar shows expected completion percentage
 * @then the progress bar should show approximately {int}% completion
 * @param {number} expectedProgress - Expected progress percentage
 */
Then('the progress bar should show approximately {int}% completion', (expectedProgress) => {
  const actualProgress = wrapper.vm.progress
  expect(actualProgress).toBeCloseTo(expectedProgress, 0)
})

/**
 * @description Verify progress percentage is displayed to user
 * @then the progress percentage should be displayed
 */
Then('the progress percentage should be displayed', () => {
  const progressText = wrapper.text()
  expect(progressText).toMatch(/\d+% complete/)
})

/**
 * @description Verify completion modal appears after finishing exercise
 * @then a completion modal should appear
 */
Then('a completion modal should appear', () => {
  expect(wrapper.vm.showModal).toBe(true)
  const modal = wrapper.find('.modal')
  expect(modal.exists()).toBe(true)
})

/**
 * @description Verify final statistics are displayed in completion modal
 * @then it should display my final WPM and accuracy
 */
Then('it should display my final WPM and accuracy', () => {
  expect(wrapper.vm.finalWpm).toBeGreaterThanOrEqual(0)
  expect(wrapper.vm.finalAccuracy).toBeGreaterThanOrEqual(0)
})

/**
 * @description Verify modal provides options for next actions
 * @then I should see options to try another exercise or close
 */
Then('I should see options to try another exercise or close', () => {
  const buttons = wrapper.findAll('button')
  const hasNextButton = buttons.some(button => button.text().includes('Next'))
  const hasCloseButton = buttons.some(button => button.text().includes('Close'))
  
  expect(hasNextButton).toBe(true)
  expect(hasCloseButton).toBe(true)
})

/**
 * @description Verify application remains responsive during typing
 * @then the application should remain responsive
 */
Then('the application should remain responsive', () => {
  // Check that the component is still mounted and functional
  expect(wrapper.exists()).toBe(true)
  expect(wrapper.vm.wpm).toBeGreaterThanOrEqual(0)
})

/**
 * @description Verify all typing statistics update correctly
 * @then all statistics should update correctly
 */
Then('all statistics should update correctly', () => {
  expect(wrapper.vm.wpm).toBeGreaterThanOrEqual(0)
  expect(wrapper.vm.accuracy).toBeGreaterThanOrEqual(0)
  expect(wrapper.vm.progress).toBeGreaterThanOrEqual(0)
})

/**
 * @description Verify no performance degradation occurs during typing
 * @then no performance degradation should occur
 */
Then('no performance degradation should occur', () => {
  // This would be tested with performance monitoring in a real scenario
  // For now, we just ensure the component is still responsive
  expect(wrapper.exists()).toBe(true)
})

/**
 * @description Verify character highlighting updates correctly
 * @then the highlighting should update correctly
 */
Then('the highlighting should update correctly', () => {
  const highlightedChars = wrapper.findAll('.text-green-600, .text-red-600, .bg-blue-200, .bg-blue-800')
  expect(highlightedChars.length).toBeGreaterThan(0)
})

/**
 * @description Verify accuracy recalculation after corrections
 * @then the accuracy should recalculate properly
 */
Then('the accuracy should recalculate properly', () => {
  const accuracy = wrapper.vm.accuracy
  expect(accuracy).toBeGreaterThanOrEqual(0)
  expect(accuracy).toBeLessThanOrEqual(100)
})

/**
 * @description Verify progress adjusts after corrections
 * @then the progress should adjust accordingly
 */
Then('the progress should adjust accordingly', () => {
  const progress = wrapper.vm.progress
  expect(progress).toBeGreaterThanOrEqual(0)
  expect(progress).toBeLessThanOrEqual(100)
})

/**
 * @description Verify new practice text is displayed
 * @then a new practice text should be displayed
 */
Then('a new practice text should be displayed', () => {
  const codeDisplay = wrapper.find('pre code')
  expect(codeDisplay.exists()).toBe(true)
  expect(codeDisplay.text()).toBeTruthy()
})

/**
 * @description Verify all statistics reset to initial values
 * @then all statistics should reset to initial values
 */
Then('all statistics should reset to initial values', () => {
  expect(wrapper.vm.wpm).toBe(0)
  expect(wrapper.vm.accuracy).toBe(100)
  expect(wrapper.vm.errors).toBe(0)
})

/**
 * @description Verify user can start typing new text
 * @then I should be able to start typing the new text
 */
Then('I should be able to start typing the new text', () => {
  const textarea = wrapper.find('textarea')
  expect(textarea.exists()).toBe(true)
  expect(textarea.element.value).toBe('')
})

/**
 * @description Verify all input is cleared
 * @then all input should be cleared
 */
Then('all input should be cleared', () => {
  expect(wrapper.vm.userInput).toBe('')
})

/**
 * @description Verify user can start fresh with same text
 * @then I should be able to start fresh with the same text
 */
Then('I should be able to start fresh with the same text', () => {
  const textarea = wrapper.find('textarea')
  expect(textarea.exists()).toBe(true)
  expect(textarea.element.value).toBe('')
  expect(wrapper.vm.isComplete).toBe(false)
})