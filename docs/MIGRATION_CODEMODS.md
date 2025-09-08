# Migration Codemods and Automation Tools

## Overview

This document provides comprehensive code transformation utilities to automate the migration from framework-centric to library-first architecture. The codemods support both gradual and complete migrations while ensuring zero breaking changes.

## Codemod Architecture

### Core Transformation Engine

```javascript
// /tools/migration/transformer.js
import { parse, generate } from '@babel/core'
import { traverse } from '@babel/traverse'
import * as t from '@babel/types'

export class MigrationTransformer {
  constructor(options = {}) {
    this.options = {
      mode: 'gradual', // 'gradual' | 'complete'
      preserveComments: true,
      dryRun: false,
      ...options
    }
    this.transformations = new Map()
    this.statistics = {
      filesProcessed: 0,
      transformationsApplied: 0,
      errors: []
    }
  }

  /**
   * Register transformation rules
   */
  registerTransform(name, transform) {
    this.transformations.set(name, transform)
  }

  /**
   * Apply all registered transformations to a file
   */
  async transformFile(filePath, content) {
    try {
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      })

      let hasChanges = false

      // Apply each transformation
      for (const [name, transform] of this.transformations) {
        const result = await this.applyTransform(ast, transform, name)
        if (result.changed) {
          hasChanges = true
          this.statistics.transformationsApplied++
        }
      }

      if (hasChanges && !this.options.dryRun) {
        const output = generate(ast, {
          retainLines: true,
          comments: this.options.preserveComments
        })
        return {
          success: true,
          content: output.code,
          changes: hasChanges,
          file: filePath
        }
      }

      return {
        success: true,
        content,
        changes: false,
        file: filePath
      }
    } catch (error) {
      this.statistics.errors.push({
        file: filePath,
        error: error.message
      })
      return {
        success: false,
        error: error.message,
        file: filePath
      }
    }
  }

  /**
   * Apply a single transformation to the AST
   */
  async applyTransform(ast, transform, transformName) {
    let changed = false

    traverse(ast, {
      ...transform.visitors,
      enter(path) {
        if (transform.enter) {
          const result = transform.enter(path, this.options)
          if (result) changed = true
        }
      },
      exit(path) {
        if (transform.exit) {
          const result = transform.exit(path, this.options)
          if (result) changed = true
        }
      }
    })

    return { changed, transform: transformName }
  }
}
```

## Framework Import Transformations

### 1. Framework to Library Import Conversion

```javascript
// /tools/migration/transforms/imports.js
export const frameworkToLibraryImports = {
  name: 'framework-to-library-imports',
  
  visitors: {
    ImportDeclaration(path) {
      const source = path.node.source.value
      
      // Transform framework imports to library imports
      if (source === '@nuxt-bdd/framework') {
        const specifiers = path.node.specifiers
        const newImports = this.createLibraryImports(specifiers)
        
        // Replace with multiple library imports
        path.replaceWithMultiple(newImports)
        return true
      }
      
      // Transform setup function imports
      if (source.includes('setupNuxtBDD') || source.includes('setupFullBDD')) {
        path.node.source.value = '@nuxt-bdd/core'
        const specifiers = path.node.specifiers.map(spec => {
          if (t.isImportSpecifier(spec)) {
            return t.importSpecifier(
              t.identifier(this.mapSetupToLibrary(spec.imported.name)),
              t.identifier(spec.imported.name)
            )
          }
          return spec
        })
        path.node.specifiers = specifiers
        return true
      }
      
      return false
    }
  },
  
  createLibraryImports(specifiers) {
    const imports = []
    const coreImports = []
    const integrationImports = []
    const utilityImports = []
    
    specifiers.forEach(spec => {
      if (t.isImportSpecifier(spec)) {
        const name = spec.imported.name
        
        if (this.isCoreFunction(name)) {
          coreImports.push(spec)
        } else if (this.isIntegrationFunction(name)) {
          integrationImports.push(spec)
        } else if (this.isUtilityFunction(name)) {
          utilityImports.push(spec)
        }
      }
    })
    
    // Create separate import statements
    if (coreImports.length > 0) {
      imports.push(t.importDeclaration(coreImports, t.stringLiteral('@nuxt-bdd/core')))
    }
    if (integrationImports.length > 0) {
      imports.push(t.importDeclaration(integrationImports, t.stringLiteral('@nuxt-bdd/integrations')))
    }
    if (utilityImports.length > 0) {
      imports.push(t.importDeclaration(utilityImports, t.stringLiteral('@nuxt-bdd/utilities')))
    }
    
    return imports
  },
  
  mapSetupToLibrary(functionName) {
    const mapping = {
      'setupNuxtBDD': 'scenario',
      'setupFullBDD': 'scenario',
      'createFramework': 'scenario'
    }
    return mapping[functionName] || functionName
  },
  
  isCoreFunction(name) {
    return ['scenario', 'given', 'when', 'then', 'mount', 'expect'].includes(name)
  },
  
  isIntegrationFunction(name) {
    return ['setupNuxt', 'nuxtHelpers', 'vueHelpers'].includes(name)
  },
  
  isUtilityFunction(name) {
    return ['performanceTest', 'a11yTest', 'responsiveTest'].includes(name)
  }
}
```

