/**
 * Configuration presets for Nuxt BDD project scenarios
 * Provides ready-to-use configurations for different project types
 * Enhanced with BDD testing and modern Nuxt 3 practices
 */

/**
 * @typedef {Object} ConfigPreset
 * @property {string} name - Preset name
 * @property {string} description - Preset description
 * @property {Object} config - Configuration object
 * @property {string[]} dependencies - Required dependencies
 * @property {Object} scripts - Recommended package.json scripts
 * @property {Object} bddConfig - BDD-specific configuration
 */

/**
 * Available configuration presets
 * @type {Object.<string, ConfigPreset>}
 */
export const PRESETS = {
  // Basic Nuxt 3 BDD application
  'nuxt-bdd-basic': {
    name: 'Basic Nuxt BDD',
    description: 'Simple Nuxt 3 application with BDD testing setup',
    config: {
      nuxt: {
        ssr: true,
        modules: ['@nuxt/test-utils'],
        css: ['~/assets/css/main.css'],
        runtimeConfig: {
          public: {}
        },
        typescript: {
          strict: true,
          typeCheck: false
        }
      },
      testing: {
        framework: 'vitest',
        bdd: {
          enabled: true,
          featuresDir: 'tests/features',
          stepDefinitionsDir: 'tests/steps'
        }
      }
    },
    dependencies: [
      'nuxt', 
      'vue', 
      '@nuxt/test-utils', 
      'vitest', 
      '@vue/test-utils', 
      'jsdom',
      '@cucumber/cucumber'
    ],
    scripts: {
      build: 'nuxt build',
      dev: 'nuxt dev',
      generate: 'nuxt generate',
      preview: 'nuxt preview',
      test: 'vitest',
      'test:bdd': 'cucumber-js',
      'test:ui': 'vitest --ui'
    },
    bddConfig: {
      enabled: true,
      cucumber: true,
      playwright: false
    }
  },
  
  // Content-heavy website with BDD
  'content-site-bdd': {
    name: 'Content Website with BDD',
    description: 'Blog or documentation site with Nuxt Content and comprehensive BDD testing',
    config: {
      nuxt: {
        ssr: true,
        modules: [
          '@nuxtjs/content', 
          '@nuxtjs/tailwindcss',
          '@nuxt/test-utils'
        ],
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
      testing: {
        framework: 'vitest',
        bdd: {
          enabled: true,
          featuresDir: 'tests/features',
          stepDefinitionsDir: 'tests/steps',
          scenarios: ['content-rendering', 'navigation', 'search']
        }
      }
    },
    dependencies: [
      'nuxt', 
      '@nuxtjs/content', 
      '@nuxtjs/tailwindcss',
      'tailwindcss',
      'autoprefixer',
      '@nuxt/test-utils',
      'vitest',
      '@cucumber/cucumber',
      'playwright'
    ],
    scripts: {
      build: 'nuxt build',
      dev: 'nuxt dev',
      generate: 'nuxt generate',
      preview: 'nuxt preview',
      test: 'vitest',
      'test:bdd': 'cucumber-js',
      'test:e2e': 'playwright test',
      'test:content': 'vitest --run tests/content'
    },
    bddConfig: {
      enabled: true,
      cucumber: true,
      playwright: true,
      scenarios: ['content', 'navigation', 'seo']
    }
  },
  
  // E-commerce application with comprehensive BDD
  'ecommerce-bdd': {
    name: 'E-commerce with BDD',
    description: 'Full-featured e-commerce site with cart, auth, payments, and BDD testing',
    config: {
      nuxt: {
        ssr: true,
        modules: [
          '@pinia/nuxt',
          '@nuxtjs/tailwindcss',
          '@nuxtjs/i18n',
          '@vueuse/nuxt',
          '@nuxt/test-utils'
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
      testing: {
        framework: 'vitest',
        bdd: {
          enabled: true,
          featuresDir: 'tests/features',
          stepDefinitionsDir: 'tests/steps',
          scenarios: ['shopping-cart', 'checkout', 'user-auth', 'payment']
        }
      }
    },
    dependencies: [
      'nuxt',
      '@pinia/nuxt',
      '@nuxtjs/tailwindcss',
      '@nuxtjs/i18n',
      '@vueuse/nuxt',
      'stripe',
      '@nuxt/test-utils',
      'vitest',
      '@cucumber/cucumber',
      'playwright'
    ],
    scripts: {
      build: 'nuxt build',
      dev: 'nuxt dev',
      test: 'vitest',
      'test:bdd': 'cucumber-js',
      'test:e2e': 'playwright test',
      'test:cart': 'cucumber-js tests/features/cart',
      'test:payment': 'cucumber-js tests/features/payment'
    },
    bddConfig: {
      enabled: true,
      cucumber: true,
      playwright: true,
      scenarios: ['cart', 'checkout', 'auth', 'payment']
    }
  },
  
  // API-first application with BDD API testing
  'api-first-bdd': {
    name: 'API-First with BDD',
    description: 'Application with strong API layer using Nitro server and BDD API testing',
    config: {
      nuxt: {
        ssr: true,
        modules: ['@pinia/nuxt', '@nuxt/test-utils'],
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
      testing: {
        framework: 'vitest',
        bdd: {
          enabled: true,
          featuresDir: 'tests/features',
          stepDefinitionsDir: 'tests/steps',
          scenarios: ['api-endpoints', 'authentication', 'data-validation']
        }
      }
    },
    dependencies: [
      'nuxt',
      '@pinia/nuxt',
      'jsonwebtoken',
      'bcryptjs',
      'zod',
      '@nuxt/test-utils',
      'vitest',
      '@cucumber/cucumber',
      'supertest'
    ],
    scripts: {
      build: 'nuxt build',
      dev: 'nuxt dev',
      'db:migrate': 'node scripts/migrate.js',
      test: 'vitest',
      'test:bdd': 'cucumber-js',
      'test:api': 'cucumber-js tests/features/api',
      'test:integration': 'vitest --run tests/integration'
    },
    bddConfig: {
      enabled: true,
      cucumber: true,
      api: true,
      scenarios: ['api', 'auth', 'validation']
    }
  },
  
  // Testing-focused development with comprehensive BDD
  'testing-focused': {
    name: 'Testing-Focused BDD',
    description: 'Development setup with comprehensive testing configuration and BDD',
    config: {
      nuxt: {
        ssr: true,
        modules: ['@pinia/nuxt', '@vueuse/nuxt', '@nuxt/test-utils'],
        css: ['~/assets/css/main.css'],
        devtools: { enabled: true }
      },
      testing: {
        framework: 'vitest',
        coverage: {
          enabled: true,
          threshold: 90,
          provider: 'v8'
        },
        bdd: {
          enabled: true,
          featuresDir: 'tests/features',
          stepDefinitionsDir: 'tests/steps',
          scenarios: ['unit', 'integration', 'e2e', 'accessibility']
        }
      }
    },
    dependencies: [
      'nuxt',
      '@pinia/nuxt',
      '@vueuse/nuxt',
      '@nuxt/test-utils',
      'vitest',
      '@vitest/coverage-v8',
      '@vue/test-utils',
      'happy-dom',
      'playwright',
      '@cucumber/cucumber',
      '@axe-core/playwright'
    ],
    scripts: {
      build: 'nuxt build',
      dev: 'nuxt dev',
      test: 'vitest',
      'test:ui': 'vitest --ui',
      'test:coverage': 'vitest --coverage',
      'test:bdd': 'cucumber-js',
      'test:e2e': 'playwright test',
      'test:accessibility': 'cucumber-js tests/features/accessibility',
      'test:all': 'pnpm run test && pnpm run test:bdd && pnpm run test:e2e'
    },
    bddConfig: {
      enabled: true,
      cucumber: true,
      playwright: true,
      accessibility: true,
      scenarios: ['unit', 'integration', 'e2e', 'a11y']
    }
  },
  
  // PWA with BDD testing
  'pwa-bdd': {
    name: 'PWA with BDD',
    description: 'Progressive Web App with offline capabilities and BDD testing',
    config: {
      nuxt: {
        ssr: true,
        modules: [
          '@pinia/nuxt',
          '@nuxtjs/pwa',
          '@vueuse/nuxt',
          '@nuxt/test-utils'
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
            cleanupOutdatedCaches: true
          }
        }
      },
      testing: {
        framework: 'vitest',
        bdd: {
          enabled: true,
          featuresDir: 'tests/features',
          stepDefinitionsDir: 'tests/steps',
          scenarios: ['offline', 'service-worker', 'push-notifications']
        }
      }
    },
    dependencies: [
      'nuxt',
      '@pinia/nuxt',
      '@nuxtjs/pwa',
      '@vueuse/nuxt',
      '@nuxt/test-utils',
      'vitest',
      '@cucumber/cucumber',
      'playwright'
    ],
    scripts: {
      build: 'nuxt build',
      dev: 'nuxt dev',
      generate: 'nuxt generate',
      test: 'vitest',
      'test:bdd': 'cucumber-js',
      'test:pwa': 'cucumber-js tests/features/pwa',
      'test:offline': 'playwright test tests/e2e/offline'
    },
    bddConfig: {
      enabled: true,
      cucumber: true,
      playwright: true,
      pwa: true,
      scenarios: ['offline', 'sw', 'notifications']
    }
  },
  
  // Multi-language site with i18n BDD testing
  'multilang-bdd': {
    name: 'Multi-language with BDD',
    description: 'Internationalized website with multiple language support and i18n BDD testing',
    config: {
      nuxt: {
        ssr: true,
        modules: [
          '@nuxtjs/i18n',
          '@nuxtjs/content',
          '@nuxtjs/tailwindcss',
          '@nuxt/test-utils'
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
      testing: {
        framework: 'vitest',
        bdd: {
          enabled: true,
          featuresDir: 'tests/features',
          stepDefinitionsDir: 'tests/steps',
          scenarios: ['i18n', 'translations', 'locale-switching']
        }
      }
    },
    dependencies: [
      'nuxt',
      '@nuxtjs/i18n',
      '@nuxtjs/content',
      '@nuxtjs/tailwindcss',
      '@nuxt/test-utils',
      'vitest',
      '@cucumber/cucumber',
      'playwright'
    ],
    scripts: {
      build: 'nuxt build',
      dev: 'nuxt dev',
      generate: 'nuxt generate',
      test: 'vitest',
      'test:bdd': 'cucumber-js',
      'test:i18n': 'cucumber-js tests/features/i18n',
      'test:translations': 'vitest --run tests/translations'
    },
    bddConfig: {
      enabled: true,
      cucumber: true,
      playwright: true,
      i18n: true,
      scenarios: ['i18n', 'translations', 'localization']
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
 * Search presets by description, features, or BDD capabilities
 * @param {string} query - Search query
 * @returns {ConfigPreset[]} - Array of matching presets
 */
export function searchPresets(query) {
  const queryLower = query.toLowerCase()
  
  return Object.entries(PRESETS)
    .filter(([name, preset]) => {
      return preset.name.toLowerCase().includes(queryLower) ||
             preset.description.toLowerCase().includes(queryLower) ||
             preset.dependencies.some(dep => dep.toLowerCase().includes(queryLower)) ||
             (preset.bddConfig && Object.keys(preset.bddConfig).some(key => 
               key.toLowerCase().includes(queryLower)
             ))
    })
    .map(([name, preset]) => ({ ...preset, id: name }))
}

/**
 * Recommend presets based on project structure with BDD prioritization
 * @param {Object} structure - Project structure from auto-discovery
 * @returns {string[]} - Array of recommended preset names
 */
export function recommendPresets(structure) {
  const recommendations = []
  
  // BDD-focused recommendations (prioritized)
  if (structure.bddStructure?.hasBDD || structure.dependencies.includes('@cucumber/cucumber')) {
    if (structure.dependencies.includes('@nuxtjs/content')) {
      recommendations.push('content-site-bdd')
    } else if (structure.dependencies.includes('stripe') || 
               structure.dependencies.includes('commerce')) {
      recommendations.push('ecommerce-bdd')
    } else if (structure.directories.includes('server') ||
               structure.dependencies.includes('jsonwebtoken')) {
      recommendations.push('api-first-bdd')
    } else if (structure.dependencies.includes('@nuxtjs/pwa')) {
      recommendations.push('pwa-bdd')
    } else if (structure.dependencies.includes('@nuxtjs/i18n')) {
      recommendations.push('multilang-bdd')
    } else {
      recommendations.push('testing-focused')
    }
  } else {
    // Traditional recommendations with BDD enhancement suggestion
    if (structure.dependencies.includes('@nuxtjs/content')) {
      recommendations.push('content-site-bdd')
    }
    
    if (structure.dependencies.includes('stripe') || 
        structure.dependencies.includes('commerce')) {
      recommendations.push('ecommerce-bdd')
    }
    
    if (structure.dependencies.includes('@nuxtjs/pwa')) {
      recommendations.push('pwa-bdd')
    }
    
    if (structure.dependencies.includes('@nuxtjs/i18n')) {
      recommendations.push('multilang-bdd')
    }
    
    // API-first detection
    if (structure.directories.includes('server') ||
        structure.dependencies.includes('jsonwebtoken')) {
      recommendations.push('api-first-bdd')
    }
    
    // Testing framework detection
    if (structure.testingConfig?.frameworks?.length > 0) {
      recommendations.push('testing-focused')
    }
  }
  
  // Default to BDD-enabled basic if no specific patterns found
  if (recommendations.length === 0) {
    recommendations.push('nuxt-bdd-basic')
  }
  
  return [...new Set(recommendations)] // Remove duplicates
}

/**
 * Apply a preset to current project configuration with BDD enhancements
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
  
  // Apply BDD enhancements if preset supports it
  if (preset.bddConfig?.enabled && options.enableBDD !== false) {
    mergedConfig.testing = mergedConfig.testing || {}
    mergedConfig.testing.bdd = {
      ...preset.bddConfig,
      ...mergedConfig.testing.bdd
    }
  }
  
  // Apply any option overrides
  if (options.overrides) {
    return deepMerge(mergedConfig, options.overrides)
  }
  
  return mergedConfig
}

/**
 * Generate a custom BDD-enabled preset based on project requirements
 * @param {Object} requirements - Project requirements
 * @returns {ConfigPreset} - Generated custom preset
 */
export function generateCustomPreset(requirements = {}) {
  const preset = {
    name: requirements.name || 'Custom BDD Preset',
    description: requirements.description || 'Custom generated preset with BDD support',
    config: {
      nuxt: {
        ssr: requirements.ssr !== false,
        modules: ['@nuxt/test-utils'],
        css: []
      },
      testing: {
        framework: 'vitest',
        bdd: {
          enabled: requirements.bdd !== false,
          featuresDir: 'tests/features',
          stepDefinitionsDir: 'tests/steps'
        }
      }
    },
    dependencies: ['nuxt', '@nuxt/test-utils', 'vitest', '@cucumber/cucumber'],
    scripts: {
      build: 'nuxt build',
      dev: 'nuxt dev',
      test: 'vitest',
      'test:bdd': 'cucumber-js'
    },
    bddConfig: {
      enabled: true,
      cucumber: true
    }
  }
  
  // Add modules based on requirements
  if (requirements.features) {
    if (requirements.features.includes('content')) {
      preset.config.nuxt.modules.push('@nuxtjs/content')
      preset.dependencies.push('@nuxtjs/content')
      preset.config.testing.bdd.scenarios = ['content', 'navigation']
    }
    
    if (requirements.features.includes('pwa')) {
      preset.config.nuxt.modules.push('@nuxtjs/pwa')
      preset.dependencies.push('@nuxtjs/pwa')
      preset.config.testing.bdd.scenarios = [...(preset.config.testing.bdd.scenarios || []), 'pwa', 'offline']
    }
    
    if (requirements.features.includes('i18n')) {
      preset.config.nuxt.modules.push('@nuxtjs/i18n')
      preset.dependencies.push('@nuxtjs/i18n')
      preset.config.testing.bdd.scenarios = [...(preset.config.testing.bdd.scenarios || []), 'i18n']
    }
    
    if (requirements.features.includes('tailwind')) {
      preset.config.nuxt.modules.push('@nuxtjs/tailwindcss')
      preset.dependencies.push('@nuxtjs/tailwindcss')
    }
    
    if (requirements.features.includes('pinia')) {
      preset.config.nuxt.modules.push('@pinia/nuxt')
      preset.dependencies.push('@pinia/nuxt')
    }
  }
  
  // Add E2E testing if requested
  if (requirements.e2e) {
    preset.dependencies.push('playwright')
    preset.scripts['test:e2e'] = 'playwright test'
    preset.bddConfig.playwright = true
  }
  
  // Add accessibility testing if requested
  if (requirements.accessibility) {
    preset.dependencies.push('@axe-core/playwright')
    preset.scripts['test:a11y'] = 'cucumber-js tests/features/accessibility'
    preset.bddConfig.accessibility = true
  }
  
  return preset
}

/**
 * Compare presets and show differences with BDD features
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
      preset1Only: (preset1.config.nuxt.modules || []).filter(mod => !(preset2.config.nuxt.modules || []).includes(mod)),
      preset2Only: (preset2.config.nuxt.modules || []).filter(mod => !(preset1.config.nuxt.modules || []).includes(mod)),
      common: (preset1.config.nuxt.modules || []).filter(mod => (preset2.config.nuxt.modules || []).includes(mod))
    },
    bdd: {
      preset1: preset1.bddConfig || { enabled: false },
      preset2: preset2.bddConfig || { enabled: false },
      bothEnabled: (preset1.bddConfig?.enabled && preset2.bddConfig?.enabled) || false
    },
    scripts: {
      preset1Only: Object.keys(preset1.scripts).filter(script => !preset2.scripts[script]),
      preset2Only: Object.keys(preset2.scripts).filter(script => !preset1.scripts[script]),
      common: Object.keys(preset1.scripts).filter(script => preset2.scripts[script])
    }
  }
}

/**
 * Get BDD-specific recommendations for a preset
 * @param {string} presetName - Preset name
 * @returns {Object} - BDD recommendations
 */
export function getBDDRecommendations(presetName) {
  const preset = getPreset(presetName)
  
  if (!preset) {
    throw new Error(`Preset "${presetName}" not found`)
  }
  
  const recommendations = {
    scenarios: [],
    tools: [],
    bestPractices: []
  }
  
  // Generate scenario recommendations based on preset
  if (preset.bddConfig?.scenarios) {
    recommendations.scenarios = preset.bddConfig.scenarios
  }
  
  // Tool recommendations
  if (preset.bddConfig?.cucumber) {
    recommendations.tools.push('Cucumber for BDD scenarios')
  }
  
  if (preset.bddConfig?.playwright) {
    recommendations.tools.push('Playwright for E2E testing')
  }
  
  if (preset.bddConfig?.accessibility) {
    recommendations.tools.push('Axe-core for accessibility testing')
  }
  
  // Best practices based on preset type
  recommendations.bestPractices = [
    'Write scenarios in plain English using Given/When/Then',
    'Keep scenarios focused on business behavior',
    'Use page object pattern for E2E tests',
    'Include both positive and negative test scenarios',
    'Test critical user journeys first'
  ]
  
  return recommendations
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
    } else if (Array.isArray(source[key])) {
      result[key] = Array.isArray(result[key]) 
        ? [...result[key], ...source[key]]
        : source[key]
    } else {
      result[key] = source[key]
    }
  }
  
  return result
}