/**
 * @fileoverview Unit tests for typing accuracy and WPM calculation algorithms
 * Tests core typing metrics calculation without UI dependencies
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * @typedef {Object} TypingSession
 * @property {number} startTime - Session start timestamp
 * @property {number} [endTime] - Session end timestamp
 * @property {number} totalCharacters - Total characters typed
 * @property {number} correctCharacters - Number of correct characters
 * @property {number} incorrectCharacters - Number of incorrect characters
 * @property {number} corrections - Number of corrections made
 * @property {KeystrokeEvent[]} keystrokes - Array of keystroke events
 */

/**
 * @typedef {Object} KeystrokeEvent
 * @property {number} timestamp - Keystroke timestamp
 * @property {string} key - Key pressed
 * @property {boolean} correct - Whether the keystroke was correct
 * @property {boolean} [corrected] - Whether the keystroke was corrected
 */

/**
 * Core typing calculation algorithms to be tested
 */
class TypingCalculator {
  /**
   * Calculate Words Per Minute (WPM)
   * Standard: 1 word = 5 characters
   * @param {TypingSession} session - The typing session data
   * @returns {number} Words per minute
   */
  static calculateWPM(session) {
    if (!session.endTime || session.startTime >= session.endTime) {
      return 0
    }
    
    const timeInMinutes = (session.endTime - session.startTime) / (1000 * 60)
    const words = session.correctCharacters / 5
    return Math.round(words / timeInMinutes)
  }

  /**
   * Calculate accuracy percentage
   * @param {TypingSession} session - The typing session data
   * @returns {number} Accuracy percentage
   */
  static calculateAccuracy(session) {
    if (session.totalCharacters === 0) {
      return 100
    }
    return Math.round((session.correctCharacters / session.totalCharacters) * 100)
  }

  /**
   * Calculate real-time WPM during typing
   * @param {KeystrokeEvent[]} keystrokes - Array of keystroke events
   * @param {number} currentTime - Current timestamp
   * @returns {number} Real-time WPM
   */
  static calculateRealtimeWPM(keystrokes, currentTime) {
    if (keystrokes.length === 0) {
      return 0
    }

    const startTime = keystrokes[0].timestamp
    const timeInMinutes = (currentTime - startTime) / (1000 * 60)
    
    if (timeInMinutes === 0) {
      return 0
    }

    const correctCharacters = keystrokes.filter(k => k.correct).length
    const words = correctCharacters / 5
    return Math.round(words / timeInMinutes)
  }

  /**
   * Calculate typing consistency (standard deviation of keystroke intervals)
   * @param {KeystrokeEvent[]} keystrokes - Array of keystroke events
   * @returns {number} Consistency score (0-100)
   */
  static calculateConsistency(keystrokes) {
    if (keystrokes.length < 2) {
      return 100
    }

    const intervals = []
    for (let i = 1; i < keystrokes.length; i++) {
      intervals.push(keystrokes[i].timestamp - keystrokes[i - 1].timestamp)
    }

    const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length
    const standardDeviation = Math.sqrt(variance)
    
    // Convert to consistency percentage (lower deviation = higher consistency)
    const consistencyScore = Math.max(0, 100 - (standardDeviation / mean) * 100)
    return Math.round(consistencyScore)
  }

  /**
   * Detect and count typing bursts (rapid sequences)
   * @param {KeystrokeEvent[]} keystrokes - Array of keystroke events
   * @param {number} [burstThreshold=100] - Threshold for burst detection in ms
   * @returns {number} Number of bursts detected
   */
  static detectTypingBursts(keystrokes, burstThreshold = 100) {
    let burstCount = 0
    let consecutiveFast = 0

    for (let i = 1; i < keystrokes.length; i++) {
      const interval = keystrokes[i].timestamp - keystrokes[i - 1].timestamp
      
      if (interval < burstThreshold) {
        consecutiveFast++
      } else {
        if (consecutiveFast >= 3) { // At least 3 consecutive fast keystrokes
          burstCount++
        }
        consecutiveFast = 0
      }
    }

    // Check final sequence
    if (consecutiveFast >= 3) {
      burstCount++
    }

    return burstCount
  }
}

