import { faker } from '@faker-js/faker'

/**
 * State factory for Pinia store and application state testing
 * Generates realistic state data for various store modules
 */
export class StateFactory {
  /**
   * Base state data generator
   * @param {Object} overrides - Properties to override
   * @returns {Object} State data object
   */
  static create(overrides = {}) {
    return {
      id: faker.string.uuid(),
      version: faker.system.semver(),
      timestamp: faker.date.recent(),
      environment: faker.helpers.arrayElement(['development', 'staging', 'production']),
      ...overrides
    }
  }

  /**
   * Create user store state
   * @param {Object} overrides - Properties to override
   * @returns {Object} User store state
   */
  static createUserState(overrides = {}) {
    return this.create({
      user: {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        username: faker.internet.userName(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        avatar: faker.image.avatar(),
        role: faker.helpers.arrayElement(['user', 'admin', 'moderator']),
        isAuthenticated: faker.datatype.boolean(0.7),
        isVerified: faker.datatype.boolean(0.8),
        permissions: faker.helpers.arrayElements([
          'read', 'write', 'delete', 'admin', 'moderate'
        ], { min: 1, max: 5 }),
        preferences: {
          theme: faker.helpers.arrayElement(['light', 'dark', 'auto']),
          language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de']),
          timezone: faker.location.timeZone(),
          notifications: {
            email: faker.datatype.boolean(0.8),
            push: faker.datatype.boolean(0.6),
            browser: faker.datatype.boolean(0.5)
          }
        },
        profile: {
          bio: faker.person.bio(),
          website: faker.internet.url(),
          location: faker.location.city(),
          birthday: faker.date.birthdate().toISOString().split('T')[0],
          occupation: faker.person.jobTitle(),
          company: faker.company.name()
        }
      },
      session: {
        token: faker.string.alphanumeric(64),
        refreshToken: faker.string.alphanumeric(64),
        expiresAt: faker.date.future(),
        createdAt: faker.date.past(),
        lastActivity: faker.date.recent(),
        deviceInfo: {
          userAgent: faker.internet.userAgent(),
          ip: faker.internet.ip(),
          platform: faker.helpers.arrayElement(['web', 'mobile', 'tablet']),
          browser: faker.helpers.arrayElement(['Chrome', 'Firefox', 'Safari', 'Edge'])
        }
      },
      loading: {
        login: false,
        logout: false,
        updateProfile: false,
        changePassword: false
      },
      errors: {
        login: null,
        registration: null,
        profileUpdate: null,
        passwordChange: null
      },
      ...overrides
    })
  }

  /**
   * Create auth store state
   * @param {Object} overrides - Properties to override
   * @returns {Object} Auth store state
   */
  static createAuthState(overrides = {}) {
    const isAuthenticated = faker.datatype.boolean(0.7)
    
    return this.create({
      isAuthenticated,
      accessToken: isAuthenticated ? faker.string.alphanumeric(64) : null,
      refreshToken: isAuthenticated ? faker.string.alphanumeric(64) : null,
      tokenExpiry: isAuthenticated ? faker.date.future() : null,
      user: isAuthenticated ? {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        roles: faker.helpers.arrayElements(['user', 'admin', 'moderator'], { min: 1, max: 2 })
      } : null,
      permissions: isAuthenticated ? faker.helpers.arrayElements([
        'read:profile', 'write:profile', 'delete:account', 'admin:users'
      ], { min: 2, max: 4 }) : [],
      lastAuthAction: faker.helpers.arrayElement(['login', 'logout', 'refresh', 'register']),
      authAttempts: {
        count: faker.number.int({ min: 0, max: 3 }),
        lastAttempt: faker.date.recent()
      },
      twoFactorEnabled: faker.datatype.boolean(0.3),
      securitySettings: {
        sessionTimeout: faker.number.int({ min: 15, max: 480 }), // minutes
        requireStrongPassword: faker.datatype.boolean(0.8),
        enableSecurityNotifications: faker.datatype.boolean(0.9)
      },
      ...overrides
    })
  }

  /**
   * Create app state (global application state)
   * @param {Object} overrides - Properties to override
   * @returns {Object} App store state
   */
  static createAppState(overrides = {}) {
    return this.create({
      config: {
        appName: faker.company.name(),
        version: faker.system.semver(),
        environment: faker.helpers.arrayElement(['development', 'staging', 'production']),
        apiUrl: faker.internet.url(),
        websocketUrl: faker.internet.url().replace('http', 'ws'),
        features: {
          darkMode: faker.datatype.boolean(0.9),
          notifications: faker.datatype.boolean(0.9),
          analytics: faker.datatype.boolean(0.8),
          chatSupport: faker.datatype.boolean(0.6),
          betaFeatures: faker.datatype.boolean(0.2)
        }
      },
      ui: {
        theme: faker.helpers.arrayElement(['light', 'dark', 'auto']),
        sidebarCollapsed: faker.datatype.boolean(0.3),
        loading: faker.datatype.boolean(0.1),
        online: faker.datatype.boolean(0.95),
        viewport: {
          width: faker.number.int({ min: 320, max: 2560 }),
          height: faker.number.int({ min: 568, max: 1440 }),
          isMobile: faker.datatype.boolean(0.4),
          isTablet: faker.datatype.boolean(0.2)
        },
        modals: {
          open: [],
          stack: []
        },
        notifications: {
          items: Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, () => ({
            id: faker.string.uuid(),
            type: faker.helpers.arrayElement(['info', 'success', 'warning', 'error']),
            title: faker.lorem.sentence({ min: 3, max: 6 }),
            message: faker.lorem.sentence(),
            timestamp: faker.date.recent(),
            read: faker.datatype.boolean(0.6),
            persistent: faker.datatype.boolean(0.2)
          })),
          unreadCount: faker.number.int({ min: 0, max: 10 })
        }
      },
      navigation: {
        currentRoute: faker.helpers.arrayElement([
          '/dashboard', '/profile', '/settings', '/users', '/reports'
        ]),
        previousRoute: faker.helpers.arrayElement([
          '/home', '/dashboard', '/profile'
        ]),
        breadcrumbs: [
          { name: 'Home', path: '/' },
          { name: 'Dashboard', path: '/dashboard' },
          { name: faker.lorem.word(), path: faker.internet.url() }
        ],
        menuItems: [
          { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', active: true },
          { id: 'users', label: 'Users', icon: 'users', active: false },
          { id: 'settings', label: 'Settings', icon: 'settings', active: false }
        ]
      },
      system: {
        initialized: faker.datatype.boolean(0.9),
        lastSync: faker.date.recent(),
        networkStatus: faker.helpers.arrayElement(['online', 'offline', 'slow']),
        performance: {
          loadTime: faker.number.int({ min: 100, max: 5000 }),
          memoryUsage: faker.number.int({ min: 10, max: 100 }),
          bundleSize: faker.number.int({ min: 500, max: 2000 })
        },
        errors: {
          global: [],
          network: [],
          runtime: []
        }
      },
      ...overrides
    })
  }

  /**
   * Create content store state
   * @param {Object} overrides - Properties to override
   * @returns {Object} Content store state
   */
  static createContentState(overrides = {}) {
    const items = Array.from({ length: faker.number.int({ min: 5, max: 20 }) }, () => ({
      id: faker.string.uuid(),
      title: faker.lorem.sentence(),
      slug: faker.lorem.slug(),
      status: faker.helpers.arrayElement(['draft', 'published', 'archived']),
      author: faker.person.fullName(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      tags: faker.helpers.arrayElements(['javascript', 'vue', 'nuxt'], { min: 1, max: 3 }),
      featured: faker.datatype.boolean(0.2)
    }))

    return this.create({
      items,
      currentItem: faker.helpers.arrayElement(items),
      filters: {
        status: faker.helpers.arrayElement(['all', 'published', 'draft']),
        author: faker.datatype.boolean(0.3) ? faker.person.fullName() : null,
        tags: faker.helpers.arrayElements(['javascript', 'vue', 'nuxt'], { min: 0, max: 2 }),
        search: faker.datatype.boolean(0.2) ? faker.lorem.words({ min: 1, max: 3 }) : ''
      },
      pagination: {
        page: faker.number.int({ min: 1, max: 10 }),
        perPage: faker.helpers.arrayElement([10, 25, 50]),
        total: faker.number.int({ min: 100, max: 1000 }),
        totalPages: faker.number.int({ min: 10, max: 40 })
      },
      sorting: {
        field: faker.helpers.arrayElement(['title', 'createdAt', 'updatedAt', 'author']),
        direction: faker.helpers.arrayElement(['asc', 'desc'])
      },
      loading: {
        fetch: false,
        create: false,
        update: false,
        delete: false
      },
      cache: {
        lastFetch: faker.date.recent(),
        invalidated: faker.datatype.boolean(0.1)
      },
      ...overrides
    })
  }

  /**
   * Create settings store state
   * @param {Object} overrides - Properties to override
   * @returns {Object} Settings store state
   */
  static createSettingsState(overrides = {}) {
    return this.create({
      general: {
        siteName: faker.company.name(),
        siteDescription: faker.company.catchPhrase(),
        siteUrl: faker.internet.url(),
        timezone: faker.location.timeZone(),
        language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de']),
        dateFormat: faker.helpers.arrayElement(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
        timeFormat: faker.helpers.arrayElement(['12', '24'])
      },
      appearance: {
        theme: faker.helpers.arrayElement(['light', 'dark', 'auto']),
        primaryColor: faker.internet.color(),
        secondaryColor: faker.internet.color(),
        fontFamily: faker.helpers.arrayElement(['Inter', 'Roboto', 'Arial', 'Helvetica']),
        fontSize: faker.helpers.arrayElement(['small', 'medium', 'large']),
        compactMode: faker.datatype.boolean(0.3)
      },
      notifications: {
        email: {
          enabled: faker.datatype.boolean(0.8),
          frequency: faker.helpers.arrayElement(['immediate', 'hourly', 'daily', 'weekly']),
          types: faker.helpers.arrayElements([
            'mentions', 'comments', 'likes', 'follows', 'updates'
          ], { min: 2, max: 5 })
        },
        push: {
          enabled: faker.datatype.boolean(0.6),
          frequency: faker.helpers.arrayElement(['immediate', 'batched']),
          types: faker.helpers.arrayElements([
            'messages', 'updates', 'reminders'
          ], { min: 1, max: 3 })
        },
        browser: {
          enabled: faker.datatype.boolean(0.5),
          sound: faker.datatype.boolean(0.7),
          desktop: faker.datatype.boolean(0.8)
        }
      },
      privacy: {
        profileVisibility: faker.helpers.arrayElement(['public', 'friends', 'private']),
        showEmail: faker.datatype.boolean(0.2),
        showPhone: faker.datatype.boolean(0.1),
        allowIndexing: faker.datatype.boolean(0.8),
        analytics: faker.datatype.boolean(0.9),
        cookies: {
          necessary: true,
          analytics: faker.datatype.boolean(0.7),
          marketing: faker.datatype.boolean(0.3),
          preferences: faker.datatype.boolean(0.8)
        }
      },
      security: {
        twoFactorEnabled: faker.datatype.boolean(0.3),
        passwordExpiry: faker.number.int({ min: 30, max: 365 }),
        sessionTimeout: faker.number.int({ min: 15, max: 480 }),
        ipWhitelist: faker.datatype.boolean(0.1),
        loginNotifications: faker.datatype.boolean(0.8)
      },
      integrations: {
        google: {
          enabled: faker.datatype.boolean(0.4),
          connected: faker.datatype.boolean(0.3),
          permissions: faker.helpers.arrayElements(['profile', 'email'], { min: 1, max: 2 })
        },
        github: {
          enabled: faker.datatype.boolean(0.6),
          connected: faker.datatype.boolean(0.4),
          permissions: faker.helpers.arrayElements(['read', 'write'], { min: 1, max: 2 })
        },
        slack: {
          enabled: faker.datatype.boolean(0.2),
          connected: faker.datatype.boolean(0.1),
          webhook: faker.datatype.boolean(0.1) ? faker.internet.url() : null
        }
      },
      ...overrides
    })
  }

  /**
   * Create shopping cart store state
   * @param {Object} overrides - Properties to override
   * @returns {Object} Shopping cart state
   */
  static createCartState(overrides = {}) {
    const items = Array.from({ length: faker.number.int({ min: 0, max: 8 }) }, () => ({
      id: faker.string.uuid(),
      productId: faker.string.uuid(),
      name: faker.commerce.productName(),
      price: parseFloat(faker.commerce.price()),
      quantity: faker.number.int({ min: 1, max: 5 }),
      image: faker.image.url({ width: 200, height: 200 }),
      variant: {
        size: faker.helpers.arrayElement(['S', 'M', 'L', 'XL']),
        color: faker.color.human()
      },
      addedAt: faker.date.recent()
    }))

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const tax = subtotal * 0.08
    const shipping = subtotal > 50 ? 0 : 9.99

    return this.create({
      items,
      totals: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        shipping: parseFloat(shipping.toFixed(2)),
        total: parseFloat((subtotal + tax + shipping).toFixed(2))
      },
      coupon: faker.datatype.boolean(0.2) ? {
        code: faker.string.alphanumeric(8).toUpperCase(),
        discount: faker.number.int({ min: 5, max: 25 }),
        type: faker.helpers.arrayElement(['percentage', 'fixed'])
      } : null,
      shipping: {
        address: faker.datatype.boolean(0.7) ? {
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: faker.location.country()
        } : null,
        method: faker.helpers.arrayElement(['standard', 'express', 'overnight']),
        estimatedDays: faker.number.int({ min: 1, max: 7 })
      },
      payment: {
        method: faker.helpers.arrayElement(['credit-card', 'paypal', 'apple-pay']),
        saved: faker.datatype.boolean(0.5)
      },
      checkout: {
        step: faker.helpers.arrayElement(['cart', 'shipping', 'payment', 'review']),
        processing: false,
        completed: false
      },
      ...overrides
    })
  }

  /**
   * Create notification store state
   * @param {Object} overrides - Properties to override
   * @returns {Object} Notification store state
   */
  static createNotificationState(overrides = {}) {
    const notifications = Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
      id: faker.string.uuid(),
      type: faker.helpers.arrayElement(['info', 'success', 'warning', 'error']),
      title: faker.lorem.sentence({ min: 3, max: 8 }),
      message: faker.lorem.paragraph(),
      timestamp: faker.date.recent(),
      read: faker.datatype.boolean(0.4),
      persistent: faker.datatype.boolean(0.2),
      actions: faker.datatype.boolean(0.3) ? [
        { label: 'View', action: 'view' },
        { label: 'Dismiss', action: 'dismiss' }
      ] : [],
      category: faker.helpers.arrayElement(['system', 'user', 'content', 'security']),
      priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent'])
    }))

