# TDD & BDD Approaches

## Test-Driven Development (TDD)

**TDD Cycle**: Red → Green → Refactor

```
1. RED: Write a failing test
2. GREEN: Write minimal code to pass
3. REFACTOR: Improve code while keeping tests green
```

### Classic TDD Example

```javascript
// 1. RED - Write failing test
describe('TypingSpeedCalculator', () => {
  it('should calculate words per minute correctly', () => {
    const calculator = new TypingSpeedCalculator()
    
    const result = calculator.calculateWPM({
      charactersTyped: 250,
      timeElapsed: 60000, // 1 minute in ms
      errors: 0
    })
    
    expect(result).toBe(50) // 250 chars / 5 = 50 WPM
  })
})

// 2. GREEN - Minimal implementation
class TypingSpeedCalculator {
  calculateWPM({ charactersTyped, timeElapsed, errors }) {
    return Math.floor(charactersTyped / 5)
  }
}

// 3. REFACTOR - Improve implementation
class TypingSpeedCalculator {
  calculateWPM({ charactersTyped, timeElapsed, errors }) {
    if (timeElapsed <= 0) return 0
    
    const minutes = timeElapsed / 60000
    const grossWPM = Math.floor((charactersTyped / 5) / minutes)
    const netWPM = Math.max(0, grossWPM - errors)
    
    return netWPM
  }
}
```

### TDD for Vue Composables

```javascript
// tests/unit/composables/useTypingSession.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTypingSession } from '../../../app/composables/useTypingSession.js'

describe('useTypingSession', () => {
  let session

  beforeEach(() => {
    vi.useFakeTimers()
    session = useTypingSession()
  })

  // RED: Test what doesn't exist yet
  it('should start timing when session begins', () => {
    session.start('console.log("test");', 'javascript')
    
    expect(session.isActive.value).toBe(true)
    expect(session.startTime.value).toBeDefined()
  })

  it('should calculate real-time WPM during typing', () => {
    session.start('console.log("test");', 'javascript')
    
    // Simulate 30 seconds of typing
    vi.advanceTimersByTime(30000)
    session.updateProgress('console.log("te', 0) // 14 chars, no errors
    
    expect(session.currentWPM.value).toBe(28) // (14/5) / 0.5 minutes = 28 WPM
  })

  it('should handle typing errors in WPM calculation', () => {
    session.start('console.log("test");', 'javascript')
    
    vi.advanceTimersByTime(60000) // 1 minute
    session.updateProgress('console.log("tset";', 2) // 17 chars, 2 errors
    
    expect(session.currentWPM.value).toBe(1) // (17/5) - 2 = 1 WPM
  })
})

// GREEN: Minimal implementation
// app/composables/useTypingSession.js
import { ref, computed } from 'vue'

export function useTypingSession() {
  const isActive = ref(false)
  const startTime = ref(null)
  const targetText = ref('')
  const currentText = ref('')
  const errorCount = ref(0)

  const currentWPM = computed(() => {
    if (!startTime.value || currentText.value.length === 0) return 0
    
    const timeElapsed = Date.now() - startTime.value
    const minutes = timeElapsed / 60000
    const grossWPM = Math.floor((currentText.value.length / 5) / minutes)
    
    return Math.max(0, grossWPM - errorCount.value)
  })

  function start(text, language) {
    targetText.value = text
    startTime.value = Date.now()
    isActive.value = true
    currentText.value = ''
    errorCount.value = 0
  }

  function updateProgress(text, errors) {
    currentText.value = text
    errorCount.value = errors
  }

  return {
    isActive,
    startTime,
    currentWPM,
    start,
    updateProgress
  }
}
```

### TDD for API Endpoints