describe('TypingCalculator', () => {
  /** @type {TypingSession} */
  let mockSession

  beforeEach(() => {
    mockSession = {
      startTime: Date.now() - 60000, // 1 minute ago
      endTime: Date.now(),
      totalCharacters: 100,
      correctCharacters: 90,
      incorrectCharacters: 10,
      corrections: 5,
      keystrokes: []
    }
  })

  describe('calculateWPM', () => {
    it('should calculate correct WPM for standard typing session', () => {
      // 90 correct characters in 60 seconds = 18 WPM (90/5 = 18 words)
      const wpm = TypingCalculator.calculateWPM(mockSession)
      expect(wpm).toBe(18)
    })

    it('should return 0 WPM for session with no end time', () => {
      mockSession.endTime = undefined
      const wpm = TypingCalculator.calculateWPM(mockSession)
      expect(wpm).toBe(0)
    })

    it('should return 0 WPM for invalid time range', () => {
      mockSession.endTime = mockSession.startTime - 1000 // End before start
      const wpm = TypingCalculator.calculateWPM(mockSession)
      expect(wpm).toBe(0)
    })

    it('should handle high-speed typing correctly', () => {
      mockSession.startTime = Date.now() - 30000 // 30 seconds
      mockSession.correctCharacters = 250 // 50 words in 30 seconds = 100 WPM
      const wpm = TypingCalculator.calculateWPM(mockSession)
      expect(wpm).toBe(100)
    })

    it('should round WPM to nearest integer', () => {
      mockSession.startTime = Date.now() - 40000 // 40 seconds
      mockSession.correctCharacters = 87 // Should result in 26.1 WPM, rounded to 26
      const wpm = TypingCalculator.calculateWPM(mockSession)
      expect(wpm).toBe(26)
    })
  })

  describe('calculateAccuracy', () => {
    it('should calculate correct accuracy percentage', () => {
      // 90 correct out of 100 total = 90%
      const accuracy = TypingCalculator.calculateAccuracy(mockSession)
      expect(accuracy).toBe(90)
    })

    it('should return 100% accuracy for empty session', () => {
      mockSession.totalCharacters = 0
      mockSession.correctCharacters = 0
      const accuracy = TypingCalculator.calculateAccuracy(mockSession)
      expect(accuracy).toBe(100)
    })

    it('should handle perfect typing accuracy', () => {
      mockSession.correctCharacters = 100
      mockSession.incorrectCharacters = 0
      const accuracy = TypingCalculator.calculateAccuracy(mockSession)
      expect(accuracy).toBe(100)
    })

    it('should handle very low accuracy', () => {
      mockSession.correctCharacters = 5
      mockSession.incorrectCharacters = 95
      const accuracy = TypingCalculator.calculateAccuracy(mockSession)
      expect(accuracy).toBe(5)
    })
  })

  describe('calculateRealtimeWPM', () => {
    /** @type {KeystrokeEvent[]} */
    let mockKeystrokes

    beforeEach(() => {
      const baseTime = Date.now()
      mockKeystrokes = [
        { timestamp: baseTime, key: 'h', correct: true },
        { timestamp: baseTime + 200, key: 'e', correct: true },
        { timestamp: baseTime + 400, key: 'l', correct: true },
        { timestamp: baseTime + 600, key: 'l', correct: true },
        { timestamp: baseTime + 800, key: 'o', correct: true }
      ]
    })

    it('should calculate realtime WPM correctly', () => {
      const currentTime = Date.now()
      const wpm = TypingCalculator.calculateRealtimeWPM(mockKeystrokes, currentTime)
      expect(wpm).toBeGreaterThan(0)
    })

    it('should return 0 for empty keystroke array', () => {
      const wpm = TypingCalculator.calculateRealtimeWPM([], Date.now())
      expect(wpm).toBe(0)
    })

    it('should handle incorrect keystrokes in calculation', () => {
      mockKeystrokes.push({ timestamp: Date.now() + 1000, key: 'x', correct: false })
      const currentTime = Date.now() + 2000
      const wpm = TypingCalculator.calculateRealtimeWPM(mockKeystrokes, currentTime)
      expect(wpm).toBeGreaterThan(0) // Should only count correct keystrokes
    })
  })

  describe('calculateConsistency', () => {
    it('should return 100 for single keystroke', () => {
      const keystrokes = [{ timestamp: Date.now(), key: 'a', correct: true }]
      const consistency = TypingCalculator.calculateConsistency(keystrokes)
      expect(consistency).toBe(100)
    })

    it('should calculate high consistency for regular intervals', () => {
      const baseTime = Date.now()
      const keystrokes = [
        { timestamp: baseTime, key: 'a', correct: true },
        { timestamp: baseTime + 200, key: 'b', correct: true },
        { timestamp: baseTime + 400, key: 'c', correct: true },
        { timestamp: baseTime + 600, key: 'd', correct: true }
      ]
      const consistency = TypingCalculator.calculateConsistency(keystrokes)
      expect(consistency).toBeGreaterThan(95)
    })

    it('should calculate lower consistency for irregular intervals', () => {
      const baseTime = Date.now()
      const keystrokes = [
        { timestamp: baseTime, key: 'a', correct: true },
        { timestamp: baseTime + 100, key: 'b', correct: true },
        { timestamp: baseTime + 500, key: 'c', correct: true },
        { timestamp: baseTime + 600, key: 'd', correct: true }
      ]
      const consistency = TypingCalculator.calculateConsistency(keystrokes)
      expect(consistency).toBeLessThan(95)
    })
  })

  describe('detectTypingBursts', () => {
    it('should detect typing bursts correctly', () => {
      const baseTime = Date.now()
      const keystrokes = [
        { timestamp: baseTime, key: 'a', correct: true },
        { timestamp: baseTime + 50, key: 'b', correct: true }, // Fast
        { timestamp: baseTime + 100, key: 'c', correct: true }, // Fast
        { timestamp: baseTime + 150, key: 'd', correct: true }, // Fast - this creates a burst
        { timestamp: baseTime + 500, key: 'e', correct: true }, // Slow
        { timestamp: baseTime + 550, key: 'f', correct: true }, // Fast
        { timestamp: baseTime + 600, key: 'g', correct: true }, // Fast
        { timestamp: baseTime + 650, key: 'h', correct: true }  // Fast - another burst
      ]
      const bursts = TypingCalculator.detectTypingBursts(keystrokes, 100)
      expect(bursts).toBe(2)
    })

    it('should return 0 bursts for consistent slow typing', () => {
      const baseTime = Date.now()
      const keystrokes = [
        { timestamp: baseTime, key: 'a', correct: true },
        { timestamp: baseTime + 200, key: 'b', correct: true },
        { timestamp: baseTime + 400, key: 'c', correct: true },
        { timestamp: baseTime + 600, key: 'd', correct: true }
      ]
      const bursts = TypingCalculator.detectTypingBursts(keystrokes, 100)
      expect(bursts).toBe(0)
    })

    it('should use custom burst threshold', () => {
      const baseTime = Date.now()
      const keystrokes = [
        { timestamp: baseTime, key: 'a', correct: true },
        { timestamp: baseTime + 150, key: 'b', correct: true },
        { timestamp: baseTime + 300, key: 'c', correct: true },
        { timestamp: baseTime + 450, key: 'd', correct: true }
      ]
      const burstsStrict = TypingCalculator.detectTypingBursts(keystrokes, 100)
      const burstsLenient = TypingCalculator.detectTypingBursts(keystrokes, 200)
      
      expect(burstsStrict).toBe(0) // 150ms intervals are above 100ms threshold
      expect(burstsLenient).toBe(1) // 150ms intervals are below 200ms threshold
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle zero-time sessions gracefully', () => {
      mockSession.startTime = mockSession.endTime = Date.now()
      expect(() => TypingCalculator.calculateWPM(mockSession)).not.toThrow()
      expect(TypingCalculator.calculateWPM(mockSession)).toBe(0)
    })

    it('should handle negative character counts', () => {
      mockSession.correctCharacters = -10
      expect(() => TypingCalculator.calculateAccuracy(mockSession)).not.toThrow()
    })

    it('should handle extremely large numbers', () => {
      mockSession.correctCharacters = Number.MAX_SAFE_INTEGER
      mockSession.totalCharacters = Number.MAX_SAFE_INTEGER
      expect(() => TypingCalculator.calculateAccuracy(mockSession)).not.toThrow()
    })

    it('should handle keystroke events with identical timestamps', () => {
      const timestamp = Date.now()
      const keystrokes = [
        { timestamp, key: 'a', correct: true },
        { timestamp, key: 'b', correct: true },
        { timestamp, key: 'c', correct: true }
      ]
      expect(() => TypingCalculator.calculateConsistency(keystrokes)).not.toThrow()
    })
  })
})

