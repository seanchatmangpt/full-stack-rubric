/**
 * @fileoverview Codemod for converting existing tests to ultra-efficient BDD + Nuxt 4 micro-framework
 * Handles Vue Test Utils → quickTest(), Cucumber → fluent BDD, manual mocking → smart factories
 */

import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import * as t from '@babel/types'
import fs from 'fs/promises'
import path from 'path'

/**
 * Main codemod class for test framework migration
 */
class TestFrameworkMigrator {
  constructor(options = {}) {
    this.options = {
      dryRun: false,
      verbose: true,
      backupOriginal: true,
      skipPatterns: ['/node_modules/', '/dist/'],
      ...options
    }
    this.stats = {
      filesProcessed: 0,
      transformations: 0,
      errors: 0,
      patterns: new Map()
    }
  }

  /**
   * Transform Vue Test Utils mount() calls to quickTest()
   */
  transformVueTestUtils(path) {
    // Replace mount() with quickTest()
    if (t.isCallExpression(path.node) && 
        t.isIdentifier(path.node.callee, { name: 'mount' })) {
      
      const [component, options = t.objectExpression([])] = path.node.arguments
      
      // Convert mount(Component, { props: {}, global: {} }) 
      // to quickTest('ComponentName', Component, { props: {}, responsive: true, a11y: true })
      const componentName = this.extractComponentName(component)
      
      const newCall = t.callExpression(
        t.identifier('quickTest'),
        [
          t.stringLiteral(componentName),
          component,
          this.enhanceTestOptions(options)
        ]
      )
      
      path.replaceWith(newCall)
      this.incrementStat('vue-test-utils-to-quicktest')
      return true
    }
    return false
  }

  /**
   * Transform Cucumber step definitions to fluent BDD
   */
  transformCucumberSteps(path) {
    // Transform Given/When/Then to fluent API
    if (t.isCallExpression(path.node)) {
      const callee = path.node.callee
      
      if (t.isIdentifier(callee) && ['Given', 'When', 'Then', 'And'].includes(callee.name)) {
        const stepText = path.node.arguments[0]
        const stepFunction = path.node.arguments[1]
        
        if (t.isStringLiteral(stepText)) {
          const fluentChain = this.convertToFluentBDD(callee.name, stepText.value, stepFunction)
          if (fluentChain) {
            path.replaceWith(fluentChain)
            this.incrementStat('cucumber-to-fluent-bdd')
            return true
          }
        }
      }
    }
    return false
  }

  /**
   * Transform manual mocks to smart factories
   */
  transformManualMocks(path) {
    // Convert hardcoded test data to factory calls
    if (t.isVariableDeclaration(path.node)) {
      const declarations = path.node.declarations
      
      for (const decl of declarations) {
        if (t.isObjectExpression(decl.init)) {
          const factoryCall = this.detectAndConvertToFactory(decl.init, decl.id.name)
          if (factoryCall) {
            decl.init = factoryCall
            this.incrementStat('manual-mock-to-factory')
            return true
          }
        }
      }
    }
    return false
  }

  /**
   * Update imports to use micro-framework
   */
  updateImports(ast) {
    traverse(ast, {
      ImportDeclaration: (path) => {
        const source = path.node.source.value
        
        // Replace @vue/test-utils imports
        if (source === '@vue/test-utils') {
          path.node.source = t.stringLiteral('@/tests/framework')
          
          // Update specifiers
          path.node.specifiers = [
            t.importSpecifier(t.identifier('quickTest'), t.identifier('quickTest')),
            t.importSpecifier(t.identifier('scenario'), t.identifier('scenario')),
            t.importSpecifier(t.identifier('factories'), t.identifier('factories'))
          ]
          this.incrementStat('import-updated')
        }

        // Replace cucumber imports
        if (source.includes('cucumber')) {
          path.node.source = t.stringLiteral('@/tests/framework/bdd')
          path.node.specifiers = [
            t.importSpecifier(t.identifier('scenario'), t.identifier('scenario')),
            t.importSpecifier(t.identifier('generateSteps'), t.identifier('generateSteps'))
          ]
          this.incrementStat('cucumber-import-updated')
        }
      }
    })
  }

  /**
   * Extract component name from AST node
   */
  extractComponentName(componentNode) {
    if (t.isIdentifier(componentNode)) {
      return componentNode.name
    }
    if (t.isMemberExpression(componentNode)) {
      return componentNode.property.name
    }
    return 'UnknownComponent'
  }

