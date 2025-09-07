/**
 * @fileoverview Component gallery snapshot generation utilities
 * Automated component documentation and visual regression testing
 */

import { VisualSnapshotHelper } from './snapshot-helpers.js'
import { ResponsiveTestHelper } from './responsive-testing.js'
import { ThemeTestHelper } from './theme-testing.js'
import { promises as fs } from 'fs'
import path from 'path'
import { glob } from 'glob'

/**
 * Component documentation
 * @typedef {Object} ComponentDoc
 * @property {string} name - Component name
 * @property {string} [description] - Component description
 * @property {Object[]} [props] - Component props
 * @property {Object[]} [slots] - Component slots
 * @property {Object[]} [events] - Component events
 * @property {string[]} [examples] - Usage examples
 */

/**
 * Gallery configuration
 * @typedef {Object} GalleryConfig
 * @property {string} name - Gallery name
 * @property {string} [description] - Gallery description
 * @property {Object[]} components - Components to include
 * @property {string[]} [themes] - Themes to showcase
 * @property {string[]} [breakpoints] - Breakpoints to test
 * @property {boolean} [includeInteractive] - Include interactive examples
 * @property {boolean} [includeCode] - Include code examples
 * @property {string} outputDir - Output directory
 * @property {Object} [branding] - Branding configuration
 */

/**
 * Component variant configuration
 * @typedef {Object} ComponentVariant
 * @property {string} name - Variant name
 * @property {Object} props - Component props for this variant
 * @property {Object} [slots] - Component slots
 * @property {string} [description] - Variant description
 * @property {boolean} [responsive] - Test responsively
 * @property {string[]} [themes] - Specific themes for this variant
 */

export class ComponentGalleryGenerator {
  constructor() {
    this.snapshotHelper = new VisualSnapshotHelper()
    this.responsiveHelper = new ResponsiveTestHelper()
    this.themeHelper = new ThemeTestHelper()
    
    this.defaultThemes = ['light', 'dark']
    this.defaultBreakpoints = ['mobile-portrait', 'tablet-portrait', 'desktop-medium']
  }

  /**
   * Initialize gallery generator
   * @param {Object} [options] - Initialization options
   */
  async init(options = {}) {
    await this.snapshotHelper.init(options)
    await this.responsiveHelper.init(options)
    await this.themeHelper.init(options)
  }

  /**
   * Generate complete component gallery
   * @param {GalleryConfig} config - Gallery configuration
   * @returns {Promise<Object>}
   */
  async generateGallery(config) {
    const {
      name,
      description = '',
      components,
      themes = this.defaultThemes,
      breakpoints = this.defaultBreakpoints,
      includeInteractive = false,
      includeCode = true,
      outputDir,
      branding = {}
    } = config

    // Create output directories
    await fs.mkdir(outputDir, { recursive: true })
    await fs.mkdir(path.join(outputDir, 'images'), { recursive: true })
    await fs.mkdir(path.join(outputDir, 'components'), { recursive: true })

    const results = {
      galleryName: name,
      components: [],
      themes: [],
      breakpoints: [],
      summary: {
        totalComponents: components.length,
        totalVariants: 0,
        totalSnapshots: 0,
        generatedAt: new Date().toISOString()
      }
    }

    // Process each component
    for (const componentConfig of components) {
      const componentResult = await this.generateComponentGallery(
        componentConfig,
        { themes, breakpoints, includeInteractive, outputDir }
      )
      
      results.components.push(componentResult)
      results.summary.totalVariants += componentResult.variants.length
      results.summary.totalSnapshots += componentResult.snapshots.length
    }

    // Generate main gallery HTML
    const galleryHTML = await this.generateGalleryHTML(results, config)
    await fs.writeFile(path.join(outputDir, 'index.html'), galleryHTML)

    // Generate CSS styles
    const galleryCSS = this.generateGalleryCSS(themes)
    await fs.writeFile(path.join(outputDir, 'gallery.css'), galleryCSS)

    // Generate JavaScript for interactivity
    if (includeInteractive) {
      const galleryJS = this.generateGalleryJS()
      await fs.writeFile(path.join(outputDir, 'gallery.js'), galleryJS)
    }

    // Copy component source files if requested
    if (includeCode) {
      await this.copyComponentSources(components, path.join(outputDir, 'components'))
    }

    return results
  }

