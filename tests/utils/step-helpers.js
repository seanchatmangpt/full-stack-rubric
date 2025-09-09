/**
 * @fileoverview Reusable helper functions for BDD step definitions
 * @description Provides common utilities for simulating user interactions,
 * setting up test contexts, and performing assertions across different step files
 */

import { nextTick } from 'vue'
import { expect } from 'vitest'

/**
 * @description Simulate realistic typing with configurable options
 * @param {Object} wrapper - Vue Test Utils wrapper
 * @param {string} text - Text to type
 * @param {Object} options - Configuration options
 * @returns {Promise<void>}
 */
export async function simulateTyping(wrapper, text, options = {}) {
  const {
    delayBetweenKeys = 50,
    errorsToMake = 0,
    errorPositions = [],
    preserveCase = true
  } = options

  const textarea = wrapper.find('textarea')
  if (!textarea.exists()) {
    throw new Error('Textarea not found for typing simulation')
  }

  let currentValue = textarea.element.value
  let errorCount = 0

  for (let i = 0; i < text.length; i++) {
    const char = preserveCase ? text[i] : text[i].toLowerCase()
    
    // Introduce errors at specified positions or randomly
    const shouldMakeError = errorPositions.includes(i) || 
      (errorsToMake > errorCount && Math.random() < 0.1)
    
    const charToType = shouldMakeError ? 'x' : char
    currentValue += charToType
    
    if (shouldMakeError) {
      errorCount++
    }

    // Update textarea value
    textarea.setValue(currentValue)
    await textarea.trigger('input')
    await nextTick()

    // Simulate realistic typing delay
    if (delayBetweenKeys > 0) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenKeys))
    }
  }

  return {
    finalText: currentValue,
    errorsIntroduced: errorCount
  }
}

/**
 * @description Simulate rapid typing for performance testing
 * @param {Object} wrapper - Vue Test Utils wrapper
 * @param {string} text - Text to type rapidly
 * @param {number} intervalMs - Interval between keystrokes in milliseconds
 * @returns {Promise<Object>}
 */
