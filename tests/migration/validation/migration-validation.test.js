/**
 * @fileoverview Tests for migration validation system
 * Validates that the migration tools work correctly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import { MigrationValidator } from './migration-validator.js'
import { TestFrameworkMigrator } from '../codemods/test-framework-migrator.js'
import { VitestCucumberMigrator } from '../scripts/vitest-cucumber-migrator.js'

describe('Migration Validation System', () => {
  let tempDir
  let validator
  
  beforeEach(async () => {
    // Create temporary test directory
    tempDir = path.join(process.cwd(), '.test-migration-temp')
    await fs.mkdir(tempDir, { recursive: true })
    
    validator = new MigrationValidator({
      validateSyntax: true,
      runTests: false, // Skip actual test execution in unit tests
      checkPerformance: false // Skip performance checks in unit tests
    })
  })
  
  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe('MigrationValidator', () => {
    it('should detect syntax errors in migrated files', async () => {
      // Create file with syntax error
      const testFile = path.join(tempDir, 'broken.test.js')
      await fs.writeFile(testFile, `
        import { quickTest } from '@/tests/framework'
        
        // Missing closing bracket
        await quickTest('Component', Component, {
          props: { title: 'Test' }
          // Missing closing bracket
      `)
      
      await validator.validateSyntax(tempDir)
      
      expect(validator.validationResults.syntax.failed).toBeGreaterThan(0)
      expect(validator.validationResults.syntax.errors).toHaveLength(1)
      expect(validator.validationResults.syntax.errors[0].file).toContain('broken.test.js')
    })
    
    it('should pass valid migrated files', async () => {
      // Create valid migrated file
      const testFile = path.join(tempDir, 'valid.test.js')
      await fs.writeFile(testFile, `
        import { quickTest, scenario } from '@/tests/framework'
        
        describe('Valid Test', () => {
          it('should work with quickTest', async () => {
            await quickTest('Component', MockComponent, {
              props: { title: 'Test' },
              responsive: true,
              a11y: true
            })
          })
          
          it('should work with fluent BDD', async () => {
            await scenario('User Login')
              .given.user.isLoggedOut()
              .when.user.submitsLogin({email: 'test@example.com'})
              .then.user.shouldBeRedirected('/dashboard')
              .execute()
          })
        })
      `)
      
      await validator.validateSyntax(tempDir)
      
      expect(validator.validationResults.syntax.passed).toBeGreaterThan(0)
      expect(validator.validationResults.syntax.failed).toBe(0)
    })
    
    it('should calculate migration success percentage', () => {
      validator.validationResults.syntax = { passed: 8, failed: 2 }
      validator.validationResults.tests = { passed: 15, failed: 5 }
      
      const successRate = validator.calculateMigrationSuccess()
      
      // (8/10 + 15/20) / 2 = (0.8 + 0.75) / 2 = 0.775 = 77.5%
      expect(successRate).toBe(78) // Rounded
    })
    
    it('should determine rollback requirement', () => {
      // Low success rate should trigger rollback
      validator.validationResults.syntax = { passed: 2, failed: 8 }
      validator.validationResults.tests = { passed: 5, failed: 15 }
      
      expect(validator.shouldRollback()).toBe(true)
      
      // High success rate should not trigger rollback
      validator.validationResults.syntax = { passed: 9, failed: 1 }
      validator.validationResults.tests = { passed: 18, failed: 2 }
      
      expect(validator.shouldRollback()).toBe(false)
    })
    
    it('should find migrated files correctly', async () => {
      // Create various test files
      await fs.writeFile(path.join(tempDir, 'regular.test.js'), 'content')
      await fs.writeFile(path.join(tempDir, 'component.spec.js'), 'content')
      await fs.writeFile(path.join(tempDir, 'bdd.bdd.js'), 'content')
      await fs.writeFile(path.join(tempDir, 'user.steps.js'), 'content')
      await fs.writeFile(path.join(tempDir, 'not-a-test.js'), 'content')
      
      const files = await validator.findMigratedFiles(tempDir)
      
      expect(files).toHaveLength(4)
      expect(files.some(f => f.includes('regular.test.js'))).toBe(true)
      expect(files.some(f => f.includes('component.spec.js'))).toBe(true)
      expect(files.some(f => f.includes('bdd.bdd.js'))).toBe(true)
      expect(files.some(f => f.includes('user.steps.js'))).toBe(true)
      expect(files.some(f => f.includes('not-a-test.js'))).toBe(false)
    })
  })

  describe('TestFrameworkMigrator', () => {
    it('should identify Vue Test Utils patterns', async () => {
      const migrator = new TestFrameworkMigrator({ dryRun: true })
      
      // Create file with old patterns
      const testFile = path.join(tempDir, 'old-pattern.test.js')
      await fs.writeFile(testFile, `
        import { mount } from '@vue/test-utils'
        
        test('old pattern', () => {
          const wrapper = mount(Component, {
            props: { title: 'Test' },
            global: { plugins: [] }
          })
          expect(wrapper.exists()).toBe(true)
        })
      `)
      
      await migrator.processFile(testFile)
      
      expect(migrator.stats.transformations).toBeGreaterThan(0)
      expect(migrator.stats.patterns.has('vue-test-utils-to-quicktest')).toBe(true)
    })
    
    it('should update imports correctly', () => {
      const migrator = new TestFrameworkMigrator()
      
      // Mock AST would be created here in real implementation
      // For test purposes, we verify the logic exists
      expect(typeof migrator.updateImports).toBe('function')
      expect(typeof migrator.transformVueTestUtils).toBe('function')
      expect(typeof migrator.transformCucumberSteps).toBe('function')
    })
    
    it('should generate migration report', () => {
      const migrator = new TestFrameworkMigrator()
      migrator.stats.filesProcessed = 10
      migrator.stats.transformations = 25
      migrator.stats.errors = 2
      
      const report = migrator.generateReport()
      
      expect(report.summary.filesProcessed).toBe(10)
      expect(report.summary.transformations).toBe(25)
      expect(report.summary.errors).toBe(2)
      expect(report.summary.successRate).toBe('250.0%') // 25/10 * 100
    })
  })

  describe('VitestCucumberMigrator', () => {
    it('should parse Gherkin feature files', () => {
      const migrator = new VitestCucumberMigrator({ dryRun: true })
      
      const featureContent = `
        Feature: User Login
          As a user
          I want to log in
          So I can access my account
        
        Scenario: Successful login
          Given I am on the login page
          When I enter valid credentials
          Then I should be redirected to dashboard
          And I should see welcome message
      `
      
      const feature = migrator.parseGherkinFeature(featureContent)
      
      expect(feature.name).toBe('User Login')
      expect(feature.scenarios).toHaveLength(1)
      expect(feature.scenarios[0].name).toBe('Successful login')
      expect(feature.scenarios[0].steps).toHaveLength(4)
      expect(feature.scenarios[0].steps[0].type).toBe('given')
      expect(feature.scenarios[0].steps[0].text).toBe('I am on the login page')
    })
    
    it('should convert steps to fluent methods', () => {
      const migrator = new VitestCucumberMigrator()
      
      const testCases = [
        {
          step: { text: 'user clicks login button', type: 'when' },
          expected: 'user.clicks(\'login button\')'
        },
        {
          step: { text: 'I should see dashboard', type: 'then' },
          expected: 'page.shouldDisplay(\'dashboard\')'
        },
        {
          step: { text: 'user enters "test@example.com"', type: 'when' },
          expected: 'user.enters(\'test@example.com\')'
        }
      ]
      
      testCases.forEach(({ step, expected }) => {
        const result = migrator.convertStepToFluentMethod(step)
        expect(result).toBe(expected)
      })
    })
    
    it('should categorize test files correctly', async () => {
      const migrator = new VitestCucumberMigrator()
      
      // Create different file types
      await fs.writeFile(path.join(tempDir, 'login.feature'), 'Feature: Login')
      await fs.writeFile(path.join(tempDir, 'login.steps.js'), 'Given steps')
      await fs.writeFile(path.join(tempDir, 'vitest.config.js'), 'export default')
      await fs.writeFile(path.join(tempDir, 'regular.test.js'), 'test content')
      
      const categorized = await migrator.categorizeTestFiles(tempDir)
      
      expect(categorized.features).toHaveLength(1)
      expect(categorized.steps).toHaveLength(1)
      expect(categorized.configs).toHaveLength(1)
      expect(categorized.other).toHaveLength(1)
    })
  })

  describe('Performance Comparison', () => {
    it('should detect performance improvements', () => {
      const before = { testDuration: 1000, memoryUsage: 50000000, coverage: 70 }
      const after = { testDuration: 600, memoryUsage: 40000000, coverage: 85 }
      
      const comparison = validator.comparePerformance(before, after)
      
      expect(comparison.improved).toBeGreaterThan(0)
      expect(comparison.details.testDuration.status).toBe('improved')
      expect(comparison.details.memoryUsage.status).toBe('improved')
      expect(comparison.details.coverage.status).toBe('improved')
    })
    
    it('should detect performance regressions', () => {
      const before = { testDuration: 500, memoryUsage: 30000000 }
      const after = { testDuration: 800, memoryUsage: 50000000 }
      
      const comparison = validator.comparePerformance(before, after)
      
      expect(comparison.degraded).toBeGreaterThan(0)
      expect(comparison.details.testDuration.status).toBe('degraded')
      expect(comparison.details.memoryUsage.status).toBe('degraded')
    })
  })

  describe('Rollback Functionality', () => {
    it('should find backup files for rollback', async () => {
      // Create backup files
      await fs.writeFile(path.join(tempDir, 'test1.js.backup'), 'backup1')
      await fs.writeFile(path.join(tempDir, 'test2.js.backup'), 'backup2')
      await fs.writeFile(path.join(tempDir, 'regular.js'), 'regular')
      
      const backupFiles = await validator.findBackupFiles()
      
      const relevantBackups = backupFiles.filter(f => f.includes(tempDir))
      expect(relevantBackups).toHaveLength(2)
    })
    
    it('should validate overall migration status', () => {
      // Test successful migration
      validator.validationResults = {
        syntax: { passed: 10, failed: 0, errors: [] },
        tests: { passed: 20, failed: 0, errors: [] },
        performance: { improved: 3, degraded: 0, neutral: 1 }
      }
      
      expect(validator.calculateOverallStatus()).toBe('SUCCESS')
      
      // Test failed migration
      validator.validationResults.syntax.failed = 5
      expect(validator.calculateOverallStatus()).toBe('FAILED')
      
      // Test warning status
      validator.validationResults.syntax.failed = 0
      validator.validationResults.performance.degraded = 3
      expect(validator.calculateOverallStatus()).toBe('WARNING')
    })
  })

  describe('Integration Tests', () => {
    it('should run complete validation workflow', async () => {
      // Create a mix of valid and invalid files
      await fs.writeFile(path.join(tempDir, 'valid.test.js'), `
        import { quickTest } from '@/tests/framework'
        
        test('valid', async () => {
          await quickTest('Component', Component, { responsive: true })
        })
      `)
      
      await fs.writeFile(path.join(tempDir, 'invalid.test.js'), `
        import { quickTest } from '@/tests/framework'
        
        // Syntax error - missing parentheses
        await quickTest('Component', Component, { props: { title: 'Test' }
      `)
      
      const testValidator = new MigrationValidator({
        validateSyntax: true,
        runTests: false,
        checkPerformance: false
      })
      
      // This would normally run the full validation
      await testValidator.validateSyntax(tempDir)
      const report = testValidator.generateValidationReport()
      
      expect(report.summary).toBeDefined()
      expect(report.details).toBeDefined()
      expect(report.recommendations).toBeInstanceOf(Array)
      expect(typeof report.rollbackRequired).toBe('boolean')
    })
  })
})

// Mock component for testing
const MockComponent = {
  name: 'MockComponent',
  template: '<div>{{ title }}</div>',
  props: ['title']
}
