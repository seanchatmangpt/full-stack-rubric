/**
 * Validation test for published nuxt-bdd-testing library
 * Tests only the main library import to avoid sub-module issues
 */

import { describe, it, expect } from 'vitest'

describe('nuxt-bdd-testing Library Validation', () => {
  it('should import the main library successfully', async () => {
    const library = await import('nuxt-bdd-testing')
    expect(library).toBeDefined()
    console.log('✅ Library imported successfully')
    console.log('Available exports:', Object.keys(library))
  })

  it('should have the expected core utilities', async () => {
    const library = await import('nuxt-bdd-testing')
    
    // Test quickTest utility exists
    expect(library.quickTest).toBeDefined()
    expect(typeof library.quickTest).toBe('function')
    console.log('✅ quickTest utility is available')
    
    // Test BDDTestRunner exists
    expect(library.BDDTestRunner).toBeDefined()
    expect(typeof library.BDDTestRunner).toBe('function')
    console.log('✅ BDDTestRunner class is available')
    
    // Test configuration utilities exist
    expect(library.defineConfig).toBeDefined()
    expect(typeof library.defineConfig).toBe('function')
    console.log('✅ defineConfig utility is available')
  })

  it('should be able to create a quickTest instance', async () => {
    const { quickTest } = await import('nuxt-bdd-testing')
    
    const result = quickTest('Sample test', () => {
      return { status: 'passed', message: 'Test executed successfully' }
    })
    
    expect(result).toBeDefined()
    expect(result.status).toBe('passed')
    console.log('✅ quickTest executed successfully:', result.message)
  })

  it('should be able to instantiate BDDTestRunner', async () => {
    const { BDDTestRunner } = await import('nuxt-bdd-testing')
    
    const config = {
      featuresDir: './tests/features',
      stepsDir: './tests/steps',
      autoLoad: true
    }
    
    const runner = new BDDTestRunner(config)
    expect(runner).toBeDefined()
    expect(runner.config).toEqual(config)
    console.log('✅ BDDTestRunner instantiated successfully')
  })

  it('should provide working configuration utilities', async () => {
    const { defineConfig } = await import('nuxt-bdd-testing')
    
    const config = defineConfig({
      featuresDir: './features',
      stepsDir: './steps',
      autoLoad: true,
      verbose: true
    })
    
    expect(config).toBeDefined()
    expect(config.featuresDir).toBe('./features')
    expect(config.autoLoad).toBe(true)
    console.log('✅ Configuration utilities working correctly')
  })
})