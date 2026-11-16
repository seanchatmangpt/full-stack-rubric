# Comprehensive Testing Guide

## 🧪 Testing Framework Overview

This project implements a comprehensive testing strategy using:

- **Cypress** for E2E and Component testing
- **Vitest** for Unit testing 
- **Vitest-Cucumber** for BDD (Behavior Driven Development)
- **Cypress-axe** for Accessibility testing
- **Custom reporting** for unified coverage analysis

## 📁 Testing Structure

```
my-app/
├── cypress/                     # Cypress E2E and Component tests
│   ├── components/              # Component-specific tests
│   │   └── ui-components.cy.js  # UI library component tests
│   ├── e2e/                     # End-to-end tests
│   │   └── user-workflows.cy.js # Complete user journey tests
│   ├── fixtures/                # Test data fixtures
│   │   └── api-response.json    # Mock API responses
│   └── support/                 # Cypress configuration and utilities
│       ├── commands.js          # Custom Cypress commands
│       ├── component.js         # Component test setup
│       └── e2e.js              # E2E test setup
├── src/test/                    # Vitest and BDD tests
│   ├── features/                # Cucumber feature files
│   │   ├── component-showcase.feature
│   │   └── user-authentication.feature
│   ├── step-definitions/        # BDD step implementations
│   │   ├── component-showcase.steps.js
│   │   └── user-authentication.steps.js
│   └── setup.js                # Global test configuration
├── scripts/
│   └── merge-reports.js         # Coverage report merger
└── .github/workflows/
    └── comprehensive-testing.yml # CI/CD pipeline
```

## 🚀 Quick Start

### Install Dependencies
```bash
pnpm install
```

### Run All Tests
```bash
# Run complete test suite
npm run test:all

# Run tests in parallel
npm run test:parallel

# Generate comprehensive report
npm run test:report
```

## 🎯 Testing Commands

### Vitest (Unit + BDD)
```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run BDD scenarios
npm run test:bdd

# Watch mode
npm run test:watch

# UI mode
npm run test:ui
```

### Cypress (E2E + Component)
```bash
# Open Cypress GUI
npm run cypress:open

# Run all Cypress tests
npm run cypress:run

# Component tests only
npm run cypress:component

# E2E tests only
npm run cypress:e2e
```

### Specialized Testing
```bash
# Accessibility testing
npm run test:accessibility

# Performance testing
npm run test:performance

# CI pipeline (coverage + e2e)
npm run test:ci
```

## 🧩 Component Testing

### Cypress Component Tests

Test individual Vue components in isolation:

```javascript
// cypress/components/ui-components.cy.js
import { TestButton } from '../support/test-components'

describe('Button Component', () => {
  it('renders with default props', () => {
    cy.mount(TestButton)
    cy.get('[data-testid="button-primary-medium"]')
      .should('be.visible')
      .and('contain', 'Button')
  })

  it('handles different variants', () => {
    const variants = ['primary', 'secondary', 'danger']
    variants.forEach(variant => {
      cy.mount(TestButton, { props: { variant } })
      cy.get(`[data-testid="button-${variant}-medium"]')
        .should('have.class', `btn-${variant}`)
    })
  })
})
```

### Features Tested
- ✅ Button variants and states
- ✅ Card components with props
- ✅ Modal interactions
- ✅ Form validation
- ✅ Responsive behavior
- ✅ Accessibility compliance

## 🌐 E2E Testing

### User Workflow Testing

Test complete user journeys across the application:

```javascript
// cypress/e2e/user-workflows.cy.js
describe('Authentication Flow', () => {
  it('should complete full login flow', () => {
    cy.visit('/')
    cy.testPerformance('/', { loadTime: 3000 })
    
    cy.get('[data-testid="login-link"]').click()
    cy.testFormValidation({
      email: {
        invalid: 'invalid-email',
        expectedError: 'Please enter a valid email'
      }
    })
    
    cy.login('test@example.com', 'password123')
    cy.url().should('include', '/dashboard')
    cy.testAccessibility()
  })
})
```

### Custom Commands

Powerful custom commands for common testing patterns:

```javascript
// Login helper
cy.login(email, password)

