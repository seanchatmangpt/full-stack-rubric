/**
 * @fileoverview Integration tests for session persistence and progress tracking
 * Tests data persistence across browser sessions and progress tracking functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Mock localStorage
/** @type {{ store: Map<string, string>, getItem: Function, setItem: Function, removeItem: Function, clear: Function }} */
const mockLocalStorage = {
  store: new Map(),
  getItem: vi.fn((key) => mockLocalStorage.store.get(key) || null),
  setItem: vi.fn((key, value) => {
    mockLocalStorage.store.set(key, value)
  }),
  removeItem: vi.fn((key) => {
    mockLocalStorage.store.delete(key)
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store.clear()
  })
}

// Mock IndexedDB for advanced persistence
const mockIndexedDB = {
  databases: new Map(),
  open: vi.fn(() => Promise.resolve({
    transaction: vi.fn(() => ({
      objectStore: vi.fn(() => ({
        add: vi.fn(() => Promise.resolve()),
        get: vi.fn(() => Promise.resolve({ value: null })),
        put: vi.fn(() => Promise.resolve()),
        delete: vi.fn(() => Promise.resolve()),
        getAll: vi.fn(() => Promise.resolve([]))
      }))
    })),
    close: vi.fn()
  }))
}

// Global mocks
Object.defineProperty(global, 'localStorage', { value: mockLocalStorage })
Object.defineProperty(global, 'indexedDB', { value: mockIndexedDB })

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123')
  }
})

/**
 * @typedef {Object} TypingSessionKeystroke
 * @property {number} timestamp - When the keystroke occurred
 * @property {string} key - The key that was pressed
 * @property {boolean} correct - Whether the keystroke was correct
 * @property {number} position - Position in the text
 */

/**
 * @typedef {Object} TypingSessionStats
 * @property {number} wpm - Words per minute
 * @property {number} accuracy - Typing accuracy percentage
 * @property {number} consistency - Typing consistency percentage
 * @property {number} errorCount - Number of errors made
 * @property {number} correctionCount - Number of corrections made
 */

/**
 * @typedef {Object} TypingSessionMetadata
 * @property {string} userAgent - Browser user agent
 * @property {string} screenResolution - Screen resolution
 * @property {string} language - Browser language
 */

/**
 * @typedef {Object} TypingSession
 * @property {string} id - Unique session identifier
 * @property {number} startTime - Session start timestamp
 * @property {number} [endTime] - Session end timestamp
 * @property {string} targetText - Text to be typed
 * @property {string} typedText - Text that was typed
 * @property {TypingSessionStats} stats - Session statistics
 * @property {TypingSessionKeystroke[]} keystrokes - Array of keystrokes
 * @property {TypingSessionMetadata} metadata - Session metadata
 */

/**
 * @typedef {Object} ImprovementTrendEntry
 * @property {string} date - Date of the entry
 * @property {number} wpm - WPM for that date
 * @property {number} accuracy - Accuracy for that date
 */

/**
 * @typedef {Object} Achievement
 * @property {string} id - Achievement identifier
 * @property {string} name - Achievement name
 * @property {string} description - Achievement description
 * @property {number} unlockedAt - Timestamp when unlocked
 */

/**
 * @typedef {Object} UserPreferences
 * @property {string} theme - UI theme preference
 * @property {string} difficulty - Difficulty level
 * @property {boolean} soundEnabled - Whether sound is enabled
 * @property {boolean} realTimeFeedback - Whether real-time feedback is enabled
 */

/**
 * @typedef {Object} UserProgress
 * @property {string} userId - User identifier
 * @property {number} totalSessions - Total number of sessions
 * @property {number} totalTimeTyping - Total time spent typing
 * @property {number} averageWPM - Average WPM across all sessions
 * @property {number} averageAccuracy - Average accuracy across all sessions
 * @property {number} bestWPM - Best WPM achieved
 * @property {number} bestAccuracy - Best accuracy achieved
 * @property {ImprovementTrendEntry[]} improvementTrend - Historical improvement data
 * @property {Achievement[]} achievements - Unlocked achievements
 * @property {UserPreferences} preferences - User preferences
 */

// Session persistence manager
class SessionPersistenceManager {
  constructor() {
    this.dbName = 'typing-tutor-db'
    this.dbVersion = 1
    /** @type {any} */
    this.db = null
  }

