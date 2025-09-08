# Migration Guide: From Manual Testing to Nuxt BDD

This guide helps you migrate from traditional Vitest/Jest testing to behavior-driven development with Nuxt BDD.

## Why Migrate to BDD?

### Benefits of BDD Approach

1. **Living Documentation**: Feature files serve as executable specifications
2. **Stakeholder Collaboration**: Non-technical team members can understand and contribute  
3. **Reusable Steps**: Step definitions can be shared across multiple features
4. **Better Test Organization**: Clear separation between what and how
5. **Domain Language**: Tests written in business language, not technical jargon

### Before and After Comparison

**Traditional Unit Test:**
```javascript
describe('LoginForm', () => {
  it('should display error for invalid credentials', async () => {
    const wrapper = mount(LoginForm)
    await wrapper.find('#username').setValue('invalid@test.com')
    await wrapper.find('#password').setValue('wrongpassword')
    await wrapper.find('#submit').trigger('click')
    
    expect(wrapper.find('.error-message').text()).toBe('Invalid credentials')
  })
})
```

**BDD Approach:**
```gherkin
Feature: User Authentication
  Scenario: Failed login with invalid credentials
    Given I am on the login page
    When I enter "invalid@test.com" as username
    And I enter "wrongpassword" as password  
    And I click the submit button
    Then I should see the error "Invalid credentials"
```

## Step-by-Step Migration Process

### Phase 1: Setup and Configuration

#### 1. Install Dependencies
```bash
pnpm add -D nuxt-bdd @amiceli/vitest-cucumber @vue/test-utils vitest
```

#### 2. Update Configuration Files

**vitest.config.js:**
```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup/global-setup.js'],
    include: [
      'tests/**/*.{test,spec}.js',
      'tests/**/*.steps.js'  // Add BDD tests
    ]
  }
})
```

**package.json scripts:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest tests/unit",
    "test:bdd": "vitest tests/**/*.steps.js",
    "test:all": "vitest"
  }
}
```

#### 3. Create Test Setup

**tests/setup/global-setup.js:**
```javascript
import { beforeEach, afterEach } from 'vitest'
import { bddBridge } from 'nuxt-bdd'

beforeEach(() => {
  // Global setup for all tests
  global.fetch = vi.fn()
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }
})

afterEach(() => {
  // BDD bridge handles its own cleanup
  vi.clearAllMocks()
})
```

### Phase 2: Convert Existing Tests

#### Component Testing Migration

**Before (Manual Test):**
```javascript
// tests/components/UserCard.test.js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UserCard from '~/components/UserCard.vue'

describe('UserCard', () => {
  const mockUser = { 
    name: 'John Doe', 
    email: 'john@example.com',
    avatar: '/avatar.jpg'
  }

  it('should display user information', () => {
    const wrapper = mount(UserCard, { 
      props: { user: mockUser } 
    })
    
    expect(wrapper.find('[data-testid="user-name"]').text()).toBe('John Doe')
    expect(wrapper.find('[data-testid="user-email"]').text()).toBe('john@example.com')
    expect(wrapper.find('[data-testid="user-avatar"]').attributes('src')).toBe('/avatar.jpg')
  })

  it('should emit edit event when edit button clicked', async () => {
    const wrapper = mount(UserCard, { 
      props: { user: mockUser } 
    })
    
    await wrapper.find('[data-testid="edit-button"]').trigger('click')
    expect(wrapper.emitted().edit).toBeTruthy()
    expect(wrapper.emitted().edit[0]).toEqual([mockUser])
  })
})
```

**After (BDD Approach):**

**tests/features/user-card.feature:**
```gherkin
Feature: User Card Display
  As a user
  I want to see user information clearly displayed
  So that I can quickly identify users

  Background:
    Given I have a user with the following details:
      | name     | John Doe           |
      | email    | john@example.com   |
      | avatar   | /avatar.jpg        |

  Scenario: Display user information
    When I view the user card
    Then I should see the name "John Doe"
    And I should see the email "john@example.com"
    And I should see the avatar "/avatar.jpg"

  Scenario: Edit user functionality
    Given I view the user card
    When I click the edit button
    Then the edit event should be emitted
    And the event should contain the user data
```

**tests/steps/user-card.steps.js:**
```javascript
import { Given, When, Then } from '@amiceli/vitest-cucumber'
import { mountWithBDD, setBDDState, getBDDState, getBDDContext } from 'nuxt-bdd'
import UserCard from '~/components/UserCard.vue'

