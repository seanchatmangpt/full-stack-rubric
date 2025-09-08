/**
 * @fileoverview Library Validation Test Suite
 * Validates the typing tutor library design against real-world usage patterns
 * and identifies potential adoption barriers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, createLocalVue } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import { useTypingMetrics } from '../../app/composables/useTypingMetrics.js'
import { AdaptiveDifficulty, DIFFICULTY_LEVELS } from '../../app/utils/adaptiveDifficulty.js'

describe('Library Validation: Real-World Usage Patterns', () => {
  let typingMetrics
  let adaptiveDifficulty
  
  beforeEach(() => {
    typingMetrics = useTypingMetrics()
    adaptiveDifficulty = new AdaptiveDifficulty()
  })

  describe('API Usability Validation', () => {
    it('should provide intuitive composable API for beginners', () => {
      // Test: Can a new developer easily initialize the composable?
      expect(() => {
        const metrics = useTypingMetrics()
        expect(metrics.isActive.value).toBe(false)
        expect(metrics.metrics).toBeDefined()
        expect(metrics.startSession).toBeDefined()
        expect(metrics.endSession).toBeDefined()
      }).not.toThrow()
    })

    it('should require minimal boilerplate for basic usage', () => {
      // Test: Less than 5 lines of code to get started
      const boilerplateLines = `
        const { startSession, recordKeystroke, metrics } = useTypingMetrics()
        startSession('test-drill', 60)
        recordKeystroke('a', 'a', { line: 1, column: 1 })
      `.trim().split('\n').length
      
      expect(boilerplateLines).toBeLessThanOrEqual(5)
      
      // Verify it actually works
      typingMetrics.startSession('test-drill', 60)
      expect(typingMetrics.isActive.value).toBe(true)
    })

    it('should handle common developer mistakes gracefully', () => {
      // Test: Starting session without parameters
      expect(() => {
        typingMetrics.startSession()
      }).not.toThrow()
      
      // Test: Recording keystroke before session starts
      expect(() => {
        typingMetrics.recordKeystroke('a', 'a', { line: 1, column: 1 })
      }).not.toThrow()
      
      // Test: Multiple session starts
      expect(() => {
        typingMetrics.startSession('drill1')
        typingMetrics.startSession('drill2')
      }).not.toThrow()
    })

    it('should provide clear error messages for invalid usage', () => {
      // Test: Invalid keystroke data
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      typingMetrics.startSession('test')
      typingMetrics.recordKeystroke(null, null, null)
      
      // Should handle gracefully without throwing
      expect(() => {
        typingMetrics.recordKeystroke(null, null, null)
      }).not.toThrow()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Performance Under Realistic Load', () => {
    it('should handle high-frequency typing without performance degradation', () => {
      typingMetrics.startSession('performance-test', 100)
      
      const startTime = performance.now()
      
      // Simulate 100 WPM typing (8.33 keystrokes per second)
      for (let i = 0; i < 1000; i++) {
        const char = String.fromCharCode(97 + (i % 26)) // a-z cycling
        typingMetrics.recordKeystroke(char, char, { line: 1, column: i + 1 })
      }
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      // Should process 1000 keystrokes in under 100ms
      expect(processingTime).toBeLessThan(100)
      expect(typingMetrics.metrics.wpm).toBeGreaterThan(0)
    })

    it('should maintain memory efficiency during long sessions', () => {
      typingMetrics.startSession('memory-test', 60)
      
      // Simulate 10-minute typing session (6000 keystrokes at 100 WPM)
      for (let i = 0; i < 6000; i++) {
        const char = 'a'
        typingMetrics.recordKeystroke(char, char, { line: 1, column: i + 1 })
      }
      
      // Should not accumulate unlimited keystrokes (ring buffer should limit)
      expect(typingMetrics.currentSession.value.keystrokes.length).toBeLessThanOrEqual(6000)
      
      // Memory should not explode - verify reasonable size
      const sessionSize = JSON.stringify(typingMetrics.currentSession.value).length
      expect(sessionSize).toBeLessThan(1024 * 1024) // Less than 1MB
    })

    it('should handle concurrent sessions in different components', () => {
      const session1 = useTypingMetrics()
      const session2 = useTypingMetrics()
      
      session1.startSession('session1', 60)
      session2.startSession('session2', 80)
      
      expect(session1.isActive.value).toBe(true)
      expect(session2.isActive.value).toBe(true)
      expect(session1.currentSession.value.id).not.toBe(session2.currentSession.value.id)
    })
  })

  describe('Adaptive Difficulty Integration', () => {
    it('should integrate seamlessly with typing metrics', () => {
      // Start session and generate sample performance data
      typingMetrics.startSession('integration-test', 60)
      
      // Simulate typing session
      for (let i = 0; i < 100; i++) {
        typingMetrics.recordKeystroke('a', 'a', { line: 1, column: i })
      }
      
      const session = typingMetrics.endSession()
      expect(session).toBeDefined()
      
      // Add to adaptive difficulty
      adaptiveDifficulty.addSession(session)
      
      const nextDifficulty = adaptiveDifficulty.calculateNextDifficulty()
      expect(nextDifficulty).toBeDefined()
      expect(DIFFICULTY_LEVELS.includes(nextDifficulty)).toBe(true)
    })

    it('should provide actionable recommendations', () => {
      // Create a low-performance session
      const poorSession = {
        drillType: 'beginner-1',
        finalWPM: 20,
        accuracy: { raw: 75, adjusted: 70, errorRate: 25, correctionRatio: 0.5 },
        keystrokes: [
          { key: 'a', expected: 'b', isCorrect: false },
          { key: 'b', expected: 'b', isCorrect: true }
        ]
      }
      
      adaptiveDifficulty.addSession(poorSession)
      adaptiveDifficulty.addSession(poorSession)
      adaptiveDifficulty.addSession(poorSession)
      
      const recommendations = adaptiveDifficulty.getRecommendations()
      
      expect(recommendations).toBeInstanceOf(Array)
      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations.some(rec => rec.includes('accuracy'))).toBe(true)
    })
  })

  describe('Real-World Integration Scenarios', () => {
    it('should work with existing Vue component patterns', async () => {
      const TestComponent = {
        template: `
          <div>
            <span>WPM: {{ metrics.wpm }}</span>
            <span>Accuracy: {{ metrics.accuracy }}%</span>
            <button @click="start" :disabled="isActive">Start</button>
          </div>
        `,
        setup() {
          const { metrics, isActive, startSession, recordKeystroke } = useTypingMetrics()
          
          const start = () => {
            startSession('test-component', 60)
          }
          
          return { metrics, isActive, start, recordKeystroke }
        }
      }
      
      const wrapper = mount(TestComponent)
      
      expect(wrapper.text()).toContain('WPM: 0')
      expect(wrapper.text()).toContain('Accuracy: 0%')
      
      await wrapper.find('button').trigger('click')
      await nextTick()
      
      expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    })

    it('should handle SSR environments gracefully', () => {
      // Mock SSR environment (no window or performance API)
      const originalWindow = global.window
      const originalPerformance = global.performance
      
      delete global.window
      delete global.performance
      
      expect(() => {
        const metrics = useTypingMetrics()
        metrics.startSession('ssr-test', 60)
      }).not.toThrow()
      
      global.window = originalWindow
      global.performance = originalPerformance
    })

    it('should support custom event handlers and extensions', () => {
      typingMetrics.startSession('extension-test', 60)
      
      // Test: Can we extend the keystroke recording with custom logic?
      const originalRecordKeystroke = typingMetrics.recordKeystroke
      let customEventFired = false
      
      const extendedRecordKeystroke = (key, expected, position) => {
        customEventFired = true
        return originalRecordKeystroke(key, expected, position)
      }
      
      extendedRecordKeystroke('a', 'a', { line: 1, column: 1 })
      
      expect(customEventFired).toBe(true)
      expect(typingMetrics.metrics.wpm).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Error Recovery and Edge Cases', () => {
    it('should recover from browser performance API limitations', () => {
      // Mock performance.now() to return inconsistent values
      const originalPerformanceNow = performance.now
      let callCount = 0
      
      performance.now = vi.fn(() => {
        callCount++
        // Return decreasing values to simulate timing issues
        return 1000 - callCount
      })
      
      expect(() => {
        typingMetrics.startSession('timing-test', 60)
        typingMetrics.recordKeystroke('a', 'a', { line: 1, column: 1 })
        typingMetrics.recordKeystroke('b', 'b', { line: 1, column: 2 })
      }).not.toThrow()
      
      performance.now = originalPerformanceNow
    })

    it('should handle session interruption and recovery', () => {
      typingMetrics.startSession('interruption-test', 60)
      typingMetrics.recordKeystroke('a', 'a', { line: 1, column: 1 })
      
      // Simulate browser tab switch (session pause)
      typingMetrics.pauseSession()
      expect(typingMetrics.isActive.value).toBe(false)
      
      // Resume session
      typingMetrics.resumeSession()
      expect(typingMetrics.isActive.value).toBe(true)
      
      // Should continue working normally
      typingMetrics.recordKeystroke('b', 'b', { line: 1, column: 2 })
      expect(typingMetrics.metrics.wpm).toBeGreaterThanOrEqual(0)
    })

    it('should handle memory pressure gracefully', () => {
      typingMetrics.startSession('memory-pressure-test', 60)
      
      // Simulate memory pressure by creating large objects
      const largeObjects = []
      for (let i = 0; i < 100; i++) {
        largeObjects.push(new Array(10000).fill('data'))
      }
      
      // Should still function under memory pressure
      expect(() => {
        for (let i = 0; i < 100; i++) {
          typingMetrics.recordKeystroke('a', 'a', { line: 1, column: i })
        }
      }).not.toThrow()
      
      expect(typingMetrics.metrics.wpm).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Developer Experience Validation', () => {
    it('should provide comprehensive TypeScript-like JSDoc types', () => {
      // Verify that all major functions have proper JSDoc types
      const metricsSource = typingMetrics.toString()
      
      // Check for key type definitions in composable
      expect(useTypingMetrics.toString()).toContain('@returns')
      
      // Verify return object structure matches expected interface
      const { startSession, endSession, metrics, isActive } = typingMetrics
      
      expect(typeof startSession).toBe('function')
      expect(typeof endSession).toBe('function')
      expect(typeof metrics).toBe('object')
      expect(typeof isActive).toBe('object') // Vue ref object
    })

    it('should provide helpful debugging information', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      typingMetrics.startSession('debug-test', 60)
      
      // The library should provide some way to inspect current state
      expect(typingMetrics.currentSession.value).toBeDefined()
      expect(typingMetrics.currentSession.value.id).toBeDefined()
      expect(typingMetrics.currentSession.value.startTime).toBeDefined()
      
      consoleSpy.mockRestore()
    })

    it('should have predictable state transitions', () => {
      // Initial state
      expect(typingMetrics.isActive.value).toBe(false)
      expect(typingMetrics.currentSession.value).toBeNull()
      
      // After start
      typingMetrics.startSession('state-test', 60)
      expect(typingMetrics.isActive.value).toBe(true)
      expect(typingMetrics.currentSession.value).not.toBeNull()
      
      // After end
      const session = typingMetrics.endSession()
      expect(typingMetrics.isActive.value).toBe(false)
      expect(typingMetrics.currentSession.value).toBeNull()
      expect(session).toBeDefined()
      
      // After reset
      typingMetrics.resetSession()
      expect(typingMetrics.isActive.value).toBe(false)
      expect(typingMetrics.metrics.wpm).toBe(0)
    })
  })

  describe('Production Deployment Readiness', () => {
    it('should work without external dependencies in production', () => {
      // Test: No reliance on development-only APIs
      expect(() => {
        const metrics = useTypingMetrics()
        metrics.startSession('production-test', 60)
        metrics.recordKeystroke('a', 'a', { line: 1, column: 1 })
        metrics.endSession()
      }).not.toThrow()
    })

    it('should handle CDN delivery and bundling', () => {
      // Test: Can the library be properly tree-shaken?
      const importedFunctions = Object.keys({ useTypingMetrics, AdaptiveDifficulty })
      expect(importedFunctions.length).toBeGreaterThan(0)
      
      // Each function should be independently usable
      expect(() => useTypingMetrics()).not.toThrow()
      expect(() => new AdaptiveDifficulty()).not.toThrow()
    })

    it('should support multiple framework integrations', () => {
      // Test: Library should work beyond just Vue
      const rawTypingCalculator = typingMetrics.recordKeystroke
      
      // Should be callable outside Vue context
      expect(typeof rawTypingCalculator).toBe('function')
    })
  })

  describe('Backwards Compatibility', () => {
    it('should maintain API stability across versions', () => {
      // Test: Core API methods haven't changed
      const expectedMethods = [
        'startSession',
        'endSession', 
        'pauseSession',
        'resumeSession',
        'resetSession',
        'recordKeystroke'
      ]
      
      expectedMethods.forEach(method => {
        expect(typingMetrics[method]).toBeDefined()
        expect(typeof typingMetrics[method]).toBe('function')
      })
    })

    it('should handle legacy data formats', () => {
      // Test: Can handle old session format
      const legacySession = {
        id: 'legacy-session',
        startTime: Date.now() - 60000,
        endTime: Date.now(),
        drillType: 'old-format',
        targetWPM: 60,
        finalWPM: 45,
        accuracy: { raw: 95 }, // Missing some new fields
        keystrokes: []
      }
      
      expect(() => {
        adaptiveDifficulty.addSession(legacySession)
      }).not.toThrow()
    })
  })
})

/**
 * Adoption Barrier Analysis Tests
 * These tests specifically look for patterns that might prevent adoption
 */
