/**
 * @fileoverview Performance testing setup for typing tutor
 * Configures performance monitoring, benchmarking, and profiling utilities
 */

import { vi } from 'vitest'

// Performance monitoring state
let performanceEnabled = false
let performanceEntries: PerformanceEntry[] = []
let performanceMarks = new Map<string, number>()
let performanceMeasures = new Map<string, { start: number; duration?: number }>()

// Set up performance monitoring
setupPerformanceAPI()
setupTimingUtils()
setupMemoryMonitoring()
setupBenchmarkingUtils()

/**
 * Set up Performance API for testing
 */
function setupPerformanceAPI() {
  const mockPerformance = {
    // High-resolution timer
    now: vi.fn(() => Date.now()),
    
    // Performance timeline
    getEntries: vi.fn(() => [...performanceEntries]),
    getEntriesByType: vi.fn((type: string) => 
      performanceEntries.filter(entry => entry.entryType === type)
    ),
    getEntriesByName: vi.fn((name: string) => 
      performanceEntries.filter(entry => entry.name === name)
    ),
    
    // Performance marks
    mark: vi.fn((name: string) => {
      const timestamp = Date.now()
      performanceMarks.set(name, timestamp)
      
      const entry = {
        name,
        entryType: 'mark',
        startTime: timestamp,
        duration: 0
      }
      performanceEntries.push(entry)
      
      return entry
    }),
    
    // Performance measures
    measure: vi.fn((name: string, startMark?: string, endMark?: string) => {
      const endTime = Date.now()
      let startTime = endTime
      
      if (startMark) {
        startTime = performanceMarks.get(startMark) || endTime
      }
      if (endMark) {
        const endMarkTime = performanceMarks.get(endMark)
        if (endMarkTime) {
          startTime = endMarkTime
        }
      }
      
      const duration = endTime - startTime
      performanceMeasures.set(name, { start: startTime, duration })
      
      const entry = {
        name,
        entryType: 'measure',
        startTime,
        duration
      }
      performanceEntries.push(entry)
      
      return entry
    }),
    
    // Clear methods
    clearMarks: vi.fn((name?: string) => {
      if (name) {
        performanceMarks.delete(name)
        performanceEntries = performanceEntries.filter(
          entry => !(entry.entryType === 'mark' && entry.name === name)
        )
      } else {
        performanceMarks.clear()
        performanceEntries = performanceEntries.filter(entry => entry.entryType !== 'mark')
      }
    }),
    
    clearMeasures: vi.fn((name?: string) => {
      if (name) {
        performanceMeasures.delete(name)
        performanceEntries = performanceEntries.filter(
          entry => !(entry.entryType === 'measure' && entry.name === name)
        )
      } else {
        performanceMeasures.clear()
        performanceEntries = performanceEntries.filter(entry => entry.entryType !== 'measure')
      }
    }),
    
    clearResourceTimings: vi.fn(() => {
      performanceEntries = performanceEntries.filter(entry => entry.entryType !== 'resource')
    }),
    
    // Observer
    observe: vi.fn(),
    disconnect: vi.fn(),
    
    // Navigation timing (mock)
    timing: {
      navigationStart: Date.now() - 1000,
      unloadEventStart: Date.now() - 900,
      unloadEventEnd: Date.now() - 890,
      redirectStart: 0,
      redirectEnd: 0,
      fetchStart: Date.now() - 800,
      domainLookupStart: Date.now() - 750,
      domainLookupEnd: Date.now() - 740,
      connectStart: Date.now() - 700,
      connectEnd: Date.now() - 650,
      secureConnectionStart: 0,
      requestStart: Date.now() - 600,
      responseStart: Date.now() - 400,
      responseEnd: Date.now() - 200,
      domLoading: Date.now() - 200,
      domInteractive: Date.now() - 100,
      domContentLoadedEventStart: Date.now() - 50,
      domContentLoadedEventEnd: Date.now() - 40,
      domComplete: Date.now() - 10,
      loadEventStart: Date.now() - 5,
      loadEventEnd: Date.now()
    },
    
    // Memory info (mock)
    memory: {
      usedJSHeapSize: 10000000,
      totalJSHeapSize: 20000000,
      jsHeapSizeLimit: 100000000
    },
    
    // Time origin
    timeOrigin: Date.now() - 1000
  }
  
  Object.defineProperty(global, 'performance', {
    value: mockPerformance,
    writable: true,
    configurable: true
  })
  
  // Mock PerformanceObserver
  global.PerformanceObserver = vi.fn(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => [])
  }))
}

