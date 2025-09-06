<template>
  <div class="typing-page min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <!-- Navigation Tabs -->
      <div class="tabs-container mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1">
          <nav class="flex space-x-1">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
            >
              <Icon :name="tab.icon" class="mr-2 h-4 w-4" />
              {{ tab.name }}
            </button>
          </nav>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Exercise Selection Tab -->
        <div v-if="activeTab === 'exercises'" class="exercises-tab">
          <ExerciseSelector @exercise-selected="handleExerciseSelected" />
        </div>

        <!-- Typing Practice Tab -->
        <div v-if="activeTab === 'practice'" class="practice-tab">
          <div v-if="selectedExercise" class="practice-container">
            <!-- Back Button -->
            <div class="mb-4">
              <UButton 
                @click="goBackToExercises" 
                variant="outline" 
                size="sm"
                class="mb-4"
              >
                <Icon name="i-heroicons-arrow-left" class="mr-2" />
                Choose Different Exercise
              </UButton>
            </div>
            
            <!-- Typing Interface -->
            <TypingInterface :exercise="selectedExercise" />
          </div>
          
          <div v-else class="no-exercise-selected text-center py-12">
            <Icon name="i-heroicons-document-text" class="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 class="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No Exercise Selected</h3>
            <p class="text-gray-500 mb-4">Choose an exercise from the exercises tab to start practicing</p>
            <UButton @click="activeTab = 'exercises'">
              Select Exercise
              <Icon name="i-heroicons-arrow-right" class="ml-2" />
            </UButton>
          </div>
        </div>

        <!-- Statistics Tab -->
        <div v-if="activeTab === 'stats'" class="stats-tab">
          <TypingStats />
        </div>
      </div>
    </div>

    <!-- Floating Action Button (Mobile) -->
    <div class="floating-actions fixed bottom-6 right-6 z-50 md:hidden">
      <div class="flex flex-col gap-2">
        <!-- Quick Start Button -->
        <UButton
          v-if="activeTab !== 'practice' || !selectedExercise"
          @click="quickStart"
          class="rounded-full h-12 w-12 shadow-lg"
          color="primary"
        >
          <Icon name="i-heroicons-play" class="h-5 w-5" />
        </UButton>
        
        <!-- Back to Exercises (when in practice without exercise) -->
        <UButton
          v-if="activeTab === 'practice' && !selectedExercise"
          @click="activeTab = 'exercises'"
          class="rounded-full h-12 w-12 shadow-lg"
          variant="outline"
        >
          <Icon name="i-heroicons-document-text" class="h-5 w-5" />
        </UButton>
      </div>
    </div>

    <!-- Keyboard Shortcuts Help -->
    <div class="keyboard-shortcuts fixed bottom-4 left-4 z-40">
      <UButton
        @click="showShortcuts = !showShortcuts"
        variant="ghost"
        size="xs"
        class="text-gray-500 hover:text-gray-700"
      >
        <Icon name="i-heroicons-question-mark-circle" class="mr-1" />
        Shortcuts
      </UButton>
    </div>

    <!-- Shortcuts Modal -->
    <UModal v-model="showShortcuts">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Keyboard Shortcuts</h3>
        </template>

        <div class="space-y-3">
          <div class="shortcut-item flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span class="text-sm text-gray-600 dark:text-gray-400">Switch to Exercises tab</span>
            <kbd class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">Alt + E</kbd>
          </div>
          <div class="shortcut-item flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span class="text-sm text-gray-600 dark:text-gray-400">Switch to Practice tab</span>
            <kbd class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">Alt + P</kbd>
          </div>
          <div class="shortcut-item flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span class="text-sm text-gray-600 dark:text-gray-400">Switch to Statistics tab</span>
            <kbd class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">Alt + S</kbd>
          </div>
          <div class="shortcut-item flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span class="text-sm text-gray-600 dark:text-gray-400">Quick Start Random Exercise</span>
            <kbd class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">Alt + Q</kbd>
          </div>
          <div class="shortcut-item flex justify-between items-center py-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">Focus typing area (in practice)</span>
            <kbd class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">Alt + F</kbd>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton @click="showShortcuts = false">Close</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Exercise } from '~/types/typing'