```javascript
// tests/integration/api/sessions.test.js
describe('POST /api/sessions', () => {
  // RED: Test the API that doesn't exist
  it('should create new typing session', async () => {
    const response = await $fetch('/api/sessions', {
      method: 'POST',
      body: {
        userId: 'test-123',
        codeSnippet: 'console.log("test");',
        language: 'javascript'
      }
    })

    expect(response).toMatchObject({
      id: expect.any(String),
      status: 'active',
      startTime: expect.any(String)
    })
  })

  it('should validate required fields', async () => {
    await expect($fetch('/api/sessions', {
      method: 'POST',
      body: { userId: 'test-123' }
    })).rejects.toMatchObject({
      status: 400
    })
  })
})

// GREEN: Minimal API implementation
// server/api/sessions.post.js
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validation
  if (!body.userId || !body.codeSnippet || !body.language) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields'
    })
  }

  const session = {
    id: generateId(),
    userId: body.userId,
    codeSnippet: body.codeSnippet,
    language: body.language,
    status: 'active',
    startTime: new Date().toISOString()
  }

  // Save to database (implement as needed)
  await saveSession(session)

  return session
})
```

## Behavior-Driven Development (BDD)

**BDD** focuses on behavior specification using natural language that stakeholders can understand.

### Gherkin Feature Files

```gherkin
# tests/features/typing-session.feature
Feature: Typing Session Management
  As a user learning to code
  I want to practice typing code snippets
  So that I can improve my programming speed and accuracy

  Background:
    Given I am on the typing practice page
    And the Monaco editor is loaded

  Scenario: Starting a new typing session
    When I click "Start New Session"
    And I select "JavaScript" as the language
    Then I should see a code snippet to type
    And the timer should start
    And the WPM counter should show "0"

  Scenario: Typing code correctly
    Given I have started a typing session
    When I type "console.log" correctly
    Then I should see the text highlighted as correct
    And the WPM should update in real-time
    And the accuracy should show "100%"

  Scenario: Making typing errors
    Given I have started a typing session
    When I type "consle.log" with an error
    Then I should see the error highlighted in red
    And the error count should increase
    And the accuracy should decrease

  Scenario: Completing a typing session
    Given I have started a typing session
    When I complete typing the entire code snippet
    Then I should see my final results
    And the session should be saved to my history
    And I should see options to start a new session

  Scenario Outline: Different difficulty levels
    Given I select difficulty level "<difficulty>"
    When I start a new session
    Then I should see a code snippet with "<characteristics>"

    Examples:
      | difficulty | characteristics           |
      | Easy       | simple syntax, 1-2 lines |
      | Medium     | functions, 5-10 lines     |
      | Hard       | complex logic, 15+ lines  |
```

### BDD Step Definitions

```javascript
// tests/steps/typing-session.steps.js
import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

Given('I am on the typing practice page', async function () {
  await this.page.goto('/')
})

Given('the Monaco editor is loaded', async function () {
  await this.page.waitForSelector('.monaco-editor', { timeout: 5000 })
})

When('I click {string}', async function (buttonText) {
  await this.page.click(`text=${buttonText}`)
})

When('I select {string} as the language', async function (language) {
  await this.page.selectOption('[data-testid="language-select"]', language.toLowerCase())
})

Then('I should see a code snippet to type', async function () {
  const codeSnippet = await this.page.locator('[data-testid="code-snippet"]')
  await expect(codeSnippet).toBeVisible()
  await expect(codeSnippet).not.toBeEmpty()
})

Then('the timer should start', async function () {
  // Wait for timer to show a value > 0
  await this.page.waitForFunction(() => {
    const timer = document.querySelector('[data-testid="timer"]')
    return timer && parseInt(timer.textContent) > 0
  })
})

When('I type {string} correctly', async function (text) {
  const editor = this.page.locator('.monaco-editor .view-line')
  await editor.first().click()
  await this.page.keyboard.type(text, { delay: 50 })
})

Then('I should see the text highlighted as correct', async function () {
  const correctText = await this.page.locator('.typing-correct')
  await expect(correctText).toBeVisible()
})

Then('the WPM should update in real-time', async function () {
  const wpmDisplay = this.page.locator('[data-testid="wpm-display"]')
  await expect(wpmDisplay).toMatch(/\d+/)
})

When('I type {string} with an error', async function (incorrectText) {
  const editor = this.page.locator('.monaco-editor .view-line')
  await editor.first().click()
  await this.page.keyboard.type(incorrectText, { delay: 50 })
})

Then('I should see the error highlighted in red', async function () {
  const errorHighlight = this.page.locator('.typing-error')
  await expect(errorHighlight).toBeVisible()
})

Then('the error count should increase', async function () {
  const errorCount = await this.page.locator('[data-testid="error-count"]').textContent()
  expect(parseInt(errorCount)).toBeGreaterThan(0)
})
```

