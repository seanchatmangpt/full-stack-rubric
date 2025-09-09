/**
 * Integration utilities composable
 * Provides global state management and event coordination patterns
 * @module useIntegration
 */

import { ref, reactive, provide, inject, watch, nextTick } from 'vue'
import { useNotifications } from './ui/useNotifications.js'
import { useModal } from './ui/useModal.js'

/**
 * Global application state
 */
const globalState = reactive({
  user: null,
  theme: 'light',
  language: 'en',
  loading: false,
  online: true,
  sidebarOpen: false,
  preferences: {}
})

/**
 * Event bus for component communication
 */
const eventBus = reactive({
  events: new Map(),
  listeners: new Map()
})

/**
 * Integration utilities for component coordination
 * @returns {Object} Integration utilities and patterns
 */
export function useIntegration() {
  const notifications = useNotifications()
  const modal = useModal()
  
  /**
   * Global state management
   */
  const state = {
    get: (key) => globalState[key],
    set: (key, value) => { globalState[key] = value },
    update: (updates) => Object.assign(globalState, updates),
    reset: () => {
      Object.keys(globalState).forEach(key => {
        globalState[key] = null
      })
    }
  }
  
  /**
   * Event bus for component communication
   */
  const events = {
    /**
     * Emit event to all listeners
     * @param {string} eventName - Event name
     * @param {*} data - Event data
     */
    emit: (eventName, data = null) => {
      const listeners = eventBus.listeners.get(eventName) || []
      listeners.forEach(listener => {
        try {
          listener(data, eventName)
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error)
        }
      })
      
      // Store last event for late subscribers
      eventBus.events.set(eventName, { data, timestamp: Date.now() })
    },
    
    /**
     * Listen for events
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler
     * @returns {Function} Unsubscribe function
     */
    on: (eventName, handler) => {
      const listeners = eventBus.listeners.get(eventName) || []
      listeners.push(handler)
      eventBus.listeners.set(eventName, listeners)
      
      // Return unsubscribe function
      return () => {
        const currentListeners = eventBus.listeners.get(eventName) || []
        const index = currentListeners.indexOf(handler)
        if (index > -1) {
          currentListeners.splice(index, 1)
          eventBus.listeners.set(eventName, currentListeners)
        }
      }
    },
    
    /**
     * Listen for event once
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler
     * @returns {Function} Unsubscribe function
     */
    once: (eventName, handler) => {
      const unsubscribe = events.on(eventName, (data) => {
        handler(data)
        unsubscribe()
      })
      return unsubscribe
    },
    
    /**
     * Remove all listeners for event
     * @param {string} eventName - Event name
     */
    off: (eventName) => {
      eventBus.listeners.delete(eventName)
      eventBus.events.delete(eventName)
    },
    
    /**
     * Get last event data
     * @param {string} eventName - Event name
     * @returns {Object|null} Last event data
     */
    getLastEvent: (eventName) => {
      return eventBus.events.get(eventName) || null
    }
  }
  
  /**
   * Component coordination utilities
   */
  const coordination = {
    /**
     * Register component with global registry
     * @param {string} name - Component name
     * @param {Object} api - Component API
     */
    registerComponent: (name, api) => {
      if (!globalState.components) {
        globalState.components = new Map()
      }
      globalState.components.set(name, api)
      events.emit('component:registered', { name, api })
    },
    
    /**
     * Get registered component API
     * @param {string} name - Component name
     * @returns {Object|null} Component API
     */
    getComponent: (name) => {
      return globalState.components?.get(name) || null
    },
    
    /**
     * Call method on registered component
     * @param {string} componentName - Component name
     * @param {string} methodName - Method name
     * @param {...*} args - Method arguments
     * @returns {*} Method result
     */
    callComponent: (componentName, methodName, ...args) => {
      const component = coordination.getComponent(componentName)
      if (component && typeof component[methodName] === 'function') {
        return component[methodName](...args)
      }
      console.warn(`Component ${componentName} or method ${methodName} not found`)
      return null
    }
  }
  
  /**
   * Async operation coordination
   */
  const async = {
    /**
     * Execute async operation with loading state
     * @param {Function} operation - Async operation
     * @param {Object} options - Options
     * @param {string} options.loadingKey - Loading state key
     * @param {string} options.successMessage - Success notification
     * @param {string} options.errorMessage - Error notification
     * @returns {Promise<*>} Operation result
     */
    withLoading: async (operation, options = {}) => {
      const loadingKey = options.loadingKey || 'loading'
      const originalLoading = state.get(loadingKey)
      
      try {
        state.set(loadingKey, true)
        events.emit('loading:start', { key: loadingKey })
        
        const result = await operation()
        
        if (options.successMessage) {
          notifications.success(options.successMessage)
        }
        
        events.emit('operation:success', { result, key: loadingKey })
        return result
        
      } catch (error) {
        const errorMsg = options.errorMessage || error.message || 'Operation failed'
        notifications.error(errorMsg)
        events.emit('operation:error', { error, key: loadingKey })
        throw error
        
      } finally {
        state.set(loadingKey, originalLoading)
        events.emit('loading:end', { key: loadingKey })
      }
    },
    
    /**
     * Debounce function execution
     * @param {Function} fn - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce: (fn, delay = 300) => {
      let timeoutId
      return (...args) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => fn(...args), delay)
      }
    },
    
    /**
     * Throttle function execution
     * @param {Function} fn - Function to throttle
     * @param {number} limit - Limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle: (fn, limit = 100) => {
      let inThrottle
      return (...args) => {
        if (!inThrottle) {
          fn(...args)
          inThrottle = true
          setTimeout(() => inThrottle = false, limit)
        }
      }
    }
  }
  
  /**
   * Performance optimization utilities
   */
  const performance = {
    /**
     * Batch DOM updates
     * @param {Function} updates - Function containing DOM updates
     * @returns {Promise<void>} Promise that resolves after updates
     */
    batchUpdates: async (updates) => {
      await nextTick()
      updates()
      await nextTick()
    },
    
    /**
     * Measure execution time
     * @param {Function} fn - Function to measure
     * @param {string} label - Performance label
     * @returns {Promise<*>} Function result
     */
    measure: async (fn, label = 'Operation') => {
      const start = performance.now()
      const result = await fn()
      const end = performance.now()
      console.log(`${label} took ${end - start} milliseconds`)
      return result
    },
    
    /**
     * Create memoized function
     * @param {Function} fn - Function to memoize
     * @param {Function} keyFn - Key generation function
     * @returns {Function} Memoized function
     */
    memoize: (fn, keyFn = JSON.stringify) => {
      const cache = new Map()
      return (...args) => {
        const key = keyFn(args)
        if (cache.has(key)) {
          return cache.get(key)
        }
        const result = fn(...args)
        cache.set(key, result)
        return result
      }
    }
  }
  
  /**
   * Accessibility coordination
   */
  const a11y = {
    /**
     * Announce to screen readers
     * @param {string} message - Message to announce
     * @param {string} priority - Priority level (polite|assertive)
     */
    announce: (message, priority = 'polite') => {
      const announcer = document.getElementById('sr-announcer') || 
        (() => {
          const el = document.createElement('div')
          el.id = 'sr-announcer'
          el.setAttribute('aria-live', priority)
          el.setAttribute('aria-atomic', 'true')
          el.className = 'sr-only'
          el.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;'
          document.body.appendChild(el)
          return el
        })()
      
      announcer.textContent = message
    },
    
    /**
     * Manage focus regions
     * @param {HTMLElement} region - Focus region element
     * @param {boolean} active - Is region active
     */
    setFocusRegion: (region, active) => {
      if (active) {
        region.setAttribute('role', 'region')
        region.setAttribute('aria-label', region.dataset.label || 'Content region')
        region.setAttribute('tabindex', '-1')
      } else {
        region.removeAttribute('role')
        region.removeAttribute('aria-label')
        region.removeAttribute('tabindex')
      }
    }
  }
  
  return {
    // Global state
    state,
    globalState,
    
    // Event system
    events,
    
    // Component coordination
    coordination,
    
    // Async utilities
    async,
    
    // Performance
    performance,
    
    // Accessibility
    a11y,
    
    // UI integration
    notifications,
    modal
  }
}

/**
 * Provide/inject pattern for integration
 */
const INTEGRATION_KEY = Symbol('integration')

/**
 * Provide integration utilities to child components
 */
export function provideIntegration() {
  const integration = useIntegration()
  provide(INTEGRATION_KEY, integration)
  return integration
}

/**
 * Inject integration utilities from parent components
 */
export function injectIntegration() {
  const integration = inject(INTEGRATION_KEY, null)
  if (!integration) {
    console.warn('Integration not provided. Use provideIntegration() in parent component.')
    return useIntegration() // Fallback to new instance
  }
  return integration
}