  async initialize() {
    if (typeof indexedDB === 'undefined') {
      console.warn('IndexedDB not available, falling back to localStorage')
      return
    }

    try {
      this.db = await indexedDB.open(this.dbName, this.dbVersion)
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error)
    }
  }

  /**
   * Save a typing session
   * @param {TypingSession} session - The session to save
   * @returns {Promise<void>}
   */
  async saveSession(session) {
    if (this.db) {
      await this.saveToIndexedDB('sessions', session)
    } else {
      this.saveToLocalStorage(`session_${session.id}`, session)
    }
  }

  /**
   * Get a typing session by ID
   * @param {string} sessionId - The session ID
   * @returns {Promise<TypingSession|null>}
   */
  async getSession(sessionId) {
    if (this.db) {
      return await this.getFromIndexedDB('sessions', sessionId)
    } else {
      return this.getFromLocalStorage(`session_${sessionId}`)
    }
  }

  /**
   * Get all typing sessions
   * @returns {Promise<TypingSession[]>}
   */
  async getAllSessions() {
    if (this.db) {
      return await this.getAllFromIndexedDB('sessions')
    } else {
      return this.getAllFromLocalStorage('session_')
    }
  }

  /**
   * Save user progress
   * @param {UserProgress} progress - The progress to save
   * @returns {Promise<void>}
   */
  async saveProgress(progress) {
    if (this.db) {
      await this.saveToIndexedDB('progress', progress)
    } else {
      this.saveToLocalStorage('user_progress', progress)
    }
  }

  /**
   * Get user progress
   * @returns {Promise<UserProgress|null>}
   */
  async getProgress() {
    if (this.db) {
      return await this.getFromIndexedDB('progress', 'user_progress')
    } else {
      return this.getFromLocalStorage('user_progress')
    }
  }

  /**
   * Delete a typing session
   * @param {string} sessionId - The session ID to delete
   * @returns {Promise<void>}
   */
  async deleteSession(sessionId) {
    if (this.db) {
      const transaction = this.db.transaction(['sessions'], 'readwrite')
      const store = transaction.objectStore('sessions')
      await store.delete(sessionId)
    } else {
      localStorage.removeItem(`session_${sessionId}`)
    }
  }

  /**
   * Clear all stored data
   * @returns {Promise<void>}
   */
  async clearAllData() {
    if (this.db) {
      const transaction = this.db.transaction(['sessions', 'progress'], 'readwrite')
      await transaction.objectStore('sessions').clear()
      await transaction.objectStore('progress').clear()
    } else {
      localStorage.clear()
    }
  }

  // Private helper methods
  /**
   * Save data to IndexedDB
   * @param {string} storeName - The store name
   * @param {any} data - The data to save
   * @returns {Promise<void>}
   */
  async saveToIndexedDB(storeName, data) {
    const transaction = this.db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    await store.put(data)
  }

  /**
   * Get data from IndexedDB
   * @param {string} storeName - The store name
   * @param {string} key - The key to get
   * @returns {Promise<any>}
   */
  async getFromIndexedDB(storeName, key) {
    const transaction = this.db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const result = await store.get(key)
    return result?.value || null
  }

  /**
   * Get all data from IndexedDB store
   * @param {string} storeName - The store name
   * @returns {Promise<any[]>}
   */
  async getAllFromIndexedDB(storeName) {
    const transaction = this.db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    return await store.getAll()
  }

  /**
   * Save data to localStorage
   * @param {string} key - The key to save under
   * @param {any} data - The data to save
   */
  saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }

  /**
   * Get data from localStorage
   * @param {string} key - The key to get
   * @returns {any}
   */
  getFromLocalStorage(key) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Failed to read from localStorage:', error)
      return null
    }
  }

  /**
   * Get all data from localStorage with prefix
   * @param {string} prefix - The key prefix
   * @returns {any[]}
   */
  getAllFromLocalStorage(prefix) {
    const items = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}')
          items.push(item)
        } catch (error) {
          console.error(`Failed to parse item ${key}:`, error)
        }
      }
    }
    return items
  }
}

