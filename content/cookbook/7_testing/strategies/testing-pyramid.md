# Testing Pyramid Strategy

## The Testing Pyramid

```
         /\
        /E2E\      <- Few (5-10%), Slow, Expensive
       /------\
      /Integr.\   <- Some (15-25%), Medium Speed
     /----------\
    /   Unit     \ <- Many (70-80%), Fast, Cheap
   /--------------\
```

## Unit Tests (70-80%)

**Purpose**: Test individual functions, methods, and components in isolation.

**Characteristics**:
- Fast execution (< 100ms per test)
- No external dependencies
- High code coverage
- Quick feedback loop

### JavaScript Unit Testing

```javascript
// composables/useTypingMetrics.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTypingMetrics } from '../useTypingMetrics.js'

describe('useTypingMetrics', () => {
  let metrics

  beforeEach(() => {
    metrics = useTypingMetrics()
  })

  describe('calculateWPM', () => {
    it('should calculate correct WPM for standard typing', () => {
      const result = metrics.calculateWPM({
        charactersTyped: 250,
        timeElapsed: 60000, // 1 minute
        errors: 5
      })

      expect(result.gross).toBe(50) // 250 chars / 5 = 50 WPM
      expect(result.net).toBe(49)   // 50 - 1 error = 49 WPM
    })

    it('should handle edge cases gracefully', () => {
      expect(metrics.calculateWPM({ charactersTyped: 0, timeElapsed: 60000, errors: 0 }))
        .toEqual({ gross: 0, net: 0 })
      
      expect(metrics.calculateWPM({ charactersTyped: 100, timeElapsed: 0, errors: 0 }))
        .toEqual({ gross: 0, net: 0 })
    })

    it('should cap negative WPM at zero', () => {
      const result = metrics.calculateWPM({
        charactersTyped: 50,
        timeElapsed: 60000,
        errors: 20
      })

      expect(result.net).toBe(0) // Should not go negative
    })
  })

  describe('analyzeTypingPattern', () => {
    it('should identify typing rhythm patterns', () => {
      const keystrokes = [
        { key: 'a', timestamp: 0, correct: true },
        { key: 'b', timestamp: 150, correct: true },
        { key: 'c', timestamp: 300, correct: true },
        { key: 'd', timestamp: 450, correct: true }
      ]

      const pattern = metrics.analyzeTypingPattern(keystrokes)

      expect(pattern.averageDelay).toBe(150)
      expect(pattern.consistency).toBeGreaterThan(0.8)
      expect(pattern.rhythm).toBe('steady')
    })

    it('should detect inconsistent typing', () => {
      const keystrokes = [
        { key: 'a', timestamp: 0, correct: true },
        { key: 'b', timestamp: 100, correct: true },
        { key: 'c', timestamp: 500, correct: true }, // Long pause
        { key: 'd', timestamp: 550, correct: true }
      ]

      const pattern = metrics.analyzeTypingPattern(keystrokes)
      expect(pattern.rhythm).toBe('inconsistent')
    })
  })
})
```

### Vue Component Testing

```javascript
// components/TypingMonacoEditor.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import TypingMonacoEditor from '../TypingMonacoEditor.vue'

describe('TypingMonacoEditor', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(TypingMonacoEditor, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })]
      },
      props: {
        codeSnippet: 'console.log("Hello World");',
        language: 'javascript'
      }
    })
  })

  it('should render Monaco editor', async () => {
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.monaco-editor').exists()).toBe(true)
  })

  it('should track typing metrics', async () => {
    const editor = wrapper.vm.editor
    
    // Simulate typing
    editor.setValue('console.log("H')
    editor.trigger('keyboard', 'type', { text: 'e' })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.vm.typingMetrics.charactersTyped).toBe(1)
  })

  it('should highlight errors in real-time', async () => {
    const editor = wrapper.vm.editor
    
    // Type incorrect text
    editor.setValue('conole.log("Hello");') // Missing 's' in console
    
    await wrapper.vm.$nextTick()
    
    const errorDecorations = editor.getModel().getAllDecorations()
      .filter(d => d.options.className === 'typing-error')
    
    expect(errorDecorations.length).toBeGreaterThan(0)
  })
})
```

## Integration Tests (15-25%)

**Purpose**: Test interactions between components, modules, and services.

**Characteristics**:
- Test component integration
- Include database interactions
- API endpoint testing
- Medium execution speed

### API Integration Testing

