# Performance Testing Suite

## Overview

This performance testing suite provides comprehensive testing for typing tutor application performance, covering latency, memory usage, bundle size, and concurrent user scenarios using Vitest benchmarking features.

## Test Structure

```
tests/performance/
├── app-performance.test.js      # Main performance test suite
├── app-performance.bench.js     # Vitest benchmark tests
└── README.md                    # This file

tests/utils/
└── performance-helpers.js       # Performance testing utilities

tests/setup/
├── performance-setup.js         # Performance environment setup
└── dom-setup.js                # DOM environment setup
```

## Performance Thresholds

The tests validate against these performance thresholds:

- **Typing Latency**: ≤16ms (60fps target)
- **Bundle Size**: ≤500KB total
- **Memory Leak**: ≤10MB growth per session
- **Concurrent Users**: 50+ simultaneous users
- **Render Time**: ≤100ms for typing feedback
- **GC Pressure**: ≤20 cycles per minute

## Test Categories

### 1. Typing Latency and Responsiveness
- **Input Response Time**: Validates typing input responds within 16ms threshold
- **Keystroke Sequences**: Tests rapid keystroke handling without lag
- **Benchmark Simulation**: Measures actual response time performance

**Key Metrics:**
- Average latency
- Maximum latency  
- P95 latency
- Keystroke interval consistency

### 2. Bundle Size and Load Performance
- **Bundle Size Limits**: Validates total and individual chunk sizes
- **Resource Load Times**: Tests critical resource loading performance
- **Initialization Time**: Measures application startup performance

**Key Metrics:**
- Total bundle size (app.js + vendor.js + chunks + CSS)
- First Contentful Paint (FCP)
- Time to Interactive (TTI)
- Asset loading times

### 3. Memory Usage During Typing Sessions
- **Memory Leak Detection**: Tests for memory growth during extended sessions
- **Large Document Handling**: Validates performance with large text documents
- **Memory Allocation**: Benchmarks memory allocation during typing operations

**Key Metrics:**
- Memory growth per session
- Peak memory usage
- Memory allocation time
- Garbage collection frequency

### 4. Concurrent User Scenarios
- **Multiple Sessions**: Tests simultaneous typing sessions
- **Load Testing**: Validates performance under increasing user load
- **Event Processing**: Benchmarks concurrent event handling

**Key Metrics:**
- Sessions per second
- Response time under load
- Memory usage scaling
- Event processing latency

### 5. Advanced Performance Metrics
- **Frame Rate Stability**: Tests UI frame rate during typing
- **Garbage Collection**: Monitors GC patterns and frequency
- **Metrics Overhead**: Validates performance monitoring impact

**Key Metrics:**
- Frame rate consistency
- GC event frequency
- Metrics collection overhead
- UI responsiveness

## Running Tests

### Standard Performance Tests
```bash
# Run all performance tests
pnpm run test tests/performance/app-performance.test.js

# Run with verbose output
pnpm run test tests/performance/app-performance.test.js --reporter=verbose

# Run specific test category
pnpm run test tests/performance/app-performance.test.js -t "Typing Latency"
```

### Benchmark Tests
```bash
# Run Vitest benchmarks
npx vitest bench tests/performance/app-performance.bench.js

# Run benchmarks with specific duration
npx vitest bench tests/performance/app-performance.bench.js --benchmark.time=2000
```

### Performance Analysis
```bash
# Run tests with coverage
pnpm run test tests/performance/app-performance.test.js --coverage

# Generate performance report
pnpm run test tests/performance/app-performance.test.js --reporter=html
```

## Test Results Interpretation

### Successful Test Run
```
✓ Typing Latency - Avg: 12.34ms, Max: 23.45ms, P95: 18.67ms
✓ Bundle sizes: { app.js: 220KB, vendor.js: 160KB, chunks: 60KB, css: 15KB }
✓ Total bundle size: 455KB
✓ Memory usage - Initial: 15.23MB, Final: 18.45MB, Growth: 3.22MB
✓ Concurrent sessions - Count: 5, Total time: 1234.56ms
✓ Frame rate test completed, avg FPS: 58
```

### Performance Indicators

**🟢 Good Performance:**
- Typing latency < 16ms average
- Bundle size < 500KB
- Memory growth < 5MB per session
- Frame rate > 55fps

**🟡 Acceptable Performance:**
- Typing latency < 32ms average
- Bundle size < 750KB
- Memory growth < 10MB per session  
- Frame rate > 30fps

**🔴 Poor Performance:**
- Typing latency > 32ms average
- Bundle size > 750KB
- Memory growth > 10MB per session
- Frame rate < 30fps

## Performance Optimization Tips

### Reducing Typing Latency
- Debounce input events appropriately
- Use `requestAnimationFrame` for DOM updates
- Minimize synchronous processing in event handlers
- Implement efficient text rendering algorithms

### Bundle Size Optimization  
- Code splitting for non-critical features
- Tree shaking unused dependencies
- Compress assets and enable gzip
- Lazy load Monaco Editor and large components

### Memory Management
- Clean up event listeners and observers
- Use object pooling for frequent allocations
- Implement proper component lifecycle management
- Monitor for memory leaks in development

### Concurrent Performance
- Use Web Workers for CPU-intensive tasks
- Implement efficient state management
- Optimize network requests and caching
- Use virtual scrolling for large datasets

## Troubleshooting

### Common Issues

**Tests Timing Out:**
```javascript
// Increase test timeout in vitest.config.js
export default defineConfig({
  test: {
    testTimeout: 60000 // 1 minute
  }
})
```

**Memory Issues:**
```bash
# Run with increased memory
node --max-old-space-size=4096 node_modules/.bin/vitest
```

**JSDOM Performance:**
```javascript
// Use lighter DOM setup for faster tests
const dom = new JSDOM(minimalHTML, {
  pretendToBeVisual: true,
  resources: 'usable'
})
```

### Performance Debugging

1. **Profile Tests**: Use browser dev tools to profile test execution
2. **Memory Analysis**: Enable memory profiling in test setup  
3. **Bottleneck Identification**: Add timing measurements around critical sections
4. **Load Testing**: Gradually increase concurrent users to find limits

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run Performance Tests
  run: |
    pnpm run test tests/performance/app-performance.test.js
    npx vitest bench tests/performance/app-performance.bench.js
    
- name: Performance Regression Check
  run: |
    # Compare against baseline metrics
    node scripts/performance-regression-check.js
```

### Performance Budgets
Set up automated performance budget enforcement:

```javascript
// In CI/CD pipeline
const results = await runPerformanceTests()
if (results.bundleSize > BUNDLE_SIZE_LIMIT) {
  throw new Error('Bundle size exceeded limit')
}
if (results.avgLatency > LATENCY_LIMIT) {
  throw new Error('Typing latency exceeded limit')
}
```

## Contributing

When adding new performance tests:

1. Follow the existing test structure and naming conventions
2. Include appropriate thresholds and assertions  
3. Add detailed console logging for metrics
4. Update this README with new test descriptions
5. Ensure tests are reliable and not flaky
6. Consider test execution time vs. accuracy trade-offs

## Performance Monitoring

### Real-time Monitoring
- Use Performance Observer API in production
- Implement Web Vitals tracking
- Monitor typing latency continuously  
- Track memory usage patterns

### Analytics Integration
- Send performance metrics to analytics service
- Create dashboards for performance trends
- Set up alerting for performance regressions
- Monitor user experience metrics

This performance testing suite ensures the typing tutor application maintains excellent performance characteristics across all key metrics and usage scenarios.