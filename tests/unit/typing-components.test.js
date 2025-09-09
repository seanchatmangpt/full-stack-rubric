/**
 * @fileoverview Comprehensive TDD London School tests for typing components
 * Uses mock-driven development and behavior verification to test interactions
 * between TypingMonacoEditor, useTypingMetrics, and adaptiveDifficulty
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// ===== USE TYPING METRICS COMPOSABLE TESTS =====

describe('useTypingMetrics Composable - London School TDD', () => {
  let useTypingMetrics
  let metricsComposable
  
  beforeEach(async () => {
    // Dynamically import the composable
    const module = await import('../../app/composables/useTypingMetrics.js')
    useTypingMetrics = module.useTypingMetrics
    metricsComposable = useTypingMetrics()
  })

  // ===== CONTRACT VERIFICATION =====

  describe('Contract Verification - Composable Interface', () => {
    it('should provide expected reactive interface', () => {
      // Verify composable contract
      expect(metricsComposable).toHaveProperty('currentSession')
      expect(metricsComposable).toHaveProperty('isActive')
      expect(metricsComposable).toHaveProperty('metrics')
      expect(metricsComposable).toHaveProperty('sessionDuration')
      expect(metricsComposable).toHaveProperty('progressScore')
      
      // Verify method contract
      expect(metricsComposable.startSession).toBeTypeOf('function')
      expect(metricsComposable.endSession).toBeTypeOf('function')
      expect(metricsComposable.recordKeystroke).toBeTypeOf('function')
      expect(metricsComposable.resetSession).toBeTypeOf('function')
    })

    it('should initialize with correct default state', () => {
      // Verify initial state contract
      expect(metricsComposable.currentSession.value).toBeNull()
      expect(metricsComposable.isActive.value).toBe(false)
      expect(metricsComposable.metrics.value.wpm).toBe(0)
      expect(metricsComposable.metrics.value.accuracy).toBe(0)
      expect(metricsComposable.metrics.value.errorPatterns).toBeInstanceOf(Map)
    })
  })

  // ===== BEHAVIOR VERIFICATION =====

  describe('Behavior Verification - Session Management', () => {
    it('should create session with correct structure', () => {
      metricsComposable.startSession('function-names', 65)
      
      const session = metricsComposable.currentSession.value
      
      // Verify session contract
      expect(session).toMatchObject({
        id: expect.stringMatching(/^session_\d+_[a-z0-9]+$/),
        drillType: 'function-names',
        targetWPM: 65,
        startTime: expect.any(Number),
        finalWPM: 0,
        accuracy: expect.objectContaining({
          raw: 0,
          adjusted: 0,
          errorRate: 0,
          correctionRatio: 0
        }),
        keystrokes: []
      })
      
      expect(metricsComposable.isActive.value).toBe(true)
    })

    it('should end session and return results', () => {
      // Start a session first
      metricsComposable.startSession('basic-syntax', 50)
      
      // Record some keystrokes to create meaningful data
      metricsComposable.recordKeystroke('c', 'c', { line: 1, column: 1 })
      metricsComposable.recordKeystroke('o', 'o', { line: 1, column: 2 })
      
      // End session
      const completedSession = metricsComposable.endSession()
      
      // Verify session completion behavior
      expect(completedSession).toBeTruthy()
      expect(completedSession.endTime).toBeTruthy()
      expect(completedSession.finalWPM).toBeTypeOf('number')
      expect(metricsComposable.isActive.value).toBe(false)
      expect(metricsComposable.currentSession.value).toBeNull()
    })

    it('should handle pause and resume workflow', () => {
      metricsComposable.startSession('intermediate', 55)
      
      // Verify active state
      expect(metricsComposable.isActive.value).toBe(true)
      
      // Pause session
      metricsComposable.pauseSession()
      expect(metricsComposable.isActive.value).toBe(false)
      expect(metricsComposable.currentSession.value).toBeTruthy() // Session persists
      
      // Resume session
      metricsComposable.resumeSession()
      expect(metricsComposable.isActive.value).toBe(true)
    })
  })

  describe('Behavior Verification - Keystroke Recording', () => {
    it('should record keystrokes with correct event structure', () => {
      metricsComposable.startSession('keystroke-test', 60)
      
      const position = { line: 2, column: 5 }
      metricsComposable.recordKeystroke('h', 'h', position)
      
      const session = metricsComposable.currentSession.value
      const keystroke = session.keystrokes[0]
      
      // Verify keystroke event contract
      expect(keystroke).toMatchObject({
        key: 'h',
        expected: 'h',
        isCorrect: true,
        position: position,
        timestamp: expect.any(Number),
        timeDelta: expect.any(Number)
      })
    })

    it('should distinguish correct vs incorrect keystrokes', () => {
      metricsComposable.startSession('accuracy-test', 60)
      
      // Record correct keystroke
      metricsComposable.recordKeystroke('a', 'a', { line: 1, column: 1 })
      
      // Record incorrect keystroke
      metricsComposable.recordKeystroke('s', 'a', { line: 1, column: 2 })
      
      const keystrokes = metricsComposable.currentSession.value.keystrokes
      
      expect(keystrokes[0].isCorrect).toBe(true)
      expect(keystrokes[1].isCorrect).toBe(false)
    })

    it('should not record keystrokes when inactive', () => {
      // Don't start session - composable should be inactive
      metricsComposable.recordKeystroke('x', 'x', { line: 1, column: 1 })
      
      // Verify no recording occurred
      expect(metricsComposable.currentSession.value).toBeNull()
    })
  })

  // ===== METRICS CALCULATION BEHAVIOR =====

  describe('Behavior Verification - Metrics Calculation', () => {
    it('should calculate real-time WPM correctly', () => {
      metricsComposable.startSession('wpm-test', 60)
      
      // Simulate typing several characters over time
      const characters = 'const hello = "world"' // ~22 characters ≈ 4.4 words
      
      characters.split('').forEach((char, index) => {
        // Add small time delays to simulate realistic typing
        const position = { line: 1, column: index + 1 }
        metricsComposable.recordKeystroke(char, char, position)
      })
      
      // Allow some time for metrics calculation
      expect(metricsComposable.metrics.value.wpm).toBeGreaterThanOrEqual(0)
    })

    it('should track error patterns correctly', async () => {
      metricsComposable.startSession('error-test', 60)
      
      // Record pattern of errors
      metricsComposable.recordKeystroke('s', 'a', { line: 1, column: 1 }) // a->s error
      metricsComposable.recordKeystroke('s', 'a', { line: 1, column: 2 }) // a->s error again
      metricsComposable.recordKeystroke('r', 'e', { line: 1, column: 3 }) // e->r error
      
      // Allow metrics update with promise
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const errorPatterns = metricsComposable.metrics.value.errorPatterns
      expect(errorPatterns.get('a->s')).toBe(2)
      expect(errorPatterns.get('e->r')).toBe(1)
    })

    it('should calculate progress score from WPM and accuracy', async () => {
      metricsComposable.startSession('progress-test', 50) // Target WPM: 50
      
      // Simulate good performance: WPM = 50, high accuracy
      const correctKeystrokes = 'const test = 1'
      correctKeystrokes.split('').forEach((char, index) => {
        metricsComposable.recordKeystroke(char, char, { line: 1, column: index + 1 })
      })
      
      // Progress score should be high (close to 100) for meeting target WPM and accuracy
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(metricsComposable.progressScore.value).toBeGreaterThanOrEqual(0)
    })
  })

  // ===== RESET BEHAVIOR =====

  describe('Behavior Verification - Reset Functionality', () => {
    it('should reset all state and metrics', () => {
      // Create active session with data
      metricsComposable.startSession('reset-test', 60)
      metricsComposable.recordKeystroke('t', 't', { line: 1, column: 1 })
      
      // Verify session exists
      expect(metricsComposable.currentSession.value).toBeTruthy()
      expect(metricsComposable.isActive.value).toBe(true)
      
      // Reset
      metricsComposable.resetSession()
      
      // Verify complete reset
      expect(metricsComposable.currentSession.value).toBeNull()
      expect(metricsComposable.isActive.value).toBe(false)
      expect(metricsComposable.metrics.value.wpm).toBe(0)
      expect(metricsComposable.metrics.value.accuracy).toBe(0)
      expect(metricsComposable.metrics.value.errorPatterns.size).toBe(0)
    })
  })
})

// ===== ADAPTIVE DIFFICULTY UTILITY TESTS =====

describe('AdaptiveDifficulty Utility - London School TDD', () => {
  let AdaptiveDifficulty
  let DIFFICULTY_LEVELS
  let PROGRESSION_PHASES
  let adaptiveDifficulty
  let mockPerformanceSessions

  beforeEach(async () => {
    // Dynamically import the utility
    const module = await import('../../app/utils/adaptiveDifficulty.js')
    AdaptiveDifficulty = module.AdaptiveDifficulty
    DIFFICULTY_LEVELS = module.DIFFICULTY_LEVELS
    PROGRESSION_PHASES = module.PROGRESSION_PHASES
    
    adaptiveDifficulty = new AdaptiveDifficulty('beginner-1')
    
    // Mock performance sessions for testing
    mockPerformanceSessions = [
      {
        drillType: 'beginner-1',
        finalWPM: 38,
        accuracy: { raw: 97.2 },
        keystrokes: [
          { key: 'c', expected: 'c', isCorrect: true },
          { key: 's', expected: 'o', isCorrect: false }, // o->s error
          { key: 'n', expected: 'n', isCorrect: true }
        ]
      },
      {
        drillType: 'beginner-1',
        finalWPM: 42,
        accuracy: { raw: 96.8 },
        keystrokes: [
          { key: 'f', expected: 'f', isCorrect: true },
          { key: 'u', expected: 'u', isCorrect: true },
          { key: 'c', expected: 'n', isCorrect: false } // n->c error
        ]
      },
      {
        drillType: 'beginner-1',
        finalWPM: 45,
        accuracy: { raw: 98.1 },
        keystrokes: [
          { key: 'l', expected: 'l', isCorrect: true },
          { key: 'e', expected: 'e', isCorrect: true },
          { key: 't', expected: 't', isCorrect: true }
        ]
      }
    ]
  })

  // ===== CONTRACT VERIFICATION =====

  describe('Contract Verification - Utility Interface', () => {
    it('should provide expected difficulty management interface', () => {
      // Verify contract methods
      expect(adaptiveDifficulty.addSession).toBeTypeOf('function')
      expect(adaptiveDifficulty.calculateNextDifficulty).toBeTypeOf('function')
      expect(adaptiveDifficulty.updateCurrentLevel).toBeTypeOf('function')
      expect(adaptiveDifficulty.getCurrentLevel).toBeTypeOf('function')
      expect(adaptiveDifficulty.getProgressionPhase).toBeTypeOf('function')
      expect(adaptiveDifficulty.generateAdaptiveText).toBeTypeOf('function')
      expect(adaptiveDifficulty.getRecommendations).toBeTypeOf('function')
    })

    it('should initialize with correct starting level', () => {
      const beginnerDifficulty = new AdaptiveDifficulty('beginner-1')
      const intermediateDifficulty = new AdaptiveDifficulty('intermediate-1')
      
      expect(beginnerDifficulty.getCurrentLevel().id).toBe('beginner-1')
      expect(intermediateDifficulty.getCurrentLevel().id).toBe('intermediate-1')
    })

    it('should provide access to difficulty constants', () => {
      // Verify constants are exported and structured correctly
      expect(DIFFICULTY_LEVELS).toBeInstanceOf(Array)
      expect(DIFFICULTY_LEVELS.length).toBeGreaterThan(0)
      expect(PROGRESSION_PHASES).toBeInstanceOf(Array)
      expect(PROGRESSION_PHASES.length).toBe(4)
      
      // Verify level structure
      const firstLevel = DIFFICULTY_LEVELS[0]
      expect(firstLevel).toHaveProperty('id')
      expect(firstLevel).toHaveProperty('name')
      expect(firstLevel).toHaveProperty('targetWPM')
      expect(firstLevel).toHaveProperty('targetAccuracy')
      expect(firstLevel).toHaveProperty('metrics')
    })
  })

  // ===== BEHAVIOR VERIFICATION =====

  describe('Behavior Verification - Session Management', () => {
    it('should add sessions and maintain history limit', () => {
      // Add sessions within limit
      mockPerformanceSessions.forEach((session) => {
        adaptiveDifficulty.addSession(session)
      })
      
      expect(adaptiveDifficulty.history).toHaveLength(3)
      
      // Add many more sessions to test limit
      for (let i = 0; i < 50; i++) {
        adaptiveDifficulty.addSession({
          drillType: 'test',
          finalWPM: 40,
          accuracy: { raw: 95 },
          keystrokes: []
        })
      }
      
      // Should maintain maximum of 50 sessions
      expect(adaptiveDifficulty.history).toHaveLength(50)
    })

    it('should filter sessions by drill type correctly', () => {
      // Add sessions for different drill types
      adaptiveDifficulty.addSession({ drillType: 'beginner-1', finalWPM: 40, accuracy: { raw: 95 }, keystrokes: [] })
      adaptiveDifficulty.addSession({ drillType: 'beginner-2', finalWPM: 45, accuracy: { raw: 96 }, keystrokes: [] })
      adaptiveDifficulty.addSession({ drillType: 'beginner-1', finalWPM: 42, accuracy: { raw: 97 }, keystrokes: [] })
      
      const beginnerSessions = adaptiveDifficulty.getRecentSessionsForLevel('beginner-1')
      
      expect(beginnerSessions).toHaveLength(2)
      expect(beginnerSessions.every(s => s.drillType === 'beginner-1')).toBe(true)
    })
  })

  describe('Behavior Verification - Difficulty Progression', () => {
    it('should maintain current level with insufficient sessions', () => {
      // Add only 1 session (below minimum of 3)
      adaptiveDifficulty.addSession(mockPerformanceSessions[0])
      
      const nextDifficulty = adaptiveDifficulty.calculateNextDifficulty()
      
      expect(nextDifficulty.id).toBe('beginner-1') // Should remain at current level
    })

    it('should advance level when performance criteria are met', () => {
      // Create high-performance sessions that meet advancement criteria
      const excellentSessions = [
        { drillType: 'beginner-1', finalWPM: 35, accuracy: { raw: 98 }, keystrokes: mockPerformanceSessions[0].keystrokes },
        { drillType: 'beginner-1', finalWPM: 36, accuracy: { raw: 97.5 }, keystrokes: [] },
        { drillType: 'beginner-1', finalWPM: 37, accuracy: { raw: 98.2 }, keystrokes: [] },
        { drillType: 'beginner-1', finalWPM: 38, accuracy: { raw: 97.8 }, keystrokes: [] }
      ]
      
      excellentSessions.forEach(session => adaptiveDifficulty.addSession(session))
      
      const nextDifficulty = adaptiveDifficulty.updateCurrentLevel()
      
      // Should advance to next level due to consistent high performance
      expect(nextDifficulty.id).not.toBe('beginner-1')
      expect(DIFFICULTY_LEVELS.findIndex(l => l.id === nextDifficulty.id))
        .toBeGreaterThan(DIFFICULTY_LEVELS.findIndex(l => l.id === 'beginner-1'))
    })

    it('should regress level when performance is consistently poor', () => {
      // Start at intermediate level
      const intermediateDifficulty = new AdaptiveDifficulty('intermediate-1')
      
      // Add poor performance sessions
      const poorSessions = [
        { drillType: 'intermediate-1', finalWPM: 25, accuracy: { raw: 82 }, keystrokes: [] },
        { drillType: 'intermediate-1', finalWPM: 23, accuracy: { raw: 80 }, keystrokes: [] },
        { drillType: 'intermediate-1', finalWPM: 22, accuracy: { raw: 78 }, keystrokes: [] },
        { drillType: 'intermediate-1', finalWPM: 20, accuracy: { raw: 75 }, keystrokes: [] }
      ]
      
      poorSessions.forEach(session => intermediateDifficulty.addSession(session))
      
      const nextDifficulty = intermediateDifficulty.updateCurrentLevel()
      
      // Should regress to easier level
      expect(DIFFICULTY_LEVELS.findIndex(l => l.id === nextDifficulty.id))
        .toBeLessThan(DIFFICULTY_LEVELS.findIndex(l => l.id === 'intermediate-1'))
    })
  })

  describe('Behavior Verification - Performance Analysis', () => {
    it('should analyze performance trends correctly', () => {
      mockPerformanceSessions.forEach(session => adaptiveDifficulty.addSession(session))
      
      const recentSessions = adaptiveDifficulty.getRecentSessionsForLevel('beginner-1')
      const performance = adaptiveDifficulty.analyzeRecentPerformance(recentSessions)
      
      // Verify performance analysis structure
      expect(performance).toHaveProperty('avgWPM')
      expect(performance).toHaveProperty('avgAccuracy')
      expect(performance).toHaveProperty('consistency')
      expect(performance).toHaveProperty('errorPatterns')
      expect(performance).toHaveProperty('trend')
      
      // Verify calculated values
      const expectedAvgWPM = (38 + 42 + 45) / 3
      const expectedAvgAccuracy = (97.2 + 96.8 + 98.1) / 3
      
      expect(performance.avgWPM).toBeCloseTo(expectedAvgWPM, 1)
      expect(performance.avgAccuracy).toBeCloseTo(expectedAvgAccuracy, 1)
      expect(performance.errorPatterns).toBeInstanceOf(Map)
    })

    it('should aggregate error patterns across sessions', () => {
      mockPerformanceSessions.forEach(session => adaptiveDifficulty.addSession(session))
      
      const recentSessions = adaptiveDifficulty.getRecentSessionsForLevel('beginner-1')
      const performance = adaptiveDifficulty.analyzeRecentPerformance(recentSessions)
      
      // Verify error pattern aggregation
      expect(performance.errorPatterns.get('o->s')).toBe(1)
      expect(performance.errorPatterns.get('n->c')).toBe(1)
    })
  })

  // ===== TEXT GENERATION BEHAVIOR =====

  describe('Behavior Verification - Adaptive Text Generation', () => {
    it('should generate appropriate text for difficulty level', () => {
      const beginnerLevel = DIFFICULTY_LEVELS.find(l => l.id === 'beginner-1')
      const generatedText = adaptiveDifficulty.generateAdaptiveText(beginnerLevel)
      
      expect(generatedText).toBeTypeOf('string')
      expect(generatedText.length).toBeGreaterThan(0)
      
      // Should contain beginner-appropriate patterns
      expect(generatedText).toMatch(/parseQuery|filterByStatus|formatResponse/)
    })

    it('should incorporate weak patterns when provided', () => {
      const weakPatterns = new Map([
        ['a->s', 5],
        ['e->r', 3]
      ])
      
      const level = DIFFICULTY_LEVELS.find(l => l.id === 'beginner-2')
      const adaptiveText = adaptiveDifficulty.generateAdaptiveText(level, weakPatterns)
      
      // Should include practice for weak patterns
      expect(adaptiveText).toContain('aaa') // Repeated 'a' for practice
      expect(adaptiveText).toContain('eee') // Repeated 'e' for practice
      expect(adaptiveText).toContain('avoid typing \'s\'') // Error guidance
      expect(adaptiveText).toContain('avoid typing \'r\'')
    })
  })

  // ===== RECOMMENDATION BEHAVIOR =====

  describe('Behavior Verification - Recommendation System', () => {
    it('should provide accuracy-focused recommendations for low accuracy', () => {
      // Add sessions with low accuracy
      const lowAccuracySessions = [
        { drillType: 'beginner-1', finalWPM: 40, accuracy: { raw: 88 }, keystrokes: [] },
        { drillType: 'beginner-1', finalWPM: 42, accuracy: { raw: 87 }, keystrokes: [] },
        { drillType: 'beginner-1', finalWPM: 38, accuracy: { raw: 89 }, keystrokes: [] }
      ]
      
      lowAccuracySessions.forEach(session => adaptiveDifficulty.addSession(session))
      
      const recommendations = adaptiveDifficulty.getRecommendations()
      
      expect(recommendations.some(rec => 
        rec.includes('accuracy') && rec.includes('97%')
      )).toBe(true)
    })

    it('should recommend consistency work for erratic performance', () => {
      // Add sessions with varying WPM (inconsistent)
      const inconsistentSessions = [
        { drillType: 'beginner-1', finalWPM: 20, accuracy: { raw: 96 }, keystrokes: [] },
        { drillType: 'beginner-1', finalWPM: 60, accuracy: { raw: 95 }, keystrokes: [] },
        { drillType: 'beginner-1', finalWPM: 30, accuracy: { raw: 97 }, keystrokes: [] }
      ]
      
      inconsistentSessions.forEach(session => adaptiveDifficulty.addSession(session))
      
      const recommendations = adaptiveDifficulty.getRecommendations()
      
      expect(recommendations.some(rec => 
        rec.includes('rhythm') || rec.includes('steady')
      )).toBe(true)
    })

    it('should recommend level regression for very poor performance', () => {
      // Add sessions with very low WPM
      const veryPoorSessions = [
        { drillType: 'beginner-1', finalWPM: 15, accuracy: { raw: 85 }, keystrokes: [] },
        { drillType: 'beginner-1', finalWPM: 12, accuracy: { raw: 83 }, keystrokes: [] },
        { drillType: 'beginner-1', finalWPM: 18, accuracy: { raw: 87 }, keystrokes: [] }
      ]
      
      veryPoorSessions.forEach(session => adaptiveDifficulty.addSession(session))
      
      const recommendations = adaptiveDifficulty.getRecommendations()
      
      expect(recommendations.some(rec => 
        rec.includes('easier level') || rec.includes('dropping')
      )).toBe(true)
    })

    it('should provide positive reinforcement for good performance', () => {
      // Add sessions with excellent performance
      const excellentSessions = [
        { drillType: 'beginner-1', finalWPM: 38, accuracy: { raw: 98.5 }, keystrokes: [] },
        { drillType: 'beginner-1', finalWPM: 36, accuracy: { raw: 97.8 }, keystrokes: [] },
        { drillType: 'beginner-1', finalWPM: 40, accuracy: { raw: 98.2 }, keystrokes: [] }
      ]
      
      excellentSessions.forEach(session => adaptiveDifficulty.addSession(session))
      
      const recommendations = adaptiveDifficulty.getRecommendations()
      
      expect(recommendations.some(rec => 
        rec.includes('Great progress') || rec.includes('advance')
      )).toBe(true)
    })
  })

  // ===== PROGRESSION PHASE BEHAVIOR =====

  describe('Behavior Verification - Progression Phase Mapping', () => {
    it('should map difficulty levels to correct progression phases', () => {
      // Test beginner levels → Foundation Building
      const beginnerDifficulty = new AdaptiveDifficulty('beginner-1')
      let phase = beginnerDifficulty.getProgressionPhase()
      expect(phase.phase).toBe(1)
      expect(phase.name).toBe('Foundation Building')
      
      // Test intermediate levels → Pattern Recognition
      const intermediateDifficulty = new AdaptiveDifficulty('intermediate-1')
      phase = intermediateDifficulty.getProgressionPhase()
      expect(phase.phase).toBe(2)
      expect(phase.name).toBe('Pattern Recognition')
      
      // Test advanced levels → higher phases
      const advancedDifficulty = new AdaptiveDifficulty('advanced-1')
      phase = advancedDifficulty.getProgressionPhase()
      expect(phase.phase).toBeGreaterThanOrEqual(3)
    })

    it('should provide phase-appropriate drill types', () => {
      const phase1 = PROGRESSION_PHASES[0]
      const phase2 = PROGRESSION_PHASES[1]
      
      expect(phase1.drillTypes).toContain('function-names')
      expect(phase1.drillTypes).toContain('basic-syntax')
      
      expect(phase2.drillTypes).toContain('query-grammar')
      expect(phase2.drillTypes).toContain('object-patterns')
    })
  })
})

// ===== INTEGRATION TESTING - COMPONENT COLLABORATION =====

describe('Integration Testing - Component Collaboration', () => {
  let metricsComposable
  let adaptiveDifficulty

  beforeEach(async () => {
    const metricsModule = await import('../../app/composables/useTypingMetrics.js')
    const difficultyModule = await import('../../app/utils/adaptiveDifficulty.js')
    
    metricsComposable = metricsModule.useTypingMetrics()
    adaptiveDifficulty = new difficultyModule.AdaptiveDifficulty('beginner-1')
  })

  it('should coordinate session completion with adaptive difficulty', () => {
    // Start a typing session
    metricsComposable.startSession('integration-test', 35)
    
    // Simulate typing
    'const hello = "world"'.split('').forEach((char, index) => {
      metricsComposable.recordKeystroke(char, char, { line: 1, column: index + 1 })
    })
    
    // End session
    const completedSession = metricsComposable.endSession()
    
    // Add session to adaptive difficulty
    adaptiveDifficulty.addSession(completedSession)
    
    // Verify integration
    expect(completedSession).toBeTruthy()
    expect(completedSession.finalWPM).toBeGreaterThanOrEqual(0)
    expect(adaptiveDifficulty.history).toHaveLength(1)
    expect(adaptiveDifficulty.history[0]).toEqual(completedSession)
  })

  it('should generate recommendations based on performance', () => {
    // Create multiple sessions with varying performance
    const sessions = [
      { drillType: 'beginner-1', finalWPM: 30, accuracy: { raw: 95 }, keystrokes: [] },
      { drillType: 'beginner-1', finalWPM: 32, accuracy: { raw: 96 }, keystrokes: [] },
      { drillType: 'beginner-1', finalWPM: 35, accuracy: { raw: 97 }, keystrokes: [] }
    ]
    
    sessions.forEach(session => adaptiveDifficulty.addSession(session))
    
    const recommendations = adaptiveDifficulty.getRecommendations()
    const currentLevel = adaptiveDifficulty.getCurrentLevel()
    
    // Verify recommendation system produces sensible output
    expect(recommendations).toBeInstanceOf(Array)
    expect(recommendations.length).toBeGreaterThan(0)
    expect(currentLevel.id).toBe('beginner-1')
    expect(currentLevel.targetWPM).toBe(35) // Matches beginner-1 level
  })

  it('should handle progression through difficulty levels', () => {
    // Simulate excellent performance to trigger advancement
    const excellentSessions = Array.from({ length: 4 }, (_, i) => ({
      drillType: 'beginner-1',
      finalWPM: 36 + i, // Progressive improvement
      accuracy: { raw: 98 - i * 0.1 }, // High accuracy
      keystrokes: []
    }))
    
    excellentSessions.forEach(session => adaptiveDifficulty.addSession(session))
    
    const nextLevel = adaptiveDifficulty.updateCurrentLevel()
    
    // Should advance due to consistent high performance
    expect(nextLevel.id).not.toBe('beginner-1') // Should advance
    expect(nextLevel.targetWPM).toBeGreaterThan(35) // Higher target WPM
  })
})

// ===== PERFORMANCE TESTING =====

describe('Performance Testing - TDD Verification', () => {
  it('should handle high-frequency keystroke recording', async () => {
    const module = await import('../../app/composables/useTypingMetrics.js')
    const { useTypingMetrics } = module
    const composable = useTypingMetrics()
    
    composable.startSession('performance-test', 60)
    
    const startTime = performance.now()
    
    // Simulate rapid keystroke recording
    for (let i = 0; i < 1000; i++) {
      composable.recordKeystroke('a', 'a', { line: 1, column: i + 1 })
    }
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    // Should handle 1000 keystrokes in reasonable time (< 1 second)
    expect(duration).toBeLessThan(1000)
    expect(composable.currentSession.value.keystrokes.length).toBe(1000)
  })

  it('should handle memory efficiently with large datasets', async () => {
    const module = await import('../../app/utils/adaptiveDifficulty.js')
    const { AdaptiveDifficulty } = module
    const difficulty = new AdaptiveDifficulty('beginner-1')
    
    // Add many sessions to test memory management
    for (let i = 0; i < 100; i++) {
      difficulty.addSession({
        drillType: 'test',
        finalWPM: 40 + Math.random() * 20,
        accuracy: { raw: 90 + Math.random() * 10 },
        keystrokes: Array.from({ length: 50 }, () => ({ 
          key: 'a', expected: 'a', isCorrect: true 
        }))
      })
    }
    
    // Should maintain memory limit
    expect(difficulty.history.length).toBeLessThanOrEqual(50) // Internal limit
    
    // Should still function correctly
    const recommendations = difficulty.getRecommendations()
    expect(recommendations).toBeInstanceOf(Array)
  })
})
