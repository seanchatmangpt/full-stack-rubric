/**
 * Nuxt 4 SSR Testing Utilities
 * Comprehensive server-side rendering and hydration testing
 */

import { createRenderer } from 'vue/server-renderer'
import { JSDOM } from 'jsdom'

/**
 * Nuxt SSR Tester
 * Advanced server-side rendering and hydration testing
 */
export class NuxtSSRTester {
  /**
   * @param {Object} options - Tester configuration
   */
  constructor(options = {}) {
    this.options = {
      timeout: 10000,
      enableHydration: true,
      validateHydration: true,
      checkMetaTags: true,
      checkAccessibility: true,
      ...options
    }
    
    this.nuxtContext = null
    this.renderer = null
    this.serverResults = new Map()
    this.hydrationResults = new Map()
  }

  /**
   * Initialize SSR tester with Nuxt context
   * @param {Object} nuxtContext - Nuxt test context
   */
  initialize(nuxtContext) {
    this.nuxtContext = nuxtContext
    this.setupRenderer()
  }

  /**
   * Setup Vue server renderer
   * @private
   */
  setupRenderer() {
    this.renderer = createRenderer({
      runInNewContext: false
    })
  }

  /**
   * Test server-side rendering of a route
   * @param {string} route - Route to test
   * @param {Object} options - SSR test options
   * @returns {Promise<Object>} SSR test result
   */
  async testSSR(route, options = {}) {
    const testOptions = {
      userAgent: 'NuxtSSRTester/1.0',
      headers: {},
      cookies: {},
      viewport: { width: 1024, height: 768 },
      ...options
    }

    const startTime = performance.now()

    try {
      // Get server-rendered HTML
      const serverResult = await this.renderRoute(route, testOptions)
      
      // Analyze server result
      const analysis = await this.analyzeServerRender(serverResult, testOptions)
      
      // Test hydration if enabled
      let hydrationResult = null
      if (this.options.enableHydration) {
        hydrationResult = await this.testHydration(serverResult, route, testOptions)
      }

      const endTime = performance.now()

      const result = {
        success: true,
        route,
        serverRender: serverResult,
        analysis,
        hydration: hydrationResult,
        performance: {
          totalTime: endTime - startTime,
          serverRenderTime: serverResult.renderTime,
          hydrationTime: hydrationResult?.hydrationTime || 0
        }
      }

      // Store result for comparison
      this.serverResults.set(route, result)

      return result

    } catch (error) {
      return {
        success: false,
        route,
        error: error.message,
        performance: {
          totalTime: performance.now() - startTime
        }
      }
    }
  }

  /**
   * Render a route server-side
   * @param {string} route - Route to render
   * @param {Object} options - Render options
   * @returns {Promise<Object>} Server render result
   * @private
   */
  async renderRoute(route, options) {
    const renderStart = performance.now()

    // Create mock SSR context
    const ssrContext = {
      url: route,
      userAgent: options.userAgent,
      headers: options.headers,
      cookies: options.cookies,
      nuxt: {
        layout: 'default',
        data: [],
        fetch: {},
        error: null,
        serverRendered: true
      }
    }

    try {
      let html = ''
      
      if (this.nuxtContext?.renderRoute) {
        // Use Nuxt's built-in route rendering
        const renderResult = await this.nuxtContext.renderRoute(route, ssrContext)
        html = renderResult.html
        ssrContext.nuxt = { ...ssrContext.nuxt, ...renderResult.nuxt }
      } else {
        // Fallback to mock SSR rendering
        html = await this.mockServerRender(route, ssrContext)
      }

      const renderEnd = performance.now()

      return {
        html,
        context: ssrContext,
        renderTime: renderEnd - renderStart,
        route,
        timestamp: Date.now()
      }

    } catch (error) {
      throw new Error(`SSR rendering failed for route ${route}: ${error.message}`)
    }
  }

