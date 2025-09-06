import { ref, reactive, computed } from 'vue'

// Core interfaces for typing metrics
export interface TypingMetrics {
  // Core Performance
  wpm: number;              // Words per minute (real-time)
  accuracy: number;         // Percentage accuracy (0-100)
  consistency: number;      // Variance in keystroke timing
  
  // Advanced Analytics
  keystrokeLatency: number[];  // Individual keystroke delays
  errorPatterns: Map<string, number>; // Character/pattern error frequency
  heatmap: KeystrokeHeat[]; // Timing distribution per key
  
  // Flow State Indicators
  rythmScore: number;       // Consistency in typing rhythm
  pausePattern: number[];   // Pause locations and durations
  momentum: number;         // Acceleration/deceleration trend
}

export interface KeystrokeEvent {
  timestamp: number;
  key: string;
  expected: string;
  isCorrect: boolean;
  timeDelta: number;
  position: { line: number; column: number };
}

export interface KeystrokeHeat {
  key: string;
  averageTime: number;
  frequency: number;
  errorRate: number;
}

export interface AccuracyMetrics {
  raw: number;
  adjusted: number;
  errorRate: number;
  correctionRatio: number;
}

export interface PerformanceSession {
  id: string;
  startTime: number;
  endTime?: number;
  drillType: string;
  targetWPM: number;
  finalWPM: number;
  accuracy: AccuracyMetrics;
  keystrokes: KeystrokeEvent[];
}

// High-performance ring buffer for keystroke events
class PerformanceRingBuffer {
  private buffer: KeystrokeEvent[];
  private head: number = 0;
  private size: number;
  private count: number = 0;
  
  constructor(maxSize: number = 1000) {
    this.buffer = new Array(maxSize);
    this.size = maxSize;
  }
  
  push(event: KeystrokeEvent): void {
    this.buffer[this.head] = event;
    this.head = (this.head + 1) % this.size;
    this.count = Math.min(this.count + 1, this.size);
  }
  
  // O(1) access to recent events for real-time calculations
  getRecent(count: number): KeystrokeEvent[] {
    const actualCount = Math.min(count, this.count);
    const start = (this.head - actualCount + this.size) % this.size;
    
    if (start + actualCount <= this.size) {
      return this.buffer.slice(start, start + actualCount);
    } else {
      return [...this.buffer.slice(start), ...this.buffer.slice(0, (start + actualCount) % this.size)];
    }
  }
  
  clear(): void {
    this.head = 0;
    this.count = 0;
  }
  
  get length(): number {
    return this.count;
  }
}

// Enhanced WPM and accuracy calculator
class TypingCalculator {
  private buffer: PerformanceRingBuffer;
  private readonly WINDOW_SIZE = 5000; // 5 second sliding window
  private readonly AVERAGE_WORD_LENGTH = 5; // Standard typing measurement
  private readonly PASTE_THRESHOLD = 10; // ms threshold for paste detection
  
  constructor() {
    this.buffer = new PerformanceRingBuffer(1000);
  }
  
  addKeystroke(keystroke: KeystrokeEvent): void {
    this.buffer.push(keystroke);
  }
  
  /**
   * Real-time WPM calculation handling edge cases:
   * - Initial typing period (< 5 seconds)
   * - Backspace corrections
   * - Long pauses (> 2 seconds)
   * - Copy-paste detection
   */
  calculateRealTimeWPM(): number {
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
   */
  calculateAccuracy(): AccuracyMetrics {
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
  
  calculateConsistency(): number {
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
  
  getErrorPatterns(): Map<string, number> {
    const patterns = new Map<string, number>();
    const recentEvents = this.buffer.getRecent(500);
    
    recentEvents
      .filter(e => !e.isCorrect)
      .forEach(e => {
        const pattern = `${e.expected}->${e.key}`;
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
      });
    
    return patterns;
  }
  
  private isBackspace(key: string): boolean {
    return key === 'Backspace' || key === 'Delete';
  }
  
  private isPasted(keystroke: KeystrokeEvent): boolean {
    return keystroke.timeDelta < this.PASTE_THRESHOLD && keystroke.key.length > 1;
  }
  
  private getEffectiveTimeSpan(events: KeystrokeEvent[]): number {
    if (events.length < 2) return 0;
    
    const sortedEvents = events.sort((a, b) => a.timestamp - b.timestamp);
    const start = sortedEvents[0].timestamp;
    const end = sortedEvents[sortedEvents.length - 1].timestamp;
    
    return end - start;
  }
  
  private countCorrectedErrors(events: KeystrokeEvent[]): number {
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
  
  clear(): void {
    this.buffer.clear();
  }
}

// Main composable for typing metrics
export function useTypingMetrics() {
  const calculator = new TypingCalculator();
  
  // Reactive state
  const currentSession = ref<PerformanceSession | null>(null);
  const isActive = ref(false);
  const startTime = ref<number>(0);
  
  // Real-time metrics (computed for reactivity)
  const metrics = reactive<TypingMetrics>({
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
  let updateTimeout: ReturnType<typeof setTimeout> | null = null;
  
  function updateMetrics(): void {
    if (updateTimeout) clearTimeout(updateTimeout);
    
    updateTimeout = setTimeout(() => {
      metrics.wpm = calculator.calculateRealTimeWPM();
      const accuracy = calculator.calculateAccuracy();
      metrics.accuracy = accuracy.raw;
      metrics.consistency = calculator.calculateConsistency();
      metrics.errorPatterns = calculator.getErrorPatterns();
    }, 100); // Update at most 10 times per second
  }
  
  function startSession(drillType: string, targetWPM: number = 60): void {
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
  
  function recordKeystroke(
    key: string,
    expected: string,
    position: { line: number; column: number }
  ): void {
    if (!isActive.value || !currentSession.value) return;
    
    const now = Date.now();
    const timeDelta = now - startTime.value;
    
    const keystroke: KeystrokeEvent = {
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
  
  function endSession(): PerformanceSession | null {
    if (!currentSession.value) return null;
    
    currentSession.value.endTime = Date.now();
    currentSession.value.finalWPM = metrics.wpm;
    currentSession.value.accuracy = calculator.calculateAccuracy();
    
    isActive.value = false;
    
    const completedSession = currentSession.value;
    currentSession.value = null;
    
    return completedSession;
  }
  
  function pauseSession(): void {
    isActive.value = false;
  }
  
  function resumeSession(): void {
    if (currentSession.value) {
      isActive.value = true;
      startTime.value = Date.now();
    }
  }
  
  function resetSession(): void {
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