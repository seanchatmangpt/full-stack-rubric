# Advanced Testing Patterns

## Property-Based Testing

**Property-based testing** validates that properties hold true across a wide range of inputs, rather than testing specific examples.

### Fast-Check for Property Testing

```javascript
// tests/unit/typing-algorithms.property.test.js
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { calculateWPM, calculateAccuracy } from '../../app/utils/typingMetrics.js'

describe('Typing Metrics Properties', () => {
  it('WPM should always be non-negative', () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 1000 }), // characters typed
      fc.integer({ min: 1, max: 300000 }), // time elapsed (1ms to 5min)
      fc.integer({ min: 0, max: 100 }), // errors
      (charactersTyped, timeElapsed, errors) => {
        const wpm = calculateWPM({ charactersTyped, timeElapsed, errors })
        expect(wpm.net).toBeGreaterThanOrEqual(0)
        expect(wpm.gross).toBeGreaterThanOrEqual(0)
      }
    ))
  })

  it('accuracy should be between 0 and 1', () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 1000 }), // characters typed
      fc.integer({ min: 0 }), // errors (can be more than characters for worst case)
      (charactersTyped, errors) => {
        const accuracy = calculateAccuracy({ charactersTyped, errors })
        expect(accuracy).toBeGreaterThanOrEqual(0)
        expect(accuracy).toBeLessThanOrEqual(1)
      }
    ))
  })

  it('WPM should increase when typing more in same time', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 500 }), // base characters
      fc.integer({ min: 1, max: 500 }), // additional characters
      fc.integer({ min: 60000, max: 300000 }), // time (1-5 minutes)
      fc.integer({ min: 0, max: 10 }), // errors
      (baseChars, additionalChars, timeElapsed, errors) => {
        const wpm1 = calculateWPM({ 
          charactersTyped: baseChars, 
          timeElapsed, 
          errors 
        })
        const wpm2 = calculateWPM({ 
          charactersTyped: baseChars + additionalChars, 
          timeElapsed, 
          errors 
        })
        
        expect(wpm2.gross).toBeGreaterThanOrEqual(wpm1.gross)
      }
    ))
  })

  it('typing speed calculation should be stable', () => {
    // Test that small changes don't cause dramatic differences
    fc.assert(fc.property(
      fc.integer({ min: 100, max: 1000 }),
      fc.integer({ min: 60000, max: 300000 }),
      fc.integer({ min: 0, max: 10 }),
      (charactersTyped, timeElapsed, errors) => {
        const wpm1 = calculateWPM({ charactersTyped, timeElapsed, errors })
        const wpm2 = calculateWPM({ 
          charactersTyped: charactersTyped + 1, 
          timeElapsed, 
          errors 
        })
        
        // Small character increase shouldn't cause massive WPM jump
        const diff = Math.abs(wpm2.net - wpm1.net)
        expect(diff).toBeLessThan(10) // Less than 10 WPM difference
      }
    ))
  })
})

// Custom generators for domain-specific data
const typingSessionGenerator = fc.record({
  text: fc.stringOf(fc.ascii(), { minLength: 50, maxLength: 500 }),
  typedText: fc.string(),
  startTime: fc.date(),
  endTime: fc.date()
}).filter(session => session.endTime >= session.startTime)

describe('Typing Session Properties', () => {
  it('should maintain session invariants', () => {
    fc.assert(fc.property(
      typingSessionGenerator,
      (session) => {
        const duration = session.endTime - session.startTime
        expect(duration).toBeGreaterThanOrEqual(0)
        
        // Typed text shouldn't be longer than target text
        // (unless there are corrections/overtyping)
        if (session.typedText.length > session.text.length * 2) {
          // This might indicate an error in our system
          console.warn('Possible overtyping detected', {
            original: session.text.length,
            typed: session.typedText.length
          })
        }
      }
    ))
  })
})
```

### Model-Based Testing

