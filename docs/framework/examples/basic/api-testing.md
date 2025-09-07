# API Testing Examples

Learn to test REST APIs, GraphQL endpoints, and backend integrations with the micro-framework.

## Basic API Testing

### Simple REST API Test

```javascript
// tests/api/users.test.js
import { scenario } from 'tests/framework/core/index.js'

scenario('User API - Basic CRUD operations')
  .given.api.isAvailable()
  .given.database.isEmpty('users')
  
  // CREATE - Test user creation
  .when.api.postsData('/api/users', {
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user'
  })
  .then.api.respondedWith(201)
  .then.api.returnedData({
    id: expect.any(Number),
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    createdAt: expect.any(String)
  })
  .then.database.hasRecord('users', { email: 'john@example.com' })
  
  // READ - Test user retrieval
  .when.api.fetchesData('/api/users/1')
  .then.api.respondedWith(200)
  .then.api.returnedData({
    id: 1,
    name: 'John Doe',
    email: 'john@example.com'
  })
  
  // UPDATE - Test user modification
  .when.api.putsData('/api/users/1', {
    name: 'John Smith'
  })
  .then.api.respondedWith(200)
  .then.api.returnedData({
    id: 1,
    name: 'John Smith',
    email: 'john@example.com'
  })
  .then.database.hasRecord('users', { name: 'John Smith' })
  
  // DELETE - Test user removal
  .when.api.deletesResource('/api/users/1')
  .then.api.respondedWith(204)
  .when.api.fetchesData('/api/users/1')
  .then.api.respondedWith(404)
  .then.database.doesNotHaveRecord('users', { id: 1 })
  .execute()
```

### API Validation Testing

```javascript
// tests/api/validation.test.js
scenario('API input validation')
  .given.api.isAvailable()
  
  // Test missing required fields
  .when.api.postsData('/api/users', {})
  .then.api.respondedWith(400)
  .then.api.hasError('validation')
  .then.api.hasValidationErrors({
    name: 'Name is required',
    email: 'Email is required'
  })
  
  // Test invalid email format
  .when.api.postsData('/api/users', {
    name: 'John Doe',
    email: 'invalid-email'
  })
  .then.api.respondedWith(400)
  .then.api.hasValidationError('email', 'Invalid email format')
  
  // Test duplicate email
  .given.database.hasUser({ email: 'existing@example.com' })
  .when.api.postsData('/api/users', {
    name: 'Jane Doe',
    email: 'existing@example.com'
  })
  .then.api.respondedWith(409)
  .then.api.hasError('Email already exists')
  
  // Test valid data
  .when.api.postsData('/api/users', {
    name: 'Valid User',
    email: 'valid@example.com'
  })
  .then.api.respondedWith(201)
  .then.api.returnedValidUser()
  .execute()
```

## Authentication & Authorization Testing

### JWT Authentication

```javascript
// tests/api/authentication.test.js
scenario('JWT authentication flow')
  .given.api.isAvailable()
  .given.database.hasUser({
    email: 'user@example.com',
    password: '$2b$10$hashedPassword123',
    role: 'user'
  })
  
  // Test login with valid credentials
  .when.api.postsData('/api/auth/login', {
    email: 'user@example.com',
    password: 'password123'
  })
  .then.api.respondedWith(200)
  .then.api.returnedData({
    token: expect.any(String),
    user: {
      id: expect.any(Number),
      email: 'user@example.com',
      role: 'user'
    }
  })
  .then.api.setAuthToken('response.token')
  
  // Test accessing protected route with token
  .when.api.fetchesData('/api/user/profile')
  .then.api.respondedWith(200)
  .then.api.returnedUserProfile()
  
  // Test accessing protected route without token
  .given.api.hasNoAuthToken()
  .when.api.fetchesData('/api/user/profile')
  .then.api.respondedWith(401)
  .then.api.hasError('Authentication required')
  
  // Test token refresh
  .given.api.hasValidToken()
  .when.api.postsData('/api/auth/refresh')
  .then.api.respondedWith(200)
  .then.api.returnedNewToken()
  .execute()

scenario('Role-based authorization')
  .given.api.isAvailable()
  .given.database.hasUsers([
    { email: 'user@example.com', role: 'user' },
    { email: 'admin@example.com', role: 'admin' }
  ])
  
  // Test user accessing user endpoint
  .given.api.isAuthenticatedAs('user@example.com')
  .when.api.fetchesData('/api/user/dashboard')
  .then.api.respondedWith(200)
  .then.api.returnedUserDashboard()
  
  // Test user accessing admin endpoint (should fail)
  .when.api.fetchesData('/api/admin/users')
  .then.api.respondedWith(403)
  .then.api.hasError('Access denied')
  
  // Test admin accessing admin endpoint
  .given.api.isAuthenticatedAs('admin@example.com')
  .when.api.fetchesData('/api/admin/users')
  .then.api.respondedWith(200)
  .then.api.returnedUserList()
  .execute()
```