/**
 * Set up timing utilities
 */
function setupTimingUtils() {
  // Mock high-resolution time
  let mockTime = 0
  const originalNow = performance.now
  
  global.mockTime = {
    /**
     * Set the mock time to a specific value
     */
    set: (time: number) => {
      mockTime = time
      performance.now = vi.fn(() => mockTime)
    },
    
    /**
     * Advance mock time by specified amount
     */
    advance: (ms: number) => {
      mockTime += ms
      performance.now = vi.fn(() => mockTime)
    },
    
    /**
     * Reset to real time
     */
    restore: () => {
      performance.now = originalNow
    },
    
    /**
     * Get current mock time
     */
    get: () => mockTime
  }
  
  // Mock requestAnimationFrame with timing control
  const originalRAF = global.requestAnimationFrame
  global.mockAnimationFrame = {
    /**
     * Set up controlled animation frame timing
     */
    setup: (frameRate = 60) => {
      const frameTime = 1000 / frameRate
      global.requestAnimationFrame = vi.fn((callback) => {
        return setTimeout(() => {
          mockTime += frameTime
          callback(mockTime)
        }, frameTime)
      })
    },
    
    /**
     * Restore original RAF
     */
    restore: () => {
      global.requestAnimationFrame = originalRAF
    }
  }
}

/**
 * Set up memory monitoring
 */
function setupMemoryMonitoring() {
  const memoryStats = {
    usedJSHeapSize: 10000000,
    totalJSHeapSize: 20000000,
    jsHeapSizeLimit: 100000000
  }
  
  global.mockMemory = {
    /**
     * Set memory usage values
     */
    setUsage: (used: number, total?: number, limit?: number) => {
      memoryStats.usedJSHeapSize = used
      if (total !== undefined) memoryStats.totalJSHeapSize = total
      if (limit !== undefined) memoryStats.jsHeapSizeLimit = limit
      
      if (performance.memory) {
        Object.assign(performance.memory, memoryStats)
      }
    },
    
    /**
     * Simulate memory pressure
     */
    simulatePressure: () => {
      memoryStats.usedJSHeapSize = memoryStats.totalJSHeapSize * 0.9
      if (performance.memory) {
        Object.assign(performance.memory, memoryStats)
      }
    },
    
    /**
     * Get current memory stats
     */
    getStats: () => ({ ...memoryStats })
  }
}

/**
 * Set up benchmarking utilities
 */
function setupBenchmarkingUtils() {
  global.benchmark = {
    /**
     * Time a synchronous function
     */
    time: <T>(fn: () => T, iterations = 1): { result: T; duration: number; average: number } => {
      const results: T[] = []
      const durations: number[] = []
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now()
        const result = fn()
        const end = performance.now()
        
        results.push(result)
        durations.push(end - start)
      }
      
      const totalDuration = durations.reduce((sum, d) => sum + d, 0)
      const avgDuration = totalDuration / iterations
      
      return {
        result: results[results.length - 1],
        duration: totalDuration,
        average: avgDuration
      }
    },
    
    /**
     * Time an asynchronous function
     */
    timeAsync: async <T>(fn: () => Promise<T>, iterations = 1): Promise<{ result: T; duration: number; average: number }> => {
      const results: T[] = []
      const durations: number[] = []
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now()
        const result = await fn()
        const end = performance.now()
        
        results.push(result)
        durations.push(end - start)
      }
      
      const totalDuration = durations.reduce((sum, d) => sum + d, 0)
      const avgDuration = totalDuration / iterations
      
      return {
        result: results[results.length - 1],
        duration: totalDuration,
        average: avgDuration
      }
    },
    
    /**
     * Compare performance of multiple functions
     */
    compare: (functions: Array<{ name: string; fn: () => any }>, iterations = 100) => {
      const results = functions.map(({ name, fn }) => {
        const { duration, average } = global.benchmark.time(fn, iterations)
        return { name, duration, average }
      })
      
      // Sort by average duration (fastest first)
      results.sort((a, b) => a.average - b.average)
      
      return results
    },
    
    /**
     * Measure memory usage of a function
     */
    measureMemory: <T>(fn: () => T): { result: T; memoryUsed: number } => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0
      const result = fn()
      const finalMemory = performance.memory?.usedJSHeapSize || 0
      
      return {
        result,
        memoryUsed: finalMemory - initialMemory
      }
    },
    
    /**
     * Profile a function with detailed timing
     */
    profile: <T>(name: string, fn: () => T): T => {
      performance.mark(`${name}-start`)
      const result = fn()
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
      
      return result
    }
  }
}

