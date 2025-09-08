/**
 * @fileoverview Performance benchmarks for nuxt-bdd library
 * @description Comprehensive performance testing to ensure library efficiency
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { performance } from 'perf_hooks'
import { 
  VitestCucumberBridge,
  registerGiven,
  registerWhen, 
  registerThen
} from '../../src/bdd/vitest-cucumber-bridge.js'

/**
 * Performance test utilities
 */
class PerformanceTester {
  constructor() {
    this.results = []
    this.memoryBaseline = 0
  }

  startMeasurement(label) {
    if (typeof global.gc === 'function') {
      global.gc()
    }
    
    this.memoryBaseline = process.memoryUsage().heapUsed
    return {
      label,
      startTime: performance.now(),
      startMemory: this.memoryBaseline
    }
  }

  endMeasurement(measurement) {
    const endTime = performance.now()
    const endMemory = process.memoryUsage().heapUsed
    
    const result = {
      label: measurement.label,
      duration: endTime - measurement.startTime,
      memoryDelta: endMemory - measurement.startMemory,
      timestamp: new Date().toISOString()
    }
    
    this.results.push(result)
    return result
  }

  getStatistics() {
    const durations = this.results.map(r => r.duration)
    const memoryDeltas = this.results.map(r => r.memoryDelta)
    
    return {
      totalTests: this.results.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      averageMemoryDelta: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
      maxMemoryDelta: Math.max(...memoryDeltas),
      results: this.results
    }
  }

  reset() {
    this.results = []
  }
}

// Test component for performance testing
const BenchmarkComponent = {
  name: 'BenchmarkComponent',
  template: `
    <div class="benchmark-component">
      <h1>{{ title }}</h1>
      <ul>
        <li v-for="item in items" :key="item.id">
          {{ item.name }} - {{ item.value }}
        </li>
      </ul>
      <button @click="addItem">Add Item</button>
      <button @click="removeItem">Remove Item</button>
    </div>
  `,
  props: {
    title: { type: String, default: 'Benchmark' },
    initialItemCount: { type: Number, default: 0 }
  },
  data() {
    return {
      items: [],
      counter: 0
    }
  },
  created() {
    for (let i = 0; i < this.initialItemCount; i++) {
      this.addItem()
    }
  },
  methods: {
    addItem() {
      this.items.push({
        id: this.counter++,
        name: `Item ${this.counter}`,
        value: Math.random().toFixed(2)
      })
    },
    removeItem() {
      if (this.items.length > 0) {
        this.items.pop()
      }
    }
  }
}

