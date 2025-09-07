/**
 * Performance Assertion Helpers for Micro-Framework
 * Provides utilities for testing component render times and performance metrics
 */

/**
 * Performance measurement utilities
 */
export class PerformanceAssertions {
  constructor() {
    this.measurements = new Map();
    this.thresholds = {
      renderTime: 16, // 60fps target (16ms per frame)
      paintTime: 100,
      layoutTime: 50,
      scriptTime: 50,
      interactionTime: 100
    };
  }

  /**
   * Measure component render time
   * @param {string} componentName - Name of the component being tested
   * @param {Function} renderFn - Function that renders the component
   * @param {Object} options - Measurement options
   * @returns {Promise<Object>} Performance metrics
   */
  async measureRenderTime(componentName, renderFn, options = {}) {
    const { iterations = 10, warmup = 3 } = options;
    const measurements = [];

    // Warmup runs to stabilize performance
    for (let i = 0; i < warmup; i++) {
      await renderFn();
    }

    // Actual measurements
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await renderFn();
      const endTime = performance.now();
      measurements.push(endTime - startTime);
    }

    const metrics = this._calculateMetrics(measurements);
    this.measurements.set(componentName, metrics);

    return metrics;
  }

  /**
   * Assert component renders within time threshold
   * @param {string} componentName - Component name
   * @param {number} threshold - Maximum allowed render time in ms
   * @param {string} message - Custom assertion message
   */
  expectRenderTime(componentName, threshold = this.thresholds.renderTime, message) {
    const metrics = this.measurements.get(componentName);
    if (!metrics) {
      throw new Error(`No measurements found for component: ${componentName}`);
    }

    const assertMessage = message || 
      `${componentName} should render within ${threshold}ms (actual: ${metrics.average.toFixed(2)}ms)`;

    if (metrics.average > threshold) {
      throw new Error(`Performance assertion failed: ${assertMessage}`);
    }
  }

  /**
   * Assert component renders consistently (low variance)
   * @param {string} componentName - Component name
   * @param {number} maxVariance - Maximum allowed variance percentage
   */
  expectConsistentRenderTime(componentName, maxVariance = 20) {
    const metrics = this.measurements.get(componentName);
    if (!metrics) {
      throw new Error(`No measurements found for component: ${componentName}`);
    }

    const variance = (metrics.standardDeviation / metrics.average) * 100;
    
    if (variance > maxVariance) {
      throw new Error(
        `Render time variance too high for ${componentName}: ${variance.toFixed(2)}% (max: ${maxVariance}%)`
      );
    }
  }

  /**
   * Measure Paint Timing API metrics
   * @returns {Object} Paint timing metrics
   */
  measurePaintTiming() {
    const paintEntries = performance.getEntriesByType('paint');
    const metrics = {};

    paintEntries.forEach(entry => {
      metrics[entry.name.replace('-', '_')] = entry.startTime;
    });

    return metrics;
  }

  /**
   * Measure Layout Shift (CLS approximation)
   * @param {Function} actionFn - Function that triggers layout changes
   * @returns {Promise<number>} Layout shift score
   */
  async measureLayoutShift(actionFn) {
    return new Promise((resolve) => {
      let cumulativeScore = 0;
      
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            cumulativeScore += entry.value;
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });

      // Execute the action and measure for 1 second
      actionFn();
      
      setTimeout(() => {
        observer.disconnect();
        resolve(cumulativeScore);
      }, 1000);
    });
  }

  /**
   * Measure First Input Delay
   * @returns {Promise<number>} First input delay in ms
   */
  measureFirstInputDelay() {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'first-input') {
            resolve(entry.processingStart - entry.startTime);
            observer.disconnect();
            break;
          }
        }
      });

      observer.observe({ entryTypes: ['first-input'] });
    });
  }

  /**
   * Create a performance benchmark suite
   * @param {Object} components - Object with component names as keys and render functions as values
   * @param {Object} options - Benchmark options
   * @returns {Promise<Object>} Benchmark results
   */
  async benchmarkComponents(components, options = {}) {
    const results = {};
    const { threshold = this.thresholds.renderTime, iterations = 10 } = options;

    for (const [name, renderFn] of Object.entries(components)) {
      results[name] = await this.measureRenderTime(name, renderFn, { iterations });
      
      // Add pass/fail status
      results[name].passed = results[name].average <= threshold;
      results[name].threshold = threshold;
    }

    return results;
  }

  /**
   * Generate performance report
   * @param {Object} results - Benchmark results
   * @returns {string} Formatted performance report
   */
  generateReport(results) {
    let report = '📊 Performance Report\n';
    report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    for (const [component, metrics] of Object.entries(results)) {
      const status = metrics.passed ? '✅' : '❌';
      report += `${status} ${component}\n`;
      report += `   Average: ${metrics.average.toFixed(2)}ms\n`;
      report += `   Min: ${metrics.min.toFixed(2)}ms | Max: ${metrics.max.toFixed(2)}ms\n`;
      report += `   P95: ${metrics.p95.toFixed(2)}ms | P99: ${metrics.p99.toFixed(2)}ms\n`;
      report += `   Threshold: ${metrics.threshold}ms\n\n`;
    }

    return report;
  }

  /**
   * Calculate statistical metrics from measurements
   * @private
   */
  _calculateMetrics(measurements) {
    const sorted = [...measurements].sort((a, b) => a - b);
    const sum = measurements.reduce((acc, val) => acc + val, 0);
    const average = sum / measurements.length;
    
    const variance = measurements.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / measurements.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      average,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      standardDeviation,
      variance,
      measurements: [...measurements]
    };
  }

  /**
   * Reset all measurements
   */
  reset() {
    this.measurements.clear();
  }

  /**
   * Export measurements as JSON
   * @returns {Object} All measurements data
   */
  export() {
    const data = {};
    for (const [key, value] of this.measurements.entries()) {
      data[key] = value;
    }
    return data;
  }
}

/**
 * Global performance assertion instance
 */
export const perf = new PerformanceAssertions();

/**
 * Vitest integration helpers
 */
export function createPerfTest(name, renderFn, options = {}) {
  return {
    name,
    async run() {
      const metrics = await perf.measureRenderTime(name, renderFn, options);
      perf.expectRenderTime(name, options.threshold);
      perf.expectConsistentRenderTime(name, options.maxVariance);
      return metrics;
    }
  };
}

/**
 * Performance test decorator for components
 * @param {Object} options - Performance test options
 * @returns {Function} Test decorator
 */
export function withPerformanceTest(options = {}) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const startTime = performance.now();
      const result = await originalMethod.apply(this, args);
      const endTime = performance.now();
      
      const renderTime = endTime - startTime;
      const threshold = options.threshold || perf.thresholds.renderTime;
      
      if (renderTime > threshold) {
        console.warn(`⚠️ Performance warning: ${propertyKey} took ${renderTime.toFixed(2)}ms (threshold: ${threshold}ms)`);
      }
      
      return result;
    };
    
    return descriptor;
  };
}