```javascript
// tests/unit/session-state.model.test.js
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

// State model for typing session
class TypingSessionModel {
  constructor() {
    this.state = 'idle'
    this.text = ''
    this.typedChars = 0
    this.errors = 0
    this.startTime = null
  }

  start(text) {
    if (this.state !== 'idle') throw new Error('Session already started')
    this.state = 'active'
    this.text = text
    this.startTime = Date.now()
  }

  type(char) {
    if (this.state !== 'active') throw new Error('Session not active')
    
    const expectedChar = this.text[this.typedChars]
    if (char === expectedChar) {
      this.typedChars++
    } else {
      this.errors++
    }
    
    if (this.typedChars >= this.text.length) {
      this.state = 'completed'
    }
  }

  complete() {
    if (this.state !== 'active') throw new Error('Session not active')
    this.state = 'completed'
  }

  isCompleted() {
    return this.state === 'completed'
  }
}

// Commands for model-based testing
const startCommand = fc.record({
  type: fc.constant('start'),
  text: fc.stringOf(fc.ascii(), { minLength: 10, maxLength: 100 })
})

const typeCommand = fc.record({
  type: fc.constant('type'),
  char: fc.ascii()
})

const completeCommand = fc.record({
  type: fc.constant('complete')
})

const sessionCommands = fc.oneof(startCommand, typeCommand, completeCommand)

describe('Typing Session State Model', () => {
  it('should maintain valid state transitions', () => {
    fc.assert(fc.property(
      fc.array(sessionCommands, { minLength: 1, maxLength: 50 }),
      (commands) => {
        const model = new TypingSessionModel()
        const actualSession = new TypingSession() // Your actual implementation
        
        for (const command of commands) {
          try {
            switch (command.type) {
              case 'start':
                model.start(command.text)
                actualSession.start(command.text)
                break
              case 'type':
                if (model.state === 'active') {
                  model.type(command.char)
                  actualSession.type(command.char)
                }
                break
              case 'complete':
                if (model.state === 'active') {
                  model.complete()
                  actualSession.complete()
                }
                break
            }
            
            // Assert that model and actual implementation agree
            expect(actualSession.getState()).toBe(model.state)
            expect(actualSession.getTypedChars()).toBe(model.typedChars)
            expect(actualSession.getErrors()).toBe(model.errors)
            
          } catch (error) {
            // Both should throw the same error
            expect(() => executeCommand(actualSession, command)).toThrow()
          }
        }
      }
    ))
  })
})
```

## Snapshot Testing

**Snapshot testing** captures the output of components/functions and alerts you to unexpected changes.

### Component Snapshot Testing

```javascript
// tests/unit/components/TypingResults.snapshot.test.js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TypingResults from '../../../app/components/TypingResults.vue'

describe('TypingResults Snapshots', () => {
  it('should match snapshot for excellent performance', () => {
    const wrapper = mount(TypingResults, {
      props: {
        results: {
          wpm: 85,
          accuracy: 0.98,
          duration: 120000,
          charactersTyped: 340,
          errorsCount: 3,
          difficulty: 'hard',
          language: 'javascript'
        }
      }
    })

    expect(wrapper.html()).toMatchSnapshot()
  })

  it('should match snapshot for poor performance', () => {
    const wrapper = mount(TypingResults, {
      props: {
        results: {
          wpm: 25,
          accuracy: 0.75,
          duration: 180000,
          charactersTyped: 150,
          errorsCount: 25,
          difficulty: 'easy',
          language: 'javascript'
        }
      }
    })

    expect(wrapper.html()).toMatchSnapshot()
  })

  it('should match snapshot with achievements', () => {
    const wrapper = mount(TypingResults, {
      props: {
        results: {
          wpm: 75,
          accuracy: 0.95,
          duration: 90000,
          charactersTyped: 280,
          errorsCount: 5,
          difficulty: 'medium',
          language: 'python'
        },
        achievements: [
          { id: 'speed-demon', title: 'Speed Demon', description: 'Typed over 70 WPM' },
          { id: 'accuracy-ace', title: 'Accuracy Ace', description: 'Maintained 95% accuracy' }
        ]
      }
    })

    expect(wrapper.html()).toMatchSnapshot()
  })
})
```

