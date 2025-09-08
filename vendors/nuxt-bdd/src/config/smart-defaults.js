/**
 * Smart defaults system for intelligent Nuxt BDD configuration
 * Automatically generates optimal configurations based on detected patterns
 * Enhanced with BDD-specific defaults and modern Nuxt 3 practices
 */

import { discoverProjectStructure, detectTestingFramework } from './auto-discovery.js'

/**
 * @typedef {Object} SmartConfig
 * @property {Object} nuxt - Nuxt configuration
 * @property {Object} testing - Testing configuration
 * @property {Object} bdd - BDD-specific configuration
 * @property {Object} build - Build configuration
 * @property {Object} development - Development configuration
 * @property {Object} performance - Performance optimizations
 * @property {Object} seo - SEO configurations
 * @property {Object} security - Security configurations
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
    bdd: generateBDDDefaults(structure, options),
    build: generateBuildDefaults(structure, options),
    development: generateDevelopmentDefaults(structure, options),
    performance: generatePerformanceDefaults(structure, options),
    seo: generateSeoDefaults(structure, options),
    security: generateSecurityDefaults(structure, options)
  }
  
  return config
}

/**
 * Generate Nuxt-specific smart defaults with modern practices
 * @param {Object} structure - Project structure information
 * @param {Object} options - Override options
 * @returns {Object} - Nuxt configuration defaults
 */
function generateNuxtDefaults(structure, options = {}) {
  const config = {
    // Nuxt 3 defaults
    experimental: {
      payloadExtraction: false,
      renderJsonPayloads: true
    },
    
    // Directory configuration based on detected structure
    dir: {},
    
    // Auto-detect modules
    modules: [],
    
    // CSS configuration
    css: [],
    
    // Build configuration
    build: {},
    
    // App configuration
    app: {
      head: {
        charset: 'utf-8',
        viewport: 'width=device-width, initial-scale=1'
      }
    },
    
    // Runtime configuration
    runtimeConfig: {
      public: {}
    },
    
    // TypeScript configuration
    typescript: {
      strict: true,
      typeCheck: false // Performance optimization
    }
  }
  
  // Configure directory structure based on what's detected
  if (structure.directories.includes('app')) {
    // App directory structure (Nuxt 3 recommended)
    if (structure.directories.includes('app/pages')) config.dir.pages = 'app/pages'
    if (structure.directories.includes('app/layouts')) config.dir.layouts = 'app/layouts'
    if (structure.directories.includes('app/middleware')) config.dir.middleware = 'app/middleware'
    if (structure.directories.includes('app/plugins')) config.dir.plugins = 'app/plugins'
  }
  
  // Auto-detect and configure modules
  if (structure.dependencies.includes('@nuxtjs/tailwindcss')) {
    config.modules.push('@nuxtjs/tailwindcss')
    config.tailwindcss = {
      cssPath: '~/assets/css/main.css',
      configPath: 'tailwind.config.js'
    }
  }
  
  if (structure.dependencies.includes('@nuxtjs/content')) {
    config.modules.push('@nuxtjs/content')
    config.content = {
      documentDriven: true,
      highlight: {
        theme: {
          default: 'github-light',
          dark: 'github-dark'
        }
      },
      markdown: {
        toc: {
          depth: 3,
          searchDepth: 3
        }
      }
    }
  }
  
  if (structure.dependencies.includes('@pinia/nuxt')) {
    config.modules.push('@pinia/nuxt')
    config.pinia = {
      autoImports: ['defineStore', 'storeToRefs', 'acceptHMRUpdate']
    }
  }
  
  if (structure.dependencies.includes('@nuxtjs/i18n')) {
    config.modules.push('@nuxtjs/i18n')
    config.i18n = {
      defaultLocale: 'en',
      locales: [
        { code: 'en', name: 'English', file: 'en.json' }
      ],
      langDir: 'locales/',
      strategy: 'prefix_except_default'
    }
  }
  
  if (structure.dependencies.includes('@vueuse/nuxt')) {
    config.modules.push('@vueuse/nuxt')
  }
  
  if (structure.dependencies.includes('@nuxt/image')) {
    config.modules.push('@nuxt/image')
    config.image = {
      quality: 80,
      format: ['webp'],
      screens: {
        xs: 320,
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        xxl: 1536
      }
    }
  }
  
  if (structure.dependencies.includes('@nuxt/devtools')) {
    config.devtools = { enabled: true }
  }
  
  // Configure CSS based on detected files
  if (structure.directories.includes('assets/css')) {
    config.css.push('~/assets/css/main.css')
  }
  
  // SPA mode configuration
  if (options.spa || structure.nuxtConfig.ssr === false) {
    config.ssr = false
    config.nitro = {
      prerender: {
        routes: ['/']
      }
    }
  }
  
  // Auto-imports configuration
  config.imports = {
    dirs: [
      'composables/**',
      'utils/**',
      'stores'
    ]
  }
  
  // Components auto-import
  config.components = [
    {
      path: '~/components',
      pathPrefix: false
    }
  ]
  
  // Merge with user options
  return mergeDefaults(config, options.nuxt || {})
}

