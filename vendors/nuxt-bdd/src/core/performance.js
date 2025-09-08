/**
 * Performance Testing Utilities - Measure and assert performance metrics
 * @fileoverview Framework-agnostic performance testing utilities
 */

import { expect } from 'vitest'

/**
 * Performance measurement and assertion utilities
 */
export class PerformanceTester {
  constructor() {
    this.measurements = new Map()
    this.thresholds = {
      renderTime: 16, // 60fps target
      paintTime: 100,
      layoutTime: 50,
      scriptTime: 50,
      interactionTime: 100,
      memoryMB: 10
    }
  }

  /**
   * Measure operation execution time
   * @param {string} name - Measurement name
   * @param {Function} operation - Operation to measure
   * @param {Object} options - Measurement options
   * @returns {Promise<Object>} Performance metrics
   */
  async measure(name, operation, options = {}) {
    const { iterations = 10, warmup = 3 } = options
    const measurements = []

    // Warmup iterations
    for (let i = 0; i < warmup; i++) {
      await operation()
    }

    // Actual measurements
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await operation()
      const end = performance.now()
      measurements.push(end - start)
    }

    const metrics = this._calculateMetrics(measurements)
    this.measurements.set(name, metrics)

    return metrics
  }

  /**
   * Measure component render time
   * @param {string} componentName - Component name
   * @param {Function} renderFn - Render function
   * @param {Object} options - Options
   * @returns {Promise<Object>} Render metrics
   */
  async measureRender(componentName, renderFn, options = {}) {
    return this.measure(`render:${componentName}`, renderFn, options)
  }

  /**
   * Measure user interaction response time
   * @param {string} interactionName - Interaction name
   * @param {Function} interactionFn - Interaction function
   * @param {Object} options - Options
   * @returns {Promise<Object>} Interaction metrics
   */
  async measureInteraction(interactionName, interactionFn, options = {}) {
    return this.measure(`interaction:${interactionName}`, interactionFn, options)
  }

  /**
   * Measure memory usage during operation
   * @param {Function} operation - Operation to measure
   * @param {Object} options - Options
   * @returns {Promise<Object>} Memory metrics
   */
  async measureMemory(operation, options = {}) {
    const { iterations = 5 } = options
    const initialMemory = this._getMemoryUsage()
    
    for (let i = 0; i < iterations; i++) {
      await operation()
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
    
    const finalMemory = this._getMemoryUsage()
    
    return {
      initial: initialMemory,
      final: finalMemory,
      increase: finalMemory - initialMemory,
      increaseMB: (finalMemory - initialMemory) / (1024 * 1024)
    }
  }

  /**
   * Assert operation meets performance threshold
   * @param {string} name - Measurement name
   * @param {number} threshold - Threshold in ms
   * @param {string} message - Custom message
   */
  expectWithinThreshold(name, threshold, message) {
    const metrics = this.measurements.get(name)
    if (!metrics) {
      throw new Error(`No measurements found for: ${name}`)
    }

    const assertMessage = message || 
      `${name} should complete within ${threshold}ms (actual: ${metrics.average.toFixed(2)}ms)`

    expect(metrics.average, assertMessage).toBeLessThan(threshold)
  }

  /**
   * Assert consistent performance (low variance)
   * @param {string} name - Measurement name
   * @param {number} maxVariancePercent - Maximum variance percentage
   */
  expectConsistent(name, maxVariancePercent = 20) {
    const metrics = this.measurements.get(name)
    if (!metrics) {
      throw new Error(`No measurements found for: ${name}`)
    }

    const variance = (metrics.standardDeviation / metrics.average) * 100
    const message = `Performance should be consistent for ${name}. Variance: ${variance.toFixed(2)}% (max: ${maxVariancePercent}%)`
    
    expect(variance, message).toBeLessThan(maxVariancePercent)
  }

  /**
   * Assert memory usage within limit
   * @param {Object} memoryMetrics - Memory metrics from measureMemory
   * @param {number} maxIncreaseMB - Maximum memory increase in MB
   */
  expectMemoryWithin(memoryMetrics, maxIncreaseMB = this.thresholds.memoryMB) {
    const message = `Memory usage should not exceed ${maxIncreaseMB}MB (actual: ${memoryMetrics.increaseMB.toFixed(2)}MB)`
    expect(memoryMetrics.increaseMB, message).toBeLessThan(maxIncreaseMB)
  }

  /**
   * Create performance benchmark suite
   * @param {Object} operations - Object with operation names and functions
   * @param {Object} options - Benchmark options
   * @returns {Promise<Object>} Benchmark results
   */
  async benchmark(operations, options = {}) {
    const { 
      iterations = 10,
      thresholds = this.thresholds
    } = options
    
    const results = {}

    for (const [name, operation] of Object.entries(operations)) {
      const metrics = await this.measure(name, operation, { iterations })
      const threshold = thresholds[name] || thresholds.renderTime
      
      results[name] = {
        ...metrics,
        threshold,
        passed: metrics.average <= threshold,
        grade: this._getPerformanceGrade(metrics.average, threshold)
      }
    }

    return results
  }

  /**
   * Generate performance report
   * @param {Object} results - Benchmark results
   * @returns {string} Formatted report
   */
  generateReport(results) {
    let report = '📊 Performance Report\n'
    report += '═'.repeat(50) + '\n\n'

    for (const [name, metrics] of Object.entries(results)) {
      const status = metrics.passed ? '✅' : '❌'
      const grade = metrics.grade || 'N/A'
      
      report += `${status} ${name} (${grade})\n`
      report += `   Average: ${metrics.average.toFixed(2)}ms\n`
      report += `   Range: ${metrics.min.toFixed(2)}ms - ${metrics.max.toFixed(2)}ms\n`
      report += `   P95: ${metrics.p95.toFixed(2)}ms | P99: ${metrics.p99.toFixed(2)}ms\n`
      report += `   Threshold: ${metrics.threshold}ms\n\n`
    }

    return report
  }

  /**
   * Measure Web Vitals (where available)
   * @returns {Promise<Object>} Web Vitals metrics
   */
  async measureWebVitals() {
    const vitals = {}

    // First Contentful Paint
    const paintEntries = performance.getEntriesByType('paint')
    paintEntries.forEach(entry => {
      if (entry.name === 'first-contentful-paint') {
        vitals.fcp = entry.startTime
      }
    })

    // Largest Contentful Paint (if available)
    if (window.PerformanceObserver) {
      vitals.lcp = await this._measureLCP()
      vitals.cls = await this._measureCLS()
      vitals.fid = await this._measureFID()
    }

    return vitals
  }

  /**
   * Create performance test decorator
   * @param {Object} options - Performance options
   * @returns {Function} Decorator function
   */
  withPerformanceTest(options = {}) {
    const { threshold = this.thresholds.renderTime } = options
    
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value
      
      descriptor.value = async function(...args) {
        const start = performance.now()
        const result = await originalMethod.apply(this, args)
        const duration = performance.now() - start
        
        if (duration > threshold) {
        }
        
        return result
      }
      
      return descriptor
    }
  }

  /**
   * Reset all measurements
   */
  reset() {
    this.measurements.clear()
  }

  /**
   * Export measurements data
   * @returns {Object} All measurements
   */
  export() {
    const data = {}
    for (const [key, value] of this.measurements.entries()) {
      data[key] = value
    }
    return data
  }

  /**
   * Calculate statistical metrics from measurements
   * @private
   * @param {Array} measurements - Array of measurement values
   * @returns {Object} Statistical metrics
   */
  _calculateMetrics(measurements) {
    const sorted = [...measurements].sort((a, b) => a - b)
    const sum = measurements.reduce((acc, val) => acc + val, 0)
    const average = sum / measurements.length
    
    const variance = measurements.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / measurements.length
    const standardDeviation = Math.sqrt(variance)

    return {
      average,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      standardDeviation,
      variance,
      measurements: [...measurements]
    }
  }

  /**
   * Get current memory usage
   * @private
   * @returns {number} Memory usage in bytes
   */
  _getMemoryUsage() {
    return performance.memory?.usedJSHeapSize || 0
  }

  /**
   * Get performance grade based on threshold
   * @private
   * @param {number} actual - Actual performance value
   * @param {number} threshold - Threshold value
   * @returns {string} Performance grade
   */
  _getPerformanceGrade(actual, threshold) {
    const ratio = actual / threshold
    
    if (ratio <= 0.5) return 'A+'
    if (ratio <= 0.7) return 'A'
    if (ratio <= 0.85) return 'B'
    if (ratio <= 1.0) return 'C'
    if (ratio <= 1.5) return 'D'
    return 'F'
  }

  /**
   * Measure Largest Contentful Paint
   * @private
   * @returns {Promise<number>} LCP value
   */
  async _measureLCP() {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        resolve(lastEntry.startTime)
        observer.disconnect()
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      
      // Fallback timeout
      setTimeout(() => {
        observer.disconnect()
        resolve(0)
      }, 5000)
    })
  }

  /**
   * Measure Cumulative Layout Shift
   * @private
   * @returns {Promise<number>} CLS value
   */
  async _measureCLS() {
    return new Promise((resolve) => {
      let cumulativeScore = 0
      
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            cumulativeScore += entry.value
          }
        }
      })
      
      observer.observe({ entryTypes: ['layout-shift'] })
      
      setTimeout(() => {
        observer.disconnect()
        resolve(cumulativeScore)
      }, 5000)
    })
  }

  /**
   * Measure First Input Delay
   * @private
   * @returns {Promise<number>} FID value
   */
  async _measureFID() {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'first-input') {
            resolve(entry.processingStart - entry.startTime)
            observer.disconnect()
            return
          }
        }
      })
      
      observer.observe({ entryTypes: ['first-input'] })
      
      // Fallback timeout
      setTimeout(() => {
        observer.disconnect()
        resolve(0)
      }, 10000)
    })
  }
}