### Session-based Authentication

```javascript
// tests/api/sessions.test.js
scenario('Session-based authentication')
  .given.api.isAvailable()
  .given.database.hasUser({ email: 'user@example.com' })
  
  // Login and establish session
  .when.api.postsData('/api/auth/login', {
    email: 'user@example.com',
    password: 'password123'
  })
  .then.api.respondedWith(200)
  .then.api.hasSessionCookie('connect.sid')
  .then.session.isActive()
  
  // Access protected route with session
  .when.api.fetchesData('/api/user/profile')
  .then.api.respondedWith(200)
  .then.api.returnedUserProfile()
  
  // Logout and destroy session
  .when.api.postsData('/api/auth/logout')
  .then.api.respondedWith(200)
  .then.session.isDestroyed()
  .then.api.hasNoCookies()
  
  // Try accessing protected route after logout
  .when.api.fetchesData('/api/user/profile')
  .then.api.respondedWith(401)
  .execute()
```

## Complex API Scenarios

### E-commerce API Flow

```javascript
// tests/api/ecommerce.test.js
scenario('Complete e-commerce API workflow')
  .given.api.isAvailable()
  .given.database.hasProducts([
    { id: 1, name: 'Laptop', price: 999, stock: 10 },
    { id: 2, name: 'Mouse', price: 29, stock: 50 }
  ])
  .given.user.isAuthenticated()
  
  // Browse products
  .when.api.fetchesData('/api/products')
  .then.api.respondedWith(200)
  .then.api.returnedProductList()
  
  // Get product details
  .when.api.fetchesData('/api/products/1')
  .then.api.respondedWith(200)
  .then.api.returnedProduct({
    id: 1,
    name: 'Laptop',
    price: 999,
    stock: 10
  })
  
  // Add to cart
  .when.api.postsData('/api/cart/items', {
    productId: 1,
    quantity: 2
  })
  .then.api.respondedWith(201)
  .then.api.returnedCartItem()
  
  // View cart
  .when.api.fetchesData('/api/cart')
  .then.api.respondedWith(200)
  .then.api.returnedCart({
    items: [
      { productId: 1, quantity: 2, subtotal: 1998 }
    ],
    total: 1998
  })
  
  // Apply discount code
  .when.api.postsData('/api/cart/discount', {
    code: 'SAVE10'
  })
  .then.api.respondedWith(200)
  .then.api.returnedCart({
    discount: { code: 'SAVE10', amount: 199.8 },
    total: 1798.2
  })
  
  // Create order
  .when.api.postsData('/api/orders', {
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      zip: '10001'
    },
    paymentMethod: 'credit_card',
    paymentToken: 'tok_visa_4242'
  })
  .then.api.respondedWith(201)
  .then.api.returnedOrder({
    id: expect.any(Number),
    status: 'pending',
    total: 1798.2
  })
  .then.database.hasOrder({ status: 'pending' })
  .then.database.stockWasReduced('products', 1, 8) // 10 - 2 = 8
  
  // Check order status
  .when.api.fetchesData('/api/orders/1')
  .then.api.respondedWith(200)
  .then.api.returnedOrderDetails()
  .execute()
```

### File Upload API

```javascript
// tests/api/uploads.test.js
scenario('File upload API')
  .given.api.isAvailable()
  .given.user.isAuthenticated()
  .given.file.exists('test-image.jpg', { size: 1024000 }) // 1MB
  
  // Single file upload
  .when.api.uploadsFile('/api/upload/avatar', 'test-image.jpg')
  .then.api.respondedWith(200)
  .then.api.returnedData({
    filename: expect.any(String),
    originalName: 'test-image.jpg',
    size: 1024000,
    mimetype: 'image/jpeg',
    url: expect.stringContaining('/uploads/')
  })
  .then.file.existsOnServer('response.filename')
  
  // Multiple file upload
  .given.files.exist(['doc1.pdf', 'doc2.pdf'])
  .when.api.uploadsFiles('/api/upload/documents', ['doc1.pdf', 'doc2.pdf'])
  .then.api.respondedWith(200)
  .then.api.returnedFileArray(2)
  
  // File size limit testing
  .given.file.exists('large-file.jpg', { size: 10000000 }) // 10MB
  .when.api.uploadsFile('/api/upload/avatar', 'large-file.jpg')
  .then.api.respondedWith(413)
  .then.api.hasError('File too large')
  
  // Invalid file type
  .given.file.exists('malicious.exe')
  .when.api.uploadsFile('/api/upload/avatar', 'malicious.exe')
  .then.api.respondedWith(415)
  .then.api.hasError('File type not allowed')
  .execute()
```

