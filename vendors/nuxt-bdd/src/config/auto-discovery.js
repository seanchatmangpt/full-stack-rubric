/**
 * Auto-discovery system for Nuxt BDD project structure detection
 * Intelligently detects project configuration, dependencies, and BDD structure
 * Enhanced for Nuxt 3 and modern testing frameworks
 */

import { readdir, readFile, access, stat } from 'fs/promises'
import { join, resolve, extname } from 'path'
import { existsSync } from 'fs'

/**
 * @typedef {Object} ProjectStructure
 * @property {string} type - Project type (nuxt3, nuxt2, vue, etc.)
 * @property {string} framework - Framework version
 * @property {string[]} directories - Available directories
 * @property {Object} packageInfo - Package.json information
 * @property {string[]} dependencies - Detected dependencies
 * @property {Object} nuxtConfig - Nuxt configuration if available
 * @property {Object} testingConfig - Testing framework configuration
 * @property {Object} bddStructure - BDD-specific structure information
 * @property {Object} recommendations - Suggested configurations
 */

/**
 * Auto-discover Nuxt BDD project structure and configuration
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
    testingConfig: {},
    bddStructure: {},
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

    // Scan directory structure with depth analysis
    structure.directories = await scanDirectories(projectPath)

    // Load existing Nuxt configuration
    structure.nuxtConfig = await loadNuxtConfig(projectPath)

    // Analyze testing configuration
    structure.testingConfig = await analyzeTestingSetup(projectPath, structure.dependencies)

    // Discover BDD structure
    structure.bddStructure = await discoverBDDStructure(projectPath)

    // Generate enhanced recommendations
    structure.recommendations = generateRecommendations(structure)

    return structure
  } catch (error) {
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
  
  if (packageInfo.peerDependencies) {
    deps.push(...Object.keys(packageInfo.peerDependencies))
  }
  
  return deps
}

/**
 * Detect project type based on dependencies and structure
 * @param {string[]} dependencies - Array of dependencies
 * @returns {string} - Project type
 */
function detectProjectType(dependencies) {
  // Nuxt 3 detection
  if (dependencies.includes('nuxt') && !dependencies.includes('@nuxt/core')) {
    return 'nuxt3'
  }
  
  // Nuxt 2 detection
  if (dependencies.includes('@nuxt/core') || dependencies.includes('nuxt-edge')) {
    return 'nuxt2'
  }
  
  // Vue 3 with Vite
  if (dependencies.includes('vue') && dependencies.includes('@vitejs/plugin-vue')) {
    return 'vue3-vite'
  }
  
  // Vue 3 with Webpack
  if (dependencies.includes('vue') && dependencies.includes('webpack')) {
    return 'vue3-webpack'
  }
  
  // Generic Vue project
  if (dependencies.includes('vue')) {
    return 'vue3'
  }
  
  // Node.js project
  if (dependencies.some(dep => dep.startsWith('@types/node') || dep === 'express' || dep === 'fastify')) {
    return 'nodejs'
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
    // Check for Nuxt 3 indicators
    if (dependencies.includes('@nuxt/devtools') || dependencies.includes('@nuxt/test-utils')) {
      return '3.x'
    }
    return '3.x' // Default to 3.x for nuxt package
  }
  
  if (dependencies.includes('@nuxt/core')) {
    return '2.x'
  }
  
  if (dependencies.includes('vue')) {
    const vueVersion = dependencies.find(dep => dep === 'vue')
    return vueVersion ? 'vue-3.x' : 'vue-unknown'
  }
  
  return 'unknown'
}

/**
 * Scan project directories with enhanced depth analysis
 * @param {string} projectPath - Project root path
 * @returns {Promise<string[]>} - Array of discovered directories
 */
