import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config.js'

export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [],
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**', 'cypress/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      globals: true,
      setupFiles: ['./src/test/setup.js'],
      coverage: {
        reporter: ['text', 'html', 'json'],
        reportsDirectory: './coverage',
        exclude: [
          'node_modules/',
          'src/test/',
          'cypress/',
          '**/*.config.js',
          '**/*.spec.js',
          '**/*.test.js',
          'e2e/**'
        ],
        thresholds: {
          global: {
            branches: 75,
            functions: 80,
            lines: 80,
            statements: 80
          }
        }
      },
      reporters: ['default', 'json', 'html'],
      outputFile: {
        json: './coverage/vitest-results.json',
        html: './coverage/vitest-results.html'
      }
    }
  })
)