Given('I have a user with the following details:', (dataTable) => {
  const userData = dataTable.hashes()[0]
  setBDDState('user', userData)
})

When('I view the user card', async () => {
  const user = getBDDState('user')
  await mountWithBDD(UserCard, { props: { user } })
})

Then('I should see the name {string}', (expectedName) => {
  const { wrapper } = getBDDContext()
  const nameElement = wrapper.find('[data-testid="user-name"]')
  expect(nameElement.text()).toBe(expectedName)
})

Then('I should see the email {string}', (expectedEmail) => {
  const { wrapper } = getBDDContext()
  const emailElement = wrapper.find('[data-testid="user-email"]')
  expect(emailElement.text()).toBe(expectedEmail)
})

Then('I should see the avatar {string}', (expectedAvatar) => {
  const { wrapper } = getBDDContext()
  const avatarElement = wrapper.find('[data-testid="user-avatar"]')
  expect(avatarElement.attributes('src')).toBe(expectedAvatar)
})

When('I click the edit button', async () => {
  const { wrapper } = getBDDContext()
  await wrapper.find('[data-testid="edit-button"]').trigger('click')
})

Then('the edit event should be emitted', () => {
  const { wrapper } = getBDDContext()
  expect(wrapper.emitted().edit).toBeTruthy()
})

Then('the event should contain the user data', () => {
  const { wrapper } = getBDDContext()
  const user = getBDDState('user')
  expect(wrapper.emitted().edit[0]).toEqual([user])
})
```

#### Form Testing Migration

**Before (Manual Test):**
```javascript
// tests/components/ContactForm.test.js
describe('ContactForm', () => {
  it('should validate required fields', async () => {
    const wrapper = mount(ContactForm)
    
    await wrapper.find('#submit').trigger('click')
    
    expect(wrapper.find('.error-name').text()).toBe('Name is required')
    expect(wrapper.find('.error-email').text()).toBe('Email is required')
  })

  it('should submit form with valid data', async () => {
    const wrapper = mount(ContactForm)
    const mockSubmit = vi.fn()
    wrapper.vm.onSubmit = mockSubmit
    
    await wrapper.find('#name').setValue('John Doe')
    await wrapper.find('#email').setValue('john@example.com')
    await wrapper.find('#message').setValue('Hello world')
    await wrapper.find('#submit').trigger('click')
    
    expect(mockSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com', 
      message: 'Hello world'
    })
  })
})
```

**After (BDD Approach):**

**tests/features/contact-form.feature:**
```gherkin
Feature: Contact Form
  As a visitor
  I want to send a message through the contact form
  So that I can communicate with the team

  Scenario: Submit form with missing required fields
    Given I am on the contact form
    When I submit the form without filling required fields
    Then I should see the error "Name is required"
    And I should see the error "Email is required"

  Scenario: Submit valid contact form
    Given I am on the contact form
    When I fill in the following details:
      | field   | value           |
      | name    | John Doe        |
      | email   | john@example.com|
      | message | Hello world     |
    And I submit the form
    Then the form should be submitted successfully
    And the submission should contain the correct data
```

**tests/steps/contact-form.steps.js:**
```javascript
import { Given, When, Then } from '@amiceli/vitest-cucumber'
import { mountWithBDD, getBDDContext } from 'nuxt-bdd'
import ContactForm from '~/components/ContactForm.vue'

Given('I am on the contact form', async () => {
  await mountWithBDD(ContactForm)
})

When('I submit the form without filling required fields', async () => {
  const { wrapper } = getBDDContext()
  await wrapper.find('#submit').trigger('click')
})

When('I fill in the following details:', async (dataTable) => {
  const { wrapper } = getBDDContext()
  const data = dataTable.hashes()[0]
  
  for (const [field, value] of Object.entries(data)) {
    await wrapper.find(`#${field}`).setValue(value)
  }
})

When('I submit the form', async () => {
  const { wrapper } = getBDDContext()
  await wrapper.find('#submit').trigger('click')
})

Then('I should see the error {string}', (errorMessage) => {
  const { wrapper } = getBDDContext()
  expect(wrapper.text()).toContain(errorMessage)
})

Then('the form should be submitted successfully', () => {
  const { wrapper } = getBDDContext()
  expect(wrapper.emitted().submit).toBeTruthy()
})

