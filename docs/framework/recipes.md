# Recipes - Common Testing Patterns

Practical solutions for common testing scenarios using the BDD + Nuxt 4 micro-framework.

## 🚀 Quick Recipes

### Component Testing Recipes

#### Recipe 1: Form Component with Validation

```javascript
import { quickTest } from 'tests/framework/components/quick-test.js'
import ContactForm from '~/components/ContactForm.vue'

quickTest('Contact Form', ContactForm, {
  props: {
    initialData: { name: '', email: '', message: '' }
  },
  events: ['submit', 'validate', 'error']
})

// Add custom validation tests
.then((utils) => {
  it('validates required fields', async () => {
    await utils.wrapper.find('form').trigger('submit')
    expect(utils.wrapper.find('.error-message').exists()).toBe(true)
  })

  it('submits valid data', async () => {
    await utils.wrapper.find('[data-testid="name"]').setValue('John Doe')
    await utils.wrapper.find('[data-testid="email"]').setValue('john@example.com')
    await utils.wrapper.find('[data-testid="message"]').setValue('Hello!')
    await utils.wrapper.find('form').trigger('submit')
    
    expect(utils.wrapper.emitted('submit')).toBeTruthy()
  })
})
```

#### Recipe 2: Modal Component Testing

```javascript
import { scenario } from 'tests/framework/core/index.js'

scenario('Modal component behavior')
  .given.page.containsElement('[data-testid="modal-trigger"]')
  .when.user.clicksButton('modal-trigger')
  .then.page.showsContent('modal-content')
  .and.page.hasClass('modal-open', 'body')
  
  // Test modal closing
  .when.user.presses('Escape')
  .then.page.doesNotShow('modal-content')
  .and.page.doesNotHaveClass('modal-open', 'body')
  
  // Test backdrop click
  .when.user.clicksButton('modal-trigger')
  .when.user.clicksElement('.modal-backdrop')
  .then.page.doesNotShow('modal-content')
  .execute()
```

#### Recipe 3: Data Table with Sorting and Filtering

```javascript
import { propMatrix } from 'tests/framework/components/quick-test.js'
import DataTable from '~/components/DataTable.vue'

const testData = [
  { id: 1, name: 'Alice', age: 25, role: 'admin' },
  { id: 2, name: 'Bob', age: 30, role: 'user' },
  { id: 3, name: 'Carol', age: 28, role: 'user' }
]

// Test different table configurations
propMatrix('DataTable States', DataTable, [
  { data: testData, sortable: true, filterable: false },
  { data: testData, sortable: false, filterable: true },
  { data: testData, sortable: true, filterable: true, paginated: true },
  { data: [], loading: true },
  { data: [], error: 'Failed to load data' }
])

// Test sorting behavior
scenario('Table sorting')
  .given.page.hasElement('[data-testid="data-table"]')
  .given.database.hasRecords('users', testData)
  .when.user.clicksElement('[data-testid="sort-name"]')
  .then.page.showsInOrder(['Alice', 'Bob', 'Carol'])
  .when.user.clicksElement('[data-testid="sort-name"]')
  .then.page.showsInOrder(['Carol', 'Bob', 'Alice'])
  .execute()

// Test filtering
scenario('Table filtering')
  .given.page.hasElement('[data-testid="filter-input"]')
  .when.user.fillsInput('filter-input', 'admin')
  .then.page.showsRowCount(1)
  .then.page.showsContent('Alice')
  .when.user.clearsInput('filter-input')
  .then.page.showsRowCount(3)
  .execute()
```

### API Testing Recipes

#### Recipe 4: REST API CRUD Operations

```javascript
scenario('User CRUD operations')
  .given.api.isAvailable()
  .given.database.isEmpty('users')
  
  // Create
  .when.api.postsData('/api/users', {
    name: 'John Doe',
    email: 'john@example.com'
  })
  .then.api.respondedWith(201)
  .then.api.returnedData({ id: expect.any(Number) })
  
  // Read
  .when.api.fetchesData('/api/users/1')
  .then.api.respondedWith(200)
  .then.api.returnedData({
    id: 1,
    name: 'John Doe',
    email: 'john@example.com'
  })
  
  // Update
  .when.api.putsData('/api/users/1', {
    name: 'John Smith'
  })
  .then.api.respondedWith(200)
  .then.api.returnedData({
    id: 1,
    name: 'John Smith',
    email: 'john@example.com'
  })
  
  // Delete
  .when.api.deletesResource('/api/users/1')
  .then.api.respondedWith(204)
  .when.api.fetchesData('/api/users/1')
  .then.api.respondedWith(404)
  .execute()
```

