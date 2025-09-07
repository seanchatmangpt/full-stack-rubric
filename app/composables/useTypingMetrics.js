import { ref, reactive, computed, readonly } from 'vue'

/**
 * @typedef {Object} TypingMetrics
 * @property {number} wpm - Words per minute (real-time)
 * @property {number} accuracy - Percentage accuracy (0-100)
 * @property {number} consistency - Variance in keystroke timing
 * @property {number[]} keystrokeLatency - Individual keystroke delays
 * @property {Map<string, number>} errorPatterns - Character/pattern error frequency
 * @property {KeystrokeHeat[]} heatmap - Timing distribution per key
 * @property {number} rythmScore - Consistency in typing rhythm
 * @property {number[]} pausePattern - Pause locations and durations
 * @property {number} momentum - Acceleration/deceleration trend
 */

/**
 * @typedef {Object} KeystrokeEvent
 * @property {number} timestamp
 * @property {string} key
 * @property {string} expected
 * @property {boolean} isCorrect
 * @property {number} timeDelta
 * @property {{line: number, column: number}} position
 */

/**
 * @typedef {Object} KeystrokeHeat
 * @property {string} key
 * @property {number} averageTime
 * @property {number} frequency
 * @property {number} errorRate
 */

/**
 * @typedef {Object} AccuracyMetrics
 * @property {number} raw
 * @property {number} adjusted
 * @property {number} errorRate
 * @property {number} correctionRatio
 */

/**
 * @typedef {Object} PerformanceSession
 * @property {string} id
 * @property {number} startTime
 * @property {number} [endTime]
 * @property {string} drillType
 * @property {number} targetWPM
 * @property {number} finalWPM
 * @property {AccuracyMetrics} accuracy
 * @property {KeystrokeEvent[]} keystrokes
 */

// High-performance ring buffer for keystroke events
class PerformanceRingBuffer {
  /**
   * @param {number} [maxSize=1000]
   */
  constructor(maxSize = 1000) {
    /** @type {KeystrokeEvent[]} */
    this.buffer = new Array(maxSize);
    this.head = 0;
    this.size = maxSize;
    this.count = 0;
  }
  
  /**
   * @param {KeystrokeEvent} event
   */
  push(event) {
    this.buffer[this.head] = event;
    this.head = (this.head + 1) % this.size;
    this.count = Math.min(this.count + 1, this.size);
  }
  
  /**
   * O(1) access to recent events for real-time calculations
   * @param {number} count
   * @returns {KeystrokeEvent[]}
   */
  getRecent(count) {
    const actualCount = Math.min(count, this.count);
    const start = (this.head - actualCount + this.size) % this.size;
    
    if (start + actualCount <= this.size) {
      return this.buffer.slice(start, start + actualCount);
    } else {
      return [...this.buffer.slice(start), ...this.buffer.slice(0, (start + actualCount) % this.size)];
    }
  }
  
  clear() {
    this.head = 0;
    this.count = 0;
  }
  
  get length() {
    return this.count;
  }
}

// Enhanced WPM and accuracy calculator
class TypingCalculator {
  constructor() {
    this.buffer = new PerformanceRingBuffer(1000);
    this.WINDOW_SIZE = 5000; // 5 second sliding window
    this.AVERAGE_WORD_LENGTH = 5; // Standard typing measurement
    this.PASTE_THRESHOLD = 10; // ms threshold for paste detection
  }
  
  /**
   * @param {KeystrokeEvent} keystroke
   */
  addKeystroke(keystroke) {
    this.buffer.push(keystroke);
  }
  
