/**
 * @fileoverview Global test setup for nuxt-bdd library tests
 * @description Configure global test environment and utilities
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

/**
 * Global test configuration
 */
const testConfig = {
  // Performance tracking
  performanceEnabled: true,
  
  // Memory monitoring
  memoryMonitoring: true,
  
  // Cleanup behavior
  autoCleanup: true,
  
  // Test isolation
  isolateTests: true
}

/**
 * Global test state
 */
const globalTestState = {
  startTime: null,
  memoryBaseline: null,
  testCount: 0,
  failureCount: 0
}

/**
 * Setup global performance monitoring
 */
function setupPerformanceMonitoring() {
  if (!testConfig.performanceEnabled) return

  // Ensure performance API is available
  if (typeof global.performance === 'undefined') {
    global.performance = {
      now: () => Date.now(),
      memory: process.memoryUsage ? {
        get usedJSHeapSize() {
          return process.memoryUsage().heapUsed
        },
        get totalJSHeapSize() {
          return process.memoryUsage().heapTotal
        },
        get jsHeapSizeLimit() {
          return process.memoryUsage().heapTotal * 2
        }
      } : undefined
    }
  }
  
  globalTestState.startTime = performance.now()
  globalTestState.memoryBaseline = performance.memory?.usedJSHeapSize || 0
}

/**
 * Setup DOM environment polyfills
 */
function setupDOMPolyfills() {
  // Ensure window and document are available
  if (typeof global.window === 'undefined') {
    // jsdom should provide these, but add fallbacks
    console.warn('DOM environment not properly initialized')
  }

  // Add any additional DOM polyfills needed for Vue Test Utils
  if (typeof global.MutationObserver === 'undefined') {
    global.MutationObserver = class MockMutationObserver {
      constructor(callback) {
        this.callback = callback
      }
      observe() {}
      disconnect() {}
      takeRecords() { return [] }
    }
  }

  // Add ResizeObserver polyfill if needed
  if (typeof global.ResizeObserver === 'undefined') {
    global.ResizeObserver = class MockResizeObserver {
      constructor(callback) {
        this.callback = callback
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }
}

/**
 * Setup test utilities
 */
function setupTestUtilities() {
  // Add global test helpers
  global.testUtils = {
    // Wait utility
    wait: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),
    
    // Next tick utility
    nextTick: () => new Promise(resolve => setImmediate(resolve)),
    
    // Memory snapshot utility
    memorySnapshot: () => ({
      timestamp: performance.now(),
      memory: performance.memory?.usedJSHeapSize || 0,
      delta: (performance.memory?.usedJSHeapSize || 0) - globalTestState.memoryBaseline
    }),
    
    // Performance measurement utility
    measure: (label, fn) => {
      const start = performance.now()
      const result = fn()
      const duration = performance.now() - start
      
      if (result && typeof result.then === 'function') {
        return result.then(value => {
          const asyncDuration = performance.now() - start
          console.log(`⏱️  ${label}: ${asyncDuration.toFixed(2)}ms (async)`)
          return value
        })
      } else {
        console.log(`⏱️  ${label}: ${duration.toFixed(2)}ms`)
        return result
      }
    }
  }
}

/**
 * Setup console enhancements
 */
function setupConsoleEnhancements() {
  // Store original console methods
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error
  }

  // Add test context to console output
  console.log = (...args) => {
    originalConsole.log(`[TEST ${globalTestState.testCount}]`, ...args)
  }

  console.warn = (...args) => {
    originalConsole.warn(`[TEST ${globalTestState.testCount}] ⚠️ `, ...args)
  }

  console.error = (...args) => {
    originalConsole.error(`[TEST ${globalTestState.testCount}] ❌`, ...args)
    globalTestState.failureCount++
  }

  // Restore function
  global.restoreConsole = () => {
    console.log = originalConsole.log
    console.warn = originalConsole.warn
    console.error = originalConsole.error
  }
}

/**
 * Setup memory leak detection
 */
function setupMemoryLeakDetection() {
  if (!testConfig.memoryMonitoring) return

  let testStartMemory = 0
  
  beforeEach(() => {
    testStartMemory = performance.memory?.usedJSHeapSize || 0
  })
  
  afterEach(() => {
    if (!performance.memory) return
    
    const currentMemory = performance.memory.usedJSHeapSize
    const memoryIncrease = currentMemory - testStartMemory
    
    // Warn about significant memory increases (>10MB per test)
    if (memoryIncrease > 10 * 1024 * 1024) {
      console.warn(`High memory increase detected: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)
    }
    
    // Force garbage collection if available (helps with memory measurements)
    if (typeof global.gc === 'function') {
      global.gc()
    }
  })
}

/**
 * Setup test isolation
 */
function setupTestIsolation() {
  if (!testConfig.isolateTests) return

  beforeEach(() => {
    globalTestState.testCount++
    
    // Clear any global state that might leak between tests
    if (global.testUtils) {
      // Reset any global test state
    }
  })

  afterEach(() => {
    if (testConfig.autoCleanup) {
      // Cleanup global state after each test
      
      // Clear any remaining timeouts/intervals
      const highestTimeoutId = setTimeout(() => {}, 0)
      for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i)
        clearInterval(i)
      }
      
      // Clear immediate callbacks
      if (typeof clearImmediate !== 'undefined') {
        const highestImmediateId = setImmediate(() => {})
        for (let i = 0; i < highestImmediateId; i++) {
          clearImmediate(i)
        }
      }
    }
  })
}

/**
 * Setup error handling
 */
function setupErrorHandling() {
  // Catch unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
    globalTestState.failureCount++
  })

  // Catch uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error)
    globalTestState.failureCount++
  })
}

/**
 * Global setup - runs once before all tests
 */
beforeAll(async () => {
  console.log('🚀 Setting up nuxt-bdd test environment...')
  
  setupPerformanceMonitoring()
  setupDOMPolyfills()
  setupTestUtilities()
  setupConsoleEnhancements()
  setupMemoryLeakDetection()
  setupTestIsolation()
  setupErrorHandling()
  
  console.log('✅ Test environment setup complete')
  console.log(`📊 Node.js version: ${process.version}`)
  console.log(`📊 Memory baseline: ${(globalTestState.memoryBaseline / 1024 / 1024).toFixed(2)}MB`)
})

/**
 * Global cleanup - runs once after all tests
 */
afterAll(() => {
  const totalTime = performance.now() - globalTestState.startTime
  const currentMemory = performance.memory?.usedJSHeapSize || 0
  const memoryDelta = currentMemory - globalTestState.memoryBaseline
  
  console.log('\n📊 Test Suite Summary:')
  console.log(`⏱️  Total time: ${totalTime.toFixed(2)}ms`)
  console.log(`📈 Tests executed: ${globalTestState.testCount}`)
  console.log(`❌ Failures detected: ${globalTestState.failureCount}`)
  console.log(`💾 Memory delta: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`)
  
  if (memoryDelta > 50 * 1024 * 1024) {
    console.warn('⚠️  High memory usage detected - possible memory leaks')
  }
  
  // Restore console
  if (global.restoreConsole) {
    global.restoreConsole()
  }
  
  console.log('🧹 Test environment cleanup complete')
})

/**
 * Export test configuration for use in tests
 */
export { testConfig, globalTestState }