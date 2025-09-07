# BDD Scenarios Examples

Learn to write behavior-driven tests using natural language Given/When/Then patterns.

## Basic BDD Scenario

### Your First Scenario

```javascript
// tests/scenarios/basic.test.js
import { scenario } from 'tests/framework/core/index.js'

scenario('User views homepage')
  .given.user.isOnPage('/')
  .when.page.loads()
  .then.page.showsContent('Welcome to Our App')
  .and.page.hasTitle('Home - My App')
  .execute()
```

**What happens:**
1. **Given** - Sets up the initial state (user is on homepage)
2. **When** - Performs an action (page loads)  
3. **Then** - Makes assertions (content is visible, title is correct)
4. **And** - Additional assertions (chainable)

### Multiple Scenarios in One Test

```javascript
// tests/scenarios/navigation.test.js
import { scenario } from 'tests/framework/core/index.js'

// Test main navigation
scenario('Main navigation functionality')
  .given.user.isOnPage('/')
  .when.user.clicksLink('About')
  .then.user.isRedirectedTo('/about')
  .then.page.showsContent('About Us')
  .execute()

// Test breadcrumb navigation  
scenario('Breadcrumb navigation')
  .given.user.isOnPage('/products/category/item')
  .then.page.showsBreadcrumb(['Home', 'Products', 'Category', 'Item'])
  .when.user.clicksBreadcrumb('Products')
  .then.user.isRedirectedTo('/products')
  .execute()

// Test mobile menu
scenario('Mobile navigation menu')
  .given.device.isMobile()
  .given.user.isOnPage('/')
  .when.user.clicksElement('hamburger-menu')
  .then.page.showsElement('mobile-menu')
  .when.user.clicksLink('Contact', 'mobile-menu')
  .then.page.showsContent('Contact Us')
  .execute()
```

## User Interaction Scenarios

### Form Interactions

```javascript
// tests/scenarios/contact-form.test.js
scenario('Contact form submission')
  .given.user.isOnPage('/contact')
  .given.page.hasForm('contact-form')
  
  // Test validation
  .when.user.clicksButton('Submit')
  .then.page.showsValidationErrors([
    'Name is required',
    'Email is required', 
    'Message is required'
  ])
  
  // Test successful submission
  .when.user.fillsForm({
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Hello, I would like more information.'
  })
  .when.user.clicksButton('Submit')
  .then.api.receivedFormData('/api/contact')
  .then.page.showsSuccess('Thank you for your message!')
  .then.user.seesConfirmation('We will respond within 24 hours')
  .execute()

// Test form reset
scenario('Contact form reset')
  .given.user.isOnPage('/contact')
  .when.user.fillsPartialForm({
    name: 'John',
    email: 'john@'
  })
  .when.user.clicksButton('Reset')
  .then.page.hasEmptyForm()
  .then.page.doesNotShowValidationErrors()
  .execute()
```

### Search Functionality

```javascript
// tests/scenarios/search.test.js
scenario('Product search functionality')
  .given.user.isOnPage('/products')
  .given.database.hasProducts(50)
  
  // Basic search
  .when.user.fillsInput('search-input', 'smartphone')
  .when.user.clicksButton('Search')
  .then.page.showsResults()
  .then.page.showsResultCount('5 results found')
  .then.page.showsProducts(['iPhone', 'Samsung Galaxy', 'Google Pixel'])
  
  // Search with filters
  .when.user.selectsFilter('brand', 'Apple')
  .when.user.selectsFilter('price-range', '500-1000')
  .then.page.showsResultCount('2 results found')
  .then.page.showsProducts(['iPhone 13', 'iPhone 14'])
  
  // No results
  .when.user.fillsInput('search-input', 'nonexistent product')
  .when.user.clicksButton('Search')
  .then.page.showsNoResults()
  .then.page.showsMessage('No products found matching your criteria')
  .execute()
```

## API Integration Scenarios

### Authentication Flow