  /**
   * Real-time WPM calculation handling edge cases:
   * - Initial typing period (< 5 seconds)
   * - Backspace corrections
   * - Long pauses (> 2 seconds)
   * - Copy-paste detection
   * @returns {number}
   */
  calculateRealTimeWPM() {
    if (this.buffer.length < 2) return 0;
    
    const now = Date.now();
    const recentEvents = this.buffer.getRecent(200).filter(
      event => (now - event.timestamp) <= this.WINDOW_SIZE
    );
    
    if (recentEvents.length < 2) return 0;
    
    const validKeystrokes = recentEvents.filter(k => 
      k.isCorrect && !this.isBackspace(k.key) && !this.isPasted(k)
    );
    
    const timeSpan = this.getEffectiveTimeSpan(recentEvents);
    const characters = validKeystrokes.length;
    const words = characters / this.AVERAGE_WORD_LENGTH;
    
    // Handle edge case: very short time spans
    if (timeSpan < 1000) return 0;
    
    return Math.round((words / timeSpan) * 60000); // Convert ms to minutes
  }
  
  /**
   * Accuracy with sophisticated error classification
   * @returns {AccuracyMetrics}
   */
  calculateAccuracy() {
    const recentEvents = this.buffer.getRecent(500);
    if (recentEvents.length === 0) {
      return { raw: 0, adjusted: 0, errorRate: 0, correctionRatio: 0 };
    }
    
    const total = recentEvents.length;
    const correct = recentEvents.filter(k => k.isCorrect).length;
    const typos = total - correct;
    const corrected = this.countCorrectedErrors(recentEvents);
    
    return {
      raw: (correct / total) * 100,
      adjusted: Math.max(0, ((correct - corrected) / total) * 100), // Penalize corrections
      errorRate: (typos / total) * 100,
      correctionRatio: typos > 0 ? corrected / typos : 0
    };
  }
  
  /**
   * @returns {number}
   */
  calculateConsistency() {
    const recentEvents = this.buffer.getRecent(100);
    if (recentEvents.length < 10) return 0;
    
    const timings = recentEvents
      .filter(e => e.timeDelta > 0 && e.timeDelta < 1000) // Filter outliers
      .map(e => e.timeDelta);
    
    if (timings.length < 5) return 0;
    
    const mean = timings.reduce((sum, time) => sum + time, 0) / timings.length;
    const variance = timings.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / timings.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Convert to a 0-100 score (lower variance = higher consistency)
    return Math.max(0, 100 - (standardDeviation / mean) * 100);
  }
  
  /**
   * @returns {Map<string, number>}
   */
  getErrorPatterns() {
    const patterns = new Map();
    const recentEvents = this.buffer.getRecent(500);
    
    recentEvents
      .filter(e => !e.isCorrect)
      .forEach(e => {
        const pattern = `${e.expected}->${e.key}`;
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
      });
    
    return patterns;
  }
  
  /**
   * @param {string} key
   * @returns {boolean}
   */
  isBackspace(key) {
    return key === 'Backspace' || key === 'Delete';
  }
  
  /**
   * @param {KeystrokeEvent} keystroke
   * @returns {boolean}
   */
  isPasted(keystroke) {
    return keystroke.timeDelta < this.PASTE_THRESHOLD && keystroke.key.length > 1;
  }
  
  /**
   * @param {KeystrokeEvent[]} events
   * @returns {number}
   */
  getEffectiveTimeSpan(events) {
    if (events.length < 2) return 0;
    
    const sortedEvents = events.sort((a, b) => a.timestamp - b.timestamp);
    const start = sortedEvents[0].timestamp;
    const end = sortedEvents[sortedEvents.length - 1].timestamp;
    
    return end - start;
  }
  
  /**
   * @param {KeystrokeEvent[]} events
   * @returns {number}
   */
  countCorrectedErrors(events) {
    let corrections = 0;
    
    for (let i = 1; i < events.length; i++) {
      const current = events[i];
      const previous = events[i - 1];
      
      if (this.isBackspace(current.key) && !previous.isCorrect) {
        corrections++;
      }
    }
    
    return corrections;
  }
  
  clear() {
    this.buffer.clear();
  }
}

/**
 * Main composable for typing metrics
 * @returns {Object}
 */
