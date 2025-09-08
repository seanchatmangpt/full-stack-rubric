# @nuxt/bdd Migration Guide

## Quick Start Migration

### Step 1: Install Library
```bash
pnpm add @nuxt/bdd
```

### Step 2: Update Imports (Automated)
```bash
# Run migration script
./scripts/migrate-framework-imports.sh
```

### Step 3: Validate Migration
```bash
pnpm test:migration
```

## Import Mapping Reference

### Before (Local Framework)
```javascript
// Core functionality
import { scenario, given, when, then } from '../framework/core/index.js'
import { ScenarioBuilder } from '../framework/core/index.js'

// Utilities
import { mountWithExpectations, quickTest } from '../framework/core-utils.js'

// Configuration
import { initializeZeroConfig } from '../framework/config/zero-config.js'
import { generateSmartDefaults } from '../framework/config/smart-defaults.js'
import { pluginSystem } from '../framework/config/plugin-system.js'

// BDD Steps
import { generateStepDefinition } from '../framework/bdd/step-generators.js'
import { componentSteps } from '../framework/bdd/component-steps.js'

// Integration
import { getNuxtBridge } from '../framework/integration/nuxt-bridge.js'
import { getCucumberBridge } from '../framework/integration/cucumber-bridge.js'
```

### After (Library Imports)
```javascript
// Core functionality - Main API
import { scenario, given, when, then, ScenarioBuilder } from '@nuxt/bdd/core'

// Utilities - Main utilities
import { setup, setupNuxtBDD, createFramework } from '@nuxt/bdd'

// Configuration - Config utilities  
import { createPlugin, usePlugin } from '@nuxt/bdd/config'

// BDD utilities
import { generateStepDefinition, componentSteps } from '@nuxt/bdd/bdd'

// Nuxt integration
import { getNuxtBridge, setupNuxtTesting } from '@nuxt/bdd/nuxt'

// Complete framework (if you need everything)
import BDDFramework from '@nuxt/bdd'
```

## File-by-File Migration

### Test Files
For each test file in `/tests/`:

#### Pattern 1: Simple Core Usage
```javascript
// ❌ Old
import { scenario } from '../framework/core/index.js'

// ✅ New  
import { scenario } from '@nuxt/bdd/core'
```

#### Pattern 2: Multiple Imports
```javascript
// ❌ Old
import { scenario, given, when, then } from '../framework/core/index.js'
import { mountWithExpectations } from '../framework/core-utils.js'

// ✅ New
import { scenario, given, when, then } from '@nuxt/bdd/core'
import { setup } from '@nuxt/bdd'

// Use setup for utilities
const { helpers } = await setup()
// helpers.mountWithExpectations() replaces mountWithExpectations()
```

#### Pattern 3: Configuration Usage
```javascript
// ❌ Old
import { initializeZeroConfig } from '../framework/config/zero-config.js'
import { pluginSystem } from '../framework/config/plugin-system.js'

// ✅ New
import { createFramework } from '@nuxt/bdd'
import { createPlugin } from '@nuxt/bdd/config'

// Auto-configuration is built-in to createFramework()
const framework = await createFramework({ autoConfig: true })
```

### Framework Files (Remove These)
These files should be deleted after migration:
- `/tests/framework/` - Entire directory
- All local framework imports replaced with library imports

## Configuration Migration

### Vitest Config
```javascript
// vitest.config.js
export default defineConfig({
  test: {
    setupFiles: [
      // ❌ Remove local setup
      // 'tests/framework/setup.js'
      
      // ✅ Use library setup
      '@nuxt/bdd/setup'
    ],
    globals: true,
    environment: 'jsdom'
  }
})
```

### Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:bdd": "vitest tests/**/*.steps.js",
    "test:migration": "vitest tests/migration-validation.test.js",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage"
  }
}
```

## Common Migration Issues

### Issue 1: Custom Extensions
**Problem**: Local framework has custom functions not in library
```javascript
// Custom function in local framework
import { customHelper } from '../framework/custom-helpers.js'
```

**Solution**: Create compatibility wrapper
```javascript
// Create: tests/compatibility/custom-helpers.js
import { setup } from '@nuxt/bdd'

