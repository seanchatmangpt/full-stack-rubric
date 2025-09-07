# Frontend Performance Optimization Guide

## Overview
This guide covers proven strategies for optimizing frontend performance, focusing on real-world bottlenecks, user experience metrics, and measurable improvements in modern web applications.

## Core Web Vitals Optimization

### 1. Largest Contentful Paint (LCP) Optimization
```javascript
// Image optimization with lazy loading
class OptimizedImageLoader {
  constructor() {
    this.observer = null;
    this.loadedImages = new Set();
    this.setupIntersectionObserver();
  }
  
  setupIntersectionObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '50px 0px', // Start loading 50px before entering viewport
      threshold: 0.1
    });
  }
  
  loadImage(img) {
    if (this.loadedImages.has(img)) return;
    
    const startTime = performance.now();
    
    // Create optimized image source
    const src = this.getOptimizedSrc(img.dataset.src, {
      width: img.clientWidth || 300,
      quality: 85,
      format: this.getSupportedFormat()
    });
    
    // Preload critical images
    if (img.dataset.priority === 'high') {
      this.preloadImage(src).then(() => {
        this.setImageSrc(img, src, startTime);
      });
    } else {
      this.setImageSrc(img, src, startTime);
    }
    
    this.loadedImages.add(img);
  }
  
  getOptimizedSrc(originalSrc, options) {
    // CDN image optimization (example with Cloudinary-like service)
    const baseUrl = 'https://cdn.example.com/image/fetch';
    const params = new URLSearchParams({
      w: options.width,
      q: options.quality,
      f: options.format,
      url: originalSrc
    });
    
    return `${baseUrl}?${params.toString()}`;
  }
  
  getSupportedFormat() {
    // Check for modern format support
    if (this.supportsWebP()) return 'webp';
    if (this.supportsAVIF()) return 'avif';
    return 'auto';
  }
  
  supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  
  supportsAVIF() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }
  
  preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = src;
    });
  }
  
  setImageSrc(img, src, startTime) {
    img.onload = () => {
      const loadTime = performance.now() - startTime;
      
      // Remove blur placeholder
      img.style.filter = 'none';
      img.classList.add('loaded');
      
      // Report image loading performance
      this.reportImageMetrics({
        src,
        loadTime,
        size: img.naturalWidth * img.naturalHeight
      });
    };
    
    img.src = src;
  }
  
  reportImageMetrics(metrics) {
    // Send to analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'image_load', {
        custom_parameter_src: metrics.src,
        custom_parameter_load_time: Math.round(metrics.loadTime),
        custom_parameter_size: metrics.size
      });
    }
  }
  
  observe(img) {
    this.observer.observe(img);
  }
}

// Usage
const imageLoader = new OptimizedImageLoader();

// Apply to all lazy images
document.querySelectorAll('img[data-src]').forEach(img => {
  imageLoader.observe(img);
});
```