  /**
   * Generate gallery for a single component
   * @param {Object} componentConfig - Component configuration
   * @param {Object} options - Generation options
   * @returns {Promise<Object>}
   * @private
   */
  async generateComponentGallery(componentConfig, options) {
    const { component, name, variants = [], documentation = {} } = componentConfig
    const { themes, breakpoints, outputDir } = options

    const result = {
      name,
      documentation,
      variants: [],
      snapshots: [],
      themes: [],
      breakpoints: []
    }

    // Generate snapshots for each variant
    for (const variant of variants) {
      const variantResult = await this.generateVariantSnapshots(
        component,
        variant,
        themes,
        breakpoints,
        outputDir
      )
      
      result.variants.push(variantResult)
      result.snapshots.push(...variantResult.snapshots)
    }

    // Test component across themes if not variant-specific
    for (const themeName of themes) {
      if (!result.themes.includes(themeName)) {
        result.themes.push(themeName)
      }
    }

    // Test component across breakpoints
    for (const breakpointName of breakpoints) {
      if (!result.breakpoints.includes(breakpointName)) {
        result.breakpoints.push(breakpointName)
      }
    }

    return result
  }

  /**
   * Generate snapshots for component variant
   * @param {Object} component - Vue component
   * @param {ComponentVariant} variant - Variant configuration
   * @param {string[]} themes - Themes to test
   * @param {string[]} breakpoints - Breakpoints to test
   * @param {string} outputDir - Output directory
   * @returns {Promise<Object>}
   * @private
   */
  async generateVariantSnapshots(component, variant, themes, breakpoints, outputDir) {
    const { name, props = {}, slots = {}, description = '', responsive = true } = variant
    const variantThemes = variant.themes || themes

    const result = {
      name,
      description,
      props,
      slots,
      snapshots: [],
      responsive: responsive,
      themes: variantThemes
    }

    const renderOptions = {
      props,
      slots: Object.entries(slots).map(([name, content]) => ({ name, content }))
    }

    // Generate snapshots for each theme
    for (const themeName of variantThemes) {
      const themeConfig = this.themeHelper.defaultThemes.find(t => t.name === themeName) || 
                         this.themeHelper.defaultThemes[0]

      if (responsive) {
        // Generate responsive snapshots
        for (const breakpointName of breakpoints) {
          const breakpoint = this.responsiveHelper.defaultBreakpoints.find(bp => bp.name === breakpointName)
          if (!breakpoint) continue

          const snapshotName = `${name}-${themeName}-${breakpointName}`
          const imagePath = path.join('images', `${snapshotName}.png`)
          const fullImagePath = path.join(outputDir, imagePath)

          try {
            // Create themed and responsive snapshot
            const html = await this.createThemedResponsiveHTML(
              component,
              renderOptions,
              themeConfig,
              breakpoint
            )

            const screenshot = await this.captureComponentScreenshot(
              html,
              breakpoint,
              { delay: 300 }
            )

            await fs.writeFile(fullImagePath, screenshot)

            result.snapshots.push({
              name: snapshotName,
              theme: themeName,
              breakpoint: breakpointName,
              imagePath,
              responsive: true,
              viewport: `${breakpoint.width}x${breakpoint.height}`
            })

          } catch (error) {
            console.warn(`Failed to generate snapshot ${snapshotName}:`, error.message)
          }
        }
      } else {
        // Generate single desktop snapshot
        const snapshotName = `${name}-${themeName}`
        const imagePath = path.join('images', `${snapshotName}.png`)
        const fullImagePath = path.join(outputDir, imagePath)

        try {
          const html = await this.createThemedHTML(component, renderOptions, themeConfig)
          const screenshot = await this.captureComponentScreenshot(html, null, { delay: 300 })

          await fs.writeFile(fullImagePath, screenshot)

          result.snapshots.push({
            name: snapshotName,
            theme: themeName,
            imagePath,
            responsive: false,
            viewport: '1280x720'
          })

        } catch (error) {
          console.warn(`Failed to generate snapshot ${snapshotName}:`, error.message)
        }
      }
    }

    return result
  }

