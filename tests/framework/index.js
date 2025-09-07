/**
 * BDD + Nuxt 4 Testing Micro-Framework
 * Main entry point with auto-configuration and plugin system
 * Reduces testing boilerplate by 80% through convention over configuration
 */

import { ScenarioBuilder, scenario, given, when, then, config, usePlugin } from './core/index.js'
import { getNuxtBridge, initializeNuxtTesting } from './integration/nuxt-bridge.js'
import { getCucumberBridge, registerScenario } from './integration/cucumber-bridge.js'
import { AutoConfigManager } from './plugins/auto-config.js'
import { createTestUtilities } from './utils/test-helpers.js'

/**
 * Framework initialization options
 * @typedef {Object} FrameworkOptions
 * @property {boolean} autoConfig - Enable auto-configuration
 * @property {boolean} nuxtIntegration - Enable Nuxt integration
 * @property {boolean} cucumberIntegration - Enable Cucumber/BDD integration
 * @property {Array} plugins - Framework plugins to load
 * @property {Object} conventions - Convention overrides
 * @property {Object} nuxtOptions - Nuxt test configuration
 */

/**
 * BDD Testing Framework
 * Main framework class that orchestrates all components
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
    this.autoConfig = null
    this.nuxtBridge = null
    this.cucumberBridge = null
    this.scenarios = new Map()
    this.plugins = new Map()
    this.config = { ...config }
  }

  /**
   * Initialize the framework with auto-configuration
   * @returns {Promise<BDDFramework>}
   */
  async initialize() {
    if (this.initialized) return this
    
    console.log('🚀 Initializing BDD + Nuxt 4 Testing Framework...')
    
    try {
      // Step 1: Auto-configuration
      if (this.options.autoConfig) {
        await this.setupAutoConfiguration()
      }
      
      // Step 2: Nuxt integration
      if (this.options.nuxtIntegration) {
        await this.setupNuxtIntegration()
      }
      
      // Step 3: Cucumber integration
      if (this.options.cucumberIntegration) {
        await this.setupCucumberIntegration()
      }
      
      // Step 4: Load plugins
      await this.loadPlugins()
      
      // Step 5: Setup global helpers
      this.setupGlobalHelpers()
      
      this.initialized = true
      console.log('✅ Framework initialization complete!')
      
      return this
    } catch (error) {
      console.error('❌ Framework initialization failed:', error)
      throw error
    }
  }

  /**
   * Setup auto-configuration by scanning project structure
   * @private
   */
  async setupAutoConfiguration() {
    console.log('🔍 Setting up auto-configuration...')
    
    this.autoConfig = new AutoConfigManager(this.options.conventions)
    const generatedConfig = await this.autoConfig.scanAndConfigure()
    
    // Merge generated config with framework config
    this.config = {
      ...this.config,
      ...generatedConfig,
      helpers: {
        ...this.config.helpers,
        ...generatedConfig.helpers
      }
    }
    
    console.log('✅ Auto-configuration complete')
  }

  /**
   * Setup Nuxt testing integration
   * @private
   */
  async setupNuxtIntegration() {
    console.log('⚡ Setting up Nuxt integration...')
    
    this.nuxtBridge = getNuxtBridge(this.options.nuxtOptions)
    await this.nuxtBridge.initialize()
    
    console.log('✅ Nuxt integration ready')
  }

  /**
   * Setup Cucumber/BDD integration
   * @private
   */
  async setupCucumberIntegration() {
    console.log('🥒 Setting up Cucumber integration...')
    
    this.cucumberBridge = getCucumberBridge()
    
    console.log('✅ Cucumber integration ready')
  }

  /**
   * Load and initialize plugins
   * @private
   */
  async loadPlugins() {
    console.log('🔌 Loading plugins...')
    
    for (const plugin of this.options.plugins) {
      await this.loadPlugin(plugin)
    }
    
    console.log(`✅ Loaded ${this.plugins.size} plugins`)
  }

  /**
   * Load a single plugin
   * @param {Object|Function} plugin - Plugin to load
   * @private
   */
  async loadPlugin(plugin) {
    try {
      if (typeof plugin === 'function') {
        plugin = await plugin()
      }
      
      if (plugin.install) {
        await plugin.install(this)
      }
      
      this.plugins.set(plugin.name || 'anonymous', plugin)
      
      if (this.options.verbose) {
        console.log(`  ✓ Loaded plugin: ${plugin.name || 'anonymous'}`)
      }
    } catch (error) {
      console.error(`❌ Failed to load plugin: ${error.message}`)
    }
  }

  /**
   * Setup global helpers and utilities
   * @private
   */
  setupGlobalHelpers() {
    // Add global utilities to all scenarios
    ScenarioBuilder.prototype.helpers = function() {
      return createTestUtilities(this.context)
    }
    
    // Add framework reference to scenarios
    ScenarioBuilder.prototype.framework = this
    
    // Add auto-generated helpers
    if (this.config.helpers) {
      ScenarioBuilder.prototype.autoHelpers = this.config.helpers
    }
  }

  /**
   * Create a new scenario with full framework integration
   * @param {string} description - Scenario description
   * @returns {ScenarioBuilder}
   */
  scenario(description) {
    const newScenario = new ScenarioBuilder(description)
    
    // Enhance with Nuxt integration
    if (this.nuxtBridge) {
      this.nuxtBridge.enhanceScenario(newScenario)
    }
    
    // Register with Cucumber bridge
    if (this.cucumberBridge) {
      this.cucumberBridge.registerScenario(newScenario)
    }
    
    // Store scenario reference
    this.scenarios.set(description, newScenario)
    
    return newScenario
  }

  /**
   * Get framework configuration
   * @returns {Object}
   */
  getConfig() {
    return { ...this.config }
  }

  /**
   * Add a plugin at runtime
   * @param {Object|Function} plugin - Plugin to add
   * @returns {Promise<void>}
   */
  async addPlugin(plugin) {
    await this.loadPlugin(plugin)
  }

  /**
   * Get loaded plugins
   * @returns {Map}
   */
  getPlugins() {
    return new Map(this.plugins)
  }

  /**
   * Get all registered scenarios
   * @returns {Map}
   */
  getScenarios() {
    return new Map(this.scenarios)
  }

  /**
   * Cleanup framework resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    console.log('🧹 Cleaning up framework resources...')
    
    // Cleanup Nuxt bridge
    if (this.nuxtBridge) {
      await this.nuxtBridge.cleanup()
    }
    
    // Clear scenarios
    this.scenarios.clear()
    
    // Cleanup plugins
    for (const plugin of this.plugins.values()) {
      if (plugin.cleanup) {
        await plugin.cleanup()
      }
    }
    
    this.initialized = false
    console.log('✅ Framework cleanup complete')
  }
}

/**
 * Global framework instance
 */
