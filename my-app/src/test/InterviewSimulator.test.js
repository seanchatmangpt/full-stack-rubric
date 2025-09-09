import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import InterviewSimulator from '../components/InterviewSimulator.vue'

// Mock fetch globally
global.fetch = vi.fn()

// Mock session data
const mockSessionResponse = {
  sessionId: 'test-session-123',
  drill: {
    id: 'drill-1',
    title: 'Array Manipulation Challenge',
    difficulty: 'medium',
    timeLimit: 30,
    starterCode: 'function solution(arr) {\n  // Your code here\n  return arr;\n}',
    testCases: [
      { input: [1, 2, 3], expected: [3, 2, 1] },
      { input: [4, 5, 6], expected: [6, 5, 4] }
    ]
  },
  starterCode: 'function solution(arr) {\n  // Your code here\n  return arr;\n}',
  initialMessage: {
    role: 'interviewer',
    message: 'Welcome to your technical interview! Please solve the array manipulation challenge.',
    timestamp: new Date()
  }
}

const mockResults = {
  scores: {
    totalScore: { percentage: 85 },
    technical: {
      codeQuality: { score: 8, maxScore: 10 },
      algorithm: { score: 9, maxScore: 10 }
    },
    communication: {
      clarity: { score: 7, maxScore: 10 },
      responsiveness: { score: 8, maxScore: 10 }
    },
    problemSolving: {
      approach: { score: 9, maxScore: 10 },
      debugging: { score: 7, maxScore: 10 }
    }
  },
  feedback: {
    summary: 'Great job on solving the challenge!',
    strengths: ['Good algorithmic thinking', 'Clean code structure'],
    improvements: ['Could improve edge case handling', 'Consider optimization'],
    nextSteps: ['Practice more array algorithms', 'Study time complexity']
  }
}

