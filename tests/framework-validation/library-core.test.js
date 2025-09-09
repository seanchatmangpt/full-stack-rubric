/**
 * @fileoverview Library Core Testing Suite
 * @description Comprehensive tests for the BDD micro-framework itself
 * Tests the framework components to ensure reliability and performance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  BDDFramework, 
  createFramework, 
  setup, 
  setupNuxtBDD, 
  setupFullBDD, 
  setupMinimal,
  createPlugin 
} from '../framework/index.js'
import { AutoConfigManager } from '../framework/plugins/auto-config.js'
import { getNuxtBridge } from '../framework/integration/nuxt-bridge.js'
import { getCucumberBridge } from '../framework/integration/cucumber-bridge.js'

describe('BDD Micro-Framework Core', () => {
  let framework
  let consoleSpy

  beforeEach(() => {
    framework = null
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(async () => {
    if (framework) {
      await framework.cleanup()
    }
    consoleSpy.mockRestore()
  })

  describe('Framework Initialization', () => {
    it('should create framework instance with default options', async () => {
      framework = new BDDFramework()
      
      expect(framework).toBeInstanceOf(BDDFramework)
      expect(framework.options.autoConfig).toBe(true)
      expect(framework.options.nuxtIntegration).toBe(true)
      expect(framework.options.cucumberIntegration).toBe(true)
      expect(framework.initialized).toBe(false)
    })

    it('should initialize framework with all components', async () => {
      framework = new BDDFramework({
        verbose: true
      })
      
      await framework.initialize()
      
      expect(framework.initialized).toBe(true)
      expect(framework.autoConfig).toBeInstanceOf(AutoConfigManager)
      expect(framework.nuxtBridge).toBeDefined()
      expect(framework.cucumberBridge).toBeDefined()
    })

    it('should handle initialization errors gracefully', async () => {
      framework = new BDDFramework({
        autoConfig: true,
        nuxtIntegration: true
      })
      
      // Mock a failure in auto-configuration
      vi.spyOn(AutoConfigManager.prototype, 'scanAndConfigure')
        .mockRejectedValueOnce(new Error('Scan failed'))
      
      await expect(framework.initialize()).rejects.toThrow('Scan failed')
      expect(framework.initialized).toBe(false)
    })

    it('should allow partial initialization', async () => {
      framework = new BDDFramework({
        autoConfig: false,
        nuxtIntegration: true,
        cucumberIntegration: false
      })
      
      await framework.initialize()
      
      expect(framework.initialized).toBe(true)
      expect(framework.autoConfig).toBeNull()
      expect(framework.nuxtBridge).toBeDefined()
      expect(framework.cucumberBridge).toBeNull()
    })
  })

  describe('Configuration Management', () => {
    beforeEach(async () => {
      framework = new BDDFramework()
      await framework.initialize()
    })

    it('should merge configurations correctly', () => {
      const config = framework.getConfig()
      
      expect(config).toBeDefined()
      expect(config).toHaveProperty('helpers')
      expect(typeof config.helpers).toBe('object')
    })

    it('should handle custom configuration options', async () => {
      const customFramework = new BDDFramework({
        conventions: {
          testDir: 'custom-tests',
          stepDir: 'custom-steps'
        }
      })
      
      await customFramework.initialize()
      
      const config = customFramework.getConfig()
      expect(config.testDir).toBe('custom-tests')
      expect(config.stepDir).toBe('custom-steps')
      
      await customFramework.cleanup()
    })

    it('should provide immutable configuration', () => {
      const config1 = framework.getConfig()
      const config2 = framework.getConfig()
      
      expect(config1).not.toBe(config2) // Different objects
      expect(config1).toEqual(config2) // Same content
      
      // Modification should not affect original
      config1.testModified = true
      const config3 = framework.getConfig()
      expect(config3.testModified).toBeUndefined()
    })
  })

  describe('Plugin System', () => {
    beforeEach(async () => {
      framework = new BDDFramework()
      await framework.initialize()
    })

    it('should load plugins during initialization', async () => {
      const testPlugin = createPlugin('test-plugin', (fw) => {
        fw.testPluginLoaded = true
      })
      
      const pluginFramework = new BDDFramework({
        plugins: [testPlugin]
      })
      
      await pluginFramework.initialize()
      
      expect(pluginFramework.testPluginLoaded).toBe(true)
      expect(pluginFramework.plugins.has('test-plugin')).toBe(true)
      
      await pluginFramework.cleanup()
    })

    it('should handle plugin loading errors', async () => {
      const errorPlugin = () => {
        throw new Error('Plugin failed to load')
      }
      
      const pluginFramework = new BDDFramework({
        plugins: [errorPlugin],
        verbose: true
      })
      
      // Should not throw, just log error
      await expect(pluginFramework.initialize()).resolves.not.toThrow()
      
      await pluginFramework.cleanup()
    })

    it('should allow runtime plugin addition', async () => {
      const runtimePlugin = createPlugin('runtime-plugin', (fw) => {
        fw.runtimePluginLoaded = true
      })
      
      await framework.addPlugin(runtimePlugin)
      
      expect(framework.runtimePluginLoaded).toBe(true)
      expect(framework.plugins.has('runtime-plugin')).toBe(true)
    })

    it('should provide plugin information', async () => {
      const infoPlugin = createPlugin('info-plugin', () => {})
      
      await framework.addPlugin(infoPlugin)
      
      const plugins = framework.getPlugins()
      expect(plugins.size).toBeGreaterThan(0)
      expect(plugins.has('info-plugin')).toBe(true)
    })
  })

  describe('Scenario Management', () => {
    beforeEach(async () => {
      framework = new BDDFramework()
      await framework.initialize()
    })

    it('should create and register scenarios', () => {
      const scenario1 = framework.scenario('Test scenario 1')
      const scenario2 = framework.scenario('Test scenario 2')
      
      expect(scenario1).toBeDefined()
      expect(scenario2).toBeDefined()
      expect(scenario1).not.toBe(scenario2)
      
      const scenarios = framework.getScenarios()
      expect(scenarios.size).toBe(2)
      expect(scenarios.has('Test scenario 1')).toBe(true)
      expect(scenarios.has('Test scenario 2')).toBe(true)
    })

    it('should enhance scenarios with integrations', () => {
      const scenario = framework.scenario('Enhanced scenario')
      
      // Should have framework reference
      expect(scenario.framework).toBe(framework)
      
      // Should have helper methods
      expect(typeof scenario.helpers).toBe('function')
    })

    it('should handle duplicate scenario names', () => {
      const scenario1 = framework.scenario('Duplicate name')
      const scenario2 = framework.scenario('Duplicate name')
      
      const scenarios = framework.getScenarios()
      expect(scenarios.size).toBe(1) // Should overwrite
      expect(scenarios.get('Duplicate name')).toBe(scenario2)
    })
  })

  describe('Resource Management', () => {
    it('should cleanup resources properly', async () => {
      framework = new BDDFramework()
      await framework.initialize()
      
      // Add some scenarios and plugins
      framework.scenario('Test scenario')
      await framework.addPlugin(createPlugin('test-cleanup', () => {}))
      
      expect(framework.initialized).toBe(true)
      expect(framework.getScenarios().size).toBe(1)
      expect(framework.getPlugins().size).toBeGreaterThan(0)
      
      await framework.cleanup()
      
      expect(framework.initialized).toBe(false)
      expect(framework.getScenarios().size).toBe(0)
    })

    it('should handle cleanup errors gracefully', async () => {
      framework = new BDDFramework()
      await framework.initialize()
      
      // Add plugin with failing cleanup
      const failingPlugin = createPlugin('failing-cleanup', () => {}, () => {
        throw new Error('Cleanup failed')
      })
      await framework.addPlugin(failingPlugin)
      
      // Should not throw
      await expect(framework.cleanup()).resolves.not.toThrow()
    })
  })

  describe('Factory Functions', () => {
    it('should create framework with createFramework', async () => {
      framework = await createFramework({
        verbose: false,
        autoConfig: true
      })
      
      expect(framework).toBeInstanceOf(BDDFramework)
      expect(framework.initialized).toBe(true)
    })

    it('should reuse global framework instance', async () => {
      const framework1 = await createFramework()
      const framework2 = await createFramework()
      
      expect(framework1).toBe(framework2)
      
      framework = framework1 // For cleanup
    })

    it('should provide setup function API', async () => {
      const api = await setup({
        autoConfig: true,
        nuxtIntegration: true
      })
      
      expect(api).toHaveProperty('scenario')
      expect(api).toHaveProperty('given')
      expect(api).toHaveProperty('when')
      expect(api).toHaveProperty('then')
      expect(api).toHaveProperty('helpers')
      expect(api).toHaveProperty('framework')
      expect(api).toHaveProperty('config')
      
      expect(typeof api.scenario).toBe('function')
      expect(typeof api.helpers).toBe('function')
      
      framework = api.framework // For cleanup
    })

    it('should provide specialized setup functions', async () => {
      const nuxtAPI = await setupNuxtBDD()
      expect(nuxtAPI.framework.options.nuxtIntegration).toBe(true)
      expect(nuxtAPI.framework.options.cucumberIntegration).toBe(false)
      
      const fullAPI = await setupFullBDD()
      expect(fullAPI.framework.options.nuxtIntegration).toBe(true)
      expect(fullAPI.framework.options.cucumberIntegration).toBe(true)
      
      const minimalAPI = await setupMinimal()
      expect(minimalAPI.framework.options.nuxtIntegration).toBe(false)
      expect(minimalAPI.framework.options.cucumberIntegration).toBe(false)
      
      // Cleanup the last one created
      framework = minimalAPI.framework
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid plugin configurations', async () => {
      const framework = new BDDFramework({
        plugins: [
          null,
          undefined,
          'invalid-plugin',
          { invalid: 'plugin' }
        ]
      })
      
      // Should initialize without throwing
      await expect(framework.initialize()).resolves.not.toThrow()
      await framework.cleanup()
    })

    it('should handle missing dependencies gracefully', async () => {
      const framework = new BDDFramework({
        nuxtIntegration: true,
        cucumberIntegration: true
      })
      
      // Should handle missing modules gracefully
      await expect(framework.initialize()).resolves.not.toThrow()
      await framework.cleanup()
    })

    it('should validate framework options', () => {
      const framework1 = new BDDFramework({
        autoConfig: 'invalid' // Should be boolean
      })
      
      // Should use default value
      expect(framework1.options.autoConfig).toBe(true)
      
      const framework2 = new BDDFramework({
        plugins: 'invalid' // Should be array
      })
      
      expect(Array.isArray(framework2.options.plugins)).toBe(true)
    })
  })

  describe('Performance and Memory', () => {
    it('should initialize quickly', async () => {
      const start = performance.now()
      
      framework = new BDDFramework()
      await framework.initialize()
      
      const duration = performance.now() - start
      expect(duration).toBeLessThan(1000) // Should initialize in under 1 second
    })

    it('should handle large numbers of scenarios', async () => {
      framework = new BDDFramework()
      await framework.initialize()
      
      const scenarioCount = 100
      
      const start = performance.now()
      for (let i = 0; i < scenarioCount; i++) {
        framework.scenario(`Scenario ${i}`)
      }
      const duration = performance.now() - start
      
      expect(framework.getScenarios().size).toBe(scenarioCount)
      expect(duration).toBeLessThan(100) // Should be fast
    })

    it('should not leak memory during cleanup', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      for (let i = 0; i < 10; i++) {
        const tempFramework = new BDDFramework()
        await tempFramework.initialize()
        
        // Create some scenarios and plugins
        tempFramework.scenario(`Test scenario ${i}`)
        await tempFramework.addPlugin(createPlugin(`plugin-${i}`, () => {}))
        
        await tempFramework.cleanup()
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      // Allow some memory increase but flag excessive growth
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // Less than 10MB
    })
  })
})

describe('Integration Components', () => {
  describe('Auto Configuration Manager', () => {
    it('should create manager instance', () => {
      const manager = new AutoConfigManager()
      expect(manager).toBeInstanceOf(AutoConfigManager)
    })

    it('should handle configuration generation', async () => {
      const manager = new AutoConfigManager()
      const config = await manager.scanAndConfigure()
      
      expect(config).toBeDefined()
      expect(typeof config).toBe('object')
    })
  })

  describe('Bridge Components', () => {
    it('should create Nuxt bridge', () => {
      const bridge = getNuxtBridge()
      expect(bridge).toBeDefined()
    })

    it('should create Cucumber bridge', () => {
      const bridge = getCucumberBridge()
      expect(bridge).toBeDefined()
    })
  })

  describe('Plugin Creation', () => {
    it('should create plugin objects', () => {
      const plugin = createPlugin('test', () => {})
      
      expect(plugin).toHaveProperty('name', 'test')
      expect(plugin).toHaveProperty('install')
      expect(plugin).toHaveProperty('version')
      expect(typeof plugin.install).toBe('function')
    })

    it('should create plugin with cleanup', () => {
      const cleanup = vi.fn()
      const plugin = createPlugin('test', () => {}, cleanup)
      
      expect(plugin).toHaveProperty('cleanup')
      expect(plugin.cleanup).toBe(cleanup)
    })
  })
})
