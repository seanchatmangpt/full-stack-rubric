/**
 * Configuration presets for common Nuxt project scenarios
 * Provides ready-to-use configurations for different project types
 */

/**
 * @typedef {Object} ConfigPreset
 * @property {string} name - Preset name
 * @property {string} description - Preset description
 * @property {Object} config - Configuration object
 * @property {string[]} dependencies - Required dependencies
 * @property {Object} scripts - Recommended package.json scripts
 */

/**
 * Available configuration presets
 * @type {Object.<string, ConfigPreset>}
 */
export const PRESETS = {
  // Basic Nuxt 3 application
  'nuxt-basic': {
    name: 'Basic Nuxt 3',
    description: 'Simple Nuxt 3 application with essential features',
    config: {
      ssr: true,
      css: ['~/assets/css/main.css'],
      modules: [],
      runtimeConfig: {
        public: {}
      }
    },
    dependencies: ['nuxt', 'vue'],
    scripts: {
      build: 'nuxt build',
      dev: 'nuxt dev',
      generate: 'nuxt generate',
      preview: 'nuxt preview'
    }
  },
  
  // Content-heavy website
  'content-site': {
    name: 'Content Website',
    description: 'Blog or documentation site with Nuxt Content',
    config: {
      ssr: true,
      modules: ['@nuxtjs/content', '@nuxtjs/tailwindcss'],
      content: {
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
      },
      css: ['~/assets/css/main.css'],
      tailwindcss: {
        cssPath: '~/assets/css/main.css'
      }
    },
    dependencies: [
      'nuxt', 
      '@nuxtjs/content', 
      '@nuxtjs/tailwindcss',
      'tailwindcss',
      'autoprefixer'
    ],
    scripts: {
      build: 'nuxt build',
      dev: 'nuxt dev',
      generate: 'nuxt generate',
      preview: 'nuxt preview'
    }
  },
  
  // E-commerce application
  'ecommerce-app': {
    name: 'E-commerce Application',
    description: 'Full-featured e-commerce site with cart, auth, and payments',
    config: {
      ssr: true,
      modules: [
        '@pinia/nuxt',
        '@nuxtjs/tailwindcss',
        '@nuxtjs/i18n',
        '@vueuse/nuxt'
      ],
      pinia: {
        autoImports: ['defineStore', 'acceptHMRUpdate']
      },
      i18n: {
        defaultLocale: 'en',
        locales: [
          { code: 'en', name: 'English' },
          { code: 'es', name: 'Español' }
        ]
      },
      runtimeConfig: {
        stripeSecretKey: process.env.STRIPE_SECRET_KEY,
        public: {
          stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY
        }
      },
      css: ['~/assets/css/main.css']
    },
    dependencies: [
      'nuxt',
      '@pinia/nuxt',
      '@nuxtjs/tailwindcss',
      '@nuxtjs/i18n',
      '@vueuse/nuxt',
      'stripe'
    ],
    scripts: {
      build: 'nuxt build',
      dev: 'nuxt dev',
      test: 'vitest',
      'test:e2e': 'playwright test'
    }
  },
  
  // SPA (Single Page Application)
  'spa-app': {
    name: 'Single Page Application',
    description: 'Client-side rendered SPA with Vue Router',
    config: {
      ssr: false,
      target: 'static',
      modules: ['@pinia/nuxt', '@vueuse/nuxt'],
      css: ['~/assets/css/main.css'],
      generate: {
        fallback: true
      },
      router: {
        mode: 'history'
      }
    },
    dependencies: [
      'nuxt',
      '@pinia/nuxt',
      '@vueuse/nuxt'
    ],
    scripts: {
      build: 'nuxt build',
      dev: 'nuxt dev',
      generate: 'nuxt generate',
      preview: 'nuxt preview'
    }
  },
  
  // PWA (Progressive Web App)
  'pwa-app': {
    name: 'Progressive Web App',
    description: 'PWA with offline capabilities and push notifications',
    config: {
      ssr: true,
      modules: [
        '@pinia/nuxt',
        '@nuxtjs/pwa',
        '@vueuse/nuxt'
      ],
      pwa: {
        icon: {
          source: 'static/icon.png'
        },
        manifest: {
          name: 'My PWA App',
          short_name: 'PWA App',
          description: 'My Progressive Web App',
          theme_color: '#000000'
        },
        workbox: {
          cachingExtensions: '@/plugins/workbox-range-request.js',
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: 'https://api.example.com/.*',
              handler: 'NetworkFirst',
              strategyOptions: {
                cacheName: 'api-cache'
              }
            }
          ]
        }
      }
    },
    dependencies: [
      'nuxt',
      '@pinia/nuxt',
      '@nuxtjs/pwa',
      '@vueuse/nuxt'
    ],
    scripts: {
      build: 'nuxt build',
      dev: 'nuxt dev',
      generate: 'nuxt generate'
    }
  },
  
  // API-first application
  'api-first': {
    name: 'API-First Application',
    description: 'Application with strong API layer using Nitro server',
    config: {
      ssr: true,
      modules: ['@pinia/nuxt'],
      nitro: {
        experimental: {
          wasm: true
        }
      },
      runtimeConfig: {
        databaseUrl: process.env.DATABASE_URL,
        jwtSecret: process.env.JWT_SECRET,
        public: {
          apiBase: process.env.API_BASE_URL || '/api'
        }
      }
    },
    dependencies: [
      'nuxt',
      '@pinia/nuxt',
      'jsonwebtoken',
      'bcryptjs',
      'zod'
    ],
    scripts: {
      build: 'nuxt build',
      dev: 'nuxt dev',
      'db:migrate': 'node scripts/migrate.js',
      test: 'vitest'
    }
  },
  
  // Multi-language site
  'multilang-site': {
    name: 'Multi-language Website',
    description: 'Internationalized website with multiple language support',
    config: {
      ssr: true,
      modules: [
        '@nuxtjs/i18n',
        '@nuxtjs/content',
        '@nuxtjs/tailwindcss'
      ],
      i18n: {
        defaultLocale: 'en',
        locales: [
          { code: 'en', name: 'English', file: 'en.json' },
          { code: 'es', name: 'Español', file: 'es.json' },
          { code: 'fr', name: 'Français', file: 'fr.json' }
        ],
        langDir: 'locales/',
        strategy: 'prefix_except_default'
      },
      content: {
        locales: ['en', 'es', 'fr']
      }
    },
    dependencies: [
      'nuxt',
      '@nuxtjs/i18n',
      '@nuxtjs/content',
      '@nuxtjs/tailwindcss'
    ],
    scripts: {
      build: 'nuxt build',
      dev: 'nuxt dev',
      generate: 'nuxt generate'
    }
  },
  
  // Development with testing
  'testing-focused': {
    name: 'Testing-Focused Development',
    description: 'Development setup with comprehensive testing configuration',
    config: {
      ssr: true,
      modules: ['@pinia/nuxt', '@vueuse/nuxt'],
      css: ['~/assets/css/main.css']
    },
    dependencies: [
      'nuxt',
      '@pinia/nuxt',
      '@vueuse/nuxt',
      'vitest',
      '@vue/test-utils',
      'jsdom',
      'playwright',
      '@cucumber/cucumber'
    ],
    scripts: {
      build: 'nuxt build',
      dev: 'nuxt dev',
      test: 'vitest',
      'test:ui': 'vitest --ui',
      'test:coverage': 'vitest --coverage',
      'test:e2e': 'playwright test',
      'test:bdd': 'cucumber-js'
    }
  }
}

