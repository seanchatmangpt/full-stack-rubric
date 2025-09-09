<template>
  <div>
    <h3>Composable Example</h3>
    
    <div>
      <h4>Counter Composable</h4>
      <p>Count: {{ count }}</p>
      <p>Double: {{ double }}</p>
      <button @click="increment">+</button>
      <button @click="decrement">-</button>
      <button @click="reset">Reset</button>
    </div>
    
    <div>
      <h4>Local Storage Composable</h4>
      <input 
        v-model="storedValue" 
        placeholder="This value persists in localStorage"
      >
      <p>Stored value: {{ storedValue }}</p>
      <button @click="clearStorage">Clear Storage</button>
    </div>
    
    <div>
      <h4>Mouse Position Composable</h4>
      <p>Mouse X: {{ x }}</p>
      <p>Mouse Y: {{ y }}</p>
      <button @click="toggleMouseTracking">
        {{ isTrackingMouse ? 'Stop' : 'Start' }} Mouse Tracking
      </button>
    </div>
    
    <div>
      <h4>API Fetch Composable</h4>
      <button @click="fetchData" :disabled="loading">
        {{ loading ? 'Loading...' : 'Fetch Random Quote' }}
      </button>
      <div v-if="error">
        <p>Error: {{ error }}</p>
      </div>
      <div v-if="data">
        <p><strong>Quote:</strong> "{{ data.content }}"</p>
        <p><em>- {{ data.author }}</em></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCounter } from '../composables/useCounter.js'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useMouse } from '../composables/useMouse.js'
import { useFetch } from '../composables/useFetch.js'

// Use counter composable
const { count, double, increment, decrement, reset } = useCounter(0)

// Use localStorage composable
const { value: storedValue, clear: clearStorage } = useLocalStorage('demo-value', '')

// Use mouse position composable
const { x, y, isTracking: isTrackingMouse, toggle: toggleMouseTracking } = useMouse()

// Use fetch composable
const { data, loading, error, execute: fetchData } = useFetch('https://api.quotable.io/random')
</script>