<template>
  <div class="interview-copilot-page">
    <!-- Landing Section -->
    <div v-if="!selectedDrill" class="landing-section">
      <header class="copilot-header">
        <div class="header-content">
          <h1>🎯 Interview Copilot</h1>
          <p class="tagline">AI-Powered Mock Interview Simulator</p>
        </div>
      </header>

      <div class="stats-banner">
        <div class="stat-card">
          <div class="stat-value">{{ drills.length }}</div>
          <div class="stat-label">Interview Drills</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">3</div>
          <div class="stat-label">Skill Categories</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ userStats.totalSessions }}</div>
          <div class="stat-label">Sessions Completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ userStats.averageScore }}%</div>
          <div class="stat-label">Average Score</div>
        </div>
      </div>

      <!-- Drill Selection -->
      <div class="drill-selection">
        <div class="filters">
          <select v-model="filterCategory" @change="filterDrills" class="filter-select">
            <option value="">All Categories</option>
            <option value="backend">Backend</option>
            <option value="frontend">Frontend</option>
            <option value="system-design">System Design</option>
          </select>
          <select v-model="filterDifficulty" @change="filterDrills" class="filter-select">
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div class="drills-grid">
          <div 
            v-for="drill in filteredDrills" 
            :key="drill.id"
            class="drill-card"
            @click="selectDrill(drill)"
          >
            <div class="drill-header">
              <h3>{{ drill.title }}</h3>
              <span class="difficulty-badge" :class="drill.difficulty">
                {{ drill.difficulty }}
              </span>
            </div>
            <p class="drill-description">{{ drill.description }}</p>
            <div class="drill-meta">
              <span class="drill-time">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
                {{ drill.timeLimit }} minutes
              </span>
              <span class="drill-category">{{ drill.category }}</span>
            </div>
            <div class="drill-requirements">
              <h4>Requirements:</h4>
              <ul>
                <li v-for="(req, index) in drill.requirements.slice(0, 2)" :key="index">
                  {{ req }}
                </li>
                <li v-if="drill.requirements.length > 2" class="more">
                  +{{ drill.requirements.length - 2 }} more
                </li>
              </ul>
            </div>
            <button class="start-drill-btn">Start Interview →</button>
          </div>
        </div>
      </div>

      <!-- Performance Dashboard -->
      <div class="performance-dashboard">
        <h2>Your Performance</h2>
        
        <div class="performance-grid">
          <div class="performance-card">
            <h3>Strongest Areas</h3>
            <div class="skill-list">
              <div v-for="area in userStats.strongestAreas" :key="area.dimension" class="skill-item">
                <span class="skill-name">{{ formatSkillName(area.dimension) }}</span>
                <div class="skill-bar">
                  <div class="skill-fill" :style="{ width: `${area.averageScore * 10}%` }"></div>
                </div>
                <span class="skill-score">{{ area.averageScore.toFixed(1) }}</span>
              </div>
            </div>
          </div>

          <div class="performance-card">
            <h3>Areas for Improvement</h3>
            <div class="skill-list">
              <div v-for="area in userStats.improvementAreas" :key="area.dimension" class="skill-item">
                <span class="skill-name">{{ formatSkillName(area.dimension) }}</span>
                <div class="skill-bar">
                  <div class="skill-fill improvement" :style="{ width: `${area.averageScore * 10}%` }"></div>
                </div>
                <span class="skill-score">{{ area.averageScore.toFixed(1) }}</span>
              </div>
            </div>
          </div>

          <div class="performance-card">
            <h3>Recent Sessions</h3>
            <div class="session-list">
              <div v-for="session in userStats.recentSessions" :key="session.sessionId" class="session-item">
                <div class="session-info">
                  <span class="session-title">{{ session.drillTitle }}</span>
                  <span class="session-date">{{ formatDate(session.date) }}</span>
                </div>
                <span class="session-score" :class="getScoreClass(session.score)">
                  {{ session.score }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Chart -->
        <div class="progress-chart">
          <h3>Progress Over Time</h3>
          <div class="chart-container">
            <canvas ref="progressChart"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Interview Simulator Component -->
    <InterviewSimulator 
      v-else
      :drill-id="selectedDrill.id"
      :user-id="userId"
      @close="selectedDrill = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import InterviewSimulator from '../components/InterviewSimulator.vue'

// State
const userId = ref('user-123')
const drills = ref([])
const filteredDrills = ref([])
const filterCategory = ref('')
const filterDifficulty = ref('')
const selectedDrill = ref(null)
const userStats = ref({
  totalSessions: 0,
  averageScore: 0,
  strongestAreas: [],
  improvementAreas: [],
  recentSessions: [],
  progressOverTime: []
})

// Methods
const loadDrills = async () => {
  try {
    const response = await fetch('http://localhost:3002/api/interview/drills')
    drills.value = await response.json()
    filteredDrills.value = drills.value
  } catch (error) {
    console.error('Failed to load drills:', error)
    // Use default drills if backend is not running
    drills.value = [
      {
        id: 'drill-1',
        title: 'Property Search Implementation',
        difficulty: 'medium',
        timeLimit: 45,
        category: 'backend',
        description: 'Implement a property search API with filtering, sorting, and pagination',
        requirements: [
          'Filter by price range, location, and property type',
          'Sort by price, date, or relevance',
          'Implement efficient pagination',
          'Handle edge cases gracefully'
        ]
      },
      {
        id: 'drill-2',
        title: 'Component State Management',
        difficulty: 'easy',
        timeLimit: 30,
        category: 'frontend',
        description: 'Build a Vue component with proper state management for a property listing',
        requirements: [
          'Implement reactive state for property data',
          'Handle loading and error states',
          'Create computed properties for derived data',
          'Implement user interactions'
        ]
      },
      {
        id: 'drill-3',
        title: 'System Design: Real Estate Platform',
        difficulty: 'hard',
        timeLimit: 60,
        category: 'system-design',
        description: 'Design a scalable real estate platform architecture',
        requirements: [
          'Handle millions of property listings',
          'Support real-time updates',
          'Implement search with < 100ms latency',
          'Design for global scale'
        ]
      }
    ]
    filteredDrills.value = drills.value
  }
}

const loadUserStats = async () => {
  try {
    const response = await fetch(`http://localhost:3002/api/interview/users/${userId.value}/performance`)
    userStats.value = await response.json()
  } catch (error) {
    console.error('Failed to load user stats:', error)
    // Use mock data if backend is not running
    userStats.value = {
      totalSessions: 12,
      averageScore: 78,
      strongestAreas: [
        { dimension: 'correctness', averageScore: 8.5 },
        { dimension: 'codeStructure', averageScore: 8.2 },
        { dimension: 'clarifyingQuestions', averageScore: 8.0 }
      ],
      improvementAreas: [
        { dimension: 'performance', averageScore: 6.5 },
        { dimension: 'tradeoffArticulation', averageScore: 6.8 },
        { dimension: 'timeManagement', averageScore: 6.2 }
      ],
      recentSessions: [
        { sessionId: 's1', drillTitle: 'Property Search Implementation', score: 82, date: new Date() },
        { sessionId: 's2', drillTitle: 'Component State Management', score: 75, date: new Date(Date.now() - 86400000) },
        { sessionId: 's3', drillTitle: 'System Design: Real Estate Platform', score: 79, date: new Date(Date.now() - 172800000) }
      ],
      progressOverTime: [
        { date: new Date(Date.now() - 604800000), score: 70 },
        { date: new Date(Date.now() - 432000000), score: 72 },
        { date: new Date(Date.now() - 259200000), score: 75 },
        { date: new Date(Date.now() - 86400000), score: 78 },
        { date: new Date(), score: 82 }
      ]
    }
  }
  drawProgressChart()
}

const filterDrills = () => {
  filteredDrills.value = drills.value.filter(drill => {
    const categoryMatch = !filterCategory.value || drill.category === filterCategory.value
    const difficultyMatch = !filterDifficulty.value || drill.difficulty === filterDifficulty.value
    return categoryMatch && difficultyMatch
  })
}

const selectDrill = (drill) => {
  selectedDrill.value = drill
}

const formatSkillName = (dimension) => {
  return dimension
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
}

const formatDate = (date) => {
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24))
  
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return d.toLocaleDateString()
}