### 2. First Input Delay (FID) and Interaction to Next Paint (INP) Optimization
```javascript
// Task scheduling to improve responsiveness
class TaskScheduler {
  constructor() {
    this.tasks = [];
    this.isRunning = false;
    this.frameTimeout = 5; // 5ms per frame to maintain 60fps
  }
  
  // Break up long tasks into smaller chunks
  schedule(task, priority = 'normal') {
    return new Promise((resolve, reject) => {
      this.tasks.push({
        task,
        priority,
        resolve,
        reject,
        timestamp: performance.now()
      });
      
      this.processTasks();
    });
  }
  
  async processTasks() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    while (this.tasks.length > 0) {
      const frameStart = performance.now();
      
      // Sort by priority (high -> normal -> low)
      this.tasks.sort((a, b) => {
        const priorities = { high: 3, normal: 2, low: 1 };
        return priorities[b.priority] - priorities[a.priority];
      });
      
      // Process tasks within frame budget
      while (this.tasks.length > 0 && (performance.now() - frameStart) < this.frameTimeout) {
        const { task, resolve, reject } = this.tasks.shift();
        
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }
      
      // Yield to browser for other tasks
      if (this.tasks.length > 0) {
        await this.yieldToMain();
      }
    }
    
    this.isRunning = false;
  }
  
  yieldToMain() {
    return new Promise(resolve => {
      if ('scheduler' in window && 'postTask' in scheduler) {
        scheduler.postTask(resolve, { priority: 'user-blocking' });
      } else {
        setTimeout(resolve, 0);
      }
    });
  }
  
  // Debounce expensive operations
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // Throttle high-frequency events
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Event delegation for better performance
class PerformantEventManager {
  constructor() {
    this.delegatedEvents = new Map();
    this.setupDelegation();
  }
  
  setupDelegation() {
    // Delegate common events to document
    ['click', 'submit', 'input', 'change'].forEach(eventType => {
      document.addEventListener(eventType, this.handleDelegatedEvent.bind(this), {
        passive: false,
        capture: true
      });
    });
    
    // Passive listeners for scroll/touch events
    ['scroll', 'touchstart', 'touchmove'].forEach(eventType => {
      document.addEventListener(eventType, this.handlePassiveEvent.bind(this), {
        passive: true
      });
    });
  }
  
  handleDelegatedEvent(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    
    const action = target.dataset.action;
    const handlers = this.delegatedEvents.get(action);
    
    if (handlers) {
      handlers.forEach(handler => {
        // Measure interaction timing
        const startTime = performance.now();
        
        handler(event, target);
        
        const duration = performance.now() - startTime;
        if (duration > 50) { // Report slow interactions
          this.reportSlowInteraction(action, duration);
        }
      });
    }
  }
  
  handlePassiveEvent(event) {
    // Handle passive events that don't need preventDefault
    const eventType = event.type;
    
    if (eventType === 'scroll') {
      this.handleScroll(event);
    }
  }
  
  on(action, handler) {
    if (!this.delegatedEvents.has(action)) {
      this.delegatedEvents.set(action, []);
    }
    
    this.delegatedEvents.get(action).push(handler);
  }
  
  reportSlowInteraction(action, duration) {
    console.warn(`Slow interaction detected: ${action} took ${duration}ms`);
    
    // Report to performance monitoring
    if (typeof gtag !== 'undefined') {
      gtag('event', 'slow_interaction', {
        custom_parameter_action: action,
        custom_parameter_duration: Math.round(duration)
      });
    }
  }
}

// Usage
const scheduler = new TaskScheduler();
const eventManager = new PerformantEventManager();

// Register event handlers
eventManager.on('search', async (event, target) => {
  const query = target.value;
  
  // Schedule search as low priority task
  await scheduler.schedule(async () => {
    const results = await searchAPI(query);
    updateSearchResults(results);
  }, 'low');
});

eventManager.on('form-submit', (event, target) => {
  // High priority for form submissions
  scheduler.schedule(async () => {
    await submitForm(target);
  }, 'high');
});
```