// Responsive testing
cy.testResponsive(selector, ['mobile', 'tablet', 'desktop'])

// Accessibility testing
cy.testAccessibility()

// Performance testing
cy.testPerformance(url, thresholds)

// Form validation testing
cy.testFormValidation(formData)
```

## 🥒 BDD Testing with Cucumber

### Feature Files

Behavior specifications in natural language:

```gherkin
# src/test/features/component-showcase.feature
Feature: UI Component Showcase
  As a developer using the UI pattern library
  I want to view and interact with all available components
  So that I can understand how to implement them

  Scenario: View component categories
    Given I am on the component showcase page
    When I look at the component navigation
    Then I should see the following categories:
      | category      |
      | Buttons       |
      | Forms         |
      | Cards         |
      | Modals        |
```

### Step Definitions

JavaScript implementations of feature steps:

```javascript
// src/test/step-definitions/component-showcase.steps.js
import { Given, When, Then } from '@amiceli/vitest-cucumber'

Given('I am on the component showcase page', async () => {
  wrapper = mount(ComponentShowcase)
  await wrapper.vm.$nextTick()
})

Then('I should see the following categories:', (dataTable) => {
  const expectedCategories = dataTable.hashes().map(row => row.category)
  const actualCategories = wrapper.findAll('.category-item h3').map(el => el.text())
  
  expectedCategories.forEach(category => {
    expect(actualCategories).toContain(category)
  })
})
```

## ♿ Accessibility Testing

### Automated WCAG Compliance

```javascript
// Comprehensive accessibility testing
cy.testAccessibility({
  rules: {
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'focus-management': { enabled: true },
    'aria-labels': { enabled: true }
  }
})

// Keyboard navigation testing
cy.testKeyboardNavigation([
  '[data-testid="category-buttons"]',
  '[data-testid="category-forms"]',
  '[data-testid="search-input"]'
])
```

### Accessibility Features Tested
- ✅ WCAG 2.1 AA compliance
- ✅ Keyboard navigation
- ✅ Screen reader compatibility
- ✅ Focus management
- ✅ Color contrast ratios
- ✅ ARIA labels and roles

## ⚡ Performance Testing

### Core Web Vitals

```javascript
// Performance benchmark testing
cy.testPerformance('/', {
  loadTime: 3000,
  firstContentfulPaint: 2000,
  largestContentfulPaint: 2500
})

// Resource timing analysis
cy.window().then((win) => {
  const resources = win.performance.getEntriesByType('resource')
  const totalSize = resources.reduce((sum, r) => sum + r.transferSize, 0)
  expect(totalSize).to.be.lessThan(2 * 1024 * 1024) // < 2MB
})
```

### Performance Metrics
- ✅ Page load time < 3 seconds
- ✅ First Contentful Paint < 2 seconds
- ✅ Largest Contentful Paint < 2.5 seconds
- ✅ Total bundle size < 2MB
- ✅ Resource optimization

## 📊 Coverage Reports

### Unified Reporting

The test suite generates comprehensive coverage reports:

```bash
# Generate combined coverage report
npm run test:report
```

**Generated Reports:**
- `coverage/combined-report.html` - Visual HTML report
- `coverage/combined-report.json` - Machine-readable JSON
- `coverage/test-summary.json` - Summary statistics

### Coverage Thresholds
- **Statements:** 80% minimum
- **Branches:** 75% minimum  
- **Functions:** 80% minimum
- **Lines:** 80% minimum

### Report Features
- ✅ Vitest + Cypress coverage merge
- ✅ File-by-file breakdown
- ✅ Threshold compliance checking
- ✅ Visual HTML dashboard
- ✅ CI/CD integration

## 🔄 CI/CD Integration

### GitHub Actions Pipeline

The comprehensive testing pipeline includes:

1. **Unit & BDD Tests** - Vitest with coverage
2. **Component Tests** - Cypress component testing
3. **E2E Tests** - Multi-browser Cypress E2E
4. **Accessibility Tests** - WCAG compliance validation
5. **Performance Tests** - Core Web Vitals benchmarks
6. **Visual Regression** - Screenshot comparisons
7. **Report Generation** - Unified coverage analysis
8. **Security Checks** - Dependency audit and code analysis

### Pipeline Features
- ✅ Parallel test execution
- ✅ Multi-browser testing (Chrome, Firefox, Edge)
- ✅ Artifact collection and storage
- ✅ PR comment integration
- ✅ Failure notifications
- ✅ Coverage tracking
- ✅ Performance monitoring

## 🛠️ Custom Testing Utilities

### Test Helpers

```javascript
// Global test utilities
global.createMockComponent = (name, template = '<div></div>')
global.mockAsync = (value, delay = 0)

