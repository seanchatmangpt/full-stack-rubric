/**
 * @fileoverview Unit tests for adaptiveDifficulty utility using London School TDD
 * Focus on behavior verification and algorithm correctness with proper mocking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AdaptiveDifficulty, DIFFICULTY_LEVELS, PROGRESSION_PHASES } from '@/utils/adaptiveDifficulty'

describe('AdaptiveDifficulty', () => {
  let adaptiveDifficulty

  beforeEach(() => {
    adaptiveDifficulty = new AdaptiveDifficulty('beginner-1')
  })

  describe('Initialization', () => {
    it('should initialize with default beginner level', () => {
      const difficulty = new AdaptiveDifficulty()
      expect(difficulty.getCurrentLevel().id).toBe('beginner-1')
      expect(difficulty.getCurrentLevel().name).toBe('Function Names')
    })

    it('should initialize with specified level', () => {
      const difficulty = new AdaptiveDifficulty('intermediate-1')
      expect(difficulty.getCurrentLevel().id).toBe('intermediate-1')
      expect(difficulty.getCurrentLevel().name).toBe('Query Grammar')
    })

    it('should fallback to beginner-1 for invalid level', () => {
      const difficulty = new AdaptiveDifficulty('invalid-level')
      expect(difficulty.getCurrentLevel().id).toBe('beginner-1')
    })

    it('should have empty session history initially', () => {
      expect(adaptiveDifficulty.history).toEqual([])
    })
  })

  describe('Session Management', () => {
    const createSession = (overrides = {}) => ({
      drillType: 'beginner-1',
      finalWPM: 40,
      accuracy: { raw: 95 },
      keystrokes: [
        { key: 'a', expected: 'a', isCorrect: true },
        { key: 'b', expected: 'b', isCorrect: true },
        { key: 'x', expected: 'c', isCorrect: false }
      ],
      ...overrides
    })

    it('should add session to history', () => {
      const session = createSession()
      adaptiveDifficulty.addSession(session)
      
      expect(adaptiveDifficulty.history).toHaveLength(1)
      expect(adaptiveDifficulty.history[0]).toBe(session)
    })

    it('should limit history to 50 sessions', () => {
      // Add 60 sessions
      for (let i = 0; i < 60; i++) {
        adaptiveDifficulty.addSession(createSession({ id: i }))
      }
      
      expect(adaptiveDifficulty.history).toHaveLength(50)
      // Should keep the most recent 50
      expect(adaptiveDifficulty.history[0].id).toBe(10)
      expect(adaptiveDifficulty.history[49].id).toBe(59)
    })

    it('should handle null session gracefully', () => {
      expect(() => adaptiveDifficulty.addSession(null)).not.toThrow()
      expect(adaptiveDifficulty.history).toHaveLength(1)
      expect(adaptiveDifficulty.history[0]).toBe(null)
    })
  })

  describe('Difficulty Calculation', () => {
    beforeEach(() => {
      // Add required minimum sessions for level advancement
      for (let i = 0; i < 5; i++) {
        adaptiveDifficulty.addSession(createSession({
          drillType: 'beginner-1',
          finalWPM: 35 + i, // Progressive improvement
          accuracy: { raw: 96 + i / 10 }
        }))
      }
    })

    const createSession = (overrides = {}) => ({
      drillType: 'beginner-1',
      finalWPM: 40,
      accuracy: { raw: 95 },
      keystrokes: [
        { key: 'a', expected: 'a', isCorrect: true },
        { key: 'b', expected: 'b', isCorrect: true }
      ],
      ...overrides
    })

    it('should remain at current level with insufficient sessions', () => {
      const newDifficulty = new AdaptiveDifficulty('beginner-1')
      newDifficulty.addSession(createSession())
      
      const nextLevel = newDifficulty.calculateNextDifficulty()
      expect(nextLevel.id).toBe('beginner-1')
    })

    it('should advance level when performance criteria are met', () => {
      // Add high-performance sessions
      for (let i = 0; i < 5; i++) {
        adaptiveDifficulty.addSession(createSession({
          drillType: 'beginner-1',
          finalWPM: 45, // Above 80% of target (35 * 0.8 = 28)
          accuracy: { raw: 97 } // Above 95% requirement
        }))
      }

      const nextLevel = adaptiveDifficulty.calculateNextDifficulty()
      expect(nextLevel.id).toBe('beginner-2')
    })

    it('should not advance with low accuracy', () => {
      for (let i = 0; i < 5; i++) {
        adaptiveDifficulty.addSession(createSession({
          finalWPM: 45,
          accuracy: { raw: 85 } // Below 95% requirement
        }))
      }

      const nextLevel = adaptiveDifficulty.calculateNextDifficulty()
      expect(nextLevel.id).toBe('beginner-1')
    })

    it('should not advance with low WPM', () => {
      for (let i = 0; i < 5; i++) {
        adaptiveDifficulty.addSession(createSession({
          finalWPM: 20, // Below 80% of target (35 * 0.8 = 28)
          accuracy: { raw: 97 }
        }))
      }

      const nextLevel = adaptiveDifficulty.calculateNextDifficulty()
      expect(nextLevel.id).toBe('beginner-1')
    })

    it('should regress level with very poor performance', () => {
      // Start at intermediate level
      const difficulty = new AdaptiveDifficulty('intermediate-1')
      
      for (let i = 0; i < 5; i++) {
        difficulty.addSession(createSession({
          drillType: 'intermediate-1',
          finalWPM: 10, // Very low
          accuracy: { raw: 80 } // Below 85% regression threshold
        }))
      }

      const nextLevel = difficulty.calculateNextDifficulty()
      expect(nextLevel.id).toBe('beginner-2')
    })

    it('should not regress below first level', () => {
      for (let i = 0; i < 5; i++) {
        adaptiveDifficulty.addSession(createSession({
          finalWPM: 10,
          accuracy: { raw: 80 }
        }))
      }

      const nextLevel = adaptiveDifficulty.calculateNextDifficulty()
      expect(nextLevel.id).toBe('beginner-1') // Should stay at first level
    })

    it('should not advance beyond final level', () => {
      const difficulty = new AdaptiveDifficulty('expert-2') // Final level
      
      for (let i = 0; i < 5; i++) {
        difficulty.addSession(createSession({
          drillType: 'expert-2',
          finalWPM: 100,
          accuracy: { raw: 98 }
        }))
      }

      const nextLevel = difficulty.calculateNextDifficulty()
      expect(nextLevel.id).toBe('expert-2')
    })
  })

  describe('Performance Analysis', () => {
    const createSession = (wpm, accuracy, errors = []) => ({
      drillType: 'beginner-1',
      finalWPM: wpm,
      accuracy: { raw: accuracy },
      keystrokes: [
        ...Array(10).fill().map(() => ({ key: 'a', expected: 'a', isCorrect: true })),
        ...errors.map(([key, expected]) => ({ key, expected, isCorrect: false }))
      ]
    })

    it('should calculate average performance correctly', () => {
      adaptiveDifficulty.addSession(createSession(30, 90))
      adaptiveDifficulty.addSession(createSession(40, 95))
      adaptiveDifficulty.addSession(createSession(50, 100))

      const performance = adaptiveDifficulty.analyzeRecentPerformance(adaptiveDifficulty.history)
      
      expect(performance.avgWPM).toBe(40)
      expect(performance.avgAccuracy).toBe(95)
    })

    it('should calculate consistency score', () => {
      // Consistent performance
      adaptiveDifficulty.addSession(createSession(40, 95))
      adaptiveDifficulty.addSession(createSession(42, 96))
      adaptiveDifficulty.addSession(createSession(38, 94))

      const performance = adaptiveDifficulty.analyzeRecentPerformance(adaptiveDifficulty.history)
      expect(performance.consistency).toBeGreaterThan(90) // Low variance = high consistency
    })

    it('should detect improving trend', () => {
      // Add sessions with improving performance
      adaptiveDifficulty.addSession(createSession(30, 90))
      adaptiveDifficulty.addSession(createSession(32, 91))
      adaptiveDifficulty.addSession(createSession(35, 93))
      adaptiveDifficulty.addSession(createSession(40, 95))
      adaptiveDifficulty.addSession(createSession(45, 97))

      const performance = adaptiveDifficulty.analyzeRecentPerformance(adaptiveDifficulty.history)
      expect(performance.trend).toBe('improving')
    })

    it('should detect declining trend', () => {
      // Add sessions with declining performance
      adaptiveDifficulty.addSession(createSession(50, 95))
      adaptiveDifficulty.addSession(createSession(48, 93))
      adaptiveDifficulty.addSession(createSession(45, 91))
      adaptiveDifficulty.addSession(createSession(40, 88))
      adaptiveDifficulty.addSession(createSession(35, 85))

      const performance = adaptiveDifficulty.analyzeRecentPerformance(adaptiveDifficulty.history)
      expect(performance.trend).toBe('declining')
    })

    it('should aggregate error patterns correctly', () => {
      adaptiveDifficulty.addSession(createSession(40, 90, [['x', 'a'], ['y', 'b']]))
      adaptiveDifficulty.addSession(createSession(42, 92, [['x', 'a'], ['z', 'c']]))

      const performance = adaptiveDifficulty.analyzeRecentPerformance(adaptiveDifficulty.history)
      
      expect(performance.errorPatterns.get('a->x')).toBe(2)
      expect(performance.errorPatterns.get('b->y')).toBe(1)
      expect(performance.errorPatterns.get('c->z')).toBe(1)
    })

    it('should handle empty session list', () => {
      const performance = adaptiveDifficulty.analyzeRecentPerformance([])
      
      expect(performance.avgWPM).toBe(0)
      expect(performance.avgAccuracy).toBe(0)
      expect(performance.consistency).toBe(0)
      expect(performance.errorPatterns.size).toBe(0)
      expect(performance.trend).toBe('stable')
    })
  })

  describe('Progression Phase Detection', () => {
    it('should detect foundation building phase for beginner levels', () => {
      const phase = adaptiveDifficulty.getProgressionPhase()
      expect(phase.name).toBe('Foundation Building')
      expect(phase.phase).toBe(1)
    })

    it('should detect pattern recognition phase for intermediate levels', () => {
      adaptiveDifficulty.currentLevel = DIFFICULTY_LEVELS[2] // intermediate-1
      const phase = adaptiveDifficulty.getProgressionPhase()
      expect(phase.name).toBe('Pattern Recognition')
      expect(phase.phase).toBe(2)
    })

    it('should detect pipeline mastery phase for advanced levels', () => {
      adaptiveDifficulty.currentLevel = DIFFICULTY_LEVELS[4] // advanced-1
      const phase = adaptiveDifficulty.getProgressionPhase()
      expect(phase.name).toBe('Pipeline Mastery')
      expect(phase.phase).toBe(3)
    })

    it('should detect integration expertise for expert levels', () => {
      adaptiveDifficulty.currentLevel = DIFFICULTY_LEVELS[6] // expert-1
      const phase = adaptiveDifficulty.getProgressionPhase()
      expect(phase.name).toBe('Integration Expertise')
      expect(phase.phase).toBe(4)
    })
  })

  describe('Text Generation', () => {
    it('should generate adaptive text for difficulty level', () => {
      const text = adaptiveDifficulty.generateAdaptiveText(DIFFICULTY_LEVELS[0])
      expect(text).toContain('parseQuery')
      expect(text.length).toBeGreaterThan(0)
    })

    it('should incorporate weak patterns when provided', () => {
      const weakPatterns = new Map([
        ['a->x', 3],
        ['b->y', 2]
      ])
      
      const text = adaptiveDifficulty.generateAdaptiveText(DIFFICULTY_LEVELS[0], weakPatterns)
      expect(text).toContain('aaa') // Pattern repetition for practice
    })

    it('should generate different content for different difficulty levels', () => {
      const beginnerText = adaptiveDifficulty.generateAdaptiveText(DIFFICULTY_LEVELS[0])
      const expertText = adaptiveDifficulty.generateAdaptiveText(DIFFICULTY_LEVELS[7])
      
      expect(beginnerText).not.toBe(expertText)
    })
  })

  describe('Recommendations', () => {
    const createSession = (wpm, accuracy) => ({
      drillType: 'beginner-1',
      finalWPM: wpm,
      accuracy: { raw: accuracy },
      keystrokes: Array(10).fill({ key: 'a', expected: 'a', isCorrect: true })
    })

    it('should recommend accuracy improvement for low accuracy', () => {
      for (let i = 0; i < 5; i++) {
        adaptiveDifficulty.addSession(createSession(40, 85)) // Low accuracy
      }

      const recommendations = adaptiveDifficulty.getRecommendations()
      expect(recommendations.some(r => r.includes('accuracy'))).toBe(true)
    })

    it('should recommend rhythm improvement for low consistency', () => {
      // Inconsistent performance
      adaptiveDifficulty.addSession(createSession(20, 96))
      adaptiveDifficulty.addSession(createSession(60, 96))
      adaptiveDifficulty.addSession(createSession(30, 96))
      adaptiveDifficulty.addSession(createSession(70, 96))

      const recommendations = adaptiveDifficulty.getRecommendations()
      expect(recommendations.some(r => r.includes('rhythm'))).toBe(true)
    })

    it('should recommend easier level for very low WPM', () => {
      for (let i = 0; i < 5; i++) {
        adaptiveDifficulty.addSession(createSession(15, 96)) // Very low WPM
      }

      const recommendations = adaptiveDifficulty.getRecommendations()
      expect(recommendations.some(r => r.includes('easier level'))).toBe(true)
    })

    it('should provide positive feedback for good performance', () => {
      for (let i = 0; i < 5; i++) {
        adaptiveDifficulty.addSession(createSession(40, 97)) // Good performance
      }

      const recommendations = adaptiveDifficulty.getRecommendations()
      expect(recommendations.some(r => r.includes('Great progress'))).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle null/undefined sessions in history', () => {
      adaptiveDifficulty.history = [null, undefined]
      expect(() => adaptiveDifficulty.calculateNextDifficulty()).not.toThrow()
    })

    it('should handle sessions with missing properties', () => {
      adaptiveDifficulty.addSession({}) // Missing required properties
      expect(() => adaptiveDifficulty.calculateNextDifficulty()).not.toThrow()
    })

    it('should handle extreme WPM values', () => {
      adaptiveDifficulty.addSession({
        drillType: 'beginner-1',
        finalWPM: 1000, // Extremely high
        accuracy: { raw: 100 },
        keystrokes: []
      })
      
      const performance = adaptiveDifficulty.analyzeRecentPerformance(adaptiveDifficulty.history)
      expect(performance.avgWPM).toBe(1000)
      expect(performance.consistency).toBeGreaterThanOrEqual(0)
    })

    it('should handle zero-length keystroke arrays', () => {
      adaptiveDifficulty.addSession({
        drillType: 'beginner-1',
        finalWPM: 40,
        accuracy: { raw: 95 },
        keystrokes: [] // Empty keystrokes
      })
      
      const performance = adaptiveDifficulty.analyzeRecentPerformance(adaptiveDifficulty.history)
      expect(performance.errorPatterns.size).toBe(0)
    })
  })

  describe('Level Updates', () => {
    it('should update current level and return new level', () => {
      // Add sessions that warrant advancement
      for (let i = 0; i < 5; i++) {
        adaptiveDifficulty.addSession({
          drillType: 'beginner-1',
          finalWPM: 45,
          accuracy: { raw: 97 },
          keystrokes: [{ key: 'a', expected: 'a', isCorrect: true }]
        })
      }

      const newLevel = adaptiveDifficulty.updateCurrentLevel()
      expect(newLevel.id).toBe('beginner-2')
      expect(adaptiveDifficulty.getCurrentLevel().id).toBe('beginner-2')
    })

    it('should maintain current level when no change is needed', () => {
      const originalLevel = adaptiveDifficulty.getCurrentLevel()
      const newLevel = adaptiveDifficulty.updateCurrentLevel()
      
      expect(newLevel).toBe(originalLevel)
      expect(adaptiveDifficulty.getCurrentLevel()).toBe(originalLevel)
    })
  })
})