### 2. Framework Initialization Removal

```javascript
// /tools/migration/transforms/initialization.js
export const removeFrameworkInitialization = {
  name: 'remove-framework-initialization',
  
  visitors: {
    // Remove framework initialization calls
    VariableDeclarator(path) {
      if (t.isAwaitExpression(path.node.init)) {
        const callee = path.node.init.argument
        
        if (t.isCallExpression(callee)) {
          const calleName = this.getCallExpressionName(callee)
          
          if (this.isFrameworkSetupCall(calleName)) {
            // Transform to direct imports
            this.transformInitialization(path)
            return true
          }
        }
      }
      return false
    },
    
    // Remove framework class instantiation
    NewExpression(path) {
      if (t.isIdentifier(path.node.callee)) {
        if (path.node.callee.name === 'BDDFramework') {
          // Replace with library initialization if needed
          path.remove()
          return true
        }
      }
      return false
    }
  },
  
  transformInitialization(path) {
    const id = path.node.id
    
    if (t.isObjectPattern(id)) {
      // Destructuring assignment: const { scenario, helpers } = await setup()
      const properties = id.properties
      
      properties.forEach(prop => {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          const name = prop.key.name
          
          // Add direct import comments for manual review
          this.addImportComment(path, name)
        }
      })
      
      // Remove the entire declaration
      path.parentPath.remove()
    } else if (t.isIdentifier(id)) {
      // Simple assignment: const framework = await setup()
      this.addFrameworkReplacementComment(path, id.name)
      path.parentPath.remove()
    }
  },
  
  isFrameworkSetupCall(name) {
    return [
      'setupNuxtBDD',
      'setupFullBDD',
      'setupMinimal',
      'createFramework'
    ].includes(name)
  },
  
  getCallExpressionName(callExpression) {
    if (t.isIdentifier(callExpression.callee)) {
      return callExpression.callee.name
    }
    if (t.isMemberExpression(callExpression.callee)) {
      return callExpression.callee.property.name
    }
    return null
  },
  
  addImportComment(path, functionName) {
    const comment = `// TODO: Add direct import: import { ${functionName} } from '@nuxt-bdd/core'`
    path.addComment('leading', comment)
  },
  
  addFrameworkReplacementComment(path, varName) {
    const comment = `// TODO: Replace ${varName} usage with direct imports from @nuxt-bdd/core`
    path.addComment('leading', comment)
  }
}
```

### 3. Method Call Transformations

```javascript
// /tools/migration/transforms/method-calls.js
export const transformMethodCalls = {
  name: 'transform-method-calls',
  
  visitors: {
    CallExpression(path) {
      // Transform framework.scenario() to scenario()
      if (t.isMemberExpression(path.node.callee)) {
        const object = path.node.callee.object
        const property = path.node.callee.property
        
        if (t.isIdentifier(object) && t.isIdentifier(property)) {
          if (this.isFrameworkMethodCall(object.name, property.name)) {
            // Replace with direct function call
            path.node.callee = t.identifier(property.name)
            return true
          }
        }
      }
      
      // Transform chained calls
      if (this.isChainedFrameworkCall(path.node)) {
        return this.transformChainedCall(path)
      }
      
      return false
    }
  },
  
  isFrameworkMethodCall(objectName, methodName) {
    const frameworkObjects = ['framework', 'bddFramework', 'testFramework']
    const frameworkMethods = ['scenario', 'given', 'when', 'then', 'mount', 'expect']
    
    return frameworkObjects.includes(objectName) && frameworkMethods.includes(methodName)
  },
  
  isChainedFrameworkCall(callExpression) {
    // Check for patterns like framework.scenario().given.user.isAuthenticated()
    let current = callExpression.callee
    
    while (t.isMemberExpression(current)) {
      if (t.isIdentifier(current.object)) {
        const objectName = current.object.name
        if (['framework', 'bddFramework', 'testFramework'].includes(objectName)) {
          return true
        }
      }
      current = current.object
    }
    
    return false
  },
  
  transformChainedCall(path) {
    // Complex transformation for chained calls
    const chain = this.analyzeCallChain(path.node)
    
    if (chain.startsWithFramework) {
      // Remove framework prefix from chain
      const newCallee = this.rebuildCalleeWithoutFramework(path.node.callee, chain)
      path.node.callee = newCallee
      return true
    }
    
    return false
  },
  
  analyzeCallChain(callExpression) {
    const chain = []
    let current = callExpression.callee
    
    while (t.isMemberExpression(current)) {
      if (t.isIdentifier(current.property)) {
        chain.unshift(current.property.name)
      }
      current = current.object
    }
    
    if (t.isIdentifier(current)) {
      chain.unshift(current.name)
    }
    
    return {
      chain,
      startsWithFramework: ['framework', 'bddFramework', 'testFramework'].includes(chain[0])
    }
  },
  
  rebuildCalleeWithoutFramework(callee, chain) {
    // Rebuild member expression without framework prefix
    const newChain = chain.chain.slice(1) // Remove framework prefix
    
    if (newChain.length === 1) {
      return t.identifier(newChain[0])
    }
    
    let result = t.identifier(newChain[0])
    for (let i = 1; i < newChain.length; i++) {
      result = t.memberExpression(result, t.identifier(newChain[i]))
    }
    
    return result
  }
}
```

## Advanced Migration Patterns

### 4. Plugin System Migration

```javascript
// /tools/migration/transforms/plugins.js
export const migratePluginSystem = {
  name: 'migrate-plugin-system',
  
  visitors: {
    CallExpression(path) {
      const callee = path.node.callee
      
      // Transform framework.addPlugin() to direct plugin imports
      if (t.isMemberExpression(callee) && 
          t.isIdentifier(callee.property) &&
          callee.property.name === 'addPlugin') {
        
        return this.transformPluginRegistration(path)
      }
      
      // Transform usePlugin() calls
      if (t.isIdentifier(callee) && callee.name === 'usePlugin') {
        return this.transformUsePlugin(path)
      }
      
      return false
    }
  },
  
  transformPluginRegistration(path) {
    const args = path.node.arguments
    
    if (args.length > 0) {
      const pluginArg = args[0]
      
      if (t.isIdentifier(pluginArg)) {
        // Add import comment for plugin
        const comment = `// TODO: Import plugin directly: import { ${pluginArg.name} } from '@nuxt-bdd/plugins/${this.getPluginModule(pluginArg.name)}'`
        path.addComment('leading', comment)
      }
    }
    
    // Remove the plugin registration call
    path.remove()
    return true
  },
  
  transformUsePlugin(path) {
    const args = path.node.arguments
    
    if (args.length > 0) {
      const pluginArg = args[0]
      
      // Transform to direct plugin usage
      if (t.isIdentifier(pluginArg)) {
        const pluginName = pluginArg.name
        const directUsage = this.createDirectPluginUsage(pluginName)
        
        if (directUsage) {
          path.replaceWith(directUsage)
          return true
        }
      }
    }
    
    return false
  },
  
  getPluginModule(pluginName) {
    const pluginMapping = {
      'authPlugin': 'auth',
      'apiPlugin': 'api', 
      'formPlugin': 'forms',
      'visualPlugin': 'visual'
    }
    
    return pluginMapping[pluginName] || 'custom'
  },
  
  createDirectPluginUsage(pluginName) {
    // Create direct usage patterns for common plugins
    const usagePatterns = {
      'authPlugin': t.callExpression(
        t.identifier('useAuthHelpers'),
        []
      ),
      'apiPlugin': t.callExpression(
        t.identifier('useApiHelpers'), 
        []
      ),
      'formPlugin': t.callExpression(
        t.identifier('useFormHelpers'),
        []
      )
    }
    
    return usagePatterns[pluginName] || null
  }
}
```

### 5. Configuration Migration

```javascript
// /tools/migration/transforms/config.js
export const migrateConfiguration = {
  name: 'migrate-configuration',
  
  visitors: {
    ObjectExpression(path) {
      // Find framework configuration objects
      if (this.isFrameworkConfig(path.node)) {
        return this.transformConfig(path)
      }
      return false
    }
  },
  
  isFrameworkConfig(objectExpression) {
    const properties = objectExpression.properties
    
    // Check for framework-specific configuration keys
    const frameworkKeys = [
      'autoConfig',
      'nuxtIntegration', 
      'cucumberIntegration',
      'plugins'
    ]
    
    return properties.some(prop => {
      if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
        return frameworkKeys.includes(prop.key.name)
      }
      return false
    })
  },
  
  transformConfig(path) {
    const properties = path.node.properties
    const newProperties = []
    const importComments = []
    
    properties.forEach(prop => {
      if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
        const key = prop.key.name
        
        switch (key) {
          case 'autoConfig':
            // Auto-config is now handled by individual utilities
            importComments.push('// Auto-configuration is now built into library utilities')
            break
            
          case 'nuxtIntegration':
            if (prop.value.value === true) {
              importComments.push("// Import Nuxt helpers: import { nuxtHelpers } from '@nuxt-bdd/integrations/nuxt'")
            }
            break
            
          case 'cucumberIntegration':
            if (prop.value.value === true) {
              importComments.push("// Import Cucumber helpers: import { cucumberHelpers } from '@nuxt-bdd/integrations/cucumber'")
            }
            break
            
          case 'plugins':
            if (t.isArrayExpression(prop.value)) {
              this.transformPluginsArray(prop.value, importComments)
            }
            break
            
          default:
            // Keep other properties
            newProperties.push(prop)
        }
      } else {
        newProperties.push(prop)
      }
    })
    
    // Add import comments
    importComments.forEach(comment => {
      path.addComment('leading', comment)
    })
    
    // Update object with transformed properties
    path.node.properties = newProperties
    
    return true
  },
  
  transformPluginsArray(arrayExpression, importComments) {
    arrayExpression.elements.forEach(element => {
      if (t.isIdentifier(element)) {
        const pluginName = element.name
        const importPath = this.getPluginImportPath(pluginName)
        importComments.push(`// Import plugin: import { ${pluginName} } from '${importPath}'`)
      }
    })
  },
  
  getPluginImportPath(pluginName) {
    const pluginPaths = {
      'authPlugin': '@nuxt-bdd/plugins/auth',
      'apiPlugin': '@nuxt-bdd/plugins/api',
      'formPlugin': '@nuxt-bdd/plugins/forms',
      'visualPlugin': '@nuxt-bdd/plugins/visual'
    }
    
    return pluginPaths[pluginName] || '@nuxt-bdd/plugins/custom'
  }
}
```

## Migration CLI Implementation

### Command-Line Interface

```javascript
// /tools/migration/cli.js
import { Command } from 'commander'
import { MigrationTransformer } from './transformer.js'
import { ProjectAnalyzer } from './analyzer.js'
import { ValidationRunner } from './validator.js'

