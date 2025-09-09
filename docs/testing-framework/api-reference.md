# Testing Framework API Reference

## Core API

### Framework Initialization

#### `setup(options)`
Initialize the testing framework with optional configuration.

**Parameters:**
- `options` (Object, optional): Configuration options
  - `autoConfig` (boolean): Enable auto-configuration (default: true)
  - `nuxtIntegration` (boolean): Enable Nuxt integration (default: true)
  - `cucumberIntegration` (boolean): Enable Cucumber/BDD (default: true)

**Returns:** Promise resolving to framework API object

**Example:**
```javascript
import { setup } from '@/tests/framework'

const { scenario, helpers, framework } = await setup({
  autoConfig: true,
  nuxtIntegration: true
})
```

#### `setupNuxtBDD(options)`
Quick setup for Nuxt projects with BDD testing.

**Parameters:**
- `options` (Object, optional): Nuxt-specific options

**Returns:** Promise resolving to Nuxt-optimized framework API

**Example:**
```javascript
import { setupNuxtBDD } from '@/tests/framework'

const { scenario, quickTest } = await setupNuxtBDD()
```

### Component Testing

#### `quickTest(name, component, options)`
One-liner component testing with smart defaults.

**Parameters:**
- `name` (string): Test suite name
- `component` (Object): Vue component to test
- `options` (Object, optional): Test configuration
  - `props` (Object): Props to pass to component
  - `shallow` (boolean): Use shallow mounting
  - `autoProps` (boolean): Auto-generate props (default: true)
  - `events` (Array): Events to test automatically
  - `a11y` (boolean): Run accessibility tests (default: true)
  - `mocks` (Object): Nuxt composables to mock

**Returns:** Object with wrapper and test utilities

**Example:**
```javascript
import { quickTest } from '@/tests/framework'
import MyComponent from '@/components/MyComponent.vue'

quickTest('MyComponent', MyComponent, {
  props: { title: 'Test Title' },
  events: ['click', 'submit'],
  a11y: true
})
```

#### `batchTest(components)`
Test multiple components with same configuration.

**Parameters:**
- `components` (Array): Array of [name, component, options] tuples

**Returns:** Array of test results

**Example:**
```javascript
import { batchTest } from '@/tests/framework'

batchTest([
  ['Button', ButtonComponent, { props: { variant: 'primary' } }],
  ['Card', CardComponent, { props: { title: 'Test' } }],
  ['Modal', ModalComponent, { props: { open: true } }]
])
```

### BDD Testing

#### `scenario(description)`
Create a new BDD scenario with fluent API.

**Parameters:**
- `description` (string): Scenario description

**Returns:** ScenarioBuilder instance

**Example:**
```javascript
import { scenario } from '@/tests/framework'

await scenario('User Login Flow')
  .given.user.isLoggedOut()
  .when.user.submitsLogin({ email: 'test@example.com' })
  .then.user.shouldBeRedirected('/dashboard')
  .execute()
```

### Step Definition Functions

#### `Given(step, implementation)`
Register a Given step definition.

**Parameters:**
- `step` (string): Step pattern with parameter placeholders
- `implementation` (Function): Step implementation function

**Example:**
```javascript
import { Given } from '@/tests/framework'

Given('I am on the {string} page', async function(pageName) {
  await this.visit(`/${pageName}`)
})
```

#### `When(step, implementation)`
Register a When step definition.

**Parameters:**
- `step` (string): Step pattern
- `implementation` (Function): Step implementation

**Example:**
```javascript
import { When } from '@/tests/framework'

When('I click the {string} button', async function(buttonText) {
  const button = this.wrapper.find(`button:contains("${buttonText}")`)
  await button.trigger('click')
})
```

#### `Then(step, implementation)`
Register a Then step definition.

**Parameters:**
- `step` (string): Step pattern
- `implementation` (Function): Step implementation

**Example:**
```javascript
import { Then } from '@/tests/framework'

Then('I should see {string}', function(text) {
  expect(this.wrapper.text()).toContain(text)
})
```

### Mock System

#### `createSmartMocks(config)`
Create intelligent mock system with OpenAPI integration.

**Parameters:**
- `config` (Object): Mock configuration
  - `schema` (Object): OpenAPI schema
  - `baseUrl` (string): API base URL
  - `strictValidation` (boolean): Enable strict validation

**Returns:** SmartMockSystem instance

