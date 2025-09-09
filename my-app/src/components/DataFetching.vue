<template>
  <div>
    <h3>Data Fetching Demo</h3>
    
    <div>
      <h4>Basic Fetch with Loading States</h4>
      <button @click="fetchUsers" :disabled="usersLoading">
        {{ usersLoading ? 'Loading Users...' : 'Fetch Users' }}
      </button>
      <button @click="clearUsers">Clear Users</button>
      
      <div v-if="usersError">
        <p><strong>Error:</strong> {{ usersError }}</p>
      </div>
      
      <div v-if="usersLoading">
        <p>Loading users data...</p>
      </div>
      
      <div v-else-if="users.length > 0">
        <ul>
          <li v-for="user in users" :key="user.id">
            <strong>{{ user.name }}</strong> - {{ user.email }}
            <br>
            <small>{{ user.company.name }} | {{ user.address.city }}</small>
          </li>
        </ul>
      </div>
    </div>
    
    <div>
      <h4>Fetch with Parameters</h4>
      <select v-model="selectedUserId">
        <option value="">Select a user ID</option>
        <option v-for="n in 10" :key="n" :value="n">User {{ n }}</option>
      </select>
      <button @click="fetchSingleUser" :disabled="!selectedUserId || singleUserLoading">
        {{ singleUserLoading ? 'Loading...' : 'Fetch User Details' }}
      </button>
      
      <div v-if="singleUserError">
        <p><strong>Error:</strong> {{ singleUserError }}</p>
      </div>
      
      <div v-if="singleUser">
        <h5>User Details:</h5>
        <p><strong>Name:</strong> {{ singleUser.name }}</p>
        <p><strong>Username:</strong> {{ singleUser.username }}</p>
        <p><strong>Email:</strong> {{ singleUser.email }}</p>
        <p><strong>Phone:</strong> {{ singleUser.phone }}</p>
        <p><strong>Website:</strong> {{ singleUser.website }}</p>
      </div>
    </div>
    
    <div>
      <h4>Posts with Async/Await</h4>
      <button @click="fetchPosts" :disabled="postsLoading">
        {{ postsLoading ? 'Loading Posts...' : 'Fetch Posts' }}
      </button>
      <input 
        v-model="postSearchTerm" 
        placeholder="Search posts..."
        :disabled="postsLoading"
      >
      
      <div v-if="postsError">
        <p><strong>Error:</strong> {{ postsError }}</p>
      </div>
      
      <div v-if="filteredPosts.length > 0">
        <p>Showing {{ filteredPosts.length }} of {{ posts.length }} posts</p>
        <div v-for="post in filteredPosts.slice(0, 5)" :key="post.id">
          <h5>{{ post.title }}</h5>
          <p>{{ post.body }}</p>
          <small>User ID: {{ post.userId }} | Post ID: {{ post.id }}</small>
          <hr>
        </div>
        <p v-if="filteredPosts.length > 5">
          ... and {{ filteredPosts.length - 5 }} more posts
        </p>
      </div>
    </div>
    
    <div>
      <h4>Custom API with Error Handling</h4>
      <input v-model="customUrl" placeholder="Enter API URL">
      <button @click="fetchCustomData" :disabled="customLoading || !customUrl">
        {{ customLoading ? 'Fetching...' : 'Fetch Custom Data' }}
      </button>
      
      <div v-if="customError">
        <p><strong>Error:</strong> {{ customError }}</p>
      </div>
      
      <div v-if="customData">
        <h5>Custom Data Response:</h5>
        <pre>{{ JSON.stringify(customData, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

/**
 * Users data
 * @type {import('vue').Ref<Array<any>>}
 */
const users = ref([])

/**
 * Users loading state
 * @type {import('vue').Ref<boolean>}
 */
const usersLoading = ref(false)

/**
 * Users error state
 * @type {import('vue').Ref<string|null>}
 */
const usersError = ref(null)

/**
 * Selected user ID
 * @type {import('vue').Ref<string>}
 */
const selectedUserId = ref('')

/**
 * Single user data
 * @type {import('vue').Ref<any|null>}
 */
const singleUser = ref(null)

/**
 * Single user loading state
 * @type {import('vue').Ref<boolean>}
 */
const singleUserLoading = ref(false)

/**
 * Single user error state
 * @type {import('vue').Ref<string|null>}
 */
const singleUserError = ref(null)

/**
 * Posts data
 * @type {import('vue').Ref<Array<any>>}
 */
const posts = ref([])

/**
 * Posts loading state
 * @type {import('vue').Ref<boolean>}
 */
const postsLoading = ref(false)

/**
 * Posts error state
 * @type {import('vue').Ref<string|null>}
 */
const postsError = ref(null)

/**
 * Post search term
 * @type {import('vue').Ref<string>}
 */
const postSearchTerm = ref('')

/**
 * Custom URL for testing
 * @type {import('vue').Ref<string>}
 */
const customUrl = ref('https://api.github.com/users/octocat')

/**
 * Custom data response
 * @type {import('vue').Ref<any|null>}
 */
const customData = ref(null)

/**
 * Custom data loading state
 * @type {import('vue').Ref<boolean>}
 */
const customLoading = ref(false)

/**
 * Custom data error state
 * @type {import('vue').Ref<string|null>}
 */
const customError = ref(null)

/**
 * Filtered posts based on search term
 * @type {import('vue').ComputedRef<Array<any>>}
 */
const filteredPosts = computed(() => {
  if (!postSearchTerm.value) return posts.value
  
  const searchLower = postSearchTerm.value.toLowerCase()
  return posts.value.filter(post =>
    post.title.toLowerCase().includes(searchLower) ||
    post.body.toLowerCase().includes(searchLower)
  )
})

/**
 * Fetch users from JSONPlaceholder API
 */
async function fetchUsers() {
  usersLoading.value = true
  usersError.value = null
  
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users')
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    users.value = await response.json()
    
  } catch (error) {
    usersError.value = error.message
    console.error('Failed to fetch users:', error)
    
  } finally {
    usersLoading.value = false
  }
}

/**
 * Clear users data
 */
function clearUsers() {
  users.value = []
  usersError.value = null
}

/**
 * Fetch single user details
 */
async function fetchSingleUser() {
  if (!selectedUserId.value) return
  
  singleUserLoading.value = true
  singleUserError.value = null
  singleUser.value = null
  
  try {
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/users/${selectedUserId.value}`
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    singleUser.value = await response.json()
    
  } catch (error) {
    singleUserError.value = error.message
    console.error('Failed to fetch user:', error)
    
  } finally {
    singleUserLoading.value = false
  }
}

/**
 * Fetch posts with error handling
 */
async function fetchPosts() {
  postsLoading.value = true
  postsError.value = null
  
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts')
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    posts.value = data
    
    console.log(`Fetched ${data.length} posts`)
    
  } catch (error) {
    postsError.value = error.message
    console.error('Failed to fetch posts:', error)
    
  } finally {
    postsLoading.value = false
  }
}

/**
 * Fetch data from custom URL
 */
async function fetchCustomData() {
  if (!customUrl.value) return
  
  customLoading.value = true
  customError.value = null
  customData.value = null
  
  try {
    const response = await fetch(customUrl.value)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    customData.value = data
    
  } catch (error) {
    customError.value = `Failed to fetch from ${customUrl.value}: ${error.message}`
    console.error('Custom fetch error:', error)
    
  } finally {
    customLoading.value = false
  }
}

/**
 * Fetch some initial data on component mount
 */
onMounted(() => {
  console.log('DataFetching component mounted')
  // Optionally fetch some initial data
  // fetchUsers()
})
</script>