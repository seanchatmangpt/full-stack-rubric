# Non-Fluent BDD Examples

## Traditional Step Definition Approach

This guide provides examples of non-fluent, traditional BDD testing patterns using explicit step definitions and the classic Given-When-Then structure.

## Basic Step Definition Structure

### Creating Step Definitions

```javascript
import { Given, When, Then, createTestContext } from '@/tests/framework'
import { expect } from 'vitest'

// Create test context for step definitions
const context = createTestContext()

// Given step definitions
Given('I am on the typing tutor page', async function() {
  await context.mountTypingPage()
  expect(context.wrapper().exists()).toBe(true)
})

Given('I can see practice text', function() {
  const codeDisplay = context.wrapper().find('pre code')
  expect(codeDisplay.exists()).toBe(true)
  expect(context.wrapper().vm.targetText).toBeTruthy()
})

Given('the practice text is {string}', async function(text) {
  await context.wrapper().vm.setCustomExercise('Test Exercise', text)
  expect(context.wrapper().vm.targetText).toBe(text)
})

// When step definitions
When('I start typing the displayed text', async function() {
  const targetText = context.wrapper().vm.targetText
  const textToType = targetText.substring(0, 10)
  
  await context.simulateTyping(textToType)
  expect(context.wrapper().vm.userInput.length).toBeGreaterThan(0)
})

When('I type {string} in exactly {int} seconds', async function(text, seconds) {
  const delayPerChar = (seconds * 1000) / text.length
  await context.simulateTyping(text, { delayBetweenKeys: delayPerChar })
})

When('I type {string} with {int} errors', async function(text, errorCount) {
  await context.simulateTyping(text, { errorsToMake: errorCount })
})

// Then step definitions
Then('the characters I type correctly should be highlighted in green', function() {
  const highlightedText = context.wrapper().vm.highlightedText
  expect(highlightedText).toContain('text-green-600')
})

Then('the WPM should be calculated as {int}', function(expectedWpm) {
  expect(context.wrapper().vm.wpm).toBe(expectedWpm)
})

Then('the accuracy should be approximately {int}%', function(expectedAccuracy) {
  const actualAccuracy = context.wrapper().vm.accuracy
  expect(actualAccuracy).toBeCloseTo(expectedAccuracy, 1)
})
```

### Executing Step-Based Tests

```javascript
import { describe, it, beforeEach, afterEach } from 'vitest'

describe('Typing Tutor BDD Tests', () => {
  beforeEach(async () => {
    // Setup before each scenario
  })
  
  afterEach(() => {
    context.cleanupComponent()
  })
  
  it('Scenario: Basic typing interaction', async () => {
    // Execute steps in sequence
    await context.executeStep('I am on the typing tutor page')
    await context.executeStep('I can see practice text')
    await context.executeStep('I start typing the displayed text')
    await context.executeStep('the characters I type correctly should be highlighted in green')
  })
  
  it('Scenario: WPM calculation', async () => {
    await context.executeStep('I am on the typing tutor page')
    await context.executeStep('the practice text is "const hello = world"')
    await context.executeStep('I type "const hello = world" in exactly 12 seconds')
    await context.executeStep('the WPM should be calculated as 15')
  })
  
  it('Scenario: Error handling', async () => {
    await context.executeStep('I am on the typing tutor page')
    await context.executeStep('the practice text is "function test()"')
    await context.executeStep('I type "function test()" with 2 errors')
    await context.executeStep('the accuracy should be approximately 85%')
  })
})
```

## Component Testing with Step Definitions

### Form Testing Example

```javascript
import { Given, When, Then } from '@/tests/framework'
import { mount } from '@vue/test-utils'
import ContactForm from '@/components/ContactForm.vue'

let wrapper

Given('I have a contact form', function() {
  wrapper = mount(ContactForm, {
    global: {
      stubs: {
        UButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
        UInput: { template: '<input v-model="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)">' }
      }
    }
  })
})

Given('the form is empty', function() {
  expect(wrapper.find('[data-testid="name"]').element.value).toBe('')
  expect(wrapper.find('[data-testid="email"]').element.value).toBe('')
  expect(wrapper.find('[data-testid="message"]').element.value).toBe('')
})

When('I fill in {string} with {string}', async function(fieldName, value) {
  const field = wrapper.find(`[data-testid="${fieldName}"]`)
  expect(field.exists()).toBe(true)
  
  await field.setValue(value)
  await field.trigger('input')
})

When('I submit the form', async function() {
  const submitButton = wrapper.find('[data-testid="submit"]')
  await submitButton.trigger('click')
})

Then('I should see {string} error message', function(errorMessage) {
  const errorElement = wrapper.find('[data-testid="error"]')
  expect(errorElement.exists()).toBe(true)
  expect(errorElement.text()).toContain(errorMessage)
})

Then('the form should be submitted successfully', function() {
  expect(wrapper.emitted('submit')).toHaveLength(1)
})

// Test execution
describe('Contact Form Validation', () => {
  it('should validate required fields', async () => {
    await context.executeStep('I have a contact form')
    await context.executeStep('the form is empty')
    await context.executeStep('I submit the form')
    await context.executeStep('I should see "Name is required" error message')
  })
  
  it('should submit valid form', async () => {
    await context.executeStep('I have a contact form')
    await context.executeStep('I fill in "name" with "John Doe"')
    await context.executeStep('I fill in "email" with "john@example.com"')
    await context.executeStep('I fill in "message" with "Hello world"')
    await context.executeStep('I submit the form')
    await context.executeStep('the form should be submitted successfully')
  })
})
```

