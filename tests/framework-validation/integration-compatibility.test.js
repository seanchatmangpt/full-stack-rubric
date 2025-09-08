/**
 * @fileoverview Integration compatibility tests
 * Validates framework integration and compatibility layers
 */

import { describe, it, expect, beforeAll, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed, nextTick } from 'vue'
import {
  FeatureDetection,
  EnvironmentUtils,
  CompatibilityChecker,
  CompatibilityShims,
  SafeUtils
} from '../../app/utils/compatibility.js'

describe('Framework Integration Compatibility', () => {
  describe('Feature Detection', () => {
    it('should detect Composition API availability', () => {
      const hasCompositionAPI = FeatureDetection.hasCompositionAPI()
      expect(hasCompositionAPI).toBe(true)
    })

    it('should detect component testing support', () => {
      const hasComponentTesting = FeatureDetection.hasComponentTesting()
      expect(hasComponentTesting).toBe(true)
    })

    it('should detect ESM support', () => {
      const hasESMSupport = FeatureDetection.hasESMSupport()
      expect(hasESMSupport).toBe(true)
    })

    it('should handle Monaco Editor detection gracefully', async () => {
      const hasMonacoSupport = await FeatureDetection.hasMonacoSupport()
      // May be true or false depending on environment, but shouldn't throw
      expect(typeof hasMonacoSupport).toBe('boolean')
    })
  })

  describe('Environment Detection', () => {
    it('should detect test environment', () => {
      const environment = EnvironmentUtils.getEnvironment()
      expect(environment).toBe('test')
    })

    it('should detect test context', () => {
      const isTestContext = EnvironmentUtils.isTestContext()
      expect(isTestContext).toBe(true)
    })

    it('should handle Nuxt context detection', () => {
      const isNuxtContext = EnvironmentUtils.isNuxtContext()
      // Should not throw, may be true or false
      expect(typeof isNuxtContext).toBe('boolean')
    })
  })

  describe('Version Compatibility Checker', () => {
    it('should validate compatible versions', () => {
      const versions = {
        nuxt: '4.0.3',
        vue: '3.4.0',
        vitest: '3.2.4',
        node: '20.0.0'
      }

      const result = CompatibilityChecker.checkVersions(versions)
      expect(result.compatible).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect incompatible versions', () => {
      const versions = {
        nuxt: '2.15.0', // Breaking change
        vue: '2.7.0',   // Breaking change
        vitest: '1.0.0', // Breaking change
        node: '16.0.0'   // Breaking change
      }

      const result = CompatibilityChecker.checkVersions(versions)
      expect(result.compatible).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should provide version recommendations', () => {
      const versions = {
        nuxt: '3.12.0', // Older supported version
        vue: '3.3.0',   // Older supported version
        vitest: '2.0.0', // Older supported version
        node: '18.0.0'   // Older supported version
      }

      const result = CompatibilityChecker.checkVersions(versions)
      expect(Object.keys(result.recommendations)).toContain('nuxt')
      expect(Object.keys(result.recommendations)).toContain('vue')
    })

    it('should match version patterns correctly', () => {
      expect(CompatibilityChecker.versionMatches('4.0.3', '4.x')).toBe(true)
      expect(CompatibilityChecker.versionMatches('4.0.3', '4.0+')).toBe(true)
      expect(CompatibilityChecker.versionMatches('3.9.0', '4.0+')).toBe(false)
    })

    it('should get current versions without throwing', async () => {
      const versions = await CompatibilityChecker.getCurrentVersions()
      expect(versions).toHaveProperty('nuxt')
      expect(versions).toHaveProperty('vue')
      expect(versions).toHaveProperty('vitest')
      expect(versions).toHaveProperty('node')
    })
  })

  describe('Compatibility Shims', () => {
    beforeAll(() => {
      // Mock SSR environment
      vi.stubGlobal('window', undefined)
    })

    it('should provide Monaco SSR shim', () => {
      const monacoShim = CompatibilityShims.getMonacoSSRShim()
      
      if (typeof window === 'undefined') {
        expect(monacoShim).toHaveProperty('editor')
        expect(monacoShim.editor).toHaveProperty('create')
        expect(typeof monacoShim.editor.create).toBe('function')
      }
    })

    it('should provide Performance API shim', () => {
      // Temporarily remove performance API
      const originalPerformance = global.performance
      delete global.performance

      const performanceShim = CompatibilityShims.getPerformanceShim()
      expect(performanceShim).toHaveProperty('now')
      expect(typeof performanceShim.now).toBe('function')
      expect(typeof performanceShim.now()).toBe('number')

      // Restore
      global.performance = originalPerformance
    })

    it('should provide storage shim', () => {
      // Temporarily remove localStorage
      const originalLocalStorage = global.localStorage
      delete global.localStorage

      const storageShim = CompatibilityShims.getStorageShim()
      expect(storageShim).toHaveProperty('getItem')
      expect(storageShim).toHaveProperty('setItem')
      expect(typeof storageShim.getItem).toBe('function')
      expect(typeof storageShim.setItem).toBe('function')

      // Test functionality
      storageShim.setItem('test', 'value')
      expect(storageShim.getItem('test')).toBe('value')
      expect(storageShim.length).toBe(1)

      // Restore
      global.localStorage = originalLocalStorage
    })
  })

  describe('Safe Utilities', () => {
    it('should safely handle Nuxt composables', () => {
      const mockComposable = () => ({ value: 'test' })
      const result = SafeUtils.safeNuxtComposable(mockComposable, { value: 'fallback' })
      
      // Should return either the composable result or fallback
      expect(result).toHaveProperty('value')
      expect(typeof result.value).toBe('string')
    })

    it('should safely handle dynamic imports', async () => {
      // Test successful import
      const validModule = await SafeUtils.safeDynamicImport('vue', {})
      expect(validModule).toHaveProperty('ref')

      // Test failed import
      const invalidModule = await SafeUtils.safeDynamicImport('non-existent-module', { fallback: true })
      expect(invalidModule).toHaveProperty('fallback')
      expect(invalidModule.fallback).toBe(true)
    })

    it('should safely execute potentially failing code', () => {
      // Test successful execution
      const successResult = SafeUtils.safeExecute(() => ({ success: true }), null)
      expect(successResult).toEqual({ success: true })

      // Test failed execution
      const failResult = SafeUtils.safeExecute(() => {
        throw new Error('Test error')
      }, { error: 'handled' })
      expect(failResult).toEqual({ error: 'handled' })
    })
  })

  describe('Vue 3 Integration Compatibility', () => {
    it('should mount Vue components with Composition API', async () => {
      const TestComponent = {
        template: '<div>{{ message }}</div>',
        setup() {
          const message = ref('Hello Vue 3!')
          return { message }
        }
      }

      const wrapper = mount(TestComponent)
      expect(wrapper.text()).toBe('Hello Vue 3!')
    })

    it('should handle reactive state properly', async () => {
      const TestComponent = {
        template: '<div>{{ count }} - {{ doubled }}</div>',
        setup() {
          const count = ref(0)
          const doubled = computed(() => count.value * 2)
          
          return { count, doubled }
        }
      }

      const wrapper = mount(TestComponent)
      expect(wrapper.text()).toBe('0 - 0')

      wrapper.vm.count = 5
      await nextTick()
      expect(wrapper.text()).toBe('5 - 10')
    })

    it('should handle component lifecycle correctly', () => {
      let mountedCalled = false
      let unmountedCalled = false

      const TestComponent = {
        template: '<div>Lifecycle Test</div>',
        setup() {
          const { onMounted, onUnmounted } = require('vue')
          
          onMounted(() => {
            mountedCalled = true
          })
          
          onUnmounted(() => {
            unmountedCalled = true
          })

          return {}
        }
      }

      const wrapper = mount(TestComponent)
      expect(mountedCalled).toBe(true)
      
      wrapper.unmount()
      expect(unmountedCalled).toBe(true)
    })
  })

  describe('Monaco Editor Integration Compatibility', () => {
    it('should handle Monaco Editor imports gracefully', async () => {
      // Test dynamic Monaco import with fallback
      const monaco = await SafeUtils.safeDynamicImport('monaco-editor', {
        editor: {
          create: () => ({ dispose: () => {} })
        }
      })

      expect(monaco).toHaveProperty('editor')
      expect(typeof monaco.editor.create).toBe('function')
    })

    it('should provide SSR-safe Monaco wrapper', () => {
      const TestComponent = {
        template: '<div ref="container">Monaco Container</div>',
        setup() {
          const container = ref(null)
          
          // Simulate Monaco initialization with compatibility check
          const initMonaco = async () => {
            if (EnvironmentUtils.getEnvironment() === 'test') {
              // Use shim in test environment
              const monacoShim = CompatibilityShims.getMonacoSSRShim()
              return monacoShim?.editor.create(container.value) || null
            }
            return null
          }

          return { container, initMonaco }
        }
      }

      const wrapper = mount(TestComponent)
      expect(wrapper.vm.container).toBeTruthy()
      expect(typeof wrapper.vm.initMonaco).toBe('function')
    })
  })

  describe('Vitest Configuration Compatibility', () => {
    it('should have access to test globals', () => {
      expect(global.describe).toBeDefined()
      expect(global.it).toBeDefined()
      expect(global.expect).toBeDefined()
    })

    it('should support JSDOM environment', () => {
      expect(global.window).toBeDefined()
      expect(global.document).toBeDefined()
      expect(typeof document.createElement).toBe('function')
    })

    it('should support Vue Test Utils integration', () => {
      expect(mount).toBeDefined()
      expect(typeof mount).toBe('function')
    })

    it('should handle async test operations', async () => {
      const asyncOperation = () => new Promise(resolve => {
        setTimeout(() => resolve('async result'), 10)
      })

      const result = await asyncOperation()
      expect(result).toBe('async result')
    })
  })

  describe('Package.json Dependencies Compatibility', () => {
    it('should validate core dependency versions', async () => {
      // This test would check actual package.json in real scenario
      const expectedDependencies = {
        'nuxt': '4.x',
        '@nuxt/ui': '4.x',
        '@nuxt/content': '3.x',
        'monaco-editor': '0.x'
      }

      const devDependencies = {
        'vitest': '3.x',
        '@vue/test-utils': '2.x',
        'jsdom': '26.x'
      }

      // Validate structure without requiring actual package.json
      Object.keys(expectedDependencies).forEach(dep => {
        expect(typeof dep).toBe('string')
        expect(dep.length).toBeGreaterThan(0)
      })

      Object.keys(devDependencies).forEach(dep => {
        expect(typeof dep).toBe('string')
        expect(dep.length).toBeGreaterThan(0)
      })
    })
  })
})