/**
 * Generate testing framework defaults with BDD integration
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
      threshold: 80,
      provider: 'v8'
    },
    environment: 'happy-dom' // Faster than jsdom
  }
  
  // Vitest configuration with Nuxt integration
  if (config.framework === 'vitest') {
    config.vitest = {
      environment: 'happy-dom',
      setupFiles: [
        './tests/setup/global-setup.js'
      ],
      globals: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov', 'json'],
        exclude: [
          'node_modules/',
          'tests/',
          '**/*.d.ts',
          'coverage/',
          '.nuxt/',
          'dist/',
          '*.config.*'
        ],
        thresholds: {
          global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
          }
        }
      },
      testTimeout: 10000,
      hookTimeout: 10000
    }
  }
  
  // Jest configuration (fallback)
  if (config.framework === 'jest') {
    config.jest = {
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/global-setup.js'],
      moduleFileExtensions: ['js', 'json', 'vue', 'ts'],
      transform: {
        '^.+\\.js$': 'babel-jest',
        '^.+\\.vue$': '@vue/vue3-jest',
        '^.+\\.ts$': 'ts-jest'
      },
      collectCoverage: true,
      collectCoverageFrom: [
        'app/**/*.{js,vue,ts}',
        'server/**/*.{js,ts}',
        'components/**/*.{js,vue,ts}',
        '!**/node_modules/**',
        '!**/*.d.ts'
      ],
      coverageReporters: ['text', 'html', 'lcov']
    }
  }
  
  // Setup files based on project structure
  if (structure.directories.includes('composables') || structure.directories.includes('app/composables')) {
    config.setupFiles.push('./tests/setup/composables-setup.js')
  }
  
  if (structure.dependencies.includes('@pinia/nuxt')) {
    config.setupFiles.push('./tests/setup/pinia-setup.js')
  }
  
  if (structure.dependencies.includes('@nuxtjs/i18n')) {
    config.setupFiles.push('./tests/setup/i18n-setup.js')
  }
  
  // Add Nuxt test utils if available
  if (structure.dependencies.includes('@nuxt/test-utils')) {
    config.nuxtTestUtils = {
      enabled: true,
      startOnBoot: true
    }
  }
  
  return mergeDefaults(config, options.testing || {})
}

/**
 * Generate BDD-specific configuration defaults
 * @param {Object} structure - Project structure information
 * @param {Object} options - Override options
 * @returns {Object} - BDD configuration defaults
 */
function generateBDDDefaults(structure, options = {}) {
  const config = {
    enabled: options.enableBDD || structure.bddStructure?.hasBDD || false,
    featuresDir: 'tests/features',
    stepDefinitionsDir: 'tests/steps',
    supportDir: 'tests/support',
    outputDir: 'tests/results',
    
    // Cucumber configuration
    cucumber: {
      paths: ['tests/features/**/*.feature'],
      require: ['tests/steps/**/*.js'],
      requireModule: ['esm'],
      format: [
        'progress',
        'json:tests/results/cucumber-report.json',
        'html:tests/results/cucumber-report.html',
        '@cucumber/pretty-formatter'
      ],
      formatOptions: {
        snippetInterface: 'async-await'
      },
      parallel: 2,
      retry: 1,
      timeout: 30000
    },
    
    // BDD test patterns
    testPatterns: [
      'tests/features/**/*.feature',
      'tests/bdd/**/*.test.js',
      'tests/scenarios/**/*.js'
    ],
    
    // Gherkin language support
    language: 'en',
    
    // Report configuration
    reporting: {
      enabled: true,
      formats: ['html', 'json', 'junit'],
      outputPath: 'tests/results'
    }
  }
  
  // Enhanced BDD setup if explicitly enabled
  if (config.enabled) {
    config.cucumber.require.push('tests/support/**/*.js')
    
    // Add screenshot support for E2E BDD
    if (structure.dependencies.includes('playwright')) {
      config.cucumber.formatOptions.snippetSyntax = 'async-await'
      config.cucumber.worldParameters = {
        screenshots: {
          mode: 'only-on-failure',
          path: 'tests/results/screenshots'
        }
      }
    }
  }
  
  return mergeDefaults(config, options.bdd || {})
}

/**
 * Generate build configuration defaults with optimization
 * @param {Object} structure - Project structure information
 * @param {Object} options - Override options
 * @returns {Object} - Build configuration defaults
 */