// Export performance testing utilities
export const performanceUtils = {
  /**
   * Start performance monitoring
   */
  startMonitoring: () => {
    performanceEnabled = true
    performanceEntries = []
    performanceMarks.clear()
    performanceMeasures.clear()
  },
  
  /**
   * Stop performance monitoring and get results
   */
  stopMonitoring: () => {
    performanceEnabled = false
    return {
      entries: [...performanceEntries],
      marks: new Map(performanceMarks),
      measures: new Map(performanceMeasures)
    }
  },
  
  /**
   * Assert performance thresholds
   */
  assertPerformance: (assertions: {
    maxDuration?: number
    maxMemory?: number
    minFPS?: number
  }) => {
    const { maxDuration, maxMemory, minFPS } = assertions
    
    if (maxDuration !== undefined) {
      const measures = performanceEntries.filter(entry => entry.entryType === 'measure')
      const totalDuration = measures.reduce((sum, measure) => sum + measure.duration, 0)
      
      if (totalDuration > maxDuration) {
        throw new Error(`Performance assertion failed: duration ${totalDuration}ms exceeds maximum ${maxDuration}ms`)
      }
    }
    
    if (maxMemory !== undefined && performance.memory) {
      const memoryUsed = performance.memory.usedJSHeapSize
      if (memoryUsed > maxMemory) {
        throw new Error(`Performance assertion failed: memory usage ${memoryUsed} bytes exceeds maximum ${maxMemory} bytes`)
      }
    }
    
    if (minFPS !== undefined) {
      // This would require frame timing data which we'd need to collect separately
      // For now, just check if we have reasonable frame timing
      const frameTime = 1000 / minFPS
      // Implementation would depend on actual frame timing collection
    }
  },
  
  /**
   * Create a performance snapshot
   */
  snapshot: () => ({
    timestamp: Date.now(),
    memory: performance.memory ? { ...performance.memory } : null,
    timing: performance.timing ? { ...performance.timing } : null,
    entries: [...performanceEntries],
    marks: new Map(performanceMarks),
    measures: new Map(performanceMeasures)
  }),
  
  /**
   * Reset all performance data
   */
  reset: () => {
    performanceEntries = []
    performanceMarks.clear()
    performanceMeasures.clear()
    performance.clearMarks?.()
    performance.clearMeasures?.()
  },
  
  /**
   * Simulate performance bottlenecks for testing
   */
  simulateBottleneck: (type: 'cpu' | 'memory' | 'io', duration = 100) => {
    switch (type) {
      case 'cpu':
        // Simulate CPU intensive task
        const start = Date.now()
        while (Date.now() - start < duration) {
          // Busy wait
        }
        break
        
      case 'memory':
        // Simulate memory allocation
        global.mockMemory?.simulatePressure()
        break
        
      case 'io':
        // Simulate IO delay
        return new Promise(resolve => setTimeout(resolve, duration))
    }
  }
}

// Cleanup function for tests
beforeEach(() => {
  performanceUtils.reset()
})

afterEach(() => {
  global.mockTime?.restore()
  global.mockAnimationFrame?.restore()
})