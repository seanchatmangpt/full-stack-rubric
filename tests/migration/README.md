# Test Framework Migration Toolkit

Complete migration utilities for transitioning from existing test patterns to the ultra-efficient BDD + Nuxt 4 testing micro-framework.

## 🚀 Quick Start

```bash
# Run complete migration
node tests/migration/scripts/migration-runner.js migrate --root ./tests

# Dry run (preview changes)
node tests/migration/scripts/migration-runner.js migrate --dry-run

# Validate existing migration
node tests/migration/scripts/migration-runner.js validate

# Rollback if needed
node tests/migration/scripts/migration-runner.js rollback
```

## 📁 Toolkit Components

### 1. Automated Migration Tools

- **`codemods/test-framework-migrator.js`** - AST-based transformation engine
- **`scripts/vitest-cucumber-migrator.js`** - Specialized Gherkin → Fluent BDD migration
- **`scripts/migration-runner.js`** - Complete CLI orchestration tool

### 2. Compatibility & Transition

- **`compatibility/legacy-adapter.js`** - Backward compatibility layer with warnings
- **`deprecation-strategy.js`** - Phased timeline and enforcement rules

### 3. Validation & Safety

- **`validation/migration-validator.js`** - Syntax, test, and performance validation
- **`validation/migration-validation.test.js`** - Tests for migration tools

## 🔄 Migration Process

### Phase 1: Analysis
```bash
node tests/migration/scripts/migration-runner.js analyze
```
- Scans codebase for migration patterns
- Estimates complexity and duration
- Identifies potential issues

### Phase 2: Core Framework Migration
- **Vue Test Utils → quickTest()**: `mount()` calls converted automatically
- **Manual Mocks → Factories**: Object detection and replacement
- **Imports**: Updated to use micro-framework

### Phase 3: Vitest + Cucumber Migration
- **.feature files → .bdd.js**: Gherkin converted to fluent BDD
- **Step definitions → Helpers**: Given/When/Then to fluent API
- **Configuration**: Simplified setup

### Phase 4: Validation
- **Syntax checking**: Parse and validate migrated files
- **Test execution**: Run migrated tests to verify functionality
- **Performance benchmarking**: Compare before/after metrics

## 📊 Pattern Mappings

### Vue Test Utils Migration
```javascript
// OLD
const wrapper = mount(Component, { props: { title: 'Test' } })
expect(wrapper.find('.title').text()).toBe('Test')

// NEW  
await quickTest('Component', Component, {
  props: { title: 'Test' },
  responsive: true,
  a11y: true
})
```

### Cucumber → Fluent BDD
```javascript
// OLD
Given('user is logged in', () => { /* setup */ })
When('user clicks login', () => { /* action */ })
Then('user should see dashboard', () => { /* assertion */ })

// NEW
await scenario('User Login Flow')
  .given.user.isLoggedIn()
  .when.user.clicks('login')
  .then.page.shouldDisplay('dashboard')
  .execute()
```

### Manual Mocks → Factories
```javascript
// OLD
const mockUser = {
  id: 1,
  name: 'Test User', 
  email: 'test@example.com'
}

// NEW
const user = factories.user({ name: 'Test User' })
```

## 🛡️ Safety Features

### Automatic Backup
- All original files backed up with `.backup` extension
- Rollback command restores from backups
- Migration artifacts cleaned up on rollback

### Validation Layers
1. **Syntax Validation**: Parse files for errors
2. **Test Execution**: Run migrated tests
3. **Performance Monitoring**: Track speed/memory impact
4. **Success Scoring**: Calculate migration success rate

### Rollback Protection
- Automatic rollback on < 50% success rate
- Manual rollback command available
- Emergency rollback on validation failure

## 📈 Expected Improvements

- **80% less boilerplate** - One-liner tests replace dozens of lines
- **2.8-4.4x speed improvement** - Framework optimizations
- **95% automation rate** - Vue Test Utils patterns
- **70% automation rate** - Cucumber step definitions
- **Zero configuration** - Auto-setup replaces complex configs

## 🕒 Migration Timeline

### 12-Week Phased Approach

1. **Introduction (2 weeks)**: New framework alongside existing
2. **Soft Deprecation (4 weeks)**: Warnings for old patterns
3. **Hard Deprecation (4 weeks)**: Block new old-pattern usage
4. **Complete Removal (2 weeks)**: Remove compatibility layer

### Enforcement Rules
- ESLint rules for deprecated patterns
- CI/CD pipeline integration
- Automated blocking of old patterns

## 🔧 Advanced Usage

### Programmatic API
```javascript
import { TestFrameworkMigrator } from './codemods/test-framework-migrator.js'
import { MigrationValidator } from './validation/migration-validator.js'

const migrator = new TestFrameworkMigrator({
  dryRun: false,
  backupOriginal: true,
  verbose: true
})

const report = await migrator.migrate('./tests')
const validator = new MigrationValidator()
const validation = await validator.validateMigration('./tests')
```

### Custom Pattern Detection
```javascript
// Add custom transformation patterns
migrator.addCustomPattern('oldFunction', 'newFunction')
```

### Compatibility Layer
```javascript
// Enable during transition
import { mount, Given, When, Then } from './compatibility/legacy-adapter.js'

// Provides warnings and migration hints
const wrapper = mount(Component) // Shows: "Use quickTest() instead"
```

## 📋 Migration Checklist

### Pre-Migration
- [ ] Analyze codebase complexity
- [ ] Review migration timeline
- [ ] Set up backup strategy
- [ ] Configure validation criteria

### During Migration
- [ ] Run migration in phases
- [ ] Monitor validation results
- [ ] Address failures immediately
- [ ] Track performance metrics

### Post-Migration
- [ ] Validate 100% success rate
- [ ] Update CI/CD pipelines
- [ ] Train team on new patterns
- [ ] Remove compatibility layer
- [ ] Archive old documentation

## 🐛 Troubleshooting

### Common Issues
1. **Syntax Errors**: Check AST transformation patterns
2. **Test Failures**: Review step definition mappings
3. **Performance Regression**: Analyze benchmark data
4. **Import Errors**: Verify framework setup

### Recovery Commands
```bash
# Check validation status
node tests/migration/scripts/migration-runner.js validate --root ./tests

# Rollback specific files
git checkout HEAD -- tests/problematic.test.js

# Emergency rollback
node tests/migration/scripts/migration-runner.js rollback
```

## 📚 Documentation

- **Migration Strategy**: [CLAUDE.md](../../CLAUDE.md#ultra-efficient-bdd--nuxt-4-testing-micro-framework)
- **Framework Guide**: [/tests/framework/](../framework/)
- **Validation Reports**: Generated in `.migration-reports/`
- **Memory Storage**: Migration data stored in `.swarm/memory.db`

## 🤝 Support

- Check validation reports for specific guidance
- Use `--verbose` flag for detailed logging  
- Review memory storage for migration context
- Consult framework documentation for new patterns

---

**Migration Success Rate Target: 95%+**
**Performance Improvement Target: 2.8x+**
**Automation Coverage: 80%+**