/**
 * Smart defaults system for intelligent configuration based on project context
 * Automatically generates optimal configurations based on detected patterns
 */

import { discoverProjectStructure, detectTestingFramework } from './auto-discovery.js'

/**
 * @typedef {Object} SmartConfig
 * @property {Object} nuxt - Nuxt configuration
 * @property {Object} testing - Testing configuration
 * @property {Object} build - Build configuration
 * @property {Object} development - Development configuration
 * @property {Object} performance - Performance optimizations
 * @property {Object} seo - SEO configurations
 */

/**
 * Generate smart defaults based on project analysis
 * @param {string} projectPath - Project root path
 * @param {Object} options - Override options
 * @returns {Promise<SmartConfig>} - Generated smart configuration
 */
export async function generateSmartDefaults(projectPath = process.cwd(), options = {}) {
  const structure = await discoverProjectStructure(projectPath)
  const testingInfo = await detectTestingFramework(projectPath)
  
  const config = {
    nuxt: generateNuxtDefaults(structure, options),
    testing: generateTestingDefaults(structure, testingInfo, options),
    build: generateBuildDefaults(structure, options),
    development: generateDevelopmentDefaults(structure, options),
    performance: generatePerformanceDefaults(structure, options),
    seo: generateSeoDefaults(structure, options)
  }
  
  return config
}

/**
 * Generate Nuxt-specific smart defaults
 * @param {Object} structure - Project structure information
 * @param {Object} options - Override options
 * @returns {Object} - Nuxt configuration defaults
 */
function generateNuxtDefaults(structure, options = {}) {
  const config = {
    // Base configuration
    ssr: true,
    target: 'server',
    
    // Directories configuration
    dir: {
      pages: structure.directories.includes('pages') ? 'pages' : 'app/pages',
      layouts: structure.directories.includes('layouts') ? 'layouts' : 'app/layouts',
      middleware: structure.directories.includes('middleware') ? 'middleware' : 'app/middleware',
      plugins: structure.directories.includes('plugins') ? 'plugins' : 'app/plugins'
    },
    
    // Auto-detect modules
    modules: [],
    
    // CSS configuration
    css: [],
    
    // Build configuration
    build: {
      transpile: []
    },
    
    // Runtime configuration
    runtimeConfig: {
      public: {}
    }
  }
  
  // Auto-detect and configure modules
  if (structure.dependencies.includes('@nuxtjs/tailwindcss')) {
    config.modules.push('@nuxtjs/tailwindcss')
  }
  
  if (structure.dependencies.includes('@nuxtjs/content')) {
    config.modules.push('@nuxtjs/content')
    config.content = {
      documentDriven: true,
      highlight: {
        theme: 'github-light'
      }
    }
  }
  
  if (structure.dependencies.includes('@pinia/nuxt')) {
    config.modules.push('@pinia/nuxt')
  }
  
  if (structure.dependencies.includes('@nuxtjs/i18n')) {
    config.modules.push('@nuxtjs/i18n')
    config.i18n = {
      defaultLocale: 'en',
      locales: ['en']
    }
  }
  
  // Configure CSS based on detected files
  if (structure.directories.includes('assets')) {
    config.css.push('~/assets/css/main.css')
  }
  
  // SPA mode for certain project types
  if (structure.dependencies.includes('spa') || options.spa) {
    config.ssr = false
    config.target = 'static'
  }
  
  // TypeScript configuration
  if (structure.dependencies.includes('typescript')) {
    config.typescript = {
      strict: true,
      typeCheck: true
    }
  }
  
  // Merge with user options
  return mergeDefaults(config, options.nuxt || {})
}

/**
 * Generate testing framework defaults
 * @param {Object} structure - Project structure information
 * @param {Object} testingInfo - Testing framework information
 * @param {Object} options - Override options
 * @returns {Object} - Testing configuration defaults
 */