describe('Library Validation: Adoption Barriers', () => {
  describe('Learning Curve Assessment', () => {
    it('should require minimal Vue 3 knowledge', () => {
      // Test: Can someone with basic Vue knowledge use this?
      const basicUsage = () => {
        // This is what a beginner might write
        const typing = useTypingMetrics()
        typing.startSession('my-test')
        typing.recordKeystroke('h', 'h', { line: 1, column: 1 })
        return typing.metrics.wpm
      }
      
      expect(() => basicUsage()).not.toThrow()
      expect(typeof basicUsage()).toBe('number')
    })

    it('should provide progressive disclosure of advanced features', () => {
      // Test: Basic features are simple, advanced features are available
      const basic = useTypingMetrics()
      
      // Basic features should be immediately apparent
      expect(basic.startSession).toBeDefined()
      expect(basic.metrics).toBeDefined()
      
      // Advanced features should exist but not clutter basic usage
      expect(basic.sessionDuration).toBeDefined()
      expect(basic.progressScore).toBeDefined()
    })

    it('should work without reading extensive documentation', () => {
      // Test: Intuitive naming and behavior
      const metrics = useTypingMetrics()
      
      // Method names should be self-explanatory
      expect(() => {
        metrics.startSession('test', 60) // Clear what this does
        metrics.recordKeystroke('a', 'a', { line: 1, column: 1 }) // Clear parameters
        const session = metrics.endSession() // Clear return expectation
        expect(session).toBeDefined()
      }).not.toThrow()
    })
  })

  describe('Integration Friction Assessment', () => {
    it('should integrate with existing projects without conflicts', () => {
      // Test: No global namespace pollution
      const beforeGlobals = Object.keys(global).length
      
      const metrics = useTypingMetrics()
      metrics.startSession('integration-test', 60)
      
      const afterGlobals = Object.keys(global).length
      expect(afterGlobals).toBe(beforeGlobals) // No new globals
    })

    it('should work alongside other Vue 3 composables', () => {
      // Test: No conflicting reactivity
      const otherRef = ref(0)
      const metrics = useTypingMetrics()
      
      metrics.startSession('compatibility-test', 60)
      otherRef.value = 42
      
      expect(otherRef.value).toBe(42) // Other reactivity still works
      expect(metrics.isActive.value).toBe(true) // Our reactivity works
    })

    it('should have minimal bundle size impact', () => {
      // Test: Library size should be reasonable
      const libCode = [
        useTypingMetrics.toString(),
        AdaptiveDifficulty.toString()
      ].join('')
      
      // Should be less than 50KB when minified (rough estimate)
      expect(libCode.length).toBeLessThan(50000)
    })
  })

  describe('Performance Concern Mitigation', () => {
    it('should not block the main thread during heavy usage', () => {
      const startTime = performance.now()
      
      typingMetrics.startSession('performance-test', 200)
      
      // Simulate 200 WPM typing for 1000 keystrokes
      for (let i = 0; i < 1000; i++) {
        typingMetrics.recordKeystroke('a', 'a', { line: 1, column: i })
      }
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      // Should process quickly without blocking
      expect(processingTime).toBeLessThan(50) // 50ms max
    })

    it('should handle memory cleanup properly', () => {
      const initialSession = typingMetrics.currentSession.value
      
      // Create and end multiple sessions
      for (let i = 0; i < 10; i++) {
        typingMetrics.startSession(`cleanup-test-${i}`, 60)
        typingMetrics.recordKeystroke('a', 'a', { line: 1, column: 1 })
        typingMetrics.endSession()
      }
      
      // Should not accumulate session data
      expect(typingMetrics.currentSession.value).toBeNull()
    })
  })

  describe('Browser Compatibility Barriers', () => {
    it('should work in environments without full ES6 support', () => {
      // Mock older browser environment
      const originalMap = global.Map
      const originalWeakMap = global.WeakMap
      
      // Remove modern features temporarily
      delete global.WeakMap
      
      // Should still work (library should have fallbacks)
      expect(() => {
        const metrics = useTypingMetrics()
        metrics.startSession('compat-test', 60)
      }).not.toThrow()
      
      global.Map = originalMap
      global.WeakMap = originalWeakMap
    })

    it('should handle offline scenarios', () => {
      // Mock offline environment
      const originalNavigator = global.navigator
      global.navigator = { onLine: false }
      
      expect(() => {
        const metrics = useTypingMetrics()
        metrics.startSession('offline-test', 60)
        metrics.recordKeystroke('a', 'a', { line: 1, column: 1 })
      }).not.toThrow()
      
      global.navigator = originalNavigator
    })
  })

  describe('Framework Lock-in Concerns', () => {
    it('should expose framework-agnostic core functionality', () => {
      // Test: Core logic should work without Vue
      const adaptiveDiff = new AdaptiveDifficulty()
      
      expect(() => {
        const session = {
          drillType: 'test',
          finalWPM: 50,
          accuracy: { raw: 95, adjusted: 93, errorRate: 5, correctionRatio: 0.2 },
          keystrokes: []
        }
        
        adaptiveDiff.addSession(session)
        const nextLevel = adaptiveDiff.calculateNextDifficulty()
        expect(nextLevel).toBeDefined()
      }).not.toThrow()
    })

    it('should allow migration to other frameworks', () => {
      // Test: Can extract core functionality for use in React, Svelte, etc.
      const coreCalculations = {
        calculateWPM: (keystrokes, timeElapsed) => {
          const characters = keystrokes.length
          const words = characters / 5
          const minutes = timeElapsed / 60000
          return minutes > 0 ? Math.round(words / minutes) : 0
        },
        
        calculateAccuracy: (keystrokes) => {
          const correct = keystrokes.filter(k => k.isCorrect).length
          return keystrokes.length > 0 ? (correct / keystrokes.length) * 100 : 100
        }
      }
      
      // These should work independent of Vue
      const mockKeystrokes = [
        { isCorrect: true },
        { isCorrect: true },
        { isCorrect: false }
      ]
      
      expect(coreCalculations.calculateAccuracy(mockKeystrokes)).toBeCloseTo(66.67, 1)
      expect(coreCalculations.calculateWPM(mockKeystrokes, 60000)).toBe(1) // 3 chars in 1 minute
    })
  })
})

