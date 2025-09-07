# Monitoring and Profiling Guide

## Overview
This guide covers comprehensive monitoring and profiling strategies for full-stack applications, focusing on real-world performance insights, bottleneck detection, and continuous optimization.

## Application Performance Monitoring (APM)

### 1. Custom APM Implementation
```javascript
// Comprehensive APM system
class ApplicationPerformanceMonitor {
  constructor(options = {}) {
    this.appName = options.appName || 'unknown-app';
    this.version = options.version || '1.0.0';
    this.environment = options.environment || 'development';
    this.sampleRate = options.sampleRate || 0.1; // 10% sampling
    this.flushInterval = options.flushInterval || 30000; // 30 seconds
    
    this.metrics = {
      requests: [],
      errors: [],
      customMetrics: new Map(),
      systemMetrics: [],
      traces: []
    };
    
    this.spans = new Map(); // Active spans for distributed tracing
    this.setupAutoInstrumentation();
    this.startMetricsCollection();
  }
  
  setupAutoInstrumentation() {
    // HTTP request instrumentation
    if (typeof window !== 'undefined') {
      this.instrumentBrowserAPIs();
    } else {
      this.instrumentNodeAPIs();
    }
  }
  
  instrumentBrowserAPIs() {
    // Instrument fetch API
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0];
      const options = args[1] || {};
      
      const span = this.startSpan('http.request', {
        'http.method': options.method || 'GET',
        'http.url': url,
        'http.user_agent': navigator.userAgent
      });
      
      try {
        const response = await originalFetch(...args);
        
        span.setTag('http.status_code', response.status);
        span.setTag('http.response_size', response.headers.get('content-length') || 0);
        
        const duration = performance.now() - startTime;
        this.recordHTTPRequest({
          method: options.method || 'GET',
          url: url,
          status: response.status,
          duration: duration,
          timestamp: Date.now(),
          userAgent: navigator.userAgent
        });
        
        span.finish();
        return response;
      } catch (error) {
        span.setTag('error', true);
        span.setTag('error.message', error.message);
        span.finish();
        
        this.recordError(error, { context: 'fetch', url });
        throw error;
      }
    };
    
    // Instrument XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, async = true) {
      this._apm_method = method;
      this._apm_url = url;
      this._apm_startTime = performance.now();
      
      return originalXHROpen.call(this, method, url, async);
    };
    
    XMLHttpRequest.prototype.send = function(data) {
      const monitor = this;
      
      this.addEventListener('loadend', function() {
        const duration = performance.now() - this._apm_startTime;
        
        monitor.recordHTTPRequest({
          method: this._apm_method,
          url: this._apm_url,
          status: this.status,
          duration: duration,
          timestamp: Date.now()
        });
      });
      
      return originalXHRSend.call(this, data);
    };
    
    // Monitor page navigation
    this.monitorPageNavigation();
  }
  
  instrumentNodeAPIs() {
    const http = require('http');
    const https = require('https');
    
    // Instrument HTTP server
    const originalCreateServer = http.createServer;
    http.createServer = (...args) => {
      const server = originalCreateServer(...args);
      
      server.on('request', (req, res) => {
        const startTime = process.hrtime.bigint();
        
        const span = this.startSpan('http.server', {
          'http.method': req.method,
          'http.url': req.url,
          'http.remote_addr': req.connection.remoteAddress
        });
        
        // Intercept response end
        const originalEnd = res.end;
        res.end = function(...endArgs) {
          const duration = Number(process.hrtime.bigint() - startTime) / 1000000; // Convert to milliseconds
          
          span.setTag('http.status_code', res.statusCode);
          span.setTag('http.response_size', res.getHeader('content-length') || 0);
          
          monitor.recordHTTPRequest({
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: duration,
            timestamp: Date.now(),
            remoteAddr: req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
          });
          
          span.finish();
          return originalEnd.apply(this, endArgs);
        };
      });
      
      return server;
    };
    
    // Monitor system resources
    this.monitorSystemResources();
  }
  
  monitorPageNavigation() {
    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        
        this.recordCustomMetric('page.load', {
          value: navigation.loadEventEnd - navigation.fetchStart,
          tags: {
            type: 'page_load',
            url: window.location.href
          }
        });
        
        this.recordCustomMetric('page.ttfb', {
          value: navigation.responseStart - navigation.fetchStart,
          tags: {
            type: 'time_to_first_byte',
            url: window.location.href
          }
        });
        
        this.recordCustomMetric('page.dom_complete', {
          value: navigation.domComplete - navigation.fetchStart,
          tags: {
            type: 'dom_complete',
            url: window.location.href
          }
        });
      }, 0);
    });
    
    // Monitor route changes (SPA)
    this.monitorRouteChanges();
  }
  
  monitorRouteChanges() {
    let currentRoute = window.location.pathname;
    let routeStartTime = performance.now();
    
    // Monitor pushState/replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    const handleRouteChange = (newRoute) => {
      const routeChangeTime = performance.now() - routeStartTime;
      
      this.recordCustomMetric('route.change', {
        value: routeChangeTime,
        tags: {
          from: currentRoute,
          to: newRoute,
          type: 'spa_navigation'
        }
      });
      
      currentRoute = newRoute;
      routeStartTime = performance.now();
    };
    
    history.pushState = function(state, title, url) {
      const result = originalPushState.apply(this, arguments);
      handleRouteChange(new URL(url, window.location.origin).pathname);
      return result;
    };
    
    history.replaceState = function(state, title, url) {
      const result = originalReplaceState.apply(this, arguments);
      handleRouteChange(new URL(url, window.location.origin).pathname);
      return result;
    };
    
    // Monitor popstate (back/forward)
    window.addEventListener('popstate', () => {
      handleRouteChange(window.location.pathname);
    });
  }
  
  monitorSystemResources() {
    const os = require('os');
    const process = require('process');
    
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      this.metrics.systemMetrics.push({
        timestamp: Date.now(),
        memory: {
          rss: memUsage.rss,
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        eventLoop: this.measureEventLoopLag(),
        uptime: process.uptime(),
        loadAverage: os.loadavg(),
        freeMemory: os.freemem(),
        totalMemory: os.totalmem()
      });
    }, 5000); // Every 5 seconds
  }
  
  measureEventLoopLag() {
    const start = process.hrtime.bigint();
    
    return new Promise((resolve) => {
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
        resolve(lag);
      });
    });
  }
  
  startMetricsCollection() {
    // Flush metrics periodically
    setInterval(() => {
      this.flushMetrics();
    }, this.flushInterval);
    
    // Flush on process exit
    if (typeof process !== 'undefined') {
      process.on('exit', () => this.flushMetrics());
      process.on('SIGINT', () => {
        this.flushMetrics();
        process.exit();
      });
    }
    
    // Flush on page unload (browser)
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flushMetrics());
    }
  }
  
  recordHTTPRequest(requestData) {
    if (Math.random() > this.sampleRate) return;
    
    this.metrics.requests.push({
      ...requestData,
      app: this.appName,
      version: this.version,
      environment: this.environment
    });
  }
  
  recordError(error, context = {}) {
    this.metrics.errors.push({
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      timestamp: Date.now(),
      app: this.appName,
      version: this.version,
      environment: this.environment,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    });
  }
  
  recordCustomMetric(name, data) {
    if (!this.metrics.customMetrics.has(name)) {
      this.metrics.customMetrics.set(name, []);
    }
    
    this.metrics.customMetrics.get(name).push({
      ...data,
      timestamp: Date.now(),
      app: this.appName,
      version: this.version,
      environment: this.environment
    });
  }
  
  startSpan(operation, tags = {}) {
    const spanId = this.generateSpanId();
    const traceId = this.getTraceId();
    
    const span = {
      spanId,
      traceId,
      operation,
      startTime: Date.now(),
      tags,
      logs: [],
      finished: false,
      
      setTag(key, value) {
        this.tags[key] = value;
      },
      
      log(fields) {
        this.logs.push({
          timestamp: Date.now(),
          fields
        });
      },
      
      finish() {
        if (this.finished) return;
        
        this.finished = true;
        this.endTime = Date.now();
        this.duration = this.endTime - this.startTime;
        
        // Record trace
        monitor.metrics.traces.push({
          spanId: this.spanId,
          traceId: this.traceId,
          operation: this.operation,
          startTime: this.startTime,
          endTime: this.endTime,
          duration: this.duration,
          tags: this.tags,
          logs: this.logs
        });
        
        monitor.spans.delete(this.spanId);
      }
    };
    
    this.spans.set(spanId, span);
    return span;
  }
  
  generateSpanId() {
    return Math.random().toString(36).substr(2, 9);
  }
  
  getTraceId() {
    // Simple trace ID generation - in production, use proper distributed tracing
    return 'trace-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
  }
  
  async flushMetrics() {
    const payload = {
      app: this.appName,
      version: this.version,
      environment: this.environment,
      timestamp: Date.now(),
      metrics: {
        requests: this.metrics.requests.splice(0),
        errors: this.metrics.errors.splice(0),
        customMetrics: Object.fromEntries(
          Array.from(this.metrics.customMetrics.entries()).map(([key, values]) => [
            key,
            values.splice(0)
          ])
        ),
        systemMetrics: this.metrics.systemMetrics.splice(0),
        traces: this.metrics.traces.splice(0)
      }
    };
    
    if (this.hasData(payload.metrics)) {
      await this.sendMetrics(payload);
    }
  }
  
  hasData(metrics) {
    return metrics.requests.length > 0 ||
           metrics.errors.length > 0 ||
           Object.values(metrics.customMetrics).some(arr => arr.length > 0) ||
           metrics.systemMetrics.length > 0 ||
           metrics.traces.length > 0;
  }
  
  async sendMetrics(payload) {
    try {
      const endpoint = process.env.APM_ENDPOINT || '/api/metrics';
      
      if (typeof fetch !== 'undefined') {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else if (typeof require !== 'undefined') {
        const https = require('https');
        const http = require('http');
        
        // Simple HTTP request implementation for Node.js
        console.log('Sending metrics:', JSON.stringify(payload, null, 2));
      }
    } catch (error) {
      console.error('Failed to send metrics:', error);
    }
  }
  
  // Public API methods
  timing(name, duration, tags = {}) {
    this.recordCustomMetric(name, { value: duration, tags: { ...tags, type: 'timing' } });
  }
  
  increment(name, value = 1, tags = {}) {
    this.recordCustomMetric(name, { value, tags: { ...tags, type: 'counter' } });
  }
  
  gauge(name, value, tags = {}) {
    this.recordCustomMetric(name, { value, tags: { ...tags, type: 'gauge' } });
  }
  
  histogram(name, value, tags = {}) {
    this.recordCustomMetric(name, { value, tags: { ...tags, type: 'histogram' } });
  }
}

// Global APM instance
const apm = new ApplicationPerformanceMonitor({
  appName: 'my-application',
  version: process.env.APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  sampleRate: parseFloat(process.env.APM_SAMPLE_RATE) || 0.1
});

// Export for use in application
if (typeof module !== 'undefined' && module.exports) {
  module.exports = apm;
} else if (typeof window !== 'undefined') {
  window.apm = apm;
}
```

