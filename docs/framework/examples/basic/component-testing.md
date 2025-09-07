# Component Testing Examples

Hands-on examples for testing Vue components with the micro-framework.

## Basic Component Test

### The Simple Button Component

```vue
<!-- components/SimpleButton.vue -->
<template>
  <button 
    :class="buttonClass" 
    :disabled="disabled"
    @click="handleClick"
    data-testid="simple-button"
  >
    <Icon v-if="icon" :name="icon" />
    <slot />
  </button>
</template>

<script>
export default {
  name: 'SimpleButton',
  props: {
    variant: {
      type: String,
      default: 'primary',
      validator: (value) => ['primary', 'secondary', 'ghost'].includes(value)
    },
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['sm', 'md', 'lg'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    icon: {
      type: String,
      default: null
    }
  },
  emits: ['click'],
  computed: {
    buttonClass() {
      return [
        'btn',
        `btn-${this.variant}`,
        `btn-${this.size}`,
        { 'btn-disabled': this.disabled }
      ]
    }
  },
  methods: {
    handleClick(event) {
      if (!this.disabled) {
        this.$emit('click', event)
      }
    }
  }
}
</script>
```

### Old Way (Standard Testing)

```javascript
// tests/components/SimpleButton.test.js - OLD APPROACH
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SimpleButton from '~/components/SimpleButton.vue'

describe('SimpleButton', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(SimpleButton, {
      props: {
        variant: 'primary',
        size: 'md',
        disabled: false
      },
      slots: {
        default: 'Click me'
      },
      global: {
        stubs: {
          Icon: true
        }
      }
    })
  })

  it('renders correctly', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Click me')
    expect(wrapper.classes()).toContain('btn-primary')
  })

  it('applies correct size class', async () => {
    await wrapper.setProps({ size: 'lg' })
    expect(wrapper.classes()).toContain('btn-lg')
  })

  it('emits click event', async () => {
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('does not emit click when disabled', async () => {
    await wrapper.setProps({ disabled: true })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('validates variant prop', () => {
    expect(() => {
      mount(SimpleButton, { props: { variant: 'invalid' } })
    }).toThrow()
  })
})
```

**Lines of code:** 50+ lines

### New Way (Micro-Framework)

```javascript
// tests/components/SimpleButton.test.js - NEW APPROACH
import { quickTest } from 'tests/framework/components/quick-test.js'
import SimpleButton from '~/components/SimpleButton.vue'

// One line replaces 50+ lines!
quickTest('SimpleButton', SimpleButton, {
  props: { variant: 'primary', size: 'md' },
  slots: { default: 'Click me' },
  events: ['click'],
  a11y: true,
  autoProps: true  // Automatically tests all prop combinations
})
```

**Lines of code:** 6 lines (92% reduction!)

### What quickTest Automatically Provides

- ✅ **Basic rendering test** - Ensures component exists and displays content
- ✅ **Prop validation** - Tests all prop types, defaults, and validators
- ✅ **Event testing** - Verifies specified events are emitted correctly
- ✅ **Accessibility testing** - Checks ARIA labels, alt text, keyboard navigation
- ✅ **Auto-generated props** - Creates smart default props based on component definition
- ✅ **Error boundary testing** - Ensures component doesn't crash on bad props
- ✅ **Slot testing** - Verifies slots render correctly

## Advanced Component Testing

### Complex Form Component

