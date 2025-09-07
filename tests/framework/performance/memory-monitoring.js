/**
 * Memory Leak Detection Utilities for Micro-Framework
 * Provides tools for monitoring memory usage and detecting leaks in components
 */

/**
 * Memory monitoring and leak detection utilities
 */
export class MemoryMonitor {
  constructor() {
    this.snapshots = [];
    this.observers = new Set();
    this.thresholds = {
      maxHeapIncrease: 10 * 1024 * 1024, // 10MB
      maxRetainedObjects: 1000,
      gcPressureThreshold: 0.8 // 80% heap usage
    };
    this.isMonitoring = false;
  }

  /**
   * Take a memory snapshot
   * @param {string} label - Label for the snapshot
   * @returns {Object} Memory snapshot data
   */
  takeSnapshot(label = `snapshot-${Date.now()}`) {
    const memInfo = this._getMemoryInfo();
    const snapshot = {
      label,
      timestamp: Date.now(),
      ...memInfo
    };
    
    this.snapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Start continuous memory monitoring
   * @param {Object} options - Monitoring options
   */
  startMonitoring(options = {}) {
    if (this.isMonitoring) return;
    
    const { interval = 1000, alertThreshold = this.thresholds.maxHeapIncrease } = options;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      const snapshot = this.takeSnapshot(`monitoring-${Date.now()}`);
      this._checkMemoryHealth(snapshot, alertThreshold);
    }, interval);
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Detect memory leaks between two points in time
   * @param {string} beforeLabel - Label of the 'before' snapshot
   * @param {string} afterLabel - Label of the 'after' snapshot
   * @returns {Object} Leak detection results
   */
  detectLeaks(beforeLabel, afterLabel) {
    const beforeSnapshot = this.snapshots.find(s => s.label === beforeLabel);
    const afterSnapshot = this.snapshots.find(s => s.label === afterLabel);
    
    if (!beforeSnapshot || !afterSnapshot) {
      throw new Error('Snapshots not found for leak detection');
    }

    const heapIncrease = afterSnapshot.usedJSHeapSize - beforeSnapshot.usedJSHeapSize;
    const isLeak = heapIncrease > this.thresholds.maxHeapIncrease;
    
    return {
      isLeak,
      heapIncrease,
      heapIncreaseFormatted: this._formatBytes(heapIncrease),
      threshold: this.thresholds.maxHeapIncrease,
      thresholdFormatted: this._formatBytes(this.thresholds.maxHeapIncrease),
      before: beforeSnapshot,
      after: afterSnapshot,
      duration: afterSnapshot.timestamp - beforeSnapshot.timestamp
    };
  }

  /**
   * Monitor component lifecycle for memory leaks
   * @param {Function} mountFn - Function to mount component
   * @param {Function} unmountFn - Function to unmount component
   * @param {Object} options - Monitoring options
   * @returns {Promise<Object>} Leak detection results
   */
  async monitorComponentLifecycle(mountFn, unmountFn, options = {}) {
    const { iterations = 10, gcBetween = true } = options;
    
    // Take baseline snapshot
    if (gcBetween && global.gc) global.gc();
    const baseline = this.takeSnapshot('baseline');
    
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      // Mount component
      const beforeMount = this.takeSnapshot(`before-mount-${i}`);
      await mountFn();
      const afterMount = this.takeSnapshot(`after-mount-${i}`);
      
      // Unmount component
      await unmountFn();
      const afterUnmount = this.takeSnapshot(`after-unmount-${i}`);
      
      // Force GC if available
      if (gcBetween && global.gc) {
        global.gc();
        await this._waitForTick();
      }
      
      const postGC = this.takeSnapshot(`post-gc-${i}`);
      
      results.push({
        iteration: i,
        mountLeak: this.detectLeaks(`before-mount-${i}`, `after-mount-${i}`),
        unmountLeak: this.detectLeaks(`after-mount-${i}`, `post-gc-${i}`)
      });
    }
    
