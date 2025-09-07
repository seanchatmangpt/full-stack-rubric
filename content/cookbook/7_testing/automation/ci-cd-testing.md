# Test Automation & CI/CD Integration

## CI/CD Testing Pipeline

A comprehensive testing pipeline ensures code quality and prevents regressions in production.

### Pipeline Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Commit    │───▶│   Build     │───▶│    Test     │───▶│   Deploy    │
│             │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                           │                   │
                           ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │  Lint       │    │  Unit       │
                   │  Format     │    │  Integration│
                   │  Security   │    │  E2E        │
                   │  Type Check │    │  Performance│
                   └─────────────┘    └─────────────┘
```

## GitHub Actions Configuration

### Main CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: 18
  PNPM_VERSION: 8

jobs:
  # Code Quality Checks
  quality:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm

      - name: Install pnpm
        run: npm install -g pnpm@${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint code
        run: pnpm lint

      - name: Format check
        run: pnpm format:check

      - name: Security audit
        run: pnpm audit

      - name: Check bundle size
        run: pnpm bundle-analyzer --analyze

  # Unit and Integration Tests
  test:
    runs-on: ubuntu-latest
    needs: quality

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: typing_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm

      - name: Install pnpm
        run: npm install -g pnpm@${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Setup test database
        run: |
          pnpm db:migrate:test
          pnpm db:seed:test

      - name: Run unit tests
        run: pnpm test:unit --coverage

      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/typing_test
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          fail_ci_if_error: true

  # E2E Tests
  e2e:
    runs-on: ubuntu-latest
    needs: test
    
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm

      - name: Install pnpm
        run: npm install -g pnpm@${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright
        run: pnpm playwright install --with-deps ${{ matrix.browser }}

      - name: Build application
        run: pnpm build

      - name: Start application
        run: |
          pnpm preview &
          pnpm wait-for-localhost:3000

      - name: Run E2E tests
        run: pnpm test:e2e --project=${{ matrix.browser }}

      - name: Upload E2E artifacts
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/

  # Performance Tests
  performance:
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'pull_request'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build application
        run: pnpm build

      - name: Start application
        run: |
          pnpm preview &
          sleep 10

      - name: Install K6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run performance tests
        run: k6 run tests/performance/basic-load.test.js

      - name: Run Lighthouse audit
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: http://localhost:3000
          configPath: .lighthouserc.json
          uploadArtifacts: true

  # Security Tests
  security:
    runs-on: ubuntu-latest
    needs: quality

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Run CodeQL analysis
        uses: github/codeql-action/init@v2
        with:
          languages: javascript

      - name: Perform CodeQL analysis
        uses: github/codeql-action/analyze@v2

  # Deploy
  deploy:
    runs-on: ubuntu-latest
    needs: [test, e2e, performance]
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment"
          # Add deployment commands here

      - name: Run smoke tests
        run: |
          echo "Running smoke tests on staging"
          pnpm test:smoke --env staging

      - name: Deploy to production
        if: success()
        run: |
          echo "Deploying to production environment"
          # Add production deployment commands
```

### Pull Request Workflow

```yaml
# .github/workflows/pr.yml
name: Pull Request Checks

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  pr-checks:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Need full history for comparison

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Run changed files tests
        run: |
          # Get changed files
          CHANGED_FILES=$(git diff --name-only origin/main...HEAD)
          echo "Changed files: $CHANGED_FILES"
          
          # Run tests only for changed files
          pnpm test:changed --passWithNoTests

      - name: Check test coverage delta
        run: |
          # Compare coverage with main branch
          pnpm test:coverage --coverageReporters=json
          pnpm coverage-diff main

      - name: Visual regression tests
        run: pnpm test:visual --updateSnapshot=false

      - name: Bundle size check
        run: |
          pnpm build
          pnpm bundlewatch --ci

      - name: Comment PR with results
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs')
            
            // Read test results
            const testResults = JSON.parse(fs.readFileSync('test-results.json'))
            const coverageResults = JSON.parse(fs.readFileSync('coverage-results.json'))
            
            const comment = `
            ## 🧪 Test Results
            
            - ✅ Tests Passed: ${testResults.numPassedTests}
            - ❌ Tests Failed: ${testResults.numFailedTests}
            - 📊 Coverage: ${coverageResults.coverage}%
            
            ### Coverage Changes
            ${coverageResults.diff > 0 ? '📈' : '📉'} ${coverageResults.diff}%
            
            [View detailed report](${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID})
            `
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            })
```

