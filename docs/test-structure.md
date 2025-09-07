# Test Structure Documentation

## Overview

The project uses Vitest with Cucumber BDD for comprehensive testing of the typing tutor application. The test infrastructure is fully configured and validated.

## Directory Structure

```
tests/
├── features/              # Gherkin feature files
│   ├── typing-tutor.feature
│   └── performance.feature
├── steps/                 # Step definitions
│   ├── typing-tutor.steps.js
│   └── performance.steps.js
├── setup/                 # Test setup files
│   ├── dom-setup.js      # JSDOM and DOM API mocks
│   ├── global-setup.js   # Global test environment
│   └── performance-setup.js
├── utils/                 # Test utilities
│   └── typing-simulator.js
├── unit/                  # Unit tests
├── e2e/                   # End-to-end tests
├── performance/           # Performance tests
├── integration/           # Integration tests
├── simple.test.js         # Basic validation test
├── bdd-validation.test.js # BDD infrastructure validation
└── vitest.config.js       # Vitest configuration
```

## Test Commands

- `pnpm test` - Run all tests
- `pnpm test:bdd` - Run BDD step definition tests  
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage

## Configuration

### Vitest Config (`vitest.config.js`)
- **Environment**: JSDOM for browser-like environment
- **Setup Files**: DOM setup and global mocks
- **Includes**: `.test.js`, `.spec.js`, `.steps.js` files
- **Timeouts**: 15 seconds for test and hook timeouts
- **Aliases**: Path aliases for imports (`@`, `~`, `tests`, `app`, `server`)

### Test Environment Setup

#### Global Setup (`tests/setup/global-setup.js`)
- **Browser APIs**: localStorage, sessionStorage, performance
- **File APIs**: File, Blob constructors
- **Observers**: ResizeObserver, IntersectionObserver, MutationObserver
- **Animation**: requestAnimationFrame, requestIdleCallback
- **Fetch API**: Mocked fetch with default responses
- **Console**: Mocked console methods to reduce test noise

#### DOM Setup (`tests/setup/dom-setup.js`)
- **JSDOM**: Full DOM environment with typing features
- **Input Elements**: Selection API, range methods
- **Event Handling**: Enhanced event dispatching
- **Keyboard Events**: Full keyboard event support with modifiers
- **Clipboard**: Paste event simulation
- **IME Support**: Input Method Editor events

### Vue Test Utils Configuration
- **Global Stubs**: Nuxt components (NuxtLink, NuxtPage, NuxtLayout)
- **UI Components**: UButton, UInput, UBadge, UCard, UModal
- **Router Mocks**: $route and $router mocks
- **I18n**: Basic translation mock

## BDD Features

### Typing Tutor Feature (`tests/features/typing-tutor.feature`)
**Scenarios covered:**
- Basic typing functionality with real-time feedback
- WPM (Words Per Minute) calculation accuracy
- Accuracy tracking with error counting
- Progress tracking and visualization
- Exercise completion modal
- Rapid typing performance testing
- Error correction functionality
- Exercise switching
- Reset functionality

### Performance Feature (`tests/features/performance.feature`)
**Scenarios covered:**
- Fast typing response time (16ms target)
- Memory usage during long sessions
- Large text handling efficiency
- Rapid correction processing

## Step Definitions

### Typing Tutor Steps (`tests/steps/typing-tutor.steps.js`)
**Given Steps:**
- Page navigation and initial state verification
- Practice text visibility validation
- Statistics display verification
- Custom practice text setup

**When Steps:**
- Typing simulation with various speeds and accuracy
- Error injection and correction
- Button clicking and interactions
- Exercise completion

**Then Steps:**
- Character highlighting validation
- Statistics calculation verification
- Progress tracking validation
- Modal display verification
- Component state validation

### Performance Steps (`tests/steps/performance.steps.js`)
**Performance monitoring:**
- Response time measurement
- Memory leak detection
- UI responsiveness validation
- Correction processing efficiency

## Test Utilities

### Typing Simulator (`tests/utils/typing-simulator.js`)
- **simulateTyping**: Realistic typing with configurable delays and errors
- **simulateRapidTyping**: High-speed typing simulation
- **simulateCorrections**: Backspace and correction simulation
- **Event Generation**: Keyboard, input, and composition events

### DOM Utils (exported from `tests/setup/dom-setup.js`)
- **Element Creation**: Mock input and textarea elements
- **Event Simulation**: Typing, paste, keyboard events
- **Dimension Mocking**: getBoundingClientRect, element sizes
- **Selection API**: Text selection and range operations

## Validation Results

The BDD validation test (`tests/bdd-validation.test.js`) confirms:
- ✅ Feature files exist and are readable
- ✅ Step definition files are properly structured
- ✅ JSDOM environment is correctly configured
- ✅ Vue Test Utils integration works
- ✅ Component mounting and testing works
- ✅ Test utilities are available
- ✅ Dependencies are properly installed
- ✅ Test commands are configured

## Running Tests

### Basic Test Run
```bash
pnpm test --run tests/simple.test.js
pnpm test --run tests/bdd-validation.test.js
```

### BDD Infrastructure Validation
```bash
pnpm test:bdd --run
```

### Watch Mode for Development
```bash
pnpm test:watch
```

### Coverage Analysis
```bash
pnpm test:coverage
```

## Memory and Performance Tracking

The test infrastructure is integrated with Claude Flow hooks for:
- **Pre-task**: Environment setup and validation
- **Post-edit**: File change tracking and memory storage
- **Notify**: Test completion and status reporting
- **Session Management**: State persistence across test runs

## Best Practices

1. **Component Testing**: Always mock UI components (UButton, UModal, etc.)
2. **Event Simulation**: Use provided utilities for realistic user interactions
3. **Memory Management**: Properly unmount components in afterEach hooks
4. **Console Management**: Mock console methods to prevent test noise
5. **Time Control**: Use Vi's fake timers for time-dependent tests
6. **Error Handling**: Mock console.error to prevent expected error noise

## Troubleshooting

### Common Issues
1. **Component Import Errors**: Ensure components exist in expected locations
2. **DOM API Missing**: Check that global-setup.js is loaded
3. **Mock Failures**: Verify Vi mocks are properly restored after tests
4. **Timeout Issues**: Increase timeout values for complex operations

### Debug Mode
Add `console.log` statements in step definitions and use:
```bash
pnpm test --run --reporter=verbose
```

This test infrastructure provides comprehensive coverage for BDD testing with full typing simulation capabilities and performance monitoring.