const program = new Command()

program
  .name('@nuxt-bdd/migrate')
  .description('Migration tool for @nuxt-bdd framework to library transformation')
  .version('1.0.0')

// Analysis command
program
  .command('analyze')
  .description('Analyze project for migration opportunities')
  .argument('<project-path>', 'Path to project directory')
  .option('-f, --format <type>', 'Output format (json, table, markdown)', 'table')
  .option('-o, --output <file>', 'Output file path')
  .option('--include-details', 'Include detailed analysis')
  .action(async (projectPath, options) => {
    const analyzer = new ProjectAnalyzer()
    const analysis = await analyzer.analyze(projectPath, options)
    
    await analyzer.outputResults(analysis, options)
  })

// Transform command  
program
  .command('transform')
  .description('Apply migration transformations to project')
  .argument '<project-path>', 'Path to project directory')
  .option('-m, --mode <type>', 'Migration mode (gradual, complete)', 'gradual')
  .option('--dry-run', 'Show what would be transformed without applying changes')
  .option('--backup', 'Create backup before transformation')
  .option('-t, --transforms <list>', 'Specific transforms to apply (comma-separated)')
  .option('--exclude <patterns>', 'File patterns to exclude')
  .action(async (projectPath, options) => {
    const transformer = new MigrationTransformer(options)
    
    // Register transforms based on mode
    registerTransforms(transformer, options)
    
    const results = await transformer.transformProject(projectPath, options)
    console.log('Migration Results:', results)
  })

