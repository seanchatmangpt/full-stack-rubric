<template>
  <div class="typing-stats">
    <div class="stats-header mb-6">
      <h2 class="text-xl font-semibold mb-2">Your Typing Statistics</h2>
      <p class="text-gray-600 dark:text-gray-400">Track your progress and improvement over time</p>
    </div>

    <!-- Current Session Stats (if active) -->
    <div v-if="currentSession && !currentSession.completed" class="current-session mb-6">
      <h3 class="text-lg font-medium mb-3">Current Session</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="WPM"
          :value="liveData.currentWpm"
          color="blue"
          icon="i-heroicons-clock"
        />
        <StatCard
          title="Accuracy"
          :value="`${liveData.currentAccuracy.toFixed(1)}%`"
          color="green"
          icon="i-heroicons-check-circle"
        />
        <StatCard
          title="Errors"
          :value="liveData.errors.length"
          color="red"
          icon="i-heroicons-x-circle"
        />
        <StatCard
          title="Progress"
          :value="`${Math.round((currentSession.userInput.length / currentSession.targetText.length) * 100)}%`"
          color="purple"
          icon="i-heroicons-chart-bar"
        />
      </div>
    </div>

    <!-- Session History -->
    <div class="session-history">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium">Recent Sessions</h3>
        <div class="flex gap-2">
          <UButton @click="refreshHistory" variant="ghost" size="sm">
            <Icon name="i-heroicons-arrow-path" />
          </UButton>
          <UButton @click="clearHistory" variant="ghost" size="sm" color="red">
            <Icon name="i-heroicons-trash" />
          </UButton>
        </div>
      </div>

      <!-- Stats Overview -->
      <div v-if="sessionHistory.length > 0" class="overview-stats mb-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Average WPM"
            :value="averageStats.wpm"
            color="blue"
            icon="i-heroicons-chart-bar-square"
          />
          <StatCard
            title="Best WPM"
            :value="bestStats.wpm"
            color="green"
            icon="i-heroicons-trophy"
          />
          <StatCard
            title="Average Accuracy"
            :value="`${averageStats.accuracy}%`"
            color="green"
            icon="i-heroicons-check-badge"
          />
          <StatCard
            title="Total Sessions"
            :value="sessionHistory.length"
            color="purple"
            icon="i-heroicons-calendar-days"
          />
        </div>
      </div>

      <!-- Sessions Table -->
      <div v-if="sessionHistory.length > 0" class="sessions-table">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Exercise
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  WPM
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Accuracy
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Errors
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="session in paginatedSessions"
                :key="session.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {{ getExerciseTitle(session.exerciseId) }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ session.targetText.length }} characters
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium" :class="getWpmColorClass(session.stats.wpm)">
                    {{ session.stats.wpm }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium" :class="getAccuracyColorClass(session.stats.accuracy)">
                    {{ session.stats.accuracy.toFixed(1) }}%
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-red-600 dark:text-red-400">
                    {{ session.stats.errors }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ session.stats.duration.toFixed(1) }}s
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(session.timestamp) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <UButton
                    @click="viewSessionDetails(session)"
                    variant="ghost"
                    size="sm"
                  >
                    View
                  </UButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="sessionHistory.length > sessionsPerPage" class="pagination mt-4 flex justify-center">
          <UPagination
            v-model="currentPage"
            :page-count="sessionsPerPage"
            :total="sessionHistory.length"
          />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state text-center py-12">
        <Icon name="i-heroicons-chart-bar" class="mx-auto text-4xl text-gray-400 mb-4" />
        <h3 class="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No typing sessions yet</h3>
        <p class="text-gray-500 mb-4">Start typing to see your statistics and track your progress</p>
      </div>
    </div>

    <!-- Session Details Modal -->
    <UModal v-model="showDetailsModal">
      <UCard v-if="selectedSession">
        <template #header>
          <h3 class="text-lg font-semibold">Session Details</h3>
        </template>

        <div class="space-y-4">
          <!-- Session Info -->
          <div class="session-info">
            <h4 class="font-medium mb-2">Exercise Information</h4>
            <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm">
              <div class="font-medium">{{ getExerciseTitle(selectedSession.exerciseId) }}</div>
              <div class="text-gray-600 dark:text-gray-400 mt-1">
                {{ selectedSession.targetText.substring(0, 100) }}...
              </div>
            </div>
          </div>

          <!-- Detailed Stats -->
          <div class="detailed-stats">
            <h4 class="font-medium mb-2">Performance Metrics</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="stat-detail">
                <div class="text-sm text-gray-600 dark:text-gray-400">Words Per Minute</div>
                <div class="text-xl font-bold text-blue-600">{{ selectedSession.stats.wpm }}</div>
              </div>
              <div class="stat-detail">
                <div class="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
                <div class="text-xl font-bold text-green-600">{{ selectedSession.stats.accuracy.toFixed(1) }}%</div>
              </div>
              <div class="stat-detail">
                <div class="text-sm text-gray-600 dark:text-gray-400">Total Characters</div>
                <div class="text-xl font-bold text-gray-600">{{ selectedSession.stats.totalCharacters }}</div>
              </div>
              <div class="stat-detail">
                <div class="text-sm text-gray-600 dark:text-gray-400">Errors</div>
                <div class="text-xl font-bold text-red-600">{{ selectedSession.stats.errors }}</div>
              </div>
            </div>
          </div>

          <!-- Timing -->
          <div class="timing-info">
            <h4 class="font-medium mb-2">Timing Information</h4>
            <div class="text-sm space-y-1">
              <div><span class="font-medium">Started:</span> {{ formatDateTime(selectedSession.stats.startTime) }}</div>
              <div><span class="font-medium">Completed:</span> {{ formatDateTime(selectedSession.stats.endTime) }}</div>
              <div><span class="font-medium">Duration:</span> {{ selectedSession.stats.duration.toFixed(1) }} seconds</div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton @click="showDetailsModal = false">Close</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { TypingSession } from '~/types/typing'

