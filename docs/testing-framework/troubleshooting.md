# Troubleshooting Guide

## Common Issues and Solutions

### Component Testing Issues

#### Issue: Component fails to mount with `quickTest`

**Symptoms:**
- Error: "Failed to mount component"
- Component wrapper is null or undefined
- Tests crash during component initialization

**Common Causes & Solutions:**

1. **Missing Component Export**
```javascript
// ❌ Wrong - no default export
export const MyComponent = { ... }

// ✅ Correct - default export
export default defineComponent({ ... })
```

2. **Incorrect Import Path**
```javascript
// ❌ Wrong - relative path in tests
import MyComponent from '../components/MyComponent.vue'

// ✅ Correct - absolute path
import MyComponent from '@/components/MyComponent.vue'
```

3. **Missing Component Dependencies**
```javascript
// If component uses composables/plugins
quickTest('MyComponent', MyComponent, {
  mocks: {
    $router: mockRouter,
    $pinia: mockPinia
  }
})
```

#### Issue: Auto-generated props cause test failures

**Symptoms:**
- Prop validation errors
- Component doesn't render as expected
- Type mismatches in props

**Solutions:**

1. **Disable Auto-Props**
```javascript
quickTest('Component', Component, {
  autoProps: false,
  props: {
    // Manually specify all required props
    title: 'Test Title',
    count: 0
  }
})
```

2. **Override Specific Props**
```javascript
quickTest('Component', Component, {
  props: {
    // Override specific props, others auto-generated
    complexProp: { customData: true }
  }
})
```

3. **Fix Component Prop Definitions**
```javascript
// Ensure proper prop defaults in component
export default defineComponent({
  props: {
    title: {
      type: String,
      default: 'Default Title'  // Helps auto-generation
    }
  }
})
```

#### Issue: Events not triggering in tests

**Symptoms:**
- `wrapper.emitted()` returns empty
- Click events don't fire
- Form submissions fail

**Solutions:**

1. **Use Correct Event Names**
```javascript
quickTest('Component', Component, {
  events: ['click', 'submit', 'update:modelValue']  // Exact event names
})
```

2. **Manual Event Testing**
```javascript
const { wrapper } = quickTest('Component', Component)

it('should handle custom events', async () => {
  const button = wrapper.getByTestId('my-button')
  await button.trigger('click')
  expect(wrapper.emitted('click')).toHaveLength(1)
})
```

### BDD Testing Issues

#### Issue: Step definitions not found

**Symptoms:**
- Error: "No step definition found for: [step text]"
- Scenarios fail to execute
- Steps are skipped

**Solutions:**

1. **Check Step Registration**
```javascript
import { Given, When, Then } from '@/tests/framework'

// Ensure steps are registered before use
Given('I am on the {string} page', async function(pageName) {
  // Implementation
})
```

2. **Import Step Definitions**
```javascript
// In test file, import all step files
import './steps/auth.steps.js'
import './steps/navigation.steps.js'
import './steps/typing.steps.js'
```

3. **Check Step Pattern Matching**
```javascript
// ❌ Wrong - pattern doesn't match
Given('I am on page {string}', function() {})
// Used as: "I am on the home page" (won't match)

// ✅ Correct - exact pattern match
Given('I am on the {string} page', function() {})
```

4. **Use Global Context**
```javascript
import { Given, globalContext } from '@/tests/framework'

// Steps automatically use global context
Given('I am on the login page', async function() {
  await globalContext.setupComponent(LoginPage)
})
```

#### Issue: Fluent API methods not working

**Symptoms:**
- `.given.user.isOnPage()` throws error
- Fluent chain breaks
- Methods not defined

**Solutions:**

1. **Check Framework Initialization**
```javascript
import { setup } from '@/tests/framework'

// Ensure framework is initialized
const { scenario } = await setup()

await scenario('Test')
  .given.user.isOnPage('/')  // Now available
  .execute()
```

2. **Use Traditional Steps if Fluent Fails**
```javascript
// Fallback to traditional step definitions
await scenario('Test')
  .executeStep('I am on the home page')
  .executeStep('I click the login button')
```

#### Issue: Scenario execution hangs or times out

**Symptoms:**
- Tests never complete
- Timeout errors
- Scenarios stuck on specific steps

**Solutions:**

