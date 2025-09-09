/**
 * @fileoverview Deprecation strategy and timeline for test framework migration
 * Provides structured approach to phasing out old patterns
 */

/**
 * Deprecation phases and timeline management
 */
class DeprecationStrategy {
  constructor() {
    this.phases = {
      INTRODUCTION: {
        name: 'Introduction Phase',
        duration: '2 weeks',
        description: 'Introduce new framework alongside existing patterns',
        actions: ['Add compatibility layer', 'Document new patterns', 'Train team']
      },
      SOFT_DEPRECATION: {
        name: 'Soft Deprecation',
        duration: '4 weeks', 
        description: 'Mark old patterns as deprecated with warnings',
        actions: ['Add deprecation warnings', 'Migrate critical tests', 'Update documentation']
      },
      HARD_DEPRECATION: {
        name: 'Hard Deprecation',
        duration: '4 weeks',
        description: 'Actively migrate remaining tests and block new usage',
        actions: ['Block new old-pattern usage', 'Batch migrate tests', 'Remove old dependencies']
      },
      REMOVAL: {
        name: 'Complete Removal',
        duration: '2 weeks',
        description: 'Remove old patterns completely',
        actions: ['Remove compatibility layer', 'Clean up old code', 'Validate migration']
      }
    }
    
    this.currentPhase = 'INTRODUCTION'
    this.startDate = new Date()
  }

  /**
   * Get current deprecation phase
   */
  getCurrentPhase() {
    const elapsed = Date.now() - this.startDate.getTime()
    const weeks = Math.floor(elapsed / (7 * 24 * 60 * 60 * 1000))
    
    if (weeks < 2) return this.phases.INTRODUCTION
    if (weeks < 6) return this.phases.SOFT_DEPRECATION
    if (weeks < 10) return this.phases.HARD_DEPRECATION
    return this.phases.REMOVAL
  }

  /**
   * Deprecation patterns and their replacement strategies
   */
  getDeprecationPatterns() {
    return {
      // Vue Test Utils patterns
      'mount()': {
        severity: 'warning',
        replacement: 'quickTest()',
        timeline: 'SOFT_DEPRECATION',
        autoMigration: true,
        examples: {
          old: `const wrapper = mount(Component, { props: { title: 'Test' } })`,
          new: `await quickTest('Component', Component, { title: 'Test', responsive: true })`
        }
      },
      
      'shallowMount()': {
        severity: 'warning',
        replacement: 'quickTest() with shallow option',
        timeline: 'SOFT_DEPRECATION',
        autoMigration: true,
        examples: {
          old: `const wrapper = shallowMount(Component)`,
          new: `await quickTest('Component', Component, { shallow: true })`
        }
      },
      
      // Cucumber patterns
      'Given()': {
        severity: 'info',
        replacement: 'scenario().given fluent API',
        timeline: 'INTRODUCTION',
        autoMigration: false,
        examples: {
          old: `Given('user is logged in', () => { /* setup */ })`,
          new: `await scenario('Login Flow').given.user.isLoggedIn().execute()`
        }
      },
      
      'When()': {
        severity: 'info', 
        replacement: 'scenario().when fluent API',
        timeline: 'INTRODUCTION',
        autoMigration: false,
        examples: {
          old: `When('user clicks login', () => { /* action */ })`,
          new: `await scenario('Login Flow').when.user.clicks('login').execute()`
        }
      },
      
      'Then()': {
        severity: 'info',
        replacement: 'scenario().then fluent API', 
        timeline: 'INTRODUCTION',
        autoMigration: false,
        examples: {
          old: `Then('user should see dashboard', () => { /* assertion */ })`,
          new: `await scenario('Login Flow').then.page.shouldDisplay('dashboard').execute()`
        }
      },
      
      // Manual mocking patterns
      'createMockUser()': {
        severity: 'suggestion',
        replacement: 'factories.user()',
        timeline: 'SOFT_DEPRECATION',
        autoMigration: true,
        examples: {
          old: `const mockUser = { id: 1, name: 'Test', email: 'test@example.com' }`,
          new: `const user = factories.user({ name: 'Test' })`
        }
      },
      
      'manual API mocks': {
        severity: 'suggestion',
        replacement: 'factories.apiResponse()',
        timeline: 'SOFT_DEPRECATION', 
        autoMigration: true,
        examples: {
          old: `const mockResponse = { data: {}, status: 200 }`,
          new: `const response = factories.apiResponse({})`
        }
      },
      
      // Configuration patterns
      'vitest.config with cucumber': {
        severity: 'warning',
        replacement: 'framework auto-configuration',
        timeline: 'HARD_DEPRECATION',
        autoMigration: true,
        examples: {
          old: `// Complex vitest + cucumber setup`,
          new: `import { setupNuxtBDD } from '@/tests/framework'`
        }
      }
    }
  }

