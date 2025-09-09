import { defineConfig } from 'cypress'
import { devServer } from '@cypress/vite-dev-server'
import viteConfig from './vite.config.js'

export default defineConfig({
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite',
      viteConfig
    },
    specPattern: 'cypress/components/**/*.cy.{js,ts}',
    indexHtmlFile: 'cypress/support/component-index.html'
  },
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    supportFile: 'cypress/support/e2e.js',
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    chromeWebSecurity: false,
    setupNodeEvents(on, config) {
      // Code coverage
      require('@cypress/code-coverage/task')(on, config)
      
      // Terminal output
      require('cypress-terminal-report/src/installLogsPrinter')(on, {
        printLogsToConsole: 'onFail',
      })
      
      // Visual regression
      const getCompareSnapshotsPlugin = require('cypress-visual-regression/dist/plugin')
      getCompareSnapshotsPlugin(on, config)
      
      return config
    },
    env: {
      coverage: true,
      codeCoverage: {
        url: 'http://localhost:5173/__coverage__'
      }
    }
  },
  retries: {
    runMode: 2,
    openMode: 0
  },
  experimentalWebKitSupport: true
})