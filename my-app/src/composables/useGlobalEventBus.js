/**
 * Global event bus for cross-component communication
 * Provides typed event system with event history and debugging
 * @module useGlobalEventBus
 */

import { reactive, ref } from 'vue'

/**
 * Event types for type safety and autocomplete
 */
export const EventTypes = {
  // UI Events
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  NOTIFICATION_ADD: 'notification:add',
  SIDEBAR_TOGGLE: 'sidebar:toggle',
  
  // Data Events
  DATA_LOADING: 'data:loading',
  DATA_LOADED: 'data:loaded',
  DATA_ERROR: 'data:error',
  DATA_REFRESH: 'data:refresh',
  
  // User Events
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  USER_PROFILE_UPDATE: 'user:profile:update',
  
  // Navigation Events
  ROUTE_CHANGE: 'route:change',
  ROUTE_BEFORE_CHANGE: 'route:before:change',
  
  // Form Events
  FORM_SUBMIT: 'form:submit',
  FORM_VALIDATE: 'form:validate',
  FORM_ERROR: 'form:error',
  
  // Theme Events
  THEME_CHANGE: 'theme:change',
  LANGUAGE_CHANGE: 'language:change',
  
  // Performance Events
  PERFORMANCE_MARK: 'performance:mark',
  PERFORMANCE_MEASURE: 'performance:measure',
  
  // Custom Events (extend as needed)
  CUSTOM: 'custom'
}

/**
 * Global event registry
 */
const eventRegistry = reactive({
  listeners: new Map(),
  history: [],
  maxHistory: 1000,
  debugging: false
})

/**
 * Global event bus for application-wide communication
 * @returns {Object} Event bus utilities
 */
