/**
 * @fileoverview Migration validation system to ensure successful test framework migration
 * Validates migrated tests and provides rollback capabilities
 */

import fs from 'fs/promises'
import path from 'path'
import { execSync } from 'child_process'
import { TestFrameworkMigrator } from '../codemods/test-framework-migrator.js'

/**
 * Migration validation and rollback system
 */
class MigrationValidator {
  constructor(options = {}) {
    this.options = {
      validateSyntax: true,
      runTests: true,
      checkPerformance: true,
      rollbackOnFailure: false,
      ...options
    }
    
    this.validationResults = {
      syntax: { passed: 0, failed: 0, errors: [] },
      tests: { passed: 0, failed: 0, errors: [] },
      performance: { improved: 0, degraded: 0, neutral: 0 },
      coverage: { before: 0, after: 0, delta: 0 }
    }
    
    this.backupLocation = '.migration-backups'
  }

  /**
   * Validate complete migration
   */
  async validateMigration(rootDir = './tests') {
    console.log('🔍 Starting migration validation...')
    
    try {
      // Create backup directory
      await this.ensureBackupDirectory()
      
      // Validate syntax
      if (this.options.validateSyntax) {
        await this.validateSyntax(rootDir)
      }
      
      // Run tests
      if (this.options.runTests) {
        await this.validateTests()
      }
      
      // Check performance
      if (this.options.checkPerformance) {
        await this.validatePerformance()
      }
      
      // Generate report
      const report = this.generateValidationReport()
      
      // Handle failures
      if (this.shouldRollback(report)) {
        if (this.options.rollbackOnFailure) {
          await this.performRollback()
        } else {
          console.warn('⚠️  Migration validation failed but rollback is disabled')
        }
      }
      
      return report
      
    } catch (error) {
      console.error('❌ Migration validation failed:', error.message)
      
      if (this.options.rollbackOnFailure) {
        await this.performRollback()
      }
      
      throw error
    }
  }

  /**
   * Validate syntax of migrated files
   */
  async validateSyntax(rootDir) {
    console.log('📝 Validating syntax...')
    
    const testFiles = await this.findMigratedFiles(rootDir)
    
    for (const file of testFiles) {
      try {
        // Try to parse the file
        const content = await fs.readFile(file, 'utf8')
        
        // Basic syntax validation
        if (this.hasSyntaxErrors(content)) {
          this.validationResults.syntax.failed++
          this.validationResults.syntax.errors.push({
            file,
            error: 'Syntax validation failed'
          })
        } else {
          this.validationResults.syntax.passed++
        }
        
      } catch (error) {
        this.validationResults.syntax.failed++
        this.validationResults.syntax.errors.push({
          file,
          error: error.message
        })
      }
    }
  }

  /**
   * Check for basic syntax errors
   */
  hasSyntaxErrors(content) {
    // Check for common migration issues
    const issues = [
      /import.*from.*undefined/, // Undefined imports
      /quickTest\(\s*\)/, // Empty quickTest calls
      /scenario\(\s*\)\.execute\(\)/, // Empty scenarios
      /factories\.\w+\(\s*undefined\s*\)/, // Undefined factory calls
      /\.then\.then\./, // Duplicate fluent calls
      /mount.*quickTest/ // Mixed old/new patterns
    ]
    
    return issues.some(pattern => pattern.test(content))
  }

  /**
   * Validate tests by running them
   */
  async validateTests() {
    console.log('🧪 Running migrated tests...')
    
    try {
      // Run tests and capture output
      const testOutput = this.runTestCommand()
      const testResults = this.parseTestOutput(testOutput)
      
      this.validationResults.tests = testResults
      
      if (testResults.failed > 0) {
        console.warn(`⚠️  ${testResults.failed} tests failed after migration`)
      } else {
        console.log(`✅ All ${testResults.passed} tests passed after migration`)
      }
      
    } catch (error) {
      this.validationResults.tests.failed = -1
      this.validationResults.tests.errors.push({
        error: `Test execution failed: ${error.message}`
      })
    }
  }

  /**
   * Run test command and capture output
   */
  runTestCommand() {
    try {
      return execSync('pnpm test', { 
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 120000 // 2 minutes timeout
      })
    } catch (error) {
      // Test command failed, but we still want the output
      return error.stdout || error.message
    }
  }

  /**
   * Parse test output to extract results
   */
  parseTestOutput(output) {
    const results = { passed: 0, failed: 0, errors: [] }
    
    // Parse Vitest output
    const passedMatch = output.match(/(\d+) passed/)
    const failedMatch = output.match(/(\d+) failed/)
    
    if (passedMatch) {
      results.passed = parseInt(passedMatch[1], 10)
    }
    
    if (failedMatch) {
      results.failed = parseInt(failedMatch[1], 10)
    }
    
    // Extract error details
    const errorLines = output.split('\n').filter(line => 
      line.includes('FAILED') || line.includes('ERROR') || line.includes('✗')
    )
    
    results.errors = errorLines.map(line => ({ error: line.trim() }))
    
    return results
  }