```vue
<!-- components/ContactForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" data-testid="contact-form">
    <div class="form-group">
      <label for="name">Name *</label>
      <input 
        id="name"
        v-model="form.name"
        :class="{ error: errors.name }"
        data-testid="name-input"
        required
      >
      <span v-if="errors.name" class="error-message" data-testid="name-error">
        {{ errors.name }}
      </span>
    </div>

    <div class="form-group">
      <label for="email">Email *</label>
      <input 
        id="email"
        v-model="form.email"
        type="email"
        :class="{ error: errors.email }"
        data-testid="email-input"
        required
      >
      <span v-if="errors.email" class="error-message" data-testid="email-error">
        {{ errors.email }}
      </span>
    </div>

    <div class="form-group">
      <label for="message">Message *</label>
      <textarea 
        id="message"
        v-model="form.message"
        :class="{ error: errors.message }"
        data-testid="message-input"
        required
      ></textarea>
      <span v-if="errors.message" class="error-message" data-testid="message-error">
        {{ errors.message }}
      </span>
    </div>

    <button 
      type="submit"
      :disabled="loading || !isValid"
      data-testid="submit-button"
    >
      {{ loading ? 'Sending...' : 'Send Message' }}
    </button>
  </form>
</template>

<script>
export default {
  name: 'ContactForm',
  props: {
    initialData: {
      type: Object,
      default: () => ({ name: '', email: '', message: '' })
    }
  },
  emits: ['submit', 'validate', 'error'],
  data() {
    return {
      form: { ...this.initialData },
      errors: {},
      loading: false
    }
  },
  computed: {
    isValid() {
      return Object.keys(this.errors).length === 0 && 
             this.form.name && this.form.email && this.form.message
    }
  },
  methods: {
    validate() {
      this.errors = {}
      
      if (!this.form.name) this.errors.name = 'Name is required'
      if (!this.form.email) this.errors.email = 'Email is required'
      if (!this.form.message) this.errors.message = 'Message is required'
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (this.form.email && !emailRegex.test(this.form.email)) {
        this.errors.email = 'Invalid email format'
      }
      
      this.$emit('validate', { isValid: this.isValid, errors: this.errors })
    },
    
    async handleSubmit() {
      this.validate()
      
      if (!this.isValid) {
        this.$emit('error', this.errors)
        return
      }
      
      this.loading = true
      try {
        this.$emit('submit', this.form)
      } finally {
        this.loading = false
      }
    }
  },
  watch: {
    form: {
      handler() {
        this.validate()
      },
      deep: true
    }
  }
}
</script>
```

### Testing with Custom Behavior

```javascript
// tests/components/ContactForm.test.js
import { quickTest } from 'tests/framework/components/quick-test.js'
import ContactForm from '~/components/ContactForm.vue'

// Basic test with auto-generated behavior
const formTest = quickTest('Contact Form', ContactForm, {
  props: {
    initialData: { name: '', email: '', message: '' }
  },
  events: ['submit', 'validate', 'error'],
  a11y: true
})

// Add custom tests using the returned test utilities
formTest.then((utils) => {
  const { wrapper, getByTestId, emitEvent, rerender } = utils

  it('validates required fields', async () => {
    await wrapper.find('form').trigger('submit')
    
    expect(getByTestId('name-error').exists()).toBe(true)
    expect(getByTestId('email-error').exists()).toBe(true)
    expect(getByTestId('message-error').exists()).toBe(true)
  })

  it('validates email format', async () => {
    await getByTestId('email-input').setValue('invalid-email')
    await wrapper.find('form').trigger('submit')
    
    expect(getByTestId('email-error').text()).toContain('Invalid email format')
  })

  it('submits valid data', async () => {
    await getByTestId('name-input').setValue('John Doe')
    await getByTestId('email-input').setValue('john@example.com')
    await getByTestId('message-input').setValue('Hello there!')
    
    await wrapper.find('form').trigger('submit')
    
    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')[0][0]).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello there!'
    })
  })

  it('shows loading state', async () => {
    // Simulate loading state
    wrapper.vm.loading = true
    await wrapper.vm.$nextTick()
    
    expect(getByTestId('submit-button').text()).toBe('Sending...')
    expect(getByTestId('submit-button').element.disabled).toBe(true)
  })

  it('pre-fills with initial data', async () => {
    await rerender({
      initialData: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'Pre-filled message'
      }
    })
    
    expect(getByTestId('name-input').element.value).toBe('Jane Doe')
    expect(getByTestId('email-input').element.value).toBe('jane@example.com')
    expect(getByTestId('message-input').element.value).toBe('Pre-filled message')
  })
})
```

## Testing Prop Combinations

### Prop Matrix Testing

```javascript
// Test all button variants and sizes
import { propMatrix } from 'tests/framework/components/quick-test.js'

propMatrix('Button Variants', SimpleButton, [
  // Primary variants
  { variant: 'primary', size: 'sm', disabled: false },
  { variant: 'primary', size: 'md', disabled: false },
  { variant: 'primary', size: 'lg', disabled: false },
  { variant: 'primary', size: 'sm', disabled: true },
  
  // Secondary variants  
  { variant: 'secondary', size: 'sm', disabled: false },
  { variant: 'secondary', size: 'md', disabled: false },
  { variant: 'secondary', size: 'lg', disabled: false },
  
  // Ghost variants
  { variant: 'ghost', size: 'md', disabled: false },
  { variant: 'ghost', size: 'lg', disabled: true },
  
  // With icons
  { variant: 'primary', icon: 'user', size: 'md' },
  { variant: 'secondary', icon: 'settings', size: 'lg' }
])
```

## Responsive Component Testing

