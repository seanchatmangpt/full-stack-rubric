// Performance optimization composable for the typing tutor application
// Provides reactive performance monitoring and optimization utilities

import { ref, computed, onMounted, onUnmounted, watch, readonly, nextTick } from 'vue';
import { 
  performanceUtils, 
  bundleAnalyzer, 
  monacoOptimizer,
  defaultOptimizationConfig,
  PerformanceMonitor
} from '../utils/performanceOptimizer.js';

// Performance optimization composable
export function usePerformanceOptimization(options = {}) {
  // Merge with default configuration
  const config = { ...defaultOptimizationConfig, autoStart: true, ...options };
  
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
  
  // Performance monitor instance
  const monitor = new PerformanceMonitor();
  
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
  
  // Start performance monitoring
  function startMonitoring() {
    if (isMonitoring.value) return;
    
    isMonitoring.value = true;
    monitor.startMonitoring();
    
    // Start periodic monitoring
    monitoringInterval = setInterval(async () => {
      await updateMetrics();
    }, 5000); // Update every 5 seconds
    
    // Monitor memory usage
    memoryCheckInterval = setInterval(() => {
      updateMemoryMetrics();
    }, 10000); // Check memory every 10 seconds
    
    // Initial metrics collection
    nextTick(() => updateMetrics());
  }

  // Stop performance monitoring
  function stopMonitoring() {
    if (!isMonitoring.value) return;
    
    isMonitoring.value = false;
    monitor.stopMonitoring();
    
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
    }
    
    if (memoryCheckInterval) {
      clearInterval(memoryCheckInterval);
      memoryCheckInterval = null;
    }
  }

  // Update performance metrics
  async function updateMetrics() {
    try {
      // Bundle metrics
      const bundleMetrics = await bundleAnalyzer.analyzeBundles();
      metrics.value.bundle = bundleMetrics;
      
      // Runtime metrics
      updateRuntimeMetrics();
      
      // Typing metrics
      updateTypingMetrics();
      
      // Generate recommendations
      const newRecommendations = bundleAnalyzer.getRecommendations(bundleMetrics);
      recommendations.value = newRecommendations;
      
    } catch (error) {
      console.warn('Failed to update performance metrics:', error);
    }
  }

  // Update runtime performance metrics
  function updateRuntimeMetrics() {
    if (typeof performance === 'undefined') return;
    
    try {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        metrics.value.runtime.initialLoadTime = Math.round(
          navigation.domContentLoadedEventEnd - navigation.navigationStart
        );
        
        metrics.value.runtime.routeTransitionTime = Math.round(
          navigation.loadEventEnd - navigation.fetchStart
        );
      }
      
    } catch (error) {
      console.warn('Failed to update runtime metrics:', error);
    }
  }

  // Update memory usage metrics
  function updateMemoryMetrics() {
    if (typeof performance === 'undefined' || !performance.memory) return;
    
    try {
      const memory = performance.memory;
      metrics.value.runtime.memoryUsage = Math.round(memory.usedJSHeapSize / (1024 * 1024)); // MB
      metrics.value.runtime.jsHeapSize = Math.round(memory.totalJSHeapSize / (1024 * 1024)); // MB
      
    } catch (error) {
      console.warn('Failed to update memory metrics:', error);
    }
  }

  // Update typing-specific performance metrics
  function updateTypingMetrics() {
    // Mock typing metrics for testing
    const measurements = monitor.getMeasurements();
    
    metrics.value.typing.inputLatency = measurements['typing-input'] || 0;
    metrics.value.typing.renderLatency = measurements['typing-render'] || 0;
    metrics.value.typing.keystrokeProcessing = measurements['keystroke-processing'] || 0;
    
    // Detect potential memory leaks
    if (metrics.value.runtime.memoryUsage > 50) { // 50MB threshold
      metrics.value.typing.memoryLeaks = 1;
    }
  }

  // Measure typing performance
  async function measureTypingPerformance(operation, fn) {
    if (!isMonitoring.value) return fn();
    
    monitor.startTimer(operation);
    try {
      const result = await fn();
      monitor.endTimer(operation);
      return result;
    } catch (error) {
      monitor.endTimer(operation);
      throw error;
    }
  }

  // Optimize application for typing performance
  async function optimizeForTyping() {
    try {
      // Preload critical resources
      await preloadCriticalResources();
      
      // Apply Monaco optimizations if available
      if (typeof window !== 'undefined' && window.monaco) {
        const optimizedConfig = monacoOptimizer.optimizeConfig();
        // Apply configuration (implementation would depend on your Monaco setup)
      }
      
      // Add to optimization history
      optimizationHistory.value.push({
        timestamp: Date.now(),
        type: 'typing-optimization',
        metrics: { ...metrics.value }
      });
      
    } catch (error) {
      console.warn('Typing optimization failed:', error);
    }
  }

  // Preload critical resources
  async function preloadCriticalResources() {
    const criticalResources = [
      '/fonts/monaco.woff2',
      '/api/typing-data',
      '/images/keyboard-layout.svg'
    ];

    const preloadPromises = criticalResources.map(resource =>
      performanceUtils.preloadResource(resource)
        .catch(error => console.warn(`Failed to preload ${resource}:`, error))
    );

    await Promise.allSettled(preloadPromises);
  }

  // Generate performance report
  function generateReport() {
    return {
      timestamp: Date.now(),
      score: score.value,
      grade: grade.value,
      metrics: { ...metrics.value },
      recommendations: [...recommendations.value],
      optimizationHistory: [...optimizationHistory.value]
    };
  }

  // Reset all metrics and history
  function reset() {
    metrics.value = {
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
    };
    
    recommendations.value = [];
    optimizationHistory.value = [];
    monitor.clearMeasurements();
  }

  // Auto-start monitoring if enabled
  onMounted(() => {
    if (config.autoStart) {
      startMonitoring();
    }
  });

  // Cleanup on unmount
  onUnmounted(() => {
    stopMonitoring();
  });

  // Watch for significant changes in metrics
  watch(score, (newScore, oldScore) => {
    if (Math.abs(newScore - oldScore) > 10) {
      console.info(`Performance score changed significantly: ${oldScore} → ${newScore}`);
    }
  });

  // Return reactive state and controls
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
    reset
  };
}
