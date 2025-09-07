/**
 * @fileoverview Visual snapshot testing utilities for Nuxt components
 * Provides comprehensive snapshot generation and comparison capabilities
 */

import { render } from '@testing-library/vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import puppeteer from 'puppeteer'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * Visual snapshot test configuration
 * @typedef {Object} SnapshotConfig
 * @property {string} name - Snapshot name identifier
 * @property {Object} [viewport] - Viewport dimensions
 * @property {number} [threshold] - Pixel difference threshold (0-1)
 * @property {boolean} [fullPage] - Capture full page or viewport only
 * @property {string[]} [hiddenSelectors] - Elements to hide before snapshot
 * @property {Object} [animations] - Animation control settings
 * @property {number} [delay] - Wait time before capturing (ms)
 */

/**
 * Component render options for snapshot testing
 * @typedef {Object} RenderOptions
 * @property {Object} [props] - Component props
 * @property {Object} [slots] - Component slots
 * @property {Object} [global] - Global test configuration
 * @property {boolean} [attachToDocument] - Attach to document
 */

export class VisualSnapshotHelper {
  constructor() {
    this.browser = null
    this.page = null
    this.snapshotDir = 'tests/__snapshots__/visual'
    this.diffDir = 'tests/__snapshots__/diffs'
    this.tempDir = 'tests/__snapshots__/temp'
    this.defaultThreshold = 0.1
    this.defaultViewport = { width: 1280, height: 720 }
  }