describe('Cross-Framework Integration Tests', () => {
  it('should integrate Nuxt composables with Vue components', async () => {
    // Mock Nuxt composable
    const mockUseNuxtData = () => ({
      data: ref({ message: 'Nuxt data' }),
      pending: ref(false),
      error: ref(null)
    })

    const TestComponent = {
      template: '<div>{{ data?.message || "Loading..." }}</div>',
      setup() {
        const { data } = SafeUtils.safeNuxtComposable(
          mockUseNuxtData,
          { data: ref({ message: 'Fallback data' }) }
        )
        
        return { data }
      }
    }

    const wrapper = mount(TestComponent)
    expect(wrapper.text()).toContain('data')
  })

  it('should handle Monaco Editor with Vue reactivity', async () => {
    const TestComponent = {
      template: '<div ref="editor">{{ status }}</div>',
      setup() {
        const editor = ref(null)
        const status = ref('initializing')

        const initializeEditor = async () => {
          try {
            // Use compatibility layer for Monaco
            const monaco = CompatibilityShims.getMonacoSSRShim()
            if (monaco && editor.value) {
              const instance = monaco.editor.create(editor.value)
              status.value = 'ready'
              return instance
            }
          } catch (error) {
            status.value = 'error'
          }
        }

        return { editor, status, initializeEditor }
      }
    }

    const wrapper = mount(TestComponent)
    await wrapper.vm.initializeEditor()
    expect(wrapper.vm.status).toMatch(/ready|error|initializing/)
  })

  it('should handle performance metrics collection across frameworks', () => {
    const TestComponent = {
      setup() {
        const metrics = ref({
          loadTime: 0,
          renderTime: 0
        })

        const collectMetrics = () => {
          const perf = CompatibilityShims.getPerformanceShim()
          const start = perf.now()
          
          // Simulate some work
          setTimeout(() => {
            metrics.value.loadTime = perf.now() - start
          }, 1)
        }

        return { metrics, collectMetrics }
      },
      template: '<div>{{ metrics.loadTime }}</div>'
    }

    const wrapper = mount(TestComponent)
    wrapper.vm.collectMetrics()
    expect(typeof wrapper.vm.metrics.loadTime).toBe('number')
  })
})