```javascript
import { responsiveTest } from 'tests/framework/components/quick-test.js'

// Test component at different screen sizes
responsiveTest('Navigation Component', NavigationComponent, [
  320,  // Mobile
  768,  // Tablet
  1024, // Desktop
  1920  // Large screen
])

// Custom responsive behavior
responsiveTest('Card Grid', CardGrid, [480, 768, 1024])
  .then((utils) => {
    it('shows correct number of columns at each breakpoint', () => {
      // 480px: 1 column
      expect(utils.wrapper.findAll('.card')).toHaveLength(1)
      
      // 768px: 2 columns
      Object.defineProperty(window, 'innerWidth', { value: 768 })
      window.dispatchEvent(new Event('resize'))
      expect(utils.wrapper.findAll('.card')).toHaveLength(2)
      
      // 1024px: 3 columns
      Object.defineProperty(window, 'innerWidth', { value: 1024 })
      window.dispatchEvent(new Event('resize'))
      expect(utils.wrapper.findAll('.card')).toHaveLength(3)
    })
  })
```

## Batch Component Testing

```javascript
import { batchTest } from 'tests/framework/components/quick-test.js'

// Test multiple related components at once
batchTest([
  ['Header', HeaderComponent, { 
    props: { title: 'My App', showNav: true } 
  }],
  ['Navigation', NavigationComponent, { 
    props: { items: mockNavItems },
    shallow: true  // Shallow mount for performance
  }],
  ['Footer', FooterComponent, { 
    props: { year: 2024 } 
  }],
  ['Sidebar', SidebarComponent, { 
    props: { collapsed: false },
    events: ['toggle', 'itemClick']
  }]
])
```

## Component Error Testing

```javascript
// Test component error boundaries and edge cases
quickTest('Error Boundary Component', ErrorBoundaryComponent, {
  props: { 
    fallbackComponent: ErrorFallback,
    onError: vi.fn()
  }
})
.then((utils) => {
  it('catches and handles component errors', async () => {
    // Simulate a component that throws an error
    const ThrowingComponent = {
      template: '<div>{{ this.nonExistent.property }}</div>'
    }
    
    utils.wrapper.vm.$refs.errorBoundary.wrapComponent(ThrowingComponent)
    await utils.wrapper.vm.$nextTick()
    
    expect(utils.wrapper.findComponent(ErrorFallback).exists()).toBe(true)
    expect(utils.wrapper.props('onError')).toHaveBeenCalled()
  })
})
```

## Performance Component Testing

```javascript
import { 
  measureRenderTime,
  measureMemoryUsage 
} from 'tests/framework/performance/perf-assertions.js'

// Add performance constraints to component tests
quickTest('Heavy Component', HeavyComponent, {
  props: { items: Array(1000).fill({}) },
  performance: {
    renderTime: { max: 100 },    // 100ms max
    memoryUsage: { max: 5 },     // 5MB max
    bundleSize: { max: 50 }      // 50KB max
  }
})

// Custom performance tests
describe('Component Performance', () => {
  it('renders large lists efficiently', async () => {
    const renderTime = await measureRenderTime(DataTable, {
      props: { data: Array(10000).fill({}) }
    })
    
    expect(renderTime).toBeLessThan(200) // 200ms limit
  })

  it('manages memory efficiently', () => {
    const memoryUsage = measureMemoryUsage(() => {
      // Create 100 component instances
      Array.from({ length: 100 }, () => 
        mount(MemoryHeavyComponent)
      )
    })
    
    expect(memoryUsage).toBeLessThan(10) // 10MB limit
  })
})
```

## Running the Examples

### 1. Copy any example to your tests directory:
```bash
cp docs/framework/examples/basic/component-testing.md tests/component-example.test.js
```

### 2. Modify for your components:
```javascript
// Replace with your actual component
import MyComponent from '~/components/MyComponent.vue'

quickTest('My Component', MyComponent, {
  // Customize props, events, options for your component
  props: { myProp: 'myValue' },
  events: ['myEvent']
})
```

### 3. Run the test:
```bash
pnpm test component-example
```

## Best Practices

1. **Start Simple** - Use `quickTest` for basic component testing
2. **Add Custom Tests** - Use `.then()` to add specific behavior tests
3. **Test Props** - Use `propMatrix` for comprehensive prop testing
4. **Test Responsiveness** - Use `responsiveTest` for UI components
5. **Batch Related Tests** - Use `batchTest` for component families
6. **Monitor Performance** - Add performance constraints for heavy components
7. **Test Accessibility** - Always enable `a11y: true` for UI components

---

**Next:** [BDD Scenarios](./bdd-scenarios.md) - Learn Given/When/Then patterns