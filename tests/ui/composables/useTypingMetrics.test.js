/**
 * useTypingMetrics Composable Tests
 * Tests typing performance calculations, session management, and real-time metrics
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { useTypingMetrics } from '../../../app/composables/useTypingMetrics.js'

// Mock performance API for testing
global.performance = {
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 10, // 10MB
    totalJSHeapSize: 1024 * 1024 * 20  // 20MB
  }
}

describe('useTypingMetrics Composable', () => {
  let composable
  let mockTimestamp = 1000

  beforeEach(() => {
    // Reset time mocks
    mockTimestamp = 1000
    vi.mocked(global.performance.now).mockImplementation(() => mockTimestamp)
    vi.spyOn(Date, 'now').mockImplementation(() => mockTimestamp)
    
    // Create fresh composable instance
    composable = useTypingMetrics()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      expect(composable.currentSession.value).toBe(null)
      expect(composable.isActive.value).toBe(false)
      expect(composable.metrics.wpm).toBe(0)
      expect(composable.metrics.accuracy).toBe(0)
      expect(composable.metrics.consistency).toBe(0)
      expect(composable.sessionDuration.value).toBe(0)
      expect(composable.progressScore.value).toBe(0)
    })

    it('should provide readonly reactive state', () => {
      // Test that state objects are readonly
      expect(() => {
        composable.currentSession.value = {}
      }).toThrow()

      expect(() => {
        composable.isActive.value = true
      }).toThrow()
    })
  })

  describe('Session Management', () => {
    it('should start session with correct parameters', () => {
      const drillType = 'javascript-basics'
      const targetWPM = 80

      composable.startSession(drillType, targetWPM)

      expect(composable.isActive.value).toBe(true)
      expect(composable.currentSession.value).toMatchObject({
        drillType,
        targetWPM,
        startTime: mockTimestamp,
        finalWPM: 0,
        keystrokes: []
      })
      expect(composable.currentSession.value.id).toMatch(/^session_\d+_[a-z0-9]+$/)
    })

    it('should use default targetWPM when not provided', () => {
      composable.startSession('test-drill')

      expect(composable.currentSession.value.targetWPM).toBe(60)
    })

    it('should end session and return session data', () => {
      // Start session
      composable.startSession('test-drill', 70)
      
      // Advance time and add some keystrokes
      mockTimestamp = 2000
      composable.recordKeystroke('h', 'h', { line: 1, column: 1 })
      composable.recordKeystroke('e', 'e', { line: 1, column: 2 })

      // End session
      mockTimestamp = 3000
      const result = composable.endSession()

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.endTime).toBe(3000)
      expect(result.keystrokes.length).toBe(2)
      expect(composable.isActive.value).toBe(false)
      expect(composable.currentSession.value).toBe(null)
    })

    it('should return null when ending inactive session', () => {
      const result = composable.endSession()
      expect(result).toBe(null)
    })

    it('should pause session correctly', () => {
      composable.startSession('test-drill')
      expect(composable.isActive.value).toBe(true)

      composable.pauseSession()
      expect(composable.isActive.value).toBe(false)
      expect(composable.currentSession.value).toBeDefined()
    })

    it('should resume session correctly', () => {
      composable.startSession('test-drill')
      composable.pauseSession()
      
      mockTimestamp = 2000
      composable.resumeSession()

      expect(composable.isActive.value).toBe(true)
    })

    it('should not resume without active session', () => {
      composable.resumeSession()
      expect(composable.isActive.value).toBe(false)
    })

    it('should reset session completely', () => {
      // Start session and add data
      composable.startSession('test-drill')
      composable.recordKeystroke('t', 't', { line: 1, column: 1 })

      composable.resetSession()

      expect(composable.currentSession.value).toBe(null)
      expect(composable.isActive.value).toBe(false)
      expect(composable.metrics.wpm).toBe(0)
      expect(composable.metrics.accuracy).toBe(0)
      expect(composable.metrics.errorPatterns.size).toBe(0)
    })
  })

  describe('Keystroke Recording', () => {
    beforeEach(() => {
      composable.startSession('test-drill', 60)
    })

    it('should record correct keystroke', async () => {
      mockTimestamp = 1100
      composable.recordKeystroke('h', 'h', { line: 1, column: 1 })

      await nextTick()

      expect(composable.currentSession.value.keystrokes).toHaveLength(1)
      const keystroke = composable.currentSession.value.keystrokes[0]
      
      expect(keystroke).toMatchObject({
        key: 'h',
        expected: 'h',
        isCorrect: true,
        timestamp: 1100,
        timeDelta: 100, // 1100 - 1000
        position: { line: 1, column: 1 }
      })
    })

    it('should record incorrect keystroke', async () => {
      mockTimestamp = 1200
      composable.recordKeystroke('y', 'h', { line: 1, column: 1 })

      await nextTick()

      const keystroke = composable.currentSession.value.keystrokes[0]
      expect(keystroke.isCorrect).toBe(false)
      expect(keystroke.key).toBe('y')
      expect(keystroke.expected).toBe('h')
    })

    it('should not record when session inactive', () => {
      composable.pauseSession()
      composable.recordKeystroke('h', 'h', { line: 1, column: 1 })

      expect(composable.currentSession.value.keystrokes).toHaveLength(0)
    })

    it('should update metrics after keystroke', async () => {
      // Record several keystrokes to trigger metric calculations
      const keystrokes = [
        ['h', 'h'], ['e', 'e'], ['l', 'l'], ['l', 'l'], ['o', 'o'],
        [' ', ' '], ['w', 'w'], ['o', 'o'], ['r', 'r'], ['l', 'l'], ['d', 'd']
      ]

      for (let i = 0; i < keystrokes.length; i++) {
        mockTimestamp = 1000 + (i + 1) * 100 // 100ms between keystrokes
        composable.recordKeystroke(keystrokes[i][0], keystrokes[i][1], { line: 1, column: i + 1 })
      }

      await nextTick()

      // Should have calculated some WPM and accuracy
      expect(composable.metrics.wpm).toBeGreaterThan(0)
      expect(composable.metrics.accuracy).toBe(100) // All correct
    })
  })

  describe('WPM Calculation', () => {
    beforeEach(() => {
      composable.startSession('test-drill', 60)
    })

    it('should calculate WPM correctly for continuous typing', async () => {
      // Simulate typing "hello" at 60 WPM (5 chars in 5 seconds = 60 WPM)
      const text = 'hello'
      const targetWPM = 60
      const timePerChar = 1000 // 1 second per character for 60 WPM

      for (let i = 0; i < text.length; i++) {
        mockTimestamp = 1000 + (i + 1) * timePerChar
        composable.recordKeystroke(text[i], text[i], { line: 1, column: i + 1 })
      }

      await nextTick()
      
      // Should be close to target WPM (allowing for calculation variance)
      expect(composable.metrics.wpm).toBeGreaterThan(30)
      expect(composable.metrics.wpm).toBeLessThan(90)
    })

    it('should return 0 WPM with insufficient data', async () => {
      composable.recordKeystroke('h', 'h', { line: 1, column: 1 })
      await nextTick()

      expect(composable.metrics.wpm).toBe(0)
    })

    it('should handle backspace keystrokes', async () => {
      // Type and then backspace
      mockTimestamp = 1100
      composable.recordKeystroke('h', 'h', { line: 1, column: 1 })
      
      mockTimestamp = 1200
      composable.recordKeystroke('Backspace', '', { line: 1, column: 1 })

      await nextTick()

      // Backspace should not contribute to WPM calculation
      expect(composable.metrics.wpm).toBe(0)
    })
  })

  describe('Accuracy Calculation', () => {
    beforeEach(() => {
      composable.startSession('test-drill', 60)
    })

    it('should calculate 100% accuracy for all correct keystrokes', async () => {
      const keystrokes = ['h', 'e', 'l', 'l', 'o']
      
      for (let i = 0; i < keystrokes.length; i++) {
        mockTimestamp = 1000 + (i + 1) * 100
        composable.recordKeystroke(keystrokes[i], keystrokes[i], { line: 1, column: i + 1 })
      }

      await nextTick()

      expect(composable.metrics.accuracy).toBe(100)
    })

    it('should calculate accuracy with errors', async () => {
      // 3 correct, 2 incorrect = 60% accuracy
      const keystrokes = [
        ['h', 'h'], ['e', 'e'], ['l', 'l'], // correct
        ['y', 'l'], ['u', 'o'] // incorrect
      ]

      for (let i = 0; i < keystrokes.length; i++) {
        mockTimestamp = 1000 + (i + 1) * 100
        composable.recordKeystroke(keystrokes[i][0], keystrokes[i][1], { line: 1, column: i + 1 })
      }

      await nextTick()

      expect(composable.metrics.accuracy).toBe(60)
    })

    it('should return 0% accuracy with no keystrokes', async () => {
      await nextTick()
      expect(composable.metrics.accuracy).toBe(0)
    })
  })

  describe('Consistency Calculation', () => {
    beforeEach(() => {
      composable.startSession('test-drill', 60)
    })

    it('should calculate high consistency for steady typing', async () => {
      // Consistent 100ms intervals
      for (let i = 0; i < 10; i++) {
        mockTimestamp = 1000 + (i + 1) * 100
        composable.recordKeystroke('a', 'a', { line: 1, column: i + 1 })
      }

      await nextTick()

      expect(composable.metrics.consistency).toBeGreaterThan(80)
    })

    it('should calculate low consistency for erratic typing', async () => {
      // Erratic intervals: 50ms, 200ms, 80ms, 300ms...
      const intervals = [50, 200, 80, 300, 60, 250, 90, 400]
      let time = 1000

      for (let i = 0; i < intervals.length; i++) {
        time += intervals[i]
        mockTimestamp = time
        composable.recordKeystroke('a', 'a', { line: 1, column: i + 1 })
      }

      await nextTick()

      expect(composable.metrics.consistency).toBeLessThan(50)
    })

    it('should return 0 consistency with insufficient data', async () => {
      composable.recordKeystroke('h', 'h', { line: 1, column: 1 })
      await nextTick()

      expect(composable.metrics.consistency).toBe(0)
    })
  })

  describe('Error Patterns', () => {
    beforeEach(() => {
      composable.startSession('test-drill', 60)
    })

    it('should track error patterns correctly', async () => {
      // Create specific error patterns
      const keystrokes = [
        ['t', 'y'], // t->y error (twice)
        ['t', 'y'],
        ['e', 'r'], // e->r error (once)
        ['h', 'h'] // correct
      ]

      for (let i = 0; i < keystrokes.length; i++) {
        mockTimestamp = 1000 + (i + 1) * 100
        composable.recordKeystroke(keystrokes[i][0], keystrokes[i][1], { line: 1, column: i + 1 })
      }

      await nextTick()

      expect(composable.metrics.errorPatterns.get('y->t')).toBe(2)
      expect(composable.metrics.errorPatterns.get('r->e')).toBe(1)
      expect(composable.metrics.errorPatterns.has('h->h')).toBe(false) // Correct keystrokes not tracked
    })

    it('should clear error patterns on reset', async () => {
      composable.recordKeystroke('y', 't', { line: 1, column: 1 })
      await nextTick()
      
      expect(composable.metrics.errorPatterns.size).toBeGreaterThan(0)
      
      composable.resetSession()
      expect(composable.metrics.errorPatterns.size).toBe(0)
    })
  })

  describe('Session Duration', () => {
    it('should calculate duration for active session', async () => {
      composable.startSession('test-drill')
      mockTimestamp = 5000 // 4 seconds later

      await nextTick()

      expect(composable.sessionDuration.value).toBe(4000)
    })

    it('should return 0 duration for inactive session', () => {
      expect(composable.sessionDuration.value).toBe(0)
    })

    it('should return 0 duration for paused session', () => {
      composable.startSession('test-drill')
      composable.pauseSession()

      expect(composable.sessionDuration.value).toBe(0)
    })
  })

  describe('Progress Score', () => {
    beforeEach(() => {
      composable.startSession('test-drill', 60) // Target 60 WPM
    })

    it('should calculate progress score based on WPM and accuracy', async () => {
      // Set up metrics for score calculation
      composable.recordKeystroke('h', 'h', { line: 1, column: 1 })
      
      // Mock the metrics to known values
      composable.metrics.wpm = 60 // Meet target WPM
      composable.metrics.accuracy = 100 // Perfect accuracy
      
      await nextTick()

      // Should get high score: 50 (WPM) + 50 (accuracy) = 100
      expect(composable.progressScore.value).toBe(100)
    })

    it('should calculate partial progress score', async () => {
      composable.recordKeystroke('h', 'h', { line: 1, column: 1 })
      
      composable.metrics.wpm = 30 // Half target WPM
      composable.metrics.accuracy = 80 // 80% accuracy
      
      await nextTick()

      // Should get: 25 (half WPM) + 40 (80% accuracy) = 65
      expect(composable.progressScore.value).toBe(65)
    })

    it('should return 0 score with no session', () => {
      expect(composable.progressScore.value).toBe(0)
    })
  })

  describe('Performance Edge Cases', () => {
    beforeEach(() => {
      composable.startSession('test-drill', 60)
    })

    it('should handle rapid successive keystrokes', async () => {
      // Simulate very fast typing (paste-like)
      const startTime = mockTimestamp
      
      for (let i = 0; i < 50; i++) {
        mockTimestamp = startTime + i * 5 // 5ms intervals
        composable.recordKeystroke('a', 'a', { line: 1, column: i + 1 })
      }

      await nextTick()

      // Should handle without crashing
      expect(composable.currentSession.value.keystrokes).toHaveLength(50)
      expect(composable.metrics.wpm).toBeGreaterThanOrEqual(0)
    })

    it('should handle long pauses between keystrokes', async () => {
      mockTimestamp = 1000
      composable.recordKeystroke('h', 'h', { line: 1, column: 1 })
      
      // Long pause (30 seconds)
      mockTimestamp = 31000
      composable.recordKeystroke('e', 'e', { line: 1, column: 2 })

      await nextTick()

      // Should handle gracefully without extremely low WPM affecting other calculations
      expect(composable.metrics.wpm).toBeGreaterThanOrEqual(0)
      expect(composable.metrics.accuracy).toBe(100)
    })

    it('should handle special characters and unicode', async () => {
      const specialChars = ['@', '#', '€', '🚀', '\n', '\t']
      
      for (let i = 0; i < specialChars.length; i++) {
        mockTimestamp = 1000 + (i + 1) * 100
        composable.recordKeystroke(specialChars[i], specialChars[i], { line: 1, column: i + 1 })
      }

      await nextTick()

      expect(composable.currentSession.value.keystrokes).toHaveLength(6)
      expect(composable.metrics.accuracy).toBe(100)
    })
  })

  describe('Memory Management', () => {
    it('should handle large numbers of keystrokes efficiently', async () => {
      composable.startSession('endurance-test')
      
      // Simulate 1000 keystrokes
      for (let i = 0; i < 1000; i++) {
        mockTimestamp = 1000 + i * 10
        composable.recordKeystroke('a', 'a', { line: 1, column: i + 1 })
      }

      await nextTick()

      // Should still function correctly
      expect(composable.currentSession.value.keystrokes).toHaveLength(1000)
      expect(composable.metrics.accuracy).toBe(100)
      expect(composable.metrics.wpm).toBeGreaterThan(0)
    })

    it('should maintain performance with ring buffer', async () => {
      composable.startSession('performance-test')
      
      const startTime = performance.now()
      
      // Add many keystrokes to test ring buffer performance
      for (let i = 0; i < 2000; i++) {
        mockTimestamp = 1000 + i * 5
        composable.recordKeystroke('x', 'x', { line: 1, column: i + 1 })
      }

      const endTime = performance.now()
      const processingTime = endTime - startTime

      // Should process quickly (less than 100ms for 2000 keystrokes)
      expect(processingTime).toBeLessThan(100)
    })
  })
})