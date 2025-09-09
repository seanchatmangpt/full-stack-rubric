/**
 * @fileoverview Edge case and boundary condition tests
 * Tests extreme values, null/undefined handling, and system limits
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTypingMetrics } from '../../app/composables/useTypingMetrics.js'
import { AdaptiveDifficulty } from '../../app/utils/adaptiveDifficulty.js'
import { performanceUtils } from '../../app/utils/performanceOptimizer.js'

// Mock performance API for consistent testing
global.performance = {
  now: vi.fn(() => Date.now())
}

describe('Boundary Conditions and Edge Cases', () => {
  describe('Typing Metrics Edge Cases', () => {
    let typingMetrics

    beforeEach(() => {
      vi.clearAllTimers()
      vi.useFakeTimers()
      typingMetrics = useTypingMetrics()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    describe('Extreme Performance Values', () => {
      it('should handle zero WPM correctly', () => {
        typingMetrics.startSession('test')
        
        // No keystrokes recorded = 0 WPM
        vi.advanceTimersByTime(5000)
        
        expect(typingMetrics.metrics.wpm).toBe(0)
      })

      it('should handle extremely high WPM (paste detection)', () => {
        typingMetrics.startSession('test')
        
        // Simulate rapid keystrokes (paste-like behavior)
        const now = Date.now()
        performance.now.mockReturnValue(now)
        
        for (let i = 0; i < 100; i++) {
          typingMetrics.recordKeystroke('a', 'a', { line: 1, column: i + 1 })
          performance.now.mockReturnValue(now + i) // 1ms per keystroke
        }
        
        expect(typingMetrics.metrics.wpm).toBeLessThan(1000) // Should cap unrealistic values
      })

      it('should handle extreme accuracy values', () => {
        typingMetrics.startSession('test')
        
        // All correct keystrokes
        for (let i = 0; i < 50; i++) {
          typingMetrics.recordKeystroke('a', 'a', { line: 1, column: i + 1 })
        }
        
        expect(typingMetrics.metrics.accuracy).toBe(100)
        
        // Reset and test all incorrect
        typingMetrics.resetSession()
        typingMetrics.startSession('test')
        
        for (let i = 0; i < 50; i++) {
          typingMetrics.recordKeystroke('x', 'a', { line: 1, column: i + 1 })
        }
        
        expect(typingMetrics.metrics.accuracy).toBe(0)
      })

      it('should handle very long typing sessions', () => {
        typingMetrics.startSession('endurance-test')
        
        // Simulate 1 hour of typing
        const sessionDuration = 60 * 60 * 1000 // 1 hour in ms
        
        for (let i = 0; i < 10000; i++) {
          performance.now.mockReturnValue(Date.now() + (i * 360)) // 360ms per keystroke
          typingMetrics.recordKeystroke('a', 'a', { line: 1, column: i + 1 })
        }
        
        vi.advanceTimersByTime(sessionDuration)
        
        expect(typingMetrics.sessionDuration).toBeGreaterThan(sessionDuration - 1000)
        expect(typingMetrics.metrics.wpm).toBeGreaterThan(0)
      })

      it('should handle microsecond timing precision', () => {
        typingMetrics.startSession('precision-test')
        
        const baseTime = 1000000000 // Large timestamp
        performance.now.mockReturnValue(baseTime)
        
        typingMetrics.recordKeystroke('a', 'a', { line: 1, column: 1 })
        
        performance.now.mockReturnValue(baseTime + 0.1) // 0.1ms later
        typingMetrics.recordKeystroke('b', 'b', { line: 1, column: 2 })
        
        expect(typingMetrics.metrics.wpm).toBeTypeOf('number')
        expect(Number.isFinite(typingMetrics.metrics.wpm)).toBe(true)
      })
    })

    describe('Memory and Storage Limits', () => {
      it('should handle buffer overflow in keystroke history', () => {
        typingMetrics.startSession('memory-test')
        
        // Add more keystrokes than buffer size (1000)
        for (let i = 0; i < 1500; i++) {
          typingMetrics.recordKeystroke('a', 'a', { line: 1, column: i + 1 })
        }
        
        // Should not crash and should maintain reasonable memory usage
        expect(typingMetrics.metrics.wpm).toBeTypeOf('number')
        expect(Number.isFinite(typingMetrics.metrics.wpm)).toBe(true)
        expect(typingMetrics.currentSession.keystrokes.length).toBeLessThanOrEqual(1500)
      })

      it('should handle extremely large error pattern maps', () => {
        typingMetrics.startSession('error-test')
        
        // Generate many unique error patterns
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'
        for (let i = 0; i < chars.length; i++) {
          for (let j = 0; j < chars.length; j++) {
            if (i !== j) {
              typingMetrics.recordKeystroke(chars[i], chars[j], { line: 1, column: i * chars.length + j })
            }
          }
        }
        
        expect(typingMetrics.metrics.errorPatterns.size).toBeGreaterThan(0)
        expect(typingMetrics.metrics.errorPatterns.size).toBeLessThan(2000) // Should have reasonable limit
      })
    })

    describe('Null and Undefined Handling', () => {
      it('should handle null keystrokes gracefully', () => {
        typingMetrics.startSession('null-test')
        
        expect(() => {
          typingMetrics.recordKeystroke(null, 'a', { line: 1, column: 1 })
        }).not.toThrow()
        
        expect(() => {
          typingMetrics.recordKeystroke('a', null, { line: 1, column: 1 })
        }).not.toThrow()
      })

      it('should handle undefined position data', () => {
        typingMetrics.startSession('position-test')
        
        expect(() => {
          typingMetrics.recordKeystroke('a', 'a', undefined)
        }).not.toThrow()
        
        expect(() => {
          typingMetrics.recordKeystroke('a', 'a', null)
        }).not.toThrow()
      })

      it('should handle empty session data', () => {
        expect(() => {
          typingMetrics.endSession()
        }).not.toThrow()
        
        expect(typingMetrics.endSession()).toBe(null)
      })
    })

    describe('Concurrent Operations', () => {
      it('should handle rapid session start/stop cycles', () => {
        for (let i = 0; i < 100; i++) {
          typingMetrics.startSession(`test-${i}`)
          typingMetrics.recordKeystroke('a', 'a', { line: 1, column: 1 })
          typingMetrics.endSession()
        }
        
        expect(typingMetrics.isActive).toBe(false)
      })

      it('should handle pause/resume cycles', () => {
        typingMetrics.startSession('pause-test')
        
        for (let i = 0; i < 50; i++) {
          typingMetrics.recordKeystroke('a', 'a', { line: 1, column: i + 1 })
          typingMetrics.pauseSession()
          typingMetrics.resumeSession()
        }
        
        expect(typingMetrics.metrics.wpm).toBeTypeOf('number')
        expect(Number.isFinite(typingMetrics.metrics.wpm)).toBe(true)
      })
    })
  })

  describe('Adaptive Difficulty Edge Cases', () => {
    let difficulty

    beforeEach(() => {
      difficulty = new AdaptiveDifficulty()
    })

    describe('Extreme Performance Scenarios', () => {
      const createSession = (wpm, accuracy, errors = []) => ({
        drillType: 'beginner-1',
        finalWPM: wpm,
        accuracy: { raw: accuracy },
        keystrokes: [
          ...Array(Math.max(1, Math.floor(wpm / 10))).fill().map(() => ({ 
            key: 'a', expected: 'a', isCorrect: true 
          })),
          ...errors.map(([key, expected]) => ({ key, expected, isCorrect: false }))
        ]
      })

      it('should handle zero WPM sessions', () => {
        for (let i = 0; i < 5; i++) {
          difficulty.addSession(createSession(0, 0))
        }
        
        const nextLevel = difficulty.calculateNextDifficulty()
        expect(nextLevel.id).toBe('beginner-1') // Should stay at easiest level
      })

      it('should handle unrealistically high WPM', () => {
        for (let i = 0; i < 5; i++) {
          difficulty.addSession(createSession(1000, 100)) // Unrealistic but valid input
        }
        
        const nextLevel = difficulty.calculateNextDifficulty()
        expect(nextLevel).toBeDefined()
      })

      it('should handle negative accuracy values', () => {
        for (let i = 0; i < 5; i++) {
          difficulty.addSession({
            drillType: 'beginner-1',
            finalWPM: 40,
            accuracy: { raw: -10 }, // Invalid but possible due to calculation errors
            keystrokes: []
          })
        }
        
        expect(() => difficulty.calculateNextDifficulty()).not.toThrow()
      })

      it('should handle accuracy over 100%', () => {
        for (let i = 0; i < 5; i++) {
          difficulty.addSession({
            drillType: 'beginner-1',
            finalWPM: 40,
            accuracy: { raw: 110 }, // Over 100% due to calculation edge case
            keystrokes: []
          })
        }
        
        const recommendations = difficulty.getRecommendations()
        expect(recommendations).toBeDefined()
        expect(Array.isArray(recommendations)).toBe(true)
      })
    })

    describe('Data Structure Limits', () => {
      it('should handle history overflow correctly', () => {
        // Add 100 sessions (exceeds 50 limit)
        for (let i = 0; i < 100; i++) {
          difficulty.addSession({
            id: i,
            drillType: 'beginner-1',
            finalWPM: 40 + Math.random() * 20,
            accuracy: { raw: 90 + Math.random() * 10 },
            keystrokes: []
          })
        }
        
        expect(difficulty.history.length).toBe(50)
        expect(difficulty.history[0].id).toBe(50) // Should keep most recent
        expect(difficulty.history[49].id).toBe(99)
      })

      it('should handle sessions with massive keystroke arrays', () => {
        const largeSession = {
          drillType: 'beginner-1',
          finalWPM: 60,
          accuracy: { raw: 95 },
          keystrokes: Array(10000).fill().map((_, i) => ({
            key: String.fromCharCode(97 + (i % 26)),
            expected: String.fromCharCode(97 + (i % 26)),
            isCorrect: Math.random() > 0.1
          }))
        }
        
        difficulty.addSession(largeSession)
        
        expect(() => difficulty.analyzeRecentPerformance([largeSession])).not.toThrow()
      })

      it('should handle empty and malformed sessions', () => {
        const problematicSessions = [
          null,
          undefined,
          {},
          { drillType: 'test' }, // Missing required fields
          { finalWPM: 'invalid' }, // Invalid data types
          { keystrokes: null },
          { accuracy: null }
        ]
        
        problematicSessions.forEach((session) => {
          expect(() => difficulty.addSession(session)).not.toThrow()
        })
        
        expect(() => difficulty.calculateNextDifficulty()).not.toThrow()
      })
    })

    describe('Text Generation Edge Cases', () => {
      it('should handle generation with no patterns', () => {
        const emptyPatterns = new Map()
        const text = difficulty.generateAdaptiveText(
          { metrics: { textComplexity: 1, conceptualLoad: 1 } },
          emptyPatterns
        )
        
        expect(typeof text).toBe('string')
        expect(text.length).toBeGreaterThan(0)
      })

      it('should handle extreme complexity values', () => {
        const extremeLevel = {
          metrics: {
            textComplexity: 1000,
            conceptualLoad: 1000,
            keyboardDensity: 1000,
            timeConstraint: 1000
          }
        }
        
        const text = difficulty.generateAdaptiveText(extremeLevel)
        expect(typeof text).toBe('string')
      })

      it('should handle Unicode and special characters in patterns', () => {
        const unicodePatterns = new Map([
          ['→→→', 5],
          ['中文测试', 3],
          ['🚀🎉💻', 2]
        ])
        
        const text = difficulty.generateAdaptiveText(
          { metrics: { textComplexity: 5, conceptualLoad: 5 } },
          unicodePatterns
        )
        
        expect(text).toContain('→→→')
      })
    })
  })

  describe('Performance Optimizer Edge Cases', () => {
    describe('Debounce and Throttle Limits', () => {
      it('should handle extremely short delays', () => {
        vi.useFakeTimers()
        
        const fn = vi.fn()
        const debouncedFn = performanceUtils.debounce(fn, 0.1) // Sub-millisecond delay
        
        debouncedFn()
        vi.advanceTimersByTime(1)
        
        expect(fn).toHaveBeenCalled()
        vi.useRealTimers()
      })

      it('should handle extremely long delays', () => {
        vi.useFakeTimers()
        
        const fn = vi.fn()
        const debouncedFn = performanceUtils.debounce(fn, Number.MAX_SAFE_INTEGER)
        
        debouncedFn()
        vi.advanceTimersByTime(1000)
        
        expect(fn).not.toHaveBeenCalled() // Should still be waiting
        vi.useRealTimers()
      })

      it('should handle negative delays', () => {
        const fn = vi.fn()
        const debouncedFn = performanceUtils.debounce(fn, -100)
        
        expect(() => debouncedFn()).not.toThrow()
      })
    })

    describe('Memory and Resource Limits', () => {
      it('should handle preloading many resources simultaneously', async () => {
        const promises = []
        
        for (let i = 0; i < 100; i++) {
          promises.push(performanceUtils.preloadResource(`/resource-${i}.js`))
        }
        
        // Should not crash or cause memory issues
        const results = await Promise.allSettled(promises)
        expect(results.length).toBe(100)
      })

      it('should handle preloading very large URLs', async () => {
        const largeUrl = '/very-long-url-' + 'a'.repeat(2000) + '.js'
        
        await expect(performanceUtils.preloadResource(largeUrl)).resolves.not.toThrow()
      })

      it('should handle preloading invalid URLs', async () => {
        const invalidUrls = [
          '',
          null,
          undefined,
          'not-a-url',
          'javascript:alert(1)', // Potentially dangerous
          'data:text/plain;base64,SGVsbG8gV29ybGQ=' // Data URL
        ]
        
        for (const url of invalidUrls) {
          await expect(performanceUtils.preloadResource(url)).resolves.not.toThrow()
        }
      })
    })

    describe('Function Parameter Edge Cases', () => {
      it('should handle null/undefined functions in debounce', () => {
        expect(() => performanceUtils.debounce(null, 100)).not.toThrow()
        expect(() => performanceUtils.debounce(undefined, 100)).not.toThrow()
      })

      it('should handle non-function parameters', () => {
        expect(() => performanceUtils.debounce('not-a-function', 100)).not.toThrow()
        expect(() => performanceUtils.debounce(123, 100)).not.toThrow()
        expect(() => performanceUtils.debounce({}, 100)).not.toThrow()
      })

      it('should handle extreme argument counts', () => {
        const fn = vi.fn()
        const debouncedFn = performanceUtils.debounce(fn, 100)
        
        // Call with many arguments
        const manyArgs = Array(1000).fill().map((_, i) => i)
        
        expect(() => debouncedFn(...manyArgs)).not.toThrow()
      })
    })
  })

  describe('System Integration Edge Cases', () => {
    describe('Browser API Compatibility', () => {
      it('should handle missing performance.now', () => {
        const originalPerformance = global.performance
        global.performance = {}
        
        const typingMetrics = useTypingMetrics()
        typingMetrics.startSession('compatibility-test')
        
        expect(() => {
          typingMetrics.recordKeystroke('a', 'a', { line: 1, column: 1 })
        }).not.toThrow()
        
        global.performance = originalPerformance
      })

      it('should handle missing performance.memory', () => {
        const originalMemory = global.performance?.memory
        if (global.performance) {
          delete global.performance.memory
        }
        
        expect(() => {
          // Any operation that might use performance.memory
          const typingMetrics = useTypingMetrics()
          typingMetrics.startSession('memory-test')
        }).not.toThrow()
        
        if (global.performance && originalMemory) {
          global.performance.memory = originalMemory
        }
      })

      it('should handle clock adjustments and time anomalies', () => {
        const typingMetrics = useTypingMetrics()
        typingMetrics.startSession('time-test')
        
        // Simulate system clock going backwards
        let timeValue = Date.now()
        performance.now.mockImplementation(() => {
          timeValue -= 1000 // Clock goes backward
          return timeValue
        })
        
        expect(() => {
          typingMetrics.recordKeystroke('a', 'a', { line: 1, column: 1 })
          typingMetrics.recordKeystroke('b', 'b', { line: 1, column: 2 })
        }).not.toThrow()
      })
    })

    describe('Concurrent User Interactions', () => {
      it('should handle simultaneous typing and difficulty adjustments', () => {
        const typingMetrics = useTypingMetrics()
        const difficulty = new AdaptiveDifficulty()
        
        typingMetrics.startSession('concurrent-test')
        
        // Simulate user typing while difficulty is being calculated
        for (let i = 0; i < 20; i++) {
          typingMetrics.recordKeystroke('a', 'a', { line: 1, column: i + 1 })
          
          // Difficulty calculation during typing
          difficulty.addSession({
            drillType: 'test',
            finalWPM: Math.random() * 100,
            accuracy: { raw: Math.random() * 100 },
            keystrokes: []
          })
          difficulty.updateCurrentLevel()
        }
        
        expect(typingMetrics.metrics.wpm).toBeTypeOf('number')
        expect(Number.isFinite(typingMetrics.metrics.wpm)).toBe(true)
        expect(difficulty.getCurrentLevel()).toBeDefined()
      })
    })
  })
})
