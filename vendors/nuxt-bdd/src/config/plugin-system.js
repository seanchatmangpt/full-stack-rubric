/**
 * Extensible plugin system for Nuxt BDD auto-configuration framework
 * Allows custom plugins to extend and modify configuration behavior
 * Enhanced with BDD-specific plugins and Nuxt 3 optimizations
 */

import { EventEmitter } from 'events'

/**
 * @typedef {Object} Plugin
 * @property {string} name - Plugin name
 * @property {string} version - Plugin version
 * @property {Function} install - Installation function
 * @property {Object} options - Plugin options
 * @property {string[]} dependencies - Plugin dependencies
 * @property {boolean} bddEnabled - Whether plugin supports BDD features
 */

/**
 * Plugin system manager with BDD enhancements
 */
export class PluginSystem extends EventEmitter {
  constructor() {
    super()
    this.plugins = new Map()
    this.hooks = new Map()
    this.middleware = []
    this.initialized = false
    this.bddPlugins = new Set()
  }
  
  /**
   * Register a new plugin
   * @param {Plugin} plugin - Plugin to register
   * @param {Object} options - Plugin options
   */
  async use(plugin, options = {}) {
    if (typeof plugin === 'string') {
      // Dynamic import for string plugins
      plugin = await this.loadPlugin(plugin)
    }
    
    if (!plugin.name) {
      throw new Error('Plugin must have a name')
    }
    
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`)
    }
    
    // Check dependencies
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(`Plugin "${plugin.name}" depends on "${dep}" which is not installed`)
        }
      }
    }
    
    // Install plugin
    const pluginInstance = {
      ...plugin,
      options: { ...plugin.options, ...options },
      installed: false
    }
    
    this.plugins.set(plugin.name, pluginInstance)
    
    // Track BDD plugins
    if (plugin.bddEnabled) {
      this.bddPlugins.add(plugin.name)
    }
    
    // Call install function if provided
    if (typeof plugin.install === 'function') {
      await plugin.install(this, options)
      pluginInstance.installed = true
    }
    
    this.emit('plugin:installed', pluginInstance)
    
    return this
  }
  
  /**
   * Register a hook handler with priority support
   * @param {string} hookName - Hook name
   * @param {Function} handler - Hook handler function
   * @param {number} priority - Handler priority (lower = higher priority)
   */
  hook(hookName, handler, priority = 50) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, [])
    }
    
    const handlers = this.hooks.get(hookName)
    handlers.push({ handler, priority })
    
    // Sort by priority
    handlers.sort((a, b) => a.priority - b.priority)
    
    return this
  }
  
  /**
   * Execute hooks with error handling and context
   * @param {string} hookName - Hook name
   * @param {any} payload - Hook payload
   * @param {Object} context - Execution context
   * @returns {Promise<any>} - Modified payload
   */
  async callHook(hookName, payload, context = {}) {
    if (!this.hooks.has(hookName)) {
      return payload
    }
    
    const handlers = this.hooks.get(hookName)
    let result = payload
    
    for (const { handler } of handlers) {
      try {
        const hookResult = await handler(result, context)
        if (hookResult !== undefined) {
          result = hookResult
        }
      } catch (error) {
        this.emit('hook:error', { hookName, error, handler, context })
        
        // Continue execution unless it's a critical hook
        if (hookName.includes('critical') || context.failOnError) {
          throw error
        } else {
        }
      }
    }
    
    return result
  }
  
  /**
   * Add middleware function with BDD context awareness
   * @param {Function} middleware - Middleware function
   * @param {Object} options - Middleware options
   */
  addMiddleware(middleware, options = {}) {
    const middlewareWrapper = async (config, context = {}) => {
      try {
        const result = await middleware(config, { ...context, ...options })
        return result || config
      } catch (error) {
        this.emit('middleware:error', { middleware, error, config })
        if (options.failOnError) {
          throw error
        }
        return config
      }
    }
    
    this.middleware.push(middlewareWrapper)
    return this
  }
  
  /**
   * Apply middleware to configuration with BDD context
   * @param {Object} config - Configuration object
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} - Processed configuration
   */
  async applyMiddleware(config, context = {}) {
    let result = config
    
    for (const middleware of this.middleware) {
      result = await middleware(result, context) || result
    }
    
    return result
  }
  
  /**
   * Load plugin dynamically with error handling
   * @param {string} pluginName - Plugin name or path
   * @returns {Promise<Plugin>} - Loaded plugin
   */
  async loadPlugin(pluginName) {
    try {
      // Try to import as module
      const plugin = await import(pluginName)
      return plugin.default || plugin
    } catch (error) {
      // Try alternative paths
      const alternativePaths = [
        `./plugins/${pluginName}.js`,
        `@nuxt-bdd/plugin-${pluginName}`,
        `nuxt-bdd-plugin-${pluginName}`
      ]
      
      for (const path of alternativePaths) {
        try {
          const plugin = await import(path)
          return plugin.default || plugin
        } catch {
          // Continue to next path
        }
      }
      
      throw new Error(`Failed to load plugin "${pluginName}": ${error.message}`)
    }
  }
  
  /**
   * Get registered plugin
   * @param {string} name - Plugin name
   * @returns {Plugin|null} - Plugin instance or null
   */
  getPlugin(name) {
    return this.plugins.get(name) || null
  }
  
  /**
   * Get all registered plugins
   * @returns {Plugin[]} - Array of plugins
   */
  getPlugins() {
    return Array.from(this.plugins.values())
  }
  
  /**
   * Get BDD-enabled plugins
   * @returns {Plugin[]} - Array of BDD plugins
   */
  getBDDPlugins() {
    return Array.from(this.bddPlugins).map(name => this.plugins.get(name))
  }
  
  /**
   * Check if plugin is installed
   * @param {string} name - Plugin name
   * @returns {boolean} - True if installed
   */
  hasPlugin(name) {
    return this.plugins.has(name)
  }
  
  /**
   * Remove plugin with cleanup
   * @param {string} name - Plugin name
   */
  removePlugin(name) {
    const plugin = this.plugins.get(name)
    
    if (!plugin) {
      return false
    }
    
    // Call uninstall if provided
    if (typeof plugin.uninstall === 'function') {
      plugin.uninstall(this)
    }
    
    this.plugins.delete(name)
    this.bddPlugins.delete(name)
    this.emit('plugin:removed', plugin)
    
    return true
  }
  
  /**
   * Initialize plugin system with built-in plugins
   */
  async initialize() {
    if (this.initialized) {
      return
    }
    
    // Install built-in plugins
    await this.installBuiltinPlugins()
    
    this.initialized = true
    this.emit('initialized')
  }
  
  /**
   * Install built-in plugins with BDD enhancements
   */
  async installBuiltinPlugins() {
    // Core Nuxt plugins
    await this.use({
      name: 'nuxt-core',
      version: '1.0.0',
      bddEnabled: true,
      install: (system) => {
        system.hook('config:modify', (config) => {
          // Ensure Nuxt 3 defaults
          if (!config.nuxt) config.nuxt = {}
          if (!config.nuxt.modules) config.nuxt.modules = []
          
          // Add test utils if not present
          if (!config.nuxt.modules.includes('@nuxt/test-utils')) {
            config.nuxt.modules.push('@nuxt/test-utils')
          }
          
          return config
        })
      }
    })
    
    // BDD Testing plugin
    await this.use({
      name: 'bdd-testing',
      version: '1.0.0',
      bddEnabled: true,
      install: (system) => {
        system.hook('config:modify', (config) => {
          if (config.testing?.bdd?.enabled) {
            // Ensure BDD directories
            if (!config.testing.bdd.featuresDir) {
              config.testing.bdd.featuresDir = 'tests/features'
            }
            if (!config.testing.bdd.stepDefinitionsDir) {
              config.testing.bdd.stepDefinitionsDir = 'tests/steps'
            }
            
            // Configure Cucumber
            if (!config.testing.bdd.cucumber) {
              config.testing.bdd.cucumber = {
                paths: [`${config.testing.bdd.featuresDir}/**/*.feature`],
                require: [`${config.testing.bdd.stepDefinitionsDir}/**/*.js`],
                format: ['progress']
              }
            }
          }
          return config
        })
      }
    })
    
    // TypeScript support plugin
    await this.use({
      name: 'typescript',
      version: '1.0.0',
      bddEnabled: true,
      install: (system) => {
        system.hook('config:modify', (config) => {
          if (config.dependencies?.includes('typescript')) {
            config.nuxt = config.nuxt || {}
            config.nuxt.typescript = {
              strict: true,
              typeCheck: false, // Performance optimization
              ...config.nuxt.typescript
            }
            
            // TypeScript BDD configuration
            if (config.testing?.bdd?.enabled) {
              config.testing.bdd.typescript = true
            }
          }
          return config
        })
      }
    })
    
    // Vitest integration plugin
    await this.use({
      name: 'vitest',
      version: '1.0.0',
      bddEnabled: true,
      install: (system) => {
        system.hook('config:modify', (config) => {
          if (config.testing?.framework === 'vitest') {
            config.testing.vitest = {
              environment: 'happy-dom',
              globals: true,
              coverage: {
                provider: 'v8',
                reporter: ['text', 'html', 'lcov']
              },
              ...config.testing.vitest
            }
            
            // BDD integration
            if (config.testing?.bdd?.enabled) {
              config.testing.vitest.setupFiles = [
                ...(config.testing.vitest.setupFiles || []),
                './tests/setup/bdd-setup.js'
              ]
            }
          }
          return config
        })
      }
    })
  }
}

/**
 * Built-in plugins for common functionality with BDD support
 */
export const builtinPlugins = {
  /**
   * Environment-based configuration plugin
   */
  environment: {
    name: 'environment',
    version: '1.0.0',
    bddEnabled: true,
    install: (system, options = {}) => {
      const envMap = options.envMap || {
        development: 'dev',
        production: 'prod',
        test: 'test'
      }
      
      system.hook('config:modify', (config, context) => {
        const env = process.env.NODE_ENV || 'development'
        const envKey = envMap[env] || env
        
        if (config[envKey]) {
          const merged = { ...config, ...config[envKey] }
          
          // Environment-specific BDD settings
          if (env === 'test' && merged.testing?.bdd?.enabled) {
            merged.testing.bdd.parallel = 1 // Single thread for test env
          }
          
          return merged
        }
        
        return config
      })
    }
  },
  
  /**
   * Performance optimization plugin
   */
  performance: {
    name: 'performance',
    version: '1.0.0',
    bddEnabled: false,
    install: (system, options = {}) => {
      system.hook('config:modify', (config) => {
        if (process.env.NODE_ENV === 'production') {
          config.nuxt = config.nuxt || {}
          config.nuxt.nitro = {
            ...config.nuxt.nitro,
            minify: options.minify !== false,
            sourceMap: options.sourceMap || false,
            prerender: {
              routes: ['/'],
              ...config.nuxt.nitro?.prerender
            }
          }
        }
        
        return config
      })
    }
  },
  
  /**
   * Security headers plugin with BDD testing considerations
   */
  security: {
    name: 'security',
    version: '1.0.0',
    bddEnabled: true,
    install: (system, options = {}) => {
      system.hook('config:modify', (config) => {
        config.nuxt = config.nuxt || {}
        config.nuxt.nitro = {
          ...config.nuxt.nitro,
          routeRules: {
            '/**': {
              headers: {
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                ...options.headers
              }
            },
            // Relax security for test endpoints
            ...(process.env.NODE_ENV === 'test' && {
              '/test/**': {
                headers: {
                  'X-Frame-Options': 'ALLOWALL'
                }
              }
            }),
            ...config.nuxt.nitro?.routeRules
          }
        }
        
        return config
      })
    }
  },
  
  /**
   * Auto-import plugin with BDD test utilities
   */
  autoImport: {
    name: 'auto-import',
    version: '1.0.0',
    bddEnabled: true,
    install: (system, options = {}) => {
      system.hook('config:modify', (config) => {
        config.nuxt = config.nuxt || {}
        config.nuxt.imports = {
          dirs: [
            'composables/**',
            'utils/**',
            'stores',
            ...options.dirs || []
          ],
          ...config.nuxt.imports
        }
        
        // BDD-specific imports
        if (config.testing?.bdd?.enabled) {
          config.nuxt.imports.dirs.push('tests/support/**')
        }
        
        return config
      })
    }
  },
  
  /**
   * SEO optimization plugin
   */
  seo: {
    name: 'seo',
    version: '1.0.0',
    bddEnabled: false,
    install: (system, options = {}) => {
      system.hook('config:modify', (config) => {
        config.nuxt = config.nuxt || {}
        config.nuxt.app = {
          ...config.nuxt.app,
          head: {
            meta: [
              { name: 'viewport', content: 'width=device-width, initial-scale=1' },
              { name: 'format-detection', content: 'telephone=no' },
              ...options.meta || []
            ],
            link: [
              { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
              ...options.links || []
            ],
            ...config.nuxt.app?.head
          }
        }
        
        return config
      })
    }
  },
  
  /**
   * BDD Accessibility testing plugin
   */
  accessibility: {
    name: 'accessibility',
    version: '1.0.0',
    bddEnabled: true,
    install: (system, options = {}) => {
      system.hook('config:modify', (config) => {
        if (config.testing?.bdd?.enabled) {
          // Add accessibility testing configuration
          config.testing.bdd.accessibility = {
            enabled: true,
            rules: options.rules || 'wcag2a',
            tags: options.tags || ['wcag2a'],
            ...config.testing.bdd.accessibility
          }
          
          // Add axe-core if not present
          if (!config.dependencies?.includes('@axe-core/playwright')) {
            config.dependencies = config.dependencies || []
            config.dependencies.push('@axe-core/playwright')
          }
        }
        
        return config
      })
    }
  },
  
  /**
   * Content management plugin with BDD content testing
   */
  content: {
    name: 'content',
    version: '1.0.0',
    bddEnabled: true,
    install: (system, options = {}) => {
      system.hook('config:modify', (config) => {
        if (config.dependencies?.includes('@nuxtjs/content')) {
          config.nuxt = config.nuxt || {}
          config.nuxt.content = {
            documentDriven: true,
            highlight: {
              theme: {
                default: 'github-light',
                dark: 'github-dark'
              }
            },
            ...config.nuxt.content
          }
          
          // BDD content testing scenarios
          if (config.testing?.bdd?.enabled) {
            config.testing.bdd.scenarios = [
              ...(config.testing.bdd.scenarios || []),
              'content-rendering',
              'markdown-parsing',
              'frontmatter-validation'
            ]
          }
        }
        
        return config
      })
    }
  }
}

/**
 * Create a custom plugin with BDD support
 * @param {Object} pluginConfig - Plugin configuration
 * @returns {Plugin} - Plugin object
 */
export function createPlugin(pluginConfig) {
  return {
    name: 'custom',
    version: '1.0.0',
    bddEnabled: false,
    ...pluginConfig
  }
}

/**
 * Plugin utilities with BDD enhancements
 */
export const pluginUtils = {
  /**
   * Validate plugin structure with BDD checks
   * @param {Plugin} plugin - Plugin to validate
   * @returns {boolean} - True if valid
   */
  validate(plugin) {
    if (!plugin.name || typeof plugin.name !== 'string') {
      return false
    }
    
    if (plugin.install && typeof plugin.install !== 'function') {
      return false
    }
    
    if (plugin.bddEnabled && !plugin.install) {
    }
    
    return true
  },
  
  /**
   * Create plugin from configuration with BDD defaults
   * @param {Object} config - Plugin configuration
   * @returns {Plugin} - Created plugin
   */
  fromConfig(config) {
    return {
      name: config.name,
      version: config.version || '1.0.0',
      install: config.install,
      options: config.options || {},
      dependencies: config.dependencies || [],
      bddEnabled: config.bddEnabled || false
    }
  },
  
  /**
   * Merge plugin configurations with BDD awareness
   * @param {Plugin[]} plugins - Array of plugins
   * @returns {Object} - Merged configuration
   */
  mergeConfigs(plugins) {
    const config = {
      nuxt: {},
      testing: { bdd: { enabled: false } }
    }
    
    for (const plugin of plugins) {
      if (plugin.config) {
        Object.assign(config, plugin.config)
      }
      
      // Track if any plugin enables BDD
      if (plugin.bddEnabled) {
        config.testing.bdd.enabled = true
      }
    }
    
    return config
  },
  
  /**
   * Get plugin recommendations based on project needs
   * @param {Object} requirements - Project requirements
   * @returns {string[]} - Recommended plugin names
   */
  recommend(requirements = {}) {
    const recommendations = []
    
    // Always recommend core plugins
    recommendations.push('nuxt-core', 'environment')
    
    // BDD-specific recommendations
    if (requirements.bdd || requirements.testing) {
      recommendations.push('bdd-testing', 'vitest')
    }
    
    if (requirements.typescript) {
      recommendations.push('typescript')
    }
    
    if (requirements.content) {
      recommendations.push('content')
    }
    
    if (requirements.accessibility) {
      recommendations.push('accessibility')
    }
    
    if (requirements.production) {
      recommendations.push('performance', 'security', 'seo')
    }
    
    return recommendations
  }
}

// Create default plugin system instance
export const pluginSystem = new PluginSystem()

// Auto-initialize on import
