# Troubleshooting Guide

This guide covers common issues you might encounter when using Nuxt BDD and their solutions.

## Installation Issues

### Issue: "Cannot resolve module 'nuxt-bdd'"

**Problem:**
```bash
Error: Cannot resolve module 'nuxt-bdd'
```

**Solutions:**

1. **Ensure proper installation:**
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm add -D nuxt-bdd @amiceli/vitest-cucumber @vue/test-utils
```

2. **Check package.json dependencies:**
```json
{
  "devDependencies": {
    "nuxt-bdd": "^1.0.0",
    "@amiceli/vitest-cucumber": "^5.2.1",
    "@vue/test-utils": "^2.4.6",
    "vitest": "^3.2.4"
  }
}
```

3. **Verify import paths:**
```javascript
// Correct imports
import { mountWithBDD } from 'nuxt-bdd'
import { Given, When, Then } from '@amiceli/vitest-cucumber'
```

### Issue: "vitest-cucumber hooks not working"

**Problem:**
```bash
ReferenceError: Given is not defined
```

**Solution:**
Ensure proper vitest configuration:

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup/global-setup.js'],
    include: [
      'tests/**/*.{test,spec}.js',
      'tests/**/*.steps.js'
    ]
  }
})
```

## Configuration Issues

### Issue: "JSDOM environment not working"

**Problem:**
```bash
Error: window is not defined
Error: document is not defined
```

**Solution:**

1. **Install JSDOM:**
```bash
pnpm add -D jsdom
```

2. **Configure vitest environment:**
```javascript
// vitest.config.js
export default defineConfig({
  test: {
    environment: 'jsdom',
    // ... other config
  }
})
```

3. **Add to global setup:**
```javascript
// tests/setup/global-setup.js
import { vi } from 'vitest'

// Mock window globals
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})
```

### Issue: "Component stubs not working"

**Problem:**
```bash
Error: Unknown custom element: <UButton>
Error: Unknown custom element: <MonacoEditor>
```

**Solution:**

1. **Use built-in stubs:**
```javascript
import { mountWithBDD } from 'nuxt-bdd'

// Built-in stubs are automatically applied
await mountWithBDD(MyComponent)
```

2. **Add custom stubs:**
```javascript
await mountWithBDD(MyComponent, {
  stubs: {
    UInput: {
      template: '<input v-model="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
      props: ['modelValue'],
      emits: ['update:modelValue']
    },
    CustomComponent: true // Simple stub
  }
})
```

3. **Configure global stubs:**
```javascript
import { VitestCucumberBridge } from 'nuxt-bdd'

const bridge = new VitestCucumberBridge({
  mockDefaults: {
    GlobalComponent: { template: '<div><slot /></div>' }
  }
})
```

## Step Definition Issues

### Issue: "Step definition not found"

**Problem:**
```bash
Error: Step "I am on the login page" is not defined
```

**Solutions:**

1. **Check step registration:**
```javascript
import { Given } from '@amiceli/vitest-cucumber'

// Make sure the pattern matches exactly
Given('I am on the login page', async () => {
  // Implementation
})
```

2. **Use parameter patterns:**
```javascript
// More flexible pattern
Given('I am on the {string} page', async (pageName) => {
  // Implementation
})
```

3. **Debug step registry:**
```javascript
import { bddBridge } from 'nuxt-bdd'

console.log('Registered steps:', bddBridge.getStepRegistry())
```

### Issue: "Step parameter parsing errors"

**Problem:**
```bash
Error: Expected 1 parameter but got 0
Error: Cannot convert "string" to number
```

**Solutions:**

1. **Correct parameter patterns:**
```javascript
// String parameters
Given('I enter {string} in the field', (value) => {
  // value is a string
})

// Integer parameters  
Given('I wait for {int} seconds', (seconds) => {
  // seconds is a number
})

// Float parameters
Given('The value should be {float}', (expectedValue) => {
  // expectedValue is a number
})
```

2. **Handle data tables:**
```javascript
Given('I have the following users:', (dataTable) => {
  const users = dataTable.hashes() // Array of objects
  // OR
  const users = dataTable.rows() // Array of arrays
})
```

3. **Optional parameters:**
```javascript
Given('I (?:click|press) the {string} button', (buttonName) => {
  // Handles both "click" and "press"
})
```

## Component Testing Issues

### Issue: "Component not mounting correctly"

