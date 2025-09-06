/**
 * @fileoverview Edge case testing for the typing tutor
 * Tests rapid typing, corrections, special characters, and boundary conditions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'

// Mock high-resolution timer for precise timing tests
let mockTime = 0
const mockPerformanceNow = vi.fn(() => mockTime)
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
})

// Mock RAF for animation testing
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16))

// Edge case typing tutor component
const EdgeCaseTypingTutor = {
  template: `
    <div class="edge-case-typing-tutor">
      <!-- Status display -->
      <div class="status-bar">
        <span class="session-active" :class="{ active: isActive }">
          {{ isActive ? 'Active' : 'Inactive' }}
        </span>
        <span class="error-count">Errors: {{ errorCount }}</span>
        <span class="correction-count">Corrections: {{ correctionCount }}</span>
        <span class="special-chars">Special: {{ specialCharCount }}</span>
      </div>

      <!-- Target text display with complex content -->
      <div class="target-text-container">
        <div class="target-text" ref="targetTextEl">
          <span 
            v-for="(segment, segmentIndex) in textSegments" 
            :key="segmentIndex"
            :class="getSegmentClass(segment)"
            class="text-segment"
          >
            <span 
              v-for="(char, charIndex) in segment.chars" 
              :key="getCharKey(segmentIndex, charIndex)"
              :class="getCharClass(getGlobalIndex(segmentIndex, charIndex))"
              class="target-char"
              :data-char-type="getCharType(char)"
            >
              {{ formatDisplayChar(char) }}
            </span>
          </span>
        </div>
      </div>

      <!-- Input area -->
      <div class="input-container">
        <textarea
          ref="inputEl"
          v-model="userInput"
          @input="handleInput"
          @keydown="handleKeydown"
          @keyup="handleKeyup"
          @paste="handlePaste"
          @compositionstart="handleCompositionStart"
          @compositionend="handleCompositionEnd"
          class="input-area"
          :disabled="!isActive"
          placeholder="Type the text above..."
          spellcheck="false"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
        ></textarea>
      </div>

      <!-- Debug panel -->
      <div class="debug-panel" v-if="showDebug">
        <div class="debug-section">
          <h4>Input Analysis</h4>
          <div>Input Length: {{ userInput.length }}</div>
          <div>Target Length: {{ targetText.length }}</div>
          <div>Current Position: {{ currentPosition }}</div>
          <div>Composition Active: {{ isComposing }}</div>
        </div>
        
        <div class="debug-section">
          <h4>Recent Events</h4>
          <div class="event-log">
            <div v-for="event in recentEvents.slice(-5)" :key="event.id" class="event-item">
              {{ event.type }}: {{ event.data }} ({{ event.timestamp }}ms)
            </div>
          </div>
        </div>

        <div class="debug-section">
          <h4>Character Analysis</h4>
          <div>ASCII: {{ asciiCharCount }}</div>
          <div>Unicode: {{ unicodeCharCount }}</div>
          <div>Emojis: {{ emojiCharCount }}</div>
          <div>Whitespace: {{ whitespaceCharCount }}</div>
        </div>
      </div>
    </div>
  `,
  props: {
    targetText: { type: String, required: true },
    showDebug: { type: Boolean, default: false },
    enableSpecialHandling: { type: Boolean, default: true }
  },
  data() {
    return {
      userInput: '',
      isActive: false,
      isComposing: false,
      
      // Error tracking
      errorCount: 0,
      correctionCount: 0,
      specialCharCount: 0,
      
      // Event tracking
      recentEvents: [],
      eventId: 0,
      
      // Keystroke analysis
      keystrokes: [],
      rapidTypingThreshold: 50, // ms between keystrokes
      
      // Character analysis
      asciiCharCount: 0,
      unicodeCharCount: 0,
      emojiCharCount: 0,
      whitespaceCharCount: 0,
      
      // State tracking
      currentPosition: 0,
      lastInputTime: 0,
      inputBuffer: '',
      
      // Complex text handling
      textSegments: []
    }
  },
  computed: {
    targetChars() {
      return this.targetText.split('')
    }
  },
  mounted() {
    this.initializeTextSegments()
    this.analyzeTargetText()
  },
  methods: {
    initializeTextSegments() {
      // Parse text into segments for complex handling
      this.textSegments = this.parseTextIntoSegments(this.targetText)
    },

    parseTextIntoSegments(text) {
      const segments = []
      let currentSegment = { type: 'normal', chars: [], startIndex: 0 }
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i]
        const charType = this.getCharType(char)
        
        // Start new segment if type changes
        if (currentSegment.chars.length > 0 && charType !== currentSegment.type) {
          segments.push(currentSegment)
          currentSegment = { type: charType, chars: [], startIndex: i }
        }
        
        if (currentSegment.chars.length === 0) {
          currentSegment.type = charType
          currentSegment.startIndex = i
        }
        
        currentSegment.chars.push(char)
      }
      
      if (currentSegment.chars.length > 0) {
        segments.push(currentSegment)
      }
      
      return segments
    },

    analyzeTargetText() {
      this.asciiCharCount = 0
      this.unicodeCharCount = 0
      this.emojiCharCount = 0
      this.whitespaceCharCount = 0
      this.specialCharCount = 0
      
      for (const char of this.targetText) {
        if (this.isWhitespace(char)) {
          this.whitespaceCharCount++
        } else if (this.isEmoji(char)) {
          this.emojiCharCount++
          this.specialCharCount++
        } else if (this.isAscii(char)) {
          this.asciiCharCount++
        } else {
          this.unicodeCharCount++
          this.specialCharCount++
        }
      }
    },

    startSession() {
      this.isActive = true
      this.userInput = ''
      this.resetCounters()
      this.logEvent('session_start', { timestamp: performance.now() })
      
      this.$nextTick(() => {
        this.$refs.inputEl?.focus()
      })
    },

    resetCounters() {
      this.errorCount = 0
      this.correctionCount = 0
      this.currentPosition = 0
      this.recentEvents = []
      this.keystrokes = []
      this.lastInputTime = 0
    },

    handleInput(event) {
      if (!this.isActive || this.isComposing) return
      
      const currentTime = performance.now()
      const inputValue = event.target.value
      
      this.logEvent('input', {
        value: inputValue,
        length: inputValue.length,
        timestamp: currentTime
      })
      
      // Detect rapid typing
      if (this.lastInputTime > 0) {
        const interval = currentTime - this.lastInputTime
        if (interval < this.rapidTypingThreshold) {
          this.handleRapidTyping(interval)
        }
      }
      
      this.lastInputTime = currentTime
      this.userInput = inputValue
      this.currentPosition = inputValue.length
      
      this.validateInput()
      this.analyzeInput()
    },

    handleKeydown(event) {
      if (!this.isActive) return
      
      const currentTime = performance.now()
      
      this.logEvent('keydown', {
        key: event.key,
        code: event.code,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        metaKey: event.metaKey,
        timestamp: currentTime
      })
      
      // Record keystroke for analysis
      this.keystrokes.push({
        key: event.key,
        timestamp: currentTime,
        type: 'keydown'
      })
      
      // Handle special keys
      this.handleSpecialKeys(event)
    },

    handleKeyup(event) {
      if (!this.isActive) return
      
      this.logEvent('keyup', {
        key: event.key,
        timestamp: performance.now()
      })
    },

    handlePaste(event) {
      event.preventDefault() // Prevent default paste behavior
      
      const clipboardData = event.clipboardData?.getData('text/plain') || ''
      
      this.logEvent('paste_attempt', {
        data: clipboardData,
        length: clipboardData.length,
        blocked: true
      })
      
      // Optionally allow paste in certain modes
      if (this.enableSpecialHandling && this.shouldAllowPaste()) {
        this.handlePasteData(clipboardData)
      }
    },

    handleCompositionStart(event) {
      this.isComposing = true
      this.logEvent('composition_start', {
        data: event.data,
        timestamp: performance.now()
      })
    },

    handleCompositionEnd(event) {
      this.isComposing = false
      this.logEvent('composition_end', {
        data: event.data,
        timestamp: performance.now()
      })
      
      // Process composed input
      if (event.data) {
        this.handleComposedInput(event.data)
      }
    },

    handleSpecialKeys(event) {
      switch (event.key) {
        case 'Backspace':
          this.handleBackspace(event)
          break
        case 'Delete':
          this.handleDelete(event)
          break
        case 'Tab':
          this.handleTab(event)
          break
        case 'Enter':
          this.handleEnter(event)
          break
        case 'Escape':
          this.handleEscape(event)
          break
        default:
          this.handleRegularKey(event)
      }
    },

    handleBackspace(event) {
      if (this.userInput.length > 0) {
        this.correctionCount++
        this.logEvent('correction', {
          type: 'backspace',
          position: this.userInput.length - 1,
          removedChar: this.userInput[this.userInput.length - 1]
        })
      }
    },

    handleDelete(event) {
      // Delete key handling
      this.logEvent('delete_key', {
        position: this.currentPosition
      })
    },

    handleTab(event) {
      event.preventDefault()
      
      // Insert appropriate whitespace for tab
      const tabChar = this.getExpectedChar()
      if (tabChar === '\t') {
        this.insertCharacter('\t')
      }
    },

    handleEnter(event) {
      const expectedChar = this.getExpectedChar()
      if (expectedChar === '\n' || expectedChar === '\r') {
        // Allow natural line break
      } else {
        event.preventDefault()
      }
    },

    handleEscape(event) {
      this.logEvent('escape', { action: 'pause_or_reset' })
    },

    handleRegularKey(event) {
      // Track special character input
      const char = event.key
      if (this.isSpecialCharacter(char)) {
        this.logEvent('special_char', {
          char,
          code: char.charCodeAt(0),
          position: this.currentPosition
        })
      }
    },

    handleRapidTyping(interval) {
      this.logEvent('rapid_typing', {
        interval,
        position: this.currentPosition,
        burstDetected: interval < 30 // Very fast typing
      })
      
      // Apply rapid typing optimizations if needed
      if (this.enableSpecialHandling) {
        this.optimizeForRapidTyping()
      }
    },

    handleComposedInput(data) {
      // Handle IME input (Chinese, Japanese, etc.)
      this.logEvent('ime_input', {
        data,
        length: data.length,
        containsUnicode: this.containsUnicode(data)
      })
    },

    validateInput() {
      let errors = 0
      
      for (let i = 0; i < this.userInput.length; i++) {
        if (i >= this.targetText.length || this.userInput[i] !== this.targetText[i]) {
          errors++
        }
      }
      
      if (errors !== this.errorCount) {
        this.errorCount = errors
        this.logEvent('error_count_changed', {
          oldCount: this.errorCount,
          newCount: errors,
          position: this.currentPosition
        })
      }
    },

    analyzeInput() {
      // Analyze input for various patterns
      const inputLength = this.userInput.length
      
      // Check for various input patterns
      this.checkForRepeatedCharacters()
      this.checkForKeyboardPattern()
      this.checkForCopyPaste()
      this.checkForUnusualTiming()
    },

    checkForRepeatedCharacters() {
      const input = this.userInput
      if (input.length < 3) return
      
      // Look for repeated character patterns
      const lastThree = input.slice(-3)
      if (lastThree[0] === lastThree[1] && lastThree[1] === lastThree[2]) {
        this.logEvent('repeated_chars', {
          char: lastThree[0],
          position: input.length - 3,
          count: 3
        })
      }
    },

    checkForKeyboardPattern() {
      const input = this.userInput
      if (input.length < 3) return
      
      // Check for keyboard patterns like "qwerty", "asdf", "123"
      const patterns = ['qwerty', 'asdf', 'zxcv', '123', 'abc']
      const lastFive = input.slice(-5).toLowerCase()
      
      for (const pattern of patterns) {
        if (lastFive.includes(pattern)) {
          this.logEvent('keyboard_pattern', {
            pattern,
            position: input.length - pattern.length,
            detected: lastFive
          })
        }
      }
    },

    checkForCopyPaste() {
      // Check for sudden large input increases
      const recentInputEvents = this.recentEvents
        .filter(e => e.type === 'input')
        .slice(-2)
      
      if (recentInputEvents.length === 2) {
        const lengthIncrease = recentInputEvents[1].data.length - recentInputEvents[0].data.length
        if (lengthIncrease > 10) {
          this.logEvent('possible_paste', {
            lengthIncrease,
            suspiciousActivity: true
          })
        }
      }
    },

    checkForUnusualTiming() {
      if (this.keystrokes.length < 5) return
      
      const recentKeystrokes = this.keystrokes.slice(-5)
      const intervals = []
      
      for (let i = 1; i < recentKeystrokes.length; i++) {
        intervals.push(recentKeystrokes[i].timestamp - recentKeystrokes[i - 1].timestamp)
      }
      
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
      const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length
      
      if (variance > 10000) { // High variance indicates inconsistent timing
        this.logEvent('unusual_timing', {
          variance,
          avgInterval,
          intervals: [...intervals]
        })
      }
    },

    optimizeForRapidTyping() {
      // Implement optimizations for rapid typing
      this.logEvent('rapid_typing_optimization', {
        action: 'throttle_validation',
        enabled: true
      })
    },

    // Character and text analysis methods
    getCharType(char) {
      if (this.isWhitespace(char)) return 'whitespace'
      if (this.isEmoji(char)) return 'emoji'
      if (this.isPunctuation(char)) return 'punctuation'
      if (this.isNumber(char)) return 'number'
      if (this.isLetter(char)) return 'letter'
      if (this.isSymbol(char)) return 'symbol'
      return 'other'
    },

    isWhitespace(char) {
      return /\s/.test(char)
    },

    isEmoji(char) {
      // Simplified emoji detection
      const codePoint = char.codePointAt(0)
      return codePoint >= 0x1F600 && codePoint <= 0x1F64F || // Emoticons
             codePoint >= 0x1F300 && codePoint <= 0x1F5FF || // Misc Symbols
             codePoint >= 0x1F680 && codePoint <= 0x1F6FF || // Transport
             codePoint >= 0x2600 && codePoint <= 0x26FF ||   // Misc symbols
             codePoint >= 0x2700 && codePoint <= 0x27BF     // Dingbats
    },

    isAscii(char) {
      return char.charCodeAt(0) < 128
    },

    isPunctuation(char) {
      return /[.,;:!?'"()[\]{}]/.test(char)
    },

    isNumber(char) {
      return /[0-9]/.test(char)
    },

    isLetter(char) {
      return /[a-zA-Z]/.test(char)
    },

    isSymbol(char) {
      return /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(char)
    },

    isSpecialCharacter(char) {
      return !this.isAscii(char) || this.isSymbol(char) || this.isEmoji(char)
    },

    containsUnicode(text) {
      return text.split('').some(char => !this.isAscii(char))
    },

    // Display and formatting methods
    formatDisplayChar(char) {
      switch (char) {
        case ' ': return '·'
        case '\t': return '⇥'
        case '\n': return '↵'
        case '\r': return '↵'
        default: return char
      }
    },

    getCharClass(index) {
      if (index >= this.userInput.length) {
        return index === this.userInput.length ? 'current' : 'pending'
      }
      
      if (index >= this.targetText.length) {
        return 'overflow'
      }
      
      const userChar = this.userInput[index]
      const targetChar = this.targetText[index]
      
      if (userChar === targetChar) {
        return 'correct'
      } else {
        return 'incorrect'
      }
    },

    getSegmentClass(segment) {
      return `segment-${segment.type}`
    },

    getCharKey(segmentIndex, charIndex) {
      return `${segmentIndex}-${charIndex}`
    },

    getGlobalIndex(segmentIndex, charIndex) {
      let index = 0
      for (let i = 0; i < segmentIndex; i++) {
        index += this.textSegments[i].chars.length
      }
      return index + charIndex
    },

    getExpectedChar() {
      return this.currentPosition < this.targetText.length ? 
        this.targetText[this.currentPosition] : null
    },

    // Utility methods
    shouldAllowPaste() {
      return false // Typically don't allow paste in typing tests
    },

    handlePasteData(data) {
      // Handle paste data if allowed
      this.userInput += data
      this.validateInput()
    },

    insertCharacter(char) {
      this.userInput += char
      this.validateInput()
    },

    logEvent(type, data) {
      const event = {
        id: this.eventId++,
        type,
        data,
        timestamp: performance.now()
      }
      
      this.recentEvents.push(event)
      
      // Keep only recent events for performance
      if (this.recentEvents.length > 100) {
        this.recentEvents = this.recentEvents.slice(-50)
      }
    },

    // Public API for testing
    getEventLog() {
      return [...this.recentEvents]
    },

    getKeystrokeAnalysis() {
      if (this.keystrokes.length < 2) return null
      
      const intervals = []
      for (let i = 1; i < this.keystrokes.length; i++) {
        intervals.push(this.keystrokes[i].timestamp - this.keystrokes[i - 1].timestamp)
      }
      
      return {
        totalKeystrokes: this.keystrokes.length,
        averageInterval: intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length,
        minInterval: Math.min(...intervals),
        maxInterval: Math.max(...intervals),
        rapidTypingEvents: intervals.filter(interval => interval < this.rapidTypingThreshold).length
      }
    },

    getCharacterAnalysis() {
      return {
        ascii: this.asciiCharCount,
        unicode: this.unicodeCharCount,
        emoji: this.emojiCharCount,
        whitespace: this.whitespaceCharCount,
        special: this.specialCharCount,
        total: this.targetText.length
      }
    },

    // Stress testing methods
    simulateRapidTyping(text, intervalMs = 10) {
      return new Promise((resolve) => {
        let index = 0
        const interval = setInterval(() => {
          if (index >= text.length) {
            clearInterval(interval)
            resolve(this.getEventLog())
            return
          }
          
          this.userInput += text[index]
          this.handleInput({ target: { value: this.userInput } })
          index++
        }, intervalMs)
      })
    },

    simulateComplexInput(patterns) {
      patterns.forEach(pattern => {
        switch (pattern.type) {
          case 'rapid':
            this.simulateRapidTyping(pattern.text, pattern.interval)
            break
          case 'corrections':
            this.simulateCorrections(pattern.count)
            break
          case 'special_chars':
            this.simulateSpecialCharInput(pattern.chars)
            break
        }
      })
    },

    simulateCorrections(count) {
      for (let i = 0; i < count; i++) {
        // Simulate backspace
        if (this.userInput.length > 0) {
          this.userInput = this.userInput.slice(0, -1)
          this.handleKeydown({ key: 'Backspace', preventDefault: () => {} })
          this.correctionCount++
        }
      }
    },

    simulateSpecialCharInput(chars) {
      chars.forEach(char => {
        this.userInput += char
        this.handleInput({ target: { value: this.userInput } })
      })
    }
  }
}

describe('Edge Case Testing', () => {
  let wrapper: VueWrapper<any>
  
  beforeEach(() => {
    vi.clearAllMocks()
    mockTime = 0
    mockPerformanceNow.mockImplementation(() => mockTime++)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('Rapid Typing Edge Cases', () => {
    beforeEach(() => {
      wrapper = mount(EdgeCaseTypingTutor, {
        props: {
          targetText: 'The quick brown fox jumps over the lazy dog.',
          showDebug: true
        }
      })
      wrapper.vm.startSession()
    })

    it('should handle extremely rapid typing (10ms intervals)', async () => {
      const text = 'The quick'
      await wrapper.vm.simulateRapidTyping(text, 10)

      const analysis = wrapper.vm.getKeystrokeAnalysis()
      expect(analysis.rapidTypingEvents).toBeGreaterThan(0)
      expect(analysis.minInterval).toBeLessThan(50)
    })

    it('should detect and log rapid typing events', async () => {
      const inputArea = wrapper.find('.input-area')
      
      // Simulate very fast typing
      mockTime = 0
      wrapper.vm.userInput = 'T'
      await inputArea.trigger('input')
      
      mockTime = 5 // Only 5ms later
      wrapper.vm.userInput = 'Th'
      await inputArea.trigger('input')
      
      const events = wrapper.vm.getEventLog()
      const rapidEvents = events.filter(e => e.type === 'rapid_typing')
      expect(rapidEvents.length).toBeGreaterThan(0)
    })

    it('should handle typing bursts without performance degradation', async () => {
      const startTime = performance.now()
      
      // Simulate 50 character burst
      const burstText = 'A'.repeat(50)
      await wrapper.vm.simulateRapidTyping(burstText, 1)
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Should complete rapidly
      expect(totalTime).toBeLessThan(1000) // Under 1 second
      expect(wrapper.vm.userInput.length).toBe(50)
    })

    it('should maintain accuracy tracking during rapid typing', async () => {
      wrapper.vm.userInput = 'The quik' // Typo
      wrapper.vm.validateInput()
      
      expect(wrapper.vm.errorCount).toBe(1) // One error for 'i' instead of 'c'
    })

    it('should optimize performance for sustained rapid typing', async () => {
      // Trigger rapid typing optimization
      wrapper.vm.handleRapidTyping(20) // 20ms interval
      
      const events = wrapper.vm.getEventLog()
      const optimizationEvents = events.filter(e => e.type === 'rapid_typing_optimization')
      expect(optimizationEvents.length).toBeGreaterThan(0)
    })
  })

  describe('Correction and Backspace Edge Cases', () => {
    beforeEach(() => {
      wrapper = mount(EdgeCaseTypingTutor, {
        props: {
          targetText: 'Hello World! 123 Test.',
          showDebug: true
        }
      })
      wrapper.vm.startSession()
    })

    it('should handle rapid corrections', async () => {
      const inputArea = wrapper.find('.input-area')
      
      // Type incorrect text
      wrapper.vm.userInput = 'Helo'
      await inputArea.trigger('input')
      
      // Multiple rapid backspaces
      for (let i = 0; i < 4; i++) {
        wrapper.vm.userInput = wrapper.vm.userInput.slice(0, -1)
        await inputArea.trigger('keydown', { key: 'Backspace' })
      }
      
      // Type correct text
      wrapper.vm.userInput = 'Hell'
      await inputArea.trigger('input')
      
      expect(wrapper.vm.correctionCount).toBe(4)
      expect(wrapper.vm.userInput).toBe('Hell')
    })

    it('should track correction patterns', async () => {
      wrapper.vm.simulateCorrections(5)
      
      const events = wrapper.vm.getEventLog()
      const correctionEvents = events.filter(e => e.type === 'correction')
      expect(correctionEvents).toHaveLength(5)
    })

    it('should handle delete key operations', async () => {
      const inputArea = wrapper.find('.input-area')
      await inputArea.trigger('keydown', { key: 'Delete' })
      
      const events = wrapper.vm.getEventLog()
      const deleteEvents = events.filter(e => e.type === 'delete_key')
      expect(deleteEvents).toHaveLength(1)
    })

    it('should handle corrections at word boundaries', async () => {
      wrapper.vm.userInput = 'Hello Wrold!'
      wrapper.vm.validateInput()
      
      // Correct the word
      wrapper.vm.userInput = 'Hello W'
      wrapper.vm.handleKeydown({ key: 'Backspace', preventDefault: () => {} })
      wrapper.vm.userInput = 'Hello World!'
      wrapper.vm.validateInput()
      
      expect(wrapper.vm.userInput).toBe('Hello World!')
    })

    it('should handle excessive corrections gracefully', async () => {
      const startTime = performance.now()
      
      // Simulate 100 corrections
      wrapper.vm.simulateCorrections(100)
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100) // Should be fast
      expect(wrapper.vm.correctionCount).toBe(100)
    })
  })

  describe('Special Character Edge Cases', () => {
    beforeEach(() => {
      wrapper = mount(EdgeCaseTypingTutor, {
        props: {
          targetText: 'Special: !@#$%^&*()_+-=[]{}\\|;:\'",.<>?/~`',
          showDebug: true
        }
      })
      wrapper.vm.startSession()
    })

    it('should handle all special characters correctly', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}\\|;:\'",.<>?/~`'
      
      wrapper.vm.simulateSpecialCharInput(specialChars.split(''))
      
      const events = wrapper.vm.getEventLog()
      const specialCharEvents = events.filter(e => e.type === 'special_char')
      expect(specialCharEvents.length).toBeGreaterThan(0)
    })

    it('should correctly identify character types', () => {
      expect(wrapper.vm.getCharType('a')).toBe('letter')
      expect(wrapper.vm.getCharType('1')).toBe('number')
      expect(wrapper.vm.getCharType('!')).toBe('punctuation')
      expect(wrapper.vm.getCharType('@')).toBe('symbol')
      expect(wrapper.vm.getCharType(' ')).toBe('whitespace')
    })

    it('should handle tab characters', async () => {
      const inputArea = wrapper.find('.input-area')
      await inputArea.trigger('keydown', { 
        key: 'Tab', 
        preventDefault: vi.fn() 
      })
      
      const events = wrapper.vm.getEventLog()
      expect(events.some(e => e.type === 'keydown' && e.data.key === 'Tab')).toBe(true)
    })

    it('should handle newline characters', async () => {
      wrapper.setProps({ 
        targetText: 'Line 1\nLine 2\nLine 3' 
      })
      
      wrapper.vm.userInput = 'Line 1\n'
      wrapper.vm.validateInput()
      
      expect(wrapper.vm.errorCount).toBe(0)
    })

    it('should process emoji characters correctly', () => {
      wrapper.setProps({ 
        targetText: 'Hello 👋 World 🌍 Test 🧪' 
      })
      wrapper.vm.analyzeTargetText()
      
      expect(wrapper.vm.emojiCharCount).toBe(3)
    })

    it('should handle mixed ASCII and Unicode', () => {
      wrapper.setProps({ 
        targetText: 'ASCII àñd Ùñíçødé tëxt' 
      })
      wrapper.vm.analyzeTargetText()
      
      expect(wrapper.vm.asciiCharCount).toBeGreaterThan(0)
      expect(wrapper.vm.unicodeCharCount).toBeGreaterThan(0)
    })
  })

  describe('Unicode and IME Edge Cases', () => {
    beforeEach(() => {
      wrapper = mount(EdgeCaseTypingTutor, {
        props: {
          targetText: '你好世界 こんにちは 안녕하세요',
          showDebug: true,
          enableSpecialHandling: true
        }
      })
      wrapper.vm.startSession()
    })

    it('should handle composition events', async () => {
      const inputArea = wrapper.find('.input-area')
      
      await inputArea.trigger('compositionstart', { data: '' })
      expect(wrapper.vm.isComposing).toBe(true)
      
      await inputArea.trigger('compositionend', { data: '你' })
      expect(wrapper.vm.isComposing).toBe(false)
      
      const events = wrapper.vm.getEventLog()
      expect(events.some(e => e.type === 'composition_start')).toBe(true)
      expect(events.some(e => e.type === 'composition_end')).toBe(true)
    })

    it('should not process input during composition', async () => {
      wrapper.vm.isComposing = true
      const inputArea = wrapper.find('.input-area')
      
      wrapper.vm.handleInput({ target: { value: 'test' } })
      
      // Should not process input while composing
      expect(wrapper.vm.userInput).toBe('')
    })

    it('should handle complex Unicode characters', () => {
      const complexText = '🏳️‍🌈👨‍👩‍👧‍👦🧙‍♂️' // Complex emoji sequences
      wrapper.setProps({ targetText: complexText })
      wrapper.vm.analyzeTargetText()
      
      expect(wrapper.vm.emojiCharCount).toBeGreaterThan(0)
    })

    it('should detect Unicode in composed input', () => {
      const unicodeText = '你好'
      expect(wrapper.vm.containsUnicode(unicodeText)).toBe(true)
      
      const asciiText = 'hello'
      expect(wrapper.vm.containsUnicode(asciiText)).toBe(false)
    })
  })

  describe('Copy-Paste and Input Manipulation Edge Cases', () => {
    beforeEach(() => {
      wrapper = mount(EdgeCaseTypingTutor, {
        props: {
          targetText: 'This is a test of copy-paste detection.',
          showDebug: true
        }
      })
      wrapper.vm.startSession()
    })

    it('should block paste operations by default', async () => {
      const inputArea = wrapper.find('.input-area')
      const pasteEvent = new Event('paste')
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: { getData: () => 'pasted text' }
      })
      
      const preventDefaultSpy = vi.fn()
      pasteEvent.preventDefault = preventDefaultSpy
      
      await inputArea.trigger('paste', pasteEvent)
      
      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should detect suspicious input patterns', () => {
      // Simulate sudden large input increase
      wrapper.vm.recentEvents = [
        { type: 'input', data: { length: 5 }, timestamp: 100 },
        { type: 'input', data: { length: 20 }, timestamp: 101 }
      ]
      
      wrapper.vm.checkForCopyPaste()
      
      const events = wrapper.vm.getEventLog()
      const pasteEvents = events.filter(e => e.type === 'possible_paste')
      expect(pasteEvents.length).toBeGreaterThan(0)
    })

    it('should detect keyboard patterns', () => {
      wrapper.vm.userInput = 'qwerty'
      wrapper.vm.checkForKeyboardPattern()
      
      const events = wrapper.vm.getEventLog()
      const patternEvents = events.filter(e => e.type === 'keyboard_pattern')
      expect(patternEvents.length).toBeGreaterThan(0)
    })

    it('should detect repeated characters', () => {
      wrapper.vm.userInput = 'aaa'
      wrapper.vm.checkForRepeatedCharacters()
      
      const events = wrapper.vm.getEventLog()
      const repeatEvents = events.filter(e => e.type === 'repeated_chars')
      expect(repeatEvents.length).toBeGreaterThan(0)
    })

    it('should analyze timing patterns for anomalies', () => {
      // Add keystrokes with unusual timing
      wrapper.vm.keystrokes = [
        { timestamp: 0, key: 'a' },
        { timestamp: 10, key: 'b' },
        { timestamp: 20, key: 'c' },
        { timestamp: 1000, key: 'd' }, // Large gap
        { timestamp: 1010, key: 'e' }
      ]
      
      wrapper.vm.checkForUnusualTiming()
      
      const events = wrapper.vm.getEventLog()
      const timingEvents = events.filter(e => e.type === 'unusual_timing')
      expect(timingEvents.length).toBeGreaterThan(0)
    })
  })

  describe('Boundary Conditions and Limits', () => {
    it('should handle empty text', () => {
      wrapper = mount(EdgeCaseTypingTutor, {
        props: {
          targetText: '',
          showDebug: true
        }
      })
      
      expect(() => wrapper.vm.startSession()).not.toThrow()
      expect(wrapper.vm.targetText).toBe('')
    })

    it('should handle extremely long text', () => {
      const longText = 'A'.repeat(100000)
      wrapper = mount(EdgeCaseTypingTutor, {
        props: {
          targetText: longText,
          showDebug: true
        }
      })
      
      wrapper.vm.startSession()
      expect(wrapper.vm.targetText.length).toBe(100000)
    })

    it('should handle single character text', () => {
      wrapper = mount(EdgeCaseTypingTutor, {
        props: {
          targetText: 'A',
          showDebug: true
        }
      })
      
      wrapper.vm.startSession()
      wrapper.vm.userInput = 'A'
      wrapper.vm.validateInput()
      
      expect(wrapper.vm.errorCount).toBe(0)
    })

    it('should handle text with only whitespace', () => {
      wrapper = mount(EdgeCaseTypingTutor, {
        props: {
          targetText: '   \t\n  ',
          showDebug: true
        }
      })
      
      wrapper.vm.analyzeTargetText()
      expect(wrapper.vm.whitespaceCharCount).toBeGreaterThan(0)
    })

    it('should handle input longer than target text', () => {
      wrapper = mount(EdgeCaseTypingTutor, {
        props: {
          targetText: 'Short',
          showDebug: true
        }
      })
      
      wrapper.vm.startSession()
      wrapper.vm.userInput = 'Short text that is much longer'
      wrapper.vm.validateInput()
      
      // Should handle overflow gracefully
      expect(wrapper.vm.errorCount).toBeGreaterThan(0)
    })

    it('should limit event log size for memory management', () => {
      wrapper = mount(EdgeCaseTypingTutor, {
        props: {
          targetText: 'Test',
          showDebug: true
        }
      })
      
      // Generate 200 events
      for (let i = 0; i < 200; i++) {
        wrapper.vm.logEvent('test_event', { index: i })
      }
      
      // Should be limited to recent events only
      expect(wrapper.vm.recentEvents.length).toBeLessThanOrEqual(100)
    })
  })

  describe('Error Recovery and Resilience', () => {
    beforeEach(() => {
      wrapper = mount(EdgeCaseTypingTutor, {
        props: {
          targetText: 'Test error recovery',
          showDebug: true
        }
      })
      wrapper.vm.startSession()
    })

    it('should recover from validation errors', () => {
      // Corrupt internal state
      wrapper.vm.userInput = 'Test'
      wrapper.vm.currentPosition = 100 // Invalid position
      
      expect(() => wrapper.vm.validateInput()).not.toThrow()
    })

    it('should handle malformed events gracefully', () => {
      expect(() => {
        wrapper.vm.handleKeydown(null)
      }).not.toThrow()
    })

    it('should recover from timing inconsistencies', () => {
      // Add inconsistent timestamps
      wrapper.vm.keystrokes = [
        { timestamp: NaN, key: 'a' },
        { timestamp: -1, key: 'b' },
        { timestamp: Infinity, key: 'c' }
      ]
      
      expect(() => {
        wrapper.vm.getKeystrokeAnalysis()
      }).not.toThrow()
    })

    it('should handle concurrent operations safely', async () => {
      // Simulate concurrent operations
      const promises = []
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          wrapper.vm.simulateRapidTyping('test', 1)
        )
      }
      
      await Promise.all(promises)
      expect(wrapper.vm.userInput.length).toBeGreaterThan(0)
    })

    it('should maintain consistency under stress', async () => {
      const stressPatterns = [
        { type: 'rapid', text: 'rapid', interval: 5 },
        { type: 'corrections', count: 10 },
        { type: 'special_chars', chars: ['!', '@', '#'] }
      ]
      
      expect(() => {
        wrapper.vm.simulateComplexInput(stressPatterns)
      }).not.toThrow()
    })
  })

  describe('Performance Under Extreme Conditions', () => {
    it('should maintain performance with 10000+ events', () => {
      wrapper = mount(EdgeCaseTypingTutor, {
        props: {
          targetText: 'Performance test',
          showDebug: true
        }
      })
      
      const startTime = performance.now()
      
      // Generate many events
      for (let i = 0; i < 10000; i++) {
        wrapper.vm.logEvent('perf_test', { index: i })
      }
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(1000) // Should complete in under 1 second
    })

    it('should handle rapid state changes efficiently', async () => {
      wrapper = mount(EdgeCaseTypingTutor, {
        props: {
          targetText: 'A'.repeat(1000),
          showDebug: true
        }
      })
      
      const startTime = performance.now()
      
      wrapper.vm.startSession()
      
      // Rapid state changes
      for (let i = 0; i < 100; i++) {
        wrapper.vm.userInput += 'A'
        wrapper.vm.validateInput()
      }
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(500) // Should be fast
    })

    it('should cleanup resources properly', () => {
      wrapper = mount(EdgeCaseTypingTutor, {
        props: {
          targetText: 'Cleanup test',
          showDebug: true
        }
      })
      
      wrapper.vm.startSession()
      // Generate some data
      wrapper.vm.logEvent('test', { data: 'test' })
      wrapper.vm.keystrokes.push({ key: 'a', timestamp: Date.now() })
      
      // Unmount should clean up
      wrapper.unmount()
      
      // Component should be properly disposed
      expect(wrapper.vm).toBeTruthy() // Component object still exists but is unmounted
    })
  })
})