```javascript
// tests/scenarios/authentication.test.js
scenario('User login flow')
  .given.user.isNotAuthenticated()
  .given.database.hasUser({ 
    email: 'user@example.com', 
    password: 'securepass123' 
  })
  
  // Navigate to login
  .when.user.navigatesTo('/login')
  .then.page.hasForm('login-form')
  .then.page.hasFields(['email', 'password'])
  
  // Test invalid credentials
  .when.user.fillsForm({
    email: 'wrong@example.com',
    password: 'wrongpass'
  })
  .when.user.clicksButton('Login')
  .then.api.respondedWith(401, '/api/auth/login')
  .then.page.showsError('Invalid email or password')
  
  // Test successful login
  .when.user.fillsForm({
    email: 'user@example.com',
    password: 'securepass123'
  })
  .when.user.clicksButton('Login')
  .then.api.respondedWith(200, '/api/auth/login')
  .then.user.isAuthenticated()
  .then.user.isRedirectedTo('/dashboard')
  .then.page.showsWelcome('Welcome back!')
  .execute()

scenario('Protected route access')
  .given.user.isNotAuthenticated()
  .when.user.navigatesTo('/admin')
  .then.user.isRedirectedTo('/login?redirect=/admin')
  
  .given.user.isAuthenticated()
  .given.user.hasRole('user')  // Not admin
  .when.user.navigatesTo('/admin')
  .then.page.showsError('Access denied')
  .then.page.hasStatusCode(403)
  
  .given.user.hasRole('admin')
  .when.user.navigatesTo('/admin')
  .then.page.showsContent('Admin Dashboard')
  .execute()
```

### CRUD Operations

```javascript
// tests/scenarios/user-management.test.js
scenario('User management CRUD operations')
  .given.user.isAuthenticated()
  .given.user.hasRole('admin')
  .given.database.isEmpty('users')
  
  // Create user
  .when.user.navigatesTo('/admin/users')
  .when.user.clicksButton('Add User')
  .when.user.fillsForm({
    name: 'New User',
    email: 'newuser@example.com',
    role: 'user'
  })
  .when.user.clicksButton('Save')
  .then.api.createdResource('/api/users')
  .then.database.hasRecord('users', { email: 'newuser@example.com' })
  .then.page.showsSuccess('User created successfully')
  
  // Read/List users
  .when.page.refreshes()
  .then.page.showsUserList()
  .then.page.showsUser('New User')
  
  // Update user
  .when.user.clicksEditButton('New User')
  .when.user.updatesForm({ name: 'Updated User' })
  .when.user.clicksButton('Save')
  .then.api.updatedResource('/api/users/1')
  .then.database.hasRecord('users', { name: 'Updated User' })
  .then.page.showsSuccess('User updated successfully')
  
  // Delete user
  .when.user.clicksDeleteButton('Updated User')
  .when.user.confirmsDialog('Are you sure?')
  .then.api.deletedResource('/api/users/1')
  .then.database.doesNotHaveRecord('users', { id: 1 })
  .then.page.doesNotShowUser('Updated User')
  .execute()
```

## E-Commerce Scenarios

### Shopping Cart Flow

