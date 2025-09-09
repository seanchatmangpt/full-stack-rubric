/**
 * Minimal Step Pattern Generators
 * Focus on 80/20 rule - most common patterns that provide maximum value
 */

/**
 * Generate step definition code from step text
 * @param {string} stepText - Natural language step text
 * @param {string} stepType - Step type (Given|When|Then)
 * @returns {string} Generated step definition code
 */
export function generateStepDefinition(stepText, stepType = 'When') {
  // Common patterns that cover 80% of use cases
  const patterns = [
    // Authentication patterns
    {
      pattern: /^user is logged (in|out)$/,
      generate: match => `${stepType}('user is logged ${match[1]}', async (context, helpers) => {
  helpers.auth.${match[1] === 'in' ? 'login()' : 'logout()'}
})`
    },
    
    {
      pattern: /^user is logged in as "([^"]*)"$/,
      generate: match => `${stepType}('user is logged in as {string}', async (context, helpers, role) => {
  helpers.auth.login({ role })
})`
    },

    // Form patterns
    {
      pattern: /^I fill "([^"]*)" with "([^"]*)"$/,
      generate: () => `${stepType}('I fill {string} with {string}', async (context, helpers, field, value) => {
  helpers.form.fill(field, value)
})`
    },

    {
      pattern: /^I submit the form$/,
      generate: () => `${stepType}('I submit the form', async (context, helpers) => {
  helpers.form.submit()
})`
    },

    // API patterns
    {
      pattern: /^I call API "([^"]*)"$/,
      generate: () => `${stepType}('I call API {string}', async (context, helpers, endpoint) => {
  await helpers.api.request(endpoint)
})`
    },

    {
      pattern: /^response status should be (\d+)$/,
      generate: () => `${stepType}('response status should be {int}', async (context, helpers, status) => {
  helpers.api.assertStatus(status)
})`
    },

    // Timing patterns  
    {
      pattern: /^I wait (\d+) seconds?$/,
      generate: () => `${stepType}('I wait {int} seconds', async (context, helpers, seconds) => {
  await helpers.timing.wait(seconds * 1000)
})`
    },

    // Data patterns
    {
      pattern: /^I store "([^"]*)" as "([^"]*)"$/,
      generate: () => `${stepType}('I store {string} as {string}', async (context, helpers, value, key) => {
  helpers.data.store(key, value)
})`
    },

    // Navigation patterns
    {
      pattern: /^I (?:go to|visit|navigate to) "([^"]*)"$/,
      generate: () => `${stepType}('I navigate to {string}', async (context, helpers, path) => {
  context.set('currentPath', path)
})`
    },

    // Assertion patterns
    {
      pattern: /^I should see "([^"]*)"$/,
      generate: () => `${stepType}('I should see {string}', async (context, helpers, text) => {
  const pageContent = context.get('pageContent') || ''
  expect(pageContent).toContain(text)
})`
    }
  ]

  // Find matching pattern
  for (const { pattern, generate } of patterns) {
    const match = stepText.match(pattern)
    if (match) {
      return generate(match)
    }
  }

  // Generate generic step if no pattern matches
  return generateGenericStep(stepText, stepType)
}

/**
 * Generate generic step implementation
 * @param {string} stepText - Step text
 * @param {string} stepType - Step type
 * @returns {string} Generic step definition
 */
function generateGenericStep(stepText, stepType) {
  const escapedText = stepText.replace(/"/g, '\\"')
  
  return `${stepType}('${escapedText}', async (context, helpers) => {
  // TODO: Implement step logic for: ${escapedText}
  throw new Error('Step not implemented: ${escapedText}')
})`
}

/**
 * Generate step definitions file from feature content
 * @param {string} featureContent - Gherkin feature file content
 * @param {string} filename - Output filename
 * @returns {string} Complete step definitions file
 */
export function generateStepDefinitionsFile(featureContent, filename = 'steps.js') {
  const steps = extractStepsFromFeature(featureContent)
  const uniqueSteps = [...new Set(steps.map(s => s.text))]
  
  let fileContent = `/**
 * Generated Step Definitions for ${filename}
 * Auto-generated from feature file
 */

import { Given, When, Then, setupStepDefinitions } from './vitest-cucumber-bridge.js'
import { expect } from 'vitest'

// Setup step definitions
const { context, helpers } = setupStepDefinitions()

`

  // Generate step definitions for unique steps
  for (const stepText of uniqueSteps) {
    const stepType = inferStepType(stepText)
    const definition = generateStepDefinition(stepText, stepType)
    fileContent += `\n${definition}\n`
  }

  return fileContent
}

/**
 * Extract steps from feature file content
 * @param {string} content - Feature file content
 * @returns {Array} Steps with types and text
 */
function extractStepsFromFeature(content) {
  const steps = []
  const lines = content.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    const match = trimmed.match(/^(Given|When|Then|And|But)\s+(.+)$/)
    
    if (match) {
      const [, keyword, text] = match
      steps.push({
        type: keyword,
        text: text.trim()
      })
    }
  }
  
  return steps
}

