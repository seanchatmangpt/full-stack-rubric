# Interactive Examples - BDD + Nuxt 4 Testing Micro-Framework

Hands-on examples you can run immediately to learn the framework features.

## 🚀 Quick Start Examples

All examples are **runnable** - copy the code and run with `pnpm test`.

### Basic Examples

- **[Component Testing](./basic/component-testing.md)** - Simple component tests with quickTest
- **[BDD Scenarios](./basic/bdd-scenarios.md)** - Basic Given/When/Then patterns
- **[API Testing](./basic/api-testing.md)** - Testing REST endpoints
- **[Page Testing](./basic/page-testing.md)** - Testing Nuxt pages

### Advanced Examples

- **[Complex User Flows](./advanced/user-flows.md)** - Multi-step user journeys
- **[Performance Testing](./advanced/performance.md)** - Component and page performance
- **[State Management](./advanced/state-management.md)** - Testing Pinia stores
- **[Error Handling](./advanced/error-handling.md)** - Error boundaries and edge cases

### Integration Examples

- **[E2E Workflows](./integration/e2e-workflows.md)** - Complete application flows
- **[Authentication](./integration/authentication.md)** - Login, permissions, security
- **[Database Integration](./integration/database.md)** - Database operations and transactions
- **[External APIs](./integration/external-apis.md)** - Third-party API integration

## 🎮 Interactive Playground

### Try It Now - Component Test

Create `tests/playground.test.js` and run `pnpm test`:

```javascript
import { quickTest } from 'tests/framework/components/quick-test.js'

// Create a simple test component inline
const PlaygroundComponent = {
  name: 'PlaygroundComponent',
  props: {
    message: { type: String, default: 'Hello World' },
    variant: { type: String, default: 'primary' }
  },
  emits: ['click'],
  template: `
    <div class="playground" :class="variant">
      <h1>{{ message }}</h1>
      <button @click="$emit('click')" data-testid="play-button">
        Click me!
      </button>
    </div>
  `
}

// Test it with one line!
quickTest('Playground Component', PlaygroundComponent, {
  props: { message: 'Testing is fun!', variant: 'success' },
  events: ['click'],
  a11y: true
})
```

### Try It Now - BDD Scenario

```javascript
import { scenario } from 'tests/framework/core/index.js'

// Test a user flow
scenario('Playground user interaction')
  .given.user.isOnPage('/')
  .when.user.clicksButton('Get Started')
  .then.page.showsContent('Welcome')
  .and.response.hasStatusCode(200)
  .execute()
```

## 📚 Example Categories

### By Complexity

#### Beginner (5 min examples)
```javascript
// Single component test
quickTest('Button', Button)

// Simple page test  
scenario('Homepage').given.user.isOnPage('/').then.page.showsContent('Welcome').execute()
```

#### Intermediate (15 min examples)
```javascript
// Form validation
scenario('Contact form validation')
  .given.user.isOnPage('/contact')
  .when.user.submitsForm({})
  .then.page.showsValidationErrors()
  .when.user.fillsValidForm()
  .then.api.receivesFormData()
  .execute()
```

#### Advanced (30+ min examples)
```javascript
// Complete user journey with multiple systems
scenario('E-commerce purchase flow')
  .given.user.hasAccount()
  .given.store.hasProducts()
  .when.user.browses('/products')
  .when.user.addToCart('smartphone')
  .when.user.proceedsToCheckout()
  .then.payment.isProcessed()
  .then.email.isSent()
  .then.database.hasOrder()
  .execute()
```

### By Feature

#### Testing Types
- **Unit Tests** - Individual functions and components
- **Integration Tests** - Component interactions and API calls  
- **E2E Tests** - Complete user workflows
- **Performance Tests** - Speed and memory usage
- **Accessibility Tests** - Screen readers and keyboard navigation
- **Visual Tests** - UI appearance and responsive design

