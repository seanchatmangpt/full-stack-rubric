<template>
  <div>
    <h3>Template Basics Demo</h3>
    
    <!-- Text interpolation -->
    <p>Message: {{ message }}</p>
    <p>HTML: <span v-html="htmlContent"></span></p>
    
    <!-- Attribute binding -->
    <p>
      <input 
        :placeholder="inputPlaceholder" 
        :disabled="isInputDisabled"
        v-model="inputValue"
      >
    </p>
    
    <!-- Event handling -->
    <p>
      <button @click="handleClick">Click me!</button>
      <button @click="toggleInput">Toggle Input</button>
    </p>
    
    <!-- Form input binding -->
    <p>Input value: {{ inputValue }}</p>
    
    <!-- Conditional attributes -->
    <p>
      <span :class="{ active: isActive, disabled: isInputDisabled }">
        Status: {{ isActive ? 'Active' : 'Inactive' }}
      </span>
    </p>
    
    <!-- Event with parameters -->
    <p>
      <button @click="greetUser('Alice')">Greet Alice</button>
      <button @click="greetUser('Bob')">Greet Bob</button>
    </p>
    
    <p v-if="lastGreeting">{{ lastGreeting }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

/**
 * Reactive message
 * @type {import('vue').Ref<string>}
 */
const message = ref('Hello Vue Templates!')

/**
 * HTML content for v-html directive
 * @type {import('vue').Ref<string>}
 */
const htmlContent = ref('<strong>Bold text</strong>')

/**
 * Input placeholder text
 * @type {import('vue').Ref<string>}
 */
const inputPlaceholder = ref('Type something...')

/**
 * Input disabled state
 * @type {import('vue').Ref<boolean>}
 */
const isInputDisabled = ref(false)

/**
 * Input value
 * @type {import('vue').Ref<string>}
 */
const inputValue = ref('')

/**
 * Active state for styling
 * @type {import('vue').Ref<boolean>}
 */
const isActive = ref(true)

/**
 * Last greeting message
 * @type {import('vue').Ref<string>}
 */
const lastGreeting = ref('')

/**
 * Handle button click
 */
function handleClick() {
  message.value = `Clicked at ${new Date().toLocaleTimeString()}`
  isActive.value = !isActive.value
}

/**
 * Toggle input disabled state
 */
function toggleInput() {
  isInputDisabled.value = !isInputDisabled.value
  inputPlaceholder.value = isInputDisabled.value 
    ? 'Input disabled' 
    : 'Type something...'
}

/**
 * Greet a specific user
 * @param {string} name - User name to greet
 */
function greetUser(name) {
  lastGreeting.value = `Hello, ${name}! Nice to meet you.`
}
</script>