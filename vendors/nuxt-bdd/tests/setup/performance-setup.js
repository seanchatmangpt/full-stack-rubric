/**
 * @fileoverview Performance testing setup for nuxt-bdd library
 * @description Setup performance monitoring, benchmarking, and regression detection
 */

import { beforeAll, afterAll, expect } from 'vitest'

/**
 * Performance baseline storage
 */
const performanceBaselines = new Map()

/**
 * Current performance metrics
 */
const currentMetrics = {
  tests: new Map(),
  memory: [],
  timing: [],
  regressions: []
}

/**
 * Performance thresholds
 */
const performanceThresholds = {
  // Bridge initialization should be fast
  bridgeInit: { maxTime: 10, maxMemory: 1024 * 1024 }, // 10ms, 1MB
  
  // Step registration should be very fast
  stepRegistration: { maxTime: 1, maxMemory: 100 * 1024 }, // 1ms, 100KB
  
  // Component mounting should be reasonable
  componentMount: { maxTime: 50, maxMemory: 2 * 1024 * 1024 }, // 50ms, 2MB
  
  // Feature validation should be efficient
  featureValidation: { maxTime: 100, maxMemory: 1024 * 1024 }, // 100ms, 1MB
  
  // Step generation should be fast
  stepGeneration: { maxTime: 50, maxMemory: 1024 * 1024 }, // 50ms, 1MB
  
  // General test performance
  generalTest: { maxTime: 1000, maxMemory: 10 * 1024 * 1024 } // 1s, 10MB
}

/**
 * Performance measurement utilities
 */
export class PerformanceProfiler {
  constructor(name) {
    this.name = name
    this.measurements = []
    this.startTime = null
    this.startMemory = null
  }

  start() {
    // Force garbage collection if available for accurate measurement
    if (typeof global.gc === 'function') {
      global.gc()
    }

    this.startTime = performance.now()
    this.startMemory = this.getMemoryUsage()
    return this
  }

  stop() {
    if (!this.startTime) {
      throw new Error('Profiler not started')
    }

    const endTime = performance.now()
    const endMemory = this.getMemoryUsage()

    const measurement = {
      name: this.name,
      duration: endTime - this.startTime,
      memoryDelta: endMemory - this.startMemory,
      timestamp: new Date().toISOString()
    }

    this.measurements.push(measurement)
    currentMetrics.timing.push(measurement)

    return measurement
  }

  getMemoryUsage() {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize
    }
    if (process.memoryUsage) {
      return process.memoryUsage().heapUsed
    }
    return 0
  }

  getMeasurements() {
    return [...this.measurements]
  }

  getAverages() {
    if (this.measurements.length === 0) return null

    const totalDuration = this.measurements.reduce((sum, m) => sum + m.duration, 0)
    const totalMemory = this.measurements.reduce((sum, m) => sum + m.memoryDelta, 0)

    return {
      averageDuration: totalDuration / this.measurements.length,
      averageMemory: totalMemory / this.measurements.length,
      sampleCount: this.measurements.length
    }
  }

  reset() {
    this.measurements = []
    this.startTime = null
    this.startMemory = null
  }

  assertPerformance(threshold) {
    const averages = this.getAverages()
    if (!averages) return

    if (threshold.maxTime && averages.averageDuration > threshold.maxTime) {
      throw new Error(
        `Performance regression: ${this.name} average duration ${averages.averageDuration.toFixed(2)}ms exceeds threshold ${threshold.maxTime}ms`
      )
    }

    if (threshold.maxMemory && averages.averageMemory > threshold.maxMemory) {
      throw new Error(
        `Memory regression: ${this.name} average memory delta ${(averages.averageMemory / 1024).toFixed(2)}KB exceeds threshold ${(threshold.maxMemory / 1024).toFixed(2)}KB`
      )
    }
  }
}

/**
 * Memory leak detector
 */
export class MemoryLeakDetector {
  constructor(sampleSize = 10) {
    this.sampleSize = sampleSize
    this.samples = []
    this.baselineEstablished = false
  }

  sample(label = '') {
    const usage = this.getCurrentMemoryUsage()
    const timestamp = performance.now()

    this.samples.push({ usage, timestamp, label })

    // Keep only the latest samples
    if (this.samples.length > this.sampleSize * 2) {
      this.samples = this.samples.slice(-this.sampleSize)
    }

    return usage
  }

