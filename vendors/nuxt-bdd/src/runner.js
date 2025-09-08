/**
 * @fileoverview BDD Test Runner
 */

import { glob } from 'glob'
import { resolve } from 'pathe'
import { loadFeature } from '@amiceli/vitest-cucumber'

/**
 * BDD Test Runner class
 */
export class BDDTestRunner {
  /**
   * @param {import('./index.js').NuxtBDDConfig} config - BDD configuration
   */
  constructor(config) {
    this.config = config
    this.features = new Map()
    this.stepDefinitions = new Map()
  }

  /**
   * Discovers and loads feature files
   * @returns {Promise<string[]>} Array of feature file paths
   */
  async discoverFeatures() {
    const pattern = resolve(this.config.featuresDir, '**/*.feature')
    const featureFiles = await glob(pattern)
    
    for (const featureFile of featureFiles) {
      const feature = loadFeature(featureFile)
      this.features.set(featureFile, feature)
    }
    
    return featureFiles
  }

  /**
   * Discovers and loads step definition files
   * @returns {Promise<string[]>} Array of step definition file paths
   */
  async discoverSteps() {
    const pattern = resolve(this.config.stepsDir, '**/*.{js,mjs,cjs,ts}')
    const stepFiles = await glob(pattern)
    
    if (this.config.autoLoad) {
      for (const stepFile of stepFiles) {
        try {
          const stepModule = await import(stepFile)
          this.stepDefinitions.set(stepFile, stepModule)
        } catch (error) {
        }
      }
    }
    
    return stepFiles
  }

  /**
   * Runs BDD tests
   * @returns {Promise<Object>} Test results
   */
  async run() {
    const features = await this.discoverFeatures()
    const steps = await this.discoverSteps()
    
    return {
      features: features.length,
      steps: steps.length,
      status: 'ready'
    }
  }
}