/**
 * @fileoverview Unit tests for useTypingMetrics composable using London School TDD
 * Focus on behavior verification, state management, and performance calculations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTypingMetrics } from '@/composables/useTypingMetrics'
import { nextTick } from 'vue'

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now())
  }
})

describe('useTypingMetrics Composable - London School TDD', () => {
  let typingMetrics
  let mockDateNow
  
  beforeEach(() => {
    // Mock Date.now for consistent timing
    mockDateNow = vi.spyOn(Date, 'now')
    mockDateNow.mockReturnValue(1000000) // Fixed timestamp
    
    // Create fresh instance
    typingMetrics = useTypingMetrics()
    
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    mockDateNow.mockRestore()
  })

  describe('Initial State Behavior', () => {
    it('should initialize with correct default state', () => {
      // Verify initial state collaboration
      expect(typingMetrics.currentSession.value).toBeNull()
      expect(typingMetrics.isActive.value).toBe(false)
      expect(typingMetrics.metrics.wpm).toBe(0)
      expect(typingMetrics.metrics.accuracy).toBe(0)
      expect(typingMetrics.metrics.consistency).toBe(0)
      expect(typingMetrics.metrics.errorPatterns).toBeInstanceOf(Map)
      expect(typingMetrics.metrics.errorPatterns.size).toBe(0)
    })

    it('should provide readonly access to state properties', () => {
      // Verify state encapsulation behavior
      expect(() => {
        typingMetrics.currentSession.value = { id: 'test' }
      }).toThrow()
      
      expect(() => {
        typingMetrics.isActive.value = true
      }).toThrow()
      
      expect(() => {
        typingMetrics.metrics.wpm = 100
      }).toThrow()
    })
  })

  describe('Session Management Behavior', () => {
    it('should create session with correct collaboration pattern', () => {
      const drillType = 'function-names'
      const targetWPM = 60
      
      typingMetrics.startSession(drillType, targetWPM)
      
      // Verify session creation collaboration
      const session = typingMetrics.currentSession.value
      expect(session).not.toBeNull()
      expect(session.id).toMatch(/^session_\d+_[a-z0-9]{9}$/)
      expect(session.drillType).toBe(drillType)
      expect(session.targetWPM).toBe(targetWPM)
      expect(session.startTime).toBe(1000000)
      expect(session.finalWPM).toBe(0)
      expect(session.keystrokes).toEqual([])
      expect(typingMetrics.isActive.value).toBe(true)
    })

    it('should end session and return completed session data', () => {
      // Setup active session
      typingMetrics.startSession('test-drill', 50)
      
      // Mock some typing activity
      mockDateNow.mockReturnValue(1005000) // 5 seconds later
      typingMetrics.recordKeystroke('h', 'h', { line: 1, column: 1 })
      
      const completedSession = typingMetrics.endSession()
      
      // Verify session completion behavior
      expect(completedSession).not.toBeNull()
      expect(completedSession.endTime).toBe(1005000)
      expect(completedSession.finalWPM).toBe(typingMetrics.metrics.wpm)
      expect(completedSession.accuracy).toEqual(expect.objectContaining({
        raw: expect.any(Number),
        adjusted: expect.any(Number),
        errorRate: expect.any(Number),
        correctionRatio: expect.any(Number)
      }))
      
      // Verify state reset
      expect(typingMetrics.currentSession.value).toBeNull()
      expect(typingMetrics.isActive.value).toBe(false)
    })

    it('should handle pause and resume session workflow', () => {
      typingMetrics.startSession('test-drill', 50)
      expect(typingMetrics.isActive.value).toBe(true)
      
      // Pause session
      typingMetrics.pauseSession()
      expect(typingMetrics.isActive.value).toBe(false)
      expect(typingMetrics.currentSession.value).not.toBeNull() // Session persists
      
      // Resume session
      mockDateNow.mockReturnValue(1002000) // 2 seconds later
      typingMetrics.resumeSession()
      expect(typingMetrics.isActive.value).toBe(true)
    })

    it('should reset all session data and metrics', () => {
      // Setup session with some data
      typingMetrics.startSession('test-drill', 50)
      typingMetrics.recordKeystroke('t', 't', { line: 1, column: 1 })
      
      // Reset session
      typingMetrics.resetSession()
      
      // Verify complete reset
      expect(typingMetrics.currentSession.value).toBeNull()
      expect(typingMetrics.isActive.value).toBe(false)
      expect(typingMetrics.metrics.wpm).toBe(0)
      expect(typingMetrics.metrics.accuracy).toBe(0)
      expect(typingMetrics.metrics.consistency).toBe(0)
      expect(typingMetrics.metrics.errorPatterns.size).toBe(0)
    })
  })

  describe('Keystroke Recording and Processing', () => {
    beforeEach(() => {
      typingMetrics.startSession('test-drill', 50)
    })

    it('should record correct keystrokes and update metrics', () => {
      const key = 'h'
      const expected = 'h'
      const position = { line: 1, column: 1 }
      
      mockDateNow.mockReturnValue(1001000) // 1 second later
      typingMetrics.recordKeystroke(key, expected, position)
      
      // Verify keystroke recording behavior
      const session = typingMetrics.currentSession.value
      expect(session.keystrokes).toHaveLength(1)
      
      const keystroke = session.keystrokes[0]
      expect(keystroke).toEqual({
        timestamp: 1001000,
        key,
        expected,
        isCorrect: true,
        timeDelta: 1000,
        position
      })
    })

    it('should record incorrect keystrokes and track error patterns', async () => {
      // Record incorrect keystroke
      typingMetrics.recordKeystroke('y', 't', { line: 1, column: 1 })
      
      // Wait for metrics update (debounced)
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Verify error tracking behavior
      expect(typingMetrics.metrics.errorPatterns.has('t->y')).toBe(true)
      expect(typingMetrics.metrics.errorPatterns.get('t->y')).toBe(1)
    })

    it('should not record keystrokes when session is inactive', () => {
      typingMetrics.pauseSession()
      
      typingMetrics.recordKeystroke('x', 'x', { line: 1, column: 1 })
      
      // Verify no recording when inactive
      const session = typingMetrics.currentSession.value
      expect(session.keystrokes).toHaveLength(0)
    })

    it('should calculate typing metrics correctly', async () => {
      // Simulate typing sequence
      const words = ['hello', ' ', 'world']
      let timestamp = 1001000
      
      for (const word of words) {
        for (const char of word) {
          mockDateNow.mockReturnValue(timestamp)
          typingMetrics.recordKeystroke(char, char, { line: 1, column: 1 })
          timestamp += 200 // 200ms between keystrokes
        }
      }
      
      // Wait for metrics calculation
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Verify WPM calculation behavior
      expect(typingMetrics.metrics.wpm).toBeGreaterThan(0)
      expect(typingMetrics.metrics.accuracy).toBe(100) // All correct
      expect(typingMetrics.metrics.consistency).toBeGreaterThan(0)
    })
  })

  describe('Performance Calculations', () => {
    it('should calculate WPM based on keystroke timing', async () => {
      typingMetrics.startSession('test-drill', 50)
      
      // Type 10 characters in 2 seconds (should be ~60 WPM)
      const chars = 'hello test'
      let timestamp = 1001000
      
      for (const char of chars) {
        mockDateNow.mockReturnValue(timestamp)
        typingMetrics.recordKeystroke(char, char, { line: 1, column: 1 })
        timestamp += 200 // 200ms per keystroke
      }
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Verify WPM calculation (10 chars / 5 avg = 2 words, in 2 seconds = 60 WPM)
      expect(typingMetrics.metrics.wpm).toBeGreaterThan(0)
      expect(typingMetrics.metrics.wpm).toBeLessThan(200) // Reasonable upper bound
    })

    it('should calculate accuracy with error handling', async () => {
      typingMetrics.startSession('test-drill', 50)
      
      // Mix of correct and incorrect keystrokes
      const keystrokes = [
        { key: 'h', expected: 'h' }, // correct
        { key: 'e', expected: 'e' }, // correct
        { key: 'y', expected: 'l' }, // incorrect
        { key: 'l', expected: 'l' }, // correct
        { key: 'o', expected: 'o' } // correct
      ]
      
      keystrokes.forEach((ks, index) => {
        mockDateNow.mockReturnValue(1001000 + index * 200)
        typingMetrics.recordKeystroke(ks.key, ks.expected, { line: 1, column: 1 })
      })
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Verify accuracy calculation (4/5 = 80%)
      expect(typingMetrics.metrics.accuracy).toBe(80)
    })

    it('should calculate consistency based on keystroke timing variance', async () => {
      typingMetrics.startSession('test-drill', 50)
      
      // Consistent timing (should have high consistency)
      const chars = 'abcdef'
      let timestamp = 1001000
      
      for (const char of chars) {
        mockDateNow.mockReturnValue(timestamp)
        typingMetrics.recordKeystroke(char, char, { line: 1, column: 1 })
        timestamp += 200 // Consistent 200ms interval
      }
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Verify high consistency for regular timing
      expect(typingMetrics.metrics.consistency).toBeGreaterThan(50)
    })
  })

  describe('Computed Properties Behavior', () => {
    it('should calculate session duration correctly', () => {
      const startTime = 1000000
      mockDateNow.mockReturnValue(startTime)
      
      typingMetrics.startSession('test-drill', 50)
      
      // Advance time
      mockDateNow.mockReturnValue(startTime + 5000) // 5 seconds later
      
      // Duration should be calculated from start time
      expect(typingMetrics.sessionDuration.value).toBe(5000)
    })

    it('should calculate progress score based on WPM and accuracy', async () => {
      typingMetrics.startSession('test-drill', 60) // Target 60 WPM
      
      // Simulate good performance
      const chars = 'hello world test'
      let timestamp = 1001000
      
      for (const char of chars) {
        mockDateNow.mockReturnValue(timestamp)
        typingMetrics.recordKeystroke(char, char, { line: 1, column: 1 })
        timestamp += 100 // Fast typing
      }
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Progress score should be based on WPM achievement and accuracy
      const progressScore = typingMetrics.progressScore.value
      expect(progressScore).toBeGreaterThan(0)
      expect(progressScore).toBeLessThanOrEqual(100)
    })

    it('should return zero duration when session is not active', () => {
      // No active session
      expect(typingMetrics.sessionDuration.value).toBe(0)
      
      // Paused session
      typingMetrics.startSession('test-drill', 50)
      typingMetrics.pauseSession()
      expect(typingMetrics.sessionDuration.value).toBe(0)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle end session when no active session exists', () => {
      const result = typingMetrics.endSession()
      expect(result).toBeNull()
    })

    it('should handle resume session when no session exists', () => {
      typingMetrics.resumeSession()
      expect(typingMetrics.isActive.value).toBe(false)
    })

    it('should handle very fast keystroke sequences', async () => {
      typingMetrics.startSession('test-drill', 50)
      
      // Very fast typing (potential paste detection)
      const chars = 'veryfast'
      let timestamp = 1001000
      
      for (const char of chars) {
        mockDateNow.mockReturnValue(timestamp)
        typingMetrics.recordKeystroke(char, char, { line: 1, column: 1 })
        timestamp += 5 // Very fast - 5ms between keystrokes
      }
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Should still calculate metrics without errors
      expect(typeof typingMetrics.metrics.wpm).toBe('number')
      expect(typeof typingMetrics.metrics.accuracy).toBe('number')
    })

    it('should handle backspace and correction patterns', async () => {
      typingMetrics.startSession('test-drill', 50)
      
      // Type, make error, backspace, correct
      mockDateNow.mockReturnValue(1001000)
      typingMetrics.recordKeystroke('h', 'h', { line: 1, column: 1 })
      
      mockDateNow.mockReturnValue(1001200)
      typingMetrics.recordKeystroke('x', 'e', { line: 1, column: 2 }) // Error
      
      mockDateNow.mockReturnValue(1001400)
      typingMetrics.recordKeystroke('Backspace', '', { line: 1, column: 2 }) // Correction
      
      mockDateNow.mockReturnValue(1001600)
      typingMetrics.recordKeystroke('e', 'e', { line: 1, column: 2 }) // Correct
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Should track error patterns and corrections
      expect(typingMetrics.metrics.errorPatterns.has('e->x')).toBe(true)
    })
  })

  describe('Performance Ring Buffer Behavior', () => {
    it('should maintain performance with large keystroke volumes', async () => {
      typingMetrics.startSession('test-drill', 50)
      
      // Simulate large volume of keystrokes
      const chars = 'abcdefghijklmnopqrstuvwxyz'.repeat(20) // 520 characters
      let timestamp = 1001000
      
      for (const char of chars) {
        mockDateNow.mockReturnValue(timestamp)
        typingMetrics.recordKeystroke(char, char, { line: 1, column: 1 })
        timestamp += 50
      }
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Should still calculate metrics efficiently
      expect(typingMetrics.metrics.wpm).toBeGreaterThan(0)
      expect(typingMetrics.metrics.accuracy).toBe(100)
      
      // Session should contain all keystrokes
      const session = typingMetrics.currentSession.value
      expect(session.keystrokes).toHaveLength(520)
    })
  })

  describe('Memory Management', () => {
    it('should properly clean up resources on reset', () => {
      typingMetrics.startSession('test-drill', 50)
      
      // Add some data
      typingMetrics.recordKeystroke('t', 't', { line: 1, column: 1 })
      typingMetrics.recordKeystroke('e', 'x', { line: 1, column: 2 }) // Error
      
      // Reset should clear all data
      typingMetrics.resetSession()
      
      expect(typingMetrics.currentSession.value).toBeNull()
      expect(typingMetrics.metrics.errorPatterns.size).toBe(0)
      expect(typingMetrics.isActive.value).toBe(false)
    })
  })
})