### BDD Test Runner Configuration

```javascript
// tests/cucumber.config.js
export default {
  default: {
    requireModule: ['./tests/setup/cucumber-setup.js'],
    require: ['./tests/steps/**/*.js'],
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json'
    ],
    paths: ['tests/features/**/*.feature'],
    parallel: 2,
    retry: 1
  }
}

// tests/setup/cucumber-setup.js
import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber'
import { chromium } from '@playwright/test'

let browser

BeforeAll(async function () {
  browser = await chromium.launch()
})

Before(async function () {
  this.context = await browser.newContext()
  this.page = await this.context.newPage()
})

After(async function () {
  if (this.context) {
    await this.context.close()
  }
})

AfterAll(async function () {
  if (browser) {
    await browser.close()
  }
})
```

## BDD for Domain Logic

```javascript
// tests/features/typing-metrics.feature
Feature: Typing Metrics Calculation
  As a typing application
  I need to calculate accurate typing metrics
  So that users get meaningful feedback

  Rule: WPM calculation should account for time and errors

    Example: Perfect typing
      Given a user types 250 characters in 60 seconds
      And makes 0 errors
      When calculating WPM
      Then the result should be 50 WPM

    Example: Typing with errors
      Given a user types 300 characters in 60 seconds
      And makes 5 errors
      When calculating WPM
      Then the gross WPM should be 60
      And the net WPM should be 55

  Rule: Accuracy calculation should be percentage based

    Example: High accuracy
      Given a user types 100 characters
      And makes 2 errors
      When calculating accuracy
      Then the accuracy should be 98%

    Example: No typing
      Given a user types 0 characters
      When calculating accuracy
      Then the accuracy should be 100%
```

```javascript
// tests/steps/typing-metrics.steps.js
import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from 'vitest'
import { TypingMetrics } from '../../app/utils/typingMetrics.js'

Given('a user types {int} characters in {int} seconds', function (chars, seconds) {
  this.charactersTyped = chars
  this.timeElapsed = seconds * 1000 // Convert to milliseconds
})

Given('makes {int} errors', function (errors) {
  this.errors = errors
})

When('calculating WPM', function () {
  const metrics = new TypingMetrics()
  this.result = metrics.calculateWPM({
    charactersTyped: this.charactersTyped,
    timeElapsed: this.timeElapsed,
    errors: this.errors
  })
})

Then('the result should be {int} WPM', function (expectedWPM) {
  expect(this.result.net).toBe(expectedWPM)
})

Then('the gross WPM should be {int}', function (expectedGross) {
  expect(this.result.gross).toBe(expectedGross)
})

Then('the net WPM should be {int}', function (expectedNet) {
  expect(this.result.net).toBe(expectedNet)
})

When('calculating accuracy', function () {
  const metrics = new TypingMetrics()
  this.accuracy = metrics.calculateAccuracy({
    charactersTyped: this.charactersTyped,
    errors: this.errors
  })
})

Then('the accuracy should be {int}%', function (expectedAccuracy) {
  expect(this.accuracy).toBe(expectedAccuracy)
})
```

## Advanced BDD Patterns

### Scenario Outlines for Data-Driven Tests

