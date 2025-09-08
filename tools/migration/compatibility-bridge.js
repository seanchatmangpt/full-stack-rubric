/**
 * Compatibility Bridge for Framework to Library Migration
 * Provides seamless backward compatibility during transition
 */

import { scenario, mount, expect } from '../lib/core/index.js'
import { nuxtHelpers } from '../lib/integrations/nuxt.js'
import { performanceTest, a11yTest, responsiveTest } from '../lib/utilities/index.js'
import { authPlugin, apiPlugin, formPlugin } from '../lib/plugins/index.js'

/**
 * Backward compatible framework class
 * Routes all framework calls to library functions
 */
export class BDDFramework {
  constructor(options = {}) {
    this.options = {
      autoConfig: true,
      nuxtIntegration: true,
      cucumberIntegration: true,
      plugins: [],
      conventions: {},
      nuxtOptions: {},
      verbose: false,
      ...options
    }
    
    this.initialized = false
    this.scenarios = new Map()
    this.plugins = new Map()
    this.config = {}
    
    // Initialize compatibility proxies
    this._initializeProxies()
  }

  /**
   * Initialize the framework (compatibility mode)
   * Maps to library setup functions
   */
  async initialize() {
    if (this.initialized) return this
    
    console.log('🔄 Initializing BDD Framework (Compatibility Mode)...')
    
    try {
      // Load plugins if specified
      await this._loadCompatibilityPlugins()
      
      // Setup global helpers (simulated)
      this._setupGlobalHelpers()
      
      this.initialized = true
      console.log('✅ Framework initialization complete (using library backend)')
      
      return this
    } catch (error) {
      console.error('❌ Framework initialization failed:', error)
      throw error
    }
  }

  /**
   * Create a scenario (compatibility method)
   * Routes to library scenario function
   */
  scenario(description) {
    // Use library scenario function directly
    const libraryScenario = scenario(description)
    
    // Enhance with compatibility methods if needed
    this._enhanceScenario(libraryScenario)
    
    // Store reference for framework compatibility
    this.scenarios.set(description, libraryScenario)
    
    return libraryScenario
  }

  /**
   * Mount component (compatibility method)
   * Routes to library mount function
   */
  async mount(component, options = {}) {
    // Use library mount function directly
    return await mount(component, options)
  }

  /**
   * Get framework configuration (compatibility method)
   */
  getConfig() {
    return { ...this.config }
  }

  /**
   * Add plugin at runtime (compatibility method)
   */
  async addPlugin(plugin) {
    console.warn('⚠️  framework.addPlugin() is deprecated. Use direct plugin imports instead.')
    console.log(`   Import suggestion: import { ${plugin.name} } from '@nuxt-bdd/plugins/${this._getPluginPath(plugin.name)}'`)
    
    // Store plugin for compatibility but don't actually load
    this.plugins.set(plugin.name, plugin)
  }

  /**
   * Get loaded plugins (compatibility method)
   */
  getPlugins() {
    return new Map(this.plugins)
  }

  /**
   * Get registered scenarios (compatibility method)
   */
  getScenarios() {
    return new Map(this.scenarios)
  }

  /**
   * Cleanup resources (compatibility method)
   */
  async cleanup() {
    console.log('🧹 Cleaning up framework resources...')
    
    // Clear scenarios
    this.scenarios.clear()
    
    this.initialized = false
    console.log('✅ Framework cleanup complete')
  }

  /**
   * Initialize compatibility proxies
   * @private
   */
  _initializeProxies() {
    // Create proxy for framework-style method access
    this.given = this._createBuilderProxy('given')
    this.when = this._createBuilderProxy('when')
    this.then = this._createBuilderProxy('then')
  }

  /**
   * Create proxy for builder methods
   * @private
   */
  _createBuilderProxy(builderType) {
    return new Proxy({}, {
      get: (target, property) => {
        console.warn(`⚠️  framework.${builderType}.${property} is deprecated. Use scenario().${builderType}.${property} instead.`)
        
        return (...args) => {
          // Create a temporary scenario for the call
          const tempScenario = scenario(`Auto-generated from framework.${builderType}.${property}`)
          return tempScenario[builderType][property](...args)
        }
      }
    })
  }

