/**
 * @fileoverview Basic usage examples for @nuxt/bdd package
 */

// Example 1: Basic BDD Configuration
import { defineBDDConfig } from '@nuxt/bdd'

const bddConfig = defineBDDConfig({
  testDir: 'tests',
  stepDir: 'tests/steps',
  featureDir: 'tests/features',
  autoImport: true,
  vitest: {
    environment: 'jsdom',
    globals: true
  }
})

console.log('BDD Config:', bddConfig)

// Example 2: Component Testing
import { mountBDD } from '@nuxt/bdd/vitest'

// In a test file:
// const wrapper = mountBDD(MyComponent, {
//   props: { title: 'Test' }
// })
// wrapper.findByTestId('title').shouldHaveText('Test')

// Example 3: Page Testing  
import { createBDDPage, setupNuxtBDD } from '@nuxt/bdd/vitest'

// In a test file:
// await setupNuxtBDD()
// const page = await createBDDPage('/')
// await page.shouldHaveText('h1', 'Welcome')

// Example 4: Custom Step Definitions
import { Given, When, Then } from '@nuxt/bdd/cucumber'

// Given('I am on the login page', async () => {
//   const page = getCurrentPage()
//   await page.goto('/login')
// })
// 
// When('I enter valid credentials', async () => {
//   const page = getCurrentPage()  
//   await page.fillField('#username', 'testuser')
//   await page.fillField('#password', 'password123')
// })
//
// Then('I should be logged in', async () => {
//   const page = getCurrentPage()
//   await page.shouldHaveText('.welcome-message', 'Welcome, testuser!')
// })

// Example 5: Utility Functions
import { generateTestData, delay, waitForCondition } from '@nuxt/bdd'

const testEmail = generateTestData('email')
const testUsername = generateTestData('username')

console.log('Generated test data:', { testEmail, testUsername })

// Example usage in tests:
// await delay(1000) // Wait 1 second
// await waitForCondition(() => element.isVisible(), 5000) // Wait up to 5 seconds