### API Response Snapshot Testing

```javascript
// tests/integration/api-snapshots.test.js
import { describe, it, expect } from 'vitest'
import { $fetch } from 'ofetch'

describe('API Response Snapshots', () => {
  it('should match session creation response structure', async () => {
    const response = await $fetch('/api/sessions', {
      method: 'POST',
      body: {
        userId: 'test-user-123',
        language: 'javascript',
        difficulty: 'medium'
      }
    })

    // Remove dynamic values for stable snapshots
    const normalized = {
      ...response,
      id: 'DYNAMIC_ID',
      createdAt: 'DYNAMIC_TIMESTAMP',
      codeSnippet: 'DYNAMIC_CODE'
    }

    expect(normalized).toMatchSnapshot()
  })

  it('should match user statistics response', async () => {
    // Create some test data first
    await createTestUserWithSessions('snapshot-user')

    const stats = await $fetch('/api/users/snapshot-user/stats')

    // Normalize dynamic data
    const normalized = {
      ...stats,
      lastUpdated: 'DYNAMIC_TIMESTAMP',
      sessions: stats.sessions.map(session => ({
        ...session,
        id: 'DYNAMIC_ID',
        createdAt: 'DYNAMIC_TIMESTAMP'
      }))
    }

    expect(normalized).toMatchSnapshot()
  })
})
```

### Custom Snapshot Serializers

```javascript
// tests/setup/snapshot-serializers.js
import { expect } from 'vitest'

// Custom serializer for Vue components
expect.addSnapshotSerializer({
  test: (val) => val && val._isVue,
  serialize: (val, config, indentation, depth, refs, printer) => {
    // Remove dynamic attributes
    const cleanProps = { ...val.$props }
    delete cleanProps.id
    delete cleanProps.timestamp
    
    return `VueComponent ${val.$options.name || 'Unknown'} ${printer(cleanProps)}`
  }
})

// Custom serializer for dates
expect.addSnapshotSerializer({
  test: (val) => val instanceof Date,
  serialize: () => 'DATE_PLACEHOLDER'
})

// Custom serializer for functions
expect.addSnapshotSerializer({
  test: (val) => typeof val === 'function',
  serialize: (val) => `[Function ${val.name || 'anonymous'}]`
})
```

## Mutation Testing

**Mutation testing** validates test quality by introducing bugs and checking if tests catch them.

### Stryker Configuration

```javascript
// stryker.config.js
export default {
  packageManager: 'pnpm',
  reporters: ['html', 'clear-text', 'progress', 'dashboard'],
  testRunner: 'vitest',
  coverageAnalysis: 'perTest',
  
  mutate: [
    'app/**/*.js',
    '!app/**/*.test.js',
    '!app/**/*.spec.js'
  ],
  
  thresholds: {
    high: 80,
    low: 60,
    break: null
  },
  
  dashboard: {
    reportType: 'full'
  },
  
  // Specific mutators for JavaScript
  mutator: {
    plugins: ['@stryker-mutator/javascript-mutator'],
    excludedMutations: [
      'StringLiteral', // Don't mutate string constants
      'ObjectLiteral'  // Don't mutate object literals
    ]
  }
}
```

### Mutation Testing Script

