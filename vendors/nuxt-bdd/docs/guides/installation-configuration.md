# Installation and Configuration Guide

This comprehensive guide covers installing and configuring Nuxt BDD in your Nuxt.js project.

## Prerequisites

Before installing Nuxt BDD, ensure you have:

- **Node.js**: Version 16.x or later
- **Nuxt.js**: Version 3.x or later  
- **Package Manager**: pnpm (recommended), npm, or yarn

```bash
# Check versions
node --version  # Should be 16.x or later
npm list nuxt   # Should be 3.x or later
```

## Installation

### 1. Core Dependencies

Install Nuxt BDD and its required dependencies:

```bash
# Using pnpm (recommended)
pnpm add -D nuxt-bdd @amiceli/vitest-cucumber @vue/test-utils vitest jsdom

# Using npm
npm install --save-dev nuxt-bdd @amiceli/vitest-cucumber @vue/test-utils vitest jsdom

# Using yarn
yarn add -D nuxt-bdd @amiceli/vitest-cucumber @vue/test-utils vitest jsdom
```

### 2. Optional Dependencies

For enhanced functionality, you may also want:

```bash
# Test coverage reporting
pnpm add -D @vitest/coverage-v8

# UI test runner
pnpm add -D @vitest/ui

# Playwright for E2E testing (if needed)
pnpm add -D @playwright/test

# Better SQLite3 for database testing
pnpm add -D better-sqlite3
```

### 3. Verify Installation

Check that all packages are installed correctly:

```bash
pnpm list nuxt-bdd @amiceli/vitest-cucumber @vue/test-utils vitest
```

## Configuration

### 1. Vitest Configuration

Create or update your `vitest.config.js`:

```javascript
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Enable global test APIs (describe, it, expect, etc.)
    globals: true,
    
    // Use jsdom for DOM testing
    environment: 'jsdom',
    
    // Setup files to run before tests
    setupFiles: [
      './tests/setup/global-setup.js',
      './tests/setup/dom-setup.js'
    ],
    
    // Include BDD step files
    include: [
      'tests/**/*.{test,spec}.{js,ts}',
      'tests/**/*.steps.{js,ts}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules/**',
      'dist/**',
      '.nuxt/**',
      '.output/**'
    ],
    
    // Test timeout (30 seconds)
    testTimeout: 30000,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.config.{js,ts}',
        '.nuxt/**',
        '.output/**'
      ]
    }
  },
  
  // Resolve aliases to match Nuxt's
  resolve: {
    alias: {
      '~': resolve(__dirname, './'),
      '@': resolve(__dirname, './'),
      '~~': resolve(__dirname, './'),
      '@@': resolve(__dirname, './'),
      'assets': resolve(__dirname, './assets'),
      'public': resolve(__dirname, './public'),
      'static': resolve(__dirname, './static')
    }
  }
})
```

### 2. Package.json Scripts

Add test scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "preview": "nuxt preview",
    
    "test": "vitest",
    "test:unit": "vitest tests/unit",
    "test:bdd": "vitest tests/**/*.steps.js",
    "test:run": "vitest run",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:coverage:ui": "vitest --ui --coverage"
  }
}
```

### 3. Test Setup Files

#### Global Setup

Create `tests/setup/global-setup.js`:

```javascript
import { beforeEach, afterEach, vi } from 'vitest'
import { config } from '@vue/test-utils'

// Configure Vue Test Utils globally
config.global.stubs = {
  // Nuxt built-ins
  NuxtLink: { template: '<a href="#"><slot /></a>' },
  NuxtPage: { template: '<div><slot /></div>' },
  NuxtLayout: { template: '<div><slot /></div>' },
  NuxtLoadingIndicator: { template: '<div></div>' },
  
  // Nuxt UI components (if using)
  UButton: { 
    template: '<button @click="$emit(\'click\')" v-bind="$attrs"><slot /></button>',
    emits: ['click']
  },
  UInput: {
    template: '<input v-model="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" v-bind="$attrs" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
  },
  UTextarea: {
    template: '<textarea v-model="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" v-bind="$attrs"></textarea>',
    props: ['modelValue'],
    emits: ['update:modelValue']
  }
}

