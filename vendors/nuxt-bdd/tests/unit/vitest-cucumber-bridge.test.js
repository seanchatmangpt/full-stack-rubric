/**
 * @fileoverview Unit tests for VitestCucumberBridge
 * @description Comprehensive unit tests covering all BDD bridge functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { 
  VitestCucumberBridge, 
  bddBridge, 
  bddContext,
  registerGiven,
  registerWhen, 
  registerThen,
  mountWithBDD,
  getBDDContext,
  setBDDState,
  getBDDState
} from '../../src/bdd/vitest-cucumber-bridge.js'

// Mock Vue Test Utils
vi.mock('@vue/test-utils', () => ({
  mount: vi.fn()
}))

// Mock vitest-cucumber
vi.mock('@amiceli/vitest-cucumber', () => ({
  Given: vi.fn(),
  When: vi.fn(), 
  Then: vi.fn(),
  Before: vi.fn(),
  After: vi.fn()
}))

// Test component
const TestComponent = {
  name: 'TestComponent',
  template: '<div>Test Component</div>',
  props: ['testProp']
}

describe('VitestCucumberBridge', () => {
  let bridge
  let mockWrapper

  beforeEach(() => {
    bridge = new VitestCucumberBridge()
    mockWrapper = {
      unmount: vi.fn(),
      vm: {},
      element: document.createElement('div')
    }
    
    // Reset context
    bddContext.wrapper = null
    bddContext.state = {}
    bddContext.mocks = {}
    bddContext.performance = {}
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const defaultBridge = new VitestCucumberBridge()
      
      expect(defaultBridge.config).toEqual({
        autoCleanup: true,
        performanceTracking: false,
        mockDefaults: {}
      })
    })

    it('should merge custom configuration with defaults', () => {
      const customBridge = new VitestCucumberBridge({
        autoCleanup: false,
        performanceTracking: true,
        mockDefaults: { CustomStub: { template: '<div>Custom</div>' } }
      })
      
      expect(customBridge.config.autoCleanup).toBe(false)
      expect(customBridge.config.performanceTracking).toBe(true)
      expect(customBridge.config.mockDefaults.CustomStub).toBeDefined()
    })
  })

  describe('registerStep', () => {
    it('should register Given step correctly', () => {
      const handler = vi.fn()
      const pattern = 'I have a test pattern'
      
      bridge.registerStep('given', pattern, handler)
      
      const registry = bridge.getStepRegistry()
      expect(registry.has(`given:${pattern}`)).toBe(true)
      
      const stepDef = registry.get(`given:${pattern}`)
      expect(stepDef.pattern).toBe(pattern)
      expect(stepDef.handler).toBe(handler)
      expect(stepDef.type).toBe('given')
    })

    it('should register When step correctly', () => {
      const handler = vi.fn()
      const pattern = 'I perform an action'
      
      bridge.registerStep('when', pattern, handler)
      
      const registry = bridge.getStepRegistry()
      expect(registry.has(`when:${pattern}`)).toBe(true)
    })

    it('should register Then step correctly', () => {
      const handler = vi.fn()
      const pattern = 'I should see the result'
      
      bridge.registerStep('then', pattern, handler)
      
      const registry = bridge.getStepRegistry()
      expect(registry.has(`then:${pattern}`)).toBe(true)
    })

    it('should throw error for invalid step type', () => {
      const handler = vi.fn()
      
      expect(() => {
        bridge.registerStep('invalid', 'pattern', handler)
      }).toThrow('Invalid step type: invalid')
    })
  })

  describe('mountComponent', () => {
    beforeEach(() => {
      vi.mocked(mount).mockReturnValue(mockWrapper)
      
      // Mock performance API
      global.performance = {
        now: vi.fn().mockReturnValue(100),
        memory: { usedJSHeapSize: 1000000 }
      }
    })

    it('should mount component with default stubs', async () => {
      const config = { component: TestComponent, props: { testProp: 'value' } }
      
      const wrapper = await bridge.mountComponent(config)
      
      expect(mount).toHaveBeenCalledWith(TestComponent, expect.objectContaining({
        props: { testProp: 'value' },
        global: expect.objectContaining({
          stubs: expect.objectContaining({
            MonacoEditor: expect.any(Object),
            UButton: expect.any(Object),
            UBadge: expect.any(Object),
            UModal: expect.any(Object),
            UCard: expect.any(Object)
          })
        })
      }))
      
      expect(wrapper).toBe(mockWrapper)
      expect(bddContext.wrapper).toBe(mockWrapper)
    })

    it('should merge custom stubs with defaults', async () => {
      const customStubs = { CustomComponent: { template: '<div>Custom</div>' } }
      const config = { 
        component: TestComponent,
        stubs: customStubs
      }
      
      await bridge.mountComponent(config)
      
      expect(mount).toHaveBeenCalledWith(TestComponent, expect.objectContaining({
        global: expect.objectContaining({
          stubs: expect.objectContaining({
            ...customStubs,
            MonacoEditor: expect.any(Object),
            UButton: expect.any(Object)
          })
        })
      }))
    })

    it('should track performance when enabled', async () => {
      const perfBridge = new VitestCucumberBridge({ performanceTracking: true })
      perfBridge.initializePerformanceTracking()
      
      const config = { component: TestComponent }
      
      await perfBridge.mountComponent(config)
      
      const metrics = perfBridge.getPerformanceMetrics()
      expect(metrics.renderTimes).toHaveLength(1)
      expect(metrics.renderTimes[0]).toBeGreaterThanOrEqual(0)
    })
  })

  describe('cleanup', () => {
    it('should cleanup wrapper and context', () => {
      bddContext.wrapper = mockWrapper
      bddContext.state = { testKey: 'testValue' }
      bddContext.mocks = { mockFn: vi.fn() }
      bddContext.performance = { metric: 100 }
      
      bridge.cleanup()
      
      expect(mockWrapper.unmount).toHaveBeenCalled()
      expect(bddContext.wrapper).toBeNull()
      expect(bddContext.state).toEqual({})
      expect(bddContext.mocks).toEqual({})
      expect(bddContext.performance).toEqual({})
    })
  })

  describe('validateFeatureSteps', () => {
    it('should validate feature with all matching steps', () => {
      // Register test steps
      bridge.registerStep('given', 'I have a user', vi.fn())
      bridge.registerStep('when', 'I click the button', vi.fn())
      bridge.registerStep('then', 'I should see success', vi.fn())
      
      const featureContent = `
Feature: Test Feature
  Scenario: Test Scenario
    Given I have a user
    When I click the button
    Then I should see success
      `
      
      const result = bridge.validateFeatureSteps(featureContent)
      
      expect(result.isValid).toBe(true)
      expect(result.missing).toHaveLength(0)
      expect(result.found).toHaveLength(3)
      expect(result.totalSteps).toBe(3)
    })

    it('should identify missing step definitions', () => {
      const featureContent = `
Feature: Test Feature  
  Scenario: Test Scenario
    Given I have a user
    When I perform undefined action
    Then I should see success
      `
      
      const result = bridge.validateFeatureSteps(featureContent)
      
      expect(result.isValid).toBe(false)
      expect(result.missing).toHaveLength(3)
      expect(result.missing[0].text).toBe('I have a user')
      expect(result.missing[1].text).toBe('I perform undefined action')
      expect(result.missing[2].text).toBe('I should see success')
    })
  })

  describe('generateStepDefinitions', () => {
    it('should generate step definitions for missing steps', () => {
      const featureContent = `
Feature: Test Feature
  Scenario: Test Scenario  
    Given I have a user named "John"
    When I click button number 5
    Then I should see 3.14 result
      `
      
      const generated = bridge.generateStepDefinitions(featureContent)
      
      expect(generated).toContain('Given(\'{string}\', i_have_a_user_named)')
      expect(generated).toContain('When(\'{int}\', i_click_button_number)')
      expect(generated).toContain('Then(\'{float}\', i_should_see_result)')
    })
  })

  describe('parameterizeStep', () => {
    it('should parameterize integers', () => {
      const result = bridge.parameterizeStep('I click button 5')
      expect(result).toBe('I click button {int}')
    })

    it('should parameterize floats', () => {
      const result = bridge.parameterizeStep('I expect 3.14 result')
      expect(result).toBe('I expect {float} result')
    })

    it('should parameterize quoted strings', () => {
      const result = bridge.parameterizeStep('I have a user named "John"')
      expect(result).toBe('I have a user named {string}')
    })

    it('should parameterize single quoted strings', () => {
      const result = bridge.parameterizeStep("I have a user named 'Jane'")
      expect(result).toBe('I have a user named {string}')
    })
  })

  describe('extractParameters', () => {
    it('should extract parameter names correctly', () => {
      const params = bridge.extractParameters('I have {int} users named {string} with score {float}')
      expect(params).toEqual(['int', 'string', 'float'])
    })

    it('should handle multiple parameters of same type', () => {
      const params = bridge.extractParameters('I have {int} users and {int} admins')
      expect(params).toEqual(['int', 'int2'])
    })
  })

  describe('generateFunctionName', () => {
    it('should generate valid function name from step text', () => {
      const result = bridge.generateFunctionName('I have a user named "John" with ID 123!')
      expect(result).toBe('i_have_a_user_named_john_with_id')
    })

    it('should limit function name length', () => {
      const longText = 'I have a very very very very very very long step description that should be truncated'
      const result = bridge.generateFunctionName(longText)
      expect(result.length).toBeLessThanOrEqual(50)
    })
  })

  describe('performance tracking', () => {
    let perfBridge

    beforeEach(() => {
      perfBridge = new VitestCucumberBridge({ performanceTracking: true })
      
      global.performance = {
        now: vi.fn().mockReturnValue(1000),
        memory: { usedJSHeapSize: 2000000 }
      }
    })

    it('should initialize performance tracking', () => {
      perfBridge.initializePerformanceTracking()
      
      const metrics = perfBridge.getPerformanceMetrics()
      expect(metrics.renderTimes).toEqual([])
      expect(metrics.inputLatency).toEqual([])
      expect(metrics.memoryUsage).toEqual([])
    })

    it('should track memory usage with labels', () => {
      perfBridge.initializePerformanceTracking()
      
      perfBridge.trackMemory('test_operation')
      
      const metrics = perfBridge.getPerformanceMetrics()
      expect(metrics.memoryUsage).toHaveLength(1)
      expect(metrics.memoryUsage[0].label).toBe('test_operation')
      expect(metrics.memoryUsage[0].usage).toBe(2000000)
    })

    it('should calculate memory diff correctly', () => {
      perfBridge.initializePerformanceTracking()
      
      const metrics = perfBridge.getPerformanceMetrics()
      expect(metrics.memoryDiff).toBeGreaterThanOrEqual(0)
    })
  })
})

describe('convenience functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('registerGiven/When/Then', () => {
    it('should register Given step using convenience function', () => {
      const handler = vi.fn()
      const pattern = 'I have something'
      
      registerGiven(pattern, handler, { description: 'Test given' })
      
      const registry = bddBridge.getStepRegistry()
      expect(registry.has(`given:${pattern}`)).toBe(true)
    })

    it('should register When step using convenience function', () => {
      const handler = vi.fn()
      const pattern = 'I do something'
      
      registerWhen(pattern, handler)
      
      const registry = bddBridge.getStepRegistry()
      expect(registry.has(`when:${pattern}`)).toBe(true)
    })

    it('should register Then step using convenience function', () => {
      const handler = vi.fn()
      const pattern = 'I should see something'
      
      registerThen(pattern, handler)
      
      const registry = bddBridge.getStepRegistry()
      expect(registry.has(`then:${pattern}`)).toBe(true)
    })
  })

  describe('mountWithBDD', () => {
    beforeEach(() => {
      vi.mocked(mount).mockReturnValue({
        unmount: vi.fn(),
        vm: {},
        element: document.createElement('div')
      })

      global.performance = {
        now: vi.fn().mockReturnValue(100),
        memory: { usedJSHeapSize: 1000000 }
      }
    })

    it('should mount component using convenience function', async () => {
      const options = { props: { test: true } }
      
      const wrapper = await mountWithBDD(TestComponent, options)
      
      expect(mount).toHaveBeenCalledWith(TestComponent, expect.objectContaining({
        props: { test: true },
        global: expect.objectContaining({
          stubs: expect.any(Object)
        })
      }))
      
      expect(wrapper).toBeDefined()
    })
  })

  describe('BDD context helpers', () => {
    beforeEach(() => {
      // Reset context
      bddContext.wrapper = null
      bddContext.state = {}
      bddContext.mocks = {}
      bddContext.performance = {}
    })

    it('should get BDD context', () => {
      const context = getBDDContext()
      expect(context).toBe(bddContext)
    })

    it('should set and get BDD state', () => {
      setBDDState('testKey', 'testValue')
      
      expect(getBDDState('testKey')).toBe('testValue')
      expect(bddContext.state.testKey).toBe('testValue')
    })

    it('should return undefined for non-existent state key', () => {
      expect(getBDDState('nonExistent')).toBeUndefined()
    })
  })
})

describe('integration with vitest-cucumber', () => {
  it('should call vitest-cucumber Given when registering given step', () => {
    const { Given } = require('@amiceli/vitest-cucumber')
    const handler = vi.fn()
    const pattern = 'test pattern'
    
    registerGiven(pattern, handler)
    
    expect(Given).toHaveBeenCalledWith(pattern, handler)
  })

  it('should call vitest-cucumber When when registering when step', () => {
    const { When } = require('@amiceli/vitest-cucumber')
    const handler = vi.fn()
    const pattern = 'test pattern'
    
    registerWhen(pattern, handler)
    
    expect(When).toHaveBeenCalledWith(pattern, handler)
  })

  it('should call vitest-cucumber Then when registering then step', () => {
    const { Then } = require('@amiceli/vitest-cucumber')
    const handler = vi.fn()
    const pattern = 'test pattern'
    
    registerThen(pattern, handler)
    
    expect(Then).toHaveBeenCalledWith(pattern, handler)
  })
})