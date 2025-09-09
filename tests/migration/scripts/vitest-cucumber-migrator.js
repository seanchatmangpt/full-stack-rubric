/**
 * @fileoverview Specialized migration script for Vitest + Cucumber to ultra-efficient BDD
 * Handles .feature files, step definitions, and Vitest configurations
 */

import fs from 'fs/promises'
import path from 'path'
import { TestFrameworkMigrator } from '../codemods/test-framework-migrator.js'

/**
 * Vitest-Cucumber specific migration utilities
 */
class VitestCucumberMigrator extends TestFrameworkMigrator {
  constructor(options = {}) {
    super({
      ...options,
      vitestConfig: true,
      cucumberFeatures: true,
      stepDefinitions: true
    })
    
    this.featureFiles = []
    this.stepFiles = []
    this.configFiles = []
  }

  /**
   * Migrate Vitest configuration
   */
  async migrateVitestConfig(configPath) {
    try {
      const content = await fs.readFile(configPath, 'utf8')
      
      // Parse and transform Vitest config
      let newContent = content
      
      // Add framework setup
      newContent = this.addFrameworkSetup(newContent)
      
      // Update test patterns
      newContent = this.updateTestPatterns(newContent)
      
      // Add BDD configuration
      newContent = this.addBDDConfiguration(newContent)
      
      // Backup original
      if (this.options.backupOriginal) {
        await fs.writeFile(`${configPath}.backup`, content)
      }
      
      if (!this.options.dryRun) {
        await fs.writeFile(configPath, newContent)
      }
      
      console.log('✅ Migrated Vitest configuration')
      return newContent
      
    } catch (error) {
      console.error(`❌ Error migrating Vitest config: ${error.message}`)
      return null
    }
  }

  /**
   * Add framework setup to Vitest config
   */
  addFrameworkSetup(content) {
    // Add framework setup import
    if (!content.includes('@/tests/framework')) {
      content = `import { setupNuxtBDD } from '@/tests/framework'\n${content}`
    }
    
    // Add setupFiles configuration
    if (!content.includes('setupFiles')) {
      content = content.replace(
        /export default defineConfig\(\{([^}]*)\}/,
        `export default defineConfig({
  test: {
    setupFiles: ['./tests/framework/setup.js'],
    $1
  }
}`
      )
    }
    
    return content
  }

  /**
   * Update test patterns in config
   */
  updateTestPatterns(content) {
    // Update include patterns to support both old and new formats
    const includePattern = `
    include: [
      'tests/**/*.{test,spec}.{js,ts}',
      'tests/**/*.bdd.{js,ts}',
      '**/*.{test,spec}.{js,ts}'
    ]`
    
    if (content.includes('include:')) {
      content = content.replace(/include:\s*\[[^\]]*\]/, includePattern)
    } else {
      content = content.replace(
        /test:\s*\{/,
        `test: {${includePattern},`
      )
    }
    
    return content
  }