  /**
   * Create themed and responsive HTML for component
   * @param {Object} component - Vue component
   * @param {Object} renderOptions - Render options
   * @param {Object} themeConfig - Theme configuration
   * @param {Object} breakpoint - Breakpoint configuration
   * @returns {Promise<string>}
   * @private
   */
  async createThemedResponsiveHTML(component, renderOptions, themeConfig, breakpoint) {
    const componentHTML = await this.snapshotHelper.renderComponentToHTML(component, renderOptions)
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Component Gallery - ${themeConfig.name} - ${breakpoint.name}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: ${themeConfig.colors.background};
            color: ${themeConfig.colors.text};
            min-height: 100vh;
            width: 100%;
          }
          .gallery-container {
            max-width: ${breakpoint.width}px;
            margin: 0 auto;
            background: ${themeConfig.colors.surface || themeConfig.colors.background};
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          
          /* Theme variables */
          :root {
            ${Object.entries(themeConfig.cssVariables || {}).map(([key, value]) => `${key}: ${value};`).join('\n    ')}
          }
          
          /* Responsive adjustments */
          @media (max-width: 768px) {
            body { padding: 10px; }
            .gallery-container { padding: 15px; border-radius: 0; }
          }
          
          @media (max-width: 480px) {
            body { padding: 5px; }
            .gallery-container { padding: 10px; }
          }

          /* Component styling */
          ${this.getComponentCSS(themeConfig)}
        </style>
      </head>
      <body>
        <div class="gallery-container ${themeConfig.cssClass || ''}">
          ${componentHTML}
        </div>
      </body>
      </html>
    `
  }

  /**
   * Create themed HTML for component
   * @param {Object} component - Vue component
   * @param {Object} renderOptions - Render options
   * @param {Object} themeConfig - Theme configuration
   * @returns {Promise<string>}
   * @private
   */
  async createThemedHTML(component, renderOptions, themeConfig) {
    const componentHTML = await this.snapshotHelper.renderComponentToHTML(component, renderOptions)
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Component Gallery - ${themeConfig.name}</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: ${themeConfig.colors.background};
            color: ${themeConfig.colors.text};
            min-height: 100vh;
          }
          .gallery-container {
            max-width: 1200px;
            margin: 0 auto;
            background: ${themeConfig.colors.surface || themeConfig.colors.background};
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          
          :root {
            ${Object.entries(themeConfig.cssVariables || {}).map(([key, value]) => `${key}: ${value};`).join('\n    ')}
          }
          
          ${this.getComponentCSS(themeConfig)}
        </style>
      </head>
      <body>
        <div class="gallery-container ${themeConfig.cssClass || ''}">
          ${componentHTML}
        </div>
      </body>
      </html>
    `
  }

