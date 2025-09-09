<template>
  <div>
    <h3>Conditional Rendering Demo</h3>
    
    <div>
      <h4>v-if / v-else-if / v-else</h4>
      <button @click="changeStatus">Change Status</button>
      <p>Current status: {{ status }}</p>
      
      <div v-if="status === 'loading'">
        <p>Loading... Please wait.</p>
      </div>
      <div v-else-if="status === 'success'">
        <p>Data loaded successfully!</p>
      </div>
      <div v-else-if="status === 'error'">
        <p>Error occurred while loading data.</p>
      </div>
      <div v-else>
        <p>Ready to load data.</p>
      </div>
    </div>
    
    <div>
      <h4>v-show (visibility toggle)</h4>
      <button @click="toggleVisibility">Toggle Visibility</button>
      <p v-show="isVisible">This element is shown/hidden with v-show</p>
      <p>Element is {{ isVisible ? 'visible' : 'hidden' }}</p>
    </div>
    
    <div>
      <h4>v-for (list rendering)</h4>
      <button @click="addItem">Add Item</button>
      <button @click="removeItem">Remove Item</button>
      <button @click="shuffleItems">Shuffle Items</button>
      
      <ul>
        <li v-for="(item, index) in items" :key="item.id">
          {{ index + 1 }}. {{ item.name }} (ID: {{ item.id }})
          <button @click="toggleItemStatus(item)">
            {{ item.active ? 'Deactivate' : 'Activate' }}
          </button>
        </li>
      </ul>
      
      <p v-if="items.length === 0">No items to display</p>
    </div>
    
    <div>
      <h4>v-for with objects</h4>
      <div>
        <strong>User Profile:</strong>
        <ul>
          <li v-for="(value, key, index) in userProfile" :key="key">
            {{ index + 1 }}. {{ key }}: {{ value }}
          </li>
        </ul>
      </div>
    </div>
    
    <div>
      <h4>Conditional classes and styles</h4>
      <button @click="toggleTheme">Toggle Theme</button>
      <div 
        :class="{
          'dark-theme': isDarkTheme,
          'light-theme': !isDarkTheme,
          'active': isActive
        }"
        :style="{
          padding: '10px',
          margin: '5px',
          border: isDarkTheme ? '2px solid white' : '2px solid black',
          backgroundColor: isDarkTheme ? '#333' : '#fff',
          color: isDarkTheme ? '#fff' : '#333'
        }"
      >
        Theme: {{ isDarkTheme ? 'Dark' : 'Light' }}
      </div>
    </div>
    
    <div>
      <h4>Filtered and computed lists</h4>
      <input v-model="searchTerm" placeholder="Search fruits...">
      <p>Search term: "{{ searchTerm }}"</p>
      
      <ul>
        <li v-for="fruit in filteredFruits" :key="fruit.id">
          {{ fruit.name }} - ${{ fruit.price }}
        </li>
      </ul>
      
      <p v-if="filteredFruits.length === 0 && searchTerm">
        No fruits found for "{{ searchTerm }}"
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

/**
 * Status state for conditional rendering
 * @type {import('vue').Ref<string>}
 */
const status = ref('idle')

/**
 * Visibility toggle state
 * @type {import('vue').Ref<boolean>}
 */
const isVisible = ref(true)

/**
 * Active state for styling
 * @type {import('vue').Ref<boolean>}
 */
const isActive = ref(true)

/**
 * Theme state
 * @type {import('vue').Ref<boolean>}
 */
const isDarkTheme = ref(false)

/**
 * Search term for filtering
 * @type {import('vue').Ref<string>}
 */
const searchTerm = ref('')

/**
 * Items list for v-for demonstration
 * @type {import('vue').Ref<Array<{id: number, name: string, active: boolean}>>}
 */
const items = ref([
  { id: 1, name: 'Item One', active: true },
  { id: 2, name: 'Item Two', active: false },
  { id: 3, name: 'Item Three', active: true }
])

/**
 * User profile object for object iteration
 * @type {import('vue').Ref<{name: string, email: string, age: number, role: string}>}
 */
const userProfile = ref({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  role: 'Developer'
})

/**
 * Fruits list for filtering
 * @type {import('vue').Ref<Array<{id: number, name: string, price: number}>>}
 */
const fruits = ref([
  { id: 1, name: 'Apple', price: 1.20 },
  { id: 2, name: 'Banana', price: 0.80 },
  { id: 3, name: 'Cherry', price: 3.50 },
  { id: 4, name: 'Date', price: 2.10 },
  { id: 5, name: 'Elderberry', price: 4.20 }
])

/**
 * Filtered fruits based on search term
 * @type {import('vue').ComputedRef<Array<{id: number, name: string, price: number}>>}
 */
const filteredFruits = computed(() => {
  if (!searchTerm.value) return fruits.value
  
  return fruits.value.filter(fruit =>
    fruit.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

/**
 * Next item ID for adding new items
 * @type {import('vue').Ref<number>}
 */
const nextId = ref(4)

/**
 * Change status through different states
 */
function changeStatus() {
  const statuses = ['idle', 'loading', 'success', 'error']
  const currentIndex = statuses.indexOf(status.value)
  const nextIndex = (currentIndex + 1) % statuses.length
  status.value = statuses[nextIndex]
}

/**
 * Toggle visibility state
 */
function toggleVisibility() {
  isVisible.value = !isVisible.value
}

/**
 * Toggle theme state
 */
function toggleTheme() {
  isDarkTheme.value = !isDarkTheme.value
}

/**
 * Add new item to the list
 */
function addItem() {
  items.value.push({
    id: nextId.value,
    name: `Item ${nextId.value}`,
    active: Math.random() > 0.5
  })
  nextId.value++
}

/**
 * Remove last item from the list
 */
function removeItem() {
  if (items.value.length > 0) {
    items.value.pop()
  }
}

/**
 * Shuffle items array
 */
function shuffleItems() {
  for (let i = items.value.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items.value[i], items.value[j]] = [items.value[j], items.value[i]]
  }
}

/**
 * Toggle item active status
 * @param {{id: number, name: string, active: boolean}} item - Item to toggle
 */
function toggleItemStatus(item) {
  item.active = !item.active
}
</script>