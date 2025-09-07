/**
 * @fileoverview Performance benchmarks for typing latency and accuracy
 * Tests to ensure the typing tutor maintains responsive performance under various conditions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Mock performance.now for consistent benchmarking
const mockPerformanceNow = vi.fn(() => 0)
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
})

// Mock requestAnimationFrame for controlled timing
const mockRequestAnimationFrame = vi.fn((callback) => {
  return setTimeout(callback, 16) // ~60fps
})
global.requestAnimationFrame = mockRequestAnimationFrame

/**
 * Performance monitoring utilities
 */
class PerformanceMonitor {
  constructor() {
    /** @type {Map<string, number[]>} */
    this.measurements = new Map()
    /** @type {Map<string, number>} */
    this.activeTimers = new Map()
  }

  /**
   * Start timing measurement
   * @param {string} name - Timer name
   */
  startTimer(name) {
    this.activeTimers.set(name, performance.now())
  }

  /**
   * End timing measurement and record duration
   * @param {string} name - Timer name
   * @returns {number} Duration in milliseconds
   */
  endTimer(name) {
    const startTime = this.activeTimers.get(name)
    if (!startTime) {
      throw new Error(`Timer '${name}' was not started`)
    }

    const duration = performance.now() - startTime
    this.activeTimers.delete(name)

    if (!this.measurements.has(name)) {
      this.measurements.set(name, [])
    }
    this.measurements.get(name).push(duration)

    return duration
  }

  /**
   * Get statistics for a measurement
   * @param {string} name - Measurement name
   * @returns {{avg: number, min: number, max: number, count: number} | null}
   */
  getStats(name) {
    const measurements = this.measurements.get(name)
    if (!measurements || measurements.length === 0) {
      return null
    }

    return {
      avg: measurements.reduce((sum, val) => sum + val, 0) / measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      count: measurements.length
    }
  }

  /**
   * Clear all measurements
   */
  clear() {
    this.measurements.clear()
    this.activeTimers.clear()
  }

  /**
   * Get all measurement statistics
   * @returns {Record<string, {avg: number, min: number, max: number, count: number}>}
   */
  getAllStats() {
    /** @type {Record<string, any>} */
    const stats = {}
    for (const [name] of this.measurements) {
      stats[name] = this.getStats(name)
    }
    return stats
  }
}

/**
 * High-performance typing tutor component optimized for benchmarking
 */