```javascript
// tests/integration/api.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { $fetch } from 'ofetch'
import { setupTestDatabase, cleanupTestDatabase } from '../setup/database.js'

describe('Typing Session API', () => {
  let testDb

  beforeEach(async () => {
    testDb = await setupTestDatabase()
  })

  afterEach(async () => {
    await cleanupTestDatabase(testDb)
  })

  describe('POST /api/sessions', () => {
    it('should create new typing session', async () => {
      const sessionData = {
        userId: 'test-user-123',
        codeSnippet: 'console.log("test");',
        language: 'javascript'
      }

      const response = await $fetch('/api/sessions', {
        method: 'POST',
        body: sessionData
      })

      expect(response.id).toBeDefined()
      expect(response.status).toBe('active')
      expect(response.startTime).toBeDefined()

      // Verify in database
      const session = await testDb.query(
        'SELECT * FROM typing_sessions WHERE id = ?',
        [response.id]
      )
      expect(session.length).toBe(1)
      expect(session[0].user_id).toBe(sessionData.userId)
    })

    it('should validate required fields', async () => {
      await expect($fetch('/api/sessions', {
        method: 'POST',
        body: { userId: 'test-user' } // Missing required fields
      })).rejects.toMatchObject({
        status: 400,
        statusText: 'Bad Request'
      })
    })
  })

  describe('PUT /api/sessions/:id/metrics', () => {
    it('should update session metrics', async () => {
      // Create session first
      const session = await $fetch('/api/sessions', {
        method: 'POST',
        body: {
          userId: 'test-user-123',
          codeSnippet: 'console.log("test");',
          language: 'javascript'
        }
      })

      const metrics = {
        wpm: 45,
        accuracy: 0.95,
        charactersTyped: 18,
        errorsCount: 1
      }

      const response = await $fetch(`/api/sessions/${session.id}/metrics`, {
        method: 'PUT',
        body: metrics
      })

      expect(response.success).toBe(true)

      // Verify metrics in database
      const updatedSession = await testDb.query(
        'SELECT * FROM typing_sessions WHERE id = ?',
        [session.id]
      )
      expect(updatedSession[0].wpm).toBe(45)
      expect(updatedSession[0].accuracy).toBe(0.95)
    })
  })
})
```

### Database Integration Testing

```javascript
// tests/integration/database.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useDatabase } from '../../server/utils/database.js'

describe('Database Operations', () => {
  let db

  beforeEach(async () => {
    db = useDatabase(':memory:') // In-memory database for testing
    await db.migrate()
  })

  afterEach(async () => {
    await db.close()
  })

  describe('User Management', () => {
    it('should create and retrieve user', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        preferences: { theme: 'dark' }
      }

      const userId = await db.createUser(userData)
      expect(userId).toBeDefined()

      const user = await db.getUserById(userId)
      expect(user.email).toBe(userData.email)
      expect(user.username).toBe(userData.username)
      expect(user.preferences.theme).toBe('dark')
    })

    it('should enforce unique email constraint', async () => {
      const userData = {
        email: 'duplicate@example.com',
        username: 'user1'
      }

      await db.createUser(userData)

      await expect(
        db.createUser({ ...userData, username: 'user2' })
      ).rejects.toThrow('Email already exists')
    })
  })

  describe('Typing Sessions', () => {
    it('should handle session lifecycle', async () => {
      const userId = await db.createUser({
        email: 'test@example.com',
        username: 'testuser'
      })

      // Start session
      const sessionId = await db.createTypingSession({
        userId,
        codeSnippet: 'function test() {}',
        language: 'javascript'
      })

      // Update metrics
      await db.updateSessionMetrics(sessionId, {
        wpm: 50,
        accuracy: 0.98,
        charactersTyped: 20
      })

      // Complete session
      await db.completeSession(sessionId)

      const session = await db.getSessionById(sessionId)
      expect(session.status).toBe('completed')
      expect(session.wpm).toBe(50)
      expect(session.completedAt).toBeDefined()
    })
  })
})
```

## E2E Tests (5-10%)

**Purpose**: Test complete user workflows from UI to database.

**Characteristics**:
- Test real user scenarios
- Use actual browser
- Slower execution
- High confidence

### Playwright E2E Testing

