/**
 * @fileoverview Theme and dark mode visual testing utilities
 * Comprehensive theming validation and visual regression testing
 */

import { VisualSnapshotHelper } from './snapshot-helpers.js'
import { VisualDiffTool } from './diff-tools.js'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * Theme configuration
 * @typedef {Object} ThemeConfig
 * @property {string} name - Theme name
 * @property {Object} colors - Color palette
 * @property {Object} [typography] - Typography settings
 * @property {Object} [spacing] - Spacing values
 * @property {Object} [shadows] - Shadow definitions
 * @property {Object} [borders] - Border styles
 * @property {string} [cssClass] - CSS class to apply theme
 * @property {Object} [cssVariables] - CSS custom properties
 */

/**
 * Theme test configuration
 * @typedef {Object} ThemeTestConfig
 * @property {string} name - Test name
 * @property {ThemeConfig[]} themes - Themes to test
 * @property {string[]} [components] - Components to test
 * @property {string[]} [states] - Component states to test
 * @property {boolean} [testTransitions] - Test theme transitions
 * @property {boolean} [testAccessibility] - Test accessibility compliance
 * @property {number} [threshold] - Visual comparison threshold
 * @property {boolean} [generateReport] - Generate HTML report
 */

/**
 * Accessibility test result
 * @typedef {Object} AccessibilityResult
 * @property {boolean} passed - Whether accessibility test passed
 * @property {number} contrastRatio - Color contrast ratio
 * @property {string} level - WCAG compliance level (AA, AAA)
 * @property {Object[]} violations - Accessibility violations
 */

export class ThemeTestHelper {
  constructor() {
    this.snapshotHelper = new VisualSnapshotHelper()
    this.diffTool = new VisualDiffTool()
    this.outputDir = 'tests/__snapshots__/themes'
    
    // Default theme configurations
    this.defaultThemes = [
      {
        name: 'light',
        colors: {
          primary: '#007bff',
          secondary: '#6c757d',
          success: '#28a745',
          warning: '#ffc107',
          danger: '#dc3545',
          info: '#17a2b8',
          light: '#f8f9fa',
          dark: '#343a40',
          background: '#ffffff',
          surface: '#ffffff',
          text: '#212529',
          textSecondary: '#6c757d'
        },
        cssClass: 'theme-light',
        cssVariables: {
          '--color-primary': '#007bff',
          '--color-background': '#ffffff',
          '--color-text': '#212529',
          '--color-border': '#dee2e6'
        }
      },
      {
        name: 'dark',
        colors: {
          primary: '#0d6efd',
          secondary: '#6c757d',
          success: '#198754',
          warning: '#ffc107',
          danger: '#dc3545',
          info: '#0dcaf0',
          light: '#f8f9fa',
          dark: '#212529',
          background: '#121212',
          surface: '#1e1e1e',
          text: '#ffffff',
          textSecondary: '#adb5bd'
        },
        cssClass: 'theme-dark',
        cssVariables: {
          '--color-primary': '#0d6efd',
          '--color-background': '#121212',
          '--color-text': '#ffffff',
          '--color-border': '#495057'
        }
      },
      {
        name: 'high-contrast',
        colors: {
          primary: '#0000ff',
          secondary: '#808080',
          success: '#008000',
          warning: '#ffff00',
          danger: '#ff0000',
          info: '#00ffff',
          light: '#ffffff',
          dark: '#000000',
          background: '#ffffff',
          surface: '#ffffff',
          text: '#000000',
          textSecondary: '#000000'
        },
        cssClass: 'theme-high-contrast',
        cssVariables: {
          '--color-primary': '#0000ff',
          '--color-background': '#ffffff',
          '--color-text': '#000000',
          '--color-border': '#000000'
        }
      }
    ]
  }

  /**
   * Initialize theme testing environment
   * @param {Object} [options] - Initialization options
   */
  async init(options = {}) {
    await fs.mkdir(this.outputDir, { recursive: true })
    await this.snapshotHelper.init(options)
  }

  /**
   * Test component across multiple themes
   * @param {Object} component - Vue component
   * @param {ThemeTestConfig} config - Test configuration
   * @param {Object} [renderOptions] - Component render options
   * @returns {Promise<Object>}
   */
  async testThemes(component, config, renderOptions = {}) {
    const {
      name,
      themes = this.defaultThemes,
      components = ['default'],
      states = ['default'],
      testTransitions = false,
      testAccessibility = true,
      threshold = 0.1,
      generateReport = true
    } = config

    const results = {
      testName: name,
      themes: [],
      transitions: [],
      accessibility: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        accessibilityIssues: 0
      }
    }

