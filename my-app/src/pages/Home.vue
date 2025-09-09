<template>
  <div>
    <h1>Welcome to Vue UI Pattern Library</h1>
    
    <p>This is a comprehensive UI pattern library demonstrating Vue 3 fundamentals through minimal examples.</p>
    
    <!-- Demo UI Components -->
    <div style="margin: 2rem 0;">
      <h2>Search & Filtering Demo</h2>
      <SearchBar 
        v-model="searchQuery" 
        placeholder="Search components..." 
        @search="handleSearch"
      />
      
      <FilterDropdown 
        v-model="selectedCategory"
        :options="categories"
        label="Component Category"
        style="margin-top: 1rem;"
      />
    </div>

    <div style="margin: 2rem 0;">
      <h2>Data Display Demo</h2>
      <DataTable 
        :data="filteredComponents"
        :columns="tableColumns"
        @row-click="handleRowClick"
      />
    </div>

    <div style="margin: 2rem 0;">
      <h2>Form Components Demo</h2>
      <FormInput 
        v-model="demoInput"
        label="Demo Input"
        placeholder="Type something..."
      />
      
      <FormCheckbox 
        v-model="demoCheckbox"
        label="Enable notifications"
        style="margin-top: 1rem;"
      />
    </div>

    <div style="margin: 2rem 0;">
      <h2>Feedback UI Demo</h2>
      <LoadingSpinner v-if="isLoading" />
      <AlertMessage 
        v-if="alertMessage"
        :type="alertType"
        :message="alertMessage"
        @close="clearAlert"
      />
      
      <button @click="showSuccessAlert" style="margin-right: 1rem;">Show Success</button>
      <button @click="showErrorAlert" style="margin-right: 1rem;">Show Error</button>
      <button @click="toggleLoading">Toggle Loading</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import FilterDropdown from '@/components/ui/FilterDropdown.vue'
import DataTable from '@/components/ui/DataTable.vue'
import FormInput from '@/components/ui/FormInput.vue'
import FormCheckbox from '@/components/ui/FormCheckbox.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import AlertMessage from '@/components/ui/AlertMessage.vue'

// Demo data
const searchQuery = ref('')
const selectedCategory = ref('')
const demoInput = ref('')
const demoCheckbox = ref(false)
const isLoading = ref(false)
const alertMessage = ref('')
const alertType = ref('info')

const categories = [
  { label: 'All Categories', value: '' },
  { label: 'Search & Filter', value: 'search' },
  { label: 'Data Display', value: 'data' },
  { label: 'Forms', value: 'forms' },
  { label: 'Navigation', value: 'navigation' },
  { label: 'Feedback', value: 'feedback' },
  { label: 'Layout', value: 'layout' }
]

const components = [
  { name: 'SearchBar', category: 'search', description: 'Debounced search with autocomplete' },
  { name: 'FilterDropdown', category: 'search', description: 'Single/multi-select filtering' },
  { name: 'DataTable', category: 'data', description: 'Sortable table with row selection' },
  { name: 'DataList', category: 'data', description: 'Flexible list layouts' },
  { name: 'FormInput', category: 'forms', description: 'Enhanced input with validation' },
  { name: 'FormSelect', category: 'forms', description: 'Searchable dropdown' },
  { name: 'LoadingSpinner', category: 'feedback', description: 'Loading indicators' },
  { name: 'AlertMessage', category: 'feedback', description: 'Success/error alerts' },
  { name: 'NavMenu', category: 'navigation', description: 'Hierarchical navigation' },
  { name: 'TabNavigation', category: 'navigation', description: 'Tab switching' }
]

const tableColumns = [
  { key: 'name', label: 'Component Name', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'description', label: 'Description', sortable: false }
]

// Computed properties
const filteredComponents = computed(() => {
  let filtered = components
  
  if (selectedCategory.value) {
    filtered = filtered.filter(c => c.category === selectedCategory.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

// Event handlers
const handleSearch = (query) => {
  console.log('Search query:', query)
}

const handleRowClick = (row) => {
  console.log('Selected component:', row)
  showSuccessAlert(`Selected: ${row.name}`)
}

const showSuccessAlert = (message = 'Operation completed successfully!') => {
  alertMessage.value = message
  alertType.value = 'success'
  setTimeout(clearAlert, 3000)
}

const showErrorAlert = () => {
  alertMessage.value = 'Something went wrong. Please try again.'
  alertType.value = 'error'
  setTimeout(clearAlert, 3000)
}

const clearAlert = () => {
  alertMessage.value = ''
}

const toggleLoading = () => {
  isLoading.value = !isLoading.value
}
</script>