    // Final leak check against baseline
    const final = this.takeSnapshot('final');
    const overallLeak = this.detectLeaks('baseline', 'final');
    
    return {
      iterations: results,
      overallLeak,
      summary: this._summarizeResults(results, overallLeak)
    };
  }

  /**
   * Monitor DOM node leaks
   * @param {Function} createNodesFn - Function that creates DOM nodes
   * @param {Function} cleanupFn - Function that should clean up nodes
   * @returns {Promise<Object>} DOM leak detection results
   */
  async monitorDOMLeaks(createNodesFn, cleanupFn) {
    const beforeNodes = document.querySelectorAll('*').length;
    
    // Create nodes
    await createNodesFn();
    const afterCreate = document.querySelectorAll('*').length;
    
    // Cleanup
    await cleanupFn();
    const afterCleanup = document.querySelectorAll('*').length;
    
    const nodesCreated = afterCreate - beforeNodes;
    const nodesRemaining = afterCleanup - beforeNodes;
    const isLeak = nodesRemaining > 0;
    
    return {
      isLeak,
      nodesCreated,
      nodesRemaining,
      cleanupEfficiency: ((nodesCreated - nodesRemaining) / nodesCreated) * 100,
      beforeNodes,
      afterCreate,
      afterCleanup
    };
  }

  /**
   * Monitor event listener leaks
   * @param {Element} element - Element to monitor
   * @param {Function} addListenersFn - Function that adds event listeners
   * @param {Function} removeListenersFn - Function that should remove listeners
   * @returns {Object} Event listener leak detection
   */
  monitorEventListeners(element, addListenersFn, removeListenersFn) {
    const getListenerCount = (el) => {
      return Object.keys(el).filter(key => key.startsWith('__reactEventHandlers')).length +
             (el._listeners ? Object.keys(el._listeners).length : 0);
    };
    
    const before = getListenerCount(element);
    
    // Add listeners
    addListenersFn(element);
    const afterAdd = getListenerCount(element);
    
    // Remove listeners
    removeListenersFn(element);
    const afterRemove = getListenerCount(element);
    
    const listenersAdded = afterAdd - before;
    const listenersRemaining = afterRemove - before;
    const isLeak = listenersRemaining > 0;
    
    return {
      isLeak,
      listenersAdded,
      listenersRemaining,
      cleanupEfficiency: listenersAdded > 0 ? 
        ((listenersAdded - listenersRemaining) / listenersAdded) * 100 : 100
    };
  }

  /**
   * Force garbage collection (if available)
   * @returns {Promise<boolean>} Whether GC was triggered
   */
  async forceGC() {
    if (global.gc) {
      global.gc();
      await this._waitForTick();
      return true;
    }
    return false;
  }

  /**
   * Check if memory usage is healthy
   * @param {Object} snapshot - Memory snapshot
   * @param {number} threshold - Alert threshold
   * @private
   */
  _checkMemoryHealth(snapshot, threshold) {
    if (this.snapshots.length > 1) {
      const previous = this.snapshots[this.snapshots.length - 2];
      const increase = snapshot.usedJSHeapSize - previous.usedJSHeapSize;
      
      if (increase > threshold) {
        console.warn(`🚨 Memory Alert: Heap increased by ${this._formatBytes(increase)} since last snapshot`);
        
        // Notify observers
        this.observers.forEach(observer => {
          observer.onMemoryAlert({
            type: 'heap-increase',
            increase,
            snapshot,
            previous
          });
        });
      }
    }
    
    // Check GC pressure
    const gcPressure = snapshot.usedJSHeapSize / snapshot.totalJSHeapSize;
    if (gcPressure > this.thresholds.gcPressureThreshold) {
      console.warn(`🚨 GC Pressure: ${(gcPressure * 100).toFixed(1)}% heap usage`);
    }
  }

  /**
   * Get memory information
   * @private
   */
  _getMemoryInfo() {
    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }
    
    // Fallback for environments without performance.memory
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0
    };
  }

  /**
   * Format bytes to human readable string
   * @private
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Wait for next tick
   * @private
   */
  _waitForTick() {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  /**
   * Summarize leak detection results
   * @private
   */
  _summarizeResults(results, overallLeak) {
    const mountLeaks = results.filter(r => r.mountLeak.isLeak).length;
    const unmountLeaks = results.filter(r => r.unmountLeak.isLeak).length;
    
    return {
      totalIterations: results.length,
      mountLeaks,
      unmountLeaks,
      overallLeak: overallLeak.isLeak,
      overallHeapIncrease: overallLeak.heapIncreaseFormatted,
      recommendation: this._getRecommendation(mountLeaks, unmountLeaks, overallLeak.isLeak)
    };
  }

  /**
   * Get recommendations based on leak detection
   * @private
   */
  _getRecommendation(mountLeaks, unmountLeaks, overallLeak) {
    if (overallLeak) {
      return 'CRITICAL: Overall memory leak detected. Review component cleanup logic.';
    }
    
    if (unmountLeaks > mountLeaks) {
      return 'WARNING: Unmount leaks detected. Check event listener and timer cleanup.';
    }
    
    if (mountLeaks > 0) {
      return 'INFO: Some mount operations show memory increases. Monitor over time.';
    }
    
    return 'GOOD: No significant memory leaks detected.';
  }

  /**
   * Add memory observer
   * @param {Object} observer - Observer with onMemoryAlert method
   */
  addObserver(observer) {
    this.observers.add(observer);
  }

  /**
   * Remove memory observer
   * @param {Object} observer - Observer to remove
   */
  removeObserver(observer) {
    this.observers.delete(observer);
  }

  /**
   * Clear all snapshots
   */
  clearSnapshots() {
    this.snapshots = [];
  }

  /**
   * Export memory data
   * @returns {Object} All memory monitoring data
   */
  export() {
    return {
      snapshots: this.snapshots,
      thresholds: this.thresholds,
      isMonitoring: this.isMonitoring
    };
  }

  /**
   * Generate memory report
   * @returns {string} Formatted memory report
   */
  generateReport() {
    if (this.snapshots.length === 0) {
      return '📊 Memory Report: No snapshots available\n';
    }

    let report = '📊 Memory Monitoring Report\n';
    report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];
    const totalIncrease = last.usedJSHeapSize - first.usedJSHeapSize;
    
    report += `📈 Total Heap Increase: ${this._formatBytes(totalIncrease)}\n`;
    report += `⏱️  Duration: ${((last.timestamp - first.timestamp) / 1000).toFixed(2)}s\n`;
    report += `📊 Total Snapshots: ${this.snapshots.length}\n\n`;
    
    report += 'Recent Snapshots:\n';
    this.snapshots.slice(-5).forEach(snapshot => {
      report += `  ${snapshot.label}: ${this._formatBytes(snapshot.usedJSHeapSize)}\n`;
    });
    
    return report;
  }
}

/**
 * Global memory monitor instance
 */
export const memoryMonitor = new MemoryMonitor();

/**
 * Vitest integration for memory leak testing
 * @param {string} name - Test name
 * @param {Function} testFn - Test function
 * @param {Object} options - Test options
 */
export function createMemoryLeakTest(name, testFn, options = {}) {
  return {
    name: `Memory Leak: ${name}`,
    async run() {
      const before = memoryMonitor.takeSnapshot(`${name}-before`);
      
      try {
        await testFn();
      } finally {
        // Force GC if available
        await memoryMonitor.forceGC();
        
        const after = memoryMonitor.takeSnapshot(`${name}-after`);
        const result = memoryMonitor.detectLeaks(`${name}-before`, `${name}-after`);
        
        if (result.isLeak && !options.allowLeaks) {
          throw new Error(`Memory leak detected in ${name}: ${result.heapIncreaseFormatted} increase`);
        }
        
        return result;
      }
    }
  };
}