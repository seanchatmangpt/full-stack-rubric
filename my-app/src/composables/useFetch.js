import { ref } from 'vue'

/**
 * Fetch composable
 * @param {string} url - URL to fetch
 * @returns {Object} Fetch state and methods
 */
export function useFetch(url) {
  /**
   * Fetched data
   * @type {import('vue').Ref<any>}
   */
  const data = ref(null)
  
  /**
   * Loading state
   * @type {import('vue').Ref<boolean>}
   */
  const loading = ref(false)
  
  /**
   * Error state
   * @type {import('vue').Ref<string|null>}
   */
  const error = ref(null)
  
  /**
   * Execute fetch request
   * @param {string} [customUrl] - Optional custom URL to override default
   * @returns {Promise<any>} Fetch promise
   */
  async function execute(customUrl = null) {
    const targetUrl = customUrl || url
    
    if (!targetUrl) {
      error.value = 'No URL provided'
      return
    }
    
    loading.value = true
    error.value = null
    data.value = null
    
    try {
      const response = await fetch(targetUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      data.value = result
      return result
      
    } catch (err) {
      error.value = err.message || 'An error occurred while fetching data'
      console.error('Fetch error:', err)
      throw err
      
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Reset fetch state
   */
  function reset() {
    data.value = null
    loading.value = false
    error.value = null
  }
  
  return {
    data,
    loading,
    error,
    execute,
    reset
  }
}