**Problem:**
```bash
Error: Cannot read properties of null (reading 'text')
TypeError: wrapper.find(...).exists is not a function
```

**Solutions:**

1. **Check component import:**
```javascript
// Correct import path
import MyComponent from '~/components/MyComponent.vue'
import MyComponent from '@/components/MyComponent.vue'

// Avoid relative imports in tests
import MyComponent from '../../../components/MyComponent.vue'
```

2. **Ensure proper mounting:**
```javascript
import { mountWithBDD, getBDDContext } from 'nuxt-bdd'

Given('I view the component', async () => {
  await mountWithBDD(MyComponent, {
    props: { requiredProp: 'value' }
  })
  
  // Verify mount was successful
  const { wrapper } = getBDDContext()
  expect(wrapper.exists()).toBe(true)
})
```

3. **Handle async components:**
```javascript
import { nextTick } from 'vue'

When('I interact with the component', async () => {
  const { wrapper } = getBDDContext()
  await wrapper.find('#button').trigger('click')
  await nextTick() // Wait for reactivity
})
```

### Issue: "Component props not working"

**Problem:**
```bash
Error: Props validation failed
Error: Required prop missing
```

**Solutions:**

1. **Provide required props:**
```javascript
await mountWithBDD(MyComponent, {
  props: {
    title: 'Test Title',
    data: { id: 1, name: 'Test' },
    onUpdate: vi.fn()
  }
})
```

2. **Handle prop validation:**
```javascript
// Component with validation
const validUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com'
}

await mountWithBDD(UserComponent, {
  props: { user: validUser }
})
```

3. **Mock complex props:**
```javascript
const mockStore = {
  state: { user: null },
  commit: vi.fn(),
  dispatch: vi.fn()
}

await mountWithBDD(MyComponent, {
  global: {
    provide: { store: mockStore }
  }
})
```

## Event Testing Issues

### Issue: "Events not being emitted"

**Problem:**
```bash
Error: Expected event 'submit' to be emitted
Error: wrapper.emitted().click is undefined
```

**Solutions:**

1. **Check event emission:**
```javascript
Then('the submit event should be emitted', () => {
  const { wrapper } = getBDDContext()
  
  // Debug: log all emitted events
  console.log('All emitted events:', wrapper.emitted())
  
  expect(wrapper.emitted().submit).toBeTruthy()
  expect(wrapper.emitted().submit).toHaveLength(1)
})
```

2. **Handle custom events:**
```javascript
// In component
this.$emit('custom-event', data)

// In test
expect(wrapper.emitted()['custom-event']).toBeTruthy()
```

3. **Wait for async events:**
```javascript
When('I submit the form', async () => {
  const { wrapper } = getBDDContext()
  await wrapper.find('form').trigger('submit')
  await nextTick()
})
```

### Issue: "Event data validation failing"

**Problem:**
```bash
Error: Expected event data to equal {...} but got undefined
```

**Solutions:**

1. **Check event payload:**
```javascript
Then('the event should contain user data', () => {
  const { wrapper } = getBDDContext()
  const events = wrapper.emitted().submit
  
  expect(events).toBeTruthy()
  expect(events[0]).toBeTruthy() // Check event exists
  expect(events[0][0]).toEqual(expectedData) // Check payload
})
```

2. **Handle multiple events:**
```javascript
Then('the latest event should contain correct data', () => {
  const { wrapper } = getBDDContext()
  const events = wrapper.emitted().update
  const latestEvent = events[events.length - 1]
  expect(latestEvent[0]).toEqual(expectedData)
})
```

## Performance Issues

### Issue: "Tests running slowly"

**Problem:**
Tests taking unusually long time to execute.

**Solutions:**

1. **Enable performance tracking:**
```javascript
import { VitestCucumberBridge } from 'nuxt-bdd'

const bridge = new VitestCucumberBridge({
  performanceTracking: true
})

// After tests
const metrics = bridge.getPerformanceMetrics()
console.log('Slow renders:', metrics.renderTimes.filter(t => t > 100))
```

2. **Optimize component stubs:**
```javascript
// Lightweight stubs
await mountWithBDD(MyComponent, {
  stubs: {
    // Simple template stubs
    HeavyComponent: { template: '<div>Mock</div>' },
    
    // Avoid complex stub logic
    ComplexComponent: true
  }
})
```

