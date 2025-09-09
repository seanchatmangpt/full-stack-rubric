#!/usr/bin/env node

/**
 * @fileoverview Complete migration runner script with CLI interface
 * Orchestrates the entire test framework migration process
 */

import { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import fs from 'fs/promises'
import path from 'path'

import { TestFrameworkMigrator } from '../codemods/test-framework-migrator.js'
import { VitestCucumberMigrator } from './vitest-cucumber-migrator.js'
import { MigrationValidator } from '../validation/migration-validator.js'
import legacyAdapter from '../compatibility/legacy-adapter.js'
import deprecationStrategy from '../deprecation-strategy.js'

const program = new Command()

/**
 * Main migration orchestrator
 */
class MigrationRunner {
  constructor(options = {}) {
    this.options = {
      dryRun: false,
      verbose: true,
      backup: true,
      validate: true,
      rollbackOnFailure: false,
      ...options
    }
    
    this.stats = {
      startTime: Date.now(),
      phases: {},
      errors: []
    }
  }

  /**
   * Run complete migration process
   */
  async runCompleteMigration(rootDir = './tests') {
    console.log(chalk.blue.bold('🚀 Starting Test Framework Migration'))
    console.log(chalk.gray(`Root directory: ${rootDir}`))
    console.log(chalk.gray(`Options: ${JSON.stringify(this.options, null, 2)}\n`))

    try {
      // Phase 1: Pre-migration analysis
      await this.runPhase('analysis', 'Analyzing codebase', async () => {
        return await this.analyzeCodebase(rootDir)
      })

      // Phase 2: Framework migration (core patterns)
      await this.runPhase('framework', 'Migrating core framework patterns', async () => {
        const migrator = new TestFrameworkMigrator(this.options)
        return await migrator.migrate(rootDir)
      })

      // Phase 3: Vitest + Cucumber migration
      await this.runPhase('vitest-cucumber', 'Migrating Vitest + Cucumber patterns', async () => {
        const cucumberMigrator = new VitestCucumberMigrator(this.options)
        return await cucumberMigrator.migrateVitestCucumber(rootDir)
      })

      // Phase 4: Validation
      if (this.options.validate) {
        await this.runPhase('validation', 'Validating migration', async () => {
          const validator = new MigrationValidator(this.options)
          return await validator.validateMigration(rootDir)
        })
      }

      // Phase 5: Generate final report
      const finalReport = await this.generateFinalReport()
      
      console.log(chalk.green.bold('\n✅ Migration completed successfully!'))
      this.displayFinalReport(finalReport)
      
      return finalReport

    } catch (error) {
      console.error(chalk.red.bold('\n❌ Migration failed:'), error.message)
      
      if (this.options.rollbackOnFailure) {
        await this.performEmergencyRollback(rootDir)
      }
      
      throw error
    }
  }

  /**
   * Run a migration phase with progress tracking
   */
  async runPhase(phaseKey, description, phaseFunction) {
    const spinner = ora(description).start()
    const startTime = Date.now()
    
    try {
      const result = await phaseFunction()
      const duration = Date.now() - startTime
      
      this.stats.phases[phaseKey] = {
        duration,
        success: true,
        result
      }
      
      spinner.succeed(`${description} (${duration}ms)`)
      return result
      
    } catch (error) {
      const duration = Date.now() - startTime
      
      this.stats.phases[phaseKey] = {
        duration,
        success: false,
        error: error.message
      }
      
      this.stats.errors.push({ phase: phaseKey, error: error.message })
      spinner.fail(`${description} failed: ${error.message}`)
      throw error
    }
  }

  /**
   * Analyze codebase before migration
   */
  async analyzeCodebase(rootDir) {
    const analysis = {
      testFiles: 0,
      featureFiles: 0,
      stepFiles: 0,
      configFiles: 0,
      estimatedPatterns: new Map()
    }

    const scan = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          
          if (entry.isDirectory() && !entry.name.startsWith('.') && !entry.name.includes('node_modules')) {
            await scan(fullPath)
          } else if (entry.isFile()) {
            await this.analyzeFile(fullPath, analysis)
          }
        }
      } catch (error) {
        // Directory not accessible, continue
      }
    }

    await scan(rootDir)
    
    // Generate migration estimate
    analysis.estimatedDuration = this.estimateMigrationDuration(analysis)
    analysis.complexity = this.calculateComplexity(analysis)
    
    return analysis
  }

  /**
   * Analyze individual file
   */
  async analyzeFile(filePath, analysis) {
    const fileName = path.basename(filePath)
    
    // Count file types
    if (fileName.includes('.test.') || fileName.includes('.spec.')) {
      analysis.testFiles++
    } else if (fileName.endsWith('.feature')) {
      analysis.featureFiles++
    } else if (fileName.includes('steps') && fileName.endsWith('.js')) {
      analysis.stepFiles++
    } else if (fileName.includes('vitest.config') || fileName.includes('vite.config')) {
      analysis.configFiles++
    }

    // Analyze patterns in test files
    if (this.isTestFile(fileName)) {
      try {
        const content = await fs.readFile(filePath, 'utf8')
        await this.detectPatterns(content, analysis.estimatedPatterns)
      } catch (error) {
        // File read error, skip analysis
      }
    }
  }

  /**
   * Detect migration patterns in file content
   */
  async detectPatterns(content, patterns) {
    const patternChecks = [
      { name: 'mount-calls', regex: /mount\s*\(/g },
      { name: 'cucumber-given', regex: /Given\s*\(/g },
      { name: 'cucumber-when', regex: /When\s*\(/g },
      { name: 'cucumber-then', regex: /Then\s*\(/g },
      { name: 'manual-mocks', regex: /const\s+mock\w+\s*=/g },
      { name: 'api-mocks', regex: /mockApi|apiMock/g }
    ]

    patternChecks.forEach(({ name, regex }) => {
      const matches = content.match(regex) || []
      patterns.set(name, (patterns.get(name) || 0) + matches.length)
    })
  }

  /**
   * Check if file is a test file
   */
  isTestFile(fileName) {
    return /\.(test|spec)\.(js|ts|vue)$/.test(fileName) ||
           /\.feature$/.test(fileName) ||
           fileName.includes('steps.js')
  }

  /**
   * Estimate migration duration based on analysis
   */
  estimateMigrationDuration(analysis) {
    const baseTime = 60000 // 1 minute base
    const fileTime = (analysis.testFiles + analysis.stepFiles) * 5000 // 5 seconds per file
    const patternTime = Array.from(analysis.estimatedPatterns.values())
      .reduce((total, count) => total + count * 1000, 0) // 1 second per pattern

    return baseTime + fileTime + patternTime
  }

  /**
   * Calculate migration complexity
   */
  calculateComplexity(analysis) {
    const totalFiles = analysis.testFiles + analysis.featureFiles + analysis.stepFiles
    const totalPatterns = Array.from(analysis.estimatedPatterns.values())
      .reduce((sum, count) => sum + count, 0)

    if (totalFiles < 10 && totalPatterns < 50) return 'LOW'
    if (totalFiles < 50 && totalPatterns < 200) return 'MEDIUM'
    if (totalFiles < 100 && totalPatterns < 500) return 'HIGH'
    return 'EXTREME'
  }

  /**
   * Generate final migration report
   */
  async generateFinalReport() {
    const totalDuration = Date.now() - this.stats.startTime
    const successfulPhases = Object.values(this.stats.phases)
      .filter(phase => phase.success).length
    const totalPhases = Object.keys(this.stats.phases).length

    const report = {
      summary: {
        duration: totalDuration,
        phases: `${successfulPhases}/${totalPhases} successful`,
        errors: this.stats.errors.length,
        success: this.stats.errors.length === 0
      },
      
      phases: this.stats.phases,
      
      migration: {
        filesProcessed: this.getStatFromPhases('filesProcessed'),
        transformations: this.getStatFromPhases('transformations'),
        patterns: this.getStatFromPhases('patterns')
      },
      
      validation: this.stats.phases.validation?.result || null,
      
      recommendations: this.generateFinalRecommendations(),
      
      compatibilityReport: legacyAdapter.generateCompatibilityReport(),
      
      deprecationStatus: deprecationStrategy.exportConfiguration(),
      
      timestamp: new Date().toISOString()
    }

    // Save report
    await this.saveMigrationReport(report)
    
    return report
  }

  /**
   * Extract statistic from phase results
   */
  getStatFromPhases(statName) {
    const results = Object.values(this.stats.phases)
      .map(phase => phase.result)
      .filter(result => result && typeof result === 'object')

    const totals = {}
    results.forEach((result) => {
      if (result[statName] !== undefined) {
        if (typeof result[statName] === 'object') {
          Object.assign(totals, result[statName])
        } else {
          totals[statName] = (totals[statName] || 0) + result[statName]
        }
      }
    })

    return Object.keys(totals).length === 1 ? totals[statName] : totals
  }

  /**
   * Generate final recommendations
   */
  generateFinalRecommendations() {
    const recommendations = []

    if (this.stats.errors.length > 0) {
      recommendations.push('Review migration errors and consider manual fixes')
    }

    if (this.stats.phases.validation?.success) {
      const validation = this.stats.phases.validation.result
      if (validation.summary.overallStatus === 'WARNING') {
        recommendations.push('Address validation warnings before proceeding to production')
      }
    }

    recommendations.push('Run full test suite to verify migration success')
    recommendations.push('Update CI/CD pipelines to use new test patterns')
    recommendations.push('Train team on new testing framework features')
    recommendations.push('Monitor performance after deployment')

    return recommendations
  }

  /**
   * Display final report in console
   */
  displayFinalReport(report) {
    console.log(chalk.blue.bold('\n📊 Migration Report'))
    console.log(chalk.gray('='.repeat(50)))
    
    // Summary
    console.log(chalk.yellow('Summary:'))
    console.log(`  Duration: ${Math.round(report.summary.duration / 1000)}s`)
    console.log(`  Phases: ${report.summary.phases}`)
    console.log(`  Success: ${report.summary.success ? '✅' : '❌'}`)
    
    // Migration stats
    if (report.migration.filesProcessed) {
      console.log(chalk.yellow('\nMigration:'))
      console.log(`  Files processed: ${report.migration.filesProcessed}`)
      console.log(`  Transformations: ${report.migration.transformations}`)
    }
    
    // Validation
    if (report.validation) {
      console.log(chalk.yellow('\nValidation:'))
      console.log(`  Status: ${report.validation.summary.overallStatus}`)
      console.log(`  Migration success: ${report.validation.summary.migrationSuccess}%`)
    }
    
    // Recommendations
    if (report.recommendations.length > 0) {
      console.log(chalk.yellow('\nRecommendations:'))
      report.recommendations.forEach((rec) => {
        console.log(`  • ${rec}`)
      })
    }
  }

  /**
   * Save migration report to file
   */
  async saveMigrationReport(report) {
    const reportPath = path.join('.migration-reports', `migration-${Date.now()}.json`)
    
    try {
      await fs.mkdir(path.dirname(reportPath), { recursive: true })
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
      console.log(chalk.gray(`\n📄 Full report saved: ${reportPath}`))
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not save report: ${error.message}`))
    }
  }

  /**
   * Perform emergency rollback
   */
  async performEmergencyRollback(rootDir) {
    console.log(chalk.red.bold('\n🚨 Performing emergency rollback...'))
    
    try {
      const validator = new MigrationValidator({ rollbackOnFailure: true })
      await validator.performRollback()
      console.log(chalk.green('✅ Emergency rollback completed'))
    } catch (error) {
      console.error(chalk.red('❌ Emergency rollback failed:'), error.message)
    }
  }
}

// CLI Commands
program
  .name('migration-runner')
  .description('Test framework migration utility')
  .version('1.0.0')

program
  .command('migrate')
  .description('Run complete migration process')
  .option('-d, --dry-run', 'Run migration without making changes')
  .option('--no-backup', 'Skip creating backup files')
  .option('--no-validate', 'Skip validation phase')
  .option('--rollback-on-failure', 'Automatically rollback on failure')
  .option('--root <directory>', 'Root directory to migrate', './tests')
  .action(async (options) => {
    const runner = new MigrationRunner({
      dryRun: options.dryRun,
      backup: options.backup,
      validate: options.validate,
      rollbackOnFailure: options.rollbackOnFailure
    })
    
    try {
      await runner.runCompleteMigration(options.root)
      process.exit(0)
    } catch (error) {
      process.exit(1)
    }
  })

program
  .command('validate')
  .description('Validate existing migration')
  .option('--root <directory>', 'Root directory to validate', './tests')
  .action(async (options) => {
    const validator = new MigrationValidator()
    
    try {
      const report = await validator.validateMigration(options.root)
      console.log(JSON.stringify(report, null, 2))
      
      process.exit(report.summary.overallStatus === 'FAILED' ? 1 : 0)
    } catch (error) {
      process.exit(1)
    }
  })

program
  .command('rollback')
  .description('Rollback migration to previous state')
  .action(async () => {
    const validator = new MigrationValidator()
    
    try {
      await validator.performRollback()
      process.exit(0)
    } catch (error) {
      process.exit(1)
    }
  })

program
  .command('analyze')
  .description('Analyze codebase for migration planning')
  .option('--root <directory>', 'Root directory to analyze', './tests')
  .action(async (options) => {
    const runner = new MigrationRunner()
    
    try {
      const analysis = await runner.analyzeCodebase(options.root)
      console.log(JSON.stringify(analysis, null, 2))
      process.exit(0)
    } catch (error) {
      process.exit(1)
    }
  })

// Handle CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse()
}

export { MigrationRunner }
export default MigrationRunner