1. **Add Debug Mode**
```javascript
await scenario('Debug scenario')
  .debug()  // Enables step-by-step debugging
  .given.user.isOnPage('/')
  .execute()
```

2. **Increase Timeout**
```javascript
scenario('Long running test')
  .timeout(10000)  // 10 seconds
  .given.data.isLoading()
  .execute()
```

3. **Check for Missing Awaits**
```javascript
// ❌ Wrong - missing await
When('I submit the form', function() {
  this.wrapper().find('form').trigger('submit')  // Not awaited
})

// ✅ Correct - proper async/await
When('I submit the form', async function() {
  await this.wrapper().find('form').trigger('submit')
})
```

### API Mocking Issues

#### Issue: Mocked APIs not intercepted

**Symptoms:**
- Real API calls being made during tests
- Network errors in tests
- Unexpected API responses

**Solutions:**

1. **Verify Mock Setup**
```javascript
import { createSmartMocks } from '@/tests/framework'

const mocks = createSmartMocks({
  baseUrl: 'http://localhost:3000'  // Must match your API base URL
})

mocks.mock('GET', '/api/users', {
  status: 200,
  data: [{ id: 1, name: 'Test User' }]
})
```

2. **Check URL Pattern Matching**
```javascript
// ❌ Wrong - exact path only
mocks.mock('GET', '/api/user/123', response)

// ✅ Correct - pattern matching
mocks.mock('GET', '/api/user/:id', response)
// or
mocks.mock('GET', /\/api\/user\/\d+/, response)
```

3. **Setup Global Request Interception**
```javascript
// In test setup
beforeEach(() => {
  vi.stubGlobal('fetch', mocks.handleRequest.bind(mocks))
})
```

#### Issue: Mock validation errors

**Symptoms:**
- "Request validation failed" errors
- "Response validation failed" warnings
- Schema validation issues

**Solutions:**

1. **Disable Strict Validation**
```javascript
const mocks = createSmartMocks({
  strictValidation: false  // Disable validation
})
```

2. **Provide Proper Schema**
```javascript
const mocks = createSmartMocks({
  schema: {
    paths: {
      '/api/users': {
        get: {
          responses: {
            200: {
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        name: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
})
```

### Nuxt Integration Issues

#### Issue: Nuxt composables not mocked

**Symptoms:**
- `useRouter()` is undefined
- `useState()` throws errors
- Nuxt-specific functionality fails

**Solutions:**

1. **Provide Nuxt Mocks**
```javascript
quickTest('Component', Component, {
  mocks: {
    $router: {
      push: vi.fn(),
      replace: vi.fn(),
      go: vi.fn()
    },
    $route: {
      path: '/',
      query: {},
      params: {}
    }
  }
})
```

2. **Use Nuxt Test Utils**
```javascript
import { mountSuspended } from '@nuxt/test-utils'

// For components that require Nuxt context
const wrapper = await mountSuspended(MyNuxtComponent)
```

3. **Mock Nuxt Composables Globally**
```javascript
// In test setup file
vi.mock('#imports', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn()
  }),
  useState: vi.fn(() => ref(null))
}))
```

### Performance Issues

#### Issue: Tests run slowly

**Symptoms:**
- Long test execution times
- High memory usage
- Tests timing out

**Solutions:**

1. **Use Shallow Mounting**
```javascript
quickTest('Component', Component, {
  shallow: true  // 3x faster mounting
})
```

2. **Batch Similar Tests**
```javascript
// Instead of multiple individual tests
batchTest([
  ['Variant 1', Component, { props: { variant: 'primary' } }],
  ['Variant 2', Component, { props: { variant: 'secondary' } }],
  ['Variant 3', Component, { props: { variant: 'danger' } }]
])
```

3. **Optimize Test Setup**
```javascript
describe('Component Tests', () => {
  let context
  
  // Reuse context across tests
  beforeAll(async () => {
    context = createTestContext()
  })
  
  beforeEach(async () => {
    await context.setupComponent(Component)
  })
  
  afterEach(() => {
    context.cleanupComponent()
  })
})
```

4. **Use Parallel Testing**
```javascript
// In vitest.config.js
export default defineConfig({
  test: {
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 2
      }
    }
  }
})
```

### Memory Issues

#### Issue: Memory leaks in tests

**Symptoms:**
- Tests fail with out-of-memory errors
- Increasing memory usage over time
- Slow performance in CI/CD

