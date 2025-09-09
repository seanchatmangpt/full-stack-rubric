/**
 * Composable for loading state management
 * 
 * @example
 * const { loading, setLoading, withLoading } = useLoadingStates()
 * await withLoading('api', () => fetchData())
 */

import { ref, reactive, computed, nextTick } from 'vue'

// Global loading states
const loadingStates = reactive({})
const loadingConfig = reactive({
  minDelay: 300, // Minimum loading time to prevent flashing
  debounceDelay: 100, // Debounce rapid state changes
  globalSpinner: true // Show global spinner for any loading
})

// Loading timers for debouncing
const loadingTimers = new Map()
const minDelayTimers = new Map()

/**
 * Set loading state for a specific key
 * @param {string} key - Loading state key
 * @param {boolean} isLoading - Loading state
 * @param {object} options - Loading options
 */
function setLoadingState(key, isLoading, options = {}) {
  const config = { ...loadingConfig, ...options }
  
  // Clear existing timers
  if (loadingTimers.has(key)) {
    clearTimeout(loadingTimers.get(key))
    loadingTimers.delete(key)
  }
  
  if (minDelayTimers.has(key)) {
    clearTimeout(minDelayTimers.get(key))
    minDelayTimers.delete(key)
  }
  
  if (isLoading) {
    // Set loading immediately
    loadingStates[key] = {
      active: true,
      startTime: Date.now(),
      message: options.message || '',
      progress: options.progress || 0,
      variant: options.variant || 'default'
    }
  } else {
    // Handle minimum delay for smooth UX
    const currentState = loadingStates[key]
    if (currentState && config.minDelay > 0) {
      const elapsed = Date.now() - currentState.startTime
      const remaining = Math.max(0, config.minDelay - elapsed)
      
      if (remaining > 0) {
        const timer = setTimeout(() => {
          delete loadingStates[key]
          minDelayTimers.delete(key)
        }, remaining)
        minDelayTimers.set(key, timer)
        return
      }
    }
    
    // Remove loading state immediately
    delete loadingStates[key]
  }
}

/**
 * Debounced loading state setter
 * @param {string} key - Loading state key
 * @param {boolean} isLoading - Loading state
 * @param {object} options - Loading options
 */
function setDebouncedLoading(key, isLoading, options = {}) {
  const config = { ...loadingConfig, ...options }
  
  if (config.debounceDelay > 0) {
    if (loadingTimers.has(key)) {
      clearTimeout(loadingTimers.get(key))
    }
    
    const timer = setTimeout(() => {
      setLoadingState(key, isLoading, options)
      loadingTimers.delete(key)
    }, config.debounceDelay)
    
    loadingTimers.set(key, timer)
  } else {
    setLoadingState(key, isLoading, options)
  }
}

/**
 * Update loading progress
 * @param {string} key - Loading state key
 * @param {number} progress - Progress value (0-100)
 * @param {string} message - Optional message update
 */
function updateProgress(key, progress, message) {
  const state = loadingStates[key]
  if (state) {
    state.progress = Math.max(0, Math.min(100, progress))
    if (message) state.message = message
  }
}

/**
 * Update loading message
 * @param {string} key - Loading state key
 * @param {string} message - New message
 */
function updateMessage(key, message) {
  const state = loadingStates[key]
  if (state) {
    state.message = message
  }
}

/**
 * Loading state composable for a specific key
 * @param {string} key - Loading state key
 * @param {object} options - Default options
 * @returns {object} Loading state utilities
 */
function useLoadingState(key, options = {}) {
  const isLoading = computed(() => Boolean(loadingStates[key]?.active))
  const loadingData = computed(() => loadingStates[key] || {})
  const progress = computed(() => loadingData.value.progress || 0)
  const message = computed(() => loadingData.value.message || '')
  
  return {
    isLoading,
    loading: isLoading, // Alias
    loadingData,
    progress,
    message,
    
    /**
     * Set loading state
     * @param {boolean} loading - Loading state
     * @param {object} opts - Loading options
     */
    setLoading(loading, opts = {}) {
      setLoadingState(key, loading, { ...options, ...opts })
    },
    
    /**
     * Start loading
     * @param {object} opts - Loading options
     */
    startLoading(opts = {}) {
      setLoadingState(key, true, { ...options, ...opts })
    },
    
    /**
     * Stop loading
     */
    stopLoading() {
      setLoadingState(key, false, options)
    },
    
    /**
     * Update progress
     * @param {number} prog - Progress value (0-100)
     * @param {string} msg - Optional message
     */
    updateProgress(prog, msg) {
      updateProgress(key, prog, msg)
    },
    
    /**
     * Update message
     * @param {string} msg - New message
     */
    updateMessage(msg) {
      updateMessage(key, msg)
    },
    
    /**
     * Execute function with loading state
     * @param {Function} fn - Function to execute
     * @param {object} opts - Loading options
     * @returns {Promise} Promise result
     */
    async withLoading(fn, opts = {}) {
      try {
        setLoadingState(key, true, { ...options, ...opts })
        const result = await fn()
        return result
      } finally {
        setLoadingState(key, false, options)
      }
    }
  }
}

