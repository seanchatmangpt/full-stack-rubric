# Core Testing Utilities

Clean, framework-agnostic BDD utilities focused on vitest-cucumber step definitions. Follows the 80/20 rule - 20% of the code provides 80% of the testing value.

## Key Features

- **Clean API**: Simple functions, no complex fluent interfaces
- **Parameter Patterns**: Built-in support for `{int}`, `{float}`, `{string}`, `{word}`
- **Context Management**: Automatic context setup and cleanup
- **Helper Functions**: Common utilities for auth, API, forms, timing, data
- **Step Generators**: Auto-generate step definitions from patterns

## Quick Start

```javascript
// Import the bridge for vitest-cucumber integration
import { Given, When, Then, setupStepDefinitions } from './vitest-cucumber-bridge.js'

// Setup with context and helpers
const { context, helpers } = setupStepDefinitions()

// Define steps with parameter extraction
Given('user is logged in as {string}', async (context, helpers, role) => {
  helpers.auth.login({ role })
})

When('I fill {string} with {string}', async (context, helpers, field, value) => {
  helpers.form.fill(field, value)
})

Then('response status should be {int}', async (context, helpers, status) => {
  helpers.api.assertStatus(status)
})
```

## Core Components

### 1. Step Context
Manages test state across step definitions:

```javascript
context.set('key', value)     // Store data
context.get('key')            // Retrieve data
context.initialize(data)      // Setup scenario
context.cleanup()             // Teardown scenario
```

### 2. Step Helpers
Pre-built utilities for common operations:

```javascript
helpers.auth.login({ role: 'admin' })
helpers.auth.logout()
helpers.auth.assertLoggedIn()

helpers.api.request('/endpoint')
helpers.api.assertStatus(200)
helpers.api.mockResponse('/api', { data: {} })

helpers.form.fill('email', 'test@example.com')
helpers.form.submit()
helpers.form.assertSubmitted()

helpers.timing.wait(1000)
helpers.timing.startTimer('operation')
helpers.timing.stopTimer('operation')

helpers.data.generateUser({ role: 'test' })
helpers.data.store('key', value)
helpers.data.retrieve('key')
```

### 3. Parameter Patterns
Automatic parameter extraction and type conversion:

- `{int}` - Converts to integer
- `{float}` - Converts to float  
- `{string}` - Extracts quoted strings
- `{word}` - Extracts single words

### 4. Step Generators
Auto-generate step definitions from common patterns:

```javascript
import { generateStepDefinition, QuickGenerate } from './minimal-step-generators.js'

// Generate single step
const stepCode = generateStepDefinition('I fill "email" with "test@example.com"', 'When')

// Generate common patterns
const authSteps = QuickGenerate.auth()
const formSteps = QuickGenerate.forms() 
const apiSteps = QuickGenerate.api()
const allSteps = QuickGenerate.all()
```

## Usage Patterns

### Basic Step Definition
```javascript
When('I perform action {string}', async (context, helpers, action) => {
  // Implementation using helpers
  helpers.data.store('lastAction', action)
})
```

### Using Context
```javascript
Given('application state is {string}', async (context, helpers, state) => {
  context.set('appState', state)
  context.set('timestamp', Date.now())
})

Then('application should be in correct state', async (context, helpers) => {
  const currentState = context.get('appState')
  expect(currentState).toBe('ready')
})
```

### Complex Operations
```javascript
When('I login as admin and navigate to dashboard', async (context, helpers) => {
  // Multiple operations in single step
  helpers.auth.login({ role: 'admin' })
  context.set('currentPage', '/dashboard')
  helpers.timing.startTimer('navigation')
})
```

## Common Step Patterns

The utilities include pre-built implementations for the most common BDD patterns:

**Authentication:**
- `user is logged in`
- `user is logged out` 
- `user is logged in as {string}`

**Forms:**
- `I fill {string} with {string}`
- `I submit the form`
- `form should be submitted`

**API:**
- `I call API {string}`
- `response status should be {int}`
- `response should contain {string} = {string}`

**Timing:**
- `I wait {int} seconds`
- `timer {string} should be less than {int} ms`

**Data:**
- `I store {string} as {string}`
- `{string} should equal {string}`

## Integration with vitest-cucumber

The utilities work seamlessly with @amiceli/vitest-cucumber:

```javascript
// feature.test.js
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import './step-definitions.js' // Your steps using the utilities

const feature = loadFeature('./user-login.feature')

describeFeature(feature, ({ scenario }) => {
  scenario('User logs in successfully', ({ given, when, then }) => {
    // Steps are automatically matched and executed
  })
})
```

## Architecture Benefits

1. **Clean Separation**: Core utilities are framework-agnostic
2. **Minimal API**: Focus on essential 20% functionality  
3. **Easy Testing**: Utilities themselves are testable
4. **No Fluent Interfaces**: Simple function calls instead of complex chaining
5. **Parameter Handling**: Automatic type conversion and extraction
6. **Context Management**: Proper setup/teardown lifecycle
7. **Helper Functions**: Reduce boilerplate in step definitions

## File Structure

```
tests/framework/
├── core-testing-utilities.js      # Core classes and functions
├── vitest-cucumber-bridge.js      # Integration with vitest-cucumber
├── minimal-step-generators.js     # Pattern-based code generation
└── example-usage.js               # Usage examples
```

The clean utilities are extracted from the project-specific testing framework, removing all Nuxt/Vue dependencies and fluent interface complexity while preserving the core 20% functionality that provides 80% of the testing value.