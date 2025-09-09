/**
 * @fileoverview Component Integration Tests
 * Tests component interactions, typing metrics, and Monaco Editor integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import TypingMonacoEditor from '../../app/components/TypingMonacoEditor.vue'

// Mock Monaco Editor for testing
vi.mock('monaco-editor', () => ({
  editor: {
    create: vi.fn(() => ({
      dispose: vi.fn(),
      onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
      onKeyDown: vi.fn(() => ({ dispose: vi.fn() })),
      focus: vi.fn(),
      getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
      deltaDecorations: vi.fn(() => [])
    })),
    createModel: vi.fn(() => ({
      dispose: vi.fn(),
      setValue: vi.fn(),
      getValue: vi.fn(() => ''),
      getLinesContent: vi.fn(() => ['']),
      getPositionAt: vi.fn(() => ({ lineNumber: 1, column: 1 })),
      onDidChangeContent: vi.fn(() => ({ dispose: vi.fn() }))
    })),
    MinimapPosition: { Inline: 1 }
  },
  KeyCode: {
    Backspace: 1,
    Delete: 2
  },
  Range: class MockRange {
    constructor() {
      this.startLineNumber = 1
      this.startColumn = 1
      this.endLineNumber = 1
      this.endColumn = 1
    }
  }
}))

// Mock the composable
vi.mock('../../app/composables/useTypingMetrics', () => ({
  useTypingMetrics: () => ({
    currentSession: { value: null },
    isActive: { value: false },
    metrics: { 
      value: { 
        wpm: 0, 
        accuracy: 100, 
        consistency: 100,
        errorPatterns: new Map()
      } 
    },
    sessionDuration: { value: 0 },
    progressScore: { value: 0 },
    startSession: vi.fn(),
    endSession: vi.fn(() => ({ id: 'test-session', wpm: 65 })),
    pauseSession: vi.fn(),
    resumeSession: vi.fn(),
    resetSession: vi.fn(),
    recordKeystroke: vi.fn()
  })
}))

describe('Component Integration Tests', () => {
  let wrapper
  
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('TypingMonacoEditor Component', () => {
    beforeEach(() => {
      wrapper = mount(TypingMonacoEditor, {
        props: {
          targetText: 'const hello = "world";',
          drillType: 'javascript-basics',
          targetWPM: 60,
          language: 'javascript'
        },
        global: {
          plugins: [createTestingPinia({
            createSpy: vi.fn
          })]
        }
      })
    })

    it('should render with proper structure', () => {
      expect(wrapper.find('.typing-monaco-container').exists()).toBe(true)
      expect(wrapper.find('.metrics-overlay').exists()).toBe(true)
      expect(wrapper.find('.editor-container').exists()).toBe(true)
      expect(wrapper.find('.session-controls').exists()).toBe(true)
    })

    it('should display typing metrics correctly', () => {
      const wpmElement = wrapper.find('[class*="metric"] .value')
      expect(wpmElement.exists()).toBe(true)
      
      // Metrics should be displayed
      const metricsElements = wrapper.findAll('.metric')
      expect(metricsElements.length).toBeGreaterThanOrEqual(3) // WPM, Accuracy, Consistency
    })

    it('should show target text properly', () => {
      const targetTextElement = wrapper.find('.target-text pre')
      expect(targetTextElement.exists()).toBe(true)
      expect(targetTextElement.text()).toBe('const hello = "world";')
    })

    it('should handle session control buttons', async () => {
      // Initially should show "Start Typing Session" button
      const startButton = wrapper.find('button:not([disabled])')
      expect(startButton.exists()).toBe(true)
      expect(startButton.text()).toContain('Start')
      
      // Click start button
      await startButton.trigger('click')
      
      // Should trigger the start session method (mocked)
      // Note: The actual composable method calls are mocked, 
      // so we're testing the UI interaction
    })

    it('should display progress bar', () => {
      const progressBar = wrapper.find('.progress-bar')
      expect(progressBar.exists()).toBe(true)
      
      const progressFill = wrapper.find('.progress-fill')
      expect(progressFill.exists()).toBe(true)
    })

    it('should show error patterns when available', async () => {
      // Mock error patterns
      const errorPatternsMap = new Map([['th', 3], ['er', 2]])
      
      await wrapper.setData({
        metrics: {
          ...wrapper.vm.metrics,
          errorPatterns: errorPatternsMap
        }
      })
      
      // Error patterns section should be visible
      const errorPatterns = wrapper.find('.error-patterns')
      expect(errorPatterns.exists()).toBe(true)
    })

    it('should handle reset functionality', async () => {
      const resetButton = wrapper.find('.btn-outline')
      expect(resetButton.exists()).toBe(true)
      
      await resetButton.trigger('click')
      // Reset method should be called (mocked)
    })

    it('should format duration correctly', () => {
      const component = wrapper.vm
      
      // Test duration formatting
      expect(component.formatDuration(30000)).toBe('30s')
      expect(component.formatDuration(65000)).toBe('1:05')
      expect(component.formatDuration(125000)).toBe('2:05')
    })

    it('should get correct performance classes', () => {
      const component = wrapper.vm
      
      // Test WPM classes
      expect(component.getWPMClass(70)).toBe('excellent') // >= targetWPM
      expect(component.getWPMClass(50)).toBe('good') // >= 80% of target
      expect(component.getWPMClass(40)).toBe('fair') // >= 60% of target
      expect(component.getWPMClass(20)).toBe('needs-improvement')
      
      // Test accuracy classes
      expect(component.getAccuracyClass(98)).toBe('excellent')
      expect(component.getAccuracyClass(92)).toBe('good')
      expect(component.getAccuracyClass(85)).toBe('fair')
      expect(component.getAccuracyClass(70)).toBe('needs-improvement')
    })
  })

  describe('Component Props and Events', () => {
    it('should handle prop changes correctly', async () => {
      wrapper = mount(TypingMonacoEditor, {
        props: {
          targetText: 'original text',
          drillType: 'test',
          targetWPM: 40,
          language: 'javascript'
        }
      })
      
      // Change props
      await wrapper.setProps({
        targetText: 'new text content',
        targetWPM: 80
      })
      
      expect(wrapper.props('targetText')).toBe('new text content')
      expect(wrapper.props('targetWPM')).toBe(80)
    })

    it('should emit sessionCompleted event', async () => {
      wrapper = mount(TypingMonacoEditor, {
        props: {
          targetText: 'test text',
          drillType: 'test'
        }
      })
      
      // Simulate session completion
      const component = wrapper.vm
      component.endTypingSession()
      
      // Check if event was emitted (mocked session)
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('sessionCompleted')).toBeTruthy()
    })
  })

  describe('Real-time Feedback Integration', () => {
    it('should handle keystroke recording', () => {
      wrapper = mount(TypingMonacoEditor, {
        props: {
          targetText: 'hello world',
          drillType: 'test'
        }
      })
      
      const component = wrapper.vm
      
      // Test expected character calculation
      const lines = ['hello world']
      const position = { line: 1, column: 1 }
      
      expect(component.getExpectedCharAt(lines, position)).toBe('h')
      expect(component.getExpectedCharAt(lines, { line: 1, column: 6 })).toBe(' ')
      expect(component.getExpectedCharAt(lines, { line: 1, column: 12 })).toBe('')
    })

    it('should update typing feedback correctly', () => {
      wrapper = mount(TypingMonacoEditor, {
        props: {
          targetText: 'const x = 5;',
          drillType: 'test'
        }
      })
      
      const component = wrapper.vm
      
      // Test feedback update method exists and doesn't throw
      expect(() => component.updateTypingFeedback()).not.toThrow()
    })
  })

  describe('Performance Monitoring', () => {
    it('should monitor component performance during interaction', async () => {
      const startTime = performance.now()
      
      wrapper = mount(TypingMonacoEditor, {
        props: {
          targetText: 'performance test',
          drillType: 'perf-test'
        }
      })
      
      // Simulate multiple interactions
      const buttons = wrapper.findAll('button')
      for (const button of buttons) {
        if (!button.attributes('disabled')) {
          await button.trigger('click')
        }
      }
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Component should render and respond quickly
      expect(renderTime).toBeLessThan(1000) // Less than 1 second
    })

    it('should handle rapid state changes gracefully', async () => {
      wrapper = mount(TypingMonacoEditor, {
        props: {
          targetText: 'rapid change test',
          drillType: 'stress-test'
        }
      })
      
      // Rapidly change props
      const changes = [
        { targetText: 'change 1' },
        { targetText: 'change 2' },
        { targetText: 'change 3' },
        { targetWPM: 100 },
        { targetWPM: 50 }
      ]
      
      for (const change of changes) {
        await wrapper.setProps(change)
        await wrapper.vm.$nextTick()
      }
      
      // Component should remain stable
      expect(wrapper.find('.typing-monaco-container').exists()).toBe(true)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing or invalid props gracefully', () => {
      expect(() => {
        wrapper = mount(TypingMonacoEditor, {
          props: {
            // Missing required props
            targetText: '',
            drillType: ''
          }
        })
      }).not.toThrow()
      
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle Monaco Editor initialization failure', async () => {
      // Mock Monaco to fail
      vi.mocked(await import('monaco-editor')).editor.create.mockImplementationOnce(() => {
        throw new Error('Monaco initialization failed')
      })
      
      expect(() => {
        wrapper = mount(TypingMonacoEditor, {
          props: {
            targetText: 'error test',
            drillType: 'error-test'
          }
        })
      }).not.toThrow()
    })

    it('should handle empty target text', () => {
      wrapper = mount(TypingMonacoEditor, {
        props: {
          targetText: '',
          drillType: 'empty-test'
        }
      })
      
      const component = wrapper.vm
      expect(component.getExpectedCharAt([], { line: 1, column: 1 })).toBe('')
    })

    it('should validate metrics calculations with edge cases', () => {
      wrapper = mount(TypingMonacoEditor, {
        props: {
          targetText: 'edge case test',
          drillType: 'edge-test'
        }
      })
      
      const component = wrapper.vm
      
      // Test with extreme values
      expect(component.getWPMClass(0)).toBe('needs-improvement')
      expect(component.getWPMClass(1000)).toBe('excellent')
      expect(component.getAccuracyClass(0)).toBe('needs-improvement')
      expect(component.getAccuracyClass(100)).toBe('excellent')
    })
  })
})