  getCurrentMemoryUsage() {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize
    }
    if (process.memoryUsage) {
      return process.memoryUsage().heapUsed
    }
    return 0
  }

  detectLeak(threshold = 10 * 1024 * 1024) { // 10MB default threshold
    if (this.samples.length < this.sampleSize) {
      return { hasLeak: false, reason: 'Insufficient samples' }
    }

    const recent = this.samples.slice(-this.sampleSize)
    const early = this.samples.slice(0, this.sampleSize)

    const recentAvg = recent.reduce((sum, s) => sum + s.usage, 0) / recent.length
    const earlyAvg = early.reduce((sum, s) => sum + s.usage, 0) / early.length

    const increase = recentAvg - earlyAvg

    return {
      hasLeak: increase > threshold,
      increase,
      recentAvg,
      earlyAvg,
      samples: this.samples.length,
      threshold
    }
  }

  reset() {
    this.samples = []
    this.baselineEstablished = false
  }
}

/**
 * Performance regression detector
 */
export class RegressionDetector {
  constructor() {
    this.baselines = new Map()
  }

  recordBaseline(operation, duration, memory = 0) {
    if (!this.baselines.has(operation)) {
      this.baselines.set(operation, {
        durations: [],
        memories: [],
        established: false
      })
    }

    const baseline = this.baselines.get(operation)
    baseline.durations.push(duration)
    baseline.memories.push(memory)

    // Keep rolling average of last 100 measurements
    if (baseline.durations.length > 100) {
      baseline.durations = baseline.durations.slice(-50)
      baseline.memories = baseline.memories.slice(-50)
    }

    // Establish baseline after 10 measurements
    if (baseline.durations.length >= 10) {
      baseline.established = true
    }
  }

  checkRegression(operation, duration, memory = 0, tolerance = 0.5) { // 50% tolerance
    if (!this.baselines.has(operation)) {
      this.recordBaseline(operation, duration, memory)
      return { hasRegression: false, reason: 'No baseline' }
    }

    const baseline = this.baselines.get(operation)
    
    if (!baseline.established) {
      this.recordBaseline(operation, duration, memory)
      return { hasRegression: false, reason: 'Baseline not established' }
    }

    const avgDuration = baseline.durations.reduce((a, b) => a + b, 0) / baseline.durations.length
    const avgMemory = baseline.memories.reduce((a, b) => a + b, 0) / baseline.memories.length

    const durationIncrease = (duration - avgDuration) / avgDuration
    const memoryIncrease = memory > 0 ? (memory - avgMemory) / avgMemory : 0

    const hasRegression = durationIncrease > tolerance || memoryIncrease > tolerance

    // Record current measurement
    this.recordBaseline(operation, duration, memory)

    return {
      hasRegression,
      durationIncrease,
      memoryIncrease,
      avgDuration,
      avgMemory,
      currentDuration: duration,
      currentMemory: memory
    }
  }

  getBaselines() {
    const result = {}
    for (const [operation, baseline] of this.baselines.entries()) {
      if (baseline.established) {
        result[operation] = {
          averageDuration: baseline.durations.reduce((a, b) => a + b, 0) / baseline.durations.length,
          averageMemory: baseline.memories.reduce((a, b) => a + b, 0) / baseline.memories.length,
          samples: baseline.durations.length
        }
      }
    }
    return result
  }
}

/**
 * Global instances
 */
export const memoryLeakDetector = new MemoryLeakDetector()
export const regressionDetector = new RegressionDetector()

/**
 * Performance test helpers
 */
export const perfHelpers = {
  /**
   * Create a profiler for a specific operation
   */
  createProfiler: (name) => new PerformanceProfiler(name),

  /**
   * Measure a synchronous function
   */
  measure: (name, fn, threshold = null) => {
    const profiler = new PerformanceProfiler(name)
    profiler.start()
    
    const result = fn()
    const measurement = profiler.stop()
    
    if (threshold) {
      profiler.assertPerformance(threshold)
    }
    
    return { result, measurement }
  },

  /**
   * Measure an asynchronous function
   */
  measureAsync: async (name, fn, threshold = null) => {
    const profiler = new PerformanceProfiler(name)
    profiler.start()
    
    const result = await fn()
    const measurement = profiler.stop()
    
    if (threshold) {
      profiler.assertPerformance(threshold)
    }
    
    return { result, measurement }
  },

  /**
   * Benchmark a function multiple times
   */
  benchmark: (name, fn, iterations = 10) => {
    const profiler = new PerformanceProfiler(name)
    const results = []

    for (let i = 0; i < iterations; i++) {
      profiler.start()
      const result = fn()
      const measurement = profiler.stop()
      results.push({ result, measurement })
    }

    return {
      results,
      averages: profiler.getAverages(),
      measurements: profiler.getMeasurements()
    }
  },

  /**
   * Check for memory leaks
   */
  checkMemoryLeak: (threshold) => {
    const leak = memoryLeakDetector.detectLeak(threshold)
    if (leak.hasLeak) {
      console.warn(`Memory leak detected: ${(leak.increase / 1024 / 1024).toFixed(2)}MB increase`)
    }
    return leak
  },

  /**
   * Check for performance regression
   */
  checkRegression: (operation, duration, memory = 0) => {
    return regressionDetector.checkRegression(operation, duration, memory)
  }
}

