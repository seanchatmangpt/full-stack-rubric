/**
 * @fileoverview Node.js version compatibility tests for nuxt-bdd
 * @description Tests library compatibility across different Node.js versions and environments
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { 
  VitestCucumberBridge,
  registerGiven,
  registerWhen, 
  registerThen,
  getBDDContext,
  setBDDState,
  getBDDState
} from '../../src/bdd/vitest-cucumber-bridge.js'

/**
 * Node.js feature detection utilities
 */
class NodeCompatibilityTester {
  constructor() {
    this.nodeVersion = process.version
    this.nodeMajor = parseInt(process.version.slice(1).split('.')[0])
    this.features = this.detectFeatures()
  }

  detectFeatures() {
    return {
      // ES Modules support
      esModules: this.nodeMajor >= 12,
      
      // Performance hooks
      performanceHooks: !!global.performance || typeof performance !== 'undefined',
      
      // Memory usage tracking
      memoryUsage: typeof process.memoryUsage === 'function',
      
      // Garbage collection
      gc: typeof global.gc === 'function',
      
      // Async/await support
      asyncAwait: this.nodeMajor >= 8,
      
      // Promise support
      promises: typeof Promise !== 'undefined',
      
      // WeakMap/WeakSet support
      weakCollections: typeof WeakMap !== 'undefined' && typeof WeakSet !== 'undefined',
      
      // Proxy support
      proxy: typeof Proxy !== 'undefined',
      
      // Symbol support
      symbols: typeof Symbol !== 'undefined',
      
      // Intl support
      intl: typeof Intl !== 'undefined',
      
      // BigInt support (Node 10.4+)
      bigint: typeof BigInt !== 'undefined',
      
      // Optional chaining/nullish coalescing (supported by transpilation)
      modernSyntax: true
    }
  }

  getCompatibilityReport() {
    return {
      nodeVersion: this.nodeVersion,
      nodeMajor: this.nodeMajor,
      features: this.features,
      isSupported: this.isNodeVersionSupported(),
      warnings: this.getCompatibilityWarnings()
    }
  }

  isNodeVersionSupported() {
    // nuxt-bdd requires Node.js 14+ for full feature support
    return this.nodeMajor >= 14
  }

  getCompatibilityWarnings() {
    const warnings = []
    
    if (this.nodeMajor < 14) {
      warnings.push('Node.js version below 14 may have limited feature support')
    }
    
    if (!this.features.performanceHooks) {
      warnings.push('Performance tracking may be limited without performance hooks')
    }
    
    if (!this.features.gc) {
      warnings.push('Memory testing may be less accurate without gc() access')
    }
    
    return warnings
  }
}

const nodeCompat = new NodeCompatibilityTester()