### 2. Real User Monitoring (RUM)
```javascript
// Advanced Real User Monitoring
class RealUserMonitor {
  constructor(options = {}) {
    this.apiKey = options.apiKey;
    this.endpoint = options.endpoint || '/api/rum';
    this.sampleRate = options.sampleRate || 0.2; // 20% of users
    this.bufferSize = options.bufferSize || 100;
    
    this.sessionId = this.generateSessionId();
    this.userId = options.userId || this.getAnonymousId();
    this.buffer = [];
    
    this.vitals = {
      fcp: null,
      lcp: null,
      fid: null,
      cls: null,
      ttfb: null
    };
    
    this.setupMonitoring();
  }
  
  setupMonitoring() {
    if (Math.random() > this.sampleRate) {
      return; // Skip monitoring for unsampled users
    }
    
    this.monitorWebVitals();
    this.monitorUserInteractions();
    this.monitorPerformanceMetrics();
    this.monitorErrors();
    this.monitorConnectivity();
    this.setupBeaconSending();
  }
  
  monitorWebVitals() {
    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          this.vitals.fcp = entry.startTime;
          this.record('web-vital', {
            metric: 'fcp',
            value: entry.startTime,
            rating: this.getRating('fcp', entry.startTime)
          });
        }
      });
    });
    fcpObserver.observe({ entryTypes: ['paint'] });
    
    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.vitals.lcp = lastEntry.startTime;
      this.record('web-vital', {
        metric: 'lcp',
        value: lastEntry.startTime,
        rating: this.getRating('lcp', lastEntry.startTime),
        element: lastEntry.element ? this.getElementSelector(lastEntry.element) : null
      });
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    
    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const firstInput = list.getEntries()[0];
      const fid = firstInput.processingStart - firstInput.startTime;
      
      this.vitals.fid = fid;
      this.record('web-vital', {
        metric: 'fid',
        value: fid,
        rating: this.getRating('fid', fid),
        eventType: firstInput.name
      });
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
      
      this.vitals.cls = clsValue;
      this.record('web-vital', {
        metric: 'cls',
        value: clsValue,
        rating: this.getRating('cls', clsValue)
      });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
    
    // Time to First Byte
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const ttfb = navigation.responseStart - navigation.fetchStart;
      
      this.vitals.ttfb = ttfb;
      this.record('web-vital', {
        metric: 'ttfb',
        value: ttfb,
        rating: this.getRating('ttfb', ttfb)
      });
    });
  }
  
  getRating(metric, value) {
    const thresholds = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      ttfb: { good: 800, poor: 1800 }
    };
    
    const threshold = thresholds[metric];
    if (!threshold) return 'unknown';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }
  
  monitorUserInteractions() {
    const interactionTypes = ['click', 'input', 'scroll', 'keydown'];
    
    interactionTypes.forEach(type => {
      document.addEventListener(type, (event) => {
        this.recordInteraction(type, event);
      }, { passive: true });
    });
    
    // Track rage clicks
    this.setupRageClickDetection();
    
    // Track dead clicks
    this.setupDeadClickDetection();
  }
  
  recordInteraction(type, event) {
    const interaction = {
      type,
      timestamp: Date.now(),
      target: this.getElementSelector(event.target),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
    
    // Add specific data based on interaction type
    switch (type) {
      case 'click':
        interaction.coordinates = {
          x: event.clientX,
          y: event.clientY
        };
        break;
        
      case 'scroll':
        interaction.scrollPosition = {
          x: window.scrollX,
          y: window.scrollY
        };
        interaction.scrollPercentage = this.getScrollPercentage();
        break;
        
      case 'input':
        interaction.inputType = event.target.type;
        interaction.inputLength = event.target.value ? event.target.value.length : 0;
        break;
    }
    
    this.record('interaction', interaction);
  }
  
  setupRageClickDetection() {
    let clickCount = 0;
    let lastTarget = null;
    let resetTimer = null;
    
    document.addEventListener('click', (event) => {
      const target = event.target;
      
      if (target === lastTarget) {
        clickCount++;
        
        if (clickCount >= 3) {
          this.record('rage-click', {
            target: this.getElementSelector(target),
            clickCount,
            coordinates: { x: event.clientX, y: event.clientY }
          });
        }
      } else {
        clickCount = 1;
        lastTarget = target;
      }
      
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        clickCount = 0;
        lastTarget = null;
      }, 2000);
    });
  }
  
  setupDeadClickDetection() {
    document.addEventListener('click', (event) => {
      const target = event.target;
      const startTime = Date.now();
      
      // Check if click resulted in navigation or significant DOM change
      setTimeout(() => {
        const endTime = Date.now();
        const timeDiff = endTime - startTime;
        
        // If no navigation occurred and minimal time passed, might be a dead click
        if (timeDiff < 100 && window.location.href === window.location.href) {
          this.record('potential-dead-click', {
            target: this.getElementSelector(target),
            coordinates: { x: event.clientX, y: event.clientY },
            timeSinceClick: timeDiff
          });
        }
      }, 1000);
    });
  }
  
  monitorPerformanceMetrics() {
    // Monitor resource loading
    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.duration > 1000) { // Resources taking > 1s
          this.record('slow-resource', {
            name: entry.name,
            type: this.getResourceType(entry.name),
            duration: entry.duration,
            size: entry.transferSize || 0,
            cached: entry.transferSize === 0
          });
        }
      });
    });
    resourceObserver.observe({ entryTypes: ['resource'] });
    
    // Monitor long tasks
    const longTaskObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.record('long-task', {
          duration: entry.duration,
          startTime: entry.startTime,
          attribution: entry.attribution ? entry.attribution.map(attr => ({
            name: attr.name,
            type: attr.containerType,
            src: attr.containerSrc,
            id: attr.containerId
          })) : []
        });
      });
    });
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  }
  
  monitorErrors() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.record('javascript-error', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error ? event.error.stack : null
      });
    });
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.record('unhandled-rejection', {
        reason: event.reason ? event.reason.toString() : 'Unknown',
        stack: event.reason && event.reason.stack ? event.reason.stack : null
      });
    });
    
    // Resource errors
    document.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.record('resource-error', {
          type: event.target.tagName,
          source: event.target.src || event.target.href,
          message: 'Failed to load resource'
        });
      }
    }, true);
  }
  
  monitorConnectivity() {
    // Connection type and speed
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      this.record('connection-info', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      });
      
      // Monitor connection changes
      connection.addEventListener('change', () => {
        this.record('connection-change', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        });
      });
    }
    
    // Online/offline events
    window.addEventListener('online', () => {
      this.record('connectivity', { status: 'online' });
    });
    
    window.addEventListener('offline', () => {
      this.record('connectivity', { status: 'offline' });
    });
  }
  
  record(type, data) {
    const entry = {
      type,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
    
    this.buffer.push(entry);
    
    if (this.buffer.length >= this.bufferSize) {
      this.flush();
    }
  }
  
  setupBeaconSending() {
    // Send data periodically
    setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    }, 30000); // Every 30 seconds
    
    // Send on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });
    
    // Send on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
    
    // Send on page hide (better than beforeunload)
    window.addEventListener('pagehide', () => {
      this.flush();
    });
  }
  
  flush() {
    if (this.buffer.length === 0) return;
    
    const payload = {
      sessionId: this.sessionId,
      userId: this.userId,
      entries: this.buffer.splice(0),
      vitals: this.vitals,
      metadata: {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };
    
    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.endpoint, JSON.stringify(payload));
    } else {
      // Fallback to fetch
      fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(error => {
        console.warn('Failed to send RUM data:', error);
      });
    }
  }
  
  getElementSelector(element) {
    if (!element) return null;
    
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c);
      if (classes.length > 0) {
        return `.${classes[0]}`;
      }
    }
    
    const tagName = element.tagName.toLowerCase();
    const parent = element.parentElement;
    
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(element);
      return `${tagName}:nth-child(${index + 1})`;
    }
    
    return tagName;
  }
  
  getResourceType(url) {
    if (url.match(/\.(css)(\?|$)/)) return 'css';
    if (url.match(/\.(js)(\?|$)/)) return 'javascript';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)(\?|$)/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf)(\?|$)/)) return 'font';
    return 'other';
  }
  
  getScrollPercentage() {
    const scrollTop = window.scrollY;
    const docHeight = document.body.scrollHeight;
    const winHeight = window.innerHeight;
    const scrollPercent = scrollTop / (docHeight - winHeight);
    return Math.round(scrollPercent * 100);
  }
  
  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  getAnonymousId() {
    let id = localStorage.getItem('rum_anonymous_id');
    if (!id) {
      id = 'anon_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
      localStorage.setItem('rum_anonymous_id', id);
    }
    return id;
  }
  
  // Public API
  setUserId(userId) {
    this.userId = userId;
  }
  
  addCustomData(key, value) {
    this.record('custom-data', { [key]: value });
  }
  
  trackEvent(eventName, properties = {}) {
    this.record('custom-event', {
      eventName,
      properties
    });
  }
}

// Initialize RUM
const rum = new RealUserMonitor({
  endpoint: '/api/rum',
  sampleRate: 0.3, // Monitor 30% of users
  userId: window.currentUser ? window.currentUser.id : null
});

// Export for use
if (typeof window !== 'undefined') {
  window.rum = rum;
}
```

