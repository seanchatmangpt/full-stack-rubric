#!/usr/bin/env node

/**
 * Test Report Merger
 * Combines Vitest and Cypress test reports into comprehensive coverage analysis
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.dirname(__dirname)

const REPORTS = {
  vitest: {
    coverage: path.join(projectRoot, 'coverage/coverage-final.json'),
    results: path.join(projectRoot, 'coverage/vitest-results.json')
  },
  cypress: {
    coverage: path.join(projectRoot, 'coverage/.nyc_output/out.json'),
    results: path.join(projectRoot, 'cypress/reports/mochawesome.json')
  },
  output: {
    combined: path.join(projectRoot, 'coverage/combined-report.json'),
    html: path.join(projectRoot, 'coverage/combined-report.html'),
    summary: path.join(projectRoot, 'coverage/test-summary.json')
  }
}

class TestReportMerger {
  constructor() {
    this.vitestCoverage = null
    this.cypressCoverage = null
    this.vitestResults = null
    this.cypressResults = null
  }

  async loadReports() {
    console.log('📊 Loading test reports...')
    
    try {
      // Load Vitest coverage
      if (fs.existsSync(REPORTS.vitest.coverage)) {
        this.vitestCoverage = JSON.parse(fs.readFileSync(REPORTS.vitest.coverage, 'utf8'))
        console.log('✅ Vitest coverage loaded')
      } else {
        console.log('⚠️  Vitest coverage not found')
      }

      // Load Vitest results
      if (fs.existsSync(REPORTS.vitest.results)) {
        this.vitestResults = JSON.parse(fs.readFileSync(REPORTS.vitest.results, 'utf8'))
        console.log('✅ Vitest results loaded')
      } else {
        console.log('⚠️  Vitest results not found')
      }

      // Load Cypress coverage (if exists)
      if (fs.existsSync(REPORTS.cypress.coverage)) {
        this.cypressCoverage = JSON.parse(fs.readFileSync(REPORTS.cypress.coverage, 'utf8'))
        console.log('✅ Cypress coverage loaded')
      } else {
        console.log('⚠️  Cypress coverage not found')
      }

      // Load Cypress results (if exists) 
      if (fs.existsSync(REPORTS.cypress.results)) {
        this.cypressResults = JSON.parse(fs.readFileSync(REPORTS.cypress.results, 'utf8'))
        console.log('✅ Cypress results loaded')
      } else {
        console.log('⚠️  Cypress results not found')
      }
    } catch (error) {
      console.error('❌ Error loading reports:', error.message)
      throw error
    }
  }

  calculateCombinedCoverage() {
    console.log('🔄 Calculating combined coverage...')
    
    const combined = {
      files: {},
      totals: {
        statements: { covered: 0, total: 0, pct: 0 },
        branches: { covered: 0, total: 0, pct: 0 },
        functions: { covered: 0, total: 0, pct: 0 },
        lines: { covered: 0, total: 0, pct: 0 }
      }
    }

    // Process Vitest coverage
    if (this.vitestCoverage) {
      for (const [filePath, fileData] of Object.entries(this.vitestCoverage)) {
        if (filePath !== 'totals') {
          combined.files[filePath] = {
            ...fileData,
            source: 'vitest'
          }
        }
      }
    }

    // Process Cypress coverage (merge with Vitest if overlap)
    if (this.cypressCoverage) {
      for (const [filePath, fileData] of Object.entries(this.cypressCoverage)) {
        if (filePath !== 'totals') {
          if (combined.files[filePath]) {
            // Merge coverage data
            combined.files[filePath] = this.mergeCoverageData(
              combined.files[filePath],
              fileData
            )
            combined.files[filePath].source = 'both'
          } else {
            combined.files[filePath] = {
              ...fileData,
              source: 'cypress'
            }
          }
        }
      }
    }

    // Calculate totals
    for (const fileData of Object.values(combined.files)) {
      combined.totals.statements.covered += fileData.s ? Object.values(fileData.s).filter(v => v > 0).length : 0
      combined.totals.statements.total += fileData.s ? Object.keys(fileData.s).length : 0
      
      combined.totals.branches.covered += fileData.b ? Object.values(fileData.b).flat().filter(v => v > 0).length : 0
      combined.totals.branches.total += fileData.b ? Object.values(fileData.b).flat().length : 0
      
      combined.totals.functions.covered += fileData.f ? Object.values(fileData.f).filter(v => v > 0).length : 0
      combined.totals.functions.total += fileData.f ? Object.keys(fileData.f).length : 0
    }

    // Calculate percentages
    for (const metric of Object.keys(combined.totals)) {
      const { covered, total } = combined.totals[metric]
      combined.totals[metric].pct = total > 0 ? Math.round((covered / total) * 100 * 100) / 100 : 0
    }

    return combined
  }

  mergeCoverageData(data1, data2) {
    const merged = { ...data1 }
    
    // Merge statement coverage
    if (data2.s) {
      merged.s = { ...merged.s }
      for (const [key, value] of Object.entries(data2.s)) {
        merged.s[key] = (merged.s[key] || 0) + value
      }
    }
    
    // Merge branch coverage
    if (data2.b) {
      merged.b = { ...merged.b }
      for (const [key, branches] of Object.entries(data2.b)) {
        if (!merged.b[key]) {
          merged.b[key] = branches
        } else {
          merged.b[key] = merged.b[key].map((count, index) => 
            count + (branches[index] || 0)
          )
        }
      }
    }
    
    // Merge function coverage
    if (data2.f) {
      merged.f = { ...merged.f }
      for (const [key, value] of Object.entries(data2.f)) {
        merged.f[key] = (merged.f[key] || 0) + value
      }
    }

    return merged
  }

  generateSummary() {
    console.log('📋 Generating test summary...')
    
    const combinedCoverage = this.calculateCombinedCoverage()
    
    const summary = {
      timestamp: new Date().toISOString(),
      coverage: {
        statements: combinedCoverage.totals.statements.pct,
        branches: combinedCoverage.totals.branches.pct,
        functions: combinedCoverage.totals.functions.pct,
        lines: combinedCoverage.totals.lines.pct
      },
      tests: {
        vitest: {
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: 0
        },
        cypress: {
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: 0
        }
      },
      files: {
        total: Object.keys(combinedCoverage.files).length,
        vitest: Object.values(combinedCoverage.files).filter(f => f.source === 'vitest').length,
        cypress: Object.values(combinedCoverage.files).filter(f => f.source === 'cypress').length,
        both: Object.values(combinedCoverage.files).filter(f => f.source === 'both').length
      },
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      },
      passed: false
    }

    // Parse Vitest results
    if (this.vitestResults) {
      // Handle different Vitest result formats
      if (this.vitestResults.testResults) {
        this.vitestResults.testResults.forEach(result => {
          summary.tests.vitest.total += result.assertionResults.length
          summary.tests.vitest.passed += result.assertionResults.filter(a => a.status === 'passed').length
          summary.tests.vitest.failed += result.assertionResults.filter(a => a.status === 'failed').length
          summary.tests.vitest.skipped += result.assertionResults.filter(a => a.status === 'skipped').length
        })
      }
    }

    // Parse Cypress results
    if (this.cypressResults && this.cypressResults.stats) {
      summary.tests.cypress.total = this.cypressResults.stats.tests || 0
      summary.tests.cypress.passed = this.cypressResults.stats.passes || 0
      summary.tests.cypress.failed = this.cypressResults.stats.failures || 0
      summary.tests.cypress.skipped = this.cypressResults.stats.pending || 0
      summary.tests.cypress.duration = this.cypressResults.stats.duration || 0
    }

    // Check if thresholds are met
    summary.passed = (
      summary.coverage.statements >= summary.thresholds.statements &&
      summary.coverage.branches >= summary.thresholds.branches &&
      summary.coverage.functions >= summary.thresholds.functions &&
      summary.coverage.lines >= summary.thresholds.lines &&
      summary.tests.vitest.failed === 0 &&
      summary.tests.cypress.failed === 0
    )

    return { summary, combinedCoverage }
  }

  generateHTMLReport(summary, combinedCoverage) {
    console.log('🌐 Generating HTML report...')
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Combined Test Coverage Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #007bff; }
        .metric.good { border-left-color: #28a745; }
        .metric.warning { border-left-color: #ffc107; }
        .metric.danger { border-left-color: #dc3545; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric.good .value { color: #28a745; }
        .metric.warning .value { color: #ffc107; }
        .metric.danger .value { color: #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #007bff; color: white; }
        tr:hover { background-color: #f5f5f5; }
        .status { padding: 4px 8px; border-radius: 4px; color: white; font-size: 0.9em; }
        .status.passed { background: #28a745; }
        .status.failed { background: #dc3545; }
        .badge { display: inline-block; padding: 2px 8px; background: #007bff; color: white; border-radius: 12px; font-size: 0.8em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Combined Test Coverage Report</h1>
        <p><strong>Generated:</strong> ${summary.timestamp}</p>
        <p><strong>Status:</strong> <span class="status ${summary.passed ? 'passed' : 'failed'}">${summary.passed ? 'PASSED' : 'FAILED'}</span></p>
        
        <h2>📊 Coverage Summary</h2>
        <div class="summary">
            <div class="metric ${summary.coverage.statements >= 80 ? 'good' : summary.coverage.statements >= 60 ? 'warning' : 'danger'}">
                <h3>Statements</h3>
                <div class="value">${summary.coverage.statements}%</div>
                <div>Threshold: 80%</div>
            </div>
            <div class="metric ${summary.coverage.branches >= 75 ? 'good' : summary.coverage.branches >= 50 ? 'warning' : 'danger'}">
                <h3>Branches</h3>
                <div class="value">${summary.coverage.branches}%</div>
                <div>Threshold: 75%</div>
            </div>
            <div class="metric ${summary.coverage.functions >= 80 ? 'good' : summary.coverage.functions >= 60 ? 'warning' : 'danger'}">
                <h3>Functions</h3>
                <div class="value">${summary.coverage.functions}%</div>
                <div>Threshold: 80%</div>
            </div>
            <div class="metric ${summary.coverage.lines >= 80 ? 'good' : summary.coverage.lines >= 60 ? 'warning' : 'danger'}">
                <h3>Lines</h3>
                <div class="value">${summary.coverage.lines}%</div>
                <div>Threshold: 80%</div>
            </div>
        </div>

        <h2>🧪 Test Results</h2>
        <div class="summary">
            <div class="metric">
                <h3>Vitest Tests</h3>
                <div class="value">${summary.tests.vitest.passed}/${summary.tests.vitest.total}</div>
                <div>Passed: ${summary.tests.vitest.passed} | Failed: ${summary.tests.vitest.failed} | Skipped: ${summary.tests.vitest.skipped}</div>
            </div>
            <div class="metric">
                <h3>Cypress Tests</h3>
                <div class="value">${summary.tests.cypress.passed}/${summary.tests.cypress.total}</div>
                <div>Passed: ${summary.tests.cypress.passed} | Failed: ${summary.tests.cypress.failed} | Skipped: ${summary.tests.cypress.skipped}</div>
            </div>
            <div class="metric">
                <h3>Total Files</h3>
                <div class="value">${summary.files.total}</div>
                <div>
                    <span class="badge">Vitest: ${summary.files.vitest}</span>
                    <span class="badge">Cypress: ${summary.files.cypress}</span>
                    <span class="badge">Both: ${summary.files.both}</span>
                </div>
            </div>
        </div>

        <h2>📁 File Coverage Breakdown</h2>
        <table>
            <thead>
                <tr>
                    <th>File</th>
                    <th>Source</th>
                    <th>Statements</th>
                    <th>Branches</th>
                    <th>Functions</th>
                    <th>Lines</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(combinedCoverage.files).slice(0, 50).map(([file, data]) => `
                    <tr>
                        <td>${file.replace(process.cwd(), '')}</td>
                        <td><span class="badge">${data.source}</span></td>
                        <td>${this.calculateFilePercent(data.s)}%</td>
                        <td>${this.calculateFilePercent(data.b, true)}%</td>
                        <td>${this.calculateFilePercent(data.f)}%</td>
                        <td>N/A</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        ${Object.keys(combinedCoverage.files).length > 50 ? 
            `<p><em>Showing first 50 files of ${Object.keys(combinedCoverage.files).length} total files.</em></p>` : 
            ''
        }
    </div>
</body>
</html>`

    return html
  }

  calculateFilePercent(data, isBranch = false) {
    if (!data || typeof data !== 'object') return 0
    
    if (isBranch) {
      const branches = Object.values(data).flat()
      const covered = branches.filter(b => b > 0).length
      return branches.length > 0 ? Math.round((covered / branches.length) * 100) : 0
    }
    
    const values = Object.values(data)
    const covered = values.filter(v => v > 0).length
    return values.length > 0 ? Math.round((covered / values.length) * 100) : 0
  }

  async saveReports(summary, combinedCoverage) {
    console.log('💾 Saving reports...')
    
    // Ensure output directory exists
    const outputDir = path.dirname(REPORTS.output.combined)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Save combined JSON report
    fs.writeFileSync(REPORTS.output.combined, JSON.stringify(combinedCoverage, null, 2))
    console.log('✅ Combined JSON report saved')

    // Save summary
    fs.writeFileSync(REPORTS.output.summary, JSON.stringify(summary, null, 2))
    console.log('✅ Test summary saved')

    // Save HTML report
    const html = this.generateHTMLReport(summary, combinedCoverage)
    fs.writeFileSync(REPORTS.output.html, html)
    console.log('✅ HTML report saved')

    return {
      json: REPORTS.output.combined,
      summary: REPORTS.output.summary,
      html: REPORTS.output.html
    }
  }

  printSummary(summary) {
    console.log('\n📊 TEST COVERAGE SUMMARY')
    console.log('=========================')
    console.log(`Status: ${summary.passed ? '✅ PASSED' : '❌ FAILED'}`)
    console.log(`\nCoverage:`)
    console.log(`  Statements: ${summary.coverage.statements}% (target: 80%)`)
    console.log(`  Branches:   ${summary.coverage.branches}% (target: 75%)`)
    console.log(`  Functions:  ${summary.coverage.functions}% (target: 80%)`)
    console.log(`  Lines:      ${summary.coverage.lines}% (target: 80%)`)
    console.log(`\nTests:`)
    console.log(`  Vitest:  ${summary.tests.vitest.passed}/${summary.tests.vitest.total} passed`)
    console.log(`  Cypress: ${summary.tests.cypress.passed}/${summary.tests.cypress.total} passed`)
    console.log(`\nFiles: ${summary.files.total} total (${summary.files.vitest} Vitest, ${summary.files.cypress} Cypress, ${summary.files.both} Both)`)
  }

  async run() {
    try {
      await this.loadReports()
      const { summary, combinedCoverage } = this.generateSummary()
      const savedReports = await this.saveReports(summary, combinedCoverage)
      
      this.printSummary(summary)
      
      console.log('\n📂 Generated Reports:')
      console.log(`  JSON: ${savedReports.json}`)
      console.log(`  Summary: ${savedReports.summary}`)
      console.log(`  HTML: ${savedReports.html}`)
      
      // Exit with appropriate code
      process.exit(summary.passed ? 0 : 1)
      
    } catch (error) {
      console.error('❌ Failed to merge reports:', error)
      process.exit(1)
    }
  }
}

// Run if called directly
if (process.argv[1] === __filename) {
  const merger = new TestReportMerger()
  merger.run()
}

export default TestReportMerger