```javascript
// scripts/mutation-test.js
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'

async function runMutationTests() {
  console.log('🧬 Starting mutation testing...')
  
  try {
    // Run Stryker mutation testing
    const output = execSync('pnpm stryker run', { 
      encoding: 'utf8',
      stdio: 'pipe'
    })
    
    // Parse results
    const reportPath = 'reports/mutation/mutation.json'
    const report = JSON.parse(readFileSync(reportPath))
    
    console.log('📊 Mutation Testing Results:')
    console.log(`  Mutation Score: ${report.mutationScore}%`)
    console.log(`  Killed: ${report.killed}`)
    console.log(`  Survived: ${report.survived}`)
    console.log(`  Timeout: ${report.timeout}`)
    console.log(`  No Coverage: ${report.noCoverage}`)
    
    // Analyze surviving mutants
    const survivors = report.files.flatMap(file => 
      file.mutants.filter(mutant => mutant.status === 'Survived')
    )
    
    if (survivors.length > 0) {
      console.log('\n⚠️  Surviving Mutants (potential test gaps):')
      survivors.forEach(mutant => {
        console.log(`  ${mutant.location.start.line}:${mutant.location.start.column} - ${mutant.mutatorName}`)
        console.log(`    Original: ${mutant.originalLines}`)
        console.log(`    Mutated:  ${mutant.mutatedLines}`)
      })
    }
    
    // Generate recommendations
    generateTestRecommendations(survivors)
    
  } catch (error) {
    console.error('❌ Mutation testing failed:', error.message)
    process.exit(1)
  }
}

function generateTestRecommendations(survivors) {
  const recommendations = []
  
  survivors.forEach(mutant => {
    switch (mutant.mutatorName) {
      case 'ConditionalExpression':
        recommendations.push({
          type: 'Missing branch coverage',
          location: mutant.location,
          suggestion: 'Add tests for both true and false conditions'
        })
        break
      case 'ArithmeticOperator':
        recommendations.push({
          type: 'Missing edge cases',
          location: mutant.location,
          suggestion: 'Test boundary values and operator precedence'
        })
        break
      case 'BooleanLiteral':
        recommendations.push({
          type: 'Boolean logic not tested',
          location: mutant.location,
          suggestion: 'Verify boolean return values explicitly'
        })
        break
    }
  })
  
  writeFileSync('mutation-recommendations.json', JSON.stringify(recommendations, null, 2))
}

runMutationTests()
```

## Contract Testing with Pact

**Contract testing** ensures API compatibility between consumers and providers.

### Consumer Contract Tests

```javascript
// tests/contracts/typing-api.contract.test.js
import { Pact, Matchers } from '@pact-foundation/pact'
import { TypingApiClient } from '../../app/services/typingApiClient.js'

const { like, term, eachLike } = Matchers

describe('Typing API Consumer Contract', () => {
  const provider = new Pact({
    consumer: 'typing-frontend',
    provider: 'typing-api',
    port: 1234,
    dir: './tests/contracts/pacts'
  })

  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())
  afterEach(() => provider.verify())

  describe('Session Management', () => {
    it('should create a typing session', async () => {
      // Arrange
      await provider
        .given('user exists with id user-123')
        .uponReceiving('a request to create a typing session')
        .withRequest({
          method: 'POST',
          path: '/api/sessions',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': like('Bearer token123')
          },
          body: {
            userId: 'user-123',
            language: 'javascript',
            difficulty: 'medium'
          }
        })
        .willRespondWith({
          status: 201,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            id: like('session-456'),
            userId: 'user-123',
            language: 'javascript',
            difficulty: 'medium',
            codeSnippet: like('console.log("Hello");'),
            status: 'active',
            createdAt: term({
              generate: '2024-01-01T10:00:00Z',
              matcher: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$'
            })
          }
        })

      // Act
      const client = new TypingApiClient('http://localhost:1234')
      const session = await client.createSession({
        userId: 'user-123',
        language: 'javascript',
        difficulty: 'medium'
      })

      // Assert
      expect(session.id).toBeTruthy()
      expect(session.status).toBe('active')
      expect(session.codeSnippet).toBeTruthy()
    })

    it('should get user typing history', async () => {
      await provider
        .given('user user-123 has completed sessions')
        .uponReceiving('a request for user typing history')
        .withRequest({
          method: 'GET',
          path: '/api/users/user-123/history',
          query: {
            limit: '10',
            offset: '0'
          }
        })
        .willRespondWith({
          status: 200,
          body: {
            sessions: eachLike({
              id: like('session-123'),
              wpm: like(45),
              accuracy: like(0.92),
              duration: like(120000),
              language: like('javascript'),
              completedAt: like('2024-01-01T10:00:00Z')
            }),
            total: like(25),
            hasMore: like(true)
          }
        })

      const client = new TypingApiClient('http://localhost:1234')
      const history = await client.getUserHistory('user-123', { limit: 10 })

      expect(history.sessions).toBeInstanceOf(Array)
      expect(history.sessions[0]).toHaveProperty('wpm')
      expect(history.total).toBeGreaterThan(0)
    })
  })
})
```