## Server-Side Profiling

### 1. Node.js Performance Profiling
```javascript
// Comprehensive Node.js profiler
const fs = require('fs');
const path = require('path');
const { performance, PerformanceObserver } = require('perf_hooks');

class NodeProfiler {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.outputDir = options.outputDir || './profiles';
    this.sampleRate = options.sampleRate || 0.01; // 1% sampling
    this.cpuThreshold = options.cpuThreshold || 80; // CPU % threshold
    this.memoryThreshold = options.memoryThreshold || 500; // MB threshold
    
    this.metrics = {
      cpu: [],
      memory: [],
      eventLoop: [],
      gc: [],
      httpRequests: []
    };
    
    this.activeProfiles = new Map();
    
    if (this.enabled) {
      this.setup();
    }
  }
  
  setup() {
    this.setupPerformanceObserver();
    this.setupMemoryMonitoring();
    this.setupEventLoopMonitoring();
    this.setupGCMonitoring();
    this.setupSignalHandlers();
    this.ensureOutputDir();
  }
  
  setupPerformanceObserver() {
    const obs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach(entry => {
        if (entry.entryType === 'measure') {
          this.metrics.httpRequests.push({
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            timestamp: Date.now()
          });
          
          // Log slow operations
          if (entry.duration > 1000) { // > 1 second
            console.warn(`Slow operation detected: ${entry.name} took ${entry.duration}ms`);
            
            if (Math.random() < this.sampleRate) {
              this.captureProfile('slow-operation', 10000); // 10 second profile
            }
          }
        }
      });
    });
    
    obs.observe({ entryTypes: ['measure'] });
  }
  
  setupMemoryMonitoring() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      
      this.metrics.memory.push({
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        timestamp: Date.now()
      });
      
      // Trigger profiling on high memory usage
      if (heapUsedMB > this.memoryThreshold) {
        console.warn(`High memory usage detected: ${heapUsedMB}MB`);
        
        if (Math.random() < this.sampleRate * 2) { // Higher sampling for memory issues
          this.captureHeapSnapshot();
          this.captureProfile('high-memory', 5000);
        }
      }
      
      // Keep only recent memory metrics
      if (this.metrics.memory.length > 1000) {
        this.metrics.memory = this.metrics.memory.slice(-500);
      }
    }, 5000); // Every 5 seconds
  }
  
  setupEventLoopMonitoring() {
    const { monitorEventLoopDelay } = require('perf_hooks');
    const h = monitorEventLoopDelay({ resolution: 20 });
    h.enable();
    
    setInterval(() => {
      const lag = h.mean / 1000000; // Convert to milliseconds
      
      this.metrics.eventLoop.push({
        mean: h.mean / 1000000,
        min: h.min / 1000000,
        max: h.max / 1000000,
        stddev: h.stddev / 1000000,
        percentile50: h.percentile(50) / 1000000,
        percentile95: h.percentile(95) / 1000000,
        percentile99: h.percentile(99) / 1000000,
        timestamp: Date.now()
      });
      
      h.reset();
      
      // Alert on high event loop lag
      if (lag > 50) { // > 50ms lag
        console.warn(`High event loop lag detected: ${lag}ms`);
        
        if (Math.random() < this.sampleRate) {
          this.captureProfile('event-loop-lag', 5000);
        }
      }
      
      // Keep only recent metrics
      if (this.metrics.eventLoop.length > 500) {
        this.metrics.eventLoop = this.metrics.eventLoop.slice(-250);
      }
    }, 10000); // Every 10 seconds
  }
  
  setupGCMonitoring() {
    const gcTypes = {
      1: 'Scavenge',
      2: 'Mark-Sweep-Compact',
      4: 'Incremental Marking',
      8: 'Weak Phantom Callback Processing'
    };
    
    const obs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach(entry => {
        this.metrics.gc.push({
          type: gcTypes[entry.detail?.type] || 'Unknown',
          duration: entry.duration,
          timestamp: Date.now()
        });
        
        // Log long GC pauses
        if (entry.duration > 100) { // > 100ms GC pause
          console.warn(`Long GC pause: ${entry.duration}ms (${gcTypes[entry.detail?.type]})`);
        }
      });
    });
    
    obs.observe({ entryTypes: ['gc'] });
  }
  
  setupSignalHandlers() {
    // Capture profile on SIGUSR2
    process.on('SIGUSR2', () => {
      console.log('Received SIGUSR2, capturing CPU profile...');
      this.captureProfile('manual', 30000); // 30 second profile
    });
    
    // Capture heap snapshot on SIGUSR1
    process.on('SIGUSR1', () => {
      console.log('Received SIGUSR1, capturing heap snapshot...');
      this.captureHeapSnapshot();
    });
  }
  
  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }
  
  captureProfile(reason, duration = 10000) {
    const profileId = `${reason}-${Date.now()}`;
    
    if (this.activeProfiles.has('cpu')) {
      console.log('CPU profiling already in progress, skipping...');
      return;
    }
    
    console.log(`Starting CPU profile: ${profileId} for ${duration}ms`);
    
    const { Session } = require('inspector');
    const session = new Session();
    session.connect();
    
    this.activeProfiles.set('cpu', profileId);
    
    session.post('Profiler.enable', () => {
      session.post('Profiler.start', () => {
        setTimeout(() => {
          session.post('Profiler.stop', (err, profile) => {
            if (!err && profile) {
              this.saveProfile(profileId, profile.profile, reason);
            }
            
            session.disconnect();
            this.activeProfiles.delete('cpu');
          });
        }, duration);
      });
    });
  }
  
  captureHeapSnapshot() {
    const snapshotId = `heap-${Date.now()}`;
    
    if (this.activeProfiles.has('heap')) {
      console.log('Heap snapshot capture already in progress, skipping...');
      return;
    }
    
    console.log(`Capturing heap snapshot: ${snapshotId}`);
    
    const { Session } = require('inspector');
    const session = new Session();
    session.connect();
    
    this.activeProfiles.set('heap', snapshotId);
    
    const chunks = [];
    
    session.on('HeapProfiler.addHeapSnapshotChunk', (chunk) => {
      chunks.push(chunk.chunk);
    });
    
    session.post('HeapProfiler.takeHeapSnapshot', null, (err) => {
      if (!err) {
        const snapshot = chunks.join('');
        this.saveHeapSnapshot(snapshotId, snapshot);
      }
      
      session.disconnect();
      this.activeProfiles.delete('heap');
    });
  }
  
  saveProfile(id, profile, reason) {
    const filename = `${id}.cpuprofile`;
    const filepath = path.join(this.outputDir, filename);
    
    const metadata = {
      id,
      reason,
      timestamp: Date.now(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
    
    const data = {
      metadata,
      profile
    };
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`CPU profile saved: ${filepath}`);
    
    // Analyze profile for immediate insights
    this.analyzeProfile(profile, reason);
  }
  
  saveHeapSnapshot(id, snapshot) {
    const filename = `${id}.heapsnapshot`;
    const filepath = path.join(this.outputDir, filename);
    
    fs.writeFileSync(filepath, snapshot);
    console.log(`Heap snapshot saved: ${filepath}`);
    
    // Basic analysis
    try {
      const parsed = JSON.parse(snapshot);
      const nodeCount = parsed.nodes ? parsed.nodes.length / 7 : 0; // 7 fields per node
      const edgeCount = parsed.edges ? parsed.edges.length / 3 : 0; // 3 fields per edge
      
      console.log(`Heap snapshot analysis: ${nodeCount} nodes, ${edgeCount} edges`);
    } catch (error) {
      console.error('Failed to analyze heap snapshot:', error);
    }
  }
  
  analyzeProfile(profile, reason) {
    try {
      const nodes = profile.nodes || [];
      const samples = profile.samples || [];
      
      // Count samples per function
      const functionCounts = new Map();
      
      samples.forEach(sampleId => {
        const nodeIndex = sampleId;
        if (nodes[nodeIndex]) {
          const callFrame = nodes[nodeIndex].callFrame;
          if (callFrame) {
            const key = `${callFrame.functionName || 'anonymous'}@${callFrame.url}:${callFrame.lineNumber}`;
            functionCounts.set(key, (functionCounts.get(key) || 0) + 1);
          }
        }
      });
      
      // Find hot functions
      const sortedFunctions = Array.from(functionCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      console.log(`Profile analysis (${reason}):`);
      console.log('Top 10 hot functions:');
      sortedFunctions.forEach(([func, count], index) => {
        const percentage = ((count / samples.length) * 100).toFixed(2);
        console.log(`  ${index + 1}. ${func} (${percentage}%)`);
      });
      
    } catch (error) {
      console.error('Failed to analyze profile:', error);
    }
  }
  
  // Instrument specific functions for profiling
  instrument(obj, methodName, label) {
    const originalMethod = obj[methodName];
    
    obj[methodName] = async function(...args) {
      const startMark = `${label}-start`;
      const endMark = `${label}-end`;
      const measureName = `${label}-duration`;
      
      performance.mark(startMark);
      
      try {
        const result = await originalMethod.apply(this, args);
        
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
        
        return result;
      } catch (error) {
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
        throw error;
      }
    };
  }
  
  // Manual profiling controls
  startProfiling(duration = 30000) {
    this.captureProfile('manual', duration);
  }
  
  takeHeapSnapshot() {
    this.captureHeapSnapshot();
  }
  
  getMetrics() {
    return {
      memory: this.metrics.memory.slice(-10), // Last 10 entries
      eventLoop: this.metrics.eventLoop.slice(-10),
      gc: this.metrics.gc.slice(-20),
      httpRequests: this.metrics.httpRequests.slice(-50)
    };
  }
  
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      metrics: this.getMetrics(),
      activeProfiles: Array.from(this.activeProfiles.entries())
    };
    
    const reportPath = path.join(this.outputDir, `report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`Performance report saved: ${reportPath}`);
    return report;
  }
}