## GraphQL API Testing

### GraphQL Queries and Mutations

```javascript
// tests/api/graphql.test.js
scenario('GraphQL API operations')
  .given.graphql.isAvailable('/api/graphql')
  .given.database.hasUsers([
    { id: 1, name: 'John', email: 'john@example.com' },
    { id: 2, name: 'Jane', email: 'jane@example.com' }
  ])
  
  // Simple query
  .when.graphql.queries(`
    query GetUsers {
      users {
        id
        name
        email
      }
    }
  `)
  .then.graphql.respondedWith({
    data: {
      users: [
        { id: '1', name: 'John', email: 'john@example.com' },
        { id: '2', name: 'Jane', email: 'jane@example.com' }
      ]
    }
  })
  
  // Query with variables
  .when.graphql.queries(`
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        name
        email
      }
    }
  `, { id: '1' })
  .then.graphql.respondedWith({
    data: {
      user: { id: '1', name: 'John', email: 'john@example.com' }
    }
  })
  
  // Mutation
  .when.graphql.mutates(`
    mutation CreateUser($input: UserInput!) {
      createUser(input: $input) {
        id
        name
        email
      }
    }
  `, {
    input: {
      name: 'Bob',
      email: 'bob@example.com'
    }
  })
  .then.graphql.respondedWith({
    data: {
      createUser: {
        id: expect.any(String),
        name: 'Bob',
        email: 'bob@example.com'
      }
    }
  })
  .then.database.hasRecord('users', { name: 'Bob' })
  
  // Error handling
  .when.graphql.queries(`
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        name
      }
    }
  `, { id: '999' })
  .then.graphql.hasError('User not found')
  .execute()
```

## API Error Handling

### Network Error Scenarios

```javascript
// tests/api/error-handling.test.js
scenario('API error handling')
  .given.api.isAvailable()
  
  // Server error (500)
  .given.api.willFail('/api/users', 500)
  .when.api.fetchesData('/api/users')
  .then.api.respondedWith(500)
  .then.api.hasError('Internal server error')
  
  // Network timeout
  .given.api.willTimeout('/api/slow-endpoint', 5000)
  .when.api.fetchesData('/api/slow-endpoint', { timeout: 1000 })
  .then.api.timedOut()
  .then.api.hasError('Request timeout')
  
  // Rate limiting (429)
  .given.api.willRateLimit('/api/users', { limit: 10, window: 60000 })
  .when.api.makesRequests('/api/users', 15) // Exceed limit
  .then.api.respondedWith(429)
  .then.api.hasError('Too many requests')
  .then.api.hasHeader('Retry-After', expect.any(String))
  
  // Service unavailable (503)
  .given.api.isUnavailable()
  .when.api.fetchesData('/api/users')
  .then.api.respondedWith(503)
  .then.api.hasError('Service unavailable')
  .execute()

scenario('API retry logic')
  .given.api.isAvailable()
  .given.api.willFailTimes('/api/unstable', 2) // Fail first 2 requests
  
  .when.api.fetchesDataWithRetry('/api/unstable', {
    retries: 3,
    retryDelay: 100
  })
  .then.api.eventuallySucceeded()
  .then.api.respondedWith(200)
  .then.api.madeRetryAttempts(2)
  .execute()
```

### Input Sanitization and Security

```javascript
// tests/api/security.test.js
scenario('API security and input sanitization')
  .given.api.isAvailable()
  
  // SQL injection attempt
  .when.api.fetchesData('/api/users?name=\'; DROP TABLE users; --')
  .then.api.respondedWith(400)
  .then.api.hasError('Invalid input')
  .then.database.tableExists('users') // Table should still exist
  
  // XSS attempt
  .when.api.postsData('/api/comments', {
    content: '<script>alert("xss")</script>'
  })
  .then.api.respondedWith(201)
  .then.api.returnedSanitizedData({
    content: '&lt;script&gt;alert("xss")&lt;/script&gt;'
  })
  
  // CSRF protection
  .given.api.requiresCSRFToken()
  .when.api.postsDataWithoutCSRF('/api/users', { name: 'Test' })
  .then.api.respondedWith(403)
  .then.api.hasError('CSRF token missing')
  
  .given.api.hasValidCSRFToken()
  .when.api.postsData('/api/users', { name: 'Test' })
  .then.api.respondedWith(201)
  .execute()
```

## Performance and Load Testing

### API Performance Testing

