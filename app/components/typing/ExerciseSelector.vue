<template>
  <div class="exercise-selector">
    <div class="header mb-6">
      <h1 class="text-2xl font-bold mb-2">Choose Your Typing Exercise</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Select an exercise based on your skill level and interests
      </p>
    </div>

    <!-- Filters -->
    <div class="filters mb-6 space-y-4">
      <div class="flex flex-wrap gap-4">
        <!-- Difficulty Filter -->
        <div class="filter-group">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Difficulty
          </label>
          <USelect
            v-model="selectedDifficulty"
            :options="difficultyOptions"
            placeholder="All Levels"
            class="w-40"
          />
        </div>

        <!-- Category Filter -->
        <div class="filter-group">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <USelect
            v-model="selectedCategory"
            :options="categoryOptions"
            placeholder="All Categories"
            class="w-40"
          />
        </div>

        <!-- Search -->
        <div class="filter-group flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search
          </label>
          <UInput
            v-model="searchQuery"
            placeholder="Search exercises..."
            icon="i-heroicons-magnifying-glass"
            class="w-full"
          />
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="flex gap-2">
        <UButton @click="selectRandomExercise" variant="outline" size="sm">
          <Icon name="i-heroicons-sparkles" class="mr-1" />
          Random Exercise
        </UButton>
        <UButton @click="clearFilters" variant="ghost" size="sm">
          <Icon name="i-heroicons-x-mark" class="mr-1" />
          Clear Filters
        </UButton>
      </div>
    </div>

    <!-- Exercise Grid -->
    <div class="exercise-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <div
        v-for="exercise in filteredExercises"
        :key="exercise.id"
        class="exercise-card cursor-pointer"
        @click="selectExercise(exercise)"
      >
        <UCard 
          class="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          :class="{ 'ring-2 ring-blue-500': selectedExerciseId === exercise.id }"
        >
          <template #header>
            <div class="flex justify-between items-start">
              <h3 class="font-semibold text-lg line-clamp-2">{{ exercise.title }}</h3>
              <UBadge :color="getDifficultyColor(exercise.difficulty)" variant="soft">
                {{ exercise.difficulty }}
              </UBadge>
            </div>
          </template>

          <div class="space-y-3">
            <!-- Preview Text -->
            <div class="text-preview bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm font-mono line-clamp-3 h-20">
              {{ exercise.text.substring(0, 120) }}{{ exercise.text.length > 120 ? '...' : '' }}
            </div>

            <!-- Exercise Info -->
            <div class="flex justify-between items-center text-sm">
              <div class="flex items-center gap-2">
                <UBadge variant="outline" size="xs">{{ exercise.category }}</UBadge>
                <span v-if="exercise.language" class="text-gray-500">{{ exercise.language }}</span>
              </div>
              <div class="text-gray-500">
                {{ exercise.text.length }} chars
              </div>
            </div>

            <!-- Tags -->
            <div class="flex flex-wrap gap-1">
              <UBadge
                v-for="tag in exercise.tags.slice(0, 3)"
                :key="tag"
                variant="soft"
                size="xs"
                class="text-xs"
              >
                {{ tag }}
              </UBadge>
              <span v-if="exercise.tags.length > 3" class="text-xs text-gray-500">
                +{{ exercise.tags.length - 3 }} more
              </span>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-between items-center">
              <div class="text-sm text-gray-500">
                {{ getEstimatedTime(exercise.text.length) }} min
              </div>
              <UButton 
                size="sm"
                :disabled="selectedExerciseId === exercise.id"
              >
                {{ selectedExerciseId === exercise.id ? 'Selected' : 'Start Typing' }}
              </UButton>
            </div>
          </template>
        </UCard>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredExercises.length === 0" class="empty-state text-center py-12">
      <Icon name="i-heroicons-magnifying-glass" class="mx-auto text-4xl text-gray-400 mb-4" />
      <h3 class="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No exercises found</h3>
      <p class="text-gray-500 mb-4">Try adjusting your filters or search terms</p>
      <UButton @click="clearFilters" variant="outline">Clear all filters</UButton>
    </div>

    <!-- Start Button -->
    <div v-if="selectedExercise" class="start-section sticky bottom-4 bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg border">
      <div class="flex items-center justify-between">
        <div class="exercise-summary">
          <h3 class="font-semibold">{{ selectedExercise.title }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ selectedExercise.difficulty }} • {{ selectedExercise.category }} • {{ selectedExercise.text.length }} characters
          </p>
        </div>
        <UButton @click="startExercise" size="lg" class="px-8">
          Start Exercise
          <Icon name="i-heroicons-arrow-right" class="ml-2" />
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Exercise } from '~/types/typing'

interface Emits {
  (e: 'exercise-selected', exercise: Exercise): void
}

const emit = defineEmits<Emits>()

const { exercises, getExercisesByDifficulty, getExercisesByCategory, getRandomExercise, searchExercises } = useExerciseStore()

// Local state
const selectedExerciseId = ref<string | null>(null)
const selectedDifficulty = ref<string>('')
const selectedCategory = ref<string>('')
const searchQuery = ref('')

// Computed
const selectedExercise = computed(() => 
  selectedExerciseId.value 
    ? exercises.value.find(ex => ex.id === selectedExerciseId.value)
    : null
)

const difficultyOptions = computed(() => [
  { label: 'All Levels', value: '' },
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' }
])

const categoryOptions = computed(() => {
  const categories = [...new Set(exercises.value.map(ex => ex.category))]
  return [
    { label: 'All Categories', value: '' },
    ...categories.map(cat => ({ label: cat, value: cat }))
  ]
})

const filteredExercises = computed(() => {
  let filtered = [...exercises.value]

  // Apply difficulty filter
  if (selectedDifficulty.value) {
    filtered = filtered.filter(ex => ex.difficulty === selectedDifficulty.value)
  }

  // Apply category filter
  if (selectedCategory.value) {
    filtered = filtered.filter(ex => ex.category === selectedCategory.value)
  }

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()
    filtered = filtered.filter(ex => 
      ex.title.toLowerCase().includes(query) ||
      ex.category.toLowerCase().includes(query) ||
      ex.text.toLowerCase().includes(query) ||
      ex.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  return filtered
})

// Methods
const selectExercise = (exercise: Exercise) => {
  selectedExerciseId.value = exercise.id
}

const startExercise = () => {
  if (selectedExercise.value) {
    emit('exercise-selected', selectedExercise.value)
  }
}

const selectRandomExercise = () => {
  const randomExercise = getRandomExercise()
  selectExercise(randomExercise)
}

const clearFilters = () => {
  selectedDifficulty.value = ''
  selectedCategory.value = ''
  searchQuery.value = ''
}

const getDifficultyColor = (difficulty: Exercise['difficulty']) => {
  switch (difficulty) {
    case 'beginner': return 'green'
    case 'intermediate': return 'yellow'
    case 'advanced': return 'red'
    default: return 'gray'
  }
}

const getEstimatedTime = (characterCount: number) => {
  // Rough estimation: average typing speed is about 40 WPM
  // 5 characters per word, so 200 characters per minute
  return Math.max(1, Math.ceil(characterCount / 200))
}

// Auto-select first exercise
onMounted(() => {
  if (exercises.value.length > 0 && !selectedExerciseId.value) {
    selectedExerciseId.value = exercises.value[0].id
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.text-preview {
  overflow-wrap: break-word;
  white-space: pre-wrap;
}

.exercise-card:hover {
  transform: translateY(-2px);
}

.start-section {
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.95);
}

.dark .start-section {
  background-color: rgba(17, 24, 39, 0.95);
}
</style>