### Provider Contract Verification

```javascript
// tests/contracts/verify-provider.test.js
import { Verifier } from '@pact-foundation/pact'
import { startServer, stopServer } from '../utils/test-server.js'

describe('Provider Contract Verification', () => {
  let server

  beforeAll(async () => {
    server = await startServer(3001)
  })

  afterAll(async () => {
    await stopServer(server)
  })

  it('should verify contracts against provider', async () => {
    const opts = {
      provider: 'typing-api',
      providerBaseUrl: 'http://localhost:3001',
      
      // Pact Broker configuration (if using)
      pactBrokerUrl: process.env.PACT_BROKER_URL,
      pactBrokerUsername: process.env.PACT_BROKER_USERNAME,
      pactBrokerPassword: process.env.PACT_BROKER_PASSWORD,
      
      // Or local pact files
      pactUrls: ['./tests/contracts/pacts/typing-frontend-typing-api.json'],
      
      publishVerificationResult: process.env.CI === 'true',
      providerVersion: process.env.GIT_COMMIT,
      
      // State handlers
      stateHandlers: {
        'user exists with id user-123': async () => {
          // Setup test data
          await setupTestUser('user-123')
        },
        'user user-123 has completed sessions': async () => {
          await setupTestUser('user-123')
          await createTestSessions('user-123', 5)
        }
      }
    }

    await new Verifier(opts).verifyProvider()
  })
})
```

## Visual Regression Testing

**Visual regression testing** catches unintended UI changes by comparing screenshots.

### Playwright Visual Testing

```javascript
// tests/visual/typing-interface.visual.test.js
import { test, expect } from '@playwright/test'

test.describe('Typing Interface Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.monaco-editor')
  })

  test('should match typing session start screen', async ({ page }) => {
    await expect(page).toHaveScreenshot('typing-start-screen.png')
  })

  test('should match typing in progress', async ({ page }) => {
    // Start a session
    await page.click('[data-testid="start-session"]')
    await page.selectOption('[data-testid="language-select"]', 'javascript')
    
    // Type some characters
    const editor = page.locator('.monaco-editor .view-line')
    await editor.first().click()
    await page.keyboard.type('console.log')
    
    // Take screenshot
    await expect(page).toHaveScreenshot('typing-in-progress.png')
  })

  test('should match error highlighting', async ({ page }) => {
    await page.click('[data-testid="start-session"]')
    await page.selectOption('[data-testid="language-select"]', 'javascript')
    
    const editor = page.locator('.monaco-editor .view-line')
    await editor.first().click()
    
    // Type incorrect text to trigger error highlighting
    await page.keyboard.type('consle.log') // Missing 'o' in console
    
    await expect(page).toHaveScreenshot('typing-with-errors.png')
  })

  test('should match results screen', async ({ page }) => {
    // Complete a typing session (simplified)
    await page.goto('/results/mock-session-id')
    
    await expect(page).toHaveScreenshot('typing-results.png')
  })

  test('should match mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone size
    await page.goto('/')
    
    await expect(page).toHaveScreenshot('mobile-layout.png')
  })

  test('should match dark theme', async ({ page }) => {
    // Enable dark theme
    await page.click('[data-testid="theme-toggle"]')
    await page.waitForSelector('[data-theme="dark"]')
    
    await expect(page).toHaveScreenshot('dark-theme.png')
  })
})
```

### Component Visual Testing

