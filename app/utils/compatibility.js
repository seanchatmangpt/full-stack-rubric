/**
 * @fileoverview Compatibility layer for framework integration
 * Ensures compatibility across Nuxt 4, Vue 3, and testing environments
 */

/**
 * @typedef {Object} FrameworkVersions
 * @property {string} nuxt - Nuxt version
 * @property {string} vue - Vue version  
 * @property {string} vitest - Vitest version
 * @property {string} node - Node.js version
 */

/**
 * @typedef {Object} CompatibilityResult
 * @property {boolean} compatible - Whether versions are compatible
 * @property {string[]} warnings - Compatibility warnings
 * @property {string[]} errors - Compatibility errors
 * @property {Object} recommendations - Version recommendations
 */

/**
 * Framework compatibility configuration
 */
const COMPATIBILITY_MATRIX = {
  nuxt: {
    supported: ['4.x', '3.13+'],
    recommended: '4.0+',
    breaking: ['3.12-', '5.0+']
  },
  vue: {
    supported: ['3.3+'],
    recommended: '3.4+',
    breaking: ['2.x', '4.0+']
  },
  vitest: {
    supported: ['2.0+', '3.x'],
    recommended: '3.2+',
    breaking: ['1.x', '4.0+']
  },
  node: {
    supported: ['18+', '20+', '22+'],
    recommended: '20+',
    breaking: ['16-', '23+']
  }
}

/**
 * Runtime feature detection
 */
export const FeatureDetection = {
  /**
   * Check if Composition API is available
   * @returns {boolean} True if Composition API is supported
   */
  hasCompositionAPI() {
    try {
      // In SSR context, check for Vue import
      if (typeof window === 'undefined') {
        return true // Assume available in Nuxt 4 context
      }
      
      // Client-side detection
      return typeof ref === 'function' && typeof computed === 'function'
    } catch {
      return false
    }
  },

  /**
   * Check if Monaco Editor can be loaded
   * @returns {Promise<boolean>} True if Monaco can be initialized
   */
  async hasMonacoSupport() {
    try {
      // Check for Web Workers support (required for Monaco)
      if (typeof Worker === 'undefined') {
        return false
      }
      
      // Try dynamic import
      await import('monaco-editor')
      return true
    } catch {
      return false
    }
  },

  /**
   * Check if testing environment supports Vue components
   * @returns {boolean} True if component testing is supported
   */
  hasComponentTesting() {
    try {
      // Check for JSDOM environment
      if (typeof global !== 'undefined' && global.window && global.document) {
        return true
      }
      
      // Check for browser environment
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        return true
      }
      
      return false
    } catch {
      return false
    }
  },

  /**
   * Check if ESM modules are properly supported
   * @returns {boolean} True if ESM is supported
   */
  hasESMSupport() {
    try {
      // Check for dynamic import support
      return typeof import === 'function'
    } catch {
      return false
    }
  }
}

/**
 * Environment compatibility utilities
 */
export const EnvironmentUtils = {
  /**
   * Get current runtime environment
   * @returns {string} Environment type: 'ssr', 'client', 'test', 'node'
   */
  getEnvironment() {
    // SSR environment (Nuxt server)
    if (typeof window === 'undefined' && typeof global !== 'undefined' && process?.server) {
      return 'ssr'
    }
    
    // Test environment (Vitest/JSDOM)
    if (typeof global !== 'undefined' && global.window && process?.env?.NODE_ENV === 'test') {
      return 'test'
    }
    
    // Client environment (browser)
    if (typeof window !== 'undefined') {
      return 'client'
    }
    
    // Node.js environment
    return 'node'
  },

  /**
   * Check if code is running in Nuxt context
   * @returns {boolean} True if in Nuxt context
   */
  isNuxtContext() {
    try {
      // Check for Nuxt-specific globals
      return typeof useNuxtApp === 'function' || 
             typeof navigateTo === 'function' ||
             (typeof process !== 'undefined' && process.client !== undefined)
    } catch {
      return false
    }
  },

  /**
   * Check if code is running in test context
   * @returns {boolean} True if in test context
   */
  isTestContext() {
    return typeof global !== 'undefined' && 
           (global.__vitest__ || process?.env?.NODE_ENV === 'test')
  }
}

/**
 * Version compatibility checker
 */
export class CompatibilityChecker {
  /**
   * Check framework versions compatibility
   * @param {FrameworkVersions} versions - Framework versions to check
   * @returns {CompatibilityResult} Compatibility analysis result
   */
  static checkVersions(versions) {
    const result = {
      compatible: true,
      warnings: [],
      errors: [],
      recommendations: {}
    }

    // Check each framework
    Object.entries(versions).forEach(([framework, version]) => {
      const rules = COMPATIBILITY_MATRIX[framework]
      if (!rules) return

      // Check for breaking versions
      const isBreaking = rules.breaking.some(breakingVersion => 
        this.versionMatches(version, breakingVersion)
      )

      if (isBreaking) {
        result.compatible = false
        result.errors.push(`${framework} ${version} is not supported (breaking change)`)
        result.recommendations[framework] = rules.recommended
        return
      }

      // Check for supported versions
      const isSupported = rules.supported.some(supportedVersion =>
        this.versionMatches(version, supportedVersion)
      )

      if (!isSupported) {
        result.warnings.push(`${framework} ${version} may have compatibility issues`)
        result.recommendations[framework] = rules.recommended
      }

      // Check if using recommended version
      if (!this.versionMatches(version, rules.recommended)) {
        result.recommendations[framework] = rules.recommended
      }
    })

    return result
  }

