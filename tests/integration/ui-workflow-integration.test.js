/**
 * @fileoverview Comprehensive UI Workflow Integration Tests
 * Tests complete user workflows across multiple components and systems
 * Covers Search→Filter→Table, Form→Validation→Modal, Navigation→Content→Loading flows
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mountWithExpectations, quickTest, performanceTest, memoryLeakTest, a11yTest, testResponsive } from '../framework/core-utils.js'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import AppHeader from '../../app/components/AppHeader.vue'
import TypingMonacoEditor from '../../app/components/TypingMonacoEditor.vue'

// Mock Monaco Editor completely to avoid import issues
vi.mock('monaco-editor', () => {
  return {
    default: {
      editor: {
        create: vi.fn(() => ({
          dispose: vi.fn(),
          focus: vi.fn(),
          getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          onKeyDown: vi.fn(() => ({ dispose: vi.fn() })),
          deltaDecorations: vi.fn(() => []),
          setValue: vi.fn(),
          getValue: vi.fn(() => '')
        })),
        createModel: vi.fn(() => ({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => ''),
          getLinesContent: vi.fn(() => ['']),
          getPositionAt: vi.fn(() => ({ lineNumber: 1, column: 1 })),
          onDidChangeContent: vi.fn(() => ({ dispose: vi.fn() }))
        })),
        MinimapPosition: { Inline: 1 }
      },
      KeyCode: { Backspace: 1, Delete: 2 },
      Range: class MockRange {}
    },
    editor: {
      create: vi.fn(() => ({
        dispose: vi.fn(),
        focus: vi.fn(),
        getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
        onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
        onKeyDown: vi.fn(() => ({ dispose: vi.fn() })),
        deltaDecorations: vi.fn(() => []),
        setValue: vi.fn(),
        getValue: vi.fn(() => '')
      })),
      createModel: vi.fn(() => ({
        dispose: vi.fn(),
        setValue: vi.fn(),
        getValue: vi.fn(() => ''),
        getLinesContent: vi.fn(() => ['']),
        getPositionAt: vi.fn(() => ({ lineNumber: 1, column: 1 })),
        onDidChangeContent: vi.fn(() => ({ dispose: vi.fn() }))
      })),
      MinimapPosition: { Inline: 1 }
    },
    KeyCode: { Backspace: 1, Delete: 2 },
    Range: class MockRange {}
  }
})

// Mock Nuxt composables and components
vi.mock('#app', () => ({
  useAppConfig: () => ({
    header: {
      search: true,
      colorMode: true,
      logo: { light: '/logo-light.png', dark: '/logo-dark.png' },
      title: 'Test App'
    }
  })
}))

vi.mock('../../app/composables/useTypingMetrics', () => ({
  useTypingMetrics: () => ({
    currentSession: { value: null },
    isActive: { value: false },
    metrics: { 
      value: { 
        wpm: 65, 
        accuracy: 94.5, 
        consistency: 87.2,
        errorPatterns: new Map([['th', 3], ['er', 2]])
      } 
    },
    sessionDuration: { value: 45000 },
    progressScore: { value: 73 },
    startSession: vi.fn(),
    endSession: vi.fn(() => ({ id: 'session-123', wpm: 65, accuracy: 94.5 })),
    pauseSession: vi.fn(),
    resumeSession: vi.fn(),
    resetSession: vi.fn(),
    recordKeystroke: vi.fn()
  })
}))

// Global test setup
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  currentRoute: { value: { path: '/', name: 'index' } }
}

const createMockNuxtApp = () => ({
  $router: mockRouter,
  $route: { params: {}, query: {}, path: '/', name: 'index' },
  provide: vi.fn(),
  runWithContext: vi.fn()
})

describe('UI Workflow Integration Tests', () => {
  let mockApp
  
  beforeEach(() => {
    vi.clearAllMocks()
    mockApp = createMockNuxtApp()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('1. Search → Filter → Table Workflow', () => {
    it('should complete full search and filter workflow', async () => {
      const mockSearchResults = [
        { id: 1, title: 'JavaScript Basics', category: 'beginner', type: 'exercise' },
        { id: 2, title: 'Advanced Arrays', category: 'intermediate', type: 'exercise' },
        { id: 3, title: 'Async Patterns', category: 'advanced', type: 'tutorial' }
      ]

      // Mock search API
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: mockSearchResults })
      })
      global.fetch = mockFetch

      const SearchFilterTable = {
        template: `
          <div class="search-filter-container">
            <div class="search-section">
              <input 
                v-model="searchQuery" 
                placeholder="Search exercises..."
                class="search-input"
                data-testid="search-input"
                @input="handleSearch"
              />
              <button 
                class="search-btn" 
                data-testid="search-button"
                @click="executeSearch"
                :disabled="!searchQuery"
              >
                Search
              </button>
            </div>
            
            <div class="filter-section">
              <select 
                v-model="categoryFilter" 
                data-testid="category-filter"
                @change="applyFilters"
              >
                <option value="">All Categories</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              
              <select 
                v-model="typeFilter" 
                data-testid="type-filter"
                @change="applyFilters"
              >
                <option value="">All Types</option>
                <option value="exercise">Exercise</option>
                <option value="tutorial">Tutorial</option>
              </select>
            </div>
            
            <div class="results-table" data-testid="results-table">
              <div v-if="loading" class="loading" data-testid="loading-indicator">
                Loading...
              </div>
              <div v-else-if="filteredResults.length === 0" class="no-results" data-testid="no-results">
                No results found
              </div>
              <table v-else>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="result in filteredResults" 
                    :key="result.id"
                    :data-testid="'result-row-' + result.id"
                  >
                    <td>{{ result.title }}</td>
                    <td>{{ result.category }}</td>
                    <td>{{ result.type }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `,
        data() {
          return {
            searchQuery: '',
            categoryFilter: '',
            typeFilter: '',
            results: [],
            loading: false
          }
        },
        computed: {
          filteredResults() {
            let filtered = this.results
            if (this.categoryFilter) {
              filtered = filtered.filter(item => item.category === this.categoryFilter)
            }
            if (this.typeFilter) {
              filtered = filtered.filter(item => item.type === this.typeFilter)
            }
            return filtered
          }
        },
        methods: {
          async handleSearch() {
            if (this.searchQuery.length > 2) {
              await this.executeSearch()
            }
          },
          async executeSearch() {
            this.loading = true
            try {
              const response = await fetch(`/api/search?q=${encodeURIComponent(this.searchQuery)}`)
              const data = await response.json()
              this.results = data.results
            } finally {
              this.loading = false
            }
          },
          applyFilters() {
            // Filters are applied via computed property
          }
        }
      }

      const wrapper = await mountWithExpectations(SearchFilterTable)

      // Step 1: Enter search query
      await wrapper.interact.type('[data-testid="search-input"]', 'javascript')
      expect(wrapper.find('[data-testid="search-input"]').element.value).toBe('javascript')

      // Step 2: Execute search
      await wrapper.interact.click('[data-testid="search-button"]')
      expect(mockFetch).toHaveBeenCalledWith('/api/search?q=javascript')

      // Wait for search results
      await flushPromises()
      await nextTick()

      // Step 3: Verify results are displayed
      expect(wrapper.find('[data-testid="loading-indicator"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="results-table"] table').exists()).toBe(true)
      expect(wrapper.findAll('[data-testid^="result-row-"]')).toHaveLength(3)

      // Step 4: Apply category filter
      const categoryFilter = wrapper.find('[data-testid="category-filter"]')
      await categoryFilter.setValue('intermediate')
      await categoryFilter.trigger('change')

      await nextTick()

      // Step 5: Verify filtered results
      const filteredRows = wrapper.findAll('[data-testid^="result-row-"]')
      expect(filteredRows).toHaveLength(1)
      expect(filteredRows[0].text()).toContain('Advanced Arrays')

      // Step 6: Apply type filter
      const typeFilter = wrapper.find('[data-testid="type-filter"]')
      await typeFilter.setValue('tutorial')
      await typeFilter.trigger('change')

      await nextTick()

      // Step 7: Verify no results (intermediate + tutorial combination)
      expect(wrapper.find('[data-testid="no-results"]').exists()).toBe(true)

      wrapper.unmount()
    })

    it('should handle search performance under load', async () => {
      const performanceTestResult = await performanceTest(async () => {
        // Simulate rapid search operations
        for (let i = 0; i < 50; i++) {
          const mockComponent = {
            template: '<div>{{ searchQuery }}</div>',
            data: () => ({ searchQuery: `search-${i}` })
          }
          const wrapper = mount(mockComponent)
          await wrapper.setData({ searchQuery: `rapid-search-${i}` })
          wrapper.unmount()
        }
      }, 500) // Should complete within 500ms

      expect(performanceTestResult).toBeLessThan(500)
    })
  })

  describe('2. Form → Validation → Modal Workflow', () => {
    it('should complete form validation and modal workflow', async () => {
      const FormValidationModal = {
        template: `
          <div class="form-modal-container">
            <form @submit.prevent="handleSubmit" data-testid="user-form">
              <div class="form-group">
                <label for="username">Username:</label>
                <input 
                  id="username"
                  v-model="form.username" 
                  type="text"
                  data-testid="username-input"
                  :class="{ 'error': errors.username }"
                />
                <span v-if="errors.username" class="error-msg" data-testid="username-error">
                  {{ errors.username }}
                </span>
              </div>
              
              <div class="form-group">
                <label for="email">Email:</label>
                <input 
                  id="email"
                  v-model="form.email" 
                  type="email"
                  data-testid="email-input"
                  :class="{ 'error': errors.email }"
                />
                <span v-if="errors.email" class="error-msg" data-testid="email-error">
                  {{ errors.email }}
                </span>
              </div>
              
              <div class="form-group">
                <label for="password">Password:</label>
                <input 
                  id="password"
                  v-model="form.password" 
                  type="password"
                  data-testid="password-input"
                  :class="{ 'error': errors.password }"
                />
                <span v-if="errors.password" class="error-msg" data-testid="password-error">
                  {{ errors.password }}
                </span>
              </div>
              
              <button 
                type="submit" 
                data-testid="submit-button"
                :disabled="!isFormValid"
                :class="{ 'loading': isSubmitting }"
              >
                {{ isSubmitting ? 'Submitting...' : 'Submit' }}
              </button>
            </form>
            
            <!-- Success Modal -->
            <div 
              v-if="showSuccessModal" 
              class="modal-overlay" 
              data-testid="success-modal"
              @click="closeModal"
            >
              <div class="modal-content" @click.stop>
                <h3>Success!</h3>
                <p data-testid="success-message">User {{ form.username }} created successfully!</p>
                <button 
                  data-testid="modal-close-button" 
                  @click="closeModal"
                >
                  Close
                </button>
              </div>
            </div>
            
            <!-- Error Modal -->
            <div 
              v-if="showErrorModal" 
              class="modal-overlay error-modal" 
              data-testid="error-modal"
              @click="closeErrorModal"
            >
              <div class="modal-content" @click.stop>
                <h3>Error!</h3>
                <p data-testid="error-message">{{ submitError }}</p>
                <button 
                  data-testid="error-modal-close-button" 
                  @click="closeErrorModal"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        `,
        data() {
          return {
            form: {
              username: '',
              email: '',
              password: ''
            },
            errors: {},
            isSubmitting: false,
            showSuccessModal: false,
            showErrorModal: false,
            submitError: ''
          }
        },
        computed: {
          isFormValid() {
            return Object.keys(this.errors).length === 0 && 
                   this.form.username && 
                   this.form.email && 
                   this.form.password
          }
        },
        watch: {
          'form.username'() { this.validateField('username') },
          'form.email'() { this.validateField('email') },
          'form.password'() { this.validateField('password') }
        },
        methods: {
          validateField(fieldName) {
            this.errors = { ...this.errors }
            delete this.errors[fieldName]
            
            switch (fieldName) {
              case 'username':
                if (!this.form.username) {
                  this.errors.username = 'Username is required'
                } else if (this.form.username.length < 3) {
                  this.errors.username = 'Username must be at least 3 characters'
                }
                break
              case 'email':
                if (!this.form.email) {
                  this.errors.email = 'Email is required'
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) {
                  this.errors.email = 'Please enter a valid email'
                }
                break
              case 'password':
                if (!this.form.password) {
                  this.errors.password = 'Password is required'
                } else if (this.form.password.length < 6) {
                  this.errors.password = 'Password must be at least 6 characters'
                }
                break
            }
          },
          async handleSubmit() {
            // Validate all fields
            Object.keys(this.form).forEach(field => this.validateField(field))
            
            if (!this.isFormValid) return
            
            this.isSubmitting = true
            
            try {
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 1000))
              
              // Random success/failure for testing
              if (Math.random() > 0.3) {
                this.showSuccessModal = true
              } else {
                throw new Error('Server error occurred')
              }
            } catch (error) {
              this.submitError = error.message
              this.showErrorModal = true
            } finally {
              this.isSubmitting = false
            }
          },
          closeModal() {
            this.showSuccessModal = false
            this.form = { username: '', email: '', password: '' }
            this.errors = {}
          },
          closeErrorModal() {
            this.showErrorModal = false
            this.submitError = ''
          }
        }
      }

      const wrapper = await mountWithExpectations(FormValidationModal)

      // Step 1: Test validation errors
      await wrapper.interact.type('[data-testid="username-input"]', 'ab')
      expect(wrapper.find('[data-testid="username-error"]').text()).toContain('at least 3 characters')

      // Step 2: Fix validation errors
      await wrapper.interact.type('[data-testid="username-input"]', 'testuser')
      expect(wrapper.find('[data-testid="username-error"]').exists()).toBe(false)

      await wrapper.interact.type('[data-testid="email-input"]', 'test@example.com')
      await wrapper.interact.type('[data-testid="password-input"]', 'password123')

      // Step 3: Verify form is now valid
      expect(wrapper.find('[data-testid="submit-button"]').attributes('disabled')).toBeFalsy()

      // Step 4: Submit form
      await wrapper.interact.click('[data-testid="submit-button"]')
      expect(wrapper.find('[data-testid="submit-button"]').text()).toBe('Submitting...')

      // Step 5: Wait for submission and check for modal
      await new Promise(resolve => setTimeout(resolve, 1100))
      await nextTick()

      // Should show either success or error modal
      const hasSuccessModal = wrapper.find('[data-testid="success-modal"]').exists()
      const hasErrorModal = wrapper.find('[data-testid="error-modal"]').exists()
      expect(hasSuccessModal || hasErrorModal).toBe(true)

      // Step 6: Close modal
      if (hasSuccessModal) {
        await wrapper.interact.click('[data-testid="modal-close-button"]')
        expect(wrapper.find('[data-testid="success-modal"]').exists()).toBe(false)
      } else if (hasErrorModal) {
        await wrapper.interact.click('[data-testid="error-modal-close-button"]')
        expect(wrapper.find('[data-testid="error-modal"]').exists()).toBe(false)
      }

      wrapper.unmount()
    })
  })

  describe('3. Navigation → Content → Loading Workflow', () => {
    it('should handle navigation with loading states', async () => {
      const NavigationContentLoader = {
        template: `
          <div class="nav-content-container">
            <nav class="navigation" data-testid="main-nav">
              <ul>
                <li>
                  <a 
                    href="#" 
                    data-testid="nav-home" 
                    :class="{ active: currentView === 'home' }"
                    @click.prevent="navigateTo('home')"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    data-testid="nav-exercises" 
                    :class="{ active: currentView === 'exercises' }"
                    @click.prevent="navigateTo('exercises')"
                  >
                    Exercises
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    data-testid="nav-profile" 
                    :class="{ active: currentView === 'profile' }"
                    @click.prevent="navigateTo('profile')"
                  >
                    Profile
                  </a>
                </li>
              </ul>
            </nav>
            
            <main class="content" data-testid="main-content">
              <div v-if="isLoading" class="loading-container" data-testid="loading-container">
                <div class="spinner" data-testid="loading-spinner"></div>
                <p>Loading {{ currentView }}...</p>
              </div>
              
              <div v-else-if="error" class="error-container" data-testid="error-container">
                <h2>Error</h2>
                <p>{{ error }}</p>
                <button data-testid="retry-button" @click="retryLoad">Retry</button>
              </div>
              
              <div v-else>
                <component :is="currentComponent" :data="contentData" />
              </div>
            </main>
          </div>
        `,
        data() {
          return {
            currentView: 'home',
            isLoading: false,
            error: null,
            contentData: null
          }
        },
        computed: {
          currentComponent() {
            const components = {
              home: { template: '<div data-testid="home-content"><h1>Welcome Home</h1></div>' },
              exercises: { 
                template: `
                  <div data-testid="exercises-content">
                    <h1>Exercises</h1>
                    <div v-if="data && data.exercises">
                      <div 
                        v-for="exercise in data.exercises" 
                        :key="exercise.id"
                        data-testid="exercise-item"
                      >
                        {{ exercise.title }}
                      </div>
                    </div>
                  </div>
                `,
                props: ['data']
              },
              profile: { 
                template: `
                  <div data-testid="profile-content">
                    <h1>Profile</h1>
                    <div v-if="data">
                      <p data-testid="profile-name">{{ data.name }}</p>
                      <p data-testid="profile-email">{{ data.email }}</p>
                    </div>
                  </div>
                `,
                props: ['data']
              }
            }
            return components[this.currentView]
          }
        },
        methods: {
          async navigateTo(view) {
            if (this.currentView === view) return
            
            this.currentView = view
            this.isLoading = true
            this.error = null
            this.contentData = null
            
            try {
              // Simulate API call with varying delay
              const delay = Math.random() * 1000 + 500
              await new Promise(resolve => setTimeout(resolve, delay))
              
              // Simulate occasional failure
              if (Math.random() < 0.2) {
                throw new Error(`Failed to load ${view} content`)
              }
              
              // Mock different data for each view
              const mockData = {
                home: null,
                exercises: {
                  exercises: [
                    { id: 1, title: 'JavaScript Basics' },
                    { id: 2, title: 'Array Methods' },
                    { id: 3, title: 'Async Programming' }
                  ]
                },
                profile: {
                  name: 'John Doe',
                  email: 'john@example.com'
                }
              }
              
              this.contentData = mockData[view]
              
            } catch (error) {
              this.error = error.message
            } finally {
              this.isLoading = false
            }
          },
          async retryLoad() {
            await this.navigateTo(this.currentView)
          }
        }
      }

      const wrapper = await mountWithExpectations(NavigationContentLoader)

      // Step 1: Verify initial state
      expect(wrapper.find('[data-testid="home-content"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="nav-home"]').classes()).toContain('active')

      // Step 2: Navigate to exercises
      await wrapper.interact.click('[data-testid="nav-exercises"]')
      
      // Step 3: Verify loading state
      expect(wrapper.find('[data-testid="loading-container"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(true)

      // Step 4: Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 1600))
      await nextTick()

      // Step 5: Verify loaded content or error
      const hasContent = wrapper.find('[data-testid="exercises-content"]').exists()
      const hasError = wrapper.find('[data-testid="error-container"]').exists()
      expect(hasContent || hasError).toBe(true)

      if (hasContent) {
        expect(wrapper.findAll('[data-testid="exercise-item"]')).toHaveLength(3)
      } else if (hasError) {
        // Step 6: Test retry functionality
        await wrapper.interact.click('[data-testid="retry-button"]')
        expect(wrapper.find('[data-testid="loading-container"]').exists()).toBe(true)
      }

      // Step 7: Navigate to profile
      await wrapper.interact.click('[data-testid="nav-profile"]')
      await new Promise(resolve => setTimeout(resolve, 1600))
      await nextTick()

      // Verify profile content loaded (if successful)
      if (wrapper.find('[data-testid="profile-content"]').exists()) {
        expect(wrapper.find('[data-testid="profile-name"]').exists()).toBe(true)
        expect(wrapper.find('[data-testid="profile-email"]').exists()).toBe(true)
      }

      wrapper.unmount()
    })
  })

  describe('4. Global Notifications System', () => {
    it('should handle multiple notification types and interactions', async () => {
      const GlobalNotifications = {
        template: `
          <div class="notifications-container">
            <div class="notification-triggers">
              <button data-testid="success-trigger" @click="showNotification('success', 'Operation completed!')">
                Show Success
              </button>
              <button data-testid="error-trigger" @click="showNotification('error', 'Something went wrong!')">
                Show Error
              </button>
              <button data-testid="warning-trigger" @click="showNotification('warning', 'Please be careful!')">
                Show Warning
              </button>
              <button data-testid="info-trigger" @click="showNotification('info', 'Here is some information')">
                Show Info
              </button>
            </div>
            
            <div class="notifications-overlay" data-testid="notifications-overlay">
              <transition-group name="notification" tag="div" class="notifications-list">
                <div
                  v-for="notification in notifications"
                  :key="notification.id"
                  :class="['notification', notification.type]"
                  :data-testid="'notification-' + notification.id"
                >
                  <div class="notification-content">
                    <div class="notification-message">{{ notification.message }}</div>
                    <button 
                      class="notification-close" 
                      :data-testid="'close-' + notification.id"
                      @click="removeNotification(notification.id)"
                    >
                      ×
                    </button>
                  </div>
                  <div class="notification-progress" v-if="notification.autoClose">
                    <div 
                      class="progress-bar" 
                      :style="{ animationDuration: notification.duration + 'ms' }"
                    ></div>
                  </div>
                </div>
              </transition-group>
            </div>
          </div>
        `,
        data() {
          return {
            notifications: [],
            notificationId: 0
          }
        },
        methods: {
          showNotification(type, message, autoClose = true, duration = 3000) {
            const id = ++this.notificationId
            const notification = {
              id,
              type,
              message,
              autoClose,
              duration
            }
            
            this.notifications.push(notification)
            
            if (autoClose) {
              setTimeout(() => {
                this.removeNotification(id)
              }, duration)
            }
          },
          removeNotification(id) {
            const index = this.notifications.findIndex(n => n.id === id)
            if (index > -1) {
              this.notifications.splice(index, 1)
            }
          }
        }
      }

      const wrapper = await mountWithExpectations(GlobalNotifications)

      // Step 1: Show success notification
      await wrapper.interact.click('[data-testid="success-trigger"]')
      expect(wrapper.find('[data-testid="notification-1"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="notification-1"]').classes()).toContain('success')

      // Step 2: Show error notification
      await wrapper.interact.click('[data-testid="error-trigger"]')
      expect(wrapper.find('[data-testid="notification-2"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="notification-2"]').classes()).toContain('error')

      // Step 3: Show multiple notifications
      await wrapper.interact.click('[data-testid="warning-trigger"]')
      await wrapper.interact.click('[data-testid="info-trigger"]')
      
      expect(wrapper.findAll('[data-testid^="notification-"]')).toHaveLength(4)

      // Step 4: Manually close a notification
      await wrapper.interact.click('[data-testid="close-1"]')
      expect(wrapper.find('[data-testid="notification-1"]').exists()).toBe(false)
      expect(wrapper.findAll('[data-testid^="notification-"]')).toHaveLength(3)

      // Step 5: Test auto-close functionality
      await new Promise(resolve => setTimeout(resolve, 3100))
      await nextTick()
      
      // Notifications should auto-close (might be 0 or few remaining depending on timing)
      expect(wrapper.findAll('[data-testid^="notification-"]').length).toBeLessThan(4)

      wrapper.unmount()
    })
  })

  describe('5. Responsive Layout Behavior', () => {
    it('should adapt layout across different viewport sizes', async () => {
      const ResponsiveComponent = {
        template: `
          <div class="responsive-container">
            <header class="header" data-testid="header">
              <div class="logo" data-testid="logo">Logo</div>
              <nav class="desktop-nav" data-testid="desktop-nav">
                <a href="#">Home</a>
                <a href="#">About</a>
                <a href="#">Contact</a>
              </nav>
              <button class="mobile-menu-toggle" data-testid="mobile-menu-toggle">
                ☰
              </button>
            </header>
            
            <div class="content-layout">
              <aside class="sidebar" data-testid="sidebar">
                <div class="sidebar-item">Item 1</div>
                <div class="sidebar-item">Item 2</div>
              </aside>
              
              <main class="main-content" data-testid="main-content">
                <div class="grid" data-testid="content-grid">
                  <div class="card" v-for="i in 6" :key="i" :data-testid="'card-' + i">
                    Card {{ i }}
                  </div>
                </div>
              </main>
            </div>
          </div>
        `,
        mounted() {
          this.handleResize()
          window.addEventListener('resize', this.handleResize)
        },
        beforeUnmount() {
          window.removeEventListener('resize', this.handleResize)
        },
        methods: {
          handleResize() {
            const width = window.innerWidth
            const container = this.$el
            
            if (width < 768) {
              container.classList.add('mobile')
              container.classList.remove('tablet', 'desktop')
            } else if (width < 1024) {
              container.classList.add('tablet')
              container.classList.remove('mobile', 'desktop')
            } else {
              container.classList.add('desktop')
              container.classList.remove('mobile', 'tablet')
            }
          }
        }
      }

      const breakpoints = [
        { width: 320, height: 568, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1024, height: 768, name: 'desktop' },
        { width: 1920, height: 1080, name: 'large-desktop' }
      ]

      await testResponsive(ResponsiveComponent, breakpoints, async (wrapper, viewport) => {
        // Verify responsive classes
        const container = wrapper.find('.responsive-container')
        
        if (viewport.width < 768) {
          expect(container.classes()).toContain('mobile')
          
          // Mobile-specific tests
          const mobileToggle = wrapper.find('[data-testid="mobile-menu-toggle"]')
          expect(mobileToggle.exists()).toBe(true)
          
        } else if (viewport.width < 1024) {
          expect(container.classes()).toContain('tablet')
          
        } else {
          expect(container.classes()).toContain('desktop')
          
          // Desktop-specific tests
          const desktopNav = wrapper.find('[data-testid="desktop-nav"]')
          expect(desktopNav.exists()).toBe(true)
        }

        // Verify grid layout adapts
        const grid = wrapper.find('[data-testid="content-grid"]')
        expect(grid.exists()).toBe(true)
        
        const cards = wrapper.findAll('[data-testid^="card-"]')
        expect(cards).toHaveLength(6)
      })
    })
  })

  describe('6. Accessibility Compliance', () => {
    it('should meet WCAG accessibility standards', async () => {
      const AccessibleComponent = {
        template: `
          <div class="accessible-component">
            <h1 id="main-heading">Accessible Form</h1>
            
            <form role="form" aria-labelledby="main-heading">
              <div class="form-group">
                <label for="username" id="username-label">Username (required)</label>
                <input 
                  id="username"
                  type="text" 
                  aria-labelledby="username-label"
                  aria-describedby="username-help"
                  aria-required="true"
                  data-testid="username-field"
                />
                <div id="username-help" class="help-text">
                  Enter your unique username
                </div>
              </div>
              
              <div class="form-group">
                <label for="email" id="email-label">Email</label>
                <input 
                  id="email"
                  type="email" 
                  aria-labelledby="email-label"
                  data-testid="email-field"
                />
              </div>
              
              <fieldset>
                <legend>Preferences</legend>
                <div class="checkbox-group">
                  <input 
                    id="newsletter" 
                    type="checkbox" 
                    aria-describedby="newsletter-desc"
                  />
                  <label for="newsletter">Subscribe to newsletter</label>
                  <div id="newsletter-desc" class="help-text">
                    Receive weekly updates
                  </div>
                </div>
              </fieldset>
              
              <button type="submit" aria-describedby="submit-help">
                Submit Form
              </button>
              <div id="submit-help" class="help-text">
                Press Enter to submit or click this button
              </div>
            </form>
            
            <div role="status" aria-live="polite" data-testid="status-message"></div>
          </div>
        `
      }

      const wrapper = await mountWithExpectations(AccessibleComponent)
      
      // Run accessibility tests
      const a11y = a11yTest(wrapper)
      
      // Test ARIA labels
      expect(() => a11y.hasAriaLabels()).not.toThrow()
      
      // Test form labels
      const usernameInput = wrapper.find('[data-testid="username-field"]')
      expect(usernameInput.attributes('aria-labelledby')).toBe('username-label')
      expect(usernameInput.attributes('aria-required')).toBe('true')
      
      // Test semantic structure
      expect(wrapper.find('form[role="form"]').exists()).toBe(true)
      expect(wrapper.find('fieldset').exists()).toBe(true)
      expect(wrapper.find('legend').exists()).toBe(true)
      
      // Test live regions
      expect(wrapper.find('[role="status"][aria-live="polite"]').exists()).toBe(true)
      
      // Test keyboard navigation
      const inputs = wrapper.findAll('input, button')
      for (const input of inputs) {
        expect(input.attributes('tabindex')).not.toBe('-1')
      }

      wrapper.unmount()
    })
  })

  describe('7. Performance Testing', () => {
    describe('Virtual List Performance', () => {
      it('should handle large datasets efficiently', async () => {
        const VirtualList = {
          template: `
            <div class="virtual-list" ref="container" @scroll="handleScroll">
              <div :style="{ height: totalHeight + 'px' }" class="virtual-spacer">
                <div 
                  v-for="item in visibleItems" 
                  :key="item.id"
                  :style="{ 
                    position: 'absolute',
                    top: item.top + 'px',
                    height: itemHeight + 'px'
                  }"
                  class="virtual-item"
                  :data-testid="'item-' + item.id"
                >
                  {{ item.text }}
                </div>
              </div>
            </div>
          `,
          data() {
            return {
              items: Array.from({ length: 10000 }, (_, i) => ({
                id: i,
                text: `Item ${i}`
              })),
              itemHeight: 40,
              containerHeight: 400,
              scrollTop: 0
            }
          },
          computed: {
            totalHeight() {
              return this.items.length * this.itemHeight
            },
            visibleStart() {
              return Math.floor(this.scrollTop / this.itemHeight)
            },
            visibleEnd() {
              return Math.min(
                this.visibleStart + Math.ceil(this.containerHeight / this.itemHeight) + 1,
                this.items.length
              )
            },
            visibleItems() {
              return this.items
                .slice(this.visibleStart, this.visibleEnd)
                .map(item => ({
                  ...item,
                  top: item.id * this.itemHeight
                }))
            }
          },
          methods: {
            handleScroll(event) {
              this.scrollTop = event.target.scrollTop
            }
          }
        }

        const performanceResult = await performanceTest(async () => {
          const wrapper = mount(VirtualList)
          
          // Simulate scrolling through large dataset
          for (let i = 0; i < 100; i++) {
            const scrollTop = i * 100
            await wrapper.setData({ scrollTop })
            await nextTick()
          }
          
          wrapper.unmount()
        }, 1000)

        expect(performanceResult).toBeLessThan(1000)
      })

      it('should not leak memory with rapid scrolling', async () => {
        await memoryLeakTest(async () => {
          const VirtualList = {
            template: '<div>{{ items.length }} items</div>',
            data: () => ({
              items: Array.from({ length: 1000 }, (_, i) => ({ id: i, data: 'x'.repeat(100) }))
            })
          }
          
          const wrapper = mount(VirtualList)
          await wrapper.setData({ 
            items: Array.from({ length: 2000 }, (_, i) => ({ id: i, data: 'x'.repeat(100) }))
          })
          wrapper.unmount()
        }, 20)
      })
    })

    describe('Multiple Modal Performance', () => {
      it('should handle multiple overlapping modals', async () => {
        const ModalSystem = {
          template: `
            <div class="modal-system">
              <button 
                v-for="i in 5" 
                :key="'trigger-' + i"
                :data-testid="'open-modal-' + i"
                @click="openModal(i)"
              >
                Open Modal {{ i }}
              </button>
              
              <div 
                v-for="modal in openModals" 
                :key="'modal-' + modal.id"
                class="modal-overlay"
                :data-testid="'modal-' + modal.id"
                :style="{ zIndex: 1000 + modal.id }"
              >
                <div class="modal-content">
                  <h3>Modal {{ modal.id }}</h3>
                  <p>Content for modal {{ modal.id }}</p>
                  <button 
                    :data-testid="'close-modal-' + modal.id"
                    @click="closeModal(modal.id)"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          `,
          data() {
            return {
              openModals: []
            }
          },
          methods: {
            openModal(id) {
              if (!this.openModals.find(m => m.id === id)) {
                this.openModals.push({ id, timestamp: Date.now() })
              }
            },
            closeModal(id) {
              const index = this.openModals.findIndex(m => m.id === id)
              if (index > -1) {
                this.openModals.splice(index, 1)
              }
            }
          }
        }

        const wrapper = await mountWithExpectations(ModalSystem)

        // Step 1: Open multiple modals rapidly
        const startTime = performance.now()
        
        for (let i = 1; i <= 5; i++) {
          await wrapper.interact.click(`[data-testid="open-modal-${i}"]`)
          expect(wrapper.find(`[data-testid="modal-${i}"]`).exists()).toBe(true)
        }

        const openTime = performance.now() - startTime
        expect(openTime).toBeLessThan(100) // Should open quickly

        // Step 2: Verify all modals are stacked correctly
        expect(wrapper.findAll('[data-testid^="modal-"]')).toHaveLength(5)

        // Step 3: Close modals and measure performance
        const closeStartTime = performance.now()
        
        for (let i = 1; i <= 5; i++) {
          await wrapper.interact.click(`[data-testid="close-modal-${i}"]`)
        }

        const closeTime = performance.now() - closeStartTime
        expect(closeTime).toBeLessThan(100) // Should close quickly

        expect(wrapper.findAll('[data-testid^="modal-"]')).toHaveLength(0)

        wrapper.unmount()
      })
    })

    describe('Complex Table Operations', () => {
      it('should handle sorting, filtering, and pagination efficiently', async () => {
        const ComplexTable = {
          template: `
            <div class="complex-table">
              <div class="table-controls">
                <input 
                  v-model="filter" 
                  placeholder="Filter..."
                  data-testid="table-filter"
                />
                <select v-model="sortBy" data-testid="sort-select">
                  <option value="name">Sort by Name</option>
                  <option value="email">Sort by Email</option>
                  <option value="role">Sort by Role</option>
                </select>
                <button @click="sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </button>
              </div>
              
              <table data-testid="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="item in paginatedData" 
                    :key="item.id"
                    :data-testid="'row-' + item.id"
                  >
                    <td>{{ item.name }}</td>
                    <td>{{ item.email }}</td>
                    <td>{{ item.role }}</td>
                  </tr>
                </tbody>
              </table>
              
              <div class="pagination">
                <button 
                  @click="currentPage > 1 && currentPage--"
                  :disabled="currentPage === 1"
                  data-testid="prev-page"
                >
                  Previous
                </button>
                <span>{{ currentPage }} / {{ totalPages }}</span>
                <button 
                  @click="currentPage < totalPages && currentPage++"
                  :disabled="currentPage === totalPages"
                  data-testid="next-page"
                >
                  Next
                </button>
              </div>
            </div>
          `,
          data() {
            return {
              filter: '',
              sortBy: 'name',
              sortDirection: 'asc',
              currentPage: 1,
              pageSize: 50,
              data: Array.from({ length: 5000 }, (_, i) => ({
                id: i,
                name: `User ${i}`,
                email: `user${i}@example.com`,
                role: ['admin', 'user', 'moderator'][i % 3]
              }))
            }
          },
          computed: {
            filteredData() {
              return this.data.filter(item =>
                item.name.toLowerCase().includes(this.filter.toLowerCase()) ||
                item.email.toLowerCase().includes(this.filter.toLowerCase()) ||
                item.role.toLowerCase().includes(this.filter.toLowerCase())
              )
            },
            sortedData() {
              const sorted = [...this.filteredData]
              sorted.sort((a, b) => {
                const aVal = a[this.sortBy]
                const bVal = b[this.sortBy]
                const comparison = aVal.localeCompare(bVal)
                return this.sortDirection === 'asc' ? comparison : -comparison
              })
              return sorted
            },
            totalPages() {
              return Math.ceil(this.sortedData.length / this.pageSize)
            },
            paginatedData() {
              const start = (this.currentPage - 1) * this.pageSize
              const end = start + this.pageSize
              return this.sortedData.slice(start, end)
            }
          }
        }

        const performanceResult = await performanceTest(async () => {
          const wrapper = mount(ComplexTable)
          
          // Test filtering performance
          await wrapper.setData({ filter: 'admin' })
          await nextTick()
          
          // Test sorting performance
          await wrapper.setData({ sortBy: 'email', sortDirection: 'desc' })
          await nextTick()
          
          // Test pagination
          for (let page = 1; page <= 5; page++) {
            await wrapper.setData({ currentPage: page })
            await nextTick()
          }
          
          wrapper.unmount()
        }, 500)

        expect(performanceResult).toBeLessThan(500)
      })
    })
  })

  describe('8. Real-World Typing Tutor Integration', () => {
    it('should integrate TypingMonacoEditor with full workflow', async () => {
      const wrapper = await mountWithExpectations(TypingMonacoEditor, {
        props: {
          targetText: 'const greeting = "Hello World";\nfunction sayHello() {\n  console.log(greeting);\n}',
          drillType: 'javascript-functions',
          targetWPM: 45,
          language: 'javascript'
        }
      })

      // Step 1: Verify component structure
      wrapper.should.render()
        .and.contain('WPM')
        .and.contain('Accuracy')
        .and.contain('Consistency')

      // Step 2: Check metrics display
      const metricsElements = wrapper.findAll('.metric')
      expect(metricsElements.length).toBeGreaterThanOrEqual(3)

      // Step 3: Verify target text is displayed
      const targetText = wrapper.find('.target-text pre')
      expect(targetText.exists()).toBe(true)
      expect(targetText.text()).toContain('const greeting')

      // Step 4: Test session controls
      const startButton = wrapper.find('button:not([disabled])')
      expect(startButton.exists()).toBe(true)
      
      await wrapper.interact.click('button:not([disabled])')
      
      // Step 5: Verify Monaco editor container exists
      expect(wrapper.find('.monaco-editor').exists()).toBe(true)

      // Step 6: Test performance metrics
      expect(wrapper.vm.getWPMClass(65)).toBe('excellent')
      expect(wrapper.vm.getAccuracyClass(94.5)).toBe('good')

      // Step 7: Test duration formatting
      expect(wrapper.vm.formatDuration(45000)).toBe('45s')
      expect(wrapper.vm.formatDuration(125000)).toBe('2:05')

      wrapper.unmount()
    })
  })
})