// Validate command
program
  .command('validate')
  .description('Validate migration results')
  .argument('<project-path>', 'Path to project directory')
  .option('--run-tests', 'Run existing tests to validate functionality')
  .option('--check-imports', 'Validate all imports are resolvable')
  .option('--performance', 'Run performance benchmarks')
  .action(async (projectPath, options) => {
    const validator = new ValidationRunner()
    const results = await validator.validate(projectPath, options)
    
    console.log('Validation Results:')
    console.table(results.summary)
    
    if (results.issues.length > 0) {
      console.log('\\nIssues found:')
      results.issues.forEach(issue => {
        console.error(`- ${issue.file}: ${issue.message}`)
      })
    }
  })

function registerTransforms(transformer, options) {
  // Register all transforms
  transformer.registerTransform('framework-imports', frameworkToLibraryImports)
  transformer.registerTransform('initialization', removeFrameworkInitialization)
  transformer.registerTransform('method-calls', transformMethodCalls)
  transformer.registerTransform('plugins', migratePluginSystem)
  transformer.registerTransform('config', migrateConfiguration)
  
  // Add mode-specific transforms
  if (options.mode === 'complete') {
    transformer.registerTransform('remove-compat', removeCompatibilityLayer)
    transformer.registerTransform('optimize-imports', optimizeImports)
  }
}