export async function simulateRapidTyping(wrapper, text, intervalMs = 5) {
  const startTime = performance.now()
  const textarea = wrapper.find('textarea')
  
  let currentValue = textarea.element.value

  for (const char of text) {
    currentValue += char
    textarea.setValue(currentValue)
    await textarea.trigger('input')
    
    // Minimal delay for rapid typing
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  const endTime = performance.now()
  const duration = endTime - startTime

  return {
    duration,
    charactersPerSecond: text.length / (duration / 1000),
    averageLatency: duration / text.length
  }
}

/**
 * @description Simulate backspace corrections during typing
 * @param {Object} wrapper - Vue Test Utils wrapper
 * @param {number} corrections - Number of corrections to make
 * @param {number} delayMs - Delay between corrections
 * @returns {Promise<void>}
 */
export async function simulateCorrections(wrapper, corrections = 3, delayMs = 100) {
  const textarea = wrapper.find('textarea')
  
  for (let i = 0; i < corrections; i++) {
    // Simulate backspace
    await textarea.trigger('keydown', { key: 'Backspace', code: 'Backspace' })
    await nextTick()
    
    // Add delay between corrections
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
}

/**
 * @description Set up mock component with common properties
 * @param {string} componentName - Name of the component
 * @param {Object} props - Props to pass to the component
 * @param {Object} stubs - Component stubs for testing
 * @returns {Object} Mock component configuration
 */
export function createMockComponent(componentName, props = {}, stubs = {}) {
  const defaultStubs = {
    MonacoEditor: {
      template: '<textarea v-model="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" class="w-full h-full p-4" />',
      props: ['modelValue', 'lang', 'options'],
      emits: ['update:modelValue']
    },
    UButton: { 
      template: '<button @click="$emit(\'click\')" v-bind="$attrs"><slot /></button>' 
    },
    UBadge: { 
      template: '<span class="badge" v-bind="$attrs"><slot /></span>' 
    },
    UModal: { 
      template: '<div v-if="modelValue" class="modal"><slot /></div>',
      props: ['modelValue'],
      emits: ['update:modelValue']
    },
    UCard: { 
      template: '<div class="card"><slot name="header" /><slot /><slot name="footer" /></div>'
    }
  }

  return {
    name: componentName,
    props,
    global: {
      stubs: { ...defaultStubs, ...stubs }
    }
  }
}

/**
 * @description Create mock API response with realistic data
 * @param {number} status - HTTP status code
 * @param {Object} data - Response data
 * @param {number} responseTime - Response time in milliseconds
 * @returns {Object} Mock API response
 */
export function createMockAPIResponse(status = 200, data = {}, responseTime = 100) {
  return {
    status,
    data: {
      timestamp: new Date().toISOString(),
      ...data
    },
    headers: {
      'content-type': 'application/json',
      'x-response-time': `${responseTime}ms`
    },
    responseTime,
    ok: status >= 200 && status < 300
  }
}

/**
 * @description Create mock health check response
 * @param {string} status - Health status ('healthy', 'degraded', 'unhealthy')
 * @param {Object} additionalData - Additional health data
 * @returns {Object} Mock health response
 */
export function createHealthCheckResponse(status = 'healthy', additionalData = {}) {
  const baseResponse = {
    status,
    timestamp: new Date().toISOString(),
    uptime: '5d 3h 42m',
    version: '1.0.0'
  }

  const healthData = {
    memory: {
      used: '256MB',
      total: '1GB',
      percentage: 25
    },
    database: {
      connected: status === 'healthy',
      responseTime: status === 'healthy' ? '12ms' : '500ms'
    },
    dependencies: {
      redis: { status: status === 'healthy' ? 'healthy' : 'degraded' },
      external_api: { status }
    }
  }

  return createMockAPIResponse(
    status === 'healthy' ? 200 : 503,
    { ...baseResponse, ...healthData, ...additionalData }
  )
}

/**
 * @description Simulate viewport resize for responsive testing
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @returns {Object} Viewport information
 */
export function simulateViewportResize(width, height) {
  const viewport = { width, height }
  
  // Mock viewport resize
  const deviceType = width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop'
  
  return {
    ...viewport,
    deviceType,
    breakpoint: getBreakpoint(width),
    aspectRatio: width / height
  }
}

/**
 * @description Get CSS breakpoint name for a given width
 * @param {number} width - Viewport width
 * @returns {string} Breakpoint name
 */
export function getBreakpoint(width) {
  if (width < 640) return 'sm'
  if (width < 768) return 'md' 
  if (width < 1024) return 'lg'
  if (width < 1280) return 'xl'
  return '2xl'
}

/**
 * @description Create mock content structure for testing
 * @param {number} pageCount - Number of pages to create
 * @param {Array<string>} categories - Content categories
 * @returns {Object} Mock content structure
 */
export function createMockContentStructure(pageCount = 10, categories = ['Tech', 'Business']) {
  const structure = {
    categories,
    subcategories: {},
    pages: {},
    totalPages: pageCount
  }

  categories.forEach((category) => {
    const subCount = Math.floor(Math.random() * 3) + 2 // 2-4 subcategories
    structure.subcategories[category] = []
    structure.pages[category] = {}

    for (let i = 0; i < subCount; i++) {
      const subcategory = `${category}-Sub-${i + 1}`
      structure.subcategories[category].push(subcategory)
      
      const pageCount = Math.floor(Math.random() * 4) + 1 // 1-4 pages per subcategory
      structure.pages[category][subcategory] = []
      
      for (let j = 0; j < pageCount; j++) {
        structure.pages[category][subcategory].push(`${subcategory}-Page-${j + 1}`)
      }
    }
  })

  return structure
}

/**
 * @description Create mock search results with relevance scoring
 * @param {string} query - Search query
 * @param {number} resultCount - Number of results to create
 * @returns {Object} Mock search results
 */
export function createMockSearchResults(query, resultCount = 5) {
  const results = []
  
  for (let i = 0; i < resultCount; i++) {
    const relevance = Math.random() * 0.3 + 0.7 // 0.7 to 1.0 relevance
    results.push({
      id: `result-${i}`,
      title: `${query} Result ${i + 1}`,
      snippet: `This is a relevant snippet containing ${query} for result ${i + 1}`,
      url: `/content/result-${i}`,
      relevance: parseFloat(relevance.toFixed(2)),
      category: i % 2 === 0 ? 'Tech' : 'Business',
      tags: [query, `tag${i}`, 'example']
    })
  }

  // Sort by relevance
  results.sort((a, b) => b.relevance - a.relevance)

  return {
    query,
    results,
    total: resultCount,
    executionTime: Math.floor(Math.random() * 50) + 10, // 10-60ms
    page: 1,
    hasNext: false,
    hasPrevious: false
  }
}

/**
 * @description Validate accessibility compliance for a mock element
 * @param {Object} element - Element to validate
 * @param {Object} wcagLevel - WCAG level ('A', 'AA', 'AAA')
 * @returns {Object} Accessibility validation results
 */
export function validateAccessibility(element, wcagLevel = 'AA') {
  // Mock accessibility validation
  const checks = {
    hasRole: element.role !== undefined,
    hasLabel: element.ariaLabel !== undefined || element.label !== undefined,
    hasDescription: element.ariaDescription !== undefined,
    keyboardAccessible: element.tabIndex !== undefined || element.focusable === true,
    contrastSufficient: element.contrastRatio >= (wcagLevel === 'AAA' ? 7 : 4.5)
  }

  const violations = Object.entries(checks)
    .filter(([_, passed]) => !passed)
    .map(([check]) => check)

  return {
    element: element.name || 'unnamed-element',
    wcagLevel,
    violations,
    passes: Object.values(checks).filter(Boolean).length,
    score: violations.length === 0 ? 100 : Math.max(0, 100 - (violations.length * 20))
  }
}

/**
 * @description Create mock performance metrics for testing
 * @param {Object} options - Performance options
 * @returns {Object} Performance metrics
 */
export function createPerformanceMetrics(options = {}) {
  const {
    loadTime = Math.random() * 50 + 20,
    renderTime = Math.random() * 30 + 10,
    interactiveTime = Math.random() * 100 + 50,
    memoryUsage = Math.random() * 50 + 25
  } = options

  return {
    loadTime: parseFloat(loadTime.toFixed(2)),
    renderTime: parseFloat(renderTime.toFixed(2)),
    interactiveTime: parseFloat(interactiveTime.toFixed(2)),
    memoryUsage: parseFloat(memoryUsage.toFixed(2)),
    timestamp: Date.now(),
    performanceScore: Math.min(100, Math.max(0, 100 - (loadTime / 2) - (renderTime / 3)))
  }
}

/**
 * @description Wait for a condition to be met with timeout
 * @param {Function} condition - Condition function to check
 * @param {number} timeout - Timeout in milliseconds
 * @param {number} interval - Check interval in milliseconds
 * @returns {Promise<boolean>} Whether condition was met
 */
export async function waitForCondition(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  
  return false
}

/**
 * @description Assert that a value is within a range
 * @param {number} actual - Actual value
 * @param {number} expected - Expected value
 * @param {number} tolerance - Tolerance (default 5%)
 * @param {string} message - Error message
 */
export function expectWithinRange(actual, expected, tolerance = 0.05, message = '') {
  const range = expected * tolerance
  const min = expected - range
  const max = expected + range
  
  expect(actual, message || `Expected ${actual} to be within ${tolerance * 100}% of ${expected}`).toBeGreaterThanOrEqual(min)
  expect(actual, message || `Expected ${actual} to be within ${tolerance * 100}% of ${expected}`).toBeLessThanOrEqual(max)
}
