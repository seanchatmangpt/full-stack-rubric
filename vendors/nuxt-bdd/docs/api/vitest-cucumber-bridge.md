# VitestCucumberBridge API Reference

## Overview

The `VitestCucumberBridge` class is the core component of Nuxt BDD, providing enhanced integration between vitest-cucumber and Nuxt.js applications.

## Class: VitestCucumberBridge

### Constructor

```javascript
new VitestCucumberBridge(config?: BridgeConfig)
```

**Parameters:**
- `config` (optional): Configuration object

**BridgeConfig Interface:**
```javascript
interface BridgeConfig {
  autoCleanup?: boolean          // Auto cleanup after tests (default: true)
  performanceTracking?: boolean  // Enable performance tracking (default: false)
  mockDefaults?: Object         // Default component mocks (default: {})
}
```

**Example:**
```javascript
import { VitestCucumberBridge } from 'nuxt-bdd'

const bridge = new VitestCucumberBridge({
  autoCleanup: true,
  performanceTracking: true,
  mockDefaults: {
    UButton: { template: '<button><slot /></button>' }
  }
})
```

### Methods

#### registerStep()

Register a step definition with the bridge.

```javascript
registerStep(type: string, pattern: string, handler: Function, options?: Object): void
```

**Parameters:**
- `type`: Step type ('given', 'when', 'then')
- `pattern`: Gherkin pattern regex
- `handler`: Step handler function
- `options`: Additional options (description, category, etc.)

**Example:**
```javascript
bridge.registerStep('given', 'I am on the {string} page', async (pageName) => {
  // Implementation
}, { 
  description: 'Navigate to a specific page',
  category: 'navigation' 
})
```

#### mountComponent()

Enhanced Vue component mounting with BDD context integration.

```javascript
mountComponent(config: ComponentMountConfig): Promise<VueWrapper>
```

**ComponentMountConfig Interface:**
```javascript
interface ComponentMountConfig {
  component: Object    // Vue component to mount
  props?: Object      // Component props
  stubs?: Object      // Component stubs
  global?: Object     // Global test configuration
}
```

**Example:**
```javascript
const wrapper = await bridge.mountComponent({
  component: MyComponent,
  props: { title: 'Test' },
  stubs: { ChildComponent: true },
  global: { provide: { store: mockStore } }
})
```

#### getPerformanceMetrics()

Get current performance metrics (requires performanceTracking: true).

```javascript
getPerformanceMetrics(): PerformanceMetrics
```

**Returns:**
```javascript
interface PerformanceMetrics {
  renderTimes: number[]        // Component render times (ms)
  inputLatency: number[]       // User input response times (ms) 
  memoryUsage: MemoryUsage[]   // Memory usage snapshots
  currentMemory: number        // Current memory usage
  memoryDiff: number           // Memory difference from baseline
  totalTime: number            // Total test execution time
}
```

**Example:**
```javascript
const metrics = bridge.getPerformanceMetrics()
console.log('Average render time:', metrics.renderTimes.reduce((a, b) => a + b) / metrics.renderTimes.length)
console.log('Memory usage:', metrics.currentMemory)
```

#### trackMemory()

Track memory usage with a label.

```javascript
trackMemory(label: string): void
```

**Example:**
```javascript
bridge.trackMemory('after-component-mount')
// Later in test
bridge.trackMemory('after-user-interaction')
```

#### validateFeatureSteps()

Validate that feature file steps have corresponding step definitions.

```javascript
validateFeatureSteps(featureContent: string): ValidationResult
```

**Returns:**
```javascript
interface ValidationResult {
  isValid: boolean           // True if all steps have definitions
  missing: Step[]            // Missing step definitions
  found: StepMatch[]         // Found step matches
  totalSteps: number         // Total steps in feature
}
```

**Example:**
```javascript
const featureContent = readFileSync('tests/features/login.feature', 'utf8')
const validation = bridge.validateFeatureSteps(featureContent)

if (!validation.isValid) {
  console.log('Missing steps:', validation.missing)
}
```

#### generateStepDefinitions()

Generate step definition templates from feature file content.

```javascript
generateStepDefinitions(featureContent: string): string
```

**Example:**
```javascript
const featureContent = readFileSync('tests/features/new-feature.feature', 'utf8')
const stepDefinitions = bridge.generateStepDefinitions(featureContent)

// Write to step definitions file
writeFileSync('tests/steps/new-feature.steps.js', stepDefinitions)
```

#### getStepRegistry()

Get all registered step definitions.

```javascript
getStepRegistry(): Map<string, StepDefinitionConfig>
```

**Returns:**
```javascript
interface StepDefinitionConfig {
  pattern: string       // Gherkin pattern regex
  handler: Function     // Step handler function  
  type: string         // Step type (given|when|then)
  description: string   // Step description
}
```

**Example:**
```javascript
const registry = bridge.getStepRegistry()
for (const [key, stepDef] of registry) {
  console.log(`${stepDef.type}: ${stepDef.pattern}`)
}
```

## Helper Functions

### mountWithBDD()

