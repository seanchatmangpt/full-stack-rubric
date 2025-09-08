/**
 * Zero-configuration setup utilities for Nuxt BDD projects
 * Provides minimal setup with intelligent defaults and auto-detection
 * Enhanced with BDD testing capabilities and Nuxt-specific optimizations
 */

import { readFile, writeFile, mkdir, access } from 'fs/promises'
import { join, dirname } from 'path'
import { existsSync } from 'fs'
import { discoverProjectStructure } from './auto-discovery.js'
import { generateSmartDefaults } from './smart-defaults.js'
import { getPreset, recommendPresets } from './presets.js'
import { pluginSystem } from './plugin-system.js'

/**
 * @typedef {Object} ZeroConfigResult
 * @property {boolean} success - Whether setup was successful
 * @property {Object} config - Generated configuration
 * @property {string[]} filesCreated - List of created files
 * @property {string[]} recommendations - Setup recommendations
 * @property {Object} structure - Detected project structure
 * @property {Object} bddConfig - BDD-specific configuration
 */

/**
 * Initialize zero-config setup for a Nuxt BDD project
 * @param {string} projectPath - Path to project directory
 * @param {Object} options - Setup options
 * @returns {Promise<ZeroConfigResult>} - Setup result
 */
export async function initializeZeroConfig(projectPath = process.cwd(), options = {}) {
  const result = {
    success: false,
    config: {},
    filesCreated: [],
    recommendations: [],
    structure: {},
    bddConfig: {}
  }
  
  try {
    
    // Discover existing project structure
    result.structure = await discoverProjectStructure(projectPath)
    
    // Generate smart defaults with BDD enhancements
    const smartConfig = await generateSmartDefaults(projectPath, {
      ...options,
      enableBDD: true,
      testingFramework: 'vitest',
      cucumberIntegration: true
    })
    
    // Apply recommended presets (prioritize testing-focused)
    const recommendedPresets = recommendPresets(result.structure)
    
    // Prioritize testing-focused preset for BDD projects
    if (!recommendedPresets.includes('testing-focused')) {
      recommendedPresets.unshift('testing-focused')
    }
    
    let finalConfig = smartConfig
    
    if (recommendedPresets.length > 0 && options.usePreset !== false) {
      const primaryPreset = getPreset(recommendedPresets[0])
      if (primaryPreset) {
        finalConfig = mergeConfigurations(primaryPreset.config, smartConfig)
        result.recommendations.push(`Applied preset: ${primaryPreset.name}`)
      }
    }
    
    // Apply BDD-specific enhancements
    finalConfig = await enhanceForBDD(finalConfig, result.structure, options)
    result.bddConfig = extractBDDConfig(finalConfig)
    
    // Apply plugins with BDD support
    await pluginSystem.initialize()
    finalConfig = await pluginSystem.applyMiddleware(finalConfig)
    finalConfig = await pluginSystem.callHook('config:modify', finalConfig)
    
    result.config = finalConfig
    
    // Create configuration files
    const createdFiles = await createConfigurationFiles(projectPath, finalConfig, options)
    result.filesCreated = createdFiles
    
    // Generate package.json scripts with BDD commands
    if (options.updatePackageJson !== false) {
      await updatePackageJsonScripts(projectPath, finalConfig, recommendedPresets[0])
    }
    
    // Create essential directories including BDD structure
    await createEssentialDirectories(projectPath, finalConfig)
    
    // Generate BDD-specific recommendations
    result.recommendations.push(...generateBDDRecommendations(result.structure, finalConfig))
    
    result.success = true
    
    // Display next steps
    displayNextSteps(result)
    
  } catch (error) {
    result.recommendations.push(`Setup failed: ${error.message}`)
  }
  
  return result
}

/**
 * Create a new BDD-ready Nuxt project with zero configuration
 * @param {string} projectName - Name of the new project
 * @param {string} projectPath - Path where to create the project
 * @param {Object} options - Project creation options
 * @returns {Promise<ZeroConfigResult>} - Creation result
 */
