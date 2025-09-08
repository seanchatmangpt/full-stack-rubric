/**
 * @fileoverview Step definition discovery and analysis system
 * @description Provides utilities for discovering, analyzing, and managing step definitions
 * across feature files and step definition files, with gap analysis and auto-generation.
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'
import { parseFeature, extractStepPatterns } from './feature-parser.js'

/**
 * @typedef {Object} StepDefinition
 * @property {string} pattern - Step pattern regex
 * @property {string} keyword - Step keyword (Given|When|Then)
 * @property {string} file - File where step is defined
 * @property {number} lineNumber - Line number in file
 * @property {string} functionName - Function name
 * @property {Array<string>} parameters - Parameter names
 * @property {boolean} implemented - Whether step is implemented
 */

/**
 * @typedef {Object} StepUsage
 * @property {string} step - Step text
 * @property {string} keyword - Step keyword
 * @property {string} feature - Feature file
 * @property {string} scenario - Scenario title
 * @property {number} lineNumber - Line number in feature
 */

/**
 * @typedef {Object} DiscoveryResult
 * @property {Array<StepDefinition>} definitions - Found step definitions
 * @property {Array<StepUsage>} usage - Step usage in features
 * @property {Array<Object>} missing - Missing step definitions
 * @property {Array<Object>} unused - Unused step definitions
 * @property {Object} coverage - Coverage statistics
 */

/**
 * Step definition discovery and analysis system
 */
export class StepDiscovery {
  /**
   * Initialize step discovery system
   * @param {Object} options - Discovery options
   * @param {Array<string>} options.stepDirectories - Directories to search for steps
   * @param {Array<string>} options.featureDirectories - Directories to search for features
   * @param {Array<string>} options.stepFilePatterns - File patterns for step definitions
   * @param {Array<string>} options.featureFilePatterns - File patterns for features
   */
  constructor(options = {}) {
    this.options = {
      stepDirectories: ['tests/steps', 'test/steps', 'spec/steps'],
      featureDirectories: ['tests/features', 'test/features', 'spec/features'],
      stepFilePatterns: ['*.steps.js', '*.step.js', '*-steps.js', '*-step.js'],
      featureFilePatterns: ['*.feature'],
      ...options
    }
    
    this.stepDefinitionRegex = [
      // Standard vitest-cucumber patterns
      /(?:Given|When|Then)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*([^)]+)\)/g,
      // Function-based patterns  
      /(?:Given|When|Then)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(async\s+)?function\s*([^(]*)/g,
      // Arrow function patterns
      /(?:Given|When|Then)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(async\s+)?\(/g
    ]
  }

  /**
   * Discover all step definitions and usage across project
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<DiscoveryResult>} Discovery results
   */
  async discoverSteps(projectRoot) {
    const definitions = await this.findStepDefinitions(projectRoot)
    const usage = await this.findStepUsage(projectRoot)
    
    const { missing, unused } = this.analyzeStepCoverage(definitions, usage)
    const coverage = this.calculateCoverage(definitions, usage, missing, unused)
    
    return {
      definitions,
      usage,
      missing,
      unused,
      coverage
    }
  }

  /**
   * Find all step definitions in project
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Array<StepDefinition>>} Found step definitions
   */
  async findStepDefinitions(projectRoot) {
    const definitions = []
    
    for (const directory of this.options.stepDirectories) {
      const fullPath = join(projectRoot, directory)
      
      if (this.directoryExists(fullPath)) {
        const files = this.findFiles(fullPath, this.options.stepFilePatterns)
        
        for (const file of files) {
          const fileDefinitions = await this.parseStepFile(file)
          definitions.push(...fileDefinitions)
        }
      }
    }
    
    return definitions
  }

  /**
   * Find all step usage in feature files
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Array<StepUsage>>} Step usage information
   */
  async findStepUsage(projectRoot) {
    const usage = []
    
    for (const directory of this.options.featureDirectories) {
      const fullPath = join(projectRoot, directory)
      
      if (this.directoryExists(fullPath)) {
        const files = this.findFiles(fullPath, this.options.featureFilePatterns)
        
        for (const file of files) {
          const fileUsage = await this.parseFeatureFile(file)
          usage.push(...fileUsage)
        }
      }
    }
    
    return usage
  }

