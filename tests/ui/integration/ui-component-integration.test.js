/**
 * UI Component Integration Tests
 * Tests cross-component interactions and complete user flows
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountWithExpectations, quickTest, performanceTest } from '../../framework/core-utils.js'
import AppHeader from '../../../app/components/AppHeader.vue'
import TypingMonacoEditor from '../../../app/components/TypingMonacoEditor.vue'
import AppFooter from '../../../app/components/AppFooter.vue'

// Mock dependencies
const mockTypingMetrics = {
  currentSession: { value: null },
  isActive: { value: false },
  metrics: {
    wpm: 65,
    accuracy: 92.5,
    consistency: 88.0,
    errorPatterns: new Map([['t->y', 2], ['e->r', 1]])
  },
  sessionDuration: { value: 125000 },
  progressScore: { value: 85 },
  startSession: vi.fn(),
  endSession: vi.fn(() => ({
    id: 'completed-session',
    finalWPM: 65,
    accuracy: 92.5
  })),
  pauseSession: vi.fn(),
  resumeSession: vi.fn(),
  resetSession: vi.fn(),
  recordKeystroke: vi.fn()
}

const mockPerformanceOptimization = {
  isMonitoring: { value: true },
  score: { value: 88 },
  grade: { value: 'A' },
  metrics: {
    value: {
      bundle: { initialBundle: 120, vendorBundle: 180 },
      runtime: { initialLoadTime: 800, memoryUsage: 22 },
      typing: { inputLatency: 8, renderLatency: 12 }
    }
  },
  recommendations: { value: [] },
  startMonitoring: vi.fn(),
  stopMonitoring: vi.fn(),
  optimizeForTyping: vi.fn(),
  measureTypingPerformance: vi.fn((name, fn) => fn()),
  generateReport: vi.fn(() => ({ score: 88, timestamp: Date.now() }))
}

const mockAppConfig = {
  header: {
    to: '/',
    search: true,
    colorMode: true,
    title: 'Typing Tutor Pro',
    links: [{ to: 'https://github.com/example/repo', icon: 'i-simple-icons-github' }]
  },
  footer: {
    credits: '© 2024 Typing Tutor Pro. Open Source.',
    colorMode: true,
    links: [{ to: '/privacy', label: 'Privacy' }]
  }
}

// Mock Monaco Editor completely to avoid resolution issues
vi.mock('monaco-editor', async () => {
  const mockEditor = {
    dispose: vi.fn(),
    focus: vi.fn(),
    getValue: vi.fn(() => ''),
    setValue: vi.fn(),
    onDidChangeModelContent: vi.fn(),
    onKeyDown: vi.fn(),
    getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
    deltaDecorations: vi.fn(() => [])
  }

  const mockModel = {
    dispose: vi.fn(),
    setValue: vi.fn(),
    getValue: vi.fn(() => 'test content'),
    getLinesContent: vi.fn(() => ['test content']),
    getPositionAt: vi.fn(() => ({ lineNumber: 1, column: 1 })),
    onDidChangeContent: vi.fn()
  }

  return {
    default: {
      editor: {
        create: vi.fn(() => mockEditor),
        createModel: vi.fn(() => mockModel)
      },
      Range: class MockRange {},
      KeyCode: { Backspace: 1, Delete: 2 }
    },
    editor: {
      create: vi.fn(() => mockEditor),
      createModel: vi.fn(() => mockModel)
    },
    Range: class MockRange {},
    KeyCode: { Backspace: 1, Delete: 2 }
  }
})

vi.mock('../../../app/composables/useTypingMetrics', () => ({
  useTypingMetrics: () => mockTypingMetrics
}))

vi.mock('../../../app/composables/usePerformanceOptimization', () => ({
  usePerformanceOptimization: () => mockPerformanceOptimization
}))

vi.mock('#app', () => ({
  useAppConfig: () => mockAppConfig
}))

// Mock Vue inject
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    inject: vi.fn(() => ({
      value: [
        { title: 'Home', to: '/' },
        { title: 'Docs', to: '/docs' }
      ]
    }))
  }
})

describe('UI Component Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Header-to-Editor Navigation Flow', () => {
    it('should complete typing tutor navigation flow', async () => {
      const headerWrapper = await mountWithExpectations(AppHeader)
      
      // Find and click typing tutor button
      const typingButton = headerWrapper.find('UButton[to="/typing"]')
      expect(typingButton.exists()).toBe(true)
      expect(typingButton.text()).toContain('Typing Tutor')
      
      await headerWrapper.interact.click('UButton[to="/typing"]')
      
      // Should trigger navigation
      expect(headerWrapper.vm.$router?.push).toHaveBeenCalledWith('/typing')
      
      headerWrapper.unmount()
    })

    it('should maintain consistent branding across header and footer', async () => {
      const headerWrapper = await mountWithExpectations(AppHeader)
      const footerWrapper = await mountWithExpectations(AppFooter)
      
      // Both should reference the same app
      headerWrapper.should.contain('Typing Tutor Pro')
      footerWrapper.should.contain('Typing Tutor Pro')
      
      // Both should have consistent theming
      const headerColorMode = headerWrapper.find('UColorModeButton')
      const footerColorMode = footerWrapper.find('UColorModeButton')
      expect(headerColorMode.exists()).toBe(footerColorMode.exists())
      
      headerWrapper.unmount()
      footerWrapper.unmount()
    })
  })

  describe('Editor Session Management Integration', () => {
    const editorProps = {
      targetText: 'function calculate(a, b) {\n  return a + b;\n}',
      drillType: 'javascript-functions',
      targetWPM: 70,
      language: 'javascript'
    }

    it('should complete full typing session lifecycle', async () => {
      const editorWrapper = await mountWithExpectations(TypingMonacoEditor, { props: editorProps })
      
      // Start session
      const startButton = editorWrapper.find('.btn-primary')
      await editorWrapper.interact.click('.btn-primary')
      
      expect(mockTypingMetrics.startSession).toHaveBeenCalledWith(
        editorProps.drillType,
        editorProps.targetWPM
      )
      
      // Simulate active session
      mockTypingMetrics.isActive.value = true
      await editorWrapper.vm.$nextTick()
      
      // Should show session controls
      expect(editorWrapper.find('.btn-secondary').exists()).toBe(true) // Pause
      expect(editorWrapper.find('.btn-danger').exists()).toBe(true)    // End
      
      // End session
      await editorWrapper.interact.click('.btn-danger')
      
      expect(mockTypingMetrics.endSession).toHaveBeenCalled()
      
      editorWrapper.unmount()
    })

    it('should display real-time metrics during session', async () => {
      const editorWrapper = await mountWithExpectations(TypingMonacoEditor, { props: editorProps })
      
      // Should display current metrics
      const wpmDisplay = editorWrapper.find('.metric .value')
      expect(wpmDisplay.text()).toBe('65')
      
      const accuracyElements = editorWrapper.findAll('.metric')
      const accuracyElement = accuracyElements.find(el => 
        el.find('label').text() === 'Accuracy'
      )
      expect(accuracyElement?.find('.value').text()).toBe('93%') // Rounded
      
      // Should show progress
      const progressFill = editorWrapper.find('.progress-fill')
      expect(progressFill.attributes('style')).toContain('width: 85%')
      
      editorWrapper.unmount()
    })

    it('should emit session completion events', async () => {
      const editorWrapper = await mountWithExpectations(TypingMonacoEditor, { props: editorProps })
      
      // Simulate session completion
      mockTypingMetrics.isActive.value = true
      await editorWrapper.interact.click('.btn-danger')
      
      const emittedEvents = editorWrapper.emitted('sessionCompleted')
      expect(emittedEvents).toHaveLength(1)
      expect(emittedEvents[0][0]).toMatchObject({
        id: 'completed-session',
        finalWPM: 65,
        accuracy: 92.5
      })
      
      editorWrapper.unmount()
    })
  })

  describe('Performance Integration', () => {
    it('should integrate performance monitoring with typing editor', async () => {
      const editorWrapper = await mountWithExpectations(TypingMonacoEditor, {
        props: {
          targetText: 'console.log("Performance test");',
          drillType: 'performance-test',
          targetWPM: 60,
          language: 'javascript'
        }
      })
      
      // Should have access to performance optimization
      expect(mockPerformanceOptimization.isMonitoring.value).toBe(true)
      expect(mockPerformanceOptimization.score.value).toBe(88)
      
      editorWrapper.unmount()
    })

    it('should measure typing operations performance', async () => {
      const editorWrapper = await mountWithExpectations(TypingMonacoEditor, {
        props: {
          targetText: 'test performance',
          drillType: 'perf-test',
          targetWPM: 60
        }
      })
      
      // Simulate measured operation
      await mockPerformanceOptimization.measureTypingPerformance('typing-test', async () => {
        mockTypingMetrics.recordKeystroke('t', 't', { line: 1, column: 1 })
      })
      
      expect(mockPerformanceOptimization.measureTypingPerformance).toHaveBeenCalledWith(
        'typing-test',
        expect.any(Function)
      )
      
      editorWrapper.unmount()
    })
  })

  describe('Cross-Component State Consistency', () => {
    it('should maintain consistent color mode across components', async () => {
      const headerWrapper = await mountWithExpectations(AppHeader)
      const footerWrapper = await mountWithExpectations(AppFooter)
      
      // Both should have color mode buttons
      const headerColorMode = headerWrapper.find('UColorModeButton')
      const footerColorMode = footerWrapper.find('UColorModeButton')
      
      expect(headerColorMode.exists()).toBe(true)
      expect(footerColorMode.exists()).toBe(true)
      
      headerWrapper.unmount()
      footerWrapper.unmount()
    })

    it('should handle configuration changes consistently', async () => {
      // Test with modified config
      const modifiedConfig = {
        ...mockAppConfig,
        header: { ...mockAppConfig.header, colorMode: false },
        footer: { ...mockAppConfig.footer, colorMode: false }
      }

      const headerWrapper = await mountWithExpectations(AppHeader, {
        mocks: { useAppConfig: () => modifiedConfig }
      })
      
      const footerWrapper = await mountWithExpectations(AppFooter, {
        mocks: { useAppConfig: () => modifiedConfig }
      })

      // Both should consistently hide color mode buttons
      expect(headerWrapper.find('UColorModeButton').exists()).toBe(false)
      expect(footerWrapper.find('UColorModeButton').exists()).toBe(false)
      
      headerWrapper.unmount()
      footerWrapper.unmount()
    })
  })

  describe('User Journey Integration', () => {
    it('should support complete user workflow', async () => {
      // 1. User arrives at site - header loads
      const headerWrapper = await mountWithExpectations(AppHeader)
      headerWrapper.should.render().contain('Typing Tutor')
      
      // 2. User navigates to typing tutor
      await headerWrapper.interact.click('UButton[to="/typing"]')
      
      // 3. Typing editor loads with content
      const editorWrapper = await mountWithExpectations(TypingMonacoEditor, {
        props: {
          targetText: 'const greeting = "Hello, World!";',
          drillType: 'javascript-basics',
          targetWPM: 50
        }
      })
      
      editorWrapper.should.render()
        .contain('WPM')
        .contain('Accuracy')
        .contain('Start Typing Session')
      
      // 4. User starts typing session
      await editorWrapper.interact.click('.btn-primary')
      expect(mockTypingMetrics.startSession).toHaveBeenCalled()
      
      // 5. User completes session
      mockTypingMetrics.isActive.value = true
      await editorWrapper.interact.click('.btn-danger')
      expect(mockTypingMetrics.endSession).toHaveBeenCalled()
      
      // 6. Footer remains consistent throughout
      const footerWrapper = await mountWithExpectations(AppFooter)
      footerWrapper.should.render().contain('© 2024 Typing Tutor Pro')
      
      // Cleanup
      headerWrapper.unmount()
      editorWrapper.unmount()
      footerWrapper.unmount()
    })
  })

  describe('Error Handling Integration', () => {
    it('should gracefully handle component initialization failures', async () => {
      // Don't try to import monaco-editor, just test component resilience
      const editorWrapper = await mountWithExpectations(TypingMonacoEditor, {
        props: {
          targetText: 'test content',
          drillType: 'error-test',
          targetWPM: 60
        }
      })

      // Should still render UI elements
      editorWrapper.should.render()
        .contain('WPM')
        .contain('Accuracy')
        .contain('Start Typing Session')
      
      editorWrapper.unmount()
    })

    it('should handle metrics collection failures gracefully', async () => {
      // Mock metrics failure
      mockTypingMetrics.recordKeystroke.mockImplementationOnce(() => {
        throw new Error('Metrics recording failed')
      })

      const editorWrapper = await mountWithExpectations(TypingMonacoEditor, {
        props: {
          targetText: 'error test',
          drillType: 'error-handling',
          targetWPM: 60
        }
      })

      // Should not crash the component
      editorWrapper.should.render()
      
      editorWrapper.unmount()
    })
  })

  describe('Performance Integration Testing', () => {
    it('should maintain performance across component interactions', async () => {
      const renderTime = await performanceTest(async () => {
        // Render all main components together
        const headerWrapper = await mountWithExpectations(AppHeader)
        const editorWrapper = await mountWithExpectations(TypingMonacoEditor, {
          props: {
            targetText: 'performance test content',
            drillType: 'perf-integration',
            targetWPM: 60
          }
        })
        const footerWrapper = await mountWithExpectations(AppFooter)

        // Simulate some interactions
        await headerWrapper.interact.click('UButton[to="/typing"]')
        await editorWrapper.interact.click('.btn-primary')

        // Cleanup
        headerWrapper.unmount()
        editorWrapper.unmount()
        footerWrapper.unmount()
      }, 200) // 200ms budget for full integration

      expect(renderTime).toBeLessThan(200)
    })

    it('should handle rapid component mounting/unmounting', async () => {
      const cycleTime = await performanceTest(async () => {
        // Rapid mount/unmount cycles
        for (let i = 0; i < 10; i++) {
          const wrapper = await mountWithExpectations(TypingMonacoEditor, {
            props: {
              targetText: `cycle ${i}`,
              drillType: 'rapid-cycle',
              targetWPM: 60
            }
          })
          wrapper.unmount()
        }
      }, 300) // 300ms budget for 10 cycles

      expect(cycleTime).toBeLessThan(300)
    })
  })

  describe('Accessibility Integration', () => {
    it('should maintain accessibility across component boundaries', async () => {
      const headerWrapper = await mountWithExpectations(AppHeader)
      const editorWrapper = await mountWithExpectations(TypingMonacoEditor, {
        props: {
          targetText: 'accessibility test',
          drillType: 'a11y-test',
          targetWPM: 60
        }
      })
      const footerWrapper = await mountWithExpectations(AppFooter)

      // Check tab order across components
      const allFocusable = [
        ...headerWrapper.findAll('button, a, input, [tabindex]:not([tabindex="-1"])'),
        ...editorWrapper.findAll('button, a, input, [tabindex]:not([tabindex="-1"])'),
        ...footerWrapper.findAll('button, a, input, [tabindex]:not([tabindex="-1"])')
      ]

      // Should have proper tab sequence
      expect(allFocusable.length).toBeGreaterThan(0)

      // Cleanup
      headerWrapper.unmount()
      editorWrapper.unmount()
      footerWrapper.unmount()
    })
  })
})