export async function createNewProject(projectName, projectPath, options = {}) {
  const fullPath = join(projectPath, projectName)
  
  
  // Create project directory
  await mkdir(fullPath, { recursive: true })
  
  // Create basic package.json with BDD dependencies
  await createPackageJson(fullPath, projectName, {
    ...options,
    includeBDD: true,
    testingFramework: 'vitest'
  })
  
  // Initialize zero-config setup with BDD enhancements
  const result = await initializeZeroConfig(fullPath, {
    ...options,
    enableBDD: true,
    createExampleTests: true
  })
  
  if (result.success) {
  }
  
  return result
}

/**
 * Quick BDD-enhanced setup for existing projects
 * @param {string} projectPath - Project path
 * @param {string} preset - Preset name to apply
 * @returns {Promise<ZeroConfigResult>} - Setup result
 */
export async function quickSetup(projectPath = process.cwd(), preset = 'testing-focused') {
  const options = {
    usePreset: true,
    preset: preset,
    updatePackageJson: true,
    createDirectories: true,
    enableBDD: true,
    createExampleTests: true
  }
  
  return await initializeZeroConfig(projectPath, options)
}

/**
 * Enhance configuration for BDD testing
 * @param {Object} config - Base configuration
 * @param {Object} structure - Project structure
 * @param {Object} options - Enhancement options
 * @returns {Promise<Object>} - Enhanced configuration
 */
async function enhanceForBDD(config, structure, options = {}) {
  // Add BDD testing configuration
  config.testing = {
    ...config.testing,
    bdd: {
      enabled: true,
      featuresDir: 'tests/features',
      stepDefinitionsDir: 'tests/steps',
      supportDir: 'tests/support',
      cucumberOptions: {
        requireModule: ['esm'],
        format: ['progress', 'json:tests/results/cucumber-report.json'],
        formatOptions: { snippetInterface: 'async-await' }
      }
    }
  }
  
  // Enhance Vitest configuration for BDD
  if (config.testing?.framework === 'vitest') {
    config.testing.vitest = {
      ...config.testing.vitest,
      setupFiles: [
        './tests/setup/global-setup.js',
        './tests/setup/bdd-setup.js'
      ],
      testMatch: [
        'tests/**/*.test.js',
        'tests/**/*.spec.js',
        'tests/bdd/**/*.js'
      ],
      coverage: {
        ...config.testing.vitest.coverage,
        include: ['app/**', 'server/**', 'components/**'],
        exclude: [
          'node_modules/',
          'tests/',
          '**/*.d.ts',
          'coverage/',
          '.nuxt/'
        ]
      }
    }
  }
  
  // Add BDD-specific Nuxt modules
  config.nuxt = {
    ...config.nuxt,
    modules: [
      ...config.nuxt.modules || [],
      '@nuxt/test-utils'
    ]
  }
  
  return config
}

/**
 * Extract BDD-specific configuration
 * @param {Object} config - Full configuration
 * @returns {Object} - BDD configuration
 */
function extractBDDConfig(config) {
  return {
    testingFramework: config.testing?.framework || 'vitest',
    bddEnabled: config.testing?.bdd?.enabled || false,
    featuresDir: config.testing?.bdd?.featuresDir || 'tests/features',
    stepDefinitionsDir: config.testing?.bdd?.stepDefinitionsDir || 'tests/steps',
    cucumberOptions: config.testing?.bdd?.cucumberOptions || {}
  }
}

/**
 * Create configuration files with BDD enhancements
 * @param {string} projectPath - Project path
 * @param {Object} config - Configuration object
 * @param {Object} options - Creation options
 * @returns {Promise<string[]>} - Array of created file paths
 */