```javascript
// tests/api/performance.test.js
import { 
  measureApiResponseTime,
  measureThroughput
} from 'tests/framework/performance/api-performance.js'

scenario('API performance benchmarks')
  .given.api.isAvailable()
  .given.database.hasLargeDataset(10000)
  
  // Response time testing
  .when.api.fetchesData('/api/users')
  .then.api.respondsIn.lessThan(200) // 200ms
  .then.api.returnsAllData()
  
  // Pagination performance
  .when.api.fetchesData('/api/users?page=1&limit=100')
  .then.api.respondsIn.lessThan(100) // 100ms for paginated data
  .then.api.returnedPagedData(100)
  
  // Search performance
  .when.api.fetchesData('/api/users?search=john')
  .then.api.respondsIn.lessThan(150) // 150ms for search
  .then.api.returnedFilteredResults()
  
  // Concurrent request handling
  .when.api.makesConcurrentRequests('/api/users', 10)
  .then.api.handlesAllRequests()
  .then.api.averageResponseTime.isLessThan(300)
  .execute()

scenario('API throughput testing')
  .given.api.isAvailable()
  
  .when.api.receivesLoad({
    endpoint: '/api/users',
    requestsPerSecond: 100,
    duration: 30000 // 30 seconds
  })
  .then.api.maintains.responsiveness()
  .then.api.errorRate.isLessThan(0.01) // Less than 1% errors
  .then.api.averageResponseTime.isLessThan(500)
  .execute()
```

## Real-world API Integration

### Third-party API Integration

```javascript
// tests/api/third-party.test.js
scenario('Payment gateway integration')
  .given.paymentGateway.isAvailable('stripe')
  .given.user.isAuthenticated()
  .given.user.hasValidPaymentMethod()
  
  // Create payment intent
  .when.api.postsData('/api/payments/create-intent', {
    amount: 2000, // $20.00
    currency: 'usd'
  })
  .then.api.respondedWith(200)
  .then.api.returnedData({
    clientSecret: expect.stringContaining('pi_'),
    status: 'requires_payment_method'
  })
  
  // Confirm payment
  .when.api.postsData('/api/payments/confirm', {
    paymentIntentId: 'response.id',
    paymentMethodId: 'pm_card_visa'
  })
  .then.api.respondedWith(200)
  .then.api.returnedData({ status: 'succeeded' })
  .then.database.hasPaymentRecord({
    amount: 2000,
    status: 'completed'
  })
  
  // Handle webhook
  .when.webhook.receives('payment.succeeded', {
    id: 'pi_test123',
    amount: 2000,
    status: 'succeeded'
  })
  .then.api.processesWebhook()
  .then.database.updatesPaymentStatus('completed')
  .then.user.receivesConfirmationEmail()
  .execute()

scenario('Email service integration')
  .given.emailService.isAvailable('sendgrid')
  .given.user.isAuthenticated()
  
  // Send welcome email
  .when.api.postsData('/api/emails/welcome', {
    to: 'user@example.com',
    name: 'John Doe'
  })
  .then.api.respondedWith(200)
  .then.emailService.sentEmail({
    to: 'user@example.com',
    subject: 'Welcome to Our App',
    template: 'welcome'
  })
  .then.database.hasEmailLog({
    recipient: 'user@example.com',
    status: 'sent'
  })
  .execute()
```

## Running API Tests

### 1. Copy API test examples:
```bash
# Copy specific test
cp docs/framework/examples/basic/api-testing.md tests/api-example.test.js

# Run API tests
pnpm test api-example
```

### 2. Set up test database:
```javascript
// tests/setup/api-setup.js
import { setupTestDatabase, cleanupTestData } from 'tests/framework/database/test-db.js'

export const setupApiTests = async () => {
  await setupTestDatabase()
  // Add test data as needed
}

export const cleanupApiTests = async () => {
  await cleanupTestData()
}
```

### 3. Mock external services:
```javascript
// tests/mocks/api-mocks.js
import { mockApiEndpoints } from 'tests/framework/auto-mocks.js'

export const setupApiMocks = () => {
  mockApiEndpoints({
    '/api/users': { data: mockUsers, status: 200 },
    '/api/products': { data: mockProducts, status: 200 },
    '/api/orders': { data: [], status: 200 }
  })
}
```

## Best Practices

1. **Test Happy Path First** - Start with successful API calls
2. **Test Error Scenarios** - Cover all HTTP status codes
3. **Validate Response Structure** - Check data types and required fields
4. **Test Authentication** - Verify protected endpoints
5. **Mock External Services** - Don't depend on third-party APIs in tests
6. **Test Performance** - Set response time expectations
7. **Use Realistic Test Data** - Mirror production data structure
8. **Clean Up After Tests** - Reset database state between tests

---

**Next:** [Page Testing](./page-testing.md) - Learn to test Nuxt pages and navigation