/**
 * Enhanced expect matchers for performance testing
 */
expect.extend({
  toBePerformant(measurement, threshold) {
    const { duration, memoryDelta } = measurement
    
    const durationPass = !threshold.maxTime || duration <= threshold.maxTime
    const memoryPass = !threshold.maxMemory || memoryDelta <= threshold.maxMemory
    
    const pass = durationPass && memoryPass
    
    if (pass) {
      return {
        message: () => `Expected performance to exceed threshold, but it was within limits`,
        pass: true
      }
    } else {
      const issues = []
      if (!durationPass) {
        issues.push(`duration ${duration.toFixed(2)}ms > ${threshold.maxTime}ms`)
      }
      if (!memoryPass) {
        issues.push(`memory ${(memoryDelta / 1024).toFixed(2)}KB > ${(threshold.maxMemory / 1024).toFixed(2)}KB`)
      }
      
      return {
        message: () => `Performance threshold exceeded: ${issues.join(', ')}`,
        pass: false
      }
    }
  },

  toHaveNoMemoryLeak(detector, threshold = 10 * 1024 * 1024) {
    const leak = detector.detectLeak(threshold)
    
    return {
      message: () => leak.hasLeak 
        ? `Memory leak detected: ${(leak.increase / 1024 / 1024).toFixed(2)}MB increase`
        : 'No memory leak detected',
      pass: !leak.hasLeak
    }
  },

  toHaveNoRegression(operation, measurement, tolerance = 0.5) {
    const { duration, memoryDelta } = measurement
    const regression = regressionDetector.checkRegression(operation, duration, memoryDelta, tolerance)
    
    return {
      message: () => regression.hasRegression
        ? `Performance regression detected for ${operation}: duration +${(regression.durationIncrease * 100).toFixed(1)}%, memory +${(regression.memoryIncrease * 100).toFixed(1)}%`
        : `No performance regression detected for ${operation}`,
      pass: !regression.hasRegression
    }
  }
})

/**
 * Setup performance monitoring
 */
beforeAll(() => {
  console.log('⚡ Setting up performance monitoring...')
  
  // Initialize memory leak detector
  memoryLeakDetector.sample('test-suite-start')
  
  // Setup global performance tracking
  global.performanceBaselines = performanceBaselines
  global.performanceThresholds = performanceThresholds
  global.perfHelpers = perfHelpers
  
  console.log('✅ Performance monitoring ready')
})

/**
 * Performance summary after all tests
 */
afterAll(() => {
  console.log('\n⚡ Performance Summary:')
  
  // Memory leak check
  memoryLeakDetector.sample('test-suite-end')
  const leak = memoryLeakDetector.detectLeak()
  
  if (leak.hasLeak) {
    console.warn(`⚠️  Memory leak detected: ${(leak.increase / 1024 / 1024).toFixed(2)}MB increase`)
  } else {
    console.log('✅ No memory leaks detected')
  }
  
  // Performance baselines
  const baselines = regressionDetector.getBaselines()
  if (Object.keys(baselines).length > 0) {
    console.log('\n📊 Performance Baselines:')
    for (const [operation, baseline] of Object.entries(baselines)) {
      console.log(`  ${operation}: ${baseline.averageDuration.toFixed(2)}ms avg, ${(baseline.averageMemory / 1024).toFixed(2)}KB avg (${baseline.samples} samples)`)
    }
  }
  
  // Timing summary
  if (currentMetrics.timing.length > 0) {
    const totalDuration = currentMetrics.timing.reduce((sum, m) => sum + m.duration, 0)
    const avgDuration = totalDuration / currentMetrics.timing.length
    console.log(`\n⏱️  Average test duration: ${avgDuration.toFixed(2)}ms`)
    console.log(`📈 Total measurements: ${currentMetrics.timing.length}`)
  }
})

/**
 * Export performance utilities
 */
export {
  performanceThresholds,
  currentMetrics,
  PerformanceProfiler,
  MemoryLeakDetector,
  RegressionDetector
}