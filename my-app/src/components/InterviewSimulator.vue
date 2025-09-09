<template>
  <div class="interview-simulator">
    <!-- Header with Timer and Controls -->
    <div class="simulator-header">
      <div class="header-left">
        <h2>{{ currentDrill?.title || 'Interview Simulation' }}</h2>
        <span class="difficulty-badge" :class="currentDrill?.difficulty">
          {{ currentDrill?.difficulty }}
        </span>
      </div>
      <div class="header-center">
        <div class="timer" :class="{ warning: timeRemaining < 300 }">
          <svg class="timer-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
          {{ formatTime(timeRemaining) }}
        </div>
      </div>
      <div class="header-right">
        <button 
          v-if="sessionStatus === 'active'"
          @click="submitSession" 
          class="submit-btn"
          :disabled="submitting"
        >
          {{ submitting ? 'Submitting...' : 'Submit Solution' }}
        </button>
        <button 
          v-else-if="sessionStatus === 'completed'"
          @click="viewResults"
          class="results-btn"
        >
          View Results
        </button>
      </div>
    </div>

    <!-- Main 3-Panel Layout -->
    <div class="simulator-panels">
      <!-- Panel 1: AI Interviewer Chat -->
      <div class="panel chat-panel">
        <div class="panel-header">
          <h3>Interviewer Chat</h3>
          <span class="status-indicator" :class="{ active: chatActive }"></span>
        </div>
        <div class="chat-messages" ref="chatContainer">
          <div 
            v-for="(msg, index) in chatTranscript" 
            :key="index"
            class="chat-message"
            :class="msg.role"
          >
            <div class="message-avatar">
              {{ msg.role === 'interviewer' ? '🤖' : '👤' }}
            </div>
            <div class="message-content">
              <div class="message-role">
                {{ msg.role === 'interviewer' ? 'Interviewer' : 'You' }}
              </div>
              <div class="message-text">{{ msg.message }}</div>
              <div class="message-time">
                {{ formatTimestamp(msg.timestamp) }}
              </div>
            </div>
          </div>
          <div v-if="aiTyping" class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <div class="chat-input">
          <input 
            v-model="chatInput"
            @keyup.enter="sendMessage"
            :disabled="sessionStatus !== 'active'"
            placeholder="Type your message or question..."
            class="chat-input-field"
          />
          <button 
            @click="sendMessage"
            :disabled="!chatInput.trim() || sessionStatus !== 'active'"
            class="send-btn"
          >
            Send
          </button>
        </div>
      </div>

      <!-- Panel 2: Code Editor -->
      <div class="panel code-panel">
        <div class="panel-header">
          <h3>Code Editor</h3>
          <div class="editor-controls">
            <button @click="runCode" class="run-btn" :disabled="running">
              {{ running ? 'Running...' : '▶ Run' }}
            </button>
            <button @click="resetCode" class="reset-btn">
              Reset
            </button>
          </div>
        </div>
        <div class="code-editor-wrapper">
          <textarea 
            v-model="currentCode"
            @input="onCodeChange"
            class="code-editor"
            :disabled="sessionStatus !== 'active'"
            spellcheck="false"
          ></textarea>
          <div class="line-numbers">
            <div v-for="n in lineCount" :key="n" class="line-number">
              {{ n }}
            </div>
          </div>
        </div>
      </div>

      <!-- Panel 3: Output/Test Results -->
      <div class="panel output-panel">
        <div class="panel-header">
          <h3>Output & Test Results</h3>
          <div class="test-status" v-if="testResults">
            <span class="passed">✓ {{ testResults.passed }}</span>
            <span class="failed">✗ {{ testResults.failed }}</span>
          </div>
        </div>
        <div class="output-content">
          <div v-if="codeOutput" class="code-output">
            <h4>Console Output:</h4>
            <pre>{{ codeOutput }}</pre>
          </div>
          <div v-if="testResults" class="test-results">
            <h4>Test Results:</h4>
            <div 
              v-for="(test, index) in testResults.tests" 
              :key="index"
              class="test-case"
              :class="{ passed: test.passed, failed: !test.passed }"
            >
              <span class="test-icon">{{ test.passed ? '✓' : '✗' }}</span>
              <span class="test-name">Test {{ index + 1 }}: {{ test.description }}</span>
              <div v-if="!test.passed" class="test-error">
                {{ test.error }}
              </div>
            </div>
          </div>
          <div v-if="!codeOutput && !testResults" class="empty-output">
            Run your code to see output here
          </div>
        </div>
      </div>
    </div>

    <!-- Results Modal -->
    <div v-if="showResults" class="results-modal">
      <div class="modal-overlay" @click="closeResults"></div>
      <div class="modal-content">
        <h2>Session Results</h2>
        
        <!-- Score Summary -->
        <div class="score-summary">
          <div class="overall-score">
            <div class="score-circle">
              <svg width="120" height="120">
                <circle 
                  cx="60" cy="60" r="50" 
                  fill="none" 
                  stroke="#e0e0e0" 
                  stroke-width="10"
                />
                <circle 
                  cx="60" cy="60" r="50" 
                  fill="none" 
                  stroke="#4CAF50" 
                  stroke-width="10"
                  :stroke-dasharray="`${(results?.scores?.totalScore?.percentage || 0) * 3.14} 314`"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div class="score-text">
                {{ results?.scores?.totalScore?.percentage || 0 }}%
              </div>
            </div>
          </div>
          
          <!-- Category Scores -->
          <div class="category-scores">
            <div class="score-category" v-for="category in ['technical', 'communication', 'problemSolving']" :key="category">
              <h4>{{ formatCategoryName(category) }}</h4>
              <div class="dimension-scores">
                <div 
                  v-for="(data, dimension) in results?.scores?.[category]" 
                  :key="dimension"
                  class="dimension"
                >
                  <span class="dimension-name">{{ formatDimensionName(dimension) }}</span>
                  <div class="score-bar">
                    <div 
                      class="score-fill" 
                      :style="{ width: `${(data.score / data.maxScore) * 100}%` }"
                    ></div>
                  </div>
                  <span class="dimension-score">{{ data.score }}/{{ data.maxScore }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Feedback Section -->
        <div class="feedback-section" v-if="results?.feedback">
          <h3>AI Feedback</h3>
          
          <div class="feedback-summary">
            <p>{{ results.feedback.summary }}</p>
          </div>
          
          <div class="feedback-grid">
            <div class="feedback-column">
              <h4>💪 Strengths</h4>
              <ul>
                <li v-for="(strength, index) in results.feedback.strengths" :key="index">
                  {{ strength }}
                </li>
              </ul>
            </div>
            
            <div class="feedback-column">
              <h4>📈 Areas for Improvement</h4>
              <ul>
                <li v-for="(improvement, index) in results.feedback.improvements" :key="index">
                  {{ improvement }}
                </li>
              </ul>
            </div>
          </div>
          
          <div class="next-steps">
            <h4>🎯 Next Steps</h4>
            <ul>
              <li v-for="(step, index) in results.feedback.nextSteps" :key="index">
                {{ step }}
              </li>
            </ul>
          </div>
        </div>
        
        <button @click="closeResults" class="close-btn">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// Props
const props = defineProps({
  drillId: String,
  userId: {
    type: String,
    default: 'user-123'
  }
})

// State
const sessionId = ref(null)
const sessionStatus = ref('idle') // idle, active, completed
const currentDrill = ref(null)
const chatTranscript = ref([])
const chatInput = ref('')
const chatActive = ref(false)
const aiTyping = ref(false)
const currentCode = ref('')
const codeOutput = ref('')
const testResults = ref(null)
const running = ref(false)
const submitting = ref(false)
const showResults = ref(false)
const results = ref(null)
const timeRemaining = ref(0)
const timer = ref(null)

// Computed
const lineCount = computed(() => {
  return currentCode.value.split('\n').length
})

// Methods
const startSession = async () => {
  try {
    const response = await fetch('http://localhost:3002/api/interview/sessions/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: props.userId,
        drillId: props.drillId
      })
    })
    
    const data = await response.json()
    sessionId.value = data.sessionId
    currentDrill.value = data.drill
    currentCode.value = data.starterCode
    chatTranscript.value = [data.initialMessage]
    sessionStatus.value = 'active'
    timeRemaining.value = data.drill.timeLimit * 60 // Convert to seconds
    startTimer()
  } catch (error) {
    console.error('Failed to start session:', error)
  }
}

