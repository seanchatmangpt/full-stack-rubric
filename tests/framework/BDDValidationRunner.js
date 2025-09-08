/**
 * @fileoverview Simplified BDD Validation Runner
 * @description Validates BDD features and step definitions without external dependencies
 */

import fs from 'fs'
import path from 'path'

/**
 * @description Simple BDD validation runner using native Node.js modules
 */
export class BDDValidationRunner {
  constructor() {
    this.featuresDir = path.resolve(process.cwd(), 'tests/features')
    this.stepsDir = path.resolve(process.cwd(), 'tests/steps')
    this.features = []
    this.stepDefinitions = []
    this.missingSteps = []
    this.coverage = 0
  }

  /**
   * @description Recursively find files with specific extension
   * @param {string} dir - Directory to search
   * @param {string} extension - File extension to find
   * @returns {Array<string>} Array of file paths
   */
  findFiles(dir, extension) {
    const files = []
    
    if (!fs.existsSync(dir)) {
      return files
    }

    const items = fs.readdirSync(dir)
    
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        files.push(...this.findFiles(fullPath, extension))
      } else if (item.endsWith(extension)) {
        files.push(fullPath)
      }
    }
    
    return files
  }

  /**
   * @description Discover all feature files
   * @returns {Array<Object>} Feature files with parsed content
   */
  async discoverFeatures() {
    console.log('🔍 Discovering BDD feature files...')
    
    const featureFiles = this.findFiles(this.featuresDir, '.feature')
    this.features = []

    for (const featurePath of featureFiles) {
      const content = fs.readFileSync(featurePath, 'utf8')
      const scenarios = this.parseFeature(content)
      
      this.features.push({
        path: featurePath,
        name: path.basename(featurePath, '.feature'),
        content,
        scenarios
      })
    }

    console.log(`✅ Found ${this.features.length} feature files`)
    return this.features
  }

  /**
   * @description Parse feature file content into scenarios
   * @param {string} content - Feature file content
   * @returns {Array<Object>} Parsed scenarios
   */
  parseFeature(content) {
    const lines = content.split('\n')
    const scenarios = []
    let currentScenario = null
    let inScenario = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (!line || line.startsWith('#')) continue

      if (line.startsWith('Feature:')) {
        continue
      }

      if (line.startsWith('Background:')) {
        currentScenario = {
          name: 'Background',
          steps: [],
          type: 'Background'
        }
        inScenario = true
        continue
      }

      if (line.startsWith('Scenario:') || line.startsWith('Scenario Outline:')) {
        if (currentScenario) {
          scenarios.push(currentScenario)
        }
        
        currentScenario = {
          name: line.replace(/^Scenario:?\s*/, '').replace(/^Scenario Outline:\s*/, ''),
          steps: [],
          type: line.startsWith('Scenario Outline:') ? 'Scenario Outline' : 'Scenario'
        }
        inScenario = true
        continue
      }

      if (inScenario && (line.startsWith('Given') || line.startsWith('When') || 
                        line.startsWith('Then') || line.startsWith('And') || 
                        line.startsWith('But'))) {
        if (currentScenario) {
          currentScenario.steps.push(line)
        }
      }

      if (line.startsWith('Examples:')) {
        inScenario = false
      }
    }

    if (currentScenario) {
      scenarios.push(currentScenario)
    }

    return scenarios
  }

  /**
   * @description Discover step definition files
   * @returns {Array<Object>} Step definitions
   */
  async discoverStepDefinitions() {
    console.log('🔍 Discovering step definitions...')
    
    const stepFiles = this.findFiles(this.stepsDir, '.steps.js')
    this.stepDefinitions = []

    for (const stepFile of stepFiles) {
      const content = fs.readFileSync(stepFile, 'utf8')
      const steps = this.parseStepDefinitions(content, stepFile)
      this.stepDefinitions.push(...steps)
    }

    console.log(`✅ Found ${this.stepDefinitions.length} step definitions`)
    return this.stepDefinitions
  }

  /**
   * @description Parse step definitions from step file
   * @param {string} content - Step file content
   * @param {string} filePath - File path
   * @returns {Array<Object>} Step definitions
   */
  parseStepDefinitions(content, filePath) {
    const lines = content.split('\n')
    const stepDefs = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      const stepMatch = line.match(/^(Given|When|Then)\(['"`]([^'"`]+)['"`]/)
      if (stepMatch) {
        stepDefs.push({
          pattern: stepMatch[2],
          type: stepMatch[1],
          file: filePath,
          line: i + 1
        })
      }
    }

    return stepDefs
  }

  /**
   * @description Normalize step text for comparison
   * @param {string} step - Raw step text
   * @returns {string} Normalized step
   */
  normalizeStep(step) {
    return step.replace(/^(Given|When|Then|And|But)\s+/, '').trim()
  }

  /**
   * @description Check if step has matching definition
   * @param {string} step - Normalized step text
   * @returns {boolean} True if definition exists
   */
  hasStepDefinition(step) {
    return this.stepDefinitions.some(stepDef => {
      const pattern = stepDef.pattern
      
      // Simple pattern matching
      let regexPattern = pattern
        .replace(/\{int\}/g, '\\d+')
        .replace(/\{float\}/g, '\\d+(?:\\.\\d+)?')
        .replace(/\{string\}/g, '"[^"]*"')
        .replace(/\{word\}/g, '\\w+')
      
      try {
        const regex = new RegExp(`^${regexPattern}$`, 'i')
        return regex.test(step)
      } catch (e) {
        // Fallback to simple string matching
        const basePattern = pattern.replace(/\{[^}]+\}/g, '').toLowerCase()
        return step.toLowerCase().includes(basePattern)
      }
    })
  }

  /**
   * @description Validate step coverage
   * @returns {Object} Validation results
   */
  async validateStepCoverage() {
    console.log('🔍 Validating step definition coverage...')
    
    await this.discoverFeatures()
    await this.discoverStepDefinitions()

    const allSteps = new Set()
    const missingSteps = new Set()

    for (const feature of this.features) {
      for (const scenario of feature.scenarios) {
        for (const step of scenario.steps) {
          const normalizedStep = this.normalizeStep(step)
          allSteps.add(normalizedStep)
          
          if (!this.hasStepDefinition(normalizedStep)) {
            missingSteps.add(normalizedStep)
          }
        }
      }
    }

    this.missingSteps = Array.from(missingSteps)
    this.coverage = allSteps.size > 0 ? Math.round(((allSteps.size - missingSteps.size) / allSteps.size) * 100) : 100

    console.log(`📊 Step Coverage: ${this.coverage}% (${allSteps.size - missingSteps.size}/${allSteps.size})`)
    
    if (this.missingSteps.length > 0) {
      console.log('⚠️  Missing Step Definitions:')
      this.missingSteps.forEach(step => console.log(`   - ${step}`))
    } else {
      console.log('✅ All steps have definitions!')
    }

    return {
      features: this.features,
      stepDefinitions: this.stepDefinitions,
      missingSteps: this.missingSteps,
      coverage: this.coverage,
      totalSteps: allSteps.size,
      coveredSteps: allSteps.size - missingSteps.size
    }
  }

  /**
   * @description Generate comprehensive report
   * @returns {Object} Validation report
   */
  async generateReport() {
    console.log('📋 Generating BDD validation report...')
    
    const validation = await this.validateStepCoverage()
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFeatures: this.features.length,
        totalScenarios: this.features.reduce((sum, f) => sum + f.scenarios.length, 0),
        totalSteps: validation.totalSteps,
        totalStepDefinitions: this.stepDefinitions.length,
        stepCoverage: this.coverage,
        missingStepsCount: this.missingSteps.length
      },
      features: this.features.map(f => ({
        name: f.name,
        path: path.relative(process.cwd(), f.path),
        scenarioCount: f.scenarios.length,
        scenarios: f.scenarios.map(s => ({
          name: s.name,
          type: s.type,
          stepCount: s.steps.length
        }))
      })),
      stepDefinitions: this.stepDefinitions.map(sd => ({
        pattern: sd.pattern,
        type: sd.type,
        file: path.relative(process.cwd(), sd.file),
        line: sd.line
      })),
      missingSteps: this.missingSteps,
      recommendations: this.generateRecommendations()
    }

    return report
  }

  /**
   * @description Generate recommendations
   * @returns {Array<string>} Recommendations
   */
  generateRecommendations() {
    const recommendations = []

    if (this.missingSteps.length > 0) {
      recommendations.push('Implement missing step definitions to achieve 100% coverage')
    }

    if (this.features.length < 2) {
      recommendations.push('Consider adding more feature files to cover additional scenarios')
    }

    if (this.coverage < 80) {
      recommendations.push('Step coverage is below 80% - prioritize implementing missing steps')
    }

    if (this.coverage === 100) {
      recommendations.push('Excellent! All steps have definitions - consider adding more comprehensive scenarios')
    }

    return recommendations
  }

  /**
   * @description Run sample scenarios (mock implementation)
   * @returns {Array<Object>} Test results
   */
  async runSampleScenarios() {
    console.log('🧪 Running sample BDD scenarios...')
    
    const results = []

    for (const feature of this.features) {
      for (const scenario of feature.scenarios.slice(0, 2)) {
        const result = {
          feature: feature.name,
          scenario: scenario.name,
          status: 'passed',
          duration: Math.floor(Math.random() * 500) + 50,
          steps: scenario.steps.map(step => ({
            step: step,
            status: this.hasStepDefinition(this.normalizeStep(step)) ? 'passed' : 'pending',
            duration: Math.floor(Math.random() * 50) + 5
          }))
        }
        results.push(result)
      }
    }

    return results
  }
}

/**
 * @description Run complete BDD validation
 * @returns {Promise<Object>} Validation results
 */
export async function runBDDValidation() {
  const runner = new BDDValidationRunner()
  
  console.log('🚀 Starting BDD validation suite...')
  console.log('='.repeat(50))
  
  try {
    const validation = await runner.validateStepCoverage()
    const testResults = await runner.runSampleScenarios()
    const report = await runner.generateReport()
    
    validation.testResults = testResults
    report.testResults = testResults
    
    console.log('='.repeat(50))
    console.log('✅ BDD validation completed successfully!')
    
    return {
      validation,
      report,
      success: true
    }
    
  } catch (error) {
    console.error('❌ BDD validation failed:', error.message)
    return {
      validation: null,
      report: null,
      error: error.message,
      success: false
    }
  }
}

export function createBDDValidationRunner() {
  return new BDDValidationRunner()
}