// Progress tracking component
const ProgressTrackingComponent = {
  template: `
    <div class="progress-tracking">
      <!-- Session Overview -->
      <div class="session-overview">
        <div class="current-session" v-if="currentSession">
          <h3>Current Session</h3>
          <div class="session-stats">
            <div class="stat">
              <span class="label">Duration:</span>
              <span class="value">{{ formatDuration(sessionDuration) }}</span>
            </div>
            <div class="stat">
              <span class="label">Progress:</span>
              <span class="value">{{ Math.round(sessionProgress) }}%</span>
            </div>
            <div class="stat">
              <span class="label">Current WPM:</span>
              <span class="value">{{ currentSession.stats.wpm }}</span>
            </div>
          </div>
        </div>

        <div class="session-controls">
          <button @click="saveCurrentSession" :disabled="!currentSession">Save Session</button>
          <button @click="loadPreviousSession" :disabled="!hasPreviousSessions">Load Previous</button>
          <button @click="exportProgress">Export Progress</button>
          <button @click="clearAllProgress" class="danger">Clear All Data</button>
        </div>
      </div>

      <!-- Progress Charts -->
      <div class="progress-charts">
        <div class="chart-container">
          <h4>WPM Progress Over Time</h4>
          <div class="chart wpm-chart">
            <div 
              v-for="(point, index) in progressHistory.slice(-10)" 
              :key="index"
              class="chart-bar"
              :style="{ height: (point.wpm / maxWPM) * 100 + '%' }"
              :title="\`\${point.date}: \${point.wpm} WPM\`"
            ></div>
          </div>
        </div>

        <div class="chart-container">
          <h4>Accuracy Trend</h4>
          <div class="chart accuracy-chart">
            <div 
              v-for="(point, index) in progressHistory.slice(-10)" 
              :key="index"
              class="chart-bar"
              :style="{ height: point.accuracy + '%' }"
              :title="\`\${point.date}: \${point.accuracy}% Accuracy\`"
            ></div>
          </div>
        </div>
      </div>

      <!-- Session History -->
      <div class="session-history">
        <h4>Recent Sessions</h4>
        <div class="sessions-list">
          <div 
            v-for="session in recentSessions" 
            :key="session.id"
            class="session-item"
            @click="loadSession(session.id)"
          >
            <div class="session-date">{{ formatDate(session.startTime) }}</div>
            <div class="session-stats-mini">
              <span>{{ session.stats.wpm }} WPM</span>
              <span>{{ session.stats.accuracy }}%</span>
              <span>{{ formatDuration(session.endTime - session.startTime) }}</span>
            </div>
            <div class="session-text">{{ session.targetText.slice(0, 50) }}...</div>
          </div>
        </div>
      </div>

      <!-- Achievements -->
      <div class="achievements" v-if="userProgress && userProgress.achievements.length">
        <h4>Achievements</h4>
        <div class="achievements-grid">
          <div 
            v-for="achievement in userProgress.achievements" 
            :key="achievement.id"
            class="achievement-card"
          >
            <div class="achievement-icon">🏆</div>
            <div class="achievement-name">{{ achievement.name }}</div>
            <div class="achievement-desc">{{ achievement.description }}</div>
            <div class="achievement-date">{{ formatDate(achievement.unlockedAt) }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      persistenceManager: new SessionPersistenceManager(),
      /** @type {TypingSession|null} */
      currentSession: null,
      /** @type {UserProgress|null} */
      userProgress: null,
      /** @type {TypingSession[]} */
      recentSessions: [],
      /** @type {ImprovementTrendEntry[]} */
      progressHistory: [],
      sessionDuration: 0,
      sessionProgress: 0,
      maxWPM: 100,
      /** @type {any} */
      updateInterval: null
    }
  },
  computed: {
    hasPreviousSessions() {
      return this.recentSessions.length > 0
    }
  },
  async mounted() {
    await this.initialize()
    this.startProgressTracking()
  },
  beforeUnmount() {
    this.stopProgressTracking()
  },
  methods: {
    async initialize() {
      await this.persistenceManager.initialize()
      await this.loadUserProgress()
      await this.loadRecentSessions()
      await this.restoreCurrentSession()
    },

    async loadUserProgress() {
      this.userProgress = await this.persistenceManager.getProgress()
      
      if (!this.userProgress) {
        this.userProgress = this.createInitialProgress()
        await this.persistenceManager.saveProgress(this.userProgress)
      }

      this.progressHistory = this.userProgress.improvementTrend
      this.maxWPM = Math.max(100, this.userProgress.bestWPM * 1.2)
    },

    /**
     * Create initial user progress
     * @returns {UserProgress}
     */
    createInitialProgress() {
      return {
        userId: crypto.randomUUID(),
        totalSessions: 0,
        totalTimeTyping: 0,
        averageWPM: 0,
        averageAccuracy: 0,
        bestWPM: 0,
        bestAccuracy: 0,
        improvementTrend: [],
        achievements: [],
        preferences: {
          theme: 'light',
          difficulty: 'medium',
          soundEnabled: true,
          realTimeFeedback: true
        }
      }
    },

    async loadRecentSessions() {
      const allSessions = await this.persistenceManager.getAllSessions()
      this.recentSessions = allSessions
        .sort((a, b) => b.startTime - a.startTime)
        .slice(0, 10)
    },

    async restoreCurrentSession() {
      // Try to restore any active session from localStorage
      const activeSessionId = localStorage.getItem('active_session_id')
      if (activeSessionId) {
        this.currentSession = await this.persistenceManager.getSession(activeSessionId)
        if (this.currentSession && !this.currentSession.endTime) {
          // Resume active session
          this.resumeSession(this.currentSession)
        }
      }
    },

    /**
     * Start a new typing session
     * @param {string} targetText - The text to type
     */
    startNewSession(targetText) {
      this.currentSession = {
        id: crypto.randomUUID(),
        startTime: Date.now(),
        targetText,
        typedText: '',
        stats: {
          wpm: 0,
          accuracy: 100,
          consistency: 100,
          errorCount: 0,
          correctionCount: 0
        },
        keystrokes: [],
        metadata: {
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          language: navigator.language
        }
      }

      localStorage.setItem('active_session_id', this.currentSession.id)
      this.saveSessionProgress() // Auto-save immediately
    },

    /**
     * Resume an existing session
     * @param {TypingSession} session - The session to resume
     */
    resumeSession(session) {
      this.currentSession = session
      localStorage.setItem('active_session_id', session.id)
    },

    async saveCurrentSession() {
      if (!this.currentSession) return

      this.currentSession.endTime = Date.now()
      await this.persistenceManager.saveSession(this.currentSession)
      await this.updateUserProgress()
      
      localStorage.removeItem('active_session_id')
      this.recentSessions.unshift(this.currentSession)
      
      // Keep only recent 10 sessions in memory
      if (this.recentSessions.length > 10) {
        this.recentSessions = this.recentSessions.slice(0, 10)
      }
    },

    async updateUserProgress() {
      if (!this.currentSession || !this.userProgress) return

      const sessionDuration = (this.currentSession.endTime - this.currentSession.startTime) / 1000
      
      // Update totals
      this.userProgress.totalSessions++
      this.userProgress.totalTimeTyping += sessionDuration

      // Update averages
      const totalSessions = this.userProgress.totalSessions
      this.userProgress.averageWPM = (
        (this.userProgress.averageWPM * (totalSessions - 1) + this.currentSession.stats.wpm) / totalSessions
      )
      this.userProgress.averageAccuracy = (
        (this.userProgress.averageAccuracy * (totalSessions - 1) + this.currentSession.stats.accuracy) / totalSessions
      )

      // Update bests
      if (this.currentSession.stats.wpm > this.userProgress.bestWPM) {
        this.userProgress.bestWPM = this.currentSession.stats.wpm
      }
      if (this.currentSession.stats.accuracy > this.userProgress.bestAccuracy) {
        this.userProgress.bestAccuracy = this.currentSession.stats.accuracy
      }

      // Add to improvement trend
      const today = new Date().toISOString().split('T')[0]
      const existingEntry = this.userProgress.improvementTrend.find(entry => entry.date === today)
      
      if (existingEntry) {
        // Update today's entry with latest session
        existingEntry.wpm = Math.max(existingEntry.wpm, this.currentSession.stats.wpm)
        existingEntry.accuracy = Math.max(existingEntry.accuracy, this.currentSession.stats.accuracy)
      } else {
        // Add new entry for today
        this.userProgress.improvementTrend.push({
          date: today,
          wpm: this.currentSession.stats.wpm,
          accuracy: this.currentSession.stats.accuracy
        })
      }

      // Keep only last 30 days of history
      if (this.userProgress.improvementTrend.length > 30) {
        this.userProgress.improvementTrend = this.userProgress.improvementTrend.slice(-30)
      }

      // Check for achievements
      await this.checkAchievements()

      // Save updated progress
      await this.persistenceManager.saveProgress(this.userProgress)
    },

    async checkAchievements() {
      if (!this.currentSession || !this.userProgress) return

      const achievements = [
        {
          id: 'first_session',
          name: 'Getting Started',
          description: 'Complete your first typing session',
          condition: () => this.userProgress.totalSessions === 1
        },
        {
          id: 'speed_demon_50',
          name: 'Speed Demon',
          description: 'Achieve 50 WPM',
          condition: () => this.currentSession.stats.wpm >= 50
        },
        {
          id: 'accuracy_master',
          name: 'Accuracy Master',
          description: 'Achieve 95% accuracy',
          condition: () => this.currentSession.stats.accuracy >= 95
        },
        {
          id: 'consistent_typist',
          name: 'Consistent Typist',
          description: 'Complete 10 sessions',
          condition: () => this.userProgress.totalSessions >= 10
        },
        {
          id: 'speed_demon_100',
          name: 'Century Club',
          description: 'Achieve 100 WPM',
          condition: () => this.currentSession.stats.wpm >= 100
        }
      ]

      for (const achievement of achievements) {
        const alreadyUnlocked = this.userProgress.achievements.some(a => a.id === achievement.id)
        
        if (!alreadyUnlocked && achievement.condition()) {
          this.userProgress.achievements.push({
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            unlockedAt: Date.now()
          })
          
          // Show achievement notification
          this.$emit('achievement-unlocked', achievement)
        }
      }
    },

    async saveSessionProgress() {
      // Auto-save session progress periodically
      if (this.currentSession) {
        await this.persistenceManager.saveSession(this.currentSession)
      }
    },

    async loadSession(sessionId) {
      const session = await this.persistenceManager.getSession(sessionId)
      if (session) {
        this.$emit('session-loaded', session)
      }
    },

    async loadPreviousSession() {
      if (this.recentSessions.length > 0) {
        const previousSession = this.recentSessions[0]
        this.$emit('session-loaded', previousSession)
      }
    },

    async exportProgress() {
      const data = {
        userProgress: this.userProgress,
        recentSessions: this.recentSessions,
        exportDate: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `typing-progress-${Date.now()}.json`
      link.click()
      
      URL.revokeObjectURL(url)
    },

    async clearAllProgress() {
      if (confirm('Are you sure you want to clear all progress? This cannot be undone.')) {
        await this.persistenceManager.clearAllData()
        this.currentSession = null
        this.userProgress = this.createInitialProgress()
        this.recentSessions = []
        this.progressHistory = []
        localStorage.removeItem('active_session_id')
      }
    },

    startProgressTracking() {
      this.updateInterval = setInterval(() => {
        if (this.currentSession && !this.currentSession.endTime) {
          this.sessionDuration = Date.now() - this.currentSession.startTime
          this.sessionProgress = (this.currentSession.typedText.length / this.currentSession.targetText.length) * 100
          
          // Auto-save every 30 seconds
          if (Date.now() % 30000 < 1000) {
            this.saveSessionProgress()
          }
        }
      }, 1000)
    },

    stopProgressTracking() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval)
      }
    },

    /**
     * Format duration in milliseconds to MM:SS
     * @param {number} ms - Duration in milliseconds
     * @returns {string}
     */
    formatDuration(ms) {
      const seconds = Math.floor(ms / 1000)
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    },

    /**
     * Format timestamp to date string
     * @param {number} timestamp - Timestamp to format
     * @returns {string}
     */
    formatDate(timestamp) {
      return new Date(timestamp).toLocaleDateString()
    }
  }
}

describe('Session Persistence and Progress Tracking', () => {
  /** @type {import('@vue/test-utils').VueWrapper} */
  let wrapper
  /** @type {SessionPersistenceManager} */
  let persistenceManager

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.store.clear()
    persistenceManager = new SessionPersistenceManager()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('SessionPersistenceManager', () => {
    describe('LocalStorage Implementation', () => {
      it('should save and retrieve sessions from localStorage', async () => {
        /** @type {TypingSession} */
        const testSession = {
          id: 'test-123',
          startTime: Date.now(),
          endTime: Date.now() + 60000,
          targetText: 'Hello World',
          typedText: 'Hello World',
          stats: { wpm: 60, accuracy: 100, consistency: 95, errorCount: 0, correctionCount: 0 },
          keystrokes: [],
          metadata: {
            userAgent: 'test',
            screenResolution: '1920x1080',
            language: 'en'
          }
        }

        await persistenceManager.saveSession(testSession)
        const retrieved = await persistenceManager.getSession('test-123')

        expect(retrieved).toEqual(testSession)
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'session_test-123',
          JSON.stringify(testSession)
        )
      })

      it('should return null for non-existent sessions', async () => {
        const result = await persistenceManager.getSession('non-existent')
        expect(result).toBeNull()
      })

      it('should save and retrieve user progress', async () => {
        /** @type {UserProgress} */
        const testProgress = {
          userId: 'user-123',
          totalSessions: 5,
          totalTimeTyping: 3600,
          averageWPM: 45,
          averageAccuracy: 92,
          bestWPM: 60,
          bestAccuracy: 98,
          improvementTrend: [
            { date: '2023-01-01', wpm: 40, accuracy: 90 },
            { date: '2023-01-02', wpm: 45, accuracy: 92 }
          ],
          achievements: [],
          preferences: {
            theme: 'dark',
            difficulty: 'hard',
            soundEnabled: false,
            realTimeFeedback: true
          }
        }

        await persistenceManager.saveProgress(testProgress)
        const retrieved = await persistenceManager.getProgress()

        expect(retrieved).toEqual(testProgress)
      })

      it('should retrieve all sessions', async () => {
        /** @type {TypingSession[]} */
        const sessions = [
          { id: 'session-1', startTime: Date.now() },
          { id: 'session-2', startTime: Date.now() + 1000 }
        ]

        for (const session of sessions) {
          await persistenceManager.saveSession(session)
        }

        const retrieved = await persistenceManager.getAllSessions()
        expect(retrieved).toHaveLength(2)
        expect(retrieved.map(s => s.id)).toContain('session-1')
        expect(retrieved.map(s => s.id)).toContain('session-2')
      })

      it('should delete sessions', async () => {
        /** @type {TypingSession} */
        const testSession = {
          id: 'delete-me',
          startTime: Date.now(),
          targetText: 'Test',
          typedText: 'Test',
          stats: { wpm: 0, accuracy: 0, consistency: 0, errorCount: 0, correctionCount: 0 },
          keystrokes: [],
          metadata: { userAgent: '', screenResolution: '', language: '' }
        }

        await persistenceManager.saveSession(testSession)
        expect(await persistenceManager.getSession('delete-me')).not.toBeNull()

        await persistenceManager.deleteSession('delete-me')
        expect(await persistenceManager.getSession('delete-me')).toBeNull()
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('session_delete-me')
      })

      it('should clear all data', async () => {
        await persistenceManager.saveSession({ 
          id: 'test', startTime: Date.now(), targetText: '', typedText: '', 
          stats: { wpm: 0, accuracy: 0, consistency: 0, errorCount: 0, correctionCount: 0 },
          keystrokes: [], metadata: { userAgent: '', screenResolution: '', language: '' }
        })
        
        await persistenceManager.clearAllData()
        expect(mockLocalStorage.clear).toHaveBeenCalled()
      })
    })

    describe('Error Handling', () => {
      it('should handle localStorage errors gracefully', async () => {
        mockLocalStorage.setItem.mockImplementation(() => {
          throw new Error('Storage quota exceeded')
        })

        /** @type {TypingSession} */
        const testSession = {
          id: 'error-test',
          startTime: Date.now(),
          targetText: 'Test',
          typedText: 'Test',
          stats: { wpm: 0, accuracy: 0, consistency: 0, errorCount: 0, correctionCount: 0 },
          keystrokes: [],
          metadata: { userAgent: '', screenResolution: '', language: '' }
        }

        expect(async () => {
          await persistenceManager.saveSession(testSession)
        }).not.toThrow()
      })

      it('should handle corrupted localStorage data', async () => {
        mockLocalStorage.getItem.mockReturnValue('invalid-json{')

        const result = await persistenceManager.getSession('corrupted')
        expect(result).toBeNull()
      })
    })
  })

  describe('Progress Tracking Component', () => {
    beforeEach(async () => {
      wrapper = mount(ProgressTrackingComponent)
      await nextTick()
    })

    describe('Session Management', () => {
      it('should initialize with empty progress', async () => {
        expect(wrapper.vm.userProgress).toBeTruthy()
        expect(wrapper.vm.userProgress.totalSessions).toBe(0)
        expect(wrapper.vm.userProgress.userId).toBeTruthy()
      })

      it('should start a new session', async () => {
        wrapper.vm.startNewSession('Test typing text')

        expect(wrapper.vm.currentSession).toBeTruthy()
        expect(wrapper.vm.currentSession.id).toBeTruthy()
        expect(wrapper.vm.currentSession.targetText).toBe('Test typing text')
        expect(wrapper.vm.currentSession.startTime).toBeGreaterThan(0)
      })

      it('should save current session', async () => {
        wrapper.vm.startNewSession('Test text')
        wrapper.vm.currentSession.stats.wpm = 45
        wrapper.vm.currentSession.stats.accuracy = 92

        await wrapper.vm.saveCurrentSession()

        expect(wrapper.vm.currentSession.endTime).toBeTruthy()
        expect(wrapper.vm.userProgress.totalSessions).toBe(1)
        expect(wrapper.vm.recentSessions).toHaveLength(1)
      })

      it('should resume active session on load', async () => {
        const sessionId = 'test-active-session'
        /** @type {TypingSession} */
        const activeSession = {
          id: sessionId,
          startTime: Date.now() - 30000, // 30 seconds ago
          targetText: 'Resume this session',
          typedText: 'Resume this',
          stats: { wpm: 40, accuracy: 95, consistency: 88, errorCount: 1, correctionCount: 0 },
          keystrokes: [],
          metadata: { userAgent: '', screenResolution: '', language: '' }
        }

        await wrapper.vm.persistenceManager.saveSession(activeSession)
        mockLocalStorage.store.set('active_session_id', sessionId)

        await wrapper.vm.restoreCurrentSession()

        expect(wrapper.vm.currentSession).toBeTruthy()
        expect(wrapper.vm.currentSession.id).toBe(sessionId)
      })
    })

    describe('Progress Calculation', () => {
      it('should update user progress after session', async () => {
        wrapper.vm.startNewSession('Test text for progress')
        wrapper.vm.currentSession.stats = { wpm: 50, accuracy: 94, consistency: 85, errorCount: 2, correctionCount: 1 }

        await wrapper.vm.saveCurrentSession()

        expect(wrapper.vm.userProgress.totalSessions).toBe(1)
        expect(wrapper.vm.userProgress.averageWPM).toBe(50)
        expect(wrapper.vm.userProgress.averageAccuracy).toBe(94)
        expect(wrapper.vm.userProgress.bestWPM).toBe(50)
        expect(wrapper.vm.userProgress.bestAccuracy).toBe(94)
      })

      it('should calculate correct averages over multiple sessions', async () => {
        // Session 1: 40 WPM, 90% accuracy
        wrapper.vm.startNewSession('First session')
        wrapper.vm.currentSession.stats = { wpm: 40, accuracy: 90, consistency: 80, errorCount: 3, correctionCount: 1 }
        await wrapper.vm.saveCurrentSession()

        // Session 2: 60 WPM, 95% accuracy
        wrapper.vm.startNewSession('Second session')
        wrapper.vm.currentSession.stats = { wpm: 60, accuracy: 95, consistency: 90, errorCount: 1, correctionCount: 0 }
        await wrapper.vm.saveCurrentSession()

        // Average should be (40+60)/2 = 50 WPM, (90+95)/2 = 92.5% accuracy
        expect(wrapper.vm.userProgress.totalSessions).toBe(2)
        expect(wrapper.vm.userProgress.averageWPM).toBe(50)
        expect(wrapper.vm.userProgress.averageAccuracy).toBe(92.5)
        expect(wrapper.vm.userProgress.bestWPM).toBe(60)
        expect(wrapper.vm.userProgress.bestAccuracy).toBe(95)
      })

      it('should update improvement trend', async () => {
        wrapper.vm.startNewSession('Trend test')
        wrapper.vm.currentSession.stats = { wpm: 45, accuracy: 88, consistency: 92, errorCount: 2, correctionCount: 1 }
        
        await wrapper.vm.saveCurrentSession()

        const today = new Date().toISOString().split('T')[0]
        expect(wrapper.vm.userProgress.improvementTrend).toHaveLength(1)
        expect(wrapper.vm.userProgress.improvementTrend[0].date).toBe(today)
        expect(wrapper.vm.userProgress.improvementTrend[0].wpm).toBe(45)
        expect(wrapper.vm.userProgress.improvementTrend[0].accuracy).toBe(88)
      })
    })

    describe('Achievement System', () => {
      it('should unlock first session achievement', async () => {
        wrapper.vm.startNewSession('First achievement test')
        wrapper.vm.currentSession.stats = { wpm: 30, accuracy: 85, consistency: 75, errorCount: 5, correctionCount: 2 }
        
        await wrapper.vm.saveCurrentSession()

        const firstSessionAchievement = wrapper.vm.userProgress.achievements.find(
          (a) => a.id === 'first_session'
        )
        expect(firstSessionAchievement).toBeTruthy()
        expect(firstSessionAchievement.name).toBe('Getting Started')
      })

      it('should unlock speed achievements', async () => {
        wrapper.vm.startNewSession('Speed test')
        wrapper.vm.currentSession.stats = { wpm: 55, accuracy: 92, consistency: 88, errorCount: 3, correctionCount: 1 }
        
        await wrapper.vm.saveCurrentSession()

        const speedAchievement = wrapper.vm.userProgress.achievements.find(
          (a) => a.id === 'speed_demon_50'
        )
        expect(speedAchievement).toBeTruthy()
        expect(speedAchievement.name).toBe('Speed Demon')
      })

      it('should unlock accuracy achievements', async () => {
        wrapper.vm.startNewSession('Accuracy test')
        wrapper.vm.currentSession.stats = { wpm: 45, accuracy: 96, consistency: 85, errorCount: 1, correctionCount: 0 }
        
        await wrapper.vm.saveCurrentSession()

        const accuracyAchievement = wrapper.vm.userProgress.achievements.find(
          (a) => a.id === 'accuracy_master'
        )
        expect(accuracyAchievement).toBeTruthy()
        expect(accuracyAchievement.name).toBe('Accuracy Master')
      })

      it('should not unlock same achievement twice', async () => {
        // First session with 50+ WPM
        wrapper.vm.startNewSession('First speed test')
        wrapper.vm.currentSession.stats = { wpm: 55, accuracy: 90, consistency: 80, errorCount: 2, correctionCount: 1 }
        await wrapper.vm.saveCurrentSession()

        // Second session with 50+ WPM
        wrapper.vm.startNewSession('Second speed test')
        wrapper.vm.currentSession.stats = { wpm: 60, accuracy: 92, consistency: 85, errorCount: 1, correctionCount: 0 }
        await wrapper.vm.saveCurrentSession()

        const speedAchievements = wrapper.vm.userProgress.achievements.filter(
          (a) => a.id === 'speed_demon_50'
        )
        expect(speedAchievements).toHaveLength(1)
      })
    })

    describe('Data Export and Import', () => {
      it('should export progress data', async () => {
        // Set up some progress data
        wrapper.vm.startNewSession('Export test')
        wrapper.vm.currentSession.stats = { wpm: 50, accuracy: 90, consistency: 85, errorCount: 2, correctionCount: 1 }
        await wrapper.vm.saveCurrentSession()

        // Mock URL and link creation
        const mockBlob = new Blob(['test'])
        const mockURL = 'blob:test-url'
        
        global.URL = {
          createObjectURL: vi.fn(() => mockURL),
          revokeObjectURL: vi.fn()
        }

        global.Blob = vi.fn(() => mockBlob)

        const mockLink = {
          href: '',
          download: '',
          click: vi.fn()
        }
        document.createElement = vi.fn(() => mockLink)

        wrapper.vm.exportProgress()

        expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob)
        expect(mockLink.click).toHaveBeenCalled()
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockURL)
      })

      it('should clear all progress when confirmed', async () => {
        // Set up some data
        wrapper.vm.startNewSession('Clear test')
        await wrapper.vm.saveCurrentSession()

        // Mock window.confirm
        global.confirm = vi.fn(() => true)

        await wrapper.vm.clearAllProgress()

        expect(wrapper.vm.currentSession).toBeNull()
        expect(wrapper.vm.userProgress.totalSessions).toBe(0)
        expect(wrapper.vm.recentSessions).toHaveLength(0)
        expect(mockLocalStorage.clear).toHaveBeenCalled()
      })

      it('should not clear progress when cancelled', async () => {
        // Set up some data
        wrapper.vm.startNewSession('Clear test')
        await wrapper.vm.saveCurrentSession()

        const originalSessionCount = wrapper.vm.userProgress.totalSessions

        // Mock window.confirm to return false
        global.confirm = vi.fn(() => false)

        await wrapper.vm.clearAllProgress()

        expect(wrapper.vm.userProgress.totalSessions).toBe(originalSessionCount)
      })
    })

    describe('Auto-save Functionality', () => {
      it('should auto-save session progress periodically', async () => {
        vi.useFakeTimers()
        
        wrapper.vm.startNewSession('Auto-save test')
        const saveSessionProgressSpy = vi.spyOn(wrapper.vm, 'saveSessionProgress')

        // Fast-forward 30 seconds
        vi.advanceTimersByTime(30000)

        expect(saveSessionProgressSpy).toHaveBeenCalled()
        
        vi.useRealTimers()
      })

      it('should save active session ID to localStorage', async () => {
        wrapper.vm.startNewSession('Active session test')

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'active_session_id',
          wrapper.vm.currentSession.id
        )
      })

      it('should remove active session ID when session ends', async () => {
        wrapper.vm.startNewSession('Complete session test')
        await wrapper.vm.saveCurrentSession()

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('active_session_id')
      })
    })

    describe('UI Interactions', () => {
      it('should display session duration and progress', async () => {
        wrapper.vm.startNewSession('Progress display test')
        wrapper.vm.currentSession.typedText = 'Progress'
        wrapper.vm.sessionDuration = 45000 // 45 seconds
        wrapper.vm.sessionProgress = 35.5

        await nextTick()

        expect(wrapper.find('.session-stats .stat .value').text()).toContain('0:45')
        expect(wrapper.findAll('.session-stats .stat .value')[1].text()).toBe('36%')
      })

      it('should enable/disable controls based on state', async () => {
        const saveButton = wrapper.find('button')
        const loadButton = wrapper.findAll('button')[1]

        // Initially disabled (no current session)
        expect(saveButton.element.disabled).toBe(true)
        expect(loadButton.element.disabled).toBe(true)

        // Start session - save should be enabled
        wrapper.vm.startNewSession('Control test')
        await nextTick()
        expect(saveButton.element.disabled).toBe(false)

        // Add previous session - load should be enabled
        wrapper.vm.recentSessions.push({
          id: 'previous',
          startTime: Date.now() - 3600000,
          endTime: Date.now() - 3500000,
          targetText: 'Previous session',
          typedText: 'Previous session',
          stats: { wpm: 40, accuracy: 88, consistency: 80, errorCount: 3, correctionCount: 1 },
          keystrokes: [],
          metadata: { userAgent: '', screenResolution: '', language: '' }
        })
        await nextTick()
        expect(loadButton.element.disabled).toBe(false)
      })
    })
  })

  describe('Performance and Memory Management', () => {
    it('should limit recent sessions in memory', async () => {
      wrapper = mount(ProgressTrackingComponent)
      await nextTick()

      // Add 15 sessions
      for (let i = 0; i < 15; i++) {
        /** @type {TypingSession} */
        const session = {
          id: `session-${i}`,
          startTime: Date.now() - (i * 3600000),
          endTime: Date.now() - (i * 3600000) + 300000,
          targetText: `Session ${i} text`,
          typedText: `Session ${i} text`,
          stats: { wpm: 40 + i, accuracy: 85 + i, consistency: 80, errorCount: i, correctionCount: 0 },
          keystrokes: [],
          metadata: { userAgent: '', screenResolution: '', language: '' }
        }
        
        wrapper.vm.currentSession = session
        await wrapper.vm.saveCurrentSession()
      }

      expect(wrapper.vm.recentSessions).toHaveLength(10) // Should be limited to 10
    })

    it('should limit improvement trend history', async () => {
      wrapper = mount(ProgressTrackingComponent)
      await nextTick()

      // Simulate 35 days of progress
      wrapper.vm.userProgress.improvementTrend = []
      for (let i = 0; i < 35; i++) {
        wrapper.vm.userProgress.improvementTrend.push({
          date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          wpm: 40 + i,
          accuracy: 85 + (i % 15)
        })
      }

      wrapper.vm.startNewSession('Trend limit test')
      wrapper.vm.currentSession.stats = { wpm: 50, accuracy: 90, consistency: 85, errorCount: 1, correctionCount: 0 }
      await wrapper.vm.updateUserProgress()

      expect(wrapper.vm.userProgress.improvementTrend.length).toBeLessThanOrEqual(30)
    })
  })
})