describe('InterviewSimulator', () => {
  beforeEach(() => {
    fetch.mockClear()
    fetch.mockImplementation((url) => {
      if (url.includes('/sessions/start')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSessionResponse)
        })
      }
      if (url.includes('/chat')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ response: 'AI response message' })
        })
      }
      if (url.includes('/submit')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResults)
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    // Mock timers
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllTimers()
  })

  it('renders initial idle state', () => {
    const wrapper = mount(InterviewSimulator, {
      props: { drillId: 'test-drill-1' }
    })

    // Should render main structure
    expect(wrapper.find('.interview-simulator').exists()).toBe(true)
    expect(wrapper.find('.simulator-header').exists()).toBe(true)
    expect(wrapper.find('.simulator-panels').exists()).toBe(true)
  })

  it('renders three main panels', () => {
    const wrapper = mount(InterviewSimulator, {
      props: { drillId: 'test-drill-1' }
    })

    const panels = wrapper.findAll('.panel')
    expect(panels.length).toBe(3)

    // Verify panel types
    expect(wrapper.find('.chat-panel').exists()).toBe(true)
    expect(wrapper.find('.code-panel').exists()).toBe(true)
    expect(wrapper.find('.output-panel').exists()).toBe(true)
  })

  it('displays timer in header', () => {
    const wrapper = mount(InterviewSimulator, {
      props: { drillId: 'test-drill-1' }
    })

    const timer = wrapper.find('.timer')
    expect(timer.exists()).toBe(true)
    expect(timer.find('.timer-icon').exists()).toBe(true)
  })

  it('starts session on mount when drillId is provided', async () => {
    mount(InterviewSimulator, {
      props: { drillId: 'test-drill-1' }
    })

    await vi.runAllTimersAsync()

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3002/api/interview/sessions/start',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-123',
          drillId: 'test-drill-1'
        })
      })
    )
  })

  it('updates state when session starts successfully', async () => {
    const wrapper = mount(InterviewSimulator, {
      props: { drillId: 'test-drill-1' }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.sessionStatus).toBe('active')
    expect(wrapper.vm.sessionId).toBe('test-session-123')
    expect(wrapper.vm.currentDrill.title).toBe('Array Manipulation Challenge')
    expect(wrapper.vm.currentCode).toBe(mockSessionResponse.starterCode)
  })

  it('displays drill information after session starts', async () => {
    const wrapper = mount(InterviewSimulator, {
      props: { drillId: 'test-drill-1' }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.simulator-header h2').text()).toBe('Array Manipulation Challenge')
    expect(wrapper.find('.difficulty-badge').text()).toBe('medium')
    expect(wrapper.find('.difficulty-badge').classes()).toContain('medium')
  })

  it('handles chat input and messages', async () => {
    const wrapper = mount(InterviewSimulator, {
      props: { drillId: 'test-drill-1' }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    const chatInput = wrapper.find('.chat-input-field')
    const sendButton = wrapper.find('.send-btn')

    expect(chatInput.exists()).toBe(true)
    expect(sendButton.exists()).toBe(true)

    // Test sending a message
    await chatInput.setValue('Test message')
    await sendButton.trigger('click')

    expect(wrapper.vm.chatTranscript).toContainEqual(
      expect.objectContaining({
        role: 'candidate',
        message: 'Test message'
      })
    )
  })

  it('disables chat when session is not active', () => {
    const wrapper = mount(InterviewSimulator, {
      props: { drillId: 'test-drill-1' }
    })

    const chatInput = wrapper.find('.chat-input-field')
    const sendButton = wrapper.find('.send-btn')

    expect(chatInput.attributes('disabled')).toBeDefined()
    expect(sendButton.attributes('disabled')).toBeDefined()
  })

  it('handles code editor functionality', async () => {
    const wrapper = mount(InterviewSimulator, {
      props: { drillId: 'test-drill-1' }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    const codeEditor = wrapper.find('.code-editor')
    expect(codeEditor.exists()).toBe(true)
    expect(codeEditor.attributes('spellcheck')).toBe('false')

    // Test code editing
    const newCode = 'function solution(arr) { return arr.reverse(); }'
    await codeEditor.setValue(newCode)
    expect(wrapper.vm.currentCode).toBe(newCode)
  })

  it('displays line numbers for code editor', async () => {
    const wrapper = mount(InterviewSimulator, {
      props: { drillId: 'test-drill-1' }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    const lineNumbers = wrapper.find('.line-numbers')
    expect(lineNumbers.exists()).toBe(true)

    const lineNumberElements = wrapper.findAll('.line-number')
    expect(lineNumberElements.length).toBeGreaterThan(0)
  })

  it('handles code execution', async () => {
    const wrapper = mount(InterviewSimulator, {
      props: { drillId: 'test-drill-1' }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    const runButton = wrapper.find('.run-btn')
    expect(runButton.text()).toBe('▶ Run')

    await runButton.trigger('click')
    expect(wrapper.vm.running).toBe(true)

    // Fast-forward through code execution timeout
    await vi.runAllTimersAsync()

    expect(wrapper.vm.running).toBe(false)
    expect(wrapper.vm.codeOutput).toBeDefined()
  })

  it('handles code reset functionality', async () => {
    const wrapper = mount(InterviewSimulator, {
      props: { drillId: 'test-drill-1' }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    // Modify code
    wrapper.vm.currentCode = 'modified code'
    wrapper.vm.codeOutput = 'some output'

    // Mock confirm dialog
    window.confirm = vi.fn(() => true)

    const resetButton = wrapper.find('.reset-btn')
    await resetButton.trigger('click')

    expect(wrapper.vm.currentCode).toBe(mockSessionResponse.starterCode)
    expect(wrapper.vm.codeOutput).toBe('')
  })

  it('formats time correctly', () => {
    const wrapper = mount(InterviewSimulator, {
      props: { drillId: 'test-drill-1' }
    })

    expect(wrapper.vm.formatTime(0)).toBe('0:00')
    expect(wrapper.vm.formatTime(65)).toBe('1:05')
    expect(wrapper.vm.formatTime(3665)).toBe('61:05')
  })

  it('shows timer warning when time is low', async () => {
    const wrapper = mount(InterviewSimulator, {
      props: { drillId: 'test-drill-1' }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    // Set time remaining to less than 5 minutes
    wrapper.vm.timeRemaining = 250 // 4:10

    await wrapper.vm.$nextTick()

    const timer = wrapper.find('.timer')
    expect(timer.classes()).toContain('warning')
  })

  it('handles session submission', async () => {
    const wrapper = mount(InterviewSimulator, {
      props: { drillId: 'test-drill-1' }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    const submitButton = wrapper.find('.submit-btn')
    expect(submitButton.exists()).toBe(true)

    await submitButton.trigger('click')
    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.sessionStatus).toBe('completed')
    expect(wrapper.vm.showResults).toBe(true)
  })

  it('displays results modal after submission', async () => {
    const wrapper = mount(InterviewSimulator, {
      props: { drillId: 'test-drill-1' }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    // Submit session
    await wrapper.find('.submit-btn').trigger('click')
    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.results-modal').exists()).toBe(true)
    expect(wrapper.find('.score-text').text()).toBe('85%')
  })

  it('displays feedback in results modal', async () => {
    const wrapper = mount(InterviewSimulator, {
      props: { drillId: 'test-drill-1' }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    // Submit session
    await wrapper.find('.submit-btn').trigger('click')
    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    const feedback = wrapper.find('.feedback-section')
    expect(feedback.exists()).toBe(true)
    expect(feedback.text()).toContain('Great job on solving the challenge!')
  })

  it('closes results modal when close button clicked', async () => {
    const wrapper = mount(InterviewSimulator, {
      props: { drillId: 'test-drill-1' }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    // Submit and show results
    await wrapper.find('.submit-btn').trigger('click')
    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.showResults).toBe(true)

    await wrapper.find('.close-btn').trigger('click')
    expect(wrapper.vm.showResults).toBe(false)
  })

  it('demonstrates complex Vue concepts integration', async () => {
    const wrapper = mount(InterviewSimulator, {
      props: { 
        drillId: 'test-drill-1',
        userId: 'custom-user-id'
      }
    })

    // Test props handling
    expect(wrapper.props('drillId')).toBe('test-drill-1')
    expect(wrapper.props('userId')).toBe('custom-user-id')

    // Test computed properties
    expect(wrapper.vm.lineCount).toBeGreaterThan(0)

    // Test lifecycle hooks
    expect(fetch).toHaveBeenCalled() // onMounted triggered API call

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    // Test watchers (chat transcript)
    const initialTranscriptLength = wrapper.vm.chatTranscript.length
    wrapper.vm.chatTranscript.push({
      role: 'test',
      message: 'test',
      timestamp: new Date()
    })

    await wrapper.vm.$nextTick()
    expect(wrapper.vm.chatTranscript.length).toBe(initialTranscriptLength + 1)
  })
})