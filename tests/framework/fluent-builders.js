/**
 * Fluent test builders for common testing scenarios
 * Provides chainable API for building complex test setups
 */

import { mountWithExpectations } from './core-utils.js'
import { vi } from 'vitest'

/**
 * Fluent builder for component tests
 */
export class ComponentTestBuilder {
  constructor(component) {
    this.component = component
    this.props = {}
    this.slots = {}
    this.stubs = {}
    this.mocks = {}
    this.plugins = []
    this.provide = {}
    this.route = {}
    this.router = {}
    this.expectations = []
    this.interactions = []
    this.cleanup = []
  }

  /**
   * Set component props
   * @param {Object} props - Props to set
   * @returns {ComponentTestBuilder} Builder instance
   */
  withProps(props) {
    this.props = { ...this.props, ...props }
    return this
  }

  /**
   * Set component slots
   * @param {Object} slots - Slots to set
   * @returns {ComponentTestBuilder} Builder instance
   */
  withSlots(slots) {
    this.slots = { ...this.slots, ...slots }
    return this
  }

  /**
   * Add component stubs
   * @param {Object} stubs - Components to stub
   * @returns {ComponentTestBuilder} Builder instance
   */
  stubbing(stubs) {
    this.stubs = { ...this.stubs, ...stubs }
    return this
  }

  /**
   * Add mocks for global properties
   * @param {Object} mocks - Global mocks
   * @returns {ComponentTestBuilder} Builder instance
   */
  mocking(mocks) {
    this.mocks = { ...this.mocks, ...mocks }
    return this
  }

  /**
   * Add plugins
   * @param {Array|Function} plugins - Vue plugins
   * @returns {ComponentTestBuilder} Builder instance
   */
  withPlugins(plugins) {
    const pluginList = Array.isArray(plugins) ? plugins : [plugins]
    this.plugins.push(...pluginList)
    return this
  }

  /**
   * Provide dependencies via provide/inject
   * @param {Object} provide - Dependencies to provide
   * @returns {ComponentTestBuilder} Builder instance
   */
  providing(provide) {
    this.provide = { ...this.provide, ...provide }
    return this
  }

  /**
   * Mock route object
   * @param {Object} route - Route mock
   * @returns {ComponentTestBuilder} Builder instance
   */
  withRoute(route) {
    this.route = { ...this.route, ...route }
    return this
  }

  /**
   * Mock router object
   * @param {Object} router - Router mock
   * @returns {ComponentTestBuilder} Builder instance
   */
  withRouter(router) {
    this.router = { ...this.router, ...router }
    return this
  }

  /**
   * Add expectation to run after mount
   * @param {Function} expectation - Expectation function
   * @returns {ComponentTestBuilder} Builder instance
   */
  shouldExpect(expectation) {
    this.expectations.push(expectation)
    return this
  }

  /**
   * Add interaction to perform after mount
   * @param {Function} interaction - Interaction function
   * @returns {ComponentTestBuilder} Builder instance
   */
  shouldInteract(interaction) {
    this.interactions.push(interaction)
    return this
  }

  /**
   * Add cleanup function
   * @param {Function} cleanup - Cleanup function
   * @returns {ComponentTestBuilder} Builder instance
   */
  onCleanup(cleanup) {
    this.cleanup.push(cleanup)
    return this
  }

  /**
   * Execute the test
   * @param {Function} testFn - Test function to run
   * @returns {Promise<void>}
   */
  async test(testFn) {
    const wrapper = await mountWithExpectations(this.component, {
      props: this.props,
      slots: this.slots,
      global: {
        stubs: this.stubs,
        mocks: {
          ...this.mocks,
          $route: this.route,
          $router: this.router
        },
        plugins: this.plugins,
        provide: this.provide
      }
    })

    try {
      // Run pre-configured expectations
      for (const expectation of this.expectations) {
        await expectation(wrapper)
      }

      // Run pre-configured interactions
      for (const interaction of this.interactions) {
        await interaction(wrapper)
      }

      // Run the main test function
      if (testFn) {
        await testFn(wrapper)
      }
    } finally {
      // Run cleanup functions
      for (const cleanup of this.cleanup) {
        await cleanup(wrapper)
      }
      
      wrapper.unmount()
    }
  }
}

/**
 * Fluent builder for API tests
 */
export class ApiTestBuilder {
  constructor(endpoint) {
    this.endpoint = endpoint
    this.method = 'GET'
    this.headers = {}
    this.body = null
    this.params = {}
    this.query = {}
    this.auth = null
    this.mocks = new Map()
    this.expectations = []
    this.setup = []
    this.teardown = []
  }