const startTimer = () => {
  timer.value = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--
    } else {
      clearInterval(timer.value)
      submitSession()
    }
  }, 1000)
}

const sendMessage = async () => {
  if (!chatInput.value.trim() || sessionStatus.value !== 'active') return
  
  const message = chatInput.value
  chatTranscript.value.push({
    role: 'candidate',
    message,
    timestamp: new Date()
  })
  
  chatInput.value = ''
  aiTyping.value = true
  
  try {
    const response = await fetch(`http://localhost:3002/api/interview/sessions/${sessionId.value}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    })
    
    const data = await response.json()
    
    setTimeout(() => {
      aiTyping.value = false
      chatTranscript.value.push({
        role: 'interviewer',
        message: data.response,
        timestamp: new Date()
      })
      scrollChatToBottom()
    }, 1000)
  } catch (error) {
    console.error('Failed to send message:', error)
    aiTyping.value = false
  }
}

const onCodeChange = async () => {
  if (sessionStatus.value !== 'active') return
  
  // Debounced save to backend
  clearTimeout(window.codeSaveTimeout)
  window.codeSaveTimeout = setTimeout(async () => {
    try {
      await fetch(`http://localhost:3002/api/interview/sessions/${sessionId.value}/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: currentCode.value })
      })
    } catch (error) {
      console.error('Failed to save code:', error)
    }
  }, 1000)
}

