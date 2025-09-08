# @nuxt/bdd Library Integration Plan

## Executive Summary

This document outlines the strategy for replacing the local `/tests/framework/` implementation with the published `@nuxt/bdd` library (v1.0.0), ensuring seamless migration with zero downtime and backward compatibility.

## Current State Analysis

### Local Framework Structure
The current `/tests/framework/` contains 46+ modules organized in:
- **Core**: `core/index.js`, `core-utils.js` - Main framework functionality
- **BDD**: `bdd/` - Step generators, component steps, navigation steps
- **Config**: `config/` - Auto-discovery, smart defaults, plugin system
- **Components**: `components/` - Vue component testing utilities
- **API**: `api/` - Mock factories, validation helpers
- **Performance**: `performance/` - Benchmarks, memory monitoring
- **Visual**: `visual/` - Snapshot testing, diff tools
- **Factories**: `factories/` - Data factories for testing
- **Integration**: `integration/` - Nuxt and Cucumber bridges

### Library Structure (@nuxt/bdd v1.0.0)
The published library provides modular exports:
- **Main**: Complete framework (`@nuxt/bdd`)
- **BDD**: BDD utilities (`@nuxt/bdd/bdd`) 
- **Nuxt**: Nuxt integration (`@nuxt/bdd/nuxt`)
- **Config**: Configuration utilities (`@nuxt/bdd/config`)
- **Core**: Core functionality (`@nuxt/bdd/core`)

### Current Usage Patterns
Analysis shows 6 test files importing from local framework:
```javascript
import { scenario } from '../framework/core/index.js'
import { mountWithExpectations } from '../framework/core-utils.js'
import { initializeZeroConfig } from '../framework/config/zero-config.js'
```

## Migration Strategy

### Phase 1: Preparation & Dependencies (Week 1)

#### 1.1 Add Library Dependency
```json
{
  "dependencies": {
    "@nuxt/bdd": "^1.0.0"
  }
}
```

#### 1.2 Create Import Mapping
Map local framework imports to library exports:

| Local Import | Library Import | Module |
|-------------|----------------|---------|
| `../framework/core/index.js` | `@nuxt/bdd/core` | Core functionality |
| `../framework/core-utils.js` | `@nuxt/bdd` | Main utilities |
| `../framework/config/` | `@nuxt/bdd/config` | Configuration |
| `../framework/bdd/` | `@nuxt/bdd/bdd` | BDD utilities |
| `../framework/integration/nuxt-bridge.js` | `@nuxt/bdd/nuxt` | Nuxt integration |

#### 1.3 Compatibility Shim
Create temporary compatibility layer:
```javascript
// /tests/framework-compat/index.js
import * as nuxtBDD from '@nuxt/bdd'
import * as bddUtils from '@nuxt/bdd/bdd'
import * as nuxtUtils from '@nuxt/bdd/nuxt'
import * as configUtils from '@nuxt/bdd/config'
import * as coreUtils from '@nuxt/bdd/core'

// Re-export for backward compatibility
export * from '@nuxt/bdd'
export { scenario, given, when, then } from '@nuxt/bdd/core'
export { mountWithExpectations } from '@nuxt/bdd'
```

### Phase 2: Gradual Migration (Week 2-3)

#### 2.1 Migration Batches
Migrate imports in small batches:

**Batch 1**: Core functionality
- `tests/framework-validation/self-test.test.js`
- `tests/framework-validation/extensibility-tests.test.js`

**Batch 2**: Integration tests  
- `tests/framework-validation/integration-tests.test.js`
- `tests/framework-validation/comparison-benchmarks.test.js`

**Batch 3**: Performance tests
- `tests/framework-validation/performance-benchmarks.test.js`

