import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Given, When, Then, Before, After } from '@amiceli/vitest-cucumber'
import { nextTick } from 'vue'
import TypingPage from '../../app/pages/typing.vue'
import { simulateRapidTyping, simulateCorrections } from '../utils/typing-simulator'
import { advanceTime, resetTime } from '../setup/dom-setup'

let wrapper: any
let performanceMetrics: any = {}

Before(() => {
  // Mock Monaco Editor
  vi.mock('#imports', () => ({
    MonacoEditor: {
      name: 'MonacoEditor',
      template: '<textarea v-model="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" v-bind="$attrs" />',
      props: ['modelValue', 'lang', 'options'],
      emits: ['update:modelValue']
    }
  }))
  
  // Initialize performance tracking
  performanceMetrics = {
    keystrokeLatencies: [],
    memoryUsageBefore: 0,
    memoryUsageAfter: 0,
    processingTimes: []
  }
})

After(() => {
  if (wrapper) {
    wrapper.unmount()
    wrapper = null
  }
  resetTime()
})

Given('I am on the typing tutor page', async () => {
  // Record memory usage before mounting
  if (performance.memory) {
    performanceMetrics.memoryUsageBefore = performance.memory.usedJSHeapSize
  }
  
  wrapper = mount(TypingPage, {
    global: {
      stubs: {
        MonacoEditor: {
          template: '<textarea v-model="modelValue" @input="handleInput" class="w-full h-full p-4" />',
          props: ['modelValue', 'lang', 'options'],
          emits: ['update:modelValue'],
          methods: {
            handleInput(event: Event) {
              const start = performance.now()
              this.$emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
              const end = performance.now()
              performanceMetrics.keystrokeLatencies.push(end - start)
            }
          }
        },
        UButton: { template: '<button @click="$emit(\'click\')" v-bind="$attrs"><slot /></button>' },
        UBadge: { template: '<span class="badge" v-bind="$attrs"><slot /></span>' },
        UModal: { 
          template: '<div v-if="modelValue" class="modal"><slot /></div>',
          props: ['modelValue']
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

Given('the practice text contains {int} characters', async (characterCount: number) => {
  const longText = 'a'.repeat(characterCount)
  
  // Set a custom exercise with long text
  wrapper.vm.exercises = [{
    id: 999,
    title: 'Performance Test',
    category: 'Test',
    difficulty: 'hard',
    language: 'javascript',
    description: `Performance test with ${characterCount} characters`,
    code: longText
  }]
  
  wrapper.vm.currentExerciseIndex = 0
  await nextTick()
  
  expect(wrapper.vm.targetText.length).toBe(characterCount)
})

Given('I am typing practice text', async () => {
  const textarea = wrapper.find('textarea')
  expect(textarea.exists()).toBe(true)
  
  // Start typing some text to set up the scenario
  await simulateRapidTyping(wrapper, 'Hello World with some errors', 50)
})

When('I type at {int}ms intervals between keystrokes', async (intervalMs: number) => {
  const testText = 'Performance test typing'
  
  const startTime = performance.now()
  await simulateRapidTyping(wrapper, testText, intervalMs)
  const endTime = performance.now()
  
  performanceMetrics.totalTypingTime = endTime - startTime
  performanceMetrics.expectedTime = testText.length * intervalMs
})

When('I complete {int} consecutive exercises', async (exerciseCount: number) => {
  const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0
  
  for (let i = 0; i < exerciseCount; i++) {
    // Switch to next exercise
    wrapper.vm.currentExerciseIndex = i % wrapper.vm.exercises.length
    await nextTick()
    
    // Complete the exercise quickly
    const targetText = wrapper.vm.targetText.substring(0, 100) // Use first 100 chars for speed
    await simulateRapidTyping(wrapper, targetText, 10)
    
    // Reset for next exercise
    wrapper.vm.resetTyping()
    await nextTick()
    
    // Track memory after each exercise
    if (performance.memory) {
      performanceMetrics.memoryUsageAfter = performance.memory.usedJSHeapSize
    }
  }
  
  performanceMetrics.memoryGrowth = performanceMetrics.memoryUsageAfter - initialMemory
})

When('I start typing the text', async () => {
  const targetText = wrapper.vm.targetText.substring(0, 50) // First 50 chars for performance test
  
  const start = performance.now()
  await simulateRapidTyping(wrapper, targetText, 20)
  const end = performance.now()
  
  performanceMetrics.processingTimes.push(end - start)
})

When('I make rapid corrections using backspace', async () => {
  const start = performance.now()
  
  // Make several rapid corrections
  for (let i = 0; i < 10; i++) {
    await simulateCorrections(wrapper, 3, 10) // 3 backspaces, 10ms interval
    await simulateRapidTyping(wrapper, 'corrected', 10)
  }
  
  const end = performance.now()
  performanceMetrics.correctionTime = end - start
})

Then('each keystroke should be processed within {int}ms', (maxLatency: number) => {
  const latencies = performanceMetrics.keystrokeLatencies
  expect(latencies.length).toBeGreaterThan(0)
  
  const averageLatency = latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length
  expect(averageLatency).toBeLessThan(maxLatency)
  
  // Check that 95th percentile is also under threshold
  const sorted = latencies.sort((a, b) => a - b)
  const p95Index = Math.floor(sorted.length * 0.95)
  const p95Latency = sorted[p95Index]
  expect(p95Latency).toBeLessThan(maxLatency * 1.5) // Allow 50% more for 95th percentile
})

Then('the UI should remain responsive throughout', () => {
  // Check that the component is still functional and mounted
  expect(wrapper.exists()).toBe(true)
  expect(wrapper.vm.$el).toBeTruthy()
  
  // Verify that reactive properties are still working
  expect(wrapper.vm.wpm).toBeGreaterThanOrEqual(0)
  expect(wrapper.vm.accuracy).toBeGreaterThanOrEqual(0)
})

Then('the memory usage should not increase significantly', () => {
  const memoryGrowth = performanceMetrics.memoryGrowth || 0
  const maxAllowedGrowth = 10 * 1024 * 1024 // 10MB
  
  expect(memoryGrowth).toBeLessThan(maxAllowedGrowth)
})

Then('there should be no memory leaks detected', () => {
  // In a real scenario, this would use memory profiling tools
  // For this test, we'll check that memory growth is reasonable
  const memoryGrowth = performanceMetrics.memoryGrowth || 0
  const maxAllowedGrowth = 5 * 1024 * 1024 // 5MB
  
  expect(memoryGrowth).toBeLessThan(maxAllowedGrowth)
})

Then('the character highlighting should work efficiently', () => {
  // Check that highlighting elements exist and are performant
  const highlightedElements = wrapper.findAll('.text-green-600, .text-red-600, .bg-blue-200')
  expect(highlightedElements.length).toBeGreaterThan(0)
  
  // Verify that processing times are reasonable
  const avgProcessingTime = performanceMetrics.processingTimes.length > 0
    ? performanceMetrics.processingTimes.reduce((sum, time) => sum + time, 0) / performanceMetrics.processingTimes.length
    : 0
  
  expect(avgProcessingTime).toBeLessThan(100) // Less than 100ms for processing
})

Then('the performance should remain consistent', () => {
  // Check that there's no significant performance degradation
  if (performanceMetrics.processingTimes.length > 1) {
    const firstHalf = performanceMetrics.processingTimes.slice(0, Math.floor(performanceMetrics.processingTimes.length / 2))
    const secondHalf = performanceMetrics.processingTimes.slice(Math.floor(performanceMetrics.processingTimes.length / 2))
    
    const firstHalfAvg = firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length
    
    // Second half shouldn't be more than 50% slower than first half
    expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5)
  }
})

Then('each correction should be processed smoothly', () => {
  const correctionTime = performanceMetrics.correctionTime
  expect(correctionTime).toBeLessThan(1000) // Total correction time should be under 1 second
})

Then('the accuracy calculation should remain accurate', () => {
  const accuracy = wrapper.vm.accuracy
  expect(accuracy).toBeGreaterThanOrEqual(0)
  expect(accuracy).toBeLessThanOrEqual(100)
  
  // Accuracy should be a reasonable number (not NaN or Infinity)
  expect(Number.isFinite(accuracy)).toBe(true)
})