**Solutions:**

1. **Proper Cleanup**
```javascript
afterEach(() => {
  // Always cleanup components
  if (wrapper) {
    wrapper.unmount()
    wrapper = null
  }
  
  // Clear mocks
  vi.clearAllMocks()
  
  // Reset framework state
  context.cleanup()
})
```

2. **Avoid Global State**
```javascript
// ❌ Wrong - global state persists
let globalWrapper

// ✅ Correct - local state per test
describe('Tests', () => {
  let wrapper
  
  beforeEach(() => {
    wrapper = mount(Component)
  })
})
```

3. **Clear Timers and Intervals**
```javascript
afterEach(() => {
  vi.clearAllTimers()
  vi.clearAllIntervals()
})
```

### Configuration Issues

#### Issue: Framework not auto-configuring

**Symptoms:**
- Manual configuration required
- Features not working out of the box
- Import errors

**Solutions:**

1. **Check Framework Files**
```bash
# Ensure framework directory exists
ls tests/framework/

# Should contain:
# index.js, core/, components/, bdd/, etc.
```

2. **Force Auto-Configuration**
```javascript
import { setup } from '@/tests/framework'

const api = await setup({
  autoConfig: true,  // Force enable
  verbose: true      // Enable debug logging
})
```

3. **Check Vitest Configuration**
```javascript
// vitest.config.js
export default defineConfig({
  test: {
    setupFiles: [
      'tests/setup/dom-setup.js',
      'tests/setup/global-setup.js'  // Framework setup
    ]
  }
})
```

### TypeScript Issues

#### Issue: TypeScript errors with framework

**Symptoms:**
- Type errors in test files
- Import errors
- Missing type definitions

**Solutions:**

1. **Add Type Declarations**
```typescript
// types/testing.d.ts
declare module '@/tests/framework' {
  export function quickTest(name: string, component: any, options?: any): any
  export function scenario(description: string): any
  export function setup(options?: any): Promise<any>
}
```

2. **Use JSDoc Types**
```javascript
/**
 * @param {string} name
 * @param {import('vue').Component} component  
 * @param {import('@/tests/framework').QuickTestOptions} options
 */
quickTest('Component', Component, options)
```

## Debug Strategies

### 1. Enable Framework Debugging

```javascript
// Enable verbose logging
const { framework } = await setup({ verbose: true })

// Check framework state
console.log('Plugins:', framework.getPlugins())
console.log('Config:', framework.getConfig())
console.log('Scenarios:', framework.getScenarios())
```

### 2. Component Debugging

```javascript
const { wrapper } = quickTest('Component', Component)

it('debug component', () => {
  console.log('HTML:', wrapper.html())
  console.log('Props:', wrapper.props())
  console.log('Component data:', wrapper.vm)
  console.log('Emitted events:', wrapper.emitted())
})
```

### 3. Step Debugging

```javascript
Given('debug step', function() {
  console.log('Context state:', this.state)
  console.log('Wrapper exists:', this.wrapper()?.exists())
  console.log('Current URL:', window.location.href)
})
```

### 4. API Mock Debugging

```javascript
const mocks = createSmartMocks()

// Log all requests
mocks.addInterceptor((req) => {
  console.log('API Request:', req.method, req.url)
})

// Check request history
console.log('Request history:', mocks.getRequestHistory())
```

## Getting Additional Help

### 1. Check Framework Examples

```javascript
// Look at existing examples in the project
// tests/framework/examples/
// tests/bdd-*.test.js
// tests/unit/*.test.js
```

### 2. Enable Test Output

```bash
# Run with verbose output
pnpm test --reporter=verbose

# Run specific test with debugging
pnpm test my-test.js --reporter=verbose

# Run with UI (if available)
pnpm test:ui
```

### 3. Framework Health Check

```javascript
import { validateFramework } from '@/tests/framework'

// Check framework health
const health = await validateFramework()
console.log('Framework status:', health)
```

### 4. Reset Framework State

```javascript
// If things get really broken, reset everything
import { setup } from '@/tests/framework'

const { framework } = await setup()
await framework.cleanup()  // Reset to clean state
await framework.initialize()  // Reinitialize
```

Most issues stem from missing imports, incorrect configuration, or component dependencies. Start with the simple solutions first, then move to more complex debugging if needed.