  /**
   * Get component-specific CSS for theming
   * @param {Object} themeConfig - Theme configuration
   * @returns {string}
   * @private
   */
  getComponentCSS(themeConfig) {
    return `
      /* Common component styles */
      button {
        background: var(--color-primary, ${themeConfig.colors.primary});
        color: var(--color-background, ${themeConfig.colors.background});
        border: 1px solid var(--color-border, ${themeConfig.colors.primary});
        padding: 0.5rem 1rem;
        border-radius: 0.25rem;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s ease;
      }

      button:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }

      .card {
        background: var(--color-surface, ${themeConfig.colors.surface || themeConfig.colors.background});
        color: var(--color-text, ${themeConfig.colors.text});
        border: 1px solid var(--color-border, rgba(0,0,0,0.1));
        border-radius: 0.5rem;
        padding: 1rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      input, textarea, select {
        background: var(--color-surface, ${themeConfig.colors.surface || themeConfig.colors.background});
        color: var(--color-text, ${themeConfig.colors.text});
        border: 1px solid var(--color-border, rgba(0,0,0,0.2));
        padding: 0.5rem;
        border-radius: 0.25rem;
        font-family: inherit;
      }

      input:focus, textarea:focus, select:focus {
        outline: 2px solid var(--color-primary, ${themeConfig.colors.primary});
        outline-offset: 2px;
      }

      a {
        color: var(--color-primary, ${themeConfig.colors.primary});
        text-decoration: none;
      }

      a:hover {
        text-decoration: underline;
      }

      /* Dark theme adjustments */
      ${themeConfig.name === 'dark' ? `
        .card {
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        button {
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
      ` : ''}

      /* High contrast adjustments */
      ${themeConfig.name === 'high-contrast' ? `
        * {
          border-width: 2px !important;
        }
        button:focus, input:focus, textarea:focus, select:focus {
          outline: 3px solid var(--color-primary) !important;
          outline-offset: 2px !important;
        }
      ` : ''}
    `
  }

  /**
   * Capture component screenshot
   * @param {string} html - HTML content
   * @param {Object} [breakpoint] - Breakpoint configuration
   * @param {Object} [options] - Screenshot options
   * @returns {Promise<Buffer>}
   * @private
   */
  async captureComponentScreenshot(html, breakpoint, options = {}) {
    let page

    if (breakpoint) {
      // Use responsive helper's page
      if (!this.responsiveHelper.pages.has(breakpoint.name)) {
        await this.responsiveHelper.createBreakpointPages([breakpoint])
      }
      page = this.responsiveHelper.pages.get(breakpoint.name)
    } else {
      // Use snapshot helper's page
      page = this.snapshotHelper.page
    }

    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    if (options.delay) {
      await page.waitForTimeout(options.delay)
    }

    return await page.screenshot({
      fullPage: false,
      type: 'png',
      clip: breakpoint ? {
        x: 0,
        y: 0,
        width: breakpoint.width,
        height: Math.min(breakpoint.height, 800)
      } : undefined
    })
  }

  /**
   * Generate main gallery HTML
   * @param {Object} results - Gallery results
   * @param {GalleryConfig} config - Original configuration
   * @returns {Promise<string>}
   * @private
   */
  async generateGalleryHTML(results, config) {
    const { branding = {} } = config
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${results.galleryName} - Component Gallery</title>
        <link rel="stylesheet" href="gallery.css">
        ${config.includeInteractive ? '<script defer src="gallery.js"></script>' : ''}
        <style>
          :root {
            --brand-primary: ${branding.primaryColor || '#007bff'};
            --brand-secondary: ${branding.secondaryColor || '#6c757d'};
            --brand-font: ${branding.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};
          }
        </style>
      </head>
      <body>
        <header class="gallery-header">
          ${branding.logo ? `<img src="${branding.logo}" alt="Logo" class="brand-logo">` : ''}
          <h1>${results.galleryName}</h1>
          ${config.description ? `<p class="gallery-description">${config.description}</p>` : ''}
          <div class="gallery-meta">
            <span>Generated: ${new Date(results.summary.generatedAt).toLocaleString()}</span>
            <span>${results.summary.totalComponents} Components</span>
            <span>${results.summary.totalVariants} Variants</span>
            <span>${results.summary.totalSnapshots} Snapshots</span>
          </div>
        </header>

        <nav class="gallery-nav">
          <div class="theme-selector">
            <label for="theme-select">Theme:</label>
            <select id="theme-select">
              ${config.themes?.map(theme => `<option value="${theme}">${theme}</option>`).join('') || '<option value="light">light</option>'}
            </select>
          </div>
          <div class="breakpoint-selector">
            <label for="breakpoint-select">Breakpoint:</label>
            <select id="breakpoint-select">
              <option value="all">All</option>
              ${config.breakpoints?.map(bp => `<option value="${bp}">${bp}</option>`).join('') || ''}
            </select>
          </div>
        </nav>

        <main class="gallery-main">
          ${results.components.map(component => `
            <section class="component-section" id="component-${component.name}">
              <header class="component-header">
                <h2>${component.name}</h2>
                ${component.documentation.description ? `<p>${component.documentation.description}</p>` : ''}
                
                ${component.documentation.props ? `
                  <details class="component-props">
                    <summary>Props (${component.documentation.props.length})</summary>
                    <table class="props-table">
                      <thead>
                        <tr><th>Name</th><th>Type</th><th>Default</th><th>Description</th></tr>
                      </thead>
                      <tbody>
                        ${component.documentation.props.map(prop => `
                          <tr>
                            <td><code>${prop.name}</code></td>
                            <td><code>${prop.type}</code></td>
                            <td><code>${prop.default || '-'}</code></td>
                            <td>${prop.description || ''}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </details>
                ` : ''}
              </header>

              <div class="variants-grid">
                ${component.variants.map(variant => `
                  <div class="variant-card">
                    <h3>${variant.name}</h3>
                    ${variant.description ? `<p class="variant-description">${variant.description}</p>` : ''}
                    
                    <div class="snapshots-grid">
                      ${variant.snapshots.map(snapshot => `
                        <div class="snapshot-item" 
                             data-theme="${snapshot.theme}" 
                             data-breakpoint="${snapshot.breakpoint || 'desktop'}"
                             data-responsive="${snapshot.responsive}">
                          <div class="snapshot-image">
                            <img src="${snapshot.imagePath}" 
                                 alt="${snapshot.name}" 
                                 loading="lazy">
                          </div>
                          <div class="snapshot-meta">
                            <span class="theme-badge theme-${snapshot.theme}">${snapshot.theme}</span>
                            ${snapshot.breakpoint ? `<span class="breakpoint-badge">${snapshot.breakpoint}</span>` : ''}
                            <span class="viewport-badge">${snapshot.viewport}</span>
                          </div>
                        </div>
                      `).join('')}
                    </div>

                    ${config.includeCode ? `
                      <details class="variant-code">
                        <summary>Code Example</summary>
                        <pre><code class="language-vue">&lt;${component.name}${Object.entries(variant.props).map(([key, value]) => ` ${key}="${value}"`).join('')} /&gt;</code></pre>
                      </details>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </section>
          `).join('')}
        </main>

        <footer class="gallery-footer">
          <p>Component Gallery generated by Visual Testing Framework</p>
          ${branding.footer ? `<div class="brand-footer">${branding.footer}</div>` : ''}
        </footer>
      </body>
      </html>
    `
  }

  /**
   * Generate gallery CSS styles
   * @param {string[]} themes - Available themes
   * @returns {string}
   * @private
   */
  generateGalleryCSS(themes) {
    return `
      /* Gallery Base Styles */
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: var(--brand-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
        line-height: 1.6;
        color: #333;
        background: #f8f9fa;
      }

      .gallery-header {
        background: white;
        padding: 2rem;
        border-bottom: 1px solid #e9ecef;
        text-align: center;
      }

      .brand-logo {
        max-height: 60px;
        margin-bottom: 1rem;
      }

      .gallery-header h1 {
        color: var(--brand-primary, #007bff);
        font-size: 2.5rem;
        margin-bottom: 1rem;
      }

      .gallery-description {
        font-size: 1.2rem;
        color: #6c757d;
        max-width: 600px;
        margin: 0 auto 2rem;
      }

      .gallery-meta {
        display: flex;
        justify-content: center;
        gap: 2rem;
        font-size: 0.9rem;
        color: #6c757d;
      }

      .gallery-nav {
        background: white;
        padding: 1rem 2rem;
        border-bottom: 1px solid #e9ecef;
        display: flex;
        gap: 2rem;
        align-items: center;
      }

      .gallery-nav select {
        padding: 0.5rem;
        border: 1px solid #ced4da;
        border-radius: 0.25rem;
        background: white;
      }

      .gallery-main {
        max-width: 1400px;
        margin: 0 auto;
        padding: 2rem;
      }

      .component-section {
        background: white;
        border-radius: 8px;
        margin-bottom: 3rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        overflow: hidden;
      }

      .component-header {
        padding: 2rem;
        border-bottom: 1px solid #e9ecef;
      }

      .component-header h2 {
        font-size: 2rem;
        color: var(--brand-primary, #007bff);
        margin-bottom: 1rem;
      }

      .component-props {
        margin-top: 1rem;
      }

      .component-props summary {
        cursor: pointer;
        font-weight: 600;
        padding: 0.5rem 0;
      }

      .props-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
      }

      .props-table th,
      .props-table td {
        text-align: left;
        padding: 0.75rem;
        border-bottom: 1px solid #e9ecef;
      }

      .props-table th {
        background: #f8f9fa;
        font-weight: 600;
      }

      .props-table code {
        background: #f8f9fa;
        padding: 0.2rem 0.4rem;
        border-radius: 3px;
        font-size: 0.9em;
      }

      .variants-grid {
        padding: 2rem;
      }

      .variant-card {
        margin-bottom: 3rem;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        overflow: hidden;
      }

      .variant-card h3 {
        background: #f8f9fa;
        padding: 1rem;
        margin: 0;
        font-size: 1.5rem;
        color: #495057;
      }

      .variant-description {
        padding: 0 1rem;
        color: #6c757d;
        font-style: italic;
      }

      .snapshots-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
        padding: 1rem;
      }

      .snapshot-item {
        border: 1px solid #e9ecef;
        border-radius: 6px;
        overflow: hidden;
        background: white;
      }

      .snapshot-image img {
        width: 100%;
        height: auto;
        display: block;
      }

      .snapshot-meta {
        padding: 0.75rem;
        background: #f8f9fa;
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .theme-badge,
      .breakpoint-badge,
      .viewport-badge {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-weight: 500;
      }

      .theme-light { background: #fff3cd; color: #856404; }
      .theme-dark { background: #d1ecf1; color: #0c5460; }
      .theme-high-contrast { background: #f8d7da; color: #721c24; }

      .breakpoint-badge {
        background: #e2e6ea;
        color: #495057;
      }

      .viewport-badge {
        background: #d4edda;
        color: #155724;
      }

      .variant-code {
        border-top: 1px solid #e9ecef;
        background: #f8f9fa;
      }

      .variant-code summary {
        padding: 1rem;
        cursor: pointer;
        font-weight: 600;
      }

      .variant-code pre {
        margin: 0;
        padding: 1rem;
        background: #2d3748;
        color: #e2e8f0;
        overflow-x: auto;
      }

      .variant-code code {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.9rem;
      }

      .gallery-footer {
        background: #343a40;
        color: white;
        text-align: center;
        padding: 2rem;
        margin-top: 3rem;
      }

      .brand-footer {
        margin-top: 1rem;
        opacity: 0.8;
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .gallery-header {
          padding: 1rem;
        }
        
        .gallery-header h1 {
          font-size: 2rem;
        }
        
        .gallery-meta {
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .gallery-nav {
          flex-direction: column;
          gap: 1rem;
          align-items: stretch;
        }
        
        .gallery-main {
          padding: 1rem;
        }
        
        .component-header,
        .variants-grid {
          padding: 1rem;
        }
        
        .snapshots-grid {
          grid-template-columns: 1fr;
        }
      }

      /* Filter states */
      .snapshot-item[data-hidden="true"] {
        display: none;
      }

      .snapshot-item[data-theme]:not([data-theme*="--selected-theme"]) {
        display: none;
      }

      .snapshot-item[data-breakpoint]:not([data-breakpoint*="--selected-breakpoint"]) {
        display: none;
      }
    `
  }

  /**
   * Generate gallery JavaScript for interactivity
   * @returns {string}
   * @private
   */
  generateGalleryJS() {
    return `
      // Gallery Interactive Features
      class ComponentGallery {
        constructor() {
          this.themeSelect = document.getElementById('theme-select');
          this.breakpointSelect = document.getElementById('breakpoint-select');
          this.init();
        }

        init() {
          if (this.themeSelect) {
            this.themeSelect.addEventListener('change', () => this.filterByTheme());
          }
          
          if (this.breakpointSelect) {
            this.breakpointSelect.addEventListener('change', () => this.filterByBreakpoint());
          }

          // Initialize with first theme selected
          this.filterByTheme();
        }

        filterByTheme() {
          const selectedTheme = this.themeSelect.value;
          const snapshots = document.querySelectorAll('.snapshot-item');
          
          snapshots.forEach(snapshot => {
            const theme = snapshot.dataset.theme;
            if (selectedTheme === 'all' || theme === selectedTheme) {
              snapshot.style.display = 'block';
            } else {
              snapshot.style.display = 'none';
            }
          });
          
          this.updateVisibleCount();
        }

        filterByBreakpoint() {
          const selectedBreakpoint = this.breakpointSelect.value;
          const snapshots = document.querySelectorAll('.snapshot-item');
          
          snapshots.forEach(snapshot => {
            const breakpoint = snapshot.dataset.breakpoint || 'desktop';
            if (selectedBreakpoint === 'all' || breakpoint === selectedBreakpoint) {
              snapshot.style.display = snapshot.style.display === 'none' ? 'none' : 'block';
            } else {
              snapshot.style.display = 'none';
            }
          });
          
          this.updateVisibleCount();
        }

        updateVisibleCount() {
          const visible = document.querySelectorAll('.snapshot-item:not([style*="display: none"])').length;
          const total = document.querySelectorAll('.snapshot-item').length;
          
          // Update count in header if element exists
          const countElement = document.querySelector('.visible-count');
          if (countElement) {
            countElement.textContent = \`Showing \${visible} of \${total} snapshots\`;
          }
        }

        // Image lazy loading enhancement
        setupLazyLoading() {
          const images = document.querySelectorAll('img[loading="lazy"]');
          
          if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  const img = entry.target;
                  img.classList.add('loaded');
                  imageObserver.unobserve(img);
                }
              });
            });

            images.forEach(img => imageObserver.observe(img));
          }
        }
      }

      // Initialize gallery when DOM is loaded
      document.addEventListener('DOMContentLoaded', () => {
        new ComponentGallery();
      });

      // Keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (e.key === '/' && !e.target.matches('input, textarea, select')) {
          e.preventDefault();
          const searchInput = document.getElementById('search-input');
          if (searchInput) {
            searchInput.focus();
          }
        }
      });
    `
  }

  /**
   * Copy component source files to output directory
   * @param {Object[]} components - Components configuration
   * @param {string} outputDir - Output directory
   * @private
   */
  async copyComponentSources(components, outputDir) {
    await fs.mkdir(outputDir, { recursive: true })

    for (const { name, sourcePath } of components) {
      if (sourcePath && await fs.stat(sourcePath).catch(() => null)) {
        const content = await fs.readFile(sourcePath, 'utf-8')
        await fs.writeFile(
          path.join(outputDir, `${name}.vue`),
          content
        )
      }
    }
  }

  /**
   * Auto-discover components in directory
   * @param {string} componentsDir - Components directory
   * @param {Object} [options] - Discovery options
   * @returns {Promise<Object[]>}
   */
  async discoverComponents(componentsDir, options = {}) {
    const { pattern = '**/*.vue', exclude = [] } = options
    
    const componentFiles = await glob(pattern, {
      cwd: componentsDir,
      ignore: exclude
    })

    const components = []

    for (const file of componentFiles) {
      const fullPath = path.join(componentsDir, file)
      const name = path.basename(file, path.extname(file))
      
      // Try to extract component documentation from file
      const content = await fs.readFile(fullPath, 'utf-8')
      const documentation = this.extractDocumentation(content)
      
      components.push({
        name,
        sourcePath: fullPath,
        documentation,
        variants: [{
          name: 'default',
          props: {},
          description: 'Default component state'
        }]
      })
    }

    return components
  }

  /**
   * Extract documentation from component file
   * @param {string} content - File content
   * @returns {Object}
   * @private
   */
  extractDocumentation(content) {
    const doc = {
      description: '',
      props: [],
      slots: [],
      events: []
    }

    // Simple regex-based extraction (could be enhanced with proper Vue parser)
    const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\n/s)
    if (descriptionMatch) {
      doc.description = descriptionMatch[1].trim()
    }

    // Extract props from defineProps
    const propsMatch = content.match(/defineProps<\{([^}]+)\}>/s)
    if (propsMatch) {
      const propsStr = propsMatch[1]
      const propMatches = propsStr.matchAll(/(\w+)(\?)?:\s*([^;,\n]+)/g)
      
      for (const [, name, optional, type] of propMatches) {
        doc.props.push({
          name,
          type: type.trim(),
          required: !optional,
          description: ''
        })
      }
    }

    return doc
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    await this.snapshotHelper.close()
    await this.responsiveHelper.close()
    await this.themeHelper.close()
  }

  /**
   * Close and cleanup
   */
  async close() {
    await this.cleanup()
  }
}

/**
 * Generate component gallery from configuration
 * @param {GalleryConfig} config - Gallery configuration
 * @returns {Promise<Object>}
 */
export async function generateComponentGallery(config) {
  const generator = new ComponentGalleryGenerator()
  await generator.init()

  try {
    return await generator.generateGallery(config)
  } finally {
    await generator.close()
  }
}

/**
 * Auto-generate gallery from components directory
 * @param {string} componentsDir - Components directory path
 * @param {string} outputDir - Output directory path
 * @param {Object} [options] - Generation options
 * @returns {Promise<Object>}
 */
export async function autoGenerateGallery(componentsDir, outputDir, options = {}) {
  const generator = new ComponentGalleryGenerator()
  await generator.init()

  try {
    // Discover components
    const components = await generator.discoverComponents(componentsDir, options.discovery)
    
    // Generate gallery
    const galleryConfig = {
      name: options.name || 'Component Gallery',
      description: options.description || 'Auto-generated component gallery',
      components,
      outputDir,
      ...options
    }

    return await generator.generateGallery(galleryConfig)
  } finally {
    await generator.close()
  }
}

export default ComponentGalleryGenerator