// Global mocks
beforeEach(() => {
  // Mock Nuxt composables
  vi.stubGlobal('useNuxtApp', () => ({
    $router: { push: vi.fn(), replace: vi.fn() },
    $route: { path: '/', params: {}, query: {} }
  }))
  
  vi.stubGlobal('useRouter', () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  }))
  
  vi.stubGlobal('useRoute', () => ({
    path: '/',
    params: {},
    query: {},
    hash: '',
    meta: {}
  }))
  
  // Mock fetch and localStorage
  global.fetch = vi.fn()
  
  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    },
    writable: true
  })
  
  Object.defineProperty(global, 'sessionStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    },
    writable: true
  })
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})
```

#### DOM Setup

Create `tests/setup/dom-setup.js`:

```javascript
import { vi } from 'vitest'

// Mock window methods
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true
})

Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
  writable: true
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock URL.createObjectURL
Object.defineProperty(global.URL, 'createObjectURL', {
  value: vi.fn(() => 'mock-url'),
  writable: true
})

// Mock console methods if needed
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    // Uncomment to suppress console output in tests
    // log: vi.fn(),
    // warn: vi.fn(),
    // error: vi.fn()
  }
}
```

### 4. Directory Structure

Create the recommended test directory structure:

```bash
mkdir -p tests/{features,steps,setup,utils,unit,e2e,fixtures}
```

Your test directory should look like this:

```
tests/
├── features/           # Gherkin feature files
│   ├── auth/
│   ├── components/
│   └── pages/
├── steps/             # Step definitions
│   ├── common/
│   ├── auth/
│   ├── components/
│   └── pages/
├── setup/             # Test configuration
│   ├── global-setup.js
│   ├── dom-setup.js
│   └── bdd-setup.js
├── utils/             # Test utilities
│   ├── test-data.js
│   ├── mock-helpers.js
│   └── component-helpers.js
├── fixtures/          # Test data files
│   ├── users.json
│   └── api-responses.json
├── unit/              # Traditional unit tests
└── e2e/               # End-to-end tests
```

### 5. BDD-Specific Configuration

Create `tests/setup/bdd-setup.js` for BDD-specific configuration:

```javascript
import { VitestCucumberBridge } from 'nuxt-bdd'
import { beforeEach } from 'vitest'

// Configure the BDD bridge
const bddBridge = new VitestCucumberBridge({
  autoCleanup: true,
  performanceTracking: process.env.PERFORMANCE_TRACKING === 'true',
  mockDefaults: {
    // Add your global component stubs here
    CustomComponent: { template: '<div><slot /></div>' }
  }
})

// Export for use in step definitions
export { bddBridge }

// Global BDD setup
beforeEach(() => {
  // Any global BDD setup logic
})
```

### 6. TypeScript Configuration (Optional)

If using TypeScript, create or update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["vitest/globals", "@vue/runtime-core"],
    "baseUrl": ".",
    "paths": {
      "~/*": ["./*"],
      "@/*": ["./*"],
      "~~/*": ["./*"],
      "@@/*": ["./*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.vue",
    "tests/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    ".nuxt",
    ".output"
  ]
}
```

Add TypeScript dependencies:

```bash
pnpm add -D typescript @nuxt/typescript-build
```

## Environment-Specific Configuration

### Development Environment

Create `.env.test`:

```env
NODE_ENV=test
NUXT_PUBLIC_API_BASE=http://localhost:3001
TEST_DATABASE_URL=sqlite::memory:
PERFORMANCE_TRACKING=false
```

### CI/CD Environment

Create `.env.ci`:

```env
NODE_ENV=test
CI=true
PERFORMANCE_TRACKING=true
COVERAGE_THRESHOLD=80
```

Update your GitHub Actions workflow:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: latest
          
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: pnpm
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Run BDD tests
        run: pnpm test:run
        env:
          NODE_ENV: test
          
      - name: Generate coverage
        run: pnpm test:coverage
        
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
```

## Advanced Configuration

### Performance Tracking

Enable performance tracking for critical tests:

```javascript
// tests/setup/performance-setup.js
import { VitestCucumberBridge } from 'nuxt-bdd'

