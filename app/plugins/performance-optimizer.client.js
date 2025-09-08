/**
 * @fileoverview Client-side performance optimization plugin
 * Automatically optimizes the application for performance on the client side
 */

import { usePerformanceOptimization } from '../composables/usePerformanceOptimization.js';

export default defineNuxtPlugin(async (nuxtApp) => {
  // Only run on client side
  if (process.server) return;
  
  // Initialize performance optimization
  const performanceOptimizer = usePerformanceOptimization({
    autoStart: true,
    preloadResources: true,
    enableTreeShaking: true,
    enableLazyLoading: true,
    chunkSizeLimit: 300 // KB
  });
  
  // Provide globally
  nuxtApp.provide('performanceOptimizer', performanceOptimizer);
  
  // Auto-optimize on app ready
  nuxtApp.hook('app:mounted', async () => {
    try {
      console.log('🚀 Initializing performance optimizations...');
      
      // Apply typing-specific optimizations
      await performanceOptimizer.optimizeForTyping();
      
      // Preload critical resources
      await performanceOptimizer.preloadCriticalResources();
      
      // Start performance monitoring
      if (!performanceOptimizer.isMonitoring.value) {
        performanceOptimizer.startMonitoring();
      }
      
      console.log('✅ Performance optimizations complete');
      
    } catch (error) {
      console.warn('⚠️ Performance optimization failed:', error);
    }
  });
  
  // Monitor route changes for performance
  nuxtApp.hook('page:start', () => {
    const startTime = performance.now();
    
    nuxtApp.hook('page:finish', () => {
      const routeTransitionTime = performance.now() - startTime;
      
      performanceOptimizer.measureTypingPerformance({
        timestamp: startTime,
        processingTime: routeTransitionTime,
        renderTime: 0
      });
      
      if (routeTransitionTime > 100) {
        console.warn(`Slow route transition: ${routeTransitionTime.toFixed(2)}ms`);
      }
    });
  });
  
  // Cleanup on app unmount
  nuxtApp.hook('app:beforeUnmount', () => {
    if (performanceOptimizer.isMonitoring.value) {
      performanceOptimizer.stopMonitoring();
    }
  });
  
  // Global error handling for performance issues
  window.addEventListener('error', (event) => {
    console.error('Performance-related error:', event.error);
    
    // Track performance-impacting errors
    if (event.error?.stack?.includes('monaco') || 
        event.error?.stack?.includes('typing')) {
      performanceOptimizer.measureTypingPerformance({
        timestamp: Date.now(),
        processingTime: 0,
        renderTime: 0,
        error: event.error.message
      });
    }
  });
});