```javascript
// tests/e2e/typing-session.test.js
import { test, expect } from '@playwright/test'

test.describe('Typing Session Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should complete full typing session', async ({ page }) => {
    // Start new session
    await page.click('[data-testid="new-session-btn"]')
    
    // Select JavaScript language
    await page.selectOption('[data-testid="language-select"]', 'javascript')
    
    // Wait for code snippet to load
    await page.waitForSelector('.monaco-editor')
    
    // Type the code
    const editor = page.locator('.monaco-editor .view-line')
    await editor.first().click()
    
    const codeToType = 'console.log("Hello World");'
    await page.keyboard.type(codeToType, { delay: 100 })
    
    // Verify typing metrics update
    await expect(page.locator('[data-testid="wpm-display"]')).toContainText(/\d+/)
    await expect(page.locator('[data-testid="accuracy-display"]')).toContainText(/\d+/)
    
    // Complete session
    await page.click('[data-testid="complete-session-btn"]')
    
    // Verify results page
    await expect(page).toHaveURL(/.*\/results\/.*/)
    await expect(page.locator('[data-testid="final-wpm"]')).toBeVisible()
    await expect(page.locator('[data-testid="final-accuracy"]')).toBeVisible()
    
    // Verify session is saved
    await page.goto('/history')
    await expect(page.locator('[data-testid="session-list"]')).toContainText(codeToType)
  })

  test('should handle typing errors gracefully', async ({ page }) => {
    await page.click('[data-testid="new-session-btn"]')
    await page.waitForSelector('.monaco-editor')
    
    const editor = page.locator('.monaco-editor .view-line')
    await editor.first().click()
    
    // Type incorrect text
    await page.keyboard.type('consle.log', { delay: 100 }) // Missing 'o' in console
    
    // Verify error highlighting
    await expect(page.locator('.typing-error')).toBeVisible()
    
    // Verify error count updates
    await expect(page.locator('[data-testid="errors-count"]')).toContainText('1')
    
    // Correct the error
    await page.keyboard.press('Backspace')
    await page.keyboard.press('Backspace')
    await page.keyboard.type('sole')
    
    // Verify error is cleared
    await expect(page.locator('.typing-error')).not.toBeVisible()
  })

  test('should persist session across page refreshes', async ({ page }) => {
    await page.click('[data-testid="new-session-btn"]')
    await page.waitForSelector('.monaco-editor')
    
    // Type some text
    const editor = page.locator('.monaco-editor .view-line')
    await editor.first().click()
    await page.keyboard.type('console.', { delay: 100 })
    
    // Refresh page
    await page.reload()
    
    // Verify session continues
    await expect(page.locator('[data-testid="resume-session-btn"]')).toBeVisible()
    await page.click('[data-testid="resume-session-btn"]')
    
    // Verify typed text is restored
    await expect(page.locator('.monaco-editor')).toContainText('console.')
  })
})
```

## Best Practices

### 1. Test Organization

```javascript
// tests/
// ├── unit/
// │   ├── composables/
// │   ├── utils/
// │   └── components/
// ├── integration/
// │   ├── api/
// │   ├── database/
// │   └── services/
// ├── e2e/
// │   ├── user-flows/
// │   └── critical-paths/
// ├── performance/
// └── setup/
//     ├── test-helpers.js
//     └── global-setup.js
```

### 2. Test Data Management

```javascript
// tests/fixtures/users.js
export const testUsers = {
  validUser: {
    email: 'test@example.com',
    username: 'testuser',
    preferences: { theme: 'dark' }
  },
  
  adminUser: {
    email: 'admin@example.com',
    username: 'admin',
    role: 'admin'
  }
}

// tests/fixtures/code-snippets.js
export const codeSnippets = {
  javascript: {
    easy: 'console.log("Hello");',
    medium: 'function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }',
    hard: `
class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }
  
  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(...args));
    }
  }
}`
  }
}
```

### 3. Mocking Strategy

```javascript
// tests/mocks/monaco-editor.js
export const mockMonacoEditor = {
  create: vi.fn(() => ({
    setValue: vi.fn(),
    getValue: vi.fn(() => ''),
    onDidChangeModelContent: vi.fn(),
    getModel: vi.fn(() => ({
      getAllDecorations: vi.fn(() => []),
      deltaDecorations: vi.fn()
    })),
    dispose: vi.fn()
  }))
}

// Mock only external dependencies
vi.mock('monaco-editor', () => ({
  editor: mockMonacoEditor
}))
```

## Metrics and Coverage

### Coverage Targets

```javascript
// vitest.config.js
export default {
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        global: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80
        }
      },
      exclude: [
        'tests/**',
        '**/*.test.js',
        '**/*.config.js'
      ]
    }
  }
}
```

### Quality Gates

```javascript
// tests/quality-gates.test.js
import { describe, it, expect } from 'vitest'
import { glob } from 'glob'
import { readFile } from 'fs/promises'

describe('Code Quality Gates', () => {
  it('should have test coverage for all composables', async () => {
    const composables = await glob('app/composables/*.js')
    const testFiles = await glob('tests/unit/composables/*.test.js')
    
    const composableNames = composables.map(f => f.split('/').pop().replace('.js', ''))
    const testNames = testFiles.map(f => f.split('/').pop().replace('.test.js', ''))
    
    composableNames.forEach(name => {
      expect(testNames).toContain(name)
    })
  })

  it('should not have TODO comments in production code', async () => {
    const sourceFiles = await glob('app/**/*.{js,vue}')
    
    for (const file of sourceFiles) {
      const content = await readFile(file, 'utf-8')
      expect(content).not.toMatch(/TODO|FIXME|XXX/i)
    }
  })
})
```

## Summary

The testing pyramid ensures:
- **Fast feedback** with many unit tests
- **Integration confidence** with moderate integration tests  
- **User experience validation** with few but comprehensive E2E tests
- **Quality gates** that prevent regression
- **Maintainable test suite** that scales with codebase

Remember: Good tests are your safety net for confident refactoring and feature development.