/**
 * Performance benchmarks for typing algorithms
 */
describe('TypingCalculator Performance', () => {
  it('should calculate WPM for large sessions efficiently', () => {
    /** @type {TypingSession} */
    const largeSession = {
      startTime: Date.now() - 300000, // 5 minutes
      endTime: Date.now(),
      totalCharacters: 10000,
      correctCharacters: 9500,
      incorrectCharacters: 500,
      corrections: 250,
      keystrokes: []
    }

    const startTime = performance.now()
    TypingCalculator.calculateWPM(largeSession)
    const endTime = performance.now()

    expect(endTime - startTime).toBeLessThan(1) // Should complete in under 1ms
  })

  it('should handle large keystroke arrays efficiently', () => {
    /** @type {KeystrokeEvent[]} */
    const keystrokes = []
    const baseTime = Date.now()
    
    // Generate 10,000 keystrokes
    for (let i = 0; i < 10000; i++) {
      keystrokes.push({
        timestamp: baseTime + i * 100,
        key: String.fromCharCode(97 + (i % 26)), // a-z cycling
        correct: Math.random() > 0.1 // 90% accuracy
      })
    }

    const startTime = performance.now()
    TypingCalculator.calculateConsistency(keystrokes)
    const endTime = performance.now()

    expect(endTime - startTime).toBeLessThan(10) // Should complete in under 10ms
  })
})