#### Recipe 5: API Error Handling

```javascript
scenario('API error scenarios')
  .given.api.willFail('/api/users', 500)
  .when.user.submitsForm({ name: 'Test User' })
  .then.page.showsError('Server error occurred')
  .then.user.seesRetryButton()
  
  // Test retry mechanism
  .given.api.willSucceed('/api/users')
  .when.user.clicksButton('Retry')
  .then.api.wasCalledWith('/api/users')
  .then.page.showsSuccess('User created successfully')
  .execute()

// Test different error types
const errorScenarios = [
  { status: 400, message: 'Invalid data provided' },
  { status: 401, message: 'Authentication required' },
  { status: 403, message: 'Access denied' },
  { status: 404, message: 'Resource not found' },
  { status: 429, message: 'Too many requests' },
  { status: 500, message: 'Server error occurred' }
]

errorScenarios.forEach(({ status, message }) => {
  scenario(`API ${status} error handling`)
    .given.api.willFail('/api/test', status)
    .when.api.fetchesData('/api/test')
    .then.api.respondedWith(status)
    .then.page.showsError(message)
    .execute()
})
```

### Authentication & Authorization Recipes

#### Recipe 6: Login Flow

```javascript
scenario('User login flow')
  .given.user.isNotAuthenticated()
  .given.page.isReady('/login')
  
  // Test validation
  .when.user.submitsForm({})
  .then.page.showsValidationErrors(['Email is required', 'Password is required'])
  
  // Test invalid credentials
  .when.user.fillsForm({
    email: 'wrong@example.com',
    password: 'wrongpass'
  })
  .when.user.clicksButton('Login')
  .then.api.respondedWith(401)
  .then.page.showsError('Invalid credentials')
  
  // Test successful login
  .when.user.fillsForm({
    email: 'user@example.com',
    password: 'correctpass'
  })
  .when.user.clicksButton('Login')
  .then.api.respondedWith(200)
  .then.user.isRedirectedTo('/dashboard')
  .then.user.isAuthenticated()
  .execute()
```

#### Recipe 7: Protected Routes

```javascript
scenario('Protected route access')
  .given.user.isNotAuthenticated()
  .when.user.navigatesTo('/admin')
  .then.user.isRedirectedTo('/login')
  
  .given.user.isAuthenticated()
  .given.user.hasRole('user')
  .when.user.navigatesTo('/admin')
  .then.page.showsError('Access denied')
  
  .given.user.hasRole('admin')
  .when.user.navigatesTo('/admin')
  .then.page.hasUrl('/admin')
  .then.page.showsContent('Admin Dashboard')
  .execute()
```

### State Management Recipes

#### Recipe 8: Pinia Store Testing

```javascript
import { createTestingPinia } from '@pinia/testing'
import { useUserStore } from '~/stores/user.js'

scenario('User store operations')
  .given.store.isInitialized(createTestingPinia())
  
  // Test store actions
  .when.store.dispatches('user/login', credentials)
  .then.store.hasState('user.isAuthenticated', true)
  .then.store.hasState('user.profile.name', 'John Doe')
  
  // Test store getters
  .then.store.getter('user/isAdmin').returns(false)
  .then.store.getter('user/fullName').returns('John Doe')
  
  // Test store mutations
  .when.store.commits('user/updateProfile', { name: 'Jane Doe' })
  .then.store.hasState('user.profile.name', 'Jane Doe')
  .then.store.getter('user/fullName').returns('Jane Doe')
  .execute()

// Component with store integration
quickTest('UserProfile with Store', UserProfile, {
  global: {
    plugins: [createTestingPinia({
      initialState: {
        user: {
          profile: { name: 'Test User', email: 'test@example.com' }
        }
      }
    })]
  }
})
```

### Performance Testing Recipes

#### Recipe 9: Component Performance

