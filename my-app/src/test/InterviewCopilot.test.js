import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import InterviewCopilot from '../pages/InterviewCopilot.vue'
import InterviewSimulator from '../components/InterviewSimulator.vue'

// Mock fetch globally
global.fetch = vi.fn()

const mockDrills = [
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
    description: 'Build a Vue component with proper state management',
    requirements: [
      'Implement reactive state for property data',
      'Handle loading and error states',
      'Create computed properties for derived data'
    ]
  }
]

const mockUserStats = {
  totalSessions: 12,
  averageScore: 78,
  strongestAreas: [
    { dimension: 'correctness', averageScore: 8.5 },
    { dimension: 'codeStructure', averageScore: 8.2 }
  ],
  improvementAreas: [
    { dimension: 'performance', averageScore: 6.5 },
    { dimension: 'tradeoffArticulation', averageScore: 6.8 }
  ],
  recentSessions: [
    { sessionId: 's1', drillTitle: 'Property Search Implementation', score: 82, date: new Date() },
    { sessionId: 's2', drillTitle: 'Component State Management', score: 75, date: new Date(Date.now() - 86400000) }
  ],
  progressOverTime: [
    { date: new Date(Date.now() - 604800000), score: 70 },
    { date: new Date(Date.now() - 432000000), score: 75 },
    { date: new Date(), score: 82 }
  ]
}

