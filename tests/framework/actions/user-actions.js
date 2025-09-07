/**
 * User Actions - Fluent interface for user-related test operations
 * Provides 80% boilerplate reduction for common user testing scenarios
 */

import { expect } from 'vitest'

/**
 * User Given Actions - Setup user preconditions
 */
export class UserGivenActions {
  /**
   * @param {ScenarioBuilder} scenario
   */
  constructor(scenario) {
    this.scenario = scenario
  }

  /**
   * Set user as logged out
   * @returns {ScenarioBuilder}
   */
  isLoggedOut() {
    return this.scenario.addStep('given', 'user is logged out', async (context) => {
      // Clear all authentication tokens
      context.user.token = null
      context.user.isAuthenticated = false
      
      // Clear cookies and session storage
      if (context.nuxt) {
        await context.$fetch('/api/auth/logout', { method: 'POST' })
      }
      
      // Clear local storage in browser context
      if (typeof window !== 'undefined') {
        window.localStorage.clear()
        window.sessionStorage.clear()
      }
    })
  }

  /**
   * Set user as logged in with specific role
   * @param {Object} userProfile - User profile data
   * @returns {ScenarioBuilder}
   */
  isLoggedIn(userProfile = {}) {
    return this.scenario.addStep('given', 'user is logged in', async (context) => {
      const defaultProfile = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        ...userProfile
      }
      
      context.user = {
        ...defaultProfile,
        isAuthenticated: true,
        token: 'mock-jwt-token'
      }
      
      // Set authentication in Nuxt context
      if (context.nuxt) {
        context.nuxt.$auth = {
          user: context.user,
          loggedIn: true
        }
      }
    })
  }

  /**
   * Set user with specific permissions
   * @param {string[]} permissions - Array of permissions
   * @returns {ScenarioBuilder}
   */
  hasPermissions(permissions) {
    return this.scenario.addStep('given', 'user has permissions', async (context) => {
      context.user.permissions = permissions
    })
  }

  /**
   * Set user profile data
   * @param {Object} profile - User profile data
   * @returns {ScenarioBuilder}
   */
  hasProfile(profile) {
    return this.scenario.addStep('given', 'user has profile', async (context) => {
      context.user = { ...context.user, ...profile }
    })
  }

  /**
   * Set user in specific location/context
   * @param {string} location - Current location or context
   * @returns {ScenarioBuilder}
   */
  isAt(location) {
    return this.scenario.addStep('given', `user is at ${location}`, async (context) => {
      if (context.router) {
        await context.router.push(location)
      }
      context.user.currentLocation = location
    })
  }
}

/**
 * User When Actions - Execute user actions
 */
export class UserWhenActions {
  /**
   * @param {ScenarioBuilder} scenario
   */
  constructor(scenario) {
    this.scenario = scenario
  }

  /**
   * User submits login form
   * @param {Object} credentials - Login credentials
   * @returns {ScenarioBuilder}
   */
  submitsLogin(credentials) {
    return this.scenario.addStep('when', 'user submits login', async (context) => {
      const response = await context.$fetch('/api/auth/login', {
        method: 'POST',
        body: credentials
      })
      
      context.data.loginResponse = response
      
      if (response.token) {
        context.user.token = response.token
        context.user.isAuthenticated = true
        context.user.email = credentials.email
      }
    })
  }

  /**
   * User navigates to page
   * @param {string} path - Page path
   * @returns {ScenarioBuilder}
   */
  navigatesTo(path) {
    return this.scenario.addStep('when', `user navigates to ${path}`, async (context) => {
      if (context.router) {
        await context.router.push(path)
      }
      context.user.currentLocation = path
      context.data.currentPath = path
    })
  }

  /**
   * User clicks on element
   * @param {string} selector - Element selector
   * @returns {ScenarioBuilder}
   */
  clicks(selector) {
    return this.scenario.addStep('when', `user clicks ${selector}`, async (context) => {
      // In real implementation, this would use testing library
      context.data.clickedElement = selector
      context.data.lastAction = 'click'
    })
  }