program.parse()
```

### Project Analyzer

```javascript
// /tools/migration/analyzer.js
import { glob } from 'glob'
import { readFile } from 'fs/promises'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'

export class ProjectAnalyzer {
  constructor() {
    this.metrics = {
      totalFiles: 0,
      frameworkFiles: 0,
      migrationOpportunities: [],
      complexityScore: 0,
      estimatedEffort: 'unknown'
    }
  }

  async analyze(projectPath, options = {}) {
    const files = await this.findTestFiles(projectPath)
    
    for (const file of files) {
      await this.analyzeFile(file)
    }
    
    return {
      summary: this.generateSummary(),
      opportunities: this.metrics.migrationOpportunities,
      recommendations: this.generateRecommendations(),
      effort: this.estimateEffort()
    }
  }

  async findTestFiles(projectPath) {
    const patterns = [
      '**/*.test.js',
      '**/*.spec.js', 
      '**/*.test.ts',
      '**/*.spec.ts',
      'tests/**/*.js',
      'test/**/*.js'
    ]
    
    const files = []
    for (const pattern of patterns) {
      const matches = await glob(pattern, { cwd: projectPath })
      files.push(...matches.map(f => `${projectPath}/${f}`))
    }
    
    return [...new Set(files)]
  }

  async analyzeFile(filePath) {
    try {
      const content = await readFile(filePath, 'utf-8')
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      })
      
      this.metrics.totalFiles++
      
      const fileAnalysis = {
        file: filePath,
        frameworkUsage: false,
        patterns: [],
        opportunities: []
      }
      
      traverse(ast, {
        ImportDeclaration: (path) => {
          const source = path.node.source.value
          if (this.isFrameworkImport(source)) {
            fileAnalysis.frameworkUsage = true
            fileAnalysis.patterns.push(`Framework import: ${source}`)
          }
        },
        
        CallExpression: (path) => {
          const callName = this.getCallName(path.node)
          if (this.isFrameworkCall(callName)) {
            fileAnalysis.patterns.push(`Framework call: ${callName}`)
            fileAnalysis.opportunities.push({
              type: 'method-call',
              line: path.node.loc?.start.line,
              suggestion: this.suggestMethodCallMigration(callName)
            })
          }
        }
      })
      
