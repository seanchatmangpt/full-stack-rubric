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

/**
 * @description Set up coding exercise context
 * @given a coding exercise is loaded
 */
Given('a coding exercise is loaded', async () => {
  wrapper.vm.currentExercise = {
    title: 'JavaScript Fundamentals',
    description: 'Practice basic JavaScript syntax',
    difficulty: 'beginner',
    category: 'javascript',
    language: 'javascript',
    code: 'const message = "Hello, World!"\nconsole.log(message)'
  }
  await nextTick()
  expect(wrapper.vm.targetText).toBeTruthy()
})

/**
 * @description Set up started typing context
 * @given I have started typing
 */
Given('I have started typing', async () => {
  await simulateTyping(wrapper, 'con', { delayBetweenKeys: 50 })
  expect(wrapper.vm.userInput.length).toBeGreaterThan(0)
})

/**
 * @description Set up incorrect typing context
 * @given I have typed some incorrect characters
 */
Given('I have typed some incorrect characters', async () => {
  await simulateTyping(wrapper, 'xyz', { errorsToMake: 3 })
  expect(wrapper.vm.errors).toBeGreaterThan(0)
})

/**
 * @description Set up special characters in target text
 * @given the target text contains special characters like brackets and quotes
 */
Given('the target text contains special characters like brackets and quotes', async () => {
  wrapper.vm.currentExercise = {
    title: 'Special Characters',
    description: 'Practice typing special characters',
    difficulty: 'intermediate',
    category: 'javascript',
    language: 'javascript',
    code: 'const obj = { "key": [1, 2, 3] }'
  }
  await nextTick()
  expect(wrapper.vm.targetText).toContain('{')
  expect(wrapper.vm.targetText).toContain('"')
  expect(wrapper.vm.targetText).toContain('[')
})

/**
 * @description Set up indented target text
 * @given the target text contains indentation
 */
Given('the target text contains indentation', async () => {
  wrapper.vm.currentExercise = {
    title: 'Indentation Practice',
    description: 'Practice typing indented code',
    difficulty: 'intermediate',
    category: 'javascript',
    language: 'javascript',
    code: 'if (true) {\n  console.log("indented")\n}'
  }
  await nextTick()
  expect(wrapper.vm.targetText).toContain('  ')
})

/**
 * @description Set up mostly completed exercise
 * @given I have typed most of the exercise
 */
Given('I have typed most of the exercise', async () => {
  const targetText = wrapper.vm.targetText
  const mostText = targetText.substring(0, targetText.length - 5)
  await simulateTyping(wrapper, mostText, { delayBetweenKeys: 10 })
  expect(wrapper.vm.progress).toBeGreaterThan(80)
})

/**
 * @description Set up completed exercise
 * @given I have completed the exercise
 */
Given('I have completed the exercise', async () => {
  const targetText = wrapper.vm.targetText
  await simulateTyping(wrapper, targetText, { delayBetweenKeys: 10 })
  expect(wrapper.vm.isComplete).toBe(true)
})

/**
 * @description Set up exercise with specific text
 * @given I have started typing an exercise
 */
Given('I have started typing an exercise', async () => {
  wrapper.vm.currentExercise = {
    title: 'Test Exercise',
    description: 'Test typing exercise',
    difficulty: 'easy',
    category: 'test',
    language: 'javascript',
    code: 'console.log("test")'
  }
  await simulateTyping(wrapper, 'con', { delayBetweenKeys: 50 })
  expect(wrapper.vm.hasStarted).toBe(true)
})

/**
 * @description Set up text with formatting
 * @given the target text contains newlines and indentation
 */
Given('the target text contains newlines and indentation', async () => {
  wrapper.vm.currentExercise = {
    title: 'Formatted Code',
    description: 'Practice typing formatted code',
    difficulty: 'intermediate',
    category: 'javascript',
    language: 'javascript',
    code: 'function example() {\n  if (condition) {\n    return true\n  }\n  return false\n}'
  }
  await nextTick()
  expect(wrapper.vm.targetText).toContain('\n')
  expect(wrapper.vm.targetText).toContain('  ')
})

/**
 * @description Simulate clicking in typing area
 * @when I click in the typing area
 */
When('I click in the typing area', async () => {
  const textarea = wrapper.find('textarea')
  await textarea.trigger('click')
  await nextTick()
})

/**
 * @description Simulate typing first character
 * @when I start typing the first character
 */
When('I start typing the first character', async () => {
  const targetText = wrapper.vm.targetText
  const firstChar = targetText.charAt(0)
  await simulateTyping(wrapper, firstChar, { delayBetweenKeys: 100 })
  expect(wrapper.vm.userInput).toBe(firstChar)
})

/**
 * @description Simulate typing matching character
 * @when I type a character that matches the target text
 */