const { currentSession, liveData, getSessionHistory } = useTypingSession()
const { getExerciseById } = useExerciseStore()

// Local state
const sessionHistory = ref<TypingSession[]>([])
const currentPage = ref(1)
const sessionsPerPage = 10
const showDetailsModal = ref(false)
const selectedSession = ref<TypingSession | null>(null)

// Computed
const paginatedSessions = computed(() => {
  const start = (currentPage.value - 1) * sessionsPerPage
  const end = start + sessionsPerPage
  return sessionHistory.value.slice(start, end)
})

const averageStats = computed(() => {
  if (sessionHistory.value.length === 0) return { wpm: 0, accuracy: 0 }
  
  const totalWpm = sessionHistory.value.reduce((sum, session) => sum + session.stats.wpm, 0)
  const totalAccuracy = sessionHistory.value.reduce((sum, session) => sum + session.stats.accuracy, 0)
  
  return {
    wpm: Math.round(totalWpm / sessionHistory.value.length),
    accuracy: Math.round(totalAccuracy / sessionHistory.value.length)
  }
})

const bestStats = computed(() => {
  if (sessionHistory.value.length === 0) return { wpm: 0, accuracy: 0 }
  
  const bestWpm = Math.max(...sessionHistory.value.map(session => session.stats.wpm))
  const bestAccuracy = Math.max(...sessionHistory.value.map(session => session.stats.accuracy))
  
  return {
    wpm: bestWpm,
    accuracy: Math.round(bestAccuracy)
  }
})

// Methods
const refreshHistory = () => {
  sessionHistory.value = getSessionHistory().sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

const clearHistory = () => {
  if (confirm('Are you sure you want to clear all typing history? This action cannot be undone.')) {
    if (process.client) {
      localStorage.removeItem('typingSessionHistory')
      sessionHistory.value = []
    }
  }
}

const getExerciseTitle = (exerciseId: string) => {
  const exercise = getExerciseById(exerciseId)
  return exercise?.title || 'Unknown Exercise'
}

const getWpmColorClass = (wpm: number) => {
  if (wpm >= 80) return 'text-green-600 dark:text-green-400'
  if (wpm >= 60) return 'text-blue-600 dark:text-blue-400'
  if (wpm >= 40) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

const getAccuracyColorClass = (accuracy: number) => {
  if (accuracy >= 95) return 'text-green-600 dark:text-green-400'
  if (accuracy >= 90) return 'text-blue-600 dark:text-blue-400'
  if (accuracy >= 85) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString()
}

const formatDateTime = (date: Date | null) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

const viewSessionDetails = (session: TypingSession) => {
  selectedSession.value = session
  showDetailsModal.value = true
}

// Initialize
onMounted(() => {
  refreshHistory()
})
</script>

<script>
// StatCard component
const StatCard = {
  props: ['title', 'value', 'color', 'icon'],
  template: `
    <div class="stat-card bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm text-gray-600 dark:text-gray-400">{{ title }}</div>
          <div class="text-2xl font-bold" :class="getValueClass()">{{ value }}</div>
        </div>
        <div class="icon p-2 rounded-full" :class="getIconBgClass()">
          <Icon :name="icon" :class="getIconClass()" />
        </div>
      </div>
    </div>
  `,
  methods: {
    getValueClass() {
      const colorMap = {
        blue: 'text-blue-600 dark:text-blue-400',
        green: 'text-green-600 dark:text-green-400',
        red: 'text-red-600 dark:text-red-400',
        purple: 'text-purple-600 dark:text-purple-400',
        yellow: 'text-yellow-600 dark:text-yellow-400'
      }
      return colorMap[this.color] || 'text-gray-600 dark:text-gray-400'
    },
    getIconBgClass() {
      const bgMap = {
        blue: 'bg-blue-100 dark:bg-blue-900/30',
        green: 'bg-green-100 dark:bg-green-900/30',
        red: 'bg-red-100 dark:bg-red-900/30',
        purple: 'bg-purple-100 dark:bg-purple-900/30',
        yellow: 'bg-yellow-100 dark:bg-yellow-900/30'
      }
      return bgMap[this.color] || 'bg-gray-100 dark:bg-gray-900/30'
    },
    getIconClass() {
      const iconMap = {
        blue: 'text-blue-600 dark:text-blue-400',
        green: 'text-green-600 dark:text-green-400',
        red: 'text-red-600 dark:text-red-400',
        purple: 'text-purple-600 dark:text-purple-400',
        yellow: 'text-yellow-600 dark:text-yellow-400'
      }
      return iconMap[this.color] || 'text-gray-600 dark:text-gray-400'
    }
  }
}

export default {
  components: {
    StatCard
  }
}
</script>