/**
 * @fileoverview Responsive design visual testing helpers
 * Multi-breakpoint testing and responsive behavior validation
 */

import puppeteer from 'puppeteer'
import { VisualSnapshotHelper } from './snapshot-helpers.js'
import { VisualDiffTool } from './diff-tools.js'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * Breakpoint configuration
 * @typedef {Object} Breakpoint
 * @property {string} name - Breakpoint name (mobile, tablet, desktop, etc.)
 * @property {number} width - Viewport width
 * @property {number} height - Viewport height
 * @property {string} [userAgent] - Custom user agent string
 * @property {number} [deviceScaleFactor] - Device scale factor
 * @property {boolean} [isMobile] - Mobile device flag
 * @property {boolean} [hasTouch] - Touch support flag
 */

/**
 * Responsive test configuration
 * @typedef {Object} ResponsiveTestConfig
 * @property {string} name - Test name
 * @property {Breakpoint[]} [breakpoints] - Custom breakpoints
 * @property {boolean} [captureScrollStates] - Capture different scroll positions
 * @property {boolean} [testInteractions] - Test responsive interactions
 * @property {number} [threshold] - Visual comparison threshold
 * @property {boolean} [generateReport] - Generate HTML report
 * @property {string[]} [testStates] - Component states to test
 */

/**
 * Responsive interaction test
 * @typedef {Object} InteractionTest
 * @property {string} name - Interaction name
 * @property {Function} action - Action to perform
 * @property {string[]} breakpoints - Breakpoints to test on
 * @property {number} [delay] - Delay after interaction (ms)
 */

export class ResponsiveTestHelper {
  constructor() {
    this.browser = null
    this.pages = new Map() // breakpoint -> page
    this.snapshotHelper = new VisualSnapshotHelper()
    this.diffTool = new VisualDiffTool()
    
    // Common breakpoints
    this.defaultBreakpoints = [
      {
        name: 'mobile-portrait',
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
      },
      {
        name: 'mobile-landscape',
        width: 667,
        height: 375,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
      },
      {
        name: 'tablet-portrait',
        width: 768,
        height: 1024,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
      },
      {
        name: 'tablet-landscape',
        width: 1024,
        height: 768,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
      },
      {
        name: 'desktop-small',
        width: 1280,
        height: 720,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false
      },
      {
        name: 'desktop-medium',
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false
      },
      {
        name: 'desktop-large',
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false
      },
      {
        name: 'desktop-xl',
        width: 2560,
        height: 1440,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false
      }
    ]

    this.outputDir = 'tests/__snapshots__/responsive'
  }

