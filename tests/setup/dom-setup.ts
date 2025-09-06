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
global.window = dom.window as any
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
  const setupSelectionProperties = (element: HTMLInputElement | HTMLTextAreaElement) => {
    let selectionStart = 0
    let selectionEnd = 0
    let selectionDirection: 'forward' | 'backward' | 'none' = 'none'
    
    Object.defineProperties(element, {
      selectionStart: {
        get: () => selectionStart,
        set: (value: number) => { selectionStart = value },
        configurable: true
      },
      selectionEnd: {
        get: () => selectionEnd,
        set: (value: number) => { selectionEnd = value },
        configurable: true
      },
      selectionDirection: {
        get: () => selectionDirection,
        set: (value: 'forward' | 'backward' | 'none') => { selectionDirection = value },
        configurable: true
      }
    })
    
    // Mock selection methods
    element.select = vi.fn(() => {
      selectionStart = 0
      selectionEnd = element.value.length
    })
    
    element.setSelectionRange = vi.fn((start: number, end: number, direction?: string) => {
      selectionStart = start
      selectionEnd = end
      selectionDirection = (direction as any) || 'none'
    })
    
    element.setRangeText = vi.fn((replacement: string, start?: number, end?: number) => {
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
  document.createElement = function(tagName: string, options?: any) {
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
  EventTarget.prototype.dispatchEvent = function(event: Event) {
    // Add typing-specific event handling
    if (event.type === 'input' && this instanceof HTMLInputElement || this instanceof HTMLTextAreaElement) {
      // Simulate real input behavior
      const inputEvent = event as InputEvent
      if (inputEvent.data) {
        // Handle input data
      }
    }
    
    return originalDispatchEvent.call(this, event)
  }
  
  // Mock composition events
  const createCompositionEvent = (type: string, data?: string) => {
    const event = new Event(type, { bubbles: true, cancelable: true }) as any
    event.data = data || ''
    return event
  }
  
  global.CompositionEvent = function(type: string, eventInitDict?: any) {
    const event = createCompositionEvent(type, eventInitDict?.data)
    Object.assign(event, eventInitDict)
    return event
  } as any
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
    getData: vi.fn((format: string) => ''),
    setData: vi.fn((format: string, data: string) => true),
    clearData: vi.fn((format?: string) => undefined)
  }
  
  global.ClipboardEvent = function(type: string, eventInitDict?: any) {
    const event = new Event(type, eventInitDict) as any
    event.clipboardData = mockClipboardData
    Object.assign(event, eventInitDict)
    return event
  } as any
  
  global.DataTransfer = function() {
    return mockClipboardData
  } as any
}

/**
 * Set up IME (Input Method Editor) support
 */
function setupIMESupport() {
  global.InputEvent = function(type: string, eventInitDict?: any) {
    const event = new Event(type, eventInitDict) as any
    event.data = eventInitDict?.data || null
    event.inputType = eventInitDict?.inputType || ''
    event.isComposing = eventInitDict?.isComposing || false
    return event
  } as any
  
  // Mock composition events
  global.CompositionEvent = function(type: string, eventInitDict?: any) {
    const event = new Event(type, eventInitDict) as any
    event.data = eventInitDict?.data || ''
    event.locale = eventInitDict?.locale || ''
    return event
  } as any
}

// Mock keyboard events with proper key codes
global.KeyboardEvent = function(type: string, eventInitDict?: any) {
  const event = new Event(type, eventInitDict) as any
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
  event.getModifierState = vi.fn((key: string) => false)
  return event
} as any

// Export utilities for use in tests
export const domUtils = {
  /**
   * Create a mock input element with typing features
   */
  createMockInput: (type = 'text') => {
    const input = document.createElement('input') as HTMLInputElement
    input.type = type
    return input
  },
  
  /**
   * Create a mock textarea element
   */
  createMockTextarea: () => {
    return document.createElement('textarea') as HTMLTextAreaElement
  },
  
  /**
   * Simulate typing into an element
   */
  simulateTyping: async (element: HTMLInputElement | HTMLTextAreaElement, text: string, options: {
    delay?: number
    triggerEvents?: boolean
  } = {}) => {
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
   */
  simulatePaste: (element: Element, text: string) => {
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
    } as any)
    
    element.dispatchEvent(pasteEvent)
    return pasteEvent
  },
  
  /**
   * Mock element dimensions
   */
  mockElementDimensions: (element: HTMLElement, dimensions: {
    width?: number
    height?: number
    top?: number
    left?: number
  }) => {
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
   */
  createKeyboardEvent: (type: string, options: {
    key?: string
    code?: string
    keyCode?: number
    ctrlKey?: boolean
    altKey?: boolean
    shiftKey?: boolean
    metaKey?: boolean
  } = {}) => {
    return new KeyboardEvent(type, {
      bubbles: true,
      cancelable: true,
      ...options
    })
  },
  
  /**
   * Create a mock composition event for IME testing
   */
  createCompositionEvent: (type: string, data = '') => {
    return new CompositionEvent(type, {
      bubbles: true,
      cancelable: true,
      data
    })
  }
}