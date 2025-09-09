// Nuxt configuration for the full-stack typing tutor application
// Configures modules, content, devtools, and deployment settings
// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  modules: [
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    'nuxt-og-image',
    'nuxt-llms',
    'nuxt-mcp',
    'nuxt-monaco-editor'
  ],

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

  // Build optimizations
  build: {
    // Split chunks for better caching
    splitChunks: {
      layouts: true,
      pages: true,
      commons: true
    }
  },

  // Performance optimizations
  experimental: {
    payloadExtraction: false, // Reduce payload size
    treeshakeClientOnly: true // Enable client-side tree shaking
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
