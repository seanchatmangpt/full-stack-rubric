/**
 * @fileoverview BDD Test Validation
 * @description Validates that BDD cucumber infrastructure is properly set up
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TypingPage from '../app/pages/typing.vue'

describe('BDD Cucumber Test Infrastructure', () => {
  let wrapper

  beforeEach(() => {
    // Mock console to prevent noise
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
      wrapper = null
    }
    vi.restoreAllMocks()
  })

  describe('Feature Files', () => {
    it('should have typing tutor feature file', async () => {
      const fs = await import('fs')
      const path = await import('path')
      
      const featurePath = path.resolve(process.cwd(), 'tests/features/typing-tutor.feature')
      expect(fs.existsSync(featurePath)).toBe(true)
    })

    it('should have performance feature file', async () => {
      const fs = await import('fs')
      const path = await import('path')
      
      const featurePath = path.resolve(process.cwd(), 'tests/features/performance.feature')
      expect(fs.existsSync(featurePath)).toBe(true)
    })
  })

  describe('Step Definitions', () => {
    it('should have typing tutor step definitions', async () => {
      const fs = await import('fs')
      const path = await import('path')
      
      const stepsPath = path.resolve(process.cwd(), 'tests/steps/typing-tutor.steps.js')
      expect(fs.existsSync(stepsPath)).toBe(true)
    })

    it('should have performance step definitions', async () => {
      const fs = await import('fs')
      const path = await import('path')
      
      const stepsPath = path.resolve(process.cwd(), 'tests/steps/performance.steps.js')
      expect(fs.existsSync(stepsPath)).toBe(true)
    })
  })

  describe('Test Environment Setup', () => {
    it('should have JSDOM environment configured', () => {
      expect(global.document).toBeDefined()
      expect(global.window).toBeDefined()
      expect(global.localStorage).toBeDefined()
    })

    it('should have Vue test utils working', () => {
      wrapper = mount(TypingPage, {
        global: {
          stubs: {
            UButton: { template: '<button><slot /></button>' },
            UBadge: { template: '<span><slot /></span>' },
            UCard: { template: '<div><slot /></div>' },
            UModal: { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.vm).toBeDefined()
    })

    it('should have typing page component mounted', () => {
      wrapper = mount(TypingPage, {
        global: {
          stubs: {
            UButton: { template: '<button><slot /></button>' },
            UBadge: { template: '<span><slot /></span>' },
            UCard: { template: '<div><slot /></div>' },
            UModal: { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.vm.wpm).toBe(0)
      expect(wrapper.vm.accuracy).toBe(100)
      expect(wrapper.vm.errors).toBe(0)
    })
  })

  describe('Test Utilities', () => {
    it('should have typing simulation utilities', async () => {
      const fs = await import('fs')
      const path = await import('path')
      
      const utilsPath = path.resolve(process.cwd(), 'tests/utils/typing-simulator.js')
      expect(fs.existsSync(utilsPath)).toBe(true)
    })

    it('should have DOM setup utilities', async () => {
      const fs = await import('fs')
      const path = await import('path')
      
      const setupPath = path.resolve(process.cwd(), 'tests/setup/dom-setup.js')
      expect(fs.existsSync(setupPath)).toBe(true)
    })

    it('should have global setup utilities', async () => {
      const fs = await import('fs')
      const path = await import('path')
      
      const setupPath = path.resolve(process.cwd(), 'tests/setup/global-setup.js')
      expect(fs.existsSync(setupPath)).toBe(true)
    })
  })

  describe('Test Commands', () => {
    it('should have test commands configured in package.json', async () => {
      const fs = await import('fs')
      const path = await import('path')
      
      const packagePath = path.resolve(process.cwd(), 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
      
      expect(packageJson.scripts).toHaveProperty('test')
      expect(packageJson.scripts).toHaveProperty('test:bdd')
      expect(packageJson.scripts).toHaveProperty('test:watch')
      expect(packageJson.scripts).toHaveProperty('test:coverage')
    })
  })

  describe('Dependencies', () => {
    it('should have vitest-cucumber dependency', async () => {
      const fs = await import('fs')
      const path = await import('path')
      
      const packagePath = path.resolve(process.cwd(), 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
      
      expect(packageJson.devDependencies).toHaveProperty('@amiceli/vitest-cucumber')
    })

    it('should have vue test utils dependency', async () => {
      const fs = await import('fs')
      const path = await import('path')
      
      const packagePath = path.resolve(process.cwd(), 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
      
      expect(packageJson.devDependencies).toHaveProperty('@vue/test-utils')
    })
  })
})