#### 2.2 Migration Script
Automated import replacement:
```bash
#!/bin/bash
# migrate-imports.sh
find tests/ -name "*.js" -type f -exec sed -i '' \
  -e "s|from '../framework/core/index.js'|from '@nuxt/bdd/core'|g" \
  -e "s|from '../framework/core-utils.js'|from '@nuxt/bdd'|g" \
  -e "s|from '../framework/config/|from '@nuxt/bdd/config'|g" \
  {} +
```

#### 2.3 Validation Testing
For each batch:
1. Run existing tests with library imports
2. Compare test results (before vs after)
3. Verify performance metrics remain stable
4. Check memory usage hasn't increased

### Phase 3: Feature Parity Validation (Week 3-4)

#### 3.1 API Compatibility Matrix
Validate all exported functions work identically:

| Function | Local Framework | @nuxt/bdd | Status |
|----------|----------------|-----------|--------|
| `scenario()` | ✅ | ✅ | Compatible |
| `given()` | ✅ | ✅ | Compatible |
| `when()` | ✅ | ✅ | Compatible |
| `then()` | ✅ | ✅ | Compatible |
| `mountWithExpectations()` | ✅ | ✅ | Compatible |
| `initializeZeroConfig()` | ✅ | ❓ | Needs validation |
| `pluginSystem` | ✅ | ❓ | Needs validation |

#### 3.2 Missing Features Analysis
Identify local framework features not in library:
- Custom extensions
- Project-specific utilities
- Performance optimizations
- Local configuration overrides

### Phase 4: Framework Removal (Week 4-5)

#### 4.1 Gradual Removal
Remove local framework modules in reverse dependency order:
1. Remove leaf modules (examples, documentation)
2. Remove specialized modules (factories, visual)
3. Remove integration modules
4. Remove core modules last

#### 4.2 Cleanup Script
```bash
#!/bin/bash
# Remove framework directories
rm -rf tests/framework/examples/
rm -rf tests/framework/visual/
rm -rf tests/framework/factories/
rm -rf tests/framework/performance/
rm -rf tests/framework/api/
rm -rf tests/framework/components/
rm -rf tests/framework/config/
rm -rf tests/framework/bdd/
rm -rf tests/framework/integration/
rm -rf tests/framework/utils/
rm -rf tests/framework/core/
rm tests/framework/index.js
rm tests/framework/core-utils.js
```

## Backward Compatibility Strategy

### Approach 1: Gradual Replacement
- Keep both local framework and library during transition
- Update imports file by file
- Verify each change individually
- Remove local files only after successful migration

### Approach 2: Compatibility Wrapper
Create wrapper that delegates to library:
```javascript
// tests/framework/index.js (compatibility wrapper)
import * as libFramework from '@nuxt/bdd'
import { deprecationWarning } from './utils/deprecation.js'

export function scenario(description) {
  deprecationWarning('scenario', '@nuxt/bdd/core')
  return libFramework.scenario(description)
}

export * from '@nuxt/bdd'
```

### Approach 3: Dual Import Support
Support both import patterns temporarily:
```javascript
// Support both:
// import { scenario } from '../framework/core/index.js'  // Old
// import { scenario } from '@nuxt/bdd/core'              // New
```

## Validation Process

### Pre-Migration Tests
1. **Functionality Tests**: Ensure all existing tests pass
2. **Performance Tests**: Baseline current performance metrics
3. **Integration Tests**: Test with Nuxt 4 and Vitest
4. **Memory Tests**: Monitor memory usage patterns

### Post-Migration Validation
1. **Regression Tests**: All tests must continue passing
2. **Performance Comparison**: Library should not degrade performance
3. **Bundle Size**: Verify no significant size increase
4. **API Compatibility**: All functions work identically

### Automated Validation
```javascript
// tests/migration-validation.test.js
import { describe, it, expect } from 'vitest'
import * as localFramework from '../framework/index.js'
import * as libraryFramework from '@nuxt/bdd'

describe('Migration Validation', () => {
  it('should have identical API surface', () => {
    const localAPI = Object.keys(localFramework)
    const libraryAPI = Object.keys(libraryFramework)
    
    expect(libraryAPI).toEqual(expect.arrayContaining(localAPI))
  })
  
  it('should produce identical test results', async () => {
    const localResult = await localFramework.scenario('test').execute()
    const libraryResult = await libraryFramework.scenario('test').execute()
    
    expect(libraryResult).toEqual(localResult)
  })
})
```