describe('InterviewCopilot', () => {
  beforeEach(() => {
    fetch.mockClear()
    fetch.mockImplementation((url) => {
      if (url.includes('/drills')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDrills)
        })
      }
      if (url.includes('/performance')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUserStats)
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })
  })

  it('renders landing section by default', () => {
    const wrapper = mount(InterviewCopilot)
    
    expect(wrapper.find('.landing-section').exists()).toBe(true)
    expect(wrapper.find('.copilot-header').exists()).toBe(true)
    expect(wrapper.find('.stats-banner').exists()).toBe(true)
    expect(wrapper.find('.drill-selection').exists()).toBe(true)
  })

  it('displays main header with title and tagline', () => {
    const wrapper = mount(InterviewCopilot)
    
    expect(wrapper.find('h1').text()).toBe('🎯 Interview Copilot')
    expect(wrapper.find('.tagline').text()).toBe('AI-Powered Mock Interview Simulator')
  })

  it('renders stats banner with correct structure', () => {
    const wrapper = mount(InterviewCopilot)
    
    const statCards = wrapper.findAll('.stat-card')
    expect(statCards.length).toBe(4)
    
    // Check stat labels
    const labels = wrapper.findAll('.stat-label').map(el => el.text())
    expect(labels).toContain('Interview Drills')
    expect(labels).toContain('Skill Categories')
    expect(labels).toContain('Sessions Completed')
    expect(labels).toContain('Average Score')
  })

  it('fetches drills on mount', async () => {
    mount(InterviewCopilot)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(fetch).toHaveBeenCalledWith('http://localhost:3002/api/interview/drills')
  })

  it('fetches user stats on mount', async () => {
    const wrapper = mount(InterviewCopilot)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(fetch).toHaveBeenCalledWith('http://localhost:3002/api/interview/users/user-123/performance')
  })

  it('displays drill cards after loading', async () => {
    const wrapper = mount(InterviewCopilot)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    const drillCards = wrapper.findAll('.drill-card')
    expect(drillCards.length).toBe(2)
  })

  it('displays drill information correctly', async () => {
    const wrapper = mount(InterviewCopilot)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    const firstDrill = wrapper.find('.drill-card')
    expect(firstDrill.find('h3').text()).toBe('Property Search Implementation')
    expect(firstDrill.find('.difficulty-badge').text()).toBe('medium')
    expect(firstDrill.find('.drill-description').text()).toContain('Implement a property search API')
  })

  it('renders filter controls', () => {
    const wrapper = mount(InterviewCopilot)
    
    const selects = wrapper.findAll('.filter-select')
    expect(selects.length).toBe(2)
    
    // Check filter options
    const categoryOptions = selects[0].findAll('option').map(opt => opt.text())
    expect(categoryOptions).toContain('All Categories')
    expect(categoryOptions).toContain('Backend')
    expect(categoryOptions).toContain('Frontend')
    
    const difficultyOptions = selects[1].findAll('option').map(opt => opt.text())
    expect(difficultyOptions).toContain('All Difficulties')
    expect(difficultyOptions).toContain('Easy')
    expect(difficultyOptions).toContain('Medium')
  })

  it('filters drills by category', async () => {
    const wrapper = mount(InterviewCopilot)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    // Set category filter to 'backend'
    const categorySelect = wrapper.find('.filter-select')
    await categorySelect.setValue('backend')
    
    expect(wrapper.vm.filteredDrills.length).toBe(1)
    expect(wrapper.vm.filteredDrills[0].category).toBe('backend')
  })

  it('filters drills by difficulty', async () => {
    const wrapper = mount(InterviewCopilot)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    // Set difficulty filter to 'easy'
    const difficultySelect = wrapper.findAll('.filter-select')[1]
    await difficultySelect.setValue('easy')
    
    expect(wrapper.vm.filteredDrills.length).toBe(1)
    expect(wrapper.vm.filteredDrills[0].difficulty).toBe('easy')
  })

  it('selects drill when card is clicked', async () => {
    const wrapper = mount(InterviewCopilot)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    const drillCard = wrapper.find('.drill-card')
    await drillCard.trigger('click')
    
    expect(wrapper.vm.selectedDrill).toBe(wrapper.vm.filteredDrills[0])
  })

  it('shows InterviewSimulator when drill is selected', async () => {
    const wrapper = mount(InterviewCopilot, {
      global: {
        components: {
          InterviewSimulator
        }
      }
    })
    
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    // Select a drill
    wrapper.vm.selectedDrill = mockDrills[0]
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.landing-section').exists()).toBe(false)
    expect(wrapper.findComponent(InterviewSimulator).exists()).toBe(true)
  })

  it('passes correct props to InterviewSimulator', async () => {
    const wrapper = mount(InterviewCopilot, {
      global: {
        components: {
          InterviewSimulator
        }
      }
    })
    
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    // Select a drill
    wrapper.vm.selectedDrill = mockDrills[0]
    await wrapper.vm.$nextTick()
    
    const simulator = wrapper.findComponent(InterviewSimulator)
    expect(simulator.props('drillId')).toBe('drill-1')
    expect(simulator.props('userId')).toBe('user-123')
  })

  it('renders performance dashboard', () => {
    const wrapper = mount(InterviewCopilot)
    
    const dashboard = wrapper.find('.performance-dashboard')
    expect(dashboard.exists()).toBe(true)
    expect(dashboard.find('h2').text()).toBe('Your Performance')
  })

  it('displays performance grid cards', () => {
    const wrapper = mount(InterviewCopilot)
    
    const performanceCards = wrapper.findAll('.performance-card')
    expect(performanceCards.length).toBe(3)
    
    const titles = performanceCards.map(card => card.find('h3').text())
    expect(titles).toContain('Strongest Areas')
    expect(titles).toContain('Areas for Improvement')
    expect(titles).toContain('Recent Sessions')
  })

  it('formats skill names correctly', () => {
    const wrapper = mount(InterviewCopilot)
    
    expect(wrapper.vm.formatSkillName('correctness')).toBe('Correctness')
    expect(wrapper.vm.formatSkillName('codeStructure')).toBe('Code Structure')
    expect(wrapper.vm.formatSkillName('tradeoffArticulation')).toBe('Tradeoff Articulation')
  })

  it('formats dates correctly', () => {
    const wrapper = mount(InterviewCopilot)
    
    const today = new Date()
    const yesterday = new Date(Date.now() - 86400000)
    const twoDaysAgo = new Date(Date.now() - 172800000)
    const oldDate = new Date(Date.now() - 604800000)
    
    expect(wrapper.vm.formatDate(today)).toBe('Today')
    expect(wrapper.vm.formatDate(yesterday)).toBe('Yesterday')
    expect(wrapper.vm.formatDate(twoDaysAgo)).toBe('2 days ago')
    expect(wrapper.vm.formatDate(oldDate)).toBe(oldDate.toLocaleDateString())
  })

  it('returns correct score classes', () => {
    const wrapper = mount(InterviewCopilot)
    
    expect(wrapper.vm.getScoreClass(85)).toBe('excellent')
    expect(wrapper.vm.getScoreClass(75)).toBe('good')
    expect(wrapper.vm.getScoreClass(65)).toBe('fair')
    expect(wrapper.vm.getScoreClass(55)).toBe('needs-improvement')
  })

  it('displays user stats after loading', async () => {
    const wrapper = mount(InterviewCopilot)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    // Check stats display in banner
    const statValues = wrapper.findAll('.stat-value')
    expect(statValues.some(el => el.text() === '12')).toBe(true) // totalSessions
    expect(statValues.some(el => el.text() === '78%')).toBe(true) // averageScore
  })

  it('handles API failures gracefully', async () => {
    // Mock API failure
    fetch.mockImplementation(() => Promise.reject(new Error('API Error')))
    
    const wrapper = mount(InterviewCopilot)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    // Should still render with default/fallback data
    expect(wrapper.find('.landing-section').exists()).toBe(true)
    expect(wrapper.vm.drills.length).toBeGreaterThan(0) // Uses default drills
  })

  it('demonstrates Vue composition API usage', async () => {
    const wrapper = mount(InterviewCopilot)
    
    // Test reactive refs
    expect(wrapper.vm.userId).toBe('user-123')
    expect(wrapper.vm.selectedDrill).toBe(null)
    expect(wrapper.vm.filterCategory).toBe('')
    
    // Test computed behavior through filtering
    wrapper.vm.drills = mockDrills
    wrapper.vm.filteredDrills = mockDrills
    wrapper.vm.filterCategory = 'backend'
    
    wrapper.vm.filterDrills()
    expect(wrapper.vm.filteredDrills.length).toBe(1)
    expect(wrapper.vm.filteredDrills[0].category).toBe('backend')
  })

  it('demonstrates complex state management', async () => {
    const wrapper = mount(InterviewCopilot)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    // Test multi-level state updates
    const initialDrillCount = wrapper.vm.filteredDrills.length
    
    // Apply multiple filters
    wrapper.vm.filterCategory = 'frontend'
    wrapper.vm.filterDifficulty = 'easy'
    wrapper.vm.filterDrills()
    
    expect(wrapper.vm.filteredDrills.length).toBeLessThanOrEqual(initialDrillCount)
    
    // Clear filters
    wrapper.vm.filterCategory = ''
    wrapper.vm.filterDifficulty = ''
    wrapper.vm.filterDrills()
    
    expect(wrapper.vm.filteredDrills.length).toBe(wrapper.vm.drills.length)
  })

  it('renders progress chart container', () => {
    const wrapper = mount(InterviewCopilot)
    
    const progressChart = wrapper.find('.progress-chart')
    expect(progressChart.exists()).toBe(true)
    expect(progressChart.find('h3').text()).toBe('Progress Over Time')
    expect(progressChart.find('.chart-container').exists()).toBe(true)
    expect(progressChart.find('canvas').exists()).toBe(true)
  })
})