  /**
   * Initialize browser for visual testing
   * @param {Object} [options] - Browser launch options
   * @returns {Promise<void>}
   */
  async init(options = {}) {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      ...options
    })

    this.page = await this.browser.newPage()
    await this.page.setViewport(this.defaultViewport)

    // Disable animations by default for consistent snapshots
    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    })

    // Create necessary directories
    await this.ensureDirectories()
  }

  /**
   * Create necessary directories for snapshots
   * @private
   */
  async ensureDirectories() {
    await fs.mkdir(this.snapshotDir, { recursive: true })
    await fs.mkdir(this.diffDir, { recursive: true })
    await fs.mkdir(this.tempDir, { recursive: true })
  }

  /**
   * Create visual snapshot of a Nuxt component
   * @param {Object} component - Vue component
   * @param {SnapshotConfig} config - Snapshot configuration
   * @param {RenderOptions} [renderOptions] - Component render options
   * @returns {Promise<{passed: boolean, diffPath?: string}>}
   */
  async snapshotComponent(component, config, renderOptions = {}) {
    const { name, viewport, threshold = this.defaultThreshold, ...snapConfig } = config
    
    if (!this.page) {
      throw new Error('VisualSnapshotHelper not initialized. Call init() first.')
    }

    // Set viewport if specified
    if (viewport) {
      await this.page.setViewport(viewport)
    }

    // Render component to HTML
    const html = await this.renderComponentToHTML(component, renderOptions)
    
    // Create full HTML page
    const fullHTML = this.wrapInHTML(html, config)
    
    // Set page content and wait for load
    await this.page.setContent(fullHTML, { waitUntil: 'networkidle0' })
    
    // Hide specified elements
    if (snapConfig.hiddenSelectors) {
      await this.hideElements(snapConfig.hiddenSelectors)
    }

    // Wait for specified delay
    if (snapConfig.delay) {
      await this.page.waitForTimeout(snapConfig.delay)
    }

    // Capture screenshot
    const screenshotOptions = {
      fullPage: snapConfig.fullPage || false,
      type: 'png'
    }

    const currentBuffer = await this.page.screenshot(screenshotOptions)
    
    // Compare with baseline
    return await this.compareSnapshot(name, currentBuffer, threshold)
  }

  /**
   * Render Vue component to HTML string
   * @param {Object} component - Vue component
   * @param {RenderOptions} options - Render options
   * @returns {Promise<string>}
   * @private
   */
  async renderComponentToHTML(component, options = {}) {
    const pinia = createPinia()
    const router = createRouter({
      history: createWebHistory(),
      routes: []
    })

    const renderOptions = {
      global: {
        plugins: [pinia, router],
        ...options.global
      },
      props: options.props || {},
      slots: options.slots || {},
      attachToDocument: options.attachToDocument || false
    }

    const { container } = render(component, renderOptions)
    return container.innerHTML
  }

  /**
   * Wrap component HTML in full HTML document
   * @param {string} componentHTML - Component HTML
   * @param {SnapshotConfig} config - Configuration
   * @returns {string}
   * @private
   */
  wrapInHTML(componentHTML, config) {
    const { viewport = this.defaultViewport } = config
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Visual Test</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: white;
          }
          .test-container {
            width: 100%;
            max-width: ${viewport.width}px;
          }
        </style>
      </head>
      <body>
        <div class="test-container">
          ${componentHTML}
        </div>
      </body>
      </html>
    `
  }

  /**
   * Hide elements by CSS selectors
   * @param {string[]} selectors - CSS selectors to hide
   * @private
   */
  async hideElements(selectors) {
    for (const selector of selectors) {
      await this.page.addStyleTag({
        content: `${selector} { visibility: hidden !important; }`
      })
    }
  }

  /**
   * Compare current snapshot with baseline
   * @param {string} name - Snapshot name
   * @param {Buffer} currentBuffer - Current screenshot buffer
   * @param {number} threshold - Difference threshold
   * @returns {Promise<{passed: boolean, diffPath?: string}>}
   * @private
   */
  async compareSnapshot(name, currentBuffer, threshold) {
    const baselinePath = path.join(this.snapshotDir, `${name}.png`)
    const currentPath = path.join(this.tempDir, `${name}-current.png`)
    const diffPath = path.join(this.diffDir, `${name}-diff.png`)

    // Save current screenshot
    await fs.writeFile(currentPath, currentBuffer)

    try {
      // Check if baseline exists
      const baselineBuffer = await fs.readFile(baselinePath)
      
      // Compare images
      const baseline = PNG.sync.read(baselineBuffer)
      const current = PNG.sync.read(currentBuffer)
      
      const { width, height } = baseline
      const diff = new PNG({ width, height })
      
      const pixelsDiff = pixelmatch(
        baseline.data,
        current.data,
        diff.data,
        width,
        height,
        { threshold }
      )
      
      const totalPixels = width * height
      const diffPercentage = (pixelsDiff / totalPixels) * 100
      
      if (diffPercentage > threshold * 100) {
        // Save diff image
        await fs.writeFile(diffPath, PNG.sync.write(diff))
        return { passed: false, diffPath, diffPercentage }
      }
      
      return { passed: true, diffPercentage }
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        // No baseline exists, create one
        await fs.writeFile(baselinePath, currentBuffer)
        return { passed: true, message: 'Baseline created' }
      }
      throw error
    }
  }

  /**
   * Update baseline snapshot
   * @param {string} name - Snapshot name
   * @param {Buffer} [imageBuffer] - New baseline buffer
   */
  async updateBaseline(name, imageBuffer) {
    const baselinePath = path.join(this.snapshotDir, `${name}.png`)
    
    if (imageBuffer) {
      await fs.writeFile(baselinePath, imageBuffer)
    } else {
      // Copy from current
      const currentPath = path.join(this.tempDir, `${name}-current.png`)
      const currentBuffer = await fs.readFile(currentPath)
      await fs.writeFile(baselinePath, currentBuffer)
    }
  }

  /**
   * Capture multiple snapshots with different states
   * @param {Object} component - Vue component
   * @param {Object[]} states - Array of state configurations
   * @param {SnapshotConfig} baseConfig - Base snapshot configuration
   * @returns {Promise<Object[]>}
   */
  async snapshotStates(component, states, baseConfig) {
    const results = []
    
    for (const state of states) {
      const config = { ...baseConfig, name: `${baseConfig.name}-${state.name}` }
      const renderOptions = { props: state.props, ...state.renderOptions }
      
      const result = await this.snapshotComponent(component, config, renderOptions)
      results.push({ state: state.name, ...result })
    }
    
    return results
  }

  /**
   * Capture interaction sequence snapshots
   * @param {Object} component - Vue component
   * @param {SnapshotConfig} config - Configuration
   * @param {Function[]} interactions - Array of interaction functions
   * @returns {Promise<Object[]>}
   */
  async snapshotInteractions(component, config, interactions) {
    const results = []
    
    // Initial state
    let result = await this.snapshotComponent(component, {
      ...config,
      name: `${config.name}-initial`
    })
    results.push({ step: 'initial', ...result })
    
    // Execute interactions and capture after each
    for (let i = 0; i < interactions.length; i++) {
      await interactions[i](this.page)
      
      // Wait a bit for changes to settle
      await this.page.waitForTimeout(100)
      
      const stepResult = await this.snapshotComponent(component, {
        ...config,
        name: `${config.name}-step-${i + 1}`
      })
      
      results.push({ step: i + 1, ...stepResult })
    }
    
    return results
  }

  /**
   * Clean up temporary files
   */
  async cleanup() {
    try {
      const tempFiles = await fs.readdir(this.tempDir)
      await Promise.all(
        tempFiles.map(file => fs.unlink(path.join(this.tempDir, file)))
      )
    } catch (error) {
      // Ignore cleanup errors
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
 * Helper function to create snapshot test
 * @param {string} testName - Test name
 * @param {Object} component - Vue component
 * @param {SnapshotConfig|SnapshotConfig[]} configs - Snapshot configurations
 * @param {RenderOptions} [renderOptions] - Render options
 * @returns {Promise<void>}
 */
export async function createSnapshotTest(testName, component, configs, renderOptions = {}) {
  const helper = new VisualSnapshotHelper()
  await helper.init()
  
  try {
    const configArray = Array.isArray(configs) ? configs : [configs]
    
    for (const config of configArray) {
      const result = await helper.snapshotComponent(component, config, renderOptions)
      
      if (!result.passed) {
        throw new Error(
          `Visual snapshot failed for ${config.name}. ` +
          `Diff: ${result.diffPercentage?.toFixed(2)}%. ` +
          `Diff image: ${result.diffPath}`
        )
      }
    }
  } finally {
    await helper.close()
  }
}

/**
 * Vitest integration helper
 * @param {string} name - Test name
 * @param {Function} testFn - Test function that receives snapshot helper
 */
export function visualTest(name, testFn) {
  test(name, async () => {
    const helper = new VisualSnapshotHelper()
    await helper.init()
    
    try {
      await testFn(helper)
    } finally {
      await helper.close()
    }
  })
}

export default VisualSnapshotHelper