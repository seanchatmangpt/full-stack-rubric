# Zero-Config System - Intelligent Auto-Discovery & Configuration

A production-ready zero-configuration system that intelligently analyzes project structure and automatically generates optimal configurations with BDD testing support.

## 🚀 Features

- **🔍 Intelligent Auto-Discovery**: Automatically detects project structure, dependencies, and patterns
- **🧠 Smart Defaults**: Generates optimized configurations based on detected patterns
- **📋 Preset System**: Pre-configured setups for common project types
- **🔌 Plugin Architecture**: Extensible system for custom functionality
- **🧪 BDD Integration**: Built-in support for Behavior-Driven Development
- **⚡ Convention over Configuration**: Minimal setup with maximum functionality
- **🎯 Project Health Analysis**: Comprehensive health scoring and recommendations

## 📁 System Architecture

```
src/config/
├── index.js              # Main entry point with convenience functions
├── zero-config.js         # Core zero-config orchestration system
├── auto-discovery.js      # Project structure detection and analysis
├── smart-defaults.js      # Intelligent default generation
├── presets.js            # Pre-configured project templates
├── plugin-system.js      # Extensible plugin architecture
└── README.md            # This documentation
```

## 🛠 Quick Start

### Basic Usage

```javascript
import { autoConfig } from './config/index.js'

// Initialize zero-config setup
const result = await autoConfig()

if (result.success) {
  console.log('✅ Zero-config setup completed!')
  console.log('📝 Files created:', result.filesCreated)
  console.log('💡 Recommendations:', result.recommendations)
}
```

### Project Analysis

```javascript
import { analyzeProject } from './config/index.js'

// Analyze project health and get recommendations
const analysis = await analyzeProject()

console.log(`📊 Health Score: ${analysis.health.score}/100`)
console.log(`📋 Grade: ${analysis.health.grade}`)
console.log('🎯 Recommendations:', analysis.recommendations)
```

### Create New Project

```javascript
import { createNewProject } from './config/zero-config.js'

// Create a new BDD-ready Nuxt project
const result = await createNewProject('my-app', '/path/to/projects', {
  enableBDD: true,
  preset: 'testing-focused'
})
```

## 🎯 Presets Available

### BDD-Enhanced Presets

- **`nuxt-bdd-basic`** - Simple Nuxt 3 with BDD testing
- **`content-site-bdd`** - Content website with BDD scenarios
- **`ecommerce-bdd`** - E-commerce with comprehensive BDD testing
- **`api-first-bdd`** - API-focused with BDD API testing
- **`testing-focused`** - Maximum testing coverage with BDD
- **`pwa-bdd`** - Progressive Web App with BDD
- **`multilang-bdd`** - Multi-language site with i18n BDD

### Using Presets

```javascript
import { getPreset, applyPreset } from './config/presets.js'

// Get preset information
const preset = getPreset('testing-focused')

// Apply preset to configuration
const config = applyPreset('testing-focused', currentConfig, {
  enableBDD: true
})
```

## 🔍 Auto-Discovery Capabilities

The system automatically detects:

- **Project Type**: Nuxt 3, Nuxt 2, Vue 3, Node.js
- **Framework Version**: Specific version detection
- **Directory Structure**: Standard and custom directories
- **Dependencies**: All package.json dependencies
- **Testing Setup**: Vitest, Jest, Cucumber, Playwright
- **BDD Structure**: Feature files, step definitions
- **Configuration Files**: Nuxt config, test configs

```javascript
import { discoverProjectStructure } from './config/auto-discovery.js'

const structure = await discoverProjectStructure()

console.log('Project type:', structure.type)
console.log('Framework:', structure.framework)
console.log('Directories found:', structure.directories)
console.log('BDD structure:', structure.bddStructure)
```

## 🧠 Smart Defaults Generation

Intelligent defaults based on project analysis:

```javascript
import { generateSmartDefaults } from './config/smart-defaults.js'

const config = await generateSmartDefaults(process.cwd(), {
  enableBDD: true,
  testingFramework: 'vitest'
})

// Generated configuration includes:
// - Nuxt 3 optimizations
// - Testing framework setup
// - BDD configuration
// - Performance optimizations
// - Security headers
// - SEO defaults
```

## 🔌 Plugin System

### Using Built-in Plugins

```javascript
import { pluginSystem } from './config/plugin-system.js'

// Plugins are automatically loaded, but you can add custom ones
await pluginSystem.use({
  name: 'my-custom-plugin',
  version: '1.0.0',
  bddEnabled: true,
  install: (system, options) => {
    system.hook('config:modify', (config) => {
      // Modify configuration
      return config
    })
  }
})
```

### Available Built-in Plugins

- **`nuxt-core`** - Core Nuxt 3 enhancements
- **`bdd-testing`** - BDD testing configuration
- **`typescript`** - TypeScript support
- **`vitest`** - Vitest integration
- **`environment`** - Environment-based config
- **`performance`** - Performance optimizations
- **`security`** - Security headers
- **`accessibility`** - A11y testing support

