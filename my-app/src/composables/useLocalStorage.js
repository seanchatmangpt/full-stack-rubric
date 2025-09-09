import { ref, watch } from 'vue'

/**
 * LocalStorage composable
 * @param {string} key - Storage key
 * @param {string} defaultValue - Default value if key doesn't exist
 * @returns {Object} Storage value and methods
 */
export function useLocalStorage(key, defaultValue = '') {
  /**
   * Get initial value from localStorage
   * @returns {string} Stored value or default
   */
  function getStoredValue() {
    try {
      const item = window.localStorage.getItem(key)
      return item ? item : defaultValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return defaultValue
    }
  }
  
  /**
   * Reactive storage value
   * @type {import('vue').Ref<string>}
   */
  const value = ref(getStoredValue())
  
  /**
   * Set value in localStorage
   * @param {string} newValue - Value to store
   */
  function setValue(newValue) {
    try {
      value.value = newValue
      window.localStorage.setItem(key, newValue)
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }
  
  /**
   * Clear value from localStorage
   */
  function clear() {
    try {
      value.value = defaultValue
      window.localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }
  
  // Watch for changes and sync to localStorage
  watch(value, (newValue) => {
    setValue(newValue)
  }, { immediate: false })
  
  return {
    value,
    setValue,
    clear
  }
}