### Navigation Testing Example

```javascript
import { Given, When, Then } from '@/tests/framework'

Given('I am on the {string} page', async function(pageName) {
  await this.visit(`/${pageName}`)
  expect(this.currentPath()).toBe(`/${pageName}`)
})

When('I click the {string} link', async function(linkText) {
  const link = this.wrapper().find(`a:contains("${linkText}")`)
  expect(link.exists()).toBe(true)
  await link.trigger('click')
})

When('I click the navigation menu', async function() {
  const menuButton = this.wrapper().find('[data-testid="menu-toggle"]')
  await menuButton.trigger('click')
})

Then('I should be on the {string} page', function(expectedPage) {
  expect(this.currentPath()).toBe(`/${expectedPage}`)
})

Then('I should see the navigation menu', function() {
  const menu = this.wrapper().find('[data-testid="navigation-menu"]')
  expect(menu.isVisible()).toBe(true)
})

Then('the {string} menu item should be highlighted', function(menuItem) {
  const activeItem = this.wrapper().find(`[data-testid="${menuItem}"].active`)
  expect(activeItem.exists()).toBe(true)
})

// Usage in tests
describe('Site Navigation', () => {
  it('should navigate between pages', async () => {
    await context.executeStep('I am on the "home" page')
    await context.executeStep('I click the "About" link')
    await context.executeStep('I should be on the "about" page')
    await context.executeStep('the "about" menu item should be highlighted')
  })
})
```

## API Testing with Step Definitions

### REST API Testing

```javascript
import { Given, When, Then } from '@/tests/framework'
import { createSmartMocks } from '@/tests/framework'

let apiMocks
let lastResponse

Given('the API is available', function() {
  apiMocks = createSmartMocks({
    baseUrl: 'http://localhost:3000'
  })
  
  // Setup default mocks
  apiMocks.mock('GET', '/api/health', {
    status: 200,
    data: { status: 'ok' }
  })
})

Given('the user database contains:', function(dataTable) {
  const users = dataTable.hashes()
  
  apiMocks.mock('GET', '/api/users', {
    status: 200,
    data: users
  })
})

When('I send a GET request to {string}', async function(endpoint) {
  lastResponse = await fetch(`http://localhost:3000${endpoint}`)
})

