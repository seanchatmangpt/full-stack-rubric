/**
 * @fileoverview Unit tests for TypingMonacoEditor component using London School TDD
 * Focus on interaction testing and behavior verification with proper mocking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import TypingMonacoEditor from '@/components/TypingMonacoEditor.vue'

// Mock Monaco Editor module
const mockEditor = {
  create: vi.fn(),
  createModel: vi.fn(),
  Range: vi.fn(() => ({})),
  KeyCode: {
    Backspace: 1,
    Delete: 2
  }
}

const mockEditorInstance = {
  onDidChangeModelContent: vi.fn(),
  onKeyDown: vi.fn(),
  deltaDecorations: vi.fn(() => []),
  focus: vi.fn(),
  dispose: vi.fn(),
  getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 }))
}

const mockTextModel = {
  setValue: vi.fn(),
  getValue: vi.fn(() => ''),
  getLinesContent: vi.fn(() => ['']),
  getPositionAt: vi.fn(() => ({ lineNumber: 1, column: 1 })),
  onDidChangeContent: vi.fn(),
  dispose: vi.fn()
}

// Mock useTypingMetrics composable
const mockTypingMetrics = {
  currentSession: { value: null },
  isActive: { value: false },
  metrics: {
    wpm: 45,
    accuracy: 95,
    consistency: 85,
    errorPatterns: new Map([['t->y', 3], ['h->g', 2]])
  },
  sessionDuration: { value: 0 },
  progressScore: { value: 75 },
  startSession: vi.fn(),
  endSession: vi.fn(() => ({
    id: 'test-session',
    finalWPM: 45,
    accuracy: { raw: 95 }
  })),
  pauseSession: vi.fn(),
  resumeSession: vi.fn(),
  resetSession: vi.fn(),
  recordKeystroke: vi.fn()
}

vi.mock('monaco-editor', () => ({
  default: mockEditor,
  editor: mockEditor
}))

vi.mock('@/composables/useTypingMetrics', () => ({
  useTypingMetrics: () => mockTypingMetrics
}))

describe('TypingMonacoEditor Component - London School TDD', () => {
  let wrapper
  const defaultProps = {
    targetText: 'const greeting = "Hello World";\nconsole.log(greeting);',
    drillType: 'function-names',
    targetWPM: 60,
    language: 'javascript'
  }

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
    
    // Setup Monaco mocks
    mockEditor.createModel.mockReturnValue(mockTextModel)
    mockEditor.create.mockReturnValue(mockEditorInstance)
    
    // Mock DOM methods
    Object.defineProperty(global, 'performance', {
      value: {
        now: vi.fn(() => Date.now())
      }
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('Component Initialization', () => {
    it('should collaborate with Monaco editor during initialization', async () => {
      wrapper = mount(TypingMonacoEditor, {
        props: defaultProps
      })
      
      await nextTick()
      await flushPromises()
      
      // Verify collaboration with Monaco editor
      expect(mockEditor.createModel).toHaveBeenCalledTimes(2) // Target and user models
      expect(mockEditor.createModel).toHaveBeenCalledWith(defaultProps.targetText, defaultProps.language)
      expect(mockEditor.createModel).toHaveBeenCalledWith('', defaultProps.language)
      
      expect(mockEditor.create).toHaveBeenCalledOnce()
      expect(mockEditor.create).toHaveBeenCalledWith(
        expect.any(Object), // DOM element
        expect.objectContaining({
          model: mockTextModel,
          wordWrap: 'off',
          lineNumbers: 'on',
          minimap: expect.objectContaining({ enabled: false })
        })
      )
    })

    it('should setup keystroke monitoring after initialization', async () => {
      wrapper = mount(TypingMonacoEditor, {
        props: defaultProps
      })
      
      await nextTick()
      await flushPromises()
      
      // Verify interaction setup with editor instance
      expect(mockEditorInstance.onDidChangeModelContent).toHaveBeenCalledOnce()
      expect(mockEditorInstance.onKeyDown).toHaveBeenCalledOnce()
      expect(mockTextModel.onDidChangeContent).toHaveBeenCalledOnce()
    })

    it('should initialize with correct default metrics display', () => {
      wrapper = mount(TypingMonacoEditor, {
        props: defaultProps
      })
      
      // Verify metrics collaboration display
      const wpmValue = wrapper.find('.metric .value')
      expect(wpmValue.text()).toBe('45')
      
      const accuracyValue = wrapper.findAll('.metric .value')[1]
      expect(accuracyValue.text()).toBe('95%')
    })
  })

  describe('Session Management Interactions', () => {
    it('should collaborate with typing metrics when starting session', async () => {
      wrapper = mount(TypingMonacoEditor, {
        props: defaultProps
      })
      
      const startButton = wrapper.find('[data-testid="start-button"], .btn-primary')
      await startButton.trigger('click')
      
      // Verify collaboration with metrics composable
      expect(mockTypingMetrics.startSession).toHaveBeenCalledOnce()
      expect(mockTypingMetrics.startSession).toHaveBeenCalledWith(
        defaultProps.drillType,
        defaultProps.targetWPM
      )
      
      // Verify editor interaction
      expect(mockTextModel.setValue).toHaveBeenCalledWith('')
      expect(mockEditorInstance.focus).toHaveBeenCalledOnce()
    })

    it('should coordinate session end with metrics and emit results', async () => {
      mockTypingMetrics.isActive.value = true
      
      wrapper = mount(TypingMonacoEditor, {
        props: defaultProps
      })
      
      const endButton = wrapper.find('.btn-danger')
      await endButton.trigger('click')
      
      // Verify metrics collaboration
      expect(mockTypingMetrics.endSession).toHaveBeenCalledOnce()
      
      // Verify event emission
      const emitted = wrapper.emitted('sessionCompleted')
      expect(emitted).toBeTruthy()
      expect(emitted[0][0]).toEqual({
        id: 'test-session',
        finalWPM: 45,
        accuracy: { raw: 95 }
      })
    })

    it('should pause session through metrics collaboration', async () => {
      mockTypingMetrics.isActive.value = true
      
      wrapper = mount(TypingMonacoEditor, {
        props: defaultProps
      })
      
      const pauseButton = wrapper.find('.btn-secondary')
      await pauseButton.trigger('click')
      
      expect(mockTypingMetrics.pauseSession).toHaveBeenCalledOnce()
    })

    it('should reset session and clear editor state', async () => {
      wrapper = mount(TypingMonacoEditor, {
        props: defaultProps
      })
      
      const resetButton = wrapper.find('.btn-outline')
      await resetButton.trigger('click')
      
      expect(mockTypingMetrics.resetSession).toHaveBeenCalledOnce()
    })
  })

  describe('Keystroke Processing Behavior', () => {
    it('should process content changes and record keystrokes when active', async () => {
      mockTypingMetrics.isActive.value = true
      
      wrapper = mount(TypingMonacoEditor, {
        props: defaultProps
      })
      
      await nextTick()
      await flushPromises()
      
      // Simulate keystroke event
      const contentChangeCallback = mockEditorInstance.onDidChangeModelContent.mock.calls[0][0]
      
      const mockChangeEvent = {
        changes: [{
          range: {
            startLineNumber: 1,
            startColumn: 1
          },
          text: 'c'
        }]
      }
      
      mockTextModel.getLinesContent.mockReturnValue(['const greeting = "Hello World";'])
      
      contentChangeCallback(mockChangeEvent)
      
      // Verify keystroke recording collaboration
      expect(mockTypingMetrics.recordKeystroke).toHaveBeenCalledWith(
        'c',
        'c', // Expected character from target text
        { line: 1, column: 1 }
      )
    })

    it('should handle backspace keystrokes through metrics', async () => {
      mockTypingMetrics.isActive.value = true
      
      wrapper = mount(TypingMonacoEditor, {
        props: defaultProps
      })
      
      await nextTick()
      await flushPromises()
      
      // Simulate backspace key event
      const keyDownCallback = mockEditorInstance.onKeyDown.mock.calls[0][0]
      
      const mockKeyEvent = {
        keyCode: mockEditor.KeyCode.Backspace
      }
      
      keyDownCallback(mockKeyEvent)
      
      // Verify backspace recording
      expect(mockTypingMetrics.recordKeystroke).toHaveBeenCalledWith(
        'Backspace',
        '',
        { line: 1, column: 1 }
      )
    })

    it('should not process keystrokes when session is inactive', async () => {
      mockTypingMetrics.isActive.value = false
      
      wrapper = mount(TypingMonacoEditor, {
        props: defaultProps
      })
      
      await nextTick()
      await flushPromises()
      
      // Simulate keystroke when inactive
      const contentChangeCallback = mockEditorInstance.onDidChangeModelContent.mock.calls[0][0]
      
      contentChangeCallback({
        changes: [{ text: 'x', range: { startLineNumber: 1, startColumn: 1 } }]
      })
      
      // Verify no keystroke recording when inactive
      expect(mockTypingMetrics.recordKeystroke).not.toHaveBeenCalled()
    })
  })

  describe('Visual Feedback and Decorations', () => {
    it('should apply visual decorations through Monaco collaboration', async () => {
      wrapper = mount(TypingMonacoEditor, {
        props: defaultProps
      })
      
      await nextTick()
      await flushPromises()
      
      // Simulate text comparison for decorations
      mockTextModel.getValue
        .mockReturnValueOnce('const') // User input
        .mockReturnValueOnce('const greeting = "Hello World";') // Target text
      
      mockTextModel.getPositionAt.mockReturnValue({ lineNumber: 1, column: 1 })
      
      const decorationCallback = mockTextModel.onDidChangeContent.mock.calls[0][0]
      decorationCallback()
      
      // Verify decoration application
      expect(mockEditorInstance.deltaDecorations).toHaveBeenCalled()
    })
  })

  describe('CSS Class Generation Logic', () => {
    it('should generate correct WPM performance classes', () => {
      wrapper = mount(TypingMonacoEditor, {
        props: defaultProps
      })
      
      // Test WPM classification logic
      const component = wrapper.vm
      
      expect(component.getWPMClass(70)).toBe('excellent') // >= targetWPM
      expect(component.getWPMClass(48)).toBe('good') // >= 80% of target
      expect(component.getWPMClass(36)).toBe('fair') // >= 60% of target
      expect(component.getWPMClass(30)).toBe('needs-improvement') // < 60% of target
    })

    it('should generate correct accuracy performance classes', () => {
      wrapper = mount(TypingMonacoEditor, {
        props: defaultProps
      })
      
      const component = wrapper.vm
      
      expect(component.getAccuracyClass(98)).toBe('excellent') // >= 97%
      expect(component.getAccuracyClass(92)).toBe('good') // >= 90%
      expect(component.getAccuracyClass(85)).toBe('fair') // >= 80%
      expect(component.getAccuracyClass(75)).toBe('needs-improvement') // < 80%
    })
  })

  describe('Duration Formatting Logic', () => {
    it('should format durations correctly', () => {
      wrapper = mount(TypingMonacoEditor, {
        props: defaultProps
      })
      
      const component = wrapper.vm
      
      expect(component.formatDuration(30000)).toBe('30s')
      expect(component.formatDuration(65000)).toBe('1:05')
      expect(component.formatDuration(125000)).toBe('2:05')
    })
  })

  describe('Error Pattern Display', () => {
    it('should display error patterns from metrics', () => {
      wrapper = mount(TypingMonacoEditor, {
        props: defaultProps
      })
      
      // Mock error patterns in metrics
      const errorPatterns = wrapper.find('.error-patterns')
      expect(errorPatterns.exists()).toBe(true)
      
      const errorItems = wrapper.findAll('.error-item')
      expect(errorItems.length).toBeGreaterThan(0)
    })
  })

  describe('Cleanup and Resource Management', () => {
    it('should dispose Monaco resources on unmount', async () => {
      wrapper = mount(TypingMonacoEditor, {
        props: defaultProps
      })
      
      await nextTick()
      await flushPromises()
      
      wrapper.unmount()
      
      // Verify resource cleanup
      expect(mockEditorInstance.dispose).toHaveBeenCalledOnce()
      expect(mockTextModel.dispose).toHaveBeenCalledTimes(2) // Target and user models
    })
  })

  describe('Props Reactivity', () => {
    it('should update target text model when props change', async () => {
      wrapper = mount(TypingMonacoEditor, {
        props: defaultProps
      })
      
      await nextTick()
      await flushPromises()
      
      // Change target text
      const newTargetText = 'function test() { return true; }'
      await wrapper.setProps({ targetText: newTargetText })
      
      // Verify model update
      expect(mockTextModel.setValue).toHaveBeenCalledWith(newTargetText)
    })
  })

  describe('Button State Management', () => {
    it('should show correct buttons based on session state', async () => {
      // Test inactive state
      mockTypingMetrics.isActive.value = false
      
      wrapper = mount(TypingMonacoEditor, {
        props: defaultProps
      })
      
      expect(wrapper.find('.btn-primary').exists()).toBe(true) // Start button
      expect(wrapper.find('.btn-secondary').exists()).toBe(false) // Pause button
      expect(wrapper.find('.btn-danger').exists()).toBe(false) // End button
      
      // Test active state
      await wrapper.setData({ isActive: true })
      mockTypingMetrics.isActive.value = true
      await wrapper.vm.$forceUpdate()
      
      await nextTick()
      
      expect(wrapper.find('.btn-secondary').exists()).toBe(true) // Pause button
      expect(wrapper.find('.btn-danger').exists()).toBe(true) // End button
    })

    it('should disable start button when no target text', async () => {
      wrapper = mount(TypingMonacoEditor, {
        props: { ...defaultProps, targetText: '' }
      })
      
      const startButton = wrapper.find('.btn-primary')
      expect(startButton.attributes('disabled')).toBeDefined()
    })
  })
})