#### Framework Features
- **Auto-generation** - Props, events, mocks generated automatically
- **Smart Defaults** - Sensible configuration out of the box
- **Fluent Interface** - Natural language test writing
- **Performance Monitoring** - Built-in performance assertions
- **Error Handling** - Comprehensive error testing patterns

## 🛠️ Example Structure

Each example includes:

### 1. The Problem
What testing challenge does this solve?

### 2. Old Way vs New Way
Before and after code comparison

### 3. Complete Example
Runnable code you can copy and modify

### 4. Variations
Different ways to approach the same test

### 5. Best Practices
Tips for optimal testing patterns

### 6. Troubleshooting
Common issues and solutions

## 📖 How to Use Examples

### 1. Copy and Run
```bash
# Copy any example to your tests directory
cp docs/framework/examples/basic/component-testing.md tests/my-example.test.js

# Run it immediately  
pnpm test my-example
```

### 2. Modify for Your Needs
```javascript
// Start with an example
quickTest('Example Component', ExampleComponent)

// Modify for your component
quickTest('My Component', MyComponent, {
  props: { myProp: 'myValue' }
})
```

### 3. Build Complex Tests
```javascript
// Combine patterns from multiple examples
scenario('My complex workflow')
  .given.user.isAuthenticated()        // From authentication example
  .when.user.fillsForm(formData)       // From form example  
  .then.api.receivesData()             // From API example
  .then.page.showsConfirmation()       // From page example
  .execute()
```

## 🎯 Practice Exercises

### Exercise 1: Your First Test (5 minutes)
1. Pick any component from your project
2. Create a test using `quickTest`
3. Run it and see it pass
4. Add props, events, or accessibility testing

### Exercise 2: Page Testing (10 minutes)  
1. Create a scenario for any page in your app
2. Test navigation, content display, and user interaction
3. Add API mocking if the page fetches data

### Exercise 3: Complete User Flow (20 minutes)
1. Pick a user journey in your app (login, purchase, etc.)
2. Break it into Given/When/Then steps
3. Test the happy path and error cases

### Exercise 4: Performance Baseline (15 minutes)
1. Add performance testing to a heavy component
2. Set render time and memory usage limits
3. Run tests and optimize if needed

## 📱 Mobile and Responsive Examples

```javascript
// Test responsive behavior
responsiveTest('Navigation', NavigationComponent, [
  320,  // Mobile
  768,  // Tablet
  1024, // Desktop
  1920  // Large screen
])

// Mobile-specific interactions
scenario('Mobile menu interaction')
  .given.device.isMobile()
  .when.user.tapsElement('hamburger-menu')
  .then.page.showsMobileMenu()
  .when.user.swipesLeft()
  .then.page.hidesMobileMenu()
  .execute()
```

## 🔧 Testing Tools Examples

### Debugging Tests
```javascript
scenario('Debug example')
  .given.debug.enabled()           // Enable debug mode
  .when.user.clicksButton('test')
  .then.debug.screenshot()         // Take screenshot
  .then.debug.logContext()         // Log test context
  .execute()
```

### Custom Assertions
```javascript
// Extend framework with custom assertions
scenario('Custom assertions')
  .then.custom.hasTooltip('Expected tooltip text')
  .then.custom.isAnimated()
  .then.custom.meetsDesignSystem()
  .execute()
```

## 🚀 Next Steps

1. **Start with Basic Examples** - Get familiar with syntax
2. **Try Advanced Features** - Performance, accessibility testing
3. **Create Your Own Patterns** - Extend framework for your needs
4. **Share Examples** - Contribute back to the community

---

**Ready to explore?** Choose an example category and start testing! Each example is designed to be educational and immediately useful in real projects.

**Pro Tip:** Start with [Component Testing](./basic/component-testing.md) if you're new to the framework, or jump to [User Flows](./advanced/user-flows.md) if you want to see the full power of BDD scenarios.