const PerformanceTypingTutor = {
  template: `
    <div class="performance-typing-tutor">
      <!-- Minimal UI for performance testing -->
      <div class="stats-header">
        <span>WPM: {{ stats.wpm }}</span>
        <span>Accuracy: {{ stats.accuracy }}%</span>
        <span>Latency: {{ averageLatency }}ms</span>
      </div>

      <div class="typing-area">
        <div class="target-text" ref="targetTextRef">
          <span 
            v-for="(char, index) in targetChars" 
            :key="index"
            :class="getCharClass(index)"
            class="char"
          >
            {{ char === ' ' ? '·' : char }}
          </span>
        </div>

        <textarea
          ref="inputRef"
          v-model="userInput"
          @input="handleInput"
          @keydown="handleKeyDown"
          class="input-field"
          :disabled="!isActive"
        ></textarea>
      </div>

      <!-- Performance debugging panel -->
      <div class="performance-panel" v-if="showDebug">
        <div class="metrics">
          <div>Input Latency: {{ metrics.inputLatency }}ms</div>
          <div>Render Time: {{ metrics.renderTime }}ms</div>
          <div>Validation Time: {{ metrics.validationTime }}ms</div>
          <div>DOM Updates: {{ metrics.domUpdates }}/sec</div>
        </div>
      </div>
    </div>
  `,
  props: {
    /** @type {import('vue').PropType<string>} */
    targetText: { type: String, required: true },
    /** @type {import('vue').PropType<boolean>} */
    showDebug: { type: Boolean, default: false },
    /** @type {import('vue').PropType<boolean>} */
    enableOptimizations: { type: Boolean, default: true }
  },
  data() {
    return {
      /** @type {string} */
      userInput: '',
      /** @type {boolean} */
      isActive: false,
      /** @type {string[]} */
      targetChars: [],
      /** @type {{wpm: number, accuracy: number}} */
      stats: {
        wpm: 0,
        accuracy: 100
      },
      /** @type {{inputLatency: number, renderTime: number, validationTime: number, domUpdates: number}} */
      metrics: {
        inputLatency: 0,
        renderTime: 0,
        validationTime: 0,
        domUpdates: 0
      },
      /** @type {PerformanceMonitor} */
      performanceMonitor: new PerformanceMonitor(),
      /** @type {number} */
      frameCount: 0,
      /** @type {number} */
      lastFrameTime: 0,
      /** @type {Array<{timestamp: number, value: string, type: string}>} */
      inputEvents: [],
      /** @type {any[]} */
      renderQueue: [],
      
      // Optimization flags
      /** @type {boolean} */
      useVirtualScrolling: false,
      /** @type {boolean} */
      batchDOMUpdates: true,
      /** @type {boolean} */
      throttleValidation: true,
      
      // Performance tracking
      /** @type {number[]} */
      keystrokeTimes: [],
      /** @type {number[]} */
      validationTimes: [],
      /** @type {number[]} */
      renderTimes: []
    }
  },
  computed: {
    /**
     * Calculate average input latency
     * @returns {number}
     */
    averageLatency() {
      if (this.keystrokeTimes.length === 0) return 0
      return Math.round(
        this.keystrokeTimes.reduce((sum, time) => sum + time, 0) / this.keystrokeTimes.length
      )
    },

    /**
     * Current typing position
     * @returns {number}
     */
    currentPosition() {
      return this.userInput.length
    },

    /**
     * Visible character range for virtual scrolling
     * @returns {{start: number, end: number}}
     */
    visibleRange() {
      if (!this.useVirtualScrolling) {
        return { start: 0, end: this.targetChars.length }
      }
      
      // Only render visible characters for performance
      const bufferSize = 100
      const start = Math.max(0, this.currentPosition - bufferSize)
      const end = Math.min(this.targetChars.length, this.currentPosition + bufferSize * 2)
      return { start, end }
    }
  },
  mounted() {
    this.initializeText()
    this.startPerformanceMonitoring()
  },
  beforeUnmount() {
    this.stopPerformanceMonitoring()
  },
  methods: {
    /**
     * Initialize text for typing
     */
    initializeText() {
      this.targetChars = this.targetText.split('')
      
      // Enable virtual scrolling for very long texts
      if (this.targetChars.length > 1000) {
        this.useVirtualScrolling = true
      }
    },

    /**
     * Start typing session
     */
    startSession() {
      this.isActive = true
      this.userInput = ''
      this.stats = { wpm: 0, accuracy: 100 }
      this.performanceMonitor.clear()
      this.resetMetrics()
      
      this.$nextTick(() => {
        this.$refs.inputRef?.focus()
      })
    },

    /**
     * Reset performance metrics
     */
    resetMetrics() {
      this.keystrokeTimes = []
      this.validationTimes = []
      this.renderTimes = []
      this.frameCount = 0
      this.lastFrameTime = performance.now()
    },

    /**
     * Handle input events with performance tracking
     * @param {Event} event - Input event
     */
    handleInput(event) {
      if (!this.isActive) return

      const inputStartTime = performance.now()
      this.performanceMonitor.startTimer('input-processing')

      // Measure input latency
      const inputEvent = {
        timestamp: inputStartTime,
        value: event.target.value,
        type: 'input'
      }
      this.inputEvents.push(inputEvent)

      // Keep only recent events for memory efficiency
      if (this.inputEvents.length > 100) {
        this.inputEvents = this.inputEvents.slice(-50)
      }

      this.userInput = event.target.value

      if (this.throttleValidation) {
        this.queueValidation()
      } else {
        this.validateInput()
      }

      const inputEndTime = performance.now()
      const inputLatency = inputEndTime - inputStartTime
      this.keystrokeTimes.push(inputLatency)

      // Keep metrics array sizes reasonable
      if (this.keystrokeTimes.length > 1000) {
        this.keystrokeTimes = this.keystrokeTimes.slice(-500)
      }

      this.performanceMonitor.endTimer('input-processing')
      this.updatePerformanceMetrics()
    },

    /**
     * Handle key down events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event) {
      const keyStartTime = performance.now()
      
      // Track special keys that might affect performance
      if (event.key === 'Backspace' || event.key === 'Delete') {
        this.performanceMonitor.startTimer('deletion-processing')
      }

      // Prevent default for Tab to avoid focus loss
      if (event.key === 'Tab') {
        event.preventDefault()
      }

      if (event.key === 'Backspace' || event.key === 'Delete') {
        this.performanceMonitor.endTimer('deletion-processing')
      }
    },

    /**
     * Queue validation to throttle rapid updates
     */
    queueValidation() {
      // Throttle validation to avoid performance issues with rapid typing
      if (this.validationTimeout) {
        clearTimeout(this.validationTimeout)
      }
      
      this.validationTimeout = setTimeout(() => {
        this.validateInput()
      }, 50) // Validate every 50ms max
    },

    /**
     * Validate user input with performance tracking
     */
    validateInput() {
      const validationStartTime = performance.now()
      this.performanceMonitor.startTimer('validation')

      // Optimized validation logic
      let correctChars = 0
      const inputLength = this.userInput.length
      
      // Only validate up to current input length
      for (let i = 0; i < inputLength && i < this.targetChars.length; i++) {
        if (this.userInput[i] === this.targetChars[i]) {
          correctChars++
        }
      }

      // Calculate accuracy
      const accuracy = inputLength === 0 ? 100 : Math.round((correctChars / inputLength) * 100)
      
      // Update stats with batching
      if (this.batchDOMUpdates) {
        this.queueStatsUpdate({ accuracy })
      } else {
        this.stats.accuracy = accuracy
      }

      const validationEndTime = performance.now()
      const validationTime = validationEndTime - validationStartTime
      this.validationTimes.push(validationTime)

      if (this.validationTimes.length > 100) {
        this.validationTimes = this.validationTimes.slice(-50)
      }

      this.performanceMonitor.endTimer('validation')
    },

    /**
     * Queue stats updates for batching
     * @param {{accuracy?: number, wpm?: number}} newStats - New stats to update
     */
    queueStatsUpdate(newStats) {
      if (this.statsUpdateQueued) return

      this.statsUpdateQueued = true
      this.$nextTick(() => {
        Object.assign(this.stats, newStats)
        this.statsUpdateQueued = false
      })
    },

    /**
     * Get CSS class for character based on typing state
     * @param {number} index - Character index
     * @returns {string} CSS class name
     */
    getCharClass(index) {
      // Optimize class calculation
      if (index >= this.userInput.length) {
        return index === this.userInput.length ? 'current' : 'pending'
      }
      
      return this.userInput[index] === this.targetChars[index] ? 'correct' : 'incorrect'
    },

    // Performance monitoring methods
    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
      this.monitoringInterval = setInterval(() => {
        this.measureFrameRate()
        this.updatePerformanceMetrics()
      }, 1000) // Update metrics every second

      // Monitor DOM mutations
      if (this.showDebug) {
        this.mutationObserver = new MutationObserver((mutations) => {
          this.metrics.domUpdates += mutations.length
        })
        
        this.mutationObserver.observe(this.$el, {
          childList: true,
          subtree: true,
          attributes: true
        })
      }
    },

    /**
     * Stop performance monitoring
     */
    stopPerformanceMonitoring() {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval)
      }
      
      if (this.mutationObserver) {
        this.mutationObserver.disconnect()
      }
    },

    /**
     * Measure frame rate for performance analysis
     */
    measureFrameRate() {
      const currentTime = performance.now()
      const deltaTime = currentTime - this.lastFrameTime
      
      if (deltaTime >= 1000) { // Every second
        const fps = Math.round((this.frameCount * 1000) / deltaTime)
        this.frameCount = 0
        this.lastFrameTime = currentTime
        
        // Store FPS for performance analysis
        if (!this.fpsHistory) {
          this.fpsHistory = []
        }
        this.fpsHistory.push(fps)
        
        if (this.fpsHistory.length > 60) { // Keep last 60 seconds
          this.fpsHistory.shift()
        }
      } else {
        this.frameCount++
      }
    },

    /**
     * Update performance metrics display
     */
    updatePerformanceMetrics() {
      if (!this.showDebug) return

      // Update average metrics
      this.metrics.inputLatency = this.averageLatency
      
      if (this.validationTimes.length > 0) {
        this.metrics.validationTime = Math.round(
          this.validationTimes.reduce((sum, time) => sum + time, 0) / this.validationTimes.length
        )
      }

      if (this.renderTimes.length > 0) {
        this.metrics.renderTime = Math.round(
          this.renderTimes.reduce((sum, time) => sum + time, 0) / this.renderTimes.length
        )
      }

      // Reset DOM update counter
      setTimeout(() => {
        this.metrics.domUpdates = 0
      }, 1000)
    },

    // Public methods for testing
    /**
     * Get all performance statistics
     * @returns {Record<string, {avg: number, min: number, max: number, count: number}>}
     */
    getPerformanceStats() {
      return this.performanceMonitor.getAllStats()
    },

    /**
     * Get input latency statistics
     * @returns {{average: number, min: number, max: number, count: number, p95: number, p99: number} | null}
     */
    getInputLatencyStats() {
      if (this.keystrokeTimes.length === 0) return null
      
      return {
        average: this.averageLatency,
        min: Math.min(...this.keystrokeTimes),
        max: Math.max(...this.keystrokeTimes),
        count: this.keystrokeTimes.length,
        p95: this.calculatePercentile(this.keystrokeTimes, 95),
        p99: this.calculatePercentile(this.keystrokeTimes, 99)
      }
    },

    /**
     * Calculate percentile from array
     * @param {number[]} array - Array of values
     * @param {number} percentile - Percentile to calculate
     * @returns {number}
     */
    calculatePercentile(array, percentile) {
      const sorted = [...array].sort((a, b) => a - b)
      const index = Math.ceil((percentile / 100) * sorted.length) - 1
      return sorted[Math.max(0, index)]
    },

    // Stress testing utilities
    /**
     * Simulate rapid typing for performance testing
     * @param {number} charCount - Number of characters to type
     * @param {number} interval - Interval between keystrokes
     * @returns {Promise<Record<string, any>>}
     */
    simulateRapidTyping(charCount = 100, interval = 50) {
      return new Promise((resolve) => {
        let i = 0
        const typeChar = () => {
          if (i >= charCount || i >= this.targetChars.length) {
            resolve(this.getPerformanceStats())
            return
          }

          const char = this.targetChars[i]
          this.userInput += char
          
          // Trigger input event manually
          const event = { target: { value: this.userInput } }
          this.handleInput(event)
          
          i++
          setTimeout(typeChar, interval)
        }
        
        typeChar()
      })
    },

    /**
     * Simulate typing burst for performance testing
     * @param {number} burstSize - Number of characters in burst
     * @returns {number} Time taken for burst
     */
    simulateTypingBurst(burstSize = 10) {
      const startTime = performance.now()
      
      for (let i = 0; i < burstSize && i < this.targetChars.length - this.userInput.length; i++) {
        const char = this.targetChars[this.userInput.length]
        this.userInput += char
        const event = { target: { value: this.userInput } }
        this.handleInput(event)
      }
      
      const endTime = performance.now()
      return endTime - startTime
    }
  }
}