  /**
   * Set HTTP method
   * @param {string} method - HTTP method
   * @returns {ApiTestBuilder} Builder instance
   */
  usingMethod(method) {
    this.method = method.toUpperCase()
    return this
  }

  /**
   * Set request headers
   * @param {Object} headers - Headers to set
   * @returns {ApiTestBuilder} Builder instance
   */
  withHeaders(headers) {
    this.headers = { ...this.headers, ...headers }
    return this
  }

  /**
   * Set request body
   * @param {*} body - Request body
   * @returns {ApiTestBuilder} Builder instance
   */
  withBody(body) {
    this.body = body
    return this
  }

  /**
   * Set URL parameters
   * @param {Object} params - URL parameters
   * @returns {ApiTestBuilder} Builder instance
   */
  withParams(params) {
    this.params = { ...this.params, ...params }
    return this
  }

  /**
   * Set query parameters
   * @param {Object} query - Query parameters
   * @returns {ApiTestBuilder} Builder instance
   */
  withQuery(query) {
    this.query = { ...this.query, ...query }
    return this
  }

  /**
   * Set authentication
   * @param {string|Object} auth - Authentication data
   * @returns {ApiTestBuilder} Builder instance
   */
  withAuth(auth) {
    this.auth = auth
    return this
  }

  /**
   * Mock external dependencies
   * @param {string} name - Mock name
   * @param {*} mock - Mock implementation
   * @returns {ApiTestBuilder} Builder instance
   */
  mockingService(name, mock) {
    this.mocks.set(name, mock)
    return this
  }

  /**
   * Add setup function
   * @param {Function} setup - Setup function
   * @returns {ApiTestBuilder} Builder instance
   */
  withSetup(setup) {
    this.setup.push(setup)
    return this
  }

  /**
   * Add teardown function
   * @param {Function} teardown - Teardown function
   * @returns {ApiTestBuilder} Builder instance
   */
  withTeardown(teardown) {
    this.teardown.push(teardown)
    return this
  }

  /**
   * Add response expectation
   * @param {Function} expectation - Expectation function
   * @returns {ApiTestBuilder} Builder instance
   */
  expectingResponse(expectation) {
    this.expectations.push(expectation)
    return this
  }

  /**
   * Execute the API test
   * @param {Function} testFn - Optional additional test function
   * @returns {Promise<void>}
   */
  async test(testFn) {
    try {
      // Run setup functions
      for (const setup of this.setup) {
        await setup()
      }

      // Apply mocks
      const mockCleanup = []
      for (const [name, mock] of this.mocks) {
        const spy = vi.fn().mockImplementation(mock)
        vi.mock(name, () => ({ default: spy }))
        mockCleanup.push(() => vi.unmock(name))
      }

      // Build request URL
      let url = this.endpoint
      Object.entries(this.params).forEach(([key, value]) => {
        url = url.replace(`:${key}`, value)
      })

      const queryString = new URLSearchParams(this.query).toString()
      if (queryString) {
        url += `?${queryString}`
      }

      // Make request
      const response = await fetch(url, {
        method: this.method,
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
          ...(this.auth && { Authorization: `Bearer ${this.auth}` })
        },
        body: this.body ? JSON.stringify(this.body) : undefined
      })

      // Run expectations
      for (const expectation of this.expectations) {
        await expectation(response)
      }

      // Run additional test function
      if (testFn) {
        await testFn(response)
      }

      // Cleanup mocks
      mockCleanup.forEach(cleanup => cleanup())

    } finally {
      // Run teardown functions
      for (const teardown of this.teardown) {
        await teardown()
      }
    }
  }
}

/**
 * Fluent builder for database tests
 */
export class DatabaseTestBuilder {
  constructor(connection) {
    this.connection = connection
    this.fixtures = []
    this.migrations = []
    this.seeds = []
    this.expectations = []
    this.cleanup = []
  }

  /**
   * Load test fixtures
   * @param {Array|Object} fixtures - Fixtures to load
   * @returns {DatabaseTestBuilder} Builder instance
   */
  withFixtures(fixtures) {
    const fixtureList = Array.isArray(fixtures) ? fixtures : [fixtures]
    this.fixtures.push(...fixtureList)
    return this
  }

  /**
   * Run migrations
   * @param {Array|string} migrations - Migrations to run
   * @returns {DatabaseTestBuilder} Builder instance
   */
  runningMigrations(migrations) {
    const migrationList = Array.isArray(migrations) ? migrations : [migrations]
    this.migrations.push(...migrationList)
    return this
  }

