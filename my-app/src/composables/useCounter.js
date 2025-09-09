import { ref, computed } from 'vue'

/**
 * Counter composable
 * @param {number} initialValue - Initial counter value
 * @returns {Object} Counter state and methods
 */
export function useCounter(initialValue = 0) {
  /**
   * Counter value
   * @type {import('vue').Ref<number>}
   */
  const count = ref(initialValue)
  
  /**
   * Double the counter value
   * @type {import('vue').ComputedRef<number>}
   */
  const double = computed(() => count.value * 2)
  
  /**
   * Increment counter
   */
  function increment() {
    count.value++
  }
  
  /**
   * Decrement counter
   */
  function decrement() {
    count.value--
  }
  
  /**
   * Reset counter to initial value
   */
  function reset() {
    count.value = initialValue
  }
  
  return {
    count,
    double,
    increment,
    decrement,
    reset
  }
}