// Global profiler instance
const profiler = new NodeProfiler({
  enabled: process.env.ENABLE_PROFILING === 'true',
  outputDir: process.env.PROFILE_OUTPUT_DIR || './profiles',
  sampleRate: parseFloat(process.env.PROFILE_SAMPLE_RATE) || 0.01
});

module.exports = profiler;
```

## Best Practices Summary

### Monitoring Strategy
1. **Layer Your Monitoring**: Combine APM, RUM, and infrastructure monitoring
2. **Sample Intelligently**: Use adaptive sampling rates based on traffic
3. **Monitor What Matters**: Focus on business-critical metrics
4. **Set Meaningful Alerts**: Avoid alert fatigue with smart thresholds

### Performance Profiling
1. **Profile in Production**: Use low-overhead profiling in production
2. **Correlate Metrics**: Connect performance issues to business impact
3. **Automate Analysis**: Use automated tools for pattern detection
4. **Historical Analysis**: Track performance trends over time

### Data Management
1. **Buffer and Batch**: Send monitoring data efficiently
2. **Compress Data**: Reduce monitoring overhead
3. **Retention Policies**: Manage storage costs with intelligent retention
4. **Privacy Considerations**: Ensure user data protection

### Continuous Improvement
1. **Regular Reviews**: Analyze monitoring data regularly
2. **Performance Budgets**: Set and enforce performance budgets
3. **Automated Optimization**: Use monitoring data to trigger optimizations
4. **Team Training**: Ensure team understands monitoring tools and data

This monitoring and profiling guide provides production-ready tools for maintaining high-performance applications and quickly identifying performance bottlenecks in real-world scenarios.