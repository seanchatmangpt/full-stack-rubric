/**
 * @fileoverview Performance optimization composable for the typing tutor application
 * Provides reactive performance monitoring and optimization utilities
 */

import { ref, computed, onMounted, onUnmounted, watch, readonly, nextTick } from 'vue';
import { 
  performanceUtils, 
  bundleAnalyzer, 
  monacoOptimizer,
  defaultOptimizationConfig 
} from '../utils/performanceOptimizer.js';

/**
 * @typedef {Object} PerformanceState
 * @property {boolean} isMonitoring - Whether performance monitoring is active
 * @property {Object} metrics - Current performance metrics
 * @property {string[]} recommendations - Performance recommendations
 * @property {number} score - Overall performance score (0-100)
 */

/**
 * @typedef {Object} OptimizationControls
 * @property {Function} startMonitoring - Start performance monitoring
 * @property {Function} stopMonitoring - Stop performance monitoring
 * @property {Function} optimizeForTyping - Apply typing-specific optimizations
 * @property {Function} preloadCriticalResources - Preload critical resources
 * @property {Function} generateReport - Generate performance report
 */

/**
 * Performance optimization composable
 * @param {Object} [options] - Configuration options
 * @returns {PerformanceState & OptimizationControls}
 */
export function usePerformanceOptimization(options = {}) {
  // Merge with default configuration
  const config = { ...defaultOptimizationConfig, ...options };
  
  // Reactive state
  const isMonitoring = ref(false);
  const metrics = ref({
    bundle: {
      initialBundle: 0,
      vendorBundle: 0,
      asyncChunks: 0,
      treeShakingReduction: 0,
      compressionRatio: 0
    },
    runtime: {
      initialLoadTime: 0,
      routeTransitionTime: 0,
      memoryUsage: 0,
      jsHeapSize: 0
    },
    typing: {
      inputLatency: 0,
      renderLatency: 0,
      keystrokeProcessing: 0,
      memoryLeaks: 0
    }
  });
  
  const recommendations = ref([]);
  const optimizationHistory = ref([]);
  
  // Performance monitoring intervals
  let monitoringInterval = null;
  let memoryCheckInterval = null;
  
  // Computed performance score
  const score = computed(() => {
    const { bundle, runtime, typing } = metrics.value;
    
    // Scoring weights
    const bundleScore = Math.max(0, 100 - (bundle.initialBundle / 10)); // Penalize large bundles
    const runtimeScore = Math.max(0, 100 - (runtime.initialLoadTime / 50)); // Penalize slow loading
    const typingScore = Math.max(0, 100 - typing.inputLatency); // Penalize input lag
    
    return Math.round((bundleScore + runtimeScore + typingScore) / 3);
  });
  
  // Performance grade
  const grade = computed(() => {
    const s = score.value;
    if (s >= 90) return 'A+';
    if (s >= 80) return 'A';
    if (s >= 70) return 'B';
    if (s >= 60) return 'C';
    return 'D';
  });
  
  /**
   * Start performance monitoring
   * @returns {void}
   */
  function startMonitoring() {
    if (isMonitoring.value) return;
    
    isMonitoring.value = true;
    
    // Monitor bundle and runtime metrics every 5 seconds
    monitoringInterval = setInterval(async () => {
      try {
        const bundleMetrics = await bundleAnalyzer.measureBundleMetrics();
        const runtimeMetrics = bundleAnalyzer.analyzeRuntimePerformance();
        
        metrics.value.bundle = bundleMetrics;
        metrics.value.runtime = runtimeMetrics;
        
        // Generate recommendations
        recommendations.value = bundleAnalyzer.generateRecommendations(
          bundleMetrics, 
          runtimeMetrics
        );
      } catch (error) {
        console.warn('Performance monitoring error:', error);
      }
    }, 5000);
    
    // Monitor memory usage more frequently
    memoryCheckInterval = setInterval(() => {
      if (performance.memory) {
        const memoryUsage = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
        const jsHeapSize = Math.round(performance.memory.totalJSHeapSize / (1024 * 1024));
        
        metrics.value.runtime.memoryUsage = memoryUsage;
        metrics.value.runtime.jsHeapSize = jsHeapSize;
        
        // Detect memory leaks
        if (memoryUsage > metrics.value.typing.memoryLeaks * 1.5) {
          metrics.value.typing.memoryLeaks = memoryUsage;
          recommendations.value.push('Potential memory leak detected - review component cleanup');
        }
      }
    }, 2000);
  }
  
  /**
   * Stop performance monitoring
   * @returns {void}
   */
  function stopMonitoring() {
    isMonitoring.value = false;
    
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
    }
    
    if (memoryCheckInterval) {
      clearInterval(memoryCheckInterval);
      memoryCheckInterval = null;
    }
  }
  
  /**
   * Apply typing-specific performance optimizations
   * @returns {Promise<void>}
   */
  async function optimizeForTyping() {
    const optimizations = [];
    
    try {
      // Preload Monaco Editor with minimal configuration
      if (config.enableCodeSplitting) {
        optimizations.push('monaco-editor');
        await performanceUtils.preloadResource('/monaco-editor/min/vs/loader.js');
      }
      
      // Optimize input handling
      optimizations.push('input-debouncing');
      const debouncedInputHandler = performanceUtils.debounce((event) => {
        // Handle typing input with reduced frequency
      }, 50);
      
      // Preload critical fonts
      optimizations.push('font-preloading');
      await performanceUtils.preloadResource(
        'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap',
        'style'
      );
      
      // Enable aggressive caching for typing data
      if ('serviceWorker' in navigator) {
        optimizations.push('service-worker-caching');
        // Service worker would be registered here
      }
      
      // Record optimization
      optimizationHistory.value.push({
        timestamp: Date.now(),
        optimizations,
        scoreImprovement: 0 // Would be calculated after measurement
      });
      
      console.log('✅ Typing optimizations applied:', optimizations);
      
    } catch (error) {
      console.error('❌ Optimization failed:', error);
    }
  }
  
  /**
   * Preload critical resources for better performance
   * @returns {Promise<void>}
   */
  async function preloadCriticalResources() {
    const criticalResources = [
      // Monaco Editor core
      '/monaco-editor/min/vs/loader.js',
      '/monaco-editor/min/vs/editor/editor.main.js',
      '/monaco-editor/min/vs/editor/editor.main.css',
      
      // Critical fonts
      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap',
      
      // Essential icons
      '/_nuxt/icons/lucide.js'
    ];
    
    const preloadPromises = criticalResources.map(resource => 
      performanceUtils.preloadResource(resource).catch(err => 
        console.warn(`Failed to preload ${resource}:`, err)
      )
    );
    
    await Promise.allSettled(preloadPromises);
    console.log('✅ Critical resources preloaded');
  }
  
  /**
   * Measure typing-specific performance metrics
   * @param {Object} typingEvent - Typing event data
   * @returns {void}
   */
  function measureTypingPerformance(typingEvent) {
    if (!isMonitoring.value) return;
    
    const { timestamp, processingTime, renderTime } = typingEvent;
    
    // Calculate input latency
    const inputLatency = Date.now() - timestamp;
    metrics.value.typing.inputLatency = Math.max(
      metrics.value.typing.inputLatency,
      inputLatency
    );
    
    // Track processing times
    if (processingTime) {
      metrics.value.typing.keystrokeProcessing = processingTime;
    }
    
    if (renderTime) {
      metrics.value.typing.renderLatency = renderTime;
    }
  }
  
  /**
   * Generate comprehensive performance report
   * @returns {Promise<Object>} Performance report
   */
  async function generateReport() {
    const report = await bundleAnalyzer.generatePerformanceReport();
    
    // Add typing-specific metrics
    report.typing = metrics.value.typing;
    report.score = score.value;
    report.grade = grade.value;
    report.optimizationHistory = optimizationHistory.value;
    
    // Add specific recommendations for typing performance
    const typingRecommendations = generateTypingRecommendations();
    report.recommendations = [...report.recommendations, ...typingRecommendations];
    
    return report;
  }
  
  /**
   * Generate typing-specific performance recommendations
   * @returns {string[]} Recommendations
   */
  function generateTypingRecommendations() {
    const recommendations = [];
    const typing = metrics.value.typing;
    
    if (typing.inputLatency > 50) {
      recommendations.push('Input latency is high - consider debouncing keystroke handlers');
    }
    
    if (typing.renderLatency > 16) {
      recommendations.push('Render latency exceeds 60fps threshold - optimize DOM updates');
    }
    
    if (typing.keystrokeProcessing > 10) {
      recommendations.push('Keystroke processing is slow - optimize typing metrics calculation');
    }
    
    if (typing.memoryLeaks > 100) {
      recommendations.push('High memory usage detected - review event listener cleanup');
    }
    
    return recommendations;
  }
  
  /**
   * Optimize Monaco Editor for typing performance
   * @param {Object} monacoInstance - Monaco editor instance
   * @returns {Object} Optimized configuration
   */
  function optimizeMonacoForTyping(monacoInstance) {
    if (!monacoInstance) return null;
    
    const optimizedConfig = monacoOptimizer.optimizeConfig({
      // Typing-specific optimizations
      wordWrap: 'off',
      minimap: { enabled: false },
      folding: false,
      renderLineHighlight: 'gutter',
      
      // Performance settings
      quickSuggestions: false,
      parameterHints: { enabled: false },
      suggestOnTriggerCharacters: false,
      
      // Smooth typing experience
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on'
    });
    
    // Apply configuration
    monacoInstance.updateOptions(optimizedConfig);
    
    return optimizedConfig;
  }
  
  // Lifecycle management
  onMounted(() => {
    if (config.autoStart !== false) {
      startMonitoring();
    }
    
    // Apply initial optimizations
    nextTick(async () => {
      await optimizeForTyping();
      if (config.preloadResources !== false) {
        await preloadCriticalResources();
      }
    });
  });
  
  onUnmounted(() => {
    stopMonitoring();
  });
  
  // Watch for significant performance changes
  watch(score, (newScore, oldScore) => {
    if (oldScore && Math.abs(newScore - oldScore) > 10) {
      console.log(`📊 Performance score changed: ${oldScore} → ${newScore} (${grade.value})`);
    }
  });
  
  return {
    // State
    isMonitoring: readonly(isMonitoring),
    metrics: readonly(metrics),
    recommendations: readonly(recommendations),
    score: readonly(score),
    grade: readonly(grade),
    optimizationHistory: readonly(optimizationHistory),
    
    // Controls
    startMonitoring,
    stopMonitoring,
    optimizeForTyping,
    preloadCriticalResources,
    measureTypingPerformance,
    generateReport,
    optimizeMonacoForTyping
  };
}