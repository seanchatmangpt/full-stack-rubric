/**
 * @fileoverview DOM setup for typing tutor tests
 * Configures JSDOM environment with typing-specific DOM features
 */

import { vi } from 'vitest'
import { JSDOM } from 'jsdom'

// Configure JSDOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable',
  runScripts: 'dangerously'
})

// Set global DOM objects
global.window = dom.window
global.document = dom.window.document
global.navigator = dom.window.navigator
global.location = dom.window.location
global.history = dom.window.history

// Set up HTML element prototypes with typing-specific features
setupHTMLElementPrototypes()
setupInputElementFeatures()
setupEventTargetFeatures()
setupSelectionAPI()
setupClipboardAPI()
setupIMESupport()

/**
 * Set up HTML element prototypes
 */
function setupHTMLElementPrototypes() {
  // Mock getBoundingClientRect for all elements
  HTMLElement.prototype.getBoundingClientRect = vi.fn(() => ({
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({})
  }))
  
  // Mock getClientRects
  HTMLElement.prototype.getClientRects = vi.fn(() => ({
    length: 0,
    item: () => null,
    [Symbol.iterator]: function* () {}
  }))
  
  // Mock scrollIntoView
  HTMLElement.prototype.scrollIntoView = vi.fn()
  
  // Mock focus and blur
  HTMLElement.prototype.focus = vi.fn()
  HTMLElement.prototype.blur = vi.fn()
  
  // Mock click
  HTMLElement.prototype.click = vi.fn()
  
  // Mock offsetWidth/Height
  Object.defineProperties(HTMLElement.prototype, {
    offsetHeight: { get: () => 0 },
    offsetWidth: { get: () => 0 },
    offsetTop: { get: () => 0 },
    offsetLeft: { get: () => 0 },
    offsetParent: { get: () => null },
    clientHeight: { get: () => 0 },
    clientWidth: { get: () => 0 },
    clientTop: { get: () => 0 },
    clientLeft: { get: () => 0 },
    scrollHeight: { get: () => 0 },
    scrollWidth: { get: () => 0 },
    scrollTop: { get: () => 0, set: () => {} },
    scrollLeft: { get: () => 0, set: () => {} }
  })
}

/**
 * Set up input element features for typing tests
 */
function setupInputElementFeatures() {
  // Mock selection properties for input elements
  /**
   * @param {HTMLInputElement|HTMLTextAreaElement} element
   */
  const setupSelectionProperties = (element) => {
    let selectionStart = 0
    let selectionEnd = 0
    /** @type {'forward'|'backward'|'none'} */
    let selectionDirection = 'none'
    
    Object.defineProperties(element, {
      selectionStart: {
        get: () => selectionStart,
        set: (value) => { selectionStart = value },
        configurable: true
      },
      selectionEnd: {
        get: () => selectionEnd,
        set: (value) => { selectionEnd = value },
        configurable: true
      },
      selectionDirection: {
        get: () => selectionDirection,
        set: (value) => { selectionDirection = value },
        configurable: true
      }
    })
    
    // Mock selection methods
    element.select = vi.fn(() => {
      selectionStart = 0
      selectionEnd = element.value.length
    })
    
    /**
     * @param {number} start
     * @param {number} end
     * @param {string} [direction]
     */
    element.setSelectionRange = vi.fn((start, end, direction) => {
      selectionStart = start
      selectionEnd = end
      selectionDirection = direction || 'none'
    })
    
    /**
     * @param {string} replacement
     * @param {number} [start]
     * @param {number} [end]
     */
    element.setRangeText = vi.fn((replacement, start, end) => {
      const currentValue = element.value
      const replaceStart = start ?? selectionStart
      const replaceEnd = end ?? selectionEnd
      
      element.value = currentValue.substring(0, replaceStart) + 
                     replacement + 
                     currentValue.substring(replaceEnd)
      
      selectionStart = replaceStart + replacement.length
      selectionEnd = selectionStart
    })
  }
  
  // Set up for all input elements
  const originalInputCreator = document.createElement.bind(document)
  /**
   * @param {string} tagName
   * @param {Object} [options]
   * @returns {Element}
   */
  document.createElement = function(tagName, options) {
    const element = originalInputCreator.call(this, tagName, options)
    
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      setupSelectionProperties(element)
    }
    
    return element
  }
  
  // Set up existing input elements
  const existingInputs = document.querySelectorAll('input, textarea')
  existingInputs.forEach(input => {
    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
      setupSelectionProperties(input)
    }
  })
}

/**
 * Set up EventTarget features
 */