```javascript
// tests/visual/components.visual.test.js
import { test, expect } from '@playwright/test'

test.describe('Component Visual Tests', () => {
  // Test isolated components
  test('typing metrics component variations', async ({ page }) => {
    await page.goto('/storybook/typing-metrics')
    
    // Test different metric states
    const states = ['excellent', 'good', 'average', 'poor']
    
    for (const state of states) {
      await page.click(`[data-testid="state-${state}"]`)
      await expect(page.locator('[data-testid="typing-metrics"]'))
        .toHaveScreenshot(`typing-metrics-${state}.png`)
    }
  })

  test('progress bar animations', async ({ page }) => {
    await page.goto('/storybook/progress-bar')
    
    // Test animation states
    await page.click('[data-testid="start-progress"]')
    await page.waitForTimeout(1000) // Let animation settle
    
    await expect(page.locator('[data-testid="progress-bar"]'))
      .toHaveScreenshot('progress-bar-animated.png')
  })
})
```

### Visual Testing Configuration

```javascript
// playwright.config.js (visual testing section)
export default defineConfig({
  // ... other config
  
  expect: {
    // Threshold for visual comparisons (0-1, where 1 is exact match)
    toHaveScreenshot: { 
      threshold: 0.2, // Allow 20% difference
      maxDiffPixels: 1000 // Maximum different pixels
    }
  },

  projects: [
    {
      name: 'visual-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Consistent visual testing settings
        colorScheme: 'light',
        reducedMotion: 'reduce' // Disable animations for consistent screenshots
      }
    },
    {
      name: 'visual-dark',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark'
      }
    }
  ]
})
```

## Chaos Engineering Testing

**Chaos engineering** validates system resilience by intentionally introducing failures.

### Service Failure Simulation

```javascript
// tests/chaos/service-failures.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ChaosMonkey } from '../utils/chaos-monkey.js'
import { TypingService } from '../../server/services/typingService.js'

describe('Chaos Engineering Tests', () => {
  let chaosMonkey, service

  beforeEach(async () => {
    chaosMonkey = new ChaosMonkey()
    service = new TypingService()
    await service.initialize()
  })

  afterEach(async () => {
    await chaosMonkey.restore()
    await service.shutdown()
  })

  it('should handle database connection failures gracefully', async () => {
    // Kill database connection
    await chaosMonkey.killService('database')

    // Service should degrade gracefully
    await expect(service.createSession({
      userId: 'test-user',
      language: 'javascript'
    })).rejects.toThrow(/service unavailable/i)

    // Should still serve cached data
    const cachedData = await service.getCachedSessions('test-user')
    expect(cachedData).toBeDefined()
  })

  it('should recover after network partition', async () => {
    // Create initial session
    const session = await service.createSession({
      userId: 'test-user',
      language: 'javascript'
    })

    // Simulate network partition
    await chaosMonkey.partitionNetwork(['database', 'redis'])

    // Service should detect partition and enter degraded mode
    await new Promise(resolve => setTimeout(resolve, 2000))

    expect(service.getHealthStatus()).toContain('degraded')

    // Heal partition
    await chaosMonkey.healNetwork()

    // Service should recover
    await new Promise(resolve => setTimeout(resolve, 3000))

    expect(service.getHealthStatus()).toBe('healthy')

    // Should be able to access original session
    const retrievedSession = await service.getSession(session.id)
    expect(retrievedSession.id).toBe(session.id)
  })

  it('should handle memory pressure', async () => {
    // Simulate memory pressure
    await chaosMonkey.consumeMemory(0.8) // Use 80% of available memory

    // Service should still function but might be slower
    const startTime = Date.now()
    
    const session = await service.createSession({
      userId: 'memory-test-user',
      language: 'python'
    })
    
    const duration = Date.now() - startTime

    expect(session.id).toBeDefined()
    // Might be slower but should complete within reasonable time
    expect(duration).toBeLessThan(10000) // 10 seconds max
  })

  it('should handle CPU spike', async () => {
    // Create CPU load
    await chaosMonkey.cpuSpike(0.9, 5000) // 90% CPU for 5 seconds

    // Service should remain responsive
    const promises = Array.from({ length: 10 }, () => 
      service.createSession({
        userId: `cpu-test-${Math.random()}`,
        language: 'javascript'
      })
    )

    const results = await Promise.all(promises)
    expect(results).toHaveLength(10)
    results.forEach(session => {
      expect(session.id).toBeDefined()
    })
  })
})
```

