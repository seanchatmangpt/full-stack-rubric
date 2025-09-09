/**
 * @fileoverview Unit tests for performanceOptimizer utilities using London School TDD
 * Focus on behavior verification and collaboration with performance APIs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  performanceUtils,
  bundleAnalyzer,
  monacoOptimizer,
  codeSplitting,
  defaultOptimizationConfig,
  PerformanceMonitor
} from '@/utils/performanceOptimizer'

// Mock DOM and performance APIs
const mockDocument = {
  createElement: vi.fn(() => ({
    rel: '',
    as: '',
    href: '',
    onload: null,
    onerror: null
  })),
  head: {
    appendChild: vi.fn()
  },
  querySelector: vi.fn()
}

const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  memory: {
    usedJSHeapSize: 10 * 1024 * 1024,
    totalJSHeapSize: 20 * 1024 * 1024
  }
}

const mockFetch = vi.fn(() => Promise.resolve({
  headers: {
    get: vi.fn(() => '51200') // 50KB
  }
}))

// Mock window object
const mockWindow = {
  document: mockDocument,
  performance: mockPerformance,
  fetch: mockFetch
}

describe('performanceUtils - London School TDD', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup global mocks
    Object.defineProperty(global, 'document', { value: mockDocument })
    Object.defineProperty(global, 'performance', { value: mockPerformance })
    Object.defineProperty(global, 'fetch', { value: mockFetch })
  })

  describe('Debounce Function Behavior', () => {
    it('should delay function execution', async () => {
      const mockFn = vi.fn()
      const debouncedFn = performanceUtils.debounce(mockFn, 100)
      
      // Call multiple times quickly
      debouncedFn('call1')
      debouncedFn('call2')
      debouncedFn('call3')
      
      // Should not execute immediately
      expect(mockFn).not.toHaveBeenCalled()
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Should execute only once with last arguments
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('call3')
    })

    it('should preserve function context', async () => {
      const contextObject = {
        value: 42,
        getValue: function () {
 return this.value 
}
      }
      
      const debouncedGetValue = performanceUtils.debounce(contextObject.getValue, 50)
      
      let result
      contextObject.debouncedGetValue = function () {
        result = debouncedGetValue.call(this)
      }
      
      contextObject.debouncedGetValue()
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(result).toBe(42)
    })
  })

  describe('Throttle Function Behavior', () => {
    it('should limit function execution frequency', async () => {
      const mockFn = vi.fn()
      const throttledFn = performanceUtils.throttle(mockFn, 100)
      
      // Call multiple times quickly
      throttledFn('call1')
      throttledFn('call2') // Should be ignored
      throttledFn('call3') // Should be ignored
      
      // Should execute immediately once
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('call1')
      
      // Wait for throttle period to pass
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Should be able to call again
      throttledFn('call4')
      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(mockFn).toHaveBeenCalledWith('call4')
    })
  })

  describe('Lazy Import Behavior', () => {
    it('should handle successful module import', async () => {
      const mockModule = { default: { component: 'TestComponent' } }
      const mockImport = vi.fn(() => Promise.resolve(mockModule))
      
      const result = await performanceUtils.lazyImport(mockImport)
      
      expect(mockImport).toHaveBeenCalledOnce()
      expect(result).toEqual({ component: 'TestComponent' })
    })

    it('should handle module without default export', async () => {
      const mockModule = { namedExport: 'value' }
      const mockImport = vi.fn(() => Promise.resolve(mockModule))
      
      const result = await performanceUtils.lazyImport(mockImport)
      
      expect(result).toEqual({ namedExport: 'value' })
    })

    it('should handle import failures gracefully', async () => {
      const mockImport = vi.fn(() => Promise.reject(new Error('Import failed')))
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const result = await performanceUtils.lazyImport(mockImport)
      
      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('Lazy import failed:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('Resource Preloading Behavior', () => {
    it('should create preload link element with correct attributes', async () => {
      const mockLink = {
        rel: '',
        as: '',
        href: '',
        onload: null,
        onerror: null
      }
      
      mockDocument.createElement.mockReturnValue(mockLink)
      mockDocument.querySelector.mockReturnValue(null) // Resource not already preloaded
      
      const preloadPromise = performanceUtils.preloadResource('/test.js', 'script')
      
      // Verify DOM collaboration
      expect(mockDocument.createElement).toHaveBeenCalledWith('link')
      expect(mockLink.rel).toBe('preload')
      expect(mockLink.as).toBe('script')
      expect(mockLink.href).toBe('/test.js')
      expect(mockDocument.head.appendChild).toHaveBeenCalledWith(mockLink)
      
      // Simulate successful load
      mockLink.onload()
      
      await expect(preloadPromise).resolves.toBeUndefined()
    })

    it('should skip preloading if resource already exists', async () => {
      mockDocument.querySelector.mockReturnValue({ href: '/test.js' }) // Already exists
      
      await performanceUtils.preloadResource('/test.js')
      
      // Should not create new link
      expect(mockDocument.createElement).not.toHaveBeenCalled()
    })

    it('should handle preload errors', async () => {
      const mockLink = {
        rel: '', as: '', href: '',
        onload: null, onerror: null
      }
      
      mockDocument.createElement.mockReturnValue(mockLink)
      mockDocument.querySelector.mockReturnValue(null)
      
      const preloadPromise = performanceUtils.preloadResource('/test.js')
      
      // Simulate error
      const testError = new Error('Network error')
      mockLink.onerror(testError)
      
      await expect(preloadPromise).rejects.toBe(testError)
    })

    it('should handle server-side environment gracefully', async () => {
      // Mock server environment (no document)
      Object.defineProperty(global, 'document', { value: undefined })
      
      await expect(performanceUtils.preloadResource('/test.js')).resolves.toBeUndefined()
    })
  })

  describe('Performance Measurement Behavior', () => {
    it('should measure function execution with performance API', async () => {
      const mockFn = vi.fn(() => Promise.resolve('result'))
      
      const result = await performanceUtils.measure('test-operation', mockFn)
      
      // Verify performance API collaboration
      expect(mockPerformance.mark).toHaveBeenCalledWith('test-operation-start')
      expect(mockPerformance.mark).toHaveBeenCalledWith('test-operation-end')
      expect(mockPerformance.measure).toHaveBeenCalledWith(
        'test-operation',
        'test-operation-start',
        'test-operation-end'
      )
      expect(result).toBe('result')
    })

    it('should handle function execution errors', async () => {
      const mockFn = vi.fn(() => Promise.reject(new Error('Function error')))
      
      await expect(performanceUtils.measure('error-operation', mockFn))
        .rejects.toThrow('Function error')
      
      // Should still mark end and measure error
      expect(mockPerformance.mark).toHaveBeenCalledWith('error-operation-end')
      expect(mockPerformance.measure).toHaveBeenCalledWith(
        'error-operation-error',
        'error-operation-start',
        'error-operation-end'
      )
    })

    it('should handle missing performance API', async () => {
      Object.defineProperty(global, 'performance', { value: undefined })
      
      const mockFn = vi.fn(() => Promise.resolve('result'))
      const result = await performanceUtils.measure('test-operation', mockFn)
      
      expect(result).toBe('result')
      expect(mockFn).toHaveBeenCalled()
    })
  })
})

describe('bundleAnalyzer - London School TDD', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(global, 'performance', { value: mockPerformance })
    Object.defineProperty(global, 'fetch', { value: mockFetch })
  })

  describe('Bundle Analysis Behavior', () => {
    it('should analyze bundle metrics from performance entries', async () => {
      const mockNavigationEntry = {
        navigationStart: 1000,
        domContentLoadedEventEnd: 2500
      }
      
      const mockResourceEntries = [
        { name: '/main.js', transferSize: 50000 },
        { name: '/vendor.js', transferSize: 30000 },
        { name: '/chunk1.js', transferSize: 15000 }
      ]
      
      mockPerformance.getEntriesByType.mockImplementation((type) => {
        if (type === 'navigation') return [mockNavigationEntry]
        if (type === 'resource') return mockResourceEntries
        return []
      })
      
      const metrics = await bundleAnalyzer.analyzeBundles()
      
      // Verify performance API collaboration
      expect(mockPerformance.getEntriesByType).toHaveBeenCalledWith('navigation')
      expect(mockPerformance.getEntriesByType).toHaveBeenCalledWith('resource')
      
      // Verify metrics calculation
      expect(metrics.initialBundle).toBe(95) // (50000 + 30000 + 15000) / 1024
      expect(metrics.asyncChunks).toBe(1) // chunk1.js
    })

    it('should fetch vendor bundle size via HTTP HEAD request', async () => {
      mockFetch.mockResolvedValueOnce({
        headers: {
          get: vi.fn(() => '51200') // 50KB
        }
      })
      
      const metrics = await bundleAnalyzer.analyzeBundles()
      
      // Verify fetch collaboration
      expect(mockFetch).toHaveBeenCalledWith('/bundle.js', { method: 'HEAD' })
      expect(metrics.vendorBundle).toBe(50) // 51200 / 1024
    })

    it('should use fallback vendor bundle size on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      
      const metrics = await bundleAnalyzer.analyzeBundles()
      
      // Should use fallback value
      expect(metrics.vendorBundle).toBe(50)
    })

    it('should handle missing performance API gracefully', async () => {
      Object.defineProperty(global, 'performance', { value: undefined })
      
      const metrics = await bundleAnalyzer.analyzeBundles()
      
      // Should return default metrics structure
      expect(metrics).toEqual({
        initialBundle: 0,
        vendorBundle: expect.any(Number),
        asyncChunks: 0,
        treeShakingReduction: 0,
        compressionRatio: 0
      })
    })
  })

  describe('Runtime Metrics Analysis', () => {
    it('should analyze runtime performance from navigation timing', () => {
      const mockNavigationEntry = {
        navigationStart: 1000,
        domContentLoadedEventEnd: 3000,
        loadEventEnd: 4000,
        fetchStart: 1500
      }
      
      mockPerformance.getEntriesByType.mockReturnValue([mockNavigationEntry])
      
      const metrics = bundleAnalyzer.analyzeRuntimePerformance()
      
      expect(metrics.initialLoadTime).toBe(2000) // 3000 - 1000
      expect(metrics.routeTransitionTime).toBe(2500) // 4000 - 1500
      expect(metrics.memoryUsage).toBe(10) // 10MB from mock
      expect(metrics.jsHeapSize).toBe(20) // 20MB from mock
    })

    it('should provide fallback values when navigation timing unavailable', () => {
      mockPerformance.getEntriesByType.mockReturnValue([])
      
      const metrics = bundleAnalyzer.analyzeRuntimePerformance()
      
      expect(metrics.initialLoadTime).toBe(2000) // Default fallback
      expect(metrics.routeTransitionTime).toBe(500) // Default fallback
    })
  })

  describe('Recommendation Generation', () => {
    it('should generate recommendations based on bundle metrics', () => {
      const metrics = {
        initialBundle: 250, // Large bundle
        asyncChunks: 1, // Few chunks
        treeShakingReduction: 15, // Low tree shaking
        compressionRatio: 0.9 // High compression ratio
      }
      
      const recommendations = bundleAnalyzer.getRecommendations(metrics)
      
      expect(recommendations).toContain('Consider code splitting to reduce initial bundle size')
      expect(recommendations).toContain('Implement more granular code splitting for better caching')
      expect(recommendations).toContain('Enable tree shaking and remove unused imports')
      expect(recommendations).toContain('Enable gzip/brotli compression')
    })

    it('should provide minimal recommendations for optimal metrics', () => {
      const optimalMetrics = {
        initialBundle: 100, // Small bundle
        asyncChunks: 5, // Good chunking
        treeShakingReduction: 30, // Good tree shaking
        compressionRatio: 0.6 // Good compression
      }
      
      const recommendations = bundleAnalyzer.getRecommendations(optimalMetrics)
      
      expect(recommendations).toHaveLength(0)
    })
  })

  describe('Performance Scoring', () => {
    it('should calculate performance score from metrics', () => {
      const bundleMetrics = {
        initialBundle: 50, // 50KB bundle
        vendorBundle: 25,
        asyncChunks: 3,
        treeShakingReduction: 25,
        compressionRatio: 0.65
      }
      
      const runtimeMetrics = {
        initialLoadTime: 1500, // 1.5 seconds
        routeTransitionTime: 300,
        memoryUsage: 15,
        jsHeapSize: 25
      }
      
      const score = bundleAnalyzer.calculatePerformanceScore(bundleMetrics, runtimeMetrics)
      
      // Score calculation: bundleScore (95) + runtimeScore (70) / 2 = 82.5
      expect(score).toBe(83) // Rounded
    })
  })

  describe('Performance Report Generation', () => {
    it('should generate comprehensive performance report', () => {
      const report = bundleAnalyzer.generatePerformanceReport()
      
      expect(report).toEqual({
        bundle: expect.objectContaining({
          initialBundle: expect.any(Number),
          vendorBundle: expect.any(Number),
          asyncChunks: expect.any(Number)
        }),
        runtime: expect.objectContaining({
          initialLoadTime: expect.any(Number),
          memoryUsage: expect.any(Number)
        }),
        recommendations: expect.any(Array),
        timestamp: expect.any(Number),
        score: expect.any(Number)
      })
    })
  })
})

describe('monacoOptimizer - London School TDD', () => {
  describe('Configuration Optimization', () => {
    it('should optimize Monaco configuration for performance', () => {
      const baseConfig = {
        language: 'javascript',
        fontSize: 16,
        customOption: 'value'
      }
      
      const optimizedConfig = monacoOptimizer.optimizeConfig(baseConfig)
      
      // Verify performance optimizations
      expect(optimizedConfig.minimap.enabled).toBe(false)
      expect(optimizedConfig.quickSuggestions).toBe(false)
      expect(optimizedConfig.folding).toBe(false)
      expect(optimizedConfig.lineNumbers).toBe('on')
      expect(optimizedConfig.theme).toBe('vs-dark')
      expect(optimizedConfig.fontSize).toBe(14) // Optimized size
      
      // Should preserve custom options
      expect(optimizedConfig.customOption).toBe('value')
      expect(optimizedConfig.language).toBe('javascript')
    })

    it('should provide default configuration when none provided', () => {
      const optimizedConfig = monacoOptimizer.optimizeConfig()
      
      expect(optimizedConfig.language).toBe('plaintext')
      expect(optimizedConfig.minimap.enabled).toBe(false)
    })
  })

  describe('Feature Loading', () => {
    it('should load minimal Monaco features', async () => {
      await expect(monacoOptimizer.loadMinimalFeatures()).resolves.toBeUndefined()
    })

    it('should load language support', async () => {
      await expect(monacoOptimizer.loadLanguageSupport('javascript')).resolves.toBeUndefined()
    })

    it('should provide alias for minimal Monaco loading', async () => {
      await expect(monacoOptimizer.loadMinimalMonaco()).resolves.toBeUndefined()
    })
  })
})

describe('codeSplitting - London School TDD', () => {
  describe('Async Component Creation', () => {
    it('should create async component wrapper with proper configuration', () => {
      const mockImport = vi.fn(() => Promise.resolve({ default: {} }))
      
      const asyncComponent = codeSplitting.createAsyncComponent(mockImport)
      
      expect(asyncComponent.async).toBe(true)
      expect(asyncComponent.loader).toBe(mockImport)
      expect(asyncComponent.delay).toBe(200)
      expect(asyncComponent.timeout).toBe(10000)
      expect(asyncComponent.errorComponent).toHaveProperty('template')
      expect(asyncComponent.loadingComponent).toHaveProperty('template')
    })
  })

  describe('Route Preloading', () => {
    it('should preload multiple routes concurrently', async () => {
      const routes = ['/home', '/about', '/contact']
      
      const results = await codeSplitting.preloadRoutes(routes)
      
      expect(results).toHaveLength(3)
      results.forEach((result, index) => {
        expect(result.route).toBe(routes[index])
        expect(result.loaded).toBe(true)
      })
    })

    it('should handle preload failures gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Mock route that will "fail" (we simulate this in the implementation)
      const routes = ['/failing-route']
      
      const results = await codeSplitting.preloadRoutes(routes)
      
      expect(results).toHaveLength(1)
      expect(results[0].route).toBe('/failing-route')
      
      consoleSpy.mockRestore()
    })
  })
})

describe('PerformanceMonitor Class - London School TDD', () => {
  let monitor
  
  beforeEach(() => {
    monitor = new PerformanceMonitor()
    Object.defineProperty(global, 'performance', { value: mockPerformance })
  })

  describe('Monitoring State Management', () => {
    it('should initialize with correct default state', () => {
      expect(monitor.isMonitoring).toBe(false)
      expect(monitor.measurements).toBeInstanceOf(Map)
      expect(monitor.measurements.size).toBe(0)
    })

    it('should start and stop monitoring', () => {
      monitor.startMonitoring()
      expect(monitor.isMonitoring).toBe(true)
      
      monitor.stopMonitoring()
      expect(monitor.isMonitoring).toBe(false)
    })

    it('should clear measurements when starting monitoring', () => {
      monitor.measurements.set('test', { data: 'old' })
      
      monitor.startMonitoring()
      
      expect(monitor.measurements.size).toBe(0)
    })
  })

  describe('Timer Management', () => {
    beforeEach(() => {
      monitor.startMonitoring()
      mockPerformance.now.mockReturnValue(1000)
    })

    it('should start and end timers correctly', () => {
      monitor.startTimer('test-operation')
      
      expect(monitor.measurements.has('test-operation')).toBe(true)
      const measurement = monitor.measurements.get('test-operation')
      expect(measurement.startTime).toBe(1000)
      expect(measurement.endTime).toBeNull()
      
      mockPerformance.now.mockReturnValue(1500)
      monitor.endTimer('test-operation')
      
      expect(measurement.endTime).toBe(1500)
    })

    it('should calculate duration correctly', () => {
      monitor.startTimer('duration-test')
      mockPerformance.now.mockReturnValue(1200)
      monitor.endTimer('duration-test')
      
      const duration = monitor.getDuration('duration-test')
      expect(duration).toBe(200)
    })

    it('should return zero duration for incomplete measurements', () => {
      monitor.startTimer('incomplete')
      
      const duration = monitor.getDuration('incomplete')
      expect(duration).toBe(0)
    })

    it('should return zero duration for non-existent measurements', () => {
      const duration = monitor.getDuration('non-existent')
      expect(duration).toBe(0)
    })

    it('should skip timing when not monitoring', () => {
      monitor.stopMonitoring()
      
      monitor.startTimer('ignored-timer')
      expect(monitor.measurements.size).toBe(0)
      
      monitor.endTimer('ignored-timer')
      expect(monitor.measurements.size).toBe(0)
    })
  })

  describe('Measurements Retrieval', () => {
    beforeEach(() => {
      monitor.startMonitoring()
    })

    it('should get all completed measurements', () => {
      // Start and complete multiple timers
      mockPerformance.now.mockReturnValue(1000)
      monitor.startTimer('operation1')
      monitor.startTimer('operation2')
      
      mockPerformance.now.mockReturnValue(1150)
      monitor.endTimer('operation1')
      
      mockPerformance.now.mockReturnValue(1300)
      monitor.endTimer('operation2')
      
      const measurements = monitor.getMeasurements()
      
      expect(measurements).toEqual({
        operation1: 150,
        operation2: 300
      })
    })

    it('should exclude incomplete measurements from results', () => {
      mockPerformance.now.mockReturnValue(1000)
      monitor.startTimer('completed')
      monitor.startTimer('incomplete')
      
      mockPerformance.now.mockReturnValue(1100)
      monitor.endTimer('completed')
      
      const measurements = monitor.getMeasurements()
      
      expect(measurements).toEqual({
        completed: 100
      })
      expect(measurements).not.toHaveProperty('incomplete')
    })

    it('should clear all measurements', () => {
      monitor.startTimer('test1')
      monitor.startTimer('test2')
      
      monitor.clearMeasurements()
      
      expect(monitor.measurements.size).toBe(0)
      expect(monitor.getMeasurements()).toEqual({})
    })
  })

  describe('Performance API Integration', () => {
    it('should use performance.now when available', () => {
      monitor.startMonitoring()
      monitor.startTimer('perf-test')
      
      expect(mockPerformance.now).toHaveBeenCalled()
    })

    it('should fallback to Date.now when performance API unavailable', () => {
      Object.defineProperty(global, 'performance', { value: { now: undefined } })
      const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(2000)
      
      monitor.startMonitoring()
      monitor.startTimer('fallback-test')
      
      expect(dateSpy).toHaveBeenCalled()
      
      dateSpy.mockRestore()
    })
  })
})

describe('defaultOptimizationConfig', () => {
  it('should provide correct default configuration', () => {
    expect(defaultOptimizationConfig).toEqual({
      enableTreeShaking: true,
      enableLazyLoading: true,
      enableCodeSplitting: true,
      chunkSizeLimit: 200,
      preloadRoutes: ['/typing', '/dashboard']
    })
  })
})

describe('Integration Tests', () => {
  it('should work together for complete performance optimization workflow', async () => {
    const monitor = new PerformanceMonitor()
    monitor.startMonitoring()
    
    // Measure resource preloading
    const preloadResult = await performanceUtils.measure('preload', async () => {
      await performanceUtils.preloadResource('/test.js')
      return 'preloaded'
    })
    
    // Analyze bundle metrics
    const bundleMetrics = await bundleAnalyzer.analyzeBundles()
    
    // Generate recommendations
    const recommendations = bundleAnalyzer.getRecommendations(bundleMetrics)
    
    // Verify integration
    expect(preloadResult).toBe('preloaded')
    expect(bundleMetrics).toHaveProperty('initialBundle')
    expect(Array.isArray(recommendations)).toBe(true)
  })
})
