/**
 * @fileoverview Integration tests for nuxt-bdd with real Nuxt projects
 * @description Tests the library integration with actual Nuxt applications
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, createPage, url } from '@nuxt/test-utils/e2e'
import { $fetch } from 'ofetch'
import { 
  VitestCucumberBridge,
  registerGiven,
  registerWhen, 
  registerThen,
  getBDDContext,
  setBDDState,
  getBDDState
} from '../../src/bdd/vitest-cucumber-bridge.js'

describe('nuxt-bdd integration', () => {
  beforeAll(async () => {
    // Setup test Nuxt app using the basic example
    await setup({
      rootDir: fileURLToPath(new URL('../../examples/basic', import.meta.url)),
      server: true
    })
  })

  afterAll(async () => {
    // Cleanup happens automatically with @nuxt/test-utils
  })

  describe('basic integration', () => {
    it('should work with Nuxt test environment', async () => {
      // Test that we can fetch from the test Nuxt app
      const html = await $fetch('/')
      expect(html).toContain('<html')
      expect(html).toContain('</html>')
    })

    it('should integrate BDD bridge with Nuxt context', async () => {
      const bridge = new VitestCucumberBridge({
        performanceTracking: true
      })

      // Register test steps
      registerGiven('I am on the home page', async function() {
        setBDDState('currentPage', 'home')
        setBDDState('url', await url('/'))
      })

      registerWhen('I navigate to {string}', async function(path) {
        const targetUrl = await url(path)
        setBDDState('targetUrl', targetUrl)
        setBDDState('response', await $fetch(path))
      })

      registerThen('I should see the content', function() {
        const response = getBDDState('response')
        expect(response).toBeDefined()
        expect(typeof response).toBe('string')
      })

      // Execute BDD steps programmatically
      await registerGiven.handler?.()
      await registerWhen.handler?.('/')
      registerThen.handler?.()

      expect(getBDDState('currentPage')).toBe('home')
      expect(getBDDState('response')).toContain('html')
    })

    it('should handle performance tracking in integration', () => {
      const bridge = new VitestCucumberBridge({
        performanceTracking: true
      })

      bridge.initializePerformanceTracking()
      bridge.trackMemory('integration_test')

      const metrics = bridge.getPerformanceMetrics()
      expect(metrics.memoryUsage).toHaveLength(1)
      expect(metrics.memoryUsage[0].label).toBe('integration_test')
      expect(metrics.totalTime).toBeGreaterThan(0)
    })
  })

  describe('feature validation with real Nuxt app', () => {
    let bridge

    beforeEach(() => {
      bridge = new VitestCucumberBridge()
    })

    it('should validate feature file against registered steps', () => {
      // Register realistic Nuxt BDD steps
      bridge.registerStep('given', 'I am on the {string} page', async function(page) {})
      bridge.registerStep('when', 'I click the {string} button', async function(buttonText) {})
      bridge.registerStep('then', 'I should see {string}', function(expectedText) {})

      const featureContent = `
Feature: Nuxt Application Navigation
  Background:
    Given I am on the "home" page

  Scenario: Basic navigation
    When I click the "About" button
    Then I should see "About Page"

  Scenario: Error handling
    When I click the "Missing" button
    Then I should see "Not Found"
      `

      const result = bridge.validateFeatureSteps(featureContent)
      
      expect(result.isValid).toBe(true)
      expect(result.missing).toHaveLength(0)
      expect(result.found.length).toBeGreaterThan(0)
    })

    it('should generate realistic step definitions for Nuxt features', () => {
      const featureContent = `
Feature: User Authentication
  Scenario: Login flow
    Given I have a user with email "test@example.com"
    When I submit the login form with valid credentials
    Then I should be redirected to the dashboard
    And I should see welcome message "Hello, User!"
      `

      const generated = bridge.generateStepDefinitions(featureContent)
      
      // Should contain step definitions for missing steps
      expect(generated).toContain('Given(')
      expect(generated).toContain('When(')
      expect(generated).toContain('Then(')
      
      // Should parameterize email and messages
      expect(generated).toContain('{string}')
      
      // Should generate meaningful function names
      expect(generated).toContain('i_have_a_user_with_email')
      expect(generated).toContain('i_submit_the_login_form')
      expect(generated).toContain('i_should_be_redirected')
    })
  })

  describe('component integration with Vue Test Utils', () => {
    it('should integrate with Vue components in Nuxt context', async () => {
      const bridge = new VitestCucumberBridge()

      // Mock a simple Vue component that might exist in a Nuxt app
      const NuxtTestComponent = {
        name: 'NuxtTestComponent',
        template: `
          <div class="nuxt-test-component">
            <h1>{{ title }}</h1>
            <button @click="handleClick">{{ buttonText }}</button>
            <p v-if="clicked">Clicked!</p>
          </div>
        `,
        props: ['title', 'buttonText'],
        data() {
          return {
            clicked: false
          }
        },
        methods: {
          handleClick() {
            this.clicked = true
            this.$emit('click', { clicked: true })
          }
        }
      }

      const wrapper = await bridge.mountComponent({
        component: NuxtTestComponent,
        props: {
          title: 'Test Component',
          buttonText: 'Click Me'
        }
      })

      expect(wrapper.text()).toContain('Test Component')
      expect(wrapper.text()).toContain('Click Me')
      
      // Simulate click
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.text()).toContain('Clicked!')
      expect(wrapper.emitted('click')).toBeTruthy()
    })

    it('should work with Nuxt-specific components', async () => {
      const bridge = new VitestCucumberBridge()

      // Test mounting with Nuxt-specific stubs
      const NuxtLinkComponent = {
        name: 'NuxtLinkTest',
        template: `
          <div>
            <NuxtLink to="/about">About</NuxtLink>
            <NuxtImg src="/test.jpg" alt="test" />
            <LazyComponentTest />
          </div>
        `
      }

      const wrapper = await bridge.mountComponent({
        component: NuxtLinkComponent,
        stubs: {
          NuxtLink: { 
            template: '<a :href="to"><slot /></a>',
            props: ['to']
          },
          NuxtImg: {
            template: '<img :src="src" :alt="alt" />',
            props: ['src', 'alt']
          },
          LazyComponentTest: {
            template: '<div>Lazy Component Loaded</div>'
          }
        }
      })

      expect(wrapper.html()).toContain('<a href="/about">About</a>')
      expect(wrapper.html()).toContain('<img src="/test.jpg" alt="test"')
      expect(wrapper.html()).toContain('Lazy Component Loaded')
    })
  })

  describe('end-to-end BDD scenarios', () => {
    it('should execute complete BDD scenario with real Nuxt context', async () => {
      const bridge = new VitestCucumberBridge({
        performanceTracking: true
      })

      let scenarioState = {}

      // Register complete scenario steps
      bridge.registerStep('given', 'I am viewing a Nuxt application', async function() {
        const html = await $fetch('/')
        scenarioState.html = html
        bridge.trackMemory('page_load')
      })

      bridge.registerStep('when', 'I make a request to the API', async function() {
        try {
          // Try to fetch from a potential API route
          const response = await $fetch('/api/health').catch(() => ({ status: 'no-api' }))
          scenarioState.apiResponse = response
        } catch (error) {
          scenarioState.apiError = error.message
        }
        bridge.trackMemory('api_request')
      })

      bridge.registerStep('then', 'the application should respond correctly', function() {
        // Validate HTML structure
        expect(scenarioState.html).toBeDefined()
        expect(scenarioState.html).toContain('<html')
        
        // Check that we got some response (either success or expected error)
        expect(
          scenarioState.apiResponse || scenarioState.apiError
        ).toBeDefined()
      })

      // Execute the scenario
      const givenStep = bridge.getStepRegistry().get('given:I am viewing a Nuxt application')
      const whenStep = bridge.getStepRegistry().get('when:I make a request to the API')
      const thenStep = bridge.getStepRegistry().get('then:the application should respond correctly')

      await givenStep.handler()
      await whenStep.handler()
      thenStep.handler()

      // Verify performance tracking worked
      const metrics = bridge.getPerformanceMetrics()
      expect(metrics.memoryUsage.length).toBeGreaterThan(0)
      expect(metrics.memoryUsage.find(m => m.label === 'page_load')).toBeDefined()
    })

    it('should handle complex multi-step scenarios', async () => {
      const bridge = new VitestCucumberBridge()
      const context = getBDDContext()

      // Simulate a complex e-commerce-like scenario
      bridge.registerStep('given', 'I have a shopping cart with {int} items', function(itemCount) {
        context.state.cartItems = Array(itemCount).fill().map((_, i) => ({
          id: i + 1,
          name: `Item ${i + 1}`,
          price: 10 + i
        }))
      })

      bridge.registerStep('when', 'I apply a {int} percent discount', function(discountPercent) {
        const items = context.state.cartItems || []
        context.state.discount = discountPercent
        context.state.originalTotal = items.reduce((sum, item) => sum + item.price, 0)
        context.state.discountAmount = (context.state.originalTotal * discountPercent) / 100
        context.state.finalTotal = context.state.originalTotal - context.state.discountAmount
      })

      bridge.registerStep('then', 'the total should be {float}', function(expectedTotal) {
        expect(context.state.finalTotal).toBeCloseTo(expectedTotal, 2)
      })

      bridge.registerStep('then', 'I should save {float} with the discount', function(expectedSavings) {
        expect(context.state.discountAmount).toBeCloseTo(expectedSavings, 2)
      })

      // Execute scenario: 3 items (Item 1: $10, Item 2: $11, Item 3: $12) = $33 total
      // 10% discount = $3.30 savings, $29.70 final total
      const steps = bridge.getStepRegistry()
      
      await steps.get('given:I have a shopping cart with {int} items').handler(3)
      await steps.get('when:I apply a {int} percent discount').handler(10)
      steps.get('then:the total should be {float}').handler(29.70)
      steps.get('then:I should save {float} with the discount').handler(3.30)

      // Verify final state
      expect(context.state.cartItems).toHaveLength(3)
      expect(context.state.originalTotal).toBe(33)
      expect(context.state.finalTotal).toBe(29.70)
    })
  })

  describe('error handling and edge cases', () => {
    it('should handle mounting failures gracefully', async () => {
      const bridge = new VitestCucumberBridge()

      const BrokenComponent = {
        name: 'BrokenComponent',
        mounted() {
          throw new Error('Component mount failed')
        }
      }

      await expect(
        bridge.mountComponent({ component: BrokenComponent })
      ).rejects.toThrow()
    })

    it('should handle malformed feature files', () => {
      const bridge = new VitestCucumberBridge()

      const malformedFeature = `
This is not a proper feature file
It has no structure
      `

      const result = bridge.validateFeatureSteps(malformedFeature)
      expect(result.totalSteps).toBe(0)
      expect(result.isValid).toBe(true) // No steps to validate
      expect(result.missing).toHaveLength(0)
    })

    it('should handle empty or null contexts gracefully', () => {
      expect(() => getBDDContext()).not.toThrow()
      expect(() => setBDDState('key', null)).not.toThrow()
      expect(() => getBDDState('nonexistent')).not.toThrow()
      
      expect(getBDDState('nonexistent')).toBeUndefined()
    })
  })
})

describe('cross-browser compatibility', () => {
  it('should work without performance API', () => {
    const originalPerformance = global.performance
    
    // Remove performance API
    delete global.performance
    
    const bridge = new VitestCucumberBridge({ performanceTracking: true })
    
    expect(() => {
      bridge.initializePerformanceTracking()
      bridge.trackMemory('test')
    }).not.toThrow()
    
    const metrics = bridge.getPerformanceMetrics()
    expect(metrics.currentMemory).toBe(0)
    expect(metrics.memoryDiff).toBe(0)
    
    // Restore
    global.performance = originalPerformance
  })

  it('should handle missing memory API gracefully', () => {
    global.performance = {
      now: () => Date.now()
      // No memory property
    }
    
    const bridge = new VitestCucumberBridge({ performanceTracking: true })
    bridge.initializePerformanceTracking()
    
    expect(() => {
      bridge.trackMemory('test')
      bridge.getPerformanceMetrics()
    }).not.toThrow()
  })
})