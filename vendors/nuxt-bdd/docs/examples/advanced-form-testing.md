# Advanced Form Testing Example

This example demonstrates comprehensive form testing with validation, async operations, and complex user interactions using Nuxt BDD.

## Component Under Test

**components/ContactForm.vue**
```vue
<template>
  <form 
    @submit.prevent="handleSubmit" 
    class="contact-form"
    data-testid="contact-form"
  >
    <div class="form-header">
      <h2>Contact Us</h2>
      <p class="subtitle">We'd love to hear from you!</p>
    </div>

    <!-- Name Field -->
    <div class="form-group">
      <label for="name">Full Name *</label>
      <UInput
        id="name"
        v-model="form.name"
        data-testid="name-input"
        :error="errors.name"
        placeholder="Enter your full name"
        @blur="validateField('name')"
      />
      <span 
        v-if="errors.name" 
        class="error-message"
        data-testid="name-error"
      >
        {{ errors.name }}
      </span>
    </div>

    <!-- Email Field -->
    <div class="form-group">
      <label for="email">Email Address *</label>
      <UInput
        id="email"
        v-model="form.email"
        type="email"
        data-testid="email-input"
        :error="errors.email"
        placeholder="your.email@example.com"
        @blur="validateField('email')"
      />
      <span 
        v-if="errors.email" 
        class="error-message"
        data-testid="email-error"
      >
        {{ errors.email }}
      </span>
    </div>

    <!-- Subject Field -->
    <div class="form-group">
      <label for="subject">Subject *</label>
      <USelect
        v-model="form.subject"
        data-testid="subject-select"
        :options="subjectOptions"
        placeholder="Select a subject"
        :error="errors.subject"
        @change="validateField('subject')"
      />
      <span 
        v-if="errors.subject" 
        class="error-message"
        data-testid="subject-error"
      >
        {{ errors.subject }}
      </span>
    </div>

    <!-- Priority Field -->
    <div class="form-group">
      <label>Priority Level</label>
      <div class="radio-group">
        <label 
          v-for="priority in priorityOptions" 
          :key="priority.value"
          class="radio-option"
        >
          <input
            v-model="form.priority"
            type="radio"
            :value="priority.value"
            :data-testid="`priority-${priority.value}`"
            @change="validateField('priority')"
          />
          <span>{{ priority.label }}</span>
        </label>
      </div>
    </div>

    <!-- Message Field -->
    <div class="form-group">
      <label for="message">Message *</label>
      <UTextarea
        id="message"
        v-model="form.message"
        data-testid="message-textarea"
        :error="errors.message"
        placeholder="Tell us how we can help you..."
        rows="5"
        :maxlength="500"
        @blur="validateField('message')"
      />
      <div class="character-count">
        {{ form.message.length }}/500 characters
      </div>
      <span 
        v-if="errors.message" 
        class="error-message"
        data-testid="message-error"
      >
        {{ errors.message }}
      </span>
    </div>

    <!-- Consent Checkbox -->
    <div class="form-group">
      <label class="checkbox-label">
        <input
          v-model="form.consent"
          type="checkbox"
          data-testid="consent-checkbox"
          @change="validateField('consent')"
        />
        <span>I agree to the <a href="/privacy" target="_blank">Privacy Policy</a> *</span>
      </label>
      <span 
        v-if="errors.consent" 
        class="error-message"
        data-testid="consent-error"
      >
        {{ errors.consent }}
      </span>
    </div>

    <!-- Newsletter Checkbox -->
    <div class="form-group">
      <label class="checkbox-label">
        <input
          v-model="form.newsletter"
          type="checkbox"
          data-testid="newsletter-checkbox"
        />
        <span>Subscribe to our newsletter for updates</span>
      </label>
    </div>

    <!-- Form Actions -->
    <div class="form-actions">
      <UButton
        type="button"
        variant="ghost"
        data-testid="clear-button"
        @click="clearForm"
        :disabled="isSubmitting"
      >
        Clear Form
      </UButton>
      
      <UButton
        type="submit"
        data-testid="submit-button"
        :loading="isSubmitting"
        :disabled="!isFormValid || isSubmitting"
      >
        {{ isSubmitting ? 'Sending...' : 'Send Message' }}
      </UButton>
    </div>

    <!-- Success Message -->
    <div 
      v-if="submitStatus === 'success'" 
      class="success-message"
      data-testid="success-message"
    >
      <UIcon name="check-circle" class="success-icon" />
      <p>Thank you! Your message has been sent successfully.</p>
    </div>

    <!-- Error Message -->
    <div 
      v-if="submitStatus === 'error'" 
      class="error-message-block"
      data-testid="error-message"
    >
      <UIcon name="x-circle" class="error-icon" />
      <p>{{ submitError }}</p>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

/**
 * Form validation and submission logic
 */
const form = ref({
  name: '',
  email: '',
  subject: '',
  priority: 'medium',
  message: '',
  consent: false,
  newsletter: false
})

const errors = ref({})
const isSubmitting = ref(false)
const submitStatus = ref(null) // null, 'success', 'error'
const submitError = ref('')

const subjectOptions = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'support', label: 'Technical Support' },
  { value: 'billing', label: 'Billing Question' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'bug', label: 'Bug Report' }
]

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
]

/**
 * Validation rules
 */
const validationRules = {
  name: (value) => {
    if (!value?.trim()) return 'Name is required'
    if (value.length < 2) return 'Name must be at least 2 characters'
    if (value.length > 100) return 'Name must be less than 100 characters'
    return null
  },
  
  email: (value) => {
    if (!value?.trim()) return 'Email is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) return 'Please enter a valid email address'
    return null
  },
  
  subject: (value) => {
    if (!value) return 'Please select a subject'
    return null
  },
  
  message: (value) => {
    if (!value?.trim()) return 'Message is required'
    if (value.length < 10) return 'Message must be at least 10 characters'
    if (value.length > 500) return 'Message must be less than 500 characters'
    return null
  },
  
  consent: (value) => {
    if (!value) return 'You must agree to the Privacy Policy'
    return null
  }
}

/**
 * Validate individual field
 */
function validateField(fieldName) {
  const rule = validationRules[fieldName]
  if (rule) {
    const error = rule(form.value[fieldName])
    if (error) {
      errors.value[fieldName] = error
    } else {
      delete errors.value[fieldName]
    }
  }
}

/**
 * Validate entire form
 */
function validateForm() {
  const newErrors = {}
  
  Object.keys(validationRules).forEach(field => {
    const error = validationRules[field](form.value[field])
    if (error) {
      newErrors[field] = error
    }
  })
  
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

/**
 * Check if form is valid
 */
const isFormValid = computed(() => {
  return Object.keys(errors.value).length === 0 &&
         form.value.name.trim() &&
         form.value.email.trim() &&
         form.value.subject &&
         form.value.message.trim() &&
         form.value.consent
})

/**
 * Clear form data
 */
function clearForm() {
  form.value = {
    name: '',
    email: '',
    subject: '',
    priority: 'medium',
    message: '',
    consent: false,
    newsletter: false
  }
  errors.value = {}
  submitStatus.value = null
  submitError.value = ''
}

/**
 * Handle form submission
 */
async function handleSubmit() {
  if (!validateForm()) {
    return
  }
  
  isSubmitting.value = true
  submitStatus.value = null
  submitError.value = ''
  
  try {
    // Simulate API call
    await simulateApiCall(form.value)
    
    submitStatus.value = 'success'
    
    // Clear form after successful submission
    setTimeout(() => {
      clearForm()
    }, 3000)
    
  } catch (error) {
    submitStatus.value = 'error'
    submitError.value = error.message || 'Failed to send message. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Simulate API call with random delay and potential failure
 */
async function simulateApiCall(data) {
  return new Promise((resolve, reject) => {
    const delay = Math.random() * 2000 + 1000 // 1-3 seconds
    
    setTimeout(() => {
      // Simulate 20% chance of failure
      if (Math.random() > 0.8) {
        reject(new Error('Server is temporarily unavailable'))
      } else {
        resolve({ success: true, id: Date.now() })
      }
    }, delay)
  })
}

// Clear errors when form values change
watch(form, () => {
  submitStatus.value = null
  submitError.value = ''
}, { deep: true })

defineEmits(['submit', 'clear', 'validate'])
</script>
```