export function useGlobalEventBus() {
  
  /**
   * Emit event to all listeners
   * @param {string} eventType - Event type from EventTypes
   * @param {*} payload - Event payload data
   * @param {Object} options - Event options
   * @param {boolean} options.persistent - Store event for replay
   * @param {number} options.delay - Delay emission in milliseconds
   * @param {Function} options.condition - Condition function for conditional emission
   */
  const emit = (eventType, payload = null, options = {}) => {
    const event = {
      type: eventType,
      payload,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    }
    
    // Check condition
    if (options.condition && !options.condition(payload)) {
      return event.id
    }
    
    // Add to history
    if (options.persistent !== false) {
      eventRegistry.history.push(event)
      
      // Limit history size
      if (eventRegistry.history.length > eventRegistry.maxHistory) {
        eventRegistry.history.shift()
      }
    }
    
    // Debug logging
    if (eventRegistry.debugging) {
      console.group(`🚌 Event Bus: ${eventType}`)
      console.log('Payload:', payload)
      console.log('Listeners:', eventRegistry.listeners.get(eventType)?.length || 0)
      console.log('Event ID:', event.id)
      console.groupEnd()
    }
    
    const executeEmission = () => {
      const listeners = eventRegistry.listeners.get(eventType) || []
      
      listeners.forEach((listener, index) => {
        try {
          if (listener.once) {
            // Remove one-time listeners
            listeners.splice(index, 1)
          }
          listener.handler(payload, event)
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error)
          console.error('Payload:', payload)
          console.error('Listener:', listener)
        }
      })
      
      // Update listeners map
      if (listeners.length === 0) {
        eventRegistry.listeners.delete(eventType)
      } else {
        eventRegistry.listeners.set(eventType, listeners)
      }
    }
    
    // Delay emission if requested
    if (options.delay) {
      setTimeout(executeEmission, options.delay)
    } else {
      executeEmission()
    }
    
    return event.id
  }
  
  /**
   * Listen for events
   * @param {string|Array} eventTypes - Event type(s) to listen for
   * @param {Function} handler - Event handler function
   * @param {Object} options - Listener options
   * @param {boolean} options.once - Listen only once
   * @param {Function} options.filter - Filter function for selective listening
   * @param {number} options.priority - Listener priority (higher = earlier)
   * @returns {Function} Unsubscribe function
   */
  const on = (eventTypes, handler, options = {}) => {
    const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes]
    const unsubscribeFunctions = []
    
    types.forEach(eventType => {
      const listener = {
        handler: options.filter 
          ? (payload, event) => {
              if (options.filter(payload, event)) {
                handler(payload, event)
              }
            }
          : handler,
        once: options.once || false,
        priority: options.priority || 0,
        id: Math.random().toString(36).substr(2, 9)
      }
      
      const listeners = eventRegistry.listeners.get(eventType) || []
      
      // Insert based on priority (higher priority first)
      const insertIndex = listeners.findIndex(l => l.priority < listener.priority)
      if (insertIndex === -1) {
        listeners.push(listener)
      } else {
        listeners.splice(insertIndex, 0, listener)
      }
      
      eventRegistry.listeners.set(eventType, listeners)
      
      // Create unsubscribe function for this event type
      const unsubscribe = () => {
        const currentListeners = eventRegistry.listeners.get(eventType) || []
        const index = currentListeners.findIndex(l => l.id === listener.id)
        if (index > -1) {
          currentListeners.splice(index, 1)
          if (currentListeners.length === 0) {
            eventRegistry.listeners.delete(eventType)
          } else {
            eventRegistry.listeners.set(eventType, currentListeners)
          }
        }
      }
      
      unsubscribeFunctions.push(unsubscribe)
    })
    
    // Return combined unsubscribe function
    return () => {
      unsubscribeFunctions.forEach(fn => fn())
    }
  }
  
  /**
   * Listen for event once
   * @param {string|Array} eventTypes - Event type(s) to listen for
   * @param {Function} handler - Event handler function
   * @param {Object} options - Listener options
   * @returns {Function} Unsubscribe function
   */
  const once = (eventTypes, handler, options = {}) => {
    return on(eventTypes, handler, { ...options, once: true })
  }
  
  /**
   * Remove all listeners for event type(s)
   * @param {string|Array} eventTypes - Event type(s) to clear
   */
  const off = (eventTypes) => {
    const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes]
    types.forEach(eventType => {
      eventRegistry.listeners.delete(eventType)
    })
  }
  
  /**
   * Get event history
   * @param {string} eventType - Filter by event type (optional)
   * @param {number} limit - Limit number of events
   * @returns {Array} Event history
   */
  const getHistory = (eventType = null, limit = 50) => {
    let history = eventRegistry.history
    
    if (eventType) {
      history = history.filter(event => event.type === eventType)
    }
    
    return history.slice(-limit)
  }
  
  /**
   * Replay events from history
   * @param {string} eventType - Event type to replay
   * @param {Function} filter - Filter function for selective replay
   */
  const replay = (eventType, filter = null) => {
    const events = getHistory(eventType)
    
    events.forEach(event => {
      if (!filter || filter(event)) {
        emit(event.type, event.payload, { persistent: false })
      }
    })
  }
  
  /**
   * Clear event history
   * @param {string} eventType - Clear specific event type (optional)
   */
  const clearHistory = (eventType = null) => {
    if (eventType) {
      eventRegistry.history = eventRegistry.history.filter(event => event.type !== eventType)
    } else {
      eventRegistry.history = []
    }
  }
  
  /**
   * Get listener count for event type
   * @param {string} eventType - Event type
   * @returns {number} Listener count
   */
  const getListenerCount = (eventType) => {
    return eventRegistry.listeners.get(eventType)?.length || 0
  }
  
  /**
   * Get all active event types
   * @returns {Array} Active event types
   */
  const getActiveEvents = () => {
    return Array.from(eventRegistry.listeners.keys())
  }
  
  /**
   * Enable/disable debugging
   * @param {boolean} enabled - Enable debugging
   */
  const setDebugging = (enabled) => {
    eventRegistry.debugging = enabled
  }
  
  /**
   * Wait for specific event
   * @param {string} eventType - Event type to wait for
   * @param {number} timeout - Timeout in milliseconds
   * @param {Function} condition - Optional condition function
   * @returns {Promise} Promise that resolves with event payload
   */
  const waitFor = (eventType, timeout = 5000, condition = null) => {
    return new Promise((resolve, reject) => {
      let timeoutId
      
      const unsubscribe = once(eventType, (payload, event) => {
        if (condition && !condition(payload, event)) {
          return // Continue waiting
        }
        
        clearTimeout(timeoutId)
        resolve(payload)
      })
      
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          unsubscribe()
          reject(new Error(`Timeout waiting for event: ${eventType}`))
        }, timeout)
      }
    })
  }
  
  /**
   * Create namespaced event bus
   * @param {string} namespace - Event namespace
   * @returns {Object} Namespaced event bus
   */
  const createNamespace = (namespace) => {
    return {
      emit: (eventType, payload, options) => emit(`${namespace}:${eventType}`, payload, options),
      on: (eventType, handler, options) => on(`${namespace}:${eventType}`, handler, options),
      once: (eventType, handler, options) => once(`${namespace}:${eventType}`, handler, options),
      off: (eventType) => off(`${namespace}:${eventType}`),
      waitFor: (eventType, timeout, condition) => waitFor(`${namespace}:${eventType}`, timeout, condition)
    }
  }
  
  return {
    // Core methods
    emit,
    on,
    once,
    off,
    
    // History methods
    getHistory,
    replay,
    clearHistory,
    
    // Utilities
    getListenerCount,
    getActiveEvents,
    setDebugging,
    waitFor,
    createNamespace,
    
    // Constants
    EventTypes,
    
    // State (read-only)
    registry: eventRegistry
  }
}

/**
 * Pre-configured event bus instance for common usage
 */
export const globalEventBus = useGlobalEventBus()