async function scanDirectories(projectPath) {
  const commonDirs = [
    // Nuxt 3 app directory structure
    'app', 'app/components', 'app/pages', 'app/layouts', 'app/middleware', 
    'app/plugins', 'app/composables', 'app/utils', 'app/stores',
    
    // Traditional Nuxt structure
    'pages', 'components', 'layouts', 'middleware', 'plugins',
    'composables', 'utils', 'stores',
    
    // Assets and static files
    'assets', 'assets/css', 'assets/images', 'assets/fonts',
    'static', 'public',
    
    // Server-side
    'server', 'server/api', 'server/middleware', 'server/plugins',
    
    // Content management
    'content', 'content/blog', 'content/docs',
    
    // Testing directories
    'tests', 'test', '__tests__', 'spec',
    'tests/unit', 'tests/integration', 'tests/e2e',
    'tests/features', 'tests/steps', 'tests/support',
    
    // Source directories
    'src', 'src/components', 'src/pages',
    'lib', 'libs', 'packages',
    
    // Configuration and tooling
    'config', 'configs', 'tools', 'scripts',
    
    // Styling
    'styles', 'scss', 'css',
    
    // Documentation
    'docs', 'documentation',
    
    // Types
    'types', 'typings', '@types'
  ]
  
  const foundDirs = []
  
  for (const dir of commonDirs) {
    const dirPath = join(projectPath, dir)
    try {
      await access(dirPath)
      const stats = await stat(dirPath)
      if (stats.isDirectory()) {
        foundDirs.push(dir)
      }
    } catch {
      // Directory doesn't exist, skip
    }
  }
  
  // Also discover any custom directories
  try {
    const rootContents = await readdir(projectPath)
    for (const item of rootContents) {
      const itemPath = join(projectPath, item)
      try {
        const stats = await stat(itemPath)
        if (stats.isDirectory() && !foundDirs.includes(item) && !item.startsWith('.')) {
          foundDirs.push(item)
        }
      } catch {
        // Skip if can't access
      }
    }
  } catch {
    // Skip if can't read directory
  }
  
  return foundDirs.sort()
}

/**
 * Load existing Nuxt configuration with enhanced parsing
 * @param {string} projectPath - Project root path
 * @returns {Promise<Object>} - Nuxt configuration object
 */
async function loadNuxtConfig(projectPath) {
  const configFiles = [
    'nuxt.config.js',
    'nuxt.config.ts',
    'nuxt.config.mjs',
    'nuxt.config.cjs'
  ]
  
  for (const configFile of configFiles) {
    const configPath = join(projectPath, configFile)
    if (existsSync(configPath)) {
      try {
        const content = await readFile(configPath, 'utf-8')
        return parseConfigContent(content)
      } catch (error) {
      }
    }
  }
  
  return {}
}

/**
 * Parse configuration file content with enhanced extraction
 * @param {string} content - Configuration file content
 * @returns {Object} - Parsed configuration object
 */
function parseConfigContent(content) {
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
  
  // Extract SSR setting
  const ssrMatch = content.match(/ssr:\s*(true|false)/m)
  if (ssrMatch) {
    config.ssr = ssrMatch[1] === 'true'
  }
  
  // Extract target
  const targetMatch = content.match(/target:\s*['"]([^'"]+)['"]/m)
  if (targetMatch) {
    config.target = targetMatch[1]
  }
  
  // Extract runtime config
  const runtimeConfigMatch = content.match(/runtimeConfig:\s*\{([\s\S]*?)\}/m)
  if (runtimeConfigMatch) {
    config.runtimeConfig = {}
  }
  
  return config
}

/**
 * Analyze testing framework configuration
 * @param {string} projectPath - Project root path
 * @param {string[]} dependencies - Project dependencies
 * @returns {Promise<Object>} - Testing configuration analysis
 */
