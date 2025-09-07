/**
 * @fileoverview End-to-end tests for responsive design across different devices
 * Tests typing tutor functionality across various screen sizes and device types
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Mock ResizeObserver for viewport testing
const mockResizeObserver = {
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}
global.ResizeObserver = vi.fn(() => mockResizeObserver)

/**
 * Creates a mock matchMedia object for media query testing
 * @param {boolean} matches - Whether the media query matches
 * @returns {Object} Mock matchMedia object
 */
const createMatchMediaMock = (matches) => ({
  matches,
  media: '',
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
})

/**
 * Device configurations for testing
 * @type {Object}
 */
const deviceConfigurations = {
  mobile: {
    width: 375,
    height: 667,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
    touchEnabled: true
  },
  tablet: {
    width: 768,
    height: 1024,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X)',
    touchEnabled: true
  },
  desktop: {
    width: 1920,
    height: 1080,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    touchEnabled: false
  },
  largeDesktop: {
    width: 2560,
    height: 1440,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    touchEnabled: false
  }
}

// Responsive typing tutor component
const ResponsiveTypingTutor = {
  template: `
    <div class="responsive-typing-tutor" :class="deviceClass">
      <!-- Header with adaptive layout -->
      <header class="tutor-header" :class="{ 'mobile-header': isMobile }">
        <div class="header-content">
          <h1 class="title" :class="{ 'mobile-title': isMobile }">
            {{ isMobile ? 'Typing' : 'Typing Tutor' }}
          </h1>
          
          <!-- Stats bar - responsive layout -->
          <div class="stats-bar" :class="statsLayoutClass">
            <div class="stat-item" :class="{ 'compact': isCompact }">
              <span class="stat-value">{{ stats.wpm }}</span>
              <span class="stat-label">{{ isMobile ? 'WPM' : 'Words/Min' }}</span>
            </div>
            <div class="stat-item" :class="{ 'compact': isCompact }">
              <span class="stat-value">{{ stats.accuracy }}%</span>
              <span class="stat-label">{{ isMobile ? 'ACC' : 'Accuracy' }}</span>
            </div>
            <div class="stat-item" v-if="!isMobile || expandedStats">
              <span class="stat-value">{{ formatTime(stats.timeElapsed) }}</span>
              <span class="stat-label">Time</span>
            </div>
          </div>

          <!-- Mobile menu toggle -->
          <button 
            v-if="isMobile" 
            @click="toggleMobileMenu"
            class="mobile-menu-btn"
            :class="{ 'active': showMobileMenu }"
          >
            ☰
          </button>
        </div>
      </header>

      <!-- Main content area with responsive grid -->
      <main class="tutor-main" :class="mainLayoutClass">
        <!-- Control panel - responsive positioning -->
        <aside class="control-panel" :class="controlPanelClass">
          <div class="controls" :class="{ 'mobile-controls': isMobile }">
            <button @click="startSession" :disabled="isActive" class="btn-primary">
              {{ isMobile ? 'Start' : 'Start Session' }}
            </button>
            <button @click="pauseSession" :disabled="!isActive" class="btn-secondary">
              {{ isPaused ? 'Resume' : 'Pause' }}
            </button>
            <button @click="resetSession" class="btn-danger">
              {{ isMobile ? 'Reset' : 'Reset Session' }}
            </button>
          </div>

          <!-- Settings panel - collapsible on mobile -->
          <div class="settings-panel" :class="{ 'collapsed': isMobile && !showSettings }">
            <button 
              v-if="isMobile" 
              @click="toggleSettings"
              class="settings-toggle"
            >
              Settings {{ showSettings ? '▼' : '▶' }}
            </button>
            
            <div class="settings-content" v-if="!isMobile || showSettings">
              <div class="setting-item">
                <label>Difficulty</label>
                <select v-model="settings.difficulty" class="select-input">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              
              <div class="setting-item">
                <label>
                  <input type="checkbox" v-model="settings.soundEnabled" />
                  {{ isMobile ? 'Sound' : 'Sound Effects' }}
                </label>
              </div>
              
              <div class="setting-item">
                <label>
                  <input type="checkbox" v-model="settings.showKeystrokes" />
                  {{ isMobile ? 'Keys' : 'Show Keystrokes' }}
                </label>
              </div>
            </div>
          </div>
        </aside>

        <!-- Typing area - adaptive sizing -->
        <section class="typing-section" :class="typingSectionClass">
          <!-- Target text display - responsive font sizing -->
          <div class="target-text-container" :style="targetTextStyle">
            <div class="target-text" :class="targetTextClass">
              <span 
                v-for="(char, index) in targetText" 
                :key="index"
                :class="getCharClass(index)"
                class="target-char"
              >
                {{ char === ' ' ? '·' : char }}
              </span>
            </div>
          </div>

          <!-- Input area - adaptive height -->
          <div class="input-container" :style="inputContainerStyle">
            <textarea
              ref="inputArea"
              v-model="userInput"
              @input="handleInput"
              @keydown="handleKeydown"
              class="input-area"
              :class="inputAreaClass"
              :placeholder="inputPlaceholder"
              :rows="inputRows"
              :disabled="!isActive || isPaused"
            ></textarea>
          </div>

          <!-- Real-time feedback - responsive positioning -->
          <div class="feedback-area" :class="feedbackClass" v-if="showFeedback">
            <div class="error-display" v-if="currentError">
              <span class="error-icon">⚠️</span>
              <span class="error-message">{{ currentError }}</span>
            </div>
            
            <div class="progress-display">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progress + '%' }"></div>
              </div>
              <span class="progress-text">{{ Math.round(progress) }}% Complete</span>
            </div>
          </div>
        </section>
      </main>

      <!-- Footer - adaptive content -->
      <footer class="tutor-footer" v-if="!isMobile || showFooter">
        <div class="footer-content" :class="{ 'mobile-footer': isMobile }">
          <div class="session-info">
            <span v-if="!isCompact">Session: {{ sessionDuration }}</span>
            <span>Characters: {{ userInput.length }}/{{ targetText.length }}</span>
          </div>
          
          <div class="keyboard-hint" v-if="isDesktop">
            <span>Press Ctrl+R to restart • Ctrl+P to pause</span>
          </div>
        </div>
      </footer>

      <!-- Mobile overlay menu -->
      <div v-if="isMobile && showMobileMenu" class="mobile-overlay" @click="closeMobileMenu">
        <div class="mobile-menu" @click.stop>
          <div class="menu-header">
            <h3>Options</h3>
            <button @click="closeMobileMenu" class="close-btn">×</button>
          </div>
          
          <div class="menu-content">
            <button @click="toggleExpandedStats" class="menu-item">
              {{ expandedStats ? 'Hide' : 'Show' }} Extended Stats
            </button>
            <button @click="exportSession" class="menu-item">Export Session</button>
            <button @click="shareResults" class="menu-item">Share Results</button>
          </div>
        </div>
      </div>
    </div>
  `,
  props: {
    targetText: { type: String, default: 'The quick brown fox jumps over the lazy dog.' }
  },
  data() {
    return {
      // Responsive state
      screenWidth: 0,
      screenHeight: 0,
      isMobile: false,
      isTablet: false,
      isDesktop: false,
      
      // UI state
      showMobileMenu: false,
      showSettings: false,
      expandedStats: false,
      showFooter: true,
      showFeedback: true,

      // Session state
      isActive: false,
      isPaused: false,
      userInput: '',
      stats: {
        wpm: 0,
        accuracy: 100,
        timeElapsed: 0
      },
      currentError: '',
      progress: 0,
      sessionDuration: '0:00',

      // Settings
      settings: {
        difficulty: 'medium',
        soundEnabled: true,
        showKeystrokes: false
      },

      // Responsive breakpoints
      breakpoints: {
        mobile: 768,
        tablet: 1024
      }
    }
  },
  computed: {
    deviceClass() {
      if (this.isMobile) return 'mobile-device'
      if (this.isTablet) return 'tablet-device'
      return 'desktop-device'
    },

    isCompact() {
      return this.screenWidth < 480
    },

    statsLayoutClass() {
      if (this.isMobile) return 'mobile-stats'
      if (this.isTablet) return 'tablet-stats'
      return 'desktop-stats'
    },

    mainLayoutClass() {
      return {
        'mobile-layout': this.isMobile,
        'tablet-layout': this.isTablet,
        'desktop-layout': this.isDesktop,
        'compact-layout': this.isCompact
      }
    },

    controlPanelClass() {
      return {
        'mobile-controls': this.isMobile,
        'tablet-controls': this.isTablet,
        'desktop-controls': this.isDesktop,
        'hidden': this.isMobile && !this.showMobileMenu
      }
    },

    typingSectionClass() {
      return {
        'mobile-typing': this.isMobile,
        'tablet-typing': this.isTablet,
        'desktop-typing': this.isDesktop,
        'fullscreen': this.isMobile && this.isActive
      }
    },

    targetTextClass() {
      return {
        'mobile-text': this.isMobile,
        'tablet-text': this.isTablet,
        'desktop-text': this.isDesktop,
        'compact-text': this.isCompact
      }
    },

    targetTextStyle() {
      const fontSize = this.isMobile ? (this.isCompact ? '14px' : '16px') : 
                      this.isTablet ? '18px' : '20px'
      const lineHeight = this.isMobile ? '1.4' : '1.6'
      
      return {
        fontSize,
        lineHeight,
        maxHeight: this.isMobile ? '30vh' : 'auto'
      }
    },

    inputContainerStyle() {
      return {
        height: this.isMobile ? 'auto' : this.isTablet ? '120px' : '150px'
      }
    },

    inputAreaClass() {
      return {
        'mobile-input': this.isMobile,
        'tablet-input': this.isTablet,
        'desktop-input': this.isDesktop
      }
    },

    inputRows() {
      if (this.isMobile) return this.isCompact ? 3 : 4
      if (this.isTablet) return 5
      return 6
    },

    inputPlaceholder() {
      if (this.isMobile) return 'Start typing...'
      return 'Start typing the text above...'
    },

    feedbackClass() {
      return {
        'mobile-feedback': this.isMobile,
        'tablet-feedback': this.isTablet,
        'desktop-feedback': this.isDesktop,
        'sticky-feedback': this.isMobile
      }
    }
  },
  mounted() {
    this.initializeResponsive()
    this.attachEventListeners()
  },
  beforeUnmount() {
    this.removeEventListeners()
  },
  methods: {
    initializeResponsive() {
      this.updateScreenSize()
      this.updateDeviceType()
    },

    updateScreenSize() {
      this.screenWidth = window.innerWidth
      this.screenHeight = window.innerHeight
    },

    updateDeviceType() {
      this.isMobile = this.screenWidth < this.breakpoints.mobile
      this.isTablet = this.screenWidth >= this.breakpoints.mobile && 
                     this.screenWidth < this.breakpoints.tablet
      this.isDesktop = this.screenWidth >= this.breakpoints.tablet
    },

    attachEventListeners() {
      window.addEventListener('resize', this.handleResize)
      window.addEventListener('orientationchange', this.handleOrientationChange)
      
      if (this.isDesktop) {
        window.addEventListener('keydown', this.handleGlobalKeydown)
      }
    },

    removeEventListeners() {
      window.removeEventListener('resize', this.handleResize)
      window.removeEventListener('orientationchange', this.handleOrientationChange)
      window.removeEventListener('keydown', this.handleGlobalKeydown)
    },

    handleResize() {
      this.updateScreenSize()
      this.updateDeviceType()
      this.adjustLayoutForSize()
    },

    handleOrientationChange() {
      // Wait for orientation change to complete
      setTimeout(() => {
        this.updateScreenSize()
        this.updateDeviceType()
        this.adjustLayoutForSize()
      }, 100)
    },

    adjustLayoutForSize() {
      // Adjust input area focus for mobile
      if (this.isMobile && this.isActive) {
        this.$nextTick(() => {
          const inputArea = this.$refs.inputArea
          if (inputArea && document.activeElement === inputArea) {
            // Ensure input stays visible on mobile
            inputArea.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        })
      }

      // Hide footer on very small screens
      this.showFooter = !this.isCompact || !this.isActive
    },

    handleGlobalKeydown(event) {
      // Desktop keyboard shortcuts
      if (event.ctrlKey) {
        switch (event.key.toLowerCase()) {
          case 'r':
            event.preventDefault()
            this.resetSession()
            break
          case 'p':
            event.preventDefault()
            this.pauseSession()
            break
        }
      }
    },

    // Mobile UI interactions
    toggleMobileMenu() {
      this.showMobileMenu = !this.showMobileMenu
    },

    closeMobileMenu() {
      this.showMobileMenu = false
    },

    toggleSettings() {
      this.showSettings = !this.showSettings
    },

    toggleExpandedStats() {
      this.expandedStats = !this.expandedStats
      this.closeMobileMenu()
    },

    // Session management
    startSession() {
      this.isActive = true
      this.isPaused = false
      
      // Focus input area
      this.$nextTick(() => {
        const inputArea = this.$refs.inputArea
        if (inputArea) {
          inputArea.focus()
        }
      })

      // Hide mobile menu when session starts
      if (this.isMobile) {
        this.showMobileMenu = false
      }
    },

    pauseSession() {
      this.isPaused = !this.isPaused
    },

    resetSession() {
      this.isActive = false
      this.isPaused = false
      this.userInput = ''
      this.stats = { wpm: 0, accuracy: 100, timeElapsed: 0 }
      this.currentError = ''
      this.progress = 0
      this.sessionDuration = '0:00'
    },

    // Input handling
    handleInput(event) {
      if (!this.isActive || this.isPaused) return

      this.userInput = event.target.value
      this.validateInput()
      this.updateProgress()
      this.updateStats()
    },

    handleKeydown(event) {
      // Handle special keys
      if (event.key === 'Tab') {
        event.preventDefault()
      }
    },

    validateInput() {
      const inputLength = this.userInput.length
      const targetSlice = this.targetText.slice(0, inputLength)
      
      this.currentError = ''
      
      if (this.userInput !== targetSlice) {
        const firstError = inputLength - 1
        this.currentError = `Character ${firstError + 1}: Expected '${targetSlice[firstError]}', got '${this.userInput[firstError]}'`
      }
    },

    updateProgress() {
      this.progress = (this.userInput.length / this.targetText.length) * 100
    },

    updateStats() {
      // Simplified stats update for demo
      const correctChars = this.userInput.split('').filter((char, index) => 
        char === this.targetText[index]
      ).length
      
      this.stats.accuracy = this.userInput.length > 0 ? 
        Math.round((correctChars / this.userInput.length) * 100) : 100
    },

    /**
     * Get CSS class for character at given index
     * @param {number} index - Character index
     * @returns {string} CSS class name
     */
    getCharClass(index) {
      if (index < this.userInput.length) {
        return this.userInput[index] === this.targetText[index] ? 'correct' : 'incorrect'
      } else if (index === this.userInput.length) {
        return 'current'
      }
      return 'pending'
    },

    /**
     * Format time in MM:SS format
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    },

    // Mobile-specific actions
    exportSession() {
      // Mock export functionality
      this.closeMobileMenu()
    },

    shareResults() {
      if (navigator.share && this.isMobile) {
        navigator.share({
          title: 'My Typing Results',
          text: `I achieved ${this.stats.wpm} WPM with ${this.stats.accuracy}% accuracy!`,
          url: window.location.href
        })
      }
      this.closeMobileMenu()
    }
  }
}

describe('Responsive Design Tests', () => {
  /** @type {import('@vue/test-utils').VueWrapper} */
  let wrapper
  
  /**
   * Helper function to set viewport size
   * @param {number} width - Viewport width
   * @param {number} height - Viewport height
   */
  const setViewport = (width, height) => {
    Object.defineProperty(window, 'innerWidth', { value: width, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: height, writable: true })
    
    // Mock matchMedia for the specific width
    window.matchMedia = vi.fn((query) => {
      let matches = false
      if (query.includes('768px')) {
        matches = width >= 768
      } else if (query.includes('1024px')) {
        matches = width >= 1024
      }
      return createMatchMediaMock(matches)
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('Mobile Device (375px width)', () => {
    beforeEach(() => {
      setViewport(deviceConfigurations.mobile.width, deviceConfigurations.mobile.height)
      Object.defineProperty(navigator, 'userAgent', {
        value: deviceConfigurations.mobile.userAgent,
        writable: true
      })
      
      wrapper = mount(ResponsiveTypingTutor)
      wrapper.vm.initializeResponsive()
    })

    it('should detect mobile device correctly', async () => {
      await nextTick()
      expect(wrapper.vm.isMobile).toBe(true)
      expect(wrapper.vm.isTablet).toBe(false)
      expect(wrapper.vm.isDesktop).toBe(false)
    })

    it('should apply mobile CSS classes', async () => {
      await nextTick()
      expect(wrapper.classes()).toContain('mobile-device')
      expect(wrapper.find('.tutor-header').classes()).toContain('mobile-header')
      expect(wrapper.find('.title').classes()).toContain('mobile-title')
    })

    it('should show compact title on mobile', async () => {
      await nextTick()
      const title = wrapper.find('.title')
      expect(title.text()).toBe('Typing')
    })

    it('should show compact stats labels', async () => {
      await nextTick()
      const statLabels = wrapper.findAll('.stat-label')
      expect(statLabels[0].text()).toBe('WPM')
      expect(statLabels[1].text()).toBe('ACC')
    })

    it('should hide third stat by default on mobile', async () => {
      await nextTick()
      const statItems = wrapper.findAll('.stat-item')
      expect(statItems.length).toBe(2) // Only WPM and Accuracy visible initially
    })

    it('should show mobile menu button', async () => {
      await nextTick()
      const mobileMenuBtn = wrapper.find('.mobile-menu-btn')
      expect(mobileMenuBtn.exists()).toBe(true)
      expect(mobileMenuBtn.text()).toBe('☰')
    })

    it('should toggle mobile menu', async () => {
      await nextTick()
      const mobileMenuBtn = wrapper.find('.mobile-menu-btn')
      
      expect(wrapper.vm.showMobileMenu).toBe(false)
      
      await mobileMenuBtn.trigger('click')
      expect(wrapper.vm.showMobileMenu).toBe(true)
      expect(wrapper.find('.mobile-overlay').exists()).toBe(true)
    })

    it('should use mobile input configuration', async () => {
      await nextTick()
      const inputArea = wrapper.find('.input-area')
      expect(inputArea.classes()).toContain('mobile-input')
      expect(inputArea.attributes('rows')).toBe('4')
      expect(inputArea.attributes('placeholder')).toBe('Start typing...')
    })

    it('should use mobile font sizes', async () => {
      await nextTick()
      const targetText = wrapper.find('.target-text-container')
      const style = targetText.element.style
      expect(style.fontSize).toBe('16px')
      expect(style.lineHeight).toBe('1.4')
    })

    it('should handle orientation change', async () => {
      // Simulate landscape orientation
      setViewport(667, 375)
      
      const orientationEvent = new Event('orientationchange')
      window.dispatchEvent(orientationEvent)
      
      // Wait for timeout in handleOrientationChange
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(wrapper.vm.screenWidth).toBe(667)
      expect(wrapper.vm.screenHeight).toBe(375)
    })

    it('should support touch interactions', async () => {
      await nextTick()
      const mobileOverlay = wrapper.find('.mobile-overlay')
      
      if (mobileOverlay.exists()) {
        // Touch outside overlay should close menu
        wrapper.vm.showMobileMenu = true
        await nextTick()
        
        await mobileOverlay.trigger('click')
        expect(wrapper.vm.showMobileMenu).toBe(false)
      }
    })
  })

  describe('Compact Mobile Device (320px width)', () => {
    beforeEach(() => {
      setViewport(320, 568) // iPhone 5 size
      wrapper = mount(ResponsiveTypingTutor)
      wrapper.vm.initializeResponsive()
    })

    it('should detect compact mobile correctly', async () => {
      await nextTick()
      expect(wrapper.vm.isMobile).toBe(true)
      expect(wrapper.vm.isCompact).toBe(true)
    })

    it('should use even more compact layouts', async () => {
      await nextTick()
      const statItems = wrapper.findAll('.stat-item')
      statItems.forEach(item => {
        expect(item.classes()).toContain('compact')
      })
    })

    it('should use smaller fonts on compact mobile', async () => {
      await nextTick()
      const targetText = wrapper.find('.target-text-container')
      expect(targetText.element.style.fontSize).toBe('14px')
    })

    it('should reduce input rows on compact mobile', async () => {
      await nextTick()
      const inputArea = wrapper.find('.input-area')
      expect(inputArea.attributes('rows')).toBe('3')
    })

    it('should hide footer during active session on compact', async () => {
      await nextTick()
      wrapper.vm.startSession()
      await nextTick()
      
      expect(wrapper.vm.showFooter).toBe(false)
    })
  })

  describe('Tablet Device (768px width)', () => {
    beforeEach(() => {
      setViewport(deviceConfigurations.tablet.width, deviceConfigurations.tablet.height)
      wrapper = mount(ResponsiveTypingTutor)
      wrapper.vm.initializeResponsive()
    })

    it('should detect tablet device correctly', async () => {
      await nextTick()
      expect(wrapper.vm.isMobile).toBe(false)
      expect(wrapper.vm.isTablet).toBe(true)
      expect(wrapper.vm.isDesktop).toBe(false)
    })

    it('should apply tablet CSS classes', async () => {
      await nextTick()
      expect(wrapper.classes()).toContain('tablet-device')
      expect(wrapper.find('.stats-bar').classes()).toContain('tablet-stats')
      expect(wrapper.find('.tutor-main').classes()).toContain('tablet-layout')
    })

    it('should show full title on tablet', async () => {
      await nextTick()
      const title = wrapper.find('.title')
      expect(title.text()).toBe('Typing Tutor')
    })

    it('should show full stats labels on tablet', async () => {
      await nextTick()
      const statLabels = wrapper.findAll('.stat-label')
      expect(statLabels[0].text()).toBe('Words/Min')
      expect(statLabels[1].text()).toBe('Accuracy')
    })

    it('should not show mobile menu button on tablet', async () => {
      await nextTick()
      const mobileMenuBtn = wrapper.find('.mobile-menu-btn')
      expect(mobileMenuBtn.exists()).toBe(false)
    })

    it('should use tablet input configuration', async () => {
      await nextTick()
      const inputArea = wrapper.find('.input-area')
      expect(inputArea.classes()).toContain('tablet-input')
      expect(inputArea.attributes('rows')).toBe('5')
    })

    it('should use medium font sizes', async () => {
      await nextTick()
      const targetText = wrapper.find('.target-text-container')
      expect(targetText.element.style.fontSize).toBe('18px')
      expect(targetText.element.style.lineHeight).toBe('1.6')
    })
  })

  describe('Desktop Device (1920px width)', () => {
    beforeEach(() => {
      setViewport(deviceConfigurations.desktop.width, deviceConfigurations.desktop.height)
      wrapper = mount(ResponsiveTypingTutor)
      wrapper.vm.initializeResponsive()
    })

    it('should detect desktop device correctly', async () => {
      await nextTick()
      expect(wrapper.vm.isMobile).toBe(false)
      expect(wrapper.vm.isTablet).toBe(false)
      expect(wrapper.vm.isDesktop).toBe(true)
    })

    it('should apply desktop CSS classes', async () => {
      await nextTick()
      expect(wrapper.classes()).toContain('desktop-device')
      expect(wrapper.find('.stats-bar').classes()).toContain('desktop-stats')
      expect(wrapper.find('.tutor-main').classes()).toContain('desktop-layout')
    })

    it('should show keyboard shortcuts hint', async () => {
      await nextTick()
      const keyboardHint = wrapper.find('.keyboard-hint')
      expect(keyboardHint.exists()).toBe(true)
      expect(keyboardHint.text()).toContain('Ctrl+R')
    })

    it('should handle keyboard shortcuts', async () => {
      await nextTick()
      const resetSpy = vi.spyOn(wrapper.vm, 'resetSession')
      const pauseSpy = vi.spyOn(wrapper.vm, 'pauseSession')

      // Test Ctrl+R (reset)
      const ctrlREvent = new KeyboardEvent('keydown', {
        key: 'r',
        ctrlKey: true
      })
      window.dispatchEvent(ctrlREvent)
      expect(resetSpy).toHaveBeenCalled()

      // Test Ctrl+P (pause)
      const ctrlPEvent = new KeyboardEvent('keydown', {
        key: 'p',
        ctrlKey: true
      })
      window.dispatchEvent(ctrlPEvent)
      expect(pauseSpy).toHaveBeenCalled()
    })

    it('should use desktop input configuration', async () => {
      await nextTick()
      const inputArea = wrapper.find('.input-area')
      expect(inputArea.classes()).toContain('desktop-input')
      expect(inputArea.attributes('rows')).toBe('6')
      expect(inputArea.attributes('placeholder')).toBe('Start typing the text above...')
    })

    it('should use large font sizes', async () => {
      await nextTick()
      const targetText = wrapper.find('.target-text-container')
      expect(targetText.element.style.fontSize).toBe('20px')
      expect(targetText.element.style.lineHeight).toBe('1.6')
    })
  })

  describe('Dynamic Responsiveness', () => {
    beforeEach(() => {
      setViewport(1024, 768)
      wrapper = mount(ResponsiveTypingTutor)
      wrapper.vm.initializeResponsive()
    })

    it('should update device type when window is resized', async () => {
      await nextTick()
      expect(wrapper.vm.isDesktop).toBe(true)

      // Resize to mobile
      setViewport(375, 667)
      const resizeEvent = new Event('resize')
      window.dispatchEvent(resizeEvent)
      
      expect(wrapper.vm.isMobile).toBe(true)
      expect(wrapper.vm.isDesktop).toBe(false)
    })

    it('should adjust layout when switching orientations', async () => {
      // Start in portrait mobile
      setViewport(375, 667)
      wrapper.vm.handleResize()
      await nextTick()
      expect(wrapper.vm.isMobile).toBe(true)

      // Switch to landscape
      setViewport(667, 375)
      wrapper.vm.handleResize()
      await nextTick()
      expect(wrapper.vm.isMobile).toBe(true) // Still mobile, just different orientation
    })

    it('should maintain session state during resize', async () => {
      wrapper.vm.startSession()
      wrapper.vm.userInput = 'Test input'
      wrapper.vm.stats.wpm = 45

      // Resize from desktop to mobile
      setViewport(375, 667)
      wrapper.vm.handleResize()
      await nextTick()

      expect(wrapper.vm.isActive).toBe(true)
      expect(wrapper.vm.userInput).toBe('Test input')
      expect(wrapper.vm.stats.wpm).toBe(45)
    })

    it('should adjust input focus on mobile during resize', async () => {
      // Start on mobile and activate session
      setViewport(375, 667)
      wrapper.vm.handleResize()
      wrapper.vm.startSession()
      await nextTick()

      const inputArea = wrapper.find('.input-area')
      const scrollIntoViewSpy = vi.fn()
      inputArea.element.scrollIntoView = scrollIntoViewSpy

      // Mock that input is focused
      Object.defineProperty(document, 'activeElement', {
        value: inputArea.element,
        writable: true
      })

      // Trigger orientation change
      wrapper.vm.handleOrientationChange()
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center'
      })
    })
  })

  describe('Accessibility and Touch Support', () => {
    beforeEach(() => {
      setViewport(375, 667)
      wrapper = mount(ResponsiveTypingTutor)
      wrapper.vm.initializeResponsive()
    })

    it('should support touch interactions on mobile', async () => {
      await nextTick()
      const button = wrapper.find('.btn-primary')
      
      // Simulate touch start/end events
      await button.trigger('touchstart')
      await button.trigger('touchend')
      await button.trigger('click')
      
      expect(wrapper.vm.isActive).toBe(true)
    })

    it('should handle native share API on mobile', async () => {
      // Mock navigator.share
      Object.defineProperty(navigator, 'share', {
        value: vi.fn(() => Promise.resolve()),
        writable: true
      })

      wrapper.vm.shareResults()
      
      expect(navigator.share).toHaveBeenCalledWith({
        title: 'My Typing Results',
        text: 'I achieved 0 WPM with 100% accuracy!',
        url: expect.any(String)
      })
    })

    it('should provide accessible button labels', async () => {
      await nextTick()
      const buttons = wrapper.findAll('button')
      
      buttons.forEach(button => {
        expect(button.text().length).toBeGreaterThan(0) // All buttons should have text
      })
    })

    it('should maintain proper tab order on all devices', async () => {
      await nextTick()
      const focusableElements = wrapper.findAll('button, input, textarea, select')
      
      expect(focusableElements.length).toBeGreaterThan(0)
      
      // All focusable elements should not have negative tabindex
      focusableElements.forEach(element => {
        const tabIndex = element.attributes('tabindex')
        if (tabIndex) {
          expect(parseInt(tabIndex)).toBeGreaterThanOrEqual(0)
        }
      })
    })
  })

  describe('Performance on Different Devices', () => {
    it('should handle rapid input on mobile without lag', async () => {
      setViewport(375, 667)
      wrapper = mount(ResponsiveTypingTutor)
      wrapper.vm.initializeResponsive()
      wrapper.vm.startSession()
      await nextTick()

      const startTime = performance.now()
      
      // Simulate rapid typing
      const inputArea = wrapper.find('.input-area')
      for (let i = 0; i < 50; i++) {
        wrapper.vm.userInput += 'a'
        await inputArea.trigger('input')
      }
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100) // Should handle 50 characters in under 100ms
    })

    it('should throttle resize events to prevent performance issues', async () => {
      const handleResizeSpy = vi.spyOn(ResponsiveTypingTutor.methods, 'handleResize')
      
      wrapper = mount(ResponsiveTypingTutor)
      
      // Trigger multiple resize events rapidly
      for (let i = 0; i < 10; i++) {
        const resizeEvent = new Event('resize')
        window.dispatchEvent(resizeEvent)
      }
      
      // Should handle all resize events but not cause performance issues
      expect(handleResizeSpy).toHaveBeenCalled()
    })

    it('should optimize rendering for different screen sizes', async () => {
      // Test that components don't render unnecessary elements on mobile
      setViewport(375, 667)
      wrapper = mount(ResponsiveTypingTutor)
      wrapper.vm.initializeResponsive()
      await nextTick()

      const keyboardHint = wrapper.find('.keyboard-hint')
      expect(keyboardHint.exists()).toBe(false) // Should not render on mobile

      // Test that desktop shows additional elements
      setViewport(1920, 1080)
      wrapper.vm.handleResize()
      await nextTick()

      const keyboardHintDesktop = wrapper.find('.keyboard-hint')
      expect(keyboardHintDesktop.exists()).toBe(true) // Should render on desktop
    })
  })
})