describe('nuxt-bdd performance benchmarks', () => {
  let perfTester
  let bridge

  beforeEach(() => {
    perfTester = new PerformanceTester()
    bridge = new VitestCucumberBridge({
      performanceTracking: true,
      autoCleanup: false
    })
  })

  afterEach(() => {
    if (bridge) {
      bridge.cleanup()
    }
    perfTester.reset()
  })

  describe('initialization performance', () => {
    it('should initialize quickly', () => {
      const measurement = perfTester.startMeasurement('bridge_initialization')
      
      const testBridge = new VitestCucumberBridge({
        performanceTracking: true,
        autoCleanup: true
      })
      
      const result = perfTester.endMeasurement(measurement)
      
      // Initialization should be under 10ms
      expect(result.duration).toBeLessThan(10)
      
      // Memory usage should be reasonable (under 1MB)
      expect(Math.abs(result.memoryDelta)).toBeLessThan(1024 * 1024)
    })

    it('should handle multiple initializations efficiently', () => {
      const iterations = 100
      const results = []
      
      for (let i = 0; i < iterations; i++) {
        const measurement = perfTester.startMeasurement(`init_${i}`)
        
        const testBridge = new VitestCucumberBridge({
          performanceTracking: i % 2 === 0,
          autoCleanup: true
        })
        
        results.push(perfTester.endMeasurement(measurement))
      }
      
      const stats = perfTester.getStatistics()
      
      // Average initialization should be fast
      expect(stats.averageDuration).toBeLessThan(5)
      
      // Performance should be consistent
      expect(stats.maxDuration - stats.minDuration).toBeLessThan(50)
      
      console.log(`Multiple initialization stats:`, stats)
    })
  })

  describe('step registration performance', () => {
    it('should register steps efficiently', () => {
      const stepCount = 1000
      const measurement = perfTester.startMeasurement('step_registration')
      
      for (let i = 0; i < stepCount; i++) {
        bridge.registerStep(
          i % 3 === 0 ? 'given' : i % 3 === 1 ? 'when' : 'then',
          `test step ${i} with parameter {string}`,
          function(param) { return `executed_${i}_${param}` },
          { description: `Test step number ${i}` }
        )
      }
      
      const result = perfTester.endMeasurement(measurement)
      
      // Should register 1000 steps in under 100ms
      expect(result.duration).toBeLessThan(100)
      
      // Verify all steps were registered
      const registry = bridge.getStepRegistry()
      expect(registry.size).toBe(stepCount)
      
      console.log(`Registered ${stepCount} steps in ${result.duration.toFixed(2)}ms`)
    })

    it('should handle duplicate registrations gracefully', () => {
      const measurement = perfTester.startMeasurement('duplicate_registration')
      
      // Register same step multiple times
      for (let i = 0; i < 100; i++) {
        bridge.registerStep('given', 'I have a duplicate step', function() {})
      }
      
      const result = perfTester.endMeasurement(measurement)
      
      // Should handle duplicates efficiently
      expect(result.duration).toBeLessThan(50)
      
      // Only one entry should exist (last one wins)
      const registry = bridge.getStepRegistry()
      expect(registry.has('given:I have a duplicate step')).toBe(true)
    })
  })

  describe('component mounting performance', () => {
    it('should mount simple components quickly', async () => {
      const iterations = 50
      const results = []
      
      for (let i = 0; i < iterations; i++) {
        const measurement = perfTester.startMeasurement(`mount_simple_${i}`)
        
        const wrapper = await bridge.mountComponent({
          component: BenchmarkComponent,
          props: { title: `Test ${i}` }
        })
        
        results.push(perfTester.endMeasurement(measurement))
        
        wrapper.unmount()
      }
      
      const stats = perfTester.getStatistics()
      
      // Simple component mounting should average under 50ms
      expect(stats.averageDuration).toBeLessThan(50)
      
      console.log(`Simple component mounting stats:`, stats)
    })

    it('should handle complex components efficiently', async () => {
      const iterations = 20
      const results = []
      
      for (let i = 0; i < iterations; i++) {
        const measurement = perfTester.startMeasurement(`mount_complex_${i}`)
        
        const wrapper = await bridge.mountComponent({
          component: BenchmarkComponent,
          props: { 
            title: `Complex Test ${i}`,
            initialItemCount: 100 // Start with many items
          }
        })
        
        results.push(perfTester.endMeasurement(measurement))
        
        wrapper.unmount()
      }
      
      const stats = perfTester.getStatistics()
      
      // Complex component mounting should still be reasonable
      expect(stats.averageDuration).toBeLessThan(200)
      
      console.log(`Complex component mounting stats:`, stats)
    })

    it('should scale well with concurrent mounts', async () => {
      const concurrentCount = 10
      const measurement = perfTester.startMeasurement('concurrent_mounting')
      
      const mountPromises = Array(concurrentCount).fill(null).map(async (_, i) => {
        return bridge.mountComponent({
          component: BenchmarkComponent,
          props: { title: `Concurrent ${i}` }
        })
      })
      
      const wrappers = await Promise.all(mountPromises)
      
      const result = perfTester.endMeasurement(measurement)
      
      // Concurrent mounting should complete in reasonable time
      expect(result.duration).toBeLessThan(500)
      
      // Cleanup
      wrappers.forEach(wrapper => wrapper.unmount())
      
      console.log(`Concurrent mounting (${concurrentCount} components) completed in ${result.duration.toFixed(2)}ms`)
    })
  })

  describe('feature validation performance', () => {
    it('should validate large features efficiently', () => {
      // Register many steps first
      const stepCount = 500
      for (let i = 0; i < stepCount; i++) {
        bridge.registerStep(
          'given',
          `I have test condition ${i}`,
          function() {}
        )
      }
      
      // Create large feature file
      const largeFeature = `
Feature: Large Feature Test
${Array(100).fill(null).map((_, i) => `
  Scenario: Test Scenario ${i}
    Given I have test condition ${i % stepCount}
    When I perform action ${i}
    Then I should see result ${i}
`).join('')}
      `
      
      const measurement = perfTester.startMeasurement('large_feature_validation')
      
      const result = bridge.validateFeatureSteps(largeFeature)
      
      const perfResult = perfTester.endMeasurement(measurement)
      
      // Should validate large feature in under 500ms
      expect(perfResult.duration).toBeLessThan(500)
      
      // Should identify correct number of steps
      expect(result.totalSteps).toBe(300) // 100 scenarios * 3 steps each
      
      console.log(`Validated feature with ${result.totalSteps} steps in ${perfResult.duration.toFixed(2)}ms`)
    })

    it('should handle complex regex patterns efficiently', () => {
      // Register steps with complex patterns
      const complexPatterns = [
        'I have {int} users with email matching /.*@example\\.com/',
        'the response should contain {string} and have status code {int}',
        'I wait for element {string} to be visible within {int} seconds',
        'I should see between {int} and {int} items in the {string} section'
      ]
      
      complexPatterns.forEach((pattern, i) => {
        bridge.registerStep('given', pattern, function() {})
      })
      
      const complexFeature = `
Feature: Complex Pattern Test
  Scenario: Pattern matching test
    Given I have 100 users with email matching /.*@example\\.com/
    When the response should contain "success" and have status code 200
    Then I wait for element ".result" to be visible within 5 seconds
    And I should see between 1 and 10 items in the "results" section
      `
      
      const measurement = perfTester.startMeasurement('complex_pattern_validation')
      
      const result = bridge.validateFeatureSteps(complexFeature)
      
      const perfResult = perfTester.endMeasurement(measurement)
      
      // Should handle complex patterns efficiently
      expect(perfResult.duration).toBeLessThan(100)
      expect(result.isValid).toBe(true)
      
      console.log(`Complex pattern validation completed in ${perfResult.duration.toFixed(2)}ms`)
    })
  })

  describe('step generation performance', () => {
    it('should generate step definitions quickly', () => {
      const featureWithManySteps = `
Feature: Step Generation Test
${Array(50).fill(null).map((_, i) => `
  Scenario: Generation Test ${i}
    Given I have parameter "value${i}" with number ${i}
    When I perform action ${i} with score ${i}.${i}
    Then I should see "result ${i}" displayed
`).join('')}
      `
      
      const measurement = perfTester.startMeasurement('step_generation')
      
      const generated = bridge.generateStepDefinitions(featureWithManySteps)
      
      const result = perfTester.endMeasurement(measurement)
      
      // Should generate many step definitions efficiently
      expect(result.duration).toBeLessThan(200)
      
      // Should contain proper structure
      expect(generated).toContain('Given(')
      expect(generated).toContain('When(')
      expect(generated).toContain('Then(')
      
      // Count generated functions
      const functionCount = (generated.match(/async function/g) || []).length
      expect(functionCount).toBe(150) // 50 scenarios * 3 steps each
      
      console.log(`Generated ${functionCount} step definitions in ${result.duration.toFixed(2)}ms`)
    })
  })

  describe('memory usage benchmarks', () => {
    it('should maintain stable memory usage', () => {
      bridge.initializePerformanceTracking()
      
      const iterations = 100
      const memoryReadings = []
      
      for (let i = 0; i < iterations; i++) {
        // Create and destroy test data
        const testData = Array(1000).fill(null).map((_, j) => ({
          id: j,
          data: `test_${i}_${j}`,
          timestamp: Date.now()
        }))
        
        bridge.trackMemory(`iteration_${i}`)
        
        // Let GC work if available
        if (typeof global.gc === 'function' && i % 10 === 0) {
          global.gc()
        }
      }
      
      const metrics = bridge.getPerformanceMetrics()
      const memoryUsages = metrics.memoryUsage.map(m => m.usage)
      
      if (memoryUsages.length > 1) {
        const first = memoryUsages[0]
        const last = memoryUsages[memoryUsages.length - 1]
        const totalIncrease = last - first
        
        // Memory should not increase by more than 50MB over 100 iterations
        expect(totalIncrease).toBeLessThan(50 * 1024 * 1024)
        
        console.log(`Memory usage over ${iterations} iterations: ${(totalIncrease / 1024 / 1024).toFixed(2)}MB increase`)
      }
    })

    it('should clean up memory properly', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Create many components and operations
      const wrappers = []
      for (let i = 0; i < 20; i++) {
        const wrapper = await bridge.mountComponent({
          component: BenchmarkComponent,
          props: { 
            title: `Memory Test ${i}`,
            initialItemCount: 50
          }
        })
        wrappers.push(wrapper)
      }
      
      const peakMemory = process.memoryUsage().heapUsed
      
      // Cleanup everything
      bridge.cleanup()
      wrappers.forEach(wrapper => wrapper.unmount())
      
      // Force garbage collection if available
      if (typeof global.gc === 'function') {
        global.gc()
        global.gc() // Double GC for better cleanup
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryRecovered = peakMemory - finalMemory
      const netIncrease = finalMemory - initialMemory
      
      // Should recover most of the memory
      expect(memoryRecovered).toBeGreaterThan(0)
      
      // Net increase should be minimal (under 5MB)
      expect(netIncrease).toBeLessThan(5 * 1024 * 1024)
      
      console.log(`Memory recovered: ${(memoryRecovered / 1024 / 1024).toFixed(2)}MB`)
      console.log(`Net memory increase: ${(netIncrease / 1024 / 1024).toFixed(2)}MB`)
    })
  })

  describe('stress testing', () => {
    it('should handle high-frequency operations', async () => {
      const operations = 1000
      const measurement = perfTester.startMeasurement('stress_test')
      
      const promises = []
      
      for (let i = 0; i < operations; i++) {
        if (i % 3 === 0) {
          // Step registration
          promises.push(Promise.resolve().then(() => {
            bridge.registerStep('given', `stress test step ${i}`, function() {})
          }))
        } else if (i % 3 === 1) {
          // Component mounting
          promises.push(bridge.mountComponent({
            component: BenchmarkComponent,
            props: { title: `Stress ${i}` }
          }).then(wrapper => wrapper.unmount()))
        } else {
          // State operations
          promises.push(Promise.resolve().then(() => {
            bridge.trackMemory(`stress_${i}`)
          }))
        }
      }
      
      await Promise.all(promises)
      
      const result = perfTester.endMeasurement(measurement)
      
      // Should handle high frequency operations in reasonable time
      expect(result.duration).toBeLessThan(2000) // 2 seconds for 1000 operations
      
      console.log(`Stress test (${operations} operations) completed in ${result.duration.toFixed(2)}ms`)
      console.log(`Average per operation: ${(result.duration / operations).toFixed(3)}ms`)
    })
  })

  describe('regression detection', () => {
    it('should maintain performance baselines', () => {
      // This test would typically compare against saved baselines
      // For now, we'll just establish what current performance looks like
      
      const testSuite = [
        {
          name: 'initialization',
          test: () => new VitestCucumberBridge()
        },
        {
          name: 'step_registration',
          test: () => bridge.registerStep('given', 'test step', function() {})
        },
        {
          name: 'feature_validation',
          test: () => bridge.validateFeatureSteps('Feature: Test\nScenario: Test\nGiven test step')
        }
      ]
      
      const baselines = {}
      
      testSuite.forEach(suite => {
        const measurement = perfTester.startMeasurement(suite.name)
        
        // Run test multiple times for average
        for (let i = 0; i < 10; i++) {
          suite.test()
        }
        
        const result = perfTester.endMeasurement(measurement)
        baselines[suite.name] = result.duration / 10 // Average per operation
      })
      
      // Log current baselines (in real implementation, would compare against saved values)
      console.log('Current performance baselines:', baselines)
      
      // Expect reasonable performance
      expect(baselines.initialization).toBeLessThan(5) // < 5ms per init
      expect(baselines.step_registration).toBeLessThan(1) // < 1ms per step
      expect(baselines.feature_validation).toBeLessThan(10) // < 10ms per validation
    })
  })
})