## Test Configuration

### Vitest Configuration

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup/global-setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.{js,ts}',
        '**/*.d.ts'
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    // Separate configurations for different test types
    projects: [
      {
        name: 'unit',
        testMatch: ['tests/unit/**/*.test.js'],
        testTimeout: 5000
      },
      {
        name: 'integration',
        testMatch: ['tests/integration/**/*.test.js'],
        testTimeout: 15000,
        setupFiles: ['./tests/setup/database-setup.js']
      }
    ]
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './'),
      '@': resolve(__dirname, './app')
    }
  }
})
```

### Playwright Configuration

```javascript
// playwright.config.js
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] }
    }
  ],

  webServer: {
    command: 'pnpm preview',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
})
```

## Test Environment Management

### Docker Compose for Testing

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: typing_test
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis-test:
    image: redis:7
    ports:
      - "6380:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  test-runner:
    build:
      context: .
      dockerfile: Dockerfile.test
    depends_on:
      postgres-test:
        condition: service_healthy
      redis-test:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://test:test@postgres-test:5432/typing_test
      REDIS_URL: redis://redis-test:6379
      NODE_ENV: test
    volumes:
      - .:/app
      - /app/node_modules
    command: pnpm test
```

### Test Environment Setup

```javascript
// tests/setup/global-setup.js
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { execSync } from 'child_process'

// Global test setup
beforeAll(async () => {
  console.log('🚀 Setting up test environment...')
  
  // Start test services
  if (process.env.CI) {
    // Services are already running in CI
    console.log('CI environment detected, skipping service startup')
  } else {
    // Start local test services
    execSync('docker-compose -f docker-compose.test.yml up -d --wait', {
      stdio: 'inherit'
    })
  }

  // Wait for services to be ready
  await waitForServices()
  
  // Run database migrations
  execSync('pnpm db:migrate:test', { stdio: 'inherit' })
  
  console.log('✅ Test environment ready')
})

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...')
  
  if (!process.env.CI) {
    execSync('docker-compose -f docker-compose.test.yml down', {
      stdio: 'inherit'
    })
  }
  
  console.log('✅ Test environment cleaned up')
})

// Clean database between tests
beforeEach(async () => {
  if (global.testDb) {
    await global.testDb.truncate()
  }
})

async function waitForServices() {
  const services = [
    { name: 'PostgreSQL', url: 'postgresql://test:test@localhost:5433/typing_test' },
    { name: 'Redis', url: 'redis://localhost:6380' }
  ]
  
  for (const service of services) {
    console.log(`Waiting for ${service.name}...`)
    await waitForService(service.url)
    console.log(`✅ ${service.name} ready`)
  }
}

async function waitForService(url) {
  // Implementation specific to service type
  // Add retry logic with exponential backoff
}
```

## Quality Gates

### Coverage Gates

```javascript
// scripts/coverage-gate.js
import { readFileSync } from 'fs'

const COVERAGE_THRESHOLDS = {
  statements: 80,
  branches: 75,
  functions: 80,
  lines: 80
}

function checkCoverageGate() {
  const coverageReport = JSON.parse(readFileSync('coverage/coverage-summary.json'))
  const { total } = coverageReport
  
  let failed = false
  
  for (const [metric, threshold] of Object.entries(COVERAGE_THRESHOLDS)) {
    const actual = total[metric].pct
    
    if (actual < threshold) {
      console.error(`❌ ${metric}: ${actual}% (required: ${threshold}%)`)
      failed = true
    } else {
      console.log(`✅ ${metric}: ${actual}% (required: ${threshold}%)`)
    }
  }
  
  if (failed) {
    console.error('\n❌ Coverage gate failed!')
    process.exit(1)
  } else {
    console.log('\n✅ Coverage gate passed!')
  }
}

checkCoverageGate()
```

