/**
 * Keyboard shortcut handling composable
 * Provides reactive keyboard event management with shortcut registration
 * @module useKeyboard
 */

import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'

/**
 * Global keyboard shortcuts registry
 */
const globalShortcuts = reactive(new Map())
const globalListenerActive = ref(false)

/**
 * Key code mappings for common keys
 */
const keyCodes = {
  // Letters
  a: 65, b: 66, c: 67, d: 68, e: 69, f: 70, g: 71, h: 72, i: 73, j: 74,
  k: 75, l: 76, m: 77, n: 78, o: 79, p: 80, q: 81, r: 82, s: 83, t: 84,
  u: 85, v: 86, w: 87, x: 88, y: 89, z: 90,
  
  // Numbers
  0: 48, 1: 49, 2: 50, 3: 51, 4: 52, 5: 53, 6: 54, 7: 55, 8: 56, 9: 57,
  
  // Function keys
  f1: 112, f2: 113, f3: 114, f4: 115, f5: 116, f6: 117, f7: 118, f8: 119,
  f9: 120, f10: 121, f11: 122, f12: 123,
  
  // Special keys
  enter: 13, escape: 27, space: 32, tab: 9, backspace: 8, delete: 46,
  arrowup: 38, arrowdown: 40, arrowleft: 37, arrowright: 39,
  home: 36, end: 35, pageup: 33, pagedown: 34,
  insert: 45, shift: 16, ctrl: 17, alt: 18, meta: 91
}

/**
 * Setup global keyboard listener
 */
const setupGlobalListener = () => {
  if (globalListenerActive.value || typeof document === 'undefined') return
  
  const handleKeyDown = (event) => {
    for (const [shortcut, handler] of globalShortcuts.entries()) {
      if (matchesShortcut(event, shortcut)) {
        const shouldPreventDefault = handler.handler(event, shortcut)
        if (shouldPreventDefault !== false) {
          event.preventDefault()
        }
        if (!handler.allowPropagation) {
          event.stopPropagation()
        }
        break
      }
    }
  }
  
  document.addEventListener('keydown', handleKeyDown)
  globalListenerActive.value = true
}

/**
 * Parse shortcut string into object
 * @param {string} shortcut - Shortcut string (e.g., 'ctrl+shift+s')
 * @returns {Object} Parsed shortcut
 */
const parseShortcut = (shortcut) => {
  const parts = shortcut.toLowerCase().split('+').map(s => s.trim())
  const modifiers = {
    ctrl: false,
    alt: false,
    shift: false,
    meta: false
  }
  
  let key = null
  
  parts.forEach(part => {
    if (part === 'ctrl' || part === 'control') {
      modifiers.ctrl = true
    } else if (part === 'alt' || part === 'option') {
      modifiers.alt = true
    } else if (part === 'shift') {
      modifiers.shift = true
    } else if (part === 'meta' || part === 'cmd' || part === 'command') {
      modifiers.meta = true
    } else {
      key = part
    }
  })
  
  return { ...modifiers, key }
}

/**
 * Check if event matches shortcut
 * @param {KeyboardEvent} event - Keyboard event
 * @param {Object} shortcut - Parsed shortcut
 * @returns {boolean} Matches shortcut
 */
const matchesShortcut = (event, shortcut) => {
  const eventKey = event.key.toLowerCase()
  const eventCode = event.code.toLowerCase()
  
  // Check modifiers
  if (event.ctrlKey !== shortcut.ctrl) return false
  if (event.altKey !== shortcut.alt) return false
  if (event.shiftKey !== shortcut.shift) return false
  if (event.metaKey !== shortcut.meta) return false
  
  // Check key
  return eventKey === shortcut.key || eventCode === `key${shortcut.key}` || eventCode === shortcut.key
}

/**
 * Keyboard shortcut management system
 * @param {Object} options - Configuration options
 * @param {boolean} options.global - Register shortcuts globally
 * @param {HTMLElement} options.target - Target element for local shortcuts
 * @returns {Object} Keyboard utilities and state
 */
