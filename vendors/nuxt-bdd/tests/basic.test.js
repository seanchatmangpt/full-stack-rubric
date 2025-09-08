/**
 * @fileoverview Basic tests for @nuxt/bdd package functionality
 */

import { describe, test, expect } from 'vitest'
import { 
  defineBDDConfig, 
  defaultConfig,
  generateTestData,
  delay,
  waitForCondition,
  validateScenario,
  STEP_TYPES,
  TEST_ENVIRONMENTS,
  TIMEOUTS
} from '../src/index.js'

describe('@nuxt/bdd Core Functionality', () => {
  test('defineBDDConfig merges configuration correctly', () => {
    const customConfig = {
      testDir: 'custom-tests',
      vitest: {
        environment: 'happy-dom'
      }
    }
    
    const config = defineBDDConfig(customConfig)
    
    expect(config.testDir).toBe('custom-tests')
    expect(config.stepDir).toBe(defaultConfig.stepDir) // Should use default
    expect(config.vitest.environment).toBe('happy-dom')
    expect(config.cucumber).toEqual(defaultConfig.cucumber)
  })
  
  test('defaultConfig has required structure', () => {
    expect(defaultConfig).toHaveProperty('testDir')
    expect(defaultConfig).toHaveProperty('stepDir')
    expect(defaultConfig).toHaveProperty('featureDir')
    expect(defaultConfig).toHaveProperty('autoImport')
    expect(defaultConfig).toHaveProperty('vitest')
    expect(defaultConfig).toHaveProperty('cucumber')
    
    expect(defaultConfig.vitest).toHaveProperty('environment')
    expect(defaultConfig.cucumber).toHaveProperty('features')
    expect(defaultConfig.cucumber).toHaveProperty('steps')
  })
})

describe('Utility Functions', () => {
  test('generateTestData creates unique data', () => {
    const email1 = generateTestData('email')
    const email2 = generateTestData('email')
    
    expect(email1).toMatch(/@example\.com$/)
    expect(email2).toMatch(/@example\.com$/)
    expect(email1).not.toBe(email2)
  })
  
  test('generateTestData handles different types', () => {
    expect(generateTestData('email')).toMatch(/@example\.com$/)
    expect(generateTestData('username')).toMatch(/^testuser\d+$/)
    expect(generateTestData('password')).toMatch(/^TestPass\d+!$/)
    expect(generateTestData('name')).toMatch(/^Test User \d+$/)
    expect(generateTestData('other')).toMatch(/^test-data-\d+$/)
  })
  
  test('delay waits for specified time', async () => {
    const start = Date.now()
    await delay(100)
    const end = Date.now()
    
    expect(end - start).toBeGreaterThanOrEqual(90) // Allow some tolerance
  })
  
  test('waitForCondition resolves when condition is met', async () => {
    let counter = 0
    const condition = () => {
      counter++
      return counter >= 3
    }
    
    await waitForCondition(condition, 1000, 10)
    expect(counter).toBeGreaterThanOrEqual(3)
  })
  
  test('waitForCondition throws on timeout', async () => {
    const condition = () => false
    
    await expect(
      waitForCondition(condition, 100, 10)
    ).rejects.toThrow('Condition not met within 100ms')
  })
  
  test('validateScenario accepts valid scenario', () => {
    const validScenario = {
      name: 'Test Scenario',
      steps: [
        { type: 'Given', text: 'I have a condition' },
        { type: 'When', text: 'I perform an action' },
        { type: 'Then', text: 'I should see a result' }
      ]
    }
    
    expect(() => validateScenario(validScenario)).not.toThrow()
  })
  
  test('validateScenario throws for invalid scenario', () => {
    expect(() => validateScenario({})).toThrow('BDD Scenario must have a name')
    
    expect(() => validateScenario({ name: 'Test' })).toThrow('BDD Scenario must have steps array')
    
    expect(() => validateScenario({ 
      name: 'Test', 
      steps: []
    })).toThrow('BDD Scenario must have at least one step')
    
    expect(() => validateScenario({
      name: 'Test',
      steps: [{ type: 'Invalid', text: 'test' }]
    })).toThrow('BDD Step 1 must have a valid type')
  })
})

describe('Constants', () => {
  test('STEP_TYPES contains all BDD step types', () => {
    expect(STEP_TYPES.GIVEN).toBe('Given')
    expect(STEP_TYPES.WHEN).toBe('When')
    expect(STEP_TYPES.THEN).toBe('Then')
    expect(STEP_TYPES.AND).toBe('And')
    expect(STEP_TYPES.BUT).toBe('But')
  })
  
  test('TEST_ENVIRONMENTS contains valid environments', () => {
    expect(TEST_ENVIRONMENTS.JSDOM).toBe('jsdom')
    expect(TEST_ENVIRONMENTS.HAPPY_DOM).toBe('happy-dom')
    expect(TEST_ENVIRONMENTS.NODE).toBe('node')
  })
  
  test('TIMEOUTS contains reasonable values', () => {
    expect(TIMEOUTS.SHORT).toBe(1000)
    expect(TIMEOUTS.MEDIUM).toBe(5000)
    expect(TIMEOUTS.LONG).toBe(10000)
    expect(TIMEOUTS.NETWORK).toBe(30000)
  })
})