export async function customHelper() {
  const { framework } = await setup()
  // Implement using library APIs
  return framework.scenario('custom').helpers().customLogic()
}
```

### Issue 2: Direct ScenarioBuilder Usage
**Problem**: Direct instantiation of classes
```javascript
// ❌ Old
import { ScenarioBuilder } from '../framework/core/index.js'
const scenario = new ScenarioBuilder('test')
```

**Solution**: Use factory functions
```javascript
// ✅ New
import { scenario } from '@nuxt/bdd/core'
const testScenario = scenario('test')
```

### Issue 3: Plugin System Changes
**Problem**: Plugin registration different
```javascript
// ❌ Old
import { pluginSystem } from '../framework/config/plugin-system.js'
pluginSystem.register(myPlugin)
```

**Solution**: Use library plugin system
```javascript
// ✅ New
import { createFramework, createPlugin } from '@nuxt/bdd'

const myPlugin = createPlugin('my-plugin', (framework) => {
  // Plugin implementation
})

const framework = await createFramework({
  plugins: [myPlugin]
})
```

## Advanced Migration Scenarios

### Scenario 1: Framework Subclassing
If local framework extends base classes:
```javascript
// ❌ Old - Custom framework extension
class CustomFramework extends BDDFramework {
  customMethod() {
    // Custom implementation
  }
}
```

**Migration Strategy**:
1. Move custom methods to plugins
2. Use composition over inheritance
```javascript
// ✅ New - Plugin-based approach
const customPlugin = createPlugin('custom', (framework) => {
  framework.customMethod = function() {
    // Custom implementation
  }
})

const framework = await createFramework({
  plugins: [customPlugin]
})
```

### Scenario 2: Deep Integration
For tests that deeply integrate with framework internals:
```javascript
// ❌ Old - Direct internal access
import { ScenarioBuilder } from '../framework/core/index.js'
ScenarioBuilder.prototype.myExtension = function() { }
```

**Migration Strategy**:
1. Use plugin system for extensions
2. Leverage library's extension points
```javascript
// ✅ New - Proper extension
const extensionPlugin = createPlugin('extension', (framework) => {
  // Add extensions through plugin system
})
```

## Validation Checklist

### Pre-Migration
- [ ] All tests passing with local framework
- [ ] Performance baseline established
- [ ] Custom extensions cataloged
- [ ] Import patterns documented

### During Migration
- [ ] Each batch of files migrated individually
- [ ] Tests run after each change
- [ ] Performance monitored
- [ ] Rollback plan ready

### Post-Migration
- [ ] All tests passing with library
- [ ] Performance within acceptable range
- [ ] No missing functionality
- [ ] Documentation updated
- [ ] Local framework files removed

## Troubleshooting

### Tests Failing After Migration
1. **Check Import Paths**: Ensure correct library module imported
2. **API Differences**: Some functions may have slightly different signatures
3. **Async Handling**: Library may handle promises differently
4. **Configuration**: Framework options may have changed

### Performance Issues
1. **Bundle Analysis**: Check if library adds significant overhead
2. **Lazy Loading**: Use specific imports instead of main export
3. **Tree Shaking**: Ensure unused code is eliminated

### Missing Features
1. **Feature Gaps**: Some local features may not exist in library
2. **Plugin Development**: Create plugins for missing functionality
3. **Contribution**: Consider contributing features back to library

## Best Practices

### Import Optimization
```javascript
// ✅ Good - Specific imports
import { scenario } from '@nuxt/bdd/core'
import { setup } from '@nuxt/bdd/nuxt'

// ❌ Avoid - Entire library import
import * as everything from '@nuxt/bdd'
```

### Error Handling
```javascript
// ✅ Proper error handling during migration
try {
  const framework = await createFramework()
  // Test implementation
} catch (error) {
  console.error('Framework setup failed:', error)
  // Fallback or migration issue reporting
}
```

### Performance Monitoring
```javascript
// Monitor test execution time during migration
const startTime = performance.now()
await runTests()
const endTime = performance.now()
console.log(`Test duration: ${endTime - startTime}ms`)
```

## Support

### Common Questions

**Q: Can I use both local framework and library together?**
A: Yes, during migration period both can coexist. Use feature flags to control which tests use which framework.

**Q: What if library is missing a feature I need?**
A: Create a plugin or compatibility wrapper. Consider contributing the feature back to the library.

**Q: How do I handle performance regressions?**
A: Use specific imports, enable tree-shaking, and consider lazy loading for non-critical features.

### Getting Help
- Check library documentation
- Review migration validation tests
- Ask team members who completed migration
- Create issues for library-specific problems

---

**Migration Success**: Follow this guide step-by-step and validate each change to ensure smooth transition to @nuxt/bdd library.