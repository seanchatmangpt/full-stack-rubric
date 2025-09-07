/**
 * BDD Step Generators for Authentication and Permissions
 * Handles login, logout, user roles, and permission testing
 * @module auth-steps
 */

import { registerStepGenerator } from './step-generators.js'

/**
 * Authentication step generator class
 */
class AuthStepGenerator {
  constructor() {
    this.patterns = new Map()
    this.currentUser = null
    this.authToken = null
  }

  /**
   * Register all authentication-related step generators
   */
  registerSteps() {
    // User setup
    registerStepGenerator('given-user-exists', {
      pattern: '(?:a|an) user (?:exists |)with (?:email|username) "([^"]*)"(?:and password "([^"]*)")?',
      type: 'Given',
      generator: this.generateGivenUserExists.bind(this),
      tags: ['auth', 'setup', 'user'],
      metadata: { description: 'Create or setup test user' }
    })

    registerStepGenerator('given-user-with-role', {
      pattern: '(?:a|an) user (?:exists |)with role "([^"]*)"(?:and email "([^"]*)")?',
      type: 'Given',
      generator: this.generateGivenUserWithRole.bind(this),
      tags: ['auth', 'setup', 'role'],
      metadata: { description: 'Create user with specific role' }
    })

    registerStepGenerator('given-user-with-permissions', {
      pattern: '(?:a|an) user (?:exists |)with permissions? "([^"]*)"',
      type: 'Given',
      generator: this.generateGivenUserWithPermissions.bind(this),
      tags: ['auth', 'setup', 'permissions'],
      metadata: { description: 'Create user with specific permissions' }
    })

    // Authentication state
    registerStepGenerator('user-is-logged-out', {
      pattern: '(?:the )?user is (?:logged out|not logged in|anonymous)',
      type: 'Given',
      generator: this.generateUserIsLoggedOut.bind(this),
      tags: ['auth', 'state', 'logout'],
      metadata: { description: 'Ensure user is not authenticated' }
    })

    registerStepGenerator('user-is-logged-in', {
      pattern: '(?:the )?user is logged in(?:as "([^"]*)")?',
      type: 'Given',
      generator: this.generateUserIsLoggedIn.bind(this),
      tags: ['auth', 'state', 'login'],
      metadata: { description: 'Ensure user is authenticated' }
    })

    registerStepGenerator('user-has-valid-session', {
      pattern: '(?:the )?user has (?:a )?valid session',
      type: 'Given',
      generator: this.generateUserHasValidSession.bind(this),
      tags: ['auth', 'state', 'session'],
      metadata: { description: 'Ensure user has valid auth session' }
    })

    // Login actions
    registerStepGenerator('login-with-credentials', {
      pattern: 'I (?:log in|login|sign in) with (?:email|username) "([^"]*)" and password "([^"]*)"',
      type: 'When',
      generator: this.generateLoginWithCredentials.bind(this),
      tags: ['auth', 'action', 'login'],
      metadata: { description: 'Perform login with credentials' }
    })

    registerStepGenerator('login-as-user', {
      pattern: 'I (?:log in|login|sign in) as "([^"]*)"',
      type: 'When',
      generator: this.generateLoginAsUser.bind(this),
      tags: ['auth', 'action', 'login'],
      metadata: { description: 'Login as specific user' }
    })

    registerStepGenerator('login-with-invalid-credentials', {
      pattern: 'I (?:try to |attempt to |)(?:log in|login|sign in) with invalid credentials',
      type: 'When',
      generator: this.generateLoginWithInvalidCredentials.bind(this),
      tags: ['auth', 'action', 'login', 'error'],
      metadata: { description: 'Attempt login with wrong credentials' }
    })

    registerStepGenerator('submit-login-form', {
      pattern: 'I submit (?:the )?login form',
      type: 'When',
      generator: this.generateSubmitLoginForm.bind(this),
      tags: ['auth', 'action', 'form'],
      metadata: { description: 'Submit login form' }
    })

    // Logout actions
    registerStepGenerator('logout', {
      pattern: 'I (?:log out|logout|sign out)',
      type: 'When',
      generator: this.generateLogout.bind(this),
      tags: ['auth', 'action', 'logout'],
      metadata: { description: 'Perform logout action' }
    })

    registerStepGenerator('click-logout-button', {
      pattern: 'I click (?:the )?(?:logout|sign out) (?:button|link)',
      type: 'When',
      generator: this.generateClickLogoutButton.bind(this),
      tags: ['auth', 'action', 'logout', 'ui'],
      metadata: { description: 'Click logout button/link' }
    })

    // Registration actions
    registerStepGenerator('register-new-user', {
      pattern: 'I register (?:a |)new user with (?:email|username) "([^"]*)"(?:and password "([^"]*)")?',
      type: 'When',
      generator: this.generateRegisterNewUser.bind(this),
      tags: ['auth', 'action', 'registration'],
      metadata: { description: 'Register new user account' }
    })

    registerStepGenerator('submit-registration-form', {
      pattern: 'I submit (?:the )?registration form',
      type: 'When',
      generator: this.generateSubmitRegistrationForm.bind(this),
      tags: ['auth', 'action', 'form', 'registration'],
      metadata: { description: 'Submit user registration form' }
    })

    // Password actions
    registerStepGenerator('request-password-reset', {
      pattern: 'I request (?:a )?password reset for "([^"]*)"',
      type: 'When',
      generator: this.generateRequestPasswordReset.bind(this),
      tags: ['auth', 'action', 'password'],
      metadata: { description: 'Request password reset' }
    })

    registerStepGenerator('change-password', {
      pattern: 'I change (?:my |the |)password from "([^"]*)" to "([^"]*)"',
      type: 'When',
      generator: this.generateChangePassword.bind(this),
      tags: ['auth', 'action', 'password'],
      metadata: { description: 'Change user password' }
    })

    // Authentication verification
    registerStepGenerator('should-be-logged-in', {
      pattern: 'I should be logged in(?:as "([^"]*)")?',
      type: 'Then',
      generator: this.generateShouldBeLoggedIn.bind(this),
      tags: ['auth', 'verification', 'login'],
      metadata: { description: 'Verify user is logged in' }
    })

    registerStepGenerator('should-be-logged-out', {
      pattern: 'I should be logged out',
      type: 'Then',
      generator: this.generateShouldBeLoggedOut.bind(this),
      tags: ['auth', 'verification', 'logout'],
      metadata: { description: 'Verify user is logged out' }
    })

    registerStepGenerator('should-see-login-form', {
      pattern: 'I should see (?:the )?login form',
      type: 'Then',
      generator: this.generateShouldSeeLoginForm.bind(this),
      tags: ['auth', 'verification', 'ui'],
      metadata: { description: 'Verify login form is visible' }
    })

    registerStepGenerator('should-see-logout-button', {
      pattern: 'I should see (?:the )?(?:logout|sign out) (?:button|link)',
      type: 'Then',
      generator: this.generateShouldSeeLogoutButton.bind(this),
      tags: ['auth', 'verification', 'ui'],
      metadata: { description: 'Verify logout button is visible' }
    })

    registerStepGenerator('should-see-user-menu', {
      pattern: 'I should see (?:the )?user menu(?:with name "([^"]*)")?',
      type: 'Then',
      generator: this.generateShouldSeeUserMenu.bind(this),
      tags: ['auth', 'verification', 'ui'],
      metadata: { description: 'Verify user menu is visible' }
    })

    // Error verification
    registerStepGenerator('should-see-login-error', {
      pattern: 'I should see (?:a |an |the |)(?:login |authentication |)error(?:message)?(?:saying "([^"]*)")?',
      type: 'Then',
      generator: this.generateShouldSeeLoginError.bind(this),
      tags: ['auth', 'verification', 'error'],
      metadata: { description: 'Verify login error message' }
    })

    registerStepGenerator('should-be-redirected-to-login', {
      pattern: 'I should be redirected to (?:the )?login page',
      type: 'Then',
      generator: this.generateShouldBeRedirectedToLogin.bind(this),
      tags: ['auth', 'verification', 'redirect'],
      metadata: { description: 'Verify redirect to login page' }
    })

    // Permission verification
    registerStepGenerator('should-have-permission', {
      pattern: '(?:the )?user should have permission "([^"]*)"',
      type: 'Then',
      generator: this.generateShouldHavePermission.bind(this),
      tags: ['auth', 'verification', 'permissions'],
      metadata: { description: 'Verify user has specific permission' }
    })

    registerStepGenerator('should-not-have-permission', {
      pattern: '(?:the )?user should not have permission "([^"]*)"',
      type: 'Then',
      generator: this.generateShouldNotHavePermission.bind(this),
      tags: ['auth', 'verification', 'permissions'],
      metadata: { description: 'Verify user lacks specific permission' }
    })

    registerStepGenerator('should-have-role', {
      pattern: '(?:the )?user should have (?:the )?role "([^"]*)"',
      type: 'Then',
      generator: this.generateShouldHaveRole.bind(this),
      tags: ['auth', 'verification', 'role'],
      metadata: { description: 'Verify user has specific role' }
    })

    registerStepGenerator('should-not-have-role', {
      pattern: '(?:the )?user should not have (?:the )?role "([^"]*)"',
      type: 'Then',
      generator: this.generateShouldNotHaveRole.bind(this),
      tags: ['auth', 'verification', 'role'],
      metadata: { description: 'Verify user does not have specific role' }
    })

    // Access control verification
    registerStepGenerator('should-have-access-to', {
      pattern: '(?:the )?user should have access to "([^"]*)"',
      type: 'Then',
      generator: this.generateShouldHaveAccessTo.bind(this),
      tags: ['auth', 'verification', 'access'],
      metadata: { description: 'Verify user has access to resource' }
    })

    registerStepGenerator('should-not-have-access-to', {
      pattern: '(?:the )?user should not have access to "([^"]*)"',
      type: 'Then',
      generator: this.generateShouldNotHaveAccessTo.bind(this),
      tags: ['auth', 'verification', 'access'],
      metadata: { description: 'Verify user is denied access to resource' }
    })

    registerStepGenerator('should-see-access-denied', {
      pattern: 'I should see (?:an |the |)(?:access denied|unauthorized|403) (?:error|message|page)',
      type: 'Then',
      generator: this.generateShouldSeeAccessDenied.bind(this),
      tags: ['auth', 'verification', 'error', 'access'],
      metadata: { description: 'Verify access denied error is shown' }
    })

    // Session management
    registerStepGenerator('session-should-expire', {
      pattern: '(?:the )?(?:user |)session should (?:expire|be expired)',
      type: 'Then',
      generator: this.generateSessionShouldExpire.bind(this),
      tags: ['auth', 'verification', 'session'],
      metadata: { description: 'Verify session expiration' }
    })

    registerStepGenerator('session-should-be-extended', {
      pattern: '(?:the )?(?:user |)session should be (?:extended|renewed)',
      type: 'Then',
      generator: this.generateSessionShouldBeExtended.bind(this),
      tags: ['auth', 'verification', 'session'],
      metadata: { description: 'Verify session extension' }
    })

    // Two-factor authentication
    registerStepGenerator('enter-2fa-code', {
      pattern: 'I enter (?:the )?(?:2FA|two-factor|MFA) code "([^"]*)"',
      type: 'When',
      generator: this.generateEnter2faCode.bind(this),
      tags: ['auth', 'action', '2fa'],
      metadata: { description: 'Enter two-factor authentication code' }
    })

    registerStepGenerator('should-see-2fa-prompt', {
      pattern: 'I should see (?:a |the |)(?:2FA|two-factor|MFA) (?:prompt|form|challenge)',
      type: 'Then',
      generator: this.generateShouldSee2faPrompt.bind(this),
      tags: ['auth', 'verification', '2fa'],
      metadata: { description: 'Verify 2FA prompt is shown' }
    })

    // Social authentication
    registerStepGenerator('login-with-provider', {
      pattern: 'I (?:log in|login|sign in) with "([^"]*)"',
      type: 'When',
      generator: this.generateLoginWithProvider.bind(this),
      tags: ['auth', 'action', 'social', 'oauth'],
      metadata: { description: 'Login with social provider (Google, GitHub, etc.)' }
    })

    registerStepGenerator('should-see-oauth-redirect', {
      pattern: 'I should (?:be redirected to|see) (?:the )?(?:"([^"]*)"|([^"]*)) (?:OAuth |)(?:login |)(?:page|provider)',
      type: 'Then',
      generator: this.generateShouldSeeOauthRedirect.bind(this),
      tags: ['auth', 'verification', 'oauth', 'redirect'],
      metadata: { description: 'Verify OAuth provider redirect' }
    })
  }