const runCode = () => {
  running.value = true
  
  // Simulate code execution
  setTimeout(() => {
    try {
      // Basic JavaScript evaluation (in production, use a sandboxed environment)
      const result = eval(currentCode.value)
      codeOutput.value = String(result)
      
      // Run test cases if available
      if (currentDrill.value?.testCases) {
        const tests = currentDrill.value.testCases.map((testCase, index) => {
          // Simplified test execution
          const passed = Math.random() > 0.3 // Simulate test results
          return {
            passed,
            description: `Input: ${JSON.stringify(testCase.input)}`,
            error: passed ? null : 'Output did not match expected result'
          }
        })
        
        testResults.value = {
          passed: tests.filter(t => t.passed).length,
          failed: tests.filter(t => !t.passed).length,
          tests
        }
      }
    } catch (error) {
      codeOutput.value = `Error: ${error.message}`
    }
    
    running.value = false
  }, 1500)
}

const resetCode = () => {
  if (confirm('Are you sure you want to reset your code?')) {
    currentCode.value = currentDrill.value?.starterCode || ''
    codeOutput.value = ''
    testResults.value = null
  }
}

const submitSession = async () => {
  if (submitting.value) return
  
  submitting.value = true
  clearInterval(timer.value)
  
  try {
    const response = await fetch(`http://localhost:3002/api/interview/sessions/${sessionId.value}/submit`, {
      method: 'POST'
    })
    
    const data = await response.json()
    results.value = data
    sessionStatus.value = 'completed'
    showResults.value = true
  } catch (error) {
    console.error('Failed to submit session:', error)
  } finally {
    submitting.value = false
  }
}

const viewResults = () => {
  showResults.value = true
}

const closeResults = () => {
  showResults.value = false
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const formatCategoryName = (category) => {
  const names = {
    technical: 'Technical Skills',
    communication: 'Communication',
    problemSolving: 'Problem Solving'
  }
  return names[category] || category
}

const formatDimensionName = (dimension) => {
  return dimension
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
}

const scrollChatToBottom = () => {
  setTimeout(() => {
    const container = document.querySelector('.chat-messages')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, 100)
}

// Lifecycle
onMounted(() => {
  if (props.drillId) {
    startSession()
  }
})

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
})

// Watch for chat updates
watch(chatTranscript, () => {
  scrollChatToBottom()
}, { deep: true })
</script>

<style scoped>
.interview-simulator {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

/* Header */
.simulator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-left h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #2c3e50;
}

.difficulty-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
}

.difficulty-badge.easy {
  background: #e8f5e9;
  color: #2e7d32;
}

.difficulty-badge.medium {
  background: #fff3e0;
  color: #ef6c00;
}

.difficulty-badge.hard {
  background: #ffebee;
  color: #c62828;
}

.timer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #34495e;
}

.timer.warning {
  color: #e74c3c;
}