    // Test each theme
    for (const theme of themes) {
      for (const componentName of components) {
        for (const stateName of states) {
          const themeResult = await this.testTheme(
            component,
            theme,
            `${name}-${componentName}-${stateName}-${theme.name}`,
            renderOptions,
            threshold
          )

          results.themes.push({
            theme: theme.name,
            component: componentName,
            state: stateName,
            ...themeResult
          })

          results.summary.totalTests++
          if (themeResult.passed) {
            results.summary.passed++
          } else {
            results.summary.failed++
          }

          // Test accessibility if enabled
          if (testAccessibility) {
            const accessibilityResult = await this.testAccessibility(
              component,
              theme,
              renderOptions
            )

            results.accessibility.push({
              theme: theme.name,
              component: componentName,
              state: stateName,
              ...accessibilityResult
            })

            if (!accessibilityResult.passed) {
              results.summary.accessibilityIssues++
            }
          }
        }
      }
    }

    // Test theme transitions if enabled
    if (testTransitions && themes.length > 1) {
      const transitionResults = await this.testThemeTransitions(
        component,
        themes,
        name,
        renderOptions
      )
      results.transitions = transitionResults

      transitionResults.forEach(result => {
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
      await this.generateThemeReport(results)
    }

    return results
  }

  /**
   * Test component with a specific theme
   * @param {Object} component - Vue component
   * @param {ThemeConfig} theme - Theme configuration
   * @param {string} testName - Test name
   * @param {Object} renderOptions - Render options
   * @param {number} threshold - Comparison threshold
   * @returns {Promise<Object>}
   * @private
   */
  async testTheme(component, theme, testName, renderOptions, threshold) {
    const html = await this.snapshotHelper.renderComponentToHTML(component, renderOptions)
    const themedHTML = this.wrapWithTheme(html, theme)

    // Create snapshot configuration
    const snapshotConfig = {
      name: testName,
      threshold,
      delay: 200 // Allow theme to fully apply
    }

    const result = await this.snapshotHelper.snapshotComponent(
      { template: themedHTML },
      snapshotConfig,
      { ...renderOptions, attachToDocument: true }
    )

    return {
      passed: result.passed,
      diffPercentage: result.diffPercentage,
      diffPath: result.diffPath,
      baseline: result.message === 'Baseline created'
    }
  }

  /**
   * Wrap component HTML with theme styles
   * @param {string} componentHTML - Component HTML
   * @param {ThemeConfig} theme - Theme configuration
   * @returns {string}
   * @private
   */
  wrapWithTheme(componentHTML, theme) {
    const cssVariables = theme.cssVariables || {}
    const cssVarDeclarations = Object.entries(cssVariables)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n    ')

    return `
      <div class="theme-wrapper ${theme.cssClass || ''}" 
           style="${cssVarDeclarations}">
        <style>
          .theme-wrapper {
            min-height: 100vh;
            background-color: ${theme.colors.background || '#ffffff'};
            color: ${theme.colors.text || '#000000'};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
          }
          
          /* Theme-specific styles */
          .theme-light {
            --color-primary: ${theme.colors.primary || '#007bff'};
            --color-background: ${theme.colors.background || '#ffffff'};
            --color-text: ${theme.colors.text || '#212529'};
            --color-surface: ${theme.colors.surface || '#ffffff'};
            --color-border: #dee2e6;
            --shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
          }
          
          .theme-dark {
            --color-primary: ${theme.colors.primary || '#0d6efd'};
            --color-background: ${theme.colors.background || '#121212'};
            --color-text: ${theme.colors.text || '#ffffff'};
            --color-surface: ${theme.colors.surface || '#1e1e1e'};
            --color-border: #495057;
            --shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.5);
          }
          
          .theme-high-contrast {
            --color-primary: ${theme.colors.primary || '#0000ff'};
            --color-background: ${theme.colors.background || '#ffffff'};
            --color-text: ${theme.colors.text || '#000000'};
            --color-surface: ${theme.colors.surface || '#ffffff'};
            --color-border: #000000;
            --shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 1);
          }

          /* Common component styles */
          button {
            background: var(--color-primary);
            color: var(--color-background);
            border: 1px solid var(--color-border);
            padding: 0.5rem 1rem;
            border-radius: 0.25rem;
            cursor: pointer;
          }

          .card {
            background: var(--color-surface);
            color: var(--color-text);
            border: 1px solid var(--color-border);
            border-radius: 0.5rem;
            padding: 1rem;
            box-shadow: var(--shadow);
          }

          input, textarea, select {
            background: var(--color-surface);
            color: var(--color-text);
            border: 1px solid var(--color-border);
            padding: 0.5rem;
            border-radius: 0.25rem;
          }

          a {
            color: var(--color-primary);
          }

          /* Ensure proper contrast for all themes */
          ${theme.name === 'high-contrast' ? `
            * {
              border-width: 2px !important;
            }
            button:focus, input:focus, textarea:focus, select:focus {
              outline: 3px solid var(--color-primary) !important;
              outline-offset: 2px !important;
            }
          ` : ''}
        </style>
        ${componentHTML}
      </div>
    `
  }

  /**
   * Test theme transitions between different themes
   * @param {Object} component - Vue component
   * @param {ThemeConfig[]} themes - Themes to test transitions between
   * @param {string} baseName - Base test name
   * @param {Object} renderOptions - Render options
   * @returns {Promise<Array>}
   * @private
   */
  async testThemeTransitions(component, themes, baseName, renderOptions) {
    const results = []

    // Test transitions between each pair of themes
    for (let i = 0; i < themes.length - 1; i++) {
      for (let j = i + 1; j < themes.length; j++) {
        const fromTheme = themes[i]
        const toTheme = themes[j]
        
        const transitionResult = await this.captureThemeTransition(
          component,
          fromTheme,
          toTheme,
          `${baseName}-transition-${fromTheme.name}-to-${toTheme.name}`,
          renderOptions
        )

        results.push({
          from: fromTheme.name,
          to: toTheme.name,
          ...transitionResult
        })
      }
    }

    return results
  }

  /**
   * Capture theme transition snapshots
   * @param {Object} component - Vue component
   * @param {ThemeConfig} fromTheme - Initial theme
   * @param {ThemeConfig} toTheme - Target theme
   * @param {string} testName - Test name
   * @param {Object} renderOptions - Render options
   * @returns {Promise<Object>}
   * @private
   */
  async captureThemeTransition(component, fromTheme, toTheme, testName, renderOptions) {
    const html = await this.snapshotHelper.renderComponentToHTML(component, renderOptions)
    
    // Create transition HTML with both themes
    const transitionHTML = `
      <div id="transition-container">
        ${this.wrapWithTheme(html, fromTheme)}
      </div>
      <script>
        // Simulate theme transition after a delay
        setTimeout(() => {
          const container = document.getElementById('transition-container');
          container.innerHTML = \`${this.wrapWithTheme(html, toTheme).replace(/`/g, '\\`')}\`;
        }, 100);
      </script>
    `

