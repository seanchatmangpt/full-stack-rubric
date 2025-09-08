/**
 * @fileoverview Performance optimizer utilities for tree-shaking and bundle optimization
 * Provides lazy loading, code splitting, and runtime performance optimizations
 */

/**
 * @typedef {Object} OptimizationConfig
 * @property {boolean} enableTreeShaking - Enable tree shaking
 * @property {boolean} enableLazyLoading - Enable lazy loading
 * @property {boolean} enableCodeSplitting - Enable code splitting
 * @property {number} chunkSizeLimit - Maximum chunk size in KB
 * @property {string[]} preloadRoutes - Routes to preload
 */

/**
 * @typedef {Object} BundleMetrics
 * @property {number} initialBundle - Initial bundle size in KB
 * @property {number} vendorBundle - Vendor bundle size in KB
 * @property {number} asyncChunks - Number of async chunks
 * @property {number} treeShakingReduction - Percentage reduction from tree shaking
 * @property {number} compressionRatio - Gzip compression ratio
 */

/**
 * @typedef {Object} RuntimeMetrics
 * @property {number} initialLoadTime - Time to interactive in ms
 * @property {number} routeTransitionTime - Average route transition time
 * @property {number} memoryUsage - Memory usage in MB
 * @property {number} jsHeapSize - JS heap size in MB
 */

