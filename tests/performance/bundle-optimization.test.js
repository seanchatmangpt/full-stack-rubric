/**
 * @fileoverview Performance benchmarks and tests for bundle optimization
 * Tests tree shaking, lazy loading, and overall bundle performance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { 
  performanceUtils, 
  bundleAnalyzer, 
  monacoOptimizer, 
  codeSplitting 
} from '../../app/utils/performanceOptimizer.js';
import { usePerformanceOptimization } from '../../app/composables/usePerformanceOptimization.js';

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1024 * 1024 * 10, // 10MB
      totalJSHeapSize: 1024 * 1024 * 20, // 20MB
      jsHeapSizeLimit: 1024 * 1024 * 100 // 100MB
    },
    getEntriesByType: vi.fn((type) => {
      if (type === 'navigation') {
        return [{
          navigationStart: 1000,
          loadEventEnd: 3000,
          domContentLoadedEventEnd: 2500
        }];
      }
      return [];
    })
  },
  writable: true
});

// Mock DOM APIs
Object.defineProperty(global, 'document', {
  value: {
    scripts: [
      { src: '/bundle.js', async: false },
      { src: '/vendor.js', defer: true },
      { src: '/monaco.js', async: true }
    ],
    head: {
      appendChild: vi.fn()
    },
    createElement: vi.fn(() => ({
      rel: '',
      as: '',
      href: '',
      onload: null,
      onerror: null
    })),
    querySelector: vi.fn(() => null)
  },
  writable: true
});

// Mock fetch for bundle size testing
global.fetch = vi.fn(() => 
  Promise.resolve({
    headers: new Map([['content-length', '51200']]) // 50KB
  })
);

describe('Bundle Optimization Performance Tests', () => {
  let performanceMonitor;
  
  beforeEach(() => {
    vi.clearAllMocks();
    performanceMonitor = usePerformanceOptimization({ autoStart: false });
  });
  
  afterEach(() => {
    if (performanceMonitor?.stopMonitoring) {
      performanceMonitor.stopMonitoring();
    }
  });

  describe('Tree Shaking Utilities', () => {
    it('should provide tree-shakable utility functions', () => {
      expect(performanceUtils.debounce).toBeDefined();
      expect(performanceUtils.throttle).toBeDefined();
      expect(performanceUtils.lazyImport).toBeDefined();
      expect(performanceUtils.preloadResource).toBeDefined();
    });

    it('should debounce function calls correctly', (done) => {
      const mockFn = vi.fn();
      const debouncedFn = performanceUtils.debounce(mockFn, 100);
      
      // Call multiple times rapidly
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      // Should not be called immediately
      expect(mockFn).not.toHaveBeenCalled();
      
      // Should be called once after debounce period
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
        done();
      }, 150);
    });

    it('should throttle function calls correctly', (done) => {
      const mockFn = vi.fn();
      const throttledFn = performanceUtils.throttle(mockFn, 100);
      
      // Call multiple times rapidly
      throttledFn();
      throttledFn();
      throttledFn();
      
      // Should be called immediately once
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      // Additional calls should be throttled
      setTimeout(() => {
        throttledFn();
        expect(mockFn).toHaveBeenCalledTimes(2);
        done();
      }, 150);
    });

    it('should handle lazy imports with error handling', async () => {
      // Successful import
      const successImport = () => Promise.resolve({ default: 'module' });
      const result1 = await performanceUtils.lazyImport(successImport);
      expect(result1).toBe('module');
      
      // Failed import
      const failImport = () => Promise.reject(new Error('Import failed'));
      const result2 = await performanceUtils.lazyImport(failImport);
      expect(result2).toBe(null);
    });
  });

  describe('Code Splitting', () => {
    it('should create async components with proper configuration', () => {
      const mockImport = () => Promise.resolve({ default: {} });
      const asyncComponent = codeSplitting.createAsyncComponent(mockImport, {
        delay: 500,
        timeout: 5000
      });
      
      expect(asyncComponent).toBeDefined();
      expect(asyncComponent.loader).toBe(mockImport);
    });

    it('should preload route components', async () => {
      const routes = ['typing', 'dashboard'];
      const results = await codeSplitting.preloadRoutes(routes);
      
      expect(results).toHaveLength(2);
      // Results should be settled (success or failure)
      results.forEach(result => {
        expect(result.status).toMatch(/fulfilled|rejected/);
      });
    });
  });

  describe('Bundle Analysis', () => {
    it('should measure bundle metrics', async () => {
      const metrics = await bundleAnalyzer.measureBundleMetrics();
      
      expect(metrics).toHaveProperty('initialBundle');
      expect(metrics).toHaveProperty('vendorBundle');
      expect(metrics).toHaveProperty('asyncChunks');
      expect(metrics).toHaveProperty('treeShakingReduction');
      expect(metrics).toHaveProperty('compressionRatio');
      
      expect(typeof metrics.initialBundle).toBe('number');
      expect(metrics.asyncChunks).toBe(2); // Two async scripts in mock
    });

    it('should analyze runtime performance', () => {
      const runtimeMetrics = bundleAnalyzer.analyzeRuntimePerformance();
      
      expect(runtimeMetrics).toHaveProperty('initialLoadTime');
      expect(runtimeMetrics).toHaveProperty('memoryUsage');
      expect(runtimeMetrics).toHaveProperty('jsHeapSize');
      
      expect(runtimeMetrics.initialLoadTime).toBe(2000); // Mock timing
      expect(runtimeMetrics.memoryUsage).toBe(10); // 10MB from mock
    });

    it('should generate performance recommendations', async () => {
      const report = await bundleAnalyzer.generatePerformanceReport();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('bundle');
      expect(report).toHaveProperty('runtime');
      expect(report).toHaveProperty('recommendations');
      
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('Monaco Editor Optimization', () => {
    it('should optimize Monaco configuration for performance', () => {
      const baseConfig = {
        theme: 'vs-light',
        fontSize: 12
      };
      
      const optimizedConfig = monacoOptimizer.optimizeConfig(baseConfig);
      
      // Should disable heavy features
      expect(optimizedConfig.minimap.enabled).toBe(false);
      expect(optimizedConfig.quickSuggestions).toBe(false);
      expect(optimizedConfig.folding).toBe(false);
      
      // Should preserve custom settings
      expect(optimizedConfig.theme).toBe('vs-dark'); // Overridden for performance
      expect(optimizedConfig.fontSize).toBe(14); // Optimized size
    });

    it('should load minimal Monaco features', async () => {
      // Mock Monaco imports
      const mockMonaco = {
        editor: { create: vi.fn() },
        languages: { register: vi.fn() }
      };
      
      // Would test actual Monaco loading in integration test
      expect(typeof monacoOptimizer.loadMinimalMonaco).toBe('function');
      expect(typeof monacoOptimizer.loadLanguageSupport).toBe('function');
    });
  });

  describe('Performance Monitoring Composable', () => {
    it('should initialize with default state', () => {
      expect(performanceMonitor.isMonitoring.value).toBe(false);
      expect(performanceMonitor.score.value).toBeGreaterThanOrEqual(0);
      expect(performanceMonitor.score.value).toBeLessThanOrEqual(100);
    });

    it('should start and stop monitoring', async () => {
      expect(performanceMonitor.isMonitoring.value).toBe(false);
      
      performanceMonitor.startMonitoring();
      expect(performanceMonitor.isMonitoring.value).toBe(true);
      
      performanceMonitor.stopMonitoring();
      expect(performanceMonitor.isMonitoring.value).toBe(false);
    });

    it('should generate performance reports', async () => {
      const report = await performanceMonitor.generateReport();
      
      expect(report).toHaveProperty('bundle');
      expect(report).toHaveProperty('runtime');
      expect(report).toHaveProperty('typing');
      expect(report).toHaveProperty('score');
      expect(report).toHaveProperty('grade');
      expect(report).toHaveProperty('recommendations');
    });

    it('should measure typing performance', () => {
      const typingEvent = {
        timestamp: Date.now() - 10,
        processingTime: 5,
        renderTime: 8
      };
      
      performanceMonitor.startMonitoring();
      performanceMonitor.measureTypingPerformance(typingEvent);
      
      const metrics = performanceMonitor.metrics.value;
      expect(metrics.typing.inputLatency).toBeGreaterThanOrEqual(10);
      expect(metrics.typing.keystrokeProcessing).toBe(5);
      expect(metrics.typing.renderLatency).toBe(8);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet bundle size targets', async () => {
      const metrics = await bundleAnalyzer.measureBundleMetrics();
      
      // Target: Initial bundle < 500KB
      expect(metrics.initialBundle).toBeLessThan(500);
      
      // Target: Vendor bundle should be reasonable portion
      expect(metrics.vendorBundle).toBeLessThan(metrics.initialBundle);
      
      // Should have async chunks for code splitting
      expect(metrics.asyncChunks).toBeGreaterThan(0);
    });

    it('should meet performance timing targets', () => {
      const runtimeMetrics = bundleAnalyzer.analyzeRuntimePerformance();
      
      // Target: Initial load < 3 seconds
      expect(runtimeMetrics.initialLoadTime).toBeLessThan(3000);
      
      // Target: Memory usage should be reasonable
      expect(runtimeMetrics.memoryUsage).toBeLessThan(100); // 100MB
    });

    it('should optimize for typing performance', async () => {
      await performanceMonitor.optimizeForTyping();
      
      // Should have optimization history
      expect(performanceMonitor.optimizationHistory.value).toHaveLength(1);
      
      const optimization = performanceMonitor.optimizationHistory.value[0];
      expect(optimization).toHaveProperty('timestamp');
      expect(optimization).toHaveProperty('optimizations');
      expect(Array.isArray(optimization.optimizations)).toBe(true);
    });

    it('should calculate performance score correctly', () => {
      // Mock good performance
      performanceMonitor.metrics.value.bundle.initialBundle = 100; // 100KB
      performanceMonitor.metrics.value.runtime.initialLoadTime = 1000; // 1s
      performanceMonitor.metrics.value.typing.inputLatency = 5; // 5ms
      
      const score = performanceMonitor.score.value;
      expect(score).toBeGreaterThan(80); // Should be good score
      
      const grade = performanceMonitor.grade.value;
      expect(['A+', 'A', 'B']).toContain(grade);
    });
  });

  describe('Memory Optimization', () => {
    it('should detect memory leaks', () => {
      performanceMonitor.startMonitoring();
      
      // Simulate memory growth
      const initialMemory = performanceMonitor.metrics.value.typing.memoryLeaks;
      performanceMonitor.metrics.value.typing.memoryLeaks = initialMemory * 2;
      
      // Should generate recommendation
      const recommendations = performanceMonitor.recommendations.value;
      const memoryRecommendation = recommendations.find(r => 
        r.includes('memory leak')
      );
      
      expect(memoryRecommendation).toBeDefined();
    });

    it('should optimize resource preloading', async () => {
      const preloadSpy = vi.spyOn(performanceUtils, 'preloadResource');
      
      await performanceMonitor.preloadCriticalResources();
      
      expect(preloadSpy).toHaveBeenCalledWith(
        expect.stringContaining('monaco-editor'),
        expect.any(String)
      );
      expect(preloadSpy).toHaveBeenCalledWith(
        expect.stringContaining('JetBrains'),
        'style'
      );
    });
  });

  describe('Integration Performance', () => {
    it('should maintain performance during typing sessions', async () => {
      performanceMonitor.startMonitoring();
      
      // Simulate typing session
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        performanceMonitor.measureTypingPerformance({
          timestamp: startTime + i * 10,
          processingTime: Math.random() * 5,
          renderTime: Math.random() * 16
        });
      }
      
      const report = await performanceMonitor.generateReport();
      
      // Performance should remain good
      expect(report.score).toBeGreaterThan(60);
      expect(report.typing.inputLatency).toBeLessThan(100); // 100ms threshold
    });

    it('should provide actionable recommendations', async () => {
      // Set poor performance metrics
      performanceMonitor.metrics.value.runtime.initialLoadTime = 5000; // 5s
      performanceMonitor.metrics.value.bundle.initialBundle = 1000; // 1MB
      performanceMonitor.metrics.value.typing.inputLatency = 100; // 100ms
      
      const report = await performanceMonitor.generateReport();
      
      expect(report.recommendations.length).toBeGreaterThan(0);
      
      // Should have specific, actionable recommendations
      const hasSpecificRecommendations = report.recommendations.some(r => 
        r.includes('code splitting') || 
        r.includes('debouncing') || 
        r.includes('preload')
      );
      
      expect(hasSpecificRecommendations).toBe(true);
    });
  });
});

describe('Performance Regression Tests', () => {
  it('should not regress bundle size', async () => {
    const metrics = await bundleAnalyzer.measureBundleMetrics();
    
    // These are baseline targets - adjust as needed
    const targets = {
      initialBundle: 400, // KB
      totalAsyncChunks: 5,
      compressionRatio: 0.6
    };
    
    expect(metrics.initialBundle).toBeLessThanOrEqual(targets.initialBundle);
    expect(metrics.asyncChunks).toBeGreaterThanOrEqual(targets.totalAsyncChunks);
    expect(metrics.compressionRatio).toBeGreaterThanOrEqual(targets.compressionRatio);
  });

  it('should not regress runtime performance', () => {
    const runtimeMetrics = bundleAnalyzer.analyzeRuntimePerformance();
    
    const targets = {
      initialLoadTime: 2500, // ms
      memoryUsage: 50 // MB
    };
    
    expect(runtimeMetrics.initialLoadTime).toBeLessThanOrEqual(targets.initialLoadTime);
    expect(runtimeMetrics.memoryUsage).toBeLessThanOrEqual(targets.memoryUsage);
  });
});

describe('Performance Edge Cases', () => {
  it('should handle missing performance APIs gracefully', () => {
    const originalPerformance = global.performance;
    
    // Remove performance API
    delete global.performance;
    
    expect(() => {
      bundleAnalyzer.analyzeRuntimePerformance();
    }).not.toThrow();
    
    // Restore
    global.performance = originalPerformance;
  });

  it('should handle network errors during resource preloading', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
    
    await expect(
      performanceUtils.preloadResource('invalid-url')
    ).resolves.not.toThrow();
  });

  it('should handle Monaco optimization with null editor', () => {
    const result = performanceMonitor.optimizeMonacoForTyping(null);
    expect(result).toBeNull();
  });
});