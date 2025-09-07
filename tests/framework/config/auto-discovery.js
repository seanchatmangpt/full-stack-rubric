/**
 * Auto-discovery system for Nuxt project structure detection
 * Intelligently detects project configuration, dependencies, and structure
 */

import { readdir, readFile, access } from 'fs/promises'
import { join, resolve } from 'path'
import { existsSync } from 'fs'

/**
 * @typedef {Object} ProjectStructure
 * @property {string} type - Project type (nuxt3, nuxt2, vue, etc.)
 * @property {string} framework - Framework version
 * @property {string[]} directories - Available directories
 * @property {Object} packageInfo - Package.json information
 * @property {string[]} dependencies - Detected dependencies
 * @property {Object} nuxtConfig - Nuxt configuration if available
 * @property {Object} recommendations - Suggested configurations
 */

/**
 * Auto-discover Nuxt project structure and configuration
 * @param {string} projectPath - Path to project root
 * @returns {Promise<ProjectStructure>} - Discovered project structure
 */
export async function discoverProjectStructure(projectPath = process.cwd()) {
  const structure = {
    type: 'unknown',
    framework: 'unknown',
    directories: [],
    packageInfo: {},
    dependencies: [],
    nuxtConfig: {},
    recommendations: {}
  }

  try {
    // Detect package.json and extract information
    const packagePath = join(projectPath, 'package.json')
    if (existsSync(packagePath)) {
      const packageContent = await readFile(packagePath, 'utf-8')
      structure.packageInfo = JSON.parse(packageContent)
      structure.dependencies = extractDependencies(structure.packageInfo)
    }

    // Detect Nuxt version and type
    structure.type = detectProjectType(structure.dependencies)
    structure.framework = detectNuxtVersion(structure.dependencies)

    // Scan directory structure
    structure.directories = await scanDirectories(projectPath)

    // Load existing Nuxt configuration
    structure.nuxtConfig = await loadNuxtConfig(projectPath)

    // Generate recommendations based on findings
    structure.recommendations = generateRecommendations(structure)

    return structure
  } catch (error) {
    console.error('Error during project discovery:', error)
    return structure
  }
}

/**
 * Extract dependencies from package.json
 * @param {Object} packageInfo - Package.json content
 * @returns {string[]} - Array of dependency names
 */
function extractDependencies(packageInfo) {
  const deps = []
  
  if (packageInfo.dependencies) {
    deps.push(...Object.keys(packageInfo.dependencies))
  }
  
  if (packageInfo.devDependencies) {
    deps.push(...Object.keys(packageInfo.devDependencies))
  }
  
  return deps
}

/**
 * Detect project type based on dependencies
 * @param {string[]} dependencies - Array of dependencies
 * @returns {string} - Project type
 */
function detectProjectType(dependencies) {
  if (dependencies.includes('nuxt')) {
    return 'nuxt3'
  }
  
  if (dependencies.includes('@nuxt/core') || dependencies.includes('nuxt-edge')) {
    return 'nuxt2'
  }
  
  if (dependencies.includes('vue') && dependencies.includes('@vitejs/plugin-vue')) {
    return 'vue3-vite'
  }
  
  if (dependencies.includes('vue') && dependencies.includes('webpack')) {
    return 'vue3-webpack'
  }
  
  if (dependencies.includes('vue')) {
    return 'vue'
  }
  
  return 'unknown'
}

/**
 * Detect Nuxt framework version
 * @param {string[]} dependencies - Array of dependencies
 * @returns {string} - Framework version
 */
function detectNuxtVersion(dependencies) {
  if (dependencies.includes('nuxt')) {
    return '3.x'
  }
  
  if (dependencies.includes('@nuxt/core')) {
    return '2.x'
  }
  
  if (dependencies.includes('vue')) {
    return 'vue-3.x'
  }
  
  return 'unknown'
}

/**
 * Scan project directories to understand structure
 * @param {string} projectPath - Project root path
 * @returns {Promise<string[]>} - Array of discovered directories
 */
async function scanDirectories(projectPath) {
  const commonDirs = [
    'app', 'pages', 'components', 'layouts', 'middleware', 'plugins',
    'composables', 'utils', 'stores', 'assets', 'static', 'public',
    'server', 'content', 'tests', 'test', '__tests__', 'spec',
    'src', 'lib', 'types', 'styles', 'scss', 'css'
  ]
  
  const foundDirs = []
  
  for (const dir of commonDirs) {
    const dirPath = join(projectPath, dir)
    try {
      await access(dirPath)
      foundDirs.push(dir)
    } catch {
      // Directory doesn't exist, skip
    }
  }
  
  return foundDirs
}

/**
 * Load existing Nuxt configuration
 * @param {string} projectPath - Project root path
 * @returns {Promise<Object>} - Nuxt configuration object
 */
async function loadNuxtConfig(projectPath) {
  const configFiles = [
    'nuxt.config.js',
    'nuxt.config.ts',
    'nuxt.config.mjs'
  ]
  
  for (const configFile of configFiles) {
    const configPath = join(projectPath, configFile)
    if (existsSync(configPath)) {
      try {
        // For JS files, we can attempt to read and parse basic structure
        const content = await readFile(configPath, 'utf-8')
        return parseConfigContent(content)
      } catch (error) {
        console.warn(`Could not parse ${configFile}:`, error.message)
      }
    }
  }
  
  return {}
}

/**
 * Parse configuration file content to extract basic structure
 * @param {string} content - Configuration file content
 * @returns {Object} - Parsed configuration object
 */
