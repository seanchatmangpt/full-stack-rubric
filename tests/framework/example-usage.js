/**
 * Example Usage of Core Testing Utilities
 * Demonstrates clean, minimal API for step definitions
 */

import { Given, When, Then, setupStepDefinitions } from './vitest-cucumber-bridge.js'

// Setup step definitions with helpers
const { context, helpers } = setupStepDefinitions({
  initialData: {
    testMode: true
  }
})

// Authentication steps using parameter patterns
Given('user is logged out', async (context, helpers) => {
  helpers.auth.logout()
})

Given('user is logged in as {string}', async (context, helpers, role) => {
  helpers.auth.login({ role })
})

// API interaction steps
When('I call API {string} with method {string}', async (context, helpers, endpoint, method) => {
  await helpers.api.request(endpoint, { method })
})

When('API {string} returns status {int} with data:', async (context, helpers, endpoint, status, dataTable) => {
  const data = dataTable.hashes()[0] // Get first row as object
  helpers.api.mockResponse(endpoint, { status, data })
})

// Form interaction steps  
When('I fill {string} with {string}', async (context, helpers, field, value) => {
  helpers.form.fill(field, value)
})

When('I submit the form', async (context, helpers) => {
  helpers.form.submit()
})

// Timing steps
When('I wait {int} seconds', async (context, helpers, seconds) => {
  await helpers.timing.wait(seconds * 1000)
})

Given('I start timer {string}', async (context, helpers, timerName) => {
  helpers.timing.startTimer(timerName)
})

// Assertion steps
Then('user should be logged in', async (context, helpers) => {
  helpers.auth.assertLoggedIn()
})

Then('response status should be {int}', async (context, helpers, expectedStatus) => {
  helpers.api.assertStatus(expectedStatus)
})

Then('response should contain {string} = {string}', async (context, helpers, key, value) => {
  helpers.api.assertResponseContains({ [key]: value })
})

Then('form should be submitted', async (context, helpers) => {
  helpers.form.assertSubmitted()
})

Then('timer {string} should be less than {int} ms', async (context, helpers, timerName, maxMs) => {
  const duration = helpers.timing.stopTimer(timerName)
  expect(duration).toBeLessThan(maxMs)
})

// Data manipulation steps
When('I store {string} as {string}', async (context, helpers, value, key) => {
  helpers.data.store(key, value)
})

Then('{string} should equal {string}', async (context, helpers, key, expectedValue) => {
  const actualValue = helpers.data.retrieve(key)
  expect(actualValue).toBe(expectedValue)
})

// Custom steps using context directly
Given('application is initialized', async (context, helpers) => {
  context.set('initialized', true)
  context.set('startTime', Date.now())
})

Then('application should be ready', async (context, helpers) => {
  expect(context.get('initialized')).toBe(true)
  expect(context.get('startTime')).toBeLessThan(Date.now())
})

// Example of complex step with multiple operations
When('I login as admin and navigate to dashboard', async (context, helpers) => {
  // Multiple operations in one step
  helpers.auth.login({ role: 'admin' })
  context.set('currentPage', '/dashboard')
  context.set('navigationTime', Date.now())
})

// Example step with test data generation
Given('I have a test user', async (context, helpers) => {
  const user = helpers.data.generateUser({
    role: 'test',
    name: 'Test User for Scenario'
  })
  helpers.data.store('currentUser', user)
})

/**
 * Example feature file content this would work with:
 * 
 * Feature: User Authentication
 * 
 *   Scenario: User login
 *     Given user is logged out
 *     When I fill "email" with "test@example.com"
 *     And I fill "password" with "password123"
 *     And I submit the form
 *     Then user should be logged in
 *     And form should be submitted
 * 
 *   Scenario: API integration
 *     Given API "/users" returns status 200 with data:
 *       | name | email |
 *       | John | john@example.com |
 *     When I call API "/users" with method "GET"
 *     Then response status should be 200
 *     And response should contain "name" = "John"
 * 
 *   Scenario: Performance testing
 *     Given I start timer "operation"
 *     When I wait 2 seconds
 *     Then timer "operation" should be less than 3000 ms
 */
