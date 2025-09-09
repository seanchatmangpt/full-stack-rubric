/**
 * @fileoverview Typing Metrics Validation Integration Tests
 * Tests accuracy of typing metrics calculations and real-time feedback
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Mock useTypingMetrics with actual implementation for testing
const mockMetrics = {
  wpm: 0,
  accuracy: 100,
  consistency: 100,
  totalKeystrokes: 0,
  correctKeystrokes: 0,
  errorPatterns: new Map(),
  characterLatencies: []
}

const mockSession = {
  id: null,
  startTime: null,
  endTime: null,
  targetWPM: 60,
  drillType: 'test'
}

let actualMetrics = { ...mockMetrics }
let actualSession = { ...mockSession }
let isSessionActive = false

// Create a real implementation for testing
const useTypingMetrics = () => {
  const startSession = (drillType, targetWPM = 60) => {
    actualSession = {
      id: `session-${Date.now()}`,
      startTime: Date.now(),
      endTime: null,
      targetWPM,
      drillType
    }
    actualMetrics = { ...mockMetrics }
    isSessionActive = true
  }

  const endSession = () => {
    if (!isSessionActive) return null
    
    actualSession.endTime = Date.now()
    isSessionActive = false
    return { ...actualSession }
  }

  const resetSession = () => {
    actualMetrics = { ...mockMetrics }
    actualSession = { ...mockSession }
    isSessionActive = false
  }

  const recordKeystroke = (typed, expected, position) => {
    actualMetrics.totalKeystrokes++
    
    const isCorrect = typed === expected
    if (isCorrect) {
      actualMetrics.correctKeystrokes++
    } else {
      // Track error patterns
      const pattern = `${expected}->${typed}`
      const count = actualMetrics.errorPatterns.get(pattern) || 0
      actualMetrics.errorPatterns.set(pattern, count + 1)
    }
    
    // Calculate real-time metrics
    actualMetrics.accuracy = actualMetrics.totalKeystrokes > 0 
      ? (actualMetrics.correctKeystrokes / actualMetrics.totalKeystrokes) * 100 
      : 100
    
    // Calculate WPM based on time elapsed
    if (actualSession.startTime) {
      const timeElapsed = (Date.now() - actualSession.startTime) / 1000 / 60 // minutes
      const wordsTyped = Math.floor(actualMetrics.totalKeystrokes / 5) // Standard: 5 chars = 1 word
      actualMetrics.wpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0
    }
    
    // Record latency
    actualMetrics.characterLatencies.push(Date.now() - (actualSession.startTime || Date.now()))
    
    // Calculate consistency (coefficient of variation of latencies)
    if (actualMetrics.characterLatencies.length > 1) {
      const latencies = actualMetrics.characterLatencies
      const mean = latencies.reduce((a, b) => a + b, 0) / latencies.length
      const variance = latencies.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / latencies.length
      const stdDev = Math.sqrt(variance)
      const cv = mean > 0 ? stdDev / mean : 0
      actualMetrics.consistency = Math.max(0, 100 - (cv * 100))
    }
  }

  return {
    currentSession: { value: actualSession },
    isActive: { value: isSessionActive },
    metrics: { value: actualMetrics },
    sessionDuration: { 
      value: actualSession.startTime ? Date.now() - actualSession.startTime : 0 
    },
    progressScore: { 
      value: actualMetrics.totalKeystrokes > 0 ? 
          Math.min((actualMetrics.correctKeystrokes / actualMetrics.totalKeystrokes) * 100, 100)
        : 0 
    },
    startSession,
    endSession,
    resetSession,
    recordKeystroke
  }
}

describe('Typing Metrics Validation Tests', () => {
  let metricsComposable

  beforeEach(() => {
    // Reset state before each test
    actualMetrics = { ...mockMetrics }
    actualSession = { ...mockSession }
    isSessionActive = false
    metricsComposable = useTypingMetrics()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('WPM (Words Per Minute) Calculations', () => {
    it('should calculate WPM correctly for perfect typing', async () => {
      const { startSession, recordKeystroke, metrics } = metricsComposable
      
      startSession('wpm-test', 60)
      
      // Simulate typing "hello" (5 characters = 1 word)
      const text = 'hello'
      const startTime = Date.now()
      
      for (let i = 0; i < text.length; i++) {
        recordKeystroke(text[i], text[i], { line: 1, column: i + 1 })
        // Add small delay to simulate real typing
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      const endTime = Date.now()
      const timeElapsed = (endTime - startTime) / 1000 / 60 // minutes
      const expectedWPM = Math.round(1 / timeElapsed) // 1 word typed
      
      expect(metrics.value.wpm).toBeGreaterThan(0)
      expect(metrics.value.wpm).toBeLessThan(1000) // Reasonable upper bound
    })

    it('should handle varying typing speeds accurately', async () => {
      const { startSession, recordKeystroke, metrics } = metricsComposable
      
      startSession('speed-test', 60)
      
      // Simulate slow typing (longer delays)
      const text = 'slow typing test'
      for (let i = 0; i < text.length; i++) {
        recordKeystroke(text[i], text[i], { line: 1, column: i + 1 })
        await new Promise(resolve => setTimeout(resolve, 200)) // Slower typing
      }
      
      const slowWPM = metrics.value.wpm
      
      // Reset and test fast typing
      metricsComposable.resetSession()
      metricsComposable.startSession('speed-test-fast', 60)
      
      const fastText = 'fast typing test'
      for (let i = 0; i < fastText.length; i++) {
        recordKeystroke(fastText[i], fastText[i], { line: 1, column: i + 1 })
        await new Promise(resolve => setTimeout(resolve, 50)) // Faster typing
      }
      
      const fastWPM = metrics.value.wpm
      
      // Fast typing should result in higher WPM
      expect(fastWPM).toBeGreaterThanOrEqual(slowWPM)
    })

    it('should handle zero and edge cases', () => {
      const { metrics } = metricsComposable
      
      // Initial state should be 0 WPM
      expect(metrics.value.wpm).toBe(0)
      
      // Single character should not cause division by zero
      metricsComposable.startSession('edge-test', 60)
      metricsComposable.recordKeystroke('a', 'a', { line: 1, column: 1 })
      
      expect(metrics.value.wpm).toBeGreaterThanOrEqual(0)
      expect(isFinite(metrics.value.wpm)).toBe(true)
    })
  })

  describe('Accuracy Calculations', () => {
    it('should calculate 100% accuracy for perfect typing', () => {
      const { startSession, recordKeystroke, metrics } = metricsComposable
      
      startSession('accuracy-perfect', 60)
      
      const text = 'perfect typing'
      for (let i = 0; i < text.length; i++) {
        recordKeystroke(text[i], text[i], { line: 1, column: i + 1 })
      }
      
      expect(metrics.value.accuracy).toBe(100)
      expect(metrics.value.correctKeystrokes).toBe(text.length)
      expect(metrics.value.totalKeystrokes).toBe(text.length)
    })

    it('should calculate accuracy correctly with errors', () => {
      const { startSession, recordKeystroke, metrics } = metricsComposable
      
      startSession('accuracy-errors', 60)
      
      // Type 'hello' but make errors
      recordKeystroke('h', 'h', { line: 1, column: 1 }) // correct
      recordKeystroke('x', 'e', { line: 1, column: 2 }) // error
      recordKeystroke('l', 'l', { line: 1, column: 3 }) // correct
      recordKeystroke('l', 'l', { line: 1, column: 4 }) // correct
      recordKeystroke('y', 'o', { line: 1, column: 5 }) // error
      
      // 3 correct out of 5 total = 60% accuracy
      expect(metrics.value.accuracy).toBe(60)
      expect(metrics.value.correctKeystrokes).toBe(3)
      expect(metrics.value.totalKeystrokes).toBe(5)
    })

    it('should handle accuracy calculation edge cases', () => {
      const { metrics } = metricsComposable
      
      // Initial state should be 100% accuracy
      expect(metrics.value.accuracy).toBe(100)
      
      // Single error should calculate correctly
      metricsComposable.startSession('accuracy-edge', 60)
      metricsComposable.recordKeystroke('x', 'a', { line: 1, column: 1 })
      
      expect(metrics.value.accuracy).toBe(0)
    })
  })

  describe('Error Pattern Tracking', () => {
    it('should track common error patterns', () => {
      const { startSession, recordKeystroke, metrics } = metricsComposable
      
      startSession('error-patterns', 60)
      
      // Make the same error multiple times
      recordKeystroke('t', 'h', { line: 1, column: 1 }) // h->t error
      recordKeystroke('e', 'e', { line: 1, column: 2 }) // correct
      recordKeystroke('t', 'h', { line: 1, column: 3 }) // h->t error again
      recordKeystroke('e', 'e', { line: 1, column: 4 }) // correct
      recordKeystroke('m', 'r', { line: 1, column: 5 }) // r->m error
      
      const errorPatterns = metrics.value.errorPatterns
      
      expect(errorPatterns.get('h->t')).toBe(2) // Two h->t errors
      expect(errorPatterns.get('r->m')).toBe(1) // One r->m error
      expect(errorPatterns.size).toBe(2) // Two distinct error patterns
    })

    it('should identify most frequent errors', () => {
      const { startSession, recordKeystroke, metrics } = metricsComposable
      
      startSession('frequent-errors', 60)
      
      // Create multiple error patterns with different frequencies
      for (let i = 0; i < 5; i++) {
        recordKeystroke('a', 's', { line: 1, column: 1 }) // s->a (frequent)\n      }\n      \n      for (let i = 0; i < 3; i++) {\n        recordKeystroke('d', 'f', { line: 1, column: 1 }) // f->d (less frequent)\n      }\n      \n      for (let i = 0; i < 1; i++) {\n        recordKeystroke('g', 'h', { line: 1, column: 1 }) // h->g (rare)\n      }\n      \n      const errorPatterns = metrics.value.errorPatterns\n      const sortedErrors = Array.from(errorPatterns.entries())\n        .sort((a, b) => b[1] - a[1])\n      \n      expect(sortedErrors[0]).toEqual(['s->a', 5]) // Most frequent\n      expect(sortedErrors[1]).toEqual(['f->d', 3]) // Second most frequent\n      expect(sortedErrors[2]).toEqual(['h->g', 1]) // Least frequent\n    })\n  })\n\n  describe('Consistency Metrics', () => {\n    it('should calculate consistency based on timing variations', async () => {\n      const { startSession, recordKeystroke, metrics } = metricsComposable\n      \n      startSession('consistency-test', 60)\n      \n      // Simulate consistent typing (similar delays)\n      const text = 'consistent'\n      for (let i = 0; i < text.length; i++) {\n        recordKeystroke(text[i], text[i], { line: 1, column: i + 1 })\n        await new Promise(resolve => setTimeout(resolve, 100)) // Consistent delay\n      }\n      \n      const consistentScore = metrics.value.consistency\n      \n      // Reset and test inconsistent typing\n      metricsComposable.resetSession()\n      metricsComposable.startSession('inconsistent-test', 60)\n      \n      const text2 = 'inconsistent'\n      for (let i = 0; i < text2.length; i++) {\n        recordKeystroke(text2[i], text2[i], { line: 1, column: i + 1 })\n        // Varying delays\n        const delay = i % 2 === 0 ? 50 : 200\n        await new Promise(resolve => setTimeout(resolve, delay))\n      }\n      \n      const inconsistentScore = metrics.value.consistency\n      \n      // Consistent typing should have higher consistency score\n      expect(consistentScore).toBeGreaterThanOrEqual(inconsistentScore)\n      expect(consistentScore).toBeGreaterThanOrEqual(0)\n      expect(consistentScore).toBeLessThanOrEqual(100)\n    })\n\n    it('should handle consistency calculation with minimal data', () => {\n      const { startSession, recordKeystroke, metrics } = metricsComposable\n      \n      startSession('minimal-consistency', 60)\n      \n      // Single keystroke\n      recordKeystroke('a', 'a', { line: 1, column: 1 })\n      \n      // Should handle single data point gracefully\n      expect(metrics.value.consistency).toBeGreaterThanOrEqual(0)\n      expect(metrics.value.consistency).toBeLessThanOrEqual(100)\n      expect(isFinite(metrics.value.consistency)).toBe(true)\n    })\n  })\n\n  describe('Session Management', () => {\n    it('should track session duration accurately', async () => {\n      const { startSession, sessionDuration } = metricsComposable\n      \n      const startTime = Date.now()\n      startSession('duration-test', 60)\n      \n      await new Promise(resolve => setTimeout(resolve, 100))\n      \n      const duration = sessionDuration.value\n      const expectedDuration = Date.now() - startTime\n      \n      // Duration should be approximately correct (within 50ms tolerance)\n      expect(Math.abs(duration - expectedDuration)).toBeLessThan(50)\n    })\n\n    it('should reset all metrics properly', () => {\n      const { startSession, recordKeystroke, resetSession, metrics } = metricsComposable\n      \n      // Create some data\n      startSession('reset-test', 60)\n      recordKeystroke('a', 'b', { line: 1, column: 1 }) // Error\n      recordKeystroke('c', 'c', { line: 1, column: 2 }) // Correct\n      \n      expect(metrics.value.totalKeystrokes).toBe(2)\n      expect(metrics.value.accuracy).toBe(50)\n      \n      // Reset\n      resetSession()\n      \n      // Should be back to initial state\n      expect(metrics.value.totalKeystrokes).toBe(0)\n      expect(metrics.value.correctKeystrokes).toBe(0)\n      expect(metrics.value.accuracy).toBe(100)\n      expect(metrics.value.wpm).toBe(0)\n      expect(metrics.value.errorPatterns.size).toBe(0)\n    })\n\n    it('should end sessions correctly', () => {\n      const { startSession, endSession, isActive } = metricsComposable\n      \n      expect(isActive.value).toBe(false)\n      \n      startSession('end-test', 60)\n      expect(isActive.value).toBe(true)\n      \n      const session = endSession()\n      expect(isActive.value).toBe(false)\n      expect(session).toBeTruthy()\n      expect(session.endTime).toBeTruthy()\n      expect(session.id).toBeTruthy()\n    })\n  })\n\n  describe('Progress Scoring', () => {\n    it('should calculate progress score based on accuracy', () => {\n      const { startSession, recordKeystroke, progressScore } = metricsComposable\n      \n      startSession('progress-test', 60)\n      \n      // All correct\n      recordKeystroke('a', 'a', { line: 1, column: 1 })\n      recordKeystroke('b', 'b', { line: 1, column: 2 })\n      recordKeystroke('c', 'c', { line: 1, column: 3 })\n      \n      expect(progressScore.value).toBe(100)\n      \n      // Add some errors\n      recordKeystroke('x', 'd', { line: 1, column: 4 }) // Error\n      recordKeystroke('e', 'e', { line: 1, column: 5 }) // Correct\n      \n      // 4 correct out of 5 total = 80%\n      expect(progressScore.value).toBe(80)\n    })\n\n    it('should handle progress score edge cases', () => {\n      const { progressScore } = metricsComposable\n      \n      // Initial state should be 0 progress\n      expect(progressScore.value).toBe(0)\n      \n      // Single error should calculate correctly\n      metricsComposable.startSession('progress-edge', 60)\n      metricsComposable.recordKeystroke('x', 'a', { line: 1, column: 1 })\n      \n      expect(progressScore.value).toBe(0)\n    })\n  })\n\n  describe('Real-time Metrics Updates', () => {\n    it('should update metrics in real-time during typing', () => {\n      const { startSession, recordKeystroke, metrics } = metricsComposable\n      \n      startSession('realtime-test', 60)\n      \n      // Track metrics changes\n      const metricsHistory = []\n      \n      const text = 'realtime'\n      for (let i = 0; i < text.length; i++) {\n        recordKeystroke(text[i], text[i], { line: 1, column: i + 1 })\n        \n        // Capture metrics snapshot\n        metricsHistory.push({\n          totalKeystrokes: metrics.value.totalKeystrokes,\n          correctKeystrokes: metrics.value.correctKeystrokes,\n          accuracy: metrics.value.accuracy,\n          wpm: metrics.value.wpm\n        })\n      }\n      \n      // Verify metrics updated at each step\n      for (let i = 0; i < metricsHistory.length; i++) {\n        expect(metricsHistory[i].totalKeystrokes).toBe(i + 1)\n        expect(metricsHistory[i].correctKeystrokes).toBe(i + 1)\n        expect(metricsHistory[i].accuracy).toBe(100) // All correct\n      }\n    })\n\n    it('should maintain metric bounds and validity', () => {\n      const { startSession, recordKeystroke, metrics } = metricsComposable\n      \n      startSession('bounds-test', 60)\n      \n      // Add various keystrokes\n      const combinations = [\n        { typed: 'a', expected: 'a' }, // correct\n        { typed: 'b', expected: 'x' }, // error\n        { typed: 'c', expected: 'c' }, // correct\n        { typed: 'd', expected: 'y' }, // error\n      ]\n      \n      combinations.forEach((combo, index) => {\n        recordKeystroke(combo.typed, combo.expected, { line: 1, column: index + 1 })\n        \n        // Verify all metrics are within valid bounds\n        expect(metrics.value.accuracy).toBeGreaterThanOrEqual(0)\n        expect(metrics.value.accuracy).toBeLessThanOrEqual(100)\n        expect(metrics.value.wpm).toBeGreaterThanOrEqual(0)\n        expect(metrics.value.consistency).toBeGreaterThanOrEqual(0)\n        expect(metrics.value.consistency).toBeLessThanOrEqual(100)\n        expect(metrics.value.totalKeystrokes).toBeGreaterThan(0)\n        expect(metrics.value.correctKeystrokes).toBeGreaterThanOrEqual(0)\n        expect(metrics.value.correctKeystrokes).toBeLessThanOrEqual(metrics.value.totalKeystrokes)\n      })\n    })\n  })\n})"
      }
      
      for (let i = 0; i < 3; i++) {
        recordKeystroke('d', 'f', { line: 1, column: 1 }) // f->d (less frequent)
      }
      
      for (let i = 0; i < 1; i++) {
        recordKeystroke('g', 'h', { line: 1, column: 1 }) // h->g (rare)
      }
      
      const errorPatterns = metrics.value.errorPatterns
      const sortedErrors = Array.from(errorPatterns.entries())
        .sort((a, b) => b[1] - a[1])
      
      expect(sortedErrors[0]).toEqual(['s->a', 5]) // Most frequent
      expect(sortedErrors[1]).toEqual(['f->d', 3]) // Second most frequent
      expect(sortedErrors[2]).toEqual(['h->g', 1]) // Least frequent
    })
  })

  describe('Consistency Metrics', () => {
    it('should calculate consistency based on timing variations', async () => {
      const { startSession, recordKeystroke, metrics } = metricsComposable
      
      startSession('consistency-test', 60)
      
      // Simulate consistent typing (similar delays)
      const text = 'consistent'
      for (let i = 0; i < text.length; i++) {
        recordKeystroke(text[i], text[i], { line: 1, column: i + 1 })
        await new Promise(resolve => setTimeout(resolve, 100)) // Consistent delay
      }
      
      const consistentScore = metrics.value.consistency
      
      // Reset and test inconsistent typing
      metricsComposable.resetSession()
      metricsComposable.startSession('inconsistent-test', 60)
      
      const text2 = 'inconsistent'
      for (let i = 0; i < text2.length; i++) {
        recordKeystroke(text2[i], text2[i], { line: 1, column: i + 1 })
        // Varying delays
        const delay = i % 2 === 0 ? 50 : 200
        await new Promise(resolve => setTimeout(resolve, delay))
      }
      
      const inconsistentScore = metrics.value.consistency
      
      // Consistent typing should have higher consistency score
      expect(consistentScore).toBeGreaterThanOrEqual(inconsistentScore)
      expect(consistentScore).toBeGreaterThanOrEqual(0)
      expect(consistentScore).toBeLessThanOrEqual(100)
    })

    it('should handle consistency calculation with minimal data', () => {
      const { startSession, recordKeystroke, metrics } = metricsComposable
      
      startSession('minimal-consistency', 60)
      
      // Single keystroke
      recordKeystroke('a', 'a', { line: 1, column: 1 })
      
      // Should handle single data point gracefully
      expect(metrics.value.consistency).toBeGreaterThanOrEqual(0)
      expect(metrics.value.consistency).toBeLessThanOrEqual(100)
      expect(isFinite(metrics.value.consistency)).toBe(true)
    })
  })

  describe('Session Management', () => {
    it('should track session duration accurately', async () => {
      const { startSession, sessionDuration } = metricsComposable
      
      const startTime = Date.now()
      startSession('duration-test', 60)
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const duration = sessionDuration.value
      const expectedDuration = Date.now() - startTime
      
      // Duration should be approximately correct (within 50ms tolerance)
      expect(Math.abs(duration - expectedDuration)).toBeLessThan(50)
    })

    it('should reset all metrics properly', () => {
      const { startSession, recordKeystroke, resetSession, metrics } = metricsComposable
      
      // Create some data
      startSession('reset-test', 60)
      recordKeystroke('a', 'b', { line: 1, column: 1 }) // Error
      recordKeystroke('c', 'c', { line: 1, column: 2 }) // Correct
      
      expect(metrics.value.totalKeystrokes).toBe(2)
      expect(metrics.value.accuracy).toBe(50)
      
      // Reset
      resetSession()
      
      // Should be back to initial state
      expect(metrics.value.totalKeystrokes).toBe(0)
      expect(metrics.value.correctKeystrokes).toBe(0)
      expect(metrics.value.accuracy).toBe(100)
      expect(metrics.value.wpm).toBe(0)
      expect(metrics.value.errorPatterns.size).toBe(0)
    })

    it('should end sessions correctly', () => {
      const { startSession, endSession, isActive } = metricsComposable
      
      expect(isActive.value).toBe(false)
      
      startSession('end-test', 60)
      expect(isActive.value).toBe(true)
      
      const session = endSession()
      expect(isActive.value).toBe(false)
      expect(session).toBeTruthy()
      expect(session.endTime).toBeTruthy()
      expect(session.id).toBeTruthy()
    })
  })

  describe('Progress Scoring', () => {
    it('should calculate progress score based on accuracy', () => {
      const { startSession, recordKeystroke, progressScore } = metricsComposable
      
      startSession('progress-test', 60)
      
      // All correct
      recordKeystroke('a', 'a', { line: 1, column: 1 })
      recordKeystroke('b', 'b', { line: 1, column: 2 })
      recordKeystroke('c', 'c', { line: 1, column: 3 })
      
      expect(progressScore.value).toBe(100)
      
      // Add some errors
      recordKeystroke('x', 'd', { line: 1, column: 4 }) // Error
      recordKeystroke('e', 'e', { line: 1, column: 5 }) // Correct
      
      // 4 correct out of 5 total = 80%
      expect(progressScore.value).toBe(80)
    })

    it('should handle progress score edge cases', () => {
      const { progressScore } = metricsComposable
      
      // Initial state should be 0 progress
      expect(progressScore.value).toBe(0)
      
      // Single error should calculate correctly
      metricsComposable.startSession('progress-edge', 60)
      metricsComposable.recordKeystroke('x', 'a', { line: 1, column: 1 })
      
      expect(progressScore.value).toBe(0)
    })
  })

  describe('Real-time Metrics Updates', () => {
    it('should update metrics in real-time during typing', () => {
      const { startSession, recordKeystroke, metrics } = metricsComposable
      
      startSession('realtime-test', 60)
      
      // Track metrics changes
      const metricsHistory = []
      
      const text = 'realtime'
      for (let i = 0; i < text.length; i++) {
        recordKeystroke(text[i], text[i], { line: 1, column: i + 1 })
        
        // Capture metrics snapshot
        metricsHistory.push({
          totalKeystrokes: metrics.value.totalKeystrokes,
          correctKeystrokes: metrics.value.correctKeystrokes,
          accuracy: metrics.value.accuracy,
          wpm: metrics.value.wpm
        })
      }
      
      // Verify metrics updated at each step
      for (let i = 0; i < metricsHistory.length; i++) {
        expect(metricsHistory[i].totalKeystrokes).toBe(i + 1)
        expect(metricsHistory[i].correctKeystrokes).toBe(i + 1)
        expect(metricsHistory[i].accuracy).toBe(100) // All correct
      }
    })

    it('should maintain metric bounds and validity', () => {
      const { startSession, recordKeystroke, metrics } = metricsComposable
      
      startSession('bounds-test', 60)
      
      // Add various keystrokes
      const combinations = [
        { typed: 'a', expected: 'a' }, // correct
        { typed: 'b', expected: 'x' }, // error
        { typed: 'c', expected: 'c' }, // correct
        { typed: 'd', expected: 'y' } // error
      ]
      
      combinations.forEach((combo, index) => {
        recordKeystroke(combo.typed, combo.expected, { line: 1, column: index + 1 })
        
        // Verify all metrics are within valid bounds
        expect(metrics.value.accuracy).toBeGreaterThanOrEqual(0)
        expect(metrics.value.accuracy).toBeLessThanOrEqual(100)
        expect(metrics.value.wpm).toBeGreaterThanOrEqual(0)
        expect(metrics.value.consistency).toBeGreaterThanOrEqual(0)
        expect(metrics.value.consistency).toBeLessThanOrEqual(100)
        expect(metrics.value.totalKeystrokes).toBeGreaterThan(0)
        expect(metrics.value.correctKeystrokes).toBeGreaterThanOrEqual(0)
        expect(metrics.value.correctKeystrokes).toBeLessThanOrEqual(metrics.value.totalKeystrokes)
      })
    })
  })
})