function generateBuildDefaults(structure, options = {}) {
  const config = {
    // Nitro configuration
    nitro: {
      preset: 'node-server',
      minify: process.env.NODE_ENV === 'production',
      sourceMap: process.env.NODE_ENV !== 'production'
    },
    
    // Build optimization
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      }
    },
    
    // Transpilation
    transpile: [],
    
    // PostCSS configuration
    postcss: {
      plugins: {}
    }
  }
  
  // TypeScript build configuration
  if (structure.dependencies.includes('typescript')) {
    config.typescript = {
      strict: true,
      typeCheck: process.env.NODE_ENV !== 'production' // Disable in production for speed
    }
  }
  
  // Tailwind CSS build optimization
  if (structure.dependencies.includes('tailwindcss')) {
    config.postcss.plugins.tailwindcss = {}
    config.postcss.plugins.autoprefixer = {}
    
    // PurgeCSS configuration for production
    if (process.env.NODE_ENV === 'production') {
      config.postcss.plugins['@fullhuman/postcss-purgecss'] = {
        content: [
          './components/**/*.{vue,js}',
          './layouts/**/*.vue',
          './pages/**/*.vue',
          './app.vue'
        ],
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
      }
    }
  }
  
  // Production optimizations
  if (process.env.NODE_ENV === 'production') {
    config.nitro.minify = true
    config.nitro.sourceMap = false
    
    // Advanced optimizations
    config.optimization.usedExports = true
    config.optimization.sideEffects = false
  }
  
  // PWA build configuration
  if (structure.dependencies.includes('@nuxtjs/pwa')) {
    config.pwa = {
      workbox: {
        enabled: true,
        cachingExtensions: ['@/plugins/workbox-range-request.js'],
        cleanupOutdatedCaches: true
      }
    }
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
    // Server configuration
    devServer: {
      port: 3000,
      host: 'localhost',
      https: false,
      open: true
    },
    
    // Hot reload configuration
    vite: {
      clearScreen: false,
      logLevel: 'info'
    },
    
    // Source maps
    sourcemap: {
      server: true,
      client: true
    },
    
    // Development tools
    devtools: true
  }
  
  // Vue devtools configuration
  config.vue = {
    config: {
      devtools: true,
      performance: true
    }
  }
  
  // TypeScript development configuration
  if (structure.dependencies.includes('typescript')) {
    config.typescript = {
      typeCheck: 'build' // Only check on build, not on dev server start
    }
  }
  
  // ESLint integration
  if (structure.dependencies.includes('eslint')) {
    config.eslint = {
      lintOnStart: false, // Performance optimization
      include: ['app/**', 'components/**', 'pages/**', 'server/**']
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
      format: ['webp', 'avif'],
      densities: [1, 2],
      sizes: '100vw sm:50vw md:33vw lg:25vw'
    },
    
    // Compression
    compression: {
      gzip: true,
      brotli: true
    },
    
    // Caching strategy
    routeRules: {
      '/': { prerender: true },
      '/api/**': { headers: { 'cache-control': 's-maxage=60' } },
      '/static/**': { headers: { 'cache-control': 'max-age=31536000' } }
    },
    
    // Bundle analysis
    bundle: {
      analyzer: false
    },
    
    // Preloading strategy
    preload: {
      links: true,
      images: true
    }
  }
  
  // PWA performance optimizations
  if (structure.dependencies.includes('@nuxtjs/pwa')) {
    config.pwa = {
      workbox: {
        cachingExtensions: '@/plugins/workbox-range-request.js',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    }
  }
  
  // Content optimization
  if (structure.dependencies.includes('@nuxtjs/content')) {
    config.content = {
      liveEdit: false, // Disable in production
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
  const projectName = structure.packageInfo.name || 'Nuxt App'
  const description = structure.packageInfo.description || `${projectName} - Built with Nuxt`
  
  const config = {
    // App head configuration
    app: {
      head: {
        title: projectName,
        titleTemplate: '%s - ' + projectName,
        meta: [
          { name: 'description', content: description },
          { name: 'format-detection', content: 'telephone=no' },
          { name: 'theme-color', content: '#000000' },
          
          // Open Graph
          { property: 'og:site_name', content: projectName },
          { property: 'og:type', content: 'website' },
          { property: 'og:title', content: projectName },
          { property: 'og:description', content: description },
          { property: 'og:locale', content: 'en_US' },
          
          // Twitter Card
          { name: 'twitter:card', content: 'summary_large_image' },
          { name: 'twitter:title', content: projectName },
          { name: 'twitter:description', content: description }
        ],
        link: [
          { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
          { rel: 'canonical', href: 'https://example.com' }
        ],
        script: [
          // Add structured data
          {
            type: 'application/ld+json',
            children: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: projectName,
              description: description,
              url: 'https://example.com'
            })
          }
        ]
      }
    },
    
    // Sitemap configuration
    sitemap: {
      hostname: 'https://example.com',
      gzip: true,
      routes: async () => {
        // Dynamic routes can be added here
        return []
      }
    },
    
    // Robots.txt
    robots: {
      UserAgent: '*',
      Allow: '/',
      Sitemap: 'https://example.com/sitemap.xml'
    }
  }
  
  // SEO modules configuration
  if (structure.dependencies.includes('@nuxtjs/sitemap')) {
    config.modules = config.modules || []
    config.modules.push('@nuxtjs/sitemap')
  }
  
  if (structure.dependencies.includes('@nuxtjs/robots')) {
    config.modules = config.modules || []
    config.modules.push('@nuxtjs/robots')
  }
  
  return mergeDefaults(config, options.seo || {})
}

/**
 * Generate security configuration defaults
 * @param {Object} structure - Project structure information
 * @param {Object} options - Override options
 * @returns {Object} - Security configuration defaults
 */
function generateSecurityDefaults(structure, options = {}) {
  const config = {
    // Security headers
    nitro: {
      routeRules: {
        '/**': {
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
          }
        }
      }
    },
    
    // CSRF protection
    csrf: {
      enabled: true,
      methodsToProtect: ['POST', 'PUT', 'PATCH', 'DELETE']
    },
    
    // Rate limiting
    rateLimit: {
      enabled: true,
      max: 100,
      windowMs: 15 * 60 * 1000 // 15 minutes
    }
  }
  
  // Content Security Policy
  config.csp = {
    enabled: true,
    policies: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'"],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'frame-src': ["'none'"]
    }
  }
  
  return mergeDefaults(config, options.security || {})
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
      devtools: true,
      minify: false,
      sourcemap: true,
      logLevel: 'info'
    },
    
    production: {
      debug: false,
      ssr: true,
      devtools: false,
      minify: true,
      sourcemap: false,
      logLevel: 'warn',
      analyze: false
    },
    
    test: {
      debug: false,
      ssr: false,
      devtools: false,
      minify: false,
      sourcemap: true,
      logLevel: 'error'
    }
  }
  
  const envConfig = baseConfig[environment] || baseConfig.development
  
  return mergeDefaults(envConfig, options)
}

