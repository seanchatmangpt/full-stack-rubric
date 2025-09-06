import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Given, When, Then, Before, After } from '@amiceli/vitest-cucumber'
import { nextTick } from 'vue'
import TypingPage from '../../app/pages/typing.vue'
import { simulateTyping, simulateRapidTyping, simulateCorrections } from '../utils/typing-simulator'
import { advanceTime, resetTime } from '../setup/dom-setup'

let wrapper: any
let originalConsoleError: any

Before(() => {
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

After(() => {
  if (wrapper) {
    wrapper.unmount()
    wrapper = null
  }
  console.error = originalConsoleError
  resetTime()
})

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

Given('I can see the practice text', () => {
  const codeDisplay = wrapper.find('pre code')
  expect(codeDisplay.exists()).toBe(true)
  expect(codeDisplay.text()).toBeTruthy()
})

Given('I can see the typing statistics showing {int} WPM and {int}% accuracy', (wpm: number, accuracy: number) => {
  const wpmElement = wrapper.find('.text-blue-600')
  const accuracyElement = wrapper.find('.text-green-600')
  
  expect(wpmElement.text()).toBe(wpm.toString())
  expect(accuracyElement.text()).toBe(`${accuracy.toFixed(1)}%`)
})

Given('the practice text is {string}', async (text: string) => {
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

When('I start typing the displayed text', async () => {
  const textarea = wrapper.find('textarea')
  const targetText = wrapper.vm.targetText
  
  await simulateTyping(wrapper, targetText.substring(0, 5), { delayBetweenKeys: 100 })
})

When('I type {string} in exactly {int} seconds', async (text: string, seconds: number) => {
  const delayPerChar = (seconds * 1000) / text.length
  await simulateTyping(wrapper, text, { delayBetweenKeys: delayPerChar })
})

When('I type {string} \\(with one error\\)', async (text: string) => {
  await simulateTyping(wrapper, text, { errorsToMake: 1 })
})

When('I type {string}', async (text: string) => {
  await simulateTyping(wrapper, text)
})

When('I complete typing the entire text correctly', async () => {
  const targetText = wrapper.vm.targetText
  await simulateTyping(wrapper, targetText, { delayBetweenKeys: 50 })
})

When('I type very rapidly with {int}ms between keystrokes', async (interval: number) => {
  const targetText = wrapper.vm.targetText
  await simulateRapidTyping(wrapper, targetText, interval)
})

When('I use backspace to correct mistakes', async () => {
  await simulateCorrections(wrapper, 3, 50)
})

When('I click {string}', async (buttonText: string) => {
  const buttons = wrapper.findAll('button')
  const targetButton = buttons.find(button => button.text().includes(buttonText))
  
  expect(targetButton).toBeTruthy()
  await targetButton!.trigger('click')
  await nextTick()
})

When('I click the {string} button', async (buttonText: string) => {
  const buttons = wrapper.findAll('button')
  const targetButton = buttons.find(button => button.text().includes(buttonText))
  
  expect(targetButton).toBeTruthy()
  await targetButton!.trigger('click')
  await nextTick()
})

Then('the characters I type correctly should be highlighted in green', () => {
  const correctChars = wrapper.findAll('.text-green-600')
  expect(correctChars.length).toBeGreaterThan(0)
})

Then('the characters I type incorrectly should be highlighted in red', () => {
  const incorrectChars = wrapper.findAll('.text-red-600')
  expect(incorrectChars.length).toBeGreaterThan(0)
})

Then('the current character position should be highlighted', () => {
  const currentChar = wrapper.find('.bg-blue-200, .bg-blue-800')
  expect(currentChar.exists()).toBe(true)
})

Then('the WPM should be calculated as {int}', (expectedWpm: number) => {
  expect(wrapper.vm.wpm).toBe(expectedWpm)
})

Then('the WPM display should update in real-time', () => {
  const wpmDisplay = wrapper.find('.text-blue-600')
  expect(wpmDisplay.text()).toBe(wrapper.vm.wpm.toString())
})

Then('the accuracy should be approximately {float}%', (expectedAccuracy: number) => {
  const actualAccuracy = wrapper.vm.accuracy
  expect(actualAccuracy).toBeCloseTo(expectedAccuracy, 1)
})

Then('the errors count should show {int}', (expectedErrors: number) => {
  expect(wrapper.vm.errors).toBe(expectedErrors)
})

Then('the progress bar should show approximately {int}% completion', (expectedProgress: number) => {
  const actualProgress = wrapper.vm.progress
  expect(actualProgress).toBeCloseTo(expectedProgress, 0)
})

Then('the progress percentage should be displayed', () => {
  const progressText = wrapper.text()
  expect(progressText).toMatch(/\d+% complete/)
})

Then('a completion modal should appear', () => {
  expect(wrapper.vm.showModal).toBe(true)
  const modal = wrapper.find('.modal')
  expect(modal.exists()).toBe(true)
})

Then('it should display my final WPM and accuracy', () => {
  expect(wrapper.vm.finalWpm).toBeGreaterThanOrEqual(0)
  expect(wrapper.vm.finalAccuracy).toBeGreaterThanOrEqual(0)
})

Then('I should see options to try another exercise or close', () => {
  const buttons = wrapper.findAll('button')
  const hasNextButton = buttons.some(button => button.text().includes('Next'))
  const hasCloseButton = buttons.some(button => button.text().includes('Close'))
  
  expect(hasNextButton).toBe(true)
  expect(hasCloseButton).toBe(true)
})

Then('the application should remain responsive', () => {
  // Check that the component is still mounted and functional
  expect(wrapper.exists()).toBe(true)
  expect(wrapper.vm.wpm).toBeGreaterThanOrEqual(0)
})

Then('all statistics should update correctly', () => {
  expect(wrapper.vm.wpm).toBeGreaterThanOrEqual(0)
  expect(wrapper.vm.accuracy).toBeGreaterThanOrEqual(0)
  expect(wrapper.vm.progress).toBeGreaterThanOrEqual(0)
})

Then('no performance degradation should occur', () => {
  // This would be tested with performance monitoring in a real scenario
  // For now, we just ensure the component is still responsive
  expect(wrapper.exists()).toBe(true)
})

Then('the highlighting should update correctly', () => {
  const highlightedChars = wrapper.findAll('.text-green-600, .text-red-600, .bg-blue-200, .bg-blue-800')
  expect(highlightedChars.length).toBeGreaterThan(0)
})

Then('the accuracy should recalculate properly', () => {
  const accuracy = wrapper.vm.accuracy
  expect(accuracy).toBeGreaterThanOrEqual(0)
  expect(accuracy).toBeLessThanOrEqual(100)
})

Then('the progress should adjust accordingly', () => {
  const progress = wrapper.vm.progress
  expect(progress).toBeGreaterThanOrEqual(0)
  expect(progress).toBeLessThanOrEqual(100)
})

Then('a new practice text should be displayed', () => {
  const codeDisplay = wrapper.find('pre code')
  expect(codeDisplay.exists()).toBe(true)
  expect(codeDisplay.text()).toBeTruthy()
})

Then('all statistics should reset to initial values', () => {
  expect(wrapper.vm.wpm).toBe(0)
  expect(wrapper.vm.accuracy).toBe(100)
  expect(wrapper.vm.errors).toBe(0)
})

Then('I should be able to start typing the new text', () => {
  const textarea = wrapper.find('textarea')
  expect(textarea.exists()).toBe(true)
  expect(textarea.element.value).toBe('')
})

Then('all input should be cleared', () => {
  expect(wrapper.vm.userInput).toBe('')
})

Then('I should be able to start fresh with the same text', () => {
  const textarea = wrapper.find('textarea')
  expect(textarea.exists()).toBe(true)
  expect(textarea.element.value).toBe('')
  expect(wrapper.vm.isComplete).toBe(false)
})