  /**
   * Initialize responsive testing environment
   * @param {Object} [options] - Browser launch options
   */
  async init(options = {}) {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
      ...options
    })

    await fs.mkdir(this.outputDir, { recursive: true })
    await this.snapshotHelper.init()
  }

  /**
   * Create pages for each breakpoint
   * @param {Breakpoint[]} breakpoints - Breakpoints to create pages for
   * @private
   */
  async createBreakpointPages(breakpoints) {
    for (const breakpoint of breakpoints) {
      if (!this.pages.has(breakpoint.name)) {
        const page = await this.browser.newPage()
        
        // Set viewport and device properties
        await page.setViewport({
          width: breakpoint.width,
          height: breakpoint.height,
          deviceScaleFactor: breakpoint.deviceScaleFactor || 1,
          isMobile: breakpoint.isMobile || false,
          hasTouch: breakpoint.hasTouch || false
        })

        // Set user agent if specified
        if (breakpoint.userAgent) {
          await page.setUserAgent(breakpoint.userAgent)
        }

        // Disable animations for consistent snapshots
        await page.addStyleTag({
          content: `
            *, *::before, *::after {
              animation-duration: 0s !important;
              animation-delay: 0s !important;
              transition-duration: 0s !important;
              transition-delay: 0s !important;
            }
          `
        })

        this.pages.set(breakpoint.name, page)
      }
    }
  }

  /**
   * Test component across multiple breakpoints
   * @param {Object} component - Vue component
   * @param {ResponsiveTestConfig} config - Test configuration
   * @param {Object} [renderOptions] - Component render options
   * @returns {Promise<Object>}
   */
  async testResponsive(component, config, renderOptions = {}) {
    const { 
      name, 
      breakpoints = this.defaultBreakpoints,
      captureScrollStates = false,
      testInteractions = false,
      threshold = 0.1,
      generateReport = true,
      testStates = ['default']
    } = config

    await this.createBreakpointPages(breakpoints)

    const results = {
      testName: name,
      breakpoints: [],
      interactions: [],
      scrollStates: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0
      }
    }

    // Test each state across breakpoints
    for (const stateName of testStates) {
      const stateRenderOptions = {
        ...renderOptions,
        ...(renderOptions.states?.[stateName] || {})
      }

      for (const breakpoint of breakpoints) {
        const breakpointResult = await this.testBreakpoint(
          component,
          breakpoint,
          `${name}-${stateName}-${breakpoint.name}`,
          stateRenderOptions,
          threshold
        )

        results.breakpoints.push({
          breakpoint: breakpoint.name,
          state: stateName,
          ...breakpointResult
        })

        results.summary.totalTests++
        if (breakpointResult.passed) {
          results.summary.passed++
        } else {
          results.summary.failed++
        }
      }
    }

    // Test scroll states if enabled
    if (captureScrollStates) {
      const scrollResults = await this.testScrollStates(component, breakpoints, name, renderOptions)
      results.scrollStates = scrollResults
      
      scrollResults.forEach(result => {
        results.summary.totalTests++
        if (result.passed) {
          results.summary.passed++
        } else {
          results.summary.failed++
        }
      })
    }

    // Test interactions if enabled
    if (testInteractions && config.interactions) {
      const interactionResults = await this.testInteractions(
        component, 
        breakpoints, 
        config.interactions, 
        name, 
        renderOptions
      )
      results.interactions = interactionResults
      
      interactionResults.forEach(result => {
        results.summary.totalTests++
        if (result.passed) {
          results.summary.passed++
        } else {
          results.summary.failed++
        }
      })
    }

    // Generate report if requested
    if (generateReport) {
      await this.generateResponsiveReport(results)
    }

    return results
  }

  /**
   * Test component on a specific breakpoint
   * @param {Object} component - Vue component
   * @param {Breakpoint} breakpoint - Breakpoint configuration
   * @param {string} testName - Test name
   * @param {Object} renderOptions - Render options
   * @param {number} threshold - Comparison threshold
   * @returns {Promise<Object>}
   * @private
   */
  async testBreakpoint(component, breakpoint, testName, renderOptions, threshold) {
    const page = this.pages.get(breakpoint.name)
    
    // Render component HTML
    const html = await this.snapshotHelper.renderComponentToHTML(component, renderOptions)
    const fullHTML = this.createResponsiveHTML(html, breakpoint)
    
    await page.setContent(fullHTML, { waitUntil: 'networkidle0' })
    
    // Wait for any dynamic content
    await page.waitForTimeout(500)
    
    // Capture screenshot
    const screenshot = await page.screenshot({
      fullPage: true,
      type: 'png'
    })
    
    // Compare with baseline
    const baselinePath = path.join(this.outputDir, `${testName}.png`)
    
    try {
      const diffResult = await this.diffTool.compareImages(
        baselinePath, 
        screenshot, 
        { threshold }
      )
      
      if (!diffResult.passed) {
        // Save current screenshot and diff
        const currentPath = path.join(this.outputDir, `${testName}-current.png`)
        await fs.writeFile(currentPath, screenshot)
        
        if (diffResult.diffImageBuffer) {
          const diffPath = path.join(this.outputDir, `${testName}-diff.png`)
          await fs.writeFile(diffPath, diffResult.diffImageBuffer)
        }
      }
      
      return {
        passed: diffResult.passed,
        diffPercentage: diffResult.diffPercentage,
        dimensions: diffResult.dimensions,
        viewport: `${breakpoint.width}x${breakpoint.height}`
      }
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create baseline
        await fs.writeFile(baselinePath, screenshot)
        return {
          passed: true,
          baseline: true,
          viewport: `${breakpoint.width}x${breakpoint.height}`
        }
      }
      throw error
    }
  }

  /**
   * Test different scroll positions
   * @param {Object} component - Vue component
   * @param {Breakpoint[]} breakpoints - Breakpoints to test
   * @param {string} baseName - Base test name
   * @param {Object} renderOptions - Render options
   * @returns {Promise<Array>}
   * @private
   */
  async testScrollStates(component, breakpoints, baseName, renderOptions) {
    const scrollPositions = [
      { name: 'top', y: 0 },
      { name: 'middle', y: 0.5 },
      { name: 'bottom', y: 1 }
    ]

    const results = []

    for (const breakpoint of breakpoints) {
      const page = this.pages.get(breakpoint.name)
      
      // Set up long content for scrolling
      const html = await this.snapshotHelper.renderComponentToHTML(component, renderOptions)
      const scrollableHTML = this.createScrollableHTML(html, breakpoint)
      
      await page.setContent(scrollableHTML, { waitUntil: 'networkidle0' })

      for (const position of scrollPositions) {
        // Calculate scroll position
        const documentHeight = await page.evaluate(() => document.body.scrollHeight)
        const viewportHeight = breakpoint.height
        const maxScroll = Math.max(0, documentHeight - viewportHeight)
        const scrollY = position.name === 'middle' ? maxScroll * 0.5 : 
                       position.name === 'bottom' ? maxScroll : 0

        await page.evaluate((y) => window.scrollTo(0, y), scrollY)
        await page.waitForTimeout(200)

        const screenshot = await page.screenshot({ type: 'png' })
        const testName = `${baseName}-${breakpoint.name}-scroll-${position.name}`
        
        // Compare with baseline (simplified comparison)
        try {
          const baselinePath = path.join(this.outputDir, `${testName}.png`)
          const diffResult = await this.diffTool.compareImages(baselinePath, screenshot)
          
          results.push({
            breakpoint: breakpoint.name,
            scrollPosition: position.name,
            passed: diffResult.passed,
            diffPercentage: diffResult.diffPercentage
          })
          
        } catch (error) {
          if (error.code === 'ENOENT') {
            const baselinePath = path.join(this.outputDir, `${testName}.png`)
            await fs.writeFile(baselinePath, screenshot)
            results.push({
              breakpoint: breakpoint.name,
              scrollPosition: position.name,
              passed: true,
              baseline: true
            })
          }
        }
      }
    }

    return results
  }

  /**
   * Test responsive interactions
   * @param {Object} component - Vue component
   * @param {Breakpoint[]} breakpoints - Breakpoints to test
   * @param {InteractionTest[]} interactions - Interactions to test
   * @param {string} baseName - Base test name
   * @param {Object} renderOptions - Render options
   * @returns {Promise<Array>}
   * @private
   */
  async testInteractions(component, breakpoints, interactions, baseName, renderOptions) {
    const results = []

    for (const interaction of interactions) {
      for (const breakpointName of interaction.breakpoints) {
        const breakpoint = this.defaultBreakpoints.find(bp => bp.name === breakpointName)
        if (!breakpoint) continue

        const page = this.pages.get(breakpoint.name)
        
        // Set up component
        const html = await this.snapshotHelper.renderComponentToHTML(component, renderOptions)
        const fullHTML = this.createResponsiveHTML(html, breakpoint)
        
        await page.setContent(fullHTML, { waitUntil: 'networkidle0' })
        
        // Perform interaction
        await interaction.action(page)
        
        if (interaction.delay) {
          await page.waitForTimeout(interaction.delay)
        }
        
        // Capture result
        const screenshot = await page.screenshot({ type: 'png' })
        const testName = `${baseName}-${breakpoint.name}-${interaction.name}`
        
        try {
          const baselinePath = path.join(this.outputDir, `${testName}.png`)
          const diffResult = await this.diffTool.compareImages(baselinePath, screenshot)
          
          results.push({
            interaction: interaction.name,
            breakpoint: breakpoint.name,
            passed: diffResult.passed,
            diffPercentage: diffResult.diffPercentage
          })
          
        } catch (error) {
          if (error.code === 'ENOENT') {
            const baselinePath = path.join(this.outputDir, `${testName}.png`)
            await fs.writeFile(baselinePath, screenshot)
            results.push({
              interaction: interaction.name,
              breakpoint: breakpoint.name,
              passed: true,
              baseline: true
            })
          }
        }
      }
    }

    return results
  }

  /**
   * Create HTML wrapper for responsive testing
   * @param {string} componentHTML - Component HTML
   * @param {Breakpoint} breakpoint - Breakpoint configuration
   * @returns {string}
   * @private
   */
  createResponsiveHTML(componentHTML, breakpoint) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Responsive Test - ${breakpoint.name}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: white;
            width: 100%;
            min-height: 100vh;
          }
          .responsive-container {
            width: 100%;
            max-width: ${breakpoint.width}px;
            margin: 0 auto;
          }
          /* Common responsive patterns */
          @media (max-width: 768px) {
            body { padding: 10px; }
            .responsive-container { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="responsive-container">
          ${componentHTML}
        </div>
      </body>
      </html>
    `
  }

  /**
   * Create scrollable HTML for scroll testing
   * @param {string} componentHTML - Component HTML
   * @param {Breakpoint} breakpoint - Breakpoint configuration
   * @returns {string}
   * @private
   */
  createScrollableHTML(componentHTML, breakpoint) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Scroll Test - ${breakpoint.name}</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: white;
          }
          .scroll-spacer {
            height: 500px;
            background: linear-gradient(to bottom, #f0f0f0, #e0e0e0);
            margin: 20px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="scroll-spacer">Content above component</div>
        ${componentHTML}
        <div class="scroll-spacer">Content below component</div>
        <div class="scroll-spacer">More content for scrolling</div>
      </body>
      </html>
    `
  }

  /**
   * Generate comprehensive responsive test report
   * @param {Object} results - Test results
   * @private
   */
  async generateResponsiveReport(results) {
    const reportHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Responsive Test Report - ${results.testName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { 
            background: ${results.summary.failed === 0 ? '#d4edda' : '#f8d7da'}; 
            padding: 20px; border-radius: 8px; margin-bottom: 30px; 
          }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
          .metric { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
          .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
          .section { margin: 30px 0; }
          .breakpoint-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; }
          .breakpoint-card { 
            background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; 
            ${results.summary.failed > 0 ? 'border-left: 4px solid #dc3545;' : 'border-left: 4px solid #28a745;'}
          }
          .passed { color: #28a745; }
          .failed { color: #dc3545; }
          .baseline { color: #ffc107; }
          .viewport { font-family: monospace; background: #f8f9fa; padding: 2px 6px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Responsive Test Report: ${results.testName}</h1>
          <p>Test completed at ${new Date().toISOString()}</p>
        </div>

        <div class="summary">
          <div class="metric">
            <div>Total Tests</div>
            <div class="metric-value">${results.summary.totalTests}</div>
          </div>
          <div class="metric">
            <div>Passed</div>
            <div class="metric-value passed">${results.summary.passed}</div>
          </div>
          <div class="metric">
            <div>Failed</div>
            <div class="metric-value failed">${results.summary.failed}</div>
          </div>
        </div>

        <div class="section">
          <h2>Breakpoint Tests</h2>
          <div class="breakpoint-grid">
            ${results.breakpoints.map(bp => `
              <div class="breakpoint-card">
                <h3>${bp.breakpoint} - ${bp.state}</h3>
                <p><span class="viewport">${bp.viewport}</span></p>
                <p class="${bp.baseline ? 'baseline' : bp.passed ? 'passed' : 'failed'}">
                  ${bp.baseline ? '📝 Baseline Created' : bp.passed ? '✅ Passed' : '❌ Failed'}
                </p>
                ${bp.diffPercentage ? `<p>Difference: ${bp.diffPercentage.toFixed(2)}%</p>` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        ${results.scrollStates.length > 0 ? `
          <div class="section">
            <h2>Scroll State Tests</h2>
            <div class="breakpoint-grid">
              ${results.scrollStates.map(scroll => `
                <div class="breakpoint-card">
                  <h3>${scroll.breakpoint} - ${scroll.scrollPosition}</h3>
                  <p class="${scroll.baseline ? 'baseline' : scroll.passed ? 'passed' : 'failed'}">
                    ${scroll.baseline ? '📝 Baseline Created' : scroll.passed ? '✅ Passed' : '❌ Failed'}
                  </p>
                  ${scroll.diffPercentage ? `<p>Difference: ${scroll.diffPercentage.toFixed(2)}%</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${results.interactions.length > 0 ? `
          <div class="section">
            <h2>Interaction Tests</h2>
            <div class="breakpoint-grid">
              ${results.interactions.map(interaction => `
                <div class="breakpoint-card">
                  <h3>${interaction.interaction} on ${interaction.breakpoint}</h3>
                  <p class="${interaction.baseline ? 'baseline' : interaction.passed ? 'passed' : 'failed'}">
                    ${interaction.baseline ? '📝 Baseline Created' : interaction.passed ? '✅ Passed' : '❌ Failed'}
                  </p>
                  ${interaction.diffPercentage ? `<p>Difference: ${interaction.diffPercentage.toFixed(2)}%</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </body>
      </html>
    `

    const reportPath = path.join(this.outputDir, `${results.testName}-responsive-report.html`)
    await fs.writeFile(reportPath, reportHTML)
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    for (const page of this.pages.values()) {
      await page.close()
    }
    this.pages.clear()
    
    if (this.snapshotHelper) {
      await this.snapshotHelper.close()
    }
  }

  /**
   * Close browser and cleanup
   */
  async close() {
    await this.cleanup()
    if (this.browser) {
      await this.browser.close()
    }
  }
}

/**
 * Test component responsiveness across breakpoints
 * @param {string} testName - Test name
 * @param {Object} component - Vue component
 * @param {ResponsiveTestConfig} config - Test configuration
 * @param {Object} [renderOptions] - Render options
 * @returns {Promise<Object>}
 */
export async function testResponsiveComponent(testName, component, config = {}, renderOptions = {}) {
  const helper = new ResponsiveTestHelper()
  await helper.init()

  try {
    const results = await helper.testResponsive(
      component,
      { name: testName, ...config },
      renderOptions
    )

    if (results.summary.failed > 0) {
      throw new Error(
        `Responsive tests failed: ${results.summary.failed}/${results.summary.totalTests} tests failed. ` +
        `Check the report at tests/__snapshots__/responsive/${testName}-responsive-report.html`
      )
    }

    return results
  } finally {
    await helper.close()
  }
}

/**
 * Quick responsive test with default breakpoints
 * @param {string} testName - Test name
 * @param {Object} component - Vue component
 * @param {string[]} [breakpointNames] - Specific breakpoints to test
 * @returns {Promise<Object>}
 */
export async function quickResponsiveTest(testName, component, breakpointNames = ['mobile-portrait', 'tablet-portrait', 'desktop-medium']) {
  const helper = new ResponsiveTestHelper()
  const breakpoints = helper.defaultBreakpoints.filter(bp => breakpointNames.includes(bp.name))
  
  return await testResponsiveComponent(testName, component, { breakpoints })
}

export default ResponsiveTestHelper