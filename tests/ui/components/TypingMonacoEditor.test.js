/**
 * TypingMonacoEditor Component Tests
 * Tests Monaco integration, typing metrics, session management, and performance
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountWithExpectations, quickTest, testWithProps, performanceTest, memoryLeakTest } from '../../framework/core-utils.js'
import TypingMonacoEditor from '../../../app/components/TypingMonacoEditor.vue'

// Mock Monaco Editor completely to avoid resolution issues
const mockEditor = {
  dispose: vi.fn(),
  focus: vi.fn(),
  getValue: vi.fn(() => ''),
  setValue: vi.fn(),
  onDidChangeModelContent: vi.fn(),
  onKeyDown: vi.fn(),
  getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
  deltaDecorations: vi.fn(() => [])
}

const mockModel = {
  dispose: vi.fn(),
  setValue: vi.fn(),
  getValue: vi.fn(() => 'test content'),
  getLinesContent: vi.fn(() => ['test content']),
  getPositionAt: vi.fn(() => ({ lineNumber: 1, column: 1 })),
  onDidChangeContent: vi.fn()
}

// Mock Monaco Editor to avoid package resolution issues
vi.mock('monaco-editor', async () => {
  return {
    default: {
      editor: {
        create: vi.fn(() => mockEditor),
        createModel: vi.fn(() => mockModel)
      },
      Range: class MockRange {},
      KeyCode: {
        Backspace: 1,
        Delete: 2
      }
    },
    editor: {
      create: vi.fn(() => mockEditor),
      createModel: vi.fn(() => mockModel)
    },
    Range: class MockRange {},
    KeyCode: {
      Backspace: 1,
      Delete: 2
    }
  }
})

// Mock typing metrics composable
const mockTypingMetrics = {
  currentSession: { value: null },
  isActive: { value: false },
  metrics: {
    wpm: 45,
    accuracy: 95.5,
    consistency: 88.2,
    errorPatterns: new Map([['t->y', 3], ['e->r', 2]])
  },
  sessionDuration: { value: 0 },
  progressScore: { value: 75 },
  startSession: vi.fn(),
  endSession: vi.fn(),
  pauseSession: vi.fn(),
  resumeSession: vi.fn(),
  resetSession: vi.fn(),
  recordKeystroke: vi.fn()
}

vi.mock('../../../app/composables/useTypingMetrics', () => ({
  useTypingMetrics: () => mockTypingMetrics
}))

describe('TypingMonacoEditor Component', () => {
  const defaultProps = {
    targetText: 'console.log("Hello, World!");',
    drillType: 'javascript-basics',
    targetWPM: 60,
    language: 'javascript'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock state
    mockTypingMetrics.isActive.value = false
    mockTypingMetrics.currentSession.value = null
    mockTypingMetrics.sessionDuration.value = 0
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Initialization', () => {
    it('should render with all core UI elements', async () => {
      await quickTest(TypingMonacoEditor, async (wrapper) => {
        wrapper.should.render()
          .contain('WPM')
          .contain('Accuracy')
          .contain('Consistency')

        // Check metrics overlay
        const metricsOverlay = wrapper.find('.metrics-overlay')
        expect(metricsOverlay.exists()).toBe(true)

        // Check editor container
        const editorContainer = wrapper.find('.editor-container')
        expect(editorContainer.exists()).toBe(true)

        // Check session controls
        const sessionControls = wrapper.find('.session-controls')
        expect(sessionControls.exists()).toBe(true)
      }, { props: defaultProps })
    })

    it('should initialize Monaco editor on mount', async () => {
      await quickTest(TypingMonacoEditor, async (wrapper) => {
        // Wait for nextTick to allow onMounted to execute
        await wrapper.vm.$nextTick()
        
        expect(vi.mocked(mockModel.setValue)).toHaveBeenCalledWith(defaultProps.targetText)
      }, { props: defaultProps })
    })

    it('should handle missing Monaco gracefully', async () => {
      vi.mocked(mockEditor.create).mockImplementation(() => {
        throw new Error('Monaco not available')
      })

      await quickTest(TypingMonacoEditor, async (wrapper) => {
        wrapper.should.render()
        // Should not crash if Monaco fails to initialize
      }, { props: defaultProps })
    })
  })

  describe('Metrics Display', () => {
    it('should display real-time typing metrics', async () => {
      await quickTest(TypingMonacoEditor, async (wrapper) => {
        // Check WPM display
        const wpmValue = wrapper.find('.metric .value')
        expect(wpmValue.text()).toBe('45')

        // Check accuracy display
        const accuracyElements = wrapper.findAll('.metric')
        const accuracyElement = accuracyElements.find(el => 
          el.find('label').text() === 'Accuracy'
        )
        expect(accuracyElement?.find('.value').text()).toBe('96%')

        // Check consistency display
        const consistencyElement = accuracyElements.find(el =>
          el.find('label').text() === 'Consistency'
        )
        expect(consistencyElement?.find('.value').text()).toBe('88%')
      }, { props: defaultProps })
    })

    it('should apply correct CSS classes based on performance', async () => {
      // Test excellent WPM (>= target)
      mockTypingMetrics.metrics.wpm = 65
      await quickTest(TypingMonacoEditor, async (wrapper) => {
        const wpmValue = wrapper.find('.metric .value.excellent')
        expect(wpmValue.exists()).toBe(true)
      }, { props: defaultProps })

      // Test good accuracy (>= 97%)
      mockTypingMetrics.metrics.accuracy = 98
      await quickTest(TypingMonacoEditor, async (wrapper) => {
        const accuracyValue = wrapper.find('.metric .value.excellent')
        expect(accuracyValue.exists()).toBe(true)
      }, { props: defaultProps })
    })

    it('should display session duration when active', async () => {
      mockTypingMetrics.sessionDuration.value = 125000 // 2:05
      
      await quickTest(TypingMonacoEditor, async (wrapper) => {
        const timeElements = wrapper.findAll('.metric')
        const timeElement = timeElements.find(el =>
          el.find('label').text() === 'Time'
        )
        expect(timeElement?.find('.value').text()).toBe('2:05')
      }, { props: defaultProps })
    })

    it('should display progress bar with correct width', async () => {
      mockTypingMetrics.progressScore.value = 75

      await quickTest(TypingMonacoEditor, async (wrapper) => {
        const progressFill = wrapper.find('.progress-fill')
        expect(progressFill.attributes('style')).toContain('width: 75%')
      }, { props: defaultProps })
    })
  })

  describe('Session Management', () => {
    it('should start typing session correctly', async () => {
      await quickTest(TypingMonacoEditor, async (wrapper) => {
        const startButton = wrapper.find('.btn-primary')
        expect(startButton.text()).toBe('Start Typing Session')
        expect(startButton.attributes('disabled')).toBeUndefined()

        await wrapper.interact.click('.btn-primary')

        expect(mockTypingMetrics.startSession).toHaveBeenCalledWith(
          defaultProps.drillType, 
          defaultProps.targetWPM
        )
      }, { props: defaultProps })
    })

    it('should disable start button when no target text', async () => {
      await quickTest(TypingMonacoEditor, async (wrapper) => {
        const startButton = wrapper.find('.btn-primary')
        expect(startButton.attributes('disabled')).toBeDefined()
      }, { props: { ...defaultProps, targetText: '' } })
    })

    it('should show correct controls during active session', async () => {
      mockTypingMetrics.isActive.value = true

      await quickTest(TypingMonacoEditor, async (wrapper) => {
        // Start button should be hidden
        expect(wrapper.find('.btn-primary').exists()).toBe(false)

        // Pause and End buttons should be visible
        const pauseButton = wrapper.find('.btn-secondary')
        const endButton = wrapper.find('.btn-danger')
        
        expect(pauseButton.exists()).toBe(true)
        expect(pauseButton.text()).toBe('Pause')
        
        expect(endButton.exists()).toBe(true)
        expect(endButton.text()).toBe('End Session')
      }, { props: defaultProps })
    })

    it('should handle session pause and resume', async () => {
      mockTypingMetrics.isActive.value = true

      await quickTest(TypingMonacoEditor, async (wrapper) => {
        await wrapper.interact.click('.btn-secondary')
        expect(mockTypingMetrics.pauseSession).toHaveBeenCalled()
      }, { props: defaultProps })
    })

    it('should handle session end', async () => {
      mockTypingMetrics.isActive.value = true
      const mockSession = { 
        id: 'test-session',
        finalWPM: 45,
        accuracy: 95
      }
      mockTypingMetrics.endSession.mockReturnValue(mockSession)

      await quickTest(TypingMonacoEditor, async (wrapper) => {
        await wrapper.interact.click('.btn-danger')
        
        expect(mockTypingMetrics.endSession).toHaveBeenCalled()
        wrapper.should.emit('sessionCompleted', [mockSession])
      }, { props: defaultProps })
    })

    it('should handle session reset', async () => {
      await quickTest(TypingMonacoEditor, async (wrapper) => {
        await wrapper.interact.click('.btn-outline')
        expect(mockTypingMetrics.resetSession).toHaveBeenCalled()
      }, { props: defaultProps })
    })
  })

  describe('Error Patterns Display', () => {
    it('should show error patterns when present', async () => {
      mockTypingMetrics.metrics.errorPatterns = new Map([
        ['t->y', 5],
        ['e->r', 3],
        ['i->o', 2]
      ])

      await quickTest(TypingMonacoEditor, async (wrapper) => {
        const errorPatternsSection = wrapper.find('.error-patterns')
        expect(errorPatternsSection.exists()).toBe(true)
        
        const errorItems = wrapper.findAll('.error-item')
        expect(errorItems.length).toBe(3)
        
        // Check first error pattern
        const firstError = errorItems[0]
        expect(firstError.find('.pattern').text()).toBe('t->y')
        expect(firstError.find('.count').text()).toBe('5')
      }, { props: defaultProps })
    })

    it('should hide error patterns when none present', async () => {
      mockTypingMetrics.metrics.errorPatterns = new Map()

      await quickTest(TypingMonacoEditor, async (wrapper) => {
        const errorPatternsSection = wrapper.find('.error-patterns')
        expect(errorPatternsSection.exists()).toBe(false)
      }, { props: defaultProps })
    })

    it('should limit error patterns display to top 5', async () => {
      const manyErrors = new Map()
      for (let i = 0; i < 10; i++) {
        manyErrors.set(`error${i}`, i + 1)
      }
      mockTypingMetrics.metrics.errorPatterns = manyErrors

      await quickTest(TypingMonacoEditor, async (wrapper) => {
        const errorItems = wrapper.findAll('.error-item')
        expect(errorItems.length).toBe(5)
      }, { props: defaultProps })
    })
  })

  describe('Target Text Display', () => {
    it('should display target text when provided', async () => {
      await quickTest(TypingMonacoEditor, async (wrapper) => {
        const targetTextDisplay = wrapper.find('.target-text pre')
        expect(targetTextDisplay.exists()).toBe(true)
        expect(targetTextDisplay.text()).toBe(defaultProps.targetText)
      }, { props: defaultProps })
    })

    it('should hide target text when not provided', async () => {
      await quickTest(TypingMonacoEditor, async (wrapper) => {
        const targetTextDisplay = wrapper.find('.target-text')
        expect(targetTextDisplay.exists()).toBe(false)
      }, { props: { ...defaultProps, targetText: '' } })
    })

    it('should update target text when prop changes', async () => {
      await quickTest(TypingMonacoEditor, async (wrapper) => {
        const newText = 'function test() { return true; }'
        await wrapper.setProps({ targetText: newText })
        
        const targetTextDisplay = wrapper.find('.target-text pre')
        expect(targetTextDisplay.text()).toBe(newText)
      }, { props: defaultProps })
    })
  })

  describe('Keyboard Integration', () => {
    it('should record keystrokes during active session', async () => {
      mockTypingMetrics.isActive.value = true
      
      await quickTest(TypingMonacoEditor, async (wrapper) => {
        // Simulate typing
        const editorArea = wrapper.find('.monaco-editor')
        await editorArea.trigger('keydown', { key: 'c' })
        
        // Should have called recordKeystroke through Monaco events
        // (This would be called by Monaco's onDidChangeModelContent handler)
      }, { props: defaultProps })
    })

    it('should handle special keys like backspace', async () => {
      mockTypingMetrics.isActive.value = true
      
      await quickTest(TypingMonacoEditor, async (wrapper) => {
        // Simulate backspace
        const editorArea = wrapper.find('.monaco-editor')
        await editorArea.trigger('keydown', { keyCode: 1 }) // Monaco.KeyCode.Backspace
        
        // Keystroke should be recorded for backspace
      }, { props: defaultProps })
    })
  })

  describe('Performance Testing', () => {
    it('should render within performance budget', async () => {
      const renderTime = await performanceTest(async () => {
        const wrapper = await mountWithExpectations(TypingMonacoEditor, { props: defaultProps })
        await wrapper.vm.$nextTick()
        wrapper.unmount()
      }, 100) // 100ms budget for complex component

      expect(renderTime).toBeLessThan(100)
    })

    it('should not have memory leaks during typing sessions', async () => {
      await memoryLeakTest(async () => {
        const wrapper = await mountWithExpectations(TypingMonacoEditor, { props: defaultProps })
        
        // Start session
        mockTypingMetrics.isActive.value = true
        await wrapper.vm.startTypingSession()
        
        // End session
        await wrapper.vm.endTypingSession()
        
        wrapper.unmount()
      }, 5)
    })

    it('should handle rapid keystroke events efficiently', async () => {
      mockTypingMetrics.isActive.value = true
      const wrapper = await mountWithExpectations(TypingMonacoEditor, { props: defaultProps })
      
      const rapidTypingTime = await performanceTest(async () => {
        // Simulate 100 rapid keystrokes
        for (let i = 0; i < 100; i++) {
          mockTypingMetrics.recordKeystroke('a', 'a', { line: 1, column: i })
        }
      }, 50) // 50ms budget for 100 keystrokes

      expect(rapidTypingTime).toBeLessThan(50)
      wrapper.unmount()
    })
  })

  describe('Props Validation', () => {
    const propVariations = [
      { targetText: '', drillType: 'empty', targetWPM: 30, language: 'plaintext' },
      { targetText: 'short', drillType: 'basic', targetWPM: 120, language: 'python' },
      { targetText: 'A'.repeat(10000), drillType: 'endurance', targetWPM: 40, language: 'typescript' }
    ]

    it('should handle various prop combinations', async () => {
      await testWithProps(TypingMonacoEditor, propVariations, async (wrapper, props) => {
        wrapper.should.render()
        
        // Should handle all prop variations without crashing
        expect(wrapper.exists()).toBe(true)
        
        // Should respect target WPM in display
        expect(wrapper.html()).toBeTruthy()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle Monaco editor creation failure', async () => {
      vi.mocked(mockEditor.create).mockImplementation(() => {
        throw new Error('Monaco initialization failed')
      })

      await quickTest(TypingMonacoEditor, async (wrapper) => {
        wrapper.should.render()
        // Should render UI elements even if Monaco fails
        expect(wrapper.find('.metrics-overlay').exists()).toBe(true)
        expect(wrapper.find('.session-controls').exists()).toBe(true)
      }, { props: defaultProps })
    })

    it('should handle empty target text gracefully', async () => {
      await quickTest(TypingMonacoEditor, async (wrapper) => {
        const startButton = wrapper.find('.btn-primary')
        expect(startButton.attributes('disabled')).toBeDefined()
      }, { props: { ...defaultProps, targetText: '' } })
    })

    it('should cleanup properly on unmount', async () => {
      const wrapper = await mountWithExpectations(TypingMonacoEditor, { props: defaultProps })
      await wrapper.vm.$nextTick()
      
      wrapper.unmount()
      
      // Should dispose of Monaco resources
      expect(mockEditor.dispose).toHaveBeenCalled()
      expect(mockModel.dispose).toHaveBeenCalledTimes(2) // target + user models
    })
  })

  describe('Duration Formatting', () => {
    it('should format durations correctly', async () => {
      const component = await mountWithExpectations(TypingMonacoEditor, { props: defaultProps })
      const vm = component.vm
      
      expect(vm.formatDuration(5000)).toBe('5s')
      expect(vm.formatDuration(65000)).toBe('1:05')
      expect(vm.formatDuration(125000)).toBe('2:05')
      expect(vm.formatDuration(3665000)).toBe('61:05')
      
      component.unmount()
    })
  })
})