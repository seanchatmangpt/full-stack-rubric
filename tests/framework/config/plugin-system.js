/**
 * Extensible plugin system for auto-configuration framework
 * Allows custom plugins to extend and modify configuration behavior
 */

import { EventEmitter } from 'events'

/**
 * @typedef {Object} Plugin
 * @property {string} name - Plugin name
 * @property {string} version - Plugin version
 * @property {Function} install - Installation function
 * @property {Object} options - Plugin options
 * @property {string[]} dependencies - Plugin dependencies
 */

/**
 * Plugin system manager
 */
export class PluginSystem extends EventEmitter {
  constructor() {
    super()
    this.plugins = new Map()
    this.hooks = new Map()
    this.middleware = []
    this.initialized = false
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
    
    // Call install function if provided
    if (typeof plugin.install === 'function') {
      await plugin.install(this, options)
      pluginInstance.installed = true
    }
    
    this.emit('plugin:installed', pluginInstance)
    
    return this
  }
  
  /**
   * Register a hook handler
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
   * Execute hooks
   * @param {string} hookName - Hook name
   * @param {any} payload - Hook payload
   * @returns {Promise<any>} - Modified payload
   */
  async callHook(hookName, payload) {
    if (!this.hooks.has(hookName)) {
      return payload
    }
    
    const handlers = this.hooks.get(hookName)
    let result = payload
    
    for (const { handler } of handlers) {
      try {
        const hookResult = await handler(result)
        if (hookResult !== undefined) {
          result = hookResult
        }
      } catch (error) {
        this.emit('hook:error', { hookName, error, handler })
        throw error
      }
    }
    
    return result
  }
  
  /**
   * Add middleware function
   * @param {Function} middleware - Middleware function
   */
  addMiddleware(middleware) {
    this.middleware.push(middleware)
    return this
  }
  
  /**
   * Apply middleware to configuration
   * @param {Object} config - Configuration object
   * @returns {Promise<Object>} - Processed configuration
   */
  async applyMiddleware(config) {
    let result = config
    
    for (const middleware of this.middleware) {
      result = await middleware(result) || result
    }
    
    return result
  }
  
  /**
   * Load plugin dynamically
   * @param {string} pluginName - Plugin name or path
   * @returns {Promise<Plugin>} - Loaded plugin
   */
  async loadPlugin(pluginName) {
    try {
      // Try to import as module
      const plugin = await import(pluginName)
      return plugin.default || plugin
    } catch (error) {
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
   * Check if plugin is installed
   * @param {string} name - Plugin name
   * @returns {boolean} - True if installed
   */
  hasPlugin(name) {
    return this.plugins.has(name)
  }
  
  /**
   * Remove plugin
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
    this.emit('plugin:removed', plugin)
    
    return true
  }
  
  /**
   * Initialize plugin system
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
   * Install built-in plugins
   */
  async installBuiltinPlugins() {
    // TypeScript support plugin
    await this.use({
      name: 'typescript',
      version: '1.0.0',
      install: (system) => {
        system.hook('config:modify', (config) => {
          if (config.dependencies?.includes('typescript')) {
            config.typescript = {
              strict: true,
              typeCheck: true,
              ...config.typescript
            }
          }
          return config
        })
      }
    })
    
    // Tailwind CSS plugin
    await this.use({
      name: 'tailwindcss',
      version: '1.0.0',
      install: (system) => {
        system.hook('config:modify', (config) => {
          if (config.dependencies?.includes('tailwindcss')) {
            config.css = config.css || []
            if (!config.css.includes('~/assets/css/main.css')) {
              config.css.push('~/assets/css/main.css')
            }
          }
          return config
        })
      }
    })
    
    // Testing plugin
    await this.use({
      name: 'testing',
      version: '1.0.0',
      install: (system) => {
        system.hook('config:modify', (config) => {
          if (config.dependencies?.includes('vitest')) {
            config.vitest = {
              environment: 'jsdom',
              globals: true,
              ...config.vitest
            }
          }
          return config
        })
      }
    })
  }
}

/**
 * Built-in plugins for common functionality
 */
export const builtinPlugins = {
  /**
   * Environment-based configuration plugin
   */
  environment: {
    name: 'environment',
    version: '1.0.0',
    install: (system, options = {}) => {
      const envMap = options.envMap || {
        development: 'dev',
        production: 'prod',
        test: 'test'
      }
      
      system.hook('config:modify', (config) => {
        const env = process.env.NODE_ENV || 'development'
        const envKey = envMap[env] || env
        
        if (config[envKey]) {
          return { ...config, ...config[envKey] }
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
    install: (system, options = {}) => {
      system.hook('config:modify', (config) => {
        if (process.env.NODE_ENV === 'production') {
          config.build = {
            ...config.build,
            analyze: options.analyze || false,
            extractCSS: options.extractCSS !== false,
            optimization: {
              minimize: true,
              ...config.build?.optimization
            }
          }
        }
        
        return config
      })
    }
  },
  
  /**
   * Security headers plugin
   */
  security: {
    name: 'security',
    version: '1.0.0',
    install: (system, options = {}) => {
      system.hook('config:modify', (config) => {
        config.nitro = {
          ...config.nitro,
          routeRules: {
            '/**': {
              headers: {
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
                ...options.headers
              }
            },
            ...config.nitro?.routeRules
          }
        }
        
        return config
      })
    }
  },
  
  /**
   * Auto-import plugin
   */
  autoImport: {
    name: 'auto-import',
    version: '1.0.0',
    install: (system, options = {}) => {
      system.hook('config:modify', (config) => {
        config.imports = {
          dirs: [
            'composables',
            'utils',
            'stores',
            ...options.dirs || []
          ],
          ...config.imports
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
    install: (system, options = {}) => {
      system.hook('config:modify', (config) => {
        config.app = {
          ...config.app,
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
            ...config.app?.head
          }
        }
        
        return config
      })
    }
  }
}

/**
 * Create a custom plugin
 * @param {Object} pluginConfig - Plugin configuration
 * @returns {Plugin} - Plugin object
 */
export function createPlugin(pluginConfig) {
  return {
    name: 'custom',
    version: '1.0.0',
    ...pluginConfig
  }
}

/**
 * Plugin utilities
 */
export const pluginUtils = {
  /**
   * Validate plugin structure
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
    
    return true
  },
  
  /**
   * Create plugin from configuration
   * @param {Object} config - Plugin configuration
   * @returns {Plugin} - Created plugin
   */
  fromConfig(config) {
    return {
      name: config.name,
      version: config.version || '1.0.0',
      install: config.install,
      options: config.options || {},
      dependencies: config.dependencies || []
    }
  },
  
  /**
   * Merge plugin configurations
   * @param {Plugin[]} plugins - Array of plugins
   * @returns {Object} - Merged configuration
   */
  mergeConfigs(plugins) {
    const config = {}
    
    for (const plugin of plugins) {
      if (plugin.config) {
        Object.assign(config, plugin.config)
      }
    }
    
    return config
  }
}

// Create default plugin system instance
export const pluginSystem = new PluginSystem()

// Auto-initialize on import
pluginSystem.initialize().catch(console.error)