/**
 * Get a configuration preset by name
 * @param {string} presetName - Name of the preset
 * @returns {ConfigPreset|null} - Configuration preset or null if not found
 */
export function getPreset(presetName) {
  return PRESETS[presetName] || null
}

/**
 * Get all available preset names
 * @returns {string[]} - Array of preset names
 */
export function getPresetNames() {
  return Object.keys(PRESETS)
}

/**
 * Search presets by description or features
 * @param {string} query - Search query
 * @returns {ConfigPreset[]} - Array of matching presets
 */
export function searchPresets(query) {
  const queryLower = query.toLowerCase()
  
  return Object.entries(PRESETS)
    .filter(([name, preset]) => {
      return preset.name.toLowerCase().includes(queryLower) ||
             preset.description.toLowerCase().includes(queryLower) ||
             preset.dependencies.some(dep => dep.toLowerCase().includes(queryLower))
    })
    .map(([name, preset]) => ({ ...preset, id: name }))
}

/**
 * Recommend presets based on project structure
 * @param {Object} structure - Project structure from auto-discovery
 * @returns {string[]} - Array of recommended preset names
 */
export function recommendPresets(structure) {
  const recommendations = []
  
  // Content-focused recommendations
  if (structure.dependencies.includes('@nuxtjs/content') || 
      structure.directories.includes('content')) {
    recommendations.push('content-site')
  }
  
  // E-commerce recommendations
  if (structure.dependencies.includes('stripe') || 
      structure.dependencies.includes('commerce') ||
      structure.directories.includes('cart')) {
    recommendations.push('ecommerce-app')
  }
  
  // PWA recommendations
  if (structure.dependencies.includes('@nuxtjs/pwa')) {
    recommendations.push('pwa-app')
  }
  
  // SPA recommendations
  if (structure.nuxtConfig.ssr === false) {
    recommendations.push('spa-app')
  }
  
  // Multi-language recommendations
  if (structure.dependencies.includes('@nuxtjs/i18n') ||
      structure.directories.includes('locales')) {
    recommendations.push('multilang-site')
  }
  
  // Testing recommendations
  if (structure.dependencies.includes('vitest') ||
      structure.dependencies.includes('playwright') ||
      structure.directories.includes('tests')) {
    recommendations.push('testing-focused')
  }
  
  // API-first recommendations
  if (structure.directories.includes('server') ||
      structure.dependencies.includes('jsonwebtoken')) {
    recommendations.push('api-first')
  }
  
  // Default to basic if no specific patterns found
  if (recommendations.length === 0) {
    recommendations.push('nuxt-basic')
  }
  
  return recommendations
}

