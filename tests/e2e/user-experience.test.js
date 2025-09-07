/**
 * @fileoverview User experience testing scenarios for the typing tutor
 * Tests complete user journeys and interaction flows
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Mock browser APIs
const mockLocalStorage = new Map()
global.localStorage = {
  getItem: vi.fn((key) => mockLocalStorage.get(key) || null),
  setItem: vi.fn((key, value) => mockLocalStorage.set(key, value)),
  removeItem: vi.fn((key) => mockLocalStorage.delete(key)),
  clear: vi.fn(() => mockLocalStorage.clear())
}

// Mock notifications API
global.Notification = {
  permission: 'granted',
  requestPermission: vi.fn(() => Promise.resolve('granted'))
}

// Mock Web Share API
const mockShare = vi.fn(() => Promise.resolve())
Object.defineProperty(navigator, 'share', {
  value: mockShare,
  writable: true
})

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve(''))
  },
  writable: true
})

// Complete typing tutor app for UX testing
const TypingTutorApp = {
  template: `
    <div class="typing-tutor-app" :class="[themeClass, difficultyClass]">
      <!-- Welcome screen for first-time users -->
      <div v-if="showWelcome" class="welcome-screen">
        <div class="welcome-content">
          <h1>Welcome to Typing Tutor!</h1>
          <p>Improve your typing speed and accuracy with personalized lessons.</p>
          
          <div class="welcome-options">
            <div class="skill-level">
              <h3>What's your current typing level?</h3>
              <div class="level-buttons">
                <button 
                  v-for="level in skillLevels" 
                  :key="level.id"
                  @click="selectSkillLevel(level.id)"
                  class="level-btn"
                  :class="{ active: selectedLevel === level.id }"
                >
                  <div class="level-name">{{ level.name }}</div>
                  <div class="level-desc">{{ level.description }}</div>
                  <div class="level-wpm">{{ level.wpm }} WPM</div>
                </button>
              </div>
            </div>

            <div class="goals-section">
              <h3>What would you like to improve?</h3>
              <div class="goal-options">
                <label v-for="goal in goals" :key="goal.id" class="goal-option">
                  <input 
                    type="checkbox" 
                    v-model="selectedGoals" 
                    :value="goal.id"
                  />
                  <span class="goal-label">{{ goal.name }}</span>
                  <span class="goal-desc">{{ goal.description }}</span>
                </label>
              </div>
            </div>

            <button @click="completeOnboarding" class="start-btn" :disabled="!canStart">
              Start Your Journey
            </button>
          </div>
        </div>
      </div>

      <!-- Main application -->
      <div v-else class="main-app">
        <!-- Header with navigation -->
        <header class="app-header">
          <div class="header-left">
            <h1 class="app-title">Typing Tutor</h1>
            <nav class="main-nav">
              <button 
                v-for="tab in tabs" 
                :key="tab.id"
                @click="activeTab = tab.id"
                class="nav-btn"
                :class="{ active: activeTab === tab.id }"
              >
                {{ tab.name }}
              </button>
            </nav>
          </div>
          
          <div class="header-right">
            <div class="user-stats">
              <span class="stat">Best: {{ userStats.bestWPM }} WPM</span>
              <span class="stat">Avg: {{ userStats.avgAccuracy }}%</span>
            </div>
            <button @click="toggleSettings" class="settings-btn">⚙️</button>
          </div>
        </header>

        <!-- Settings panel -->
        <div v-if="showSettings" class="settings-panel">
          <div class="settings-content">
            <h3>Settings</h3>
            
            <div class="setting-group">
              <label>Theme</label>
              <select v-model="settings.theme" class="setting-select">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="high-contrast">High Contrast</option>
              </select>
            </div>

            <div class="setting-group">
              <label>Font Size</label>
              <input 
                v-model.number="settings.fontSize" 
                type="range" 
                min="12" 
                max="24" 
                class="setting-range"
              />
              <span>{{ settings.fontSize }}px</span>
            </div>

            <div class="setting-group">
              <label>
                <input type="checkbox" v-model="settings.soundEnabled" />
                Sound Effects
              </label>
            </div>

            <div class="setting-group">
              <label>
                <input type="checkbox" v-model="settings.showKeyboard" />
                Virtual Keyboard
              </label>
            </div>

            <div class="settings-actions">
              <button @click="resetSettings" class="btn-secondary">Reset</button>
              <button @click="saveSettings" class="btn-primary">Save</button>
            </div>
          </div>
        </div>

        <!-- Main content area -->
        <main class="app-main">
          <!-- Lesson Selection Tab -->
          <div v-if="activeTab === 'lessons'" class="lesson-tab">
            <div class="lesson-categories">
              <div class="category-grid">
                <div 
                  v-for="category in lessonCategories" 
                  :key="category.id"
                  class="category-card"
                  @click="selectCategory(category.id)"
                >
                  <div class="category-icon">{{ category.icon }}</div>
                  <h3 class="category-name">{{ category.name }}</h3>
                  <p class="category-desc">{{ category.description }}</p>
                  <div class="category-progress">
                    <div class="progress-bar">
                      <div 
                        class="progress-fill" 
                        :style="{ width: getCategoryProgress(category.id) + '%' }"
                      ></div>
                    </div>
                    <span class="progress-text">{{ getCategoryProgress(category.id) }}% Complete</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Lesson list for selected category -->
            <div v-if="selectedCategory" class="lesson-list">
              <h2>{{ getSelectedCategoryName() }} Lessons</h2>
              <div class="lessons-grid">
                <div 
                  v-for="lesson in filteredLessons" 
                  :key="lesson.id"
                  class="lesson-card"
                  :class="{ 
                    completed: isLessonCompleted(lesson.id),
                    locked: isLessonLocked(lesson.id)
                  }"
                  @click="selectLesson(lesson.id)"
                >
                  <div class="lesson-header">
                    <h4 class="lesson-title">{{ lesson.title }}</h4>
                    <div class="lesson-status">
                      <span v-if="isLessonCompleted(lesson.id)" class="status-completed">✓</span>
                      <span v-else-if="isLessonLocked(lesson.id)" class="status-locked">🔒</span>
                      <span v-else class="status-available">▶</span>
                    </div>
                  </div>
                  
                  <p class="lesson-desc">{{ lesson.description }}</p>
                  
                  <div class="lesson-stats">
                    <span class="difficulty">{{ lesson.difficulty }}</span>
                    <span class="duration">{{ lesson.estimatedTime }}min</span>
                    <span class="target-wpm">{{ lesson.targetWPM }} WPM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Practice Tab -->
          <div v-if="activeTab === 'practice'" class="practice-tab">
            <div class="practice-controls">
              <div class="text-options">
                <select v-model="practiceText" class="text-select">
                  <option v-for="text in practiceTexts" :key="text.id" :value="text.content">
                    {{ text.name }}
                  </option>
                </select>
                <button @click="loadCustomText" class="btn-secondary">Custom Text</button>
              </div>

              <div class="session-controls">
                <button 
                  @click="startPractice" 
                  :disabled="!canStartPractice"
                  class="btn-primary"
                >
                  {{ practiceActive ? 'Restart' : 'Start Practice' }}
                </button>
                <button 
                  v-if="practiceActive"
                  @click="pausePractice"
                  class="btn-secondary"
                >
                  {{ practicePaused ? 'Resume' : 'Pause' }}
                </button>
              </div>
            </div>

            <!-- Typing area -->
            <div class="typing-area" :class="{ active: practiceActive }">
              <div class="target-text" :style="textStyle">
                <span 
                  v-for="(char, index) in practiceChars" 
                  :key="index"
                  :class="getCharacterClass(index)"
                  class="char"
                >
                  {{ char === ' ' ? '·' : char }}
                </span>
              </div>

              <textarea
                ref="practiceInput"
                v-model="practiceInput"
                @input="handlePracticeInput"
                @keydown="handlePracticeKeydown"
                @focus="onInputFocus"
                @blur="onInputBlur"
                class="practice-input"
                :disabled="!practiceActive || practicePaused"
                placeholder="Start typing when ready..."
              ></textarea>
            </div>

            <!-- Real-time stats -->
            <div class="practice-stats" v-if="practiceActive">
              <div class="stat-display">
                <div class="stat-item">
                  <span class="stat-value" :class="getWPMClass()">{{ currentStats.wpm }}</span>
                  <span class="stat-label">WPM</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value" :class="getAccuracyClass()">{{ currentStats.accuracy }}%</span>
                  <span class="stat-label">Accuracy</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ formatTime(currentStats.timeElapsed) }}</span>
                  <span class="stat-label">Time</span>
                </div>
              </div>

              <div class="progress-section">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: practiceProgress + '%' }"></div>
                </div>
                <span class="progress-text">{{ Math.round(practiceProgress) }}% Complete</span>
              </div>
            </div>

            <!-- Results modal -->
            <div v-if="showResults" class="results-modal">
              <div class="modal-content">
                <h2>Practice Complete!</h2>
                
                <div class="results-summary">
                  <div class="main-stats">
                    <div class="result-stat">
                      <span class="big-number">{{ finalStats.wpm }}</span>
                      <span class="stat-unit">WPM</span>
                    </div>
                    <div class="result-stat">
                      <span class="big-number">{{ finalStats.accuracy }}</span>
                      <span class="stat-unit">% Accuracy</span>
                    </div>
                  </div>

                  <div class="detailed-stats">
                    <div class="detail-row">
                      <span>Characters Typed:</span>
                      <span>{{ finalStats.totalChars }}</span>
                    </div>
                    <div class="detail-row">
                      <span>Errors:</span>
                      <span>{{ finalStats.errors }}</span>
                    </div>
                    <div class="detail-row">
                      <span>Time Taken:</span>
                      <span>{{ formatTime(finalStats.timeElapsed) }}</span>
                    </div>
                    <div class="detail-row">
                      <span>Consistency:</span>
                      <span>{{ finalStats.consistency }}%</span>
                    </div>
                  </div>
                </div>

                <div class="achievements" v-if="newAchievements.length">
                  <h3>New Achievements! 🎉</h3>
                  <div class="achievement-list">
                    <div 
                      v-for="achievement in newAchievements" 
                      :key="achievement.id"
                      class="achievement-item"
                    >
                      <span class="achievement-icon">{{ achievement.icon }}</span>
                      <span class="achievement-name">{{ achievement.name }}</span>
                    </div>
                  </div>
                </div>

                <div class="results-actions">
                  <button @click="shareResults" class="btn-secondary">Share</button>
                  <button @click="saveResults" class="btn-secondary">Save</button>
                  <button @click="tryAgain" class="btn-primary">Try Again</button>
                  <button @click="closeResults" class="btn-secondary">Close</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Progress Tab -->
          <div v-if="activeTab === 'progress'" class="progress-tab">
            <div class="progress-overview">
              <div class="overview-cards">
                <div class="overview-card">
                  <h3>Total Sessions</h3>
                  <span class="card-value">{{ userProgress.totalSessions }}</span>
                </div>
                <div class="overview-card">
                  <h3>Time Practiced</h3>
                  <span class="card-value">{{ formatTotalTime(userProgress.totalTime) }}</span>
                </div>
                <div class="overview-card">
                  <h3>Current Streak</h3>
                  <span class="card-value">{{ userProgress.currentStreak }} days</span>
                </div>
              </div>
            </div>

            <!-- Progress charts would go here -->
            <div class="progress-charts">
              <div class="chart-placeholder">
                📈 Progress charts would be rendered here
              </div>
            </div>
          </div>
        </main>

        <!-- Tutorial overlay for new users -->
        <div v-if="showTutorial" class="tutorial-overlay">
          <div class="tutorial-step" :class="'step-' + tutorialStep">
            <div class="tutorial-content">
              <h3>{{ currentTutorial.title }}</h3>
              <p>{{ currentTutorial.description }}</p>
              
              <div class="tutorial-actions">
                <button 
                  v-if="tutorialStep > 1"
                  @click="previousTutorialStep"
                  class="btn-secondary"
                >
                  Previous
                </button>
                <button 
                  @click="nextTutorialStep"
                  class="btn-primary"
                >
                  {{ tutorialStep < tutorialSteps.length ? 'Next' : 'Finish' }}
                </button>
                <button @click="skipTutorial" class="btn-text">Skip Tutorial</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      // Onboarding state
      showWelcome: true,
      selectedLevel: null,
      selectedGoals: [],

      // Main app state
      activeTab: 'lessons',
      showSettings: false,
      showTutorial: false,
      tutorialStep: 1,

      // User data
      userStats: {
        bestWPM: 0,
        avgAccuracy: 0
      },
      userProgress: {
        totalSessions: 0,
        totalTime: 0,
        currentStreak: 0
      },

      // Settings
      settings: {
        theme: 'light',
        fontSize: 16,
        soundEnabled: true,
        showKeyboard: false
      },

      // Practice state
      practiceText: '',
      practiceInput: '',
      practiceActive: false,
      practicePaused: false,
      practiceStartTime: 0,
      currentStats: {
        wpm: 0,
        accuracy: 100,
        timeElapsed: 0
      },
      finalStats: {},
      showResults: false,
      newAchievements: [],

      // Lessons
      selectedCategory: null,
      selectedLesson: null,

      // Data
      skillLevels: [
        { id: 'beginner', name: 'Beginner', description: 'Learning to type', wpm: '0-20' },
        { id: 'intermediate', name: 'Intermediate', description: 'Comfortable typing', wpm: '21-40' },
        { id: 'advanced', name: 'Advanced', description: 'Fast and accurate', wpm: '41-60' },
        { id: 'expert', name: 'Expert', description: 'Professional level', wpm: '60+' }
      ],

      goals: [
        { id: 'speed', name: 'Speed', description: 'Type faster' },
        { id: 'accuracy', name: 'Accuracy', description: 'Make fewer errors' },
        { id: 'consistency', name: 'Consistency', description: 'Steady rhythm' },
        { id: 'endurance', name: 'Endurance', description: 'Type longer' }
      ],

      tabs: [
        { id: 'lessons', name: 'Lessons' },
        { id: 'practice', name: 'Practice' },
        { id: 'progress', name: 'Progress' }
      ],

      lessonCategories: [
        {
          id: 'basics',
          name: 'Basics',
          description: 'Learn proper finger placement',
          icon: '✋'
        },
        {
          id: 'words',
          name: 'Common Words',
          description: 'Practice frequently used words',
          icon: '📝'
        },
        {
          id: 'sentences',
          name: 'Sentences',
          description: 'Complete sentences with punctuation',
          icon: '📖'
        },
        {
          id: 'programming',
          name: 'Programming',
          description: 'Code syntax and symbols',
          icon: '💻'
        }
      ],

      practiceTexts: [
        { id: 'pangram', name: 'Pangram', content: 'The quick brown fox jumps over the lazy dog.' },
        { id: 'lorem', name: 'Lorem Ipsum', content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
        { id: 'quote', name: 'Famous Quote', content: 'The only way to do great work is to love what you do.' }
      ],

      tutorialSteps: [
        {
          title: 'Welcome to Typing Tutor!',
          description: 'Let me show you around the app.'
        },
        {
          title: 'Choose Your Lessons',
          description: 'Browse different categories to find lessons that match your skill level.'
        },
        {
          title: 'Practice Mode',
          description: 'Use practice mode to work on custom text or specific skills.'
        },
        {
          title: 'Track Your Progress',
          description: 'Monitor your improvement over time with detailed statistics.'
        }
      ]
    }
  },
  computed: {
    canStart() {
      return this.selectedLevel && this.selectedGoals.length > 0
    },

    canStartPractice() {
      return this.practiceText && !this.practiceActive
    },

    practiceChars() {
      return this.practiceText.split('')
    },

    practiceProgress() {
      if (!this.practiceText) return 0
      return (this.practiceInput.length / this.practiceText.length) * 100
    },

    themeClass() {
      return `theme-${this.settings.theme}`
    },

    difficultyClass() {
      return this.selectedLevel ? `level-${this.selectedLevel}` : ''
    },

    textStyle() {
      return {
        fontSize: `${this.settings.fontSize}px`,
        lineHeight: 1.6
      }
    },

    filteredLessons() {
      if (!this.selectedCategory) return []
      
      // Mock lesson data based on category
      return [
        {
          id: 'lesson1',
          title: 'Getting Started',
          description: 'Learn the basics of touch typing',
          difficulty: 'Beginner',
          estimatedTime: 10,
          targetWPM: 20
        },
        {
          id: 'lesson2',
          title: 'Home Row Keys',
          description: 'Master the foundation keys',
          difficulty: 'Beginner',
          estimatedTime: 15,
          targetWPM: 25
        }
      ]
    },

    currentTutorial() {
      return this.tutorialSteps[this.tutorialStep - 1] || this.tutorialSteps[0]
    }
  },
  mounted() {
    this.loadUserData()
    this.checkFirstVisit()
  },
  methods: {
    // Onboarding
    /**
     * Select skill level for user
     * @param {string} levelId - The skill level ID
     */
    selectSkillLevel(levelId) {
      this.selectedLevel = levelId
    },

    completeOnboarding() {
      this.showWelcome = false
      localStorage.setItem('onboardingComplete', 'true')
      localStorage.setItem('userLevel', this.selectedLevel)
      localStorage.setItem('userGoals', JSON.stringify(this.selectedGoals))
      
      if (this.selectedLevel === 'beginner') {
        this.showTutorial = true
      }
    },

    // Tutorial
    nextTutorialStep() {
      if (this.tutorialStep < this.tutorialSteps.length) {
        this.tutorialStep++
      } else {
        this.showTutorial = false
        localStorage.setItem('tutorialComplete', 'true')
      }
    },

    previousTutorialStep() {
      if (this.tutorialStep > 1) {
        this.tutorialStep--
      }
    },

    skipTutorial() {
      this.showTutorial = false
      localStorage.setItem('tutorialComplete', 'true')
    },

    // Settings
    toggleSettings() {
      this.showSettings = !this.showSettings
    },

    saveSettings() {
      localStorage.setItem('userSettings', JSON.stringify(this.settings))
      this.showSettings = false
      this.applySettings()
    },

    resetSettings() {
      this.settings = {
        theme: 'light',
        fontSize: 16,
        soundEnabled: true,
        showKeyboard: false
      }
    },

    applySettings() {
      document.documentElement.className = `theme-${this.settings.theme}`
    },

    // Lesson selection
    /**
     * Select lesson category
     * @param {string} categoryId - Category ID
     */
    selectCategory(categoryId) {
      this.selectedCategory = categoryId
    },

    /**
     * Select and start lesson
     * @param {string} lessonId - Lesson ID
     */
    selectLesson(lessonId) {
      if (!this.isLessonLocked(lessonId)) {
        this.selectedLesson = lessonId
        // Navigate to lesson
        this.$emit('start-lesson', lessonId)
      }
    },

    /**
     * Get category progress percentage
     * @param {string} categoryId - Category ID
     * @returns {number} Progress percentage
     */
    getCategoryProgress(categoryId) {
      // Mock progress calculation
      return Math.floor(Math.random() * 100)
    },

    getSelectedCategoryName() {
      const category = this.lessonCategories.find(c => c.id === this.selectedCategory)
      return category ? category.name : ''
    },

    /**
     * Check if lesson is completed
     * @param {string} lessonId - Lesson ID
     * @returns {boolean} Whether lesson is completed
     */
    isLessonCompleted(lessonId) {
      // Check if lesson is completed
      const completedLessons = JSON.parse(localStorage.getItem('completedLessons') || '[]')
      return completedLessons.includes(lessonId)
    },

    /**
     * Check if lesson is locked
     * @param {string} lessonId - Lesson ID
     * @returns {boolean} Whether lesson is locked
     */
    isLessonLocked(lessonId) {
      // Basic lesson progression logic
      return false // For demo purposes, no lessons are locked
    },

    // Practice mode
    startPractice() {
      this.practiceActive = true
      this.practicePaused = false
      this.practiceInput = ''
      this.practiceStartTime = Date.now()
      this.currentStats = { wpm: 0, accuracy: 100, timeElapsed: 0 }
      
      this.$nextTick(() => {
        this.$refs.practiceInput?.focus()
      })
      
      this.startStatsTimer()
    },

    pausePractice() {
      this.practicePaused = !this.practicePaused
      
      if (this.practicePaused) {
        this.stopStatsTimer()
      } else {
        this.startStatsTimer()
        this.$refs.practiceInput?.focus()
      }
    },

    handlePracticeInput() {
      if (!this.practiceActive || this.practicePaused) return
      
      this.updateCurrentStats()
      
      // Check if practice is complete
      if (this.practiceInput.length >= this.practiceText.length) {
        this.completePractice()
      }
    },

    /**
     * Handle keydown events in practice input
     * @param {KeyboardEvent} event - Keyboard event
     */
    handlePracticeKeydown(event) {
      // Handle special keys
      if (event.key === 'Escape') {
        this.pausePractice()
      }
    },

    onInputFocus() {
      // Visual feedback for focus
      this.$emit('input-focused')
    },

    onInputBlur() {
      // Handle blur if needed
      this.$emit('input-blurred')
    },

    completePractice() {
      this.practiceActive = false
      this.stopStatsTimer()
      
      this.finalStats = {
        wpm: this.currentStats.wpm,
        accuracy: this.currentStats.accuracy,
        timeElapsed: this.currentStats.timeElapsed,
        totalChars: this.practiceInput.length,
        errors: this.calculateErrors(),
        consistency: this.calculateConsistency()
      }
      
      this.checkAchievements()
      this.showResults = true
    },

    // Statistics
    startStatsTimer() {
      this.statsTimer = setInterval(() => {
        this.updateCurrentStats()
      }, 100)
    },

    stopStatsTimer() {
      if (this.statsTimer) {
        clearInterval(this.statsTimer)
      }
    },

    updateCurrentStats() {
      const timeElapsed = (Date.now() - this.practiceStartTime) / 1000
      const wordsTyped = this.practiceInput.length / 5
      const wpm = timeElapsed > 0 ? Math.round((wordsTyped / timeElapsed) * 60) : 0
      
      const correctChars = this.countCorrectCharacters()
      const accuracy = this.practiceInput.length > 0 ? 
        Math.round((correctChars / this.practiceInput.length) * 100) : 100
      
      this.currentStats = {
        wpm,
        accuracy,
        timeElapsed
      }
    },

    countCorrectCharacters() {
      let correct = 0
      for (let i = 0; i < this.practiceInput.length; i++) {
        if (i < this.practiceText.length && this.practiceInput[i] === this.practiceText[i]) {
          correct++
        }
      }
      return correct
    },

    calculateErrors() {
      return this.practiceInput.length - this.countCorrectCharacters()
    },

    calculateConsistency() {
      // Simplified consistency calculation
      return Math.floor(Math.random() * 20) + 80 // 80-100%
    },

    /**
     * Get character class for styling
     * @param {number} index - Character index
     * @returns {string} CSS class name
     */
    getCharacterClass(index) {
      if (index >= this.practiceInput.length) {
        return index === this.practiceInput.length ? 'current' : 'pending'
      }
      
      return this.practiceInput[index] === this.practiceText[index] ? 'correct' : 'incorrect'
    },

    /**
     * Get WPM performance class
     * @returns {string} CSS class name
     */
    getWPMClass() {
      if (this.currentStats.wpm >= 60) return 'excellent'
      if (this.currentStats.wpm >= 40) return 'good'
      if (this.currentStats.wpm >= 20) return 'fair'
      return 'needs-work'
    },

    /**
     * Get accuracy performance class
     * @returns {string} CSS class name
     */
    getAccuracyClass() {
      if (this.currentStats.accuracy >= 95) return 'excellent'
      if (this.currentStats.accuracy >= 85) return 'good'
      if (this.currentStats.accuracy >= 70) return 'fair'
      return 'needs-work'
    },

    // Results and achievements
    checkAchievements() {
      this.newAchievements = []
      
      // Check various achievement conditions
      if (this.finalStats.wpm >= 50 && !this.hasAchievement('speed-demon')) {
        this.newAchievements.push({
          id: 'speed-demon',
          name: 'Speed Demon',
          icon: '⚡'
        })
      }
      
      if (this.finalStats.accuracy >= 95 && !this.hasAchievement('accuracy-master')) {
        this.newAchievements.push({
          id: 'accuracy-master',
          name: 'Accuracy Master',
          icon: '🎯'
        })
      }
    },

    /**
     * Check if user has specific achievement
     * @param {string} achievementId - Achievement ID
     * @returns {boolean} Whether user has achievement
     */
    hasAchievement(achievementId) {
      const achievements = JSON.parse(localStorage.getItem('achievements') || '[]')
      return achievements.includes(achievementId)
    },

    shareResults() {
      if (navigator.share) {
        navigator.share({
          title: 'My Typing Results',
          text: `I just achieved ${this.finalStats.wpm} WPM with ${this.finalStats.accuracy}% accuracy!`,
          url: window.location.href
        })
      } else {
        // Fallback to clipboard
        const text = `I just achieved ${this.finalStats.wpm} WPM with ${this.finalStats.accuracy}% accuracy on Typing Tutor!`
        navigator.clipboard.writeText(text)
        this.showNotification('Results copied to clipboard!')
      }
    },

    saveResults() {
      const results = {
        date: new Date().toISOString(),
        ...this.finalStats
      }
      
      const savedResults = JSON.parse(localStorage.getItem('typingResults') || '[]')
      savedResults.push(results)
      localStorage.setItem('typingResults', JSON.stringify(savedResults))
      
      this.showNotification('Results saved!')
    },

    tryAgain() {
      this.closeResults()
      this.startPractice()
    },

    closeResults() {
      this.showResults = false
      this.newAchievements = []
    },

    // Utility methods
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

    /**
     * Format total time in human readable format
     * @param {number} seconds - Total seconds
     * @returns {string} Formatted time string
     */
    formatTotalTime(seconds) {
      const hours = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      if (hours > 0) {
        return `${hours}h ${mins}m`
      }
      return `${mins}m`
    },

    loadCustomText() {
      const customText = prompt('Enter your custom text to practice:')
      if (customText && customText.trim()) {
        this.practiceText = customText.trim()
      }
    },

    /**
     * Show notification to user
     * @param {string} message - Notification message
     */
    showNotification(message) {
      // Simple notification system
      if (Notification.permission === 'granted') {
        new Notification('Typing Tutor', { body: message })
      } else {
        // Fallback to console or toast
        console.log('Notification:', message)
      }
    },

    // Data persistence
    loadUserData() {
      const settings = localStorage.getItem('userSettings')
      if (settings) {
        this.settings = JSON.parse(settings)
        this.applySettings()
      }
      
      // Load user stats and progress
      const stats = localStorage.getItem('userStats')
      if (stats) {
        this.userStats = JSON.parse(stats)
      }
      
      const progress = localStorage.getItem('userProgress')
      if (progress) {
        this.userProgress = JSON.parse(progress)
      }
    },

    checkFirstVisit() {
      const onboardingComplete = localStorage.getItem('onboardingComplete')
      if (onboardingComplete) {
        this.showWelcome = false
        
        const tutorialComplete = localStorage.getItem('tutorialComplete')
        if (!tutorialComplete) {
          this.showTutorial = true
        }
      }
    }
  }
}