/**
 * Global performance tester instance
 */
export const perf = new PerformanceTester()

/**
 * Quick performance test function
 * @param {string} name - Test name
 * @param {Function} operation - Operation to test
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Performance metrics
 */
export async function perfTest(name, operation, options = {}) {
  const { threshold = perf.thresholds.renderTime } = options
  const metrics = await perf.measure(name, operation, options)
  perf.expectWithinThreshold(name, threshold)
  return metrics
}

/**
 * Memory leak detection test
 * @param {Function} operation - Operation to test
 * @param {number} iterations - Number of iterations
 * @param {number} maxIncreaseMB - Maximum memory increase in MB
 * @returns {Promise<Object>} Memory metrics
 */
export async function memoryLeakTest(operation, iterations = 10, maxIncreaseMB = 5) {
  const memoryMetrics = await perf.measureMemory(operation, { iterations })
  perf.expectMemoryWithin(memoryMetrics, maxIncreaseMB)
  return memoryMetrics
}

/**
 * Component render performance test
 * @param {string} componentName - Component name
 * @param {Function} renderFn - Render function
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Render metrics
 */
export async function renderPerfTest(componentName, renderFn, options = {}) {
  const metrics = await perf.measureRender(componentName, renderFn, options)
  const threshold = options.threshold || perf.thresholds.renderTime
  perf.expectWithinThreshold(`render:${componentName}`, threshold)
  return metrics
}

export default PerformanceTester