  /**
   * Mock server render for testing
   * @param {string} route - Route to render
   * @param {Object} context - SSR context
   * @returns {Promise<string>} Rendered HTML
   * @private
   */
  async mockServerRender(route, context) {
    // Basic mock SSR HTML structure
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Nuxt SSR Test - ${route}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="nuxt-ssr" content="true">
        </head>
        <body>
          <div id="__nuxt">
            <div class="nuxt-page" data-route="${route}">
              <h1>SSR Rendered Page: ${route}</h1>
              <p>Server rendered at: ${new Date().toISOString()}</p>
              <div class="nuxt-content">Mock server-side content</div>
            </div>
          </div>
          <script>
            window.__NUXT__ = ${JSON.stringify(context.nuxt)};
          </script>
        </body>
      </html>
    `
    
    return mockHtml.trim()
  }

  /**
   * Analyze server render result
   * @param {Object} serverResult - Server render result
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result
   * @private
   */
  async analyzeServerRender(serverResult, options) {
    const analysis = {
      isValidHTML: false,
      hasMetaTags: false,
      hasStructuredData: false,
      isAccessible: false,
      hasCriticalCss: false,
      performance: {},
      seo: {},
      accessibility: {},
      errors: [],
      warnings: []
    }

    try {
      // Parse HTML with JSDOM
      const dom = new JSDOM(serverResult.html)
      const document = dom.window.document

      // Validate HTML structure
      analysis.isValidHTML = this.validateHTMLStructure(document, analysis)

      // Check meta tags
      if (this.options.checkMetaTags) {
        analysis.hasMetaTags = this.checkMetaTags(document, analysis)
      }

      // Check accessibility
      if (this.options.checkAccessibility) {
        analysis.isAccessible = this.checkAccessibility(document, analysis)
      }

      // Analyze performance indicators
      analysis.performance = this.analyzePerformance(serverResult, document)

      // SEO analysis
      analysis.seo = this.analyzeSEO(document)

      // Check for critical CSS
      analysis.hasCriticalCss = document.querySelector('style[data-nuxt-critical]') !== null

      // Check for structured data
      analysis.hasStructuredData = this.checkStructuredData(document)

    } catch (error) {
      analysis.errors.push(`Analysis error: ${error.message}`)
    }

    return analysis
  }

  /**
   * Validate HTML structure
   * @param {Document} document - DOM document
   * @param {Object} analysis - Analysis object to update
   * @returns {boolean} Is valid HTML
   * @private
   */
  validateHTMLStructure(document, analysis) {
    let isValid = true
    const errors = []

    // Check for doctype
    if (!document.doctype) {
      errors.push('Missing DOCTYPE declaration')
      isValid = false
    }

    // Check for required elements
    const requiredElements = ['html', 'head', 'title', 'body']
    requiredElements.forEach(tag => {
      if (!document.querySelector(tag)) {
        errors.push(`Missing required element: <${tag}>`)
        isValid = false
      }
    })

    // Check for Nuxt app root
    const nuxtRoot = document.querySelector('#__nuxt')
    if (!nuxtRoot) {
      errors.push('Missing Nuxt app root element (#__nuxt)')
      isValid = false
    }

    // Check for proper nesting
    const bodyChildren = Array.from(document.body.children)
    const hasNonScriptElements = bodyChildren.some(el => 
      el.tagName !== 'SCRIPT' && el.tagName !== 'NOSCRIPT'
    )
    
    if (!hasNonScriptElements) {
      errors.push('Body contains only script elements')
      isValid = false
    }

    analysis.errors.push(...errors)
    return isValid
  }

  /**
   * Check meta tags for SEO
   * @param {Document} document - DOM document
   * @param {Object} analysis - Analysis object to update
   * @returns {boolean} Has proper meta tags
   * @private
   */
  checkMetaTags(document, analysis) {
    const metaTags = {
      title: !!document.querySelector('title'),
      description: !!document.querySelector('meta[name="description"]'),
      viewport: !!document.querySelector('meta[name="viewport"]'),
      charset: !!document.querySelector('meta[charset]'),
      ogTitle: !!document.querySelector('meta[property="og:title"]'),
      ogDescription: !!document.querySelector('meta[property="og:description"]'),
      ogImage: !!document.querySelector('meta[property="og:image"]')
    }

    const warnings = []
    
    if (!metaTags.title) warnings.push('Missing <title> tag')
    if (!metaTags.description) warnings.push('Missing meta description')
    if (!metaTags.viewport) warnings.push('Missing viewport meta tag')
    if (!metaTags.charset) warnings.push('Missing charset declaration')
    if (!metaTags.ogTitle) warnings.push('Missing Open Graph title')

    analysis.warnings.push(...warnings)
    analysis.seo.metaTags = metaTags

    return Object.values(metaTags).filter(Boolean).length >= 4
  }

  /**
   * Check accessibility compliance
   * @param {Document} document - DOM document
   * @param {Object} analysis - Analysis object to update
   * @returns {boolean} Is accessible
   * @private
   */
  checkAccessibility(document, analysis) {
    const accessibilityIssues = []
    
    // Check for alt text on images
    const images = Array.from(document.querySelectorAll('img'))
    const imagesWithoutAlt = images.filter(img => 
      !img.getAttribute('alt') && !img.getAttribute('aria-label')
    )
    
    if (imagesWithoutAlt.length > 0) {
      accessibilityIssues.push(`${imagesWithoutAlt.length} images missing alt text`)
    }

    // Check for form labels
    const inputs = Array.from(document.querySelectorAll('input, select, textarea'))
    const inputsWithoutLabels = inputs.filter(input => {
      const id = input.getAttribute('id')
      const hasLabel = id && document.querySelector(`label[for="${id}"]`)
      const hasAriaLabel = input.getAttribute('aria-label')
      return !hasLabel && !hasAriaLabel
    })

    if (inputsWithoutLabels.length > 0) {
      accessibilityIssues.push(`${inputsWithoutLabels.length} form inputs missing labels`)
    }

    // Check for heading structure
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    const h1Count = headings.filter(h => h.tagName === 'H1').length
    
    if (h1Count === 0) {
      accessibilityIssues.push('No H1 heading found')
    } else if (h1Count > 1) {
      accessibilityIssues.push('Multiple H1 headings found')
    }

    // Check for skip links
    const skipLink = document.querySelector('a[href="#main"], a[href="#content"]')
    if (!skipLink) {
      accessibilityIssues.push('No skip link found')
    }

    analysis.accessibility.issues = accessibilityIssues
    
    return accessibilityIssues.length === 0
  }

  /**
   * Analyze performance indicators
   * @param {Object} serverResult - Server render result
   * @param {Document} document - DOM document
   * @returns {Object} Performance analysis
   * @private
   */
  analyzePerformance(serverResult, document) {
    const performance = {
      renderTime: serverResult.renderTime,
      htmlSize: new Blob([serverResult.html]).size,
      resourceHints: {},
      criticalResources: []
    }

    // Check for resource hints
    performance.resourceHints = {
      preload: document.querySelectorAll('link[rel="preload"]').length,
      prefetch: document.querySelectorAll('link[rel="prefetch"]').length,
      preconnect: document.querySelectorAll('link[rel="preconnect"]').length,
      dnsPrefetch: document.querySelectorAll('link[rel="dns-prefetch"]').length
    }

    // Identify critical resources
    const criticalSelectors = [
      'link[rel="stylesheet"]',
      'script[src]',
      'img[loading="eager"]'
    ]

    criticalSelectors.forEach(selector => {
      const elements = Array.from(document.querySelectorAll(selector))
      performance.criticalResources.push(...elements.map(el => ({
        type: el.tagName.toLowerCase(),
        src: el.getAttribute('src') || el.getAttribute('href'),
        critical: true
      })))
    })

    return performance
  }

  /**
   * Analyze SEO factors
   * @param {Document} document - DOM document
   * @returns {Object} SEO analysis
   * @private
   */
  analyzeSEO(document) {
    const seo = {
      title: document.querySelector('title')?.textContent || '',
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      headings: {},
      internalLinks: 0,
      externalLinks: 0,
      structuredData: this.checkStructuredData(document)
    }

    // Analyze heading structure
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
      const elements = Array.from(document.querySelectorAll(tag))
      seo.headings[tag] = elements.map(el => el.textContent.trim())
    })

    // Count links
    const links = Array.from(document.querySelectorAll('a[href]'))
    links.forEach(link => {
      const href = link.getAttribute('href')
      if (href.startsWith('http')) {
        seo.externalLinks++
      } else if (href.startsWith('/') || href.startsWith('#')) {
        seo.internalLinks++
      }
    })

    return seo
  }

  /**
   * Check for structured data
   * @param {Document} document - DOM document
   * @returns {boolean} Has structured data
   * @private
   */
  checkStructuredData(document) {
    const jsonLd = document.querySelectorAll('script[type="application/ld+json"]')
    const microdata = document.querySelectorAll('[itemscope]')
    
    return jsonLd.length > 0 || microdata.length > 0
  }

  /**
   * Test hydration process
   * @param {Object} serverResult - Server render result
   * @param {string} route - Route being tested
   * @param {Object} options - Hydration test options
   * @returns {Promise<Object>} Hydration test result
   * @private
   */
  async testHydration(serverResult, route, options) {
    const hydrationStart = performance.now()

    try {
      // Create DOM from server HTML
      const dom = new JSDOM(serverResult.html, {
        runScripts: 'dangerously',
        pretendToBeVisual: true,
        resources: 'usable'
      })

      const document = dom.window.document
      const window = dom.window

      // Mock Vue hydration
      const hydrationResult = await this.simulateHydration(document, window, serverResult.context)

      const hydrationEnd = performance.now()

      const result = {
        success: hydrationResult.success,
        hydrationTime: hydrationEnd - hydrationStart,
        mismatches: hydrationResult.mismatches,
        errors: hydrationResult.errors,
        warnings: hydrationResult.warnings
      }

      // Store hydration result
      this.hydrationResults.set(route, result)

      return result

    } catch (error) {
      return {
        success: false,
        hydrationTime: performance.now() - hydrationStart,
        errors: [error.message]
      }
    }
  }

  /**
   * Simulate Vue hydration process
   * @param {Document} document - DOM document
   * @param {Window} window - DOM window
   * @param {Object} context - SSR context
   * @returns {Promise<Object>} Hydration simulation result
   * @private
   */
  async simulateHydration(document, window, context) {
    const result = {
      success: true,
      mismatches: [],
      errors: [],
      warnings: []
    }

    try {
      // Check for Nuxt payload
      const nuxtData = window.__NUXT__ || context.nuxt
      if (!nuxtData) {
        result.errors.push('Missing __NUXT__ data for hydration')
        result.success = false
        return result
      }

      // Find hydration root
      const appRoot = document.querySelector('#__nuxt')
      if (!appRoot) {
        result.errors.push('Missing app root element for hydration')
        result.success = false
        return result
      }

      // Simulate component hydration
      const components = Array.from(document.querySelectorAll('[data-server-rendered]'))
      
      for (const component of components) {
        const hydrationCheck = this.checkComponentHydration(component, nuxtData)
        
        if (!hydrationCheck.success) {
          result.mismatches.push({
            component: component.tagName,
            issues: hydrationCheck.issues
          })
        }
      }

      // Check for hydration warnings
      if (result.mismatches.length > 0) {
        result.warnings.push(`${result.mismatches.length} hydration mismatches detected`)
      }

    } catch (error) {
      result.errors.push(`Hydration simulation error: ${error.message}`)
      result.success = false
    }

    return result
  }

  /**
   * Check component hydration compatibility
   * @param {Element} component - Component element
   * @param {Object} nuxtData - Nuxt hydration data
   * @returns {Object} Hydration check result
   * @private
   */
  checkComponentHydration(component, nuxtData) {
    const issues = []
    
    // Check for dynamic content that might cause mismatches
    const timeElements = component.querySelectorAll('[data-time], .timestamp')
    if (timeElements.length > 0) {
      issues.push('Component contains time-based content that may cause hydration mismatches')
    }

    // Check for random content
    const randomElements = component.querySelectorAll('[data-random]')
    if (randomElements.length > 0) {
      issues.push('Component contains random content that may cause hydration mismatches')
    }

    // Check for client-only content
    const clientOnlyElements = component.querySelectorAll('[data-client-only]')
    if (clientOnlyElements.length > 0) {
      issues.push('Component contains client-only content')
    }

    return {
      success: issues.length === 0,
      issues
    }
  }

  /**
   * Compare multiple routes for consistency
   * @param {Array} routes - Routes to compare
   * @param {Object} options - Comparison options
   * @returns {Promise<Object>} Comparison result
   */
  async compareRoutes(routes, options = {}) {
    const results = []
    
    for (const route of routes) {
      const result = await this.testSSR(route, options)
      results.push(result)
    }

    const comparison = {
      routes: results,
      consistency: this.analyzeRouteConsistency(results),
      performance: this.compareRoutePerformance(results)
    }

    return comparison
  }

  /**
   * Analyze consistency across routes
   * @param {Array} results - Route test results
   * @returns {Object} Consistency analysis
   * @private
   */
  analyzeRouteConsistency(results) {
    const analysis = {
      allSuccessful: results.every(r => r.success),
      structureConsistency: true,
      metaTagConsistency: true,
      accessibilityConsistency: true,
      issues: []
    }

    // Check structure consistency
    const structures = results.map(r => {
      if (!r.success) return null
      const dom = new JSDOM(r.serverRender.html)
      return Array.from(dom.window.document.querySelectorAll('*')).map(el => el.tagName)
    }).filter(Boolean)

    if (structures.length > 1) {
      const baseStructure = structures[0]
      for (let i = 1; i < structures.length; i++) {
        if (JSON.stringify(structures[i]) !== JSON.stringify(baseStructure)) {
          analysis.structureConsistency = false
          analysis.issues.push(`Route ${i} has different DOM structure`)
        }
      }
    }

    return analysis
  }

  /**
   * Compare performance across routes
   * @param {Array} results - Route test results
   * @returns {Object} Performance comparison
   * @private
   */
  compareRoutePerformance(results) {
    const successful = results.filter(r => r.success)
    
    if (successful.length === 0) {
      return { error: 'No successful renders to compare' }
    }

    const renderTimes = successful.map(r => r.performance.serverRenderTime)
    const htmlSizes = successful.map(r => new Blob([r.serverRender.html]).size)

    return {
      renderTime: {
        min: Math.min(...renderTimes),
        max: Math.max(...renderTimes),
        average: renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length
      },
      htmlSize: {
        min: Math.min(...htmlSizes),
        max: Math.max(...htmlSizes),
        average: htmlSizes.reduce((a, b) => a + b, 0) / htmlSizes.length
      }
    }
  }

  /**
   * Generate comprehensive SSR test report
   * @param {Array} testResults - Test results to include
   * @returns {Object} Test report
   */
  generateReport(testResults) {
    const report = {
      summary: {
        totalTests: testResults.length,
        successful: testResults.filter(r => r.success).length,
        failed: testResults.filter(r => !r.success).length,
        averageRenderTime: 0,
        totalHydrationTests: 0,
        hydrationSuccessful: 0
      },
      results: testResults,
      performance: {},
      accessibility: {},
      seo: {},
      timestamp: new Date().toISOString()
    }

    // Calculate averages
    const successful = testResults.filter(r => r.success)
    if (successful.length > 0) {
      report.summary.averageRenderTime = 
        successful.reduce((sum, r) => sum + r.performance.serverRenderTime, 0) / successful.length

      // Hydration statistics
      const withHydration = successful.filter(r => r.hydration)
      report.summary.totalHydrationTests = withHydration.length
      report.summary.hydrationSuccessful = withHydration.filter(r => r.hydration.success).length
    }

    return report
  }

  /**
   * Cleanup SSR tester resources
   */
  async cleanup() {
    this.serverResults.clear()
    this.hydrationResults.clear()
    this.renderer = null
  }
}

/**
 * Global SSR tester instance
 */
let globalSSRTester = null

/**
 * Get or create global SSR tester
 * @param {Object} options - Tester options
 * @returns {NuxtSSRTester} Tester instance
 */
export function getSSRTester(options = {}) {
  if (!globalSSRTester) {
    globalSSRTester = new NuxtSSRTester(options)
  }
  return globalSSRTester
}

/**
 * Initialize SSR testing environment
 * @param {Object} nuxtContext - Nuxt test context
 * @param {Object} options - Tester options
 * @returns {NuxtSSRTester} Initialized tester
 */
export function initializeSSRTesting(nuxtContext, options = {}) {
  const tester = getSSRTester(options)
  tester.initialize(nuxtContext)
  return tester
}

/**
 * Quick SSR testing utility
 * @param {string} route - Route to test
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Test result
 */
export async function testNuxtSSR(route, options = {}) {
  const tester = getSSRTester()
  return await tester.testSSR(route, options)
}