const getScoreClass = (score) => {
  if (score >= 80) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 60) return 'fair'
  return 'needs-improvement'
}

const drawProgressChart = () => {
  // Simple canvas chart implementation
  const canvas = document.querySelector('canvas')
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const width = canvas.width = canvas.offsetWidth
  const height = canvas.height = 200
  
  const data = userStats.value.progressOverTime
  if (!data || data.length === 0) return
  
  const padding = 40
  const graphWidth = width - padding * 2
  const graphHeight = height - padding * 2
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height)
  
  // Draw axes
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padding, padding)
  ctx.lineTo(padding, height - padding)
  ctx.lineTo(width - padding, height - padding)
  ctx.stroke()
  
  // Draw data points and lines
  const maxScore = 100
  const minScore = 0
  const scoreRange = maxScore - minScore
  
  ctx.strokeStyle = '#667eea'
  ctx.lineWidth = 2
  ctx.beginPath()
  
  data.forEach((point, index) => {
    const x = padding + (index / (data.length - 1)) * graphWidth
    const y = height - padding - ((point.score - minScore) / scoreRange) * graphHeight
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
    
    // Draw point
    ctx.fillStyle = '#667eea'
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw score label
    ctx.fillStyle = '#666'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(point.score + '%', x, y - 10)
  })
  
  ctx.stroke()
}