function parseConfigContent(content) {
  // Simple parsing for common configuration patterns
  const config = {}
  
  // Extract modules
  const modulesMatch = content.match(/modules:\s*\[([\s\S]*?)\]/m)
  if (modulesMatch) {
    config.modules = modulesMatch[1]
      .split(',')
      .map(m => m.replace(/['"]/g, '').trim())
      .filter(Boolean)
  }
  
  // Extract CSS
  const cssMatch = content.match(/css:\s*\[([\s\S]*?)\]/m)
  if (cssMatch) {
    config.css = cssMatch[1]
      .split(',')
      .map(c => c.replace(/['"]/g, '').trim())
      .filter(Boolean)
  }
  
  return config
}

/**
 * Generate configuration recommendations based on project structure
 * @param {ProjectStructure} structure - Discovered project structure
 * @returns {Object} - Configuration recommendations
 */
function generateRecommendations(structure) {
  const recommendations = {
    testFramework: 'vitest',
    modules: [],
    plugins: [],
    directories: {},
    scripts: {}
  }
  
  // Test framework recommendations
  if (structure.dependencies.includes('jest')) {
    recommendations.testFramework = 'jest'
  } else if (structure.dependencies.includes('vitest')) {
    recommendations.testFramework = 'vitest'
  }
  
  // Module recommendations based on dependencies
  if (structure.dependencies.includes('@nuxtjs/tailwindcss')) {
    recommendations.modules.push('@nuxtjs/tailwindcss')
  }
  
  if (structure.dependencies.includes('@nuxtjs/content')) {
    recommendations.modules.push('@nuxtjs/content')
  }
  
  if (structure.dependencies.includes('@pinia/nuxt')) {
    recommendations.modules.push('@pinia/nuxt')
  }
  
  // Directory structure recommendations
  if (!structure.directories.includes('tests') && !structure.directories.includes('test')) {
    recommendations.directories.tests = 'Create tests directory for test organization'
  }
  
  if (!structure.directories.includes('components') && structure.type.includes('nuxt')) {
    recommendations.directories.components = 'Create components directory for Vue components'
  }
  
  // Script recommendations
  if (!structure.packageInfo.scripts?.test) {
    recommendations.scripts.test = recommendations.testFramework === 'vitest' ? 'vitest' : 'jest'
  }
  
  if (!structure.packageInfo.scripts?.build) {
    recommendations.scripts.build = structure.type === 'nuxt3' ? 'nuxt build' : 'npm run build'
  }
  
  return recommendations
}

/**
 * Detect testing framework configuration
 * @param {string} projectPath - Project root path
 * @returns {Promise<Object>} - Testing framework configuration
 */
export async function detectTestingFramework(projectPath = process.cwd()) {
  const testConfig = {
    framework: 'none',
    configFile: null,
    testDirs: [],
    patterns: []
  }
  
  // Check for Vitest
  const vitestConfig = join(projectPath, 'vitest.config.js')
  if (existsSync(vitestConfig)) {
    testConfig.framework = 'vitest'
    testConfig.configFile = 'vitest.config.js'
  }
  
  // Check for Jest
  const jestConfig = join(projectPath, 'jest.config.js')
  if (existsSync(jestConfig)) {
    testConfig.framework = 'jest'
    testConfig.configFile = 'jest.config.js'
  }
  
  // Find test directories
  const testDirs = ['tests', 'test', '__tests__', 'spec']
  for (const dir of testDirs) {
    const dirPath = join(projectPath, dir)
    try {
      await access(dirPath)
      testConfig.testDirs.push(dir)
    } catch {
      // Directory doesn't exist
    }
  }
  
  return testConfig
}

/**
 * Generate project health report
 * @param {string} projectPath - Project root path
 * @returns {Promise<Object>} - Project health assessment
 */
export async function generateHealthReport(projectPath = process.cwd()) {
  const structure = await discoverProjectStructure(projectPath)
  const testingInfo = await detectTestingFramework(projectPath)
  
  const health = {
    score: 0,
    issues: [],
    suggestions: [],
    strengths: []
  }
  
  let score = 0
  const maxScore = 100
  
  // Check for essential files
  if (structure.packageInfo.name) {
    score += 10
    health.strengths.push('Project has package.json with name')
  } else {
    health.issues.push('Missing package.json or project name')
  }
  
  // Check for Nuxt configuration
  if (Object.keys(structure.nuxtConfig).length > 0) {
    score += 15
    health.strengths.push('Nuxt configuration found')
  } else {
    health.issues.push('Missing or incomplete Nuxt configuration')
  }
  
  // Check for testing setup
  if (testingInfo.framework !== 'none') {
    score += 20
    health.strengths.push(`Testing framework configured: ${testingInfo.framework}`)
  } else {
    health.issues.push('No testing framework detected')
    health.suggestions.push('Set up Vitest or Jest for testing')
  }
  
  // Check for essential directories
  const essentialDirs = ['components', 'pages', 'app']
  const foundEssential = essentialDirs.filter(dir => structure.directories.includes(dir))
  score += (foundEssential.length / essentialDirs.length) * 25
  
  if (foundEssential.length === essentialDirs.length) {
    health.strengths.push('All essential directories present')
  } else {
    health.suggestions.push(`Consider creating missing directories: ${essentialDirs.filter(d => !foundEssential.includes(d)).join(', ')}`)
  }
  
  // Check for modern dependencies
  if (structure.dependencies.includes('nuxt') || structure.dependencies.includes('vue')) {
    score += 15
    health.strengths.push('Using modern Vue/Nuxt framework')
  }
  
  // Check for TypeScript
  if (structure.dependencies.includes('typescript') || existsSync(join(projectPath, 'tsconfig.json'))) {
    score += 15
    health.strengths.push('TypeScript configuration detected')
  } else {
    health.suggestions.push('Consider adding TypeScript for better development experience')
  }
  
  health.score = Math.min(score, maxScore)
  
  return health
}