export const performanceBridge = new VitestCucumberBridge({
  performanceTracking: true,
  mockDefaults: {
    // Minimal stubs for performance testing
    HeavyComponent: { template: '<div>Mock</div>' }
  }
})

// Use in performance-critical step definitions
export function setupPerformanceTest() {
  return performanceBridge
}
```

### Custom Component Stubs

Create reusable component stubs:

```javascript
// tests/utils/component-stubs.js
export const commonStubs = {
  // Nuxt UI stubs
  UButton: {
    template: '<button @click="$emit(\'click\')" :disabled="disabled" v-bind="$attrs"><slot /></button>',
    props: ['disabled'],
    emits: ['click']
  },
  
  UInput: {
    template: `
      <input 
        :value="modelValue" 
        @input="$emit('update:modelValue', $event.target.value)"
        :type="type || 'text'"
        :placeholder="placeholder"
        :disabled="disabled"
        v-bind="$attrs"
      />
    `,
    props: ['modelValue', 'type', 'placeholder', 'disabled'],
    emits: ['update:modelValue']
  },
  
  UModal: {
    template: `
      <div v-if="modelValue" class="modal-overlay" @click.self="$emit('update:modelValue', false)">
        <div class="modal-content">
          <slot name="header" />
          <slot />
          <slot name="footer" />
        </div>
      </div>
    `,
    props: ['modelValue'],
    emits: ['update:modelValue']
  },
  
  // Monaco Editor stub
  MonacoEditor: {
    template: `
      <textarea 
        :value="modelValue" 
        @input="$emit('update:modelValue', $event.target.value)"
        class="monaco-editor-mock"
        :placeholder="lang ? \`Code (\${lang})\` : 'Code'"
      ></textarea>
    `,
    props: ['modelValue', 'lang', 'options'],
    emits: ['update:modelValue']
  }
}

// Icon stubs
export const iconStubs = {
  UIcon: {
    template: '<span :class="name" class="icon-mock">{{ name }}</span>',
    props: ['name']
  }
}
```

### Database Testing Setup

For components that interact with databases:

```javascript
// tests/setup/database-setup.js
import Database from 'better-sqlite3'
import { beforeEach, afterEach } from 'vitest'

let db

beforeEach(() => {
  // Create in-memory database for each test
  db = new Database(':memory:')
  
  // Create test tables
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // Insert test data
  db.prepare(`
    INSERT INTO users (name, email) VALUES 
    ('John Doe', 'john@example.com'),
    ('Jane Smith', 'jane@example.com')
  `).run()
  
  // Make db available globally
  global.testDb = db
})

afterEach(() => {
  if (db) {
    db.close()
    global.testDb = null
  }
})
```

## Troubleshooting Configuration

### Common Issues

1. **Module Resolution Errors**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

2. **Alias Resolution Issues**
   ```javascript
   // Add to vitest.config.js
   resolve: {
     alias: {
       '~': resolve(__dirname, './'),
       '@': resolve(__dirname, './')
     }
   }
   ```

3. **DOM Environment Issues**
   ```javascript
   // Ensure jsdom is configured
   export default defineConfig({
     test: {
       environment: 'jsdom'
     }
   })
   ```

### Validation

Verify your configuration is working:

```bash
# Test that vitest can find your tests
pnpm vitest list

# Run a simple test to verify setup
pnpm test tests/setup/validation.test.js
```

Create a validation test:

```javascript
// tests/setup/validation.test.js
import { test, expect } from 'vitest'
import { mount } from '@vue/test-utils'

test('configuration validation', () => {
  // Test that basic testing works
  expect(1 + 1).toBe(2)
  
  // Test that Vue Test Utils works
  const wrapper = mount({ template: '<div>Hello World</div>' })
  expect(wrapper.text()).toBe('Hello World')
  
  // Test that DOM environment works
  expect(document).toBeDefined()
  expect(window).toBeDefined()
})
```

## Next Steps

After configuration:

1. **Create your first feature file** - See [Basic Component Test](../examples/basic-component-test.md)
2. **Set up shared step definitions** - See [Step Definition Patterns](./step-definition-patterns.md)
3. **Configure CI/CD** - Integrate BDD tests into your deployment pipeline
4. **Enable performance tracking** - For critical user journeys

Your Nuxt BDD setup is now complete and ready for behavior-driven development!