/**
 * Multiple loading states manager
 * @param {Array<string>} keys - Array of loading state keys
 * @param {object} options - Default options
 * @returns {object} Multiple loading state utilities
 */
function useMultipleLoadingStates(keys, options = {}) {
  const states = reactive({})
  
  // Initialize states
  keys.forEach(key => {
    states[key] = useLoadingState(key, options)
  })
  
  const anyLoading = computed(() => 
    keys.some(key => loadingStates[key]?.active)
  )
  
  const allLoading = computed(() => 
    keys.every(key => loadingStates[key]?.active)
  )
  
  const loadingCount = computed(() => 
    keys.filter(key => loadingStates[key]?.active).length
  )
  
  return {
    states,
    anyLoading,
    allLoading,
    loadingCount,
    
    /**
     * Set loading for specific keys
     * @param {string|Array} keyOrKeys - Key or array of keys
     * @param {boolean} loading - Loading state
     * @param {object} opts - Loading options
     */
    setLoading(keyOrKeys, loading, opts = {}) {
      const targetKeys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys]
      targetKeys.forEach(key => {
        if (states[key]) {
          states[key].setLoading(loading, opts)
        }
      })
    },
    
    /**
     * Start loading for all keys
     * @param {object} opts - Loading options
     */
    startAll(opts = {}) {
      keys.forEach(key => states[key].startLoading(opts))
    },
    
    /**
     * Stop loading for all keys
     */
    stopAll() {
      keys.forEach(key => states[key].stopLoading())
    }
  }
}

/**
 * Sequential loading manager for multi-step operations
 * @param {Array<object>} steps - Array of step configurations
 * @param {object} options - Loading options
 * @returns {object} Sequential loading utilities
 */
function useSequentialLoading(steps, options = {}) {
  const currentStep = ref(-1)
  const isActive = computed(() => currentStep.value >= 0)
  const currentStepData = computed(() => 
    steps[currentStep.value] || {}
  )
  
  /**
   * Start sequential loading
   * @param {number} startIndex - Starting step index
   */
  async function start(startIndex = 0) {
    currentStep.value = startIndex
    
    if (steps[startIndex]) {
      setLoadingState('sequential', true, {
        message: steps[startIndex].message || `Step ${startIndex + 1}`,
        progress: ((startIndex + 1) / steps.length) * 100,
        ...options
      })
    }
  }
  
  /**
   * Move to next step
   * @param {object} opts - Step options
   */
  async function nextStep(opts = {}) {
    const nextIndex = currentStep.value + 1
    
    if (nextIndex < steps.length) {
      currentStep.value = nextIndex
      const step = steps[nextIndex]
      
      updateProgress('sequential', 
        ((nextIndex + 1) / steps.length) * 100,
        opts.message || step.message || `Step ${nextIndex + 1}`
      )
    } else {
      // All steps completed
      setLoadingState('sequential', false)
      currentStep.value = -1
    }
  }
  
  /**
   * Skip to specific step
   * @param {number} stepIndex - Target step index
   * @param {object} opts - Step options
   */
  function goToStep(stepIndex, opts = {}) {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      currentStep.value = stepIndex
      const step = steps[stepIndex]
      
      updateProgress('sequential', 
        ((stepIndex + 1) / steps.length) * 100,
        opts.message || step.message || `Step ${stepIndex + 1}`
      )
    }
  }
  
  /**
   * Complete sequential loading
   * @param {object} opts - Completion options
   */
  function complete(opts = {}) {
    if (opts.message) {
      updateMessage('sequential', opts.message)
    }
    
    // Brief completion state
    setTimeout(() => {
      setLoadingState('sequential', false)
      currentStep.value = -1
    }, 500)
  }
  
  /**
   * Cancel sequential loading
   */
  function cancel() {
    setLoadingState('sequential', false)
    currentStep.value = -1
  }
  
  return {
    isActive,
    currentStep: readonly(currentStep),
    currentStepData,
    steps,
    
    start,
    nextStep,
    goToStep,
    complete,
    cancel,
    
    /**
     * Execute steps sequentially with loading
     * @param {Array<Function>} stepFunctions - Array of step functions
     * @param {object} opts - Execution options
     * @returns {Promise} Execution result
     */
    async executeSteps(stepFunctions, opts = {}) {
      try {
        await start()
        
        for (let i = 0; i < stepFunctions.length; i++) {
          if (stepFunctions[i]) {
            await stepFunctions[i]()
          }
          
          if (i < stepFunctions.length - 1) {
            await nextStep()
            // Optional delay between steps
            if (opts.stepDelay) {
              await new Promise(resolve => 
                setTimeout(resolve, opts.stepDelay)
              )
            }
          }
        }
        
        complete(opts.completion)
      } catch (error) {
        cancel()
        throw error
      }
    }
  }
}