/**
 * Infer step type from step text
 * @param {string} stepText - Step text
 * @returns {string} Inferred step type
 */
function inferStepType(stepText) {
  // Simple heuristics for step type inference
  if (stepText.match(/^(user|I|application|system) (is|are|has|have)/)) {
    return 'Given'
  }
  
  if (stepText.match(/^I (click|fill|submit|call|navigate|visit|wait)/)) {
    return 'When'
  }
  
  if (stepText.match(/(should|must|expect|assert|verify)/)) {
    return 'Then'
  }
  
  // Default to When for actions
  return 'When'
}

/**
 * Get most common step patterns
 * @returns {Array} Common patterns with usage frequency
 */
export function getCommonPatterns() {
  return [
    {
      pattern: 'user is logged {in|out}',
      frequency: 'high',
      category: 'authentication',
      description: 'User authentication state'
    },
    {
      pattern: 'I fill {string} with {string}',
      frequency: 'high', 
      category: 'forms',
      description: 'Form field input'
    },
    {
      pattern: 'I submit the form',
      frequency: 'high',
      category: 'forms',
      description: 'Form submission'
    },
    {
      pattern: 'I call API {string}',
      frequency: 'high',
      category: 'api',
      description: 'API request'
    },
    {
      pattern: 'response status should be {int}',
      frequency: 'high',
      category: 'api',
      description: 'API response validation'
    },
    {
      pattern: 'I wait {int} seconds',
      frequency: 'medium',
      category: 'timing',
      description: 'Timing control'
    },
    {
      pattern: 'I should see {string}',
      frequency: 'high',
      category: 'assertions',
      description: 'Content verification'
    }
  ]
}

/**
 * Generate step definitions for common patterns only
 * @param {Array} patterns - Patterns to generate (defaults to common ones)
 * @returns {string} Step definitions code
 */
export function generateCommonStepDefinitions(patterns = getCommonPatterns()) {
  let code = `/**
 * Common Step Definitions
 * Covers 80% of typical BDD scenarios
 */

import { Given, When, Then, setupStepDefinitions } from './vitest-cucumber-bridge.js'
import { expect } from 'vitest'

const { context, helpers } = setupStepDefinitions()

`

  for (const pattern of patterns) {
    if (pattern.frequency === 'high') {
      const stepType = pattern.category === 'assertions'
        ? 'Then' : 
        pattern.category === 'authentication' ? 'Given' : 'When'
      
      // Generate based on pattern
      code += generateStepForPattern(pattern, stepType) + '\n\n'
    }
  }

  return code
}

/**
 * Generate step definition for a pattern
 * @param {Object} pattern - Pattern object
 * @param {string} stepType - Step type
 * @returns {string} Step definition code
 */
function generateStepForPattern(pattern, stepType) {
  const implementations = {
    'user is logged {in|out}': `${stepType}(/^user is logged (in|out)$/, async (context, helpers, state) => {
  if (state === 'in') {
    helpers.auth.login()
  } else {
    helpers.auth.logout()
  }
})`,

    'I fill {string} with {string}': `${stepType}('I fill {string} with {string}', async (context, helpers, field, value) => {
  helpers.form.fill(field, value)
})`,

    'I submit the form': `${stepType}('I submit the form', async (context, helpers) => {
  helpers.form.submit()
})`,

    'I call API {string}': `${stepType}('I call API {string}', async (context, helpers, endpoint) => {
  await helpers.api.request(endpoint)
})`,

    'response status should be {int}': `${stepType}('response status should be {int}', async (context, helpers, status) => {
  helpers.api.assertStatus(status)
})`,

    'I wait {int} seconds': `${stepType}('I wait {int} seconds', async (context, helpers, seconds) => {
  await helpers.timing.wait(seconds * 1000)
})`,

    'I should see {string}': `${stepType}('I should see {string}', async (context, helpers, text) => {
  const pageContent = context.get('pageContent') || ''
  expect(pageContent).toContain(text)
})`
  }

  return implementations[pattern.pattern] || `// TODO: Implement ${pattern.pattern}`
}

/**
 * Quick API for common use cases
 */
export const QuickGenerate = {
  /**
   * Generate authentication steps
   */
  auth: () => generateCommonStepDefinitions(getCommonPatterns().filter(p => p.category === 'authentication')),
  
  /**
   * Generate form steps
   */
  forms: () => generateCommonStepDefinitions(getCommonPatterns().filter(p => p.category === 'forms')),
  
  /**
   * Generate API steps
   */
  api: () => generateCommonStepDefinitions(getCommonPatterns().filter(p => p.category === 'api')),
  
  /**
   * Generate all high-frequency steps
   */
  all: () => generateCommonStepDefinitions()
}