let globalFramework = null

/**
 * Create or get global framework instance
 * @param {FrameworkOptions} options - Framework options
 * @returns {Promise<BDDFramework>}
 */
export async function createFramework(options = {}) {
  if (!globalFramework || !globalFramework.initialized) {
    globalFramework = new BDDFramework(options)
    await globalFramework.initialize()
  }
  return globalFramework
}

/**
 * Quick setup function for zero-config usage
 * @param {FrameworkOptions} options - Framework options
 * @returns {Promise<Object>} - Framework API
 */
export async function setup(options = {}) {
  const framework = await createFramework(options)
  
  return {
    scenario: (description) => framework.scenario(description),
    given: (description) => framework.scenario(description).given,
    when: (description) => framework.scenario(description).when,
    then: (description) => framework.scenario(description).then,
    helpers: createTestUtilities,
    framework,
    config: framework.getConfig()
  }
}

/**
 * Convenience function for common usage patterns
 */

// Zero-config setup for Nuxt projects
export async function setupNuxtBDD(options = {}) {
  return setup({
    autoConfig: true,
    nuxtIntegration: true,
    cucumberIntegration: false,
    ...options
  })
}

// Full BDD setup with Cucumber integration
export async function setupFullBDD(options = {}) {
  return setup({
    autoConfig: true,
    nuxtIntegration: true,
    cucumberIntegration: true,
    ...options
  })
}

// Minimal setup for custom configurations
export async function setupMinimal(options = {}) {
  return setup({
    autoConfig: false,
    nuxtIntegration: false,
    cucumberIntegration: false,
    ...options
  })
}

/**
 * Plugin development utilities
 */

/**
 * Create a framework plugin
 * @param {string} name - Plugin name
 * @param {Function} install - Plugin install function
 * @param {Function} [cleanup] - Plugin cleanup function
 * @returns {Object} - Plugin object
 */
export function createPlugin(name, install, cleanup) {
  return {
    name,
    install,
    cleanup,
    version: '1.0.0'
  }
}

/**
 * Built-in plugins
 */

// Authentication plugin
export const authPlugin = createPlugin('auth', (framework) => {
  // Add auth-specific helpers to scenarios
  ScenarioBuilder.prototype.auth = function() {
    return this.helpers().auth
  }
})

// API testing plugin
export const apiPlugin = createPlugin('api', (framework) => {
  // Add API-specific helpers
  ScenarioBuilder.prototype.api = function() {
    return this.helpers().api
  }
})

// Form testing plugin
export const formPlugin = createPlugin('form', (framework) => {
  // Add form-specific helpers
  ScenarioBuilder.prototype.form = function() {
    return this.helpers().form
  }
})

/**
 * Export all core components for advanced usage
 */
export {
  // Core classes
  ScenarioBuilder,
  
  // Core functions
  scenario,
  given,
  when,
  then,
  usePlugin,
  
  // Integration bridges
  getNuxtBridge,
  getCucumberBridge,
  
  // Utilities
  AutoConfigManager,
  createTestUtilities,
  
  // Built-in plugins
  authPlugin,
  apiPlugin,
  formPlugin
}

/**
 * Default export for common usage
 */
export default {
  setup,
  setupNuxtBDD,
  setupFullBDD,
  setupMinimal,
  scenario,
  createFramework,
  createPlugin,
  BDDFramework
}