### 3. Cumulative Layout Shift (CLS) Prevention
```javascript
// Layout stability manager
class LayoutStabilityManager {
  constructor() {
    this.observer = null;
    this.shifts = [];
    this.setupLayoutShiftObserver();
  }
  
  setupLayoutShiftObserver() {
    if ('LayoutShift' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Only log shifts that aren't user-initiated
          if (!entry.hadRecentInput) {
            this.shifts.push({
              value: entry.value,
              startTime: entry.startTime,
              sources: entry.sources
            });
            
            if (entry.value > 0.1) { // Significant shift
              this.analyzeShift(entry);
            }
          }
        }
      });
      
      this.observer.observe({ entryTypes: ['layout-shift'] });
    }
  }
  
  analyzeShift(entry) {
    console.warn('Significant layout shift detected:', {
      value: entry.value,
      sources: entry.sources.map(source => ({
        node: source.node,
        currentRect: source.currentRect,
        previousRect: source.previousRect
      }))
    });
    
    // Auto-fix common issues
    entry.sources.forEach(source => {
      this.attemptAutoFix(source.node);
    });
  }
  
  attemptAutoFix(element) {
    // Fix images without dimensions
    if (element.tagName === 'IMG' && !element.style.aspectRatio) {
      if (element.naturalWidth && element.naturalHeight) {
        element.style.aspectRatio = `${element.naturalWidth} / ${element.naturalHeight}`;
        console.log('Applied aspect ratio to prevent layout shift:', element);
      }
    }
    
    // Fix dynamic content containers
    if (element.classList.contains('dynamic-content') && !element.style.minHeight) {
      const rect = element.getBoundingClientRect();
      if (rect.height > 0) {
        element.style.minHeight = rect.height + 'px';
        console.log('Applied minimum height to dynamic content:', element);
      }
    }
  }
  
  // Predefine space for dynamic content
  reserveSpace(element, dimensions) {
    if (dimensions.width) {
      element.style.width = dimensions.width + 'px';
    }
    
    if (dimensions.height) {
      element.style.height = dimensions.height + 'px';
    }
    
    if (dimensions.aspectRatio) {
      element.style.aspectRatio = dimensions.aspectRatio;
    }
    
    // Add skeleton loader
    element.classList.add('loading-skeleton');
  }
  
  // Animate content changes to prevent jarring shifts
  animateContentChange(element, newContent) {
    const oldHeight = element.offsetHeight;
    
    // Temporarily fix height
    element.style.height = oldHeight + 'px';
    
    // Update content
    element.innerHTML = newContent;
    
    // Get new height
    const newHeight = element.scrollHeight;
    
    // Animate to new height
    element.style.transition = 'height 0.3s ease';
    element.style.height = newHeight + 'px';
    
    // Clean up after animation
    setTimeout(() => {
      element.style.height = '';
      element.style.transition = '';
    }, 300);
  }
  
  getCLSScore() {
    return this.shifts.reduce((sum, shift) => sum + shift.value, 0);
  }
  
  getReport() {
    return {
      totalCLS: this.getCLSScore(),
      shiftCount: this.shifts.length,
      significantShifts: this.shifts.filter(shift => shift.value > 0.1),
      recommendations: this.getRecommendations()
    };
  }
  
  getRecommendations() {
    const recommendations = [];
    
    if (this.getCLSScore() > 0.1) {
      recommendations.push('CLS score exceeds recommended threshold of 0.1');
    }
    
    // Check for images without dimensions
    const imagesWithoutDimensions = document.querySelectorAll('img:not([width]):not([height]):not([style*="aspect-ratio"])');
    if (imagesWithoutDimensions.length > 0) {
      recommendations.push(`${imagesWithoutDimensions.length} images lack dimensions - add width/height or aspect-ratio`);
    }
    
    // Check for web fonts causing FOIT/FOUT
    if (document.fonts.size > 0) {
      recommendations.push('Consider using font-display: swap to prevent invisible text');
    }
    
    return recommendations;
  }
}

// Font loading optimization
class FontOptimizer {
  constructor() {
    this.fontsLoaded = new Set();
    this.setupFontLoading();
  }
  
  setupFontLoading() {
    // Preload critical fonts
    this.preloadFonts([
      '/fonts/primary-font.woff2',
      '/fonts/secondary-font.woff2'
    ]);
    
    // Monitor font loading
    if (document.fonts) {
      document.fonts.ready.then(() => {
        console.log('All fonts loaded');
        document.documentElement.classList.add('fonts-loaded');
      });
      
      // Load non-critical fonts with delay
      setTimeout(() => {
        this.loadNonCriticalFonts();
      }, 1000);
    }
  }
  
  preloadFonts(fontUrls) {
    fontUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = url;
      document.head.appendChild(link);
    });
  }
  
  loadNonCriticalFonts() {
    const nonCriticalFonts = [
      'FontAwesome',
      'Secondary-Bold',
      'Display-Font'
    ];
    
    nonCriticalFonts.forEach(fontFamily => {
      if (document.fonts.check(`1em ${fontFamily}`)) {
        return; // Already loaded
      }
      
      // Load font face
      const font = new FontFace(fontFamily, `url(/fonts/${fontFamily.toLowerCase()}.woff2)`);
      font.load().then(() => {
        document.fonts.add(font);
        this.fontsLoaded.add(fontFamily);
      }).catch(err => {
        console.warn(`Failed to load font: ${fontFamily}`, err);
      });
    });
  }
}

// Usage
const layoutManager = new LayoutStabilityManager();
const fontOptimizer = new FontOptimizer();

// Reserve space for dynamic content
const adsContainer = document.querySelector('.ads-container');
if (adsContainer) {
  layoutManager.reserveSpace(adsContainer, {
    width: 300,
    height: 250
  });
}
```

