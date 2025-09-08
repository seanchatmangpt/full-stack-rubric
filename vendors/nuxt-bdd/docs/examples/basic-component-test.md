# Basic Component Test Example

This example demonstrates how to create a simple BDD test for a Vue component using Nuxt BDD.

## Component Under Test

**components/UserProfile.vue**
```vue
<template>
  <div class="user-profile" data-testid="user-profile">
    <div class="avatar-section">
      <img 
        :src="user.avatar" 
        :alt="`${user.name} avatar`"
        data-testid="user-avatar"
        class="avatar"
      />
    </div>
    
    <div class="info-section">
      <h2 data-testid="user-name" class="user-name">
        {{ user.name }}
      </h2>
      
      <p data-testid="user-email" class="user-email">
        {{ user.email }}
      </p>
      
      <p data-testid="user-role" class="user-role">
        {{ user.role }}
      </p>
      
      <UBadge 
        v-if="user.isActive" 
        data-testid="active-badge"
        color="green"
      >
        Active
      </UBadge>
    </div>
    
    <div class="actions-section">
      <UButton 
        data-testid="edit-button"
        @click="$emit('edit', user)"
        variant="outline"
      >
        Edit Profile
      </UButton>
      
      <UButton 
        data-testid="message-button"
        @click="$emit('message', user)"
        color="blue"
      >
        Send Message
      </UButton>
    </div>
  </div>
</template>

<script setup>
/**
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} name - User full name
 * @property {string} email - User email
 * @property {string} role - User role
 * @property {string} avatar - Avatar URL
 * @property {boolean} isActive - Active status
 */

defineEmits(['edit', 'message'])

defineProps({
  /** @type {User} */
  user: {
    type: Object,
    required: true,
    validator: (user) => {
      return user && 
             typeof user.name === 'string' && 
             typeof user.email === 'string'
    }
  }
})
</script>

<style scoped>
.user-profile {
  @apply flex flex-col space-y-4 p-6 bg-white rounded-lg shadow;
}

.avatar-section {
  @apply flex justify-center;
}

.avatar {
  @apply w-24 h-24 rounded-full object-cover;
}

.info-section {
  @apply text-center space-y-2;
}

.user-name {
  @apply text-xl font-semibold;
}

.user-email {
  @apply text-gray-600;
}

.user-role {
  @apply text-sm text-gray-500 uppercase tracking-wide;
}

.actions-section {
  @apply flex space-x-3 justify-center;
}
</style>
```

## Feature File

**tests/features/user-profile.feature**
```gherkin
Feature: User Profile Display
  As a user
  I want to view user profile information clearly
  So that I can understand who I'm interacting with

  Background:
    Given I have a user with the following details:
      | name     | John Doe           |
      | email    | john@example.com   |
      | role     | Developer          |
      | avatar   | /avatars/john.jpg  |
      | isActive | true               |

  Scenario: Display user information
    When I view the user profile
    Then I should see the name "John Doe"
    And I should see the email "john@example.com" 
    And I should see the role "Developer"
    And I should see the avatar "/avatars/john.jpg"

  Scenario: Display active user badge
    Given the user is active
    When I view the user profile
    Then I should see an "Active" badge

  Scenario: Hide badge for inactive users
    Given the user is inactive
    When I view the user profile
    Then I should not see an "Active" badge

  Scenario: Edit profile interaction
    Given I am viewing the user profile
    When I click the "Edit Profile" button
    Then an edit event should be emitted
    And the event should contain the user data

  Scenario: Send message interaction
    Given I am viewing the user profile
    When I click the "Send Message" button
    Then a message event should be emitted
    And the event should contain the user data

  Scenario Outline: Display different user roles
    Given I have a user with role "<role>"
    When I view the user profile
    Then I should see the role "<role>"

    Examples:
      | role        |
      | Developer   |
      | Designer    |
      | Manager     |
      | Admin       |
```

## Step Definitions

