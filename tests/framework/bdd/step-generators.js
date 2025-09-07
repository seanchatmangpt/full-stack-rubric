/**
 * Main BDD Step Definition Generator Framework
 * Automatically generates step definitions for common Nuxt patterns
 * @module step-generators
 */

import { componentStepGenerator } from './component-steps.js'
import { navigationStepGenerator } from './navigation-steps.js'
import { apiStepGenerator } from './api-steps.js'
import { authStepGenerator } from './auth-steps.js'

/**
 * @typedef {Object} StepGeneratorConfig
 * @property {string} pattern - The step pattern to match
 * @property {string} type - The type of step (Given, When, Then)
 * @property {Function} generator - Function to generate step implementation
 * @property {string[]} tags - Tags for categorizing steps
 */

/**
 * Main step generator registry
 * @type {Map<string, StepGeneratorConfig>}
 */
export const stepRegistry = new Map()

/**
 * Register a new step generator
 * @param {string} key - Unique identifier for the generator
 * @param {StepGeneratorConfig} config - Generator configuration
 */
export function registerStepGenerator(key, config) {
  stepRegistry.set(key, {
    pattern: config.pattern,
    type: config.type || 'When',
    generator: config.generator,
    tags: config.tags || [],
    metadata: config.metadata || {}
  })
}

/**
 * Generate step definition code from a step description
 * @param {string} stepText - The step text to generate definition for
 * @param {Object} options - Generation options
 * @returns {string} Generated step definition code
 */
export function generateStepDefinition(stepText, options = {}) {
  const { framework = 'cucumber', testRunner = 'vitest' } = options
  
  // Find matching generator
  for (const [key, config] of stepRegistry.entries()) {
    const regex = new RegExp(config.pattern, 'i')
    const match = stepText.match(regex)
    
    if (match) {
      const stepCode = config.generator(match, options)
      return formatStepDefinition(stepCode, config.type, stepText, framework)
    }
  }
  
  // Generate generic step if no specific generator found
  return generateGenericStep(stepText, options)
}

/**
 * Format step definition with proper framework syntax
 * @param {string} implementation - Step implementation code
 * @param {string} type - Step type (Given, When, Then)
 * @param {string} stepText - Original step text
 * @param {string} framework - Testing framework
 * @returns {string} Formatted step definition
 */
function formatStepDefinition(implementation, type, stepText, framework) {
  const escapedText = stepText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  
  switch (framework) {
    case 'cucumber':
      return `${type}('${escapedText}', async function() {
  ${implementation.split('\n').map(line => '  ' + line).join('\n')}
})`
    
    case 'playwright':
      return `test.step('${stepText}', async () => {
  ${implementation.split('\n').map(line => '  ' + line).join('\n')}
})`
    
    default:
      return `// ${type}: ${stepText}
${implementation}`
  }
}

/**
 * Generate a generic step when no specific generator matches
 * @param {string} stepText - Step text
 * @param {Object} options - Options
 * @returns {string} Generic step implementation
 */
function generateGenericStep(stepText, options) {
  const implementation = `// TODO: Implement step for: ${stepText}
  throw new Error('Step not implemented: ${stepText}')`
  
  return formatStepDefinition(implementation, 'When', stepText, options.framework)
}

/**
 * Generate all step definitions for a feature file
 * @param {string} featureContent - Content of the .feature file
 * @param {Object} options - Generation options
 * @returns {Object} Generated step definitions grouped by type
 */
export function generateFeatureSteps(featureContent, options = {}) {
  const stepPattern = /^\s*(Given|When|Then|And|But)\s+(.+)$/gm
  const steps = []
  let match
  
  while ((match = stepPattern.exec(featureContent)) !== null) {
    const [, stepType, stepText] = match
    steps.push({
      type: stepType === 'And' || stepType === 'But' ? 'When' : stepType,
      text: stepText.trim(),
      original: match[0].trim()
    })
  }
  
  const generatedSteps = {
    given: [],
    when: [],
    then: [],
    imports: new Set(),
    helpers: new Set()
  }
  
  for (const step of steps) {
    const definition = generateStepDefinition(step.text, options)
    const typeKey = step.type.toLowerCase()
    
    if (generatedSteps[typeKey]) {
      generatedSteps[typeKey].push({
        text: step.text,
        definition,
        original: step.original
      })
    }
  }
  
  return generatedSteps
}