## Bundle Size and Loading Optimization

### 1. Code Splitting and Dynamic Imports
```javascript
// Intelligent code splitting
class ModuleLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
    this.preloadQueue = [];
    
    this.setupIntersectionObserver();
    this.setupPrefetch();
  }
  
  async loadModule(moduleName, options = {}) {
    if (this.loadedModules.has(moduleName)) {
      return this.loadedModules.get(moduleName);
    }
    
    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName);
    }
    
    const loadPromise = this.dynamicImport(moduleName, options);
    this.loadingPromises.set(moduleName, loadPromise);
    
    try {
      const module = await loadPromise;
      this.loadedModules.set(moduleName, module);
      this.loadingPromises.delete(moduleName);
      
      return module;
    } catch (error) {
      this.loadingPromises.delete(moduleName);
      throw error;
    }
  }
  
  async dynamicImport(moduleName, options) {
    const startTime = performance.now();
    
    let module;
    
    switch (moduleName) {
      case 'chart':
        module = await import(
          /* webpackChunkName: "chart" */
          /* webpackPrefetch: true */
          './components/Chart.js'
        );
        break;
        
      case 'editor':
        module = await import(
          /* webpackChunkName: "editor" */
          /* webpackPreload: true */
          './components/Editor.js'
        );
        break;
        
      case 'analytics':
        module = await import(
          /* webpackChunkName: "analytics" */
          './utils/analytics.js'
        );
        break;
        
      default:
        throw new Error(`Unknown module: ${moduleName}`);
    }
    
    const loadTime = performance.now() - startTime;
    this.reportLoadTime(moduleName, loadTime);
    
    return module;
  }
  
  // Preload modules based on user interaction patterns
  preloadModule(moduleName) {
    if (!this.loadedModules.has(moduleName) && !this.loadingPromises.has(moduleName)) {
      this.preloadQueue.push(moduleName);
      this.processPreloadQueue();
    }
  }
  
  processPreloadQueue() {
    if (this.preloadQueue.length === 0) return;
    
    // Use requestIdleCallback if available
    const processNext = (deadline) => {
      while (deadline.timeRemaining() > 0 && this.preloadQueue.length > 0) {
        const moduleName = this.preloadQueue.shift();
        this.loadModule(moduleName).catch(err => {
          console.warn(`Failed to preload module: ${moduleName}`, err);
        });
      }
      
      if (this.preloadQueue.length > 0) {
        this.schedulePreload(processNext);
      }
    };
    
    this.schedulePreload(processNext);
  }
  
  schedulePreload(callback) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 2000 });
    } else {
      setTimeout(() => callback({ timeRemaining: () => 50 }), 0);
    }
  }
  
  setupIntersectionObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const moduleName = entry.target.dataset.preload;
          if (moduleName) {
            this.preloadModule(moduleName);
          }
        }
      });
    }, { rootMargin: '100px' });
    
    // Observe elements that should trigger preloading
    document.querySelectorAll('[data-preload]').forEach(el => {
      this.observer.observe(el);
    });
  }
  
  setupPrefetch() {
    // Prefetch on hover with delay to avoid unnecessary loads
    let hoverTimeout;
    
    document.addEventListener('mouseover', (event) => {
      const preloadTarget = event.target.closest('[data-hover-preload]');
      if (preloadTarget) {
        hoverTimeout = setTimeout(() => {
          const moduleName = preloadTarget.dataset.hoverPreload;
          this.preloadModule(moduleName);
        }, 300); // 300ms hover delay
      }
    });
    
    document.addEventListener('mouseout', () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    });
  }
  
  reportLoadTime(moduleName, loadTime) {
    console.log(`Module ${moduleName} loaded in ${loadTime.toFixed(2)}ms`);
    
    // Report to analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'module_load', {
        custom_parameter_module: moduleName,
        custom_parameter_load_time: Math.round(loadTime)
      });
    }
  }
  
  getLoadingStats() {
    return {
      loadedModules: Array.from(this.loadedModules.keys()),
      pendingLoads: Array.from(this.loadingPromises.keys()),
      preloadQueue: [...this.preloadQueue]
    };
  }
}

// Tree shaking utility
class TreeShakeOptimizer {
  static createOptimizedImports() {
    // Instead of importing entire libraries
    // import * as _ from 'lodash'; // DON'T DO THIS
    
    // Import only what you need
    return {
      // Optimized lodash imports
      debounce: () => import('lodash/debounce'),
      throttle: () => import('lodash/throttle'),
      
      // Optimized date-fns imports
      formatDate: () => import('date-fns/format'),
      parseDate: () => import('date-fns/parseISO'),
      
      // Optimized UI library imports
      Button: () => import('@/components/ui/Button'),
      Modal: () => import('@/components/ui/Modal')
    };
  }
  
  static async loadUtility(utilityName) {
    const imports = this.createOptimizedImports();
    
    if (imports[utilityName]) {
      const module = await imports[utilityName]();
      return module.default || module;
    }
    
    throw new Error(`Utility ${utilityName} not found`);
  }
}

// Usage
const moduleLoader = new ModuleLoader();

// Load module when needed
document.querySelector('#chart-button').addEventListener('click', async () => {
  try {
    const ChartModule = await moduleLoader.loadModule('chart');
    const chart = new ChartModule.default();
    chart.render();
  } catch (error) {
    console.error('Failed to load chart module:', error);
  }
});

// Optimized utility loading
async function formatUserDate(date) {
  const formatDate = await TreeShakeOptimizer.loadUtility('formatDate');
  return formatDate(date, 'yyyy-MM-dd');
}
```