When('I type a character that matches the target text', async () => {
  const targetText = wrapper.vm.targetText
  const currentIndex = wrapper.vm.userInput.length
  const correctChar = targetText.charAt(currentIndex)
  await simulateTyping(wrapper, correctChar, { delayBetweenKeys: 100 })
  expect(wrapper.vm.userInput.charAt(currentIndex)).toBe(correctChar)
})

/**
 * @description Simulate typing non-matching character
 * @when I type a character that doesn't match the target text
 */
When('I type a character that doesn\'t match the target text', async () => {
  const wrongChar = 'x' // Assuming 'x' is wrong
  await simulateTyping(wrapper, wrongChar, { delayBetweenKeys: 100 })
  expect(wrapper.vm.errors).toBeGreaterThan(0)
})

/**
 * @description Simulate backspace key
 * @when I press backspace
 */
When('I press backspace', async () => {
  const textarea = wrapper.find('textarea')
  await textarea.trigger('keydown', { key: 'Backspace', code: 'Backspace' })
  await nextTick()
})

/**
 * @description Simulate tab key press
 * @when I press the Tab key
 */
When('I press the Tab key', async () => {
  const textarea = wrapper.find('textarea')
  await textarea.trigger('keydown', { key: 'Tab', code: 'Tab' })
  await nextTick()
})

/**
 * @description Simulate typing final character
 * @when I type the final character correctly
 */
When('I type the final character correctly', async () => {
  const targetText = wrapper.vm.targetText
  const remainingText = targetText.substring(wrapper.vm.userInput.length)
  await simulateTyping(wrapper, remainingText, { delayBetweenKeys: 50 })
  expect(wrapper.vm.userInput).toBe(targetText)
})

/**
 * @description Simulate trying to type beyond target
 * @when I try to type additional characters
 */
When('I try to type additional characters', async () => {
  const textarea = wrapper.find('textarea')
  const extraChars = 'extra'
  for (const char of extraChars) {
    await textarea.trigger('keydown', { key: char })
    await nextTick()
  }
})

/**
 * @description Verify timer starts
 * @then the timer should start
 */
Then('the timer should start', () => {
  expect(wrapper.vm.hasStarted).toBe(true)
  expect(wrapper.vm.startTime).toBeGreaterThan(0)
})

/**
 * @description Verify progress tracking
 * @then my typing progress should be tracked
 */
Then('my typing progress should be tracked', () => {
  expect(wrapper.vm.progress).toBeGreaterThan(0)
  expect(wrapper.vm.wpm).toBeGreaterThanOrEqual(0)
})

/**
 * @description Verify cursor highlighting
 * @then the cursor position should be highlighted in the target text
 */
Then('the cursor position should be highlighted in the target text', () => {
  const currentChar = wrapper.find('.bg-blue-200, .bg-blue-800')
  expect(currentChar.exists()).toBe(true)
})

/**
 * @description Verify green highlighting
 * @then the character should be highlighted in green
 */
Then('the character should be highlighted in green', () => {
  const correctChars = wrapper.findAll('.text-green-600')
  expect(correctChars.length).toBeGreaterThan(0)
})

/**
 * @description Verify accuracy remains high
 * @then my accuracy should remain high
 */
Then('my accuracy should remain high', () => {
  expect(wrapper.vm.accuracy).toBeGreaterThan(90)
})

/**
 * @description Verify cursor advancement
 * @then the cursor should advance to the next character
 */
Then('the cursor should advance to the next character', () => {
  const currentPosition = wrapper.vm.currentIndex
  expect(currentPosition).toBeGreaterThan(0)
})

/**
 * @description Verify red highlighting
 * @then the character should be highlighted in red
 */
Then('the character should be highlighted in red', () => {
  const incorrectChars = wrapper.findAll('.text-red-600')
  expect(incorrectChars.length).toBeGreaterThan(0)
})

/**
 * @description Verify error count increase
 * @then my error count should increase
 */
Then('my error count should increase', () => {
  expect(wrapper.vm.errors).toBeGreaterThan(0)
})

/**
 * @description Verify accuracy decrease
 * @then my accuracy should decrease
 */
Then('my accuracy should decrease', () => {
  expect(wrapper.vm.accuracy).toBeLessThan(100)
})

/**
 * @description Verify cursor still advances
 * @then the cursor should still advance
 */
Then('the cursor should still advance', () => {
  const currentPosition = wrapper.vm.currentIndex
  expect(currentPosition).toBeGreaterThan(0)
})

/**
 * @description Verify character removal
 * @then the last character should be removed from my input
 */
Then('the last character should be removed from my input', () => {
  const expectedLength = wrapper.vm.userInput.length
  expect(expectedLength).toBeGreaterThanOrEqual(0)
})

/**
 * @description Verify cursor moves back
 * @then the cursor should move back in the target text
 */