  /**
   * User fills form field
   * @param {string} field - Field name or selector
   * @param {string} value - Field value
   * @returns {ScenarioBuilder}
   */
  fills(field, value) {
    return this.scenario.addStep('when', `user fills ${field} with ${value}`, async (context) => {
      if (!context.data.formData) {
        context.data.formData = {}
      }
      context.data.formData[field] = value
    })
  }

  /**
   * User submits form
   * @param {string} formSelector - Form selector
   * @returns {ScenarioBuilder}
   */
  submitsForm(formSelector = 'form') {
    return this.scenario.addStep('when', `user submits form ${formSelector}`, async (context) => {
      // In real implementation, this would trigger form submission
      context.data.submittedForm = formSelector
      context.data.submittedData = context.data.formData || {}
      context.data.lastAction = 'submit'
    })
  }

  /**
   * User performs search
   * @param {string} searchTerm - Search term
   * @returns {ScenarioBuilder}
   */
  searches(searchTerm) {
    return this.scenario.addStep('when', `user searches for ${searchTerm}`, async (context) => {
      const response = await context.$fetch('/api/search', {
        method: 'GET',
        query: { q: searchTerm }
      })
      
      context.data.searchTerm = searchTerm
      context.data.searchResults = response
    })
  }

  /**
   * User logs out
   * @returns {ScenarioBuilder}
   */
  logsOut() {
    return this.scenario.addStep('when', 'user logs out', async (context) => {
      await context.$fetch('/api/auth/logout', { method: 'POST' })
      
      context.user.token = null
      context.user.isAuthenticated = false
      context.user.email = null
    })
  }
}

/**
 * User Then Actions - Assert user states
 */
export class UserThenActions {
  /**
   * @param {ScenarioBuilder} scenario
   */
  constructor(scenario) {
    this.scenario = scenario
  }

  /**
   * Assert user should be redirected to path
   * @param {string} path - Expected redirect path
   * @returns {ScenarioBuilder}
   */
  shouldBeRedirected(path) {
    return this.scenario.addStep('then', `user should be redirected to ${path}`, async (context) => {
      expect(context.data.currentPath || context.user.currentLocation).toBe(path)
    })
  }

  /**
   * Assert user should be logged in
   * @returns {ScenarioBuilder}
   */
  shouldBeLoggedIn() {
    return this.scenario.addStep('then', 'user should be logged in', async (context) => {
      expect(context.user.isAuthenticated).toBe(true)
      expect(context.user.token).toBeTruthy()
    })
  }

  /**
   * Assert user should be logged out
   * @returns {ScenarioBuilder}
   */
  shouldBeLoggedOut() {
    return this.scenario.addStep('then', 'user should be logged out', async (context) => {
      expect(context.user.isAuthenticated).toBe(false)
      expect(context.user.token).toBeFalsy()
    })
  }

  /**
   * Assert user should see message
   * @param {string} message - Expected message
   * @returns {ScenarioBuilder}
   */
  shouldSee(message) {
    return this.scenario.addStep('then', `user should see "${message}"`, async (context) => {
      // In real implementation, this would check DOM content
      expect(context.data.visibleContent).toContain(message)
    })
  }

  /**
   * Assert user should have specific role
   * @param {string} role - Expected role
   * @returns {ScenarioBuilder}
   */
  shouldHaveRole(role) {
    return this.scenario.addStep('then', `user should have role ${role}`, async (context) => {
      expect(context.user.role).toBe(role)
    })
  }

  /**
   * Assert user should have permissions
   * @param {string[]} permissions - Expected permissions
   * @returns {ScenarioBuilder}
   */
  shouldHavePermissions(permissions) {
    return this.scenario.addStep('then', 'user should have permissions', async (context) => {
      for (const permission of permissions) {
        expect(context.user.permissions).toContain(permission)
      }
    })
  }

  /**
   * Assert user profile should contain data
   * @param {Object} expectedData - Expected profile data
   * @returns {ScenarioBuilder}
   */
  shouldHaveProfile(expectedData) {
    return this.scenario.addStep('then', 'user should have profile data', async (context) => {
      for (const [key, value] of Object.entries(expectedData)) {
        expect(context.user[key]).toBe(value)
      }
    })
  }
}