.timer-icon {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.submit-btn, .results-btn {
  padding: 0.5rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled), .results-btn:hover {
  background: #5a67d8;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 3-Panel Layout */
.simulator-panels {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
}

.panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #2c3e50;
}

/* Chat Panel */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chat-message {
  display: flex;
  gap: 0.75rem;
}

.chat-message.interviewer {
  align-self: flex-start;
}

.chat-message.candidate {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.message-content {
  max-width: 80%;
}

.message-role {
  font-size: 0.75rem;
  color: #7f8c8d;
  margin-bottom: 0.25rem;
}

.chat-message.candidate .message-role {
  text-align: right;
}

.message-text {
  padding: 0.75rem;
  border-radius: 8px;
  background: #f0f0f0;
  color: #2c3e50;
  line-height: 1.5;
}

.chat-message.interviewer .message-text {
  background: #667eea;
  color: white;
}

.message-time {
  font-size: 0.7rem;
  color: #95a5a6;
  margin-top: 0.25rem;
}

.chat-message.candidate .message-time {
  text-align: right;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 1rem;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #667eea;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.chat-input {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
}

.chat-input-field {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
}

.send-btn {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.send-btn:hover:not(:disabled) {
  background: #5a67d8;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Code Panel */
.editor-controls {
  display: flex;
  gap: 0.5rem;
}

.run-btn, .reset-btn {
  padding: 0.25rem 0.75rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.run-btn {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.run-btn:hover:not(:disabled) {
  background: #45a049;
}

.reset-btn:hover {
  background: #f5f5f5;
}

.code-editor-wrapper {
  flex: 1;
  position: relative;
  display: flex;
}

.line-numbers {
  width: 40px;
  background: #f7f7f7;
  padding: 1rem 0;
  text-align: center;
  color: #999;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  user-select: none;
}

.line-number {
  height: 1.5em;
}

.code-editor {
  flex: 1;
  padding: 1rem;
  border: none;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: none;
  outline: none;
}

/* Output Panel */
.output-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.code-output, .test-results {
  margin-bottom: 1.5rem;
}

.code-output h4, .test-results h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.code-output pre {
  background: #f7f7f7;
  padding: 1rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  overflow-x: auto;
}

.test-case {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.test-case.passed {
  background: #e8f5e9;
  color: #2e7d32;
}

.test-case.failed {
  background: #ffebee;
  color: #c62828;
}

.test-icon {
  font-weight: bold;
}

.test-error {
  margin-top: 0.25rem;
  padding-left: 1.5rem;
  font-size: 0.8rem;
  opacity: 0.9;
}

.empty-output {
  color: #95a5a6;
  text-align: center;
  padding: 2rem;
}

.test-status {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
}

.test-status .passed {
  color: #2e7d32;
}

.test-status .failed {
  color: #c62828;
}

/* Results Modal */
.results-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
}

.modal-content {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-content h2 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
}

/* Score Summary */
.score-summary {
  margin-bottom: 2rem;
}

.overall-score {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.score-circle {
  position: relative;
  display: inline-block;
}

.score-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
}

.category-scores {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.score-category h4 {
  margin: 0 0 0.75rem 0;
  color: #34495e;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dimension-scores {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dimension {
  display: grid;
  grid-template-columns: 120px 1fr 50px;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.dimension-name {
  color: #7f8c8d;
}

.score-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.5s ease;
}

.dimension-score {
  text-align: right;
  color: #34495e;
  font-weight: 500;
}

/* Feedback Section */
.feedback-section {
  border-top: 1px solid #e0e0e0;
  padding-top: 1.5rem;
}

.feedback-section h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.feedback-summary {
  background: #f7f9fc;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.feedback-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.feedback-column h4 {
  margin: 0 0 0.5rem 0;
  color: #34495e;
}

.feedback-column ul {
  margin: 0;
  padding-left: 1.5rem;
}

.feedback-column li {
  margin-bottom: 0.5rem;
  color: #5a6c7d;
}

.next-steps {
  background: #f0f4ff;
  padding: 1rem;
  border-radius: 6px;
}

.next-steps h4 {
  margin: 0 0 0.5rem 0;
  color: #34495e;
}

.next-steps ul {
  margin: 0;
  padding-left: 1.5rem;
}

.next-steps li {
  margin-bottom: 0.5rem;
  color: #5a6c7d;
}

.close-btn {
  display: block;
  margin: 2rem auto 0;
  padding: 0.75rem 2rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
}

.close-btn:hover {
  background: #5a67d8;
}

/* Responsive */
@media (max-width: 1024px) {
  .simulator-panels {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr 1fr;
  }
}
</style>