**Example:**
```javascript
import { createSmartMocks } from '@/tests/framework'

const mocks = createSmartMocks({
  baseUrl: 'http://localhost:3000',
  strictValidation: true
})

mocks.mock('GET', '/api/users', {
  status: 200,
  data: [{ id: 1, name: 'Test User' }]
})
```

### Step Generators

#### `generateStepDefinition(stepText, options)`
Auto-generate step definitions from natural language.

**Parameters:**
- `stepText` (string): Step text to generate definition for
- `options` (Object): Generation options
  - `framework` (string): Target framework ('cucumber', 'vitest')
  - `testRunner` (string): Test runner ('vitest', 'jest')

**Returns:** Generated step definition code (string)

**Example:**
```javascript
import { generateStepDefinition } from '@/tests/framework'

const stepCode = generateStepDefinition(
  'Given the user is on the homepage',
  { framework: 'cucumber' }
)
```

### Test Utilities

#### `createTestUtilities(context)`
Create utility functions for test scenarios.

**Parameters:**
- `context` (Object): Test context object

**Returns:** Object with utility functions

**Example:**
```javascript
import { createTestUtilities } from '@/tests/framework'

const utils = createTestUtilities(this)
await utils.auth.login('user@example.com', 'password')
await utils.navigation.goTo('/dashboard')
```

## Configuration Options

### Framework Options

```javascript
{
  // Auto-configuration
  autoConfig: true,
  
  // Integration flags
  nuxtIntegration: true,
  cucumberIntegration: false,
  
  // Plugin system
  plugins: [],
  
  // Convention overrides
  conventions: {
    componentPath: 'components',
    testPath: 'tests'
  },
  
  // Nuxt-specific options
  nuxtOptions: {
    stubs: {},
    mocks: {}
  }
}
```

### QuickTest Options

```javascript
{
  // Mounting options
  shallow: false,
  props: {},
  slots: {},
  
  // Auto-generation
  autoProps: true,
  
  // Testing features
  events: ['click', 'submit'],
  a11y: true,
  responsive: false,
  
  // Mocking
  mocks: {
    $router: mockRouter,
    $route: mockRoute
  }
}
```

### Smart Mock Options

```javascript
{
  // Schema integration
  schema: {}, // OpenAPI schema
  
  // Network simulation
  baseUrl: 'http://localhost:3000',
  defaultDelay: 100,
  
  // Validation
  strictValidation: false,
  
  // Response customization
  globalHeaders: {
    'Content-Type': 'application/json'
  },
  
  // Scenario support
  scenarios: ['success', 'error', 'loading']
}
```

## Return Types

### Framework API Object

```javascript
{
  scenario: Function,      // Create BDD scenario
  given: Function,         // Given step builder
  when: Function,          // When step builder  
  then: Function,          // Then step builder
  helpers: Function,       // Test utilities
  framework: Object,       // Framework instance
  config: Object          // Framework configuration
}
```

### Test Wrapper Object

```javascript
{
  wrapper: VueWrapper,          // Vue Test Utils wrapper
  mockNuxt: Object,            // Mocked Nuxt context
  rerender: Function,          // Re-render with new props
  emitEvent: Function,         // Emit component event
  getByTestId: Function,       // Find by test ID
  getAllByTestId: Function     // Find all by test ID
}
```

### Scenario Builder Methods

```javascript
// Fluent API methods
.given.user.isLoggedOut()
.given.page.isLoaded()
.when.user.clicks(selector)
.when.form.isSubmitted()
.then.page.shouldDisplay(text)
.then.user.shouldBeRedirected(path)

// Execution
.execute()                   // Run scenario
.debug()                    // Run with debugging
.skip()                     // Skip scenario
```

## Error Handling

All async methods may throw these error types:

- `FrameworkError`: Framework initialization issues
- `ComponentMountError`: Component mounting failures  
- `StepDefinitionError`: BDD step execution errors
- `MockValidationError`: API mock validation failures
- `ConfigurationError`: Invalid configuration options

## Performance Considerations

- Use `shallow: true` for faster component tests
- Enable `autoConfig: false` to skip project scanning
- Use `batchTest` for testing similar components
- Implement custom step generators for repeated patterns
- Cache mock responses for expensive operations

## Browser Compatibility

- Supports all modern browsers
- IE11+ support with polyfills
- Mobile browser testing available
- Headless browser support for CI/CD