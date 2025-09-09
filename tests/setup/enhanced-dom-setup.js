/**
 * @fileoverview Enhanced DOM setup for comprehensive testing
 * Fixes common DOM mocking issues and provides stable test environment
 */

import { vi } from 'vitest'

// Enhanced performance API mock
const createPerformanceMock = () => {
  const performanceEntries = []
  
  return {
    now: vi.fn(() => Date.now()),
    timeOrigin: Date.now(),
    memory: {
      usedJSHeapSize: 25 * 1024 * 1024, // 25MB
      totalJSHeapSize: 35 * 1024 * 1024, // 35MB  
      jsHeapSizeLimit: 2 * 1024 * 1024 * 1024 // 2GB
    },
    getEntries: vi.fn(() => [...performanceEntries]),
    getEntriesByType: vi.fn((type) => {
      if (type === 'navigation') {
        return [{
          navigationStart: 0,
          loadEventEnd: 1200,
          domContentLoadedEventEnd: 800,
          responseEnd: 500
        }]
      }
      if (type === 'resource') {
        return [
          { name: '/test.js', duration: 100 },
          { name: '/test.css', duration: 50 }
        ]
      }
      return []
    }),
    getEntriesByName: vi.fn(() => []),
    mark: vi.fn((name) => {
      performanceEntries.push({ name, entryType: 'mark', startTime: Date.now() })
    }),
    measure: vi.fn((name, start, end) => {
      performanceEntries.push({ 
        name, 
        entryType: 'measure', 
        startTime: Date.now(),
        duration: 100 
      })
    }),
    clearMarks: vi.fn(() => {
      performanceEntries.length = 0
    }),
    clearMeasures: vi.fn(() => {
      performanceEntries.length = 0
    })
  }
}

// Enhanced DOM element mock
const createElementMock = (tagName) => {
  const element = {
    tagName: tagName.toUpperCase(),
    id: '',
    className: '',
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(() => false),
      toggle: vi.fn()
    },
    style: {},
    getAttribute: vi.fn(() => null),
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    hasAttribute: vi.fn(() => false),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    insertBefore: vi.fn(),
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
    getBoundingClientRect: vi.fn(() => ({
      top: 0, left: 0, bottom: 100, right: 100,
      width: 100, height: 100, x: 0, y: 0
    })),
    focus: vi.fn(),
    blur: vi.fn(),
    click: vi.fn(),
    dispatchEvent: vi.fn(),
    innerHTML: '',
    textContent: '',
    value: '',
    checked: false,
    disabled: false,
    href: '',
    src: '',
    alt: '',
    type: '',
    rel: '',
    as: '',
    onload: null,
    onerror: null,
    onabort: null,
    children: [],
    parentElement: null,
    nextElementSibling: null,
    previousElementSibling: null
  }
  
  // Tag-specific properties
  if (tagName === 'link') {
    element.sheet = null
  }
  
  if (tagName === 'script') {
    element.async = false
    element.defer = false
  }
  
  return element
}

// Enhanced document mock
const createDocumentMock = () => {
  const elements = new Map()
  
  const head = createElementMock('head')
  const body = createElementMock('body')
  
  return {
    createElement: vi.fn((tagName) => {
      const element = createElementMock(tagName)
      elements.set(element, tagName)
      return element
    }),
    createTextNode: vi.fn(text => ({ textContent: text, nodeType: 3 })),
    createDocumentFragment: vi.fn(() => ({
      appendChild: vi.fn(),
      childNodes: []
    })),
    getElementById: vi.fn(() => null),
    getElementsByClassName: vi.fn(() => []),
    getElementsByTagName: vi.fn((tagName) => {
      if (tagName === 'head') return [head]
      if (tagName === 'body') return [body]
      return []
    }),
    querySelector: vi.fn((selector) => {
      if (selector === 'head') return head
      if (selector === 'body') return body
      return null
    }),
    querySelectorAll: vi.fn(() => []),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    head,
    body,
    documentElement: {
      style: {},
      classList: { add: vi.fn(), remove: vi.fn() }
    },
    readyState: 'complete',
    cookie: '',
    title: 'Test Document',
    URL: 'http://localhost:3000/',
    domain: 'localhost',
    referrer: '',
    location: {
      href: 'http://localhost:3000/',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: ''
    }
  }
}

