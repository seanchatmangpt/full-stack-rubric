/**
 * Zero-Config System - Intelligent Auto-Discovery and Configuration
 * Production-ready system with convention over configuration approach
 * @version 2.0.0
 */

export { initializeZeroConfig, createNewProject, quickSetup, validateZeroConfig } from './zero-config.js'
export { discoverProjectStructure, detectTestingFramework, generateHealthReport } from './auto-discovery.js'
export { generateSmartDefaults, generateEnvironmentDefaults, generateAdaptiveConfig } from './smart-defaults.js'
export { getPreset, getPresetNames, searchPresets, recommendPresets, applyPreset, generateCustomPreset } from './presets.js'
export { pluginSystem, PluginSystem, builtinPlugins, createPlugin, pluginUtils } from './plugin-system.js'

/**
 * Quick zero-config setup for immediate use
 * @param {string} projectPath - Project path (defaults to current directory)
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} - Setup result with config and recommendations
 */
export async function autoConfig(projectPath = process.cwd(), options = {}) {
  const { initializeZeroConfig } = await import('./zero-config.js')
  return await initializeZeroConfig(projectPath, {
    updatePackageJson: true,
    createDirectories: true,
    usePreset: true,
    ...options
  })
}

/**
 * Smart project analysis and recommendations
 * @param {string} projectPath - Project path
 * @returns {Promise<Object>} - Analysis with health score and recommendations
 */
export async function analyzeProject(projectPath = process.cwd()) {
  const { generateHealthReport } = await import('./auto-discovery.js')
  const { recommendPresets } = await import('./presets.js')
  const { discoverProjectStructure } = await import('./auto-discovery.js')
  
  const structure = await discoverProjectStructure(projectPath)
  const health = await generateHealthReport(projectPath)
  const presets = recommendPresets(structure)
  
  return {
    structure,
    health,
    recommendations: {
      presets,
      ...health.suggestions
    }
  }
}

/**
 * Convention-based configuration with zero setup
 * @param {Object} options - Override options
 * @returns {Promise<Object>} - Generated configuration
 */
export async function conventionConfig(options = {}) {
  const { generateSmartDefaults } = await import('./smart-defaults.js')
  const { discoverProjectStructure } = await import('./auto-discovery.js')
  
  const structure = await discoverProjectStructure()
  return await generateSmartDefaults(process.cwd(), options)
}