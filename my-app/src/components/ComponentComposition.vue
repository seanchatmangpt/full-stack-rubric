<template>
  <div>
    <h3>Component Composition Demo</h3>
    
    <!-- Props demonstration -->
    <div>
      <h4>Props Example</h4>
      <p>Title: {{ title }}</p>
      <p>Count: {{ count }}</p>
      <p>Config: {{ config.theme }} - {{ config.size }}</p>
    </div>
    
    <!-- Emits demonstration -->
    <div>
      <h4>Events Example</h4>
      <button @click="sendUpdate">Send Update</button>
      <button @click="sendCustomEvent">Send Custom Event</button>
    </div>
    
    <!-- Slots demonstration -->
    <div>
      <h4>Slots Example</h4>
      
      <!-- Default slot -->
      <div>
        <strong>Default slot content:</strong>
        <slot>
          <p>Default content when no slot provided</p>
        </slot>
      </div>
      
      <!-- Named slots -->
      <div>
        <strong>Header slot:</strong>
        <slot name="header">
          <p>Default header content</p>
        </slot>
      </div>
      
      <div>
        <strong>Footer slot:</strong>
        <slot name="footer">
          <p>Default footer content</p>
        </slot>
      </div>
      
      <!-- Scoped slot -->
      <div>
        <strong>Scoped slot (user data):</strong>
        <slot name="user" :user="currentUser" :actions="userActions">
          <p>{{ currentUser.name }} - {{ currentUser.role }}</p>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

/**
 * Component props definition
 * @typedef {Object} Props
 * @property {string} title - Component title
 * @property {number} count - Counter value
 * @property {Object} config - Configuration object
 * @property {string} config.theme - Theme setting
 * @property {string} config.size - Size setting
 */

/**
 * Define component props with defaults
 */
const props = defineProps({
  title: {
    type: String,
    default: 'Default Title'
  },
  count: {
    type: Number,
    default: 0
  },
  config: {
    type: Object,
    default: () => ({
      theme: 'light',
      size: 'medium'
    })
  }
})

/**
 * Define component emits
 */
const emit = defineEmits(['update', 'customEvent'])

/**
 * Current user data for scoped slot
 * @type {import('vue').Ref<{name: string, role: string, id: number}>}
 */
const currentUser = ref({
  name: 'Jane Smith',
  role: 'Developer',
  id: 123
})

/**
 * User actions for scoped slot
 * @type {import('vue').ComputedRef<{edit: Function, delete: Function}>}
 */
const userActions = computed(() => ({
  edit: () => editUser(),
  delete: () => deleteUser()
}))

/**
 * Send update event to parent
 */
function sendUpdate() {
  const updateData = {
    timestamp: Date.now(),
    count: props.count + 1,
    message: 'Update from child component'
  }
  emit('update', updateData)
}

/**
 * Send custom event with payload
 */
function sendCustomEvent() {
  const eventData = {
    type: 'custom',
    source: 'ComponentComposition',
    data: { user: currentUser.value }
  }
  emit('customEvent', eventData)
}

/**
 * Edit user action
 */
function editUser() {
  currentUser.value = {
    ...currentUser.value,
    name: 'Updated User',
    role: 'Senior Developer'
  }
}

/**
 * Delete user action
 */
function deleteUser() {
  currentUser.value = {
    name: 'Deleted User',
    role: 'Unknown',
    id: -1
  }
}
</script>