  /**
   * Load compatibility plugins
   * @private
   */
  async _loadCompatibilityPlugins() {
    // Map framework plugins to library imports
    const pluginMapping = {
      'authPlugin': authPlugin,
      'apiPlugin': apiPlugin,
      'formPlugin': formPlugin
    }

    for (const pluginName of this.options.plugins) {
      if (typeof pluginName === 'string' && pluginMapping[pluginName]) {
        this.plugins.set(pluginName, pluginMapping[pluginName])
        
        console.log(`📦 Loaded plugin: ${pluginName} (compatibility mode)`)
        console.log(`   Migration: import { ${pluginName} } from '@nuxt-bdd/plugins/${this._getPluginPath(pluginName)}'`)
      }
    }
  }

  /**
   * Setup global helpers (compatibility simulation)
   * @private
   */
  _setupGlobalHelpers() {
    // Simulate framework-style global helpers
    this.helpers = {
      performance: performanceTest,
      a11y: a11yTest,
      responsive: responsiveTest,
      nuxt: nuxtHelpers
    }
    
    console.log('🔧 Global helpers setup (compatibility mode)')
    console.log('   Migration: Import helpers directly from @nuxt-bdd/utilities')
  }

  /**
   * Enhance scenario with compatibility methods
   * @private
   */
  _enhanceScenario(libraryScenario) {
    // Add framework property for backward compatibility
    libraryScenario.framework = this
    
    // Add helpers method for compatibility
    if (!libraryScenario.helpers) {
      libraryScenario.helpers = () => this.helpers
    }
  }

  /**
   * Get plugin path for migration suggestions
   * @private
   */
  _getPluginPath(pluginName) {
    const pathMapping = {
      'authPlugin': 'auth',
      'apiPlugin': 'api', 
      'formPlugin': 'forms',
      'visualPlugin': 'visual'
    }
    
    return pathMapping[pluginName] || 'custom'
  }
}

/**
 * Global framework instance for compatibility
 */
let globalCompatibilityFramework = null

/**
 * Create or get global framework instance (compatibility mode)
 */
export async function createFramework(options = {}) {
  console.warn('⚠️  createFramework() is deprecated. Use direct library imports instead:')
  console.log('   import { scenario, mount, expect } from "@nuxt-bdd/core"')
  console.log('   import { nuxtHelpers } from "@nuxt-bdd/integrations/nuxt"')
  
  if (!globalCompatibilityFramework || !globalCompatibilityFramework.initialized) {
    globalCompatibilityFramework = new BDDFramework(options)
    await globalCompatibilityFramework.initialize()
  }
  return globalCompatibilityFramework
}

/**
 * Quick setup function for zero-config usage (compatibility mode)
 */
export async function setup(options = {}) {
  console.warn('⚠️  setup() is deprecated. Use direct library imports instead:')
  console.log('   import { scenario, mount, expect } from "@nuxt-bdd/core"')
  
  const framework = await createFramework(options)
  
  return {
    scenario: (description) => framework.scenario(description),
    given: (description) => framework.scenario(description).given,
    when: (description) => framework.scenario(description).when,
    then: (description) => framework.scenario(description).then,
    mount: (component, options) => framework.mount(component, options),
    helpers: framework.helpers,
    framework,
    config: framework.getConfig()
  }
}

/**
 * Convenience functions for common usage patterns (compatibility)
 */

export async function setupNuxtBDD(options = {}) {
  console.warn('⚠️  setupNuxtBDD() is deprecated. Use direct library imports instead:')
  console.log('   import { scenario, mount } from "@nuxt-bdd/core"')
  console.log('   import { nuxtHelpers } from "@nuxt-bdd/integrations/nuxt"')
  
  return setup({
    autoConfig: true,
    nuxtIntegration: true,
    cucumberIntegration: false,
    ...options
  })
}

export async function setupFullBDD(options = {}) {
  console.warn('⚠️  setupFullBDD() is deprecated. Use direct library imports instead:')
  console.log('   import { scenario, mount } from "@nuxt-bdd/core"')
  console.log('   import { nuxtHelpers } from "@nuxt-bdd/integrations/nuxt"')
  console.log('   import { cucumberHelpers } from "@nuxt-bdd/integrations/cucumber"')
  
  return setup({
    autoConfig: true,
    nuxtIntegration: true,
    cucumberIntegration: true,
    ...options
  })
}

export async function setupMinimal(options = {}) {
  console.warn('⚠️  setupMinimal() is deprecated. Use direct library imports instead:')
  console.log('   import { scenario, mount } from "@nuxt-bdd/core"')
  
  return setup({
    autoConfig: false,
    nuxtIntegration: false,
    cucumberIntegration: false,
    ...options
  })
}

