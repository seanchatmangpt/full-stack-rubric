# nuxt-bdd-testing Library API Design

## Core Philosophy
- **Zero Configuration**: Works out of the box with sensible defaults
- **Progressive Enhancement**: Add complexity only when needed
- **Framework Agnostic**: Works with Jest, Vitest, Playwright, Cypress
- **Type Safe**: Full TypeScript support with JSDoc fallbacks

## Main API Surface

### 1. Factory Function (Recommended Approach)

```javascript
import { createTestConfig } from 'nuxt-bdd-testing'

// Zero config - uses defaults
const config = createTestConfig()

// With custom configuration
const config = createTestConfig({
  framework: 'vitest', // 'jest' | 'vitest' | 'playwright'
  testDir: './tests',
  features: './tests/features',
  steps: './tests/steps',
  plugins: [
    // Custom plugins
  ]
})
```

### 2. Configuration System

```javascript
const defaultConfig = {
  // Test Framework Selection
  framework: 'vitest', // Auto-detected or explicit
  
  // Directory Structure
  testDir: './tests',
  featuresDir: './tests/features',
  stepsDir: './tests/steps',
  supportDir: './tests/support',
  fixturesDir: './tests/fixtures',
  
  // Nuxt Integration
  nuxt: {
    buildDir: '.nuxt',
    configFile: 'nuxt.config.js',
    serverUrl: 'http://localhost:3000'
  },
  
  // BDD Configuration
  gherkin: {
    language: 'en',
    strict: false,
    tagExpression: '@current'
  },
  
  // Testing Options
  parallel: true,
  timeout: 30000,
  retries: 2,
  
  // Reporting
  reporters: ['default', 'html'],
  reportDir: './test-results'
}
```

### 3. Plugin System

```javascript
// Plugin Interface
const customPlugin = {
  name: 'custom-plugin',
  
  // Lifecycle hooks
  async beforeAll(context) {
    // Setup before all tests
  },
  
  async beforeEach(context) {
    // Setup before each test
  },
  
  async afterEach(context) {
    // Cleanup after each test
  },
  
  async afterAll(context) {
    // Cleanup after all tests
  },
  
  // Custom matchers
  matchers: {
    toBeAccessible: (received) => {
      // Custom accessibility matcher
    }
  },
  
  // Step definitions
  steps: {
    'Given I am on the {string} page': async (pageName) => {
      // Custom step implementation
    }
  }
}

// Register plugin
const config = createTestConfig({
  plugins: [customPlugin]
})
```

### 4. Testing Utilities

```javascript
import { testUtils } from 'nuxt-bdd-testing'

// Component Testing
const { renderComponent, mountComponent } = testUtils.component
const wrapper = await mountComponent(MyComponent, {
  props: { title: 'Test' },
  nuxtContext: { route: '/test' }
})

// API Testing  
const { request, mockServer } = testUtils.api
const response = await request('/api/users').expect(200)

// E2E Testing
const { page, browser } = testUtils.e2e
await page.goto('/dashboard')
await page.click('[data-testid="login-button"]')

// Accessibility Testing
const { checkA11y } = testUtils.accessibility
await checkA11y(wrapper.element)
```

### 5. Step Definition Helpers

```javascript
import { defineSteps } from 'nuxt-bdd-testing'

export default defineSteps(({ Given, When, Then, And, But }) => {
  Given('I am on the {string} page', async (pageName) => {
    await this.page.goto(`/${pageName}`)
  })
  
  When('I click the {string} button', async (buttonName) => {
    await this.page.click(`[aria-label="${buttonName}"]`)
  })
  
  Then('I should see {string}', async (text) => {
    await expect(this.page.locator('body')).toContainText(text)
  })
})
```

### 6. Context and State Management

```javascript
import { createContext } from 'nuxt-bdd-testing'

// Shared context across steps
const context = createContext({
  user: null,
  page: null,
  api: null,
  
  // Custom methods
  async login(credentials) {
    this.user = await this.api.post('/auth/login', credentials)
  },
  
  async navigateTo(path) {
    await this.page.goto(path)
  }
})
```

### 7. Advanced Configuration

```javascript
const config = createTestConfig({
  // Multiple environments
  environments: {
    local: {
      baseUrl: 'http://localhost:3000'
    },
    staging: {
      baseUrl: 'https://staging.example.com'
    }
  },
  
  // Custom reporters
  reporters: [
    'default',
    ['html', { outputDir: './reports/html' }],
    ['json', { outputFile: './reports/results.json' }],
    ['allure', { outputDir: './reports/allure' }]
  ],
  
  // Parallel execution
  parallel: {
    workers: 4,
    strategy: 'feature' // 'feature' | 'scenario'
  },
  
  // Screenshot and video
  capture: {
    screenshot: 'failure', // 'always' | 'failure' | 'never'
    video: 'failure'
  },
  
  // Custom transforms
  transforms: [
    {
      pattern: /\.feature$/,
      transform: customGherkinTransform
    }
  ]
})
```

## Package.json Integration

```javascript
// Suggested package.json scripts
{
  "scripts": {
    "test": "nuxt-bdd-testing",
    "test:watch": "nuxt-bdd-testing --watch",
    "test:ui": "nuxt-bdd-testing --ui",
    "test:coverage": "nuxt-bdd-testing --coverage",
    "test:debug": "nuxt-bdd-testing --debug"
  }
}
```

## CLI Interface

```bash
# Run all tests
npx nuxt-bdd-testing

# Run specific feature
npx nuxt-bdd-testing --feature user-authentication

# Run with tags
npx nuxt-bdd-testing --tags @smoke

# Generate step definitions
npx nuxt-bdd-testing --generate-steps

# Initialize project
npx nuxt-bdd-testing init
```

## TypeScript/JSDoc Support

```javascript
/**
 * @typedef {Object} TestConfig
 * @property {'jest'|'vitest'|'playwright'} framework - Testing framework
 * @property {string} testDir - Test directory path
 * @property {Plugin[]} plugins - Array of plugins
 */

/**
 * Create test configuration
 * @param {Partial<TestConfig>} options - Configuration options
 * @returns {TestConfig} Complete configuration object
 */
function createTestConfig(options = {}) {
  // Implementation
}
```

## Plugin Examples

```javascript
// Authentication Plugin
const authPlugin = {
  name: 'auth',
  steps: {
    'Given I am logged in as {string}': async (userType) => {
      await this.context.login({ type: userType })
    }
  }
}

// Database Plugin
const dbPlugin = {
  name: 'database',
  async beforeEach() {
    await this.db.seed()
  },
  async afterEach() {
    await this.db.reset()
  }
}

// Visual Testing Plugin
const visualPlugin = {
  name: 'visual',
  steps: {
    'Then the page should match the {string} snapshot': async (name) => {
      await expect(this.page).toMatchSnapshot(`${name}.png`)
    }
  }
}
```

This API design prioritizes:
- **Simplicity**: Zero-config setup with progressive complexity
- **Flexibility**: Plugin system for extensibility
- **Type Safety**: Full TypeScript support with JSDoc alternatives
- **Developer Experience**: Intuitive method names and clear documentation
- **Framework Agnostic**: Works with multiple testing frameworks
- **Nuxt Integration**: Deep integration with Nuxt.js ecosystem