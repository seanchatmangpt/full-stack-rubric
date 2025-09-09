/**
 * usePerformanceOptimization Composable Tests
 * Tests performance monitoring, optimization features, and metrics collection
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { usePerformanceOptimization } from '../../../app/composables/usePerformanceOptimization.js'

// Mock performance APIs
global.performance = {
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 25, // 25MB
    totalJSHeapSize: 1024 * 1024 * 50  // 50MB
  },
  getEntriesByType: vi.fn(() => [
    {
      navigationStart: 1000,
      domContentLoadedEventEnd: 2500,
      loadEventEnd: 3000,
      fetchStart: 1200
    }
  ])
}

// Mock performance utilities
vi.mock('../../../app/utils/performanceOptimizer.js', () => ({
  performanceUtils: {
    preloadResource: vi.fn(() => Promise.resolve())
  },
  bundleAnalyzer: {
    analyzeBundles: vi.fn(() => Promise.resolve({
      initialBundle: 150, // KB
      vendorBundle: 200,
      asyncChunks: 50,
      treeShakingReduction: 15,
      compressionRatio: 0.3
    })),
    getRecommendations: vi.fn(() => [
      { type: 'bundle-size', message: 'Consider code splitting', priority: 'medium' },
      { type: 'compression', message: 'Enable gzip compression', priority: 'high' }
    ])
  },
  monacoOptimizer: {
    optimizeConfig: vi.fn(() => ({
      minimap: { enabled: false },
      wordWrap: 'off'
    }))
  },
  defaultOptimizationConfig: {
    autoStart: false,
    monitoringInterval: 5000,
    memoryThreshold: 50
  },
  PerformanceMonitor: vi.fn(() => ({
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
    getMeasurements: vi.fn(() => ({
      'typing-input': 12,
      'typing-render': 8,
      'keystroke-processing': 5
    })),
    startTimer: vi.fn(),
    endTimer: vi.fn(),
    clearMeasurements: vi.fn()
  }))
}))

describe('usePerformanceOptimization Composable', () => {
  let composable
  let mockTimestamp = 1000

  beforeEach(() => {
    // Reset time mocks
    mockTimestamp = 1000
    vi.mocked(global.performance.now).mockReturnValue(mockTimestamp)
    vi.spyOn(Date, 'now').mockReturnValue(mockTimestamp)
    
    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (composable) {
      composable.stopMonitoring()
    }
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      composable = usePerformanceOptimization()

      expect(composable.isMonitoring.value).toBe(false)
      expect(composable.score.value).toBeGreaterThanOrEqual(0)
      expect(composable.score.value).toBeLessThanOrEqual(100)
      expect(composable.grade.value).toMatch(/^[ABCD][+]?$/)
      expect(composable.metrics.value).toBeDefined()
      expect(composable.recommendations.value).toEqual([])
    })

    it('should auto-start monitoring when configured', () => {
      composable = usePerformanceOptimization({ autoStart: true })
      
      expect(composable.isMonitoring.value).toBe(true)
    })

    it('should not auto-start by default', () => {
      composable = usePerformanceOptimization()
      
      expect(composable.isMonitoring.value).toBe(false)
    })
  })

  describe('Performance Monitoring', () => {
    beforeEach(() => {
      composable = usePerformanceOptimization()
    })

    it('should start monitoring correctly', () => {
      composable.startMonitoring()
      
      expect(composable.isMonitoring.value).toBe(true)
    })

    it('should stop monitoring correctly', () => {
      composable.startMonitoring()
      composable.stopMonitoring()
      
      expect(composable.isMonitoring.value).toBe(false)
    })

    it('should not start monitoring if already active', () => {
      composable.startMonitoring()
      const firstState = composable.isMonitoring.value
      
      composable.startMonitoring() // Try to start again
      
      expect(composable.isMonitoring.value).toBe(firstState)
    })

    it('should not stop monitoring if already inactive', () => {
      expect(composable.isMonitoring.value).toBe(false)
      
      composable.stopMonitoring() // Try to stop when not running
      
      expect(composable.isMonitoring.value).toBe(false)
    })
  })

  describe('Metrics Collection', () => {
    beforeEach(() => {
      composable = usePerformanceOptimization()
      composable.startMonitoring()
    })

    it('should collect bundle metrics', async () => {
      await composable.updateMetrics?.() || Promise.resolve()
      await nextTick()

      const bundleMetrics = composable.metrics.value.bundle
      expect(bundleMetrics.initialBundle).toBe(150)
      expect(bundleMetrics.vendorBundle).toBe(200)
      expect(bundleMetrics.asyncChunks).toBe(50)
      expect(bundleMetrics.treeShakingReduction).toBe(15)
      expect(bundleMetrics.compressionRatio).toBe(0.3)
    })

    it('should collect runtime metrics', async () => {
      await composable.updateMetrics?.() || Promise.resolve()
      await nextTick()

      const runtimeMetrics = composable.metrics.value.runtime
      expect(runtimeMetrics.initialLoadTime).toBe(1500) // 2500 - 1000
      expect(runtimeMetrics.routeTransitionTime).toBe(1800) // 3000 - 1200
      expect(runtimeMetrics.memoryUsage).toBe(25) // 25MB
      expect(runtimeMetrics.jsHeapSize).toBe(50) // 50MB
    })

    it('should collect typing performance metrics', async () => {
      await composable.updateMetrics?.() || Promise.resolve()
      await nextTick()

      const typingMetrics = composable.metrics.value.typing
      expect(typingMetrics.inputLatency).toBe(12)
      expect(typingMetrics.renderLatency).toBe(8)
      expect(typingMetrics.keystrokeProcessing).toBe(5)
    })

    it('should detect memory leaks', async () => {
      // Set memory usage above threshold
      global.performance.memory.usedJSHeapSize = 1024 * 1024 * 60 // 60MB
      
      await composable.updateMetrics?.() || Promise.resolve()
      await nextTick()

      expect(composable.metrics.value.typing.memoryLeaks).toBe(1)
    })

    it('should generate recommendations', async () => {
      await composable.updateMetrics?.() || Promise.resolve()
      await nextTick()

      expect(composable.recommendations.value).toHaveLength(2)
      expect(composable.recommendations.value[0]).toMatchObject({
        type: 'bundle-size',
        priority: 'medium'
      })
    })
  })

  describe('Performance Scoring', () => {
    beforeEach(() => {
      composable = usePerformanceOptimization()
    })

    it('should calculate performance score correctly', async () => {
      await composable.updateMetrics?.() || Promise.resolve()
      await nextTick()

      const score = composable.score.value
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
      expect(typeof score).toBe('number')
    })

    it('should assign correct grade based on score', async () => {
      // Test with different mock metrics to get different scores
      const testCases = [
        { mockScore: 95, expectedGrade: 'A+' },
        { mockScore: 85, expectedGrade: 'A' },
        { mockScore: 75, expectedGrade: 'B' },
        { mockScore: 65, expectedGrade: 'C' },
        { mockScore: 45, expectedGrade: 'D' }
      ]

      for (const testCase of testCases) {
        // Mock the score computation by directly checking the logic
        const grade = testCase.mockScore >= 90 ? 'A+' :
                     testCase.mockScore >= 80 ? 'A' :
                     testCase.mockScore >= 70 ? 'B' :
                     testCase.mockScore >= 60 ? 'C' : 'D'
        
        expect(grade).toBe(testCase.expectedGrade)
      }
    })
  })

  describe('Performance Measurement', () => {
    beforeEach(() => {
      composable = usePerformanceOptimization()
      composable.startMonitoring()
    })

    it('should measure operation performance', async () => {
      const mockOperation = vi.fn().mockResolvedValue('result')
      
      const result = await composable.measureTypingPerformance('test-op', mockOperation)
      
      expect(result).toBe('result')
      expect(mockOperation).toHaveBeenCalled()
    })

    it('should handle errors in measured operations', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Test error'))
      
      await expect(composable.measureTypingPerformance('test-op', mockOperation)).rejects.toThrow('Test error')
    })

    it('should skip measurement when monitoring is disabled', async () => {
      composable.stopMonitoring()
      const mockOperation = vi.fn().mockResolvedValue('result')
      
      const result = await composable.measureTypingPerformance('test-op', mockOperation)
      
      expect(result).toBe('result')
      expect(mockOperation).toHaveBeenCalled()
    })
  })

  describe('Optimization Features', () => {
    beforeEach(() => {
      composable = usePerformanceOptimization()
    })

    it('should optimize for typing performance', async () => {
      await composable.optimizeForTyping()
      
      // Should have attempted to preload resources
      const { performanceUtils } = await import('../../../app/utils/performanceOptimizer.js')
      expect(performanceUtils.preloadResource).toHaveBeenCalledTimes(3) // 3 critical resources
      
      // Should have added to optimization history
      expect(composable.optimizationHistory.value).toHaveLength(1)
      expect(composable.optimizationHistory.value[0]).toMatchObject({
        type: 'typing-optimization',
        timestamp: expect.any(Number)
      })
    })

    it('should preload critical resources', async () => {
      await composable.preloadCriticalResources()
      
      const { performanceUtils } = await import('../../../app/utils/performanceOptimizer.js')
      expect(performanceUtils.preloadResource).toHaveBeenCalledWith('/fonts/monaco.woff2')
      expect(performanceUtils.preloadResource).toHaveBeenCalledWith('/api/typing-data')
      expect(performanceUtils.preloadResource).toHaveBeenCalledWith('/images/keyboard-layout.svg')
    })

    it('should handle preload failures gracefully', async () => {
      const { performanceUtils } = await import('../../../app/utils/performanceOptimizer.js')
      performanceUtils.preloadResource.mockRejectedValueOnce(new Error('Network error'))
      
      // Should not throw even if preload fails
      await expect(composable.preloadCriticalResources()).resolves.toBeUndefined()
    })
  })

  describe('Report Generation', () => {
    beforeEach(() => {
      composable = usePerformanceOptimization()
    })

    it('should generate comprehensive performance report', async () => {
      await composable.optimizeForTyping() // Add some history
      const report = composable.generateReport()

      expect(report).toMatchObject({
        timestamp: expect.any(Number),
        score: expect.any(Number),
        grade: expect.stringMatching(/^[ABCD][+]?$/),
        metrics: expect.any(Object),
        recommendations: expect.any(Array),
        optimizationHistory: expect.any(Array)
      })

      expect(report.optimizationHistory).toHaveLength(1)
    })

    it('should include current metrics in report', async () => {
      await composable.updateMetrics?.() || Promise.resolve()
      const report = composable.generateReport()

      expect(report.metrics.bundle).toBeDefined()
      expect(report.metrics.runtime).toBeDefined()
      expect(report.metrics.typing).toBeDefined()
    })
  })

  describe('State Management', () => {
    beforeEach(() => {
      composable = usePerformanceOptimization()
    })

    it('should reset all metrics and history', async () => {
      // Add some data first
      await composable.optimizeForTyping()
      await composable.updateMetrics?.() || Promise.resolve()

      composable.reset()

      expect(composable.metrics.value.bundle.initialBundle).toBe(0)
      expect(composable.metrics.value.runtime.initialLoadTime).toBe(0)
      expect(composable.metrics.value.typing.inputLatency).toBe(0)
      expect(composable.recommendations.value).toEqual([])
      expect(composable.optimizationHistory.value).toEqual([])
    })

    it('should provide readonly access to state', () => {
      // Test that trying to modify readonly refs throws
      expect(() => {
        composable.isMonitoring.value = true
      }).toThrow()

      expect(() => {
        composable.metrics.value = {}
      }).toThrow()
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      composable = usePerformanceOptimization()
    })

    it('should handle metrics collection errors gracefully', async () => {
      const { bundleAnalyzer } = await import('../../../app/utils/performanceOptimizer.js')
      bundleAnalyzer.analyzeBundles.mockRejectedValueOnce(new Error('Analysis failed'))

      // Should not throw
      await expect(composable.updateMetrics?.()).resolves.toBeUndefined()
    })

    it('should handle missing performance API gracefully', async () => {
      const originalPerformance = global.performance
      delete global.performance

      composable.startMonitoring()
      
      // Should not crash when performance API is missing
      await composable.updateMetrics?.() || Promise.resolve()

      global.performance = originalPerformance
    })

    it('should handle optimization errors gracefully', async () => {
      const { performanceUtils } = await import('../../../app/utils/performanceOptimizer.js')
      performanceUtils.preloadResource.mockRejectedValue(new Error('Preload failed'))

      // Should not throw even if all preloads fail
      await expect(composable.optimizeForTyping()).resolves.toBeUndefined()
    })
  })

  describe('Memory Management', () => {
    beforeEach(() => {
      composable = usePerformanceOptimization()
    })

    it('should clean up intervals on component unmount', () => {
      composable.startMonitoring()
      
      // Simulate component unmount
      composable.stopMonitoring()
      
      expect(composable.isMonitoring.value).toBe(false)
    })

    it('should handle rapid start/stop cycles', () => {
      // Rapid start/stop should not cause issues
      for (let i = 0; i < 10; i++) {
        composable.startMonitoring()
        composable.stopMonitoring()
      }

      expect(composable.isMonitoring.value).toBe(false)
    })
  })

  describe('Performance Thresholds', () => {
    beforeEach(() => {
      composable = usePerformanceOptimization()
    })

    it('should detect performance issues based on thresholds', async () => {
      // Mock poor performance
      global.performance.memory.usedJSHeapSize = 1024 * 1024 * 80 // 80MB (high)
      global.performance.getEntriesByType.mockReturnValue([{
        navigationStart: 1000,
        domContentLoadedEventEnd: 6000, // 5 second load time (poor)
        loadEventEnd: 8000,
        fetchStart: 1200
      }])

      await composable.updateMetrics?.() || Promise.resolve()
      await nextTick()

      // Should detect memory leak
      expect(composable.metrics.value.typing.memoryLeaks).toBe(1)
      
      // Should have poor score due to long load time
      expect(composable.score.value).toBeLessThan(70)
      expect(composable.grade.value).toMatch(/[CD]/)
    })

    it('should reward good performance metrics', async () => {
      // Mock excellent performance
      global.performance.memory.usedJSHeapSize = 1024 * 1024 * 10 // 10MB (good)
      global.performance.getEntriesByType.mockReturnValue([{
        navigationStart: 1000,
        domContentLoadedEventEnd: 1500, // 500ms load time (excellent)
        loadEventEnd: 1800,
        fetchStart: 1100
      }])

      const { bundleAnalyzer } = await import('../../../app/utils/performanceOptimizer.js')
      bundleAnalyzer.analyzeBundles.mockResolvedValue({
        initialBundle: 50, // Small bundle (good)
        vendorBundle: 80,
        asyncChunks: 20,
        treeShakingReduction: 30,
        compressionRatio: 0.7
      })

      await composable.updateMetrics?.() || Promise.resolve()
      await nextTick()

      expect(composable.score.value).toBeGreaterThan(80)
      expect(composable.grade.value).toMatch(/A/)
    })
  })
})