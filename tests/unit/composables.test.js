/**
 * @fileoverview Basic unit tests for composables functionality
 * Tests core composable features without complex mocking
 */

import { describe, it, expect, vi } from 'vitest'

// Simple mocks
vi.mock('../../app/utils/performanceOptimizer.js', () => ({
  performanceUtils: {
    debounce: vi.fn(fn => fn),
    preloadResource: vi.fn().mockResolvedValue()
  },
  bundleAnalyzer: {
    measureBundleMetrics: vi.fn().mockResolvedValue({ initialBundle: 250 }),
    generatePerformanceReport: vi.fn().mockResolvedValue({ typing: {}, score: 85 })
  },
  monacoOptimizer: {
    optimizeConfig: vi.fn().mockReturnValue({ wordWrap: 'off' })
  },
  defaultOptimizationConfig: { autoStart: false }
}))

// Mock globals
global.performance = { now: () => Date.now(), memory: { usedJSHeapSize: 1000000 } }
global.document = { 
  head: { appendChild: vi.fn() },
  createElement: vi.fn(() => ({})),
  querySelector: vi.fn()
}

// Import after mocking
const { usePerformanceOptimization } = await import('../../app/composables/usePerformanceOptimization.js')
const { useTypingMetrics } = await import('../../app/composables/useTypingMetrics.js')

describe('usePerformanceOptimization Basic Tests', () => {
  it('creates composable instance', () => {
    const result = usePerformanceOptimization()
    
    expect(result).toBeDefined()
    expect(result.isMonitoring).toBeDefined()
    expect(result.metrics).toBeDefined()
    expect(result.score).toBeDefined()
    expect(result.startMonitoring).toBeTypeOf('function')
    expect(result.stopMonitoring).toBeTypeOf('function')
  })

  it('has reactive state', () => {
    const result = usePerformanceOptimization()
    
    expect(result.isMonitoring.value).toBe(false)
    expect(typeof result.score.value).toBe('number')
    expect(Array.isArray(result.recommendations.value)).toBe(true)
  })

  it('can start monitoring', () => {
    const result = usePerformanceOptimization()
    
    result.startMonitoring()
    expect(result.isMonitoring.value).toBe(true)
  })

  it('can stop monitoring', () => {
    const result = usePerformanceOptimization()
    
    result.startMonitoring()
    result.stopMonitoring()
    expect(result.isMonitoring.value).toBe(false)
  })

  it('handles Monaco optimization', () => {
    const result = usePerformanceOptimization()
    const mockInstance = { updateOptions: vi.fn() }
    
    const config = result.optimizeMonacoForTyping(mockInstance)
    expect(mockInstance.updateOptions).toHaveBeenCalled()
  })

  it('handles null Monaco gracefully', () => {
    const result = usePerformanceOptimization()
    
    const config = result.optimizeMonacoForTyping(null)
    expect(config).toBeNull()
  })
})

describe('useTypingMetrics Basic Tests', () => {
  it('creates composable instance', () => {
    const result = useTypingMetrics()
    
    expect(result).toBeDefined()
    expect(result.currentSession).toBeDefined()
    expect(result.isActive).toBeDefined()
    expect(result.metrics).toBeDefined()
    expect(result.startSession).toBeTypeOf('function')
    expect(result.endSession).toBeTypeOf('function')
    expect(result.recordKeystroke).toBeTypeOf('function')
  })

  it('has reactive state', () => {
    const result = useTypingMetrics()
    
    expect(result.currentSession.value).toBeNull()
    expect(result.isActive.value).toBe(false)
    expect(result.metrics.wpm).toBe(0)
    expect(result.metrics.accuracy).toBe(0)
  })

  it('can start session', () => {
    const result = useTypingMetrics()
    
    result.startSession('test', 60)
    
    expect(result.isActive.value).toBe(true)
    expect(result.currentSession.value).toBeDefined()
    expect(result.currentSession.value.drillType).toBe('test')
    expect(result.currentSession.value.targetWPM).toBe(60)
  })

  it('can record keystrokes', () => {
    const result = useTypingMetrics()
    result.startSession('test')
    
    result.recordKeystroke('a', 'a', { line: 1, column: 1 })
    
    expect(result.currentSession.value.keystrokes).toHaveLength(1)
    expect(result.currentSession.value.keystrokes[0].key).toBe('a')
    expect(result.currentSession.value.keystrokes[0].isCorrect).toBe(true)
  })

  it('can end session', () => {
    const result = useTypingMetrics()
    result.startSession('test')
    result.recordKeystroke('a', 'a', { line: 1, column: 1 })
    
    const session = result.endSession()
    
    expect(result.isActive.value).toBe(false)
    expect(result.currentSession.value).toBeNull()
    expect(session).toBeDefined()
    expect(session.keystrokes).toHaveLength(1)
  })

  it('can reset session', () => {
    const result = useTypingMetrics()
    result.startSession('test')
    result.recordKeystroke('a', 'a', { line: 1, column: 1 })
    
    result.resetSession()
    
    expect(result.currentSession.value).toBeNull()
    expect(result.isActive.value).toBe(false)
    expect(result.metrics.wpm).toBe(0)
  })

  it('ignores keystrokes when inactive', () => {
    const result = useTypingMetrics()
    
    result.recordKeystroke('a', 'a', { line: 1, column: 1 })
    
    expect(result.currentSession.value).toBeNull()
  })

  it('calculates progress score', () => {
    const result = useTypingMetrics()
    result.startSession('test', 60)
    
    // Simulate metrics
    result.metrics.wpm = 60
    result.metrics.accuracy = 90
    
    expect(result.progressScore.value).toBeGreaterThanOrEqual(0)
  })

  it('handles pause and resume', () => {
    const result = useTypingMetrics()
    result.startSession('test')
    
    result.pauseSession()
    expect(result.isActive.value).toBe(false)
    
    result.resumeSession()
    expect(result.isActive.value).toBe(true)
  })
})

describe('Edge Cases', () => {
  it('handles empty typing session end', () => {
    const result = useTypingMetrics()
    
    const session = result.endSession()
    expect(session).toBeNull()
  })

  it('uses default target WPM', () => {
    const result = useTypingMetrics()
    
    result.startSession('test') // No target WPM
    expect(result.currentSession.value.targetWPM).toBe(60)
  })

  it('calculates zero performance score', () => {
    const result = usePerformanceOptimization()
    
    expect(result.score.value).toBeGreaterThanOrEqual(0)
    expect(result.score.value).toBeLessThanOrEqual(100)
  })
})