## Risk Mitigation

### High-Risk Areas
1. **Custom Extensions**: Local modifications not in library
2. **Performance Regressions**: Library may have different performance characteristics
3. **API Changes**: Subtle differences in function behavior
4. **Configuration**: Project-specific configuration may not transfer

### Mitigation Strategies
1. **Feature Flags**: Enable/disable library usage per test file
2. **Rollback Plan**: Keep local framework until full validation
3. **Monitoring**: Track test execution time and success rates
4. **Staged Deployment**: Migrate non-critical tests first

### Rollback Procedure
If migration fails:
1. Revert import changes using git
2. Restore local framework files
3. Run full test suite to verify restoration
4. Document issues for future resolution

## Timeline & Milestones

### Week 1: Preparation
- [ ] Add @nuxt/bdd dependency
- [ ] Create compatibility mapping
- [ ] Set up validation framework
- [ ] Baseline current metrics

### Week 2: Core Migration  
- [ ] Migrate core functionality imports
- [ ] Update 2-3 test files
- [ ] Validate functionality parity
- [ ] Performance testing

### Week 3: Full Migration
- [ ] Migrate remaining test files
- [ ] Complete API compatibility validation
- [ ] Address any missing features
- [ ] Documentation updates

### Week 4: Cleanup
- [ ] Remove local framework files
- [ ] Final validation
- [ ] Performance comparison
- [ ] Update CI/CD pipelines

### Week 5: Monitoring
- [ ] Monitor production usage
- [ ] Address any issues
- [ ] Documentation completion
- [ ] Team training

## Configuration Updates

### Package.json Changes
```json
{
  "dependencies": {
    "@nuxt/bdd": "^1.0.0"
  },
  "scripts": {
    "test:bdd": "vitest tests/**/*.steps.js",
    "test:migration": "vitest tests/migration-validation.test.js"
  }
}
```

### Vitest Config Updates
```javascript
// vitest.config.js
export default defineConfig({
  test: {
    setupFiles: [
      '@nuxt/bdd/setup'  // Replace local setup
    ]
  }
})
```

## Success Metrics

### Functional Metrics
- [ ] 100% test pass rate maintained
- [ ] Zero API breaking changes
- [ ] All BDD features working
- [ ] Nuxt integration functional

### Performance Metrics
- [ ] Test execution time: ≤5% increase
- [ ] Memory usage: ≤10% increase  
- [ ] Bundle size: ≤15% increase
- [ ] CI/CD pipeline time: No regression

### Quality Metrics
- [ ] Code coverage maintained
- [ ] No new linting errors
- [ ] Documentation updated
- [ ] Team satisfaction survey

## Post-Migration Benefits

### Immediate Benefits
1. **Reduced Maintenance**: No local framework to maintain
2. **Better Updates**: Automatic library updates via npm
3. **Community Support**: Shared maintenance with Nuxt community
4. **Standardization**: Using official Nuxt BDD patterns

### Long-term Benefits
1. **Feature Velocity**: Faster access to new BDD features
2. **Bug Fixes**: Automatic bug fixes from library updates
3. **Performance**: Library optimizations benefit all users
4. **Documentation**: Official documentation and examples

## Communication Plan

### Internal Communication
- Weekly progress updates to team
- Migration status in daily standups  
- Demo sessions for new library features
- FAQ document for common issues

### Documentation Updates
- Update README with new import patterns
- Create migration guide for future projects
- Update contributing guidelines
- Update onboarding documentation

---

**Integration Manager**: Schedule regular checkpoints and maintain rollback readiness throughout the migration process.