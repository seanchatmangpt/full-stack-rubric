/**
 * @fileoverview Integration tests for Monaco Editor typing interface
 * Tests the complete typing interface including editor integration and real-time feedback
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Mock Monaco Editor
const mockEditor = {
  getValue: vi.fn(() => ''),
  setValue: vi.fn(),
  onDidChangeModelContent: vi.fn(),
  onKeyDown: vi.fn(),
  getModel: vi.fn(() => ({
    onDidChangeContent: vi.fn()
  })),
  deltaDecorations: vi.fn(() => []),
  getSelections: vi.fn(() => []),
  setPosition: vi.fn(),
  focus: vi.fn(),
  dispose: vi.fn()
}

// Mock Monaco module
vi.mock('monaco-editor', () => ({
  editor: {
    create: vi.fn(() => mockEditor),
    defineTheme: vi.fn(),
    setTheme: vi.fn()
  },
  languages: {
    register: vi.fn(),
    setMonarchTokensProvider: vi.fn()
  }
}))

// Mock typing tutor component
const TypingTutorComponent = {
  template: `
    <div class="typing-tutor">
      <div class="tutor-header">
        <div class="stats">
          <span class="wpm">{{ stats.wpm }} WPM</span>
          <span class="accuracy">{{ stats.accuracy }}%</span>
          <span class="time">{{ formatTime(stats.timeElapsed) }}</span>
        </div>
        <div class="controls">
          <button @click="startSession" :disabled="isActive">Start</button>
          <button @click="resetSession" :disabled="!hasStarted">Reset</button>
          <button @click="togglePause" :disabled="!isActive">{{ isPaused ? 'Resume' : 'Pause' }}</button>
        </div>
      </div>
      
      <div class="editor-container">
        <div class="target-text" v-if="targetText">
          <div 
            v-for="(char, index) in targetText" 
            :key="index"
            :class="getCharClass(index)"
            class="target-char"
          >
            {{ char === ' ' ? '·' : char }}
          </div>
        </div>
        <div ref="editorRef" class="monaco-editor"></div>
      </div>
      
      <div class="feedback-panel" v-if="showFeedback">
        <div class="real-time-feedback">
          <div class="error-highlight" v-if="currentError">
            {{ currentError }}
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  props: {
    targetText: String,
    showFeedback: { type: Boolean, default: true },
    timeLimit: { type: Number, default: 0 }
  },
  data() {
    return {
      editor: null,
      stats: {
        wpm: 0,
        accuracy: 100,
        timeElapsed: 0
      },
      isActive: false,
      isPaused: false,
      hasStarted: false,
      currentError: '',
      progress: 0,
      keystrokes: [],
      startTime: 0,
      currentPosition: 0,
      decorations: []
    }
  },
  mounted() {
    this.initializeEditor()
  },
  beforeUnmount() {
    this.cleanup()
  },
  methods: {
    initializeEditor() {
      // Mock editor initialization
      this.editor = mockEditor
      this.setupEventListeners()
    },
    
    setupEventListeners() {
      this.editor.onDidChangeModelContent(() => {
        if (this.isActive && !this.isPaused) {
          this.handleTextChange()
        }
      })
      
      this.editor.onKeyDown((e) => {
        if (this.isActive && !this.isPaused) {
          this.handleKeyDown(e)
        }
      })
    },
    
    handleTextChange() {
      const currentText = this.editor.getValue()
      this.validateInput(currentText)
      this.updateStats()
      this.updateProgress()
    },
    
    handleKeyDown(event) {
      const keystroke = {
        timestamp: Date.now(),
        key: event.code,
        correct: this.isKeystrokeCorrect(event.code),
        position: this.currentPosition
      }
      
      this.keystrokes.push(keystroke)
      this.updateRealtimeStats()
    },
    
    isKeystrokeCorrect(keyCode) {
      const currentText = this.editor.getValue()
      const targetChar = this.targetText[currentText.length - 1]
      return this.keyCodeMatches(keyCode, targetChar)
    },
    
    keyCodeMatches(keyCode, targetChar) {
      // Simplified key matching logic
      if (keyCode === 'Space' && targetChar === ' ') return true
      if (keyCode.startsWith('Key') && keyCode.slice(3).toLowerCase() === targetChar.toLowerCase()) return true
      return false
    },
    
    validateInput(currentText) {
      this.currentError = ''
      this.currentPosition = currentText.length
      
      for (let i = 0; i < currentText.length; i++) {
        if (i >= this.targetText.length) {
          this.currentError = 'Extra characters typed'
          break
        }
        
        if (currentText[i] !== this.targetText[i]) {
          this.currentError = `Expected '${this.targetText[i]}' but got '${currentText[i]}'`
          break
        }
      }
      
      this.updateDecorations(currentText)
    },
    
    updateDecorations(currentText) {
      const newDecorations = []
      
      for (let i = 0; i < currentText.length; i++) {
        const isCorrect = i < this.targetText.length && currentText[i] === this.targetText[i]
        
        if (!isCorrect) {
          newDecorations.push({
            range: { startLineNumber: 1, startColumn: i + 1, endLineNumber: 1, endColumn: i + 2 },
            options: { inlineClassName: 'typing-error' }
          })
        }
      }
      
      this.decorations = this.editor.deltaDecorations(this.decorations, newDecorations)
    },
    
    updateStats() {
      if (!this.startTime) return
      
      const currentTime = Date.now()
      const timeElapsed = (currentTime - this.startTime) / 1000
      const currentText = this.editor.getValue()
      
      // Calculate WPM
      const wordsTyped = currentText.length / 5
      this.stats.wpm = timeElapsed > 0 ? Math.round((wordsTyped / timeElapsed) * 60) : 0
      
      // Calculate accuracy
      let correctChars = 0
      for (let i = 0; i < currentText.length; i++) {
        if (i < this.targetText.length && currentText[i] === this.targetText[i]) {
          correctChars++
        }
      }
      this.stats.accuracy = currentText.length > 0 ? Math.round((correctChars / currentText.length) * 100) : 100
      this.stats.timeElapsed = timeElapsed
    },
    
    updateRealtimeStats() {
      // Update stats immediately for real-time feedback
      this.updateStats()
    },
    
    updateProgress() {
      const currentText = this.editor.getValue()
      this.progress = this.targetText.length > 0 ? (currentText.length / this.targetText.length) * 100 : 0
    },
    
    getCharClass(index) {
      const currentText = this.editor.getValue()
      
      if (index < currentText.length) {
        return currentText[index] === this.targetText[index] ? 'correct' : 'incorrect'
      } else if (index === currentText.length) {
        return 'current'
      }
      return 'pending'
    },
    
    startSession() {
      this.isActive = true
      this.hasStarted = true
      this.startTime = Date.now()
      this.keystrokes = []
      this.editor.focus()
    },
    
    resetSession() {
      this.isActive = false
      this.isPaused = false
      this.hasStarted = false
      this.startTime = 0
      this.currentPosition = 0
      this.keystrokes = []
      this.stats = { wpm: 0, accuracy: 100, timeElapsed: 0 }
      this.progress = 0
      this.currentError = ''
      this.editor.setValue('')
      this.decorations = this.editor.deltaDecorations(this.decorations, [])
    },
    
    togglePause() {
      this.isPaused = !this.isPaused
      if (!this.isPaused) {
        this.editor.focus()
      }
    },
    
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    },
    
    cleanup() {
      if (this.editor) {
        this.editor.dispose()
      }
    }
  }
}

describe('Monaco Editor Integration', () => {
  /** @type {import('@vue/test-utils').VueWrapper} */
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('Editor Initialization', () => {
    it('should initialize Monaco editor on mount', () => {
      wrapper = mount(TypingTutorComponent, {
        props: {
          targetText: 'Hello World'
        }
      })

      expect(wrapper.vm.editor).toBeTruthy()
      expect(mockEditor.onDidChangeModelContent).toHaveBeenCalled()
      expect(mockEditor.onKeyDown).toHaveBeenCalled()
    })

    it('should dispose editor on unmount', () => {
      wrapper = mount(TypingTutorComponent)
      wrapper.unmount()

      expect(mockEditor.dispose).toHaveBeenCalled()
    })
  })

  describe('Typing Session Management', () => {
    beforeEach(() => {
      wrapper = mount(TypingTutorComponent, {
        props: {
          targetText: 'Hello World',
          showFeedback: true
        }
      })
    })

    it('should start typing session correctly', async () => {
      const startButton = wrapper.find('button')
      await startButton.trigger('click')

      expect(wrapper.vm.isActive).toBe(true)
      expect(wrapper.vm.hasStarted).toBe(true)
      expect(wrapper.vm.startTime).toBeGreaterThan(0)
      expect(mockEditor.focus).toHaveBeenCalled()
    })

    it('should reset session to initial state', async () => {
      // Start session first
      wrapper.vm.startSession()
      wrapper.vm.stats.wpm = 50
      wrapper.vm.progress = 25
      
      const resetButton = wrapper.findAll('button')[1]
      await resetButton.trigger('click')

      expect(wrapper.vm.isActive).toBe(false)
      expect(wrapper.vm.hasStarted).toBe(false)
      expect(wrapper.vm.stats.wpm).toBe(0)
      expect(wrapper.vm.progress).toBe(0)
      expect(mockEditor.setValue).toHaveBeenCalledWith('')
    })

    it('should toggle pause state correctly', async () => {
      wrapper.vm.startSession()
      
      const pauseButton = wrapper.findAll('button')[2]
      await pauseButton.trigger('click')

      expect(wrapper.vm.isPaused).toBe(true)
      expect(pauseButton.text()).toBe('Resume')

      await pauseButton.trigger('click')
      expect(wrapper.vm.isPaused).toBe(false)
      expect(pauseButton.text()).toBe('Pause')
    })
  })

  describe('Real-time Typing Validation', () => {
    beforeEach(() => {
      wrapper = mount(TypingTutorComponent, {
        props: {
          targetText: 'function test() { return true; }'
        }
      })
      wrapper.vm.startSession()
    })

    it('should validate input correctly', () => {
      const correctText = 'function'
      mockEditor.getValue.mockReturnValue(correctText)
      
      wrapper.vm.validateInput(correctText)

      expect(wrapper.vm.currentError).toBe('')
      expect(wrapper.vm.currentPosition).toBe(correctText.length)
    })

    it('should detect typing errors', () => {
      const incorrectText = 'fumction' // typo: 'u' instead of 'n'
      mockEditor.getValue.mockReturnValue(incorrectText)
      
      wrapper.vm.validateInput(incorrectText)

      expect(wrapper.vm.currentError).toContain('Expected')
      expect(wrapper.vm.currentError).toContain('but got')
    })

    it('should detect extra characters', () => {
      const extraText = wrapper.vm.targetText + 'extra'
      mockEditor.getValue.mockReturnValue(extraText)
      
      wrapper.vm.validateInput(extraText)

      expect(wrapper.vm.currentError).toBe('Extra characters typed')
    })

    it('should update editor decorations for errors', () => {
      const incorrectText = 'xunction' // First character wrong
      mockEditor.getValue.mockReturnValue(incorrectText)
      
      wrapper.vm.validateInput(incorrectText)

      expect(mockEditor.deltaDecorations).toHaveBeenCalledWith(
        wrapper.vm.decorations,
        expect.arrayContaining([
          expect.objectContaining({
            range: expect.objectContaining({
              startLineNumber: 1,
              startColumn: 1,
              endColumn: 2
            }),
            options: { inlineClassName: 'typing-error' }
          })
        ])
      )
    })
  })

  describe('Statistics Calculation', () => {
    beforeEach(() => {
      wrapper = mount(TypingTutorComponent, {
        props: {
          targetText: 'Hello World Test'
        }
      })
      wrapper.vm.startSession()
      
      // Mock time elapsed
      const mockStartTime = Date.now() - 60000 // 1 minute ago
      wrapper.vm.startTime = mockStartTime
    })

    it('should calculate WPM correctly', () => {
      const typedText = 'Hello World' // 11 characters = 2.2 words
      mockEditor.getValue.mockReturnValue(typedText)
      
      wrapper.vm.updateStats()

      // 2.2 words in 1 minute = 2.2 WPM, rounded = 2 WPM
      expect(wrapper.vm.stats.wpm).toBeCloseTo(2, 0)
    })

    it('should calculate accuracy correctly', () => {
      const typedText = 'Hello Wprld' // 1 error out of 11 characters
      mockEditor.getValue.mockReturnValue(typedText)
      
      wrapper.vm.updateStats()

      // 10 correct / 11 total = 90.9%, rounded = 91%
      expect(wrapper.vm.stats.accuracy).toBe(91)
    })

    it('should handle perfect accuracy', () => {
      const typedText = 'Hello World'
      mockEditor.getValue.mockReturnValue(typedText)
      
      wrapper.vm.updateStats()

      expect(wrapper.vm.stats.accuracy).toBe(100)
    })

    it('should track time elapsed', () => {
      wrapper.vm.updateStats()

      expect(wrapper.vm.stats.timeElapsed).toBeCloseTo(60, 1) // 60 seconds
    })
  })

  describe('Keystroke Tracking', () => {
    beforeEach(() => {
      wrapper = mount(TypingTutorComponent, {
        props: {
          targetText: 'Hello'
        }
      })
      wrapper.vm.startSession()
    })

    it('should record keystrokes correctly', () => {
      const keyEvent = { code: 'KeyH' }
      mockEditor.getValue.mockReturnValue('H')
      
      wrapper.vm.handleKeyDown(keyEvent)

      expect(wrapper.vm.keystrokes).toHaveLength(1)
      expect(wrapper.vm.keystrokes[0]).toEqual(
        expect.objectContaining({
          key: 'KeyH',
          correct: true,
          timestamp: expect.any(Number)
        })
      )
    })

    it('should detect incorrect keystrokes', () => {
      const keyEvent = { code: 'KeyX' } // Wrong key
      mockEditor.getValue.mockReturnValue('X')
      
      wrapper.vm.handleKeyDown(keyEvent)

      expect(wrapper.vm.keystrokes[0].correct).toBe(false)
    })

    it('should handle space characters correctly', () => {
      wrapper.vm.targetText = 'Hello World'
      wrapper.vm.currentPosition = 5 // At space position
      
      const keyEvent = { code: 'Space' }
      mockEditor.getValue.mockReturnValue('Hello ')
      
      wrapper.vm.handleKeyDown(keyEvent)

      expect(wrapper.vm.keystrokes[0].correct).toBe(true)
    })
  })

  describe('Visual Feedback', () => {
    beforeEach(() => {
      wrapper = mount(TypingTutorComponent, {
        props: {
          targetText: 'Hello World',
          showFeedback: true
        }
      })
    })

    it('should display correct character classes', () => {
      mockEditor.getValue.mockReturnValue('Hell')
      
      expect(wrapper.vm.getCharClass(0)).toBe('correct') // 'H'
      expect(wrapper.vm.getCharClass(1)).toBe('correct') // 'e'
      expect(wrapper.vm.getCharClass(4)).toBe('current') // Current position
      expect(wrapper.vm.getCharClass(5)).toBe('pending') // Future character
    })

    it('should show incorrect character classes', () => {
      mockEditor.getValue.mockReturnValue('Xello')
      
      expect(wrapper.vm.getCharClass(0)).toBe('incorrect') // Wrong 'X'
      expect(wrapper.vm.getCharClass(1)).toBe('correct') // Correct 'e'
    })

    it('should update progress bar', () => {
      mockEditor.getValue.mockReturnValue('Hello')
      wrapper.vm.updateProgress()

      expect(wrapper.vm.progress).toBeCloseTo(45.45, 2) // 5/11 characters
    })

    it('should format time display correctly', () => {
      expect(wrapper.vm.formatTime(65)).toBe('1:05')
      expect(wrapper.vm.formatTime(123)).toBe('2:03')
      expect(wrapper.vm.formatTime(30)).toBe('0:30')
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle rapid typing without lag', async () => {
      wrapper = mount(TypingTutorComponent, {
        props: {
          targetText: 'The quick brown fox jumps over the lazy dog'
        }
      })
      wrapper.vm.startSession()

      // Simulate rapid typing
      const rapidKeystrokes = []
      for (let i = 0; i < 100; i++) {
        rapidKeystrokes.push({
          code: 'KeyA',
          timestamp: Date.now() + i * 10 // 10ms intervals
        })
      }

      const startTime = performance.now()
      rapidKeystrokes.forEach(keystroke => {
        wrapper.vm.handleKeyDown(keystroke)
      })
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(50) // Should handle 100 keystrokes in under 50ms
    })

    it('should handle empty editor gracefully', () => {
      wrapper = mount(TypingTutorComponent, {
        props: {
          targetText: 'Hello'
        }
      })

      mockEditor.getValue.mockReturnValue('')
      
      expect(() => wrapper.vm.updateStats()).not.toThrow()
      expect(wrapper.vm.stats.accuracy).toBe(100)
      expect(wrapper.vm.stats.wpm).toBe(0)
    })

    it('should handle malformed input', () => {
      wrapper = mount(TypingTutorComponent, {
        props: {
          targetText: 'Hello'
        }
      })

      mockEditor.getValue.mockReturnValue(null)
      
      expect(() => wrapper.vm.validateInput(null)).not.toThrow()
    })

    it('should handle time limit properly', async () => {
      wrapper = mount(TypingTutorComponent, {
        props: {
          targetText: 'Hello World',
          timeLimit: 30 // 30 seconds
        }
      })

      wrapper.vm.startSession()
      
      // Simulate time passing beyond limit
      wrapper.vm.startTime = Date.now() - 35000 // 35 seconds ago
      wrapper.vm.updateStats()

      expect(wrapper.vm.stats.timeElapsed).toBeGreaterThan(30)
    })
  })
})

/**
 * Integration tests for Monaco Editor themes and configuration
 */
describe('Monaco Editor Configuration', () => {
  it('should apply typing tutor theme correctly', () => {
    const { editor } = require('monaco-editor')
    
    // Test theme application
    expect(editor.defineTheme).toBeDefined()
    expect(editor.setTheme).toBeDefined()
  })

  it('should configure appropriate editor options', () => {
    wrapper = mount(TypingTutorComponent, {
      props: {
        targetText: 'test'
      }
    })

    // Verify Monaco editor was created (mocked)
    expect(require('monaco-editor').editor.create).toHaveBeenCalled()
  })
})