## Feature File

**tests/features/contact-form.feature**
```gherkin
Feature: Contact Form
  As a visitor to the website
  I want to fill out and submit a contact form
  So that I can communicate with the support team

  Background:
    Given I am on the contact form page

  Scenario: Display form with all required fields
    Then I should see the form title "Contact Us"
    And I should see the subtitle "We'd love to hear from you!"
    And I should see a "name" input field
    And I should see an "email" input field
    And I should see a "subject" select field
    And I should see priority radio buttons
    And I should see a "message" textarea field
    And I should see a consent checkbox
    And I should see a newsletter checkbox
    And I should see a "Clear Form" button
    And I should see a "Send Message" button

  Scenario: Validate required fields
    When I click the "Send Message" button without filling any fields
    Then I should see the error "Name is required"
    And I should see the error "Email is required"
    And I should see the error "Please select a subject"
    And I should see the error "Message is required"
    And I should see the error "You must agree to the Privacy Policy"

  Scenario: Validate field formats and lengths
    When I enter "A" as name
    And I enter "invalid-email" as email
    And I enter "Short" as message
    Then I should see the error "Name must be at least 2 characters"
    And I should see the error "Please enter a valid email address"
    And I should see the error "Message must be at least 10 characters"

  Scenario: Submit form with valid data
    When I fill out the form with valid data:
      | field     | value                    |
      | name      | John Doe                 |
      | email     | john.doe@example.com     |
      | subject   | general                  |
      | priority  | high                     |
      | message   | This is a test message.  |
      | consent   | true                     |
      | newsletter| true                     |
    And I submit the form
    Then I should see a success message
    And the form should be cleared automatically

  Scenario: Handle form submission failure
    Given the API will fail
    When I fill out the form with valid data:
      | field    | value                   |
      | name     | Jane Smith              |
      | email    | jane.smith@example.com  |
      | subject  | support                 |
      | message  | Help with my account    |
      | consent  | true                    |
    And I submit the form
    Then I should see an error message
    And the form data should be preserved

  Scenario: Clear form functionality
    Given I have filled out the form partially:
      | field   | value              |
      | name    | Test User          |
      | email   | test@example.com   |
      | message | Partial message    |
    When I click the "Clear Form" button
    Then all form fields should be empty
    And all errors should be cleared

  Scenario: Real-time validation
    When I enter "Jo" as name and leave the field
    Then I should not see any name error
    When I clear the name field and leave it
    Then I should see the error "Name is required"
    When I enter "john@invalid" as email and leave the field
    Then I should see the error "Please enter a valid email address"

  Scenario: Character count for message field
    When I enter a message with 50 characters
    Then I should see "50/500 characters"
    When I enter a message with 500 characters
    Then I should see "500/500 characters"
    When I try to enter more than 500 characters
    Then the message should be limited to 500 characters

  Scenario: Form submission button states
    Given the form is empty
    Then the "Send Message" button should be disabled
    When I fill out all required fields
    Then the "Send Message" button should be enabled
    When I submit the form
    Then the button should show "Sending..." and be disabled
    And both buttons should be disabled during submission

  Scenario Outline: Priority selection
    When I select "<priority>" priority
    Then the "<priority>" priority should be selected
    And other priorities should not be selected

    Examples:
      | priority |
      | low      |
      | medium   |
      | high     |
      | urgent   |

  Scenario Outline: Subject selection
    When I select "<subject>" as the subject
    Then the subject field should display "<label>"

    Examples:
      | subject | label             |
      | general | General Inquiry   |
      | support | Technical Support |
      | billing | Billing Question  |
      | feature | Feature Request   |
      | bug     | Bug Report        |
```