  /**
   * Validate performance improvements
   */
  async validatePerformance() {
    console.log('⚡ Validating performance improvements...')
    
    try {
      // Run performance benchmarks
      const beforeStats = await this.loadPerformanceBaseline()
      const afterStats = await this.measureCurrentPerformance()
      
      const comparison = this.comparePerformance(beforeStats, afterStats)
      this.validationResults.performance = comparison
      
      console.log(`📊 Performance: ${comparison.improved} improved, ${comparison.degraded} degraded, ${comparison.neutral} neutral`)
      
    } catch (error) {
      console.warn('⚠️  Performance validation failed:', error.message)
    }
  }

  /**
   * Load performance baseline from before migration
   */
  async loadPerformanceBaseline() {
    try {
      const baselinePath = path.join(this.backupLocation, 'performance-baseline.json')
      const content = await fs.readFile(baselinePath, 'utf8')
      return JSON.parse(content)
    } catch (error) {
      // No baseline available
      return { testDuration: 0, memoryUsage: 0, coverage: 0 }
    }
  }

  /**
   * Measure current performance after migration
   */
  async measureCurrentPerformance() {
    try {
      // Run performance test
      const start = Date.now()
      const testOutput = this.runTestCommand()
      const duration = Date.now() - start
      
      // Extract coverage if available
      const coverageMatch = testOutput.match(/(\d+\.?\d*)%.*coverage/)
      const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0
      
      return {
        testDuration: duration,
        memoryUsage: process.memoryUsage().heapUsed,
        coverage
      }
      
    } catch (error) {
      return { testDuration: 0, memoryUsage: 0, coverage: 0 }
    }
  }

  /**
   * Compare before/after performance
   */
  comparePerformance(before, after) {
    const metrics = ['testDuration', 'memoryUsage']
    const results = { improved: 0, degraded: 0, neutral: 0, details: {} }
    
    metrics.forEach((metric) => {
      const beforeValue = before[metric] || 0
      const afterValue = after[metric] || 0
      
      if (beforeValue === 0) {
        results.neutral++
        results.details[metric] = { status: 'neutral', change: 0 }
        return
      }
      
      const change = ((afterValue - beforeValue) / beforeValue) * 100
      
      if (Math.abs(change) < 5) { // Less than 5% change
        results.neutral++
        results.details[metric] = { status: 'neutral', change }
      } else if (change < 0) { // Improvement (lower is better for duration/memory)
        results.improved++
        results.details[metric] = { status: 'improved', change }
      } else {
        results.degraded++
        results.details[metric] = { status: 'degraded', change }
      }
    })
    
    // Coverage improvement is good
    if (before.coverage && after.coverage) {
      const coverageChange = after.coverage - before.coverage
      if (coverageChange > 1) {
        results.improved++
        results.details.coverage = { status: 'improved', change: coverageChange }
      } else if (coverageChange < -1) {
        results.degraded++
        results.details.coverage = { status: 'degraded', change: coverageChange }
      } else {
        results.neutral++
        results.details.coverage = { status: 'neutral', change: coverageChange }
      }
    }
    
    return results
  }