/**
 * Generate adaptive configuration based on project size and complexity
 * @param {Object} structure - Project structure information
 * @returns {Object} - Adaptive configuration settings
 */
export function generateAdaptiveConfig(structure) {
  const complexity = calculateProjectComplexity(structure)
  
  const config = {
    base: {
      ssr: true,
      devtools: true
    }
  }
  
  // Simple projects (complexity < 30)
  if (complexity < 30) {
    config.optimization = {
      bundleSize: 'minimal',
      caching: 'basic',
      analysis: false,
      preload: false
    }
  }
  // Medium projects (complexity 30-70)
  else if (complexity < 70) {
    config.optimization = {
      bundleSize: 'balanced',
      caching: 'standard',
      analysis: true,
      splitting: true,
      preload: true
    }
  }
  // Complex projects (complexity >= 70)
  else {
    config.optimization = {
      bundleSize: 'aggressive',
      caching: 'advanced',
      analysis: true,
      splitting: true,
      lazy: true,
      preload: true,
      prefetch: true
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
  score += Math.min(structure.directories.length * 1.5, 20)
  
  // Dependency count contribution (max 30 points)
  score += Math.min(structure.dependencies.length * 0.8, 30)
  
  // Module complexity (max 25 points)
  if (structure.nuxtConfig.modules) {
    score += Math.min(structure.nuxtConfig.modules.length * 3, 25)
  }
  
  // Testing complexity (max 15 points)
  if (structure.testingConfig) {
    score += structure.testingConfig.frameworks.length * 5
    if (structure.testingConfig.bdd) score += 5
  }
  
  // Framework complexity (max 10 points)
  if (structure.dependencies.includes('typescript')) score += 5
  if (structure.dependencies.includes('@nuxtjs/content')) score += 2
  if (structure.dependencies.includes('@pinia/nuxt')) score += 2
  if (structure.dependencies.includes('@nuxtjs/i18n')) score += 1
  
  return Math.min(score, 100)
}

/**
 * Deep merge configuration objects with array handling
 * @param {Object} defaults - Default configuration
 * @param {Object} overrides - Override configuration
 * @returns {Object} - Merged configuration
 */
function mergeDefaults(defaults, overrides) {
  if (!overrides) return defaults
  
  const result = { ...defaults }
  
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null || value === undefined) {
      continue
    }
    
    if (Array.isArray(value)) {
      result[key] = Array.isArray(result[key]) 
        ? [...result[key], ...value]
        : value
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = mergeDefaults(result[key] || {}, value)
    } else {
      result[key] = value
    }
  }
  
  return result
}