## Step Definitions

**tests/steps/contact-form.steps.js**
```javascript
import { Given, When, Then } from '@amiceli/vitest-cucumber'
import { mountWithBDD, setBDDState, getBDDState, getBDDContext } from 'nuxt-bdd'
import { nextTick } from 'vue'
import ContactForm from '~/components/ContactForm.vue'

// Mock API failure flag
let shouldApiFailGlobal = false

/**
 * Setup and navigation steps
 */
Given('I am on the contact form page', async () => {
  // Reset API failure flag
  shouldApiFailGlobal = false
  
  // Mock the API call
  const originalSimulateApiCall = ContactForm.methods?.simulateApiCall
  
  await mountWithBDD(ContactForm, {
    global: {
      mocks: {
        // Mock API call based on failure flag
        simulateApiCall: async (data) => {
          if (shouldApiFailGlobal) {
            throw new Error('Server is temporarily unavailable')
          }
          return { success: true, id: Date.now() }
        }
      }
    }
  })
})

Given('the API will fail', () => {
  shouldApiFailGlobal = true
})

/**
 * Display verification steps
 */
Then('I should see the form title {string}', (expectedTitle) => {
  const { wrapper } = getBDDContext()
  expect(wrapper.find('h2').text()).toBe(expectedTitle)
})

Then('I should see the subtitle {string}', (expectedSubtitle) => {
  const { wrapper } = getBDDContext()
  expect(wrapper.find('.subtitle').text()).toBe(expectedSubtitle)
})

Then('I should see a {string} input field', (fieldName) => {
  const { wrapper } = getBDDContext()
  const input = wrapper.find(`[data-testid="${fieldName}-input"]`)
  expect(input.exists()).toBe(true)
})

Then('I should see a {string} select field', (fieldName) => {
  const { wrapper } = getBDDContext()
  const select = wrapper.find(`[data-testid="${fieldName}-select"]`)
  expect(select.exists()).toBe(true)
})

Then('I should see a {string} textarea field', (fieldName) => {
  const { wrapper } = getBDDContext()
  const textarea = wrapper.find(`[data-testid="${fieldName}-textarea"]`)
  expect(textarea.exists()).toBe(true)
})

Then('I should see priority radio buttons', () => {
  const { wrapper } = getBDDContext()
  const priorities = ['low', 'medium', 'high', 'urgent']
  
  priorities.forEach(priority => {
    const radio = wrapper.find(`[data-testid="priority-${priority}"]`)
    expect(radio.exists()).toBe(true)
  })
})

Then('I should see a consent checkbox', () => {
  const { wrapper } = getBDDContext()
  const checkbox = wrapper.find('[data-testid="consent-checkbox"]')
  expect(checkbox.exists()).toBe(true)
})

Then('I should see a newsletter checkbox', () => {
  const { wrapper } = getBDDContext()
  const checkbox = wrapper.find('[data-testid="newsletter-checkbox"]')
  expect(checkbox.exists()).toBe(true)
})

Then('I should see a {string} button', (buttonText) => {
  const { wrapper } = getBDDContext()
  const button = wrapper.find(`button:contains("${buttonText}")`)
  expect(button.exists()).toBe(true)
})

/**
 * Form interaction steps
 */
When('I click the {string} button without filling any fields', async (buttonText) => {
  const { wrapper } = getBDDContext()
  const button = wrapper.find(`[data-testid="${buttonText.toLowerCase().replace(/\s+/g, '-')}-button"]`)
  await button.trigger('click')
  await nextTick()
})

When('I enter {string} as {word}', async (value, fieldName) => {
  const { wrapper } = getBDDContext()
  const input = wrapper.find(`[data-testid="${fieldName}-input"], [data-testid="${fieldName}-textarea"]`)
  await input.setValue(value)
  await input.trigger('blur') // Trigger validation
  await nextTick()
})

When('I fill out the form with valid data:', async (dataTable) => {
  const { wrapper } = getBDDContext()
  const formData = dataTable.hashes()[0]
  
  setBDDState('formData', formData)
  
  // Fill in each field
  for (const [field, value] of Object.entries(formData)) {
    switch (field) {
      case 'name':
      case 'email':
        await wrapper.find(`[data-testid="${field}-input"]`).setValue(value)
        break
        
      case 'message':
        await wrapper.find(`[data-testid="${field}-textarea"]`).setValue(value)
        break
        
      case 'subject':
        await wrapper.find(`[data-testid="${field}-select"]`).setValue(value)
        break
        
      case 'priority':
        await wrapper.find(`[data-testid="priority-${value}"]`).setChecked(true)
        break
        
      case 'consent':
      case 'newsletter':
        if (value === 'true') {
          await wrapper.find(`[data-testid="${field}-checkbox"]`).setChecked(true)
        }
        break
    }
  }
  
  await nextTick()
})

When('I submit the form', async () => {
  const { wrapper } = getBDDContext()
  const submitButton = wrapper.find('[data-testid="submit-button"]')
  await submitButton.trigger('click')
  await nextTick()
  
  // Wait for async operation to complete (with timeout)
  let attempts = 0
  while (attempts < 50) { // Max 5 seconds wait
    const loadingButton = wrapper.find('[data-testid="submit-button"]')
    if (!loadingButton.attributes('loading')) {
      break
    }
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }
})

When('I have filled out the form partially:', async (dataTable) => {
  const { wrapper } = getBDDContext()
  const partialData = dataTable.hashes()[0]
  
  for (const [field, value] of Object.entries(partialData)) {
    const input = wrapper.find(`[data-testid="${field}-input"], [data-testid="${field}-textarea"]`)
    await input.setValue(value)
  }
  
  await nextTick()
})

When('I click the {string} button', async (buttonText) => {
  const { wrapper } = getBDDContext()
  const button = wrapper.find(`[data-testid="${buttonText.toLowerCase().replace(/\s+/g, '-')}-button"]`)
  await button.trigger('click')
  await nextTick()
})

When('I enter {string} as {word} and leave the field', async (value, fieldName) => {
  const { wrapper } = getBDDContext()
  const input = wrapper.find(`[data-testid="${fieldName}-input"]`)
  await input.setValue(value)
  await input.trigger('blur')
  await nextTick()
})

When('I clear the {word} field and leave it', async (fieldName) => {
  const { wrapper } = getBDDContext()
  const input = wrapper.find(`[data-testid="${fieldName}-input"]`)
  await input.setValue('')
  await input.trigger('blur')
  await nextTick()
})

When('I select {string} priority', async (priority) => {
  const { wrapper } = getBDDContext()
  const radio = wrapper.find(`[data-testid="priority-${priority}"]`)
  await radio.setChecked(true)
  await nextTick()
})

When('I select {string} as the subject', async (subject) => {
  const { wrapper } = getBDDContext()
  const select = wrapper.find('[data-testid="subject-select"]')
  await select.setValue(subject)
  await nextTick()
})

When('I enter a message with {int} characters', async (charCount) => {
  const { wrapper } = getBDDContext()
  const message = 'a'.repeat(charCount)
  const textarea = wrapper.find('[data-testid="message-textarea"]')
  await textarea.setValue(message)
  await nextTick()
})

When('I try to enter more than {int} characters', async (maxChars) => {
  const { wrapper } = getBDDContext()
  const longMessage = 'a'.repeat(maxChars + 50)
  const textarea = wrapper.find('[data-testid="message-textarea"]')
  await textarea.setValue(longMessage)
  await nextTick()
})

/**
 * Validation and error checking steps
 */
Then('I should see the error {string}', (expectedError) => {
  const { wrapper } = getBDDContext()
  expect(wrapper.text()).toContain(expectedError)
})

Then('I should not see any {word} error', (fieldName) => {
  const { wrapper } = getBDDContext()
  const errorElement = wrapper.find(`[data-testid="${fieldName}-error"]`)
  expect(errorElement.exists()).toBe(false)
})

/**
 * Success and failure handling
 */
Then('I should see a success message', async () => {
  const { wrapper } = getBDDContext()
  
  // Wait for success message to appear (async operation)
  let successMessage
  let attempts = 0
  while (attempts < 50) {
    successMessage = wrapper.find('[data-testid="success-message"]')
    if (successMessage.exists()) break
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }
  
  expect(successMessage.exists()).toBe(true)
  expect(successMessage.text()).toContain('Thank you!')
})

Then('the form should be cleared automatically', async () => {
  // Wait for auto-clear (happens after 3 seconds in component)
  await new Promise(resolve => setTimeout(resolve, 3100))
  
  const { wrapper } = getBDDContext()
  const nameInput = wrapper.find('[data-testid="name-input"]')
  expect(nameInput.element.value).toBe('')
})

Then('I should see an error message', async () => {
  const { wrapper } = getBDDContext()
  
  // Wait for error message
  let errorMessage
  let attempts = 0
  while (attempts < 50) {
    errorMessage = wrapper.find('[data-testid="error-message"]')
    if (errorMessage.exists()) break
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }
  
  expect(errorMessage.exists()).toBe(true)
  expect(errorMessage.text()).toContain('unavailable')
})

Then('the form data should be preserved', () => {
  const { wrapper } = getBDDContext()
  const nameInput = wrapper.find('[data-testid="name-input"]')
  expect(nameInput.element.value).toBe('Jane Smith')
})

/**
 * Form clearing steps
 */
Then('all form fields should be empty', () => {
  const { wrapper } = getBDDContext()
  
  const nameInput = wrapper.find('[data-testid="name-input"]')
  const emailInput = wrapper.find('[data-testid="email-input"]')
  const messageTextarea = wrapper.find('[data-testid="message-textarea"]')
  
  expect(nameInput.element.value).toBe('')
  expect(emailInput.element.value).toBe('')
  expect(messageTextarea.element.value).toBe('')
})

Then('all errors should be cleared', () => {
  const { wrapper } = getBDDContext()
  const errorElements = wrapper.findAll('.error-message')
  expect(errorElements.length).toBe(0)
})

/**
 * UI state verification steps
 */
Then('I should see {string}', (expectedText) => {
  const { wrapper } = getBDDContext()
  expect(wrapper.text()).toContain(expectedText)
})

Then('the message should be limited to {int} characters', () => {
  const { wrapper } = getBDDContext()
  const textarea = wrapper.find('[data-testid="message-textarea"]')
  expect(textarea.element.value.length).toBeLessThanOrEqual(500)
})

Then('the {string} button should be disabled', (buttonText) => {
  const { wrapper } = getBDDContext()
  const button = wrapper.find(`[data-testid="${buttonText.toLowerCase().replace(/\s+/g, '-')}-button"]`)
  expect(button.attributes('disabled')).toBeDefined()
})

Then('the {string} button should be enabled', (buttonText) => {
  const { wrapper } = getBDDContext()
  const button = wrapper.find(`[data-testid="${buttonText.toLowerCase().replace(/\s+/g, '-')}-button"]`)
  expect(button.attributes('disabled')).toBeUndefined()
})

Then('the button should show {string} and be disabled', (buttonText) => {
  const { wrapper } = getBDDContext()
  const button = wrapper.find('[data-testid="submit-button"]')
  expect(button.text()).toContain(buttonText)
  expect(button.attributes('disabled')).toBeDefined()
})

Then('both buttons should be disabled during submission', () => {
  const { wrapper } = getBDDContext()
  const submitButton = wrapper.find('[data-testid="submit-button"]')
  const clearButton = wrapper.find('[data-testid="clear-button"]')
  
  expect(submitButton.attributes('disabled')).toBeDefined()
  expect(clearButton.attributes('disabled')).toBeDefined()
})

/**
 * Selection verification steps
 */
Then('the {string} priority should be selected', (priority) => {
  const { wrapper } = getBDDContext()
  const radio = wrapper.find(`[data-testid="priority-${priority}"]`)
  expect(radio.element.checked).toBe(true)
})

Then('other priorities should not be selected', () => {
  const { wrapper } = getBDDContext()
  const allPriorities = ['low', 'medium', 'high', 'urgent']
  const checkedRadios = wrapper.findAll('input[type="radio"]:checked')
  expect(checkedRadios.length).toBe(1)
})

Then('the subject field should display {string}', (expectedLabel) => {
  const { wrapper } = getBDDContext()
  const select = wrapper.find('[data-testid="subject-select"]')
  // This would depend on your select component implementation
  const selectedOption = select.find('option:checked')
  expect(selectedOption.text()).toBe(expectedLabel)
})

/**
 * Form validation state steps
 */
Given('the form is empty', () => {
  // Form starts empty by default
})

When('I fill out all required fields', async () => {
  const { wrapper } = getBDDContext()
  
  await wrapper.find('[data-testid="name-input"]').setValue('John Doe')
  await wrapper.find('[data-testid="email-input"]').setValue('john@example.com')
  await wrapper.find('[data-testid="subject-select"]').setValue('general')
  await wrapper.find('[data-testid="message-textarea"]').setValue('This is a test message')
  await wrapper.find('[data-testid="consent-checkbox"]').setChecked(true)
  
  await nextTick()
})
```

