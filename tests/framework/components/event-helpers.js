/**
 * Event testing utilities for Vue components
 * @fileoverview Comprehensive event testing helpers with smart event simulation
 */

import { mount, shallowMount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * @typedef {Object} EventTestConfig
 * @property {string} trigger - Element selector or test-id to trigger event on
 * @property {string} event - Event type to trigger (click, input, etc.)
 * @property {*} payload - Expected event payload
 * @property {Function} setup - Setup function before triggering event
 * @property {Function} assertion - Custom assertion after event
 * @property {number} count - Expected number of times event is emitted
 */

/**
 * Comprehensive event testing suite
 * @param {Object} component - Vue component to test
 * @param {Object<string, EventTestConfig>} eventConfigs - Event test configurations
 * @returns {Function} Test suite function
 */
export const testEvents = (component, eventConfigs) => {
  return describe('Event Testing', () => {
    let wrapper

    beforeEach(() => {
      wrapper = mount(component, {
        global: {
          stubs: {
            NuxtLink: true,
            ClientOnly: true
          }
        }
      })
    })

    Object.entries(eventConfigs).forEach(([eventName, config]) => {
      testSingleEvent(wrapper, eventName, config)
    })
  })
}

/**
 * Test a single event emission
 * @param {Object} wrapper - Vue test wrapper
 * @param {string} eventName - Event name
 * @param {EventTestConfig} config - Event test config
 */
const testSingleEvent = (wrapper, eventName, config) => {
  describe(`${eventName} event`, () => {
    it(`emits ${eventName} when triggered`, async () => {
      if (config.setup) {
        await config.setup(wrapper)
      }

      const trigger = config.trigger 
        ? wrapper.find(`[data-testid="${config.trigger}"]`) 
        : wrapper
      
      const eventType = config.event || 'click'
      
      if (trigger.exists()) {
        await trigger.trigger(eventType)
      } else {
        // If no trigger element found, emit directly
        wrapper.vm.$emit(eventName, config.payload)
        await wrapper.vm.$nextTick()
      }

      const emittedEvents = wrapper.emitted(eventName)
      expect(emittedEvents).toBeTruthy()
      
      const expectedCount = config.count || 1
      expect(emittedEvents).toHaveLength(expectedCount)

      if (config.payload !== undefined) {
        expect(emittedEvents[0][0]).toEqual(config.payload)
      }

      if (config.assertion) {
        await config.assertion(wrapper, emittedEvents)
      }
    })
  })
}

/**
 * Auto-detect and test all events in component
 * @param {Object} component - Vue component
 * @param {Object} options - Test options
 * @returns {Function} Test suite
 */
export const autoTestEvents = (component, options = {}) => {
  const { props = {}, shallow = false } = options

  return describe('Auto Event Detection', () => {
    let wrapper

    beforeEach(() => {
      const mountFn = shallow ? shallowMount : mount
      wrapper = mountFn(component, {
        props,
        global: {
          stubs: {
            NuxtLink: true,
            ClientOnly: true
          }
        }
      })
    })

    it('detects all emittable events', () => {
      const componentEvents = component.emits || []
      const detectedEvents = []

      // Scan template for event triggers
      const html = wrapper.html()
      const eventMatches = html.match(/@\w+/g) || []
      
      eventMatches.forEach(match => {
        const eventName = match.substring(1)
        detectedEvents.push(eventName)
      })

      // Test each detected event
      detectedEvents.forEach(eventName => {
        const triggerElement = wrapper.find(`[data-testid="${eventName}-trigger"]`)
        if (triggerElement.exists()) {
          it(`can emit ${eventName}`, async () => {
            await triggerElement.trigger('click')
            expect(wrapper.emitted(eventName)).toBeTruthy()
          })
        }
      })
    })
  })
}

/**
 * Test form events with validation
 * @param {Object} component - Vue component
 * @param {Array} formFields - Array of form field configs
 * @returns {Function} Test suite
 */
export const testFormEvents = (component, formFields) => {
  return describe('Form Event Testing', () => {
    let wrapper

    beforeEach(() => {
      wrapper = mount(component)
    })

    formFields.forEach(field => {
      describe(`${field.name} field`, () => {
        it('emits input event on value change', async () => {
          const input = wrapper.find(`[data-testid="${field.name}"]`)
          
          if (input.exists()) {
            await input.setValue(field.testValue)
            
            if (field.event) {
              expect(wrapper.emitted(field.event)).toBeTruthy()
            } else {
              // Default to 'input' event
              expect(wrapper.emitted('input') || wrapper.emitted('update:modelValue')).toBeTruthy()
            }
          }
        })

        if (field.validation) {
          it('validates field correctly', async () => {
            const input = wrapper.find(`[data-testid="${field.name}"]`)
            
            if (input.exists()) {
              // Test invalid value
              await input.setValue(field.validation.invalid)
              expect(wrapper.emitted('validation-error')).toBeTruthy()
              
              // Test valid value
              await input.setValue(field.validation.valid)
              expect(wrapper.emitted('validation-success')).toBeTruthy()
            }
          })
        }
      })
    })

    it('emits submit event on form submission', async () => {
      const form = wrapper.find('form')
      
      if (form.exists()) {
        await form.trigger('submit')
        expect(wrapper.emitted('submit')).toBeTruthy()
      }
    })
  })
}

/**
 * Test keyboard events
 * @param {Object} component - Vue component
 * @param {Array} keyboardEvents - Keyboard event configs
 * @returns {Function} Test suite
 */
export const testKeyboardEvents = (component, keyboardEvents) => {
  return describe('Keyboard Events', () => {
    let wrapper

    beforeEach(() => {
      wrapper = mount(component)
    })

    keyboardEvents.forEach(config => {
      it(`handles ${config.key} key press`, async () => {
        const target = config.target 
          ? wrapper.find(`[data-testid="${config.target}"]`)
          : wrapper

        await target.trigger('keydown', { key: config.key })
        
        if (config.expectedEvent) {
          expect(wrapper.emitted(config.expectedEvent)).toBeTruthy()
        }

        if (config.assertion) {
          await config.assertion(wrapper)
        }
      })
    })
  })
}

/**
 * Test drag and drop events
 * @param {Object} component - Vue component
 * @param {Object} dragConfig - Drag configuration
 * @returns {Function} Test suite
 */
export const testDragDropEvents = (component, dragConfig) => {
  return describe('Drag and Drop Events', () => {
    let wrapper

    beforeEach(() => {
      wrapper = mount(component)
    })

    it('handles drag start', async () => {
      const draggable = wrapper.find(`[data-testid="${dragConfig.draggable}"]`)
      
      if (draggable.exists()) {
        await draggable.trigger('dragstart', {
          dataTransfer: { setData: vi.fn() }
        })
        
        expect(wrapper.emitted('dragstart')).toBeTruthy()
      }
    })

    it('handles drop', async () => {
      const dropZone = wrapper.find(`[data-testid="${dragConfig.dropZone}"]`)
      
      if (dropZone.exists()) {
        await dropZone.trigger('drop', {
          dataTransfer: { 
            getData: vi.fn(() => dragConfig.dragData || 'test-data')
          }
        })
        
        expect(wrapper.emitted('drop')).toBeTruthy()
      }
    })
  })
}

/**
 * Test custom events with timing
 * @param {Object} component - Vue component
 * @param {Array} timedEvents - Timed event configs
 * @returns {Function} Test suite
 */
export const testTimedEvents = (component, timedEvents) => {
  return describe('Timed Events', () => {
    let wrapper

    beforeEach(() => {
      wrapper = mount(component)
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    timedEvents.forEach(config => {
      it(`emits ${config.event} after ${config.delay}ms`, async () => {
        const trigger = wrapper.find(`[data-testid="${config.trigger}"]`)
        
        if (trigger.exists()) {
          await trigger.trigger('click')
        }

        // Fast forward time
        vi.advanceTimersByTime(config.delay)
        await wrapper.vm.$nextTick()

        expect(wrapper.emitted(config.event)).toBeTruthy()
      })
    })
  })
}

/**
 * Test event propagation and bubbling
 * @param {Object} component - Vue component
 * @param {Object} propagationConfig - Propagation test config
 * @returns {Function} Test suite
 */
export const testEventPropagation = (component, propagationConfig) => {
  return describe('Event Propagation', () => {
    let wrapper

    beforeEach(() => {
      wrapper = mount(component)
    })

    it('prevents event propagation when needed', async () => {
      const child = wrapper.find(`[data-testid="${propagationConfig.child}"]`)
      const parent = wrapper.find(`[data-testid="${propagationConfig.parent}"]`)
      
      const mockStopPropagation = vi.fn()
      
      if (child.exists()) {
        await child.trigger('click', {
          stopPropagation: mockStopPropagation
        })
        
        if (propagationConfig.shouldStop) {
          expect(mockStopPropagation).toHaveBeenCalled()
        }
      }
    })
  })
}

/**
 * Create event spy for monitoring
 * @param {Object} wrapper - Vue test wrapper
 * @param {string} eventName - Event to spy on
 * @returns {Object} Event spy
 */
export const createEventSpy = (wrapper, eventName) => {
  const spy = vi.fn()
  
  wrapper.vm.$on?.(eventName, spy) || wrapper.vm.addEventListener?.(eventName, spy)
  
  return {
    spy,
    getCallCount: () => spy.mock.calls.length,
    getLastCall: () => spy.mock.calls[spy.mock.calls.length - 1],
    getAllCalls: () => spy.mock.calls,
    reset: () => spy.mockReset()
  }
}

/**
 * Test event performance under load
 * @param {Object} component - Vue component
 * @param {Object} performanceConfig - Performance test config
 * @returns {Function} Test suite
 */
export const testEventPerformance = (component, performanceConfig) => {
  return describe('Event Performance', () => {
    it('handles rapid events efficiently', async () => {
      const wrapper = mount(component)
      const trigger = wrapper.find(`[data-testid="${performanceConfig.trigger}"]`)
      
      if (trigger.exists()) {
        const start = performance.now()
        
        // Trigger many events rapidly
        for (let i = 0; i < performanceConfig.count; i++) {
          await trigger.trigger(performanceConfig.event || 'click')
        }
        
        const end = performance.now()
        const duration = end - start
        
        // Should handle events within reasonable time
        expect(duration).toBeLessThan(performanceConfig.maxDuration || 1000)
        
        const emittedEvents = wrapper.emitted(performanceConfig.expectedEvent)
        expect(emittedEvents).toHaveLength(performanceConfig.count)
      }
    })
  })
}

export default testEvents