Then('the submission should contain the correct data', () => {
  const { wrapper } = getBDDContext()
  const submittedData = wrapper.emitted().submit[0][0]
  expect(submittedData).toEqual({
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Hello world'
  })
})
```

### Phase 3: Advanced Migration Patterns

#### Integration Test Migration

**Before (Manual Integration Test):**
```javascript
describe('User Registration Flow', () => {
  it('should complete full registration process', async () => {
    const wrapper = mount(RegistrationPage, {
      global: { provide: { $api: mockApi } }
    })
    
    // Fill form
    await wrapper.find('#username').setValue('newuser')
    await wrapper.find('#email').setValue('new@example.com')
    await wrapper.find('#password').setValue('password123')
    
    // Submit
    await wrapper.find('#register').trigger('click')
    
    // Check API call
    expect(mockApi.register).toHaveBeenCalledWith({
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123'
    })
    
    // Check success state
    expect(wrapper.find('.success-message').exists()).toBe(true)
  })
})
```

**After (BDD Integration Test):**

**tests/features/user-registration.feature:**
```gherkin
Feature: User Registration
  As a new visitor
  I want to create an account
  So that I can access the application

  Scenario: Successful user registration
    Given I am on the registration page
    When I register with the following details:
      | username | newuser        |
      | email    | new@example.com|
      | password | password123    |
    Then my account should be created
    And I should see a success message
    And I should be redirected to the welcome page
```

**tests/steps/user-registration.steps.js:**
```javascript
import { Given, When, Then } from '@amiceli/vitest-cucumber'
import { mountWithBDD, getBDDContext, setBDDState } from 'nuxt-bdd'
import RegistrationPage from '~/pages/register.vue'

Given('I am on the registration page', async () => {
  const mockApi = {
    register: vi.fn().mockResolvedValue({ success: true, user: { id: 1 } })
  }
  setBDDState('mockApi', mockApi)
  
  await mountWithBDD(RegistrationPage, {
    global: { provide: { $api: mockApi } }
  })
})

When('I register with the following details:', async (dataTable) => {
  const { wrapper } = getBDDContext()
  const userData = dataTable.hashes()[0]
  
  setBDDState('registrationData', userData)
  
  await wrapper.find('#username').setValue(userData.username)
  await wrapper.find('#email').setValue(userData.email)
  await wrapper.find('#password').setValue(userData.password)
  await wrapper.find('#register').trigger('click')
})

Then('my account should be created', () => {
  const mockApi = getBDDState('mockApi')
  const registrationData = getBDDState('registrationData')
  
  expect(mockApi.register).toHaveBeenCalledWith(registrationData)
})

Then('I should see a success message', () => {
  const { wrapper } = getBDDContext()
  expect(wrapper.find('.success-message').exists()).toBe(true)
})

Then('I should be redirected to the welcome page', () => {
  const { wrapper } = getBDDContext()
  // Check for navigation or route change
  expect(wrapper.vm.$route.path).toBe('/welcome')
})
```

### Phase 4: Organizing BDD Tests

#### Directory Structure
```
tests/
├── features/           # Gherkin feature files
│   ├── authentication/
│   │   ├── login.feature
│   │   └── registration.feature
│   ├── user-management/
│   │   ├── profile.feature
│   │   └── settings.feature
│   └── shared/
│       └── navigation.feature
├── steps/             # Step definitions
│   ├── authentication/
│   │   ├── login.steps.js
│   │   └── registration.steps.js
│   ├── user-management/
│   │   ├── profile.steps.js
│   │   └── settings.steps.js
│   └── shared/
│       ├── common.steps.js
│       └── navigation.steps.js
├── setup/             # Test configuration
│   ├── global-setup.js
│   └── bdd-setup.js
└── utils/             # Test utilities
    ├── test-data.js
    └── mock-helpers.js
```

#### Shared Step Definitions

**tests/steps/shared/common.steps.js:**
```javascript
import { Given, When, Then } from '@amiceli/vitest-cucumber'
import { getBDDContext, setBDDState } from 'nuxt-bdd'

// Common navigation steps
Given('I am on the {string} page', async (pageName) => {
  const pageMap = {
    'login': LoginPage,
    'dashboard': DashboardPage,
    'profile': ProfilePage
  }
  
  const PageComponent = pageMap[pageName.toLowerCase()]
  if (!PageComponent) {
    throw new Error(`Unknown page: ${pageName}`)
  }
  
  await mountWithBDD(PageComponent)
  setBDDState('currentPage', pageName)
})

