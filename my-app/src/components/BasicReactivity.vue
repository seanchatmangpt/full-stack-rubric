<template>
  <div>
    <h3>Basic Reactivity Demo</h3>
    
    <div>
      <p>Count (ref): {{ count }}</p>
      <button @click="increment">Increment</button>
      <button @click="decrement">Decrement</button>
    </div>

    <div>
      <p>User (reactive): {{ user.name }} - {{ user.email }}</p>
      <button @click="updateUser">Update User</button>
    </div>

    <div>
      <p>Double Count (computed): {{ doubleCount }}</p>
      <p>User Display (computed): {{ userDisplay }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

/**
 * Basic reactive reference
 * @type {import('vue').Ref<number>}
 */
const count = ref(0)

/**
 * Reactive object
 * @type {import('vue').UnwrapRef<{name: string, email: string}>}
 */
const user = reactive({
  name: 'John Doe',
  email: 'john@example.com'
})

/**
 * Computed property based on ref
 * @type {import('vue').ComputedRef<number>}
 */
const doubleCount = computed(() => count.value * 2)

/**
 * Computed property based on reactive object
 * @type {import('vue').ComputedRef<string>}
 */
const userDisplay = computed(() => `${user.name} <${user.email}>`)

/**
 * Increment count
 */
function increment() {
  count.value++
}

/**
 * Decrement count
 */
function decrement() {
  count.value--
}

/**
 * Update user with random data
 */
function updateUser() {
  const names = ['Alice Smith', 'Bob Johnson', 'Carol Williams']
  const domains = ['example.com', 'test.org', 'demo.net']
  
  const randomName = names[Math.floor(Math.random() * names.length)]
  const randomDomain = domains[Math.floor(Math.random() * domains.length)]
  
  user.name = randomName
  user.email = `${randomName.toLowerCase().replace(' ', '.')}@${randomDomain}`
}
</script>