  /**
   * Generate deprecation warnings based on current phase
   */
  generateDeprecationWarning(pattern, usage) {
    const patterns = this.getDeprecationPatterns()
    const config = patterns[pattern]
    
    if (!config) return null
    
    const currentPhase = this.getCurrentPhase()
    const shouldWarn = this.shouldWarnInPhase(config.timeline, currentPhase.name)
    
    if (!shouldWarn) return null
    
    return {
      level: this.getWarningLevel(currentPhase.name),
      message: this.formatWarningMessage(pattern, config, currentPhase),
      suggestion: config.replacement,
      autoMigration: config.autoMigration,
      examples: config.examples
    }
  }

  /**
   * Check if warning should be shown in current phase
   */
  shouldWarnInPhase(patternTimeline, currentPhase) {
    const phaseOrder = ['INTRODUCTION', 'SOFT_DEPRECATION', 'HARD_DEPRECATION', 'REMOVAL']
    const patternIndex = phaseOrder.indexOf(patternTimeline)
    const currentIndex = phaseOrder.indexOf(currentPhase)
    
    return currentIndex >= patternIndex
  }

  /**
   * Get warning level based on phase
   */
  getWarningLevel(phase) {
    switch (phase) {
      case 'INTRODUCTION': return 'info'
      case 'SOFT_DEPRECATION': return 'warning'
      case 'HARD_DEPRECATION': return 'error'
      case 'REMOVAL': return 'fatal'
      default: return 'info'
    }
  }

  /**
   * Format deprecation warning message
   */
  formatWarningMessage(pattern, config, currentPhase) {
    const baseMessage = `${pattern} is deprecated. Use ${config.replacement} instead.`
    
    switch (currentPhase.name) {
      case 'INTRODUCTION':
        return `💡 ${baseMessage} (New pattern available)`
        
      case 'SOFT_DEPRECATION':
        return `⚠️  ${baseMessage} (Will be removed in ${this.getTimeUntilRemoval()})`
        
      case 'HARD_DEPRECATION':
        return `❌ ${baseMessage} (DEPRECATED - Migrate immediately!)`
        
      case 'REMOVAL':
        return `🚫 ${baseMessage} (REMOVED - This will cause errors!)`
        
      default:
        return baseMessage
    }
  }

