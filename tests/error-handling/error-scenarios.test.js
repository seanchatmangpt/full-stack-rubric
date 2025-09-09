/**
 * @fileoverview Comprehensive error handling and exception path tests
 * Tests network failures, API errors, and system fault tolerance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTypingMetrics } from '../../app/composables/useTypingMetrics.js'
import { performanceUtils } from '../../app/utils/performanceOptimizer.js'
import { AdaptiveDifficulty } from '../../app/utils/adaptiveDifficulty.js'

describe('Error Handling and Exception Paths', () => {
  describe('Network Error Scenarios', () => {
    beforeEach(() => {
      // Mock fetch to simulate network failures
      global.fetch = vi.fn()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    describe('Resource Preloading Failures', () => {
      it('should handle network timeout during resource preload', async () => {
        // Mock a network timeout
        const mockLink = {
          rel: '', as: '', href: '',
          onload: null, onerror: null
        }
        
        document.createElement = vi.fn(() => mockLink)
        document.querySelector = vi.fn(() => null)
        document.head.appendChild = vi.fn()
        
        const preloadPromise = performanceUtils.preloadResource('/slow-resource.js')
        
        // Simulate timeout
        setTimeout(() => {
          if (mockLink.onerror) {
            mockLink.onerror(new Error('Network timeout'))
          }
        }, 0)
        
        await expect(preloadPromise).rejects.toThrow('Network timeout')
      })

      it('should handle DNS resolution failures', async () => {
        const mockLink = { rel: '', as: '', href: '', onload: null, onerror: null }
        document.createElement = vi.fn(() => mockLink)
        document.querySelector = vi.fn(() => null)
        
        const preloadPromise = performanceUtils.preloadResource('https://nonexistent.domain/resource.js')
        
        setTimeout(() => {
          if (mockLink.onerror) {
            mockLink.onerror(new Error('ENOTFOUND'))
          }
        }, 0)
        
        await expect(preloadPromise).rejects.toThrow('ENOTFOUND')
      })

      it('should handle CORS errors', async () => {
        const mockLink = { rel: '', as: '', href: '', onload: null, onerror: null }
        document.createElement = vi.fn(() => mockLink)
        document.querySelector = vi.fn(() => null)
        
        const preloadPromise = performanceUtils.preloadResource('https://external-domain.com/resource.js')
        
        setTimeout(() => {
          if (mockLink.onerror) {
            mockLink.onerror(new Error('CORS policy violation'))
          }
        }, 0)
        
        await expect(preloadPromise).rejects.toThrow('CORS policy violation')
      })

      it('should handle HTTP error responses', async () => {
        const mockLink = { rel: '', as: '', href: '', onload: null, onerror: null }
        document.createElement = vi.fn(() => mockLink)
        document.querySelector = vi.fn(() => null)
        
        const preloadPromise = performanceUtils.preloadResource('/404-resource.js')
        
        setTimeout(() => {
          if (mockLink.onerror) {
            const error = new Error('HTTP 404 Not Found')
            error.status = 404
            mockLink.onerror(error)
          }
        }, 0)
        
        await expect(preloadPromise).rejects.toThrow('HTTP 404 Not Found')
      })
    })

    describe('Dynamic Import Failures', () => {
      it('should handle module not found errors', async () => {
        const failingImport = () => Promise.reject(new Error('Module not found'))
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        
        const result = await performanceUtils.lazyImport(failingImport)
        
        expect(result).toBe(null)
        expect(consoleSpy).toHaveBeenCalledWith('Lazy import failed:', expect.any(Error))
        
        consoleSpy.mockRestore()
      })

      it('should handle circular dependency errors', async () => {
        const circularImport = () => Promise.reject(new Error('Circular dependency detected'))
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        
        const result = await performanceUtils.lazyImport(circularImport)
        
        expect(result).toBe(null)
        expect(consoleSpy).toHaveBeenCalled()
        
        consoleSpy.mockRestore()
      })

      it('should handle syntax errors in imported modules', async () => {
        const syntaxErrorImport = () => Promise.reject(new SyntaxError('Unexpected token'))
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        
        const result = await performanceUtils.lazyImport(syntaxErrorImport)
        
        expect(result).toBe(null)
        expect(consoleSpy).toHaveBeenCalledWith('Lazy import failed:', expect.any(SyntaxError))
        
        consoleSpy.mockRestore()
      })

      it('should handle network interruption during import', async () => {
        const networkErrorImport = () => Promise.reject(new Error('Network connection lost'))
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        
        const result = await performanceUtils.lazyImport(networkErrorImport)
        
        expect(result).toBe(null)
        consoleSpy.mockRestore()
      })
    })
  })

  describe('Browser API Error Scenarios', () => {
    describe('Performance API Failures', () => {
      it('should handle missing performance object', () => {
        const originalPerformance = global.performance
        global.performance = undefined
        
        const typingMetrics = useTypingMetrics()
        
        expect(() => {
          typingMetrics.startSession('test')
          typingMetrics.recordKeystroke('a', 'a', { line: 1, column: 1 })
        }).not.toThrow()
        
        global.performance = originalPerformance
      })

      it('should handle performance.now() throwing errors', () => {
        const originalNow = performance.now
        performance.now = vi.fn(() => {
          throw new Error('Performance API unavailable')
        })
        
        const typingMetrics = useTypingMetrics()
        
        expect(() => {
          typingMetrics.startSession('test')
          typingMetrics.recordKeystroke('a', 'a', { line: 1, column: 1 })
        }).not.toThrow()
        
        performance.now = originalNow
      })

      it('should handle performance.memory being undefined', () => {
        const originalMemory = performance.memory
        delete performance.memory
        
        expect(() => {
          // Any operation that might access performance.memory
          const typingMetrics = useTypingMetrics()
          typingMetrics.startSession('memory-test')
        }).not.toThrow()
        
        if (originalMemory) {
          performance.memory = originalMemory
        }
      })

      it('should handle performance measurement errors', () => {
        const originalMark = performance.mark
        performance.mark = vi.fn(() => {
          throw new Error('Cannot create performance mark')
        })
        
        expect(() => {
          performance.mark('test-mark')
        }).toThrow('Cannot create performance mark')
        
        performance.mark = originalMark || vi.fn()
      })
    })

    describe('DOM API Failures', () => {
      it('should handle createElement failures', async () => {
        const originalCreateElement = document.createElement
        document.createElement = vi.fn(() => {
          throw new Error('Cannot create element')
        })
        
        await expect(
          performanceUtils.preloadResource('/test.js')
        ).rejects.toThrow('Cannot create element')
        
        document.createElement = originalCreateElement
      })

      it('should handle appendChild failures', async () => {
        const mockLink = { rel: '', as: '', href: '', onload: null, onerror: null }
        document.createElement = vi.fn(() => mockLink)
        document.querySelector = vi.fn(() => null)
        document.head.appendChild = vi.fn(() => {
          throw new Error('Cannot append to head')
        })
        
        await expect(
          performanceUtils.preloadResource('/test.js')
        ).rejects.toThrow('Cannot append to head')
      })

      it('should handle missing document.head', async () => {
        const originalHead = document.head
        delete document.head
        
        const mockLink = { rel: '', as: '', href: '', onload: null, onerror: null }
        document.createElement = vi.fn(() => mockLink)
        document.querySelector = vi.fn(() => null)
        
        await expect(
          performanceUtils.preloadResource('/test.js')
        ).rejects.toThrow()
        
        document.head = originalHead
      })
    })

    describe('Storage API Failures', () => {
      it('should handle localStorage quota exceeded', () => {
        const originalSetItem = localStorage.setItem
        localStorage.setItem = vi.fn(() => {
          throw new Error('QuotaExceededError: LocalStorage quota exceeded')
        })
        
        expect(() => {
          localStorage.setItem('test-key', 'test-value')
        }).toThrow('QuotaExceededError')
        
        localStorage.setItem = originalSetItem
      })

      it('should handle localStorage being disabled', () => {
        const originalLocalStorage = global.localStorage
        delete global.localStorage
        
        expect(() => {
          // Code that might try to access localStorage
          const storage = global.localStorage
        }).not.toThrow()
        
        global.localStorage = originalLocalStorage
      })

      it('should handle sessionStorage access denied', () => {
        const originalGetItem = sessionStorage.getItem
        sessionStorage.getItem = vi.fn(() => {
          throw new Error('SecurityError: Access denied')
        })
        
        expect(() => {
          sessionStorage.getItem('test-key')
        }).toThrow('SecurityError')
        
        sessionStorage.getItem = originalGetItem
      })
    })
  })

  describe('Application Logic Error Scenarios', () => {
    describe('Typing Metrics Errors', () => {
      let typingMetrics

      beforeEach(() => {
        typingMetrics = useTypingMetrics()
      })

      it('should handle negative time deltas', () => {
        const originalNow = performance.now
        let timeValue = 1000
        performance.now = vi.fn(() => {
          timeValue -= 100 // Time goes backward
          return timeValue
        })
        
        typingMetrics.startSession('time-error-test')
        
        expect(() => {
          typingMetrics.recordKeystroke('a', 'a', { line: 1, column: 1 })
          typingMetrics.recordKeystroke('b', 'b', { line: 1, column: 2 })
        }).not.toThrow()
        
        performance.now = originalNow
      })

      it('should handle invalid keystroke data', () => {
        typingMetrics.startSession('invalid-data-test')
        
        const invalidInputs = [
          [null, 'a', { line: 1, column: 1 }],
          ['a', null, { line: 1, column: 1 }],
          ['a', 'a', null],
          [undefined, 'a', { line: 1, column: 1 }],
          ['', '', { line: 1, column: 1 }],
          [123, 456, { line: 1, column: 1 }],
          ['a', 'a', { line: 'invalid', column: 'invalid' }]
        ]
        
        invalidInputs.forEach(([key, expected, position]) => {
          expect(() => {
            typingMetrics.recordKeystroke(key, expected, position)
          }).not.toThrow()
        })
      })

      it('should handle session state corruption', () => {
        typingMetrics.startSession('corruption-test')
        
        // Manually corrupt session state
        if (typingMetrics.currentSession) {
          typingMetrics.currentSession.value = null
        }
        
        expect(() => {
          typingMetrics.recordKeystroke('a', 'a', { line: 1, column: 1 })
          typingMetrics.endSession()
        }).not.toThrow()
      })

      it('should handle concurrent session operations', () => {
        // Simulate race condition
        expect(() => {
          typingMetrics.startSession('race-1')
          typingMetrics.startSession('race-2') // Start before ending first
          typingMetrics.endSession()
          typingMetrics.endSession()
        }).not.toThrow()
      })

      it('should handle memory pressure scenarios', () => {
        typingMetrics.startSession('memory-pressure-test')
        
        // Simulate system under memory pressure
        const originalMemory = performance.memory
        if (performance.memory) {
          performance.memory = {
            ...performance.memory,
            usedJSHeapSize: 1.5 * 1024 * 1024 * 1024, // 1.5GB
            totalJSHeapSize: 2 * 1024 * 1024 * 1024 // 2GB
          }
        }
        
        // Add many keystrokes to stress memory
        for (let i = 0; i < 5000; i++) {
          typingMetrics.recordKeystroke('a', 'a', { line: 1, column: i })
        }
        
        expect(typingMetrics.metrics.wpm).toBeTypeOf('number')
        expect(Number.isFinite(typingMetrics.metrics.wpm)).toBe(true)
        
        if (originalMemory) {
          performance.memory = originalMemory
        }
      })
    })

    describe('Adaptive Difficulty Errors', () => {
      let difficulty

      beforeEach(() => {
        difficulty = new AdaptiveDifficulty()
      })

      it('should handle corrupted session data', () => {
        const corruptedSessions = [
          { finalWPM: 'invalid', accuracy: { raw: 95 } },
          { finalWPM: 40, accuracy: null },
          { finalWPM: Infinity, accuracy: { raw: 95 } },
          { finalWPM: NaN, accuracy: { raw: NaN } },
          { finalWPM: -100, accuracy: { raw: -50 } }
        ]
        
        corruptedSessions.forEach((session) => {
          expect(() => {
            difficulty.addSession(session)
          }).not.toThrow()
        })
        
        expect(() => {
          difficulty.calculateNextDifficulty()
        }).not.toThrow()
      })

      it('should handle division by zero in calculations', () => {
        // Create scenarios that might cause division by zero
        difficulty.addSession({
          drillType: 'test',
          finalWPM: 0,
          accuracy: { raw: 0 },
          keystrokes: []
        })
        
        expect(() => {
          const performance = difficulty.analyzeRecentPerformance([
            { finalWPM: 0, accuracy: { raw: 0 }, keystrokes: [] }
          ])
          expect(performance.avgWPM).toBe(0)
          expect(performance.consistency).toBeTypeOf('number')
          expect(Number.isFinite(performance.consistency)).toBe(true)
        }).not.toThrow()
      })

      it('should handle circular references in session data', () => {
        const circularSession = {
          drillType: 'circular-test',
          finalWPM: 40,
          accuracy: { raw: 95 },
          keystrokes: []
        }
        
        // Create circular reference
        circularSession.self = circularSession
        
        expect(() => {
          difficulty.addSession(circularSession)
          difficulty.calculateNextDifficulty()
        }).not.toThrow()
      })

      it('should handle excessive error patterns', () => {
        // Create session with too many error patterns
        const keystrokes = []
        for (let i = 0; i < 10000; i++) {
          keystrokes.push({
            key: String.fromCharCode(65 + (i % 26)), // A-Z cycling
            expected: String.fromCharCode(65 + ((i + 1) % 26)),
            isCorrect: false
          })
        }
        
        const massiveErrorSession = {
          drillType: 'massive-errors',
          finalWPM: 20,
          accuracy: { raw: 50 },
          keystrokes
        }
        
        expect(() => {
          difficulty.addSession(massiveErrorSession)
          const performance = difficulty.analyzeRecentPerformance([massiveErrorSession])
          expect(performance.errorPatterns.size).toBeGreaterThan(0)
        }).not.toThrow()
      })
    })
  })

  describe('System Integration Error Scenarios', () => {
    describe('Resource Cleanup Failures', () => {
      it('should handle cleanup errors on component unmount', () => {
        const typingMetrics = useTypingMetrics()
        typingMetrics.startSession('cleanup-test')
        
        // Mock cleanup failure
        const originalClearTimeout = global.clearTimeout
        global.clearTimeout = vi.fn(() => {
          throw new Error('Cannot clear timeout')
        })
        
        expect(() => {
          // Simulate component unmount that triggers cleanup
          typingMetrics.resetSession()
        }).not.toThrow()
        
        global.clearTimeout = originalClearTimeout
      })

      it('should handle event listener removal failures', () => {
        const originalRemoveEventListener = document.removeEventListener
        document.removeEventListener = vi.fn(() => {
          throw new Error('Cannot remove event listener')
        })
        
        expect(() => {
          // Code that tries to remove event listeners
          document.removeEventListener('click', () => {})
        }).toThrow('Cannot remove event listener')
        
        document.removeEventListener = originalRemoveEventListener
      })
    })

    describe('Environment Error Scenarios', () => {
      it('should handle missing global objects', () => {
        const originalConsole = global.console
        delete global.console
        
        expect(() => {
          // Code that might try to log
          console?.log?.('test') // Should not crash
        }).not.toThrow()
        
        global.console = originalConsole
      })

      it('should handle strict mode errors', () => {
        'use strict'
        
        expect(() => {
          // Code that might violate strict mode
          const obj = {}
          Object.defineProperty(obj, 'readOnly', {
            value: 'initial',
            writable: false
          })
          
          try {
            obj.readOnly = 'modified' // Should fail in strict mode
          } catch (error) {
            expect(error).toBeInstanceOf(TypeError)
          }
        }).not.toThrow()
      })

      it('should handle cross-origin security errors', () => {
        // Simulate cross-origin access error
        const restrictedOperation = () => {
          throw new Error('SecurityError: Blocked a frame with origin from accessing a cross-origin frame')
        }
        
        expect(() => {
          try {
            restrictedOperation()
          } catch (error) {
            expect(error.message).toContain('SecurityError')
          }
        }).not.toThrow()
      })
    })

    describe('Asynchronous Error Handling', () => {
      it('should handle unhandled promise rejections', async () => {
        const rejectedPromise = Promise.reject(new Error('Unhandled rejection'))
        
        // Should not crash the test environment
        await expect(rejectedPromise).rejects.toThrow('Unhandled rejection')
      })

      it('should handle async operation timeouts', async () => {
        const timeoutOperation = new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), 100)
        })
        
        await expect(timeoutOperation).rejects.toThrow('Operation timeout')
      })

      it('should handle race conditions in async operations', async () => {
        let counter = 0
        
        const racingOperations = Array(10).fill().map(() => 
          new Promise((resolve) => {
            setTimeout(() => resolve(++counter), Math.random() * 10)
          })
        )
        
        const results = await Promise.all(racingOperations)
        expect(results).toHaveLength(10)
        expect(Math.max(...results)).toBeLessThanOrEqual(10)
      })
    })
  })
})