// Vue component factory
const TestComponent = createMockComponent('TestComponent', `
  <div data-testid="test-component">
    <slot></slot>
  </div>
`)
```

### Mock Services

```javascript
// Authentication service mock
const mockAuthService = {
  login: vi.fn(),
  logout: vi.fn(),
  resetPassword: vi.fn()
}

// API response mocking
cy.intercept('GET', '/api/**', { fixture: 'api-response.json' })
```

## 🔧 Configuration

### Vitest Configuration

```javascript
// vitest.config.js
export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [
      cucumber({
        features: './src/test/features',
        step_definitions: './src/test/step-definitions'
      })
    ],
    test: {
      environment: 'jsdom',
      coverage: {
        thresholds: {
          global: {
            statements: 80,
            branches: 75,
            functions: 80,
            lines: 80
          }
        }
      }
    }
  })
)
```

### Cypress Configuration

```javascript
// cypress.config.js
export default defineConfig({
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite'
    }
  },
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config)
      require('cypress-terminal-report/src/installLogsPrinter')(on)
      return config
    }
  }
})
```

## 📋 Testing Checklist

### Pre-commit Checklist
- [ ] All unit tests passing
- [ ] BDD scenarios validated
- [ ] Component tests verified
- [ ] E2E workflows tested
- [ ] Accessibility compliance checked
- [ ] Performance thresholds met
- [ ] Coverage requirements satisfied

### Release Checklist  
- [ ] Full test suite passing
- [ ] Multi-browser compatibility verified
- [ ] Performance benchmarks met
- [ ] Accessibility audit complete
- [ ] Visual regression tests passed
- [ ] Coverage reports generated
- [ ] CI/CD pipeline successful

## 🎯 Best Practices

### Test Organization
- **Unit tests** for logic and utilities
- **Component tests** for UI components in isolation
- **Integration tests** for feature workflows
- **E2E tests** for complete user journeys
- **BDD scenarios** for business requirements

### Test Data Management
- Use fixtures for consistent test data
- Mock external dependencies
- Isolate tests from each other
- Clean up after each test

### Performance Optimization
- Run tests in parallel when possible
- Use appropriate test granularity
- Mock heavy operations
- Optimize test setup and teardown

### Maintenance
- Keep tests simple and focused
- Update tests with feature changes
- Remove obsolete tests
- Monitor test execution times

## 🚨 Troubleshooting

### Common Issues

**Cypress component mounting fails:**
```bash
# Check Vue component syntax and props
# Verify component imports
# Review mount options
```

**BDD step definitions not found:**
```bash
# Verify step_definitions path in vitest.config.js
# Check step function signatures
# Ensure proper imports
```

**Coverage thresholds not met:**
```bash
# Run npm run test:coverage to see detailed report
# Add tests for uncovered code paths
# Review excluded files configuration
```

**E2E tests timing out:**
```bash
# Increase timeout values in cypress.config.js
# Check application startup time
# Verify test data setup
```

## 📚 Additional Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Vitest Guide](https://vitest.dev/guide/)
- [Cucumber.js Documentation](https://cucumber.io/docs/cucumber/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Happy Testing!** 🎉

This comprehensive testing setup provides robust coverage for your UI pattern library with modern testing practices and CI/CD integration.