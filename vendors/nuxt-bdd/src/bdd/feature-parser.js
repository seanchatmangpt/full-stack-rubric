/**
 * @fileoverview Feature file validation and parsing utilities
 * @description Provides comprehensive Gherkin feature file parsing, validation, and analysis
 * with support for standard BDD patterns and step discovery.
 */

/**
 * @typedef {Object} FeatureFile
 * @property {string} title - Feature title
 * @property {string} description - Feature description
 * @property {Object} background - Background steps
 * @property {Array<Scenario>} scenarios - Feature scenarios
 * @property {Array<ScenarioOutline>} scenarioOutlines - Scenario outlines with examples
 * @property {Object} metadata - Feature metadata
 */

/**
 * @typedef {Object} Scenario
 * @property {string} title - Scenario title
 * @property {Array<Step>} steps - Scenario steps
 * @property {Array<string>} tags - Scenario tags
 * @property {number} lineNumber - Line number in file
 */

/**
 * @typedef {Object} ScenarioOutline
 * @property {string} title - Scenario outline title
 * @property {Array<Step>} steps - Template steps with parameters
 * @property {Array<Object>} examples - Example data tables
 * @property {Array<string>} tags - Scenario tags
 * @property {number} lineNumber - Line number in file
 */

/**
 * @typedef {Object} Step
 * @property {string} keyword - Step keyword (Given|When|Then|And|But)
 * @property {string} text - Step text
 * @property {Array<Array<string>>} dataTable - Data table if present
 * @property {string} docString - Doc string if present
 * @property {number} lineNumber - Line number in file
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the feature file is valid
 * @property {Array<string>} errors - Validation errors
 * @property {Array<string>} warnings - Validation warnings
 * @property {Object} statistics - Feature file statistics
 */

/**
 * Feature file parser and validator
 */