function generateTestingDefaults(structure, testingInfo, options = {}) {
  const config = {
    framework: testingInfo.framework || 'vitest',
    testDir: testingInfo.testDirs[0] || 'tests',
    setupFiles: [],
    coverage: {
      enabled: true,
      threshold: 80
    },
    environment: 'jsdom'
  }
  
  // Vitest specific configuration
  if (config.framework === 'vitest') {
    config.vitest = {
      environment: 'jsdom',
      setupFiles: ['./tests/setup/global-setup.js'],
      globals: true,
      coverage: {
        reporter: ['text', 'html', 'lcov'],
        exclude: [
          'node_modules/',
          'tests/',
          '**/*.d.ts'
        ]
      }
    }
  }
  
  // Jest specific configuration
  if (config.framework === 'jest') {
    config.jest = {
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/global-setup.js'],
      moduleFileExtensions: ['js', 'json', 'vue'],
      transform: {
        '^.+\\.js$': 'babel-jest',
        '^.+\\.vue$': '@vue/vue3-jest'
      },
      collectCoverage: true,
      collectCoverageFrom: [
        'app/**/*.{js,vue}',
        'server/**/*.js',
        '!**/node_modules/**'
      ]
    }
  }
  
  // Setup files based on project structure
  if (structure.directories.includes('composables')) {
    config.setupFiles.push('./tests/setup/composables-setup.js')
  }
  
  if (structure.dependencies.includes('@pinia/nuxt')) {
    config.setupFiles.push('./tests/setup/pinia-setup.js')
  }
  
  return mergeDefaults(config, options.testing || {})
}

/**
 * Generate build configuration defaults
 * @param {Object} structure - Project structure information
 * @param {Object} options - Override options
 * @returns {Object} - Build configuration defaults
 */
function generateBuildDefaults(structure, options = {}) {
  const config = {
    analyze: false,
    extractCSS: true,
    optimization: {
      splitChunks: {
        chunks: 'all'
      }
    },
    babel: {
      compact: true
    }
  }
  
  // TypeScript build configuration
  if (structure.dependencies.includes('typescript')) {
    config.typescript = {
      typeCheck: true
    }
  }
  
  // Tailwind CSS build optimization
  if (structure.dependencies.includes('tailwindcss')) {
    config.postcss = {
      plugins: {
        tailwindcss: {},
        autoprefixer: {}
      }
    }
  }
  
  // Production optimizations
  if (process.env.NODE_ENV === 'production') {
    config.optimization.minimize = true
    config.extractCSS = true
    config.babel.compact = true
  }
  
  return mergeDefaults(config, options.build || {})
}

/**
 * Generate development configuration defaults
 * @param {Object} structure - Project structure information
 * @param {Object} options - Override options
 * @returns {Object} - Development configuration defaults
 */
function generateDevelopmentDefaults(structure, options = {}) {
  const config = {
    port: 3000,
    host: 'localhost',
    https: false,
    open: true,
    
    // Hot reload configuration
    watchers: {
      webpack: {
        aggregateTimeout: 300,
        poll: 1000
      }
    },
    
    // Development tools
    devtools: true,
    
    // Source maps
    sourcemap: {
      server: true,
      client: true
    }
  }
  
  // Enable Vue devtools
  if (structure.dependencies.includes('vue')) {
    config.vue = {
      config: {
        devtools: true
      }
    }
  }
  
  // TypeScript development configuration
  if (structure.dependencies.includes('typescript')) {
    config.typescript = {
      typeCheck: 'build'
    }
  }
  
  return mergeDefaults(config, options.development || {})
}

/**
 * Generate performance optimization defaults
 * @param {Object} structure - Project structure information
 * @param {Object} options - Override options
 * @returns {Object} - Performance configuration defaults
 */
function generatePerformanceDefaults(structure, options = {}) {
  const config = {
    // Image optimization
    image: {
      quality: 80,
      format: 'webp'
    },
    
    // Compression
    compression: {
      gzip: true,
      brotli: true
    },
    
    // Caching strategy
    cache: {
      max: 1000,
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    },
    
    // Bundle analysis
    bundle: {
      analyzer: false
    }
  }
  
  // PWA optimizations
  if (structure.dependencies.includes('@nuxtjs/pwa')) {
    config.pwa = {
      workbox: {
        cachingExtensions: '@/plugins/workbox-range-request.js',
        cleanupOutdatedCaches: true
      }
    }
  }
  
  // Content optimization
  if (structure.dependencies.includes('@nuxtjs/content')) {
    config.content = {
      liveEdit: false,
      markdown: {
        prism: {
          theme: 'prism-themes/themes/prism-material-oceanic.css'
        }
      }
    }
  }
  
  return mergeDefaults(config, options.performance || {})
}

/**
 * Generate SEO configuration defaults
 * @param {Object} structure - Project structure information
 * @param {Object} options - Override options
 * @returns {Object} - SEO configuration defaults
 */
