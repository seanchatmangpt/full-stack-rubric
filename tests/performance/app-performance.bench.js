/**
 * Performance benchmarks for typing tutor application
 * Vitest benchmark tests for measuring performance metrics
 */

import { bench, describe } from 'vitest'
import { JSDOM } from 'jsdom'
import { createTypingSimulator, measureMemoryUsage, waitForNextFrame } from '../utils/performance-helpers.js'

let dom, window, document, typingSimulator

// Setup for benchmarks
const setupBenchmark = () => {
  dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="typing-area" contenteditable="true"></div>
      </body>
    </html>
  `, { 
    url: 'http://localhost:3000',
    pretendToBeVisual: true
  })

  window = dom.window
  document = window.document
  global.window = window
  global.document = document
  global.performance = window.performance || { now: () => Date.now() }
  global.requestAnimationFrame = callback => setTimeout(() => callback(performance.now()), 16)
  
  typingSimulator = createTypingSimulator(document)
}

const cleanupBenchmark = () => {
  dom?.window?.close()
}

describe('Typing Performance Benchmarks', () => {
  bench('typing response time', async () => {
    setupBenchmark()
    
    const typingArea = document.getElementById('typing-area')
    
    const event = new window.KeyboardEvent('keydown', {
      key: 'a',
      code: 'KeyA',
      keyCode: 65
    })
    
    typingArea.dispatchEvent(event)
    await waitForNextFrame()
    
    cleanupBenchmark()
  }, { time: 1000 })

  bench('memory allocation during typing', () => {
    setupBenchmark()
    
    const typingArea = document.getElementById('typing-area')
    
    // Simulate memory-intensive operation
    const data = new Array(1000).fill(0).map((_, i) => ({
      id: i,
      keystroke: String.fromCharCode(65 + (i % 26)),
      timestamp: Date.now()
    }))
    
    cleanupBenchmark()
    
    return data.length
  }, { time: 500 })

  bench('concurrent event processing', async () => {
    setupBenchmark()
    
    const eventCount = 100
    const events = Array.from({ length: eventCount }, (_, i) => 
      new window.KeyboardEvent('keydown', {
        key: String.fromCharCode(97 + (i % 26)),
        code: `Key${String.fromCharCode(65 + (i % 26))}`
      })
    )
    
    const typingArea = document.getElementById('typing-area')
    
    // Process all events
    events.forEach((event) => {
      typingArea.dispatchEvent(event)
    })
    
    cleanupBenchmark()
  }, { time: 1000 })

  bench('application initialization time', () => {
    // Simulate app initialization
    const app = { initialized: false }
    
    // Mock initialization process
    app.initialized = true
    
    return app.initialized
  }, { time: 100 })

  bench('performance metrics collection overhead', () => {
    // Simulate metrics collection
    const metrics = {
      keystrokes: 0,
      errors: 0,
      wpm: 0,
      accuracy: 0,
      sessionTime: 0
    }
    
    // Update metrics (should be very fast)
    for (let i = 0; i < 1000; i++) {
      metrics.keystrokes++
      metrics.wpm = (metrics.keystrokes / 5) / (Date.now() / 60000)
      metrics.accuracy = (1 - metrics.errors / metrics.keystrokes) * 100
    }
    
    return metrics.keystrokes
  }, { time: 500 })
})