function setupEventTargetFeatures() {
  // Enhanced event dispatching for typing events
  const originalDispatchEvent = EventTarget.prototype.dispatchEvent
  /**
   * @param {Event} event
   * @returns {boolean}
   */
  EventTarget.prototype.dispatchEvent = function(event) {
    // Add typing-specific event handling
    if (event.type === 'input' && this instanceof HTMLInputElement || this instanceof HTMLTextAreaElement) {
      // Simulate real input behavior
      const inputEvent = event
      if (inputEvent.data) {
        // Handle input data
      }
    }
    
    return originalDispatchEvent.call(this, event)
  }
  
  // Mock composition events
  /**
   * @param {string} type
   * @param {string} [data]
   * @returns {Event}
   */
  const createCompositionEvent = (type, data) => {
    const event = new Event(type, { bubbles: true, cancelable: true })
    event.data = data || ''
    return event
  }
  
  /**
   * @param {string} type
   * @param {Object} [eventInitDict]
   */
  global.CompositionEvent = function(type, eventInitDict) {
    const event = createCompositionEvent(type, eventInitDict?.data)
    Object.assign(event, eventInitDict)
    return event
  }
}

/**
 * Set up Selection API
 */
function setupSelectionAPI() {
  const mockSelection = {
    anchorNode: null,
    anchorOffset: 0,
    focusNode: null,
    focusOffset: 0,
    isCollapsed: true,
    rangeCount: 0,
    type: 'None',
    
    addRange: vi.fn(),
    removeRange: vi.fn(),
    removeAllRanges: vi.fn(),
    collapse: vi.fn(),
    collapseToStart: vi.fn(),
    collapseToEnd: vi.fn(),
    extend: vi.fn(),
    getRangeAt: vi.fn(() => ({
      startContainer: null,
      startOffset: 0,
      endContainer: null,
      endOffset: 0,
      collapsed: true,
      commonAncestorContainer: null,
      cloneContents: vi.fn(() => document.createDocumentFragment()),
      cloneRange: vi.fn(),
      collapse: vi.fn(),
      compareBoundaryPoints: vi.fn(() => 0),
      deleteContents: vi.fn(),
      detach: vi.fn(),
      extractContents: vi.fn(() => document.createDocumentFragment()),
      insertNode: vi.fn(),
      selectNode: vi.fn(),
      selectNodeContents: vi.fn(),
      setEnd: vi.fn(),
      setEndAfter: vi.fn(),
      setEndBefore: vi.fn(),
      setStart: vi.fn(),
      setStartAfter: vi.fn(),
      setStartBefore: vi.fn(),
      surroundContents: vi.fn(),
      toString: vi.fn(() => '')
    })),
    selectAllChildren: vi.fn(),
    toString: vi.fn(() => '')
  }
  
  Object.defineProperty(window, 'getSelection', {
    value: vi.fn(() => mockSelection)
  })
  
  Object.defineProperty(document, 'getSelection', {
    value: vi.fn(() => mockSelection)
  })
}

/**
 * Set up Clipboard API for paste testing
 */
function setupClipboardAPI() {
  const mockClipboardData = {
    items: [],
    types: [],
    files: [],
    /**
     * @param {string} format
     * @returns {string}
     */
    getData: vi.fn((format) => ''),
    /**
     * @param {string} format
     * @param {string} data
     * @returns {boolean}
     */
    setData: vi.fn((format, data) => true),
    /**
     * @param {string} [format]
     */
    clearData: vi.fn((format) => undefined)
  }
  
  /**
   * @param {string} type
   * @param {Object} [eventInitDict]
   */
  global.ClipboardEvent = function(type, eventInitDict) {
    const event = new Event(type, eventInitDict)
    event.clipboardData = mockClipboardData
    Object.assign(event, eventInitDict)
    return event
  }
  
  global.DataTransfer = function() {
    return mockClipboardData
  }
}

/**
 * Set up IME (Input Method Editor) support
 */
function setupIMESupport() {
  /**
   * @param {string} type
   * @param {Object} [eventInitDict]
   */
  global.InputEvent = function(type, eventInitDict) {
    const event = new Event(type, eventInitDict)
    event.data = eventInitDict?.data || null
    event.inputType = eventInitDict?.inputType || ''
    event.isComposing = eventInitDict?.isComposing || false
    return event
  }
  
  // Mock composition events
  /**
   * @param {string} type
   * @param {Object} [eventInitDict]
   */
  global.CompositionEvent = function(type, eventInitDict) {
    const event = new Event(type, eventInitDict)
    event.data = eventInitDict?.data || ''
    event.locale = eventInitDict?.locale || ''
    return event
  }
}

