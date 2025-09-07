/**
 * Zero-configuration setup utilities for new projects
 * Provides minimal setup with intelligent defaults and auto-detection
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
 */

/**
 * Initialize zero-config setup for a new or existing project
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
    structure: {}
  }
  
  try {
    console.log('🔍 Analyzing project structure...')
    
    // Discover existing project structure
    result.structure = await discoverProjectStructure(projectPath)
    
    // Generate smart defaults
    console.log('🧠 Generating intelligent defaults...')
    const smartConfig = await generateSmartDefaults(projectPath, options)
    
    // Apply recommended presets
    console.log('📋 Applying recommended configurations...')
    const recommendedPresets = recommendPresets(result.structure)
    
    let finalConfig = smartConfig
    
    if (recommendedPresets.length > 0 && options.usePreset !== false) {
      const primaryPreset = getPreset(recommendedPresets[0])
      if (primaryPreset) {
        finalConfig = mergeConfigurations(primaryPreset.config, smartConfig)
        result.recommendations.push(`Applied preset: ${primaryPreset.name}`)
      }
    }
    
    // Apply plugins
    await pluginSystem.initialize()
    finalConfig = await pluginSystem.applyMiddleware(finalConfig)
    finalConfig = await pluginSystem.callHook('config:modify', finalConfig)
    
    result.config = finalConfig
    
    // Create configuration files
    console.log('📝 Creating configuration files...')
    const createdFiles = await createConfigurationFiles(projectPath, finalConfig, options)
    result.filesCreated = createdFiles
    
    // Generate package.json scripts
    if (options.updatePackageJson !== false) {
      console.log('📦 Updating package.json scripts...')
      await updatePackageJsonScripts(projectPath, finalConfig, recommendedPresets[0])
    }
    
    // Create essential directories
    console.log('📁 Creating project directories...')
    await createEssentialDirectories(projectPath, finalConfig)
    
    // Generate recommendations
    result.recommendations.push(...generateSetupRecommendations(result.structure, finalConfig))
    
    result.success = true
    console.log('✅ Zero-config setup completed successfully!')
    
  } catch (error) {
    console.error('❌ Zero-config setup failed:', error.message)
    result.recommendations.push(`Setup failed: ${error.message}`)
  }
  
  return result
}

/**
 * Create a new project with zero configuration
 * @param {string} projectName - Name of the new project
 * @param {string} projectPath - Path where to create the project
 * @param {Object} options - Project creation options
 * @returns {Promise<ZeroConfigResult>} - Creation result
 */
export async function createNewProject(projectName, projectPath, options = {}) {
  const fullPath = join(projectPath, projectName)
  
  console.log(`🚀 Creating new project: ${projectName}`)
  
  // Create project directory
  await mkdir(fullPath, { recursive: true })
  
  // Create basic package.json
  await createPackageJson(fullPath, projectName, options)
  
  // Initialize zero-config setup
  const result = await initializeZeroConfig(fullPath, options)
  
  if (result.success) {
    console.log(`✨ Project "${projectName}" created successfully!`)
    console.log(`📍 Location: ${fullPath}`)
    console.log('\n🚀 Next steps:')
    console.log(`   cd ${projectName}`)
    console.log('   pnpm install')
    console.log('   pnpm run dev')
  }
  
  return result
}

/**
 * Quick setup for existing projects
 * @param {string} projectPath - Project path
 * @param {string} preset - Preset name to apply
 * @returns {Promise<ZeroConfigResult>} - Setup result
 */
export async function quickSetup(projectPath = process.cwd(), preset = null) {
  const options = {
    usePreset: preset !== null,
    preset: preset,
    updatePackageJson: true,
    createDirectories: true
  }
  
  return await initializeZeroConfig(projectPath, options)
}

/**
 * Create configuration files based on generated config
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
  
  // Create vitest.config.js if testing is configured
  if (config.testing?.framework === 'vitest') {
    const vitestConfigPath = join(projectPath, 'vitest.config.js')
    if (!existsSync(vitestConfigPath) || options.overwrite) {
      const vitestConfigContent = generateVitestConfig(config.testing.vitest)
      await writeFile(vitestConfigPath, vitestConfigContent)
      createdFiles.push('vitest.config.js')
    }
  }
  
  // Create tailwind.config.js if Tailwind is detected
  if (config.nuxt?.modules?.includes('@nuxtjs/tailwindcss')) {
    const tailwindConfigPath = join(projectPath, 'tailwind.config.js')
    if (!existsSync(tailwindConfigPath) || options.overwrite) {
      const tailwindConfigContent = generateTailwindConfig()
      await writeFile(tailwindConfigPath, tailwindConfigContent)
      createdFiles.push('tailwind.config.js')
    }
  }
  
  // Create main CSS file
  const cssDir = join(projectPath, 'assets', 'css')
  const mainCssPath = join(cssDir, 'main.css')
  if (!existsSync(mainCssPath) || options.overwrite) {
    await mkdir(cssDir, { recursive: true })
    const mainCssContent = generateMainCss(config.nuxt)
    await writeFile(mainCssPath, mainCssContent)
    createdFiles.push('assets/css/main.css')
  }
  
  return createdFiles
}

/**
 * Generate Nuxt configuration file content
 * @param {Object} nuxtConfig - Nuxt configuration object
 * @returns {string} - Configuration file content
 */