  /**
   * Check if version matches pattern
   * @param {string} version - Actual version
   * @param {string} pattern - Version pattern (e.g., '3.x', '4.0+')
   * @returns {boolean} True if version matches pattern
   */
  static versionMatches(version, pattern) {
    // Simple version matching logic
    if (pattern.includes('+')) {
      const baseVersion = pattern.replace('+', '')
      return version >= baseVersion
    }
    
    if (pattern.includes('x')) {
      const majorVersion = pattern.split('.')[0]
      return version.startsWith(majorVersion)
    }
    
    if (pattern.includes('-')) {
      const [start, end] = pattern.split('-')
      return version >= start && version <= end
    }
    
    return version === pattern
  }

  /**
   * Get current framework versions
   * @returns {Promise<FrameworkVersions>} Current versions
   */
  static async getCurrentVersions() {
    const versions = {
      nuxt: 'unknown',
      vue: 'unknown', 
      vitest: 'unknown',
      node: process.version || 'unknown'
    }

    try {
      // Try to get versions from package.json or runtime
      if (typeof process !== 'undefined' && process.env.npm_package_version) {
        // In npm script context, try to read dependencies
        const packageJson = await import('../../package.json')
        versions.nuxt = packageJson.dependencies?.nuxt || packageJson.devDependencies?.nuxt || 'unknown'
        versions.vitest = packageJson.devDependencies?.vitest || 'unknown'
      }
    } catch {
      // Fallback to runtime detection
    }

    return versions
  }
}

/**
 * Framework-specific polyfills and compatibility shims
 */
export const CompatibilityShims = {
  /**
   * Monaco Editor compatibility shim for SSR
   * @returns {Object} Monaco-compatible object for SSR
   */
  getMonacoSSRShim() {
    if (typeof window === 'undefined') {
      // SSR-safe Monaco shim
      return {
        editor: {
          create: () => ({
            dispose: () => {},
            getValue: () => '',
            setValue: () => {},
            onDidChangeModelContent: () => ({ dispose: () => {} }),
            onKeyDown: () => ({ dispose: () => {} }),
            focus: () => {}
          }),
          createModel: () => ({
            dispose: () => {},
            getValue: () => '',
            setValue: () => {},
            onDidChangeContent: () => ({ dispose: () => {} })
          })
        },
        Range: class Range {
          constructor() {}
        },
        KeyCode: {}
      }
    }
    
    return null // Use real Monaco in client
  },

  /**
   * Performance API shim for testing
   * @returns {Object} Performance-compatible object
   */
  getPerformanceShim() {
    if (typeof performance === 'undefined') {
      return {
        now: () => Date.now(),
        mark: () => {},
        measure: () => {},
        getEntriesByName: () => [],
        clearMarks: () => {},
        clearMeasures: () => {}
      }
    }
    
    return performance
  },

  /**
   * Local storage shim for SSR/testing
   * @returns {Object} Storage-compatible object
   */
  getStorageShim() {
    if (typeof localStorage === 'undefined') {
      const storage = new Map()
      return {
        getItem: (key) => storage.get(key) || null,
        setItem: (key, value) => storage.set(key, String(value)),
        removeItem: (key) => storage.delete(key),
        clear: () => storage.clear(),
        get length() { return storage.size },
        key: (index) => Array.from(storage.keys())[index] || null
      }
    }
    
    return localStorage
  }
}

/**
 * Safe framework utilities
 */
export const SafeUtils = {
  /**
   * Safely use Nuxt composable
   * @param {Function} composable - Nuxt composable function
   * @param {*} fallback - Fallback value if not in Nuxt context
   * @returns {*} Composable result or fallback
   */
  safeNuxtComposable(composable, fallback = null) {
    try {
      if (EnvironmentUtils.isNuxtContext()) {
        return composable()
      }
    } catch {
      // Fallback if not in Nuxt context
    }
    
    return fallback
  },

  /**
   * Safely import dynamic module
   * @param {string} modulePath - Module path to import
   * @param {*} fallback - Fallback if import fails
   * @returns {Promise<*>} Module or fallback
   */
  async safeDynamicImport(modulePath, fallback = {}) {
    try {
      return await import(modulePath)
    } catch (error) {
      console.warn(`Failed to import ${modulePath}:`, error.message)
      return fallback
    }
  },

  /**
   * Safely execute code that may not work in all environments
   * @param {Function} code - Code to execute
   * @param {*} fallback - Fallback value
   * @returns {*} Execution result or fallback
   */
  safeExecute(code, fallback = null) {
    try {
      return code()
    } catch (error) {
      console.warn('Safe execution failed:', error.message)
      return fallback
    }
  }
}

/**
 * Default export with all utilities
 */
export default {
  FeatureDetection,
  EnvironmentUtils,
  CompatibilityChecker,
  CompatibilityShims,
  SafeUtils,
  COMPATIBILITY_MATRIX
}