```javascript
// tests/scenarios/shopping-cart.test.js
scenario('Complete shopping experience')
  .given.user.isOnPage('/')
  .given.store.hasProducts([
    { id: 1, name: 'Laptop', price: 999 },
    { id: 2, name: 'Mouse', price: 29 },
    { id: 3, name: 'Keyboard', price: 79 }
  ])
  
  // Browse and add products
  .when.user.navigatesTo('/products')
  .then.page.showsProducts()
  .when.user.clicksProduct('Laptop')
  .then.page.showsProductDetails('Laptop')
  .when.user.clicksButton('Add to Cart')
  .then.page.showsNotification('Added to cart')
  .then.page.showsCartCount(1)
  
  // Add another product
  .when.user.navigatesTo('/products')
  .when.user.addToCart('Mouse')
  .then.page.showsCartCount(2)
  
  // View cart
  .when.user.clicksCartIcon()
  .then.page.showsCartItems(['Laptop', 'Mouse'])
  .then.page.showsTotal('$1,028')
  
  // Update quantities
  .when.user.updatesQuantity('Mouse', 2)
  .then.page.showsTotal('$1,057')
  
  // Proceed to checkout
  .when.user.clicksButton('Checkout')
  .then.user.isRedirectedTo('/checkout')
  .execute()

scenario('Guest checkout flow')
  .given.user.isNotAuthenticated()
  .given.cart.hasItems([
    { product: 'Laptop', quantity: 1, price: 999 }
  ])
  
  .when.user.navigatesTo('/checkout')
  .then.page.hasCheckoutForm()
  
  // Fill shipping info
  .when.user.fillsShippingForm({
    firstName: 'John',
    lastName: 'Doe',
    address: '123 Main St',
    city: 'New York',
    zipCode: '10001'
  })
  .when.user.clicksButton('Continue')
  
  // Fill payment info
  .when.user.fillsPaymentForm({
    cardNumber: '4111111111111111',
    expiry: '12/25',
    cvc: '123',
    name: 'John Doe'
  })
  .when.user.clicksButton('Place Order')
  
  // Order confirmation
  .then.api.createdOrder()
  .then.page.showsOrderConfirmation()
  .then.user.receivesEmail('order-confirmation')
  .then.database.hasOrder({ status: 'pending' })
  .execute()
```

## Error Handling Scenarios

### Network Error Recovery

```javascript
// tests/scenarios/error-handling.test.js
scenario('API error handling')
  .given.user.isOnPage('/dashboard')
  .given.api.willFail('/api/user-data', 500)
  
  .when.page.loads()
  .then.page.showsError('Unable to load user data')
  .then.page.showsRetryButton()
  
  // Test retry mechanism
  .given.api.willSucceed('/api/user-data')
  .when.user.clicksButton('Retry')
  .then.api.wasCalled('/api/user-data')
  .then.page.showsUserData()
  .then.page.hidesError()
  .execute()

scenario('Form submission error recovery')
  .given.user.isOnPage('/contact')
  .given.api.willFail('/api/contact', 422, {
    errors: { email: 'Email already exists' }
  })
  
  .when.user.submitValidForm()
  .then.page.showsFieldError('email', 'Email already exists')
  .then.form.remainsFilled()  // Don't lose user's data
  
  .when.user.updatesField('email', 'newemail@example.com')
  .given.api.willSucceed('/api/contact')
  .when.user.clicksButton('Submit')
  .then.page.showsSuccess('Message sent successfully')
  .execute()
```

### Component Error Boundaries

```javascript
scenario('Component error boundary')
  .given.page.hasComponent('DataDashboard')
  .given.component.willThrowError('Failed to render chart')
  
  .when.page.loads('/dashboard')
  .then.page.showsErrorBoundary()
  .then.page.showsMessage('Something went wrong with the dashboard')
  .then.page.showsButton('Reload Dashboard')
  
  .when.user.clicksButton('Reload Dashboard')
  .then.component.reloads()
  .then.page.showsContent('Dashboard')
  .execute()
```

## Data Flow Scenarios

### Real-time Updates

```javascript
// tests/scenarios/realtime-updates.test.js
scenario('Real-time chat messaging')
  .given.user.isAuthenticated('user1')
  .given.user.isInChatRoom('general')
  .given.websocket.isConnected()
  
  .when.user.sendsMessage('Hello everyone!')
  .then.message.appearsInChat('Hello everyone!')
  .then.websocket.sentMessage('Hello everyone!')
  
  // Simulate another user's message
  .when.websocket.receivesMessage('user2', 'Hello user1!')
  .then.message.appearsInChat('user2: Hello user1!')
  .then.page.showsNotification('New message from user2')
  
  // Test typing indicators
  .when.user.startsTyping()
  .then.websocket.sentTypingIndicator()
  .when.websocket.receivesTypingIndicator('user3')
  .then.page.showsTypingIndicator('user3 is typing...')
  .execute()

scenario('Live data updates')
  .given.user.isOnPage('/stocks')
  .given.websocket.isConnected()
  
  .when.websocket.receivesData('stock-update', {
    symbol: 'AAPL',
    price: 150.25,
    change: +2.5
  })
  .then.page.updatesStock('AAPL', '$150.25')
  .then.page.showsChange('+$2.5', 'green')
  
  .when.websocket.receivesData('stock-update', {
    symbol: 'AAPL', 
    price: 148.75,
    change: -1.5
  })
  .then.page.updatesStock('AAPL', '$148.75')
  .then.page.showsChange('-$1.5', 'red')
  .execute()
```

