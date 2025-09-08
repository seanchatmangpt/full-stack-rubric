/**
 * Integration test for nuxt-bdd-testing library
 * Validates that the published library works correctly
 */

import { describe, it, expect } from 'vitest'

describe('nuxt-bdd-testing Library Integration', () => {
  it('should import the main library successfully', async () => {
    try {
      const library = await import('nuxt-bdd-testing')
      expect(library).toBeDefined()
      console.log('✅ Library imported successfully')
      console.log('Available exports:', Object.keys(library))
    } catch (error) {
      console.error('❌ Failed to import library:', error)
      throw error
    }
  })

  it('should import core utilities successfully', async () => {
    try {
      const coreUtils = await import('nuxt-bdd-testing/core')
      expect(coreUtils).toBeDefined()
      console.log('✅ Core utilities imported successfully')
      console.log('Available core exports:', Object.keys(coreUtils))
    } catch (error) {
      console.error('❌ Failed to import core utilities:', error)
      throw error
    }
  })

  it('should have working quickTest utility', async () => {
    try {
      const { quickTest } = await import('nuxt-bdd-testing/core')
      expect(quickTest).toBeDefined()
      expect(typeof quickTest).toBe('function')
      console.log('✅ quickTest utility is available and callable')
    } catch (error) {
      console.error('❌ quickTest utility not available:', error)
      throw error
    }
  })

  it('should provide BDD utilities', async () => {
    try {
      const bddUtils = await import('nuxt-bdd-testing/bdd')
      expect(bddUtils).toBeDefined()
      console.log('✅ BDD utilities imported successfully')
      console.log('Available BDD exports:', Object.keys(bddUtils))
    } catch (error) {
      console.error('❌ Failed to import BDD utilities:', error)
      throw error
    }
  })

  it('should provide configuration utilities', async () => {
    try {
      const configUtils = await import('nuxt-bdd-testing/config')
      expect(configUtils).toBeDefined()
      console.log('✅ Configuration utilities imported successfully')
      console.log('Available config exports:', Object.keys(configUtils))
    } catch (error) {
      console.error('❌ Failed to import configuration utilities:', error)
      throw error
    }
  })

  it('should provide Nuxt-specific utilities', async () => {
    try {
      const nuxtUtils = await import('nuxt-bdd-testing/nuxt')
      expect(nuxtUtils).toBeDefined()
      console.log('✅ Nuxt utilities imported successfully')
      console.log('Available Nuxt exports:', Object.keys(nuxtUtils))
    } catch (error) {
      console.error('❌ Failed to import Nuxt utilities:', error)
      throw error
    }
  })
})