### 2. Resource Prioritization and Preloading
```javascript
// Resource prioritization manager
class ResourcePrioritizer {
  constructor() {
    this.criticalResources = new Set();
    this.preloadedResources = new Set();
    this.loadingQueue = [];
    
    this.setupResourceHints();
    this.monitorResourceLoading();
  }
  
  setupResourceHints() {
    // Preload critical resources
    this.preload('/css/critical.css', 'style', 'high');
    this.preload('/js/critical.js', 'script', 'high');
    this.preload('/fonts/main.woff2', 'font', 'high');
    
    // Prefetch likely next page resources
    this.prefetch('/css/secondary.css');
    this.prefetch('/js/secondary.js');
    
    // Preconnect to external domains
    this.preconnect('https://api.example.com');
    this.preconnect('https://cdn.example.com');
    
    // DNS prefetch for analytics
    this.dnsPrefetch('https://www.google-analytics.com');
  }
  
  preload(href, as, importance = 'auto') {
    if (this.preloadedResources.has(href)) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    
    if (importance !== 'auto') {
      link.importance = importance;
    }
    
    if (as === 'font') {
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
    this.preloadedResources.add(href);
    
    console.log(`Preloading ${as}: ${href} (importance: ${importance})`);
  }
  
  prefetch(href) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
    
    console.log(`Prefetching: ${href}`);
  }
  
  preconnect(href) {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    
    console.log(`Preconnecting to: ${href}`);
  }
  
  dnsPrefetch(href) {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = href;
    document.head.appendChild(link);
  }
  
  // Intelligent resource loading based on connection speed
  adaptiveLoading() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      const { effectiveType, downlink } = connection;
      
      console.log(`Connection: ${effectiveType}, Speed: ${downlink} Mbps`);
      
      if (effectiveType === '4g' && downlink > 1.5) {
        // Fast connection - preload more resources
        this.preloadSecondaryResources();
      } else if (effectiveType === '3g' || downlink < 1) {
        // Slow connection - only load critical resources
        this.reducedLoadingMode();
      }
      
      // Listen for connection changes
      connection.addEventListener('change', () => {
        this.adaptiveLoading();
      });
    }
  }
  
  preloadSecondaryResources() {
    const secondaryResources = [
      { href: '/images/hero-large.webp', as: 'image' },
      { href: '/js/animations.js', as: 'script' },
      { href: '/css/animations.css', as: 'style' }
    ];
    
    secondaryResources.forEach(resource => {
      this.preload(resource.href, resource.as, 'low');
    });
  }
  
  reducedLoadingMode() {
    console.log('Reduced loading mode activated');
    
    // Disable non-essential features
    document.documentElement.classList.add('reduced-motion');
    
    // Load smaller images
    document.querySelectorAll('img[data-src-small]').forEach(img => {
      img.dataset.src = img.dataset.srcSmall;
    });
    
    // Skip non-critical modules
    this.skipNonCriticalModules = true;
  }
  
  monitorResourceLoading() {
    // Monitor resource loading performance
    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 1000) { // Slow loading resource
          console.warn(`Slow resource: ${entry.name} took ${entry.duration}ms`);
          this.optimizeSlowResource(entry);
        }
      });
    });
    
    resourceObserver.observe({ entryTypes: ['resource'] });
    
    // Monitor largest contentful paint
    const lcpObserver = new PerformanceObserver((list) => {
      const lcpEntries = list.getEntries();
      const lastEntry = lcpEntries[lcpEntries.length - 1];
      
      if (lastEntry.startTime > 2500) { // LCP > 2.5s
        console.warn(`Poor LCP: ${lastEntry.startTime}ms`);
        this.optimizeLCP(lastEntry);
      }
    });
    
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  }
  
  optimizeSlowResource(entry) {
    // Attempt to optimize slow resources
    if (entry.name.includes('.jpg') || entry.name.includes('.png')) {
      console.log('Consider converting images to WebP/AVIF format');
    }
    
    if (entry.name.includes('.js')) {
      console.log('Consider code splitting for large JavaScript files');
    }
    
    if (entry.name.includes('.css')) {
      console.log('Consider inlining critical CSS');
    }
  }
  
  optimizeLCP(entry) {
    const element = entry.element;
    
    if (element && element.tagName === 'IMG') {
      // Optimize LCP image
      this.preload(element.src || element.dataset.src, 'image', 'high');
      
      // Add fetchpriority if supported
      if ('fetchPriority' in element) {
        element.fetchPriority = 'high';
      }
    }
  }
  
  // Progressive loading for below-fold content
  setupProgressiveLoading() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadBelowFoldContent(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px' });
    
    document.querySelectorAll('[data-progressive-load]').forEach(el => {
      observer.observe(el);
    });
  }
  
  loadBelowFoldContent(element) {
    const loadType = element.dataset.progressiveLoad;
    
    switch (loadType) {
      case 'image':
        if (element.dataset.src) {
          element.src = element.dataset.src;
        }
        break;
        
      case 'iframe':
        if (element.dataset.src) {
          element.src = element.dataset.src;
        }
        break;
        
      case 'component':
        const componentName = element.dataset.component;
        this.loadComponent(componentName, element);
        break;
    }
  }
  
  async loadComponent(componentName, container) {
    try {
      const module = await moduleLoader.loadModule(componentName);
      const component = new module.default();
      
      component.render(container);
      container.classList.add('component-loaded');
    } catch (error) {
      console.error(`Failed to load component ${componentName}:`, error);
      container.classList.add('component-error');
    }
  }
}

// Usage
const resourcePrioritizer = new ResourcePrioritizer();
resourcePrioritizer.adaptiveLoading();
resourcePrioritizer.setupProgressiveLoading();
```