    return this.create({
      items: notifications,
      unreadCount: notifications.filter(n => !n.read).length,
      settings: {
        enabled: faker.datatype.boolean(0.9),
        sound: faker.datatype.boolean(0.6),
        desktop: faker.datatype.boolean(0.7),
        autoHide: faker.datatype.boolean(0.8),
        hideAfter: faker.number.int({ min: 3, max: 10 }) // seconds
      },
      filters: {
        type: faker.helpers.arrayElement(['all', 'info', 'success', 'warning', 'error']),
        read: faker.helpers.arrayElement(['all', 'unread', 'read']),
        category: faker.helpers.arrayElement(['all', 'system', 'user', 'content'])
      },
      ...overrides
    })
  }

  /**
   * Create form store state for dynamic forms
   * @param {Object} overrides - Properties to override
   * @returns {Object} Form store state
   */
  static createFormState(overrides = {}) {
    return this.create({
      currentForm: {
        id: faker.string.uuid(),
        name: faker.lorem.words({ min: 2, max: 4 }),
        fields: {},
        values: {},
        errors: {},
        touched: {},
        dirty: faker.datatype.boolean(0.3),
        valid: faker.datatype.boolean(0.8),
        submitting: false,
        submitted: faker.datatype.boolean(0.2)
      },
      schemas: {
        user: {
          fields: ['name', 'email', 'password'],
          validation: {
            name: { required: true, minLength: 2 },
            email: { required: true, format: 'email' },
            password: { required: true, minLength: 8 }
          }
        },
        contact: {
          fields: ['name', 'email', 'message'],
          validation: {
            name: { required: true },
            email: { required: true, format: 'email' },
            message: { required: true, minLength: 10 }
          }
        }
      },
      submissions: Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, () => ({
        id: faker.string.uuid(),
        formId: faker.string.uuid(),
        data: {},
        submittedAt: faker.date.recent(),
        status: faker.helpers.arrayElement(['pending', 'processed', 'failed'])
      })),
      ...overrides
    })
  }

  /**
   * Create WebSocket store state
   * @param {Object} overrides - Properties to override
   * @returns {Object} WebSocket store state
   */
  static createWebSocketState(overrides = {}) {
    return this.create({
      connection: {
        status: faker.helpers.arrayElement(['connecting', 'connected', 'disconnected', 'error']),
        url: faker.internet.url().replace('http', 'ws'),
        lastConnected: faker.date.recent(),
        reconnectAttempts: faker.number.int({ min: 0, max: 5 }),
        maxReconnectAttempts: 5
      },
      messages: {
        sent: faker.number.int({ min: 0, max: 100 }),
        received: faker.number.int({ min: 0, max: 150 }),
        queue: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
          id: faker.string.uuid(),
          type: faker.helpers.arrayElement(['message', 'notification', 'update']),
          data: { content: faker.lorem.sentence() },
          timestamp: faker.date.recent()
        }))
      },
      subscriptions: faker.helpers.arrayElements([
        'user-updates', 'notifications', 'chat-messages', 'system-status'
      ], { min: 1, max: 4 }),
      ...overrides
    })
  }

  /**
   * Create bulk states for testing multiple store instances
   * @param {number} count - Number of states to create
   * @param {Function} factory - Factory method to use
   * @param {Object} overrides - Base properties to override
   * @returns {Array} Array of state objects
   */
  static createBulk(count = 10, factory = this.create, overrides = {}) {
    return Array.from({ length: count }, () => factory.call(this, overrides))
  }

  /**
   * Create state with loading scenarios
   * @param {string} scenario - Loading scenario name
   * @returns {Object} State with loading configuration
   */
  static createLoadingScenario(scenario) {
    const scenarios = {
      'initial-load': () => this.createAppState({
        ui: { loading: true },
        user: null,
        content: { items: [] }
      }),
      'form-submit': () => this.createFormState({
        currentForm: { submitting: true, submitted: false }
      }),
      'data-fetch': () => this.createContentState({
        loading: { fetch: true },
        items: []
      }),
      'auth-process': () => this.createAuthState({
        isAuthenticated: false,
        loading: { login: true }
      })
    }

    return scenarios[scenario] ? scenarios[scenario]() : this.create()
  }

  /**
   * Create state with error scenarios
   * @param {string} scenario - Error scenario name
   * @returns {Object} State with error configuration
   */
  static createErrorScenario(scenario) {
    const scenarios = {
      'network-error': () => this.createAppState({
        system: {
          networkStatus: 'offline',
          errors: {
            network: [{ message: 'Network connection failed', timestamp: faker.date.recent() }]
          }
        }
      }),
      'auth-error': () => this.createAuthState({
        isAuthenticated: false,
        errors: { login: 'Invalid credentials' }
      }),
      'validation-error': () => this.createFormState({
        currentForm: {
          errors: {
            email: 'Invalid email format',
            password: 'Password too weak'
          },
          valid: false
        }
      })
    }

    return scenarios[scenario] ? scenarios[scenario]() : this.create()
  }

  /**
   * Reset faker seed for consistent test data
   * @param {number} seed - Seed value
   */
  static setSeed(seed = 42) {
    faker.seed(seed)
  }
}

/**
 * State transition factory for testing state changes
 */
export class StateTransitionFactory {
  /**
   * Create state transition data
   * @param {Object} from - Previous state
   * @param {Object} to - New state
   * @param {string} action - Action that caused the transition
   * @returns {Object} Transition data
   */
  static create(from, to, action) {
    return {
      id: faker.string.uuid(),
      action,
      timestamp: faker.date.recent(),
      from: JSON.stringify(from),
      to: JSON.stringify(to),
      diff: this.calculateStateDiff(from, to),
      metadata: {
        userId: faker.string.uuid(),
        sessionId: faker.string.uuid(),
        duration: faker.number.int({ min: 1, max: 1000 }) // ms
      }
    }
  }

  /**
   * Calculate difference between states
   * @param {Object} from - Previous state
   * @param {Object} to - New state
   * @returns {Object} State difference
   */
  static calculateStateDiff(from, to) {
    // Simplified diff calculation for testing
    return {
      added: Object.keys(to).filter(key => !(key in from)),
      removed: Object.keys(from).filter(key => !(key in to)),
      modified: Object.keys(from).filter(key => 
        key in to && JSON.stringify(from[key]) !== JSON.stringify(to[key])
      )
    }
  }
}

export default StateFactory