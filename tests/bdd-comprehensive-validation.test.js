/**
 * @fileoverview Comprehensive BDD validation test suite
 * @description Validates all 25 BDD features using nuxt-bdd-testing framework
 * Tests feature discovery, step definition coverage, scenario execution, and reporting
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { BDDTestRunner, createBDDTestRunner, runBDDValidation } from './framework/BDDTestRunner.js'
import fs from 'fs'
import path from 'path'

describe('BDD Comprehensive Validation Suite', () => {
  let testRunner
  let validationResults

  beforeAll(async () => {
    console.log('🚀 Starting comprehensive BDD validation...')
    testRunner = createBDDTestRunner()
    validationResults = await runBDDValidation()
  })

  afterAll(() => {
    console.log('✅ BDD validation suite completed')
  })

  describe('Feature Discovery', () => {
    it('should discover all BDD feature files', async () => {
      const features = await testRunner.discoverFeatures()
      
      expect(features).toBeDefined()
      expect(Array.isArray(features)).toBe(true)
      expect(features.length).toBeGreaterThan(0)
      
      console.log(`📊 Discovered ${features.length} feature files`)
      
      // Validate each feature has required properties
      features.forEach(feature => {
        expect(feature).toHaveProperty('path')
        expect(feature).toHaveProperty('name')
        expect(feature).toHaveProperty('content')
        expect(feature).toHaveProperty('scenarios')
        expect(Array.isArray(feature.scenarios)).toBe(true)
      })
    })

    it('should parse feature files into scenarios and steps', async () => {
      const features = await testRunner.discoverFeatures()
      let totalScenarios = 0
      let totalSteps = 0

      features.forEach(feature => {
        totalScenarios += feature.scenarios.length
        feature.scenarios.forEach(scenario => {
          totalSteps += scenario.steps.length
          
          // Validate scenario structure
          expect(scenario).toHaveProperty('name')
          expect(scenario).toHaveProperty('steps')
          expect(scenario).toHaveProperty('type')
          expect(Array.isArray(scenario.steps)).toBe(true)
        })
      })

      expect(totalScenarios).toBeGreaterThan(0)
      expect(totalSteps).toBeGreaterThan(0)
      
      console.log(`📊 Parsed ${totalScenarios} scenarios with ${totalSteps} total steps`)
    })

    it('should identify different scenario types', async () => {
      const features = await testRunner.discoverFeatures()
      const scenarioTypes = new Set()
      
      features.forEach(feature => {
        feature.scenarios.forEach(scenario => {
          scenarioTypes.add(scenario.type)
        })
      })

      expect(scenarioTypes.size).toBeGreaterThan(0)
      console.log(`📊 Found scenario types: ${Array.from(scenarioTypes).join(', ')}`)
    })
  })

  describe('Step Definition Discovery', () => {
    it('should discover all step definition files', async () => {
      const stepDefinitions = await testRunner.discoverStepDefinitions()
      
      expect(stepDefinitions).toBeDefined()
      expect(Array.isArray(stepDefinitions)).toBe(true)
      expect(stepDefinitions.length).toBeGreaterThan(0)
      
      console.log(`📊 Discovered ${stepDefinitions.length} step definitions`)
      
      // Validate step definition structure
      stepDefinitions.forEach(stepDef => {
        expect(stepDef).toHaveProperty('pattern')
        expect(stepDef).toHaveProperty('type')
        expect(stepDef).toHaveProperty('file')
        expect(stepDef).toHaveProperty('line')
        expect(['Given', 'When', 'Then']).toContain(stepDef.type)
      })
    })

    it('should categorize step definitions by type', async () => {
      const stepDefinitions = await testRunner.discoverStepDefinitions()
      const stepTypes = {
        Given: 0,
        When: 0,
        Then: 0
      }

      stepDefinitions.forEach(stepDef => {
        stepTypes[stepDef.type]++
      })

      expect(stepTypes.Given).toBeGreaterThan(0)
      expect(stepTypes.When).toBeGreaterThan(0)
      expect(stepTypes.Then).toBeGreaterThan(0)
      
      console.log(`📊 Step types: Given(${stepTypes.Given}), When(${stepTypes.When}), Then(${stepTypes.Then})`)
    })

    it('should handle parameterized step definitions', async () => {
      const stepDefinitions = await testRunner.discoverStepDefinitions()
      const parameterizedSteps = stepDefinitions.filter(step => 
        step.pattern.includes('{int}') || 
        step.pattern.includes('{string}') || 
        step.pattern.includes('{float}') ||
        step.pattern.includes('{word}')
      )

      expect(parameterizedSteps.length).toBeGreaterThan(0)
      console.log(`📊 Found ${parameterizedSteps.length} parameterized step definitions`)
    })
  })

  describe('Step Coverage Validation', () => {
    it('should validate step definition coverage', async () => {
      const validation = await testRunner.validateStepCoverage()
      
      expect(validation).toHaveProperty('features')
      expect(validation).toHaveProperty('stepDefinitions')
      expect(validation).toHaveProperty('missingSteps')
      expect(validation).toHaveProperty('coverage')
      
      expect(validation.coverage).toBeGreaterThanOrEqual(0)
      expect(validation.coverage).toBeLessThanOrEqual(100)
      
      console.log(`📊 Step coverage: ${validation.coverage}%`)
      
      if (validation.missingSteps.length > 0) {
        console.log(`⚠️  ${validation.missingSteps.length} missing step definitions`)
        validation.missingSteps.slice(0, 5).forEach(step => {
          console.log(`   - ${step}`)
        })
      }
    })

    it('should identify missing step definitions', async () => {
      const validation = await testRunner.validateStepCoverage()
      
      if (validation.missingSteps.length > 0) {
        // Validate missing steps are properly identified
        validation.missingSteps.forEach(step => {
          expect(typeof step).toBe('string')
          expect(step.length).toBeGreaterThan(0)
        })
        
        console.log(`⚠️  Identified ${validation.missingSteps.length} missing step definitions`)
      } else {
        console.log('✅ All steps have matching definitions!')
      }
    })

    it('should calculate coverage percentage accurately', async () => {
      const validation = await testRunner.validateStepCoverage()
      const totalSteps = validation.features.reduce((sum, feature) => 
        sum + feature.scenarios.reduce((s, scenario) => s + scenario.steps.length, 0), 0
      )
      
      expect(totalSteps).toBeGreaterThan(0)
      
      // Coverage should be calculated correctly
      const expectedCoverage = Math.round(
        ((totalSteps - validation.missingSteps.length) / totalSteps) * 100
      )
      
      // Allow for some variance in calculation due to step normalization
      expect(Math.abs(validation.coverage - expectedCoverage)).toBeLessThanOrEqual(5)
    })
  })

  describe('Sample Scenario Execution', () => {
    it('should execute sample scenarios successfully', async () => {
      const testResults = await testRunner.runSampleScenarios()
      
      expect(Array.isArray(testResults)).toBe(true)
      expect(testResults.length).toBeGreaterThan(0)
      
      console.log(`📊 Executed ${testResults.length} sample scenarios`)
      
      // Validate test result structure
      testResults.forEach(result => {
        expect(result).toHaveProperty('feature')
        expect(result).toHaveProperty('scenario')
        expect(result).toHaveProperty('status')
        expect(result).toHaveProperty('duration')
        expect(result).toHaveProperty('steps')
        expect(Array.isArray(result.steps)).toBe(true)
      })
    })

    it('should track step execution status', async () => {
      const testResults = await testRunner.runSampleScenarios()
      let passedSteps = 0
      let pendingSteps = 0
      
      testResults.forEach(result => {
        result.steps.forEach(step => {
          if (step.status === 'passed') passedSteps++
          if (step.status === 'pending') pendingSteps++
        })
      })

      console.log(`📊 Step execution: ${passedSteps} passed, ${pendingSteps} pending`)
      expect(passedSteps + pendingSteps).toBeGreaterThan(0)
    })

    it('should measure execution performance', async () => {
      const testResults = await testRunner.runSampleScenarios()
      const totalDuration = testResults.reduce((sum, result) => sum + result.duration, 0)
      const averageDuration = totalDuration / testResults.length
      
      expect(totalDuration).toBeGreaterThan(0)
      expect(averageDuration).toBeGreaterThan(0)
      
      console.log(`📊 Average scenario duration: ${averageDuration.toFixed(2)}ms`)
    })
  })

  describe('Comprehensive Report Generation', () => {
    it('should generate a complete validation report', async () => {
      const report = await testRunner.generateReport()
      
      expect(report).toHaveProperty('timestamp')
      expect(report).toHaveProperty('summary')
      expect(report).toHaveProperty('features')
      expect(report).toHaveProperty('stepDefinitions')
      expect(report).toHaveProperty('missingSteps')
      expect(report).toHaveProperty('recommendations')
      
      // Validate summary statistics
      expect(report.summary.totalFeatures).toBeGreaterThan(0)
      expect(report.summary.totalScenarios).toBeGreaterThan(0)
      expect(report.summary.totalSteps).toBeGreaterThan(0)
      expect(report.summary.totalStepDefinitions).toBeGreaterThan(0)
      
      console.log('📊 Report Summary:')
      console.log(`   Features: ${report.summary.totalFeatures}`)
      console.log(`   Scenarios: ${report.summary.totalScenarios}`)
      console.log(`   Steps: ${report.summary.totalSteps}`)
      console.log(`   Step Definitions: ${report.summary.totalStepDefinitions}`)
      console.log(`   Coverage: ${report.summary.stepCoverage}%`)
    })

    it('should provide actionable recommendations', async () => {
      const report = await testRunner.generateReport()
      
      expect(Array.isArray(report.recommendations)).toBe(true)
      
      if (report.recommendations.length > 0) {
        console.log('💡 Recommendations:')
        report.recommendations.forEach(rec => {
          console.log(`   - ${rec}`)
          expect(typeof rec).toBe('string')
          expect(rec.length).toBeGreaterThan(10)
        })
      }
    })

    it('should include detailed feature information', async () => {
      const report = await testRunner.generateReport()
      
      expect(Array.isArray(report.features)).toBe(true)
      report.features.forEach(feature => {
        expect(feature).toHaveProperty('name')
        expect(feature).toHaveProperty('path')
        expect(feature).toHaveProperty('scenarioCount')
        expect(feature).toHaveProperty('scenarios')
        expect(feature.scenarioCount).toBe(feature.scenarios.length)
      })
    })
  })

  describe('Integration Validation', () => {
    it('should validate BDD framework integration', async () => {
      expect(validationResults).toBeDefined()
      expect(validationResults.success).toBe(true)
      expect(validationResults.validation).toBeDefined()
      expect(validationResults.report).toBeDefined()
      
      console.log('✅ BDD framework integration validated successfully')
    })

    it('should validate feature file accessibility', async () => {
      const features = await testRunner.discoverFeatures()
      
      // Ensure all feature files are accessible
      features.forEach(feature => {
        expect(fs.existsSync(feature.path)).toBe(true)
        expect(feature.content.length).toBeGreaterThan(0)
      })
      
      console.log('✅ All feature files are accessible')
    })

    it('should validate step definition file accessibility', async () => {
      const stepDefinitions = await testRunner.discoverStepDefinitions()
      const stepFiles = [...new Set(stepDefinitions.map(sd => sd.file))]
      
      // Ensure all step files are accessible
      stepFiles.forEach(file => {
        expect(fs.existsSync(file)).toBe(true)
      })
      
      console.log(`✅ All ${stepFiles.length} step definition files are accessible`)
    })
  })

  describe('Quality Metrics', () => {
    it('should meet minimum quality thresholds', async () => {
      const report = await testRunner.generateReport()
      
      // Quality thresholds
      expect(report.summary.totalFeatures).toBeGreaterThanOrEqual(2)
      expect(report.summary.totalScenarios).toBeGreaterThanOrEqual(5)
      expect(report.summary.totalSteps).toBeGreaterThanOrEqual(10)
      expect(report.summary.stepCoverage).toBeGreaterThanOrEqual(70) // Minimum 70% coverage
      
      console.log('✅ All quality thresholds met')
    })

    it('should validate comprehensive test coverage', async () => {
      const validation = await testRunner.validateStepCoverage()
      
      // Calculate coverage metrics
      const totalUniqueSteps = new Set()
      validation.features.forEach(feature => {
        feature.scenarios.forEach(scenario => {
          scenario.steps.forEach(step => {
            totalUniqueSteps.add(testRunner.normalizeStep(step))
          })
        })
      })

      const uniqueStepCount = totalUniqueSteps.size
      const coveredSteps = uniqueStepCount - validation.missingSteps.length
      const actualCoverage = Math.round((coveredSteps / uniqueStepCount) * 100)
      
      console.log(`📊 Unique steps: ${uniqueStepCount}, Covered: ${coveredSteps}, Coverage: ${actualCoverage}%`)
      
      expect(actualCoverage).toBeGreaterThanOrEqual(70)
    })
  })
})

describe('BDD Test Runner API', () => {
  let runner

  beforeAll(() => {
    runner = createBDDTestRunner()
  })

  describe('BDDTestRunner Class', () => {
    it('should create a test runner instance', () => {
      expect(runner).toBeInstanceOf(BDDTestRunner)
      expect(runner.featuresDir).toBeDefined()
      expect(runner.stepsDir).toBeDefined()
      expect(Array.isArray(runner.features)).toBe(true)
      expect(Array.isArray(runner.stepDefinitions)).toBe(true)
    })

    it('should have all required methods', () => {
      expect(typeof runner.discoverFeatures).toBe('function')
      expect(typeof runner.discoverStepDefinitions).toBe('function')
      expect(typeof runner.validateStepCoverage).toBe('function')
      expect(typeof runner.generateReport).toBe('function')
      expect(typeof runner.runSampleScenarios).toBe('function')
    })

    it('should normalize steps correctly', () => {
      const steps = [
        'Given I am on the home page',
        'When I click the login button',
        'Then I should see the dashboard',
        'And I should see my profile'
      ]

      const normalizedSteps = steps.map(step => runner.normalizeStep(step))
      
      expect(normalizedSteps).toEqual([
        'I am on the home page',
        'I click the login button',
        'I should see the dashboard',
        'I should see my profile'
      ])
    })

    it('should match step patterns correctly', () => {
      // Set up test step definitions
      runner.stepDefinitions = [
        { pattern: 'I am on the {string} page', type: 'Given' },
        { pattern: 'I click the {string} button', type: 'When' },
        { pattern: 'I should see {string}', type: 'Then' },
        { pattern: 'the count should be {int}', type: 'Then' }
      ]

      // Test pattern matching
      expect(runner.hasStepDefinition('I am on the "home" page')).toBe(true)
      expect(runner.hasStepDefinition('I click the "login" button')).toBe(true)
      expect(runner.hasStepDefinition('I should see "dashboard"')).toBe(true)
      expect(runner.hasStepDefinition('the count should be 42')).toBe(true)
      expect(runner.hasStepDefinition('I do something undefined')).toBe(false)
    })
  })
})