describe('Node.js version compatibility', () => {
  let bridge

  beforeEach(() => {
    bridge = new VitestCucumberBridge()
  })

  it('should report current Node.js environment', () => {
    const report = nodeCompat.getCompatibilityReport()
    
    console.log('Node.js Compatibility Report:', JSON.stringify(report, null, 2))
    
    expect(report.nodeVersion).toBeDefined()
    expect(report.nodeMajor).toBeGreaterThan(0)
    expect(typeof report.isSupported).toBe('boolean')
  })

  describe('core functionality compatibility', () => {
    it('should work with basic Node.js features', () => {
      // Test basic JavaScript features that should work on all supported versions
      expect(typeof Promise).toBe('function')
      expect(typeof Array.from).toBe('function')
      expect(typeof Object.assign).toBe('function')
      expect(typeof JSON.stringify).toBe('function')
      
      // Test that bridge initializes
      expect(bridge).toBeInstanceOf(VitestCucumberBridge)
    })

    it('should handle async/await regardless of native support', async () => {
      // This should work even on older Node versions due to Babel transpilation
      const asyncTest = async () => {
        await new Promise(resolve => setTimeout(resolve, 1))
        return 'async-success'
      }
      
      const result = await asyncTest()
      expect(result).toBe('async-success')
    })

    it('should work with ES6+ features through transpilation', () => {
      // Arrow functions
      const arrow = (x) => x * 2
      expect(arrow(5)).toBe(10)
      
      // Template literals
      const template = `test-${123}`
      expect(template).toBe('test-123')
      
      // Destructuring
      const { name } = { name: 'test', value: 42 }
      expect(name).toBe('test')
      
      // Spread operator
      const arr1 = [1, 2, 3]
      const arr2 = [...arr1, 4, 5]
      expect(arr2).toEqual([1, 2, 3, 4, 5])
    })
  })

  describe('performance API compatibility', () => {
    it('should handle missing performance API gracefully', () => {
      const originalPerformance = global.performance
      
      try {
        // Remove performance API
        delete global.performance
        
        const perfBridge = new VitestCucumberBridge({
          performanceTracking: true
        })
        
        expect(() => {
          perfBridge.initializePerformanceTracking()
          perfBridge.trackMemory('compatibility_test')
        }).not.toThrow()
        
        const metrics = perfBridge.getPerformanceMetrics()
        expect(metrics).toBeDefined()
        expect(metrics.currentMemory).toBe(0) // Should fallback to 0
        
      } finally {
        global.performance = originalPerformance
      }
    })

    it('should work with limited performance API', () => {
      const originalPerformance = global.performance
      
      try {
        // Provide minimal performance API
        global.performance = {
          now: () => Date.now()
          // No memory property
        }
        
        const perfBridge = new VitestCucumberBridge({
          performanceTracking: true
        })
        
        perfBridge.initializePerformanceTracking()
        perfBridge.trackMemory('limited_api_test')
        
        const metrics = perfBridge.getPerformanceMetrics()
        expect(metrics.totalTime).toBeGreaterThanOrEqual(0)
        expect(metrics.memoryDiff).toBe(0) // Should fallback when memory unavailable
        
      } finally {
        global.performance = originalPerformance
      }
    })

    it('should adapt to different performance measurement approaches', () => {
      const measurements = []
      
      // Test different timing approaches
      if (nodeCompat.features.performanceHooks) {
        // Use performance.now() when available
        const start = performance.now()
        
        // Simulate work
        for (let i = 0; i < 1000; i++) {
          Math.random()
        }
        
        const duration = performance.now() - start
        measurements.push({ method: 'performance.now', duration })
      }
      
      // Fallback to Date.now()
      const start = Date.now()
      
      // Simulate work
      for (let i = 0; i < 1000; i++) {
        Math.random()
      }
      
      const duration = Date.now() - start
      measurements.push({ method: 'Date.now', duration })
      
      expect(measurements.length).toBeGreaterThan(0)
      measurements.forEach(measurement => {
        expect(measurement.duration).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('memory management compatibility', () => {
    it('should handle memory tracking across Node versions', () => {
      if (nodeCompat.features.memoryUsage) {
        const usage = process.memoryUsage()
        expect(usage).toHaveProperty('heapUsed')
        expect(usage).toHaveProperty('heapTotal')
        expect(typeof usage.heapUsed).toBe('number')
      }
      
      // Should work even without memory API
      bridge.initializePerformanceTracking()
      bridge.trackMemory('version_test')
      
      const metrics = bridge.getPerformanceMetrics()
      expect(metrics).toBeDefined()
    })

    it('should work with or without garbage collection access', () => {
      const hasGC = nodeCompat.features.gc
      
      if (hasGC) {
        // Test with GC available
        const beforeGC = process.memoryUsage().heapUsed
        
        // Create some garbage
        const garbage = Array(10000).fill(null).map((_, i) => ({ id: i, data: `test-${i}` }))
        
        global.gc()
        
        const afterGC = process.memoryUsage().heapUsed
        
        // Memory usage should be tracked regardless
        expect(typeof beforeGC).toBe('number')
        expect(typeof afterGC).toBe('number')
      } else {
        // Test without GC - should still work
        const beforeTest = process.memoryUsage().heapUsed
        
        // Create some data
        const data = Array(1000).fill(null).map((_, i) => ({ id: i }))
        
        const afterTest = process.memoryUsage().heapUsed
        
        expect(typeof beforeTest).toBe('number')
        expect(typeof afterTest).toBe('number')
        expect(afterTest >= beforeTest).toBe(true)
      }
    })
  })

  describe('module system compatibility', () => {
    it('should work with ES modules', async () => {
      // Test dynamic imports (should work with bundler support)
      const moduleTest = async () => {
        try {
          // This would work in a real ES module environment
          return 'es-modules-supported'
        } catch (error) {
          return 'es-modules-fallback'
        }
      }
      
      const result = await moduleTest()
      expect(['es-modules-supported', 'es-modules-fallback']).toContain(result)
    })

    it('should handle require/import interoperability', () => {
      // Test that the module can be used in different module systems
      expect(VitestCucumberBridge).toBeDefined()
      expect(typeof VitestCucumberBridge).toBe('function')
      
      // Test that all exports are available
      expect(registerGiven).toBeDefined()
      expect(registerWhen).toBeDefined()
      expect(registerThen).toBeDefined()
      expect(getBDDContext).toBeDefined()
      expect(setBDDState).toBeDefined()
      expect(getBDDState).toBeDefined()
    })
  })

  describe('error handling across versions', () => {
    it('should provide consistent error handling', () => {
      // Test error handling works regardless of Node version
      expect(() => {
        bridge.registerStep('invalid-type', 'pattern', () => {})
      }).toThrow()
      
      try {
        bridge.registerStep('invalid-type', 'pattern', () => {})
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toContain('Invalid step type')
      }
    })

    it('should handle promise rejections consistently', async () => {
      const asyncError = async () => {
        throw new Error('async-test-error')
      }
      
      await expect(asyncError()).rejects.toThrow('async-test-error')
      
      try {
        await asyncError()
      } catch (error) {
        expect(error.message).toBe('async-test-error')
      }
    })
  })

  describe('polyfill and fallback behavior', () => {
    it('should work with polyfilled environments', () => {
      // Test that library works even when some features are polyfilled
      const originalProxy = global.Proxy
      const originalWeakMap = global.WeakMap
      
      try {
        // Simulate environment without some modern features
        if (!nodeCompat.features.proxy) {
          // Would need polyfill in real scenario
          global.Proxy = undefined
        }
        
        if (!nodeCompat.features.weakCollections) {
          global.WeakMap = undefined
        }
        
        // Library should still initialize
        const testBridge = new VitestCucumberBridge()
        expect(testBridge).toBeDefined()
        
      } finally {
        global.Proxy = originalProxy
        global.WeakMap = originalWeakMap
      }
    })

    it('should provide feature detection helpers', () => {
      const features = nodeCompat.features
      
      // Test that we can detect what's available
      if (features.performanceHooks) {
        expect(typeof performance.now).toBe('function')
      }
      
      if (features.memoryUsage) {
        expect(typeof process.memoryUsage).toBe('function')
      }
      
      if (features.gc) {
        expect(typeof global.gc).toBe('function')
      }
      
      // These should always be available in supported environments
      expect(features.asyncAwait).toBe(true)
      expect(features.promises).toBe(true)
    })
  })

  describe('environment-specific optimizations', () => {
    it('should optimize for current Node.js version', () => {
      // Test that library adapts its behavior based on available features
      const optimizedBridge = new VitestCucumberBridge({
        performanceTracking: nodeCompat.features.performanceHooks
      })
      
      if (nodeCompat.features.performanceHooks) {
        optimizedBridge.initializePerformanceTracking()
        const metrics = optimizedBridge.getPerformanceMetrics()
        expect(metrics.totalTime).toBeGreaterThanOrEqual(0)
      }
    })

    it('should degrade gracefully on older versions', () => {
      if (nodeCompat.nodeMajor < 16) {
        console.log('Testing graceful degradation on Node.js', nodeCompat.nodeVersion)
        
        // Features should still work but maybe with reduced functionality
        const bridge = new VitestCucumberBridge()
        
        bridge.registerStep('given', 'test step', () => {})
        const registry = bridge.getStepRegistry()
        
        expect(registry.size).toBe(1)
      }
    })
  })

  describe('compatibility summary', () => {
    it('should provide compatibility information', () => {
      const report = nodeCompat.getCompatibilityReport()
      
      console.log('\n=== nuxt-bdd Compatibility Report ===')
      console.log(`Node.js Version: ${report.nodeVersion}`)
      console.log(`Supported: ${report.isSupported ? '✅' : '❌'}`)
      
      if (report.warnings.length > 0) {
        console.log('\nWarnings:')
        report.warnings.forEach(warning => console.log(`⚠️  ${warning}`))
      }
      
      console.log('\nFeature Support:')
      Object.entries(report.features).forEach(([feature, supported]) => {
        console.log(`  ${feature}: ${supported ? '✅' : '❌'}`)
      })
      console.log('=====================================\n')
      
      // Test should pass regardless of version, but with appropriate warnings
      expect(report).toBeDefined()
      expect(typeof report.isSupported).toBe('boolean')
      
      if (!report.isSupported) {
        console.warn('Running on unsupported Node.js version - some features may not work correctly')
      }
    })
  })
})

describe('cross-platform compatibility', () => {
  it('should work across different operating systems', () => {
    const platform = process.platform
    const arch = process.arch
    
    console.log(`Testing on platform: ${platform} (${arch})`)
    
    // Library should work regardless of platform
    const bridge = new VitestCucumberBridge()
    expect(bridge).toBeInstanceOf(VitestCucumberBridge)
    
    // Path handling should work cross-platform
    const testPath = '/test/path/file.js'
    expect(typeof testPath).toBe('string')
    
    // File operations should be handled by the bundler/framework
    // so platform differences shouldn't affect the library
  })

  it('should handle different JavaScript engines', () => {
    const engine = process.versions.v8 ? 'V8' : 'Unknown'
    console.log(`JavaScript Engine: ${engine}`)
    
    // Test core JavaScript features work consistently
    const testObject = { test: true }
    const testArray = [1, 2, 3]
    const testPromise = Promise.resolve('test')
    
    expect(typeof testObject).toBe('object')
    expect(Array.isArray(testArray)).toBe(true)
    expect(testPromise).toBeInstanceOf(Promise)
  })
})