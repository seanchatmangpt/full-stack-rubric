/**
 * Auto-Configuration Plugin - Convention over configuration
 * Automatically configures framework based on project structure
 */

import { existsSync, readdirSync, statSync } from 'fs'
import { join, relative, basename, extname } from 'path'

/**
 * Auto-Configuration Manager
 * Scans project structure and generates configurations
 */
export class AutoConfigManager {
  constructor(options = {}) {
    this.options = {
      rootDir: process.cwd(),
      appDir: 'app',
      serverDir: 'server', 
      pagesDir: 'app/pages',
      componentsDir: 'app/components',
      storesDir: 'app/stores',
      apiDir: 'server/api',
      testDir: 'tests',
      ...options
    }
    
    this.config = {
      pages: [],
      components: [],
      stores: [],
      apis: [],
      helpers: {},
      conventions: {}
    }
  }

  /**
   * Scan entire project and generate auto-configuration
   * @returns {Object} - Generated configuration
   */
  async scanAndConfigure() {
    console.log('🔍 Auto-configuring BDD framework...')
    
    // Scan different directories
    await Promise.all([
      this.scanPages(),
      this.scanComponents(),
      this.scanStores(),
      this.scanApis(),
      this.detectConventions(),
      this.generateHelpers()
    ])
    
    console.log('✅ Auto-configuration complete')
    return this.config
  }

  /**
   * Scan pages directory and generate page helpers
   * @returns {Promise<void>}
   */
  async scanPages() {
    const pagesDir = join(this.options.rootDir, this.options.pagesDir)
    
    if (!existsSync(pagesDir)) {
      console.warn(`⚠️  Pages directory not found: ${pagesDir}`)
      return
    }
    
    const pages = this.scanDirectory(pagesDir, {
      extensions: ['.vue', '.js', '.ts'],
      recursive: true
    })
    
    this.config.pages = pages.map(page => ({
      name: this.getPageName(page.path),
      path: this.getPageRoute(page.path),
      component: page.path,
      helpers: this.generatePageHelpers(page)
    }))
    
    console.log(`📄 Found ${this.config.pages.length} pages`)
  }

  /**
   * Scan components directory and generate component helpers
   * @returns {Promise<void>}
   */
  async scanComponents() {
    const componentsDir = join(this.options.rootDir, this.options.componentsDir)
    
    if (!existsSync(componentsDir)) {
      console.warn(`⚠️  Components directory not found: ${componentsDir}`)
      return
    }
    
    const components = this.scanDirectory(componentsDir, {
      extensions: ['.vue', '.js', '.ts'],
      recursive: true
    })
    
    this.config.components = components.map(component => ({
      name: this.getComponentName(component.path),
      path: component.path,
      tag: this.getComponentTag(component.path),
      helpers: this.generateComponentHelpers(component)
    }))
    
    console.log(`🧩 Found ${this.config.components.length} components`)
  }

  /**
   * Scan stores directory and generate store helpers
   * @returns {Promise<void>}
   */
  async scanStores() {
    const storesDir = join(this.options.rootDir, this.options.storesDir)
    
    if (!existsSync(storesDir)) {
      console.warn(`⚠️  Stores directory not found: ${storesDir}`)
      return
    }
    
    const stores = this.scanDirectory(storesDir, {
      extensions: ['.js', '.ts'],
      recursive: true
    })
    
    this.config.stores = stores.map(store => ({
      name: this.getStoreName(store.path),
      path: store.path,
      helpers: this.generateStoreHelpers(store)
    }))
    
    console.log(`🗄️  Found ${this.config.stores.length} stores`)
  }

  /**
   * Scan API directory and generate API helpers
   * @returns {Promise<void>}
   */
  async scanApis() {
    const apiDir = join(this.options.rootDir, this.options.apiDir)
    
    if (!existsSync(apiDir)) {
      console.warn(`⚠️  API directory not found: ${apiDir}`)
      return
    }
    
    const apis = this.scanDirectory(apiDir, {
      extensions: ['.js', '.ts'],
      recursive: true
    })
    
    this.config.apis = apis.map(api => ({
      name: this.getApiName(api.path),
      endpoint: this.getApiEndpoint(api.path),
      methods: this.detectApiMethods(api.path),
      helpers: this.generateApiHelpers(api)
    }))
    
    console.log(`🔗 Found ${this.config.apis.length} API endpoints`)
  }