## Multi-User Scenarios

### Collaborative Features

```javascript
// tests/scenarios/collaboration.test.js
scenario('Document collaboration')
  .given.user.isAuthenticated('editor1')
  .given.user.hasDocument('shared-doc')
  .given.document.isSharedWith(['editor2', 'viewer1'])
  
  // Edit document
  .when.user.editsDocument('shared-doc', 'Adding new content')
  .then.document.hasContent('Adding new content')
  .then.websocket.notifiesCollaborators('editor1 is editing')
  
  // Another user joins
  .given.user.connects('editor2')
  .when.user.viewsDocument('shared-doc', 'editor2')
  .then.page.showsCollaborators(['editor1', 'editor2'])
  .then.page.showsCursor('editor1', 'line 5')
  
  // Concurrent editing
  .when.user.editsDocument('shared-doc', 'Editor 2 changes', 'editor2')
  .then.document.mergesChanges()
  .then.page.showsConflictResolution()
  .when.user.acceptsChanges('editor2')
  .then.document.isSynced()
  .execute()
```

## Performance Scenarios

### Load Testing Scenarios

```javascript
// tests/scenarios/performance.test.js
scenario('Page performance under load')
  .given.page.willReceiveHighTraffic()
  .given.database.hasLargeDataset(10000)
  
  .when.user.navigatesTo('/products')
  .then.page.loadsIn.lessThan(2000) // 2 seconds
  .then.page.showsData()
  .then.memory.usage.isLessThan(50) // 50MB
  
  // Test pagination performance
  .when.user.navigatesTo('/products?page=50')
  .then.page.loadsIn.lessThan(1000) // 1 second for pagination
  .then.database.queriesAreOptimized()
  .execute()

scenario('Component rendering performance')
  .given.component.hasLargeDataset(5000)
  
  .when.component.renders('DataTable')
  .then.component.rendersIn.lessThan(500) // 500ms
  .then.component.isResponsive()
  
  // Test virtual scrolling
  .when.user.scrollsTo('bottom')
  .then.component.loadsAdditionalData()
  .then.memory.usage.remainsStable()
  .execute()
```

## Running BDD Scenarios

### 1. Copy scenario examples:
```bash
# Copy specific scenario
cp docs/framework/examples/basic/bdd-scenarios.md tests/my-scenarios.test.js

# Run scenarios
pnpm test my-scenarios
```

### 2. Create custom scenarios:
```javascript
// tests/custom-scenario.test.js
import { scenario } from 'tests/framework/core/index.js'

scenario('My custom user flow')
  .given.user.isOnPage('/my-page')
  .when.user.performsAction('my-action')  
  .then.page.showsExpectedResult()
  .execute()
```

### 3. Debug scenarios:
```javascript
scenario('Debug example')
  .given.debug.enabled()
  .when.user.clicksButton('test')
  .then.debug.screenshot('after-click')
  .then.debug.logContext()
  .execute()
```

## Best Practices

1. **Use Natural Language** - Write scenarios like user stories
2. **Follow Given/When/Then** - Clear separation of setup, action, assertion
3. **One Scenario Per Flow** - Keep scenarios focused on single user journeys
4. **Test Happy Path First** - Start with successful scenarios
5. **Add Error Scenarios** - Test edge cases and error conditions
6. **Use Meaningful Names** - Scenario names should describe the user goal
7. **Chain Related Actions** - Use `.and` for related assertions
8. **Keep Scenarios Independent** - Each scenario should work in isolation

---

**Next:** [API Testing](./api-testing.md) - Learn to test REST endpoints and integrations