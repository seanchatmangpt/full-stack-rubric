/**
 * Example Usage of BDD Step Generators
 * Demonstrates how to use the generator framework
 * @module example-usage
 */

import { 
  generateStepDefinition, 
  generateFeatureSteps, 
  generateStepDefinitionsFile,
  getAvailableStepPatterns,
  searchStepGenerators
} from './step-generators.js'

/**
 * Example: Generate individual step definitions
 */
function exampleIndividualSteps() {
  console.log('=== Individual Step Generation Examples ===\n')
  
  const steps = [
    'I click the "Submit" button',
    'I fill "john@example.com" into the "email" field',
    'I visit the "dashboard" page',
    'I make a GET request to "/api/users"',
    'the response status should be 200',
    'I log in with email "test@example.com" and password "password123"',
    'the "user" store property "name" should be "John Doe"'
  ]
  
  steps.forEach(step => {
    const definition = generateStepDefinition(step, { framework: 'cucumber', testRunner: 'vitest' })
    console.log(`Step: "${step}"`)
    console.log('Generated:')
    console.log(definition)
    console.log('\n---\n')
  })
}

/**
 * Example: Generate from a complete feature file
 */
function exampleFeatureFileGeneration() {
  console.log('=== Feature File Generation Example ===\n')
  
  const featureContent = `
Feature: User Authentication
  As a user
  I want to log in to the application
  So that I can access my dashboard

  Scenario: Successful login
    Given a user exists with email "test@example.com" and password "password123"
    When I visit the "login" page
    And I fill "test@example.com" into the "email" field
    And I fill "password123" into the "password" field
    And I click the "Login" button
    Then I should be logged in
    And I should be on the "dashboard" page

  Scenario: Failed login
    Given the user is logged out
    When I visit the "login" page
    And I fill "wrong@example.com" into the "email" field
    And I fill "wrongpass" into the "password" field
    And I click the "Login" button
    Then I should see a login error
    And I should be on the "login" page
`

  const stepDefinitionsFile = generateStepDefinitionsFile(
    featureContent, 
    'user-authentication.feature',
    { framework: 'cucumber', testRunner: 'vitest' }
  )
  
  console.log('Generated Step Definitions File:')
  console.log(stepDefinitionsFile)
}

/**
 * Example: Search available step patterns
 */
function exampleSearchSteps() {
  console.log('=== Available Step Patterns ===\n')
  
  // Get all available patterns
  const allPatterns = getAvailableStepPatterns()
  console.log(`Total available patterns: ${allPatterns.length}`)
  
  // Search for specific functionality
  const authPatterns = searchStepGenerators('login')
  console.log('\nAuthentication patterns:')
  authPatterns.forEach(pattern => {
    console.log(`- ${pattern.pattern} (${pattern.tags.join(', ')})`)
  })
  
  const apiPatterns = searchStepGenerators('api')
  console.log('\nAPI patterns:')
  apiPatterns.forEach(pattern => {
    console.log(`- ${pattern.pattern} (${pattern.tags.join(', ')})`)
  })
  
  const componentPatterns = searchStepGenerators('component')
  console.log('\nComponent patterns:')
  componentPatterns.forEach(pattern => {
    console.log(`- ${pattern.pattern} (${pattern.tags.join(', ')})`)
  })
}

/**
 * Example: E-commerce feature generation
 */
function exampleEcommerceFeature() {
  console.log('=== E-commerce Feature Example ===\n')
  
  const ecommerceFeature = `
Feature: Shopping Cart
  As a customer
  I want to manage items in my cart
  So that I can purchase products

  Background:
    Given a user exists with email "customer@example.com"
    And the user is logged in
    And the "cart" store exists
    And the "cart" store has initial state:
      {
        "items": [],
        "total": 0,
        "loading": false
      }

  Scenario: Add item to cart
    Given I visit the "products" page
    When I click the "Add to Cart" button
    Then the "cart" store array "items" should have 1 item
    And the "cart" store property "total" should be "29.99"
    And I should see the text "Item added to cart"

  Scenario: View cart contents
    Given the "cart" store has "items" set to "[{"id":1,"name":"Widget","price":19.99}]"
    When I visit the "cart" page
    Then I should see the text "Widget"
    And I should see the text "$19.99"

  Scenario: API integration
    When I make a POST request to "/api/cart" with body:
      {
        "productId": 1,
        "quantity": 2
      }
    Then the response status should be 201
    And the response JSON should have property "success"
    And the response JSON property "success" should be true
`

  const stepDefinitions = generateStepDefinitionsFile(
    ecommerceFeature,
    'shopping-cart.feature',
    { framework: 'cucumber', testRunner: 'vitest' }
  )
  
  console.log('Generated E-commerce Step Definitions:')
  console.log(stepDefinitions)
}

/**
 * Example: Integration with different test frameworks
 */
function exampleDifferentFrameworks() {
  console.log('=== Different Framework Examples ===\n')
  
  const stepText = 'I click the "Submit" button'
  
  // Cucumber + Vitest
  const cucumberVitest = generateStepDefinition(stepText, {
    framework: 'cucumber',
    testRunner: 'vitest'
  })
  
  // Playwright
  const playwright = generateStepDefinition(stepText, {
    framework: 'playwright',
    testRunner: 'playwright'
  })
  
  // Generic Vitest
  const vitest = generateStepDefinition(stepText, {
    framework: 'vitest',
    testRunner: 'vitest'
  })
  
  console.log('Cucumber + Vitest:')
  console.log(cucumberVitest)
  console.log('\n---\n')
  
  console.log('Playwright:')
  console.log(playwright)
  console.log('\n---\n')
  
  console.log('Generic Vitest:')
  console.log(vitest)
}

/**
 * Run all examples
 */
function runExamples() {
  try {
    exampleIndividualSteps()
    exampleFeatureFileGeneration()
    exampleSearchSteps()
    exampleEcommerceFeature()
    exampleDifferentFrameworks()
  } catch (error) {
    console.error('Error running examples:', error)
  }
}

// Export for use in tests or documentation
export {
  exampleIndividualSteps,
  exampleFeatureFileGeneration,
  exampleSearchSteps,
  exampleEcommerceFeature,
  exampleDifferentFrameworks,
  runExamples
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples()
}