## 📊 Health Analysis

Comprehensive project health assessment:

```javascript
import { generateHealthReport } from './config/auto-discovery.js'

const health = await generateHealthReport()

console.log('Health Categories:')
console.log(`Structure: ${health.categories.structure}/25`)
console.log(`Testing: ${health.categories.testing}/30`)
console.log(`Configuration: ${health.categories.configuration}/20`)
console.log(`Dependencies: ${health.categories.dependencies}/15`)
console.log(`BDD: ${health.categories.bdd}/10`)
```

## 🧪 BDD Integration

### Automatic BDD Setup

The system automatically:
- Creates BDD directory structure
- Configures Cucumber
- Sets up step definitions
- Generates example scenarios
- Integrates with Vitest and Playwright

### BDD Configuration

```javascript
// Automatic BDD configuration
const bddConfig = {
  enabled: true,
  featuresDir: 'tests/features',
  stepDefinitionsDir: 'tests/steps',
  cucumber: {
    paths: ['tests/features/**/*.feature'],
    require: ['tests/steps/**/*.js'],
    format: ['progress', 'json:tests/results/cucumber-report.json']
  }
}
```

### Generated File Structure

```
tests/
├── features/
│   └── example.feature
├── steps/
│   └── example.steps.js
├── setup/
│   ├── global-setup.js
│   └── bdd-setup.js
└── results/
    ├── cucumber-report.json
    └── cucumber-report.html
```

## 🎛 Configuration Options

### initializeZeroConfig Options

```javascript
const options = {
  updatePackageJson: true,     // Update package.json scripts
  createDirectories: true,     // Create essential directories
  usePreset: true,            // Apply recommended presets
  enableBDD: true,            // Enable BDD testing
  createExampleTests: true,   // Create example test files
  overwrite: false,           // Overwrite existing files
  preset: 'testing-focused'   // Specific preset to use
}
```

### Environment-Specific Configuration

```javascript
import { generateEnvironmentDefaults } from './config/smart-defaults.js'

const devConfig = generateEnvironmentDefaults('development', structure)
const prodConfig = generateEnvironmentDefaults('production', structure)
const testConfig = generateEnvironmentDefaults('test', structure)
```

## 📝 Generated Files

The system can generate:

- **`nuxt.config.js`** - Nuxt configuration
- **`vitest.config.js`** - Vitest testing configuration
- **`cucumber.config.js`** - BDD testing configuration
- **`tailwind.config.js`** - Tailwind CSS configuration
- **`assets/css/main.css`** - Main stylesheet
- **Example BDD files** - Sample features and steps

## 🚀 CLI Integration

Future CLI integration (planned):

```bash
# Quick setup
npx nuxt-bdd-config init

# Analyze project
npx nuxt-bdd-config analyze

# Apply preset
npx nuxt-bdd-config preset testing-focused

# Generate health report
npx nuxt-bdd-config health
```

## 🔧 Advanced Usage

### Custom Preset Creation

```javascript
import { generateCustomPreset } from './config/presets.js'

const customPreset = generateCustomPreset({
  name: 'My Custom Setup',
  features: ['content', 'i18n', 'pwa'],
  bdd: true,
  e2e: true,
  accessibility: true
})
```

### Plugin Development

```javascript
import { createPlugin } from './config/plugin-system.js'

const myPlugin = createPlugin({
  name: 'my-feature-plugin',
  bddEnabled: true,
  install: (system, options) => {
    // Add hooks, middleware, or modify configuration
    system.hook('config:modify', (config) => {
      // Custom configuration logic
      return config
    })
  }
})

await pluginSystem.use(myPlugin)
```

## 🏆 Best Practices

### Convention Recommendations

1. **Directory Structure**: Use `app/` directory for Nuxt 3
2. **Testing**: Organize tests by type (`unit/`, `integration/`, `e2e/`)
3. **BDD**: Write scenarios in plain English using Given/When/Then
4. **Configuration**: Prefer environment variables for sensitive data
5. **Performance**: Enable compression and image optimization

### File Organization

```
project/
├── app/                    # Nuxt 3 app directory
│   ├── components/        # Vue components
│   ├── pages/            # Route pages
│   └── composables/      # Composition functions
├── server/               # Server-side code
│   └── api/             # API routes
├── tests/               # All tests
│   ├── features/        # BDD feature files
│   ├── steps/          # BDD step definitions
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── e2e/            # End-to-end tests
└── config files...
```

## 🤝 Contributing

The zero-config system is designed to be extensible. Contribute by:

1. Adding new presets for specific use cases
2. Creating plugins for framework integrations
3. Enhancing auto-discovery capabilities
4. Improving BDD scenario generation
5. Adding more intelligent defaults

## 📈 Metrics & Analytics

The system tracks:
- Setup success rates
- Configuration decisions
- Plugin usage
- Health score improvements
- BDD adoption rates

Access metrics through the plugin system hooks or memory storage.

---

Built with ❤️ for the Nuxt and BDD testing community.