import ExerciseSelector from '~/components/typing/ExerciseSelector.vue'
import TypingInterface from '~/components/typing/TypingInterface.vue'
import TypingStats from '~/components/typing/TypingStats.vue'

// SEO and meta
useHead({
  title: 'Typing Tutor - Practice and Improve Your Typing Skills',
  meta: [
    {
      name: 'description',
      content: 'Practice typing with our interactive typing tutor. Track your WPM, accuracy, and progress with various exercises for all skill levels.'
    }
  ]
})

const { getRandomExercise } = useExerciseStore()

// Local state
const activeTab = ref<'exercises' | 'practice' | 'stats'>('exercises')
const selectedExercise = ref<Exercise | null>(null)
const showShortcuts = ref(false)

// Tab configuration
const tabs = [
  {
    id: 'exercises',
    name: 'Exercises',
    icon: 'i-heroicons-document-text'
  },
  {
    id: 'practice',
    name: 'Practice',
    icon: 'i-heroicons-pencil'
  },
  {
    id: 'stats',
    name: 'Statistics',
    icon: 'i-heroicons-chart-bar'
  }
]

// Methods
const handleExerciseSelected = (exercise: Exercise) => {
  selectedExercise.value = exercise
  activeTab.value = 'practice'
}

const goBackToExercises = () => {
  activeTab.value = 'exercises'
}

const quickStart = () => {
  const randomExercise = getRandomExercise()
  handleExerciseSelected(randomExercise)
}

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (!event.altKey) return

  switch (event.key.toLowerCase()) {
    case 'e':
      event.preventDefault()
      activeTab.value = 'exercises'
      break
    case 'p':
      event.preventDefault()
      activeTab.value = 'practice'
      break
    case 's':
      event.preventDefault()
      activeTab.value = 'stats'
      break
    case 'q':
      event.preventDefault()
      quickStart()
      break
    case 'f':
      if (activeTab.value === 'practice') {
        event.preventDefault()
        // Focus the Monaco editor (handled by the TypingInterface component)
        const editorElement = document.querySelector('.monaco-editor textarea') as HTMLTextAreaElement
        if (editorElement) {
          editorElement.focus()
        }
      }
      break
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  
  // Check for saved exercise selection
  if (process.client) {
    const savedExerciseId = localStorage.getItem('lastSelectedExercise')
    if (savedExerciseId) {
      const { getExerciseById } = useExerciseStore()
      const exercise = getExerciseById(savedExerciseId)
      if (exercise) {
        selectedExercise.value = exercise
      }
    }
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Watch for exercise changes and save to localStorage
watch(selectedExercise, (exercise) => {
  if (process.client && exercise) {
    localStorage.setItem('lastSelectedExercise', exercise.id)
  }
})

// Auto-focus on practice tab when exercise is selected
watch(activeTab, (newTab) => {
  if (newTab === 'practice') {
    nextTick(() => {
      // Small delay to allow the component to render
      setTimeout(() => {
        const editorElement = document.querySelector('.monaco-editor textarea') as HTMLTextAreaElement
        if (editorElement) {
          editorElement.focus()
        }
      }, 100)
    })
  }
})
</script>

<style scoped>
.typing-page {
  min-height: 100vh;
}

.container {
  max-width: 1200px;
}

.tab-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Floating action button animations */
.floating-actions {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .tabs-container {
    overflow-x: auto;
  }
  
  .tabs-container nav {
    white-space: nowrap;
  }
}

/* Keyboard shortcut styling */
kbd {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.75rem;
  font-weight: 600;
}
</style>