  /**
   * Generate given user exists step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateGivenUserExists(match, options) {
    const [, email, password = 'password123'] = match
    const testRunner = options.testRunner || 'vitest'
    
    return `// Create test user
const testUser = {
  email: '${email}',
  password: '${password}',
  id: 'user-${Date.now()}',
  roles: ['user'],
  permissions: ['read']
}

// Mock user in authentication service
const authStore = useAuthStore()
authStore.setTestUser(testUser)

// For API testing, mock user endpoint
if (global.fetch && global.fetch.mockImplementation) {
  global.fetch.mockImplementation((url) => {
    if (url.includes('/api/auth/user') || url.includes('/users')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => testUser
      })
    }
    return fetch.mockRestore()
  })
}`
  }

  /**
   * Generate given user with role step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateGivenUserWithRole(match, options) {
    const [, role, email = 'test@example.com'] = match
    
    return `// Create test user with specific role
const testUser = {
  email: '${email}',
  password: 'password123',
  id: 'user-${Date.now()}',
  roles: ['${role}'],
  permissions: this.getRolePermissions('${role}')
}

// Set user in auth store
const authStore = useAuthStore()
authStore.setTestUser(testUser)
this.currentUser = testUser`
  }

  /**
   * Generate given user with permissions step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateGivenUserWithPermissions(match, options) {
    const [, permissions] = match
    const permissionArray = permissions.split(',').map(p => p.trim())
    
    return `// Create test user with specific permissions
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  id: 'user-${Date.now()}',
  roles: ['user'],
  permissions: [${permissionArray.map(p => `'${p}'`).join(', ')}]
}

// Set user in auth store
const authStore = useAuthStore()
authStore.setTestUser(testUser)
this.currentUser = testUser`
  }

  /**
   * Generate user is logged out step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateUserIsLoggedOut(match, options) {
    return `// Ensure user is logged out
const authStore = useAuthStore()
authStore.logout()
this.currentUser = null
this.authToken = null

// Clear any auth cookies or localStorage
if (typeof localStorage !== 'undefined') {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user')
}

// Clear auth headers
this.requestHeaders = this.requestHeaders || {}
delete this.requestHeaders['Authorization']`
  }

  /**
   * Generate user is logged in step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateUserIsLoggedIn(match, options) {
    const [, username = 'testuser'] = match
    
    return `// Set user as logged in
const authStore = useAuthStore()
const testUser = {
  email: '${username}@example.com',
  username: '${username}',
  id: 'user-${Date.now()}',
  roles: ['user'],
  permissions: ['read', 'write']
}

authStore.login(testUser)
this.currentUser = testUser
this.authToken = 'mock-jwt-token'

// Set auth headers for API requests
this.requestHeaders = this.requestHeaders || {}
this.requestHeaders['Authorization'] = 'Bearer ' + this.authToken`
  }

  /**
   * Generate user has valid session step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateUserHasValidSession(match, options) {
    return `// Ensure valid user session
const authStore = useAuthStore()
const sessionToken = 'valid-session-token'
const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now

authStore.setSession({
  token: sessionToken,
  expiresAt: sessionExpiry,
  isValid: true
})

// Mock session validation endpoint
if (global.fetch && global.fetch.mockImplementation) {
  global.fetch.mockImplementation((url) => {
    if (url.includes('/api/auth/validate')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ valid: true, user: this.currentUser })
      })
    }
    return fetch.mockRestore()
  })
}`
  }

  /**
   * Generate login with credentials step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateLoginWithCredentials(match, options) {
    const [, email, password] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `// Fill and submit login form
await page.getByLabel('Email').fill('${email}')
await page.getByLabel('Password').fill('${password}')
await page.getByRole('button', { name: 'Login' }).click()`
    }
    
    return `// Login with credentials
const authStore = useAuthStore()
const wrapper = mount(LoginComponent, { global: { plugins: [createTestingPinia()] } })

// Fill login form
await wrapper.find('input[type="email"], input[name="email"]').setValue('${email}')
await wrapper.find('input[type="password"], input[name="password"]').setValue('${password}')

// Submit form
await wrapper.find('form').trigger('submit')

// Mock successful login response
const loginResponse = await authStore.login({ email: '${email}', password: '${password}' })
this.loginResponse = loginResponse`
  }

  /**
   * Generate login as user step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateLoginAsUser(match, options) {
    const [, username] = match
    
    return `// Login as specific user
const authStore = useAuthStore()
const testUser = {
  username: '${username}',
  email: '${username}@example.com',
  id: 'user-${username}',
  roles: ['user'],
  permissions: ['read', 'write']
}

await authStore.login(testUser)
this.currentUser = testUser`
  }

  /**
   * Generate login with invalid credentials step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateLoginWithInvalidCredentials(match, options) {
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `// Attempt login with invalid credentials
await page.getByLabel('Email').fill('invalid@example.com')
await page.getByLabel('Password').fill('wrongpassword')
await page.getByRole('button', { name: 'Login' }).click()`
    }
    
    return `// Attempt login with invalid credentials
const authStore = useAuthStore()
const wrapper = mount(LoginComponent, { global: { plugins: [createTestingPinia()] } })

await wrapper.find('input[type="email"]').setValue('invalid@example.com')
await wrapper.find('input[type="password"]').setValue('wrongpassword')
await wrapper.find('form').trigger('submit')

// Mock failed login response
this.loginResponse = await authStore.login({ 
  email: 'invalid@example.com', 
  password: 'wrongpassword' 
}).catch(error => error)`
  }

  /**
   * Generate submit login form step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateSubmitLoginForm(match, options) {
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `// Submit login form
await page.getByRole('button', { name: 'Login' }).click()`
    }
    
    return `// Submit login form
const wrapper = mount(LoginComponent, { global: { plugins: [createTestingPinia()] } })
await wrapper.find('form').trigger('submit')
await wrapper.find('button[type="submit"]').trigger('click')`
  }

  /**
   * Generate logout step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateLogout(match, options) {
    return `// Perform logout
const authStore = useAuthStore()
await authStore.logout()
this.currentUser = null
this.authToken = null

// Clear auth headers
this.requestHeaders = this.requestHeaders || {}
delete this.requestHeaders['Authorization']`
  }

  /**
   * Generate click logout button step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateClickLogoutButton(match, options) {
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `// Click logout button
await page.getByRole('button', { name: /logout|sign out/i }).click()`
    }
    
    return `// Click logout button
const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const logoutButton = wrapper.find('[data-testid="logout-button"], button:contains("Logout"), a:contains("Sign Out")')
await logoutButton.trigger('click')`
  }

  /**
   * Generate register new user step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateRegisterNewUser(match, options) {
    const [, email, password = 'newpassword123'] = match
    
    return `// Register new user
const authStore = useAuthStore()
const userData = {
  email: '${email}',
  password: '${password}',
  confirmPassword: '${password}'
}

const registrationResponse = await authStore.register(userData)
this.registrationResponse = registrationResponse`
  }

  /**
   * Generate submit registration form step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateSubmitRegistrationForm(match, options) {
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `// Submit registration form
await page.getByRole('button', { name: 'Register' }).click()`
    }
    
    return `// Submit registration form
const wrapper = mount(RegistrationComponent, { global: { plugins: [createTestingPinia()] } })
await wrapper.find('form').trigger('submit')`
  }

  /**
   * Generate request password reset step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateRequestPasswordReset(match, options) {
    const [, email] = match
    
    return `// Request password reset
const authStore = useAuthStore()
const resetResponse = await authStore.requestPasswordReset('${email}')
this.resetResponse = resetResponse`
  }

  /**
   * Generate change password step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateChangePassword(match, options) {
    const [, oldPassword, newPassword] = match
    
    return `// Change password
const authStore = useAuthStore()
const changeResponse = await authStore.changePassword({
  currentPassword: '${oldPassword}',
  newPassword: '${newPassword}',
  confirmPassword: '${newPassword}'
})
this.changePasswordResponse = changeResponse`
  }

  /**
   * Generate should be logged in step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldBeLoggedIn(match, options) {
    const [, expectedUser] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `// Verify user is logged in
await expect(page.locator('[data-testid="user-menu"], .user-menu')).toBeVisible()
${expectedUser ? `await expect(page.getByText('${expectedUser}')).toBeVisible()` : ''}`
    }
    
    return `// Verify user is logged in
const authStore = useAuthStore()
expect(authStore.isAuthenticated).toBe(true)
expect(authStore.user).toBeTruthy()
${expectedUser ? `expect(authStore.user.username || authStore.user.email).toContain('${expectedUser}')` : ''}`
  }

  /**
   * Generate should be logged out step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldBeLoggedOut(match, options) {
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `// Verify user is logged out
await expect(page.locator('[data-testid="login-form"], .login-form')).toBeVisible()
await expect(page.locator('[data-testid="user-menu"], .user-menu')).not.toBeVisible()`
    }
    
    return `// Verify user is logged out
const authStore = useAuthStore()
expect(authStore.isAuthenticated).toBe(false)
expect(authStore.user).toBeFalsy()`
  }

  /**
   * Generate should see login form step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldSeeLoginForm(match, options) {
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `// Verify login form is visible
await expect(page.getByLabel('Email')).toBeVisible()
await expect(page.getByLabel('Password')).toBeVisible()
await expect(page.getByRole('button', { name: 'Login' })).toBeVisible()`
    }
    
    return `// Verify login form is visible
const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
expect(wrapper.find('input[type="email"], input[name="email"]').exists()).toBe(true)
expect(wrapper.find('input[type="password"], input[name="password"]').exists()).toBe(true)
expect(wrapper.find('button[type="submit"], button:contains("Login")').exists()).toBe(true)`
  }

  /**
   * Generate should see logout button step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldSeeLogoutButton(match, options) {
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `// Verify logout button is visible
await expect(page.getByRole('button', { name: /logout|sign out/i })).toBeVisible()`
    }
    
    return `// Verify logout button is visible
const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const logoutButton = wrapper.find('[data-testid="logout-button"], button:contains("Logout"), a:contains("Sign Out")')
expect(logoutButton.exists()).toBe(true)`
  }

  /**
   * Generate should see user menu step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldSeeUserMenu(match, options) {
    const [, expectedName] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `// Verify user menu is visible
await expect(page.locator('[data-testid="user-menu"], .user-menu')).toBeVisible()
${expectedName ? `await expect(page.getByText('${expectedName}')).toBeVisible()` : ''}`
    }
    
    return `// Verify user menu is visible
const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const userMenu = wrapper.find('[data-testid="user-menu"], .user-menu')
expect(userMenu.exists()).toBe(true)
${expectedName ? `expect(userMenu.text()).toContain('${expectedName}')` : ''}`
  }

  /**
   * Generate should see login error step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldSeeLoginError(match, options) {
    const [, expectedMessage] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `// Verify login error is displayed
await expect(page.locator('.error, .alert-error, [role="alert"]')).toBeVisible()
${expectedMessage ? `await expect(page.getByText('${expectedMessage}')).toBeVisible()` : ''}`
    }
    
    return `// Verify login error is displayed
const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const errorElement = wrapper.find('.error, .alert-error, [role="alert"]')
expect(errorElement.exists()).toBe(true)
${expectedMessage ? `expect(errorElement.text()).toContain('${expectedMessage}')` : ''}`
  }

  /**
   * Generate should be redirected to login step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldBeRedirectedToLogin(match, options) {
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `// Verify redirect to login page
await expect(page).toHaveURL(/\/login/)`
    }
    
    return `// Verify redirect to login page
const router = useRouter()
expect(router.currentRoute.value.path).toBe('/login')`
  }

  /**
   * Generate should have permission step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldHavePermission(match, options) {
    const [, permission] = match
    
    return `// Verify user has permission
const authStore = useAuthStore()
expect(authStore.hasPermission('${permission}')).toBe(true)
expect(authStore.user.permissions).toContain('${permission}')`
  }

  /**
   * Generate should not have permission step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldNotHavePermission(match, options) {
    const [, permission] = match
    
    return `// Verify user does not have permission
const authStore = useAuthStore()
expect(authStore.hasPermission('${permission}')).toBe(false)
expect(authStore.user.permissions || []).not.toContain('${permission}')`
  }

  /**
   * Generate should have role step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldHaveRole(match, options) {
    const [, role] = match
    
    return `// Verify user has role
const authStore = useAuthStore()
expect(authStore.hasRole('${role}')).toBe(true)
expect(authStore.user.roles).toContain('${role}')`
  }

  /**
   * Generate should not have role step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldNotHaveRole(match, options) {
    const [, role] = match
    
    return `// Verify user does not have role
const authStore = useAuthStore()
expect(authStore.hasRole('${role}')).toBe(false)
expect(authStore.user.roles || []).not.toContain('${role}')`
  }

  /**
   * Generate should have access to step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldHaveAccessTo(match, options) {
    const [, resource] = match
    
    return `// Verify user has access to resource
const authStore = useAuthStore()
expect(authStore.canAccess('${resource}')).toBe(true)

// Also verify UI element is accessible
const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const resourceElement = wrapper.find('[data-testid="${this.kebabCase(resource)}"]')
if (resourceElement.exists()) {
  expect(resourceElement.attributes('disabled')).toBeFalsy()
}`
  }

  /**
   * Generate should not have access to step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldNotHaveAccessTo(match, options) {
    const [, resource] = match
    
    return `// Verify user does not have access to resource
const authStore = useAuthStore()
expect(authStore.canAccess('${resource}')).toBe(false)

// Also verify UI element is disabled or hidden
const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const resourceElement = wrapper.find('[data-testid="${this.kebabCase(resource)}"]')
if (resourceElement.exists()) {
  expect(resourceElement.attributes('disabled')).toBeTruthy()
} else {
  // Element should not exist if access is denied
  expect(resourceElement.exists()).toBe(false)
}`
  }

  /**
   * Generate should see access denied step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldSeeAccessDenied(match, options) {
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `// Verify access denied message is shown
await expect(page.getByText(/access denied|unauthorized|403|forbidden/i)).toBeVisible()`
    }
    
    return `// Verify access denied message is shown
const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const errorMessage = wrapper.find('.error, .alert-error, [role="alert"]')
expect(errorMessage.exists()).toBe(true)
expect(errorMessage.text().toLowerCase()).toMatch(/access denied|unauthorized|403|forbidden/)`
  }

  /**
   * Generate session should expire step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateSessionShouldExpire(match, options) {
    return `// Verify session expiration
const authStore = useAuthStore()
const session = authStore.getSession()
expect(session.isExpired || session.expiresAt < Date.now()).toBe(true)
expect(authStore.isAuthenticated).toBe(false)`
  }

  /**
   * Generate session should be extended step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateSessionShouldBeExtended(match, options) {
    return `// Verify session extension
const authStore = useAuthStore()
const session = authStore.getSession()
expect(session.expiresAt).toBeGreaterThan(this.previousSessionExpiry || Date.now())
expect(authStore.isAuthenticated).toBe(true)`
  }

  /**
   * Generate enter 2FA code step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateEnter2faCode(match, options) {
    const [, code] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `// Enter 2FA code
await page.getByLabel(/2FA|two.factor|MFA/i).fill('${code}')
await page.getByRole('button', { name: /verify|confirm/i }).click()`
    }
    
    return `// Enter 2FA code
const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
await wrapper.find('input[name="mfa"], input[name="2fa"], input[placeholder*="code"]').setValue('${code}')
await wrapper.find('button[type="submit"]').trigger('click')`
  }

  /**
   * Generate should see 2FA prompt step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldSee2faPrompt(match, options) {
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `// Verify 2FA prompt is shown
await expect(page.getByText(/enter.*code|two.factor|2FA|MFA/i)).toBeVisible()
await expect(page.getByLabel(/code|2FA|MFA/i)).toBeVisible()`
    }
    
    return `// Verify 2FA prompt is shown
const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const twoFAPrompt = wrapper.find('[data-testid="2fa-prompt"], .mfa-prompt')
expect(twoFAPrompt.exists()).toBe(true)
expect(wrapper.text()).toMatch(/enter.*code|two.factor|2FA|MFA/i)`
  }

  /**
   * Generate login with provider step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateLoginWithProvider(match, options) {
    const [, provider] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `// Login with social provider
await page.getByRole('button', { name: /sign in with ${provider}/i }).click()`
    }
    
    return `// Login with social provider
const authStore = useAuthStore()
await authStore.loginWithProvider('${provider}')

// Mock OAuth redirect
const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const providerButton = wrapper.find('[data-testid="${this.kebabCase(provider)}-login"], button:contains("${provider}")')
await providerButton.trigger('click')`
  }

  /**
   * Generate should see OAuth redirect step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldSeeOauthRedirect(match, options) {
    const [, provider1, provider2] = match
    const provider = provider1 || provider2
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `// Verify OAuth redirect
await expect(page).toHaveURL(new RegExp('${provider.toLowerCase()}'))
await page.waitForURL(url => url.includes('${provider.toLowerCase()}'))`
    }
    
    return `// Verify OAuth redirect (mock)
// In real tests, this would check for actual redirect
// For unit tests, verify redirect was initiated
const authStore = useAuthStore()
expect(authStore.getLastOAuthProvider()).toBe('${provider}')
expect(authStore.isRedirectingToOAuth).toBe(true)`
  }

  /**
   * Convert string to kebab-case for data-testid attributes
   * @param {string} str - String to convert
   * @returns {string} Kebab-case string
   */
  kebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase()
  }

  /**
   * Get permissions for a role (helper method for step generators)
   * @param {string} role - Role name
   * @returns {string[]} Array of permissions
   */
  getRolePermissions(role) {
    const rolePermissions = {
      admin: ['read', 'write', 'delete', 'manage_users', 'manage_system'],
      moderator: ['read', 'write', 'delete', 'manage_content'],
      editor: ['read', 'write', 'edit_content'],
      user: ['read', 'write'],
      guest: ['read']
    }
    return rolePermissions[role] || ['read']
  }
}

export const authStepGenerator = new AuthStepGenerator()