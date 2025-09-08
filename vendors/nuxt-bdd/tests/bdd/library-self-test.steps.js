/**
 * @fileoverview BDD step definitions for nuxt-bdd library self-testing
 * @description Tests the library using itself - the ultimate meta-test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { 
  VitestCucumberBridge,
  registerGiven,
  registerWhen, 
  registerThen,
  getBDDContext,
  setBDDState,
  getBDDState
} from '../../src/bdd/vitest-cucumber-bridge.js'

// Test context for sharing data between steps
const testContext = {
  bridge: null,
  testComponent: null,
  wrapper: null,
  featureContent: '',
  validationResult: null,
  generatedSteps: '',
  performanceMetrics: null,
  error: null,
  stepRegistry: null
}

// Test component for mounting tests
const TestComponent = {
  name: 'TestComponent',
  template: `
    <div class="test-component">
      <h1>{{ title }}</h1>
      <button @click="increment" data-testid="increment-btn">
        Count: {{ count }}
      </button>
      <input 
        v-model="inputValue" 
        data-testid="test-input"
        @input="$emit('input-change', inputValue)"
      />
    </div>
  `,
  props: {
    title: { type: String, default: 'Test Component' }
  },
  data() {
    return {
      count: 0,
      inputValue: ''
    }
  },
  methods: {
    increment() {
      this.count++
      this.$emit('count-changed', this.count)
    }
  }
}

// Background steps
registerGiven('I have the nuxt-bdd library installed', function() {
  // Verify library is available
  expect(VitestCucumberBridge).toBeDefined()
  expect(registerGiven).toBeDefined()
  expect(registerWhen).toBeDefined()
  expect(registerThen).toBeDefined()
})

registerGiven('the VitestCucumberBridge is initialized', function() {
  testContext.bridge = new VitestCucumberBridge({
    autoCleanup: false, // Manual cleanup for testing
    performanceTracking: true,
    mockDefaults: {}
  })
  
  expect(testContext.bridge).toBeInstanceOf(VitestCucumberBridge)
})

// Basic step registration scenario
registerGiven('I have a BDD bridge instance', function() {
  if (!testContext.bridge) {
    testContext.bridge = new VitestCucumberBridge()
  }
  expect(testContext.bridge).toBeInstanceOf(VitestCucumberBridge)
})

registerWhen('I register a {string} step with pattern {string}', function(stepType, pattern) {
  const handler = function() { return 'test-handler-result' }
  
  testContext.bridge.registerStep(stepType.toLowerCase(), pattern, handler, {
    description: `Test ${stepType} step`
  })
  
  testContext.stepRegistry = testContext.bridge.getStepRegistry()
})

registerThen('the step should be registered in the step registry', function() {
  expect(testContext.stepRegistry).toBeDefined()
  expect(testContext.stepRegistry.size).toBeGreaterThan(0)
  
  const registryKeys = Array.from(testContext.stepRegistry.keys())
  expect(registryKeys).toContain('given:I have a test user')
})

registerThen('the step should be callable with vitest-cucumber', function() {
  const stepDef = testContext.stepRegistry.get('given:I have a test user')
  expect(stepDef).toBeDefined()
  expect(stepDef.handler).toBeInstanceOf(Function)
  expect(stepDef.type).toBe('given')
  
  // Test that handler can be called
  const result = stepDef.handler()
  expect(result).toBe('test-handler-result')
})

// Component mounting scenario
registerGiven('I have a Vue component for testing', function() {
  testContext.testComponent = TestComponent
  expect(testContext.testComponent).toBeDefined()
  expect(testContext.testComponent.name).toBe('TestComponent')
})

registerWhen('I mount the component using the BDD bridge', async function() {
  testContext.wrapper = await testContext.bridge.mountComponent({
    component: testContext.testComponent,
    props: { title: 'BDD Test Component' }
  })
})

registerThen('the component should be mounted successfully', function() {
  expect(testContext.wrapper).toBeDefined()
  expect(testContext.wrapper.vm).toBeDefined()
  expect(testContext.wrapper.text()).toContain('BDD Test Component')
})

registerThen('the wrapper should be stored in BDD context', function() {
  const context = getBDDContext()
  expect(context.wrapper).toBe(testContext.wrapper)
})

registerThen('I should be able to interact with the component', async function() {
  const button = testContext.wrapper.find('[data-testid="increment-btn"]')
  expect(button.exists()).toBe(true)
  
  await button.trigger('click')
  expect(testContext.wrapper.text()).toContain('Count: 1')
  
  const input = testContext.wrapper.find('[data-testid="test-input"]')
  await input.setValue('test value')
  expect(testContext.wrapper.vm.inputValue).toBe('test value')
})

// Feature validation scenario
registerGiven('I have a feature file with step definitions', function(featureContent) {
  testContext.featureContent = featureContent
  expect(testContext.featureContent).toContain('Feature: Test Feature')
})

registerWhen('I validate the feature against registered steps', function() {
  testContext.validationResult = testContext.bridge.validateFeatureSteps(testContext.featureContent)
})

registerThen('the validation should identify missing step definitions', function() {
  expect(testContext.validationResult).toBeDefined()
  expect(testContext.validationResult.isValid).toBe(false)
  expect(testContext.validationResult.missing.length).toBeGreaterThan(0)
})

registerThen('I should get a list of steps that need implementation', function() {
  const missingSteps = testContext.validationResult.missing
  expect(missingSteps).toContain(
    expect.objectContaining({
      text: 'I am a user',
      type: 'Given'
    })
  )
  expect(missingSteps).toContain(
    expect.objectContaining({
      text: 'I perform an action',
      type: 'When'  
    })
  )
  expect(missingSteps).toContain(
    expect.objectContaining({
      text: 'I should see a result',
      type: 'Then'
    })
  )
})

// Step definition generation scenario
registerGiven('I have a feature file with parameterized steps', function(featureContent) {
  testContext.featureContent = featureContent
  expect(testContext.featureContent).toContain('I have a user named "John" with ID 123')
})

registerWhen('I generate step definitions from the feature', function() {
  testContext.generatedSteps = testContext.bridge.generateStepDefinitions(testContext.featureContent)
})

registerThen('I should get properly formatted step definitions', function() {
  expect(testContext.generatedSteps).toContain('Given(')
  expect(testContext.generatedSteps).toContain('When(')
  expect(testContext.generatedSteps).toContain('Then(')
  expect(testContext.generatedSteps).toContain('async function')
})

registerThen('the parameters should be correctly extracted', function() {
  expect(testContext.generatedSteps).toContain('{string}') // for "John"
  expect(testContext.generatedSteps).toContain('{int}') // for 123
  expect(testContext.generatedSteps).toContain('{float}') // for 85.5
})

registerThen('the function names should be generated properly', function() {
  expect(testContext.generatedSteps).toContain('i_have_a_user_named_john_with_id')
  expect(testContext.generatedSteps).toContain('i_update_the_users_score_to')
  expect(testContext.generatedSteps).toContain('i_should_see')
})

// Performance tracking scenario
registerGiven('I have performance tracking enabled', function() {
  testContext.bridge = new VitestCucumberBridge({
    performanceTracking: true
  })
  
  testContext.bridge.initializePerformanceTracking()
})

registerWhen('I mount a component and perform operations', async function() {
  // Mount component
  testContext.wrapper = await testContext.bridge.mountComponent({
    component: TestComponent,
    props: { title: 'Performance Test' }
  })
  
  testContext.bridge.trackMemory('after_mount')
  
  // Perform operations
  const button = testContext.wrapper.find('[data-testid="increment-btn"]')
  for (let i = 0; i < 10; i++) {
    await button.trigger('click')
  }
  
  testContext.bridge.trackMemory('after_operations')
  testContext.performanceMetrics = testContext.bridge.getPerformanceMetrics()
})

registerThen('memory usage should be tracked', function() {
  expect(testContext.performanceMetrics.memoryUsage).toBeDefined()
  expect(testContext.performanceMetrics.memoryUsage.length).toBeGreaterThan(0)
  
  const afterMount = testContext.performanceMetrics.memoryUsage.find(m => m.label === 'after_mount')
  const afterOps = testContext.performanceMetrics.memoryUsage.find(m => m.label === 'after_operations')
  
  expect(afterMount).toBeDefined()
  expect(afterOps).toBeDefined()
})

registerThen('render times should be recorded', function() {
  expect(testContext.performanceMetrics.renderTimes).toBeDefined()
  expect(testContext.performanceMetrics.renderTimes.length).toBeGreaterThan(0)
  expect(testContext.performanceMetrics.renderTimes[0]).toBeGreaterThan(0)
})

registerThen('I should be able to retrieve performance metrics', function() {
  expect(testContext.performanceMetrics.totalTime).toBeGreaterThan(0)
  expect(testContext.performanceMetrics.currentMemory).toBeGreaterThanOrEqual(0)
  expect(testContext.performanceMetrics.memoryDiff).toBeDefined()
})

// BDD context state management scenario
registerGiven('I have the BDD context initialized', function() {
  const context = getBDDContext()
  expect(context).toBeDefined()
  expect(context.state).toBeDefined()
})

registerWhen('I set state values in the context', function() {
  setBDDState('testKey1', 'testValue1')
  setBDDState('testKey2', { nested: 'object', count: 42 })
  setBDDState('testKey3', [1, 2, 3])
})

registerWhen('I retrieve the state values', function() {
  testContext.retrievedValues = {
    value1: getBDDState('testKey1'),
    value2: getBDDState('testKey2'), 
    value3: getBDDState('testKey3')
  }
})

registerThen('the values should be correctly stored and retrieved', function() {
  expect(testContext.retrievedValues.value1).toBe('testValue1')
  expect(testContext.retrievedValues.value2).toEqual({ nested: 'object', count: 42 })
  expect(testContext.retrievedValues.value3).toEqual([1, 2, 3])
})

registerThen('the state should persist across step executions', function() {
  // Values set in previous step should still be available
  expect(getBDDState('testKey1')).toBe('testValue1')
  expect(getBDDState('testKey2').count).toBe(42)
  expect(getBDDState('testKey3')).toHaveLength(3)
})

// Error handling scenario  
registerGiven('I have an invalid step definition', function() {
  testContext.invalidStepType = 'INVALID_TYPE'
  testContext.stepPattern = 'test pattern'
  testContext.stepHandler = function() {}
})

registerWhen('I try to register the step', function() {
  try {
    testContext.bridge.registerStep(
      testContext.invalidStepType, 
      testContext.stepPattern,
      testContext.stepHandler
    )
  } catch (error) {
    testContext.error = error
  }
})

registerThen('an appropriate error should be thrown', function() {
  expect(testContext.error).toBeInstanceOf(Error)
})

registerThen('the error message should be descriptive', function() {
  expect(testContext.error.message).toContain('Invalid step type')
  expect(testContext.error.message).toContain('INVALID_TYPE')
})

// Cleanup scenario
registerGiven('I have components mounted in the BDD context', async function() {
  testContext.wrapper = await testContext.bridge.mountComponent({
    component: TestComponent
  })
  
  expect(getBDDContext().wrapper).toBe(testContext.wrapper)
})

registerGiven('I have state stored in the context', function() {
  setBDDState('cleanupTestKey', 'cleanupTestValue')
  expect(getBDDState('cleanupTestKey')).toBe('cleanupTestValue')
})

registerWhen('I call the cleanup function', function() {
  testContext.bridge.cleanup()
})

registerThen('all components should be unmounted', function() {
  expect(getBDDContext().wrapper).toBeNull()
  expect(testContext.wrapper.unmount).toHaveBeenCalled()
})

registerThen('the context state should be cleared', function() {
  expect(getBDDContext().state).toEqual({})
  expect(getBDDContext().mocks).toEqual({})
  expect(getBDDContext().performance).toEqual({})
})

registerThen('no memory leaks should occur', function() {
  // Verify cleanup actually happened
  expect(Object.keys(getBDDContext().state)).toHaveLength(0)
})

// Parameter extraction scenario outline
registerGiven('I have a step text with parameter: {string}', function(stepText) {
  testContext.currentStepText = stepText
})

registerWhen('I parameterize the step', function() {
  testContext.parameterized = testContext.bridge.parameterizeStep(testContext.currentStepText)
  testContext.extractedParams = testContext.bridge.extractParameters(testContext.parameterized)
})

registerThen('I should get the parameterized version: {string}', function(expectedParameterized) {
  expect(testContext.parameterized).toBe(expectedParameterized)
})

registerThen('I should extract parameters: {string}', function(expectedParams) {
  const expected = expectedParams.split(',').map(p => p.trim())
  expect(testContext.extractedParams).toEqual(expected)
})

// Complex validation scenario
registerGiven('I have a complex feature with multiple scenarios', function(featureContent) {
  testContext.complexFeature = featureContent
  expect(testContext.complexFeature).toContain('Background:')
  expect(testContext.complexFeature).toContain('Scenario: Add items to cart')
  expect(testContext.complexFeature).toContain('Scenario: Apply discount')
})

registerWhen('I validate the entire feature', function() {
  testContext.complexValidation = testContext.bridge.validateFeatureSteps(testContext.complexFeature)
})

registerThen('I should get validation results for all scenarios', function() {
  expect(testContext.complexValidation.totalSteps).toBeGreaterThan(10)
  expect(testContext.complexValidation.missing.length).toBeGreaterThan(0)
})

registerThen('missing steps should be identified across all scenarios', function() {
  const missingStepTexts = testContext.complexValidation.missing.map(step => step.text)
  
  // Should include background steps
  expect(missingStepTexts).toContain(expect.stringContaining('logged in as'))
  
  // Should include scenario-specific steps
  expect(missingStepTexts).toContain(expect.stringContaining('add'))
  expect(missingStepTexts).toContain(expect.stringContaining('apply'))
})

registerThen('background steps should be validated properly', function() {
  const backgroundSteps = testContext.complexValidation.missing.filter(step => 
    step.text.includes('logged in') || step.text.includes('empty shopping cart')
  )
  
  expect(backgroundSteps.length).toBeGreaterThan(0)
})

// Performance regression scenario
registerGiven('I have baseline performance metrics', function() {
  testContext.bridge.initializePerformanceTracking()
  
  // Establish baseline
  testContext.baselineMetrics = []
  for (let i = 0; i < 5; i++) {
    const start = performance.now()
    // Simulate work
    for (let j = 0; j < 1000; j++) {
      Math.random()
    }
    testContext.baselineMetrics.push(performance.now() - start)
  }
})

registerWhen('I run the same operations multiple times', function() {
  testContext.currentMetrics = []
  
  for (let i = 0; i < 10; i++) {
    const start = performance.now()
    // Same simulated work
    for (let j = 0; j < 1000; j++) {
      Math.random() 
    }
    testContext.currentMetrics.push(performance.now() - start)
    
    testContext.bridge.trackMemory(`operation_${i}`)
  }
})

registerThen('the performance should remain within acceptable limits', function() {
  const baselineAvg = testContext.baselineMetrics.reduce((a, b) => a + b, 0) / testContext.baselineMetrics.length
  const currentAvg = testContext.currentMetrics.reduce((a, b) => a + b, 0) / testContext.currentMetrics.length
  
  // Performance should not degrade by more than 50%
  expect(currentAvg).toBeLessThan(baselineAvg * 1.5)
})

registerThen('memory usage should not increase significantly', function() {
  const metrics = testContext.bridge.getPerformanceMetrics()
  const memoryReadings = metrics.memoryUsage
  
  if (memoryReadings.length > 1) {
    const firstReading = memoryReadings[0].usage
    const lastReading = memoryReadings[memoryReadings.length - 1].usage
    const memoryIncrease = lastReading - firstReading
    
    // Memory should not increase by more than 10MB
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
  }
})

registerThen('render times should be consistent', function() {
  const renderTimes = testContext.bridge.getPerformanceMetrics().renderTimes
  
  if (renderTimes.length > 1) {
    const max = Math.max(...renderTimes)
    const min = Math.min(...renderTimes)
    const variation = max - min
    
    // Variation should be reasonable (less than 50ms)
    expect(variation).toBeLessThan(50)
  }
})

// Cross-environment compatibility
registerGiven('I am running in different JavaScript environments', function() {
  // Test different environment conditions
  testContext.environments = [
    { name: 'with_performance', hasPerformance: true, hasMemory: true },
    { name: 'no_memory', hasPerformance: true, hasMemory: false },
    { name: 'no_performance', hasPerformance: false, hasMemory: false }
  ]
})

registerWhen('I use the BDD bridge functionality', function() {
  testContext.environmentResults = {}
  
  for (const env of testContext.environments) {
    // Mock environment
    const originalPerformance = global.performance
    
    if (!env.hasPerformance) {
      delete global.performance
    } else if (!env.hasMemory) {
      global.performance = { now: () => Date.now() }
    }
    
    try {
      const bridge = new VitestCucumberBridge({ performanceTracking: true })
      bridge.initializePerformanceTracking()
      bridge.trackMemory('env_test')
      
      testContext.environmentResults[env.name] = {
        success: true,
        metrics: bridge.getPerformanceMetrics()
      }
    } catch (error) {
      testContext.environmentResults[env.name] = {
        success: false,
        error: error.message
      }
    }
    
    // Restore
    global.performance = originalPerformance
  }
})

registerThen('it should work regardless of environment differences', function() {
  for (const envName in testContext.environmentResults) {
    const result = testContext.environmentResults[envName]
    expect(result.success).toBe(true)
  }
})

registerThen('fallbacks should be used when APIs are unavailable', function() {
  const noMemoryResult = testContext.environmentResults.no_memory
  const noPerformanceResult = testContext.environmentResults.no_performance
  
  expect(noMemoryResult.success).toBe(true)
  expect(noMemoryResult.metrics.currentMemory).toBe(0)
  
  expect(noPerformanceResult.success).toBe(true)
  expect(noPerformanceResult.metrics.totalTime).toBeGreaterThanOrEqual(0)
})