  /**
   * Find all migrated test files
   */
  async findMigratedFiles(rootDir) {
    const files = []
    
    const scan = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            await scan(fullPath)
          } else if (entry.isFile() && this.isMigratedFile(entry.name)) {
            files.push(fullPath)
          }
        }
      } catch (error) {
        // Directory not accessible, skip
      }
    }
    
    await scan(rootDir)
    return files
  }

  /**
   * Check if file appears to be migrated
   */
  isMigratedFile(filename) {
    return (
      filename.includes('.test.') || 
      filename.includes('.spec.') ||
      filename.includes('.bdd.') ||
      filename.includes('steps.js')
    ) && !filename.includes('.backup')
  }

  /**
   * Ensure backup directory exists
   */
  async ensureBackupDirectory() {
    try {
      await fs.mkdir(this.backupLocation, { recursive: true })
    } catch (error) {
      // Directory already exists or can't be created
    }
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport() {
    const { syntax, tests, performance } = this.validationResults
    
    const totalSyntax = syntax.passed + syntax.failed
    const totalTests = tests.passed + tests.failed
    
    const report = {
      summary: {
        overallStatus: this.calculateOverallStatus(),
        syntaxValidation: `${syntax.passed}/${totalSyntax} passed`,
        testExecution: `${tests.passed}/${totalTests} passed`,
        performanceImpact: this.summarizePerformance(performance),
        migrationSuccess: this.calculateMigrationSuccess()
      },
      
      details: {
        syntax: this.validationResults.syntax,
        tests: this.validationResults.tests,
        performance: this.validationResults.performance
      },
      
      recommendations: this.generateRecommendations(),
      
      rollbackRequired: this.shouldRollback(),
      
      timestamp: new Date().toISOString()
    }
    
    return report
  }

  /**
   * Calculate overall validation status
   */
  calculateOverallStatus() {
    const syntaxFailed = this.validationResults.syntax.failed > 0
    const testsFailed = this.validationResults.tests.failed > 0
    const performanceDegraded = this.validationResults.performance.degraded > 2
    
    if (syntaxFailed || testsFailed) return 'FAILED'
    if (performanceDegraded) return 'WARNING'
    return 'SUCCESS'
  }

  /**
   * Summarize performance impact
   */
  summarizePerformance(performance) {
    const total = performance.improved + performance.degraded + performance.neutral
    if (total === 0) return 'No data'
    
    if (performance.improved > performance.degraded) return 'Improved'
    if (performance.degraded > performance.improved) return 'Degraded'
    return 'Neutral'
  }

  /**
   * Calculate migration success percentage
   */
  calculateMigrationSuccess() {
    const syntaxSuccess = this.validationResults.syntax.passed / 
                         (this.validationResults.syntax.passed + this.validationResults.syntax.failed)
    const testSuccess = this.validationResults.tests.passed /
                       (this.validationResults.tests.passed + this.validationResults.tests.failed)
    
    if (isNaN(syntaxSuccess)) return isNaN(testSuccess) ? 0 : testSuccess * 100
    if (isNaN(testSuccess)) return syntaxSuccess * 100
    
    return Math.round(((syntaxSuccess + testSuccess) / 2) * 100)
  }

  /**
   * Generate recommendations based on validation results
   */
  generateRecommendations() {
    const recommendations = []
    
    if (this.validationResults.syntax.failed > 0) {
      recommendations.push('Fix syntax errors in migrated files before proceeding')
      recommendations.push('Review migration patterns for common issues')
    }
    
    if (this.validationResults.tests.failed > 0) {
      recommendations.push('Investigate test failures - may indicate incomplete migration')
      recommendations.push('Consider manual review of failed test cases')
    }
    
    if (this.validationResults.performance.degraded > 2) {
      recommendations.push('Review performance regressions')
      recommendations.push('Consider selective rollback for performance-critical tests')
    }
    
    if (this.calculateMigrationSuccess() < 80) {
      recommendations.push('Migration success rate is low - consider batch rollback')
      recommendations.push('Review migration strategy and retry with better patterns')
    }
    
    return recommendations
  }

  /**
   * Determine if rollback is required
   */
  shouldRollback(report = null) {
    if (!report) {
      report = { summary: { overallStatus: this.calculateOverallStatus() } }
    }
    
    return (
      report.summary.overallStatus === 'FAILED' ||
      this.calculateMigrationSuccess() < 50
    )
  }

  /**
   * Perform rollback to pre-migration state
   */
  async performRollback() {
    console.log('🔄 Performing migration rollback...')
    
    try {
      const backupFiles = await this.findBackupFiles()
      let restoredFiles = 0
      
      for (const backupFile of backupFiles) {
        const originalPath = backupFile.replace('.backup', '')
        
        try {
          await fs.copyFile(backupFile, originalPath)
          restoredFiles++
        } catch (error) {
          console.warn(`⚠️  Failed to restore ${backupFile}: ${error.message}`)
        }
      }
      
      console.log(`✅ Rollback complete: ${restoredFiles} files restored`)
      
      // Clean up migration artifacts
      await this.cleanupMigrationArtifacts()
      
      return { restoredFiles, success: true }
      
    } catch (error) {
      console.error('❌ Rollback failed:', error.message)
      return { restoredFiles: 0, success: false, error: error.message }
    }
  }

  /**
   * Find all backup files
   */
  async findBackupFiles() {
    const backupFiles = []
    
    const scan = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            await scan(fullPath)
          } else if (entry.isFile() && entry.name.endsWith('.backup')) {
            backupFiles.push(fullPath)
          }
        }
      } catch (error) {
        // Directory not accessible, skip
      }
    }
    
    await scan('./tests')
    return backupFiles
  }

  /**
   * Clean up migration artifacts
   */
  async cleanupMigrationArtifacts() {
    const artifactPatterns = [
      'tests/**/*.bdd.js',
      'tests/**/*.fluent.steps.js'
    ]
    
    // Remove created migration files
    for (const pattern of artifactPatterns) {
      try {
        const files = await this.findFilesByPattern(pattern)
        for (const file of files) {
          await fs.unlink(file)
        }
      } catch (error) {
        // File cleanup failed, continue
      }
    }
  }

  /**
   * Find files by glob pattern (simplified)
   */
  async findFilesByPattern(pattern) {
    // Simplified pattern matching - real implementation would use proper glob
    const files = []
    const baseDir = pattern.split('**')[0] || './tests'
    const extension = pattern.split('.').pop()
    
    const scan = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          
          if (entry.isDirectory()) {
            await scan(fullPath)
          } else if (entry.isFile() && fullPath.endsWith(extension)) {
            files.push(fullPath)
          }
        }
      } catch (error) {
        // Continue on error
      }
    }
    
    await scan(baseDir)
    return files
  }

  /**
   * Save validation report
   */
  async saveValidationReport(report) {
    const reportPath = path.join(this.backupLocation, 'validation-report.json')
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
    console.log(`📊 Validation report saved: ${reportPath}`)
  }
}

export { MigrationValidator }
export default MigrationValidator
