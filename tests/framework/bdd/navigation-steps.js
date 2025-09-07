/**
 * BDD Step Generators for Navigation and Routing
 * Handles page navigation, URL changes, and route parameters
 * @module navigation-steps
 */

import { registerStepGenerator } from './step-generators.js'

/**
 * Navigation step generator class
 */
class NavigationStepGenerator {
  constructor() {
    this.patterns = new Map()
  }

  /**
   * Register all navigation-related step generators
   */
  registerSteps() {
    // Page navigation
    registerStepGenerator('visit-page', {
      pattern: 'I (?:visit|go to|navigate to) (?:the )?(?:"([^"]*)"|([^"]*)) page',
      type: 'Given',
      generator: this.generateVisitPage.bind(this),
      tags: ['navigation', 'routing', 'page'],
      metadata: { description: 'Navigate to a specific page' }
    })

    registerStepGenerator('visit-url', {
      pattern: 'I (?:visit|go to|navigate to) (?:the )?URL "([^"]*)"',
      type: 'Given',
      generator: this.generateVisitUrl.bind(this),
      tags: ['navigation', 'routing', 'url'],
      metadata: { description: 'Navigate to a specific URL' }
    })

    registerStepGenerator('visit-home', {
      pattern: 'I (?:visit|go to|am on) (?:the )?(?:home|index|main) page',
      type: 'Given',
      generator: this.generateVisitHome.bind(this),
      tags: ['navigation', 'routing', 'home'],
      metadata: { description: 'Navigate to home page' }
    })

    // Route parameters
    registerStepGenerator('visit-page-with-param', {
      pattern: 'I (?:visit|go to) (?:the )?(?:"([^"]*)"|([^"]*)) page with (?:id|parameter|param) "([^"]*)"',
      type: 'Given',
      generator: this.generateVisitPageWithParam.bind(this),
      tags: ['navigation', 'routing', 'parameters'],
      metadata: { description: 'Navigate to page with route parameter' }
    })

    registerStepGenerator('visit-page-with-query', {
      pattern: 'I (?:visit|go to) (?:the )?(?:"([^"]*)"|([^"]*)) page with query "([^"]*)"',
      type: 'Given',
      generator: this.generateVisitPageWithQuery.bind(this),
      tags: ['navigation', 'routing', 'query'],
      metadata: { description: 'Navigate to page with query parameters' }
    })

    // Navigation actions
    registerStepGenerator('click-navigate', {
      pattern: 'I click (?:the )?(?:"([^"]*)"|([^"]*)) (?:link|button) and navigate',
      type: 'When',
      generator: this.generateClickNavigate.bind(this),
      tags: ['navigation', 'interaction', 'click'],
      metadata: { description: 'Click element and verify navigation' }
    })

    registerStepGenerator('go-back', {
      pattern: 'I (?:go back|navigate back|click back)',
      type: 'When',
      generator: this.generateGoBack.bind(this),
      tags: ['navigation', 'history', 'back'],
      metadata: { description: 'Navigate back in browser history' }
    })

    registerStepGenerator('go-forward', {
      pattern: 'I (?:go forward|navigate forward|click forward)',
      type: 'When',
      generator: this.generateGoForward.bind(this),
      tags: ['navigation', 'history', 'forward'],
      metadata: { description: 'Navigate forward in browser history' }
    })

    registerStepGenerator('refresh-page', {
      pattern: 'I (?:refresh|reload) the page',
      type: 'When',
      generator: this.generateRefreshPage.bind(this),
      tags: ['navigation', 'refresh', 'reload'],
      metadata: { description: 'Refresh current page' }
    })

    // URL verification
    registerStepGenerator('should-be-on-page', {
      pattern: 'I should be on (?:the )?(?:"([^"]*)"|([^"]*)) page',
      type: 'Then',
      generator: this.generateShouldBeOnPage.bind(this),
      tags: ['navigation', 'verification', 'url'],
      metadata: { description: 'Verify current page location' }
    })

    registerStepGenerator('should-be-at-url', {
      pattern: 'I should be at (?:the )?URL "([^"]*)"',
      type: 'Then',
      generator: this.generateShouldBeAtUrl.bind(this),
      tags: ['navigation', 'verification', 'url'],
      metadata: { description: 'Verify exact URL match' }
    })

    registerStepGenerator('url-should-contain', {
      pattern: '(?:the )?URL should contain "([^"]*)"',
      type: 'Then',
      generator: this.generateUrlShouldContain.bind(this),
      tags: ['navigation', 'verification', 'url'],
      metadata: { description: 'Verify URL contains specific text' }
    })

    registerStepGenerator('url-should-not-contain', {
      pattern: '(?:the )?URL should not contain "([^"]*)"',
      type: 'Then',
      generator: this.generateUrlShouldNotContain.bind(this),
      tags: ['navigation', 'verification', 'url'],
      metadata: { description: 'Verify URL does not contain specific text' }
    })

    // Query parameters verification
    registerStepGenerator('url-should-have-param', {
      pattern: '(?:the )?URL should have (?:parameter|param) "([^"]*)" with value "([^"]*)"',
      type: 'Then',
      generator: this.generateUrlShouldHaveParam.bind(this),
      tags: ['navigation', 'verification', 'query'],
      metadata: { description: 'Verify URL parameter value' }
    })

    registerStepGenerator('url-should-not-have-param', {
      pattern: '(?:the )?URL should not have (?:parameter|param) "([^"]*)"',
      type: 'Then',
      generator: this.generateUrlShouldNotHaveParam.bind(this),
      tags: ['navigation', 'verification', 'query'],
      metadata: { description: 'Verify URL parameter absence' }
    })

    // Route metadata verification
    registerStepGenerator('page-title-should-be', {
      pattern: '(?:the )?page title should be "([^"]*)"',
      type: 'Then',
      generator: this.generatePageTitleShouldBe.bind(this),
      tags: ['navigation', 'verification', 'title'],
      metadata: { description: 'Verify page title' }
    })

    registerStepGenerator('page-should-have-meta', {
      pattern: '(?:the )?page should have meta (?:tag|property) "([^"]*)" with (?:content|value) "([^"]*)"',
      type: 'Then',
      generator: this.generatePageShouldHaveMeta.bind(this),
      tags: ['navigation', 'verification', 'meta'],
      metadata: { description: 'Verify page meta tag content' }
    })

    // Breadcrumb navigation
    registerStepGenerator('should-see-breadcrumb', {
      pattern: 'I should see (?:the )?breadcrumb "([^"]*)"',
      type: 'Then',
      generator: this.generateShouldSeeBreadcrumb.bind(this),
      tags: ['navigation', 'breadcrumb', 'verification'],
      metadata: { description: 'Verify breadcrumb presence' }
    })

    registerStepGenerator('click-breadcrumb', {
      pattern: 'I click (?:the )?breadcrumb "([^"]*)"',
      type: 'When',
      generator: this.generateClickBreadcrumb.bind(this),
      tags: ['navigation', 'breadcrumb', 'interaction'],
      metadata: { description: 'Click breadcrumb link' }
    })

    // Navigation menu interactions
    registerStepGenerator('open-menu', {
      pattern: 'I open (?:the )?(?:"([^"]*)"|([^"]*)) menu',
      type: 'When',
      generator: this.generateOpenMenu.bind(this),
      tags: ['navigation', 'menu', 'interaction'],
      metadata: { description: 'Open navigation menu' }
    })

    registerStepGenerator('close-menu', {
      pattern: 'I close (?:the )?(?:"([^"]*)"|([^"]*)) menu',
      type: 'When',
      generator: this.generateCloseMenu.bind(this),
      tags: ['navigation', 'menu', 'interaction'],
      metadata: { description: 'Close navigation menu' }
    })

    registerStepGenerator('click-menu-item', {
      pattern: 'I click (?:the )?(?:"([^"]*)"|([^"]*)) menu item',
      type: 'When',
      generator: this.generateClickMenuItem.bind(this),
      tags: ['navigation', 'menu', 'interaction'],
      metadata: { description: 'Click menu item' }
    })

    // Loading states
    registerStepGenerator('page-should-be-loading', {
      pattern: '(?:the )?page should be loading',
      type: 'Then',
      generator: this.generatePageShouldBeLoading.bind(this),
      tags: ['navigation', 'loading', 'verification'],
      metadata: { description: 'Verify page loading state' }
    })

    registerStepGenerator('page-should-finish-loading', {
      pattern: '(?:the )?page should finish loading',
      type: 'Then',
      generator: this.generatePageShouldFinishLoading.bind(this),
      tags: ['navigation', 'loading', 'verification'],
      metadata: { description: 'Verify page finished loading' }
    })
  }

