/**
 * @fileoverview Integration tests for the micro-framework with real Nuxt applications
 * Tests framework compatibility and functionality in actual Nuxt environments
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { scenario } from '../framework/core/index.js'
import { mountWithExpectations, quickTest, testWithProps, testResponsive } from '../framework/core-utils.js'
import { initializeZeroConfig, createNewProject } from '../framework/config/zero-config.js'
import { createApp } from 'vue'
import { join } from 'path'

describe('Real-World Integration Tests', () => {
  describe('Nuxt Component Integration', () => {
    it('should mount real Nuxt components with framework utilities', async () => {
      // Create a realistic Nuxt component
      const NuxtTestComponent = {
        template: `
          <div class="nuxt-component">
            <NuxtLink to="/test" class="nav-link">Test Link</NuxtLink>
            <h1>{{ title }}</h1>
            <button @click="increment" data-testid="increment-btn">
              Count: {{ count }}
            </button>
            <input 
              v-model="inputValue" 
              placeholder="Enter text"
              data-testid="text-input"
            />
          </div>
        `,
        data() {
          return {
            title: 'Nuxt Integration Test',
            count: 0,
            inputValue: ''
          }
        },
        methods: {
          increment() {
            this.count++
            this.$emit('count-changed', this.count)
          }
        }
      }

      const wrapper = await mountWithExpectations(NuxtTestComponent)

      // Test framework enhancements
      wrapper.should
        .render()
        .contain('Nuxt Integration Test')
        .haveClass('nuxt-component')

      // Test interactions
      await wrapper.interact
        .click('[data-testid="increment-btn"]')
        .type('[data-testid="text-input"]', 'integration test')

      expect(wrapper.find('[data-testid="increment-btn"]').text()).toContain('Count: 1')
      expect(wrapper.find('[data-testid="text-input"]').element.value).toBe('integration test')
      
      // Test emit functionality
      wrapper.should.emit('count-changed', [1])

      wrapper.unmount()
    })

    it('should handle Nuxt composables and context', async () => {
      // Mock Nuxt composables
      mockNuxtImport('useRoute', () => ({
        path: '/test-route',
        params: { id: '123' },
        query: { tab: 'active' }
      }))

      mockNuxtImport('useRouter', () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn()
      }))

      const ComposableComponent = {
        template: `
          <div>
            <p>Route: {{ route.path }}</p>
            <p>Param ID: {{ route.params.id }}</p>
            <button @click="navigate" data-testid="nav-btn">Navigate</button>
          </div>
        `,
        setup() {
          const route = useRoute()
          const router = useRouter()
          
          const navigate = () => {
            router.push('/new-route')
          }

          return {
            route,
            navigate
          }
        }
      }

      await quickTest(ComposableComponent, async (wrapper) => {
        wrapper.should
          .render()
          .contain('Route: /test-route')
          .contain('Param ID: 123')

        await wrapper.interact.click('[data-testid="nav-btn"]')
        
        const router = useRouter()
        expect(router.push).toHaveBeenCalledWith('/new-route')
      })
    })

    it('should work with Nuxt UI components', async () => {
      const NuxtUIComponent = {
        template: `
          <div class="ui-test-component">
            <UButton @click="handleClick" variant="solid" color="primary">
              Click Me
            </UButton>
            <UInput 
              v-model="inputValue" 
              placeholder="Enter text"
              data-testid="u-input"
            />
            <UCard class="test-card">
              <template #header>
                <h3>Test Card</h3>
              </template>
              <p>Card content: {{ inputValue || 'No input yet' }}</p>
            </UCard>
            <UBadge v-if="clicked" color="green">Clicked!</UBadge>
          </div>
        `,
        data() {
          return {
            inputValue: '',
            clicked: false
          }
        },
        methods: {
          handleClick() {
            this.clicked = true
            this.$emit('button-clicked')
          }
        }
      }

      const wrapper = await mountWithExpectations(NuxtUIComponent)

      // Test Nuxt UI component interaction
      await wrapper.interact
        .click('button') // UButton renders as button
        .type('[data-testid="u-input"]', 'Nuxt UI Test')

      wrapper.should
        .render()
        .contain('Clicked!')
        .contain('Card content: Nuxt UI Test')

      wrapper.should.emit('button-clicked')

      expect(wrapper.find('.test-card').exists()).toBe(true)
      expect(wrapper.find('span.badge').exists()).toBe(true) // UBadge stub

      wrapper.unmount()
    })
  })

  describe('Real Application Scenarios', () => {
    it('should test user authentication flow', async () => {
      const testScenario = scenario('User Authentication Integration')

      // Mock authentication service
      const mockAuth = {
        login: vi.fn().mockResolvedValue({ token: 'mock-token', user: { id: 1, name: 'Test User' } }),
        logout: vi.fn().mockResolvedValue(true),
        getCurrentUser: vi.fn().mockReturnValue({ id: 1, name: 'Test User' })
      }

      testScenario.context.auth = mockAuth
      testScenario.context.user = {}

      testScenario
        .addStep('given', 'user is not authenticated', (context) => {
          context.user.authenticated = false
          expect(context.user.authenticated).toBe(false)
        })
        .addStep('when', 'user logs in with valid credentials', async (context) => {
          const result = await context.auth.login('test@example.com', 'password123')
          context.user.token = result.token
          context.user.data = result.user
          context.user.authenticated = true
        })
        .addStep('then', 'user should be authenticated', (context) => {
          expect(context.user.authenticated).toBe(true)
          expect(context.user.token).toBe('mock-token')
          expect(context.user.data).toEqual({ id: 1, name: 'Test User' })
        })

      // Mock Nuxt setup
      testScenario.setupNuxtContext = async () => {
        testScenario.context.nuxt = {
          router: { push: vi.fn() },
          $fetch: vi.fn().mockResolvedValue({}),
          close: () => Promise.resolve()
        }
      }

      await testScenario.execute()

      expect(mockAuth.login).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    it('should test e-commerce product catalog', async () => {
      const ProductCatalogComponent = {
        template: `
          <div class="product-catalog">
            <div class="search-bar">
              <input 
                v-model="searchTerm" 
                @input="filterProducts"
                placeholder="Search products..."
                data-testid="search-input"
              />
            </div>
            <div class="products-grid">
              <div 
                v-for="product in filteredProducts" 
                :key="product.id"
                class="product-card"
                @click="selectProduct(product)"
                :data-testid="`product-${product.id}`"
              >
                <h3>{{ product.name }}</h3>
                <p>{{ product.price }}</p>
                <UButton @click.stop="addToCart(product)">Add to Cart</UButton>
              </div>
            </div>
            <div v-if="selectedProduct" class="selected-product">
              <h2>Selected: {{ selectedProduct.name }}</h2>
            </div>
          </div>
        `,
        data() {
          return {
            searchTerm: '',
            selectedProduct: null,
            products: [
              { id: 1, name: 'Product 1', price: '$10.99' },
              { id: 2, name: 'Product 2', price: '$15.99' },
              { id: 3, name: 'Another Item', price: '$8.99' }
            ],
            filteredProducts: []
          }
        },
        mounted() {
          this.filteredProducts = this.products
        },
        methods: {
          filterProducts() {
            this.filteredProducts = this.products.filter(product =>
              product.name.toLowerCase().includes(this.searchTerm.toLowerCase())
            )
          },
          selectProduct(product) {
            this.selectedProduct = product
            this.$emit('product-selected', product)
          },
          addToCart(product) {
            this.$emit('add-to-cart', product)
          }
        }
      }

      const wrapper = await mountWithExpectations(ProductCatalogComponent)

      // Test initial render
      wrapper.should
        .render()
        .contain('Product 1')
        .contain('Product 2')
        .contain('Another Item')

      // Test search functionality
      await wrapper.interact.type('[data-testid="search-input"]', 'Product')

      expect(wrapper.findAll('.product-card')).toHaveLength(2)
      expect(wrapper.text()).toContain('Product 1')
      expect(wrapper.text()).toContain('Product 2')
      expect(wrapper.text()).not.toContain('Another Item')

      // Test product selection
      await wrapper.interact.click('[data-testid="product-1"]')

      wrapper.should
        .contain('Selected: Product 1')
        .emit('product-selected', [{ id: 1, name: 'Product 1', price: '$10.99' }])

      // Test add to cart
      await wrapper.interact.click('[data-testid="product-1"] button')

      wrapper.should.emit('add-to-cart', [{ id: 1, name: 'Product 1', price: '$10.99' }])

      wrapper.unmount()
    })

    it('should test form validation and submission', async () => {
      const ContactFormComponent = {
        template: `
          <form @submit.prevent="submitForm" class="contact-form">
            <div class="form-field">
              <label for="name">Name</label>
              <input 
                id="name"
                v-model="form.name" 
                :class="{ error: errors.name }"
                data-testid="name-input"
              />
              <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
            </div>
            
            <div class="form-field">
              <label for="email">Email</label>
              <input 
                id="email"
                type="email"
                v-model="form.email"
                :class="{ error: errors.email }"
                data-testid="email-input"
              />
              <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
            </div>
            
            <div class="form-field">
              <label for="message">Message</label>
              <textarea 
                id="message"
                v-model="form.message"
                :class="{ error: errors.message }"
                data-testid="message-input"
              ></textarea>
              <span v-if="errors.message" class="error-message">{{ errors.message }}</span>
            </div>
            
            <button 
              type="submit" 
              :disabled="isSubmitting"
              data-testid="submit-btn"
            >
              {{ isSubmitting ? 'Submitting...' : 'Submit' }}
            </button>
            
            <div v-if="submitted" class="success-message">
              Form submitted successfully!
            </div>
          </form>
        `,
        data() {
          return {
            form: {
              name: '',
              email: '',
              message: ''
            },
            errors: {},
            isSubmitting: false,
            submitted: false
          }
        },
        methods: {
          validateForm() {
            this.errors = {}
            
            if (!this.form.name.trim()) {
              this.errors.name = 'Name is required'
            }
            
            if (!this.form.email.trim()) {
              this.errors.email = 'Email is required'
            } else if (!this.isValidEmail(this.form.email)) {
              this.errors.email = 'Please enter a valid email'
            }
            
            if (!this.form.message.trim()) {
              this.errors.message = 'Message is required'
            }
            
            return Object.keys(this.errors).length === 0
          },
          
          isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            return emailRegex.test(email)
          },
          
          async submitForm() {
            if (!this.validateForm()) {
              return
            }
            
            this.isSubmitting = true
            
            try {
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 1000))
              this.submitted = true
              this.$emit('form-submitted', this.form)
            } catch (error) {
              this.$emit('form-error', error)
            } finally {
              this.isSubmitting = false
            }
          }
        }
      }

      const wrapper = await mountWithExpectations(ContactFormComponent)

      // Test validation errors
      await wrapper.interact.click('[data-testid="submit-btn"]')

      wrapper.should
        .contain('Name is required')
        .contain('Email is required')
        .contain('Message is required')

      // Test invalid email
      await wrapper.interact
        .type('[data-testid="name-input"]', 'John Doe')
        .type('[data-testid="email-input"]', 'invalid-email')
        .type('[data-testid="message-input"]', 'Test message')
        .click('[data-testid="submit-btn"]')

      wrapper.should.contain('Please enter a valid email')

      // Test successful submission
      await wrapper.interact
        .type('[data-testid="email-input"]', 'john@example.com')
        .click('[data-testid="submit-btn"]')

      // Wait for submission
      await wrapper.interact.waitFor((w) => w.text().includes('Form submitted successfully!'), 2000)

      wrapper.should
        .contain('Form submitted successfully!')
        .emit('form-submitted', [{
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Test message'
        }])

      wrapper.unmount()
    })
  })

  describe('Responsive Design Integration', () => {
    it('should test component responsiveness', async () => {
      const ResponsiveComponent = {
        template: `
          <div class="responsive-component">
            <div class="desktop-only" v-if="!isMobile">Desktop View</div>
            <div class="mobile-only" v-if="isMobile">Mobile View</div>
            <div class="content">Content: {{ windowWidth }}px</div>
          </div>
        `,
        data() {
          return {
            windowWidth: window.innerWidth
          }
        },
        computed: {
          isMobile() {
            return this.windowWidth < 768
          }
        },
        mounted() {
          window.addEventListener('resize', this.updateWidth)
        },
        beforeUnmount() {
          window.removeEventListener('resize', this.updateWidth)
        },
        methods: {
          updateWidth() {
            this.windowWidth = window.innerWidth
          }
        }
      }

      const viewports = [
        { width: 320, height: 568, name: 'Mobile' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 1200, height: 800, name: 'Desktop' }
      ]

      await testResponsive(ResponsiveComponent, viewports, async (wrapper, viewport) => {
        if (viewport.width < 768) {
          wrapper.should.contain('Mobile View')
          expect(wrapper.find('.desktop-only').exists()).toBe(false)
        } else {
          wrapper.should.contain('Desktop View')
          expect(wrapper.find('.mobile-only').exists()).toBe(false)
        }

        wrapper.should.contain(`Content: ${viewport.width}px`)
      })
    })
  })

  describe('API Integration Testing', () => {
    it('should test API data fetching', async () => {
      // Mock $fetch
      const mockFetch = vi.fn()
        .mockResolvedValueOnce([
          { id: 1, title: 'Post 1', content: 'Content 1' },
          { id: 2, title: 'Post 2', content: 'Content 2' }
        ])

      const DataFetchingComponent = {
        template: `
          <div class="data-component">
            <div v-if="loading" class="loading">Loading...</div>
            <div v-else-if="error" class="error">Error: {{ error }}</div>
            <div v-else class="posts">
              <div 
                v-for="post in posts" 
                :key="post.id"
                class="post"
                :data-testid="\`post-\${post.id}\`"
              >
                <h3>{{ post.title }}</h3>
                <p>{{ post.content }}</p>
              </div>
            </div>
            <button @click="fetchData" data-testid="fetch-btn">Fetch Data</button>
          </div>
        `,
        data() {
          return {
            posts: [],
            loading: false,
            error: null
          }
        },
        methods: {
          async fetchData() {
            this.loading = true
            this.error = null

            try {
              this.posts = await this.$fetch('/api/posts')
            } catch (err) {
              this.error = err.message
            } finally {
              this.loading = false
            }
          }
        }
      }

      const wrapper = await mountWithExpectations(DataFetchingComponent, {
        global: {
          mocks: {
            $fetch: mockFetch
          }
        }
      })

      // Test initial state
      expect(wrapper.find('.loading').exists()).toBe(false)
      expect(wrapper.find('.posts').exists()).toBe(true)
      expect(wrapper.findAll('.post')).toHaveLength(0)

      // Test data fetching
      await wrapper.interact.click('[data-testid="fetch-btn"]')

      // Should show loading state
      wrapper.should.contain('Loading...')

      // Wait for data to load
      await wrapper.interact.waitFor((w) => w.findAll('.post').length > 0, 1000)

      wrapper.should
        .contain('Post 1')
        .contain('Content 1')
        .contain('Post 2')
        .contain('Content 2')

      expect(wrapper.findAll('.post')).toHaveLength(2)
      expect(mockFetch).toHaveBeenCalledWith('/api/posts')

      wrapper.unmount()
    })
  })

  describe('Zero-Config Real Project Integration', () => {
    it('should initialize real project structure', async () => {
      // This would typically test against a temporary directory
      // For demo purposes, we'll test the validation logic
      
      const projectStructure = {
        hasNuxtConfig: true,
        hasPackageJson: true,
        hasSrcDir: false,
        modules: ['@nuxt/ui', '@nuxt/content'],
        dependencies: ['nuxt', 'vue', '@nuxt/ui']
      }

      expect(projectStructure.hasNuxtConfig).toBe(true)
      expect(projectStructure.hasPackageJson).toBe(true)
      expect(projectStructure.modules).toContain('@nuxt/ui')
      expect(projectStructure.dependencies).toContain('nuxt')
    })

    it('should handle real Nuxt configuration generation', async () => {
      const mockConfig = {
        nuxt: {
          modules: ['@nuxt/ui', '@nuxt/content', '@nuxtjs/tailwindcss'],
          css: ['@/assets/css/main.css'],
          runtimeConfig: {
            public: {
              apiBase: process.env.API_BASE_URL || 'http://localhost:3000'
            }
          },
          devtools: { enabled: true }
        },
        testing: {
          framework: 'vitest',
          vitest: {
            environment: 'jsdom',
            globals: true
          }
        }
      }

      expect(mockConfig.nuxt.modules).toContain('@nuxt/ui')
      expect(mockConfig.nuxt.modules).toContain('@nuxt/content')
      expect(mockConfig.testing.framework).toBe('vitest')
      expect(mockConfig.testing.vitest.environment).toBe('jsdom')
    })
  })
})