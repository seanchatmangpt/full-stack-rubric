/**
 * @fileoverview Example project testing scenarios for nuxt-bdd
 * @description Real-world testing scenarios demonstrating library usage
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { 
  VitestCucumberBridge,
  registerGiven,
  registerWhen, 
  registerThen,
  getBDDContext,
  setBDDState,
  getBDDState
} from '../../src/bdd/vitest-cucumber-bridge.js'

/**
 * Example components for testing scenarios
 */

// E-commerce Product Card Component
const ProductCard = {
  name: 'ProductCard',
  template: `
    <div class="product-card" :class="{ 'on-sale': product.onSale }">
      <img :src="product.image" :alt="product.name" class="product-image" />
      <div class="product-info">
        <h3 class="product-name">{{ product.name }}</h3>
        <p class="product-description">{{ product.description }}</p>
        <div class="product-price">
          <span v-if="product.onSale" class="original-price">\${{ product.originalPrice }}</span>
          <span class="current-price">\${{ currentPrice }}</span>
        </div>
        <button 
          @click="addToCart" 
          :disabled="!product.inStock || loading"
          class="add-to-cart-btn"
        >
          {{ loading ? 'Adding...' : product.inStock ? 'Add to Cart' : 'Out of Stock' }}
        </button>
        <div v-if="showSuccess" class="success-message">Added to cart!</div>
      </div>
    </div>
  `,
  props: {
    product: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      showSuccess: false
    }
  },
  computed: {
    currentPrice() {
      return this.product.onSale ? this.product.salePrice : this.product.price
    }
  },
  methods: {
    async addToCart() {
      this.loading = true
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      this.$emit('add-to-cart', {
        productId: this.product.id,
        name: this.product.name,
        price: this.currentPrice,
        quantity: 1
      })
      
      this.loading = false
      this.showSuccess = true
      
      setTimeout(() => {
        this.showSuccess = false
      }, 2000)
    }
  }
}

// User Authentication Form
const LoginForm = {
  name: 'LoginForm',
  template: `
    <form @submit.prevent="handleSubmit" class="login-form">
      <div class="form-group">
        <label for="email">Email:</label>
        <input 
          id="email"
          v-model="form.email" 
          type="email" 
          :class="{ error: errors.email }"
          @blur="validateEmail"
        />
        <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
      </div>
      
      <div class="form-group">
        <label for="password">Password:</label>
        <input 
          id="password"
          v-model="form.password" 
          type="password"
          :class="{ error: errors.password }"
          @blur="validatePassword"
        />
        <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
      </div>
      
      <div class="form-group">
        <label>
          <input type="checkbox" v-model="form.rememberMe" />
          Remember me
        </label>
      </div>
      
      <button type="submit" :disabled="!isFormValid || submitting">
        {{ submitting ? 'Signing in...' : 'Sign In' }}
      </button>
      
      <div v-if="submitError" class="error-message">{{ submitError }}</div>
      <div v-if="submitSuccess" class="success-message">Login successful!</div>
    </form>
  `,
  data() {
    return {
      form: {
        email: '',
        password: '',
        rememberMe: false
      },
      errors: {},
      submitting: false,
      submitError: '',
      submitSuccess: false
    }
  },
  computed: {
    isFormValid() {
      return this.form.email && 
             this.form.password && 
             !this.errors.email && 
             !this.errors.password
    }
  },
  methods: {
    validateEmail() {
      if (!this.form.email) {
        this.errors.email = 'Email is required'
      } else if (!/\S+@\S+\.\S+/.test(this.form.email)) {
        this.errors.email = 'Email is invalid'
      } else {
        this.errors.email = ''
      }
    },
    
    validatePassword() {
      if (!this.form.password) {
        this.errors.password = 'Password is required'
      } else if (this.form.password.length < 6) {
        this.errors.password = 'Password must be at least 6 characters'
      } else {
        this.errors.password = ''
      }
    },
    
    async handleSubmit() {
      this.validateEmail()
      this.validatePassword()
      
      if (!this.isFormValid) return
      
      this.submitting = true
      this.submitError = ''
      
      try {
        // Simulate login API call
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            if (this.form.email === 'test@example.com' && this.form.password === 'password') {
              resolve({ token: 'fake-jwt-token', user: { email: this.form.email } })
            } else {
              reject(new Error('Invalid credentials'))
            }
          }, 1000)
        })
        
        this.submitSuccess = true
        this.$emit('login-success', { 
          email: this.form.email,
          rememberMe: this.form.rememberMe 
        })
        
      } catch (error) {
        this.submitError = error.message
      } finally {
        this.submitting = false
      }
    }
  }
}