/**
 * Plugin development utilities (compatibility)
 */
export function createPlugin(name, install, cleanup) {
  console.warn('⚠️  createPlugin() is deprecated. Create plugins as ES modules instead:')
  console.log(`   // ${name}.js`)
  console.log('   export function install() { /* plugin logic */ }')
  console.log('   export function cleanup() { /* cleanup logic */ }')
  
  return {
    name,
    install,
    cleanup,
    version: '1.0.0-compat'
  }
}

/**
 * Built-in plugins (compatibility exports)
 */
export { authPlugin, apiPlugin, formPlugin }

/**
 * Migration helper class
 * Provides utilities for migrating from framework to library
 */
export class MigrationHelper {
  static analyzeFrameworkUsage(codeString) {
    const frameworkPatterns = [
      /setupNuxtBDD\(/g,
      /setupFullBDD\(/g,
      /createFramework\(/g,
      /framework\.scenario\(/g,
      /framework\.mount\(/g,
      /framework\.addPlugin\(/g
    ]
    
    const matches = []
    
    frameworkPatterns.forEach(pattern => {
      const found = codeString.match(pattern)
      if (found) {
        matches.push({
          pattern: pattern.source,
          count: found.length,
          suggestion: this._getMigrationSuggestion(pattern.source)
        })
      }
    })
    
    return matches
  }
  
  static generateMigrationPlan(analysis) {
    const plan = {
      imports: [],
      replacements: [],
      removals: []
    }
    
    analysis.forEach(match => {
      switch (match.pattern) {
        case 'setupNuxtBDD\\(':
          plan.imports.push('import { scenario, mount } from "@nuxt-bdd/core"')
          plan.imports.push('import { nuxtHelpers } from "@nuxt-bdd/integrations/nuxt"')
          plan.replacements.push('Replace setupNuxtBDD() with direct imports')
          break
          
        case 'framework\\.scenario\\(':
          plan.replacements.push('Replace framework.scenario() with scenario()')
          break
          
        case 'framework\\.mount\\(':
          plan.replacements.push('Replace framework.mount() with mount()')
          break
      }
    })
    
    return plan
  }
  
  static _getMigrationSuggestion(pattern) {
    const suggestions = {
      'setupNuxtBDD\\(': 'Use direct imports: import { scenario, mount } from "@nuxt-bdd/core"',
      'setupFullBDD\\(': 'Use direct imports with integrations',
      'createFramework\\(': 'Remove framework creation, use direct imports',
      'framework\\.scenario\\(': 'Use scenario() directly',
      'framework\\.mount\\(': 'Use mount() directly'
    }
    
    return suggestions[pattern] || 'Consider migrating to library approach'
  }
}

/**
 * Development mode compatibility checker
 */
export class CompatibilityChecker {
  static checkEnvironment() {
    const warnings = []
    
    // Check for common framework usage patterns
    if (typeof global !== 'undefined' && global.BDDFramework) {
      warnings.push('Global BDDFramework detected - consider migrating to library imports')
    }
    
    // Check for deprecated environment variables
    if (process.env.NUXT_BDD_FRAMEWORK_MODE === 'true') {
      warnings.push('NUXT_BDD_FRAMEWORK_MODE is deprecated - library mode is now default')
    }
    
    return {
      compatible: true,
      warnings,
      suggestions: [
        'Migrate to library imports for better tree-shaking',
        'Use direct imports instead of framework initialization',
        'Enable individual utility imports for smaller bundle size'
      ]
    }
  }
  
  static generateCompatibilityReport() {
    const env = this.checkEnvironment()
    
    console.log('🔍 BDD Compatibility Check')
    console.log('==========================')
    
    if (env.warnings.length > 0) {
      console.log('⚠️  Warnings:')
      env.warnings.forEach(warning => console.log(`   - ${warning}`))
    }
    
    if (env.suggestions.length > 0) {
      console.log('💡 Suggestions:')
      env.suggestions.forEach(suggestion => console.log(`   - ${suggestion}`))
    }
    
    console.log('✅ Compatibility status: OK')
    
    return env
  }
}

/**
 * Default export for framework compatibility
 */
export default {
  setup,
  setupNuxtBDD,
  setupFullBDD,
  setupMinimal,
  createFramework,
  createPlugin,
  BDDFramework,
  MigrationHelper,
  CompatibilityChecker
}