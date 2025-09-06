# Typing Tutor Test Suite

A comprehensive testing framework for the typing tutor application, covering unit tests, integration tests, end-to-end tests, performance benchmarks, and edge case scenarios.

## Overview

This test suite validates real functionality without mocked components or fake data testing. It includes:

- **Unit Tests**: Core typing algorithms (WPM, accuracy calculations)
- **Integration Tests**: Monaco Editor integration, real-time feedback, session persistence
- **E2E Tests**: Responsive design, user experience flows, edge cases
- **Performance Tests**: Latency benchmarks, memory usage, stress testing
- **Edge Case Tests**: Rapid typing, corrections, special characters, IME support

## Test Structure

```
tests/
├── unit/                           # Unit tests
│   └── typing-algorithms.test.ts   # WPM/accuracy calculations
├── integration/                    # Integration tests
│   ├── monaco-editor.test.ts       # Editor integration
│   ├── realtime-feedback.test.ts   # Live feedback systems
│   └── session-persistence.test.ts # Data persistence
├── e2e/                            # End-to-end tests
│   ├── responsive-design.test.ts   # Multi-device testing
│   ├── user-experience.test.ts     # Complete user journeys
│   └── edge-cases.test.ts          # Boundary conditions
├── performance/                    # Performance tests
│   └── typing-latency-benchmarks.test.ts # Speed/memory benchmarks
├── setup/                          # Test configuration
│   ├── global-setup.ts             # Global mocks and utilities
│   ├── dom-setup.ts                # DOM environment setup
│   └── performance-setup.ts        # Performance monitoring
├── vitest.config.ts                # Test runner configuration
└── README.md                       # This file
```

## Key Features

### Real Functionality Testing
- No mocked components - tests validate actual behavior
- Real typing simulations with accurate timing
- Authentic browser API interactions
- Genuine performance measurements

### Comprehensive Coverage
- **Algorithm Testing**: WPM calculations, accuracy metrics, consistency analysis
- **UI Integration**: Monaco Editor, visual feedback, responsive layouts
- **User Flows**: Onboarding, lessons, practice sessions, progress tracking
- **Edge Cases**: Rapid typing, corrections, special characters, Unicode/IME
- **Performance**: Latency benchmarks, memory usage, stress testing

### Advanced Test Capabilities
- **Device Simulation**: Mobile, tablet, desktop responsive testing
- **Input Methods**: Keyboard, touch, IME (Chinese/Japanese), copy-paste
- **Performance Monitoring**: Real-time latency tracking, memory profiling
- **Edge Case Handling**: Boundary conditions, error recovery, stress scenarios

## Running Tests

### Prerequisites
```bash
# Install dependencies
pnpm install

# Install testing dependencies
pnpm add -D vitest @vue/test-utils jsdom @vitejs/plugin-vue
```

### Basic Commands
```bash
# Run all tests
pnpm test

# Run specific test category
pnpm test unit
pnpm test integration
pnpm test e2e
pnpm test performance

# Run with coverage
pnpm test --coverage

# Run in watch mode
pnpm test --watch

# Run specific test file
pnpm test typing-algorithms.test.ts
```

### Performance Benchmarking
```bash
# Run performance benchmarks
pnpm test performance --reporter=verbose

# Run with memory profiling
pnpm test performance --reporter=json > benchmark-results.json
```

## Test Categories

### Unit Tests (`tests/unit/`)

**Typing Algorithms** (`typing-algorithms.test.ts`)
- WPM calculation accuracy and edge cases
- Accuracy percentage calculations
- Real-time WPM during typing
- Consistency metrics (keystroke interval analysis)
- Typing burst detection
- Performance benchmarks for large datasets

**Key Test Scenarios:**
- Standard WPM calculations (90 chars/min = 18 WPM)
- Edge cases (zero time, negative values, extreme numbers)
- Real-time calculation accuracy
- Consistency scoring with keystroke timing
- Performance with 10,000+ keystroke events

### Integration Tests (`tests/integration/`)

**Monaco Editor Integration** (`monaco-editor.test.ts`)
- Complete editor initialization and cleanup
- Real-time typing validation and feedback
- Visual decorations (correct/incorrect highlighting)
- Keystroke tracking and analysis
- Session management and state persistence
- Performance under rapid typing conditions

**Real-time Feedback Systems** (`realtime-feedback.test.ts`)
- Live statistics display (WPM, accuracy, consistency)
- Error highlighting and suggestions
- Keystroke visualization and rhythm analysis
- Achievement notifications and progress indicators
- WebSocket integration for multiplayer features
- Performance optimization under high-frequency updates

**Session Persistence** (`session-persistence.test.ts`)
- LocalStorage and IndexedDB data persistence
- Session restoration across browser refreshes
- User progress tracking and analytics
- Achievement system and milestone detection
- Data export/import functionality
- Memory management for long-term usage

### End-to-End Tests (`tests/e2e/`)

**Responsive Design** (`responsive-design.test.ts`)
- Mobile device compatibility (320px - 768px)
- Tablet layout optimization (768px - 1024px)
- Desktop experience (1024px+)
- Orientation change handling
- Touch interaction support
- Accessibility features

**User Experience** (`user-experience.test.ts`)
- Complete onboarding flow for new users
- Tutorial system and guided learning
- Lesson selection and progression
- Practice mode with custom text
- Results sharing and achievement system
- Settings persistence and customization