// Mock keyboard events with proper key codes
/**
 * @param {string} type
 * @param {Object} [eventInitDict]
 */
global.KeyboardEvent = function(type, eventInitDict) {
  const event = new Event(type, eventInitDict)
  event.key = eventInitDict?.key || ''
  event.code = eventInitDict?.code || ''
  event.keyCode = eventInitDict?.keyCode || 0
  event.which = eventInitDict?.which || 0
  event.charCode = eventInitDict?.charCode || 0
  event.ctrlKey = eventInitDict?.ctrlKey || false
  event.altKey = eventInitDict?.altKey || false
  event.shiftKey = eventInitDict?.shiftKey || false
  event.metaKey = eventInitDict?.metaKey || false
  event.repeat = eventInitDict?.repeat || false
  event.location = eventInitDict?.location || 0
  /**
   * @param {string} key
   * @returns {boolean}
   */
  event.getModifierState = vi.fn((key) => false)
  return event
}

// Export utilities for use in tests
export const domUtils = {
  /**
   * Create a mock input element with typing features
   * @param {string} [type='text']
   * @returns {HTMLInputElement}
   */
  createMockInput: (type = 'text') => {
    const input = document.createElement('input')
    input.type = type
    return input
  },
  
  /**
   * Create a mock textarea element
   * @returns {HTMLTextAreaElement}
   */
  createMockTextarea: () => {
    return document.createElement('textarea')
  },
  
  /**
   * Simulate typing into an element
   * @param {HTMLInputElement|HTMLTextAreaElement} element
   * @param {string} text
   * @param {Object} [options={}]
   * @param {number} [options.delay=0]
   * @param {boolean} [options.triggerEvents=true]
   * @returns {Promise<void>}
   */
  simulateTyping: async (element, text, options = {}) => {
    const { delay = 0, triggerEvents = true } = options
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      element.value += char
      
      if (triggerEvents) {
        // Dispatch input event
        const inputEvent = new Event('input', { bubbles: true })
        element.dispatchEvent(inputEvent)
        
        // Dispatch keydown/keyup events
        const keydownEvent = new KeyboardEvent('keydown', { key: char, bubbles: true })
        element.dispatchEvent(keydownEvent)
        
        const keyupEvent = new KeyboardEvent('keyup', { key: char, bubbles: true })
        element.dispatchEvent(keyupEvent)
      }
      
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  },
  
  /**
   * Simulate paste event
   * @param {Element} element
   * @param {string} text
   * @returns {ClipboardEvent}
   */
  simulatePaste: (element, text) => {
    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: {
        getData: () => text,
        setData: () => true,
        clearData: () => {},
        items: [],
        types: ['text/plain'],
        files: []
      }
    })
    
    element.dispatchEvent(pasteEvent)
    return pasteEvent
  },
  
  /**
   * Mock element dimensions
   * @param {HTMLElement} element
   * @param {Object} dimensions
   * @param {number} [dimensions.width=100]
   * @param {number} [dimensions.height=100]
   * @param {number} [dimensions.top=0]
   * @param {number} [dimensions.left=0]
   */
  mockElementDimensions: (element, dimensions) => {
    const { width = 100, height = 100, top = 0, left = 0 } = dimensions
    
    element.getBoundingClientRect = vi.fn(() => ({
      width,
      height,
      top,
      left,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON: () => ({})
    }))
    
    Object.defineProperties(element, {
      offsetWidth: { get: () => width, configurable: true },
      offsetHeight: { get: () => height, configurable: true },
      clientWidth: { get: () => width, configurable: true },
      clientHeight: { get: () => height, configurable: true }
    })
  },
  
  /**
   * Create a mock keyboard event
   * @param {string} type
   * @param {Object} [options={}]
   * @param {string} [options.key]
   * @param {string} [options.code]
   * @param {number} [options.keyCode]
   * @param {boolean} [options.ctrlKey]
   * @param {boolean} [options.altKey]
   * @param {boolean} [options.shiftKey]
   * @param {boolean} [options.metaKey]
   * @returns {KeyboardEvent}
   */
  createKeyboardEvent: (type, options = {}) => {
    return new KeyboardEvent(type, {
      bubbles: true,
      cancelable: true,
      ...options
    })
  },
  
  /**
   * Create a mock composition event for IME testing
   * @param {string} type
   * @param {string} [data='']
   * @returns {CompositionEvent}
   */
  createCompositionEvent: (type, data = '') => {
    return new CompositionEvent(type, {
      bubbles: true,
      cancelable: true,
      data
    })
  }
}