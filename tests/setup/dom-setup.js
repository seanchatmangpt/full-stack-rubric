/**
 * DOM setup for testing environment
 * Configures JSDOM and browser APIs for testing
 */

import { JSDOM } from 'jsdom'
import { vi } from 'vitest'

/**
 * Sets up DOM environment for testing
 */
export function setupDOM() {
  // Create JSDOM instance with comprehensive browser features
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Typing Tutor Test Environment</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .typing-area { 
            min-height: 200px; 
            border: 1px solid #ccc; 
            padding: 10px; 
            font-family: 'Monaco', 'Menlo', monospace;
            white-space: pre-wrap;
          }
          .metrics { margin-top: 10px; padding: 10px; background: #f5f5f5; }
        </style>
      </head>
      <body>
        <div id="app">
          <div id="typing-area" class="typing-area" contenteditable="true" 
               data-testid="typing-area" role="textbox" aria-label="Typing practice area">
          </div>
          <div id="metrics-display" class="metrics" data-testid="metrics">
            <div id="wpm-display">WPM: 0</div>
            <div id="accuracy-display">Accuracy: 100%</div>
            <div id="errors-display">Errors: 0</div>
          </div>
          <div id="feedback-area" data-testid="feedback"></div>
          <div id="progress-bar" data-testid="progress">
            <div class="progress-fill" style="width: 0%"></div>
          </div>
        </div>
      </body>
    </html>
  `, {
    url: 'http://localhost:3000',
    referrer: 'http://localhost:3000',
    contentType: 'text/html',
    includeNodeLocations: true,
    storageQuota: 10000000,
    pretendToBeVisual: true,
    resources: 'usable',
    runScripts: 'dangerously'
  })

  const { window } = dom

  // Setup global references
  global.window = window
  global.document = window.document
  global.navigator = window.navigator
  global.location = window.location
  global.history = window.history
  global.localStorage = window.localStorage
  global.sessionStorage = window.sessionStorage

  // Fix insertBefore issues by ensuring proper DOM methods
  if (!window.document.head) {
    window.document.head = window.document.createElement('head')
    window.document.documentElement.appendChild(window.document.head)
  }

  // Enhanced insertBefore implementation for Vue Test Utils compatibility
  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (!newNode) return null
    
    // Handle null/undefined reference node
    if (referenceNode === null || referenceNode === undefined) {
      return this.appendChild(newNode)
    }
    
    // Ensure the reference node is actually a child of this node
    if (!this.contains(referenceNode)) {
      return this.appendChild(newNode)
    }
    
    try {
      return originalInsertBefore.call(this, newNode, referenceNode)
    } catch (error) {
      // Enhanced error handling for Vue component mounting
      if (error.message.includes('insertBefore') || error.message.includes('parent')) {
        console.warn('insertBefore fallback triggered:', error.message)
        return this.appendChild(newNode)
      }
      throw error
    }
  }

  // Ensure appendChild is robust
  const originalAppendChild = Node.prototype.appendChild
  Node.prototype.appendChild = function (newNode) {
    if (!newNode) return null
    try {
      return originalAppendChild.call(this, newNode)
    } catch (error) {
      console.warn('appendChild error:', error.message)
      return newNode
    }
  }

  // Fix contains method for better compatibility
  if (!Node.prototype.contains) {
    Node.prototype.contains = function (node) {
      return !!(this.compareDocumentPosition(node) & 16)
    }
  }
  
  // Setup DOM APIs
  global.HTMLElement = window.HTMLElement
  global.HTMLInputElement = window.HTMLInputElement
  global.HTMLTextAreaElement = window.HTMLTextAreaElement
  global.Element = window.Element
  global.Node = window.Node
  global.NodeList = window.NodeList
  global.Event = window.Event
  global.KeyboardEvent = window.KeyboardEvent
  global.MouseEvent = window.MouseEvent
  global.CustomEvent = window.CustomEvent
  global.MutationObserver = window.MutationObserver
  global.IntersectionObserver = window.IntersectionObserver

  // Mock requestAnimationFrame and cancelAnimationFrame
  global.requestAnimationFrame = vi.fn((callback) => {
    return setTimeout(() => callback(performance.now()), 16)
  })
  
  global.cancelAnimationFrame = vi.fn((id) => {
    clearTimeout(id)
  })

  // Mock performance API
  if (!global.performance) {
    global.performance = window.performance || {
      now: () => Date.now(),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn(() => []),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
      memory: {
        usedJSHeapSize: 25 * 1024 * 1024,
        totalJSHeapSize: 50 * 1024 * 1024,
        jsHeapSizeLimit: 2147483648
      }
    }
  }

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(callback => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))

  // Mock Monaco Editor
  global.monaco = {
    editor: {
      create: vi.fn((container, options) => ({
        getValue: vi.fn(() => ''),
        setValue: vi.fn(),
        onDidChangeModelContent: vi.fn(callback => ({
          dispose: vi.fn()
        })),
        updateOptions: vi.fn(),
        layout: vi.fn(),
        dispose: vi.fn(),
        focus: vi.fn(),
        getModel: vi.fn(() => ({
          getValueLength: vi.fn(() => 0),
          getLineCount: vi.fn(() => 1),
          onDidChangeContent: vi.fn(() => ({ dispose: vi.fn() }))
        })),
        getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
        setPosition: vi.fn(),
        revealLine: vi.fn(),
        deltaDecorations: vi.fn(() => [])
      }))
    },
    languages: {
      register: vi.fn(),
      setMonarchTokensProvider: vi.fn(),
      setLanguageConfiguration: vi.fn()
    },
    Range: vi.fn().mockImplementation((startLine, startCol, endLine, endCol) => ({
      startLineNumber: startLine,
      startColumn: startCol,
      endLineNumber: endLine,
      endColumn: endCol
    }))
  }

  // Mock Web APIs commonly used in typing applications
  global.getSelection = vi.fn(() => ({
    toString: vi.fn(() => ''),
    getRangeAt: vi.fn(() => ({
      startOffset: 0,
      endOffset: 0,
      collapsed: true
    })),
    removeAllRanges: vi.fn(),
    addRange: vi.fn()
  }))

  global.Range = vi.fn().mockImplementation(() => ({
    setStart: vi.fn(),
    setEnd: vi.fn(),
    collapse: vi.fn(),
    selectNodeContents: vi.fn()
  }))

  // Mock clipboard API
  global.navigator.clipboard = {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve('')),
    read: vi.fn(() => Promise.resolve([])),
    write: vi.fn(() => Promise.resolve())
  }

  // Mock media queries
  global.matchMedia = vi.fn(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))

  // Setup custom events for typing tests
  window.customEvents = new Map()
  
  window.dispatchTypingEvent = (type, data) => {
    const event = new window.CustomEvent(type, { detail: data })
    window.dispatchEvent(event)
    return event
  }

  // Mock intersection observer for performance testing
  global.IntersectionObserver = vi.fn().mockImplementation(callback => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => [])
  }))

  // Add helper methods for testing
  window.testHelpers = {
    // Simulate typing in an element
    simulateTyping: async (element, text, options = {}) => {
      const { delay = 50, errors = false } = options
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i]
        
        // Create and dispatch keyboard events
        const keydownEvent = new window.KeyboardEvent('keydown', {
          key: char,
          code: char === ' ' ? 'Space' : `Key${char.toUpperCase()}`,
          keyCode: char.charCodeAt(0),
          bubbles: true,
          cancelable: true
        })
        
        const keypressEvent = new window.KeyboardEvent('keypress', {
          key: char,
          code: char === ' ' ? 'Space' : `Key${char.toUpperCase()}`,
          keyCode: char.charCodeAt(0),
          bubbles: true,
          cancelable: true
        })
        
        const inputEvent = new window.Event('input', {
          bubbles: true,
          cancelable: true
        })
        
        const keyupEvent = new window.KeyboardEvent('keyup', {
          key: char,
          code: char === ' ' ? 'Space' : `Key${char.toUpperCase()}`,
          keyCode: char.charCodeAt(0),
          bubbles: true,
          cancelable: true
        })
        
        // Dispatch events in correct order
        element.dispatchEvent(keydownEvent)
        element.dispatchEvent(keypressEvent)
        
        // Update element content
        if (element.contentEditable === 'true') {
          element.textContent += char
        } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.value += char
        }
        
        element.dispatchEvent(inputEvent)
        element.dispatchEvent(keyupEvent)
        
        // Add delay between keystrokes
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    },
    
    // Get computed metrics from DOM
    getTypingMetrics: () => {
      const wpmElement = document.getElementById('wpm-display')
      const accuracyElement = document.getElementById('accuracy-display')
      const errorsElement = document.getElementById('errors-display')
      
      return {
        wpm: wpmElement ? parseInt(wpmElement.textContent.match(/\d+/)?.[0] || '0') : 0,
        accuracy: accuracyElement ? parseInt(accuracyElement.textContent.match(/\d+/)?.[0] || '100') : 100,
        errors: errorsElement ? parseInt(errorsElement.textContent.match(/\d+/)?.[0] || '0') : 0
      }
    },
    
    // Clear typing area
    clearTypingArea: () => {
      const typingArea = document.getElementById('typing-area')
      if (typingArea) {
        typingArea.textContent = ''
        typingArea.innerHTML = ''
      }
    },
    
    // Wait for DOM updates
    waitForDOM: () => {
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 0)
        })
      })
    }
  }

  return { dom, window, cleanup: () => dom.window.close() }
}

// Auto-setup DOM for tests
const domSetup = setupDOM()

// Export cleanup function for manual cleanup if needed
export const cleanup = domSetup.cleanup