export class FeatureParser {
  /**
   * Initialize feature parser
   * @param {Object} options - Parser options
   * @param {boolean} options.strictValidation - Enable strict Gherkin validation
   * @param {Array<string>} options.allowedKeywords - Allowed step keywords
   * @param {boolean} options.requireBackground - Require Background section
   */
  constructor(options = {}) {
    this.options = {
      strictValidation: true,
      allowedKeywords: ['Given', 'When', 'Then', 'And', 'But'],
      requireBackground: false,
      ...options
    }
    
    this.gherkinKeywords = {
      feature: /^\s*Feature:\s*(.+)$/,
      background: /^\s*Background:\s*$/,
      scenario: /^\s*Scenario:\s*(.+)$/,
      scenarioOutline: /^\s*Scenario Outline:\s*(.+)$/,
      examples: /^\s*Examples:\s*$/,
      step: /^\s*(Given|When|Then|And|But)\s+(.+)$/,
      tag: /^\s*@[\w-]+(\s+@[\w-]+)*\s*$/,
      comment: /^\s*#.*$/,
      dataTableRow: /^\s*\|(.+)\|\s*$/,
      docStringDelimiter: /^\s*```(\w+)?\s*$/
    }
  }

  /**
   * Parse feature file content into structured data
   * @param {string} content - Feature file content
   * @param {string} filename - Optional filename for error reporting
   * @returns {FeatureFile} Parsed feature data
   */
  parseFeature(content, filename = 'unknown') {
    const lines = content.split('\n')
    const feature = {
      title: '',
      description: '',
      background: null,
      scenarios: [],
      scenarioOutlines: [],
      metadata: {
        filename,
        lineCount: lines.length
      }
    }

    let currentSection = null
    let currentScenario = null
    let currentStep = null
    let currentTags = []
    let inDocString = false
    let docStringLanguage = ''
    let docStringContent = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNumber = i + 1

      // Skip empty lines and comments outside of doc strings
      if (!inDocString && (line.trim() === '' || this.gherkinKeywords.comment.test(line))) {
        continue
      }

      // Handle doc strings
      const docStringMatch = line.match(this.gherkinKeywords.docStringDelimiter)
      if (docStringMatch) {
        if (!inDocString) {
          inDocString = true
          docStringLanguage = docStringMatch[1] || ''
          docStringContent = []
        } else {
          inDocString = false
          if (currentStep) {
            currentStep.docString = {
              language: docStringLanguage,
              content: docStringContent.join('\n')
            }
          }
        }
        continue
      }

      if (inDocString) {
        docStringContent.push(line)
        continue
      }

      // Handle tags
      if (this.gherkinKeywords.tag.test(line)) {
        currentTags = line.trim().split(/\s+/)
        continue
      }

      // Handle feature title
      const featureMatch = line.match(this.gherkinKeywords.feature)
      if (featureMatch) {
        feature.title = featureMatch[1].trim()
        currentSection = 'feature'
        continue
      }

      // Handle feature description (lines after Feature: before any scenario)
      if (currentSection === 'feature' && !this.isKeywordLine(line)) {
        feature.description += (feature.description ? '\n' : '') + line.trim()
        continue
      }

      // Handle background
      if (this.gherkinKeywords.background.test(line)) {
        feature.background = {
          steps: [],
          tags: currentTags.slice(),
          lineNumber
        }
        currentSection = 'background'
        currentTags = []
        continue
      }

      // Handle scenario
      const scenarioMatch = line.match(this.gherkinKeywords.scenario)
      if (scenarioMatch) {
        currentScenario = {
          title: scenarioMatch[1].trim(),
          steps: [],
          tags: currentTags.slice(),
          lineNumber
        }
        feature.scenarios.push(currentScenario)
        currentSection = 'scenario'
        currentTags = []
        continue
      }

      // Handle scenario outline
      const outlineMatch = line.match(this.gherkinKeywords.scenarioOutline)
      if (outlineMatch) {
        currentScenario = {
          title: outlineMatch[1].trim(),
          steps: [],
          examples: [],
          tags: currentTags.slice(),
          lineNumber
        }
        feature.scenarioOutlines.push(currentScenario)
        currentSection = 'scenarioOutline'
        currentTags = []
        continue
      }

      // Handle examples
      if (this.gherkinKeywords.examples.test(line)) {
        currentSection = 'examples'
        continue
      }

      // Handle steps
      const stepMatch = line.match(this.gherkinKeywords.step)
      if (stepMatch) {
        currentStep = {
          keyword: stepMatch[1],
          text: stepMatch[2].trim(),
          dataTable: [],
          docString: null,
          lineNumber
        }

        if (currentSection === 'background') {
          feature.background.steps.push(currentStep)
        } else if (currentScenario) {
          currentScenario.steps.push(currentStep)
        }
        continue
      }

      // Handle data table rows
      const dataTableMatch = line.match(this.gherkinKeywords.dataTableRow)
      if (dataTableMatch && currentStep) {
        const cells = dataTableMatch[1].split('|').map(cell => cell.trim())
        currentStep.dataTable.push(cells)
        continue
      }

      // Handle examples table
      if (currentSection === 'examples' && line.includes('|')) {
        const cells = line.split('|')
          .map(cell => cell.trim())
          .filter(cell => cell !== '')
        
        if (currentScenario && cells.length > 0) {
          if (!currentScenario.examples.length) {
            // First row is headers
            currentScenario.examples.push({
              headers: cells,
              data: []
            })
          } else {
            // Data rows
            currentScenario.examples[0].data.push(cells)
          }
        }
      }
    }

    return feature
  }

  /**
   * Validate feature file structure and content
   * @param {FeatureFile} feature - Parsed feature data
   * @returns {ValidationResult} Validation results
   */
  validateFeature(feature) {
    const errors = []
    const warnings = []
    
    // Check feature title
    if (!feature.title) {
      errors.push('Feature must have a title')
    }

    // Check for scenarios
    if (feature.scenarios.length === 0 && feature.scenarioOutlines.length === 0) {
      errors.push('Feature must have at least one scenario')
    }

    // Validate background if required
    if (this.options.requireBackground && !feature.background) {
      warnings.push('Background section is recommended')
    }

    // Validate scenarios
    for (const scenario of feature.scenarios) {
      this.validateScenario(scenario, errors, warnings)
    }

    // Validate scenario outlines
    for (const outline of feature.scenarioOutlines) {
      this.validateScenarioOutline(outline, errors, warnings)
    }

    // Calculate statistics
    const statistics = this.calculateStatistics(feature)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      statistics
    }
  }

  /**
   * Validate individual scenario
   * @param {Scenario} scenario - Scenario to validate
   * @param {Array<string>} errors - Error accumulator
   * @param {Array<string>} warnings - Warning accumulator
   * @private
   */
  validateScenario(scenario, errors, warnings) {
    if (!scenario.title) {
      errors.push(`Scenario at line ${scenario.lineNumber} must have a title`)
    }

    if (scenario.steps.length === 0) {
      errors.push(`Scenario "${scenario.title}" must have at least one step`)
    }

    this.validateStepSequence(scenario.steps, errors, warnings, scenario.title)
  }

  /**
   * Validate scenario outline with examples
   * @param {ScenarioOutline} outline - Scenario outline to validate
   * @param {Array<string>} errors - Error accumulator
   * @param {Array<string>} warnings - Warning accumulator
   * @private
   */
  validateScenarioOutline(outline, errors, warnings) {
    if (!outline.title) {
      errors.push(`Scenario Outline at line ${outline.lineNumber} must have a title`)
    }

    if (outline.steps.length === 0) {
      errors.push(`Scenario Outline "${outline.title}" must have at least one step`)
    }

    if (outline.examples.length === 0) {
      errors.push(`Scenario Outline "${outline.title}" must have examples`)
    }

    // Validate that steps contain parameters that match examples
    if (outline.examples.length > 0) {
      const headers = outline.examples[0].headers
      const stepsText = outline.steps.map(s => s.text).join(' ')
      
      for (const header of headers) {
        if (!stepsText.includes(`<${header}>`)) {
          warnings.push(`Example parameter "${header}" is not used in scenario outline "${outline.title}"`)
        }
      }
    }

    this.validateStepSequence(outline.steps, errors, warnings, outline.title)
  }

  /**
   * Validate step sequence follows BDD pattern
   * @param {Array<Step>} steps - Steps to validate
   * @param {Array<string>} errors - Error accumulator
   * @param {Array<string>} warnings - Warning accumulator
   * @param {string} scenarioTitle - Scenario title for error reporting
   * @private
   */
  validateStepSequence(steps, errors, warnings, scenarioTitle) {
    let hasGiven = false
    let hasWhen = false
    let hasThen = false
    
    for (const step of steps) {
      // Check for valid keywords
      if (!this.options.allowedKeywords.includes(step.keyword)) {
        errors.push(`Invalid step keyword "${step.keyword}" at line ${step.lineNumber}`)
      }

      // Track BDD pattern
      if (step.keyword === 'Given') hasGiven = true
      if (step.keyword === 'When') hasWhen = true
      if (step.keyword === 'Then') hasThen = true

      // Check step text
      if (!step.text) {
        errors.push(`Step at line ${step.lineNumber} must have text`)
      }
    }

    // Validate BDD pattern
    if (this.options.strictValidation) {
      if (!hasGiven) {
        warnings.push(`Scenario "${scenarioTitle}" should have Given steps (preconditions)`)
      }
      if (!hasWhen) {
        warnings.push(`Scenario "${scenarioTitle}" should have When steps (actions)`)
      }
      if (!hasThen) {
        warnings.push(`Scenario "${scenarioTitle}" should have Then steps (assertions)`)
      }
    }
  }

  /**
   * Calculate feature file statistics
   * @param {FeatureFile} feature - Feature data
   * @returns {Object} Statistics
   * @private
   */
  calculateStatistics(feature) {
    const scenarios = feature.scenarios.length
    const scenarioOutlines = feature.scenarioOutlines.length
    const totalSteps = feature.scenarios.reduce((sum, s) => sum + s.steps.length, 0) +
                     feature.scenarioOutlines.reduce((sum, s) => sum + s.steps.length, 0)
    
    const backgroundSteps = feature.background ? feature.background.steps.length : 0
    
    const stepKeywords = {}
    const allSteps = [
      ...(feature.background ? feature.background.steps : []),
      ...feature.scenarios.flatMap(s => s.steps),
      ...feature.scenarioOutlines.flatMap(s => s.steps)
    ]
    
    for (const step of allSteps) {
      stepKeywords[step.keyword] = (stepKeywords[step.keyword] || 0) + 1
    }

    const examples = feature.scenarioOutlines.reduce((sum, outline) => {
      return sum + outline.examples.reduce((exSum, ex) => exSum + ex.data.length, 0)
    }, 0)

    return {
      scenarios,
      scenarioOutlines,
      totalSteps,
      backgroundSteps,
      stepKeywords,
      examples,
      hasBackground: !!feature.background,
      avgStepsPerScenario: scenarios > 0 ? totalSteps / scenarios : 0
    }
  }

  /**
   * Check if line contains a Gherkin keyword
   * @param {string} line - Line to check
   * @returns {boolean} Whether line contains keyword
   * @private
   */
  isKeywordLine(line) {
    return Object.values(this.gherkinKeywords).some(regex => regex.test(line))
  }

  /**
   * Extract all unique step patterns from feature
   * @param {FeatureFile} feature - Parsed feature
   * @returns {Array<Object>} Unique step patterns
   */
  extractStepPatterns(feature) {
    const patterns = new Set()
    const allSteps = [
      ...(feature.background ? feature.background.steps : []),
      ...feature.scenarios.flatMap(s => s.steps),
      ...feature.scenarioOutlines.flatMap(s => s.steps)
    ]

    for (const step of allSteps) {
      const parameterized = this.parameterizeStepText(step.text)
      patterns.add(`${step.keyword} ${parameterized}`)
    }

    return Array.from(patterns).map(pattern => {
      const [keyword, ...textParts] = pattern.split(' ')
      return {
        keyword,
        pattern: textParts.join(' '),
        fullPattern: pattern
      }
    })
  }

  /**
   * Convert step text to parameterized version for step definitions
   * @param {string} text - Original step text
   * @returns {string} Parameterized text
   * @private
   */
  parameterizeStepText(text) {
    return text
      .replace(/\d+\.\d+/g, '{float}')  // Floats before integers
      .replace(/\d+/g, '{int}')
      .replace(/"([^"]+)"/g, '{string}')
      .replace(/'([^']+)'/g, '{string}')
  }

  /**
   * Generate step definition code from feature
   * @param {FeatureFile} feature - Parsed feature
   * @param {Object} options - Generation options
   * @returns {string} Generated step definitions
   */
  generateStepDefinitions(feature, options = {}) {
    const patterns = this.extractStepPatterns(feature)
    const templates = []

    for (const pattern of patterns) {
      const template = this.generateStepTemplate(pattern, options)
      templates.push(template)
    }

    return templates.join('\n\n')
  }

  /**
   * Generate individual step definition template
   * @param {Object} pattern - Step pattern
   * @param {Object} options - Generation options
   * @returns {string} Step template
   * @private
   */
  generateStepTemplate(pattern, options = {}) {
    const { keyword, pattern: stepPattern } = pattern
    const functionName = this.generateFunctionName(stepPattern)
    const parameters = this.extractStepParameters(stepPattern)
    
    const paramList = parameters.length > 0 ? parameters.join(', ') : ''
    const asyncKeyword = options.async !== false ? 'async ' : ''

    return `/**
 * @description ${keyword} ${stepPattern}
 * @${keyword.toLowerCase()} ${stepPattern}
 */
${keyword}('${stepPattern}', ${asyncKeyword}${functionName})

${asyncKeyword}function ${functionName}(${paramList}) {
  // TODO: Implement step definition
  throw new Error('Step definition not implemented: ${keyword} ${stepPattern}')
}`
  }

  /**
   * Extract parameter names from step pattern
   * @param {string} pattern - Step pattern
   * @returns {Array<string>} Parameter names
   * @private
   */
  extractStepParameters(pattern) {
    const params = []
    const parameterMatches = pattern.matchAll(/\{(int|float|string)\}/g)
    
    let intCount = 0
    let floatCount = 0
    let stringCount = 0
    
    for (const match of parameterMatches) {
      switch (match[1]) {
        case 'int':
          params.push(`int${intCount > 0 ? intCount + 1 : ''}`)
          intCount++
          break
        case 'float':
          params.push(`float${floatCount > 0 ? floatCount + 1 : ''}`)
          floatCount++
          break
        case 'string':
          params.push(`string${stringCount > 0 ? stringCount + 1 : ''}`)
          stringCount++
          break
      }
    }
    
    return params
  }

  /**
   * Generate function name from step pattern
   * @param {string} pattern - Step pattern
   * @returns {string} Function name
   * @private
   */
  generateFunctionName(pattern) {
    return pattern
      .toLowerCase()
      .replace(/[{}]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 50)
  }
}

/**
 * Default feature parser instance
 */
export const featureParser = new FeatureParser()

/**
 * Convenience function to parse feature file
 * @param {string} content - Feature file content
 * @param {string} filename - Optional filename
 * @returns {FeatureFile} Parsed feature
 */
export function parseFeature(content, filename) {
  return featureParser.parseFeature(content, filename)
}

/**
 * Convenience function to validate feature
 * @param {FeatureFile|string} feature - Feature object or content string
 * @returns {ValidationResult} Validation results
 */
export function validateFeature(feature) {
  if (typeof feature === 'string') {
    feature = featureParser.parseFeature(feature)
  }
  return featureParser.validateFeature(feature)
}

/**
 * Convenience function to extract step patterns
 * @param {FeatureFile|string} feature - Feature object or content string
 * @returns {Array<Object>} Step patterns
 */
export function extractStepPatterns(feature) {
  if (typeof feature === 'string') {
    feature = featureParser.parseFeature(feature)
  }
  return featureParser.extractStepPatterns(feature)
}

/**
 * Convenience function to generate step definitions
 * @param {FeatureFile|string} feature - Feature object or content string
 * @param {Object} options - Generation options
 * @returns {string} Generated step definitions
 */
export function generateStepDefinitions(feature, options) {
  if (typeof feature === 'string') {
    feature = featureParser.parseFeature(feature)
  }
  return featureParser.generateStepDefinitions(feature, options)
}

export default FeatureParser