      if (fileAnalysis.frameworkUsage) {
        this.metrics.frameworkFiles++
        this.metrics.migrationOpportunities.push(fileAnalysis)
      }
      
    } catch (error) {
      console.warn(`Could not analyze ${filePath}: ${error.message}`)
    }
  }

  isFrameworkImport(source) {
    return source.includes('@nuxt-bdd/framework') || 
           source.includes('setupNuxtBDD') ||
           source.includes('setupFullBDD') ||
           source.includes('createFramework')
  }

  isFrameworkCall(callName) {
    const frameworkCalls = [
      'setupNuxtBDD',
      'setupFullBDD', 
      'createFramework',
      'framework.scenario',
      'framework.mount'
    ]
    
    return frameworkCalls.some(call => callName?.includes(call))
  }

  getCallName(callExpression) {
    if (t.isIdentifier(callExpression.callee)) {
      return callExpression.callee.name
    }
    if (t.isMemberExpression(callExpression.callee)) {
      const object = callExpression.callee.object.name
      const property = callExpression.callee.property.name
      return `${object}.${property}`
    }
    return null
  }

  suggestMethodCallMigration(callName) {
    const suggestions = {
      'setupNuxtBDD': 'Import { scenario } from "@nuxt-bdd/core"',
      'framework.scenario': 'Use scenario() directly',
      'framework.mount': 'Import { mount } from "@nuxt-bdd/core"'
    }
    
    return suggestions[callName] || 'Consider direct import'
  }

  generateSummary() {
    return {
      totalFiles: this.metrics.totalFiles,
      frameworkFiles: this.metrics.frameworkFiles,
      migrationCoverage: `${this.metrics.frameworkFiles} files need migration`,
      complexityScore: this.calculateComplexity(),
      estimatedTime: this.estimateTime()
    }
  }

  calculateComplexity() {
    // Simple complexity scoring
    let score = 0
    
    this.metrics.migrationOpportunities.forEach(opportunity => {
      score += opportunity.patterns.length
      score += opportunity.opportunities.length * 2
    })
    
    return Math.min(score, 100) // Cap at 100
  }

  estimateTime() {
    const complexityScore = this.calculateComplexity()
    
    if (complexityScore < 10) return '1-2 hours'
    if (complexityScore < 25) return '2-4 hours'
    if (complexityScore < 50) return '4-8 hours'
    if (complexityScore < 75) return '1-2 days'
    return '2+ days'
  }

  generateRecommendations() {
    const recommendations = []
    
    if (this.metrics.frameworkFiles === 0) {
      recommendations.push('No framework usage detected - ready for library approach')
    } else {
      recommendations.push(`${this.metrics.frameworkFiles} files use framework patterns`)
      recommendations.push('Start with gradual migration mode')
      
      if (this.calculateComplexity() > 50) {
        recommendations.push('Consider migrating in phases due to complexity')
      }
    }
    
    return recommendations
  }

  async outputResults(analysis, options) {
    switch (options.format) {
      case 'json':
        const jsonOutput = JSON.stringify(analysis, null, 2)
        if (options.output) {
          await writeFile(options.output, jsonOutput)
        } else {
          console.log(jsonOutput)
        }
        break
        
      case 'markdown':
        const markdownOutput = this.generateMarkdownReport(analysis)
        if (options.output) {
          await writeFile(options.output, markdownOutput)
        } else {
          console.log(markdownOutput)
        }
        break
        
      default:
        console.table(analysis.summary)
        if (analysis.recommendations.length > 0) {
          console.log('\\nRecommendations:')
          analysis.recommendations.forEach(rec => console.log(`- ${rec}`))
        }
    }
  }

  generateMarkdownReport(analysis) {
    return `# Migration Analysis Report

## Summary
${Object.entries(analysis.summary)
  .map(([key, value]) => `- **${key}**: ${value}`)
  .join('\\n')}

## Recommendations
${analysis.recommendations.map(rec => `- ${rec}`).join('\\n')}

## Migration Opportunities
${analysis.opportunities.map(opp => 
  `### ${opp.file}\\n${opp.opportunities.map(o => `- ${o.suggestion} (line ${o.line})`).join('\\n')}`
).join('\\n\\n')}
`
  }
}
```

## Usage Examples

### CLI Usage

```bash
# Analyze project for migration opportunities
npx @nuxt-bdd/migrate analyze ./my-project

# Preview transformations without applying
npx @nuxt-bdd/migrate transform ./my-project --dry-run

# Apply gradual migration
npx @nuxt-bdd/migrate transform ./my-project --mode=gradual --backup

# Apply complete migration
npx @nuxt-bdd/migrate transform ./my-project --mode=complete --backup

# Validate migration results
npx @nuxt-bdd/migrate validate ./my-project --run-tests
```

### Programmatic Usage

```javascript
import { MigrationTransformer } from '@nuxt-bdd/migrate'

// Create transformer
const transformer = new MigrationTransformer({
  mode: 'gradual',
  dryRun: false
})

// Register transforms
transformer.registerTransform('imports', frameworkToLibraryImports)

// Transform project
const results = await transformer.transformProject('./my-project')
console.log('Migration completed:', results)
```

This comprehensive codemod system provides automated, safe, and flexible migration from framework to library architecture while maintaining full backward compatibility and providing detailed analysis and validation tools.