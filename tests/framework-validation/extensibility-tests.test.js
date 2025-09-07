/**
 * @fileoverview Extensibility validation tests for the micro-framework
 * Tests plugin system, customization capabilities, and framework extension points
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { scenario } from '../framework/core/index.js'
import { mountWithExpectations } from '../framework/core-utils.js'
import { pluginSystem } from '../framework/config/plugin-system.js'
import { usePlugin, config } from '../framework/core/index.js'

describe('Framework Extensibility Validation', () => {
  let originalPlugins
  let originalMiddleware
  let originalHooks

  beforeEach(() => {
    // Save original state
    originalPlugins = [...pluginSystem.plugins]
    originalMiddleware = [...pluginSystem.middleware]
    originalHooks = { ...pluginSystem.hooks }
  })

  afterEach(() => {
    // Restore original state
    pluginSystem.plugins = originalPlugins
    pluginSystem.middleware = originalMiddleware
    pluginSystem.hooks = originalHooks
  })

  describe('Plugin System Architecture', () => {
    it('should support plugin registration and initialization', () => {
      const testPlugin = {
        name: 'test-plugin-validation',
        version: '1.0.0',
        description: 'A test plugin for validation',
        
        install(frameworkConfig) {
          frameworkConfig.plugins = frameworkConfig.plugins || []
          frameworkConfig.plugins.push(this.name)
          frameworkConfig.testPluginFeatures = {
            customAssertion: true,
            customMount: true
          }
        },

        beforeMount(component, options) {
          options.attrs = options.attrs || {}
          options.attrs['data-plugin-enhanced'] = 'true'
          return { component, options }
        },

        afterMount(wrapper) {
          wrapper._pluginEnhanced = true
          return wrapper
        }
      }

      // Test plugin registration
      usePlugin(testPlugin)

      const installedPlugin = pluginSystem.plugins.find(p => p.name === 'test-plugin-validation')
      expect(installedPlugin).toBeDefined()
      expect(installedPlugin.version).toBe('1.0.0')
      expect(installedPlugin.description).toBe('A test plugin for validation')

      // Test plugin installation effects
      expect(config.plugins).toContain('test-plugin-validation')
      expect(config.testPluginFeatures).toBeDefined()
      expect(config.testPluginFeatures.customAssertion).toBe(true)
    })

    it('should support plugin dependencies and ordering', () => {
      const basePlugin = {
        name: 'base-plugin',
        install(config) {
          config.basePluginLoaded = true
        }
      }

      const dependentPlugin = {
        name: 'dependent-plugin',
        dependencies: ['base-plugin'],
        install(config) {
          if (!config.basePluginLoaded) {
            throw new Error('Base plugin must be loaded first')
          }
          config.dependentPluginLoaded = true
        }
      }

      // Register base plugin first
      usePlugin(basePlugin)
      usePlugin(dependentPlugin)

      expect(config.basePluginLoaded).toBe(true)
      expect(config.dependentPluginLoaded).toBe(true)
    })

    it('should handle plugin conflicts and validation', () => {
      const conflictingPlugin1 = {
        name: 'conflicting-feature',
        provides: ['custom-mount'],
        install(config) {
          config.customMountProvider = 'plugin1'
        }
      }

      const conflictingPlugin2 = {
        name: 'conflicting-feature-2',
        provides: ['custom-mount'],
        install(config) {
          config.customMountProvider = 'plugin2'
        }
      }

      usePlugin(conflictingPlugin1)
      
      expect(() => {
        usePlugin(conflictingPlugin2)
      }).toThrow() // Should detect conflict

      expect(config.customMountProvider).toBe('plugin1')
    })
  })

  describe('Custom Assertion Extensions', () => {
    it('should support custom assertion plugins', async () => {
      const customAssertionPlugin = {
        name: 'custom-assertions',
        install(config) {
          // Add custom assertion methods to the framework
          config.customAssertions = {
            toHaveCorrectStructure: function(received, expected) {
              const pass = JSON.stringify(Object.keys(received).sort()) === 
                          JSON.stringify(Object.keys(expected).sort())
              return {
                message: () => `Expected object to have structure matching ${JSON.stringify(expected)}`,
                pass
              }
            },

            toBeAccessible: function(received) {
              // Simplified accessibility check
              const hasAriaLabel = received.getAttribute('aria-label') || 
                                 received.querySelector('[aria-label]')
              const hasRole = received.getAttribute('role')
              const hasFocusableElements = received.querySelectorAll(
                'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
              ).length > 0

              const pass = hasAriaLabel || hasRole || hasFocusableElements
              
              return {
                message: () => 'Expected element to be accessible',
                pass
              }
            }
          }
        }
      }

      usePlugin(customAssertionPlugin)

      // Test custom assertions
      const testObj1 = { name: 'test', value: 42 }
      const testObj2 = { value: 100, name: 'example' }

      expect(config.customAssertions).toBeDefined()
      expect(config.customAssertions.toHaveCorrectStructure(testObj1, testObj2).pass).toBe(true)

      // Test with component
      const AccessibilityComponent = {
        template: `
          <div>
            <button aria-label="Test button">Click me</button>
            <input type="text" aria-label="Test input" />
            <div role="banner">Header</div>
          </div>
        `
      }

      const wrapper = await mountWithExpectations(AccessibilityComponent)
      const buttonElement = wrapper.find('button').element
      
      expect(config.customAssertions.toBeAccessible(buttonElement).pass).toBe(true)
      
      wrapper.unmount()
    })

    it('should support chainable custom assertions', async () => {
      const chainableAssertionPlugin = {
        name: 'chainable-assertions',
        install(config) {
          config.chainableAssertions = true
        }
      }

      usePlugin(chainableAssertionPlugin)

      const ChainableComponent = {
        template: `
          <div class="wrapper" data-testid="main">
            <h1 class="title">{{ title }}</h1>
            <p class="content">{{ content }}</p>
            <button @click="increment">Count: {{ count }}</button>
          </div>
        `,
        data() {
          return {
            title: 'Chainable Test',
            content: 'Testing chainable assertions',
            count: 0
          }
        },
        methods: {
          increment() {
            this.count++
          }
        }
      }

      const wrapper = await mountWithExpectations(ChainableComponent)

      // Test that our enhanced assertions are chainable
      wrapper.should
        .render()
        .contain('Chainable Test')
        .contain('Testing chainable assertions')
        .haveClass('wrapper')

      await wrapper.interact.click('button')
      
      wrapper.should.contain('Count: 1')

      expect(config.chainableAssertions).toBe(true)
      
      wrapper.unmount()
    })
  })

  describe('Custom Mount Enhancements', () => {
    it('should support custom mounting strategies', async () => {
      const customMountPlugin = {
        name: 'custom-mount-strategy',
        
        install(config) {
          config.customMountStrategies = ['isolated', 'shared-context', 'performance-optimized']
        },

        beforeMount(component, options) {
          if (options.strategy === 'isolated') {
            options.global = options.global || {}
            options.global.config = options.global.config || {}
            options.global.config.warnHandler = () => {} // Suppress warnings in isolated mode
          }
          
          if (options.strategy === 'performance-optimized') {
            options.shallow = true
            options.stubs = { ...options.stubs, '*': true } // Stub all child components
          }
          
          return { component, options }
        },

        afterMount(wrapper, options) {
          if (options.strategy) {
            wrapper._mountStrategy = options.strategy
          }
          return wrapper
        }
      }

      usePlugin(customMountPlugin)

      const TestComponent = {
        template: `
          <div>
            <ChildComponent />
            <p>Parent component</p>
          </div>
        `,
        components: {
          ChildComponent: {
            template: '<div>Child component</div>'
          }
        }
      }

      // Test isolated strategy
      const isolatedWrapper = await mountWithExpectations(TestComponent, {
        strategy: 'isolated'
      })
      expect(isolatedWrapper._mountStrategy).toBe('isolated')

      // Test performance optimized strategy
      const perfWrapper = await mountWithExpectations(TestComponent, {
        strategy: 'performance-optimized'
      })
      expect(perfWrapper._mountStrategy).toBe('performance-optimized')

      isolatedWrapper.unmount()
      perfWrapper.unmount()
    })

    it('should support custom component wrappers', async () => {
      const wrapperPlugin = {
        name: 'custom-wrapper',
        
        install(config) {
          config.customWrappers = {
            'test-harness': (component) => ({
              template: `
                <div class="test-harness" data-testid="harness">
                  <div class="test-metadata">
                    <span>Component: {{ componentName }}</span>
                    <span>Test ID: {{ testId }}</span>
                  </div>
                  <div class="test-component">
                    <component :is="wrappedComponent" v-bind="$attrs" />
                  </div>
                </div>
              `,
              props: ['componentName', 'testId'],
              data() {
                return {
                  wrappedComponent: component
                }
              }
            })
          }
        }
      }

      usePlugin(wrapperPlugin)

      const SimpleComponent = {
        template: '<div>Simple test component</div>'
      }

      // Use custom wrapper
      const wrapperComponent = config.customWrappers['test-harness'](SimpleComponent)
      
      const wrapper = await mountWithExpectations(wrapperComponent, {
        props: {
          componentName: 'SimpleComponent',
          testId: 'test-001'
        }
      })

      wrapper.should
        .render()
        .contain('Component: SimpleComponent')
        .contain('Test ID: test-001')
        .contain('Simple test component')

      expect(wrapper.find('[data-testid="harness"]').exists()).toBe(true)

      wrapper.unmount()
    })
  })

  describe('Scenario Builder Extensions', () => {
    it('should support custom scenario steps', () => {
      const customStepsPlugin = {
        name: 'custom-scenario-steps',
        
        install(config) {
          config.customSteps = {
            database: {
              seed: async (context, data) => {
                context.database = context.database || {}
                context.database.seeded = data
              },
              
              query: async (context, query) => {
                context.database = context.database || {}
                context.database.lastQuery = query
                return { results: ['mock', 'data'] }
              },
              
              cleanup: async (context) => {
                context.database = {}
              }
            },
            
            api: {
              mock: (context, endpoint, response) => {
                context.api = context.api || {}
                context.api.mocks = context.api.mocks || {}
                context.api.mocks[endpoint] = response
              },
              
              call: async (context, endpoint, payload) => {
                context.api = context.api || {}
                const mockResponse = context.api.mocks?.[endpoint]
                if (mockResponse) {
                  return mockResponse
                }
                throw new Error(`No mock found for ${endpoint}`)
              }
            }
          }
        }
      }

      usePlugin(customStepsPlugin)

      const testScenario = scenario('Custom steps test scenario')

      // Test custom database steps
      testScenario
        .addStep('given', 'database is seeded', async (context) => {
          await config.customSteps.database.seed(context, [
            { id: 1, name: 'User 1' },
            { id: 2, name: 'User 2' }
          ])
        })
        .addStep('when', 'querying users', async (context) => {
          const results = await config.customSteps.database.query(context, 'SELECT * FROM users')
          context.queryResults = results
        })
        .addStep('then', 'results should be returned', (context) => {
          expect(context.database.seeded).toHaveLength(2)
          expect(context.database.lastQuery).toBe('SELECT * FROM users')
          expect(context.queryResults.results).toEqual(['mock', 'data'])
        })

      expect(config.customSteps).toBeDefined()
      expect(config.customSteps.database.seed).toBeTypeOf('function')
      expect(config.customSteps.api.mock).toBeTypeOf('function')
    })

    it('should support custom scenario templates', () => {
      const scenarioTemplatePlugin = {
        name: 'scenario-templates',
        
        install(config) {
          config.scenarioTemplates = {
            'crud-operations': (entityName) => {
              const template = scenario(`CRUD operations for ${entityName}`)
              
              template
                .addStep('given', `${entityName} database is empty`, (context) => {
                  context.data.entities = []
                })
                .addStep('when', `creating a new ${entityName}`, (context) => {
                  const newEntity = { id: Date.now(), name: `Test ${entityName}` }
                  context.data.entities.push(newEntity)
                  context.data.currentEntity = newEntity
                })
                .addStep('then', `${entityName} should be created`, (context) => {
                  expect(context.data.entities).toHaveLength(1)
                  expect(context.data.currentEntity).toBeDefined()
                })
                .addStep('when', `updating the ${entityName}`, (context) => {
                  context.data.currentEntity.name = `Updated ${entityName}`
                })
                .addStep('then', `${entityName} should be updated`, (context) => {
                  expect(context.data.currentEntity.name).toBe(`Updated ${entityName}`)
                })
                .addStep('when', `deleting the ${entityName}`, (context) => {
                  context.data.entities = context.data.entities.filter(
                    e => e.id !== context.data.currentEntity.id
                  )
                })
                .addStep('then', `${entityName} should be deleted`, (context) => {
                  expect(context.data.entities).toHaveLength(0)
                })

              return template
            },

            'authentication-flow': () => {
              const template = scenario('User authentication flow')
              
              template
                .addStep('given', 'user is not authenticated', (context) => {
                  context.user.authenticated = false
                })
                .addStep('when', 'user provides valid credentials', (context) => {
                  context.user.credentials = { username: 'test', password: 'password' }
                })
                .addStep('then', 'user should be authenticated', (context) => {
                  context.user.authenticated = true
                  expect(context.user.authenticated).toBe(true)
                })

              return template
            }
          }
        }
      }

      usePlugin(scenarioTemplatePlugin)

      // Test CRUD template
      const userCrudScenario = config.scenarioTemplates['crud-operations']('User')
      expect(userCrudScenario.description).toBe('CRUD operations for User')
      expect(userCrudScenario.steps).toHaveLength(6)
      
      // Test authentication template
      const authScenario = config.scenarioTemplates['authentication-flow']()
      expect(authScenario.description).toBe('User authentication flow')
      expect(authScenario.steps).toHaveLength(3)
    })
  })

  describe('Middleware and Hooks System', () => {
    it('should support middleware registration and execution', async () => {
      let middlewareExecutionOrder = []

      const loggingMiddleware = (context, next) => {
        middlewareExecutionOrder.push('logging-start')
        const result = next(context)
        middlewareExecutionOrder.push('logging-end')
        return result
      }

      const validationMiddleware = (context, next) => {
        middlewareExecutionOrder.push('validation-start')
        if (!context.validated) {
          context.validated = true
        }
        const result = next(context)
        middlewareExecutionOrder.push('validation-end')
        return result
      }

      const transformMiddleware = (context, next) => {
        middlewareExecutionOrder.push('transform-start')
        context.transformed = true
        const result = next(context)
        middlewareExecutionOrder.push('transform-end')
        return result
      }

      // Register middleware
      pluginSystem.use(loggingMiddleware)
      pluginSystem.use(validationMiddleware)
      pluginSystem.use(transformMiddleware)

      // Apply middleware
      const testContext = { test: true }
      const result = await pluginSystem.applyMiddleware(testContext)

      expect(result.validated).toBe(true)
      expect(result.transformed).toBe(true)
      
      // Verify execution order (middleware executes in LIFO order for start, FIFO for end)
      expect(middlewareExecutionOrder).toEqual([
        'transform-start',
        'validation-start', 
        'logging-start',
        'logging-end',
        'validation-end',
        'transform-end'
      ])
    })

    it('should support lifecycle hooks', async () => {
      let hookResults = []

      // Register hooks for different lifecycle events
      pluginSystem.hook('before:mount', async (data) => {
        hookResults.push('before-mount')
        data.beforeMountCalled = true
        return data
      })

      pluginSystem.hook('after:mount', async (data) => {
        hookResults.push('after-mount')
        data.afterMountCalled = true
        return data
      })

      pluginSystem.hook('before:test', async (data) => {
        hookResults.push('before-test')
        data.beforeTestCalled = true
        return data
      })

      pluginSystem.hook('after:test', async (data) => {
        hookResults.push('after-test')
        data.afterTestCalled = true
        return data
      })

      // Test hook execution
      let testData = { componentName: 'TestComponent' }
      
      testData = await pluginSystem.callHook('before:mount', testData)
      testData = await pluginSystem.callHook('after:mount', testData)
      testData = await pluginSystem.callHook('before:test', testData)
      testData = await pluginSystem.callHook('after:test', testData)

      expect(hookResults).toEqual(['before-mount', 'after-mount', 'before-test', 'after-test'])
      expect(testData.beforeMountCalled).toBe(true)
      expect(testData.afterMountCalled).toBe(true)
      expect(testData.beforeTestCalled).toBe(true)
      expect(testData.afterTestCalled).toBe(true)
    })

    it('should support conditional middleware and hooks', async () => {
      let conditionalExecutions = []

      const conditionalMiddleware = (context, next) => {
        if (context.environment === 'development') {
          conditionalExecutions.push('dev-middleware')
          context.developmentMode = true
        }
        return next(context)
      }

      const productionHook = async (data) => {
        if (data.environment === 'production') {
          conditionalExecutions.push('prod-hook')
          data.productionOptimizations = true
        }
        return data
      }

      pluginSystem.use(conditionalMiddleware)
      pluginSystem.hook('environment:check', productionHook)

      // Test development environment
      const devContext = { environment: 'development' }
      const devResult = await pluginSystem.applyMiddleware(devContext)
      expect(devResult.developmentMode).toBe(true)

      // Test production environment
      const prodData = { environment: 'production' }
      const prodResult = await pluginSystem.callHook('environment:check', prodData)
      expect(prodResult.productionOptimizations).toBe(true)

      expect(conditionalExecutions).toContain('dev-middleware')
      expect(conditionalExecutions).toContain('prod-hook')
    })
  })

  describe('Framework Configuration Extensions', () => {
    it('should support dynamic configuration modification', () => {
      const dynamicConfigPlugin = {
        name: 'dynamic-config',
        
        install(config) {
          config.dynamic = {
            timeout: 30000,
            retries: 3,
            parallel: true
          }
        },

        modifyConfig(config, options) {
          if (options.performance === 'high') {
            config.dynamic.parallel = true
            config.dynamic.timeout = 60000
          }
          
          if (options.reliability === 'high') {
            config.dynamic.retries = 5
          }

          if (options.environment === 'ci') {
            config.dynamic.timeout = 120000
            config.dynamic.parallel = false
          }

          return config
        }
      }

      usePlugin(dynamicConfigPlugin)

      // Test configuration modifications
      const highPerfConfig = dynamicConfigPlugin.modifyConfig(config, { performance: 'high' })
      expect(highPerfConfig.dynamic.parallel).toBe(true)
      expect(highPerfConfig.dynamic.timeout).toBe(60000)

      const highReliabilityConfig = dynamicConfigPlugin.modifyConfig(config, { reliability: 'high' })
      expect(highReliabilityConfig.dynamic.retries).toBe(5)

      const ciConfig = dynamicConfigPlugin.modifyConfig(config, { environment: 'ci' })
      expect(ciConfig.dynamic.timeout).toBe(120000)
      expect(ciConfig.dynamic.parallel).toBe(false)
    })

    it('should support plugin configuration validation', () => {
      const validationPlugin = {
        name: 'config-validation',
        
        schema: {
          timeout: { type: 'number', min: 1000, max: 300000 },
          retries: { type: 'number', min: 0, max: 10 },
          parallel: { type: 'boolean' },
          required: ['timeout']
        },

        validate(config) {
          const errors = []
          
          if (typeof config.timeout !== 'number') {
            errors.push('timeout must be a number')
          } else if (config.timeout < 1000 || config.timeout > 300000) {
            errors.push('timeout must be between 1000 and 300000')
          }
          
          if (config.retries !== undefined) {
            if (typeof config.retries !== 'number' || config.retries < 0 || config.retries > 10) {
              errors.push('retries must be a number between 0 and 10')
            }
          }

          return {
            valid: errors.length === 0,
            errors
          }
        },

        install(config) {
          const validation = this.validate(config)
          if (!validation.valid) {
            throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`)
          }
          
          config.validated = true
        }
      }

      // Test valid configuration
      const validConfig = { ...config, timeout: 30000, retries: 3, parallel: true }
      expect(() => validationPlugin.install(validConfig)).not.toThrow()

      // Test invalid configuration
      const invalidConfig = { ...config, timeout: 500, retries: 15 }
      expect(() => validationPlugin.install(invalidConfig)).toThrow()
    })
  })

  describe('Custom Test Utilities', () => {
    it('should support custom test utility registration', () => {
      const customUtilsPlugin = {
        name: 'custom-test-utils',
        
        install(config) {
          config.customUtils = {
            async waitForCondition(condition, timeout = 5000, interval = 100) {
              const start = Date.now()
              while (Date.now() - start < timeout) {
                if (await condition()) {
                  return true
                }
                await new Promise(resolve => setTimeout(resolve, interval))
              }
              throw new Error(`Condition not met within ${timeout}ms`)
            },

            async simulateSlowNetwork(delay = 2000) {
              await new Promise(resolve => setTimeout(resolve, delay))
            },

            mockLocalStorage() {
              const store = new Map()
              return {
                getItem: (key) => store.get(key) || null,
                setItem: (key, value) => store.set(key, value),
                removeItem: (key) => store.delete(key),
                clear: () => store.clear(),
                get length() { return store.size }
              }
            },

            generateTestData(type, count = 10) {
              const generators = {
                users: () => Array.from({ length: count }, (_, i) => ({
                  id: i + 1,
                  name: `User ${i + 1}`,
                  email: `user${i + 1}@example.com`
                })),
                posts: () => Array.from({ length: count }, (_, i) => ({
                  id: i + 1,
                  title: `Post ${i + 1}`,
                  content: `Content for post ${i + 1}`,
                  authorId: Math.floor(Math.random() * 5) + 1
                }))
              }
              
              return generators[type] ? generators[type]() : []
            }
          }
        }
      }

      usePlugin(customUtilsPlugin)

      // Test custom utilities
      expect(config.customUtils).toBeDefined()
      expect(config.customUtils.waitForCondition).toBeTypeOf('function')
      expect(config.customUtils.simulateSlowNetwork).toBeTypeOf('function')
      expect(config.customUtils.mockLocalStorage).toBeTypeOf('function')
      expect(config.customUtils.generateTestData).toBeTypeOf('function')

      // Test data generation
      const testUsers = config.customUtils.generateTestData('users', 5)
      expect(testUsers).toHaveLength(5)
      expect(testUsers[0]).toHaveProperty('id', 1)
      expect(testUsers[0]).toHaveProperty('name', 'User 1')
      expect(testUsers[0]).toHaveProperty('email', 'user1@example.com')

      // Test localStorage mock
      const mockStorage = config.customUtils.mockLocalStorage()
      mockStorage.setItem('test', 'value')
      expect(mockStorage.getItem('test')).toBe('value')
      expect(mockStorage.length).toBe(1)
    })

    it('should support custom matcher extensions', () => {
      const customMatchersPlugin = {
        name: 'custom-matchers',
        
        install(config) {
          config.customMatchers = {
            toBeValidEmail: (received) => {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
              const pass = emailRegex.test(received)
              
              return {
                message: () => `Expected ${received} ${pass ? 'not ' : ''}to be a valid email`,
                pass
              }
            },

            toBeWithinRange: (received, min, max) => {
              const pass = received >= min && received <= max
              
              return {
                message: () => `Expected ${received} to be within range ${min}-${max}`,
                pass
              }
            },

            toHaveBeenCalledWithObject: (received, expectedObject) => {
              if (!received.mock || !received.mock.calls) {
                throw new Error('toHaveBeenCalledWithObject must be used on a mock function')
              }

              const pass = received.mock.calls.some(call => 
                call.some(arg => 
                  typeof arg === 'object' && 
                  Object.keys(expectedObject).every(key => arg[key] === expectedObject[key])
                )
              )

              return {
                message: () => `Expected mock to have been called with object matching ${JSON.stringify(expectedObject)}`,
                pass
              }
            }
          }
        }
      }

      usePlugin(customMatchersPlugin)

      // Test custom matchers
      expect(config.customMatchers.toBeValidEmail('test@example.com').pass).toBe(true)
      expect(config.customMatchers.toBeValidEmail('invalid-email').pass).toBe(false)

      expect(config.customMatchers.toBeWithinRange(5, 1, 10).pass).toBe(true)
      expect(config.customMatchers.toBeWithinRange(15, 1, 10).pass).toBe(false)

      // Test object matcher
      const mockFn = vi.fn()
      mockFn({ name: 'test', value: 42 })
      
      expect(config.customMatchers.toHaveBeenCalledWithObject(mockFn, { name: 'test' }).pass).toBe(true)
      expect(config.customMatchers.toHaveBeenCalledWithObject(mockFn, { name: 'other' }).pass).toBe(false)
    })
  })

  describe('Framework Extension Ecosystem', () => {
    it('should demonstrate real-world plugin composition', async () => {
      // Create a comprehensive plugin that combines multiple features
      const comprehensivePlugin = {
        name: 'comprehensive-test-plugin',
        version: '2.0.0',
        
        install(config) {
          // Add multiple features
          this.installPerformanceFeatures(config)
          this.installAccessibilityFeatures(config)
          this.installDataTestingFeatures(config)
        },

        installPerformanceFeatures(config) {
          config.performance = {
            measureRenderTime: true,
            measureMemoryUsage: true,
            benchmarkThreshold: 100 // ms
          }
        },

        installAccessibilityFeatures(config) {
          config.accessibility = {
            autoCheckA11y: true,
            enforceAriaLabels: true,
            checkColorContrast: true
          }
        },

        installDataTestingFeatures(config) {
          config.dataGeneration = {
            enableMockData: true,
            seedDatabase: true,
            resetBetweenTests: true
          }
        },

        beforeMount(component, options) {
          // Performance measurement
          options._performanceStart = performance.now()
          return { component, options }
        },

        afterMount(wrapper, options) {
          // Add performance data
          if (options._performanceStart) {
            wrapper._renderTime = performance.now() - options._performanceStart
          }

          // Add accessibility helpers
          wrapper.checkAccessibility = () => {
            const element = wrapper.element
            return {
              hasAriaLabels: !!element.querySelector('[aria-label]'),
              hasRoles: !!element.querySelector('[role]'),
              hasFocusableElements: element.querySelectorAll('button, input, a, [tabindex]').length > 0
            }
          }

          return wrapper
        }
      }

      usePlugin(comprehensivePlugin)

      // Test the comprehensive plugin
      const ComprehensiveTestComponent = {
        template: `
          <div>
            <button aria-label="Test button" role="button">Click me</button>
            <input type="text" aria-label="Test input" />
            <a href="#" tabindex="0">Test link</a>
          </div>
        `
      }

      const wrapper = await mountWithExpectations(ComprehensiveTestComponent)

      // Test performance features
      expect(wrapper._renderTime).toBeDefined()
      expect(typeof wrapper._renderTime).toBe('number')
      expect(wrapper._renderTime).toBeGreaterThan(0)

      // Test accessibility features
      const a11yCheck = wrapper.checkAccessibility()
      expect(a11yCheck.hasAriaLabels).toBe(true)
      expect(a11yCheck.hasRoles).toBe(true)
      expect(a11yCheck.hasFocusableElements).toBe(true)

      // Test configuration
      expect(config.performance).toBeDefined()
      expect(config.accessibility).toBeDefined()
      expect(config.dataGeneration).toBeDefined()

      wrapper.unmount()
    })

    it('should support plugin ecosystem compatibility', () => {
      // Test that multiple plugins can coexist
      const plugin1 = {
        name: 'ecosystem-plugin-1',
        provides: ['feature-a'],
        install(config) { config.featureA = true }
      }

      const plugin2 = {
        name: 'ecosystem-plugin-2',
        provides: ['feature-b'],
        requires: ['feature-a'],
        install(config) {
          if (!config.featureA) {
            throw new Error('Required feature-a not available')
          }
          config.featureB = true
        }
      }

      const plugin3 = {
        name: 'ecosystem-plugin-3',
        provides: ['feature-c'],
        install(config) { config.featureC = true }
      }

      // Install plugins in order
      usePlugin(plugin1)
      usePlugin(plugin3)
      usePlugin(plugin2)

      expect(config.featureA).toBe(true)
      expect(config.featureB).toBe(true)
      expect(config.featureC).toBe(true)

      // Verify all plugins are registered
      expect(pluginSystem.plugins.map(p => p.name)).toContain('ecosystem-plugin-1')
      expect(pluginSystem.plugins.map(p => p.name)).toContain('ecosystem-plugin-2')
      expect(pluginSystem.plugins.map(p => p.name)).toContain('ecosystem-plugin-3')
    })
  })
})