/**
 * Performance testing utilities and helpers
 * Provides tools for measuring latency, memory usage, and simulating user interactions
 */

/**
 * Creates a typing simulator for performance testing
 * @param {Document} document - DOM document
 * @returns {Object} Typing simulator with helper methods
 */
export function createTypingSimulator(document) {
  return {
    /**
     * Simulates typing a string with realistic timing
     * @param {HTMLElement} element - Target element
     * @param {string} text - Text to type
     * @param {Object} options - Timing options
     */
    async typeText(element, text, options = {}) {
      const {
        minDelay = 20,
        maxDelay = 80,
        errorRate = 0.02,
        backspaceChance = 0.1
      } = options

      for (let i = 0; i < text.length; i++) {
        const char = text[i]
        
        // Occasionally simulate typing errors
        if (Math.random() < errorRate) {
          const wrongChar = String.fromCharCode(97 + Math.floor(Math.random() * 26))
          await this.typeCharacter(element, wrongChar)
          
          // Sometimes notice the error and backspace
          if (Math.random() < backspaceChance) {
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
            await this.typeCharacter(element, 'Backspace', 8)
          }
        }
        
        await this.typeCharacter(element, char)
        
        // Random delay between keystrokes
        const delay = minDelay + Math.random() * (maxDelay - minDelay)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    },

    /**
     * Simulates a single character input
     * @param {HTMLElement} element - Target element
     * @param {string} char - Character to type
     * @param {number} keyCode - Key code (optional)
     */
    async typeCharacter(element, char, keyCode) {
      const events = ['keydown', 'keypress', 'input', 'keyup']
      
      for (const eventType of events) {
        const event = new document.defaultView.KeyboardEvent(eventType, {
          key: char,
          code: char === 'Backspace' ? 'Backspace' : `Key${char.toUpperCase()}`,
          keyCode: keyCode || char.charCodeAt(0),
          bubbles: true,
          cancelable: true
        })
        
        element.dispatchEvent(event)
        
        // Small delay between events to simulate real behavior
        await new Promise(resolve => setTimeout(resolve, 1))
      }
    },

    /**
     * Simulates burst typing (very fast input)
     * @param {HTMLElement} element - Target element
     * @param {string} text - Text to type
     */
    async burstType(element, text) {
      for (const char of text) {
        await this.typeCharacter(element, char)
        await new Promise(resolve => setTimeout(resolve, 5 + Math.random() * 10))
      }
    }
  }
}

/**
 * Measures current memory usage
 * @returns {number} Memory usage in MB
 */
export function measureMemoryUsage() {
  if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
    // Browser environment
    return window.performance.memory.usedJSHeapSize / 1024 / 1024
  } else if (typeof process !== 'undefined' && process.memoryUsage) {
    // Node.js environment
    const usage = process.memoryUsage()
    return usage.heapUsed / 1024 / 1024
  }
  
  // Fallback: simulate memory usage
  return 10 + Math.random() * 50
}

/**
 * Waits for the next animation frame
 * @returns {Promise} Promise that resolves on next frame
 */
export function waitForNextFrame() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(resolve)
    } else {
      setTimeout(resolve, 16) // ~60fps fallback
    }
  })
}

/**
 * Measures the time it takes to execute a function
 * @param {Function} fn - Function to measure
 * @param {number} iterations - Number of iterations to run
 * @returns {Object} Performance statistics
 */
export async function measureExecutionTime(fn, iterations = 1) {
  const times = []
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    await fn()
    const end = performance.now()
    times.push(end - start)
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length
  const min = Math.min(...times)
  const max = Math.max(...times)
  const median = times.sort((a, b) => a - b)[Math.floor(times.length / 2)]
  
  return { avg, min, max, median, times }
}

/**
 * Creates a performance monitor that tracks various metrics
 * @returns {Object} Performance monitor instance
 */
