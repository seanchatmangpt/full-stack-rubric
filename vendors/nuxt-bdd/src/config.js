/**
 * @fileoverview Configuration builder for nuxt-bdd
 */

import { defu } from 'defu'
import { resolve } from 'pathe'

/**
 * Creates a BDD configuration for Nuxt applications
 * @param {Partial<import('./index.js').NuxtBDDConfig>} userConfig - User configuration
 * @returns {import('./index.js').NuxtBDDConfig} Merged configuration
 */
export default function createBDDConfig(userConfig = {}) {
  const defaultConfig = {
    featuresDir: 'tests/features',
    stepsDir: 'tests/steps',
    supportDir: 'tests/support',
    autoLoad: true,
    vitest: {
      environment: 'nuxt',
      globals: true,
      setupFiles: [],
      include: ['**/*.{feature,spec,test}.{js,mjs,cjs,ts,mts,cts}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'coverage/**',
          'dist/**',
          'packages/*/test{,s}/**',
          '**/*.d.ts',
          'cypress/**',
          'test{,s}/**',
          'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
          '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
          '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
          '**/__tests__/**',
          '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
          '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}'
        ]
      }
    },
    cucumber: {
      requireModule: ['@amiceli/vitest-cucumber'],
      formatOptions: {
        theme: {
          'step keyword': 'cyan',
          'step text': 'white',
          'step argument': 'yellow'
        }
      }
    }
  }

  const config = defu(userConfig, defaultConfig)

  // Resolve paths
  config.featuresDir = resolve(config.featuresDir)
  config.stepsDir = resolve(config.stepsDir)
  config.supportDir = resolve(config.supportDir)

  return config
}