// Integration tests for session persistence and progress tracking
// Tests data persistence across browser sessions and progress tracking functionality

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Mock localStorage with proper implementation
const mockLocalStorage = (() => {
  const store = new Map()
  return {
    store,
    getItem: vi.fn(key => store.get(key) || null),
    setItem: vi.fn((key, value) => {
      store.set(key, String(value))
    }),
    removeItem: vi.fn(key => {
      store.delete(key)
    }),
    clear: vi.fn(() => {
      store.clear()
    }),
    get length() {
      return store.size
    },
    key: vi.fn(index => {
      const keys = Array.from(store.keys())
      return keys[index] || null
    })
  }
})()

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
        getAll: vi.fn(() => Promise.resolve([])),
        clear: vi.fn(() => Promise.resolve())
      }))
    })),
    close: vi.fn()
  }))
}

// Global mocks setup - ensure they're available everywhere
Object.defineProperty(global, 'localStorage', { 
  value: mockLocalStorage, 
  writable: true, 
  configurable: true 
})
Object.defineProperty(global, 'indexedDB', { 
  value: mockIndexedDB, 
  writable: true, 
  configurable: true 
})

// Also set on window if available
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { 
    value: mockLocalStorage, 
    writable: true, 
    configurable: true 
  })
}

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123')
  },
  writable: true,
  configurable: true
})

// Session persistence manager
class SessionPersistenceManager {
  constructor() {
    this.dbName = 'typing-tutor-db'
    this.dbVersion = 1
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

  async saveSession(session) {
    if (this.db) {
      await this.saveToIndexedDB('sessions', session)
    } else {
      this.saveToLocalStorage(`session_${session.id}`, session)
    }
  }

  async getSession(sessionId) {
    if (this.db) {
      return await this.getFromIndexedDB('sessions', sessionId)
    } else {
      return this.getFromLocalStorage(`session_${sessionId}`)
    }
  }

  async getAllSessions() {
    if (this.db) {
      return await this.getAllFromIndexedDB('sessions')
    } else {
      return this.getAllFromLocalStorage('session_')
    }
  }

  async saveProgress(progress) {
    if (this.db) {
      await this.saveToIndexedDB('progress', progress)
    } else {
      this.saveToLocalStorage('user_progress', progress)
    }
  }

  async getProgress() {
    if (this.db) {
      return await this.getFromIndexedDB('progress', 'user_progress')
    } else {
      return this.getFromLocalStorage('user_progress')
    }
  }

  async deleteSession(sessionId) {
    if (this.db) {
      const transaction = this.db.transaction(['sessions'], 'readwrite')
      const store = transaction.objectStore('sessions')
      await store.delete(sessionId)
    } else {
      localStorage.removeItem(`session_${sessionId}`)
    }
  }

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
  async saveToIndexedDB(storeName, data) {
    const transaction = this.db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    await store.put(data)
  }

  async getFromIndexedDB(storeName, key) {
    const transaction = this.db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const result = await store.get(key)
    return result?.value || null
  }

  async getAllFromIndexedDB(storeName) {
    const transaction = this.db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    return await store.getAll()
  }

  saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }

  getFromLocalStorage(key) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Failed to read from localStorage:', error)
      return null
    }
  }

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
      currentSession: null,
      userProgress: null,
      recentSessions: [],
      progressHistory: [],
      sessionDuration: 0,
      sessionProgress: 0,
      maxWPM: 100,
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
      const activeSessionId = localStorage.getItem('active_session_id')
      if (activeSessionId) {
        this.currentSession = await this.persistenceManager.getSession(activeSessionId)
        if (this.currentSession && !this.currentSession.endTime) {
          this.resumeSession(this.currentSession)
        }
      }
    },

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
      this.saveSessionProgress()
    },

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
      
      if (this.recentSessions.length > 10) {
        this.recentSessions = this.recentSessions.slice(0, 10)
      }
    },

    async updateUserProgress() {
      if (!this.currentSession || !this.userProgress) return

      const sessionDuration = (this.currentSession.endTime - this.currentSession.startTime) / 1000
      
      this.userProgress.totalSessions++
      this.userProgress.totalTimeTyping += sessionDuration

      const totalSessions = this.userProgress.totalSessions
      this.userProgress.averageWPM = (
        (this.userProgress.averageWPM * (totalSessions - 1) + this.currentSession.stats.wpm) / totalSessions
      )
      this.userProgress.averageAccuracy = (
        (this.userProgress.averageAccuracy * (totalSessions - 1) + this.currentSession.stats.accuracy) / totalSessions
      )

      if (this.currentSession.stats.wpm > this.userProgress.bestWPM) {
        this.userProgress.bestWPM = this.currentSession.stats.wpm
      }
      if (this.currentSession.stats.accuracy > this.userProgress.bestAccuracy) {
        this.userProgress.bestAccuracy = this.currentSession.stats.accuracy
      }

      const today = new Date().toISOString().split('T')[0]
      const existingEntry = this.userProgress.improvementTrend.find(entry => entry.date === today)
      
      if (existingEntry) {
        existingEntry.wpm = Math.max(existingEntry.wpm, this.currentSession.stats.wpm)
        existingEntry.accuracy = Math.max(existingEntry.accuracy, this.currentSession.stats.accuracy)
      } else {
        this.userProgress.improvementTrend.push({
          date: today,
          wpm: this.currentSession.stats.wpm,
          accuracy: this.currentSession.stats.accuracy
        })
      }

      if (this.userProgress.improvementTrend.length > 30) {
        this.userProgress.improvementTrend = this.userProgress.improvementTrend.slice(-30)
      }

      await this.checkAchievements()
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
          
          this.$emit('achievement-unlocked', achievement)
        }
      }
    },

    async saveSessionProgress() {
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

    formatDuration(ms) {
      const seconds = Math.floor(ms / 1000)
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    },

    formatDate(timestamp) {
      return new Date(timestamp).toLocaleDateString()
    }
  }
}

describe('Session Persistence and Progress Tracking', () => {
  let wrapper
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
      wrapper = mount(ProgressTrackingComponent, {
        attachTo: document.body
      })
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
        wrapper.vm.startNewSession('First session')
        wrapper.vm.currentSession.stats = { wpm: 40, accuracy: 90, consistency: 80, errorCount: 3, correctionCount: 1 }
        await wrapper.vm.saveCurrentSession()

        wrapper.vm.startNewSession('Second session')  
        wrapper.vm.currentSession.stats = { wpm: 60, accuracy: 95, consistency: 90, errorCount: 1, correctionCount: 0 }
        await wrapper.vm.saveCurrentSession()

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
        wrapper.vm.startNewSession('First speed test')
        wrapper.vm.currentSession.stats = { wpm: 55, accuracy: 90, consistency: 80, errorCount: 2, correctionCount: 1 }
        await wrapper.vm.saveCurrentSession()

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
        wrapper.vm.startNewSession('Export test')
        wrapper.vm.currentSession.stats = { wpm: 50, accuracy: 90, consistency: 85, errorCount: 2, correctionCount: 1 }
        await wrapper.vm.saveCurrentSession()

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
        wrapper.vm.startNewSession('Clear test')
        await wrapper.vm.saveCurrentSession()

        global.confirm = vi.fn(() => true)

        await wrapper.vm.clearAllProgress()

        expect(wrapper.vm.currentSession).toBeNull()
        expect(wrapper.vm.userProgress.totalSessions).toBe(0)
        expect(wrapper.vm.recentSessions).toHaveLength(0)
        expect(mockLocalStorage.clear).toHaveBeenCalled()
      })

      it('should not clear progress when cancelled', async () => {
        wrapper.vm.startNewSession('Clear test')
        await wrapper.vm.saveCurrentSession()

        const originalSessionCount = wrapper.vm.userProgress.totalSessions

        global.confirm = vi.fn(() => false)

        await wrapper.vm.clearAllProgress()

        expect(wrapper.vm.userProgress.totalSessions).toBe(originalSessionCount)
      })
    })

    describe('Auto-save Functionality', () => {
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
  })

  describe('Performance and Memory Management', () => {
    it('should limit recent sessions in memory', async () => {
      wrapper = mount(ProgressTrackingComponent, {
        attachTo: document.body
      })
      await nextTick()

      for (let i = 0; i < 15; i++) {
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

      expect(wrapper.vm.recentSessions).toHaveLength(10)
    })

    it('should limit improvement trend history', async () => {
      wrapper = mount(ProgressTrackingComponent, {
        attachTo: document.body
      })
      await nextTick()

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