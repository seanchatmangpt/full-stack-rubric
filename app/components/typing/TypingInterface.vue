<template>
  <div class="typing-interface">
    <!-- Stats Header -->
    <div class="stats-header bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div class="stat-item">
          <div class="text-2xl font-bold text-blue-600">{{ liveData.currentWpm }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">WPM</div>
        </div>
        <div class="stat-item">
          <div class="text-2xl font-bold text-green-600">{{ liveData.currentAccuracy.toFixed(1) }}%</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
        </div>
        <div class="stat-item">
          <div class="text-2xl font-bold text-red-600">{{ liveData.errors.length }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Errors</div>
        </div>
        <div class="stat-item">
          <div class="text-2xl font-bold text-purple-600">{{ currentSession?.stats.duration.toFixed(1) || 0 }}s</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Time</div>
        </div>
      </div>
    </div>

    <!-- Exercise Info -->
    <div class="exercise-info mb-4" v-if="currentExercise">
      <h2 class="text-lg font-semibold mb-2">{{ currentExercise.title }}</h2>
      <div class="flex gap-2 mb-2">
        <UBadge :color="getDifficultyColor(currentExercise.difficulty)">{{ currentExercise.difficulty }}</UBadge>
        <UBadge variant="outline">{{ currentExercise.category }}</UBadge>
      </div>
    </div>

    <!-- Text Display with Visual Feedback -->
    <div class="text-display-container relative mb-4">
      <div class="text-display bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 font-mono text-lg leading-relaxed min-h-[200px] focus-within:border-blue-500 transition-colors">
        <div class="relative">
          <span
            v-for="(char, index) in targetText"
            :key="index"
            :class="getCharClass(char, index)"
            class="relative"
          >{{ char === ' ' ? '·' : char }}</span>
          <div
            v-if="showCursor"
            class="cursor absolute w-0.5 h-6 bg-blue-500 animate-pulse"
            :style="cursorStyle"
          ></div>
        </div>
      </div>
    </div>

    <!-- Monaco Editor for Input -->
    <div class="editor-container">
      <div class="mb-2 flex justify-between items-center">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Your typing:</label>
        <div class="text-sm text-gray-500">
          {{ userInput.length }} / {{ targetText.length }} characters
        </div>
      </div>
      <MonacoEditor
        v-model="userInput"
        :lang="getLanguage()"
        :options="editorOptions"
        @update:modelValue="handleInput"
        class="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden focus-within:border-blue-500 transition-colors"
        style="height: 150px;"
      />
    </div>

    <!-- Progress Bar -->
    <div class="progress-container mt-4">
      <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
        <span>Progress</span>
        <span>{{ Math.round((userInput.length / targetText.length) * 100) }}%</span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${Math.min((userInput.length / targetText.length) * 100, 100)}%` }"
        ></div>
      </div>
    </div>

    <!-- Session Complete Modal -->
    <UModal v-model="showCompletionModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Session Complete! 🎉</h3>
        </template>
        
        <div class="space-y-4" v-if="currentSession">
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div class="text-2xl font-bold text-blue-600">{{ currentSession.stats.wpm }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Words Per Minute</div>
            </div>
            <div class="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div class="text-2xl font-bold text-green-600">{{ currentSession.stats.accuracy.toFixed(1) }}%</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
            </div>
            <div class="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div class="text-2xl font-bold text-red-600">{{ currentSession.stats.errors }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Errors</div>
            </div>
            <div class="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div class="text-2xl font-bold text-purple-600">{{ currentSession.stats.duration.toFixed(1) }}s</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Time</div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton variant="outline" @click="startNewSession">Try Another</UButton>
            <UButton @click="showCompletionModal = false">Close</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Exercise } from '~/types/typing'

interface Props {
  exercise: Exercise
}

const props = defineProps<Props>()

const { currentSession, liveData, startSession, updateUserInput, completeSession, resetSession } = useTypingSession()

// Local state
const userInput = ref('')
const targetText = computed(() => props.exercise.text)
const currentExercise = computed(() => props.exercise)
const showCompletionModal = ref(false)
const showCursor = ref(true)

// Monaco Editor Options
const editorOptions = computed(() => ({
  theme: 'vs-dark',
  fontSize: 16,
  lineNumbers: 'off',
  wordWrap: 'on',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  renderLineHighlight: 'none',
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  scrollbar: {
    vertical: 'hidden',
    horizontal: 'hidden'
  },
  suggest: { showStatusBar: false },
  quickSuggestions: false,
  parameterHints: { enabled: false },
  ordBasedSuggestions: false,
  wordBasedSuggestions: false,
  occurrencesHighlight: false,
  selectionHighlight: false,
  renderWhitespace: 'selection',
  contextmenu: false
}))

// Computed styles
const cursorStyle = computed(() => {
  const position = liveData.value.currentPosition
  // Approximate character width (this is a rough estimation)
  const charWidth = 9.6 // pixels, depends on font
  const lineHeight = 24 // pixels
  
  // Simple calculation - in real implementation you'd need more sophisticated positioning
  const x = (position * charWidth) % (80 * charWidth) // assuming ~80 chars per line
  const y = Math.floor(position / 80) * lineHeight
  
  return {
    left: `${x}px`,
    top: `${y}px`
  }
})

// Methods
const handleInput = (value: string) => {
  userInput.value = value
  updateUserInput(value)
}

const getCharClass = (char: string, index: number) => {
  const userChar = userInput.value[index]
  const isTyped = index < userInput.value.length
  const isCurrent = index === userInput.value.length
  const isCorrect = isTyped && userChar === char
  const isError = isTyped && userChar !== char

  return {
    'char': true,
    'char-untyped': !isTyped && !isCurrent,
    'char-current': isCurrent,
    'char-correct': isCorrect,
    'char-error': isError,
    'whitespace': char === ' '
  }
}

const getDifficultyColor = (difficulty: Exercise['difficulty']) => {
  switch (difficulty) {
    case 'beginner': return 'green'
    case 'intermediate': return 'yellow'
    case 'advanced': return 'red'
    default: return 'gray'
  }
}

const getLanguage = () => {
  return currentExercise.value?.language || 'plaintext'
}

const startNewSession = () => {
  showCompletionModal.value = false
  resetSession()
  userInput.value = ''
  // You could emit an event here to let parent component handle exercise selection
}

// Watchers
watch(() => currentSession.value?.completed, (completed) => {
  if (completed) {
    showCompletionModal.value = true
  }
})

watch(() => props.exercise, (newExercise) => {
  if (newExercise) {
    resetSession()
    userInput.value = ''
    startSession(newExercise)
  }
}, { immediate: true })

// Cursor blinking
onMounted(() => {
  const blinkInterval = setInterval(() => {
    showCursor.value = !showCursor.value
  }, 500)

  onBeforeUnmount(() => {
    clearInterval(blinkInterval)
  })
})
</script>

<style scoped>
.char {
  @apply inline-block;
  position: relative;
}

.char-untyped {
  @apply text-gray-400 dark:text-gray-600;
}

.char-current {
  @apply bg-blue-200 dark:bg-blue-800;
}

.char-correct {
  @apply text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30;
}

.char-error {
  @apply text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30;
}

.whitespace.char-error {
  @apply bg-red-200 dark:bg-red-900/50;
}

.whitespace.char-correct {
  @apply bg-green-200 dark:bg-green-900/50;
}

.cursor {
  z-index: 10;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.animate-pulse {
  animation: blink 1s infinite;
}
</style>