/**
 * Apply a preset to current project configuration
 * @param {string} presetName - Name of the preset to apply
 * @param {Object} currentConfig - Current configuration
 * @param {Object} options - Application options
 * @returns {Object} - Merged configuration
 */
export function applyPreset(presetName, currentConfig = {}, options = {}) {
  const preset = getPreset(presetName)
  
  if (!preset) {
    throw new Error(`Preset "${presetName}" not found`)
  }
  
  // Deep merge preset configuration with current configuration
  const mergedConfig = deepMerge(preset.config, currentConfig)
  
  // Apply any option overrides
  if (options.overrides) {
    return deepMerge(mergedConfig, options.overrides)
  }
  
  return mergedConfig
}

/**
 * Generate a custom preset based on project requirements
 * @param {Object} requirements - Project requirements
 * @returns {ConfigPreset} - Generated custom preset
 */
export function generateCustomPreset(requirements = {}) {
  const preset = {
    name: requirements.name || 'Custom Preset',
    description: requirements.description || 'Custom generated preset',
    config: {
      ssr: requirements.ssr !== false,
      modules: [],
      css: []
    },
    dependencies: ['nuxt'],
    scripts: {
      build: 'nuxt build',
      dev: 'nuxt dev'
    }
  }
  
  // Add modules based on requirements
  if (requirements.features) {
    if (requirements.features.includes('content')) {
      preset.config.modules.push('@nuxtjs/content')
      preset.dependencies.push('@nuxtjs/content')
    }
    
    if (requirements.features.includes('pwa')) {
      preset.config.modules.push('@nuxtjs/pwa')
      preset.dependencies.push('@nuxtjs/pwa')
    }
    
    if (requirements.features.includes('i18n')) {
      preset.config.modules.push('@nuxtjs/i18n')
      preset.dependencies.push('@nuxtjs/i18n')
    }
    
    if (requirements.features.includes('tailwind')) {
      preset.config.modules.push('@nuxtjs/tailwindcss')
      preset.dependencies.push('@nuxtjs/tailwindcss')
    }
    
    if (requirements.features.includes('pinia')) {
      preset.config.modules.push('@pinia/nuxt')
      preset.dependencies.push('@pinia/nuxt')
    }
  }
  
  // Add testing if requested
  if (requirements.testing) {
    preset.dependencies.push('vitest', '@vue/test-utils', 'jsdom')
    preset.scripts.test = 'vitest'
  }
  
  return preset
}

/**
 * Compare presets and show differences
 * @param {string} preset1Name - First preset name
 * @param {string} preset2Name - Second preset name
 * @returns {Object} - Comparison object showing differences
 */
export function comparePresets(preset1Name, preset2Name) {
  const preset1 = getPreset(preset1Name)
  const preset2 = getPreset(preset2Name)
  
  if (!preset1 || !preset2) {
    throw new Error('One or both presets not found')
  }
  
  return {
    name: {
      preset1: preset1.name,
      preset2: preset2.name
    },
    dependencies: {
      preset1Only: preset1.dependencies.filter(dep => !preset2.dependencies.includes(dep)),
      preset2Only: preset2.dependencies.filter(dep => !preset1.dependencies.includes(dep)),
      common: preset1.dependencies.filter(dep => preset2.dependencies.includes(dep))
    },
    modules: {
      preset1Only: (preset1.config.modules || []).filter(mod => !(preset2.config.modules || []).includes(mod)),
      preset2Only: (preset2.config.modules || []).filter(mod => !(preset1.config.modules || []).includes(mod)),
      common: (preset1.config.modules || []).filter(mod => (preset2.config.modules || []).includes(mod))
    }
  }
}

/**
 * Deep merge utility for configurations
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} - Merged object
 */
function deepMerge(target, source) {
  const result = { ...target }
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  }
  
  return result
}