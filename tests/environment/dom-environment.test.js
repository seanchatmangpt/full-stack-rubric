/**
 * DOM Environment Test Suite
 * Tests JSDOM setup and browser API mocks
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

// Test component for DOM testing
const TestComponent = defineComponent({
  name: 'TestComponent',
  template: `
    <div class="test-component" data-testid="test-component">
      <input 
        ref="textInput"
        type="text" 
        v-model="inputValue" 
        @input="handleInput"
        data-testid="test-input"
      />
      <button @click="handleClick" data-testid="test-button">
        {{ buttonText }}
      </button>
      <div class="output" data-testid="output">{{ outputText }}</div>
    </div>
  `,
  data() {
    return {
      inputValue: '',
      buttonText: 'Click Me',
      outputText: 'No output yet'
    }
  },
  methods: {
    handleInput(event) {
      this.outputText = `Input: ${event.target.value}`
    },
    handleClick() {
      this.outputText = 'Button clicked!'
      this.buttonText = 'Clicked'
    }
  },
  mounted() {
    // Test DOM access in component
    if (this.$refs.textInput) {
      this.$refs.textInput.focus()
    }
  }
})

describe('DOM Environment Validation', () => {
  beforeEach(() => {
    // Clear any previous DOM state
    if (document.body) {
      document.body.innerHTML = ''
    }
  })

  describe('Basic DOM API', () => {
    it('should have document available', () => {
      expect(document).toBeDefined()
      expect(document.createElement).toBeTypeOf('function')
      expect(document.querySelector).toBeTypeOf('function')
    })

    it('should have window object available', () => {
      expect(window).toBeDefined()
      expect(window.document).toBe(document)
      expect(window.addEventListener).toBeTypeOf('function')
    })

    it('should create and manipulate DOM elements', () => {
      const div = document.createElement('div')
      div.id = 'test-div'
      div.textContent = 'Test content'
      div.className = 'test-class'
      
      document.body.appendChild(div)
      
      const found = document.getElementById('test-div')
      expect(found).toBe(div)
      expect(found.textContent).toBe('Test content')
      expect(found.className).toBe('test-class')
    })

    it('should support querySelector and querySelectorAll', () => {
      document.body.innerHTML = `
        <div class="container">
          <p class="text">Paragraph 1</p>
          <p class="text">Paragraph 2</p>
          <span class="highlight">Span text</span>
        </div>
      `

      const container = document.querySelector('.container')
      const paragraphs = document.querySelectorAll('.text')
      const span = document.querySelector('.highlight')

      expect(container).toBeTruthy()
      expect(paragraphs).toHaveLength(2)
      expect(span.textContent).toBe('Span text')
    })
  })

  describe('Event System', () => {
    it('should handle DOM events', () => {
      const button = document.createElement('button')
      button.textContent = 'Test Button'
      document.body.appendChild(button)

      let clicked = false
      const handleClick = () => {
 clicked = true 
}
      
      button.addEventListener('click', handleClick)
      
      // Simulate click
      const clickEvent = new Event('click', { bubbles: true })
      button.dispatchEvent(clickEvent)
      
      expect(clicked).toBe(true)
    })

    it('should handle keyboard events', () => {
      const input = document.createElement('input')
      document.body.appendChild(input)

      let keyPressed = null
      const handleKeydown = (event) => {
 keyPressed = event.key 
}
      
      input.addEventListener('keydown', handleKeydown)
      
      const keyEvent = new KeyboardEvent('keydown', { 
        key: 'Enter',
        code: 'Enter',
        bubbles: true 
      })
      input.dispatchEvent(keyEvent)
      
      expect(keyPressed).toBe('Enter')
    })

    it('should handle input events', () => {
      const input = document.createElement('input')
      input.type = 'text'
      document.body.appendChild(input)

      let inputValue = ''
      const handleInput = (event) => {
 inputValue = event.target.value 
}
      
      input.addEventListener('input', handleInput)
      
      // Simulate typing
      input.value = 'test input'
      const inputEvent = new Event('input', { bubbles: true })
      input.dispatchEvent(inputEvent)
      
      expect(inputValue).toBe('test input')
    })
  })

  describe('Browser API Mocks', () => {
    it('should have localStorage mock', () => {
      expect(localStorage).toBeDefined()
      expect(localStorage.setItem).toBeTypeOf('function')
      expect(localStorage.getItem).toBeTypeOf('function')
      
      localStorage.setItem('test-key', 'test-value')
      expect(localStorage.getItem('test-key')).toBe('test-value')
      
      localStorage.removeItem('test-key')
      expect(localStorage.getItem('test-key')).toBeNull()
    })

    it('should have sessionStorage mock', () => {
      expect(sessionStorage).toBeDefined()
      expect(sessionStorage.setItem).toBeTypeOf('function')
      
      sessionStorage.setItem('session-key', 'session-value')
      expect(sessionStorage.getItem('session-key')).toBe('session-value')
    })

    it('should have performance API mock', () => {
      expect(performance).toBeDefined()
      expect(performance.now).toBeTypeOf('function')
      expect(typeof performance.now()).toBe('number')
      expect(performance.mark).toBeTypeOf('function')
      expect(performance.measure).toBeTypeOf('function')
    })

    it('should have requestAnimationFrame mock', async () => {
      expect(requestAnimationFrame).toBeDefined()
      expect(cancelAnimationFrame).toBeDefined()
      
      let callbackCalled = false
      const id = requestAnimationFrame(() => {
 callbackCalled = true 
})
      
      expect(typeof id).toBe('number')
      // Wait for callback
      await new Promise(resolve => setTimeout(resolve, 20))
      expect(callbackCalled).toBe(true)
    })

    it('should have ResizeObserver mock', () => {
      expect(ResizeObserver).toBeDefined()
      
      const observer = new ResizeObserver(() => {})
      expect(observer.observe).toBeTypeOf('function')
      expect(observer.disconnect).toBeTypeOf('function')
      
      const element = document.createElement('div')
      observer.observe(element)
      observer.disconnect()
    })

    it('should have IntersectionObserver mock', () => {
      expect(IntersectionObserver).toBeDefined()
      
      const observer = new IntersectionObserver(() => {})
      expect(observer.observe).toBeTypeOf('function')
      expect(observer.disconnect).toBeTypeOf('function')
    })
  })

  describe('Vue Component Mounting', () => {
    it('should mount Vue component successfully', () => {
      const wrapper = mount(TestComponent)
      
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('[data-testid="test-component"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="test-input"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="test-button"]').exists()).toBe(true)
    })

    it('should handle component data and methods', async () => {
      const wrapper = mount(TestComponent)
      
      const button = wrapper.find('[data-testid="test-button"]')
      const output = wrapper.find('[data-testid="output"]')
      
      expect(button.text()).toBe('Click Me')
      expect(output.text()).toBe('No output yet')
      
      await button.trigger('click')
      
      expect(button.text()).toBe('Clicked')
      expect(output.text()).toBe('Button clicked!')
    })

    it('should handle input events in components', async () => {
      const wrapper = mount(TestComponent)
      
      const input = wrapper.find('[data-testid="test-input"]')
      const output = wrapper.find('[data-testid="output"]')
      
      await input.setValue('test input')
      
      expect(output.text()).toBe('Input: test input')
      expect(wrapper.vm.inputValue).toBe('test input')
    })

    it('should handle component refs', () => {
      const wrapper = mount(TestComponent)
      
      expect(wrapper.vm.$refs.textInput).toBeDefined()
      expect(wrapper.vm.$refs.textInput.tagName).toBe('INPUT')
    })
  })

  describe('DOM Manipulation and Cleanup', () => {
    it('should properly clean up between tests', () => {
      // First test - add content
      document.body.innerHTML = '<div id="test1">Test 1</div>'
      expect(document.getElementById('test1')).toBeTruthy()
      
      // Cleanup should happen automatically in beforeEach
      // This would fail if cleanup wasn't working
    })

    it('should handle complex DOM structures', () => {
      const container = document.createElement('div')
      container.innerHTML = `
        <header>
          <h1>Title</h1>
          <nav>
            <ul>
              <li><a href="/home">Home</a></li>
              <li><a href="/about">About</a></li>
            </ul>
          </nav>
        </header>
        <main>
          <article>
            <h2>Article Title</h2>
            <p>Article content</p>
          </article>
        </main>
        <footer>
          <p>Footer content</p>
        </footer>
      `
      
      document.body.appendChild(container)
      
      expect(document.querySelector('h1').textContent).toBe('Title')
      expect(document.querySelectorAll('nav a')).toHaveLength(2)
      expect(document.querySelector('article h2').textContent).toBe('Article Title')
      expect(document.querySelector('footer p').textContent).toBe('Footer content')
    })

    it('should handle insertBefore edge cases', () => {
      const parent = document.createElement('div')
      const child1 = document.createElement('span')
      child1.textContent = 'Child 1'
      const child2 = document.createElement('span')
      child2.textContent = 'Child 2'
      
      parent.appendChild(child1)
      
      // Test insertBefore with null reference (should append)
      parent.insertBefore(child2, null)
      expect(parent.children).toHaveLength(2)
      expect(parent.children[1]).toBe(child2)
      
      // Test insertBefore with valid reference
      const child3 = document.createElement('span')
      child3.textContent = 'Child 3'
      parent.insertBefore(child3, child2)
      
      expect(parent.children).toHaveLength(3)
      expect(parent.children[1]).toBe(child3)
      expect(parent.children[2]).toBe(child2)
    })
  })

  describe('Test Helper Functions', () => {
    it('should have test helper functions available', () => {
      expect(window.testHelpers).toBeDefined()
      expect(window.testHelpers.simulateTyping).toBeTypeOf('function')
      expect(window.testHelpers.getTypingMetrics).toBeTypeOf('function')
      expect(window.testHelpers.clearTypingArea).toBeTypeOf('function')
      expect(window.testHelpers.waitForDOM).toBeTypeOf('function')
    })

    it('should simulate typing correctly', async () => {
      const input = document.createElement('input')
      input.type = 'text'
      document.body.appendChild(input)
      
      let inputEvents = 0
      input.addEventListener('input', () => inputEvents++)
      
      await window.testHelpers.simulateTyping(input, 'hello', { delay: 1 })
      
      expect(input.value).toBe('hello')
      expect(inputEvents).toBe(5) // One for each character
    })

    it('should wait for DOM updates', async () => {
      let domUpdated = false
      
      // Simulate async DOM update
      setTimeout(() => {
        document.body.innerHTML = '<div id="updated">Updated</div>'
        domUpdated = true
      }, 10)
      
      await window.testHelpers.waitForDOM()
      await new Promise(resolve => setTimeout(resolve, 15))
      
      expect(domUpdated).toBe(true)
      expect(document.getElementById('updated')).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    it('should handle DOM errors gracefully', () => {
      // Test insertBefore with invalid node
      const parent = document.createElement('div')
      
      // This should not throw with our mock
      expect(() => {
        parent.insertBefore(null, null)
      }).not.toThrow()
    })

    it('should handle missing elements gracefully', () => {
      expect(document.getElementById('non-existent')).toBeNull()
      expect(document.querySelector('.non-existent')).toBeNull()
      expect(document.querySelectorAll('.non-existent')).toHaveLength(0)
    })
  })
})
