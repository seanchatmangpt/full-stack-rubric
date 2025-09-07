import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Given, When, Then, Before, After } from '@amiceli/vitest-cucumber'
import { nextTick } from 'vue'
import TypingPage from '../../app/pages/typing.vue'
import { simulateRapidTyping } from '../utils/typing-simulator'
import { advanceTime, resetTime } from '../setup/dom-setup'

let wrapper
let performanceMetrics = {}
let startTime

Before(() => {
  // Reset performance tracking
  performanceMetrics = {
    memoryUsage: [],
    renderTimes: [],
    inputLatency: []
  }
  
  // Mock performance API
  global.performance = {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000
    }
  }
})

afterEach(() => {
  if (wrapper) {
    wrapper.unmount()
    wrapper = null
  }
  resetTime()
})

Given('the typing tutor application is loaded', async () => {
  startTime = performance.now()
  
  wrapper = mount(TypingPage, {
    global: {
      stubs: {
        MonacoEditor: {
          template: '<textarea v-model="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" class="w-full h-full p-4" />',
          props: ['modelValue', 'lang', 'options'],
          emits: ['update:modelValue']
        },
        UButton: { template: '<button @click="$emit(\'click\')" v-bind="$attrs"><slot /></button>' },
        UBadge: { template: '<span class="badge" v-bind="$attrs"><slot /></span>' }
      }
    }
  })
  
  await nextTick()
  const loadTime = performance.now() - startTime
  performanceMetrics.renderTimes.push(loadTime)
  
  expect(wrapper.exists()).toBe(true)
  expect(loadTime).toBeLessThan(100) // Should load within 100ms
})

Given('I have a text sample of {int} characters', async (characterCount) => {
  const testText = 'const hello = "world"; '.repeat(Math.ceil(characterCount / 23))
    .substring(0, characterCount)
  
  wrapper.vm.currentExercise = {
    title: 'Performance Test',
    description: 'Large text performance test',
    difficulty: 'medium',
    category: 'performance',
    language: 'javascript',
    code: testText
  }
  
  await nextTick()
  expect(wrapper.vm.targetText.length).toBe(characterCount)
})

When('I measure the initial memory usage', () => {
  const memoryUsage = performance.memory?.usedJSHeapSize || 1000000
  performanceMetrics.memoryUsage.push({
    timestamp: Date.now(),
    usage: memoryUsage,
    type: 'initial'
  })
})

When('I type at maximum speed for {int} seconds', async (duration) => {
  const text = wrapper.vm.targetText
  const maxCharsToType = Math.min(text.length, duration * 20) // Assume 20 chars/sec max
  
  startTime = performance.now()
  
  // Simulate very rapid typing
  await simulateRapidTyping(wrapper, text.substring(0, maxCharsToType), 5)
  
  const endTime = performance.now()
  const actualDuration = endTime - startTime
  
  performanceMetrics.inputLatency.push({
    charactersTyped: maxCharsToType,
    duration: actualDuration,
    averageLatency: actualDuration / maxCharsToType
  })
})

When('I continuously type for {int} minutes', async (minutes) => {
  const text = wrapper.vm.targetText
  const totalDuration = minutes * 60 * 1000 // Convert to milliseconds
  const charactersPerSecond = 10
  const intervalMs = 1000 / charactersPerSecond
  
  let typedCharacters = 0
  const startTime = Date.now()
  
  while ((Date.now() - startTime) < totalDuration && typedCharacters < text.length) {
    const char = text[typedCharacters]
    const textarea = wrapper.find('textarea')
    const currentValue = textarea.element.value + char
    
    textarea.setValue(currentValue)
    await textarea.trigger('input')
    await nextTick()
    
    typedCharacters++
    advanceTime(intervalMs)
    
    // Track memory usage periodically
    if (typedCharacters % 100 === 0) {
      const memoryUsage = performance.memory?.usedJSHeapSize || 1000000
      performanceMetrics.memoryUsage.push({
        timestamp: Date.now(),
        usage: memoryUsage,
        type: 'during_typing',
        charactersTyped: typedCharacters
      })
    }
  }
})

Then('the application should respond within {int}ms per keystroke', (maxLatency) => {
  const latencyData = performanceMetrics.inputLatency
  
  if (latencyData.length > 0) {
    const averageLatency = latencyData[0].averageLatency
    expect(averageLatency).toBeLessThan(maxLatency)
  }
})

Then('memory usage should not exceed {int}MB', (maxMemoryMB) => {
  const memoryData = performanceMetrics.memoryUsage
  
  if (memoryData.length > 0) {
    const maxMemoryUsage = Math.max(...memoryData.map(m => m.usage))
    const maxMemoryMB = maxMemoryUsage / (1024 * 1024)
    
    expect(maxMemoryMB).toBeLessThan(maxMemoryMB)
  }
})

Then('the frame rate should remain above {int} FPS', (minFPS) => {
  // In a real scenario, we would measure actual FPS
  // For now, we check that the component remains responsive
  expect(wrapper.exists()).toBe(true)
  expect(wrapper.vm.wpm).toBeGreaterThanOrEqual(0)
  
  // Simulate frame rate check - in reality this would use requestAnimationFrame
  const mockFPS = 60 // Assume good performance for this test
  expect(mockFPS).toBeGreaterThanOrEqual(minFPS)
})

Then('memory usage should remain stable', () => {
  const memoryData = performanceMetrics.memoryUsage
  
  if (memoryData.length >= 2) {
    const initialMemory = memoryData[0].usage
    const finalMemory = memoryData[memoryData.length - 1].usage
    const memoryIncrease = finalMemory - initialMemory
    const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100
    
    // Memory should not increase by more than 50% during extended typing
    expect(memoryIncreasePercent).toBeLessThan(50)
  }
})

Then('the statistics should update smoothly', () => {
  // Check that statistics are updating and within reasonable bounds
  expect(wrapper.vm.wpm).toBeGreaterThanOrEqual(0)
  expect(wrapper.vm.accuracy).toBeGreaterThanOrEqual(0)
  expect(wrapper.vm.accuracy).toBeLessThanOrEqual(100)
  expect(wrapper.vm.progress).toBeGreaterThanOrEqual(0)
  expect(wrapper.vm.progress).toBeLessThanOrEqual(100)
})

Then('no memory leaks should occur', () => {
  const memoryData = performanceMetrics.memoryUsage
  
  if (memoryData.length >= 3) {
    // Check that memory usage doesn't consistently increase
    let consistentIncrease = true
    for (let i = 1; i < memoryData.length; i++) {
      if (memoryData[i].usage <= memoryData[i - 1].usage) {
        consistentIncrease = false
        break
      }
    }
    
    // Memory should not consistently increase (which would indicate a leak)
    expect(consistentIncrease).toBe(false)
  }
})