describe('performance edge cases', () => {
  let bridge

  beforeEach(() => {
    bridge = new VitestCucumberBridge()
  })

  it('should handle extremely large feature files', () => {
    const hugeFeature = `
Feature: Huge Feature
${Array(1000).fill(null).map((_, i) => `
  Scenario: Huge Scenario ${i}
    Given I have condition ${i}
    When I perform action ${i}
    Then I expect result ${i}
    And I verify step ${i}
    But I handle edge case ${i}
`).join('')}
    `
    
    const start = performance.now()
    const result = bridge.validateFeatureSteps(hugeFeature)
    const duration = performance.now() - start
    
    // Should handle 5000 steps in under 2 seconds
    expect(duration).toBeLessThan(2000)
    expect(result.totalSteps).toBe(5000)
    
    console.log(`Validated huge feature with ${result.totalSteps} steps in ${duration.toFixed(2)}ms`)
  })

  it('should handle deeply nested component structures', async () => {
    const DeepComponent = {
      name: 'DeepComponent',
      template: `
        <div>
          <component 
            v-for="n in depth" 
            :key="n" 
            :is="n === depth ? 'span' : 'DeepComponent'"
            :depth="n === depth ? 0 : depth - 1"
          >
            Level {{ n }}
          </component>
        </div>
      `,
      props: ['depth']
    }
    
    const start = performance.now()
    const wrapper = await bridge.mountComponent({
      component: DeepComponent,
      props: { depth: 10 },
      stubs: {
        DeepComponent: DeepComponent
      }
    })
    const duration = performance.now() - start
    
    // Should handle deep nesting in reasonable time
    expect(duration).toBeLessThan(500)
    expect(wrapper.exists()).toBe(true)
    
    wrapper.unmount()
  })

  it('should handle very long step patterns', () => {
    const longPattern = 'I have a very very very very very very long step pattern with many many many many parameters like {string} and {int} and {float} and more {string} and another {int} and yet another {float} that tests the limits of pattern matching performance'
    
    const start = performance.now()
    
    for (let i = 0; i < 100; i++) {
      bridge.registerStep('given', longPattern, function() {})
    }
    
    const duration = performance.now() - start
    
    // Should handle very long patterns efficiently
    expect(duration).toBeLessThan(100)
  })
})