async function createConfigurationFiles(projectPath, config, options) {
  const createdFiles = []
  
  // Create nuxt.config.js
  const nuxtConfigPath = join(projectPath, 'nuxt.config.js')
  if (!existsSync(nuxtConfigPath) || options.overwrite) {
    const nuxtConfigContent = generateNuxtConfig(config.nuxt)
    await writeFile(nuxtConfigPath, nuxtConfigContent)
    createdFiles.push('nuxt.config.js')
  }
  
  // Create vitest.config.js with BDD support
  if (config.testing?.framework === 'vitest') {
    const vitestConfigPath = join(projectPath, 'vitest.config.js')
    if (!existsSync(vitestConfigPath) || options.overwrite) {
      const vitestConfigContent = generateVitestConfig(config.testing.vitest)
      await writeFile(vitestConfigPath, vitestConfigContent)
      createdFiles.push('vitest.config.js')
    }
  }
  
  // Create cucumber.config.js
  if (config.testing?.bdd?.enabled) {
    const cucumberConfigPath = join(projectPath, 'cucumber.config.js')
    if (!existsSync(cucumberConfigPath) || options.overwrite) {
      const cucumberConfigContent = generateCucumberConfig(config.testing.bdd)
      await writeFile(cucumberConfigPath, cucumberConfigContent)
      createdFiles.push('cucumber.config.js')
    }
  }
  
  // Create example BDD test files if requested
  if (options.createExampleTests) {
    await createExampleBDDFiles(projectPath)
    createdFiles.push(
      'tests/features/example.feature',
      'tests/steps/example.steps.js',
      'tests/setup/bdd-setup.js'
    )
  }
  
  return createdFiles
}

/**
 * Generate Nuxt configuration with BDD enhancements
 * @param {Object} nuxtConfig - Nuxt configuration object
 * @returns {string} - Configuration file content
 */
function generateNuxtConfig(nuxtConfig) {
  return `// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig(${JSON.stringify(nuxtConfig, null, 2)})
`
}

/**
 * Generate Vitest configuration with BDD support
 * @param {Object} vitestConfig - Vitest configuration object
 * @returns {string} - Configuration file content
 */
function generateVitestConfig(vitestConfig) {
  return `import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: ${JSON.stringify(vitestConfig, null, 4)},
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '~': resolve(__dirname, '.')
    }
  }
})
`
}

/**
 * Generate Cucumber configuration
 * @param {Object} bddConfig - BDD configuration object
 * @returns {string} - Configuration file content
 */
function generateCucumberConfig(bddConfig) {
  return `/**
 * Cucumber BDD Configuration
 * @see https://cucumber.io/docs/cucumber/api/
 */
export default {
  paths: ['${bddConfig.featuresDir || 'tests/features'}/**/*.feature'],
  require: ['${bddConfig.stepDefinitionsDir || 'tests/steps'}/**/*.js'],
  requireModule: ['esm'],
  format: [
    'progress',
    'json:tests/results/cucumber-report.json',
    'html:tests/results/cucumber-report.html'
  ],
  formatOptions: {
    snippetInterface: 'async-await'
  },
  parallel: 2,
  ...${JSON.stringify(bddConfig.cucumberOptions || {}, null, 2)}
}
`
}

/**
 * Create example BDD test files
 * @param {string} projectPath - Project path
 */
async function createExampleBDDFiles(projectPath) {
  // Create directories
  await mkdir(join(projectPath, 'tests/features'), { recursive: true })
  await mkdir(join(projectPath, 'tests/steps'), { recursive: true })
  await mkdir(join(projectPath, 'tests/setup'), { recursive: true })
  
  // Create example feature file
  const featureContent = `Feature: Home Page
  As a user
  I want to visit the home page
  So that I can see the application content

  Scenario: Visit home page
    Given I am on the home page
    When I look at the page title
    Then I should see "Welcome to Nuxt!"
    And the page should be accessible
`
  await writeFile(join(projectPath, 'tests/features/example.feature'), featureContent)
  
  // Create example step definitions
  const stepsContent = `import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from 'vitest'
import { $fetch } from '@nuxt/test-utils/e2e'

Given('I am on the home page', async function () {
  this.response = await $fetch('/')
})

When('I look at the page title', function () {
  // Page title check will be performed in Then step
})

Then('I should see {string}', function (expectedText) {
  expect(this.response).toContain(expectedText)
})

Then('the page should be accessible', function () {
  // Add accessibility checks here
  expect(this.response).toContain('<html')
})
`
  await writeFile(join(projectPath, 'tests/steps/example.steps.js'), stepsContent)
  
  // Create BDD setup file
  const setupContent = `/**
 * BDD Test Setup
 * Global setup for Cucumber BDD tests
 */

import { beforeAll, afterAll } from 'vitest'
import { setup, teardown } from '@nuxt/test-utils/e2e'

beforeAll(async () => {
  await setup({
    rootDir: process.cwd(),
    browser: true
  })
})

afterAll(async () => {
  await teardown()
})

// Global test configuration
global.testTimeout = 30000
`
  await writeFile(join(projectPath, 'tests/setup/bdd-setup.js'), setupContent)
}