// Tree-shakable utility functions
export const performanceUtils = {
  /**
   * Debounce function for expensive operations
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in ms
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function for high-frequency events
   * @param {Function} func - Function to throttle
   * @param {number} limit - Limit in ms
   * @returns {Function} Throttled function
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Lazy import with error handling
   * @param {Function} importFn - Dynamic import function
   * @returns {Promise<any>} Imported module
   */
  async lazyImport(importFn) {
    try {
      const module = await importFn();
      return module.default || module;
    } catch (error) {
      console.warn('Lazy import failed:', error);
      return null;
    }
  },

  /**
   * Preload critical resources
   * @param {string} href - Resource URL
   * @param {string} [as='script'] - Resource type
   * @returns {Promise<void>}
   */
  preloadResource(href, as = 'script') {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`link[href="${href}"]`)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = as;
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to preload ${href}`));
      document.head.appendChild(link);
    });
  },

  /**
   * Optimize images for performance
   * @param {string} src - Image source
   * @param {number} [quality=75] - Image quality
   * @returns {Promise<string>} Optimized image URL
   */
  optimizeImage(src, quality = 75) {
    // Use Nuxt Image optimization
    const params = new URLSearchParams({
      f: 'webp',
      q: quality.toString(),
      w: '800' // Default max width
    });
    
    return `/_ipx/${params.toString()}${src}`;
  }
};

// Code splitting utilities
export const codeSplitting = {
  /**
   * Create async component with loading state
   * @param {Function} importFn - Dynamic import function
   * @param {Object} [options] - Loading options
   * @returns {Object} Async component definition
   */
  createAsyncComponent(importFn, options = {}) {
    // Note: defineAsyncComponent would be imported from Vue in actual usage
    return {
      loader: importFn,
      loadingComponent: options.loading || null,
      errorComponent: options.error || null,
      delay: options.delay || 200,
      timeout: options.timeout || 10000,
      suspensible: true
    };
  },

  /**
   * Load route component with preloading
   * @param {string} routeName - Route name
   * @returns {Promise<any>} Route component
   */
  async loadRouteComponent(routeName) {
    const componentMap = {
      'typing': () => import('../pages/typing.vue'),
      'index': () => import('../pages/index.vue'),
      'slug': () => import('../pages/[...slug].vue')
    };

    const importFn = componentMap[routeName];
    if (!importFn) {
      console.warn(`Unknown route: ${routeName}`);
      return null;
    }

    return performanceUtils.lazyImport(importFn);
  },

  /**
   * Preload critical route components
   * @param {string[]} routes - Routes to preload
   * @returns {Promise<void[]>}
   */
  async preloadRoutes(routes) {
    const preloadPromises = routes.map(route => 
      this.loadRouteComponent(route).catch(err => 
        console.warn(`Failed to preload route ${route}:`, err)
      )
    );
    
    return Promise.allSettled(preloadPromises);
  }
};

// Bundle analyzer utilities
export const bundleAnalyzer = {
  /**
   * Measure bundle performance metrics
   * @returns {Promise<BundleMetrics>}
   */
  async measureBundleMetrics() {
    const perfEntries = performance.getEntriesByType('navigation');
    const navEntry = perfEntries[0];
    
    // Estimate bundle sizes from network timing
    const scripts = Array.from(document.scripts);
    let totalScriptSize = 0;
    
    for (const script of scripts) {
      if (script.src) {
        try {
          const response = await fetch(script.src, { method: 'HEAD' });
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            totalScriptSize += parseInt(contentLength, 10);
          }
        } catch (err) {
          // Ignore CORS errors for external scripts
        }
      }
    }

    return {
      initialBundle: Math.round(totalScriptSize / 1024), // KB
      vendorBundle: Math.round(totalScriptSize * 0.7 / 1024), // Estimate
      asyncChunks: scripts.filter(s => s.async || s.defer).length,
      treeShakingReduction: 0, // Would need build-time analysis
      compressionRatio: 0.7 // Typical gzip ratio
    };
  },

  /**
   * Analyze runtime performance
   * @returns {RuntimeMetrics}
   */
  analyzeRuntimePerformance() {
    const perfEntries = performance.getEntriesByType('navigation');
    const navEntry = perfEntries[0];
    
    // Memory usage (if available)
    let memoryUsage = 0;
    let jsHeapSize = 0;
    
    if (performance.memory) {
      memoryUsage = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
      jsHeapSize = Math.round(performance.memory.totalJSHeapSize / (1024 * 1024));
    }

    return {
      initialLoadTime: navEntry ? Math.round(navEntry.loadEventEnd - navEntry.navigationStart) : 0,
      routeTransitionTime: 0, // Would need route timing
      memoryUsage,
      jsHeapSize
    };
  },

  /**
   * Generate performance report
   * @returns {Promise<Object>} Performance report
   */
  async generatePerformanceReport() {
    const bundleMetrics = await this.measureBundleMetrics();
    const runtimeMetrics = this.analyzeRuntimePerformance();
    
    return {
      timestamp: Date.now(),
      bundle: bundleMetrics,
      runtime: runtimeMetrics,
      recommendations: this.generateRecommendations(bundleMetrics, runtimeMetrics)
    };
  },

  /**
   * Generate optimization recommendations
   * @param {BundleMetrics} bundle - Bundle metrics
   * @param {RuntimeMetrics} runtime - Runtime metrics
   * @returns {string[]} Recommendations
   */
  generateRecommendations(bundle, runtime) {
    const recommendations = [];

    if (bundle.initialBundle > 500) { // > 500KB
      recommendations.push('Consider code splitting to reduce initial bundle size');
    }

    if (runtime.initialLoadTime > 3000) { // > 3s
      recommendations.push('Optimize critical rendering path and preload key resources');
    }

    if (runtime.memoryUsage > 50) { // > 50MB
      recommendations.push('Review memory usage and implement cleanup for unused objects');
    }

    if (bundle.asyncChunks < 3) {
      recommendations.push('Implement route-based code splitting for better caching');
    }

    return recommendations;
  }
};

// Monaco Editor optimization utilities
export const monacoOptimizer = {
  /**
   * Load Monaco Editor with minimal features
   * @param {Object} config - Monaco configuration
   * @returns {Promise<any>} Monaco editor instance
   */
  async loadMinimalMonaco(config = {}) {
    // Import only required Monaco modules
    const [
      { editor },
      { setLanguageConfiguration },
      { registerLanguage }
    ] = await Promise.all([
      import('monaco-editor/esm/vs/editor/editor.api'),
      import('monaco-editor/esm/vs/editor/standalone/browser/standaloneLanguages'),
      import('monaco-editor/esm/vs/editor/standalone/browser/standaloneLanguages')
    ]);

    // Configure minimal language support
    if (config.language) {
      await this.loadLanguageSupport(config.language);
    }

    return editor;
  },

  /**
   * Load specific language support
   * @param {string} language - Programming language
   * @returns {Promise<void>}
   */
  async loadLanguageSupport(language) {
    const languageMap = {
      javascript: () => import('monaco-editor/esm/vs/language/typescript/ts.worker'),
      typescript: () => import('monaco-editor/esm/vs/language/typescript/ts.worker'),
      json: () => import('monaco-editor/esm/vs/language/json/json.worker'),
      css: () => import('monaco-editor/esm/vs/language/css/css.worker'),
      html: () => import('monaco-editor/esm/vs/language/html/html.worker')
    };

    const workerLoader = languageMap[language];
    if (workerLoader) {
      await workerLoader();
    }
  },

  /**
   * Optimize Monaco Editor configuration for performance
   * @param {Object} baseConfig - Base configuration
   * @returns {Object} Optimized configuration
   */
  optimizeConfig(baseConfig = {}) {
    return {
      ...baseConfig,
      // Disable heavy features
      wordWrap: 'off',
      minimap: { enabled: false },
      folding: false,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      glyphMargin: false,
      
      // Performance optimizations
      scrollBeyondLastLine: false,
      renderLineHighlight: 'none',
      occurrencesHighlight: false,
      selectionHighlight: false,
      
      // Disable intellisense features for typing practice
      quickSuggestions: false,
      parameterHints: { enabled: false },
      suggestOnTriggerCharacters: false,
      acceptSuggestionOnEnter: 'off',
      tabCompletion: 'off',
      
      // Theme and fonts
      theme: 'vs-dark',
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Consolas, monospace',
      
      // Layout optimizations
      automaticLayout: true,
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        useShadows: false,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10
      }
    };
  }
};

/**
 * Performance monitoring hook for Vue components
 * @param {string} componentName - Name of the component
 * @returns {Object} Performance monitoring utilities
 */
export function usePerformanceMonitoring(componentName) {
  const startTime = performance.now();
  let renderCount = 0;

  const trackRender = () => {
    renderCount++;
    const renderTime = performance.now() - startTime;
    
    // Log performance warnings for slow components
    if (renderTime > 16) { // > 1 frame at 60fps
      console.warn(`Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  };

  const trackEvent = (eventName, duration) => {
    if (duration > 50) { // Log slow events
      console.warn(`Slow event ${eventName} in ${componentName}: ${duration.toFixed(2)}ms`);
    }
  };

  return {
    trackRender,
    trackEvent,
    getRenderCount: () => renderCount,
    getRenderTime: () => performance.now() - startTime
  };
}

/**
 * Default optimization configuration
 * @type {OptimizationConfig}
 */
export const defaultOptimizationConfig = {
  enableTreeShaking: true,
  enableLazyLoading: true,
  enableCodeSplitting: true,
  chunkSizeLimit: 300, // KB
  preloadRoutes: ['typing']
};