/**
 * Main loading states composable
 * @param {string} defaultKey - Default loading state key
 * @param {object} options - Default options
 * @returns {object} Loading state utilities
 */
export function useLoadingStates(defaultKey = 'default', options = {}) {
  const globalLoading = computed(() => 
    Object.keys(loadingStates).length > 0
  )
  
  const allLoadingStates = computed(() => loadingStates)
  
  return {
    // Global state
    globalLoading,
    allLoadingStates,
    
    // Configuration
    config: loadingConfig,
    updateConfig(newConfig) {
      Object.assign(loadingConfig, newConfig)
    },
    
    // Core methods
    setLoading(key = defaultKey, loading, opts = {}) {
      setLoadingState(key, loading, { ...options, ...opts })
    },
    
    setDebouncedLoading(key = defaultKey, loading, opts = {}) {
      setDebouncedLoading(key, loading, { ...options, ...opts })
    },
    
    updateProgress,
    updateMessage,
    
    // Factory methods
    createLoadingState: useLoadingState,
    createMultipleStates: useMultipleLoadingStates,
    createSequentialLoading: useSequentialLoading,
    
    // Utility methods
    /**
     * Check if specific key is loading
     * @param {string} key - Loading state key
     * @returns {boolean} True if loading
     */
    isLoading(key) {
      return Boolean(loadingStates[key]?.active)
    },
    
    /**
     * Get loading data for key
     * @param {string} key - Loading state key
     * @returns {object} Loading data
     */
    getLoadingData(key) {
      return loadingStates[key] || {}
    },
    
    /**
     * Clear specific loading state
     * @param {string} key - Loading state key
     */
    clear(key) {
      delete loadingStates[key]
      if (loadingTimers.has(key)) {
        clearTimeout(loadingTimers.get(key))
        loadingTimers.delete(key)
      }
      if (minDelayTimers.has(key)) {
        clearTimeout(minDelayTimers.get(key))
        minDelayTimers.delete(key)
      }
    },
    
    /**
     * Clear all loading states
     */
    clearAll() {
      Object.keys(loadingStates).forEach(key => {
        delete loadingStates[key]
      })
      loadingTimers.forEach(timer => clearTimeout(timer))
      minDelayTimers.forEach(timer => clearTimeout(timer))
      loadingTimers.clear()
      minDelayTimers.clear()
    },
    
    /**
     * Execute function with loading state
     * @param {Function} fn - Function to execute
     * @param {string} key - Loading state key
     * @param {object} opts - Loading options
     * @returns {Promise} Function result
     */
    async withLoading(fn, key = defaultKey, opts = {}) {
      try {
        setLoadingState(key, true, { ...options, ...opts })
        const result = await fn()
        return result
      } finally {
        setLoadingState(key, false, options)
      }
    },
    
    /**
     * Execute multiple functions concurrently with loading
     * @param {Array<Function>} functions - Functions to execute
     * @param {object} opts - Loading options
     * @returns {Promise} Results array
     */
    async withConcurrentLoading(functions, opts = {}) {
      const keys = functions.map((_, i) => `concurrent_${i}`)
      
      try {
        // Start all loading states
        keys.forEach((key, i) => {
          setLoadingState(key, true, {
            message: opts.messages?.[i] || `Task ${i + 1}`,
            ...options,
            ...opts
          })
        })
        
        const results = await Promise.all(functions.map(fn => fn()))
        return results
      } finally {
        // Clear all loading states
        keys.forEach(key => setLoadingState(key, false))
      }
    }
  }
}

export default useLoadingStates