export function useKeyboard(options = {}) {
  const { global = false, target = null } = options
  
  // Local shortcuts for this instance
  const localShortcuts = reactive(new Map())
  const activeKeys = ref(new Set())
  const isListening = ref(false)
  
  /**
   * Register keyboard shortcut
   * @param {string|Array} shortcuts - Shortcut string or array of shortcuts
   * @param {Function} handler - Handler function
   * @param {Object} options - Shortcut options
   * @param {boolean} options.preventDefault - Prevent default behavior
   * @param {boolean} options.allowPropagation - Allow event propagation
   * @param {string} options.description - Shortcut description
   * @param {boolean} options.global - Register globally
   * @returns {Function} Unregister function
   */
  const register = (shortcuts, handler, options = {}) => {
    const shortcutArray = Array.isArray(shortcuts) ? shortcuts : [shortcuts]
    const config = {
      handler,
      preventDefault: options.preventDefault !== false,
      allowPropagation: options.allowPropagation || false,
      description: options.description || '',
      global: options.global || global
    }
    
    const parsedShortcuts = shortcutArray.map(s => ({
      original: s,
      parsed: parseShortcut(s),
      ...config
    }))
    
    // Register shortcuts
    parsedShortcuts.forEach(shortcut => {
      if (shortcut.global) {
        setupGlobalListener()
        globalShortcuts.set(shortcut.parsed, shortcut)
      } else {
        localShortcuts.set(shortcut.parsed, shortcut)
      }
    })
    
    // Start local listener if needed
    if (!global && !isListening.value) {
      startListening()
    }
    
    // Return unregister function
    return () => {
      parsedShortcuts.forEach(shortcut => {
        if (shortcut.global) {
          globalShortcuts.delete(shortcut.parsed)
        } else {
          localShortcuts.delete(shortcut.parsed)
        }
      })
    }
  }
  
  /**
   * Unregister shortcut by string
   * @param {string} shortcut - Shortcut string
   */
  const unregister = (shortcut) => {
    const parsed = parseShortcut(shortcut)
    localShortcuts.delete(parsed)
    globalShortcuts.delete(parsed)
  }
  
  /**
   * Start listening for keyboard events
   */
  const startListening = () => {
    if (isListening.value || typeof document === 'undefined') return
    
    const element = target || document
    
    const handleKeyDown = (event) => {
      activeKeys.value.add(event.code.toLowerCase())
      
      for (const [shortcut, handler] of localShortcuts.entries()) {
        if (matchesShortcut(event, shortcut)) {
          const shouldPreventDefault = handler.handler(event, shortcut)
          if (shouldPreventDefault !== false && handler.preventDefault) {
            event.preventDefault()
          }
          if (!handler.allowPropagation) {
            event.stopPropagation()
          }
          break
        }
      }
    }
    
    const handleKeyUp = (event) => {
      activeKeys.value.delete(event.code.toLowerCase())
    }
    
    element.addEventListener('keydown', handleKeyDown)
    element.addEventListener('keyup', handleKeyUp)
    isListening.value = true
    
    // Cleanup on unmount
    onUnmounted(() => {
      element.removeEventListener('keydown', handleKeyDown)
      element.removeEventListener('keyup', handleKeyUp)
      isListening.value = false
    })
  }
  
  /**
   * Stop listening for keyboard events
   */
  const stopListening = () => {
    isListening.value = false
  }
  
  /**
   * Check if key is currently pressed
   * @param {string} key - Key to check
   * @returns {boolean} Is key pressed
   */
  const isKeyPressed = (key) => {
    return activeKeys.value.has(key.toLowerCase())
  }
  
  /**
   * Check if shortcut combination is currently pressed
   * @param {string} shortcut - Shortcut string
   * @returns {boolean} Is shortcut pressed
   */
  const isShortcutPressed = (shortcut) => {
    const parsed = parseShortcut(shortcut)
    const currentEvent = {
      ctrlKey: isKeyPressed('controlleft') || isKeyPressed('controlright'),
      altKey: isKeyPressed('altleft') || isKeyPressed('altright'),
      shiftKey: isKeyPressed('shiftleft') || isKeyPressed('shiftright'),
      metaKey: isKeyPressed('metaleft') || isKeyPressed('metaright'),
      key: parsed.key
    }
    
    return matchesShortcut(currentEvent, parsed) && isKeyPressed(`key${parsed.key}`)
  }
  
  /**
   * Get all registered shortcuts
   * @returns {Array} Array of shortcut objects
   */
  const getShortcuts = () => {
    const local = Array.from(localShortcuts.values())
    const global = Array.from(globalShortcuts.values())
    return [...local, ...global]
  }
  
  /**
   * Create shortcut string from event
   * @param {KeyboardEvent} event - Keyboard event
   * @returns {string} Shortcut string
   */
  const eventToShortcut = (event) => {
    const parts = []
    if (event.ctrlKey) parts.push('ctrl')
    if (event.altKey) parts.push('alt')
    if (event.shiftKey) parts.push('shift')
    if (event.metaKey) parts.push('meta')
    parts.push(event.key.toLowerCase())
    return parts.join('+')
  }
  
  /**
   * Convenience method for common shortcuts
   */
  const shortcuts = {
    save: (handler) => register('ctrl+s', handler, { description: 'Save' }),
    copy: (handler) => register('ctrl+c', handler, { description: 'Copy' }),
    paste: (handler) => register('ctrl+v', handler, { description: 'Paste' }),
    undo: (handler) => register('ctrl+z', handler, { description: 'Undo' }),
    redo: (handler) => register(['ctrl+y', 'ctrl+shift+z'], handler, { description: 'Redo' }),
    selectAll: (handler) => register('ctrl+a', handler, { description: 'Select All' }),
    find: (handler) => register('ctrl+f', handler, { description: 'Find' }),
    newTab: (handler) => register('ctrl+t', handler, { description: 'New Tab' }),
    closeTab: (handler) => register('ctrl+w', handler, { description: 'Close Tab' }),
    refresh: (handler) => register(['ctrl+r', 'f5'], handler, { description: 'Refresh' }),
    escape: (handler) => register('escape', handler, { description: 'Cancel/Close' }),
    enter: (handler) => register('enter', handler, { description: 'Confirm/Submit' }),
    delete: (handler) => register('delete', handler, { description: 'Delete' }),
    space: (handler) => register('space', handler, { description: 'Select/Toggle' })
  }
  
  /**
   * Accessibility helpers
   */
  const a11y = {
    /**
     * Create ARIA label for shortcut
     * @param {string} shortcut - Shortcut string
     * @returns {string} ARIA label
     */
    getAriaLabel: (shortcut) => {
      return shortcut.replace(/\+/g, ' plus ').replace(/ctrl/g, 'control')
    },
    
    /**
     * Create keyboard shortcut hint
     * @param {string} shortcut - Shortcut string
     * @returns {string} Human-readable hint
     */
    getHint: (shortcut) => {
      return shortcut
        .replace(/ctrl/g, 'Ctrl')
        .replace(/alt/g, 'Alt')
        .replace(/shift/g, 'Shift')
        .replace(/meta/g, 'Cmd')
        .replace(/\+/g, '+')
    }
  }
  
  // Computed properties
  const hasActiveShortcuts = computed(() => {
    return localShortcuts.size > 0 || globalShortcuts.size > 0
  })
  
  const pressedKeysCount = computed(() => activeKeys.value.size)
  
  return {
    // State
    activeKeys,
    isListening,
    
    // Computed
    hasActiveShortcuts,
    pressedKeysCount,
    
    // Actions
    register,
    unregister,
    startListening,
    stopListening,
    
    // Utilities
    isKeyPressed,
    isShortcutPressed,
    getShortcuts,
    eventToShortcut,
    
    // Convenience
    shortcuts,
    a11y,
    
    // Constants
    keyCodes
  }
}