  /**
   * Scan directory recursively
   * @param {string} dir - Directory to scan
   * @param {Object} options - Scan options
   * @returns {Array} - Found files
   * @private
   */
  scanDirectory(dir, options = {}) {
    const files = []
    const { extensions = [], recursive = true } = options
    
    if (!existsSync(dir)) return files
    
    const items = readdirSync(dir)
    
    for (const item of items) {
      const fullPath = join(dir, item)
      const stat = statSync(fullPath)
      
      if (stat.isDirectory() && recursive) {
        files.push(...this.scanDirectory(fullPath, options))
      } else if (stat.isFile()) {
        const ext = extname(item)
        if (extensions.length === 0 || extensions.includes(ext)) {
          files.push({
            path: relative(this.options.rootDir, fullPath),
            name: basename(item, ext),
            extension: ext
          })
        }
      }
    }
    
    return files
  }

  /**
   * Get page name from file path
   * @param {string} filePath - Page file path
   * @returns {string} - Page name
   * @private
   */
  getPageName(filePath) {
    return basename(filePath, extname(filePath))
      .replace(/index$/, 'home')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase()
  }

  /**
   * Convert file path to Nuxt route
   * @param {string} filePath - Page file path
   * @returns {string} - Route path
   * @private
   */
  getPageRoute(filePath) {
    const relativePath = relative(this.options.pagesDir, filePath)
    const route = '/' + relativePath
      .replace(/\\/g, '/')
      .replace(/\/index\.(vue|js|ts)$/, '')
      .replace(/\.(vue|js|ts)$/, '')
      .replace(/\[([^\]]+)\]/g, ':$1')
    