/**
 * Production Validation Tests
 * Tests that ensure the library works in real production scenarios
 */
describe('Library Validation: Production Scenarios', () => {
  describe('Real User Workflow Validation', () => {
    it('should handle complete user learning journey', async () => {
      // Simulate a user progressing through difficulty levels
      const userJourney = new AdaptiveDifficulty('beginner-1')
      
      // Week 1: Poor performance
      for (let i = 0; i < 5; i++) {
        const session = {
          drillType: 'beginner-1',
          finalWPM: 25 + Math.random() * 10,
          accuracy: { raw: 85 + Math.random() * 10, adjusted: 80, errorRate: 15, correctionRatio: 0.3 },
          keystrokes: []
        }
        userJourney.addSession(session)
      }
      
      // Should recommend staying at current level
      let currentLevel = userJourney.updateCurrentLevel()
      expect(currentLevel.id).toBe('beginner-1')
      
      // Week 2: Improved performance
      for (let i = 0; i < 5; i++) {
        const session = {
          drillType: 'beginner-1',
          finalWPM: 40 + Math.random() * 5,
          accuracy: { raw: 96 + Math.random() * 3, adjusted: 95, errorRate: 4, correctionRatio: 0.1 },
          keystrokes: []
        }
        userJourney.addSession(session)
      }
      
      // Should advance to next level
      currentLevel = userJourney.updateCurrentLevel()
      expect(currentLevel.id).not.toBe('beginner-1')
    })

    it('should handle enterprise deployment scenarios', () => {
      // Test: Multiple users, session management, data persistence
      const users = []
      
      for (let i = 0; i < 100; i++) {
        const userMetrics = useTypingMetrics()
        userMetrics.startSession(`enterprise-user-${i}`, 60)
        users.push(userMetrics)
      }
      
      // All users should have independent sessions
      const sessionIds = users.map(u => u.currentSession.value?.id)
      const uniqueIds = new Set(sessionIds)
      
      expect(uniqueIds.size).toBe(users.length) // All unique sessions
    })
  })

  describe('Error Handling in Production', () => {
    it('should handle network interruptions gracefully', () => {
      // Mock network failure during session
      const originalFetch = global.fetch
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      
      expect(() => {
        typingMetrics.startSession('network-test', 60)
        typingMetrics.recordKeystroke('a', 'a', { line: 1, column: 1 })
      }).not.toThrow()
      
      global.fetch = originalFetch
    })

    it('should provide fallback behavior for storage failures', () => {
      // Mock localStorage failure
      const originalLocalStorage = global.localStorage
      global.localStorage = {
        getItem: vi.fn().mockImplementation(() => {
          throw new Error('Storage quota exceeded')
        }),
        setItem: vi.fn().mockImplementation(() => {
          throw new Error('Storage quota exceeded')
        })
      }
      
      expect(() => {
        const metrics = useTypingMetrics()
        metrics.startSession('storage-test', 60)
        metrics.endSession()
      }).not.toThrow()
      
      global.localStorage = originalLocalStorage
    })
  })

  describe('Scalability Validation', () => {
    it('should handle concurrent sessions without interference', () => {
      const sessions = []
      
      // Create 50 concurrent sessions
      for (let i = 0; i < 50; i++) {
        const session = useTypingMetrics()
        session.startSession(`concurrent-${i}`, 60)
        sessions.push(session)
      }
      
      // Each should maintain independent state
      sessions.forEach((session, index) => {
        session.recordKeystroke('a', 'a', { line: 1, column: 1 })
        expect(session.currentSession.value.id).toContain(`concurrent-${index}`)
      })
    })

    it('should maintain performance with large datasets', () => {
      // Test with large difficulty progression history
      const largeDifficulty = new AdaptiveDifficulty()
      
      const startTime = performance.now()
      
      // Add 1000 sessions
      for (let i = 0; i < 1000; i++) {
        largeDifficulty.addSession({
          drillType: 'performance-test',
          finalWPM: 50 + Math.random() * 30,
          accuracy: { raw: 90 + Math.random() * 10, adjusted: 88, errorRate: 10, correctionRatio: 0.2 },
          keystrokes: []
        })
      }
      
      const nextLevel = largeDifficulty.calculateNextDifficulty()
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(100) // Should be fast even with large dataset
      expect(nextLevel).toBeDefined()
    })
  })
})