function generateSeoDefaults(structure, options = {}) {
  const config = {
    // Meta configuration
    meta: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1'
    },
    
    // HTML head defaults
    head: {
      title: structure.packageInfo.name || 'Nuxt App',
      meta: [
        { name: 'description', content: structure.packageInfo.description || '' },
        { name: 'format-detection', content: 'telephone=no' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    },
    
    // Sitemap configuration
    sitemap: {
      hostname: 'https://example.com',
      gzip: true
    }
  }
  
  // Robots configuration
  if (!structure.dependencies.includes('no-robots')) {
    config.robots = {
      UserAgent: '*',
      Allow: '/'
    }
  }
  
  // Open Graph defaults
  config.head.meta.push(
    { property: 'og:title', content: config.head.title },
    { property: 'og:description', content: structure.packageInfo.description || '' },
    { property: 'og:type', content: 'website' }
  )
  
  // Twitter Card defaults
  config.head.meta.push(
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: config.head.title },
    { name: 'twitter:description', content: structure.packageInfo.description || '' }
  )
  
  return mergeDefaults(config, options.seo || {})
}

/**
 * Generate environment-specific defaults
 * @param {string} environment - Environment name (development, production, test)
 * @param {Object} structure - Project structure information
 * @param {Object} options - Override options
 * @returns {Object} - Environment-specific configuration
 */
export function generateEnvironmentDefaults(environment, structure, options = {}) {
  const baseConfig = {
    development: {
      debug: true,
      ssr: true,
      minify: false,
      devtools: true
    },
    
    production: {
      debug: false,
      ssr: true,
      minify: true,
      devtools: false,
      analyze: false
    },
    
    test: {
      debug: false,
      ssr: false,
      minify: false,
      devtools: false
    }
  }
  
  return mergeDefaults(baseConfig[environment] || {}, options)
}

/**
 * Deep merge configuration objects
 * @param {Object} defaults - Default configuration
 * @param {Object} overrides - Override configuration
 * @returns {Object} - Merged configuration
 */
function mergeDefaults(defaults, overrides) {
  if (!overrides) return defaults
  
  const result = { ...defaults }
  
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = mergeDefaults(result[key] || {}, value)
    } else {
      result[key] = value
    }
  }
  
  return result
}

/**
 * Generate adaptive configuration based on project size and complexity
 * @param {Object} structure - Project structure information
 * @returns {Object} - Adaptive configuration settings
 */
export function generateAdaptiveConfig(structure) {
  const complexity = calculateProjectComplexity(structure)
  
  const config = {
    // Basic configuration for all projects
    base: {
      ssr: true,
      devtools: true
    }
  }
  
  // Simple projects (complexity < 30)
  if (complexity < 30) {
    config.optimization = {
      bundleSize: 'small',
      caching: 'minimal',
      analysis: false
    }
  }
  
  // Medium projects (complexity 30-70)
  else if (complexity < 70) {
    config.optimization = {
      bundleSize: 'medium',
      caching: 'standard',
      analysis: true,
      splitting: true
    }
  }
  
  // Complex projects (complexity >= 70)
  else {
    config.optimization = {
      bundleSize: 'optimized',
      caching: 'aggressive',
      analysis: true,
      splitting: true,
      lazy: true,
      preload: true
    }
  }
  
  return config
}

/**
 * Calculate project complexity score
 * @param {Object} structure - Project structure information
 * @returns {number} - Complexity score (0-100)
 */
function calculateProjectComplexity(structure) {
  let score = 0
  
  // Directory count contribution (max 20 points)
  score += Math.min(structure.directories.length * 2, 20)
  
  // Dependency count contribution (max 30 points)
  score += Math.min(structure.dependencies.length, 30)
  
  // Module complexity (max 25 points)
  if (structure.nuxtConfig.modules) {
    score += Math.min(structure.nuxtConfig.modules.length * 3, 25)
  }
  
  // Framework complexity (max 25 points)
  if (structure.dependencies.includes('typescript')) score += 10
  if (structure.dependencies.includes('@nuxtjs/content')) score += 5
  if (structure.dependencies.includes('@pinia/nuxt')) score += 5
  if (structure.dependencies.includes('@nuxtjs/i18n')) score += 5
  
  return Math.min(score, 100)
}