```gherkin
Feature: Code Difficulty Assessment
  Scenario Outline: Different programming languages
    Given I select "<language>" as the programming language
    When I request a "<difficulty>" level code snippet
    Then I should receive code with "<expected_characteristics>"
    And the estimated completion time should be "<time_estimate>"

    Examples:
      | language   | difficulty | expected_characteristics | time_estimate |
      | JavaScript | Easy       | basic syntax            | 1-2 minutes   |
      | JavaScript | Medium     | functions, loops        | 3-5 minutes   |
      | JavaScript | Hard       | async, complex logic    | 5+ minutes    |
      | Python     | Easy       | print statements        | 1-2 minutes   |
      | Python     | Medium     | functions, classes      | 3-5 minutes   |
      | TypeScript | Hard       | generics, interfaces    | 5+ minutes    |
```

### Background and Hooks

```gherkin
Feature: User Session Management
  Background:
    Given the application is running
    And the database is clean
    And I have a test user account

  Scenario: User starts first typing session
    When I log in as a new user
    Then I should see the onboarding tutorial
    And I should have default preferences

  Scenario: Returning user continues session
    Given I have a previous incomplete session
    When I log in
    Then I should see an option to resume
    And my progress should be preserved
```

## Testing Strategy Comparison

| Aspect | TDD | BDD |
|--------|-----|-----|
| **Focus** | Technical implementation | Business behavior |
| **Language** | Developer-focused | Stakeholder-friendly |
| **Granularity** | Unit/component level | Feature/workflow level |
| **Documentation** | Code serves as docs | Features serve as specs |
| **Collaboration** | Developer-driven | Team collaboration |

## Integration: TDD + BDD

```javascript
// 1. BDD defines the behavior
// tests/features/user-progress.feature
Scenario: User improves typing speed over time
  Given I am a user with typing history
  When I complete 5 typing sessions
  Then my average WPM should improve
  And I should unlock speed achievements

// 2. TDD implements the functionality
describe('UserProgress', () => {
  it('should calculate WPM improvement trend', () => {
    const progress = new UserProgress()
    const sessions = [
      { wpm: 30, date: '2024-01-01' },
      { wpm: 35, date: '2024-01-02' },
      { wpm: 40, date: '2024-01-03' }
    ]
    
    const trend = progress.calculateTrend(sessions)
    expect(trend.improvement).toBe(10) // 10 WPM improvement
    expect(trend.direction).toBe('improving')
  })
})

// 3. BDD steps use TDD-tested components
When('I complete {int} typing sessions', async function (sessionCount) {
  for (let i = 0; i < sessionCount; i++) {
    await this.completeTypingSession()
  }
  
  // Uses TDD-tested UserProgress class
  this.progress = new UserProgress(this.userId)
  this.averageWPM = await this.progress.getAverageWPM()
})
```

## Best Practices

### TDD Best Practices
1. **Write the simplest test that fails**
2. **Write minimal code to pass**
3. **Refactor without breaking tests**
4. **Test behavior, not implementation**
5. **Keep tests fast and isolated**

### BDD Best Practices
1. **Use ubiquitous language** (domain terms everyone understands)
2. **Focus on user outcomes** rather than system actions
3. **Keep scenarios independent**
4. **Use Given-When-Then structure consistently**
5. **Collaborate with stakeholders** on feature files

### Combined Approach
1. **Start with BDD** to define acceptance criteria
2. **Use TDD** to implement components
3. **Validate with BDD** end-to-end scenarios
4. **Maintain both** as living documentation

## Tooling

### TDD Tools
- **Vitest**: Fast unit test runner
- **Testing Library**: Component testing utilities
- **MSW**: API mocking
- **Playwright**: Browser testing

### BDD Tools
- **Cucumber**: Feature file runner
- **Gherkin**: Scenario specification language
- **Playwright**: Browser automation
- **Allure**: Test reporting

### IDE Integration
```json
// .vscode/settings.json
{
  "cucumberautocomplete.steps": [
    "tests/steps/**/*.js"
  ],
  "cucumberautocomplete.syncfeatures": "tests/features/**/*.feature",
  "vitest.enable": true
}
```

TDD and BDD complement each other perfectly: BDD ensures you build the right thing, TDD ensures you build it right.