**tests/steps/user-profile.steps.js**
```javascript
import { Given, When, Then } from '@amiceli/vitest-cucumber'
import { mountWithBDD, setBDDState, getBDDState, getBDDContext } from 'nuxt-bdd'
import UserProfile from '~/components/UserProfile.vue'

/**
 * Setup user data from data table
 */
Given('I have a user with the following details:', (dataTable) => {
  const userData = dataTable.hashes()[0]
  
  // Convert string values to appropriate types
  const user = {
    id: '1',
    name: userData.name,
    email: userData.email,
    role: userData.role,
    avatar: userData.avatar,
    isActive: userData.isActive === 'true'
  }
  
  setBDDState('user', user)
})

/**
 * Setup user with specific role
 */
Given('I have a user with role {string}', (role) => {
  const user = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com', 
    role: role,
    avatar: '/default-avatar.jpg',
    isActive: true
  }
  
  setBDDState('user', user)
})

/**
 * Set user as active
 */
Given('the user is active', () => {
  const user = getBDDState('user')
  user.isActive = true
  setBDDState('user', user)
})

/**
 * Set user as inactive
 */
Given('the user is inactive', () => {
  const user = getBDDState('user')
  user.isActive = false
  setBDDState('user', user)
})

/**
 * Mount the UserProfile component
 */
When('I view the user profile', async () => {
  const user = getBDDState('user')
  await mountWithBDD(UserProfile, {
    props: { user }
  })
})

/**
 * Alternative step for viewing profile (for scenarios that need setup)
 */
Given('I am viewing the user profile', async () => {
  const user = getBDDState('user')
  await mountWithBDD(UserProfile, {
    props: { user }
  })
})

/**
 * Check if user name is displayed
 */
Then('I should see the name {string}', (expectedName) => {
  const { wrapper } = getBDDContext()
  const nameElement = wrapper.find('[data-testid="user-name"]')
  
  expect(nameElement.exists()).toBe(true)
  expect(nameElement.text()).toBe(expectedName)
})

/**
 * Check if user email is displayed
 */
Then('I should see the email {string}', (expectedEmail) => {
  const { wrapper } = getBDDContext()
  const emailElement = wrapper.find('[data-testid="user-email"]')
  
  expect(emailElement.exists()).toBe(true)
  expect(emailElement.text()).toBe(expectedEmail)
})

/**
 * Check if user role is displayed
 */
Then('I should see the role {string}', (expectedRole) => {
  const { wrapper } = getBDDContext()
  const roleElement = wrapper.find('[data-testid="user-role"]')
  
  expect(roleElement.exists()).toBe(true)
  expect(roleElement.text()).toBe(expectedRole)
})

/**
 * Check if avatar is displayed with correct src
 */
Then('I should see the avatar {string}', (expectedAvatar) => {
  const { wrapper } = getBDDContext()
  const avatarElement = wrapper.find('[data-testid="user-avatar"]')
  
  expect(avatarElement.exists()).toBe(true)
  expect(avatarElement.attributes('src')).toBe(expectedAvatar)
})

/**
 * Check if active badge is displayed
 */
Then('I should see an {string} badge', (badgeText) => {
  const { wrapper } = getBDDContext()
  const badgeElement = wrapper.find('[data-testid="active-badge"]')
  
  expect(badgeElement.exists()).toBe(true)
  expect(badgeElement.text()).toBe(badgeText)
})

/**
 * Check that active badge is not displayed
 */
Then('I should not see an {string} badge', (badgeText) => {
  const { wrapper } = getBDDContext()
  const badgeElement = wrapper.find('[data-testid="active-badge"]')
  
  expect(badgeElement.exists()).toBe(false)
})

/**
 * Click a button by its text/label
 */
When('I click the {string} button', async (buttonText) => {
  const { wrapper } = getBDDContext()
  
  // Try multiple selectors to find the button
  const buttonSelectors = [
    `[data-testid*="${buttonText.toLowerCase().replace(/\s+/g, '-')}"]`,
    `button:contains("${buttonText}")`,
    `[aria-label="${buttonText}"]`
  ]
  
  let button = null
  for (const selector of buttonSelectors) {
    button = wrapper.find(selector)
    if (button.exists()) break
  }
  
  if (!button || !button.exists()) {
    // Fallback: find by text content
    const buttons = wrapper.findAll('button')
    button = buttons.find(btn => btn.text().includes(buttonText))
  }
  
  expect(button.exists()).toBe(true)
  await button.trigger('click')
})

/**
 * Check that edit event was emitted
 */
Then('an edit event should be emitted', () => {
  const { wrapper } = getBDDContext()
  expect(wrapper.emitted().edit).toBeTruthy()
  expect(wrapper.emitted().edit).toHaveLength(1)
})

/**
 * Check that message event was emitted
 */
Then('a message event should be emitted', () => {
  const { wrapper } = getBDDContext()
  expect(wrapper.emitted().message).toBeTruthy()
  expect(wrapper.emitted().message).toHaveLength(1)
})

/**
 * Check that emitted event contains user data
 */
Then('the event should contain the user data', () => {
  const { wrapper } = getBDDContext()
  const user = getBDDState('user')
  
  // Check both edit and message events
  const editEvents = wrapper.emitted().edit
  const messageEvents = wrapper.emitted().message
  
  if (editEvents) {
    expect(editEvents[0][0]).toEqual(user)
  }
  
  if (messageEvents) {
    expect(messageEvents[0][0]).toEqual(user)
  }
})
```