  /**
   * Enhance test options with framework defaults
   */
  enhanceTestOptions(options) {
    const properties = [...options.properties]
    
    // Add framework enhancements if not present
    const hasResponsive = properties.some(p => t.isIdentifier(p.key, { name: 'responsive' }))
    const hasA11y = properties.some(p => t.isIdentifier(p.key, { name: 'a11y' }))
    const hasPerformance = properties.some(p => t.isIdentifier(p.key, { name: 'performance' }))
    
    if (!hasResponsive) {
      properties.push(t.objectProperty(t.identifier('responsive'), t.booleanLiteral(true)))
    }
    if (!hasA11y) {
      properties.push(t.objectProperty(t.identifier('a11y'), t.identifier('true')))
    }
    if (!hasPerformance) {
      properties.push(t.objectProperty(t.identifier('performance'), t.booleanLiteral(true)))
    }
    
    return t.objectExpression(properties)
  }

  /**
   * Convert Cucumber steps to fluent BDD
   */
  convertToFluentBDD(stepType, stepText, stepFunction) {
    const patterns = {
      Given: this.parseGivenStep(stepText),
      When: this.parseWhenStep(stepText),
      Then: this.parseThenStep(stepText),
      And: this.parseAndStep(stepText)
    }
    
    const pattern = patterns[stepType]
    if (pattern) {
      return t.callExpression(
        t.memberExpression(
          t.callExpression(t.identifier('scenario'), [t.stringLiteral('Migrated Test')]),
          t.identifier(pattern.method)
        ),
        pattern.args
      )
    }
    return null
  }