/**
 * Update package.json with BDD scripts
 * @param {string} projectPath - Project path
 * @param {Object} config - Configuration object
 * @param {string} presetName - Applied preset name
 */
async function updatePackageJsonScripts(projectPath, config, presetName) {
  const packageJsonPath = join(projectPath, 'package.json')
  
  if (!existsSync(packageJsonPath)) {
    return
  }
  
  const packageContent = await readFile(packageJsonPath, 'utf-8')
  const packageJson = JSON.parse(packageContent)
  
  packageJson.scripts = packageJson.scripts || {}
  
  // Standard Nuxt scripts
  const scripts = {
    build: 'nuxt build',
    dev: 'nuxt dev',
    generate: 'nuxt generate',
    preview: 'nuxt preview',
    postinstall: 'nuxt prepare'
  }
  
  // BDD testing scripts
  if (config.testing?.framework === 'vitest') {
    scripts.test = 'vitest'
    scripts['test:ui'] = 'vitest --ui'
    scripts['test:coverage'] = 'vitest --coverage'
    scripts['test:watch'] = 'vitest --watch'
  }
  
  // BDD-specific scripts
  if (config.testing?.bdd?.enabled) {
    scripts['test:bdd'] = 'cucumber-js'
    scripts['test:bdd:watch'] = 'cucumber-js --watch'
    scripts['test:e2e'] = 'playwright test'
  }
  
  // Linting and quality scripts
  scripts.lint = 'eslint .'
  scripts['lint:fix'] = 'eslint . --fix'
  scripts.typecheck = 'nuxt typecheck'
  
  // Merge scripts without overwriting existing ones
  for (const [name, script] of Object.entries(scripts)) {
    if (!packageJson.scripts[name]) {
      packageJson.scripts[name] = script
    }
  }
  
  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

/**
 * Create essential directories with BDD structure
 * @param {string} projectPath - Project path
 * @param {Object} config - Configuration object
 */
async function createEssentialDirectories(projectPath, config) {
  const directories = [
    // Nuxt directories
    'app/components',
    'app/pages',
    'app/layouts',
    'app/plugins',
    'app/middleware',
    'app/composables',
    'app/utils',
    'app/stores',
    'assets/css',
    'assets/images',
    'public',
    'server/api',
    
    // BDD testing directories
    'tests/features',
    'tests/steps',
    'tests/support',
    'tests/setup',
    'tests/unit',
    'tests/integration',
    'tests/e2e',
    'tests/results'
  ]
  
  for (const dir of directories) {
    const dirPath = join(projectPath, dir)
    try {
      await access(dirPath)
    } catch {
      await mkdir(dirPath, { recursive: true })
    }
  }
}

/**
 * Create basic package.json with BDD dependencies
 * @param {string} projectPath - Project path
 * @param {string} projectName - Project name
 * @param {Object} options - Creation options
 */
async function createPackageJson(projectPath, projectName, options) {
  const packageJson = {
    name: projectName,
    private: true,
    type: 'module',
    version: '1.0.0',
    description: options.description || `${projectName} - Nuxt BDD Application`,
    scripts: {
      build: 'nuxt build',
      dev: 'nuxt dev',
      generate: 'nuxt generate',
      preview: 'nuxt preview'
    },
    dependencies: {
      nuxt: '^3.0.0',
      vue: '^3.0.0'
    },
    devDependencies: {
      '@nuxt/devtools': 'latest',
      '@nuxt/test-utils': '^3.0.0'
    }
  }
  
  // Add BDD dependencies
  if (options.includeBDD) {
    Object.assign(packageJson.devDependencies, {
      'vitest': '^1.0.0',
      '@vue/test-utils': '^2.0.0',
      'jsdom': '^23.0.0',
      '@cucumber/cucumber': '^10.0.0',
      'playwright': '^1.40.0',
      'eslint': '^8.0.0',
      '@nuxt/eslint-config': 'latest'
    })
    
    // Add BDD scripts
    Object.assign(packageJson.scripts, {
      test: 'vitest',
      'test:ui': 'vitest --ui',
      'test:bdd': 'cucumber-js',
      'test:e2e': 'playwright test',
      lint: 'eslint .',
      'lint:fix': 'eslint . --fix'
    })
  }
  
  const packageJsonPath = join(projectPath, 'package.json')
  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

/**
 * Generate BDD-specific setup recommendations
 * @param {Object} structure - Project structure
 * @param {Object} config - Configuration
 * @returns {string[]} - Array of BDD recommendations
 */
function generateBDDRecommendations(structure, config) {
  const recommendations = []
  
  // Installation recommendations
  recommendations.push('Run "pnpm install" to install BDD dependencies')
  
  // Development recommendations
  recommendations.push('Run "pnpm run dev" to start development server')
  recommendations.push('Run "pnpm run test" to execute unit tests')
  recommendations.push('Run "pnpm run test:bdd" to run BDD scenarios')
  recommendations.push('Run "pnpm run test:ui" for interactive testing')
  
  // BDD workflow recommendations
  if (config.testing?.bdd?.enabled) {
    recommendations.push('Write feature files in tests/features/')
    recommendations.push('Implement step definitions in tests/steps/')
    recommendations.push('Use "Given/When/Then" syntax for scenarios')
  }
  
  // Quality recommendations
  recommendations.push('Run "pnpm run lint" to check code quality')
  recommendations.push('Consider adding TypeScript for better development experience')
  
  return recommendations
}

/**
 * Display next steps after successful setup
 * @param {ZeroConfigResult} result - Setup result
 */
function displayNextSteps(result) {
  
  if (result.recommendations.length > 0) {
  }
}

/**
 * Validate zero-config BDD setup
 * @param {string} projectPath - Project path
 * @returns {Promise<Object>} - Validation result
 */
export async function validateZeroConfig(projectPath = process.cwd()) {
  const validation = {
    valid: true,
    issues: [],
    suggestions: []
  }
  
  // Check for essential files
  const essentialFiles = [
    'nuxt.config.js',
    'package.json'
  ]
  
  for (const file of essentialFiles) {
    const filePath = join(projectPath, file)
    if (!existsSync(filePath)) {
      validation.valid = false
      validation.issues.push(`Missing ${file}`)
    }
  }
  
  // Check for BDD setup
  const bddFiles = [
    'vitest.config.js',
    'cucumber.config.js'
  ]
  
  let hasBDDSetup = false
  for (const file of bddFiles) {
    const filePath = join(projectPath, file)
    if (existsSync(filePath)) {
      hasBDDSetup = true
      break
    }
  }
  
  if (!hasBDDSetup) {
    validation.suggestions.push('Consider setting up BDD testing with Vitest and Cucumber')
  }
  
  // Check for test directories
  const testDirs = ['tests/features', 'tests/steps']
  for (const dir of testDirs) {
    const dirPath = join(projectPath, dir)
    try {
      await access(dirPath)
    } catch {
      validation.suggestions.push(`Consider creating ${dir} directory for BDD tests`)
    }
  }
  
  return validation
}

/**
 * Merge multiple configuration objects
 * @param {...Object} configs - Configuration objects to merge
 * @returns {Object} - Merged configuration
 */
function mergeConfigurations(...configs) {
  const result = {}
  
  for (const config of configs) {
    if (config && typeof config === 'object') {
      for (const [key, value] of Object.entries(config)) {
        if (Array.isArray(value)) {
          result[key] = [...(result[key] || []), ...value]
        } else if (value && typeof value === 'object') {
          result[key] = mergeConfigurations(result[key] || {}, value)
        } else {
          result[key] = value
        }
      }
    }
  }
  
  return result
}