import { defineConfig } from 'cypress'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

export default defineConfig({
  projectId: 'vue-ui-patterns',
  
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    video: true,
    screenshot: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
      return config
    },
    
    env: {
      coverage: true,
      visualRegression: {
        type: 'regression',
        options: {
          outputDir: 'cypress/visual-regression',
          specDir: 'cypress/visual-regression'
        }
      }
    }
  },

  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js',
    indexHtmlFile: 'cypress/support/component-index.html',
    
    setupNodeEvents(on, config) {
      return config
    }
  },

  // Global settings
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  responseTimeout: 10000,
  pageLoadTimeout: 30000,
  
  // Retry configuration
  retries: {
    runMode: 2,
    openMode: 0
  },

  // Remove custom browser configuration to use Cypress defaults
})