async function analyzeTestingSetup(projectPath, dependencies) {
  const testConfig = {
    frameworks: [],
    configFiles: [],
    testDirs: [],
    hasE2E: false,
    hasBDD: false,
    coverage: false
  }
  
  // Detect testing frameworks
  if (dependencies.includes('vitest')) {
    testConfig.frameworks.push('vitest')
    
    const vitestConfig = join(projectPath, 'vitest.config.js')
    if (existsSync(vitestConfig)) {
      testConfig.configFiles.push('vitest.config.js')
    }
  }
  
  if (dependencies.includes('jest')) {
    testConfig.frameworks.push('jest')
    
    const jestConfigs = ['jest.config.js', 'jest.config.json']
    for (const config of jestConfigs) {
      const configPath = join(projectPath, config)
      if (existsSync(configPath)) {
        testConfig.configFiles.push(config)
        break
      }
    }
  }
  
  // Detect E2E testing
  if (dependencies.includes('playwright') || dependencies.includes('cypress')) {
    testConfig.hasE2E = true
    if (dependencies.includes('playwright')) testConfig.frameworks.push('playwright')
    if (dependencies.includes('cypress')) testConfig.frameworks.push('cypress')
  }
  
  // Detect BDD testing
  if (dependencies.includes('@cucumber/cucumber')) {
    testConfig.hasBDD = true
    testConfig.frameworks.push('cucumber')
    
    const cucumberConfig = join(projectPath, 'cucumber.config.js')
    if (existsSync(cucumberConfig)) {
      testConfig.configFiles.push('cucumber.config.js')
    }
  }
  
  // Detect coverage tools
  if (dependencies.includes('@vitest/coverage') || 
      dependencies.includes('c8') || 
      dependencies.includes('nyc')) {
    testConfig.coverage = true
  }
  
  // Find test directories
  const testDirs = ['tests', 'test', '__tests__', 'spec', 'e2e']
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
 * Discover BDD-specific project structure
 * @param {string} projectPath - Project root path
 * @returns {Promise<Object>} - BDD structure information
 */
async function discoverBDDStructure(projectPath) {
  const bddStructure = {
    hasBDD: false,
    featuresDir: null,
    stepDefinitionsDir: null,
    supportDir: null,
    featureFiles: [],
    stepFiles: [],
    configFiles: []
  }
  
  // Check for BDD directories
  const bddDirs = [
    { key: 'featuresDir', paths: ['tests/features', 'features', 'specs'] },
    { key: 'stepDefinitionsDir', paths: ['tests/steps', 'step_definitions', 'steps'] },
    { key: 'supportDir', paths: ['tests/support', 'support'] }
  ]
  
  for (const { key, paths } of bddDirs) {
    for (const path of paths) {
      const fullPath = join(projectPath, path)
      try {
        await access(fullPath)
        bddStructure[key] = path
        bddStructure.hasBDD = true
        break
      } catch {
        // Directory doesn't exist
      }
    }
  }
  
  // If BDD structure found, scan for files
  if (bddStructure.hasBDD) {
    if (bddStructure.featuresDir) {
      bddStructure.featureFiles = await scanForFiles(
        join(projectPath, bddStructure.featuresDir), 
        '.feature'
      )
    }
    
    if (bddStructure.stepDefinitionsDir) {
      bddStructure.stepFiles = await scanForFiles(
        join(projectPath, bddStructure.stepDefinitionsDir), 
        '.js'
      )
    }
  }
  
  // Check for BDD config files
  const bddConfigFiles = ['cucumber.config.js', '.cucumber.json', 'cucumber.yml']
  for (const configFile of bddConfigFiles) {
    const configPath = join(projectPath, configFile)
    if (existsSync(configPath)) {
      bddStructure.configFiles.push(configFile)
    }
  }
  
  return bddStructure
}

/**
 * Scan for files with specific extension in directory
 * @param {string} dirPath - Directory path
 * @param {string} extension - File extension to look for
 * @returns {Promise<string[]>} - Array of found files
 */
async function scanForFiles(dirPath, extension) {
  const files = []
  
  try {
    const dirContents = await readdir(dirPath, { withFileTypes: true })
    
    for (const entry of dirContents) {
      if (entry.isFile() && extname(entry.name) === extension) {
        files.push(entry.name)
      } else if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subFiles = await scanForFiles(
          join(dirPath, entry.name), 
          extension
        )
        files.push(...subFiles.map(f => join(entry.name, f)))
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
  
  return files
}

/**
 * Generate enhanced configuration recommendations
 * @param {ProjectStructure} structure - Discovered project structure
 * @returns {Object} - Configuration recommendations
 */
function generateRecommendations(structure) {
  const recommendations = {
    testFramework: 'vitest',
    modules: [],
    plugins: [],
    directories: {},
    scripts: {},
    bdd: {
      enabled: false,
      suggestions: []
    },
    performance: [],
    security: []
  }
  
  // Test framework recommendations
  if (structure.testingConfig.frameworks.length === 0) {
    recommendations.testFramework = 'vitest'
    recommendations.bdd.suggestions.push('Set up Vitest for unit testing')
    recommendations.bdd.suggestions.push('Consider adding Cucumber for BDD testing')
  } else {
    recommendations.testFramework = structure.testingConfig.frameworks[0]
  }
  
  // BDD recommendations
  if (!structure.bddStructure.hasBDD) {
    recommendations.bdd.suggestions.push('Create tests/features directory for BDD scenarios')
    recommendations.bdd.suggestions.push('Create tests/steps directory for step definitions')
  } else {
    recommendations.bdd.enabled = true
    if (structure.bddStructure.featureFiles.length === 0) {
      recommendations.bdd.suggestions.push('Add .feature files to describe scenarios')
    }
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
  
  if (structure.dependencies.includes('@nuxtjs/i18n')) {
    recommendations.modules.push('@nuxtjs/i18n')
  }
  
  // Directory structure recommendations
  if (!structure.directories.includes('tests') && !structure.directories.includes('test')) {
    recommendations.directories.tests = 'Create tests directory for test organization'
  }
  
  if (!structure.directories.includes('components') && structure.type.includes('nuxt')) {
    recommendations.directories.components = 'Create components directory for Vue components'
  }
  
  if (structure.type === 'nuxt3' && !structure.directories.includes('app')) {
    recommendations.directories.app = 'Consider using app/ directory structure for Nuxt 3'
  }
  
  // Performance recommendations
  if (!structure.dependencies.includes('@nuxtjs/compression')) {
    recommendations.performance.push('Consider adding compression for better performance')
  }
  
  if (!structure.dependencies.includes('@nuxt/image')) {
    recommendations.performance.push('Consider @nuxt/image for optimized image handling')
  }
  
  // Security recommendations
  if (!structure.nuxtConfig.runtimeConfig) {
    recommendations.security.push('Set up runtime configuration for environment variables')
  }
  
  return recommendations
}

/**
 * Detect testing framework configuration with enhanced detection
 * @param {string} projectPath - Project root path
 * @returns {Promise<Object>} - Testing framework configuration
 */
export async function detectTestingFramework(projectPath = process.cwd()) {
  const testConfig = {
    framework: 'none',
    version: null,
    configFile: null,
    testDirs: [],
    patterns: [],
    coverage: false,
    e2e: false,
    bdd: false
  }
  
  // Check for Vitest
  const vitestConfigs = ['vitest.config.js', 'vitest.config.ts', 'vite.config.js']
  for (const config of vitestConfigs) {
    const configPath = join(projectPath, config)
    if (existsSync(configPath)) {
      testConfig.framework = 'vitest'
      testConfig.configFile = config
      break
    }
  }
  
  // Check for Jest (if Vitest not found)
  if (testConfig.framework === 'none') {
    const jestConfigs = ['jest.config.js', 'jest.config.json', 'package.json']
    for (const config of jestConfigs) {
      const configPath = join(projectPath, config)
      if (existsSync(configPath)) {
        if (config === 'package.json') {
          try {
            const packageContent = await readFile(configPath, 'utf-8')
            const packageJson = JSON.parse(packageContent)
            if (packageJson.jest) {
              testConfig.framework = 'jest'
              testConfig.configFile = 'package.json'
              break
            }
          } catch {
            // Skip if can't parse
          }
        } else {
          testConfig.framework = 'jest'
          testConfig.configFile = config
          break
        }
      }
    }
  }
  
  // Check for E2E frameworks
  const e2eConfigs = [
    { name: 'playwright', files: ['playwright.config.js', 'playwright.config.ts'] },
    { name: 'cypress', files: ['cypress.config.js', 'cypress.json'] }
  ]
  
  for (const { name, files } of e2eConfigs) {
    for (const file of files) {
      const configPath = join(projectPath, file)
      if (existsSync(configPath)) {
        testConfig.e2e = name
        break
      }
    }
    if (testConfig.e2e) break
  }
  
  // Check for BDD setup
  const bddConfigs = ['cucumber.config.js', '.cucumber.json']
  for (const config of bddConfigs) {
    const configPath = join(projectPath, config)
    if (existsSync(configPath)) {
      testConfig.bdd = true
      break
    }
  }
  
  // Find test directories
  const testDirs = ['tests', 'test', '__tests__', 'spec', 'e2e']
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
 * Generate comprehensive project health report
 * @param {string} projectPath - Project root path
 * @returns {Promise<Object>} - Project health assessment
 */
export async function generateHealthReport(projectPath = process.cwd()) {
  const structure = await discoverProjectStructure(projectPath)
  const testingInfo = await detectTestingFramework(projectPath)
  
  const health = {
    score: 0,
    grade: 'F',
    issues: [],
    suggestions: [],
    strengths: [],
    categories: {
      structure: 0,
      testing: 0,
      configuration: 0,
      dependencies: 0,
      bdd: 0
    }
  }
  
  let totalScore = 0
  const maxScore = 100
  
  // Structure Assessment (25 points)
  let structureScore = 0
  if (structure.packageInfo.name) {
    structureScore += 5
    health.strengths.push('Project has package.json with name')
  } else {
    health.issues.push('Missing package.json or project name')
  }
  
  const essentialDirs = ['components', 'pages', 'app']
  const foundEssential = essentialDirs.filter(dir => structure.directories.includes(dir))
  structureScore += (foundEssential.length / essentialDirs.length) * 20
  
  if (foundEssential.length === essentialDirs.length) {
    health.strengths.push('All essential directories present')
  } else {
    const missing = essentialDirs.filter(d => !foundEssential.includes(d))
    health.suggestions.push(`Consider creating missing directories: ${missing.join(', ')}`)
  }
  
  health.categories.structure = structureScore
  totalScore += structureScore
  
  // Testing Assessment (30 points)
  let testingScore = 0
  if (testingInfo.framework !== 'none') {
    testingScore += 15
    health.strengths.push(`Testing framework configured: ${testingInfo.framework}`)
  } else {
    health.issues.push('No testing framework detected')
    health.suggestions.push('Set up Vitest or Jest for testing')
  }
  
  if (testingInfo.bdd) {
    testingScore += 10
    health.strengths.push('BDD testing setup detected')
  } else {
    health.suggestions.push('Consider setting up BDD testing with Cucumber')
  }
  
  if (testingInfo.e2e) {
    testingScore += 5
    health.strengths.push(`E2E testing configured: ${testingInfo.e2e}`)
  } else {
    health.suggestions.push('Consider adding E2E testing with Playwright')
  }
  
  health.categories.testing = testingScore
  totalScore += testingScore
  
  // Configuration Assessment (20 points)
  let configScore = 0
  if (Object.keys(structure.nuxtConfig).length > 0) {
    configScore += 10
    health.strengths.push('Nuxt configuration found')
  } else {
    health.issues.push('Missing or incomplete Nuxt configuration')
  }
  
  if (structure.type === 'nuxt3') {
    configScore += 10
    health.strengths.push('Using modern Nuxt 3 framework')
  } else if (structure.type === 'nuxt2') {
    configScore += 5
    health.suggestions.push('Consider upgrading to Nuxt 3')
  }
  
  health.categories.configuration = configScore
  totalScore += configScore
  
  // Dependencies Assessment (15 points)
  let depsScore = 0
  if (structure.dependencies.includes('typescript') || existsSync(join(projectPath, 'tsconfig.json'))) {
    depsScore += 10
    health.strengths.push('TypeScript configuration detected')
  } else {
    health.suggestions.push('Consider adding TypeScript for better development experience')
  }
  
  if (structure.dependencies.includes('@nuxt/devtools')) {
    depsScore += 5
    health.strengths.push('Nuxt DevTools configured')
  }
  
  health.categories.dependencies = depsScore
  totalScore += depsScore
  
  // BDD Assessment (10 points)
  let bddScore = 0
  if (structure.bddStructure.hasBDD) {
    bddScore += 5
    health.strengths.push('BDD structure detected')
    
    if (structure.bddStructure.featureFiles.length > 0) {
      bddScore += 3
      health.strengths.push(`${structure.bddStructure.featureFiles.length} feature files found`)
    }
    
    if (structure.bddStructure.stepFiles.length > 0) {
      bddScore += 2
      health.strengths.push(`${structure.bddStructure.stepFiles.length} step definition files found`)
    }
  } else {
    health.suggestions.push('Consider setting up BDD testing structure')
  }
  
  health.categories.bdd = bddScore
  totalScore += bddScore
  
  // Calculate final score and grade
  health.score = Math.min(totalScore, maxScore)
  
  if (health.score >= 90) health.grade = 'A'
  else if (health.score >= 80) health.grade = 'B'
  else if (health.score >= 70) health.grade = 'C'
  else if (health.score >= 60) health.grade = 'D'
  else health.grade = 'F'
  
  return health
}

/**
 * Advanced project complexity analysis
 * @param {string} projectPath - Project root path
 * @returns {Promise<Object>} - Complexity analysis
 */
export async function analyzeProjectComplexity(projectPath = process.cwd()) {
  const structure = await discoverProjectStructure(projectPath)
  
  const complexity = {
    score: 0,
    level: 'simple',
    factors: {
      directories: structure.directories.length,
      dependencies: structure.dependencies.length,
      modules: (structure.nuxtConfig.modules || []).length,
      testing: structure.testingConfig.frameworks.length,
      bdd: structure.bddStructure.hasBDD ? 1 : 0
    },
    recommendations: []
  }
  
  // Calculate complexity score
  let score = 0
  
  // Directory complexity (max 25 points)
  score += Math.min(structure.directories.length * 1.5, 25)
  
  // Dependency complexity (max 30 points)
  score += Math.min(structure.dependencies.length * 0.8, 30)
  
  // Module complexity (max 20 points)
  score += Math.min((structure.nuxtConfig.modules || []).length * 4, 20)
  
  // Testing complexity (max 15 points)
  score += structure.testingConfig.frameworks.length * 5
  
  // BDD complexity (max 10 points)
  if (structure.bddStructure.hasBDD) {
    score += 5
    score += Math.min(structure.bddStructure.featureFiles.length * 0.5, 5)
  }
  
  complexity.score = Math.min(score, 100)
  
  // Determine complexity level
  if (complexity.score < 30) {
    complexity.level = 'simple'
    complexity.recommendations.push('Consider adding more comprehensive testing')
  } else if (complexity.score < 60) {
    complexity.level = 'moderate'
    complexity.recommendations.push('Good balance of features and complexity')
  } else {
    complexity.level = 'complex'
    complexity.recommendations.push('Consider refactoring to reduce complexity')
    complexity.recommendations.push('Ensure comprehensive documentation')
  }
  
  return complexity
}