/**
 * Generate step definitions file from feature content
 * @param {string} featureContent - Feature file content
 * @param {string} filename - Output filename
 * @param {Object} options - Generation options
 * @returns {string} Complete step definitions file content
 */
export function generateStepDefinitionsFile(featureContent, filename, options = {}) {
  const steps = generateFeatureSteps(featureContent, options)
  const { framework = 'cucumber', testRunner = 'vitest' } = options
  
  let fileContent = generateFileHeader(filename, framework, testRunner)
  
  // Add imports
  if (steps.imports.size > 0) {
    fileContent += '\n// Additional imports\n'
    steps.imports.forEach(imp => {
      fileContent += `${imp}\n`
    })
  }
  
  // Add helper functions
  if (steps.helpers.size > 0) {
    fileContent += '\n// Helper functions\n'
    steps.helpers.forEach(helper => {
      fileContent += `${helper}\n\n`
    })
  }
  
  // Add step definitions
  const allSteps = [...steps.given, ...steps.when, ...steps.then]
  for (const step of allSteps) {
    fileContent += `\n${step.definition}\n`
  }
  
  return fileContent
}

/**
 * Generate file header with imports and setup
 * @param {string} filename - File name
 * @param {string} framework - Testing framework
 * @param {string} testRunner - Test runner
 * @returns {string} File header content
 */
function generateFileHeader(filename, framework, testRunner) {
  const header = `/**
 * Generated BDD Step Definitions for ${filename}
 * Auto-generated by step-generators.js
 * Framework: ${framework}, Runner: ${testRunner}
 */

`

  switch (framework) {
    case 'cucumber':
      return header + `import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
`

    case 'playwright':
      return header + `import { test, expect } from '@playwright/test'
`

    default:
      return header + `import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
`
  }
}

/**
 * Initialize all built-in step generators
 */
export function initializeStepGenerators() {
  // Register component step generators
  componentStepGenerator.registerSteps()
  
  // Register navigation step generators
  navigationStepGenerator.registerSteps()
  
  // Register API step generators
  apiStepGenerator.registerSteps()
  
  // Register auth step generators
  authStepGenerator.registerSteps()
  
  console.log(`Initialized ${stepRegistry.size} step generators`)
}

/**
 * Get available step patterns
 * @returns {Array} List of available step patterns with metadata
 */
export function getAvailableStepPatterns() {
  return Array.from(stepRegistry.entries()).map(([key, config]) => ({
    key,
    pattern: config.pattern,
    type: config.type,
    tags: config.tags,
    description: config.metadata.description || 'No description available'
  }))
}

/**
 * Search for step generators by tag or pattern
 * @param {string} query - Search query
 * @returns {Array} Matching step generators
 */
export function searchStepGenerators(query) {
  const results = []
  const lowerQuery = query.toLowerCase()
  
  for (const [key, config] of stepRegistry.entries()) {
    const matches = (
      key.toLowerCase().includes(lowerQuery) ||
      config.pattern.toLowerCase().includes(lowerQuery) ||
      config.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      (config.metadata.description && config.metadata.description.toLowerCase().includes(lowerQuery))
    )
    
    if (matches) {
      results.push({
        key,
        pattern: config.pattern,
        type: config.type,
        tags: config.tags,
        relevance: calculateRelevance(config, lowerQuery)
      })
    }
  }
  
  return results.sort((a, b) => b.relevance - a.relevance)
}

/**
 * Calculate relevance score for search results
 * @param {StepGeneratorConfig} config - Generator config
 * @param {string} query - Search query
 * @returns {number} Relevance score
 */
function calculateRelevance(config, query) {
  let score = 0
  
  if (config.pattern.toLowerCase().includes(query)) score += 10
  if (config.tags.some(tag => tag.toLowerCase().includes(query))) score += 5
  if (config.metadata.description && config.metadata.description.toLowerCase().includes(query)) score += 3
  
  return score
}

// Initialize generators when module is loaded
initializeStepGenerators()