```javascript
import { 
  measureRenderTime,
  measureMemoryUsage,
  createPerformanceTest
} from 'tests/framework/performance/perf-assertions.js'

// Performance baseline testing
createPerformanceTest('HeavyComponent Performance', HeavyComponent, {
  renderTime: { max: 100 },      // 100ms max render time
  memoryUsage: { max: 5 },       // 5MB max memory usage
  bundleSize: { max: 50 },       // 50KB max bundle size
  
  scenarios: [
    { props: { items: [] }, name: 'Empty state' },
    { props: { items: Array(100).fill({}) }, name: '100 items' },
    { props: { items: Array(1000).fill({}) }, name: '1000 items' }
  ]
})

// Custom performance tests
scenario('Large list rendering performance')
  .given.page.hasComponent('ItemList')
  .when.page.rendersData(Array(10000).fill({}))
  .then.performance.renderTime.isLessThan(200)
  .then.performance.memoryUsage.isLessThan(10)
  .then.page.isResponsive()
  .execute()
```

#### Recipe 10: Bundle Size Monitoring

```javascript
import { measureBundleSize } from 'tests/framework/performance/bundle-analysis.js'

// Monitor component bundle sizes
const componentSizes = await Promise.all([
  measureBundleSize('~/components/Header.vue'),
  measureBundleSize('~/components/Navigation.vue'),
  measureBundleSize('~/components/Footer.vue')
])

componentSizes.forEach(({ component, size }) => {
  it(`${component} bundle size`, () => {
    expect(size).toBeLessThan(20) // 20KB limit
  })
})

// Page bundle analysis
scenario('Page bundle optimization')
  .given.page.loads('/heavy-page')
  .then.performance.bundleSize.isLessThan(500) // 500KB limit
  .then.performance.loadTime.isLessThan(2000)  // 2s load time
  .then.performance.score.isGreaterThan(90)    // Lighthouse score > 90
  .execute()
```

### E2E Testing Recipes

#### Recipe 11: Complete User Journey

```javascript
scenario('Complete e-commerce user journey')
  // Homepage
  .given.user.isOnPage('/')
  .then.page.showsContent('Welcome')
  
  // Browse products
  .when.user.navigatesTo('/products')
  .then.page.showsProducts()
  .when.user.clicksProduct('smartphone')
  .then.page.hasUrl('/products/smartphone')
  
  // Add to cart
  .when.user.clicksButton('Add to Cart')
  .then.page.showsNotification('Added to cart')
  .when.user.clicksButton('Cart')
  .then.page.hasUrl('/cart')
  .then.page.showsCartItem('smartphone')
  
  // Checkout
  .when.user.clicksButton('Checkout')
  .then.user.isRedirectedTo('/login')
  .when.user.logsIn('customer@example.com', 'password')
  .then.user.isRedirectedTo('/checkout')
  
  // Fill shipping info
  .when.user.fillsShippingForm({
    address: '123 Main St',
    city: 'New York',
    zip: '10001'
  })
  .when.user.clicksButton('Continue to Payment')
  
  // Payment
  .when.user.fillsPaymentForm({
    cardNumber: '4111111111111111',
    expiry: '12/25',
    cvc: '123'
  })
  .when.user.clicksButton('Place Order')
  
  // Confirmation
  .then.page.showsSuccess('Order placed successfully')
  .then.page.hasUrl('/order-confirmation')
  .then.user.receivesEmail('Order confirmation')
  .execute()
```

#### Recipe 12: Multi-Browser Testing

```javascript
import { browsers } from 'tests/framework/integration/browser-config.js'

browsers.forEach(browser => {
  scenario(`Cross-browser compatibility - ${browser.name}`)
    .given.browser.is(browser.name)
    .given.page.loads('/')
    .then.page.rendersCorrectly()
    .then.page.isInteractive()
    
    // Test key interactions
    .when.user.clicksButton('Menu')
    .then.page.showsNavigation()
    
    .when.user.fillsForm({ search: 'test query' })
    .then.page.showsSearchResults()
    
    // Test responsive behavior
    .when.browser.resizeTo(320, 568) // iPhone SE
    .then.page.isMobileOptimized()
    
    .when.browser.resizeTo(1920, 1080) // Desktop
    .then.page.isDesktopOptimized()
    .execute()
})
```

### Accessibility Testing Recipes

#### Recipe 13: Comprehensive A11y Testing

