# Performance Testing & Load Testing

## Performance Testing Strategy

Performance testing ensures your application meets user expectations under various load conditions.

### Types of Performance Testing

1. **Load Testing**: Normal expected load
2. **Stress Testing**: Beyond normal capacity
3. **Spike Testing**: Sudden load increases  
4. **Volume Testing**: Large amounts of data
5. **Endurance Testing**: Extended periods
6. **Capacity Testing**: Maximum user load

## Load Testing with K6

### Basic Load Test Setup

```javascript
// tests/performance/basic-load.test.js
import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const responseTime = new Trend('response_time')

export let options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 10 },   // Stay at 10 users
    { duration: '1m', target: 20 },   // Ramp up to 20 users
    { duration: '3m', target: 20 },   // Stay at 20 users
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],     // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],       // Error rate under 1%
    errors: ['rate<0.1'],                 // Custom error rate under 10%
    checks: ['rate>0.9'],                 // Check success rate over 90%
  }
}

export default function () {
  group('Typing Session API', () => {
    // Create typing session
    const createPayload = {
      userId: `user-${__VU}-${__ITER}`,
      language: 'javascript',
      difficulty: 'medium'
    }

    const createResponse = http.post(
      'http://localhost:3000/api/sessions',
      JSON.stringify(createPayload),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'create-session' }
      }
    )

    const createSuccess = check(createResponse, {
      'session created': (r) => r.status === 201,
      'has session id': (r) => JSON.parse(r.body).id !== undefined,
      'response time < 200ms': (r) => r.timings.duration < 200
    })

    errorRate.add(!createSuccess)
    responseTime.add(createResponse.timings.duration)

    if (createSuccess) {
      const session = JSON.parse(createResponse.body)
      
      // Simulate typing activity
      for (let i = 0; i < 10; i++) {
        const metricsPayload = {
          wpm: 30 + Math.random() * 20,
          accuracy: 0.85 + Math.random() * 0.15,
          charactersTyped: i * 15 + Math.floor(Math.random() * 10),
          errorsCount: Math.floor(Math.random() * 3)
        }

        const metricsResponse = http.put(
          `http://localhost:3000/api/sessions/${session.id}/metrics`,
          JSON.stringify(metricsPayload),
          {
            headers: { 'Content-Type': 'application/json' },
            tags: { name: 'update-metrics' }
          }
        )

        check(metricsResponse, {
          'metrics updated': (r) => r.status === 200,
          'response time < 100ms': (r) => r.timings.duration < 100
        })

        sleep(0.5) // 500ms between updates
      }

      // Complete session
      const completeResponse = http.put(
        `http://localhost:3000/api/sessions/${session.id}/complete`,
        JSON.stringify({ finalWPM: 45, finalAccuracy: 0.92 }),
        {
          headers: { 'Content-Type': 'application/json' },
          tags: { name: 'complete-session' }
        }
      )

      check(completeResponse, {
        'session completed': (r) => r.status === 200,
        'has completion data': (r) => JSON.parse(r.body).completedAt !== undefined
      })
    }
  })

  sleep(1)
}