function generateNuxtConfig(nuxtConfig) {
  return `// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig(${JSON.stringify(nuxtConfig, null, 2)})
`
}

/**
 * Generate Vitest configuration file content
 * @param {Object} vitestConfig - Vitest configuration object
 * @returns {string} - Configuration file content
 */
function generateVitestConfig(vitestConfig) {
  return `import { defineConfig } from 'vitest/config'

export default defineConfig(${JSON.stringify(vitestConfig, null, 2)})
`
}

/**
 * Generate Tailwind CSS configuration
 * @returns {string} - Tailwind config content
 */
function generateTailwindConfig() {
  return `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`
}

/**
 * Generate main CSS file content
 * @param {Object} nuxtConfig - Nuxt configuration
 * @returns {string} - CSS content
 */
function generateMainCss(nuxtConfig) {
  let css = ''
  
  // Add Tailwind imports if Tailwind is configured
  if (nuxtConfig?.modules?.includes('@nuxtjs/tailwindcss')) {
    css += `@tailwind base;
@tailwind components;
@tailwind utilities;

`
  }
  
  css += `/* Global styles */
html, body {
  font-family: 'Inter', sans-serif;
}

/* Custom utilities */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}
`
  
  return css
}

/**
 * Update package.json with recommended scripts
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
  
  // Ensure scripts object exists
  packageJson.scripts = packageJson.scripts || {}
  
  // Add standard scripts
  const scripts = {
    build: 'nuxt build',
    dev: 'nuxt dev',
    generate: 'nuxt generate',
    preview: 'nuxt preview'
  }
  
  // Add testing scripts
  if (config.testing?.framework === 'vitest') {
    scripts.test = 'vitest'
    scripts['test:ui'] = 'vitest --ui'
    scripts['test:coverage'] = 'vitest --coverage'
  }
  
  // Add preset-specific scripts
  if (presetName) {
    const preset = getPreset(presetName)
    if (preset && preset.scripts) {
      Object.assign(scripts, preset.scripts)
    }
  }
  
  // Merge scripts (don't overwrite existing)
  for (const [name, script] of Object.entries(scripts)) {
    if (!packageJson.scripts[name]) {
      packageJson.scripts[name] = script
    }
  }
  
  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

/**
 * Create essential project directories
 * @param {string} projectPath - Project path
 * @param {Object} config - Configuration object
 */
async function createEssentialDirectories(projectPath, config) {
  const directories = [
    'components',
    'pages',
    'layouts',
    'plugins',
    'middleware',
    'composables',
    'utils',
    'assets/css',
    'assets/images',
    'public',
    'server/api',
    'tests'
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
 * Create basic package.json for new projects
 * @param {string} projectPath - Project path
 * @param {string} projectName - Project name
 * @param {Object} options - Creation options
 */
async function createPackageJson(projectPath, projectName, options) {
  const packageJson = {
    name: projectName,
    private: true,
    version: '1.0.0',
    description: options.description || `${projectName} - Nuxt 3 application`,
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
      '@nuxt/devtools': 'latest'
    }
  }
  
  // Add preset dependencies
  if (options.preset) {
    const preset = getPreset(options.preset)
    if (preset) {
      for (const dep of preset.dependencies) {
        if (dep === 'nuxt' || dep === 'vue') {
          // Skip base dependencies
          continue
        }
        packageJson.dependencies[dep] = 'latest'
      }
    }
  }
  
  const packageJsonPath = join(projectPath, 'package.json')
  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

/**
 * Generate setup recommendations
 * @param {Object} structure - Project structure
 * @param {Object} config - Configuration
 * @returns {string[]} - Array of recommendations
 */
function generateSetupRecommendations(structure, config) {
  const recommendations = []
  
  // Installation recommendations
  recommendations.push('Run "pnpm install" to install dependencies')
  
  // Development recommendations
  recommendations.push('Run "pnpm run dev" to start development server')
  
  // Testing recommendations
  if (config.testing?.framework) {
    recommendations.push(`Run "pnpm run test" to execute ${config.testing.framework} tests`)
  } else {
    recommendations.push('Consider adding Vitest for testing')
  }
  
  // TypeScript recommendations
  if (!structure.dependencies.includes('typescript')) {
    recommendations.push('Consider adding TypeScript for better development experience')
  }
  
  // Content recommendations
  if (!config.nuxt?.modules?.includes('@nuxtjs/content')) {
    recommendations.push('Consider adding @nuxtjs/content for content management')
  }
  
  return recommendations
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

/**
 * Validate zero-config setup
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
  
  // Check for testing setup
  if (!existsSync(join(projectPath, 'vitest.config.js'))) {
    validation.suggestions.push('Consider setting up Vitest for testing')
  }
  
  // Check for essential directories
  const essentialDirs = ['components', 'pages']
  for (const dir of essentialDirs) {
    const dirPath = join(projectPath, dir)
    try {
      await access(dirPath)
    } catch {
      validation.suggestions.push(`Consider creating ${dir} directory`)
    }
  }
  
  return validation
}