### Performance Budgets

```javascript
// .lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "first-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 4000}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "total-blocking-time": ["error", {"maxNumericValue": 300}],
        "categories:performance": ["error", {"minScore": 0.8}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

## Monitoring and Alerts

### Test Results Dashboard

```javascript
// scripts/test-dashboard.js
import { readFileSync, writeFileSync } from 'fs'

class TestDashboard {
  constructor() {
    this.results = {}
  }

  collectResults() {
    // Collect test results from different sources
    this.results.unit = this.parseVitest('coverage/test-results.json')
    this.results.e2e = this.parsePlaywright('playwright-report/results.json') 
    this.results.performance = this.parseK6('k6-results.json')
    this.results.lighthouse = this.parseLighthouse('lighthouse-report.json')
  }

  generateDashboard() {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Results Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .metric { display: inline-block; margin: 10px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
    .pass { background-color: #d4edda; }
    .fail { background-color: #f8d7da; }
    .warn { background-color: #fff3cd; }
  </style>
</head>
<body>
  <h1>Test Results Dashboard</h1>
  <div class="metrics">
    ${this.renderMetric('Unit Tests', this.results.unit)}
    ${this.renderMetric('E2E Tests', this.results.e2e)}
    ${this.renderMetric('Performance', this.results.performance)}
    ${this.renderMetric('Lighthouse', this.results.lighthouse)}
  </div>
  
  <h2>Trends</h2>
  <div id="trends"></div>
  
  <script>
    // Add charts and trends visualization
    ${this.generateTrendsScript()}
  </script>
</body>
</html>
    `

    writeFileSync('test-dashboard.html', html)
  }

  renderMetric(name, data) {
    const status = data.passed ? 'pass' : 'fail'
    return `
      <div class="metric ${status}">
        <h3>${name}</h3>
        <p>Status: ${data.passed ? '✅ Passed' : '❌ Failed'}</p>
        <p>Score: ${data.score}%</p>
        <p>Duration: ${data.duration}ms</p>
      </div>
    `
  }
}

const dashboard = new TestDashboard()
dashboard.collectResults()
dashboard.generateDashboard()
```

### Slack Notifications

```javascript
// scripts/slack-notify.js
async function notifySlack(results) {
  const webhook = process.env.SLACK_WEBHOOK
  if (!webhook) return

  const color = results.failed > 0 ? 'danger' : 'good'
  const message = {
    attachments: [{
      color: color,
      title: `Test Results - ${process.env.GITHUB_REF}`,
      fields: [
        { title: 'Passed', value: results.passed, short: true },
        { title: 'Failed', value: results.failed, short: true },
        { title: 'Coverage', value: `${results.coverage}%`, short: true },
        { title: 'Duration', value: `${results.duration}s`, short: true }
      ],
      footer: 'GitHub Actions',
      ts: Math.floor(Date.now() / 1000)
    }]
  }

  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  })
}
```

## Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest --project=unit",
    "test:integration": "vitest --project=integration", 
    "test:e2e": "playwright test",
    "test:performance": "k6 run tests/performance/basic-load.test.js",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:changed": "vitest --changed",
    "test:smoke": "playwright test --grep '@smoke'",
    "test:visual": "playwright test --grep '@visual'",
    "test:all": "pnpm test:unit && pnpm test:integration && pnpm test:e2e",
    "test:ci": "pnpm test:all --reporter=junit --coverage",
    "coverage:check": "node scripts/coverage-gate.js",
    "lighthouse": "lighthouse http://localhost:3000 --config-path=.lighthouserc.json",
    "bundle-analyzer": "nuxt analyze"
  }
}
```

This comprehensive CI/CD testing setup ensures code quality, catches regressions early, and provides confidence in deployments through automated testing at every stage of development.