export function handleSummary(data) {
  return {
    'performance-report.html': htmlReport(data),
    'performance-metrics.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  }
}

function htmlReport(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>K6 Performance Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .metric { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
    .pass { background-color: #d4edda; }
    .fail { background-color: #f8d7da; }
  </style>
</head>
<body>
  <h1>Performance Test Results</h1>
  <div class="metric ${data.metrics.http_req_duration.values.p95 < 500 ? 'pass' : 'fail'}">
    <h3>Response Time (95th percentile)</h3>
    <p>${data.metrics.http_req_duration.values.p95.toFixed(2)}ms (Target: <500ms)</p>
  </div>
  <div class="metric ${data.metrics.http_req_failed.values.rate < 0.01 ? 'pass' : 'fail'}">
    <h3>Error Rate</h3>
    <p>${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}% (Target: <1%)</p>
  </div>
  <div class="metric">
    <h3>Total Requests</h3>
    <p>${data.metrics.http_reqs.values.count}</p>
  </div>
</body>
</html>
  `
}
```

### Stress Testing

```javascript
// tests/performance/stress.test.js
import http from 'k6/http'
import { check, group } from 'k6'

export let options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to normal load
    { duration: '5m', target: 100 },   // Stay at normal load
    { duration: '2m', target: 200 },   // Ramp up to high load
    { duration: '5m', target: 200 },   // Stay at high load
    { duration: '2m', target: 300 },   // Push beyond capacity
    { duration: '5m', target: 300 },   // Stay at stress level
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    // Relaxed thresholds for stress testing
    http_req_duration: ['p(95)<2000'],  // Allow higher response times
    http_req_failed: ['rate<0.1'],      // Allow higher error rates
  }
}

export default function () {
  const response = http.post('http://localhost:3000/api/sessions', JSON.stringify({
    userId: `stress-user-${__VU}`,
    language: 'javascript',
    difficulty: 'hard'
  }), {
    headers: { 'Content-Type': 'application/json' }
  })

  // Focus on system not crashing rather than performance
  check(response, {
    'system responsive': (r) => r.status < 500, // Allow 4xx errors
    'not timeout': (r) => r.timings.duration < 10000 // 10 second timeout
  })
}
```

### Spike Testing

```javascript
// tests/performance/spike.test.js
export let options = {
  stages: [
    { duration: '10s', target: 10 },   // Normal load
    { duration: '30s', target: 10 },   // Stay normal
    { duration: '10s', target: 100 },  // Sudden spike
    { duration: '30s', target: 100 },  // Sustain spike
    { duration: '10s', target: 10 },   // Drop back to normal
    { duration: '30s', target: 10 },   // Recovery period
  ],
  thresholds: {
    http_req_duration: {
      // Different thresholds for different periods
      'p(95)<500': ['rate>0.8'], // 80% of time under 500ms
      'p(95)<2000': [],          // Always under 2s
    },
  }
}

export default function () {
  // Same test logic as basic load test
  // Focus on system recovery after spike
}
```

## Database Performance Testing

```javascript
// tests/performance/database-load.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { DatabaseService } from '../../server/services/database.js'
import { performance } from 'perf_hooks'

describe('Database Performance', () => {
  let db
  const CONCURRENT_OPERATIONS = 100
  const BATCH_SIZE = 1000

  beforeAll(async () => {
    db = new DatabaseService({
      connectionLimit: 20,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000
    })
    await db.connect()
  })

  afterAll(async () => {
    await db.disconnect()
  })

  it('should handle concurrent session creation', async () => {
    const startTime = performance.now()
    
    const promises = Array.from({ length: CONCURRENT_OPERATIONS }, (_, i) => 
      db.createSession({
        userId: `perf-user-${i}`,
        codeSnippet: 'console.log("performance test");',
        language: 'javascript'
      })
    )

    const sessions = await Promise.all(promises)
    const duration = performance.now() - startTime

    expect(sessions).toHaveLength(CONCURRENT_OPERATIONS)
    expect(duration).toBeLessThan(5000) // Under 5 seconds
    
    console.log(`Created ${CONCURRENT_OPERATIONS} sessions in ${duration.toFixed(2)}ms`)
    console.log(`Average: ${(duration / CONCURRENT_OPERATIONS).toFixed(2)}ms per session`)
  })

  it('should handle batch inserts efficiently', async () => {
    const sessions = Array.from({ length: BATCH_SIZE }, (_, i) => ({
      userId: `batch-user-${i}`,
      codeSnippet: `console.log("batch test ${i}");`,
      language: 'javascript'
    }))

    const startTime = performance.now()
    const results = await db.createSessionsBatch(sessions)
    const duration = performance.now() - startTime

    expect(results).toHaveLength(BATCH_SIZE)
    expect(duration).toBeLessThan(10000) // Under 10 seconds

    console.log(`Batch created ${BATCH_SIZE} sessions in ${duration.toFixed(2)}ms`)
    console.log(`Rate: ${(BATCH_SIZE / (duration / 1000)).toFixed(0)} sessions/second`)
  })

  it('should maintain performance under read load', async () => {
    // Create test data first
    const testSessions = await Promise.all(
      Array.from({ length: 100 }, (_, i) => 
        db.createSession({
          userId: `read-test-${i}`,
          codeSnippet: 'test code',
          language: 'javascript'
        })
      )
    )

    // Concurrent reads
    const startTime = performance.now()
    
    const readPromises = Array.from({ length: CONCURRENT_OPERATIONS }, () => {
      const randomSession = testSessions[Math.floor(Math.random() * testSessions.length)]
      return db.getSession(randomSession.id)
    })

    const results = await Promise.all(readPromises)
    const duration = performance.now() - startTime

    expect(results.filter(r => r !== null)).toHaveLength(CONCURRENT_OPERATIONS)
    expect(duration).toBeLessThan(2000) // Under 2 seconds

    console.log(`${CONCURRENT_OPERATIONS} reads in ${duration.toFixed(2)}ms`)
  })
})
```

## Frontend Performance Testing

### Lighthouse Performance Testing

```javascript
// tests/performance/lighthouse.test.js
import { describe, it, expect } from 'vitest'
import lighthouse from 'lighthouse'
import chromeLauncher from 'chrome-launcher'

describe('Lighthouse Performance Audit', () => {
  let chrome

  beforeAll(async () => {
    chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] })
  })

  afterAll(async () => {
    await chrome.kill()
  })

  it('should meet performance benchmarks', async () => {
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port
    }

    const runnerResult = await lighthouse('http://localhost:3000', options)
    const { lhr } = runnerResult

    // Performance metrics
    expect(lhr.audits['first-contentful-paint'].numericValue).toBeLessThan(2000)
    expect(lhr.audits['largest-contentful-paint'].numericValue).toBeLessThan(4000)
    expect(lhr.audits['cumulative-layout-shift'].numericValue).toBeLessThan(0.1)
    expect(lhr.audits['total-blocking-time'].numericValue).toBeLessThan(300)

    // Overall performance score
    expect(lhr.categories.performance.score).toBeGreaterThan(0.8) // 80+ score
  }, 30000)
})
```

### Memory Leak Testing

```javascript
// tests/performance/memory-leaks.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { JSDOM } from 'jsdom'
import { mount } from '@vue/test-utils'
import TypingMonacoEditor from '../../app/components/TypingMonacoEditor.vue'

describe('Memory Leak Detection', () => {
  let initialMemory
  const components = []

  beforeEach(() => {
    global.gc && global.gc()
    initialMemory = process.memoryUsage().heapUsed
  })

  afterEach(() => {
    // Cleanup all components
    components.forEach(wrapper => wrapper.unmount())
    components.length = 0
    
    global.gc && global.gc()
  })

  it('should not leak memory when creating/destroying components', () => {
    // Create and destroy components multiple times
    for (let i = 0; i < 100; i++) {
      const wrapper = mount(TypingMonacoEditor, {
        props: {
          codeSnippet: 'console.log("test");',
          language: 'javascript'
        }
      })
      
      components.push(wrapper)
      
      // Simulate user interaction
      wrapper.vm.handleKeyPress({ key: 'a' })
      wrapper.vm.updateMetrics({ wpm: 45, accuracy: 0.95 })
    }

    // Force garbage collection
    global.gc && global.gc()
    
    const finalMemory = process.memoryUsage().heapUsed
    const memoryIncrease = finalMemory - initialMemory
    
    // Memory increase should be reasonable (less than 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    
    console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)
  })

  it('should cleanup event listeners', async () => {
    const wrapper = mount(TypingMonacoEditor)
    
    // Track event listeners (simplified example)
    const listenerCount = wrapper.vm.$el.getEventListeners?.() || {}
    
    wrapper.unmount()
    
    // Verify cleanup (implementation specific)
    expect(wrapper.vm.destroyed).toBe(true)
  })
})
```

## Real User Monitoring (RUM)

```javascript
// app/plugins/performance.client.js
export default defineNuxtPlugin(() => {
  // Web Vitals tracking
  import('web-vitals').then(({ onCLS, onFCP, onFID, onLCP, onTTFB }) => {
    onCLS(console.log)
    onFCP(console.log)  
    onFID(console.log)
    onLCP(console.log)
    onTTFB(console.log)
  })

  // Custom performance tracking
  const perfObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'measure') {
        // Send to analytics
        $fetch('/api/analytics/performance', {
          method: 'POST',
          body: {
            name: entry.name,
            duration: entry.duration,
            timestamp: Date.now()
          }
        })
      }
    })
  })

  perfObserver.observe({ entryTypes: ['measure'] })

  // Typing performance tracking
  window.trackTypingMetrics = (metrics) => {
    performance.mark('typing-session-start')
    
    setTimeout(() => {
      performance.mark('typing-session-end')
      performance.measure('typing-session-duration', 'typing-session-start', 'typing-session-end')
    }, metrics.duration)
  }
})
```

## Performance Testing Automation

```javascript
// tests/performance/performance-suite.js
import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

class PerformanceTestSuite {
  constructor() {
    this.results = {}
  }

  async runAllTests() {
    console.log('🚀 Starting performance test suite...')

    // 1. K6 Load Tests
    await this.runK6Tests()

    // 2. Lighthouse Audit
    await this.runLighthouseAudit()

    // 3. Database Performance
    await this.runDatabaseTests()

    // 4. Generate Report
    this.generateReport()
  }

  async runK6Tests() {
    console.log('⚡ Running K6 load tests...')
    
    const tests = [
      'tests/performance/basic-load.test.js',
      'tests/performance/stress.test.js',
      'tests/performance/spike.test.js'
    ]

    for (const test of tests) {
      try {
        const output = execSync(`k6 run --out json=results.json ${test}`, { 
          encoding: 'utf8' 
        })
        
        this.results[test] = {
          status: 'passed',
          output: output
        }
      } catch (error) {
        this.results[test] = {
          status: 'failed',
          error: error.message
        }
      }
    }
  }

  async runLighthouseAudit() {
    console.log('🏠 Running Lighthouse audit...')
    
    try {
      const output = execSync('lighthouse http://localhost:3000 --output=json --output-path=lighthouse-report.json', {
        encoding: 'utf8'
      })
      
      this.results.lighthouse = {
        status: 'passed',
        output: output
      }
    } catch (error) {
      this.results.lighthouse = {
        status: 'failed', 
        error: error.message
      }
    }
  }

  async runDatabaseTests() {
    console.log('🗄️ Running database performance tests...')
    
    try {
      const output = execSync('pnpm test tests/performance/database-load.test.js', {
        encoding: 'utf8'
      })
      
      this.results.database = {
        status: 'passed',
        output: output
      }
    } catch (error) {
      this.results.database = {
        status: 'failed',
        error: error.message
      }
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: Object.keys(this.results).length,
        passed: Object.values(this.results).filter(r => r.status === 'passed').length,
        failed: Object.values(this.results).filter(r => r.status === 'failed').length
      },
      results: this.results
    }

    writeFileSync('performance-report.json', JSON.stringify(report, null, 2))
    
    console.log('📊 Performance test report generated')
    console.log(`✅ Passed: ${report.summary.passed}`)
    console.log(`❌ Failed: ${report.summary.failed}`)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const suite = new PerformanceTestSuite()
  suite.runAllTests()
}
```

## Continuous Performance Testing

```yaml
# .github/workflows/performance.yml
name: Performance Testing

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  performance:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: typing_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:6
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build application
        run: pnpm build
      
      - name: Start application
        run: |
          pnpm start &
          sleep 10
      
      - name: Install K6
        run: |
          curl https://github.com/grafana/k6/releases/download/v0.45.0/k6-v0.45.0-linux-amd64.tar.gz -L | tar xvz --strip-components 1
          sudo cp k6 /usr/local/bin/
      
      - name: Run K6 load tests
        run: k6 run tests/performance/basic-load.test.js
      
      - name: Run database performance tests
        run: pnpm test tests/performance/database-load.test.js
      
      - name: Upload performance artifacts
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: performance-results
          path: |
            performance-report.json
            lighthouse-report.json
```

## Performance Monitoring

```javascript
// server/middleware/performance.js
export default defineEventHandler(async (event) => {
  const startTime = process.hrtime.bigint()
  
  // Add performance tracking
  event.context.startTime = startTime
  
  // After response
  event.node.res.on('finish', () => {
    const endTime = process.hrtime.bigint()
    const duration = Number(endTime - startTime) / 1000000 // Convert to milliseconds
    
    // Log slow requests
    if (duration > 1000) { // Slower than 1 second
      console.warn(`Slow request: ${event.node.req.method} ${event.node.req.url} - ${duration}ms`)
    }
    
    // Send metrics to monitoring system
    if (process.env.NODE_ENV === 'production') {
      sendMetrics({
        method: event.node.req.method,
        url: event.node.req.url,
        duration: duration,
        statusCode: event.node.res.statusCode,
        timestamp: Date.now()
      })
    }
  })
})

function sendMetrics(metrics) {
  // Send to your monitoring system (DataDog, New Relic, etc.)
  fetch(process.env.METRICS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metrics)
  }).catch(console.error)
}
```

Performance testing ensures your application scales gracefully and provides a good user experience under various load conditions. Focus on realistic user scenarios and establish performance budgets early in development.