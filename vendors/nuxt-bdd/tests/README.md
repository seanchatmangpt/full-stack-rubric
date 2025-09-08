# nuxt-bdd Test Suite

Comprehensive test suite for the nuxt-bdd library, featuring unit tests, integration tests, BDD self-testing, performance benchmarks, and compatibility testing.

## 🧪 Test Categories

### Unit Tests (`unit/`)
- **vitest-cucumber-bridge.test.js** - Core functionality testing
- Tests all public APIs, error handling, and edge cases
- Comprehensive coverage of the main bridge class

### Integration Tests (`integration/`)
- **nuxt-integration.test.js** - Real Nuxt project integration
- Tests library behavior in actual Nuxt applications
- End-to-end BDD workflow validation

### BDD Self-Testing (`bdd/`)
- **library-self-test.feature** - Gherkin feature file
- **library-self-test.steps.js** - Step definitions
- The ultimate meta-test: using BDD to test the BDD library itself

### Performance Benchmarks (`performance/`)
- **benchmark-suite.test.js** - Comprehensive performance testing
- Initialization, mounting, validation performance
- Memory usage tracking and leak detection
- Stress testing with large datasets

### Compatibility Tests (`compatibility/`)
- **node-versions.test.js** - Node.js version compatibility
- Cross-platform testing
- Feature detection and graceful degradation

### Example Scenarios (`examples/`)
- **example-project.test.js** - Real-world usage scenarios
- E-commerce, authentication, and shopping cart examples
- Complex integration workflows

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run specific test categories
pnpm test:unit          # Unit tests only
pnpm test:integration   # Integration tests only  
pnpm test:bdd          # BDD self-tests only
pnpm test:performance  # Performance benchmarks only
pnpm test:compatibility # Compatibility tests only
pnpm test:examples     # Example scenarios only
```

## 📊 Test Reports

```bash
# Generate coverage report
pnpm test:coverage

# View coverage in browser
pnpm coverage:view

# Run with UI
pnpm test:ui

# Run performance benchmarks
pnpm test:benchmark

# Generate CI-friendly reports
pnpm test:ci
```

## 🎯 Test Features

### Performance Monitoring
- Real-time performance tracking
- Memory leak detection
- Regression analysis
- Baseline establishment

### BDD Self-Testing
- Meta-testing approach
- Feature validation
- Step generation testing
- Parameter extraction validation

### Real-World Scenarios  
- E-commerce workflows
- User authentication
- Shopping cart management
- Complex component interactions

### Compatibility Testing
- Node.js version support (14+)
- Cross-platform compatibility
- Graceful feature degradation
- Environment detection

## 📈 Coverage Goals

| Category | Target Coverage |
|----------|----------------|
| Statements | 85%+ |
| Branches | 80%+ |
| Functions | 85%+ |
| Lines | 85%+ |

## 🔧 Configuration

### Test Environment
- **Framework**: Vitest
- **DOM**: jsdom
- **Test Utils**: @vue/test-utils
- **BDD Integration**: @amiceli/vitest-cucumber

### Performance Thresholds
- Bridge initialization: < 10ms
- Step registration: < 1ms  
- Component mounting: < 50ms
- Feature validation: < 100ms

### Memory Limits
- Per test memory increase: < 10MB
- Total suite memory increase: < 50MB
- Memory leak detection: Active

## 🧩 Test Architecture

```
tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
├── bdd/              # BDD self-testing
├── performance/      # Performance benchmarks  
├── compatibility/    # Node.js compatibility
├── examples/         # Real-world scenarios
├── setup/            # Test configuration
│   ├── global-setup.js
│   └── performance-setup.js
├── vitest.config.js  # Vitest configuration
└── package.json      # Test dependencies
```

## 🎪 Advanced Features

### Memory Leak Detection
```javascript
import { memoryLeakDetector } from './setup/performance-setup.js'

// Sample memory usage
memoryLeakDetector.sample('test-start')
// ... run tests ...
memoryLeakDetector.sample('test-end')

// Check for leaks
const leak = memoryLeakDetector.detectLeak()
if (leak.hasLeak) {
  console.warn('Memory leak detected!')
}
```

### Performance Profiling
```javascript
import { perfHelpers } from './setup/performance-setup.js'

const { result, measurement } = perfHelpers.measure('my-operation', () => {
  // Your code here
})

expect(measurement).toBePerformant({ 
  maxTime: 50, 
  maxMemory: 1024 * 1024 
})
```

### Regression Detection
```javascript
// Automatically tracks performance baselines
const regression = perfHelpers.checkRegression('bridge-init', duration, memory)

if (regression.hasRegression) {
  console.warn('Performance regression detected!')
}
```

## 🎨 Custom Matchers

### Performance Matchers
```javascript
expect(measurement).toBePerformant(threshold)
expect(detector).toHaveNoMemoryLeak()
expect(operation).toHaveNoRegression(measurement)
```

### BDD Matchers
- Feature validation matchers
- Step definition matchers
- Component interaction matchers

## 🐛 Debugging

```bash
# Debug specific tests
pnpm test:debug unit/vitest-cucumber-bridge.test.js

# Run tests with verbose output
pnpm test -- --reporter=verbose

# Watch mode for development
pnpm test:watch

# UI mode for interactive testing
pnpm test:ui
```

## 📝 Writing New Tests

### Unit Test Template
```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { VitestCucumberBridge } from '../src/bdd/vitest-cucumber-bridge.js'

describe('My Feature', () => {
  let bridge

  beforeEach(() => {
    bridge = new VitestCucumberBridge()
  })

  it('should do something', () => {
    // Arrange
    const input = 'test'
    
    // Act  
    const result = bridge.doSomething(input)
    
    // Assert
    expect(result).toBe('expected')
  })
})
```

### BDD Test Template  
```javascript
import { registerGiven, registerWhen, registerThen } from '../src/bdd/vitest-cucumber-bridge.js'

registerGiven('I have {string}', function(input) {
  this.testData = input
})

registerWhen('I do something', function() {
  this.result = doSomething(this.testData)
})

registerThen('I should get {string}', function(expected) {
  expect(this.result).toBe(expected)
})
```

## 🤝 Contributing

1. Add tests for new features
2. Ensure all tests pass
3. Maintain coverage thresholds  
4. Add performance benchmarks for new functionality
5. Update documentation

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [@vue/test-utils Guide](https://test-utils.vuejs.org/)
- [@amiceli/vitest-cucumber](https://github.com/amiceli/vitest-cucumber)
- [Performance Testing Best Practices](./docs/performance-testing.md)
- [BDD Testing Guidelines](./docs/bdd-guidelines.md)

---

**Note**: This test suite serves as both validation for the nuxt-bdd library and as comprehensive examples of how to use the library in real-world scenarios.