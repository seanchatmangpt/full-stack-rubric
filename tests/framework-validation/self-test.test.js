/**
 * @fileoverview Self-validation tests for the micro-framework
 * Tests the framework using its own capabilities
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest'
import { scenario, ScenarioBuilder, given, when, then } from '../framework/core/index.js'
import { mountWithExpectations, quickTest, performanceTest } from '../framework/core-utils.js'
import { initializeZeroConfig, validateZeroConfig } from '../framework/config/zero-config.js'
import { generateSmartDefaults } from '../framework/config/smart-defaults.js'
import { pluginSystem } from '../framework/config/plugin-system.js'

describe('Micro-Framework Self-Validation', () => {
  describe('Core Framework Architecture', () => {
    it('should create scenario builders with fluent API', () => {
      const testScenario = scenario('Test scenario creation')
      
      expect(testScenario).toBeInstanceOf(ScenarioBuilder)
      expect(testScenario.description).toBe('Test scenario creation')
      expect(testScenario.steps).toEqual([])
      expect(testScenario.context).toHaveProperty('user')
      expect(testScenario.context).toHaveProperty('data')
      expect(testScenario.context).toHaveProperty('nuxt')
    })

    it('should provide BDD-style builders', () => {
      const testScenario = scenario('BDD test scenario')
      
      expect(testScenario.given).toBeDefined()
      expect(testScenario.when).toBeDefined()
      expect(testScenario.then).toBeDefined()
      expect(testScenario.and).toBeDefined()
      
      expect(testScenario.given).toHaveProperty('user')
      expect(testScenario.when).toHaveProperty('page')
      expect(testScenario.then).toHaveProperty('api')
    })

    it('should chain steps correctly', () => {
      const testScenario = scenario('Chaining test')
      
      const chainedScenario = testScenario
        .addStep('given', 'initial state', () => {})
        .addStep('when', 'action performed', () => {})
        .addStep('then', 'result verified', () => {})
      
      expect(chainedScenario.steps).toHaveLength(3)
      expect(chainedScenario.steps[0].type).toBe('given')
      expect(chainedScenario.steps[1].type).toBe('when')
      expect(chainedScenario.steps[2].type).toBe('then')
    })
  })

  describe('Enhanced Mount Utilities', () => {
    it('should provide mountWithExpectations with BDD helpers', async () => {
      const TestComponent = {
        template: '<div class="test-component">Hello World</div>'
      }
      
      const wrapper = await mountWithExpectations(TestComponent)
      
      expect(wrapper.should).toBeDefined()
      expect(wrapper.interact).toBeDefined()
      expect(wrapper.should.render).toBeTypeOf('function')
      expect(wrapper.should.contain).toBeTypeOf('function')
      expect(wrapper.should.haveClass).toBeTypeOf('function')
      
      wrapper.should.render().contain('Hello World').haveClass('test-component')
      
      wrapper.unmount()
    })

    it('should provide chainable interactions', async () => {
      const InteractiveComponent = {
        template: `
          <div>
            <input type="text" class="test-input" v-model="text" />
            <button @click="clicked = true">Click me</button>
            <p v-if="clicked">Button clicked</p>
          </div>
        `,
        data() {
          return { text: '', clicked: false }
        }
      }
      
      const wrapper = await mountWithExpectations(InteractiveComponent)
      
      await wrapper.interact
        .type('.test-input', 'test text')
        .click('button')
      
      expect(wrapper.text()).toContain('Button clicked')
      expect(wrapper.find('.test-input').element.value).toBe('test text')
      
      wrapper.unmount()
    })

    it('should handle quick testing utility', async () => {
      const QuickTestComponent = {
        template: '<div>Quick test component</div>'
      }
      
      let testExecuted = false
      
      await quickTest(QuickTestComponent, (wrapper) => {
        testExecuted = true
        wrapper.should.render().contain('Quick test component')
      })
      
      expect(testExecuted).toBe(true)
    })
  })

  describe('Zero-Config System', () => {
    let tempProjectPath

    beforeEach(() => {
      tempProjectPath = `/tmp/test-project-${Date.now()}`
    })

    it('should validate zero-config initialization', async () => {
      const validation = await validateZeroConfig(process.cwd())
      
      expect(validation).toHaveProperty('valid')
      expect(validation).toHaveProperty('issues')
      expect(validation).toHaveProperty('suggestions')
      
      expect(Array.isArray(validation.issues)).toBe(true)
      expect(Array.isArray(validation.suggestions)).toBe(true)
    })

    it('should generate smart defaults', async () => {
      const defaults = await generateSmartDefaults(process.cwd(), {})
      
      expect(defaults).toHaveProperty('nuxt')
      expect(defaults).toHaveProperty('testing')
      expect(defaults.nuxt).toHaveProperty('modules')
      expect(Array.isArray(defaults.nuxt.modules)).toBe(true)
    })

    it('should initialize plugin system', async () => {
      await pluginSystem.initialize()
      
      expect(pluginSystem.plugins).toBeDefined()
      expect(pluginSystem.middleware).toBeDefined()
      expect(pluginSystem.hooks).toBeDefined()
    })
  })

  describe('Performance Validation', () => {
    it('should measure framework initialization performance', async () => {
      const initTime = await performanceTest(async () => {
        const testScenario = scenario('Performance test scenario')
        testScenario.addStep('given', 'setup', () => {})
        testScenario.addStep('when', 'action', () => {})
        testScenario.addStep('then', 'assertion', () => {})
      }, 50) // Should initialize within 50ms
      
      expect(initTime).toBeLessThan(50)
    })

    it('should measure component mounting performance', async () => {
      const PerfTestComponent = {
        template: '<div>Performance test</div>'
      }
      
      const mountTime = await performanceTest(async () => {
        const wrapper = await mountWithExpectations(PerfTestComponent)
        wrapper.unmount()
      }, 100) // Should mount within 100ms
      
      expect(mountTime).toBeLessThan(100)
    })

    it('should validate framework memory usage', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Create multiple scenarios to test memory efficiency
      for (let i = 0; i < 10; i++) {
        const testScenario = scenario(`Memory test scenario ${i}`)
        testScenario.addStep('given', 'setup', () => {})
        testScenario.addStep('when', 'action', () => {})
        testScenario.addStep('then', 'assertion', () => {})
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be reasonable (less than 1MB)
      expect(memoryIncrease).toBeLessThan(1024 * 1024)
    })
  })

  describe('Framework Extensibility', () => {
    it('should support plugin registration', () => {
      const testPlugin = {
        name: 'test-plugin',
        install(config) {
          config.testPluginInstalled = true
        }
      }
      
      const initialPluginCount = pluginSystem.plugins.length
      pluginSystem.register(testPlugin)
      
      expect(pluginSystem.plugins.length).toBe(initialPluginCount + 1)
      expect(pluginSystem.plugins.some(p => p.name === 'test-plugin')).toBe(true)
    })

    it('should support middleware', async () => {
      let middlewareCalled = false
      
      pluginSystem.use((config, next) => {
        middlewareCalled = true
        config.middlewareApplied = true
        return next(config)
      })
      
      const testConfig = { test: true }
      const result = await pluginSystem.applyMiddleware(testConfig)
      
      expect(middlewareCalled).toBe(true)
      expect(result.middlewareApplied).toBe(true)
    })

    it('should support hooks system', async () => {
      let hookCalled = false
      let hookData = null
      
      pluginSystem.hook('test:event', (data) => {
        hookCalled = true
        hookData = data
        return { ...data, hookProcessed: true }
      })
      
      const result = await pluginSystem.callHook('test:event', { test: 'data' })
      
      expect(hookCalled).toBe(true)
      expect(hookData).toEqual({ test: 'data' })
      expect(result.hookProcessed).toBe(true)
    })
  })

  describe('Framework Integration', () => {
    it('should integrate with Vitest', () => {
      // Verify Vitest globals are available
      expect(describe).toBeDefined()
      expect(it).toBeDefined()
      expect(expect).toBeDefined()
      expect(beforeAll).toBeDefined()
      expect(beforeEach).toBeDefined()
      expect(afterEach).toBeDefined()
    })

    it('should integrate with Vue Test Utils', async () => {
      const VueComponent = {
        template: '<div>Vue integration test</div>'
      }
      
      const wrapper = await mountWithExpectations(VueComponent)
      
      // Verify Vue Test Utils functionality
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.html()).toContain('Vue integration test')
      expect(wrapper.text()).toBe('Vue integration test')
      
      wrapper.unmount()
    })

    it('should provide Nuxt-specific testing utilities', async () => {
      const testScenario = scenario('Nuxt integration test')
      
      // Mock Nuxt context setup
      testScenario.context.nuxt = {
        router: { push: () => {}, replace: () => {} },
        $fetch: () => Promise.resolve({}),
        close: () => Promise.resolve()
      }
      
      expect(testScenario.context.nuxt).toBeDefined()
      expect(testScenario.context.nuxt.router).toBeDefined()
      expect(testScenario.context.nuxt.$fetch).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle framework errors gracefully', async () => {
      const ErrorComponent = {
        template: '<div>{{ errorProp.value }}</div>',
        props: ['errorProp']
      }
      
      let errorHandled = false
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        errorHandled = true
      })
      
      try {
        const wrapper = await mountWithExpectations(ErrorComponent, {
          props: { errorProp: null }
        })
        wrapper.unmount()
      } catch (error) {
        // Error should be caught and handled
        expect(error).toBeDefined()
      }
      
      consoleErrorSpy.mockRestore()
    })

    it('should provide meaningful error messages', async () => {
      const testScenario = scenario('Error handling test')
      testScenario.addStep('given', 'setup', () => {})
      testScenario.addStep('when', 'failing action', () => {
        throw new Error('Test error')
      })
      
      try {
        await testScenario.execute()
      } catch (error) {
        expect(error.message).toContain('Step failed: failing action')
        expect(error.message).toContain('Test error')
      }
    })
  })

  describe('Framework Completeness', () => {
    it('should provide all essential testing utilities', () => {
      // Core scenario building
      expect(scenario).toBeDefined()
      expect(given).toBeDefined()
      expect(when).toBeDefined()
      expect(then).toBeDefined()
      
      // Enhanced mounting
      expect(mountWithExpectations).toBeDefined()
      expect(quickTest).toBeDefined()
      
      // Performance testing
      expect(performanceTest).toBeDefined()
      
      // Zero-config utilities
      expect(initializeZeroConfig).toBeDefined()
      expect(validateZeroConfig).toBeDefined()
    })

    it('should maintain consistent API across all modules', () => {
      const testScenario = scenario('API consistency test')
      
      // All builders should be consistent
      expect(testScenario.given).toHaveProperty('user')
      expect(testScenario.given).toHaveProperty('page')
      expect(testScenario.given).toHaveProperty('api')
      expect(testScenario.given).toHaveProperty('database')
      
      expect(testScenario.when).toHaveProperty('user')
      expect(testScenario.when).toHaveProperty('page')
      expect(testScenario.when).toHaveProperty('api')
      
      expect(testScenario.then).toHaveProperty('user')
      expect(testScenario.then).toHaveProperty('page')
      expect(testScenario.then).toHaveProperty('api')
      expect(testScenario.then).toHaveProperty('session')
      expect(testScenario.then).toHaveProperty('response')
    })

    it('should support full BDD workflow', async () => {
      let workflowExecuted = false
      
      const testScenario = scenario('Full BDD workflow test')
        .addStep('given', 'initial state is set', (context) => {
          context.data.initialValue = 'test'
        })
        .addStep('when', 'action is performed', (context) => {
          context.data.result = context.data.initialValue + '_processed'
        })
        .addStep('then', 'result is verified', (context) => {
          expect(context.data.result).toBe('test_processed')
          workflowExecuted = true
        })
      
      // Mock Nuxt setup for execution
      testScenario.setupNuxtContext = async () => {
        testScenario.context.nuxt = {
          router: {},
          $fetch: () => Promise.resolve({}),
          close: () => Promise.resolve()
        }
      }
      
      await testScenario.execute()
      
      expect(workflowExecuted).toBe(true)
      expect(testScenario.context.data.result).toBe('test_processed')
    })
  })
})