  /**
   * Calculate time until complete removal
   */
  getTimeUntilRemoval() {
    const currentPhase = this.getCurrentPhase()
    const totalWeeks = 12 // Total migration timeline
    const elapsed = Math.floor((Date.now() - this.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
    const remaining = Math.max(0, totalWeeks - elapsed)
    
    if (remaining === 0) return 'now'
    if (remaining === 1) return '1 week'
    return `${remaining} weeks`
  }

  /**
   * Generate migration roadmap
   */
  generateMigrationRoadmap() {
    const roadmap = []
    let startDate = new Date(this.startDate)
    
    Object.entries(this.phases).forEach(([key, phase]) => {
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + (parseInt(phase.duration) * 7))
      
      roadmap.push({
        phase: key,
        name: phase.name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        duration: phase.duration,
        description: phase.description,
        actions: phase.actions,
        status: this.getPhaseStatus(key)
      })
      
      startDate = new Date(endDate)
    })
    
    return roadmap
  }

  /**
   * Get status of migration phase
   */
  getPhaseStatus(phaseKey) {
    const current = this.getCurrentPhase()
    const phaseOrder = Object.keys(this.phases)
    const currentIndex = phaseOrder.findIndex(key => this.phases[key] === current)
    const phaseIndex = phaseOrder.indexOf(phaseKey)
    
    if (phaseIndex < currentIndex) return 'completed'
    if (phaseIndex === currentIndex) return 'active'
    return 'pending'
  }

  /**
   * Generate enforcement rules for linters/CI
   */
  generateEnforcementRules() {
    const currentPhase = this.getCurrentPhase()
    const patterns = this.getDeprecationPatterns()
    
    const rules = {
      eslint: [],
      vitest: [],
      ci: []
    }
    
    Object.entries(patterns).forEach(([pattern, config]) => {
      if (this.shouldWarnInPhase(config.timeline, currentPhase.name)) {
        const level = this.getWarningLevel(currentPhase.name)
        
        // ESLint rules
        if (pattern.includes('mount')) {
          rules.eslint.push({
            rule: 'no-deprecated-test-utils',
            level: level === 'fatal' ? 'error' : 'warn',
            pattern: pattern
          })
        }
        
        // Vitest rules  
        if (pattern.includes('Given') || pattern.includes('When') || pattern.includes('Then')) {
          rules.vitest.push({
            rule: 'no-deprecated-cucumber',
            level: level === 'fatal' ? 'error' : 'warn', 
            pattern: pattern
          })
        }
        
        // CI enforcement
        if (level === 'error' || level === 'fatal') {
          rules.ci.push({
            rule: 'block-deprecated-patterns',
            action: 'fail-build',
            pattern: pattern
          })
        }
      }
    })
    
    return rules
  }

  /**
   * Generate phase transition checklist
   */
  generateTransitionChecklist(targetPhase) {
    const checklists = {
      SOFT_DEPRECATION: [
        'Add deprecation warnings to all old patterns',
        'Update documentation with migration examples',
        'Train development team on new patterns', 
        'Set up automated migration tools',
        'Identify critical tests for priority migration'
      ],
      
      HARD_DEPRECATION: [
        'Configure linters to error on deprecated patterns',
        'Block new usage of old patterns in CI',
        'Batch migrate remaining test files',
        'Update all documentation',
        'Remove deprecated dependencies where possible'
      ],
      
      REMOVAL: [
        'Remove all compatibility layer code',
        'Delete old pattern implementations',
        'Clean up unused dependencies',
        'Validate 100% migration completion',
        'Archive old documentation'
      ]
    }
    
    return checklists[targetPhase] || []
  }

  /**
   * Export configuration for tools integration
   */
  exportConfiguration() {
    return {
      deprecationStrategy: {
        currentPhase: this.getCurrentPhase().name,
        patterns: this.getDeprecationPatterns(),
        enforcementRules: this.generateEnforcementRules(),
        migrationRoadmap: this.generateMigrationRoadmap(),
        startDate: this.startDate.toISOString()
      }
    }
  }
}

/**
 * Deprecation warning tracker
 */
class DeprecationTracker {
  constructor() {
    this.warnings = new Map()
    this.stats = {
      totalWarnings: 0,
      uniquePatterns: 0,
      suppressedWarnings: 0
    }
  }

  /**
   * Track deprecation warning
   */
  trackWarning(pattern, location, suppressed = false) {
    const key = `${pattern}:${location}`
    
    if (!this.warnings.has(key)) {
      this.warnings.set(key, {
        pattern,
        location,
        firstSeen: new Date(),
        count: 0,
        suppressed
      })
      this.stats.uniquePatterns++
    }
    
    this.warnings.get(key).count++
    this.warnings.get(key).lastSeen = new Date()
    
    this.stats.totalWarnings++
    if (suppressed) this.stats.suppressedWarnings++
  }

  /**
   * Generate deprecation report
   */
  generateReport() {
    const warningsByPattern = new Map()
    
    this.warnings.forEach((warning) => {
      if (!warningsByPattern.has(warning.pattern)) {
        warningsByPattern.set(warning.pattern, [])
      }
      warningsByPattern.get(warning.pattern).push(warning)
    })
    
    return {
      summary: this.stats,
      patterns: Object.fromEntries(warningsByPattern),
      topPatterns: this.getTopPatterns(),
      migrationPriority: this.calculateMigrationPriority()
    }
  }

  /**
   * Get most common deprecated patterns
   */
  getTopPatterns() {
    const patternCounts = new Map()
    
    this.warnings.forEach((warning) => {
      patternCounts.set(
        warning.pattern,
        (patternCounts.get(warning.pattern) || 0) + warning.count
      )
    })
    
    return Array.from(patternCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
  }

  /**
   * Calculate migration priority for patterns
   */
  calculateMigrationPriority() {
    const priorities = []
    
    this.getTopPatterns().forEach(([pattern, count]) => {
      const uniqueLocations = Array.from(this.warnings.values())
        .filter(w => w.pattern === pattern).length
      
      const priority = {
        pattern,
        count,
        locations: uniqueLocations,
        score: count * Math.log(uniqueLocations + 1),
        recommendation: count > 50 ? 'HIGH' : count > 20 ? 'MEDIUM' : 'LOW'
      }
      
      priorities.push(priority)
    })
    
    return priorities.sort((a, b) => b.score - a.score)
  }
}

// Export strategy and tracker
const deprecationStrategy = new DeprecationStrategy()
const deprecationTracker = new DeprecationTracker()

export { DeprecationStrategy, DeprecationTracker, deprecationStrategy, deprecationTracker }
export default deprecationStrategy