export function createPerformanceMonitor() {
  const metrics = {
    frameRates: [],
    memorySnapshots: [],
    eventLatencies: [],
    renderTimes: []
  }
  
  let monitoring = false
  let frameCount = 0
  let lastFrameTime = performance.now()
  
  return {
    start() {
      if (monitoring) return
      monitoring = true
      
      const measureFrame = () => {
        if (!monitoring) return
        
        const currentTime = performance.now()
        const frameTime = currentTime - lastFrameTime
        
        if (frameTime > 0) {
          const fps = 1000 / frameTime
          metrics.frameRates.push(fps)
        }
        
        lastFrameTime = currentTime
        frameCount++
        
        // Take memory snapshot every 60 frames
        if (frameCount % 60 === 0) {
          metrics.memorySnapshots.push(measureMemoryUsage())
        }
        
        requestAnimationFrame(measureFrame)
      }
      
      requestAnimationFrame(measureFrame)
    },
    
    stop() {
      monitoring = false
    },
    
    recordEventLatency(latency) {
      metrics.eventLatencies.push(latency)
    },
    
    recordRenderTime(time) {
      metrics.renderTimes.push(time)
    },
    
    getMetrics() {
      return {
        ...metrics,
        avgFrameRate: metrics.frameRates.length > 0 
          ? metrics.frameRates.reduce((a, b) => a + b, 0) / metrics.frameRates.length 
          : 0,
        avgEventLatency: metrics.eventLatencies.length > 0
          ? metrics.eventLatencies.reduce((a, b) => a + b, 0) / metrics.eventLatencies.length
          : 0,
        avgRenderTime: metrics.renderTimes.length > 0
          ? metrics.renderTimes.reduce((a, b) => a + b, 0) / metrics.renderTimes.length
          : 0,
        memoryGrowth: metrics.memorySnapshots.length > 1
          ? metrics.memorySnapshots[metrics.memorySnapshots.length - 1] - metrics.memorySnapshots[0]
          : 0
      }
    },
    
    reset() {
      metrics.frameRates = []
      metrics.memorySnapshots = []
      metrics.eventLatencies = []
      metrics.renderTimes = []
      frameCount = 0
    }
  }
}

/**
 * Simulates network latency for testing
 * @param {number} min - Minimum latency in ms
 * @param {number} max - Maximum latency in ms
 * @returns {Promise} Promise that resolves after simulated latency
 */
export function simulateNetworkLatency(min = 50, max = 200) {
  const latency = min + Math.random() * (max - min)
  return new Promise(resolve => setTimeout(resolve, latency))
}

/**
 * Creates a load tester for concurrent scenarios
 * @param {Object} options - Load testing options
 * @returns {Object} Load tester instance
 */
export function createLoadTester(options = {}) {
  const {
    maxConcurrency = 50,
    rampUpTime = 1000,
    testDuration = 5000
  } = options
  
  return {
    async runLoadTest(testFunction, userCount = 10) {
      const results = {
        totalUsers: userCount,
        completedUsers: 0,
        failedUsers: 0,
        avgResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        responseTimes: []
      }
      
      const promises = []
      const startTime = Date.now()
      
      for (let i = 0; i < userCount; i++) {
        // Ramp up users gradually
        const startDelay = (i / userCount) * rampUpTime
        
        promises.push(
          new Promise(async (resolve) => {
            await new Promise(r => setTimeout(r, startDelay))
            
            const userStartTime = performance.now()
            
            try {
              await testFunction(i)
              const responseTime = performance.now() - userStartTime
              
              results.responseTimes.push(responseTime)
              results.completedUsers++
              
              if (responseTime < results.minResponseTime) {
                results.minResponseTime = responseTime
              }
              if (responseTime > results.maxResponseTime) {
                results.maxResponseTime = responseTime
              }
            } catch (error) {
              results.failedUsers++
              console.error(`User ${i} failed:`, error)
            }
            
            resolve()
          })
        )
      }
      
      await Promise.all(promises)
      
      // Calculate average response time
      if (results.responseTimes.length > 0) {
        results.avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length
      }
      
      results.totalTime = Date.now() - startTime
      results.successRate = (results.completedUsers / userCount) * 100
      
      return results
    }
  }
}

/**
 * Validates performance thresholds
 * @param {Object} metrics - Measured metrics
 * @param {Object} thresholds - Performance thresholds
 * @returns {Object} Validation results
 */
export function validatePerformanceThresholds(metrics, thresholds) {
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
  }
  
  for (const [key, threshold] of Object.entries(thresholds)) {
    const metric = metrics[key]
    
    if (metric === undefined) {
      results.warnings++
      results.details.push({
        metric: key,
        status: 'warning',
        message: `Metric ${key} not found in results`
      })
      continue
    }
    
    let passed = false
    let message = ''
    
    if (typeof threshold === 'object' && threshold.max !== undefined) {
      passed = metric <= threshold.max
      message = `${key}: ${metric} ${passed ? '≤' : '>'} ${threshold.max}`
    } else if (typeof threshold === 'object' && threshold.min !== undefined) {
      passed = metric >= threshold.min
      message = `${key}: ${metric} ${passed ? '≥' : '<'} ${threshold.min}`
    } else {
      passed = metric <= threshold
      message = `${key}: ${metric} ${passed ? '≤' : '>'} ${threshold}`
    }
    
    if (passed) {
      results.passed++
    } else {
      results.failed++
    }
    
    results.details.push({
      metric: key,
      status: passed ? 'passed' : 'failed',
      message,
      measured: metric,
      threshold: threshold
    })
  }
  
  return results
}