## Performance Monitoring and Analytics

### 1. Real User Monitoring (RUM)
```javascript
// Comprehensive performance monitoring
class PerformanceMonitor {
  constructor(options = {}) {
    this.apiEndpoint = options.apiEndpoint || '/api/metrics';
    this.sampleRate = options.sampleRate || 0.1; // 10% sampling
    this.metrics = {
      pageLoad: {},
      userInteractions: [],
      resourceTimings: [],
      errors: [],
      webVitals: {}
    };
    
    this.setupMonitoring();
  }
  
  setupMonitoring() {
    this.monitorPageLoad();
    this.monitorWebVitals();
    this.monitorUserInteractions();
    this.monitorResources();
    this.monitorErrors();
    
    // Send metrics on page unload
    window.addEventListener('beforeunload', () => {
      this.sendMetrics();
    });
    
    // Send metrics periodically
    setInterval(() => {
      this.sendMetrics();
    }, 30000); // Every 30 seconds
  }
  
  monitorPageLoad() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        
        this.metrics.pageLoad = {
          timestamp: Date.now(),
          url: window.location.href,
          ttfb: navigation.responseStart - navigation.fetchStart,
          domComplete: navigation.domComplete - navigation.fetchStart,
          loadComplete: navigation.loadEventEnd - navigation.fetchStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          redirectTime: navigation.redirectEnd - navigation.redirectStart,
          dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
          connectionTime: navigation.connectEnd - navigation.connectStart,
          sslTime: navigation.secureConnectionStart ? 
            navigation.connectEnd - navigation.secureConnectionStart : 0
        };
      }, 0);
    });
  }
  
  monitorWebVitals() {
    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.metrics.webVitals.lcp = {
        value: lastEntry.startTime,
        element: lastEntry.element?.tagName || 'unknown',
        url: lastEntry.url || window.location.href
      };
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    
    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const firstInput = list.getEntries()[0];
      
      this.metrics.webVitals.fid = {
        value: firstInput.processingStart - firstInput.startTime,
        eventType: firstInput.name
      };
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
    
    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      
      this.metrics.webVitals.cls = { value: clsValue };
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }
  
  monitorUserInteractions() {
    ['click', 'input', 'scroll'].forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        this.recordInteraction(eventType, event);
      }, { passive: true });
    });
  }
  
  recordInteraction(type, event) {
    if (Math.random() > this.sampleRate) return; // Sample interactions
    
    const interaction = {
      type,
      timestamp: Date.now(),
      target: this.getElementSelector(event.target),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
    
    if (type === 'scroll') {
      interaction.scrollY = window.scrollY;
      interaction.scrollPercentage = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
    }
    
    this.metrics.userInteractions.push(interaction);
    
    // Keep only recent interactions
    if (this.metrics.userInteractions.length > 50) {
      this.metrics.userInteractions = this.metrics.userInteractions.slice(-50);
    }
  }
  
  monitorResources() {
    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.duration > 100) { // Only track resources > 100ms
          this.metrics.resourceTimings.push({
            name: entry.name,
            duration: Math.round(entry.duration),
            size: entry.transferSize || 0,
            type: this.getResourceType(entry.name),
            timestamp: Date.now()
          });
        }
      });
    });
    
    resourceObserver.observe({ entryTypes: ['resource'] });
  }
  
  monitorErrors() {
    window.addEventListener('error', (event) => {
      this.metrics.errors.push({
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now()
      });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.metrics.errors.push({
        message: 'Unhandled Promise Rejection',
        reason: event.reason?.toString(),
        timestamp: Date.now()
      });
    });
  }
  
  getElementSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      return `.${element.className.split(' ')[0]}`;
    }
    
    return element.tagName.toLowerCase();
  }
  
  getResourceType(url) {
    if (url.includes('.css')) return 'css';
    if (url.includes('.js')) return 'javascript';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
    return 'other';
  }
  
  async sendMetrics() {
    if (!navigator.onLine) return; // Skip if offline
    
    const payload = {
      ...this.metrics,
      sessionId: this.getSessionId(),
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      url: window.location.href
    };
    
    try {
      // Use sendBeacon for reliability
      if (navigator.sendBeacon) {
        navigator.sendBeacon(this.apiEndpoint, JSON.stringify(payload));
      } else {
        await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      
      // Clear sent metrics
      this.clearMetrics();
    } catch (error) {
      console.warn('Failed to send performance metrics:', error);
    }
  }
  
  getSessionId() {
    let sessionId = sessionStorage.getItem('performanceSessionId');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36);
      sessionStorage.setItem('performanceSessionId', sessionId);
    }
    return sessionId;
  }
  
  clearMetrics() {
    this.metrics.userInteractions = [];
    this.metrics.resourceTimings = [];
    this.metrics.errors = [];
  }
  
  // Manual performance markers
  mark(name) {
    performance.mark(name);
  }
  
  measure(name, startMark, endMark) {
    performance.measure(name, startMark, endMark);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    console.log(`${name}: ${measure.duration}ms`);
    
    return measure.duration;
  }
  
  getPerformanceReport() {
    return {
      pageLoad: this.metrics.pageLoad,
      webVitals: this.metrics.webVitals,
      recentInteractions: this.metrics.userInteractions.slice(-10),
      slowResources: this.metrics.resourceTimings.filter(r => r.duration > 1000),
      errorCount: this.metrics.errors.length
    };
  }
}

// Usage
const performanceMonitor = new PerformanceMonitor({
  apiEndpoint: '/api/performance-metrics',
  sampleRate: 0.2 // 20% sampling
});

// Manual performance tracking
performanceMonitor.mark('feature-start');
// ... feature code ...
performanceMonitor.mark('feature-end');
performanceMonitor.measure('feature-duration', 'feature-start', 'feature-end');
```

