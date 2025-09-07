# Getting Started with the BDD + Nuxt 4 Testing Micro-Framework

A zero-config testing framework that reduces boilerplate by 80% for Nuxt 4 applications using BDD patterns and fluent interfaces.

## Quick Start (Zero Configuration)

### 1. Installation

The framework is already included in your Nuxt project. No additional packages needed!

```bash
# Run tests immediately
pnpm test

# Watch mode for development
pnpm test:watch

# BDD-specific tests
pnpm test:bdd
```

### 2. Your First Test (5 Minutes)

Create `tests/my-first.test.js`:

```javascript
import { scenario } from 'tests/framework/core/index.js'

scenario('User visits homepage')
  .given.user.isOnPage('/')
  .when.user.clicksButton('Get Started')
  .then.page.showsContent('Welcome to Nuxt')
  .and.response.hasStatusCode(200)
  .execute()
```

That's it! Run with `pnpm test`.

### 3. Component Testing (One-Liner)

```javascript
import { quickTest } from 'tests/framework/components/quick-test.js'
import AppHeader from '~/components/AppHeader.vue'

// Automatically tests props, events, accessibility, and rendering
quickTest('AppHeader', AppHeader, {
  props: { title: 'My App' },
  events: ['menu-toggle', 'search'],
  a11y: true
})
```

## Core Concepts

### Fluent BDD Interface

The framework provides natural language testing:

```javascript
import { scenario, given, when, then } from 'tests/framework/core/index.js'

// Method 1: Full scenario builder
scenario('Complete user journey')
  .given.user.isAuthenticated()
  .given.database.hasUsers(5)
  .when.user.navigatesTo('/dashboard')
  .when.api.fetchesData('/api/stats')
  .then.page.displays('statistics')
  .then.session.isActive()
  .execute()

// Method 2: Individual builders
given.user.isOnPage('/login')
when.user.fillsForm({ email: 'test@example.com', password: 'secret' })
then.user.isRedirectedTo('/dashboard')
```

### Smart Component Testing

```javascript
import { quickTest, batchTest, propMatrix } from 'tests/framework/components/quick-test.js'

// Test single component with smart defaults
quickTest('MyButton', MyButton, {
  autoProps: true,    // Auto-generate props from component definition
  events: ['click'],  // Test these events automatically
  a11y: true         // Accessibility testing included
})

// Test multiple components at once
batchTest([
  ['Header', HeaderComponent],
  ['Footer', FooterComponent, { shallow: true }],
  ['Sidebar', SidebarComponent, { props: { collapsed: true } }]
])

// Test all prop combinations
propMatrix('Button States', ButtonComponent, [
  { variant: 'primary', size: 'sm' },
  { variant: 'secondary', size: 'lg' },
  { variant: 'ghost', disabled: true }
])
```

## Zero Configuration Features

### Automatic Setup

The framework automatically provides:

- ✅ Nuxt 4 context and routing
- ✅ Component mounting with smart defaults  
- ✅ Mock API responses
- ✅ Accessibility testing
- ✅ Performance monitoring
- ✅ Auto-generated step definitions
- ✅ Cross-browser testing setup

### Smart Defaults

```javascript
// These work out of the box with zero config:

scenario('API Integration')
  .given.api.isAvailable()           // Auto-mocks API endpoints
  .when.user.submitsForm(formData)   // Handles form validation
  .then.api.receivedData(expected)   // Validates API calls
  .execute()

quickTest('MyComponent', MyComponent) // Auto-generates props, tests events, validates a11y
```

### Built-in Utilities

Pre-configured utilities available everywhere:

```javascript
import { 
  userActions,      // Common user interactions
  pageHelpers,      // Page navigation and validation
  apiMocks,         // API mocking utilities
  dataFactories,    // Test data generation
  performanceUtils  // Performance testing helpers
} from 'tests/framework/core-utils.js'
```

## File Organization

```
tests/
├── framework/           # Core framework (don't modify)
│   ├── core/           # Main BDD engine
│   ├── components/     # Component testing utilities
│   ├── bdd/           # Step generators and definitions
│   ├── actions/       # User and page actions
│   └── performance/   # Performance testing tools
├── unit/              # Unit tests
├── integration/       # Integration tests
├── e2e/              # End-to-end tests
└── setup/            # Test configuration
```

## Next Steps

1. **[API Reference](./api-reference.md)** - Complete API documentation
2. **[Recipes](./recipes.md)** - Common testing patterns
3. **[Migration Guide](./migration-guide.md)** - Transition from standard testing
4. **[Examples](./examples/)** - Interactive examples and playground

## Configuration (Optional)

While zero-config works for most cases, you can customize:

```javascript
// vitest.config.js - already configured for you
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: [
      'tests/setup/dom-setup.js',    // DOM utilities
      'tests/setup/global-setup.js' // Global test setup
    ],
    include: [
      'tests/**/*.test.js',
      'tests/**/*.steps.js'
    ]
  }
})
```

## Performance Benefits

- **80% less boilerplate** - One line replaces 20-50 lines of setup
- **Zero configuration** - Works immediately with sensible defaults
- **Smart auto-generation** - Props, mocks, and steps generated automatically
- **Built-in best practices** - A11y, performance, and error handling included
- **Nuxt-optimized** - Deep integration with Nuxt 4 patterns

## Help & Support

- Run `pnpm test` to see your tests in action
- Check `tests/simple.test.js` for a working example
- All examples in this documentation are runnable
- Framework source code is in `tests/framework/` for reference

---

**Ready to test?** Create your first test file and run `pnpm test` - it just works!