```javascript
scenario('Accessibility compliance')
  .given.page.loads('/contact')
  
  // Keyboard navigation
  .when.user.pressesTab()
  .then.page.focusIsOn('first-input')
  .when.user.pressesKeys(['Tab', 'Tab', 'Tab'])
  .then.page.focusIsOn('submit-button')
  .when.user.pressesKey('Enter')
  .then.form.isSubmitted()
  
  // Screen reader testing
  .then.page.hasAriaLabels()
  .then.page.hasProperHeadingStructure()
  .then.page.hasAltTextForImages()
  .then.page.hasLandmarkRegions()
  
  // Color contrast
  .then.page.meetsColorContrastRatio(4.5)
  
  // Focus management
  .when.user.opensModal()
  .then.page.focusIsTrappedInModal()
  .when.user.closesModal()
  .then.page.focusReturnsToTrigger()
  .execute()

// Component accessibility testing
quickTest('Accessible Button', AccessibleButton, {
  a11y: true,
  props: { variant: 'primary' }
})
.then((utils) => {
  it('has proper ARIA attributes', () => {
    const button = utils.wrapper.find('button')
    expect(button.attributes('aria-label')).toBeDefined()
    expect(button.attributes('role')).toBe('button')
  })
  
  it('supports keyboard interaction', async () => {
    const button = utils.wrapper.find('button')
    await button.trigger('keydown.enter')
    expect(utils.wrapper.emitted('click')).toBeTruthy()
  })
})
```

### Database Testing Recipes

#### Recipe 14: Database Operations

```javascript
scenario('Database integration')
  .given.database.isEmpty('users')
  .given.database.hasTable('users')
  
  // Test data creation
  .when.api.createsUser({ name: 'John', email: 'john@example.com' })
  .then.database.hasRecord('users', { name: 'John' })
  .then.database.recordCount('users').equals(1)
  
  // Test data updates
  .when.api.updatesUser(1, { name: 'John Smith' })
  .then.database.hasRecord('users', { id: 1, name: 'John Smith' })
  
  // Test relationships
  .when.api.createsPost({ userId: 1, title: 'Test Post' })
  .then.database.hasRecord('posts', { userId: 1 })
  .then.database.relationExists('users', 'posts', { userId: 1 })
  
  // Test transactions
  .when.api.createsMultipleRecords([
    { table: 'orders', data: { userId: 1, total: 100 } },
    { table: 'order_items', data: { orderId: 1, productId: 1 } }
  ])
  .then.database.transactionCompleted()
  .then.database.hasRecord('orders', { userId: 1 })
  .then.database.hasRecord('order_items', { orderId: 1 })
  .execute()
```

## 🎯 Best Practices

### 1. Test Organization

```javascript
// Group related tests
describe('User Management', () => {
  describe('Authentication', () => {
    // Login, logout, registration tests
  })
  
  describe('Profile Management', () => {
    // Profile update, avatar upload tests
  })
  
  describe('Permissions', () => {
    // Role-based access tests
  })
})
```

### 2. Test Data Management

```javascript
// Use factories for consistent test data
import { createTestUser, createTestProduct } from 'tests/utils/factories.js'

scenario('Product reviews')
  .given.database.hasUser(createTestUser({ role: 'customer' }))
  .given.database.hasProduct(createTestProduct({ rating: 4.5 }))
  .execute()
```

### 3. Error Boundary Testing

```javascript
scenario('Component error handling')
  .given.component.willThrowError('Data loading failed')
  .when.page.loads('/dashboard')
  .then.page.showsErrorBoundary()
  .then.page.showsMessage('Something went wrong')
  .then.page.hasButton('Retry')
  .execute()
```

### 4. Environment-Specific Testing

```javascript
// Test different configurations
const environments = ['development', 'staging', 'production']

environments.forEach(env => {
  scenario(`Feature flags in ${env}`)
    .given.environment.is(env)
    .given.featureFlag('new-ui').is(env !== 'production')
    .when.page.loads('/dashboard')
    .then.page.shows(env === 'production' ? 'old-ui' : 'new-ui')
    .execute()
})
```

---

**Next Steps:**
- **[Migration Guide](./migration-guide.md)** - Transition from existing tests
- **[Examples](./examples/)** - Interactive code examples
- **[API Reference](./api-reference.md)** - Complete API documentation

**Pro Tips:**
- Start with simple scenarios and build complexity gradually
- Use `quickTest` for components, `scenario` for user flows
- Leverage auto-generation features to reduce boilerplate
- Test the happy path first, then edge cases and error scenarios