## Running the Tests

```bash
# Run the contact form feature specifically
pnpm test tests/features/contact-form.feature

# Run with specific step files
pnpm test tests/steps/contact-form.steps.js

# Run in watch mode during development
pnpm test --watch tests/features/contact-form.feature

# Run with detailed output
pnpm test tests/features/contact-form.feature --reporter=verbose
```

## Key Testing Patterns Demonstrated

### 1. **Complex Form Validation**
- Multiple validation rules per field
- Real-time validation on blur events
- Form-wide validation before submission

### 2. **Async Operations**
- Form submission with loading states
- API failure simulation and handling
- Timeout handling for async operations

### 3. **State Management**
- Preserving form data on errors
- Auto-clearing after successful submission
- Managing multiple UI states (loading, success, error)

### 4. **User Interaction Testing**
- Radio button selections
- Checkbox interactions
- Dropdown/select field testing
- Character counting and limits

### 5. **Edge Cases and Error Conditions**
- Network failures
- Validation edge cases
- Button state management during operations

### 6. **Data-Driven Testing**
- Using data tables for form filling
- Scenario outlines for multiple options
- Background setup for common preconditions

This comprehensive example demonstrates how Nuxt BDD can handle complex form testing scenarios with validation, async operations, and sophisticated user interactions while maintaining readable, business-focused feature descriptions.