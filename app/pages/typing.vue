<template>
  <div class="container mx-auto py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-8 text-center">Typing Tutor</h1>
      
      <!-- Statistics Panel -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white p-4 rounded-lg shadow">
          <div class="text-sm text-gray-600">WPM</div>
          <div class="text-2xl font-bold text-blue-600">{{ wpm }}</div>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <div class="text-sm text-gray-600">Accuracy</div>
          <div class="text-2xl font-bold text-green-600">{{ accuracy.toFixed(1) }}%</div>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <div class="text-sm text-gray-600">Errors</div>
          <div class="text-2xl font-bold text-red-600">{{ errors }}</div>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <div class="text-sm text-gray-600">Progress</div>
          <div class="text-2xl font-bold">{{ progress.toFixed(0) }}% complete</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div 
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>

      <!-- Code Display -->
      <div class="bg-gray-900 text-gray-100 p-6 rounded-lg font-mono text-lg mb-6 overflow-auto">
        <pre><code v-html="highlightedText"></code></pre>
      </div>

      <!-- Input Area -->
      <div class="mb-6">
        <textarea
          v-model="userInput"
          @input="handleInput"
          @keydown="handleKeydown"
          class="w-full h-32 p-4 border border-gray-300 rounded-lg font-mono text-lg resize-none"
          placeholder="Start typing here..."
          :disabled="isComplete"
        ></textarea>
      </div>

      <!-- Control Buttons -->
      <div class="flex gap-4 justify-center">
        <UButton @click="resetExercise" variant="outline">
          Reset
        </UButton>
        <UButton @click="nextExercise" :disabled="!isComplete">
          Next Exercise
        </UButton>
      </div>
    </div>

    <!-- Completion Modal -->
    <UModal v-model="showModal">
      <UCard>
        <template #header>
          <h3 class="text-xl font-bold">Exercise Complete!</h3>
        </template>
        
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-blue-600">{{ finalWpm }}</div>
              <div class="text-sm text-gray-600">Final WPM</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-green-600">{{ finalAccuracy.toFixed(1) }}%</div>
              <div class="text-sm text-gray-600">Final Accuracy</div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton variant="outline" @click="nextExercise">Next Exercise</UButton>
            <UButton @click="showModal = false">Close</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

// Reactive data
const userInput = ref('')
const targetText = ref('')
const startTime = ref(null)
const endTime = ref(null)
const errors = ref(0)
const showModal = ref(false)
const currentExercise = ref(null)

// Sample exercises
const exercises = [
  {
    title: 'Basic JavaScript',
    description: 'Simple variable declarations and functions',
    difficulty: 'easy',
    category: 'javascript',
    language: 'javascript',
    code: 'const message = "Hello World";\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}'
  },
  {
    title: 'Array Methods',
    description: 'Working with JavaScript array methods',
    difficulty: 'medium',
    category: 'javascript',
    language: 'javascript',
    code: 'const numbers = [1, 2, 3, 4, 5];\nconst doubled = numbers.map(n => n * 2);\nconst sum = numbers.reduce((acc, n) => acc + n, 0);'
  },
  {
    title: 'Async Operations',
    description: 'Promise and async/await patterns',
    difficulty: 'hard',
    category: 'javascript',
    language: 'javascript',
    code: 'async function fetchData(url) {\n  try {\n    const response = await fetch(url);\n    return await response.json();\n  } catch (error) {\n    console.error("Error:", error);\n  }\n}'
  }
]

// Computed properties
const wpm = computed(() => {
  if (!startTime.value) return 0
  
  const timeElapsed = (Date.now() - startTime.value) / 1000 / 60 // minutes
  const wordsTyped = userInput.value.trim().split(/\s+/).length
  
  return timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0
})

const accuracy = computed(() => {
  if (userInput.value.length === 0) return 100
  
  const correct = userInput.value.split('').reduce((acc, char, index) => {
    return char === targetText.value[index] ? acc + 1 : acc
  }, 0)
  
  return (correct / userInput.value.length) * 100
})

const progress = computed(() => {
  if (targetText.value.length === 0) return 0
  return Math.min((userInput.value.length / targetText.value.length) * 100, 100)
})

const isComplete = computed(() => {
  return userInput.value === targetText.value && userInput.value.length > 0
})

const finalWpm = computed(() => {
  if (!endTime.value || !startTime.value) return wpm.value
  
  const timeElapsed = (endTime.value - startTime.value) / 1000 / 60 // minutes
  const wordsTyped = targetText.value.trim().split(/\s+/).length
  
  return timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0
})

const finalAccuracy = computed(() => accuracy.value)

const highlightedText = computed(() => {
  if (!targetText.value) return ''
  
  return targetText.value.split('').map((char, index) => {
    if (index < userInput.value.length) {
      const userChar = userInput.value[index]
      if (userChar === char) {
        return `<span class="text-green-600">${char}</span>`
      } else {
        return `<span class="text-red-600">${char}</span>`
      }
    } else if (index === userInput.value.length) {
      return `<span class="bg-blue-200 dark:bg-blue-800">${char}</span>`
    }
    return char
  }).join('')
})

// Methods
function handleInput(event) {
  if (!startTime.value) {
    startTime.value = Date.now()
  }
  
  // Count errors
  let currentErrors = 0
  for (let i = 0; i < userInput.value.length; i++) {
    if (userInput.value[i] !== targetText.value[i]) {
      currentErrors++
    }
  }
  errors.value = currentErrors
}

function handleKeydown(event) {
  // Handle special keys like backspace, tab, etc.
  if (event.key === 'Tab') {
    event.preventDefault()
    const start = event.target.selectionStart
    const end = event.target.selectionEnd
    
    userInput.value = userInput.value.substring(0, start) + '  ' + userInput.value.substring(end)
    event.target.selectionStart = event.target.selectionEnd = start + 2
  }
}

function resetExercise() {
  userInput.value = ''
  startTime.value = null
  endTime.value = null
  errors.value = 0
  showModal.value = false
}

function nextExercise() {
  const currentIndex = exercises.findIndex(ex => ex === currentExercise.value)
  const nextIndex = (currentIndex + 1) % exercises.length
  
  currentExercise.value = exercises[nextIndex]
  targetText.value = currentExercise.value.code
  resetExercise()
}

// Watch for completion
watch(isComplete, (newValue) => {
  if (newValue && !endTime.value) {
    endTime.value = Date.now()
    showModal.value = true
  }
})

// Initialize
onMounted(() => {
  currentExercise.value = exercises[0]
  targetText.value = currentExercise.value.code
})
</script>