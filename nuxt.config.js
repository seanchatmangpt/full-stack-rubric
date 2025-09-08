/**
 * @typedef {Object} DevtoolsConfig
 * @property {boolean} enabled - Enable Nuxt devtools
 */

/**
 * @typedef {Object} ContentTocConfig
 * @property {number} searchDepth - Table of contents search depth
 */

/**
 * @typedef {Object} ContentMarkdownConfig
 * @property {ContentTocConfig} toc - Table of contents configuration
 */

/**
 * @typedef {Object} ContentBuildConfig
 * @property {ContentMarkdownConfig} markdown - Markdown build configuration
 */

/**
 * @typedef {Object} ContentConfig
 * @property {ContentBuildConfig} build - Content build configuration
 */

/**
 * @typedef {Object} NitroPrerenderConfig
 * @property {string[]} routes - Routes to prerender
 * @property {boolean} crawlLinks - Enable link crawling
 * @property {boolean} autoSubfolderIndex - Auto generate subfolder index
 */

/**
 * @typedef {Object} NitroConfig
 * @property {NitroPrerenderConfig} prerender - Prerender configuration
 */

/**
 * @typedef {Object} ESLintStylisticConfig
 * @property {string} commaDangle - Comma dangle style
 * @property {string} braceStyle - Brace style
 */

/**
 * @typedef {Object} ESLintConfigConfig
 * @property {ESLintStylisticConfig} stylistic - Stylistic rules
 */

/**
 * @typedef {Object} ESLintConfig
 * @property {ESLintConfigConfig} config - ESLint configuration
 */

/**
 * @typedef {Object} IconConfig
 * @property {string} provider - Icon provider
 */

/**
 * @typedef {Object} ContentFilter
 * @property {string} field - Filter field
 * @property {string} operator - Filter operator
 * @property {string} value - Filter value
 */

/**
 * @typedef {Object} LLMSection
 * @property {string} title - Section title
 * @property {string} contentCollection - Content collection name
 * @property {ContentFilter[]} contentFilters - Content filters
 */

/**
 * @typedef {Object} LLMFullConfig
 * @property {string} title - Full documentation title
 * @property {string} description - Full documentation description
 */

/**
 * @typedef {Object} LLMSConfig
 * @property {string} domain - Domain URL
 * @property {string} title - Site title
 * @property {string} description - Site description
 * @property {LLMFullConfig} full - Full documentation configuration
 * @property {LLMSection[]} sections - Documentation sections
 */

/**
 * @typedef {Object} NuxtConfig
 * @property {string[]} modules - Nuxt modules
 * @property {DevtoolsConfig} devtools - Devtools configuration
 * @property {string[]} css - CSS files
 * @property {ContentConfig} content - Content configuration
 * @property {string} compatibilityDate - Compatibility date
 * @property {NitroConfig} nitro - Nitro configuration
 * @property {ESLintConfig} eslint - ESLint configuration
 * @property {IconConfig} icon - Icon configuration
 * @property {LLMSConfig} llms - LLMS configuration
 */

/**
 * @fileoverview Nuxt configuration for the full-stack typing tutor application
 * Configures modules, content, devtools, and deployment settings
 */

/**
 * Nuxt Configuration
 * https://nuxt.com/docs/api/configuration/nuxt-config
 * @type {NuxtConfig}
 */
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    'nuxt-og-image',
    'nuxt-llms',
    'nuxt-mcp',
    'nuxt-monaco-editor'
  ],

  // Performance optimizations
  experimental: {
    payloadExtraction: false, // Reduce payload size
    treeshakeClientOnly: true // Enable client-side tree shaking
  },

  // Build optimizations
  build: {
    // Split chunks for better caching
    splitChunks: {
      layouts: true,
      pages: true,
      commons: true
    }
  },

  // Vite optimizations for tree shaking
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate Monaco Editor for lazy loading
            'monaco': ['monaco-editor'],
            // Separate typing utilities
            'typing-utils': ['./app/composables/useTypingMetrics.js', './app/utils/adaptiveDifficulty.js'],
            // Separate performance utils
            'performance': ['./app/utils/performanceOptimizer.js', './app/composables/usePerformanceOptimization.js']
          }
        }
      },
      target: 'esnext', // Better tree shaking for modern browsers
      minify: 'terser', // Better minification
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.logs in production
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug']
        }
      }
    },
    optimizeDeps: {
      include: ['vue', '@vue/runtime-core'],
      exclude: ['monaco-editor'] // Load Monaco dynamically
    }
  },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  content: {
    build: {
      markdown: {
        toc: {
          searchDepth: 1
        }
      }
    }
  },

  compatibilityDate: '2024-07-11',

  nitro: {
    prerender: {
      routes: [
        '/'
      ],
      crawlLinks: true,
      autoSubfolderIndex: false
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  icon: {
    provider: 'iconify'
  },

  llms: {
    domain: 'https://docs-template.nuxt.dev/',
    title: 'Nuxt Docs Template',
    description: 'A template for building documentation with Nuxt UI and Nuxt Content.',
    full: {
      title: 'Nuxt Docs Template - Full Documentation',
      description: 'This is the full documentation for the Nuxt Docs Template.'
    },
    sections: [
      {
        title: 'Getting Started',
        contentCollection: 'docs',
        contentFilters: [
          { field: 'path', operator: 'LIKE', value: '/getting-started%' }
        ]
      },
      {
        title: 'Essentials',
        contentCollection: 'docs',
        contentFilters: [
          { field: 'path', operator: 'LIKE', value: '/essentials%' }
        ]
      }
    ]
  }
})