    return route === '/' ? '/' : route.replace(/\/$/, '')
  }

  /**
   * Get component name from file path
   * @param {string} filePath - Component file path
   * @returns {string} - Component name
   * @private
   */
  getComponentName(filePath) {
    return basename(filePath, extname(filePath))
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^[a-z]/, char => char.toUpperCase())
  }

  /**
   * Get component tag name
   * @param {string} filePath - Component file path
   * @returns {string} - Component tag
   * @private
   */
  getComponentTag(filePath) {
    return this.getComponentName(filePath)
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '')
  }

  /**
   * Get store name from file path
   * @param {string} filePath - Store file path
   * @returns {string} - Store name
   * @private
   */
  getStoreName(filePath) {
    return basename(filePath, extname(filePath))
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase()
  }

  /**
   * Get API name from file path
   * @param {string} filePath - API file path
   * @returns {string} - API name
   * @private
   */
  getApiName(filePath) {
    return basename(filePath, extname(filePath))
      .replace(/\.(get|post|put|delete|patch)$/, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase()
  }

  /**
   * Convert API file path to endpoint
   * @param {string} filePath - API file path
   * @returns {string} - API endpoint
   * @private
   */
  getApiEndpoint(filePath) {
    const relativePath = relative(this.options.apiDir, filePath)
    return '/api/' + relativePath
      .replace(/\\/g, '/')
      .replace(/\.(js|ts)$/, '')
      .replace(/\.(get|post|put|delete|patch)$/, '')
      .replace(/\[([^\]]+)\]/g, ':$1')
  }

  /**
   * Detect API methods from filename
   * @param {string} filePath - API file path
   * @returns {string[]} - HTTP methods
   * @private
   */
  detectApiMethods(filePath) {
    const filename = basename(filePath)
    const methods = []
    
    if (filename.includes('.get.')) methods.push('GET')
    if (filename.includes('.post.')) methods.push('POST')
    if (filename.includes('.put.')) methods.push('PUT')
    if (filename.includes('.delete.')) methods.push('DELETE')
    if (filename.includes('.patch.')) methods.push('PATCH')
    
    // If no specific method, assume GET
    return methods.length > 0 ? methods : ['GET']
  }

  /**
   * Generate page-specific helpers
   * @param {Object} page - Page information
   * @returns {Object} - Page helpers
   * @private
   */
  generatePageHelpers(page) {
    return {
      visit: `scenario.when.page.isVisited('${this.getPageRoute(page.path)}')`,
      shouldBeVisible: `scenario.then.page.shouldDisplay('${page.name}')`,
      shouldHaveTitle: (title) => `scenario.then.page.shouldHaveTitle('${title}')`
    }
  }

  /**
   * Generate component-specific helpers
   * @param {Object} component - Component information
   * @returns {Object} - Component helpers
   * @private
   */
  generateComponentHelpers(component) {
    const tag = this.getComponentTag(component.path)
    return {
      shouldRender: `scenario.then.component.shouldRender('${tag}')`,
      shouldHaveProps: (props) => `scenario.then.component.shouldHaveProps('${tag}', ${JSON.stringify(props)})`,
      shouldEmit: (event) => `scenario.then.component.shouldEmit('${tag}', '${event}')`
    }
  }

  /**
   * Generate store-specific helpers
   * @param {Object} store - Store information
   * @returns {Object} - Store helpers
   * @private
   */
  generateStoreHelpers(store) {
    const storeName = this.getStoreName(store.path)
    return {
      shouldHaveState: (state) => `scenario.then.store.shouldHaveState('${storeName}', ${JSON.stringify(state)})`,
      shouldCallAction: (action) => `scenario.when.store.callsAction('${storeName}', '${action}')`,
      shouldUpdateState: (key, value) => `scenario.then.store.shouldUpdateState('${storeName}', '${key}', ${JSON.stringify(value)})`
    }
  }

  /**
   * Generate API-specific helpers
   * @param {Object} api - API information
   * @returns {Object} - API helpers
   * @private
   */
  generateApiHelpers(api) {
    return api.methods.reduce((helpers, method) => {
      helpers[method.toLowerCase()] = `scenario.when.api.calls('${api.endpoint}', { method: '${method}' })`
      return helpers
    }, {})
  }

  /**
   * Detect project conventions
   * @returns {Promise<void>}
   */
  async detectConventions() {
    this.config.conventions = {
      framework: this.detectFramework(),
      testingFramework: this.detectTestingFramework(),
      stateManagement: this.detectStateManagement(),
      styling: this.detectStyling(),
      typescript: this.detectTypeScript()
    }
    
    console.log('🔍 Detected conventions:', this.config.conventions)
  }

  /**
   * Detect framework type
   * @returns {string} - Framework type
   * @private
   */
  detectFramework() {
    if (existsSync(join(this.options.rootDir, 'nuxt.config.js')) ||
        existsSync(join(this.options.rootDir, 'nuxt.config.ts'))) {
      return 'nuxt'
    }
    if (existsSync(join(this.options.rootDir, 'next.config.js'))) {
      return 'next'
    }
    if (existsSync(join(this.options.rootDir, 'vite.config.js'))) {
      return 'vite'
    }
    return 'vue'
  }

  /**
   * Detect testing framework
   * @returns {string} - Testing framework
   * @private
   */
  detectTestingFramework() {
    const packageJson = this.loadPackageJson()
    
    if (packageJson.devDependencies?.['@amiceli/vitest-cucumber']) return 'vitest-cucumber'
    if (packageJson.devDependencies?.vitest) return 'vitest'
    if (packageJson.devDependencies?.jest) return 'jest'
    
    return 'vitest'
  }

  /**
   * Detect state management
   * @returns {string} - State management library
   * @private
   */
  detectStateManagement() {
    const packageJson = this.loadPackageJson()
    
    if (packageJson.dependencies?.pinia) return 'pinia'
    if (packageJson.dependencies?.vuex) return 'vuex'
    
    return 'none'
  }

  /**
   * Detect styling approach
   * @returns {string} - Styling approach
   * @private
   */
  detectStyling() {
    const packageJson = this.loadPackageJson()
    
    if (packageJson.dependencies?.['@nuxt/ui']) return 'nuxt-ui'
    if (packageJson.dependencies?.tailwindcss) return 'tailwindcss'
    if (packageJson.dependencies?.sass) return 'sass'
    
    return 'css'
  }

  /**
   * Detect TypeScript usage
   * @returns {boolean} - Uses TypeScript
   * @private
   */
  detectTypeScript() {
    return existsSync(join(this.options.rootDir, 'tsconfig.json'))
  }

  /**
   * Load package.json
   * @returns {Object} - Package.json content
   * @private
   */
  loadPackageJson() {
    try {
      return require(join(this.options.rootDir, 'package.json'))
    } catch {
      return { dependencies: {}, devDependencies: {} }
    }
  }

  /**
   * Generate all helpers based on scanned structure
   * @returns {Promise<void>}
   */
  async generateHelpers() {
    this.config.helpers = {
      pages: this.config.pages.reduce((acc, page) => {
        acc[page.name] = page.helpers
        return acc
      }, {}),
      components: this.config.components.reduce((acc, component) => {
        acc[component.name] = component.helpers
        return acc
      }, {}),
      stores: this.config.stores.reduce((acc, store) => {
        acc[store.name] = store.helpers
        return acc
      }, {}),
      apis: this.config.apis.reduce((acc, api) => {
        acc[api.name] = api.helpers
        return acc
      }, {})
    }
    
    console.log('🔧 Generated helpers for all components')
  }

  /**
   * Get generated configuration
   * @returns {Object} - Complete configuration
   */
  getConfig() {
    return this.config
  }

  /**
   * Generate configuration file
   * @param {string} outputPath - Output file path
   */
  generateConfigFile(outputPath) {
    const configContent = `/**
 * Auto-generated BDD framework configuration
 * Generated at: ${new Date().toISOString()}
 */

export const frameworkConfig = ${JSON.stringify(this.config, null, 2)}

export default frameworkConfig`

    require('fs').writeFileSync(outputPath, configContent)
    console.log(`📝 Configuration saved to: ${outputPath}`)
  }
}