  /**
   * Generate visit page step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateVisitPage(match, options) {
    const [, pageName1, pageName2] = match
    const pageName = pageName1 || pageName2
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.goto('/${this.pageNameToRoute(pageName)}')`
    }
    
    return `// For Nuxt routing tests
const router = useRouter()
await router.push('/${this.pageNameToRoute(pageName)}')`
  }

  /**
   * Generate visit URL step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateVisitUrl(match, options) {
    const [, url] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.goto('${url}')`
    }
    
    return `const router = useRouter()
await router.push('${url}')`
  }

  /**
   * Generate visit home step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateVisitHome(match, options) {
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.goto('/')`
    }
    
    return `const router = useRouter()
await router.push('/')`
  }

  /**
   * Generate visit page with parameter step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateVisitPageWithParam(match, options) {
    const [, pageName1, pageName2, paramValue] = match
    const pageName = pageName1 || pageName2
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.goto('/${this.pageNameToRoute(pageName)}/${paramValue}')`
    }
    
    return `const router = useRouter()
await router.push('/${this.pageNameToRoute(pageName)}/${paramValue}')`
  }

  /**
   * Generate visit page with query step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateVisitPageWithQuery(match, options) {
    const [, pageName1, pageName2, query] = match
    const pageName = pageName1 || pageName2
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.goto('/${this.pageNameToRoute(pageName)}?${query}')`
    }
    
    return `const router = useRouter()
await router.push({
  path: '/${this.pageNameToRoute(pageName)}',
  query: { ${this.parseQueryString(query)} }
})`
  }

  /**
   * Generate click navigate step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateClickNavigate(match, options) {
    const [, linkText1, linkText2] = match
    const linkText = linkText1 || linkText2
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `const currentUrl = page.url()
await page.getByRole('link', { name: '${linkText}' }).click()
await page.waitForURL(url => url !== currentUrl)`
    }
    
    return `const router = useRouter()
const currentRoute = router.currentRoute.value.fullPath
const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
await wrapper.find('a:contains("${linkText}")').trigger('click')
await nextTick()
expect(router.currentRoute.value.fullPath).not.toBe(currentRoute)`
  }

  /**
   * Generate go back step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateGoBack(match, options) {
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.goBack()`
    }
    
    return `const router = useRouter()
await router.back()`
  }

  /**
   * Generate go forward step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateGoForward(match, options) {
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.goForward()`
    }
    
    return `const router = useRouter()
await router.forward()`
  }

  /**
   * Generate refresh page step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateRefreshPage(match, options) {
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.reload()`
    }
    
    return `// For Nuxt component tests, remount component
const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
await wrapper.unmount()
await mount(Component, { global: { plugins: [createTestingPinia()] } })`
  }

  /**
   * Generate should be on page step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldBeOnPage(match, options) {
    const [, pageName1, pageName2] = match
    const pageName = pageName1 || pageName2
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await expect(page).toHaveURL(new RegExp('/${this.pageNameToRoute(pageName)}'))`
    }
    
    return `const router = useRouter()
expect(router.currentRoute.value.name).toBe('${this.pageNameToRoute(pageName)}')`
  }

  /**
   * Generate should be at URL step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldBeAtUrl(match, options) {
    const [, url] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await expect(page).toHaveURL('${url}')`
    }
    
    return `const router = useRouter()
expect(router.currentRoute.value.fullPath).toBe('${url}')`
  }

  /**
   * Generate URL should contain step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateUrlShouldContain(match, options) {
    const [, urlPart] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `expect(page.url()).toContain('${urlPart}')`
    }
    
    return `const router = useRouter()
expect(router.currentRoute.value.fullPath).toContain('${urlPart}')`
  }

  /**
   * Generate URL should not contain step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateUrlShouldNotContain(match, options) {
    const [, urlPart] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `expect(page.url()).not.toContain('${urlPart}')`
    }
    
    return `const router = useRouter()
expect(router.currentRoute.value.fullPath).not.toContain('${urlPart}')`
  }

  /**
   * Generate URL should have param step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateUrlShouldHaveParam(match, options) {
    const [, paramName, paramValue] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `const url = new URL(page.url())
expect(url.searchParams.get('${paramName}')).toBe('${paramValue}')`
    }
    
    return `const route = useRoute()
expect(route.query.${paramName}).toBe('${paramValue}')`
  }

  /**
   * Generate URL should not have param step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateUrlShouldNotHaveParam(match, options) {
    const [, paramName] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `const url = new URL(page.url())
expect(url.searchParams.has('${paramName}')).toBe(false)`
    }
    
    return `const route = useRoute()
expect(route.query.${paramName}).toBeUndefined()`
  }

  /**
   * Generate page title should be step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generatePageTitleShouldBe(match, options) {
    const [, title] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await expect(page).toHaveTitle('${title}')`
    }
    
    return `// For Nuxt head management
const head = useHead()
expect(document.title).toBe('${title}')`
  }

  /**
   * Generate page should have meta step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generatePageShouldHaveMeta(match, options) {
    const [, metaName, metaContent] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `const metaTag = await page.locator('meta[name="${metaName}"], meta[property="${metaName}"]')
await expect(metaTag).toHaveAttribute('content', '${metaContent}')`
    }
    
    return `const metaTag = document.querySelector('meta[name="${metaName}"], meta[property="${metaName}"]')
expect(metaTag?.getAttribute('content')).toBe('${metaContent}')`
  }

  /**
   * Generate should see breadcrumb step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateShouldSeeBreadcrumb(match, options) {
    const [, breadcrumbText] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await expect(page.locator('.breadcrumb, [data-testid="breadcrumb"]').getByText('${breadcrumbText}')).toBeVisible()`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const breadcrumb = wrapper.find('.breadcrumb, [data-testid="breadcrumb"]')
expect(breadcrumb.text()).toContain('${breadcrumbText}')`
  }

  /**
   * Generate click breadcrumb step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateClickBreadcrumb(match, options) {
    const [, breadcrumbText] = match
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.locator('.breadcrumb, [data-testid="breadcrumb"]').getByText('${breadcrumbText}').click()`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const breadcrumb = wrapper.find('.breadcrumb a, [data-testid="breadcrumb"] a').filter(el => 
  el.text().includes('${breadcrumbText}')
)
if (breadcrumb.length > 0) await breadcrumb.at(0).trigger('click')
else throw new Error('Breadcrumb "${breadcrumbText}" not found')`
  }

  /**
   * Generate open menu step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateOpenMenu(match, options) {
    const [, menuName1, menuName2] = match
    const menuName = menuName1 || menuName2
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.getByRole('button', { name: '${menuName}' }).click()
await expect(page.locator('[data-testid="${this.kebabCase(menuName)}-menu"]')).toBeVisible()`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const menuButton = wrapper.find('[data-testid="${this.kebabCase(menuName)}-button"]')
await menuButton.trigger('click')
expect(wrapper.find('[data-testid="${this.kebabCase(menuName)}-menu"]').isVisible()).toBe(true)`
  }

  /**
   * Generate close menu step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateCloseMenu(match, options) {
    const [, menuName1, menuName2] = match
    const menuName = menuName1 || menuName2
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.getByRole('button', { name: 'Close ${menuName}' }).click()
await expect(page.locator('[data-testid="${this.kebabCase(menuName)}-menu"]')).not.toBeVisible()`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const closeButton = wrapper.find('[data-testid="${this.kebabCase(menuName)}-close"]')
await closeButton.trigger('click')
expect(wrapper.find('[data-testid="${this.kebabCase(menuName)}-menu"]').isVisible()).toBe(false)`
  }

  /**
   * Generate click menu item step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateClickMenuItem(match, options) {
    const [, itemName1, itemName2] = match
    const itemName = itemName1 || itemName2
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await page.getByRole('menuitem', { name: '${itemName}' }).click()`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const menuItem = wrapper.find('[role="menuitem"]').filter(el => 
  el.text().includes('${itemName}')
)
if (menuItem.length > 0) await menuItem.at(0).trigger('click')
else throw new Error('Menu item "${itemName}" not found')`
  }

  /**
   * Generate page should be loading step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generatePageShouldBeLoading(match, options) {
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await expect(page.locator('[data-testid="loading"], .loading')).toBeVisible()`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
const loadingElement = wrapper.find('[data-testid="loading"], .loading')
expect(loadingElement.exists()).toBe(true)
expect(loadingElement.isVisible()).toBe(true)`
  }

  /**
   * Generate page should finish loading step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generatePageShouldFinishLoading(match, options) {
    const testRunner = options.testRunner || 'vitest'
    
    if (testRunner === 'playwright') {
      return `await expect(page.locator('[data-testid="loading"], .loading')).not.toBeVisible()`
    }
    
    return `const wrapper = mount(Component, { global: { plugins: [createTestingPinia()] } })
await nextTick()
const loadingElement = wrapper.find('[data-testid="loading"], .loading')
expect(loadingElement.exists()).toBe(false)`
  }

  /**
   * Convert page name to route format
   * @param {string} pageName - Human readable page name
   * @returns {string} Route format
   */
  pageNameToRoute(pageName) {
    return pageName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  /**
   * Parse query string into object format for router.push
   * @param {string} queryString - Query string like "key=value&key2=value2"
   * @returns {string} Object notation for Vue Router
   */
  parseQueryString(queryString) {
    const params = queryString.split('&')
    const queryObject = params.map(param => {
      const [key, value] = param.split('=')
      return `${key}: '${value}'`
    }).join(', ')
    return queryObject
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
}

export const navigationStepGenerator = new NavigationStepGenerator()