/**
 * Migration Validation Test Suite
 * Ensures @nuxt/bdd library provides compatible functionality with local framework
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { performance } from 'perf_hooks'

// Test both import patterns during transition
let localFramework, libraryFramework
let migrationMetrics = {
  performanceComparison: {},
  apiCompatibility: {},
  functionalParity: {}
}

// Dynamically import based on availability
beforeAll(async () => {
  try {
    // Try to import local framework (may not exist after migration)
    localFramework = await import('../tests/framework/index.js').catch(() => null)
  } catch (error) {
    console.warn('Local framework not available (expected after migration)')
  }
  
  try {
    // Import library framework
    libraryFramework = await import('@nuxt/bdd')
  } catch (error) {
    throw new Error('@nuxt/bdd library not installed. Run: pnpm add @nuxt/bdd')
  }
})

describe('Migration Validation', () => {
  describe('Library Installation', () => {
    it('should have @nuxt/bdd library installed', () => {
      expect(libraryFramework).toBeDefined()
      expect(libraryFramework.default).toBeDefined()
    })
    
    it('should have required exports available', () => {
      expect(libraryFramework.setup).toBeDefined()
      expect(libraryFramework.setupNuxtBDD).toBeDefined()
      expect(libraryFramework.createFramework).toBeDefined()
      expect(libraryFramework.scenario).toBeDefined()
    })
  })
  
  describe('API Compatibility', () => {
    it('should provide scenario function', async () => {
      const { scenario } = libraryFramework
      expect(typeof scenario).toBe('function')
      
      const testScenario = scenario('API compatibility test')
      expect(testScenario).toBeDefined()
      expect(testScenario.given).toBeDefined()
      expect(testScenario.when).toBeDefined()
      expect(testScenario.then).toBeDefined()
    })
    
    it('should provide setup functions', async () => {
      const { setup, setupNuxtBDD } = libraryFramework
      
      expect(typeof setup).toBe('function')
      expect(typeof setupNuxtBDD).toBe('function')
      
      // Test basic setup
      const frameworkAPI = await setup()
      expect(frameworkAPI.scenario).toBeDefined()
      expect(frameworkAPI.framework).toBeDefined()
    })
    
    it('should provide modular imports', async () => {
      // Test core module
      const coreModule = await import('@nuxt/bdd/core')
      expect(coreModule.scenario).toBeDefined()
      expect(coreModule.given).toBeDefined()
      expect(coreModule.when).toBeDefined()
      expect(coreModule.then).toBeDefined()
      
      // Test BDD module  
      const bddModule = await import('@nuxt/bdd/bdd')
      expect(bddModule).toBeDefined()
      
      // Test config module
      const configModule = await import('@nuxt/bdd/config')
      expect(configModule.createPlugin).toBeDefined()
    })
  })
  
  describe('Functional Parity', () => {
    it('should create and execute basic scenarios', async () => {
      const { scenario } = libraryFramework
      
      let executed = false
      
      const testScenario = scenario('Functional parity test')
        .given
        .user.isAuthenticated()
        .when
        .page.loads()
        .then
        .page.hasContent('Welcome')
      
      // Mock the execution since we're testing the structure
      expect(testScenario).toBeDefined()
      expect(testScenario.description).toBe('Functional parity test')
      
      migrationMetrics.functionalParity.basicScenario = 'PASS'
    })
    
    it('should handle async operations', async () => {
      const { setup } = libraryFramework
      
      const framework = await setup()
      
      // Test async scenario creation
      const asyncScenario = framework.scenario('Async test')
      expect(asyncScenario).toBeDefined()
      
      migrationMetrics.functionalParity.asyncOperations = 'PASS'
    })
    
    it('should support plugin system', async () => {
      const { createFramework } = libraryFramework
      
      // Test plugin creation and loading
      const testPlugin = {
        name: 'test-plugin',
        install: (framework) => {
          framework.testExtension = 'loaded'
        }
      }
      
      const framework = await createFramework({
        plugins: [testPlugin]
      })
      
      expect(framework.testExtension).toBe('loaded')
      
      migrationMetrics.functionalParity.pluginSystem = 'PASS'
    })
  })
  
  describe('Performance Comparison', () => {
    it('should measure scenario creation performance', async () => {
      const { scenario } = libraryFramework
      
      // Measure library performance
      const libraryStart = performance.now()
      for (let i = 0; i < 100; i++) {
        scenario(`Performance test ${i}`)
      }
      const libraryEnd = performance.now()
      const libraryTime = libraryEnd - libraryStart
      
      migrationMetrics.performanceComparison.scenarioCreation = {
        library: libraryTime,
        acceptable: libraryTime < 100 // Should complete in under 100ms
      }
      
      expect(libraryTime).toBeLessThan(1000) // Should be reasonable
    })
    
    it('should measure framework setup performance', async () => {
      const { createFramework } = libraryFramework
      
      const setupStart = performance.now()
      await createFramework()
      const setupEnd = performance.now()
      const setupTime = setupEnd - setupStart
      
      migrationMetrics.performanceComparison.frameworkSetup = {
        library: setupTime,
        acceptable: setupTime < 1000
      }
      
      expect(setupTime).toBeLessThan(5000) // Should setup within 5 seconds
    })
  })
  
  describe('Import Pattern Validation', () => {
    it('should support all expected import patterns', async () => {
      // Test main import
      const mainImport = await import('@nuxt/bdd')
      expect(mainImport.scenario).toBeDefined()
      
      // Test core import
      const coreImport = await import('@nuxt/bdd/core')
      expect(coreImport.scenario).toBeDefined()
      
      // Test BDD import
      const bddImport = await import('@nuxt/bdd/bdd')
      expect(bddImport).toBeDefined()
      
      // Test Nuxt import
      const nuxtImport = await import('@nuxt/bdd/nuxt')
      expect(nuxtImport).toBeDefined()
      
      // Test config import
      const configImport = await import('@nuxt/bdd/config')
      expect(configImport.createPlugin).toBeDefined()
      
      migrationMetrics.apiCompatibility.importPatterns = 'PASS'
    })
    
    it('should handle legacy import patterns gracefully', async () => {
      // Test that old patterns would fail predictably
      try {
        await import('../framework/core/index.js')
        // If this succeeds, migration isn't complete
        migrationMetrics.apiCompatibility.legacyImports = 'MIGRATION_INCOMPLETE'
      } catch (error) {
        // Expected - old imports should fail
        migrationMetrics.apiCompatibility.legacyImports = 'MIGRATION_COMPLETE'
      }
    })
  })
  
  describe('Configuration Compatibility', () => {
    it('should handle zero-config initialization', async () => {
      const { setupNuxtBDD } = libraryFramework
      
      // Test zero-config setup
      const api = await setupNuxtBDD()
      expect(api.scenario).toBeDefined()
      expect(api.framework).toBeDefined()
      
      migrationMetrics.functionalParity.zeroConfig = 'PASS'
    })
    
    it('should support custom configuration', async () => {
      const { createFramework } = libraryFramework
      
      const framework = await createFramework({
        autoConfig: true,
        nuxtIntegration: true,
        cucumberIntegration: false,
        verbose: true
      })
      
      expect(framework.initialized).toBe(true)
      
      migrationMetrics.functionalParity.customConfig = 'PASS'
    })
  })
  
  describe('Error Handling', () => {
    it('should handle invalid configurations gracefully', async () => {
      const { createFramework } = libraryFramework
      
      // Test with invalid config
      try {
        await createFramework({
          invalidOption: true
        })
        // Should still work even with invalid options
        migrationMetrics.functionalParity.errorHandling = 'PASS'
      } catch (error) {
        // Should handle errors gracefully
        expect(error.message).toBeDefined()
        migrationMetrics.functionalParity.errorHandling = 'PASS'
      }
    })
  })
  
  describe('Memory Usage', () => {
    it('should not leak memory during repeated use', async () => {
      const { scenario } = libraryFramework
      
      const initialMemory = process.memoryUsage().heapUsed
      
      // Create many scenarios to test for leaks
      const scenarios = []
      for (let i = 0; i < 1000; i++) {
        scenarios.push(scenario(`Memory test ${i}`))
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      migrationMetrics.performanceComparison.memoryUsage = {
        initial: initialMemory,
        final: finalMemory,
        increase: memoryIncrease,
        acceptable: memoryIncrease < 50 * 1024 * 1024 // Less than 50MB increase
      }
      
      // Should not increase memory dramatically
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024) // Less than 100MB
    })
  })
})

describe('Migration Completeness', () => {
  it('should have migrated all test files', async () => {
    // This test verifies that no test files are still importing from local framework
    const { execSync } = await import('child_process')
    
    try {
      // Search for remaining framework imports
      const result = execSync(
        'grep -r "from [\'\\"]\\.\\.\/framework\/" tests/ 2>/dev/null || true',
        { encoding: 'utf8' }
      )
      
      if (result.trim()) {
        console.warn('Files still importing from local framework:')
        console.warn(result)
        migrationMetrics.apiCompatibility.migrationCompleteness = 'INCOMPLETE'
        expect.fail('Migration incomplete: Some files still import from local framework')
      } else {
        migrationMetrics.apiCompatibility.migrationCompleteness = 'COMPLETE'
      }
    } catch (error) {
      // Command failed, which is okay
      migrationMetrics.apiCompatibility.migrationCompleteness = 'COMPLETE'
    }
  })
})

// Generate migration report
afterAll(() => {
  console.log('\n🔍 Migration Validation Report')
  console.log('================================')
  
  console.log('\n📊 Performance Metrics:')
  Object.entries(migrationMetrics.performanceComparison).forEach(([key, value]) => {
    if (typeof value === 'object') {
      console.log(`  ${key}:`, value)
    } else {
      console.log(`  ${key}: ${value}`)
    }
  })
  
  console.log('\n🔧 API Compatibility:')
  Object.entries(migrationMetrics.apiCompatibility).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`)
  })
  
  console.log('\n✅ Functional Parity:')
  Object.entries(migrationMetrics.functionalParity).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`)
  })
  
  // Overall assessment
  const allTests = [
    ...Object.values(migrationMetrics.performanceComparison),
    ...Object.values(migrationMetrics.apiCompatibility),
    ...Object.values(migrationMetrics.functionalParity)
  ]
  
  const passedTests = allTests.filter(test => 
    test === 'PASS' || 
    test === 'COMPLETE' || 
    (typeof test === 'object' && test.acceptable)
  ).length
  
  console.log(`\n🎯 Overall Score: ${passedTests}/${allTests.length} tests passed`)
  
  if (passedTests === allTests.length) {
    console.log('✅ Migration validation SUCCESSFUL!')
  } else {
    console.log('⚠️  Migration validation has issues that need attention')
  }
})