    const snapshotConfig = {
      name: testName,
      delay: 500, // Allow transition to complete
      threshold: 0.2 // Higher threshold for transitions
    }

    const result = await this.snapshotHelper.snapshotComponent(
      { template: transitionHTML },
      snapshotConfig,
      renderOptions
    )

    return {
      passed: result.passed,
      diffPercentage: result.diffPercentage,
      baseline: result.message === 'Baseline created'
    }
  }

  /**
   * Test accessibility compliance for theme
   * @param {Object} component - Vue component
   * @param {ThemeConfig} theme - Theme to test
   * @param {Object} renderOptions - Render options
   * @returns {Promise<AccessibilityResult>}
   * @private
   */
  async testAccessibility(component, theme, renderOptions) {
    const violations = []
    let contrastRatio = null
    let level = 'FAIL'

    // Test color contrast
    const textColor = this.hexToRgb(theme.colors.text || '#000000')
    const backgroundColor = this.hexToRgb(theme.colors.background || '#ffffff')
    
    contrastRatio = this.calculateContrastRatio(textColor, backgroundColor)
    
    if (contrastRatio >= 7) {
      level = 'AAA'
    } else if (contrastRatio >= 4.5) {
      level = 'AA'
    } else if (contrastRatio >= 3) {
      level = 'AA_LARGE'
    } else {
      violations.push({
        type: 'contrast',
        message: `Insufficient color contrast: ${contrastRatio.toFixed(2)}:1`,
        severity: 'critical'
      })
    }

    // Test primary color contrast
    const primaryColor = this.hexToRgb(theme.colors.primary || '#007bff')
    const primaryContrast = this.calculateContrastRatio(primaryColor, backgroundColor)
    
    if (primaryContrast < 4.5) {
      violations.push({
        type: 'primary_contrast',
        message: `Primary color has insufficient contrast: ${primaryContrast.toFixed(2)}:1`,
        severity: 'high'
      })
    }

    // Check for sufficient color differentiation
    const colorKeys = ['primary', 'success', 'warning', 'danger', 'info']
    const colors = colorKeys.map(key => theme.colors[key]).filter(Boolean)
    
    for (let i = 0; i < colors.length - 1; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const color1 = this.hexToRgb(colors[i])
        const color2 = this.hexToRgb(colors[j])
        const colorDiff = this.calculateColorDifference(color1, color2)
        
        if (colorDiff < 500) {
          violations.push({
            type: 'color_difference',
            message: `Colors ${colors[i]} and ${colors[j]} may be too similar`,
            severity: 'medium'
          })
        }
      }
    }

    return {
      passed: violations.length === 0 || !violations.some(v => v.severity === 'critical'),
      contrastRatio,
      level,
      violations
    }
  }

  /**
   * Convert hex color to RGB array
   * @param {string} hex - Hex color string
   * @returns {number[]}
   * @private
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0]
  }

  /**
   * Calculate WCAG contrast ratio between two colors
   * @param {number[]} color1 - RGB array
   * @param {number[]} color2 - RGB array
   * @returns {number}
   * @private
   */
  calculateContrastRatio(color1, color2) {
    const l1 = this.getRelativeLuminance(color1)
    const l2 = this.getRelativeLuminance(color2)
    
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    
    return (lighter + 0.05) / (darker + 0.05)
  }

  /**
   * Calculate relative luminance of a color
   * @param {number[]} rgb - RGB array
   * @returns {number}
   * @private
   */
  getRelativeLuminance([r, g, b]) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  /**
   * Calculate color difference using WCAG formula
   * @param {number[]} color1 - RGB array
   * @param {number[]} color2 - RGB array
   * @returns {number}
   * @private
   */
  calculateColorDifference(color1, color2) {
    const [r1, g1, b1] = color1
    const [r2, g2, b2] = color2
    
    return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)
  }

  /**
   * Generate comprehensive theme test report
   * @param {Object} results - Test results
   * @private
   */
  async generateThemeReport(results) {
    const reportHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Theme Test Report - ${results.testName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { 
            background: ${results.summary.failed === 0 ? '#d4edda' : '#f8d7da'}; 
            padding: 20px; border-radius: 8px; margin-bottom: 30px; 
          }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
          .metric { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
          .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
          .section { margin: 30px 0; }
          .theme-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 15px; }
          .theme-card { 
            background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; 
            border-left: 4px solid #007bff;
          }
          .theme-card.failed { border-left-color: #dc3545; }
          .theme-card.passed { border-left-color: #28a745; }
          .accessibility-issues { background: #fff3cd; padding: 10px; border-radius: 5px; margin-top: 10px; }
          .contrast-ratio { 
            font-family: monospace; 
            background: #f8f9fa; 
            padding: 2px 6px; 
            border-radius: 3px; 
            margin: 0 5px;
          }
          .level-AAA { color: #28a745; font-weight: bold; }
          .level-AA { color: #ffc107; font-weight: bold; }
          .level-FAIL { color: #dc3545; font-weight: bold; }
          .color-palette {
            display: flex;
            gap: 5px;
            margin: 10px 0;
          }
          .color-swatch {
            width: 30px;
            height: 30px;
            border-radius: 4px;
            border: 1px solid #ddd;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Theme Test Report: ${results.testName}</h1>
          <p>Test completed at ${new Date().toISOString()}</p>
        </div>

        <div class="summary">
          <div class="metric">
            <div>Total Tests</div>
            <div class="metric-value">${results.summary.totalTests}</div>
          </div>
          <div class="metric">
            <div>Passed</div>
            <div class="metric-value" style="color: #28a745">${results.summary.passed}</div>
          </div>
          <div class="metric">
            <div>Failed</div>
            <div class="metric-value" style="color: #dc3545">${results.summary.failed}</div>
          </div>
          <div class="metric">
            <div>Accessibility Issues</div>
            <div class="metric-value" style="color: #ffc107">${results.summary.accessibilityIssues}</div>
          </div>
        </div>

        <div class="section">
          <h2>Theme Visual Tests</h2>
          <div class="theme-grid">
            ${results.themes.map(theme => {
              const accessibilityData = results.accessibility.find(
                a => a.theme === theme.theme && a.component === theme.component && a.state === theme.state
              )
              
              return `
                <div class="theme-card ${theme.passed ? 'passed' : 'failed'}">
                  <h3>${theme.theme} - ${theme.component} (${theme.state})</h3>
                  <p><strong>Status:</strong> 
                    ${theme.baseline ? '📝 Baseline Created' : theme.passed ? '✅ Passed' : '❌ Failed'}
                  </p>
                  ${theme.diffPercentage ? `<p><strong>Difference:</strong> ${theme.diffPercentage.toFixed(2)}%</p>` : ''}
                  
                  ${accessibilityData ? `
                    <div class="accessibility-section">
                      <p><strong>Accessibility:</strong> 
                        <span class="level-${accessibilityData.level}">${accessibilityData.level}</span>
                      </p>
                      <p><strong>Contrast Ratio:</strong> 
                        <span class="contrast-ratio">${accessibilityData.contrastRatio?.toFixed(2)}:1</span>
                      </p>
                      ${accessibilityData.violations?.length > 0 ? `
                        <div class="accessibility-issues">
                          <strong>Issues:</strong>
                          <ul>
                            ${accessibilityData.violations.map(v => `
                              <li><strong>${v.type}:</strong> ${v.message} (${v.severity})</li>
                            `).join('')}
                          </ul>
                        </div>
                      ` : ''}
                    </div>
                  ` : ''}
                </div>
              `
            }).join('')}
          </div>
        </div>

        ${results.transitions.length > 0 ? `
          <div class="section">
            <h2>Theme Transitions</h2>
            <div class="theme-grid">
              ${results.transitions.map(transition => `
                <div class="theme-card ${transition.passed ? 'passed' : 'failed'}">
                  <h3>${transition.from} → ${transition.to}</h3>
                  <p><strong>Status:</strong> 
                    ${transition.baseline ? '📝 Baseline Created' : transition.passed ? '✅ Passed' : '❌ Failed'}
                  </p>
                  ${transition.diffPercentage ? `<p><strong>Difference:</strong> ${transition.diffPercentage.toFixed(2)}%</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </body>
      </html>
    `

    const reportPath = path.join(this.outputDir, `${results.testName}-theme-report.html`)
    await fs.writeFile(reportPath, reportHTML)
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.snapshotHelper) {
      await this.snapshotHelper.close()
    }
  }

  /**
   * Close and cleanup
   */
  async close() {
    await this.cleanup()
  }
}

/**
 * Test component themes
 * @param {string} testName - Test name
 * @param {Object} component - Vue component
 * @param {ThemeTestConfig} config - Theme test configuration
 * @param {Object} [renderOptions] - Render options
 * @returns {Promise<Object>}
 */
export async function testComponentThemes(testName, component, config = {}, renderOptions = {}) {
  const helper = new ThemeTestHelper()
  await helper.init()

  try {
    const results = await helper.testThemes(
      component,
      { name: testName, ...config },
      renderOptions
    )

    if (results.summary.failed > 0 || results.summary.accessibilityIssues > 0) {
      const issues = []
      if (results.summary.failed > 0) {
        issues.push(`${results.summary.failed} visual tests failed`)
      }
      if (results.summary.accessibilityIssues > 0) {
        issues.push(`${results.summary.accessibilityIssues} accessibility issues`)
      }
      
      throw new Error(
        `Theme tests failed: ${issues.join(', ')}. ` +
        `Check the report at tests/__snapshots__/themes/${testName}-theme-report.html`
      )
    }

    return results
  } finally {
    await helper.close()
  }
}

/**
 * Quick theme test with light/dark modes
 * @param {string} testName - Test name
 * @param {Object} component - Vue component
 * @returns {Promise<Object>}
 */
export async function quickThemeTest(testName, component) {
  const helper = new ThemeTestHelper()
  const themes = helper.defaultThemes.filter(theme => ['light', 'dark'].includes(theme.name))
  
  return await testComponentThemes(testName, component, { themes })
}

export default ThemeTestHelper