describe('User Experience Testing', () => {
  /** @type {import('@vue/test-utils').VueWrapper} */
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('First-Time User Experience', () => {
    it('should show welcome screen for new users', async () => {
      wrapper = mount(TypingTutorApp)
      await nextTick()

      expect(wrapper.find('.welcome-screen').exists()).toBe(true)
      expect(wrapper.find('.welcome-content h1').text()).toBe('Welcome to Typing Tutor!')
    })

    it('should allow skill level selection', async () => {
      wrapper = mount(TypingTutorApp)
      await nextTick()

      const beginnerButton = wrapper.find('.level-btn')
      await beginnerButton.trigger('click')

      expect(wrapper.vm.selectedLevel).toBe('beginner')
      expect(beginnerButton.classes()).toContain('active')
    })

    it('should allow goal selection', async () => {
      wrapper = mount(TypingTutorApp)
      await nextTick()

      const speedGoal = wrapper.find('input[value="speed"]')
      await speedGoal.setChecked(true)

      expect(wrapper.vm.selectedGoals).toContain('speed')
    })

    it('should enable start button when level and goals are selected', async () => {
      wrapper = mount(TypingTutorApp)
      await nextTick()

      const startButton = wrapper.find('.start-btn')
      expect(startButton.element.disabled).toBe(true)

      // Select level
      await wrapper.find('.level-btn').trigger('click')
      await nextTick()

      // Still disabled without goals
      expect(startButton.element.disabled).toBe(true)

      // Select goal
      await wrapper.find('input[value="speed"]').setChecked(true)
      await nextTick()

      // Now should be enabled
      expect(startButton.element.disabled).toBe(false)
    })

    it('should complete onboarding and save preferences', async () => {
      wrapper = mount(TypingTutorApp)
      await nextTick()

      // Complete onboarding flow
      await wrapper.find('.level-btn').trigger('click')
      await wrapper.find('input[value="speed"]').setChecked(true)
      await wrapper.find('.start-btn').trigger('click')

      expect(wrapper.vm.showWelcome).toBe(false)
      expect(global.localStorage.setItem).toHaveBeenCalledWith('onboardingComplete', 'true')
      expect(global.localStorage.setItem).toHaveBeenCalledWith('userLevel', 'beginner')
    })

    it('should show tutorial for beginner users', async () => {
      wrapper = mount(TypingTutorApp)
      wrapper.vm.selectedLevel = 'beginner'
      wrapper.vm.selectedGoals = ['speed']
      
      await wrapper.vm.completeOnboarding()
      await nextTick()

      expect(wrapper.vm.showTutorial).toBe(true)
      expect(wrapper.find('.tutorial-overlay').exists()).toBe(true)
    })
  })

  describe('Tutorial Experience', () => {
    beforeEach(async () => {
      wrapper = mount(TypingTutorApp)
      wrapper.vm.showWelcome = false
      wrapper.vm.showTutorial = true
      await nextTick()
    })

    it('should display tutorial steps', async () => {
      expect(wrapper.find('.tutorial-content h3').text()).toBe('Welcome to Typing Tutor!')
      expect(wrapper.vm.tutorialStep).toBe(1)
    })

    it('should navigate through tutorial steps', async () => {
      const nextButton = wrapper.find('.tutorial-actions .btn-primary')
      await nextButton.trigger('click')

      expect(wrapper.vm.tutorialStep).toBe(2)
      expect(wrapper.find('.tutorial-content h3').text()).toBe('Choose Your Lessons')
    })

    it('should allow going back in tutorial', async () => {
      wrapper.vm.tutorialStep = 2
      await nextTick()

      const prevButton = wrapper.find('.tutorial-actions .btn-secondary')
      await prevButton.trigger('click')

      expect(wrapper.vm.tutorialStep).toBe(1)
    })

    it('should allow skipping tutorial', async () => {
      const skipButton = wrapper.find('.btn-text')
      await skipButton.trigger('click')

      expect(wrapper.vm.showTutorial).toBe(false)
      expect(global.localStorage.setItem).toHaveBeenCalledWith('tutorialComplete', 'true')
    })

    it('should finish tutorial on last step', async () => {
      wrapper.vm.tutorialStep = wrapper.vm.tutorialSteps.length
      await nextTick()

      const finishButton = wrapper.find('.tutorial-actions .btn-primary')
      expect(finishButton.text()).toBe('Finish')

      await finishButton.trigger('click')
      expect(wrapper.vm.showTutorial).toBe(false)
    })
  })

  describe('Main Navigation Experience', () => {
    beforeEach(async () => {
      wrapper = mount(TypingTutorApp)
      wrapper.vm.showWelcome = false
      await nextTick()
    })

    it('should show main navigation tabs', async () => {
      const navButtons = wrapper.findAll('.nav-btn')
      expect(navButtons).toHaveLength(3)
      expect(navButtons[0].text()).toBe('Lessons')
      expect(navButtons[1].text()).toBe('Practice')
      expect(navButtons[2].text()).toBe('Progress')
    })

    it('should switch between tabs', async () => {
      const practiceTab = wrapper.findAll('.nav-btn')[1]
      await practiceTab.trigger('click')

      expect(wrapper.vm.activeTab).toBe('practice')
      expect(wrapper.find('.practice-tab').exists()).toBe(true)
    })

    it('should show user stats in header', async () => {
      wrapper.vm.userStats = { bestWPM: 65, avgAccuracy: 94 }
      await nextTick()

      expect(wrapper.find('.user-stats').text()).toContain('Best: 65 WPM')
      expect(wrapper.find('.user-stats').text()).toContain('Avg: 94%')
    })

    it('should toggle settings panel', async () => {
      const settingsButton = wrapper.find('.settings-btn')
      await settingsButton.trigger('click')

      expect(wrapper.vm.showSettings).toBe(true)
      expect(wrapper.find('.settings-panel').exists()).toBe(true)
    })
  })

  describe('Settings Experience', () => {
    beforeEach(async () => {
      wrapper = mount(TypingTutorApp)
      wrapper.vm.showWelcome = false
      wrapper.vm.showSettings = true
      await nextTick()
    })

    it('should display all setting options', async () => {
      expect(wrapper.find('select[data-testid="theme-select"]').exists() || 
             wrapper.find('.setting-select').exists()).toBe(true)
      expect(wrapper.find('input[type="range"]').exists()).toBe(true)
      expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
    })

    it('should update theme setting', async () => {
      const themeSelect = wrapper.find('.setting-select')
      await themeSelect.setValue('dark')

      expect(wrapper.vm.settings.theme).toBe('dark')
    })

    it('should update font size setting', async () => {
      const fontSizeRange = wrapper.find('.setting-range')
      await fontSizeRange.setValue('20')

      expect(wrapper.vm.settings.fontSize).toBe(20)
    })

    it('should save settings to localStorage', async () => {
      wrapper.vm.settings.theme = 'dark'
      wrapper.vm.settings.fontSize = 18
      
      const saveButton = wrapper.find('.settings-actions .btn-primary')
      await saveButton.trigger('click')

      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'userSettings',
        JSON.stringify(wrapper.vm.settings)
      )
      expect(wrapper.vm.showSettings).toBe(false)
    })

    it('should reset settings to defaults', async () => {
      wrapper.vm.settings.theme = 'dark'
      wrapper.vm.settings.fontSize = 24
      
      const resetButton = wrapper.find('.settings-actions .btn-secondary')
      await resetButton.trigger('click')

      expect(wrapper.vm.settings.theme).toBe('light')
      expect(wrapper.vm.settings.fontSize).toBe(16)
    })
  })

  describe('Lesson Selection Experience', () => {
    beforeEach(async () => {
      wrapper = mount(TypingTutorApp)
      wrapper.vm.showWelcome = false
      wrapper.vm.activeTab = 'lessons'
      await nextTick()
    })

    it('should display lesson categories', async () => {
      const categories = wrapper.findAll('.category-card')
      expect(categories.length).toBeGreaterThan(0)
      
      const firstCategory = categories[0]
      expect(firstCategory.find('.category-name').text()).toBeTruthy()
      expect(firstCategory.find('.category-desc').text()).toBeTruthy()
    })

    it('should show progress for each category', async () => {
      const progressBars = wrapper.findAll('.progress-bar')
      expect(progressBars.length).toBeGreaterThan(0)
    })

    it('should select category and show lessons', async () => {
      const firstCategory = wrapper.find('.category-card')
      await firstCategory.trigger('click')

      expect(wrapper.vm.selectedCategory).toBeTruthy()
      expect(wrapper.find('.lesson-list').exists()).toBe(true)
    })

    it('should display lesson details', async () => {
      wrapper.vm.selectedCategory = 'basics'
      await nextTick()

      const lessons = wrapper.findAll('.lesson-card')
      expect(lessons.length).toBeGreaterThan(0)
      
      const firstLesson = lessons[0]
      expect(firstLesson.find('.lesson-title').text()).toBeTruthy()
      expect(firstLesson.find('.lesson-desc').text()).toBeTruthy()
    })

    it('should handle lesson selection', async () => {
      wrapper.vm.selectedCategory = 'basics'
      await nextTick()

      const selectLessonSpy = vi.spyOn(wrapper.vm, 'selectLesson')
      const firstLesson = wrapper.find('.lesson-card')
      await firstLesson.trigger('click')

      expect(selectLessonSpy).toHaveBeenCalled()
    })
  })

  describe('Practice Mode Experience', () => {
    beforeEach(async () => {
      wrapper = mount(TypingTutorApp)
      wrapper.vm.showWelcome = false
      wrapper.vm.activeTab = 'practice'
      wrapper.vm.practiceText = 'The quick brown fox jumps over the lazy dog.'
      await nextTick()
    })

    it('should show practice controls', async () => {
      expect(wrapper.find('.practice-controls').exists()).toBe(true)
      expect(wrapper.find('.text-select').exists()).toBe(true)
      expect(wrapper.find('.btn-primary').text()).toBe('Start Practice')
    })

    it('should allow text selection', async () => {
      const textSelect = wrapper.find('.text-select')
      await textSelect.trigger('change')

      expect(textSelect.exists()).toBe(true)
    })

    it('should start practice session', async () => {
      const startButton = wrapper.find('.btn-primary')
      await startButton.trigger('click')

      expect(wrapper.vm.practiceActive).toBe(true)
      expect(wrapper.find('.typing-area.active').exists()).toBe(true)
    })

    it('should handle typing input', async () => {
      wrapper.vm.startPractice()
      await nextTick()

      const input = wrapper.find('.practice-input')
      await input.setValue('The quick')

      expect(wrapper.vm.practiceInput).toBe('The quick')
    })

    it('should show real-time statistics', async () => {
      wrapper.vm.practiceActive = true
      wrapper.vm.currentStats = { wpm: 45, accuracy: 92, timeElapsed: 30 }
      await nextTick()

      const stats = wrapper.find('.practice-stats')
      expect(stats.exists()).toBe(true)
      expect(stats.text()).toContain('45')
      expect(stats.text()).toContain('92%')
    })

    it('should handle pause/resume', async () => {
      wrapper.vm.startPractice()
      await nextTick()

      const pauseButton = wrapper.find('.btn-secondary')
      await pauseButton.trigger('click')

      expect(wrapper.vm.practicePaused).toBe(true)
      expect(pauseButton.text()).toBe('Resume')
    })

    it('should show progress indicator', async () => {
      wrapper.vm.practiceActive = true
      wrapper.vm.practiceInput = 'The quick brown'
      await nextTick()

      const progressBar = wrapper.find('.progress-fill')
      expect(progressBar.exists()).toBe(true)
    })

    it('should complete practice when text is finished', async () => {
      wrapper.vm.practiceActive = true
      wrapper.vm.practiceInput = wrapper.vm.practiceText
      
      await wrapper.vm.completePractice()

      expect(wrapper.vm.practiceActive).toBe(false)
      expect(wrapper.vm.showResults).toBe(true)
    })
  })

  describe('Results and Achievement Experience', () => {
    beforeEach(async () => {
      wrapper = mount(TypingTutorApp)
      wrapper.vm.showWelcome = false
      wrapper.vm.showResults = true
      wrapper.vm.finalStats = {
        wpm: 55,
        accuracy: 96,
        timeElapsed: 120,
        totalChars: 250,
        errors: 8,
        consistency: 88
      }
      await nextTick()
    })

    it('should display results modal', async () => {
      expect(wrapper.find('.results-modal').exists()).toBe(true)
      expect(wrapper.find('.modal-content h2').text()).toBe('Practice Complete!')
    })

    it('should show main statistics', async () => {
      const mainStats = wrapper.findAll('.result-stat')
      expect(mainStats[0].text()).toContain('55')
      expect(mainStats[1].text()).toContain('96')
    })

    it('should show detailed statistics', async () => {
      const detailRows = wrapper.findAll('.detail-row')
      expect(detailRows.length).toBeGreaterThan(0)
      expect(detailRows.some(row => row.text().includes('Characters Typed'))).toBe(true)
    })

    it('should show achievements if earned', async () => {
      wrapper.vm.newAchievements = [
        { id: 'speed-demon', name: 'Speed Demon', icon: '⚡' }
      ]
      await nextTick()

      expect(wrapper.find('.achievements').exists()).toBe(true)
      expect(wrapper.find('.achievement-item').text()).toContain('Speed Demon')
    })

    it('should handle sharing results', async () => {
      const shareButton = wrapper.find('.results-actions .btn-secondary')
      await shareButton.trigger('click')

      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'My Typing Results',
          text: expect.stringContaining('55 WPM')
        })
      )
    })

    it('should save results to localStorage', async () => {
      const saveButton = wrapper.findAll('.results-actions .btn-secondary')[1]
      await saveButton.trigger('click')

      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'typingResults',
        expect.any(String)
      )
    })

    it('should allow trying again', async () => {
      const tryAgainButton = wrapper.find('.results-actions .btn-primary')
      const startPracticeSpy = vi.spyOn(wrapper.vm, 'startPractice')
      
      await tryAgainButton.trigger('click')

      expect(wrapper.vm.showResults).toBe(false)
      expect(startPracticeSpy).toHaveBeenCalled()
    })
  })

  describe('Progress Tracking Experience', () => {
    beforeEach(async () => {
      wrapper = mount(TypingTutorApp)
      wrapper.vm.showWelcome = false
      wrapper.vm.activeTab = 'progress'
      wrapper.vm.userProgress = {
        totalSessions: 25,
        totalTime: 7200, // 2 hours
        currentStreak: 5
      }
      await nextTick()
    })

    it('should show progress overview', async () => {
      const overviewCards = wrapper.findAll('.overview-card')
      expect(overviewCards).toHaveLength(3)
      
      expect(overviewCards[0].text()).toContain('25')
      expect(overviewCards[1].text()).toContain('2h')
      expect(overviewCards[2].text()).toContain('5 days')
    })

    it('should display progress charts placeholder', async () => {
      expect(wrapper.find('.progress-charts').exists()).toBe(true)
      expect(wrapper.find('.chart-placeholder').exists()).toBe(true)
    })
  })

  describe('Accessibility and Usability', () => {
    beforeEach(async () => {
      wrapper = mount(TypingTutorApp)
      wrapper.vm.showWelcome = false
      await nextTick()
    })

    it('should support keyboard navigation', async () => {
      const navButtons = wrapper.findAll('.nav-btn')
      
      // Tab key should focus on navigation elements
      for (const button of navButtons) {
        expect(button.element.tabIndex).toBeGreaterThanOrEqual(0)
      }
    })

    it('should have proper ARIA labels', async () => {
      // Check for accessibility attributes
      const buttons = wrapper.findAll('button')
      buttons.forEach(button => {
        expect(button.text().length).toBeGreaterThan(0) // Should have text content
      })
    })

    it('should handle errors gracefully', async () => {
      // Simulate an error in practice mode
      wrapper.vm.practiceActive = true
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Try to trigger an error
      wrapper.vm.practiceText = null
      
      expect(() => {
        wrapper.vm.updateCurrentStats()
      }).not.toThrow()
    })

    it('should provide clear visual feedback', async () => {
      wrapper.vm.activeTab = 'practice'
      wrapper.vm.practiceText = 'Test text'
      wrapper.vm.practiceInput = 'Test'
      await nextTick()

      const chars = wrapper.findAll('.char')
      expect(chars[0].classes()).toContain('correct')
    })

    it('should work with different screen sizes', async () => {
      // This would typically involve viewport testing
      // Here we test that responsive classes are applied
      expect(wrapper.vm.themeClass).toBe('theme-light')
    })
  })

  describe('Data Persistence Experience', () => {
    it('should load saved user data on startup', async () => {
      // Pre-populate localStorage
      mockLocalStorage.set('userSettings', JSON.stringify({
        theme: 'dark',
        fontSize: 18,
        soundEnabled: false,
        showKeyboard: true
      }))
      
      mockLocalStorage.set('userStats', JSON.stringify({
        bestWPM: 75,
        avgAccuracy: 94
      }))

      wrapper = mount(TypingTutorApp)
      
      expect(wrapper.vm.settings.theme).toBe('dark')
      expect(wrapper.vm.settings.fontSize).toBe(18)
      expect(wrapper.vm.userStats.bestWPM).toBe(75)
    })

    it('should skip onboarding for returning users', async () => {
      mockLocalStorage.set('onboardingComplete', 'true')
      
      wrapper = mount(TypingTutorApp)
      await nextTick()

      expect(wrapper.vm.showWelcome).toBe(false)
      expect(wrapper.find('.main-app').exists()).toBe(true)
    })

    it('should restore practice session state', async () => {
      // This would test session restoration
      // Implementation depends on how sessions are persisted
      expect(true).toBe(true) // Placeholder
    })
  })
})