Convenience function to mount Vue components with BDD context.

```javascript
mountWithBDD(component: Object, options?: Object): Promise<VueWrapper>
```

**Example:**
```javascript
import { mountWithBDD } from 'nuxt-bdd'
import MyComponent from '~/components/MyComponent.vue'

const wrapper = await mountWithBDD(MyComponent, {
  props: { data: testData },
  stubs: { ComplexChild: true }
})
```

### registerGiven(), registerWhen(), registerThen()

Convenience functions to register step definitions.

```javascript
registerGiven(pattern: string, handler: Function, options?: Object): void
registerWhen(pattern: string, handler: Function, options?: Object): void  
registerThen(pattern: string, handler: Function, options?: Object): void
```

**Example:**
```javascript
import { registerGiven, registerWhen, registerThen } from 'nuxt-bdd'

registerGiven('I am logged in as {string}', async (userType) => {
  // Implementation
})

registerWhen('I click the {string} button', async (buttonName) => {
  // Implementation  
})

registerThen('I should see {string}', (expectedText) => {
  // Implementation
})
```

### BDD Context Functions

#### getBDDContext()

Get the current BDD context.

```javascript
getBDDContext(): BDDContext
```

**Returns:**
```javascript
interface BDDContext {
  wrapper: VueWrapper | null  // Current mounted component
  state: Object              // Shared test state
  mocks: Object              // Mock functions
  performance: Object        // Performance data
}
```

#### setBDDState() / getBDDState()

Manage shared state across step definitions.

```javascript
setBDDState(key: string, value: any): void
getBDDState(key: string): any
```

**Example:**
```javascript
import { setBDDState, getBDDState } from 'nuxt-bdd'

// In one step
setBDDState('userInput', 'test data')

// In another step
const input = getBDDState('userInput')
expect(input).toBe('test data')
```

## Type Definitions

### BDDContext

```javascript
interface BDDContext {
  wrapper: VueWrapper | null
  state: { [key: string]: any }
  mocks: { [key: string]: any }
  performance: { [key: string]: any }
}
```

### StepDefinitionConfig

```javascript
interface StepDefinitionConfig {
  pattern: string
  handler: Function
  type: 'given' | 'when' | 'then'
  description: string
  category?: string
  timeout?: number
}
```

### ComponentMountConfig

```javascript
interface ComponentMountConfig {
  component: Object
  props?: { [key: string]: any }
  stubs?: { [key: string]: any }
  global?: {
    plugins?: any[]
    stubs?: { [key: string]: any }
    provide?: { [key: string]: any }
    mocks?: { [key: string]: any }
  }
}
```

### PerformanceMetrics

```javascript
interface PerformanceMetrics {
  renderTimes: number[]
  inputLatency: number[]
  memoryUsage: MemoryUsage[]
  currentMemory: number
  memoryDiff: number
  totalTime: number
}

interface MemoryUsage {
  label: string
  usage: number
  timestamp: number
  diff: number
}
```

## Constants

### Default Component Stubs

The bridge provides default stubs for common Nuxt UI components:

```javascript
const DEFAULT_STUBS = {
  MonacoEditor: {
    template: '<textarea v-model="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" class="w-full h-full p-4" />',
    props: ['modelValue', 'lang', 'options'],
    emits: ['update:modelValue']
  },
  UButton: { 
    template: '<button @click="$emit(\'click\')" v-bind="$attrs"><slot /></button>' 
  },
  UBadge: { 
    template: '<span class="badge" v-bind="$attrs"><slot /></span>' 
  },
  UModal: { 
    template: '<div v-if="modelValue" class="modal"><slot /></div>',
    props: ['modelValue'],
    emits: ['update:modelValue']
  },
  UCard: { 
    template: '<div class="card"><slot name="header" /><slot /><slot name="footer" /></div>'
  }
}
```

## Error Handling

The bridge provides detailed error messages for common issues:

- **Invalid step type**: Thrown when registering steps with invalid types
- **Missing step definitions**: Reported during feature validation
- **Mount failures**: Detailed component mounting error messages
- **Pattern conflicts**: Warnings when step patterns overlap

## Performance Considerations

- Enable performance tracking only during performance testing
- Use memory tracking sparingly in production tests
- Consider stub complexity impact on test execution time
- Clean up components properly to prevent memory leaks

## Advanced Usage

### Custom Bridge Configuration

```javascript
class CustomBridge extends VitestCucumberBridge {
  constructor() {
    super({
      performanceTracking: true,
      mockDefaults: {
        // Custom defaults
      }
    })
  }
  
  // Override methods for custom behavior
  async mountComponent(config) {
    // Custom mounting logic
    return super.mountComponent(config)
  }
}
```

### Pattern Matching

The bridge supports advanced Gherkin pattern matching:

```javascript
// Parameter extraction
'I enter {string} in the {string} field'
'I wait for {int} seconds'
'The value should be {float}'

// Optional parameters  
'I (?:click|press) the {string} button'

// Alternative patterns
'I should see (?:a|the) {string} message'
```