// Shopping Cart Component
const ShoppingCart = {
  name: 'ShoppingCart',
  template: `
    <div class="shopping-cart">
      <h2>Shopping Cart ({{ totalItems }} items)</h2>
      
      <div v-if="items.length === 0" class="empty-cart">
        Your cart is empty
      </div>
      
      <div v-else class="cart-items">
        <div 
          v-for="item in items" 
          :key="item.id" 
          class="cart-item"
        >
          <span class="item-name">{{ item.name }}</span>
          <div class="item-controls">
            <button @click="decreaseQuantity(item.id)">-</button>
            <span class="quantity">{{ item.quantity }}</span>
            <button @click="increaseQuantity(item.id)">+</button>
          </div>
          <span class="item-price">\${{ (item.price * item.quantity).toFixed(2) }}</span>
          <button @click="removeItem(item.id)" class="remove-btn">Remove</button>
        </div>
        
        <div class="cart-summary">
          <div class="subtotal">Subtotal: \${{ subtotal.toFixed(2) }}</div>
          <div class="tax">Tax: \${{ tax.toFixed(2) }}</div>
          <div class="total">Total: \${{ total.toFixed(2) }}</div>
          
          <button 
            @click="checkout" 
            :disabled="checkingOut"
            class="checkout-btn"
          >
            {{ checkingOut ? 'Processing...' : 'Checkout' }}
          </button>
        </div>
      </div>
    </div>
  `,
  props: {
    items: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      checkingOut: false,
      taxRate: 0.08
    }
  },
  computed: {
    totalItems() {
      return this.items.reduce((total, item) => total + item.quantity, 0)
    },
    
    subtotal() {
      return this.items.reduce((total, item) => total + (item.price * item.quantity), 0)
    },
    
    tax() {
      return this.subtotal * this.taxRate
    },
    
    total() {
      return this.subtotal + this.tax
    }
  },
  methods: {
    increaseQuantity(itemId) {
      this.$emit('update-quantity', { itemId, change: 1 })
    },
    
    decreaseQuantity(itemId) {
      this.$emit('update-quantity', { itemId, change: -1 })
    },
    
    removeItem(itemId) {
      this.$emit('remove-item', itemId)
    },
    
    async checkout() {
      this.checkingOut = true
      
      try {
        // Simulate checkout process
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        this.$emit('checkout-complete', {
          items: this.items,
          total: this.total,
          timestamp: new Date().toISOString()
        })
        
      } finally {
        this.checkingOut = false
      }
    }
  }
}