  /**
   * Add BDD-specific configuration
   */
  addBDDConfiguration(content) {
    const bddConfig = `
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      include: ['app/**/*.{js,vue}', 'server/**/*.js'],
      exclude: ['tests/**/*', '**/*.config.js']
    },
    // BDD Framework configuration
    testTimeout: 10000,
    hookTimeout: 5000`
    
    return content.replace(
      /test:\s*\{([^}]*)\}/s,
      `test: {${bddConfig}$1}`
    )
  }

  /**
   * Migrate .feature files to fluent BDD
   */
  async migrateFeatureFile(featurePath) {
    try {
      const content = await fs.readFile(featurePath, 'utf8')
      
      const feature = this.parseGherkinFeature(content)
      const fluentCode = this.generateFluentBDDFromFeature(feature)
      
      // Create new .bdd.js file
      const newPath = featurePath.replace(/\.feature$/, '.bdd.js')
      
      if (!this.options.dryRun) {
        await fs.writeFile(newPath, fluentCode)
      }
      
      console.log(`✅ Migrated feature file: ${featurePath} → ${newPath}`)
      this.incrementStat('feature-to-fluent-bdd')
      
      return { originalPath: featurePath, newPath, content: fluentCode }
      
    } catch (error) {
      console.error(`❌ Error migrating feature file: ${error.message}`)
      return null
    }
  }

  /**
   * Parse Gherkin feature file
   */
  parseGherkinFeature(content) {
    const lines = content.split('\n')
    const feature = {
      name: '',
      description: '',
      scenarios: []
    }
    
    let currentScenario = null
    let currentStep = null
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      if (trimmed.startsWith('Feature:')) {
        feature.name = trimmed.replace('Feature:', '').trim()
      } else if (trimmed.startsWith('Scenario:')) {
        currentScenario = {
          name: trimmed.replace('Scenario:', '').trim(),
          steps: []
        }
        feature.scenarios.push(currentScenario)
      } else if (trimmed.match(/^(Given|When|Then|And)\s/)) {
        const [stepType, ...stepText] = trimmed.split(/\s+/)
        currentStep = {
          type: stepType.toLowerCase(),
          text: stepText.join(' '),
          line: trimmed
        }
        if (currentScenario) {
          currentScenario.steps.push(currentStep)
        }
      }
    }
    
    return feature
  }

  /**
   * Generate fluent BDD JavaScript from Gherkin feature
   */
  generateFluentBDDFromFeature(feature) {
    const imports = `import { scenario } from '@/tests/framework/bdd'`
    
    const scenarios = feature.scenarios.map((scenario) => {
      const scenarioName = scenario.name || 'Unnamed Scenario'
      
      const steps = scenario.steps.map((step, index) => {
        const chainMethod = index === 0 ? step.type : 'and'
        const fluentMethod = this.convertStepToFluentMethod(step)
        return `  .${chainMethod}.${fluentMethod}`
      }).join('\n')
      
      return `
describe('${scenarioName}', () => {
  it('should execute successfully', async () => {
    await scenario('${scenarioName}')
${steps}
      .execute()
  })
})`
    }).join('\n\n')
    
    return `${imports}

describe('${feature.name}', () => {
${scenarios}
})
`
  }

  /**
   * Convert Gherkin step to fluent method
   */
  convertStepToFluentMethod(step) {
    const text = step.text.toLowerCase()
    
    // User actions
    if (text.includes('user') && text.includes('click')) {
      const match = text.match(/click(?:s on)?\s+(.+)/)
      const element = match ? match[1].replace(/"/g, '\'') : 'button'
      return `user.clicks('${element}')`
    }
    
    if (text.includes('user') && text.includes('enter')) {
      const match = text.match(/enter(?:s)?\s+"([^"]+)"/)
      const value = match ? match[1] : 'value'
      return `user.enters('${value}')`
    }
    
    if (text.includes('user') && text.includes('submit')) {
      return `user.submitsForm()`
    }
    
    // Page states
    if (text.includes('on') && text.includes('page')) {
      const match = text.match(/on\s+(?:the\s+)?(.+?)\s+page/)
      const page = match ? match[1] : 'homepage'
      return `page.isOn('${page}')`
    }
    
    if (text.includes('see') || text.includes('display')) {
      const match = text.match(/(?:see|display)\s+(.+)/)
      const content = match ? match[1].replace(/"/g, '\'') : 'content'
      return `page.shouldDisplay('${content}')`
    }
    
    if (text.includes('redirect')) {
      const match = text.match(/redirect(?:ed)?\s+to\s+(.+)/)
      const url = match ? match[1].replace(/"/g, '\'') : '/dashboard'
      return `user.shouldBeRedirected('${url}')`
    }
    
    // Element states
    if (text.includes('should be') || text.includes('should have')) {
      const parts = text.split(/should\s+(?:be|have)\s+/)
      if (parts.length > 1) {
        const element = parts[0].trim()
        const state = parts[1].trim()
        return `element.should('${element}', '${state}')`
      }
    }
    
    // API calls
    if (text.includes('api') || text.includes('request')) {
      return `api.shouldReceiveRequest()`
    }
    
    // Default fallback
    return `custom.action('${step.text}')`
  }

  /**
   * Migrate step definition files
   */
  async migrateStepDefinitions(stepPath) {
    try {
      const content = await fs.readFile(stepPath, 'utf8')
      
      // Transform using parent codemod
      const transformedContent = await this.processStepDefinitionContent(content)
      
      const newPath = stepPath.replace(/steps?\.js$/, 'fluent.steps.js')
      
      if (!this.options.dryRun) {
        await fs.writeFile(newPath, transformedContent)
      }
      
      console.log(`✅ Migrated step definitions: ${stepPath} → ${newPath}`)
      this.incrementStat('steps-to-fluent')
      
      return { originalPath: stepPath, newPath, content: transformedContent }
      
    } catch (error) {
      console.error(`❌ Error migrating step definitions: ${error.message}`)
      return null
    }
  }

  /**
   * Process step definition content
   */
  async processStepDefinitionContent(content) {
    // Remove cucumber imports and replace with framework
    let transformed = content.replace(
      /import\s+\{[^}]*\}\s+from\s+['"]@?cucumber[^'"]*['"]/g,
      'import { scenario, createSteps } from \'@/tests/framework/bdd\''
    )
    
    // Convert step definitions to fluent API helpers
    transformed = this.convertStepDefinitionsToHelpers(transformed)
    
    return transformed
  }

  /**
   * Convert step definitions to fluent API helpers
   */
  convertStepDefinitionsToHelpers(content) {
    // This is a simplified transformation
    // Real implementation would parse AST and transform more intelligently
    
    let transformed = content
    
    // Convert Given/When/Then to helper functions
    transformed = transformed.replace(
      /Given\(['"`]([^'"`]+)['"`],\s*async?\s*\([^)]*\)\s*=>\s*\{([^}]+)\}/g,
      (match, pattern, body) => {
        return `export const given${this.patternToMethodName(pattern)} = async () => {${body}}`
      }
    )
    
    transformed = transformed.replace(
      /When\(['"`]([^'"`]+)['"`],\s*async?\s*\([^)]*\)\s*=>\s*\{([^}]+)\}/g,
      (match, pattern, body) => {
        return `export const when${this.patternToMethodName(pattern)} = async () => {${body}}`
      }
    )
    
    transformed = transformed.replace(
      /Then\(['"`]([^'"`]+)['"`],\s*async?\s*\([^)]*\)\s*=>\s*\{([^}]+)\}/g,
      (match, pattern, body) => {
        return `export const then${this.patternToMethodName(pattern)} = async () => {${body}}`
      }
    )
    
    return transformed
  }

  /**
   * Convert step pattern to method name
   */
  patternToMethodName(pattern) {
    return pattern
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .map((word, index) => 
        index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join('')
  }

  /**
   * Find and categorize test files
   */
  async categorizeTestFiles(rootDir) {
    const allFiles = await this.findAllTestFiles(rootDir)
    
    this.featureFiles = allFiles.filter(f => f.endsWith('.feature'))
    this.stepFiles = allFiles.filter(f => f.includes('steps') && f.endsWith('.js'))
    this.configFiles = allFiles.filter(f => f.includes('vitest.config') || f.includes('vite.config'))
    
    return {
      features: this.featureFiles,
      steps: this.stepFiles,
      configs: this.configFiles,
      other: allFiles.filter(f => 
        !this.featureFiles.includes(f) && 
        !this.stepFiles.includes(f) && 
        !this.configFiles.includes(f)
      )
    }
  }

  /**
   * Find all test-related files
   */
  async findAllTestFiles(rootDir) {
    const files = []
    
    const scan = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        
        if (entry.isDirectory() && !this.options.skipPatterns.some(p => fullPath.includes(p))) {
          await scan(fullPath)
        } else if (entry.isFile() && this.isTestRelatedFile(entry.name)) {
          files.push(fullPath)
        }
      }
    }
    
    await scan(rootDir)
    return files
  }

  /**
   * Check if file is test-related
   */
  isTestRelatedFile(filename) {
    return super.isTestFile(filename) ||
           filename.endsWith('.feature') ||
           filename.includes('vitest.config') ||
           filename.includes('vite.config')
  }

  /**
   * Run complete Vitest-Cucumber migration
   */
  async migrateVitestCucumber(rootDir = './tests') {
    console.log('🥒 Starting Vitest + Cucumber migration to ultra-efficient BDD...')
    
    const categorized = await this.categorizeTestFiles(rootDir)
    console.log('📁 File categories:', {
      features: categorized.features.length,
      steps: categorized.steps.length,
      configs: categorized.configs.length,
      other: categorized.other.length
    })
    
    const results = {
      configs: [],
      features: [],
      steps: [],
      regular: []
    }
    
    // Migrate configurations first
    for (const configFile of categorized.configs) {
      const result = await this.migrateVitestConfig(configFile)
      if (result) results.configs.push(configFile)
    }
    
    // Migrate feature files
    for (const featureFile of categorized.features) {
      const result = await this.migrateFeatureFile(featureFile)
      if (result) results.features.push(result)
    }
    
    // Migrate step definitions
    for (const stepFile of categorized.steps) {
      const result = await this.migrateStepDefinitions(stepFile)
      if (result) results.steps.push(result)
    }
    
    // Migrate regular test files using parent class
    for (const testFile of categorized.other) {
      await this.processFile(testFile)
      results.regular.push(testFile)
    }
    
    const report = this.generateVitestCucumberReport(results)
    console.log('📊 Vitest + Cucumber Migration Complete:', report.summary)
    
    return report
  }

  /**
   * Generate specialized migration report
   */
  generateVitestCucumberReport(results) {
    const baseReport = this.generateReport()
    
    return {
      ...baseReport,
      vitestCucumber: {
        configsMigrated: results.configs.length,
        featuresMigrated: results.features.length,
        stepsMigrated: results.steps.length,
        regularTestsMigrated: results.regular.length
      },
      recommendations: [
        ...baseReport.recommendations,
        'Run tests to verify migration success',
        'Update CI/CD pipelines to use new test patterns',
        'Train team on fluent BDD syntax',
        'Consider gradual migration for large codebases'
      ]
    }
  }
}

export { VitestCucumberMigrator }
export default VitestCucumberMigrator
