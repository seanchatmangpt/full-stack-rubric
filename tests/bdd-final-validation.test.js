/**
 * @fileoverview Final BDD Validation Test Suite
 * @description Comprehensive validation of all BDD features and step definitions
 */

import { describe, it, expect, beforeAll, vi } from 'vitest'
import { BDDValidationRunner, runBDDValidation, createBDDValidationRunner } from './framework/BDDValidationRunner.js'
import fs from 'fs'

describe('BDD Final Validation Suite', () => {
  let validationRunner
  let validationResults

  beforeAll(async () => {
    // Mock console to reduce test noise
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    
    validationRunner = createBDDValidationRunner()
    validationResults = await runBDDValidation()
  })

  describe('BDD Framework Integration', () => {
    it('should create validation runner successfully', () => {
      expect(validationRunner).toBeInstanceOf(BDDValidationRunner)
      expect(validationRunner.featuresDir).toBeDefined()
      expect(validationRunner.stepsDir).toBeDefined()
    })

    it('should run complete validation successfully', () => {
      expect(validationResults).toBeDefined()
      expect(validationResults.success).toBe(true)
      expect(validationResults.validation).toBeDefined()
      expect(validationResults.report).toBeDefined()
    })

    it('should have required validation methods', () => {
      expect(typeof validationRunner.discoverFeatures).toBe('function')
      expect(typeof validationRunner.discoverStepDefinitions).toBe('function')
      expect(typeof validationRunner.validateStepCoverage).toBe('function')
      expect(typeof validationRunner.generateReport).toBe('function')
      expect(typeof validationRunner.runSampleScenarios).toBe('function')
    })
  })

  describe('Feature Discovery and Validation', () => {
    it('should discover all feature files', async () => {
      const features = await validationRunner.discoverFeatures()
      
      expect(Array.isArray(features)).toBe(true)
      expect(features.length).toBeGreaterThanOrEqual(2) // At least typing-tutor and performance
      
      features.forEach(feature => {
        expect(feature).toHaveProperty('path')
        expect(feature).toHaveProperty('name')
        expect(feature).toHaveProperty('content')
        expect(feature).toHaveProperty('scenarios')
        expect(Array.isArray(feature.scenarios)).toBe(true)
      })
    })

    it('should parse feature files into scenarios', async () => {
      const features = await validationRunner.discoverFeatures()
      let totalScenarios = 0
      let totalSteps = 0

      features.forEach(feature => {
        totalScenarios += feature.scenarios.length
        feature.scenarios.forEach(scenario => {
          totalSteps += scenario.steps.length
          expect(scenario).toHaveProperty('name')
          expect(scenario).toHaveProperty('type')
          expect(scenario).toHaveProperty('steps')
        })
      })

      expect(totalScenarios).toBeGreaterThan(0)
      expect(totalSteps).toBeGreaterThan(0)
    })

    it('should validate feature file accessibility', async () => {
      const features = await validationRunner.discoverFeatures()
      
      features.forEach(feature => {
        expect(fs.existsSync(feature.path)).toBe(true)
        expect(feature.content.length).toBeGreaterThan(0)
      })
    })

    it('should identify different scenario types', async () => {
      const features = await validationRunner.discoverFeatures()
      const scenarioTypes = new Set()
      
      features.forEach(feature => {
        feature.scenarios.forEach(scenario => {
          scenarioTypes.add(scenario.type)
        })
      })

      expect(scenarioTypes.size).toBeGreaterThan(0)
    })
  })

  describe('Step Definition Discovery and Validation', () => {
    it('should discover all step definition files', async () => {
      const stepDefinitions = await validationRunner.discoverStepDefinitions()
      
      expect(Array.isArray(stepDefinitions)).toBe(true)
      expect(stepDefinitions.length).toBeGreaterThan(0)
      
      stepDefinitions.forEach(stepDef => {
        expect(stepDef).toHaveProperty('pattern')
        expect(stepDef).toHaveProperty('type')
        expect(stepDef).toHaveProperty('file')
        expect(stepDef).toHaveProperty('line')
        expect(['Given', 'When', 'Then']).toContain(stepDef.type)
      })
    })

    it('should categorize step definitions by type', async () => {
      const stepDefinitions = await validationRunner.discoverStepDefinitions()
      const stepTypes = { Given: 0, When: 0, Then: 0 }

      stepDefinitions.forEach(stepDef => {
        stepTypes[stepDef.type]++
      })

      expect(stepTypes.Given).toBeGreaterThan(0)
      expect(stepTypes.When).toBeGreaterThan(0)
      expect(stepTypes.Then).toBeGreaterThan(0)
    })

    it('should validate step definition file accessibility', async () => {
      const stepDefinitions = await validationRunner.discoverStepDefinitions()
      const stepFiles = [...new Set(stepDefinitions.map(sd => sd.file))]
      
      stepFiles.forEach(file => {
        expect(fs.existsSync(file)).toBe(true)
      })
    })

    it('should handle parameterized step definitions', async () => {
      const stepDefinitions = await validationRunner.discoverStepDefinitions()
      const parameterizedSteps = stepDefinitions.filter(step => 
        step.pattern.includes('{int}') || 
        step.pattern.includes('{string}') || 
        step.pattern.includes('{float}') ||
        step.pattern.includes('{word}')
      )

      expect(parameterizedSteps.length).toBeGreaterThan(0)
    })
  })

  describe('Step Coverage Analysis', () => {
    it('should validate step definition coverage', async () => {
      const validation = await validationRunner.validateStepCoverage()
      
      expect(validation).toHaveProperty('features')
      expect(validation).toHaveProperty('stepDefinitions')
      expect(validation).toHaveProperty('missingSteps')
      expect(validation).toHaveProperty('coverage')
      expect(validation).toHaveProperty('totalSteps')
      expect(validation).toHaveProperty('coveredSteps')
      
      expect(validation.coverage).toBeGreaterThanOrEqual(0)
      expect(validation.coverage).toBeLessThanOrEqual(100)
      expect(validation.totalSteps).toBeGreaterThan(0)
      expect(validation.coveredSteps).toBeGreaterThanOrEqual(0)
    })

    it('should calculate coverage percentage correctly', async () => {
      const validation = await validationRunner.validateStepCoverage()
      
      const expectedCoverage = validation.totalSteps > 0 
        ? Math.round((validation.coveredSteps / validation.totalSteps) * 100)
        : 100
      
      expect(validation.coverage).toBe(expectedCoverage)
    })

    it('should identify missing step definitions if any', async () => {
      const validation = await validationRunner.validateStepCoverage()
      
      expect(Array.isArray(validation.missingSteps)).toBe(true)
      
      if (validation.missingSteps.length > 0) {
        validation.missingSteps.forEach(step => {
          expect(typeof step).toBe('string')
          expect(step.length).toBeGreaterThan(0)
        })
      }
    })
  })

  describe('Sample Scenario Execution', () => {
    it('should execute sample scenarios', async () => {
      const testResults = await validationRunner.runSampleScenarios()
      
      expect(Array.isArray(testResults)).toBe(true)
      expect(testResults.length).toBeGreaterThan(0)
      
      testResults.forEach(result => {
        expect(result).toHaveProperty('feature')
        expect(result).toHaveProperty('scenario')
        expect(result).toHaveProperty('status')
        expect(result).toHaveProperty('duration')
        expect(result).toHaveProperty('steps')
        expect(Array.isArray(result.steps)).toBe(true)
      })
    })

    it('should track individual step execution', async () => {
      const testResults = await validationRunner.runSampleScenarios()
      let totalSteps = 0
      let passedSteps = 0
      let pendingSteps = 0
      
      testResults.forEach(result => {
        result.steps.forEach(step => {
          totalSteps++
          if (step.status === 'passed') passedSteps++
          if (step.status === 'pending') pendingSteps++
          
          expect(step).toHaveProperty('step')
          expect(step).toHaveProperty('status')
          expect(step).toHaveProperty('duration')
          expect(['passed', 'pending', 'failed']).toContain(step.status)
        })
      })

      expect(totalSteps).toBeGreaterThan(0)
      expect(passedSteps + pendingSteps).toBe(totalSteps)
    })

    it('should measure execution performance', async () => {
      const testResults = await validationRunner.runSampleScenarios()
      
      testResults.forEach(result => {
        expect(result.duration).toBeGreaterThan(0)
        expect(result.duration).toBeLessThan(1000) // Reasonable duration
        
        result.steps.forEach(step => {
          expect(step.duration).toBeGreaterThan(0)
          expect(step.duration).toBeLessThan(100) // Reasonable step duration
        })
      })
    })
  })

  describe('Comprehensive Reporting', () => {
    it('should generate complete validation report', async () => {
      const report = await validationRunner.generateReport()
      
      expect(report).toHaveProperty('timestamp')
      expect(report).toHaveProperty('summary')
      expect(report).toHaveProperty('features')
      expect(report).toHaveProperty('stepDefinitions')
      expect(report).toHaveProperty('missingSteps')
      expect(report).toHaveProperty('recommendations')
      
      // Validate summary
      const summary = report.summary
      expect(summary.totalFeatures).toBeGreaterThan(0)
      expect(summary.totalScenarios).toBeGreaterThan(0)
      expect(summary.totalSteps).toBeGreaterThan(0)
      expect(summary.totalStepDefinitions).toBeGreaterThan(0)
      expect(summary.stepCoverage).toBeGreaterThanOrEqual(0)
      expect(summary.stepCoverage).toBeLessThanOrEqual(100)
      expect(summary.missingStepsCount).toBeGreaterThanOrEqual(0)
    })

    it('should provide actionable recommendations', async () => {
      const report = await validationRunner.generateReport()
      
      expect(Array.isArray(report.recommendations)).toBe(true)
      
      report.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string')
        expect(recommendation.length).toBeGreaterThan(10)
      })
    })

    it('should include detailed feature information', async () => {
      const report = await validationRunner.generateReport()
      
      expect(Array.isArray(report.features)).toBe(true)
      report.features.forEach(feature => {
        expect(feature).toHaveProperty('name')
        expect(feature).toHaveProperty('path')
        expect(feature).toHaveProperty('scenarioCount')
        expect(feature).toHaveProperty('scenarios')
        expect(feature.scenarioCount).toBe(feature.scenarios.length)
      })
    })

    it('should include step definition details', async () => {
      const report = await validationRunner.generateReport()
      
      expect(Array.isArray(report.stepDefinitions)).toBe(true)
      report.stepDefinitions.forEach(stepDef => {
        expect(stepDef).toHaveProperty('pattern')
        expect(stepDef).toHaveProperty('type')
        expect(stepDef).toHaveProperty('file')
        expect(stepDef).toHaveProperty('line')
      })
    })
  })

  describe('Quality Assurance Metrics', () => {
    it('should meet minimum coverage thresholds', async () => {
      const validation = await validationRunner.validateStepCoverage()
      
      // Minimum quality thresholds
      expect(validation.features.length).toBeGreaterThanOrEqual(2)
      expect(validation.totalSteps).toBeGreaterThanOrEqual(10)
      expect(validation.stepDefinitions.length).toBeGreaterThanOrEqual(5)
      
      // Coverage should be reasonable (allowing for missing steps during development)
      expect(validation.coverage).toBeGreaterThanOrEqual(50)
    })

    it('should validate comprehensive test scenarios', async () => {
      const features = await validationRunner.discoverFeatures()
      let totalScenarios = 0
      
      features.forEach(feature => {
        totalScenarios += feature.scenarios.length
        expect(feature.scenarios.length).toBeGreaterThan(0)
      })

      expect(totalScenarios).toBeGreaterThanOrEqual(5) // Minimum scenarios
    })

    it('should ensure step definition quality', async () => {
      const stepDefinitions = await validationRunner.discoverStepDefinitions()
      
      stepDefinitions.forEach(stepDef => {
        // Pattern should not be empty
        expect(stepDef.pattern.length).toBeGreaterThan(0)
        
        // Should have valid line number
        expect(stepDef.line).toBeGreaterThan(0)
        
        // File path should exist
        expect(fs.existsSync(stepDef.file)).toBe(true)
      })
    })
  })

  describe('Step Pattern Matching', () => {
    it('should normalize steps correctly', () => {
      const steps = [
        'Given I am on the home page',
        'When I click the login button', 
        'Then I should see the dashboard',
        'And I should see my profile',
        'But I should not see errors'
      ]

      const normalizedSteps = steps.map(step => validationRunner.normalizeStep(step))
      
      expect(normalizedSteps).toEqual([
        'I am on the home page',
        'I click the login button',
        'I should see the dashboard', 
        'I should see my profile',
        'I should not see errors'
      ])
    })

    it('should match basic step patterns', () => {
      // Mock some step definitions for testing
      validationRunner.stepDefinitions = [
        { pattern: 'I am on the typing tutor page', type: 'Given' },
        { pattern: 'I start typing the displayed text', type: 'When' },
        { pattern: 'the application should remain responsive', type: 'Then' }
      ]

      expect(validationRunner.hasStepDefinition('I am on the typing tutor page')).toBe(true)
      expect(validationRunner.hasStepDefinition('I start typing the displayed text')).toBe(true)
      expect(validationRunner.hasStepDefinition('the application should remain responsive')).toBe(true)
      expect(validationRunner.hasStepDefinition('I do something undefined')).toBe(false)
    })

    it('should handle parameterized patterns', () => {
      validationRunner.stepDefinitions = [
        { pattern: 'I type {string} in exactly {int} seconds', type: 'When' },
        { pattern: 'the WPM should be calculated as {int}', type: 'Then' },
        { pattern: 'the accuracy should be approximately {float}%', type: 'Then' }
      ]

      expect(validationRunner.hasStepDefinition('I type "Hello" in exactly 60 seconds')).toBe(true)
      expect(validationRunner.hasStepDefinition('the WPM should be calculated as 42')).toBe(true)
      expect(validationRunner.hasStepDefinition('the accuracy should be approximately 95.5%')).toBe(true)
    })
  })

  describe('Integration Test Results', () => {
    it('should provide complete validation results', () => {
      expect(validationResults.success).toBe(true)
      expect(validationResults.validation).toBeDefined()
      expect(validationResults.report).toBeDefined()
      expect(validationResults.error).toBeUndefined()
    })

    it('should include test execution results', () => {
      if (validationResults.validation.testResults) {
        expect(Array.isArray(validationResults.validation.testResults)).toBe(true)
        expect(validationResults.validation.testResults.length).toBeGreaterThan(0)
      }
    })

    it('should demonstrate BDD framework readiness', () => {
      const report = validationResults.report
      
      // Framework should be operational
      expect(report.summary.totalFeatures).toBeGreaterThan(0)
      expect(report.summary.totalStepDefinitions).toBeGreaterThan(0)
      
      // Should have reasonable coverage
      expect(report.summary.stepCoverage).toBeGreaterThanOrEqual(50)
      
      // Should provide actionable feedback
      expect(Array.isArray(report.recommendations)).toBe(true)
    })
  })
})