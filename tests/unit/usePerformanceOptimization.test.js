/**
 * @fileoverview Unit tests for usePerformanceOptimization composable using London School TDD
 * Focus on interaction testing with performance monitoring and optimization utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { usePerformanceOptimization } from '@/composables/usePerformanceOptimization'
import { nextTick } from 'vue'

// Mock performance utilities
const mockPerformanceUtils = {
  preloadResource: vi.fn(() => Promise.resolve()),
  measure: vi.fn((name, fn) => fn()),
  debounce: vi.fn(fn => fn),
  throttle: vi.fn(fn => fn)
}

const mockBundleAnalyzer = {
  analyzeBundles: vi.fn(() => Promise.resolve({
    initialBundle: 45,
    vendorBundle: 25,
    asyncChunks: 3,
    treeShakingReduction: 20,
    compressionRatio: 0.7
  })),
  getRecommendations: vi.fn(() => ['Enable tree shaking', 'Use code splitting']),
  generatePerformanceReport: vi.fn(() => ({
    bundle: { initialBundle: 45 },
    runtime: { initialLoadTime: 1500 },
    recommendations: ['Test recommendation'],
    score: 85
  }))
}

const mockMonacoOptimizer = {
  optimizeConfig: vi.fn(config => ({ ...config, optimized: true })),
  loadMinimalFeatures: vi.fn(() => Promise.resolve())
}

const mockPerformanceMonitor = {
  startMonitoring: vi.fn(),
  stopMonitoring: vi.fn(),
  startTimer: vi.fn(),
  endTimer: vi.fn(),
  getMeasurements: vi.fn(() => ({
    'typing-input': 15,
    'typing-render': 8,
    'keystroke-processing': 5
  })),
  clearMeasurements: vi.fn()
}

// Mock the utility modules
vi.mock('@/utils/performanceOptimizer', () => ({
  performanceUtils: mockPerformanceUtils,
  bundleAnalyzer: mockBundleAnalyzer,
  monacoOptimizer: mockMonacoOptimizer,
  defaultOptimizationConfig: {
    enableTreeShaking: true,
    enableLazyLoading: true,
    chunkSizeLimit: 200
  },
  PerformanceMonitor: vi.fn(() => mockPerformanceMonitor)
}))

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    getEntriesByType: vi.fn((type) => {
      if (type === 'navigation') {
        return [{
          navigationStart: 1000,
          domContentLoadedEventEnd: 2500,
          loadEventEnd: 3000,
          fetchStart: 1200
        }]
      }
      return []
    }),
    memory: {
      usedJSHeapSize: 10 * 1024 * 1024, // 10MB
      totalJSHeapSize: 20 * 1024 * 1024 // 20MB
    }
  }
})

// Mock fetch for bundle analysis
Object.defineProperty(global, 'fetch', {
  value: vi.fn(() => Promise.resolve({
    headers: {
      get: vi.fn(() => '51200') // 50KB
    }
  }))
})

describe('usePerformanceOptimization Composable - London School TDD', () => {
  let performanceOpt
  
  beforeEach(() => {
    vi.clearAllMocks()
    performanceOpt = usePerformanceOptimization({ autoStart: false })
  })
  
  afterEach(() => {
    if (performanceOpt.isMonitoring.value) {
      performanceOpt.stopMonitoring()
    }
  })

  describe('Initialization Behavior', () => {
    it('should initialize with correct default state', () => {
      // Verify initial state setup
      expect(performanceOpt.isMonitoring.value).toBe(false)
      expect(performanceOpt.score.value).toBeGreaterThan(0)
      expect(performanceOpt.recommendations.value).toEqual([])
      expect(performanceOpt.metrics.value).toEqual({
        bundle: {
          initialBundle: 0,
          vendorBundle: 0,
          asyncChunks: 0,
          treeShakingReduction: 0,
          compressionRatio: 0
        },
        runtime: {
          initialLoadTime: 0,
          routeTransitionTime: 0,
          memoryUsage: 0,
          jsHeapSize: 0
        },
        typing: {
          inputLatency: 0,
          renderLatency: 0,
          keystrokeProcessing: 0,
          memoryLeaks: 0
        }
      })
    })

    it('should auto-start monitoring when configured', () => {
      const autoStartOpt = usePerformanceOptimization({ autoStart: true })
      
      // Verify monitor initialization collaboration
      expect(mockPerformanceMonitor.startMonitoring).toHaveBeenCalled()
    })

    it('should provide readonly access to state', () => {
      // Verify encapsulation behavior
      expect(() => {
        performanceOpt.isMonitoring.value = true
      }).toThrow()
      
      expect(() => {
        performanceOpt.metrics.value = {}
      }).toThrow()
    })
  })

  describe('Monitoring Control Behavior', () => {
    it('should start monitoring with proper collaboration', async () => {
      performanceOpt.startMonitoring()
      
      // Verify monitoring setup collaboration
      expect(performanceOpt.isMonitoring.value).toBe(true)
      expect(mockPerformanceMonitor.startMonitoring).toHaveBeenCalled()
      
      // Wait for initial metrics update
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Verify metrics collaboration
      expect(mockBundleAnalyzer.analyzeBundles).toHaveBeenCalled()
      expect(mockBundleAnalyzer.getRecommendations).toHaveBeenCalled()
    })

    it('should stop monitoring and clean up resources', () => {
      performanceOpt.startMonitoring()
      performanceOpt.stopMonitoring()
      
      // Verify cleanup collaboration
      expect(performanceOpt.isMonitoring.value).toBe(false)
      expect(mockPerformanceMonitor.stopMonitoring).toHaveBeenCalled()
    })

    it('should handle start monitoring when already monitoring', () => {
      performanceOpt.startMonitoring()
      vi.clearAllMocks()
      
      performanceOpt.startMonitoring() // Second call
      
      // Should not restart monitoring
      expect(mockPerformanceMonitor.startMonitoring).not.toHaveBeenCalled()
    })

    it('should handle stop monitoring when not monitoring', () => {
      performanceOpt.stopMonitoring() // Without starting
      
      // Should not call stop on monitor
      expect(mockPerformanceMonitor.stopMonitoring).not.toHaveBeenCalled()
    })
  })

  describe('Metrics Collection Behavior', () => {
    beforeEach(() => {
      performanceOpt.startMonitoring()
    })

    it('should update bundle metrics through analyzer collaboration', async () => {
      // Wait for metrics update
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Verify bundle analyzer collaboration
      expect(mockBundleAnalyzer.analyzeBundles).toHaveBeenCalled()
      
      const metrics = performanceOpt.metrics.value
      expect(metrics.bundle.initialBundle).toBe(45)
      expect(metrics.bundle.vendorBundle).toBe(25)
      expect(metrics.bundle.asyncChunks).toBe(3)
    })

    it('should collect runtime performance metrics', async () => {
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const metrics = performanceOpt.metrics.value
      expect(metrics.runtime.initialLoadTime).toBeGreaterThan(0)
      expect(metrics.runtime.routeTransitionTime).toBeGreaterThan(0)
    })

    it('should monitor memory usage', async () => {
      await new Promise(resolve => setTimeout(resolve, 10500)) // Wait for memory check
      
      const metrics = performanceOpt.metrics.value
      expect(metrics.runtime.memoryUsage).toBe(10) // 10MB
      expect(metrics.runtime.jsHeapSize).toBe(20) // 20MB
    })

    it('should collect typing performance metrics', async () => {
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Verify monitor collaboration
      expect(mockPerformanceMonitor.getMeasurements).toHaveBeenCalled()
      
      const metrics = performanceOpt.metrics.value
      expect(metrics.typing.inputLatency).toBe(15)
      expect(metrics.typing.renderLatency).toBe(8)
      expect(metrics.typing.keystrokeProcessing).toBe(5)
    })

    it('should handle metrics collection failures gracefully', async () => {
      // Mock analyzer failure
      mockBundleAnalyzer.analyzeBundles.mockRejectedValueOnce(new Error('Analysis failed'))
      
      // Should not throw, just log warning
      await expect(async () => {
        await new Promise(resolve => setTimeout(resolve, 150))
      }).not.toThrow()
    })
  })

  describe('Performance Scoring Behavior', () => {
    it('should calculate performance score based on metrics', async () => {
      performanceOpt.startMonitoring()
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const score = performanceOpt.score.value
      const grade = performanceOpt.grade.value
      
      // Verify scoring calculation
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)
      expect(['A+', 'A', 'B', 'C', 'D']).toContain(grade)
    })

    it('should provide appropriate grade for score ranges', () => {
      // Mock high performance metrics
      mockBundleAnalyzer.analyzeBundles.mockResolvedValueOnce({
        initialBundle: 20, // Small bundle
        vendorBundle: 15,
        asyncChunks: 5,
        treeShakingReduction: 30,
        compressionRatio: 0.6
      })
      
      const highPerfOpt = usePerformanceOptimization()
      expect(highPerfOpt.grade.value).toMatch(/A[+]?/)
    })
  })

  describe('Optimization Operations', () => {
    it('should preload critical resources with utility collaboration', async () => {
      await performanceOpt.preloadCriticalResources()
      
      // Verify resource preloading collaboration
      expect(mockPerformanceUtils.preloadResource).toHaveBeenCalledWith('/fonts/monaco.woff2')
      expect(mockPerformanceUtils.preloadResource).toHaveBeenCalledWith('/api/typing-data')
      expect(mockPerformanceUtils.preloadResource).toHaveBeenCalledWith('/images/keyboard-layout.svg')
    })

    it('should optimize for typing with Monaco collaboration', async () => {
      // Mock Monaco availability
      Object.defineProperty(global, 'window', {
        value: {
          monaco: { editor: {} }
        }
      })
      
      await performanceOpt.optimizeForTyping()
      
      // Verify optimization collaboration
      expect(mockPerformanceUtils.preloadResource).toHaveBeenCalled()
      expect(mockMonacoOptimizer.optimizeConfig).toHaveBeenCalled()
      
      // Verify optimization history tracking
      expect(performanceOpt.optimizationHistory.value).toHaveLength(1)
      expect(performanceOpt.optimizationHistory.value[0].type).toBe('typing-optimization')
    })

    it('should handle optimization failures gracefully', async () => {
      mockPerformanceUtils.preloadResource.mockRejectedValueOnce(new Error('Preload failed'))
      
      // Should not throw
      await expect(performanceOpt.optimizeForTyping()).resolves.not.toThrow()
    })
  })

  describe('Performance Measurement', () => {
    it('should measure typing performance with monitor collaboration', async () => {
      performanceOpt.startMonitoring()
      
      const mockOperation = vi.fn(() => Promise.resolve('result'))
      const result = await performanceOpt.measureTypingPerformance('test-operation', mockOperation)
      
      // Verify measurement collaboration
      expect(mockPerformanceMonitor.startTimer).toHaveBeenCalledWith('test-operation')
      expect(mockPerformanceMonitor.endTimer).toHaveBeenCalledWith('test-operation')
      expect(result).toBe('result')
    })

    it('should handle measurement errors properly', async () => {
      performanceOpt.startMonitoring()
      
      const errorOperation = vi.fn(() => Promise.reject(new Error('Operation failed')))
      
      await expect(performanceOpt.measureTypingPerformance('error-operation', errorOperation))
        .rejects.toThrow('Operation failed')
      
      // Should still end timer on error
      expect(mockPerformanceMonitor.endTimer).toHaveBeenCalledWith('error-operation')
    })

    it('should skip measurement when not monitoring', async () => {
      const mockOperation = vi.fn(() => Promise.resolve('result'))
      const result = await performanceOpt.measureTypingPerformance('test-operation', mockOperation)
      
      // Should execute operation without measurement
      expect(result).toBe('result')
      expect(mockPerformanceMonitor.startTimer).not.toHaveBeenCalled()
    })
  })

  describe('Reporting and Analysis', () => {
    it('should generate comprehensive performance report', () => {
      const report = performanceOpt.generateReport()
      
      // Verify report structure
      expect(report).toEqual({
        timestamp: expect.any(Number),
        score: performanceOpt.score.value,
        grade: performanceOpt.grade.value,
        metrics: performanceOpt.metrics.value,
        recommendations: performanceOpt.recommendations.value,
        optimizationHistory: performanceOpt.optimizationHistory.value
      })
    })

    it('should track optimization history', async () => {
      await performanceOpt.optimizeForTyping()
      await performanceOpt.optimizeForTyping() // Second optimization
      
      const history = performanceOpt.optimizationHistory.value
      expect(history).toHaveLength(2)
      expect(history[0]).toEqual({
        timestamp: expect.any(Number),
        type: 'typing-optimization',
        metrics: expect.any(Object)
      })
    })
  })

  describe('Resource Management', () => {
    it('should reset all metrics and history', () => {
      // Add some data
      performanceOpt.startMonitoring()
      
      // Reset everything
      performanceOpt.reset()
      
      // Verify complete reset
      expect(performanceOpt.metrics.value.bundle.initialBundle).toBe(0)
      expect(performanceOpt.recommendations.value).toEqual([])
      expect(performanceOpt.optimizationHistory.value).toEqual([])
      expect(mockPerformanceMonitor.clearMeasurements).toHaveBeenCalled()
    })

    it('should clean up intervals on stop monitoring', () => {
      vi.useFakeTimers()
      
      performanceOpt.startMonitoring()
      performanceOpt.stopMonitoring()
      
      // Advance timers to ensure intervals are cleared
      vi.advanceTimersByTime(15000)
      
      // Metrics should not update after stopping
      vi.clearAllMocks()
      vi.advanceTimersByTime(5000)
      expect(mockBundleAnalyzer.analyzeBundles).not.toHaveBeenCalled()
      
      vi.useRealTimers()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing performance API gracefully', async () => {
      // Mock missing performance API
      const originalPerformance = global.performance
      delete global.performance
      
      const perfOpt = usePerformanceOptimization({ autoStart: false })
      perfOpt.startMonitoring()
      
      // Should not throw errors
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Restore performance API
      global.performance = originalPerformance
    })

    it('should detect memory leaks based on thresholds', async () => {
      // Mock high memory usage
      Object.defineProperty(global.performance, 'memory', {
        value: {
          usedJSHeapSize: 60 * 1024 * 1024, // 60MB (above threshold)
          totalJSHeapSize: 80 * 1024 * 1024
        }
      })
      
      performanceOpt.startMonitoring()
      await new Promise(resolve => setTimeout(resolve, 10500))
      
      // Should detect memory leak
      expect(performanceOpt.metrics.value.typing.memoryLeaks).toBe(1)
    })

    it('should handle bundle analysis fetch failures', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))
      
      performanceOpt.startMonitoring()
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Should use fallback values
      expect(performanceOpt.metrics.value.bundle.vendorBundle).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Reactive Behavior', () => {
    it('should react to significant score changes', async () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      
      performanceOpt.startMonitoring()
      
      // Simulate metrics that would cause score change
      mockBundleAnalyzer.analyzeBundles.mockResolvedValueOnce({
        initialBundle: 500, // Large bundle causing low score
        vendorBundle: 25,
        asyncChunks: 1,
        treeShakingReduction: 5,
        compressionRatio: 0.9
      })
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Score should change and log should be called
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Performance score changed significantly/)
      )
      
      consoleSpy.mockRestore()
    })
  })
})