// Lifecycle
onMounted(() => {
  loadDrills()
  loadUserStats()
})
</script>

<style scoped>
.interview-copilot-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.landing-section {
  min-height: 100vh;
  background: white;
}

/* Header */
.copilot-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 2rem;
  text-align: center;
}

.header-content h1 {
  font-size: 3rem;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.tagline {
  font-size: 1.25rem;
  opacity: 0.95;
}

/* Stats Banner */
.stats-banner {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  padding: 2rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #667eea;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 0.5rem;
}

/* Drill Selection */
.drill-selection {
  padding: 2rem;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
}

.drills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
}

.drill-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.drill-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.drill-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.drill-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.25rem;
}

.drill-description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.drill-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #7f8c8d;
}

.drill-time {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.drill-category {
  padding: 0.25rem 0.75rem;
  background: #f0f0f0;
  border-radius: 12px;
}

.drill-requirements {
  margin-bottom: 1rem;
}

.drill-requirements h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #34495e;
}

.drill-requirements ul {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.8rem;
  color: #7f8c8d;
}

.drill-requirements li {
  margin-bottom: 0.25rem;
}

.drill-requirements .more {
  font-style: italic;
  color: #95a5a6;
}

.start-drill-btn {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.start-drill-btn:hover {
  opacity: 0.9;
}

/* Performance Dashboard */
.performance-dashboard {
  padding: 3rem 2rem;
  background: #f8f9fa;
}

.performance-dashboard h2 {
  margin: 0 0 2rem 0;
  color: #2c3e50;
  font-size: 2rem;
  text-align: center;
}

.performance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.performance-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.performance-card h3 {
  margin: 0 0 1rem 0;
  color: #34495e;
  font-size: 1.125rem;
}

.skill-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skill-item {
  display: grid;
  grid-template-columns: 140px 1fr 40px;
  align-items: center;
  gap: 0.75rem;
}

.skill-name {
  font-size: 0.875rem;
  color: #5a6c7d;
}

.skill-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.skill-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.5s ease;
}

.skill-fill.improvement {
  background: linear-gradient(90deg, #ffa726, #ff6f00);
}

.skill-score {
  font-size: 0.875rem;
  font-weight: 600;
  color: #34495e;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.session-title {
  font-size: 0.875rem;
  color: #34495e;
  font-weight: 500;
}

.session-date {
  font-size: 0.75rem;
  color: #95a5a6;
}

.session-score {
  font-size: 1rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
}

.session-score.excellent {
  color: #27ae60;
  background: #e8f5e9;
}

.session-score.good {
  color: #f39c12;
  background: #fff3e0;
}

.session-score.fair {
  color: #e67e22;
  background: #ffe8d6;
}

.session-score.needs-improvement {
  color: #e74c3c;
  background: #ffebee;
}

/* Progress Chart */
.progress-chart {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.progress-chart h3 {
  margin: 0 0 1rem 0;
  color: #34495e;
  font-size: 1.125rem;
}

.chart-container {
  width: 100%;
  height: 200px;
  position: relative;
}

.chart-container canvas {
  width: 100%;
  height: 100%;
}
</style>