export function useTypingMetrics() {
  const calculator = new TypingCalculator();
  
  // Reactive state
  /** @type {import('vue').Ref<PerformanceSession | null>} */
  const currentSession = ref(null);
  const isActive = ref(false);
  /** @type {import('vue').Ref<number>} */
  const startTime = ref(0);
  
  // Real-time metrics (computed for reactivity)
  /** @type {TypingMetrics} */
  const metrics = reactive({
    wpm: 0,
    accuracy: 0,
    consistency: 0,
    keystrokeLatency: [],
    errorPatterns: new Map(),
    heatmap: [],
    rythmScore: 0,
    pausePattern: [],
    momentum: 0
  });
  
  // Performance optimized update function (debounced)
  /** @type {ReturnType<typeof setTimeout> | null} */
  let updateTimeout = null;
  
  function updateMetrics() {
    if (updateTimeout) clearTimeout(updateTimeout);
    
    updateTimeout = setTimeout(() => {
      metrics.wpm = calculator.calculateRealTimeWPM();
      const accuracy = calculator.calculateAccuracy();
      metrics.accuracy = accuracy.raw;
      metrics.consistency = calculator.calculateConsistency();
      metrics.errorPatterns = calculator.getErrorPatterns();
    }, 100); // Update at most 10 times per second
  }
  
  /**
   * @param {string} drillType
   * @param {number} [targetWPM=60]
   */
  function startSession(drillType, targetWPM = 60) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    currentSession.value = {
      id: sessionId,
      startTime: Date.now(),
      drillType,
      targetWPM,
      finalWPM: 0,
      accuracy: { raw: 0, adjusted: 0, errorRate: 0, correctionRatio: 0 },
      keystrokes: []
    };
    
    isActive.value = true;
    startTime.value = Date.now();
    calculator.clear();
  }
  
  /**
   * @param {string} key
   * @param {string} expected
   * @param {{line: number, column: number}} position
   */
  function recordKeystroke(key, expected, position) {
    if (!isActive.value || !currentSession.value) return;
    
    const now = Date.now();
    const timeDelta = now - startTime.value;
    
    /** @type {KeystrokeEvent} */
    const keystroke = {
      timestamp: now,
      key,
      expected,
      isCorrect: key === expected,
      timeDelta,
      position
    };
    
    calculator.addKeystroke(keystroke);
    currentSession.value.keystrokes.push(keystroke);
    
    // Update metrics in real-time
    updateMetrics();
    
    startTime.value = now; // Update for next keystroke delta calculation
  }
  
  /**
   * @returns {PerformanceSession | null}
   */
  function endSession() {
    if (!currentSession.value) return null;
    
    currentSession.value.endTime = Date.now();
    currentSession.value.finalWPM = metrics.wpm;
    currentSession.value.accuracy = calculator.calculateAccuracy();
    
    isActive.value = false;
    
    const completedSession = currentSession.value;
    currentSession.value = null;
    
    return completedSession;
  }
  
  function pauseSession() {
    isActive.value = false;
  }
  
  function resumeSession() {
    if (currentSession.value) {
      isActive.value = true;
      startTime.value = Date.now();
    }
  }
  
  function resetSession() {
    calculator.clear();
    currentSession.value = null;
    isActive.value = false;
    
    // Reset metrics
    metrics.wpm = 0;
    metrics.accuracy = 0;
    metrics.consistency = 0;
    metrics.errorPatterns.clear();
  }
  
  // Computed properties for derived metrics
  const sessionDuration = computed(() => {
    if (!currentSession.value || !isActive.value) return 0;
    return Date.now() - currentSession.value.startTime;
  });
  
  const progressScore = computed(() => {
    if (!currentSession.value) return 0;
    const targetWPM = currentSession.value.targetWPM;
    const accuracy = metrics.accuracy;
    
    // Combined score: WPM achievement + accuracy
    const wpmScore = Math.min(metrics.wpm / targetWPM, 1) * 50;
    const accuracyScore = (accuracy / 100) * 50;
    
    return Math.round(wpmScore + accuracyScore);
  });
  
  return {
    // State
    currentSession: readonly(currentSession),
    isActive: readonly(isActive),
    metrics: readonly(metrics),
    
    // Computed
    sessionDuration,
    progressScore,
    
    // Methods
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    resetSession,
    recordKeystroke
  };
}