### Chaos Monkey Implementation

```javascript
// tests/utils/chaos-monkey.js
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export class ChaosMonkey {
  constructor() {
    this.activeFailures = new Set()
  }

  async killService(serviceName) {
    console.log(`🐒 Killing service: ${serviceName}`)
    
    switch (serviceName) {
      case 'database':
        await execAsync('docker stop typing-postgres')
        break
      case 'redis':
        await execAsync('docker stop typing-redis')
        break
      default:
        throw new Error(`Unknown service: ${serviceName}`)
    }
    
    this.activeFailures.add(serviceName)
  }

  async restoreService(serviceName) {
    console.log(`🔧 Restoring service: ${serviceName}`)
    
    switch (serviceName) {
      case 'database':
        await execAsync('docker start typing-postgres')
        break
      case 'redis':
        await execAsync('docker start typing-redis')
        break
    }
    
    this.activeFailures.delete(serviceName)
  }

  async partitionNetwork(services) {
    console.log(`🌐 Creating network partition for: ${services.join(', ')}`)
    
    // Use iptables or tc (traffic control) to simulate network issues
    for (const service of services) {
      await execAsync(`docker exec ${service} tc qdisc add dev eth0 root netem loss 100%`)
    }
    
    this.activeFailures.add('network-partition')
  }

  async healNetwork() {
    console.log(`🌐 Healing network partition`)
    
    const services = ['typing-postgres', 'typing-redis']
    for (const service of services) {
      try {
        await execAsync(`docker exec ${service} tc qdisc del dev eth0 root`)
      } catch (error) {
        // Service might not have tc rules
        console.warn(`Could not remove tc rules from ${service}`)
      }
    }
    
    this.activeFailures.delete('network-partition')
  }

  async consumeMemory(percentage) {
    console.log(`💾 Consuming ${percentage * 100}% memory`)
    
    // JavaScript memory consumption (simplified)
    const totalMemory = process.memoryUsage().heapTotal
    const targetMemory = totalMemory * percentage
    
    this.memoryConsumer = new Array(Math.floor(targetMemory / 8)) // Approximate
    this.activeFailures.add('memory-pressure')
  }

  async cpuSpike(percentage, durationMs) {
    console.log(`⚡ Creating ${percentage * 100}% CPU spike for ${durationMs}ms`)
    
    const endTime = Date.now() + durationMs
    const workers = Math.floor(percentage * require('os').cpus().length)
    
    this.cpuWorkers = []
    
    for (let i = 0; i < workers; i++) {
      const worker = setInterval(() => {
        // Busy work to consume CPU
        const start = Date.now()
        while (Date.now() - start < 100) {
          Math.random() * Math.random()
        }
      }, 0)
      
      this.cpuWorkers.push(worker)
    }
    
    setTimeout(() => {
      this.cpuWorkers.forEach(worker => clearInterval(worker))
      this.cpuWorkers = []
    }, durationMs)
    
    this.activeFailures.add('cpu-spike')
  }

  async restore() {
    console.log(`🔄 Restoring all chaos monkey failures`)
    
    // Restore all services
    for (const failure of this.activeFailures) {
      switch (failure) {
        case 'database':
          await this.restoreService('database')
          break
        case 'redis':
          await this.restoreService('redis')
          break
        case 'network-partition':
          await this.healNetwork()
          break
        case 'memory-pressure':
          this.memoryConsumer = null
          break
        case 'cpu-spike':
          if (this.cpuWorkers) {
            this.cpuWorkers.forEach(worker => clearInterval(worker))
            this.cpuWorkers = []
          }
          break
      }
    }
    
    this.activeFailures.clear()
    
    // Force garbage collection
    if (global.gc) {
      global.gc()
    }
  }
}
```

These advanced testing patterns help ensure your application is robust, maintainable, and handles edge cases gracefully. They complement traditional testing approaches by validating system behavior under various conditions and stresses.