When('I send a POST request to {string} with:', async function(endpoint, dataTable) {
  const data = dataTable.hashes()[0]
  
  lastResponse = await fetch(`http://localhost:3000${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
})

Then('the response status should be {int}', async function(expectedStatus) {
  expect(lastResponse.status).toBe(expectedStatus)
})

Then('the response should contain:', async function(dataTable) {
  const responseData = await lastResponse.json()
  const expectedData = dataTable.hashes()[0]
  
  Object.entries(expectedData).forEach(([key, value]) => {
    expect(responseData).toHaveProperty(key, value)
  })
})

// Test execution
describe('User API', () => {
  it('should fetch users', async () => {
    await context.executeStep('the API is available')
    await context.executeStep('the user database contains:', [
      { id: '1', name: 'John', email: 'john@example.com' }
    ])
    await context.executeStep('I send a GET request to "/api/users"')
    await context.executeStep('the response status should be 200')
    await context.executeStep('the response should contain:', [
      { name: 'John', email: 'john@example.com' }
    ])
  })
})
```

## Advanced Step Definition Patterns

### Parameterized Steps with Tables

```javascript
Given('I have the following exercises:', function(dataTable) {
  const exercises = dataTable.hashes()
  
  exercises.forEach((exercise, index) => {
    this.addExercise({
      id: index + 1,
      title: exercise.title,
      difficulty: exercise.difficulty,
      code: exercise.code
    })
  })
})

When('I complete exercises with results:', async function(dataTable) {
  const results = dataTable.hashes()
  
  for (const result of results) {
    await this.completeExercise(result.exercise, {
      wpm: parseInt(result.wpm),
      accuracy: parseFloat(result.accuracy)
    })
  }
})

Then('my statistics should show:', function(dataTable) {
  const expectedStats = dataTable.hashes()[0]
  const actualStats = this.getUserStatistics()
  
  expect(actualStats.averageWpm).toBe(parseInt(expectedStats.averageWpm))
  expect(actualStats.averageAccuracy).toBe(parseFloat(expectedStats.averageAccuracy))
})

// Usage with data tables
/*
Given I have the following exercises:
  | title     | difficulty | code               |
  | Variables | easy       | const x = 1        |
  | Functions | medium     | function test() {} |
  
When I complete exercises with results:
  | exercise  | wpm | accuracy |
  | Variables | 45  | 95.5     |
  | Functions | 38  | 92.0     |
  
Then my statistics should show:
  | averageWpm | averageAccuracy |
  | 41         | 93.75           |
*/
```

### Background Steps

```javascript
import { Background } from '@/tests/framework'

Background('User setup', async function() {
  // This runs before each scenario in the feature
  await this.setupTestUser()
  await this.authenticateUser()
  await this.clearBrowserStorage()
})

Given('I am authenticated', function() {
  // Background already handled authentication
  expect(this.isAuthenticated()).toBe(true)
})
```

### Hooks and Lifecycle

```javascript
import { Before, After, BeforeAll, AfterAll } from '@/tests/framework'

BeforeAll(async function() {
  // Setup test database
  await this.setupTestDatabase()
})

Before(async function() {
  // Before each scenario
  await this.clearCache()
  this.startTimer()
})

After(async function() {
  // After each scenario
  this.recordExecutionTime()
  await this.cleanup()
})

AfterAll(async function() {
  // Cleanup test database
  await this.cleanupTestDatabase()
})
```

### Custom Transformations

```javascript
import { defineParameterType } from '@/tests/framework'

// Define custom parameter type for user roles
defineParameterType({
  name: 'userRole',
  regexp: /admin|user|guest/,
  transformer: (role) => ({
    name: role,
    permissions: getPermissionsForRole(role)
  })
})

Given('I am logged in as {userRole}', function(userRole) {
  this.loginAs(userRole)
  expect(this.currentUser.permissions).toEqual(userRole.permissions)
})

// Define custom parameter for exercise difficulty
defineParameterType({
  name: 'difficulty',
  regexp: /easy|medium|hard/,
  transformer: (level) => ({
    level,
    wpmTarget: { easy: 30, medium: 50, hard: 70 }[level],
    accuracyTarget: { easy: 85, medium: 90, hard: 95 }[level]
  })
})

Given('I select a {difficulty} exercise', function(difficulty) {
  this.selectExercise(difficulty.level)
  this.expectedWpm = difficulty.wpmTarget
})
```

## Step Library Organization

### Organizing Step Files

```javascript
// tests/steps/auth.steps.js
import { Given, When, Then } from '@/tests/framework'

Given('I am logged out', function() {
  this.logout()
})

When('I attempt to login with {string} and {string}', function(email, password) {
  return this.login(email, password)
})

// tests/steps/navigation.steps.js
Given('I am on the {string} page', function(page) {
  this.visit(page)
})

// tests/steps/typing.steps.js
When('I type {string}', function(text) {
  return this.simulateTyping(text)
})

// Main test file imports all step definitions
import './steps/auth.steps.js'
import './steps/navigation.steps.js'
import './steps/typing.steps.js'
```

### Step Definition Reusability

```javascript
// Base step definitions
export class BaseStepLibrary {
  async fillField(fieldName, value) {
    const field = this.wrapper().find(`[data-testid="${fieldName}"]`)
    await field.setValue(value)
  }
  
  async clickButton(buttonText) {
    const button = this.wrapper().find(`button:contains("${buttonText}")`)
    await button.trigger('click')
  }
  
  expectToSeeText(text) {
    expect(this.wrapper().text()).toContain(text)
  }
}

// Specialized step libraries extend base
export class FormStepLibrary extends BaseStepLibrary {
  async submitForm() {
    await this.clickButton('Submit')
  }
  
  expectValidationError(message) {
    const error = this.wrapper().find('.error')
    expect(error.text()).toContain(message)
  }
}
```

This traditional approach provides explicit control over test steps while maintaining the clarity and structure of BDD testing patterns.