// Common form interactions
When('I fill in {string} with {string}', async (fieldName, value) => {
  const { wrapper } = getBDDContext()
  const field = wrapper.find(`[data-testid="${fieldName}"], #${fieldName}, [name="${fieldName}"]`)
  await field.setValue(value)
})

When('I click the {string} button', async (buttonName) => {
  const { wrapper } = getBDDContext()
  const button = wrapper.find(`[data-testid="${buttonName}-button"], button:contains("${buttonName}")`)
  await button.trigger('click')
})

// Common assertions
Then('I should see {string}', (expectedText) => {
  const { wrapper } = getBDDContext()
  expect(wrapper.text()).toContain(expectedText)
})

Then('I should be on the {string} page', (expectedPage) => {
  const { wrapper } = getBDDContext()
  // This would depend on your routing implementation
  expect(wrapper.vm.$route.name).toBe(expectedPage.toLowerCase())
})
```

### Phase 5: Best Practices for Migration

#### 1. Start Small
- Begin with simple component tests
- Focus on one feature area at a time
- Keep existing tests running during migration

#### 2. Involve Stakeholders
- Write feature files collaboratively
- Use domain language, not technical terms
- Review feature files with business stakeholders

#### 3. Reuse Step Definitions
- Create a library of common steps
- Use consistent naming patterns
- Document step definitions with examples

#### 4. Gradual Transition
```javascript
// Keep both approaches during transition
describe('UserCard (Legacy)', () => {
  // Existing unit tests
})

// New BDD tests in separate files
// tests/features/user-card.feature
// tests/steps/user-card.steps.js
```

#### 5. Performance Considerations
```javascript
// Enable performance tracking for critical paths
const bridge = new VitestCucumberBridge({
  performanceTracking: true
})

// Track key interactions
When('I submit the form', async () => {
  bridge.trackMemory('before-submit')
  // ... form submission logic
  bridge.trackMemory('after-submit')
})
```

## Migration Checklist

### Pre-Migration
- [ ] Install nuxt-bdd and dependencies
- [ ] Configure test runner and setup files
- [ ] Create directory structure for BDD tests
- [ ] Set up shared step definitions

### During Migration
- [ ] Convert high-value tests first (user flows, critical features)
- [ ] Write feature files collaboratively with stakeholders
- [ ] Create reusable step definitions
- [ ] Maintain existing test coverage during transition
- [ ] Update CI/CD pipelines to run BDD tests

### Post-Migration
- [ ] Remove duplicate tests
- [ ] Document BDD testing guidelines
- [ ] Train team members on BDD practices
- [ ] Set up automated step definition generation
- [ ] Monitor test performance and maintenance overhead

## Common Migration Challenges

### Challenge 1: Overly Technical Feature Files
**Problem:** Writing features that read like unit tests
```gherkin
# Too technical
Scenario: Test component mounting
  Given the component is mounted with props
  When the wrapper finds the element
  Then the text content should match
```

**Solution:** Focus on user behavior
```gherkin
# User-focused
Scenario: Display welcome message
  Given I am a new user
  When I visit the homepage
  Then I should see a welcome message
```

### Challenge 2: Step Definition Explosion
**Problem:** Too many specific step definitions
```javascript
// Avoid this
Given('I click the red submit button in the top right')
Given('I click the blue submit button in the sidebar')
```

**Solution:** Use parameterized steps
```javascript
// Better approach
Given('I click the {string} {string} button', (color, type) => {
  // Implementation
})
```

### Challenge 3: Slow Test Execution
**Problem:** BDD tests running slower than unit tests
**Solution:**
- Use efficient component stubs
- Minimize DOM queries
- Share setup between related scenarios
- Enable performance tracking to identify bottlenecks

## Measuring Migration Success

### Metrics to Track
- **Test Readability**: Can non-developers understand the tests?
- **Reusability**: How many step definitions are shared?
- **Maintenance**: Time spent updating tests when features change
- **Coverage**: Are critical user journeys covered?
- **Performance**: Test execution time comparison

### Success Indicators
- ✅ Feature files serve as living documentation
- ✅ Stakeholders can contribute to test scenarios
- ✅ Step definitions are reused across features
- ✅ Tests focus on user behavior, not implementation
- ✅ Critical user journeys are well-covered

The migration to Nuxt BDD is an investment in better collaboration, clearer documentation, and more maintainable tests. Take it step by step, and you'll see the benefits compound over time.