  /**
   * Parse Given step patterns
   */
  parseGivenStep(text) {
    const patterns = [
      { regex: /the user is (.*)/i, method: 'given.user.is', extract: 1 },
      { regex: /I am on (.*)/i, method: 'given.page.isOn', extract: 1 },
      { regex: /the (.*) is (.*)/i, method: 'given.element.hasState', extract: [1, 2] }
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern.regex)
      if (match) {
        const args = Array.isArray(pattern.extract) 
          ? pattern.extract.map(i => t.stringLiteral(match[i]))
          : [t.stringLiteral(match[pattern.extract])]
        return { method: pattern.method, args }
      }
    }
    return null
  }

  /**
   * Parse When step patterns
   */
  parseWhenStep(text) {
    const patterns = [
      { regex: /I click (.*)/i, method: 'when.user.clicks', extract: 1 },
      { regex: /I submit (.*)/i, method: 'when.user.submits', extract: 1 },
      { regex: /I enter (.*) in (.*)/i, method: 'when.user.enters', extract: [1, 2] }
    ]
    
    return this.matchPattern(text, patterns)
  }

  /**
   * Parse Then step patterns
   */
  parseThenStep(text) {
    const patterns = [
      { regex: /I should see (.*)/i, method: 'then.page.shouldDisplay', extract: 1 },
      { regex: /I should be redirected to (.*)/i, method: 'then.user.shouldBeRedirected', extract: 1 },
      { regex: /the (.*) should (.*)/i, method: 'then.element.should', extract: [1, 2] }
    ]
    
    return this.matchPattern(text, patterns)
  }

  /**
   * Parse And step patterns
   */
  parseAndStep(text) {
    return this.parseThenStep(text) || this.parseWhenStep(text) || this.parseGivenStep(text)
  }

  /**
   * Match text against patterns
   */
  matchPattern(text, patterns) {
    for (const pattern of patterns) {
      const match = text.match(pattern.regex)
      if (match) {
        const args = Array.isArray(pattern.extract) 
          ? pattern.extract.map(i => t.stringLiteral(match[i]))
          : [t.stringLiteral(match[pattern.extract])]
        return { method: pattern.method, args }
      }
    }
    return null
  }

  /**
   * Detect and convert manual mocks to factory calls
   */
  detectAndConvertToFactory(objectNode, variableName) {
    const properties = objectNode.properties
    
    // Detect user-like objects
    if (this.hasProperties(properties, ['email', 'name', 'id'])) {
      return t.callExpression(
        t.memberExpression(t.identifier('factories'), t.identifier('user')),
        [this.convertPropertiesToOptions(properties)]
      )
    }
    
    // Detect API response objects
    if (this.hasProperties(properties, ['data', 'status', 'message'])) {
      return t.callExpression(
        t.memberExpression(t.identifier('factories'), t.identifier('apiResponse')),
        [this.convertPropertiesToOptions(properties)]
      )
    }
    
    return null
  }

  /**
   * Check if object has specific properties
   */
  hasProperties(properties, requiredProps) {
    const propNames = properties
      .filter(p => t.isObjectProperty(p) && t.isIdentifier(p.key))
      .map(p => p.key.name)
    
    return requiredProps.some(prop => propNames.includes(prop))
  }

  /**
   * Convert object properties to factory options
   */
  convertPropertiesToOptions(properties) {
    return t.objectExpression(
      properties.filter(p => !t.isStringLiteral(p.value) || p.value.value !== '')
    )
  }

  /**
   * Process a single file
   */
  async processFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      
      if (this.options.backupOriginal) {
        await fs.writeFile(`${filePath}.backup`, content)
      }
      
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy']
      })
      
      let hasChanges = false
      
      // Update imports first
      this.updateImports(ast)
      
      // Transform test patterns
      traverse(ast, {
        CallExpression: (path) => {
          hasChanges = this.transformVueTestUtils(path) || hasChanges
          hasChanges = this.transformCucumberSteps(path) || hasChanges
        },
        VariableDeclaration: (path) => {
          hasChanges = this.transformManualMocks(path) || hasChanges
        }
      })
      
      if (hasChanges) {
        const { code } = generate(ast, {
          retainLines: false,
          compact: false
        })
        
        if (!this.options.dryRun) {
          await fs.writeFile(filePath, code)
        }
        
        this.stats.transformations++
        
        if (this.options.verbose) {
          console.log(`✅ Migrated: ${filePath}`)
        }
      }
      
      this.stats.filesProcessed++
      
    } catch (error) {
      this.stats.errors++
      console.error(`❌ Error processing ${filePath}:`, error.message)
    }
  }

  /**
   * Find all test files to migrate
   */
  async findTestFiles(rootDir) {
    const testFiles = []
    
    const scan = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        
        if (entry.isDirectory() && !this.options.skipPatterns.some(p => fullPath.includes(p))) {
          await scan(fullPath)
        } else if (entry.isFile() && this.isTestFile(entry.name)) {
          testFiles.push(fullPath)
        }
      }
    }
    
    await scan(rootDir)
    return testFiles
  }

  /**
   * Check if file is a test file
   */
  isTestFile(filename) {
    return /\.(test|spec)\.(js|ts|vue)$/.test(filename) ||
           /\.feature$/.test(filename) ||
           filename.includes('steps.js')
  }

  /**
   * Increment transformation statistics
   */
  incrementStat(pattern) {
    this.stats.patterns.set(pattern, (this.stats.patterns.get(pattern) || 0) + 1)
  }

  /**
   * Generate migration report
   */
  generateReport() {
    return {
      summary: {
        filesProcessed: this.stats.filesProcessed,
        transformations: this.stats.transformations,
        errors: this.stats.errors,
        successRate: `${((this.stats.transformations / this.stats.filesProcessed) * 100).toFixed(1)}%`
      },
      patterns: Object.fromEntries(this.stats.patterns),
      recommendations: this.generateRecommendations()
    }
  }

  /**
   * Generate migration recommendations
   */
  generateRecommendations() {
    const recommendations = []
    
    if (this.stats.errors > 0) {
      recommendations.push('Review files with errors and migrate manually if needed')
    }
    
    if (this.stats.patterns.get('vue-test-utils-to-quicktest') > 10) {
      recommendations.push('Consider batch updating test configurations for consistency')
    }
    
    if (this.stats.patterns.get('cucumber-to-fluent-bdd') > 5) {
      recommendations.push('Review fluent BDD conversions and enhance with custom step patterns')
    }
    
    return recommendations
  }

  /**
   * Run migration on directory
   */
  async migrate(rootDir = './tests') {
    console.log('🚀 Starting test framework migration...')
    
    const testFiles = await this.findTestFiles(rootDir)
    console.log(`📁 Found ${testFiles.length} test files`)
    
    // Process files in batches to avoid overwhelming the system
    const batchSize = 10
    for (let i = 0; i < testFiles.length; i += batchSize) {
      const batch = testFiles.slice(i, i + batchSize)
      await Promise.all(batch.map(file => this.processFile(file)))
    }
    
    const report = this.generateReport()
    console.log('📊 Migration Summary:', report.summary)
    
    return report
  }
}

export { TestFrameworkMigrator }
export default TestFrameworkMigrator