**Edge Cases** (`edge-cases.test.ts`)
- Rapid typing (10ms keystroke intervals)
- Correction patterns and backspace handling
- Special characters (!@#$%^&*()_+-=[]{}\\|;:\'",.<>?/~`)
- Unicode and emoji support (你好世界 🌍)
- IME input methods (Chinese, Japanese, Korean)
- Copy-paste detection and handling
- Input manipulation and anomaly detection

### Performance Tests (`tests/performance/`)

**Typing Latency Benchmarks** (`typing-latency-benchmarks.test.ts`)
- Input event processing latency (<16ms target)
- Validation performance for long texts
- Rendering optimization benchmarks
- Memory usage tracking and leak detection
- Stress testing with sustained rapid typing
- Performance regression detection

**Performance Targets:**
- Single keystroke latency: <16ms (60fps)
- Rapid typing average: <10ms per keystroke
- 95th percentile latency: <20ms
- Validation time for 1000 chars: <20ms
- Memory usage: <50MB growth per session

## Test Configuration

### Vitest Configuration (`vitest.config.ts`)
- JSDOM environment for browser simulation
- Vue component testing support
- Coverage reporting (80% threshold)
- Performance benchmarking
- Parallel test execution
- Custom reporter configuration

### Setup Files (`tests/setup/`)

**Global Setup** (`global-setup.ts`)
- Browser API mocks (localStorage, clipboard, notifications)
- Vue Test Utils configuration
- Global utilities and helpers
- Mock time control for consistent testing

**DOM Setup** (`dom-setup.ts`)
- Enhanced JSDOM with typing-specific features
- Input element selection API mocking
- Keyboard event simulation
- IME and composition event support
- Clipboard API with paste event handling

**Performance Setup** (`performance-setup.ts`)
- Performance API mocking and monitoring
- Memory usage tracking
- Timing utilities and benchmarking tools
- Animation frame control
- Performance assertion helpers

## Test Utilities

### Typing Simulation
```typescript
// Simulate rapid typing
await simulateRapidTyping('Hello World', 50) // 50ms intervals

// Simulate corrections
simulateCorrections(5) // 5 backspace operations

// Simulate special character input
simulateSpecialCharInput(['!', '@', '#', '$'])
```

### Performance Testing
```typescript
// Benchmark function performance
const result = benchmark.time(() => calculateWPM(session), 100)
expect(result.average).toBeLessThan(5) // <5ms average

// Memory usage testing
const { memoryUsed } = benchmark.measureMemory(() => processLargeText())
expect(memoryUsed).toBeLessThan(10_000_000) // <10MB
```

### Device Simulation
```typescript
// Test mobile device
setViewport(375, 667) // iPhone SE
wrapper.vm.handleResize()

// Test orientation change
setViewport(667, 375) // Landscape
wrapper.vm.handleOrientationChange()
```

## Coverage Reports

The test suite maintains high coverage standards:
- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

Coverage reports are generated in multiple formats:
- Terminal output for quick feedback
- HTML reports for detailed analysis
- JSON/LCOV for CI/CD integration

## Continuous Integration

### GitHub Actions Integration
```yaml
- name: Run Tests
  run: pnpm test --coverage --reporter=json

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/coverage-final.json
```

### Performance Monitoring
- Automated performance regression detection
- Benchmark result tracking over time
- Memory leak detection in CI pipeline
- Performance budgets and alerts

## Best Practices

### Test Writing Guidelines
1. **Test Real Behavior**: No mocked components, validate actual functionality
2. **Performance Focus**: Include timing and memory assertions
3. **Edge Case Coverage**: Test boundary conditions and error states
4. **Device Compatibility**: Test across mobile, tablet, and desktop
5. **Accessibility**: Validate keyboard navigation and screen reader support

### Performance Testing
1. **Baseline Establishment**: Set performance baselines for regression detection
2. **Stress Testing**: Validate behavior under extreme conditions
3. **Memory Management**: Track memory usage and detect leaks
4. **Latency Monitoring**: Ensure responsive user experience

### Maintenance
1. **Regular Updates**: Keep tests current with feature changes
2. **Performance Review**: Monitor and optimize test execution time
3. **Coverage Analysis**: Maintain high coverage without redundant tests
4. **Documentation**: Keep test documentation up-to-date

## Troubleshooting

### Common Issues

**JSDOM Limitations**
```typescript
// Some browser APIs need mocking
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn() }
})
```

**Timing-Sensitive Tests**
```typescript
// Use fake timers for consistent timing
vi.useFakeTimers()
vi.advanceTimersByTime(1000)
vi.useRealTimers()
```

**Memory Leaks in Tests**
```typescript
// Cleanup after tests
afterEach(() => {
  vi.clearAllMocks()
  vi.clearAllTimers()
})
```

### Performance Issues
- Use `vi.mock()` for expensive operations in non-performance tests
- Batch DOM operations in test utilities
- Clean up event listeners and timers
- Limit test data size for faster execution

## Contributing

When adding new tests:
1. Follow the existing test structure and naming conventions
2. Include both positive and negative test cases
3. Add performance assertions where appropriate
4. Test edge cases and error conditions
5. Update documentation for new test categories
6. Ensure tests are deterministic and reliable

For performance tests:
1. Establish clear performance targets
2. Test on multiple device profiles
3. Include memory usage validation
4. Test stress scenarios and recovery
5. Document performance expectations

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [JSDOM API](https://github.com/jsdom/jsdom)
- [Performance Testing Guide](https://web.dev/performance-testing/)
- [Web APIs Testing](https://developer.mozilla.org/en-US/docs/Web/API)