  /**
   * Load seeds
   * @param {Array|string} seeds - Seeds to load
   * @returns {DatabaseTestBuilder} Builder instance
   */
  withSeeds(seeds) {
    const seedList = Array.isArray(seeds) ? seeds : [seeds]
    this.seeds.push(...seedList)
    return this
  }

  /**
   * Add database expectation
   * @param {Function} expectation - Database expectation
   * @returns {DatabaseTestBuilder} Builder instance
   */
  expectingData(expectation) {
    this.expectations.push(expectation)
    return this
  }

  /**
   * Add cleanup function
   * @param {Function} cleanup - Cleanup function
   * @returns {DatabaseTestBuilder} Builder instance
   */
  onCleanup(cleanup) {
    this.cleanup.push(cleanup)
    return this
  }

  /**
   * Execute the database test
   * @param {Function} testFn - Test function
   * @returns {Promise<void>}
   */
  async test(testFn) {
    try {
      // Run migrations
      for (const migration of this.migrations) {
        await this.connection.migrate.latest(migration)
      }

      // Load seeds
      for (const seed of this.seeds) {
        await this.connection.seed.run(seed)
      }

      // Load fixtures
      for (const fixture of this.fixtures) {
        if (typeof fixture === 'function') {
          await fixture(this.connection)
        } else {
          for (const [table, data] of Object.entries(fixture)) {
            await this.connection(table).insert(data)
          }
        }
      }

      // Run the test function
      if (testFn) {
        await testFn(this.connection)
      }

      // Run expectations
      for (const expectation of this.expectations) {
        await expectation(this.connection)
      }

    } finally {
      // Run cleanup
      for (const cleanup of this.cleanup) {
        await cleanup(this.connection)
      }

      // Rollback migrations
      await this.connection.migrate.rollback()
    }
  }
}

/**
 * Factory functions for creating builders
 */

/**
 * Create component test builder
 * @param {Object} component - Vue component to test
 * @returns {ComponentTestBuilder} Builder instance
 */
export function testComponent(component) {
  return new ComponentTestBuilder(component)
}

/**
 * Create API test builder
 * @param {string} endpoint - API endpoint to test
 * @returns {ApiTestBuilder} Builder instance
 */
export function testApi(endpoint) {
  return new ApiTestBuilder(endpoint)
}

/**
 * Create database test builder
 * @param {Object} connection - Database connection
 * @returns {DatabaseTestBuilder} Builder instance
 */
export function testDatabase(connection) {
  return new DatabaseTestBuilder(connection)
}

/**
 * Scenario builder for BDD-style tests
 */
export class ScenarioBuilder {
  constructor(description) {
    this.description = description
    this.given = []
    this.when = []
    this.then = []
    this.context = {}
  }

  /**
   * Add given condition
   * @param {string} condition - Condition description
   * @param {Function} setup - Setup function
   * @returns {ScenarioBuilder} Builder instance
   */
  givenThat(condition, setup) {
    this.given.push({ condition, setup })
    return this
  }

  /**
   * Add when action
   * @param {string} action - Action description
   * @param {Function} execution - Action function
   * @returns {ScenarioBuilder} Builder instance
   */
  whenI(action, execution) {
    this.when.push({ action, execution })
    return this
  }

  /**
   * Add then expectation
   * @param {string} expectation - Expectation description
   * @param {Function} assertion - Assertion function
   * @returns {ScenarioBuilder} Builder instance
   */
  thenI(expectation, assertion) {
    this.then.push({ expectation, assertion })
    return this
  }

  /**
   * Execute the scenario
   * @returns {Promise<void>}
   */
  async execute() {
    console.log(`📋 Scenario: ${this.description}`)

    // Execute given conditions
    for (const { condition, setup } of this.given) {
      console.log(`  📝 Given: ${condition}`)
      this.context = await setup(this.context) || this.context
    }

    // Execute when actions
    for (const { action, execution } of this.when) {
      console.log(`  🎬 When: ${action}`)
      this.context = await execution(this.context) || this.context
    }

    // Execute then assertions
    for (const { expectation, assertion } of this.then) {
      console.log(`  ✅ Then: ${expectation}`)
      await assertion(this.context)
    }

    console.log(`  🎉 Scenario completed successfully`)
  }
}

/**
 * Create scenario builder
 * @param {string} description - Scenario description
 * @returns {ScenarioBuilder} Builder instance
 */
export function scenario(description) {
  return new ScenarioBuilder(description)
}