/**
 * Simple keyboard hook for common use cases
 * @returns {Object} Simple keyboard utilities
 */
export function useSimpleKeyboard() {
  const { register, shortcuts } = useKeyboard()
  
  return {
    onKey: register,
    shortcuts
  }
}

/**
 * Focus management utilities
 * @returns {Object} Focus management utilities
 */
export function useFocusManagement() {
  const focusHistory = ref([])
  const currentFocus = ref(null)
  
  /**
   * Save current focus
   */
  const saveFocus = () => {
    if (document.activeElement && document.activeElement !== document.body) {
      currentFocus.value = document.activeElement
    }
  }
  
  /**
   * Restore saved focus
   */
  const restoreFocus = () => {
    if (currentFocus.value) {
      currentFocus.value.focus()
    }
  }
  
  /**
   * Focus element by selector
   * @param {string} selector - CSS selector
   * @returns {boolean} Successfully focused
   */
  const focusElement = (selector) => {
    const element = document.querySelector(selector)
    if (element) {
      element.focus()
      return true
    }
    return false
  }
  
  /**
   * Focus first focusable element
   * @param {HTMLElement} container - Container element
   * @returns {boolean} Successfully focused
   */
  const focusFirst = (container = document) => {
    const focusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable) {
      focusable.focus()
      return true
    }
    return false
  }
  
  return {
    focusHistory,
    currentFocus,
    saveFocus,
    restoreFocus,
    focusElement,
    focusFirst
  }
}