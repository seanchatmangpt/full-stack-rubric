<template>
  <div>
    <h3>Lifecycle Demo</h3>
    
    <div>
      <h4>Component Status</h4>
      <p>Mounted: {{ isMounted }}</p>
      <p>Mount time: {{ mountTime }}</p>
      <p>Current time: {{ currentTime }}</p>
      <p>Seconds alive: {{ secondsAlive }}</p>
    </div>
    
    <div>
      <h4>Watchers Demo</h4>
      <input v-model="watchedValue" placeholder="Type to trigger watcher">
      <p>Value: {{ watchedValue }}</p>
      <p>Value length: {{ watchedValue.length }}</p>
      <p>Change count: {{ changeCount }}</p>
    </div>
    
    <div>
      <h4>Counter with Watcher</h4>
      <button @click="counter++">Increment Counter</button>
      <p>Counter: {{ counter }}</p>
      <p>Counter is even: {{ isCounterEven }}</p>
      <p>Counter history: {{ counterHistory.join(', ') }}</p>
    </div>
    
    <div>
      <h4>Cleanup Demo</h4>
      <button @click="toggleTimer">{{ timerRunning ? 'Stop' : 'Start' }} Timer</button>
      <p>Timer value: {{ timerValue }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, watchEffect, onMounted, onUnmounted, onUpdated } from 'vue'

/**
 * Component mounted state
 * @type {import('vue').Ref<boolean>}
 */
const isMounted = ref(false)

/**
 * Component mount timestamp
 * @type {import('vue').Ref<string>}
 */
const mountTime = ref('')

/**
 * Current time display
 * @type {import('vue').Ref<string>}
 */
const currentTime = ref('')

/**
 * Seconds since component mounted
 * @type {import('vue').Ref<number>}
 */
const secondsAlive = ref(0)

/**
 * Watched input value
 * @type {import('vue').Ref<string>}
 */
const watchedValue = ref('')

/**
 * Count of value changes
 * @type {import('vue').Ref<number>}
 */
const changeCount = ref(0)

/**
 * Simple counter
 * @type {import('vue').Ref<number>}
 */
const counter = ref(0)

/**
 * Counter history array
 * @type {import('vue').Ref<number[]>}
 */
const counterHistory = ref([0])

/**
 * Timer running state
 * @type {import('vue').Ref<boolean>}
 */
const timerRunning = ref(false)

/**
 * Timer value
 * @type {import('vue').Ref<number>}
 */
const timerValue = ref(0)

/**
 * Check if counter is even
 * @type {import('vue').ComputedRef<boolean>}
 */
const isCounterEven = computed(() => counter.value % 2 === 0)

/**
 * Timer interval reference
 * @type {number|null}
 */
let timeInterval = null

/**
 * Timer cleanup reference
 * @type {number|null}}
 */
let timerInterval = null

/**
 * Component mounted lifecycle hook
 */
onMounted(() => {
  console.log('LifecycleDemo component mounted')
  isMounted.value = true
  mountTime.value = new Date().toLocaleTimeString()
  
  // Start time tracking
  timeInterval = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString()
    secondsAlive.value = Math.floor((Date.now() - new Date(mountTime.value).getTime()) / 1000)
  }, 1000)
})

/**
 * Component updated lifecycle hook
 */
onUpdated(() => {
  console.log('LifecycleDemo component updated')
})

/**
 * Component unmounted lifecycle hook
 */
onUnmounted(() => {
  console.log('LifecycleDemo component unmounted')
  
  // Cleanup intervals
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})

/**
 * Watch for changes in watchedValue
 */
watch(watchedValue, (newValue, oldValue) => {
  console.log(`watchedValue changed from "${oldValue}" to "${newValue}"`)
  changeCount.value++
}, { immediate: true })

/**
 * Watch for counter changes and track history
 */
watch(counter, (newValue) => {
  console.log(`Counter changed to: ${newValue}`)
  counterHistory.value.push(newValue)
  
  // Keep only last 10 values
  if (counterHistory.value.length > 10) {
    counterHistory.value.shift()
  }
})

/**
 * Watch effect for automatic dependency tracking
 */
watchEffect(() => {
  if (counter.value > 10) {
    console.log('Counter exceeded 10!')
  }
})

/**
 * Toggle timer on/off
 */
function toggleTimer() {
  if (timerRunning.value) {
    // Stop timer
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    timerRunning.value = false
  } else {
    // Start timer
    timerInterval = setInterval(() => {
      timerValue.value++
    }, 100)
    timerRunning.value = true
  }
}
</script>