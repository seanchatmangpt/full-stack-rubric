/**
 * BDD + Nuxt 4 Testing Micro-Framework
 * Core API with fluent interfaces for 80% boilerplate reduction
 */

// Mock Nuxt test utils for framework validation
const mockNuxtSetup = {
  async setupNuxt() {
    return {
      router: {
        push: () => Promise.resolve(),
        replace: () => Promise.resolve(),
        go: () => {},
        back: () => {},
        forward: () => {}
      },
      $fetch: () => Promise.resolve({}),
      close: () => Promise.resolve()
    }
  }
}

/**
 * @typedef {Object} ScenarioContext
 * @property {Object} nuxt - Nuxt app instance
 * @property {Object} router - Nuxt router instance
 * @property {Function} $fetch - Nuxt fetch function
 * @property {Object} user - User session context
 * @property {Object} data - Shared test data
 */

/**
 * Scenario Builder - Main entry point for fluent testing
 */
export class ScenarioBuilder {
  /**
   * @param {string} description - Scenario description
   */
  constructor(description) {
    this.description = description
    this.steps = []
    this.context = {
      user: {},
      data: {},
      nuxt: null,
      router: null,
      $fetch: null
    }
    this.hooks = {
      before: [],
      after: [],
      beforeEach: [],
      afterEach: []
    }
  }

  /**
   * Get Given builder for preconditions
   * @returns {GivenBuilder}
   */
  get given() {
    return new GivenBuilder(this)
  }

  /**
   * Get When builder for actions
   * @returns {WhenBuilder}
   */
  get when() {
    return new WhenBuilder(this)
  }

  /**
   * Get Then builder for assertions
   * @returns {ThenBuilder}
   */
  get then() {
    return new ThenBuilder(this)
  }

  /**
   * Get And builder for chaining assertions
   * @returns {ThenBuilder}
   */
  get and() {
    return this.then
  }

  /**
   * Add a test step
   * @param {string} type - Step type (given/when/then)
   * @param {string} description - Step description
   * @param {Function} implementation - Step implementation
   * @returns {ScenarioBuilder}
   */
  addStep(type, description, implementation) {
    this.steps.push({
      type,
      description,
      implementation,
      timestamp: Date.now()
    })
    return this
  }

  /**
   * Execute the scenario
   * @returns {Promise<void>}
   */
  async execute() {
    // Setup Nuxt test environment
    await this.setupNuxtContext()

    // Execute before hooks
    for (const hook of this.hooks.before) {
      await hook(this.context)
    }

    // Execute steps sequentially
    for (const step of this.steps) {
      await this.executeStep(step)
    }

    // Execute after hooks
    for (const hook of this.hooks.after) {
      await hook(this.context)
    }

    // Cleanup
    await this.cleanup()
  }

  /**
   * Setup Nuxt testing context
   * @private
   */
  async setupNuxtContext() {
    const nuxt = await mockNuxtSetup.setupNuxt()
    this.context.nuxt = nuxt
    this.context.router = nuxt.router
    this.context.$fetch = nuxt.$fetch
  }

  /**
   * Execute a single test step
   * @param {Object} step - Test step
   * @private
   */
  async executeStep(step) {
    try {
      await step.implementation(this.context)
    } catch (error) {
      throw new Error(`Step failed: ${step.description}\nError: ${error.message}`)
    }
  }

  /**
   * Cleanup resources
   * @private
   */
  async cleanup() {
    if (this.context.nuxt) {
      await this.context.nuxt.close()
    }
  }
}

/**
 * Given Builder - For setting up preconditions
 */
export class GivenBuilder {
  /**
   * @param {ScenarioBuilder} scenario
   */
  constructor(scenario) {
    this.scenario = scenario
  }

  /**
   * Get user actions builder
   * @returns {UserGivenActions}
   */
  get user() {
    return new UserGivenActions(this.scenario)
  }

  /**
   * Get page actions builder
   * @returns {PageGivenActions}
   */
  get page() {
    return new PageGivenActions(this.scenario)
  }

  /**
   * Get API actions builder
   * @returns {ApiGivenActions}
   */
  get api() {
    return new ApiGivenActions(this.scenario)
  }

  /**
   * Get database actions builder
   * @returns {DatabaseGivenActions}
   */
  get database() {
    return new DatabaseGivenActions(this.scenario)
  }
}

/**
 * When Builder - For executing actions
 */
export class WhenBuilder {
  /**
   * @param {ScenarioBuilder} scenario
   */
  constructor(scenario) {
    this.scenario = scenario
  }

  /**
   * Get user actions builder
   * @returns {UserWhenActions}
   */
  get user() {
    return new UserWhenActions(this.scenario)
  }

  /**
   * Get page actions builder
   * @returns {PageWhenActions}
   */
  get page() {
    return new PageWhenActions(this.scenario)
  }

  /**
   * Get API actions builder
   * @returns {ApiWhenActions}
   */
  get api() {
    return new ApiWhenActions(this.scenario)
  }
}

/**
 * Then Builder - For making assertions
 */
export class ThenBuilder {
  /**
   * @param {ScenarioBuilder} scenario
   */
  constructor(scenario) {
    this.scenario = scenario
  }

  /**
   * Get user assertion builder
   * @returns {UserThenActions}
   */
  get user() {
    return new UserThenActions(this.scenario)
  }

  /**
   * Get page assertion builder
   * @returns {PageThenActions}
   */
  get page() {
    return new PageThenActions(this.scenario)
  }

  /**
   * Get API assertion builder
   * @returns {ApiThenActions}
   */
  get api() {
    return new ApiThenActions(this.scenario)
  }

  /**
   * Get session assertion builder
   * @returns {SessionThenActions}
   */
  get session() {
    return new SessionThenActions(this.scenario)
  }

  /**
   * Get response assertion builder
   * @returns {ResponseThenActions}
   */
  get response() {
    return new ResponseThenActions(this.scenario)
  }
}

/**
 * Main framework factory function
 * @param {string} description - Scenario description
 * @returns {ScenarioBuilder}
 */
export function scenario(description) {
  return new ScenarioBuilder(description)
}

/**
 * Convenience exports for Gherkin-style syntax
 */
export const given = (description) => new ScenarioBuilder(description).given
export const when = (description) => new ScenarioBuilder(description).when  
export const then = (description) => new ScenarioBuilder(description).then

/**
 * Framework configuration
 */
export const config = {
  timeout: 30000,
  retries: 2,
  parallel: true,
  setupFiles: [],
  teardownFiles: [],
  plugins: []
}

/**
 * Plugin registration
 * @param {Object} plugin - Framework plugin
 */
export function usePlugin(plugin) {
  config.plugins.push(plugin)
  plugin.install?.(config)
}