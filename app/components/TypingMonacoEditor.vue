<template>
  <div class="typing-monaco-container">
    <!-- Performance Metrics Overlay -->
    <div class="metrics-overlay">
      <div class="metrics-row">
        <div class="metric">
          <label>WPM</label>
          <span class="value" :class="getWPMClass(metrics.wpm)">{{ metrics.wpm }}</span>
        </div>
        <div class="metric">
          <label>Accuracy</label>
          <span class="value" :class="getAccuracyClass(metrics.accuracy)">{{ Math.round(metrics.accuracy) }}%</span>
        </div>
        <div class="metric">
          <label>Consistency</label>
          <span class="value">{{ Math.round(metrics.consistency) }}%</span>
        </div>
        <div class="metric" v-if="sessionDuration > 0">
          <label>Time</label>
          <span class="value">{{ formatDuration(sessionDuration) }}</span>
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progressScore}%` }"></div>
      </div>
    </div>

    <!-- Monaco Editor Container -->
    <div class="editor-container" ref="editorContainer">
      <!-- Target text display -->
      <div class="target-text" v-if="targetText">
        <pre>{{ targetText }}</pre>
      </div>
      
      <!-- Monaco Editor will be mounted here -->
      <div class="monaco-editor" ref="monacoContainer"></div>
    </div>

    <!-- Session Controls -->
    <div class="session-controls">
      <button 
        v-if="!isActive" 
        @click="startTypingSession" 
        class="btn-primary"
        :disabled="!targetText"
      >
        Start Typing Session
      </button>
      
      <button 
        v-if="isActive" 
        @click="pauseSession" 
        class="btn-secondary"
      >
        Pause
      </button>
      
      <button 
        v-if="isActive" 
        @click="endTypingSession" 
        class="btn-danger"
      >
        End Session
      </button>
      
      <button 
        @click="resetSession" 
        class="btn-outline"
      >
        Reset
      </button>
    </div>

    <!-- Error Patterns Display -->
    <div class="error-patterns" v-if="metrics.errorPatterns.size > 0">
      <h4>Common Errors</h4>
      <div class="error-list">
        <div 
          v-for="[pattern, count] of Array.from(metrics.errorPatterns.entries()).slice(0, 5)" 
          :key="pattern"
          class="error-item"
        >
          <span class="pattern">{{ pattern }}</span>
          <span class="count">{{ count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// @ts-nocheck
/**
 * @fileoverview Typing Monaco Editor component with real-time metrics
 * Provides a Monaco-based code editor optimized for typing practice
 */
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as monaco from 'monaco-editor'
import { useTypingMetrics } from '../composables/useTypingMetrics'

/**
 * @typedef {Object} Props
 * @property {string} targetText - Text to type
 * @property {string} drillType - Type of drill being performed
 * @property {number} [targetWPM=60] - Target words per minute
 * @property {string} [language='javascript'] - Programming language for syntax highlighting
 */

/** @type {Props} */
const props = withDefaults(defineProps(), {
  targetWPM: 60,
  language: 'javascript'
})

// Composables
const {
  currentSession,
  isActive,
  metrics,
  sessionDuration,
  progressScore,
  startSession,
  endSession,
  pauseSession,
  resumeSession,
  resetSession,
  recordKeystroke
} = useTypingMetrics()

// Template refs
/** @type {import('vue').Ref<HTMLElement|undefined>} */
const editorContainer = ref()
/** @type {import('vue').Ref<HTMLElement|undefined>} */
const monacoContainer = ref()

// Monaco editor instance
/** @type {monaco.editor.IStandaloneCodeEditor | null} */
let editor = null
/** @type {monaco.editor.ITextModel | null} */
let targetTextModel = null
/** @type {monaco.editor.ITextModel | null} */
let userTextModel = null

// Editor state
/** @type {import('vue').Ref<{line: number, column: number}>} */
const currentPosition = ref({ line: 1, column: 1 })
/** @type {import('vue').Ref<string>} */
const completedText = ref('')

// Optimal Monaco configuration for typing
/** @type {monaco.editor.IStandaloneEditorConstructionOptions} */
const MONACO_CONFIG = {
  // Performance optimizations
  wordWrap: 'off',
  lineNumbers: 'on',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  
  // Typing-specific features
  quickSuggestions: false,
  parameterHints: { enabled: false },
  suggestOnTriggerCharacters: false,
  acceptSuggestionOnEnter: 'off',
  tabCompletion: 'off',
  
  // Visual enhancements
  renderLineHighlight: 'gutter',
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
  
  // Disable distracting features
  showUnused: false,
  renderValidationDecorations: 'off',
  
  // Accessibility and readability
  fontSize: 16,
  fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
  lineHeight: 1.5,
  letterSpacing: 0.5,
  
  // Theme
  theme: 'vs-dark',
  
  // Layout
  automaticLayout: true,
  scrollbar: {
    vertical: 'visible',
    horizontal: 'visible'
  }
}

/**
 * Initialize Monaco Editor with optimized configuration
 * @returns {Promise<void>}
 */
async function initializeEditor() {
  if (!monacoContainer.value) return

  // Create text models
  targetTextModel = monaco.editor.createModel(props.targetText, props.language)
  userTextModel = monaco.editor.createModel('', props.language)

  // Create editor instance
  editor = monaco.editor.create(monacoContainer.value, {
    ...MONACO_CONFIG,
    model: userTextModel
  })

  // Setup keystroke monitoring
  setupKeystrokeMonitoring()
  
  // Setup real-time feedback decorations
  setupRealTimeFeedback()
}

/**
 * Setup keystroke monitoring for typing metrics
 * @returns {void}
 */
function setupKeystrokeMonitoring() {
  if (!editor || !targetTextModel) return

  editor.onDidChangeModelContent((e) => {
    if (!isActive.value) return

    // Process each content change
    e.changes.forEach(change => {
      const position = { 
        line: change.range.startLineNumber, 
        column: change.range.startColumn 
      }
      
      // Get expected character at this position
      const targetLines = targetTextModel!.getLinesContent()
      const expectedChar = getExpectedCharAt(targetLines, position)
      
      // Record each character typed
      if (change.text) {
        for (const char of change.text) {
          recordKeystroke(char, expectedChar || '', position)
        }
      }
    })

    // Update visual feedback
    updateTypingFeedback()
  })

  // Handle special keys (backspace, delete, etc.)
  editor.onKeyDown((e) => {
    if (!isActive.value) return

    const position = editor!.getPosition()
    if (!position) return

    const positionData = { line: position.lineNumber, column: position.column }

    if (e.keyCode === monaco.KeyCode.Backspace) {
      recordKeystroke('Backspace', '', positionData)
    } else if (e.keyCode === monaco.KeyCode.Delete) {
      recordKeystroke('Delete', '', positionData)
    }
  })
}

/**
 * Setup real-time visual feedback with decorations
 * @returns {void}
 */
function setupRealTimeFeedback() {
  if (!editor) return

  // Custom decorations for correct/incorrect typing
  /** @type {string[]} */
  let currentDecorations = []

  /**
   * Update typing decorations based on user input
   * @returns {void}
   */
  const updateDecorations = () => {
    if (!editor || !targetTextModel || !userTextModel) return

    const userText = userTextModel.getValue()
    const targetText = targetTextModel.getValue()
    /** @type {monaco.editor.IModelDeltaDecoration[]} */
    const decorations = []

    // Compare user input with target text
    for (let i = 0; i < Math.max(userText.length, targetText.length); i++) {
      const userChar = userText[i] || ''
      const targetChar = targetText[i] || ''
      
      if (i < userText.length) {
        const position = userTextModel.getPositionAt(i)
        const isCorrect = userChar === targetChar
        
        decorations.push({
          range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column + 1),
          options: {
            className: isCorrect ? 'correct-char' : 'incorrect-char',
            minimap: {
              color: isCorrect ? '#22c55e' : '#ef4444',
              position: monaco.editor.MinimapPosition.Inline
            }
          }
        })
      }
    }

    currentDecorations = editor.deltaDecorations(currentDecorations, decorations)
  }

  // Update decorations on content changes
  if (userTextModel) {
    userTextModel.onDidChangeContent(updateDecorations)
  }
}

/**
 * Get expected character at given position
 * @param {string[]} lines - Text lines
 * @param {{line: number, column: number}} position - Position in text
 * @returns {string} Expected character
 */
function getExpectedCharAt(lines, position) {
  if (position.line > lines.length) return ''
  
  const line = lines[position.line - 1] || ''
  if (position.column > line.length) {
    // If at end of line, next expected char is newline
    return position.line < lines.length ? '\n' : ''
  }
  
  return line[position.column - 1] || ''
}

/**
 * Update typing feedback and progress
 * @returns {void}
 */
function updateTypingFeedback() {
  if (!editor || !userTextModel || !targetTextModel) return

  const userText = userTextModel.getValue()
  const targetText = targetTextModel.getValue()
  
  // Update completion percentage
  const completion = Math.min((userText.length / targetText.length) * 100, 100)
  
  // Check if session should auto-complete
  if (userText === targetText && isActive.value) {
    // Auto-end session when text is perfectly matched
    setTimeout(() => {
      endTypingSession()
    }, 500) // Small delay to register final keystrokes
  }
}

/**
 * Start a new typing session
 * @returns {void}
 */
function startTypingSession() {
  startSession(props.drillType, props.targetWPM)
  
  // Clear editor and focus
  if (editor && userTextModel) {
    userTextModel.setValue('')
    editor.focus()
  }
}

/**
 * End the current typing session
 * @returns {void}
 */
function endTypingSession() {
  const session = endSession()
  
  if (session) {
    // Emit session results
    emit('sessionCompleted', session)
  }
}

/**
 * Get CSS class for WPM display based on performance
 * @param {number} wpm - Words per minute
 * @returns {string} CSS class name
 */
function getWPMClass(wpm) {
  if (wpm >= props.targetWPM) return 'excellent'
  if (wpm >= props.targetWPM * 0.8) return 'good'
  if (wpm >= props.targetWPM * 0.6) return 'fair'
  return 'needs-improvement'
}

/**
 * Get CSS class for accuracy display based on performance
 * @param {number} accuracy - Accuracy percentage
 * @returns {string} CSS class name
 */
function getAccuracyClass(accuracy) {
  if (accuracy >= 97) return 'excellent'
  if (accuracy >= 90) return 'good'
  if (accuracy >= 80) return 'fair'
  return 'needs-improvement'
}

/**
 * Format duration in milliseconds to readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  return `${remainingSeconds}s`
}

/**
 * @typedef {Object} EmitEvents
 * @property {function(import('../composables/useTypingMetrics').PerformanceSession): void} sessionCompleted - Emitted when typing session completes
 */

// Emits
const emit = defineEmits(['sessionCompleted'])

// Lifecycle
onMounted(async () => {
  await nextTick()
  await initializeEditor()
})

onUnmounted(() => {
  if (editor) {
    editor.dispose()
  }
  if (targetTextModel) {
    targetTextModel.dispose()
  }
  if (userTextModel) {
    userTextModel.dispose()
  }
})

/**
 * Watch for target text changes and update Monaco model
 */
watch(() => props.targetText, (newText) => {
  if (targetTextModel && newText) {
    targetTextModel.setValue(newText)
  }
})
</script>

<style scoped>
.typing-monaco-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 600px;
  border: 1px solid #374151;
  border-radius: 8px;
  overflow: hidden;
  background: #1f2937;
}

.metrics-overlay {
  background: linear-gradient(90deg, #374151 0%, #4b5563 100%);
  padding: 12px 16px;
  border-bottom: 1px solid #4b5563;
  color: white;
}

.metrics-row {
  display: flex;
  gap: 24px;
  margin-bottom: 8px;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}

.metric label {
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 600;
  color: #9ca3af;
  margin-bottom: 2px;
}

.metric .value {
  font-size: 18px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
}

.metric .value.excellent { color: #22c55e; }
.metric .value.good { color: #84cc16; }
.metric .value.fair { color: #eab308; }
.metric .value.needs-improvement { color: #ef4444; }

.progress-bar {
  height: 4px;
  background: #374151;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #22c55e);
  transition: width 0.3s ease;
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.target-text {
  background: #111827;
  border-bottom: 1px solid #374151;
  padding: 12px 16px;
  max-height: 120px;
  overflow-y: auto;
}

.target-text pre {
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  color: #9ca3af;
  white-space: pre-wrap;
  line-height: 1.5;
}

.monaco-editor {
  flex: 1;
  min-height: 300px;
}

.session-controls {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: #374151;
  border-top: 1px solid #4b5563;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #6b7280;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6b7280;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-outline {
  background: transparent;
  color: #d1d5db;
  border: 1px solid #6b7280;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline:hover {
  background: #374151;
  border-color: #9ca3af;
}

.error-patterns {
  background: #111827;
  padding: 12px 16px;
  border-top: 1px solid #374151;
  color: white;
}

.error-patterns h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #f59e0b;
}

.error-list {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.error-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #374151;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

.error-item .pattern {
  color: #ef4444;
}

.error-item .count {
  background: #ef4444;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

/* Monaco Editor Custom Styles */
:deep(.correct-char) {
  background-color: rgba(34, 197, 94, 0.2) !important;
  border-left: 2px solid #22c55e !important;
}

:deep(.incorrect-char) {
  background-color: rgba(239, 68, 68, 0.2) !important;
  border-left: 2px solid #ef4444 !important;
}
</style>