  /**
   * Parse step definition file to extract definitions
   * @param {string} filePath - Step definition file path
   * @returns {Promise<Array<StepDefinition>>} Step definitions in file
   */
  async parseStepFile(filePath) {
    const content = readFileSync(filePath, 'utf-8')
    const definitions = []
    const lines = content.split('\n')
    
    // Find step keyword imports to determine available keywords
    const importMatch = content.match(/import\s+{([^}]+)}\s+from\s+['"`]@amiceli\/vitest-cucumber['"`]/)
    const availableKeywords = importMatch ? 
      importMatch[1].split(',').map(k => k.trim()) : 
      ['Given', 'When', 'Then']
    
    for (const keyword of availableKeywords) {
      if (!['Given', 'When', 'Then', 'Before', 'After'].includes(keyword)) continue
      
      const keywordRegex = new RegExp(`${keyword}\\s*\\(\\s*['"\`]([^'"\`]+)['"\`]\\s*,\\s*([^)]+)`, 'g')
      let match
      
      while ((match = keywordRegex.exec(content)) !== null) {
        const pattern = match[1]
        const implementation = match[2].trim()
        
        // Find line number
        const beforeMatch = content.substring(0, match.index)
        const lineNumber = beforeMatch.split('\n').length
        
        // Extract function name if present
        const functionMatch = implementation.match(/(?:async\s+)?(?:function\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)/)
        const functionName = functionMatch ? functionMatch[1] : 'anonymous'
        
        // Extract parameters from pattern
        const parameters = this.extractPatternParameters(pattern)
        
        // Check if implemented (not just a placeholder)
        const isImplemented = !implementation.includes('throw new Error') && 
                             !implementation.includes('TODO') &&
                             !implementation.includes('not implemented')
        
        definitions.push({
          pattern,
          keyword,
          file: filePath,
          lineNumber,
          functionName,
          parameters,
          implemented: isImplemented
        })
      }
    }
    
    return definitions
  }

  /**
   * Parse feature file to extract step usage
   * @param {string} filePath - Feature file path
   * @returns {Promise<Array<StepUsage>>} Step usage in feature
   */
  async parseFeatureFile(filePath) {
    const content = readFileSync(filePath, 'utf-8')
    const feature = parseFeature(content, filePath)
    const usage = []
    
    // Process background steps
    if (feature.background) {
      for (const step of feature.background.steps) {
        usage.push({
          step: step.text,
          keyword: step.keyword,
          feature: filePath,
          scenario: 'Background',
          lineNumber: step.lineNumber
        })
      }
    }
    
    // Process scenario steps
    for (const scenario of feature.scenarios) {
      for (const step of scenario.steps) {
        usage.push({
          step: step.text,
          keyword: step.keyword,
          feature: filePath,
          scenario: scenario.title,
          lineNumber: step.lineNumber
        })
      }
    }
    
    // Process scenario outline steps
    for (const outline of feature.scenarioOutlines) {
      for (const step of outline.steps) {
        usage.push({
          step: step.text,
          keyword: step.keyword,
          feature: filePath,
          scenario: outline.title,
          lineNumber: step.lineNumber
        })
      }
    }
    
    return usage
  }

  /**
   * Analyze step coverage to find missing and unused definitions
   * @param {Array<StepDefinition>} definitions - Step definitions
   * @param {Array<StepUsage>} usage - Step usage
   * @returns {Object} Coverage analysis
   */
  analyzeStepCoverage(definitions, usage) {
    const missing = []
    const unused = []
    const usedPatterns = new Set()
    
    // Find missing step definitions
    for (const use of usage) {
      const matchingDefinition = definitions.find(def => {
        try {
          const regex = new RegExp(`^${def.pattern}$`)
          return def.keyword === use.keyword && regex.test(use.step)
        } catch (error) {
          return false
        }
      })
      
      if (matchingDefinition) {
        usedPatterns.add(`${matchingDefinition.keyword}:${matchingDefinition.pattern}`)
      } else {
        missing.push({
          step: use.step,
          keyword: use.keyword,
          feature: use.feature,
          scenario: use.scenario,
          lineNumber: use.lineNumber,
          suggestedPattern: this.parameterizeStep(use.step),
          suggestedImplementation: this.generateStepImplementation(use.keyword, use.step)
        })
      }
    }
    
    // Find unused step definitions
    for (const definition of definitions) {
      const key = `${definition.keyword}:${definition.pattern}`
      if (!usedPatterns.has(key)) {
        unused.push(definition)
      }
    }
    
    return { missing, unused }
  }

  /**
   * Calculate coverage statistics
   * @param {Array<StepDefinition>} definitions - Step definitions
   * @param {Array<StepUsage>} usage - Step usage
   * @param {Array<Object>} missing - Missing definitions
   * @param {Array<Object>} unused - Unused definitions
   * @returns {Object} Coverage statistics
   */
  calculateCoverage(definitions, usage, missing, unused) {
    const totalSteps = usage.length
    const coveredSteps = totalSteps - missing.length
    const coveragePercentage = totalSteps > 0 ? (coveredSteps / totalSteps) * 100 : 100
    
    const implementedDefinitions = definitions.filter(def => def.implemented).length
    const implementationPercentage = definitions.length > 0 ? 
      (implementedDefinitions / definitions.length) * 100 : 100
    
    const keywordStats = this.calculateKeywordStatistics(usage)
    
    return {
      totalSteps,
      coveredSteps,
      missingSteps: missing.length,
      unusedDefinitions: unused.length,
      coveragePercentage: Math.round(coveragePercentage * 100) / 100,
      implementationPercentage: Math.round(implementationPercentage * 100) / 100,
      totalDefinitions: definitions.length,
      implementedDefinitions,
      keywordStats
    }
  }

  /**
   * Calculate statistics by step keyword
   * @param {Array<StepUsage>} usage - Step usage
   * @returns {Object} Keyword statistics
   */
  calculateKeywordStatistics(usage) {
    const stats = {}
    
    for (const use of usage) {
      if (!stats[use.keyword]) {
        stats[use.keyword] = {
          count: 0,
          percentage: 0
        }
      }
      stats[use.keyword].count++
    }
    
    const total = usage.length
    for (const keyword in stats) {
      stats[keyword].percentage = Math.round((stats[keyword].count / total) * 100 * 100) / 100
    }
    
    return stats
  }

  /**
   * Generate missing step definitions code
   * @param {Array<Object>} missing - Missing step definitions
   * @param {Object} options - Generation options
   * @returns {string} Generated step definition code
   */
  generateMissingSteps(missing, options = {}) {
    const { groupByFile = true, includeComments = true } = options
    const templates = []
    
    if (groupByFile) {
      const byFile = this.groupMissingByFile(missing)
      
      for (const [file, steps] of Object.entries(byFile)) {
        if (includeComments) {
          templates.push(`// Missing step definitions for ${file}`)
        }
        
        for (const step of steps) {
          templates.push(step.suggestedImplementation)
        }
        
        templates.push('')
      }
    } else {
      for (const step of missing) {
        templates.push(step.suggestedImplementation)
      }
    }
    
    return templates.join('\n')
  }

  /**
   * Group missing steps by feature file
   * @param {Array<Object>} missing - Missing steps
   * @returns {Object} Steps grouped by file
   */
  groupMissingByFile(missing) {
    const grouped = {}
    
    for (const step of missing) {
      if (!grouped[step.feature]) {
        grouped[step.feature] = []
      }
      grouped[step.feature].push(step)
    }
    
    return grouped
  }

  /**
   * Extract parameters from step pattern
   * @param {string} pattern - Step pattern
   * @returns {Array<string>} Parameter names
   */
  extractPatternParameters(pattern) {
    const params = []
    const matches = pattern.matchAll(/\{(int|float|string|word)\}/g)
    
    let counts = { int: 0, float: 0, string: 0, word: 0 }
    
    for (const match of matches) {
      const type = match[1]
      const count = counts[type]
      params.push(count > 0 ? `${type}${count + 1}` : type)
      counts[type]++
    }
    
    return params
  }

  /**
   * Parameterize step text for pattern matching
   * @param {string} stepText - Original step text
   * @returns {string} Parameterized pattern
   */
  parameterizeStep(stepText) {
    return stepText
      .replace(/\d+\.\d+/g, '{float}')
      .replace(/\d+/g, '{int}')
      .replace(/"([^"]+)"/g, '{string}')
      .replace(/'([^']+)'/g, '{string}')
      .replace(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, '{string}') // Proper nouns
  }

  /**
   * Generate step implementation template
   * @param {string} keyword - Step keyword
   * @param {string} stepText - Step text
   * @returns {string} Implementation template
   */
  generateStepImplementation(keyword, stepText) {
    const pattern = this.parameterizeStep(stepText)
    const functionName = this.generateFunctionName(stepText)
    const parameters = this.extractPatternParameters(pattern)
    
    const paramList = parameters.length > 0 ? parameters.join(', ') : ''
    
    return `/**
 * @description ${keyword} ${stepText}
 * @${keyword.toLowerCase()} ${pattern}
 */
${keyword}('${pattern}', async function ${functionName}(${paramList}) {
  // TODO: Implement step definition
  throw new Error('Step definition not implemented: ${keyword} ${stepText}')
})`
  }

  /**
   * Generate function name from step text
   * @param {string} stepText - Step text
   * @returns {string} Function name
   */
  generateFunctionName(stepText) {
    return stepText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 50) || 'stepFunction'
  }

  /**
   * Find files matching patterns in directory
   * @param {string} directory - Directory to search
   * @param {Array<string>} patterns - File patterns to match
   * @returns {Array<string>} Found file paths
   */
  findFiles(directory, patterns) {
    const files = []
    
    try {
      const entries = readdirSync(directory)
      
      for (const entry of entries) {
        const fullPath = join(directory, entry)
        const stat = statSync(fullPath)
        
        if (stat.isFile()) {
          const matches = patterns.some(pattern => {
            const regex = new RegExp(pattern.replace('*', '.*'))
            return regex.test(entry)
          })
          
          if (matches) {
            files.push(fullPath)
          }
        } else if (stat.isDirectory()) {
          // Recursively search subdirectories
          const subFiles = this.findFiles(fullPath, patterns)
          files.push(...subFiles)
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
    
    return files
  }

  /**
   * Check if directory exists
   * @param {string} directory - Directory path
   * @returns {boolean} Whether directory exists
   */
  directoryExists(directory) {
    try {
      const stat = statSync(directory)
      return stat.isDirectory()
    } catch (error) {
      return false
    }
  }

  /**
   * Generate coverage report
   * @param {DiscoveryResult} discoveryResult - Discovery results
   * @param {Object} options - Report options
   * @returns {string} Coverage report
   */
  generateCoverageReport(discoveryResult, options = {}) {
    const { format = 'text', includeDetails = true } = options
    const { coverage, missing, unused, definitions, usage } = discoveryResult
    
    if (format === 'json') {
      return JSON.stringify({
        coverage,
        summary: {
          totalSteps: usage.length,
          totalDefinitions: definitions.length,
          missingSteps: missing.length,
          unusedDefinitions: unused.length
        }
      }, null, 2)
    }
    
    const lines = []
    lines.push('BDD Step Coverage Report')
    lines.push('========================')
    lines.push('')
    lines.push(`Total Steps: ${coverage.totalSteps}`)
    lines.push(`Covered Steps: ${coverage.coveredSteps}`)
    lines.push(`Coverage: ${coverage.coveragePercentage}%`)
    lines.push(`Implementation: ${coverage.implementationPercentage}%`)
    lines.push('')
    lines.push('Step Distribution:')
    
    for (const [keyword, stats] of Object.entries(coverage.keywordStats)) {
      lines.push(`  ${keyword}: ${stats.count} (${stats.percentage}%)`)
    }
    
    if (includeDetails) {
      if (missing.length > 0) {
        lines.push('')
        lines.push(`Missing Step Definitions (${missing.length}):`)
        for (const step of missing) {
          lines.push(`  ${step.keyword} ${step.step} (${step.feature}:${step.lineNumber})`)
        }
      }
      
      if (unused.length > 0) {
        lines.push('')
        lines.push(`Unused Step Definitions (${unused.length}):`)
        for (const step of unused) {
          lines.push(`  ${step.keyword} ${step.pattern} (${step.file}:${step.lineNumber})`)
        }
      }
    }
    
    return lines.join('\n')
  }
}

/**
 * Default step discovery instance
 */
export const stepDiscovery = new StepDiscovery()

/**
 * Convenience function to discover steps in project
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<DiscoveryResult>} Discovery results
 */
export async function discoverSteps(projectRoot) {
  return stepDiscovery.discoverSteps(projectRoot)
}

/**
 * Convenience function to generate missing step definitions
 * @param {string} projectRoot - Project root directory
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Generated step definitions
 */
export async function generateMissingSteps(projectRoot, options) {
  const discovery = await stepDiscovery.discoverSteps(projectRoot)
  return stepDiscovery.generateMissingSteps(discovery.missing, options)
}

/**
 * Convenience function to generate coverage report
 * @param {string} projectRoot - Project root directory
 * @param {Object} options - Report options
 * @returns {Promise<string>} Coverage report
 */
export async function generateCoverageReport(projectRoot, options) {
  const discovery = await stepDiscovery.discoverSteps(projectRoot)
  return stepDiscovery.generateCoverageReport(discovery, options)
}

export default StepDiscovery