## Test Configuration

**tests/setup/user-profile-setup.js**
```javascript
import { beforeEach } from 'vitest'
import { setBDDState } from 'nuxt-bdd'

beforeEach(() => {
  // Default user data for tests
  const defaultUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'User',
    avatar: '/default-avatar.jpg',
    isActive: true
  }
  
  setBDDState('defaultUser', defaultUser)
})
```

## Running the Tests

```bash
# Run specific feature
pnpm test tests/features/user-profile.feature

# Run all BDD tests
pnpm run test:bdd

# Run with coverage
pnpm run test:coverage tests/**/*.steps.js

# Watch mode for development
pnpm run test:watch tests/**/*.steps.js
```

## Key Testing Patterns Demonstrated

### 1. Data-Driven Testing
Using data tables and scenario outlines to test multiple variations:
```gherkin
Background:
  Given I have a user with the following details:
    | name  | email            | role      |
    | John  | john@example.com | Developer |

Scenario Outline: Display different user roles
  Examples:
    | role        |
    | Developer   |
    | Designer    |
```

### 2. State Management
Managing test state across steps:
```javascript
// Set state in one step
setBDDState('user', userData)

// Use state in another step  
const user = getBDDState('user')
```

### 3. Event Testing
Testing component events and emissions:
```javascript
Then('an edit event should be emitted', () => {
  const { wrapper } = getBDDContext()
  expect(wrapper.emitted().edit).toBeTruthy()
})
```

### 4. Conditional Testing
Testing different states and conditions:
```gherkin
Scenario: Display active user badge
  Given the user is active
  When I view the user profile
  Then I should see an "Active" badge

Scenario: Hide badge for inactive users
  Given the user is inactive
  When I view the user profile
  Then I should not see an "Active" badge
```

### 5. Flexible Element Finding
Using multiple strategies to find elements:
```javascript
const buttonSelectors = [
  `[data-testid*="${buttonText.toLowerCase().replace(/\s+/g, '-')}"]`,
  `button:contains("${buttonText}")`,
  `[aria-label="${buttonText}"]`
]
```

## Best Practices Demonstrated

1. **Clear Data Test IDs**: Use semantic `data-testid` attributes
2. **Descriptive Scenarios**: Each scenario tests a specific user behavior
3. **Reusable Steps**: Steps can be shared across multiple features
4. **Background Setup**: Common setup using Background sections
5. **State Isolation**: Each test starts with fresh state
6. **Event Verification**: Proper testing of component interactions
7. **Edge Cases**: Testing both positive and negative scenarios

This example provides a solid foundation for testing Vue components with Nuxt BDD, demonstrating key patterns and best practices that can be applied to more complex scenarios.