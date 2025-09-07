/**
 * @fileoverview Integration tests for real-time feedback systems and visual indicators
 * Tests the complete feedback loop from keystroke to visual response
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Mock WebSocket for real-time features
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1 // OPEN
}

// Global WebSocket mock
global.WebSocket = vi.fn(() => mockWebSocket)

// Real-time feedback component
const RealtimeFeedbackComponent = {
  template: `
    <div class="realtime-feedback">
      <!-- Live Statistics Display -->
      <div class="stats-dashboard">
        <div class="stat-card wpm-card" :class="wpmTrend">
          <div class="stat-value">{{ currentStats.wpm }}</div>
          <div class="stat-label">WPM</div>
          <div class="stat-trend">{{ wpmChange > 0 ? '+' : '' }}{{ wpmChange }}</div>
        </div>
        
        <div class="stat-card accuracy-card" :class="accuracyStatus">
          <div class="stat-value">{{ currentStats.accuracy }}%</div>
          <div class="stat-label">Accuracy</div>
          <div class="accuracy-bar">
            <div class="accuracy-fill" :style="{ width: currentStats.accuracy + '%' }"></div>
          </div>
        </div>
        
        <div class="stat-card consistency-card">
          <div class="stat-value">{{ currentStats.consistency }}%</div>
          <div class="stat-label">Consistency</div>
          <div class="consistency-indicator" :class="consistencyLevel"></div>
        </div>
      </div>

      <!-- Real-time Error Highlighting -->
      <div class="error-feedback" v-if="activeError">
        <div class="error-message" :class="errorSeverity">
          <i class="error-icon"></i>
          {{ activeError.message }}
        </div>
        <div class="error-suggestion" v-if="activeError.suggestion">
          💡 {{ activeError.suggestion }}
        </div>
      </div>

      <!-- Keystroke Visualization -->
      <div class="keystroke-visualizer" v-if="showKeystrokes">
        <div class="keystroke-flow">
          <div 
            v-for="(keystroke, index) in recentKeystrokes" 
            :key="keystroke.id"
            class="keystroke-bubble"
            :class="[keystroke.correct ? 'correct' : 'incorrect', getKeystrokeStyle(keystroke)]"
            :style="{ animationDelay: index * 50 + 'ms' }"
          >
            {{ formatKeystroke(keystroke.key) }}
          </div>
        </div>
      </div>

      <!-- Progress Indicators -->
      <div class="progress-section">
        <div class="overall-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: overallProgress + '%' }"></div>
          </div>
          <div class="progress-text">{{ Math.round(overallProgress) }}% Complete</div>
        </div>
        
        <div class="typing-rhythm">
          <div class="rhythm-bars">
            <div 
              v-for="(bar, index) in rhythmBars" 
              :key="index"
              class="rhythm-bar"
              :style="{ height: bar.height + 'px', opacity: bar.opacity }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Achievement Notifications -->
      <transition-group name="notification" tag="div" class="notifications">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          class="notification"
          :class="notification.type"
        >
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
          </div>
          <button @click="dismissNotification(notification.id)" class="dismiss-btn">×</button>
        </div>
      </transition-group>
    </div>
  `,
  props: {
    targetText: { type: String, required: true },
    showKeystrokes: { type: Boolean, default: true },
    realtimeUpdates: { type: Boolean, default: true }
  },
  data() {
    return {
      currentStats: {
        wpm: 0,
        accuracy: 100,
        consistency: 100
      },
      previousStats: {
        wpm: 0,
        accuracy: 100,
        consistency: 100
      },
      activeError: null,
      recentKeystrokes: [],
      overallProgress: 0,
      rhythmBars: Array(20).fill(null).map(() => ({ height: 0, opacity: 0 })),
      notifications: [],
      websocket: null,
      lastUpdateTime: 0,
      keystrokeId: 0,
      updateInterval: null
    }
  },
  computed: {
    wpmChange() {
      return this.currentStats.wpm - this.previousStats.wpm
    },
    
    wpmTrend() {
      if (this.wpmChange > 0) return 'trending-up'
      if (this.wpmChange < 0) return 'trending-down'
      return 'stable'
    },
    
    accuracyStatus() {
      if (this.currentStats.accuracy >= 95) return 'excellent'
      if (this.currentStats.accuracy >= 85) return 'good'
      if (this.currentStats.accuracy >= 70) return 'fair'
      return 'poor'
    },
    
    consistencyLevel() {
      if (this.currentStats.consistency >= 90) return 'high'
      if (this.currentStats.consistency >= 70) return 'medium'
      return 'low'
    },
    
    errorSeverity() {
      if (!this.activeError) return ''
      if (this.activeError.type === 'critical') return 'severe'
      if (this.activeError.type === 'warning') return 'moderate'
      return 'minor'
    }
  },
  mounted() {
    this.initializeRealtimeUpdates()
    this.startRhythmVisualization()
  },
  beforeUnmount() {
    this.cleanup()
  },
  methods: {
    initializeRealtimeUpdates() {
      if (this.realtimeUpdates) {
        this.connectWebSocket()
        this.updateInterval = setInterval(this.updateStats, 100) // Update every 100ms
      }
    },
    
    connectWebSocket() {
      try {
        this.websocket = new WebSocket('ws://localhost:3001/typing-feedback')
        
        this.websocket.addEventListener('message', (event) => {
          const data = JSON.parse(event.data)
          this.handleRealtimeData(data)
        })
        
        this.websocket.addEventListener('error', (error) => {
          console.error('WebSocket error:', error)
          this.showNotification('connection-error', 'Connection Error', 'Real-time features unavailable')
        })
      } catch (error) {
        console.warn('WebSocket connection failed, using local updates only')
      }
    },
    
    handleRealtimeData(data) {
      switch (data.type) {
        case 'stats-update':
          this.updateStatsFromServer(data.stats)
          break
        case 'keystroke':
          this.handleKeystroke(data.keystroke)
          break
        case 'error':
          this.showError(data.error)
          break
        case 'achievement':
          this.showAchievement(data.achievement)
          break
      }
    },
    
    updateStatsFromServer(stats) {
      this.previousStats = { ...this.currentStats }
      this.currentStats = { ...stats }
      this.checkForMilestones()
    },
    
    handleKeystroke(keystroke) {
      const enhancedKeystroke = {
        ...keystroke,
        id: this.keystrokeId++,
        timestamp: Date.now()
      }
      
      this.recentKeystrokes.unshift(enhancedKeystroke)
      
      // Keep only recent keystrokes for performance
      if (this.recentKeystrokes.length > 10) {
        this.recentKeystrokes.pop()
      }
      
      // Update rhythm visualization
      this.updateRhythmVisualization(keystroke)
      
      // Process error detection
      if (!keystroke.correct) {
        this.processTypingError(keystroke)
      } else {
        this.clearActiveError()
      }
    },
    
    processTypingError(keystroke) {
      const errorTypes = {
        'substitution': {
          message: `Expected '${keystroke.expected}', got '${keystroke.actual}'`,
          suggestion: 'Double-check the character before continuing',
          type: 'warning'
        },
        'insertion': {
          message: 'Extra character detected',
          suggestion: 'Use backspace to remove unwanted characters',
          type: 'warning'
        },
        'deletion': {
          message: 'Missing character detected',
          suggestion: 'You may have skipped a character',
          type: 'critical'
        }
      }
      
      this.activeError = errorTypes[keystroke.errorType] || {
        message: 'Typing error detected',
        suggestion: 'Review your input and continue',
        type: 'minor'
      }
      
      // Auto-clear error after delay
      setTimeout(() => {
        if (this.activeError && this.activeError.type !== 'critical') {
          this.clearActiveError()
        }
      }, 3000)
    },
    
    clearActiveError() {
      this.activeError = null
    },
    
    updateRhythmVisualization(keystroke) {
      const interval = keystroke.interval || 200 // Default interval
      const normalizedHeight = Math.min(50, Math.max(5, 50 - (interval / 10)))
      
      // Shift bars and add new one
      this.rhythmBars.shift()
      this.rhythmBars.push({
        height: normalizedHeight,
        opacity: keystroke.correct ? 0.8 : 0.4
      })
    },
    
    startRhythmVisualization() {
      // Animate rhythm bars
      setInterval(() => {
        this.rhythmBars.forEach((bar, index) => {
          bar.opacity = Math.max(0.1, bar.opacity - 0.05)
        })
      }, 100)
    },
    
    updateStats() {
      // Mock stats update for testing
      if (Date.now() - this.lastUpdateTime > 1000) {
        this.simulateStatsUpdate()
        this.lastUpdateTime = Date.now()
      }
    },
    
    simulateStatsUpdate() {
      // Simulate gradual improvement for testing
      const variation = () => Math.random() * 4 - 2 // -2 to +2 variation
      
      this.previousStats = { ...this.currentStats }
      this.currentStats.wpm = Math.max(0, Math.round(this.currentStats.wpm + variation()))
      this.currentStats.accuracy = Math.min(100, Math.max(0, this.currentStats.accuracy + variation() * 0.5))
      this.currentStats.consistency = Math.min(100, Math.max(0, this.currentStats.consistency + variation() * 0.3))
      
      this.checkForMilestones()
    },
    
    checkForMilestones() {
      // Check for WPM milestones
      const wpmMilestones = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
      wpmMilestones.forEach(milestone => {
        if (this.previousStats.wpm < milestone && this.currentStats.wpm >= milestone) {
          this.showAchievement({
            title: 'Speed Milestone!',
            message: `You've reached ${milestone} WPM!`,
            type: 'success'
          })
        }
      })
      
      // Check for accuracy achievements
      if (this.currentStats.accuracy >= 95 && this.previousStats.accuracy < 95) {
        this.showAchievement({
          title: 'Accuracy Master!',
          message: 'Excellent accuracy - 95% or higher!',
          type: 'success'
        })
      }
    },
    
    showError(error) {
      this.activeError = error
    },
    
    showAchievement(achievement) {
      this.showNotification('achievement', achievement.title, achievement.message)
    },
    
    showNotification(type, title, message) {
      const notification = {
        id: Date.now(),
        type,
        title,
        message,
        timestamp: Date.now()
      }
      
      this.notifications.unshift(notification)
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        this.dismissNotification(notification.id)
      }, 5000)
    },
    
    dismissNotification(id) {
      const index = this.notifications.findIndex(n => n.id === id)
      if (index > -1) {
        this.notifications.splice(index, 1)
      }
    },
    
    formatKeystroke(key) {
      const keyMap = {
        ' ': '⎵',
        'Enter': '↵',
        'Tab': '⇥',
        'Backspace': '⌫',
        'Delete': '⌦',
        'Shift': '⇧',
        'Ctrl': '⌃',
        'Alt': '⌥',
        'Meta': '⌘'
      }
      
      return keyMap[key] || key.slice(0, 1).toUpperCase()
    },
    
    getKeystrokeStyle(keystroke) {
      const age = Date.now() - keystroke.timestamp
      if (age < 1000) return 'fresh'
      if (age < 3000) return 'recent'
      return 'old'
    },
    
    cleanup() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval)
      }
      
      if (this.websocket) {
        this.websocket.close()
      }
    }
  }
}

describe('Real-time Feedback System', () => {
  /** @type {import('@vue/test-utils').VueWrapper} */
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('Statistics Display', () => {
    beforeEach(() => {
      wrapper = mount(RealtimeFeedbackComponent, {
        props: {
          targetText: 'Hello World',
          realtimeUpdates: true
        }
      })
    })

    it('should display current statistics correctly', async () => {
      wrapper.vm.currentStats = { wpm: 45, accuracy: 92, consistency: 85 }
      await nextTick()

      const wpmCard = wrapper.find('.wpm-card .stat-value')
      const accuracyCard = wrapper.find('.accuracy-card .stat-value')
      const consistencyCard = wrapper.find('.consistency-card .stat-value')

      expect(wpmCard.text()).toBe('45')
      expect(accuracyCard.text()).toBe('92%')
      expect(consistencyCard.text()).toBe('85%')
    })

    it('should show WPM trend indicators', async () => {
      wrapper.vm.previousStats.wpm = 40
      wrapper.vm.currentStats.wpm = 45
      await nextTick()

      const wpmCard = wrapper.find('.wpm-card')
      const trendElement = wrapper.find('.stat-trend')

      expect(wpmCard.classes()).toContain('trending-up')
      expect(trendElement.text()).toBe('+5')
    })

    it('should apply accuracy status classes', async () => {
      wrapper.vm.currentStats.accuracy = 96
      await nextTick()

      const accuracyCard = wrapper.find('.accuracy-card')
      expect(accuracyCard.classes()).toContain('excellent')

      wrapper.vm.currentStats.accuracy = 85
      await nextTick()
      expect(accuracyCard.classes()).toContain('good')
    })

    it('should update accuracy bar width', async () => {
      wrapper.vm.currentStats.accuracy = 87
      await nextTick()

      const accuracyFill = wrapper.find('.accuracy-fill')
      expect(accuracyFill.element.style.width).toBe('87%')
    })
  })

  describe('Real-time Error Feedback', () => {
    beforeEach(() => {
      wrapper = mount(RealtimeFeedbackComponent, {
        props: {
          targetText: 'Hello World'
        }
      })
    })

    it('should display error messages', async () => {
      const error = {
        message: 'Expected "e", got "x"',
        suggestion: 'Double-check the character',
        type: 'warning'
      }
      
      wrapper.vm.activeError = error
      await nextTick()

      const errorMessage = wrapper.find('.error-message')
      const errorSuggestion = wrapper.find('.error-suggestion')

      expect(errorMessage.text()).toContain('Expected "e", got "x"')
      expect(errorSuggestion.text()).toContain('Double-check the character')
      expect(errorMessage.classes()).toContain('moderate')
    })

    it('should process typing errors correctly', () => {
      const keystroke = {
        correct: false,
        expected: 'e',
        actual: 'x',
        errorType: 'substitution'
      }

      wrapper.vm.processTypingError(keystroke)

      expect(wrapper.vm.activeError).toBeTruthy()
      expect(wrapper.vm.activeError.message).toContain('Expected')
      expect(wrapper.vm.activeError.type).toBe('warning')
    })

    it('should auto-clear non-critical errors', async () => {
      const keystroke = {
        correct: false,
        errorType: 'substitution',
        expected: 'e',
        actual: 'x'
      }

      wrapper.vm.processTypingError(keystroke)
      expect(wrapper.vm.activeError).toBeTruthy()

      // Fast-forward 3 seconds
      vi.advanceTimersByTime(3000)
      await nextTick()

      expect(wrapper.vm.activeError).toBeNull()
    })
  })

  describe('Keystroke Visualization', () => {
    beforeEach(() => {
      wrapper = mount(RealtimeFeedbackComponent, {
        props: {
          targetText: 'Hello World',
          showKeystrokes: true
        }
      })
    })

    it('should display recent keystrokes', async () => {
      const keystroke = {
        key: 'h',
        correct: true,
        interval: 150
      }

      wrapper.vm.handleKeystroke(keystroke)
      await nextTick()

      const keystrokeBubbles = wrapper.findAll('.keystroke-bubble')
      expect(keystrokeBubbles).toHaveLength(1)
      expect(keystrokeBubbles[0].classes()).toContain('correct')
      expect(keystrokeBubbles[0].text()).toBe('H')
    })

    it('should limit recent keystrokes for performance', () => {
      // Add 15 keystrokes
      for (let i = 0; i < 15; i++) {
        wrapper.vm.handleKeystroke({
          key: String.fromCharCode(97 + i),
          correct: true
        })
      }

      expect(wrapper.vm.recentKeystrokes).toHaveLength(10) // Should be limited to 10
    })

    it('should format special keys correctly', () => {
      expect(wrapper.vm.formatKeystroke(' ')).toBe('⎵')
      expect(wrapper.vm.formatKeystroke('Enter')).toBe('↵')
      expect(wrapper.vm.formatKeystroke('Backspace')).toBe('⌫')
      expect(wrapper.vm.formatKeystroke('a')).toBe('A')
    })

    it('should apply keystroke age styling', () => {
      const now = Date.now()
      
      const freshKeystroke = { timestamp: now - 500 } // 500ms ago
      const recentKeystroke = { timestamp: now - 2000 } // 2s ago
      const oldKeystroke = { timestamp: now - 5000 } // 5s ago

      expect(wrapper.vm.getKeystrokeStyle(freshKeystroke)).toBe('fresh')
      expect(wrapper.vm.getKeystrokeStyle(recentKeystroke)).toBe('recent')
      expect(wrapper.vm.getKeystrokeStyle(oldKeystroke)).toBe('old')
    })
  })

  describe('Progress Indicators', () => {
    beforeEach(() => {
      wrapper = mount(RealtimeFeedbackComponent, {
        props: {
          targetText: 'Hello World'
        }
      })
    })

    it('should update overall progress', async () => {
      wrapper.vm.overallProgress = 65.5
      await nextTick()

      const progressFill = wrapper.find('.progress-fill')
      const progressText = wrapper.find('.progress-text')

      expect(progressFill.element.style.width).toBe('65.5%')
      expect(progressText.text()).toBe('66% Complete') // Rounded
    })

    it('should animate rhythm bars', async () => {
      const keystroke = {
        key: 'a',
        correct: true,
        interval: 200
      }

      wrapper.vm.updateRhythmVisualization(keystroke)
      await nextTick()

      const rhythmBars = wrapper.findAll('.rhythm-bar')
      expect(rhythmBars).toHaveLength(20)
      
      // Check that the last bar was updated
      const lastBar = rhythmBars[rhythmBars.length - 1]
      expect(lastBar.element.style.height).not.toBe('0px')
    })
  })

  describe('Achievement Notifications', () => {
    beforeEach(() => {
      wrapper = mount(RealtimeFeedbackComponent, {
        props: {
          targetText: 'Hello World'
        }
      })
    })

    it('should show milestone achievements', async () => {
      wrapper.vm.previousStats.wpm = 49
      wrapper.vm.currentStats.wpm = 51

      wrapper.vm.checkForMilestones()
      await nextTick()

      const notifications = wrapper.findAll('.notification')
      expect(notifications).toHaveLength(1)
      expect(notifications[0].find('.notification-title').text()).toContain('Speed Milestone')
    })

    it('should show accuracy achievements', async () => {
      wrapper.vm.previousStats.accuracy = 94
      wrapper.vm.currentStats.accuracy = 96

      wrapper.vm.checkForMilestones()
      await nextTick()

      const notifications = wrapper.findAll('.notification')
      expect(notifications).toHaveLength(1)
      expect(notifications[0].find('.notification-title').text()).toContain('Accuracy Master')
    })

    it('should dismiss notifications', async () => {
      wrapper.vm.showNotification('test', 'Test Title', 'Test Message')
      await nextTick()

      let notifications = wrapper.findAll('.notification')
      expect(notifications).toHaveLength(1)

      const dismissBtn = wrapper.find('.dismiss-btn')
      await dismissBtn.trigger('click')
      await nextTick()

      notifications = wrapper.findAll('.notification')
      expect(notifications).toHaveLength(0)
    })

    it('should auto-dismiss notifications', async () => {
      wrapper.vm.showNotification('test', 'Test Title', 'Test Message')
      await nextTick()

      expect(wrapper.vm.notifications).toHaveLength(1)

      // Fast-forward 5 seconds
      vi.advanceTimersByTime(5000)
      await nextTick()

      expect(wrapper.vm.notifications).toHaveLength(0)
    })
  })

  describe('WebSocket Integration', () => {
    beforeEach(() => {
      wrapper = mount(RealtimeFeedbackComponent, {
        props: {
          targetText: 'Hello World',
          realtimeUpdates: true
        }
      })
    })

    it('should initialize WebSocket connection', () => {
      expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:3001/typing-feedback')
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('should handle realtime stats updates', () => {
      const mockData = {
        type: 'stats-update',
        stats: { wpm: 55, accuracy: 88, consistency: 92 }
      }

      wrapper.vm.handleRealtimeData(mockData)

      expect(wrapper.vm.currentStats.wpm).toBe(55)
      expect(wrapper.vm.currentStats.accuracy).toBe(88)
      expect(wrapper.vm.currentStats.consistency).toBe(92)
    })

    it('should handle realtime keystroke events', () => {
      const mockData = {
        type: 'keystroke',
        keystroke: { key: 'a', correct: true, interval: 180 }
      }

      wrapper.vm.handleRealtimeData(mockData)

      expect(wrapper.vm.recentKeystrokes).toHaveLength(1)
      expect(wrapper.vm.recentKeystrokes[0].key).toBe('a')
      expect(wrapper.vm.recentKeystrokes[0].correct).toBe(true)
    })

    it('should cleanup WebSocket on unmount', () => {
      wrapper.unmount()
      expect(mockWebSocket.close).toHaveBeenCalled()
    })
  })

  describe('Performance Optimization', () => {
    it('should handle high-frequency updates efficiently', async () => {
      wrapper = mount(RealtimeFeedbackComponent, {
        props: {
          targetText: 'Hello World'
        }
      })

      const startTime = performance.now()
      
      // Simulate 100 rapid keystroke events
      for (let i = 0; i < 100; i++) {
        wrapper.vm.handleKeystroke({
          key: String.fromCharCode(97 + (i % 26)),
          correct: Math.random() > 0.1,
          interval: 50 + Math.random() * 100
        })
      }

      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100) // Should handle 100 updates in under 100ms
    })

    it('should throttle rhythm bar updates', () => {
      wrapper = mount(RealtimeFeedbackComponent, {
        props: {
          targetText: 'Hello World'
        }
      })

      const initialOpacity = wrapper.vm.rhythmBars[0].opacity
      
      // Simulate animation frame
      vi.advanceTimersByTime(100)
      
      expect(wrapper.vm.rhythmBars[0].opacity).toBeLessThan(initialOpacity)
    })
  })
})