3. **Use test-specific data:**
```javascript
// Avoid large datasets in tests
const minimalUser = { id: '1', name: 'Test' }
const fullUser = { ...complexUserData } // Only when needed
```

### Issue: "Memory leaks in tests"

**Problem:**
```bash
Warning: Possible memory leak detected
```

**Solutions:**

1. **Ensure cleanup:**
```javascript
import { afterEach } from 'vitest'
import { getBDDContext } from 'nuxt-bdd'

afterEach(() => {
  const { wrapper } = getBDDContext()
  if (wrapper) {
    wrapper.unmount()
  }
})
```

2. **Clear mocks and timers:**
```javascript
afterEach(() => {
  vi.clearAllMocks()
  vi.clearAllTimers()
  vi.unstubAllGlobals()
})
```

## Debugging Tips

### Debug Step Execution

1. **Add console logs:**
```javascript
Given('I am on the home page', async () => {
  console.log('Executing: I am on the home page')
  await mountWithBDD(HomePage)
  console.log('Mount completed')
})
```

2. **Use debugger:**
```javascript
Then('I should see the result', () => {
  const { wrapper } = getBDDContext()
  debugger; // Pauses execution in dev tools
  expect(wrapper.text()).toContain('expected')
})
```

3. **Inspect wrapper state:**
```javascript
Then('I should see content', () => {
  const { wrapper } = getBDDContext()
  
  console.log('HTML:', wrapper.html())
  console.log('Text:', wrapper.text())
  console.log('Props:', wrapper.props())
  console.log('Emitted:', wrapper.emitted())
})
```

### Debug Feature Validation

```javascript
import { bddBridge } from 'nuxt-bdd'
import { readFileSync } from 'fs'

// Validate feature file
const featureContent = readFileSync('tests/features/problematic.feature', 'utf8')
const validation = bddBridge.validateFeatureSteps(featureContent)

console.log('Missing steps:', validation.missing)
console.log('Found steps:', validation.found)
```

### Debug Component Props

```javascript
// tests/utils/debug-helpers.js
export function debugWrapper(wrapper) {
  console.log('=== Component Debug ===')
  console.log('Exists:', wrapper.exists())
  console.log('HTML:', wrapper.html())
  console.log('Text:', wrapper.text())
  console.log('Props:', wrapper.props())
  console.log('Data:', wrapper.vm?.$data)
  console.log('Events:', wrapper.emitted())
  console.log('======================')
}

// In step definition
import { debugWrapper } from '../utils/debug-helpers'

Then('debug the component', () => {
  const { wrapper } = getBDDContext()
  debugWrapper(wrapper)
})
```

## Common Error Messages and Solutions

### "Cannot read properties of undefined"
- Usually indicates improper component mounting or missing props
- Check component import and required props

### "Step definition not found"
- Pattern mismatch between feature file and step definition
- Check for typos and exact pattern matching

### "Wrapper is null or undefined"
- Component wasn't mounted properly
- Ensure `mountWithBDD` was called and completed

### "Event not emitted"  
- Component not triggering events as expected
- Check event name spelling and trigger conditions

### "DOM queries failing"
- Element selectors not finding target elements
- Use data-testid attributes and verify HTML structure

## Getting Help

### Enable Verbose Logging
```javascript
// tests/setup/debug-setup.js
import { beforeEach } from 'vitest'

beforeEach(() => {
  if (process.env.DEBUG_TESTS) {
    console.log('=== Test Debug Mode ===')
  }
})
```

```bash
# Run with debug mode
DEBUG_TESTS=true pnpm test
```

### Create Minimal Reproduction
When reporting issues, create a minimal example that reproduces the problem:

```javascript
// minimal-repro.test.js
import { test } from 'vitest'
import { mountWithBDD } from 'nuxt-bdd'

test('minimal reproduction', async () => {
  // Simplest possible test that shows the issue
  const wrapper = await mountWithBDD(SimpleComponent)
  expect(wrapper.exists()).toBe(true)
})
```

### Check Documentation and Examples
- Review the [API documentation](../api/vitest-cucumber-bridge.md)
- Look at [examples](../examples/) for similar use cases
- Check the [migration guide](../guides/migration-guide.md) for common patterns

If you're still experiencing issues after trying these solutions, please create an issue with:
1. Your configuration files
2. Complete error messages
3. Minimal reproduction code
4. Environment details (Node version, package versions)