## Best Practices Summary

### Loading Performance
1. **Optimize Critical Rendering Path**: Inline critical CSS, defer non-critical resources
2. **Use Resource Hints**: Preload, prefetch, preconnect strategically
3. **Implement Code Splitting**: Load only what's needed when it's needed
4. **Optimize Images**: Use modern formats, responsive images, lazy loading

### Runtime Performance
1. **Minimize Main Thread Work**: Use Web Workers for heavy computations
2. **Optimize Event Handling**: Use passive listeners, event delegation
3. **Reduce Layout Thrashing**: Batch DOM operations, use transforms
4. **Cache Intelligently**: Implement multi-level caching strategies

### User Experience
1. **Prevent Layout Shifts**: Reserve space for dynamic content
2. **Optimize Font Loading**: Use font-display: swap, preload critical fonts
3. **Progressive Enhancement**: Core functionality works without JavaScript
4. **Responsive Design**: Optimize for various screen sizes and connection speeds

### Monitoring and Optimization
1. **Track Core Web Vitals**: Monitor LCP, FID/INP, CLS continuously
2. **Use Real User Monitoring**: Collect performance data from actual users
3. **A/B Testing**: Test performance optimizations with real traffic
4. **Regular Performance Audits**: Use tools like Lighthouse, WebPageTest

This comprehensive frontend performance guide provides practical strategies that have been proven to improve real-world application performance and user experience.