describe('nuxt-bdd example testing scenarios', () => {
  let bridge

  beforeEach(() => {
    bridge = new VitestCucumberBridge({
      performanceTracking: true,
      autoCleanup: false
    })
  })

  describe('E-commerce Product Scenarios', () => {
    it('should handle complete product interaction workflow', async () => {
      const testProduct = {
        id: 'prod-001',
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 199.99,
        originalPrice: 249.99,
        salePrice: 159.99,
        onSale: true,
        inStock: true,
        image: '/images/headphones.jpg'
      }

      // BDD Step 1: Given I have a product
      setBDDState('currentProduct', testProduct)
      const wrapper = await bridge.mountComponent({
        component: ProductCard,
        props: { product: testProduct }
      })

      // Verify product display
      expect(wrapper.text()).toContain('Wireless Headphones')
      expect(wrapper.text()).toContain('$159.99') // Sale price
      expect(wrapper.text()).toContain('$249.99') // Original price
      expect(wrapper.find('.on-sale').exists()).toBe(true)

      // BDD Step 2: When I add product to cart
      const cartEvents = []
      wrapper.vm.$on('add-to-cart', (event) => {
        cartEvents.push(event)
      })

      const addButton = wrapper.find('.add-to-cart-btn')
      expect(addButton.text()).toBe('Add to Cart')
      
      await addButton.trigger('click')
      
      // Should show loading state
      expect(addButton.text()).toBe('Adding...')
      expect(addButton.element.disabled).toBe(true)

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 600))

      // BDD Step 3: Then product should be added to cart
      expect(cartEvents).toHaveLength(1)
      expect(cartEvents[0]).toEqual({
        productId: 'prod-001',
        name: 'Wireless Headphones',
        price: 159.99,
        quantity: 1
      })

      expect(wrapper.find('.success-message').text()).toBe('Added to cart!')
      
      wrapper.unmount()
    })

    it('should handle out-of-stock products correctly', async () => {
      const outOfStockProduct = {
        id: 'prod-002',
        name: 'Out of Stock Item',
        price: 99.99,
        inStock: false
      }

      const wrapper = await bridge.mountComponent({
        component: ProductCard,
        props: { product: outOfStockProduct }
      })

      const addButton = wrapper.find('.add-to-cart-btn')
      expect(addButton.text()).toBe('Out of Stock')
      expect(addButton.element.disabled).toBe(true)
      
      // Should not emit events when clicked
      const cartEvents = []
      wrapper.vm.$on('add-to-cart', (event) => cartEvents.push(event))
      
      await addButton.trigger('click')
      expect(cartEvents).toHaveLength(0)
      
      wrapper.unmount()
    })
  })

  describe('User Authentication Scenarios', () => {
    it('should handle successful login workflow', async () => {
      const wrapper = await bridge.mountComponent({
        component: LoginForm
      })

      // BDD Step 1: Given I have valid credentials
      const emailInput = wrapper.find('#email')
      const passwordInput = wrapper.find('#password')
      
      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('password')

      // Trigger validation
      await emailInput.trigger('blur')
      await passwordInput.trigger('blur')

      expect(wrapper.find('.error-message').exists()).toBe(false)

      // BDD Step 2: When I submit the form
      const loginEvents = []
      wrapper.vm.$on('login-success', (event) => {
        loginEvents.push(event)
      })

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.element.disabled).toBe(false)
      
      await wrapper.find('form').trigger('submit')

      // Should show loading state
      expect(submitButton.text()).toBe('Signing in...')
      expect(submitButton.element.disabled).toBe(true)

      // Wait for async login
      await new Promise(resolve => setTimeout(resolve, 1100))

      // BDD Step 3: Then I should be logged in successfully
      expect(loginEvents).toHaveLength(1)
      expect(loginEvents[0]).toEqual({
        email: 'test@example.com',
        rememberMe: false
      })

      expect(wrapper.find('.success-message').text()).toBe('Login successful!')
      
      wrapper.unmount()
    })

    it('should handle login validation errors', async () => {
      const wrapper = await bridge.mountComponent({
        component: LoginForm
      })

      // Test empty form submission
      await wrapper.find('form').trigger('submit')
      
      const emailInput = wrapper.find('#email')
      const passwordInput = wrapper.find('#password')
      
      await emailInput.trigger('blur')
      await passwordInput.trigger('blur')

      expect(wrapper.text()).toContain('Email is required')
      expect(wrapper.text()).toContain('Password is required')

      // Test invalid email
      await emailInput.setValue('invalid-email')
      await emailInput.trigger('blur')
      
      expect(wrapper.text()).toContain('Email is invalid')

      // Test short password
      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('123')
      await passwordInput.trigger('blur')

      expect(wrapper.text()).toContain('Password must be at least 6 characters')
      
      wrapper.unmount()
    })

    it('should handle login API errors', async () => {
      const wrapper = await bridge.mountComponent({
        component: LoginForm
      })

      // Use invalid credentials
      await wrapper.find('#email').setValue('wrong@example.com')
      await wrapper.find('#password').setValue('wrongpassword')

      await wrapper.find('form').trigger('submit')

      // Wait for API call to fail
      await new Promise(resolve => setTimeout(resolve, 1100))

      expect(wrapper.find('.error-message').text()).toBe('Invalid credentials')
      expect(wrapper.find('.success-message').exists()).toBe(false)
      
      wrapper.unmount()
    })
  })

  describe('Shopping Cart Scenarios', () => {
    it('should handle complete cart management workflow', async () => {
      const initialCartItems = [
        { id: 'item1', name: 'Item 1', price: 10.99, quantity: 2 },
        { id: 'item2', name: 'Item 2', price: 25.50, quantity: 1 }
      ]

      const wrapper = await bridge.mountComponent({
        component: ShoppingCart,
        props: { items: initialCartItems }
      })

      // BDD Step 1: Given I have items in my cart
      expect(wrapper.text()).toContain('Shopping Cart (3 items)')
      expect(wrapper.text()).toContain('Item 1')
      expect(wrapper.text()).toContain('Item 2')

      // Verify calculations
      const subtotal = (10.99 * 2) + (25.50 * 1) // 47.48
      const tax = subtotal * 0.08 // 3.80
      const total = subtotal + tax // 51.28

      expect(wrapper.text()).toContain(`Subtotal: $${subtotal.toFixed(2)}`)
      expect(wrapper.text()).toContain(`Tax: $${tax.toFixed(2)}`)
      expect(wrapper.text()).toContain(`Total: $${total.toFixed(2)}`)

      // BDD Step 2: When I modify quantities
      const updateEvents = []
      wrapper.vm.$on('update-quantity', (event) => {
        updateEvents.push(event)
      })

      const increaseButtons = wrapper.findAll('.item-controls button').filter(btn => btn.text() === '+')
      await increaseButtons[0].trigger('click') // Increase first item

      expect(updateEvents).toContainEqual({ itemId: 'item1', change: 1 })

      // BDD Step 3: When I remove an item
      const removeEvents = []
      wrapper.vm.$on('remove-item', (itemId) => {
        removeEvents.push(itemId)
      })

      const removeButtons = wrapper.findAll('.remove-btn')
      await removeButtons[1].trigger('click') // Remove second item

      expect(removeEvents).toContain('item2')

      // BDD Step 4: When I checkout
      const checkoutEvents = []
      wrapper.vm.$on('checkout-complete', (event) => {
        checkoutEvents.push(event)
      })

      const checkoutButton = wrapper.find('.checkout-btn')
      await checkoutButton.trigger('click')

      expect(checkoutButton.text()).toBe('Processing...')
      expect(checkoutButton.element.disabled).toBe(true)

      // Wait for checkout to complete
      await new Promise(resolve => setTimeout(resolve, 2100))

      // BDD Step 5: Then checkout should complete
      expect(checkoutEvents).toHaveLength(1)
      expect(checkoutEvents[0]).toMatchObject({
        items: initialCartItems,
        total: expect.any(Number)
      })
      
      wrapper.unmount()
    })

    it('should handle empty cart correctly', async () => {
      const wrapper = await bridge.mountComponent({
        component: ShoppingCart,
        props: { items: [] }
      })

      expect(wrapper.text()).toContain('Shopping Cart (0 items)')
      expect(wrapper.text()).toContain('Your cart is empty')
      expect(wrapper.find('.checkout-btn').exists()).toBe(false)
      
      wrapper.unmount()
    })
  })

  describe('Complex Integration Scenarios', () => {
    it('should handle complete e-commerce user journey', async () => {
      // This test demonstrates a complete user journey using multiple components
      setBDDState('userJourney', {
        step: 'start',
        products: [],
        cart: [],
        user: null
      })

      // Step 1: User browses products
      const product = {
        id: 'journey-prod',
        name: 'Test Product',
        price: 50.00,
        inStock: true
      }

      const productWrapper = await bridge.mountComponent({
        component: ProductCard,
        props: { product }
      })

      let cartItems = []
      productWrapper.vm.$on('add-to-cart', (item) => {
        cartItems.push(item)
        setBDDState('userJourney', {
          ...getBDDState('userJourney'),
          step: 'product-added',
          cart: cartItems
        })
      })

      // Add product to cart
      await productWrapper.find('.add-to-cart-btn').trigger('click')
      await new Promise(resolve => setTimeout(resolve, 600))

      expect(cartItems).toHaveLength(1)
      productWrapper.unmount()

      // Step 2: User views cart
      const cartWrapper = await bridge.mountComponent({
        component: ShoppingCart,
        props: { items: cartItems }
      })

      expect(cartWrapper.text()).toContain('Test Product')
      
      let checkoutCompleted = false
      cartWrapper.vm.$on('checkout-complete', (order) => {
        checkoutCompleted = true
        setBDDState('userJourney', {
          ...getBDDState('userJourney'),
          step: 'checkout-complete',
          order
        })
      })

      // Proceed to checkout
      await cartWrapper.find('.checkout-btn').trigger('click')
      await new Promise(resolve => setTimeout(resolve, 2100))

      expect(checkoutCompleted).toBe(true)
      cartWrapper.unmount()

      // Step 3: User needs to login after checkout
      const loginWrapper = await bridge.mountComponent({
        component: LoginForm
      })

      let loginSuccess = false
      loginWrapper.vm.$on('login-success', (user) => {
        loginSuccess = true
        setBDDState('userJourney', {
          ...getBDDState('userJourney'),
          step: 'login-complete',
          user
        })
      })

      // Complete login
      await loginWrapper.find('#email').setValue('test@example.com')
      await loginWrapper.find('#password').setValue('password')
      await loginWrapper.find('form').trigger('submit')
      await new Promise(resolve => setTimeout(resolve, 1100))

      expect(loginSuccess).toBe(true)
      loginWrapper.unmount()

      // Verify complete journey state
      const journeyState = getBDDState('userJourney')
      expect(journeyState.step).toBe('login-complete')
      expect(journeyState.cart).toHaveLength(1)
      expect(journeyState.user).toBeDefined()
      expect(journeyState.order).toBeDefined()

      console.log('Complete user journey completed successfully:', journeyState)
    })
  })

  describe('Performance and Stress Testing', () => {
    it('should handle rapid user interactions', async () => {
      const product = {
        id: 'stress-test',
        name: 'Stress Test Product',
        price: 10.00,
        inStock: true
      }

      const wrapper = await bridge.mountComponent({
        component: ProductCard,
        props: { product }
      })

      const events = []
      wrapper.vm.$on('add-to-cart', (event) => events.push(event))

      // Rapidly click add to cart (should handle debouncing/multiple clicks)
      const button = wrapper.find('.add-to-cart-btn')
      
      // Click multiple times rapidly
      for (let i = 0; i < 5; i++) {
        await button.trigger('click')
      }

      // Wait for all async operations
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Should handle rapid clicks gracefully (may add once or handle multiple)
      expect(events.length).toBeGreaterThan(0)
      
      wrapper.unmount()
    })

    it('should handle large cart efficiently', async () => {
      // Create cart with many items
      const manyItems = Array(100).fill(null).map((_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        price: Math.random() * 100,
        quantity: Math.floor(Math.random() * 5) + 1
      }))

      const start = performance.now()
      
      const wrapper = await bridge.mountComponent({
        component: ShoppingCart,
        props: { items: manyItems }
      })

      const mountTime = performance.now() - start
      
      // Should mount large cart reasonably quickly
      expect(mountTime).toBeLessThan(200)

      // Verify all items rendered
      expect(wrapper.findAll('.cart-item')).toHaveLength(100)
      
      // Test cart operations
      const updateStart = performance.now()
      
      const updateEvents = []
      wrapper.vm.$on('update-quantity', (event) => updateEvents.push(event))
      
      // Update quantity on first item
      const firstIncreaseButton = wrapper.find('.item-controls button[text="+"]')
      await firstIncreaseButton.trigger('click')
      
      const updateTime = performance.now() - updateStart
      
      // Should handle updates quickly even with large cart
      expect(updateTime).toBeLessThan(50)
      expect(updateEvents).toHaveLength(1)
      
      wrapper.unmount()
    })
  })
})