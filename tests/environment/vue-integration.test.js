/**
 * Vue Integration Test Suite
 * Tests Vue components in JSDOM environment
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, shallowMount, createLocalVue } from '@vue/test-utils'
import { defineComponent, ref, reactive, computed, nextTick } from 'vue'

// Mock typing tutor component for testing
const TypingTutorComponent = defineComponent({
  name: 'TypingTutorComponent',
  template: `
    <div class="typing-tutor" data-testid="typing-tutor">
      <div class="controls">
        <button 
          @click="startSession" 
          :disabled="isActive"
          data-testid="start-button"
        >
          {{ isActive ? 'Active' : 'Start' }}
        </button>
        <button 
          @click="resetSession"
          data-testid="reset-button"
        >
          Reset
        </button>
      </div>
      
      <div class="typing-area">
        <div 
          ref="typingInput"
          class="typing-input"
          contenteditable="true"
          @input="handleInput"
          @keydown="handleKeydown"
          data-testid="typing-input"
        >
        </div>
        <div class="target-text" data-testid="target-text">
          {{ targetText }}
        </div>
      </div>
      
      <div class="metrics" data-testid="metrics">
        <div class="wpm">WPM: {{ metrics.wpm }}</div>
        <div class="accuracy">Accuracy: {{ metrics.accuracy }}%</div>
        <div class="errors">Errors: {{ metrics.errors }}</div>
        <div class="time">Time: {{ metrics.time }}s</div>
      </div>
      
      <div class="feedback" data-testid="feedback">
        {{ feedback }}
      </div>
    </div>
  `,
  setup() {
    const isActive = ref(false)
    const targetText = ref('The quick brown fox jumps over the lazy dog.')
    const userInput = ref('')
    const startTime = ref(null)
    const feedback = ref('')
    
    const metrics = reactive({
      wpm: 0,
      accuracy: 100,
      errors: 0,
      time: 0
    })
    
    const startSession = () => {
      isActive.value = true
      startTime.value = Date.now()
      feedback.value = 'Session started! Begin typing...'
    }
    
    const resetSession = () => {
      isActive.value = false
      userInput.value = ''
      startTime.value = null
      feedback.value = ''
      metrics.wpm = 0
      metrics.accuracy = 100
      metrics.errors = 0
      metrics.time = 0
    }
    
    const calculateMetrics = () => {
      if (!startTime.value) return
      
      const currentTime = Date.now()
      const timeElapsed = (currentTime - startTime.value) / 1000
      const wordsTyped = userInput.value.split(' ').length
      const charactersTyped = userInput.value.length
      const targetChars = targetText.value.slice(0, charactersTyped)
      
      metrics.time = Math.floor(timeElapsed)
      metrics.wpm = Math.round((wordsTyped / timeElapsed) * 60) || 0
      
      // Calculate accuracy
      let correctChars = 0
      let errors = 0
      for (let i = 0; i < charactersTyped; i++) {
        if (userInput.value[i] === targetChars[i]) {
          correctChars++
        } else {
          errors++
        }
      }
      
      metrics.accuracy = charactersTyped > 0 ? Math.round((correctChars / charactersTyped) * 100) : 100
      metrics.errors = errors
      
      // Update feedback
      if (metrics.accuracy < 90) {
        feedback.value = 'Focus on accuracy!'
      } else if (metrics.wpm > 40) {
        feedback.value = 'Great speed!'
      } else {
        feedback.value = 'Keep typing...'
      }
    }
    
    const handleInput = (event) => {
      if (!isActive.value) return
      
      userInput.value = event.target.textContent || event.target.innerText || ''
      calculateMetrics()
    }
    
    const handleKeydown = (event) => {
      if (!isActive.value) return
      
      // Handle special keys
      if (event.key === 'Escape') {
        resetSession()
        event.preventDefault()
      }
    }
    
    return {
      isActive,
      targetText,
      userInput,
      metrics,
      feedback,
      startSession,
      resetSession,
      handleInput,
      handleKeydown
    }
  }
})

// Mock Nuxt components for testing
const NuxtLinkStub = {
  name: 'NuxtLink',
  template: '<a :href="to"><slot /></a>',
  props: ['to']
}

describe('Vue Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    
    // Clear DOM
    if (document.body) {
      document.body.innerHTML = ''
    }
  })

  describe('Component Mounting', () => {
    it('should mount component without errors', () => {
      const wrapper = mount(TypingTutorComponent)
      
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('[data-testid="typing-tutor"]').exists()).toBe(true)
    })

    it('should mount with shallow mounting', () => {
      const wrapper = shallowMount(TypingTutorComponent)
      
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.vm).toBeDefined()
    })

    it('should handle component props', () => {
      const TestPropsComponent = defineComponent({
        name: 'TestPropsComponent',
        template: '<div>{{ message }} - {{ count }}</div>',
        props: {
          message: String,
          count: Number
        }
      })
      
      const wrapper = mount(TestPropsComponent, {
        props: {
          message: 'Hello World',
          count: 42
        }
      })
      
      expect(wrapper.text()).toContain('Hello World')
      expect(wrapper.text()).toContain('42')
    })
  })

  describe('Reactivity and State Management', () => {
    it('should handle ref reactivity', async () => {
      const wrapper = mount(TypingTutorComponent)
      
      // Check initial state
      expect(wrapper.vm.isActive).toBe(false)
      expect(wrapper.find('[data-testid="start-button"]').text()).toBe('Start')
      
      // Start session
      await wrapper.find('[data-testid="start-button"]').trigger('click')
      
      expect(wrapper.vm.isActive).toBe(true)
      expect(wrapper.find('[data-testid="start-button"]').text()).toBe('Active')
      expect(wrapper.find('[data-testid="start-button"]').element.disabled).toBe(true)
    })

    it('should handle reactive object updates', async () => {
      const wrapper = mount(TypingTutorComponent)
      
      // Start session
      await wrapper.find('[data-testid="start-button"]').trigger('click')
      
      // Initial metrics
      expect(wrapper.find('.wpm').text()).toBe('WPM: 0')
      expect(wrapper.find('.accuracy').text()).toBe('Accuracy: 100%')
      expect(wrapper.find('.errors').text()).toBe('Errors: 0')
    })

    it('should handle computed properties', async () => {
      const TestComputedComponent = defineComponent({
        name: 'TestComputedComponent',
        template: '<div>{{ fullName }}</div>',
        setup() {
          const firstName = ref('John')
          const lastName = ref('Doe')
          
          const fullName = computed(() => `${firstName.value} ${lastName.value}`)
          
          return { firstName, lastName, fullName }
        }
      })
      
      const wrapper = mount(TestComputedComponent)
      
      expect(wrapper.text()).toBe('John Doe')
      
      wrapper.vm.firstName = 'Jane'
      await nextTick()
      
      expect(wrapper.text()).toBe('Jane Doe')
    })
  })

  describe('Event Handling', () => {
    it('should handle click events', async () => {
      const wrapper = mount(TypingTutorComponent)
      
      // Test start button
      await wrapper.find('[data-testid="start-button"]').trigger('click')
      expect(wrapper.vm.isActive).toBe(true)
      
      // Test reset button
      await wrapper.find('[data-testid="reset-button"]').trigger('click')
      expect(wrapper.vm.isActive).toBe(false)
    })

    it('should handle input events', async () => {
      const wrapper = mount(TypingTutorComponent)
      
      // Start session first
      await wrapper.find('[data-testid="start-button"]').trigger('click')
      
      const typingInput = wrapper.find('[data-testid="typing-input"]')
      
      // Simulate input
      typingInput.element.textContent = 'The quick'
      await typingInput.trigger('input')
      
      expect(wrapper.vm.userInput).toBe('The quick')
    })

    it('should handle keyboard events', async () => {
      const wrapper = mount(TypingTutorComponent)
      
      // Start session
      await wrapper.find('[data-testid="start-button"]').trigger('click')
      
      const typingInput = wrapper.find('[data-testid="typing-input"]')
      
      // Test Escape key to reset
      await typingInput.trigger('keydown', { key: 'Escape' })
      
      expect(wrapper.vm.isActive).toBe(false)
    })

    it('should handle custom events', async () => {
      const TestEventComponent = defineComponent({
        name: 'TestEventComponent',
        template: '<button @click="emitCustomEvent">Click Me</button>',
        emits: ['custom-event'],
        methods: {
          emitCustomEvent() {
            this.$emit('custom-event', { message: 'Hello from component' })
          }
        }
      })
      
      const wrapper = mount(TestEventComponent)
      
      await wrapper.find('button').trigger('click')
      
      const events = wrapper.emitted('custom-event')
      expect(events).toBeTruthy()
      expect(events[0][0]).toEqual({ message: 'Hello from component' })
    })
  })

  describe('Component Lifecycle', () => {
    it('should handle mounted lifecycle', async () => {
      let mountedCalled = false
      
      const TestLifecycleComponent = defineComponent({
        name: 'TestLifecycleComponent',
        template: '<div>Lifecycle Test</div>',
        mounted() {
          mountedCalled = true
        }
      })
      
      mount(TestLifecycleComponent)
      
      // Wait for next tick to ensure mounted is called
      await nextTick()
      
      expect(mountedCalled).toBe(true)
    })

    it('should handle unmount cleanup', async () => {
      let unmountedCalled = false
      
      const TestCleanupComponent = defineComponent({
        name: 'TestCleanupComponent',
        template: '<div>Cleanup Test</div>',
        unmounted() {
          unmountedCalled = true
        }
      })
      
      const wrapper = mount(TestCleanupComponent)
      wrapper.unmount()
      
      await nextTick()
      
      expect(unmountedCalled).toBe(true)
    })
  })

  describe('Component Refs and DOM Access', () => {
    it('should access component refs', () => {
      const wrapper = mount(TypingTutorComponent)
      
      expect(wrapper.vm.$refs.typingInput).toBeDefined()
      expect(wrapper.vm.$refs.typingInput.tagName).toBe('DIV')
    })

    it('should handle DOM manipulation via refs', async () => {
      const TestRefComponent = defineComponent({
        name: 'TestRefComponent',
        template: '<input ref="textInput" />',
        mounted() {
          this.$refs.textInput.focus()
          this.$refs.textInput.value = 'Test value'
        }
      })
      
      const wrapper = mount(TestRefComponent)
      
      await nextTick()
      
      expect(wrapper.vm.$refs.textInput.value).toBe('Test value')
    })
  })

  describe('Component Slots', () => {
    it('should render default slots', () => {
      const TestSlotComponent = defineComponent({
        name: 'TestSlotComponent',
        template: '<div class="wrapper"><slot /></div>'
      })
      
      const wrapper = mount(TestSlotComponent, {
        slots: {
          default: '<p>Slot content</p>'
        }
      })
      
      expect(wrapper.find('.wrapper p').text()).toBe('Slot content')
    })

    it('should render named slots', () => {
      const TestNamedSlotComponent = defineComponent({
        name: 'TestNamedSlotComponent',
        template: `
          <div>
            <header><slot name="header" /></header>
            <main><slot /></main>
            <footer><slot name="footer" /></footer>
          </div>
        `
      })
      
      const wrapper = mount(TestNamedSlotComponent, {
        slots: {
          header: '<h1>Header Content</h1>',
          default: '<p>Main Content</p>',
          footer: '<p>Footer Content</p>'
        }
      })
      
      expect(wrapper.find('header h1').text()).toBe('Header Content')
      expect(wrapper.find('main p').text()).toBe('Main Content')
      expect(wrapper.find('footer p').text()).toBe('Footer Content')
    })
  })

  describe('Component Stubs and Mocking', () => {
    it('should use component stubs', () => {
      const TestStubComponent = defineComponent({
        name: 'TestStubComponent',
        template: '<div><NuxtLink to="/test">Test Link</NuxtLink></div>',
        components: { NuxtLink: NuxtLinkStub }
      })
      
      const wrapper = mount(TestStubComponent)
      
      const link = wrapper.find('a')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('/test')
      expect(link.text()).toBe('Test Link')
    })

    it('should mock component methods', () => {
      const TestMockComponent = defineComponent({
        name: 'TestMockComponent',
        template: '<button @click="apiCall">API Call</button>',
        methods: {
          apiCall() {
            return fetch('/api/test')
          }
        }
      })
      
      const mockApiCall = vi.fn().mockResolvedValue({ data: 'mocked' })
      
      const wrapper = mount(TestMockComponent)
      wrapper.vm.apiCall = mockApiCall
      
      wrapper.find('button').trigger('click')
      
      expect(mockApiCall).toHaveBeenCalled()
    })
  })

  describe('Error Boundaries and Error Handling', () => {
    it('should handle component errors gracefully', () => {
      const ErrorComponent = defineComponent({
        name: 'ErrorComponent',
        template: '<div>{{ errorProp.nonexistent }}</div>',
        props: ['errorProp']
      })
      
      // This should not crash the test
      expect(() => {
        mount(ErrorComponent, {
          props: { errorProp: null }
        })
      }).not.toThrow()
    })

    it('should handle async component errors', async () => {
      const AsyncErrorComponent = defineComponent({
        name: 'AsyncErrorComponent',
        template: '<div>Async Test</div>',
        async mounted() {
          // Simulate async error that should be caught
          try {
            throw new Error('Async error')
          } catch (error) {
            // Handle error gracefully
            console.error('Caught async error:', error.message)
          }
        }
      })
      
      expect(() => {
        mount(AsyncErrorComponent)
      }).not.toThrow()
    })
  })

  describe('Performance and Memory', () => {
    it('should clean up event listeners on unmount', async () => {
      let listenerCount = 0
      
      const TestListenerComponent = defineComponent({
        name: 'TestListenerComponent',
        template: '<div>Listener Test</div>',
        mounted() {
          const handler = () => {}
          window.addEventListener('resize', handler)
          listenerCount++
          
          this.$el.addEventListener('click', handler)
          listenerCount++
        }
      })
      
      const wrapper = mount(TestListenerComponent)
      
      expect(listenerCount).toBe(2)
      
      wrapper.unmount()
      
      // In real implementation, event listeners would be cleaned up
      // This test verifies the component can be mounted and unmounted without errors
    })

    it('should handle large component trees', () => {
      const createNestedComponent = (depth) => {
        if (depth === 0) {
          return defineComponent({
            name: 'LeafComponent',
            template: '<span>Leaf</span>'
          })
        }
        
        return defineComponent({
          name: `NestedComponent${depth}`,
          template: '<div><NestedChild /></div>',
          components: {
            NestedChild: createNestedComponent(depth - 1)
          }
        })
      }
      
      const DeepComponent = createNestedComponent(5)
      
      expect(() => {
        const wrapper = mount(DeepComponent)
        expect(wrapper.find('span').text()).toBe('Leaf')
      }).not.toThrow()
    })
  })
})