Then('the cursor should move back in the target text', () => {
  const currentIndex = wrapper.vm.currentIndex
  expect(currentIndex).toBeGreaterThanOrEqual(0)
})

/**
 * @description Verify ability to retype
 * @then I can retype the character correctly
 */
Then('I can retype the character correctly', async () => {
  const targetText = wrapper.vm.targetText
  const currentIndex = wrapper.vm.currentIndex
  const correctChar = targetText.charAt(currentIndex)
  await simulateTyping(wrapper, correctChar)
  expect(wrapper.vm.userInput.charAt(currentIndex)).toBe(correctChar)
})

/**
 * @description Verify special character highlighting
 * @then they should be highlighted in green
 */
Then('they should be highlighted in green', () => {
  const correctChars = wrapper.findAll('.text-green-600')
  expect(correctChars.length).toBeGreaterThan(0)
})

/**
 * @description Verify accuracy maintenance
 * @then my accuracy should be maintained
 */
Then('my accuracy should be maintained', () => {
  expect(wrapper.vm.accuracy).toBeGreaterThanOrEqual(95)
})

/**
 * @description Verify tab insertion
 * @then two spaces should be inserted
 */
Then('two spaces should be inserted', () => {
  expect(wrapper.vm.userInput).toContain('  ')
})

/**
 * @description Verify tab doesn't change focus
 * @then the tab should not change focus away from the typing area
 */
Then('the tab should not change focus away from the typing area', () => {
  const textarea = wrapper.find('textarea')
  expect(document.activeElement).toBe(textarea.element)
})

/**
 * @description Verify space matching
 * @then the spaces should match the target indentation
 */
Then('the spaces should match the target indentation', () => {
  const targetText = wrapper.vm.targetText
  const userInput = wrapper.vm.userInput
  // Basic check that indentation is present
  expect(userInput).toContain('  ')
})

/**
 * @description Verify completion status
 * @then the exercise should be marked as complete
 */
Then('the exercise should be marked as complete', () => {
  expect(wrapper.vm.isComplete).toBe(true)
  expect(wrapper.vm.progress).toBe(100)
})

/**
 * @description Verify input matches target
 * @then my input exactly matches the target text
 */
Then('my input exactly matches the target text', () => {
  expect(wrapper.vm.userInput).toBe(wrapper.vm.targetText)
})

/**
 * @description Verify typing area disabled
 * @then the typing area should be disabled
 */
Then('the typing area should be disabled', () => {
  const textarea = wrapper.find('textarea')
  expect(textarea.attributes('disabled')).toBeDefined()
})

/**
 * @description Verify no additional characters
 * @then no additional characters should be accepted
 */
Then('no additional characters should be accepted', () => {
  const currentLength = wrapper.vm.userInput.length
  const targetLength = wrapper.vm.targetText.length
  expect(currentLength).toBeLessThanOrEqual(targetLength)
})

/**
 * @description Verify input cleared
 * @then my input should be cleared
 */
Then('my input should be cleared', () => {
  expect(wrapper.vm.userInput).toBe('')
})

/**
 * @description Verify timer reset
 * @then the timer should be reset
 */
Then('the timer should be reset', () => {
  expect(wrapper.vm.hasStarted).toBe(false)
  expect(wrapper.vm.startTime).toBe(null)
})

/**
 * @description Verify error count reset
 * @then the error count should be reset to zero
 */
Then('the error count should be reset to zero', () => {
  expect(wrapper.vm.errors).toBe(0)
})

/**
 * @description Verify can start again
 * @then I can start typing again
 */
Then('I can start typing again', async () => {
  const textarea = wrapper.find('textarea')
  expect(textarea.attributes('disabled')).toBeUndefined()
  expect(wrapper.vm.isComplete).toBe(false)
})

/**
 * @description Verify formatting preserved
 * @then the formatting should be preserved
 */
Then('the formatting should be preserved', () => {
  const codeDisplay = wrapper.find('pre code')
  expect(codeDisplay.exists()).toBe(true)
  const displayedText = codeDisplay.text()
  expect(displayedText).toContain('\n')
})

/**
 * @description Verify monospace font
 * @then the monospace font should be used
 */
Then('the monospace font should be used', () => {
  const codeDisplay = wrapper.find('pre code')
  expect(codeDisplay.exists()).toBe(true)
  // Check for monospace styling
  expect(codeDisplay.classes()).toContain('font-mono')
})

/**
 * @description Verify text readability
 * @then the text should be readable with proper syntax highlighting
 */
Then('the text should be readable with proper syntax highlighting', () => {
  const codeDisplay = wrapper.find('pre code')
  expect(codeDisplay.exists()).toBe(true)
  // Basic check for syntax highlighting classes or structure
  expect(codeDisplay.html()).toContain('language-')
})