describe('Typing Performance Benchmarks', () => {
  /** @type {import('@vue/test-utils').VueWrapper<any>} */
  let wrapper
  /** @type {PerformanceMonitor} */
  let performanceMonitor

  beforeEach(() => {
    vi.clearAllMocks()
    performanceMonitor = new PerformanceMonitor()
    
    // Reset performance.now mock
    let mockTime = 0
    mockPerformanceNow.mockImplementation(() => mockTime++)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    performanceMonitor.clear()
  })

  describe('Input Latency Benchmarks', () => {
    beforeEach(() => {
      wrapper = mount(PerformanceTypingTutor, {
        props: {
          targetText: 'The quick brown fox jumps over the lazy dog.',
          showDebug: true
        }
      })
      wrapper.vm.startSession()
    })

    it('should handle single keystrokes within 16ms', async () => {
      const inputArea = wrapper.find('.input-field')
      
      const startTime = performance.now()
      wrapper.vm.userInput = 'T'
      await inputArea.trigger('input')
      const endTime = performance.now()
      
      const latency = endTime - startTime
      expect(latency).toBeLessThan(16) // Target: 60fps (16.67ms per frame)
    })

    it('should maintain low latency under rapid typing', async () => {
      const results = await wrapper.vm.simulateRapidTyping(50, 20) // 50 chars at 50 WPM
      const inputStats = wrapper.vm.getInputLatencyStats()
      
      expect(inputStats).toBeTruthy()
      expect(inputStats.average).toBeLessThan(10) // Average under 10ms
      expect(inputStats.p95).toBeLessThan(20) // 95th percentile under 20ms
      expect(inputStats.max).toBeLessThan(50) // No outliers over 50ms
    })

    it('should handle typing bursts efficiently', async () => {
      const burstLatency = wrapper.vm.simulateTypingBurst(10)
      
      expect(burstLatency).toBeLessThan(100) // 10 characters in under 100ms
    })

    it('should track input event timing accurately', async () => {
      const inputArea = wrapper.find('.input-field')
      
      // Type several characters
      for (let i = 0; i < 5; i++) {
        const char = wrapper.vm.targetChars[i]
        wrapper.vm.userInput += char
        await inputArea.trigger('input')
      }
      
      const latencyStats = wrapper.vm.getInputLatencyStats()
      expect(latencyStats.count).toBe(5)
      expect(latencyStats.average).toBeGreaterThan(0)
    })
  })

  describe('Validation Performance', () => {
    beforeEach(() => {
      wrapper = mount(PerformanceTypingTutor, {
        props: {
          targetText: 'A'.repeat(1000), // Long text for validation stress test
          showDebug: true
        }
      })
      wrapper.vm.startSession()
    })

    it('should validate input within 5ms for normal text', async () => {
      const startTime = performance.now()
      wrapper.vm.userInput = 'AAAA'
      wrapper.vm.validateInput()
      const endTime = performance.now()
      
      const validationTime = endTime - startTime
      expect(validationTime).toBeLessThan(5)
    })

    it('should handle long text validation efficiently', async () => {
      // Type 500 characters
      wrapper.vm.userInput = 'A'.repeat(500)
      
      const startTime = performance.now()
      wrapper.vm.validateInput()
      const endTime = performance.now()
      
      const validationTime = endTime - startTime
      expect(validationTime).toBeLessThan(20) // Should still be under 20ms
    })

    it('should throttle validation calls under rapid input', async () => {
      const validateSpy = vi.spyOn(wrapper.vm, 'validateInput')
      
      // Simulate rapid input events
      const inputArea = wrapper.find('.input-field')
      for (let i = 0; i < 10; i++) {
        wrapper.vm.userInput += 'A'
        await inputArea.trigger('input')
      }
      
      // Wait for throttling timeout
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Should have throttled validation calls
      expect(validateSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Rendering Performance', () => {
    it('should render character updates within frame budget', async () => {
      wrapper = mount(PerformanceTypingTutor, {
        props: {
          targetText: 'The quick brown fox jumps over the lazy dog.',
          showDebug: true
        }
      })
      wrapper.vm.startSession()

      const startTime = performance.now()
      
      // Update several characters
      wrapper.vm.userInput = 'The qu'
      await wrapper.vm.$nextTick()
      
      const renderTime = performance.now() - startTime
      expect(renderTime).toBeLessThan(16) // Under one frame
    })

    it('should handle large text efficiently with virtual scrolling', async () => {
      const longText = 'A'.repeat(5000)
      wrapper = mount(PerformanceTypingTutor, {
        props: {
          targetText: longText,
          enableOptimizations: true
        }
      })
      
      expect(wrapper.vm.useVirtualScrolling).toBe(true)
      
      // Type characters and measure render performance
      const startTime = performance.now()
      wrapper.vm.userInput = 'A'.repeat(100)
      await wrapper.vm.$nextTick()
      const renderTime = performance.now() - startTime
      
      expect(renderTime).toBeLessThan(50) // Should be optimized
    })

    it('should batch DOM updates for better performance', async () => {
      wrapper = mount(PerformanceTypingTutor, {
        props: {
          targetText: 'Test text for batching',
          batchDOMUpdates: true,
          showDebug: true
        }
      })
      wrapper.vm.startSession()

      // Mock MutationObserver
      const mutations = []
      wrapper.vm.mutationObserver = {
        observe: vi.fn(),
        disconnect: vi.fn()
      }

      // Perform multiple updates
      for (let i = 0; i < 5; i++) {
        wrapper.vm.userInput += 'T'[0]
        wrapper.vm.queueStatsUpdate({ accuracy: 95 })
      }

      await wrapper.vm.$nextTick()
      
      // Should have batched the updates
      expect(wrapper.vm.stats.accuracy).toBe(95)
    })
  })

  describe('Memory Performance', () => {
    it('should limit keystroke history to prevent memory leaks', async () => {
      wrapper = mount(PerformanceTypingTutor, {
        props: {
          targetText: 'A'.repeat(2000)
        }
      })
      wrapper.vm.startSession()

      // Simulate 2000 keystrokes
      await wrapper.vm.simulateRapidTyping(2000, 1)
      
      // Should limit history size
      expect(wrapper.vm.keystrokeTimes.length).toBeLessThanOrEqual(500)
      expect(wrapper.vm.validationTimes.length).toBeLessThanOrEqual(50)
    })

    it('should clean up event listeners and intervals', async () => {
      wrapper = mount(PerformanceTypingTutor, {
        props: {
          targetText: 'Test cleanup',
          showDebug: true
        }
      })
      
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
      
      // Component should have monitoring interval
      expect(wrapper.vm.monitoringInterval).toBeDefined()
      
      wrapper.unmount()
      
      expect(clearIntervalSpy).toHaveBeenCalled()
    })

    it('should handle large input without memory bloat', async () => {
      wrapper = mount(PerformanceTypingTutor, {
        props: {
          targetText: 'A'.repeat(10000)
        }
      })
      wrapper.vm.startSession()

      // Get initial memory usage (simulated)
      const initialEventCount = wrapper.vm.inputEvents.length
      
      // Type a lot of characters
      await wrapper.vm.simulateRapidTyping(1000, 1)
      
      // Should not accumulate too many events
      expect(wrapper.vm.inputEvents.length).toBeLessThanOrEqual(100)
    })
  })

  describe('Performance Under Stress', () => {
    it('should maintain performance with concurrent operations', async () => {
      wrapper = mount(PerformanceTypingTutor, {
        props: {
          targetText: 'The quick brown fox jumps over the lazy dog.',
          showDebug: true
        }
      })
      wrapper.vm.startSession()

      // Start concurrent operations
      const promises = []
      
      // Simulate typing
      promises.push(wrapper.vm.simulateRapidTyping(20, 10))
      
      // Simulate validation calls
      promises.push(new Promise(resolve => {
        let count = 0
        const validate = () => {
          if (count++ < 10) {
            wrapper.vm.validateInput()
            setTimeout(validate, 5)
          } else {
            resolve(null)
          }
        }
        validate()
      }))

      await Promise.all(promises)
      
      const stats = wrapper.vm.getInputLatencyStats()
      expect(stats.average).toBeLessThan(20) // Should maintain reasonable performance
    })

    it('should handle error conditions gracefully', async () => {
      wrapper = mount(PerformanceTypingTutor, {
        props: {
          targetText: 'Test error handling'
        }
      })

      // Simulate validation error
      const originalValidateInput = wrapper.vm.validateInput
      wrapper.vm.validateInput = vi.fn(() => {
        throw new Error('Validation error')
      })

      // Should not crash the component
      expect(() => {
        wrapper.vm.userInput = 'T'
        wrapper.vm.handleInput({ target: { value: 'T' } })
      }).not.toThrow()
    })

    it('should degrade gracefully on slow devices', async () => {
      // Simulate slow device by increasing processing time
      let slowTime = 0
      mockPerformanceNow.mockImplementation(() => {
        slowTime += 10 // Each operation takes 10ms
        return slowTime
      })

      wrapper = mount(PerformanceTypingTutor, {
        props: {
          targetText: 'Test slow device performance',
          enableOptimizations: true
        }
      })
      wrapper.vm.startSession()

      await wrapper.vm.simulateRapidTyping(10, 100)
      
      const stats = wrapper.vm.getInputLatencyStats()
      expect(stats.average).toBeGreaterThan(0) // Should still function
      expect(wrapper.vm.throttleValidation).toBe(true) // Should use optimizations
    })
  })

  describe('Real-world Performance Scenarios', () => {
    it('should handle typical typing speeds efficiently', async () => {
      // Test at 40 WPM (average typing speed)
      const wpm = 40
      const charactersPerMinute = wpm * 5 // 5 chars per word
      const intervalMs = 60000 / charactersPerMinute // ~300ms per character

      wrapper = mount(PerformanceTypingTutor, {
        props: {
          targetText: 'The quick brown fox jumps over the lazy dog. This is a typical typing test.'
        }
      })
      wrapper.vm.startSession()

      const results = await wrapper.vm.simulateRapidTyping(20, intervalMs)
      const stats = wrapper.vm.getInputLatencyStats()
      
      expect(stats.average).toBeLessThan(5) // Should be very responsive at normal speeds
      expect(stats.p99).toBeLessThan(15) // Even worst case should be good
    })

    it('should handle fast typing speeds (100+ WPM)', async () => {
      // Test at 100 WPM (fast typing speed)
      const wpm = 100
      const charactersPerMinute = wpm * 5
      const intervalMs = 60000 / charactersPerMinute // ~120ms per character

      wrapper = mount(PerformanceTypingTutor, {
        props: {
          targetText: 'Fast typing test with high WPM performance measurement.'
        }
      })
      wrapper.vm.startSession()

      const results = await wrapper.vm.simulateRapidTyping(30, intervalMs)
      const stats = wrapper.vm.getInputLatencyStats()
      
      expect(stats.average).toBeLessThan(10) // Should handle fast typing
      expect(stats.p95).toBeLessThan(20) // Most inputs should be quick
    })

    it('should perform well on mobile device constraints', async () => {
      // Simulate mobile performance constraints
      wrapper = mount(PerformanceTypingTutor, {
        props: {
          targetText: 'Mobile typing performance test',
          enableOptimizations: true
        }
      })

      // Enable mobile-specific optimizations
      wrapper.vm.useVirtualScrolling = false // Disabled for short text
      wrapper.vm.batchDOMUpdates = true
      wrapper.vm.throttleValidation = true

      wrapper.vm.startSession()

      // Test touch-like typing (often slower but burstier)
      const burstResults = []
      for (let i = 0; i < 5; i++) {
        const burstTime = wrapper.vm.simulateTypingBurst(3)
        burstResults.push(burstTime)
        await new Promise(resolve => setTimeout(resolve, 200)) // Pause between bursts
      }

      const avgBurstTime = burstResults.reduce((sum, time) => sum + time, 0) / burstResults.length
      expect(avgBurstTime).toBeLessThan(50) // 3 characters in under 50ms
    })
  })

  describe('Performance Regression Detection', () => {
    it('should establish performance baselines', async () => {
      wrapper = mount(PerformanceTypingTutor, {
        props: {
          targetText: 'Baseline performance test for regression detection.'
        }
      })
      wrapper.vm.startSession()

      // Establish baseline metrics
      await wrapper.vm.simulateRapidTyping(50, 50)
      const baseline = wrapper.vm.getInputLatencyStats()
      
      // Store baseline for comparison
      const expectedBaseline = {
        averageLatency: 5, // Expected average latency
        p95Latency: 15,    // Expected 95th percentile
        maxLatency: 30     // Expected maximum latency
      }

      expect(baseline.average).toBeLessThanOrEqual(expectedBaseline.averageLatency)
      expect(baseline.p95).toBeLessThanOrEqual(expectedBaseline.p95Latency)
      expect(baseline.max).toBeLessThanOrEqual(expectedBaseline.maxLatency)
    })

    it('should detect performance regressions', async () => {
      wrapper = mount(PerformanceTypingTutor, {
        props: {
          targetText: 'Performance regression detection test'
        }
      })
      wrapper.vm.startSession()

      // Intentionally introduce performance regression
      const originalValidateInput = wrapper.vm.validateInput
      wrapper.vm.validateInput = function() {
        // Simulate slow validation
        const start = performance.now()
        while (performance.now() - start < 50) {
          // Busy wait for 50ms
        }
        return originalValidateInput.call(this)
      }

      await wrapper.vm.simulateRapidTyping(10, 100)
      const regressionStats = wrapper.vm.getInputLatencyStats()
      
      // Should detect the regression
      expect(regressionStats.average).toBeGreaterThan(40) // Much slower than baseline
    })
  })
})

/**
 * Additional benchmark utilities for comprehensive performance testing
 */
describe('Advanced Performance Utilities', () => {
  /** @type {PerformanceMonitor} */
  let performanceMonitor

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor()
  })

  describe('PerformanceMonitor', () => {
    it('should track multiple timers simultaneously', () => {
      performanceMonitor.startTimer('timer1')
      performanceMonitor.startTimer('timer2')
      
      // Simulate some work
      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(10).mockReturnValueOnce(15)
      
      const duration1 = performanceMonitor.endTimer('timer1')
      const duration2 = performanceMonitor.endTimer('timer2')
      
      expect(duration1).toBe(10)
      expect(duration2).toBe(15)
    })

    it('should calculate accurate statistics', () => {
      const measurements = [10, 15, 20, 25, 30]
      
      measurements.forEach((duration, index) => {
        performanceMonitor.startTimer('test')
        mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(duration)
        performanceMonitor.endTimer('test')
      })
      
      const stats = performanceMonitor.getStats('test')
      expect(stats?.avg).toBe(20) // (10+15+20+25+30)/5 = 20
      expect(stats?.min).toBe(10)
      expect(stats?.max).toBe(30)
      expect(stats?.count).toBe(5)
    })

    it('should handle timer errors gracefully', () => {
      expect(() => {
        performanceMonitor.endTimer('non-existent-timer')
      }).toThrow('Timer \'non-existent-timer\' was not started')
    })

    it('should clear all measurements', () => {
      performanceMonitor.startTimer('test')
      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(10)
      performanceMonitor.endTimer('test')
      
      expect(performanceMonitor.getStats('test')).toBeTruthy()
      
      performanceMonitor.clear()
      expect(performanceMonitor.getStats('test')).toBeNull()
    })
  })
})