// Enhanced window mock
const createWindowMock = () => {
  const window = {
    performance: createPerformanceMock(),
    localStorage: {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(() => null)
    },
    sessionStorage: {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(() => null)
    },
    navigator: {
      userAgent: 'Mozilla/5.0 (Test Environment)',
      language: 'en-US',
      languages: ['en-US', 'en'],
      platform: 'Test',
      cookieEnabled: true,
      onLine: true,
      hardwareConcurrency: 4,
      maxTouchPoints: 0
    },
    screen: {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      colorDepth: 24,
      pixelDepth: 24
    },
    history: {
      length: 1,
      state: null,
      pushState: vi.fn(),
      replaceState: vi.fn(),
      go: vi.fn(),
      back: vi.fn(),
      forward: vi.fn()
    },
    location: {
      href: 'http://localhost:3000/',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: '',
      origin: 'http://localhost:3000',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn()
    },
    alert: vi.fn(),
    confirm: vi.fn(() => true),
    prompt: vi.fn(() => ''),
    open: vi.fn(() => null),
    close: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    setTimeout: vi.fn((fn, delay) => setTimeout(fn, delay)),
    clearTimeout: vi.fn(id => clearTimeout(id)),
    setInterval: vi.fn((fn, delay) => setInterval(fn, delay)),
    clearInterval: vi.fn(id => clearInterval(id)),
    requestAnimationFrame: vi.fn(fn => setTimeout(fn, 16)),
    cancelAnimationFrame: vi.fn(),
    getComputedStyle: vi.fn(() => ({
      getPropertyValue: vi.fn(() => ''),
      setProperty: vi.fn()
    })),
    matchMedia: vi.fn(query => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })),
    ResizeObserver: vi.fn(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn()
    })),
    MutationObserver: vi.fn(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn(() => [])
    })),
    IntersectionObserver: vi.fn(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn()
    })),
    fetch: vi.fn(() => Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      blob: () => Promise.resolve(new Blob())
    }))
  }
  
  // Make window self-referential
  window.self = window
  window.parent = window
  window.top = window
  window.window = window
  
  return window
}

// Setup enhanced global environment
const setupEnhancedGlobals = () => {
  const document = createDocumentMock()
  const window = createWindowMock()
  
  // Set globals
  global.document = document
  global.window = window
  global.self = window
  global.performance = window.performance
  global.localStorage = window.localStorage
  global.sessionStorage = window.sessionStorage
  global.navigator = window.navigator
  global.location = window.location
  global.history = window.history
  global.screen = window.screen
  
  // DOM globals
  global.Element = vi.fn()
  global.HTMLElement = vi.fn()
  global.Node = vi.fn()
  global.Text = vi.fn()
  global.Comment = vi.fn()
  global.DocumentFragment = vi.fn()
  
  // Event globals
  global.Event = vi.fn()
  global.CustomEvent = vi.fn()
  global.KeyboardEvent = vi.fn()
  global.MouseEvent = vi.fn()
  global.TouchEvent = vi.fn()
  
  // Utility globals
  global.URL = vi.fn(() => ({
    href: 'http://localhost:3000/',
    toString: () => 'http://localhost:3000/'
  }))
  global.URLSearchParams = vi.fn(() => ({
    get: vi.fn(() => null),
    set: vi.fn(),
    has: vi.fn(() => false),
    toString: () => ''
  }))
  
  global.FormData = vi.fn(() => ({
    append: vi.fn(),
    get: vi.fn(() => null),
    has: vi.fn(() => false)
  }))
  
  global.Headers = vi.fn(() => ({
    get: vi.fn(() => null),
    set: vi.fn(),
    has: vi.fn(() => false)
  }))
  
  global.Request = vi.fn()
  global.Response = vi.fn()
  
  // Media globals
  global.Image = vi.fn(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    src: '',
    width: 0,
    height: 0,
    onload: null,
    onerror: null
  }))
  
  global.Audio = vi.fn(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    src: '',
    volume: 1,
    currentTime: 0,
    duration: 0
  }))
  
  // Canvas globals
  global.CanvasRenderingContext2D = vi.fn()
  global.WebGLRenderingContext = vi.fn()
  
  // Console enhancements
  global.console = {
    ...global.console,
    group: vi.fn(),
    groupEnd: vi.fn(),
    groupCollapsed: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn(),
    count: vi.fn(),
    trace: vi.fn(),
    profile: vi.fn(),
    profileEnd: vi.fn()
  }
}

// Initialize enhanced environment
setupEnhancedGlobals()

// Export utilities for test use
export {
  createPerformanceMock,
  createElementMock,
  createDocumentMock,
  createWindowMock,
  setupEnhancedGlobals
}
