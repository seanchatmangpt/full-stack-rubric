<template>
  <div>
    <h1>UI Component Dashboard</h1>
    
    <div style="margin: 2rem 0;">
      <!-- Search and Filters -->
      <div style="display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap;">
        <SearchBar 
          v-model="searchQuery"
          placeholder="Search components or descriptions..."
          style="flex: 1; min-width: 300px;"
        />
        
        <FilterDropdown
          v-model="selectedCategory"
          :options="categoryOptions"
          label="Category"
          style="min-width: 200px;"
        />
        
        <FilterDropdown
          v-model="selectedStatus"
          :options="statusOptions"
          label="Status"
          style="min-width: 150px;"
        />
      </div>

      <!-- Statistics Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
        <Card>
          <template #header>Total Components</template>
          <div style="font-size: 2rem; font-weight: bold; color: #059669;">{{ stats.totalComponents }}</div>
        </Card>
        
        <Card>
          <template #header>Categories</template>
          <div style="font-size: 2rem; font-weight: bold; color: #0284c7;">{{ stats.categories }}</div>
        </Card>
        
        <Card>
          <template #header>Lines of Code</template>
          <div style="font-size: 2rem; font-weight: bold; color: #7c3aed;">{{ stats.linesOfCode }}</div>
        </Card>
        
        <Card>
          <template #header>Test Coverage</template>
          <div style="font-size: 2rem; font-weight: bold; color: #dc2626;">{{ stats.testCoverage }}%</div>
        </Card>
      </div>

      <!-- Component Table -->
      <Card>
        <template #header>
          <div style="display: flex; justify-content: between; align-items: center;">
            <h3>Component Library ({{ filteredComponents.length }} items)</h3>
            <div style="display: flex; gap: 0.5rem;">
              <button @click="refreshData" :disabled="isLoading">
                {{ isLoading ? 'Refreshing...' : 'Refresh' }}
              </button>
              <button @click="exportData">Export</button>
            </div>
          </div>
        </template>
        
        <DataTable
          :data="paginatedComponents"
          :columns="tableColumns"
          :loading="isLoading"
          sort-by="name"
          @row-click="handleComponentClick"
          @sort="handleSort"
        />
        
        <div style="margin-top: 1rem;">
          <Pagination
            :current-page="currentPage"
            :total-pages="totalPages"
            :page-size="pageSize"
            :total-items="filteredComponents.length"
            @page-change="handlePageChange"
            @page-size-change="handlePageSizeChange"
          />
        </div>
      </Card>
    </div>

    <!-- Component Detail Modal -->
    <Modal v-model="showDetailModal" size="lg">
      <template #header>
        <h3>{{ selectedComponent?.name || 'Component Details' }}</h3>
      </template>
      
      <div v-if="selectedComponent">
        <div style="margin-bottom: 1rem;">
          <StatusBadge 
            :type="selectedComponent.status === 'stable' ? 'success' : 'warning'"
            :label="selectedComponent.status"
          />
          <StatusBadge 
            type="info" 
            :label="selectedComponent.category"
            style="margin-left: 0.5rem;"
          />
        </div>
        
        <p><strong>Description:</strong> {{ selectedComponent.description }}</p>
        <p><strong>File Size:</strong> {{ selectedComponent.fileSize }} bytes</p>
        <p><strong>Dependencies:</strong> {{ selectedComponent.dependencies.join(', ') || 'None' }}</p>
        
        <h4>Key Features:</h4>
        <ul>
          <li v-for="feature in selectedComponent.features" :key="feature">{{ feature }}</li>
        </ul>
        
        <h4>Props:</h4>
        <DataTable
          :data="selectedComponent.props"
          :columns="propsColumns"
          :show-pagination="false"
        />
      </div>
      
      <template #footer>
        <button @click="showDetailModal = false">Close</button>
        <button @click="viewComponentSource" style="margin-left: 1rem;">View Source</button>
      </template>
    </Modal>

    <!-- Loading Overlay -->
    <div v-if="isLoading" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
      <LoadingSpinner size="lg" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import FilterDropdown from '@/components/ui/FilterDropdown.vue'
import Card from '@/components/ui/Card.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Pagination from '@/components/ui/Pagination.vue'
import Modal from '@/components/ui/Modal.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

// Reactive data
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const isLoading = ref(false)
const showDetailModal = ref(false)
const selectedComponent = ref(null)
const sortField = ref('name')
const sortDirection = ref('asc')

// Options
const categoryOptions = [
  { label: 'All Categories', value: '' },
  { label: 'Search & Filter', value: 'search' },
  { label: 'Data Display', value: 'data' },
  { label: 'Forms & Modals', value: 'forms' },
  { label: 'Navigation', value: 'navigation' },
  { label: 'Feedback UI', value: 'feedback' },
  { label: 'Layout', value: 'layout' }
]

const statusOptions = [
  { label: 'All Status', value: '' },
  { label: 'Stable', value: 'stable' },
  { label: 'Beta', value: 'beta' },
  { label: 'Alpha', value: 'alpha' }
]

// Component data
const components = ref([
  {
    name: 'SearchBar',
    category: 'search',
    status: 'stable',
    description: 'Debounced search with autocomplete and suggestions',
    fileSize: 8601,
    dependencies: ['vue'],
    features: ['Debounced input', 'Autocomplete dropdown', 'Keyboard navigation', 'Custom suggestions'],
    props: [
      { name: 'modelValue', type: 'string', required: false, default: '' },
      { name: 'placeholder', type: 'string', required: false, default: 'Search...' },
      { name: 'debounce', type: 'number', required: false, default: 300 }
    ]
  },
  {
    name: 'DataTable',
    category: 'data',
    status: 'stable',
    description: 'Sortable table with row selection and pagination',
    fileSize: 10941,
    dependencies: ['vue'],
    features: ['Column sorting', 'Row selection', 'Custom cell rendering', 'Responsive design'],
    props: [
      { name: 'data', type: 'array', required: true, default: null },
      { name: 'columns', type: 'array', required: true, default: null },
      { name: 'loading', type: 'boolean', required: false, default: false }
    ]
  },
  {
    name: 'FormInput',
    category: 'forms',
    status: 'stable',
    description: 'Enhanced input with validation and error states',
    fileSize: 6628,
    dependencies: ['vue'],
    features: ['Validation support', 'Error display', 'Loading states', 'Custom styling'],
    props: [
      { name: 'modelValue', type: 'string', required: false, default: '' },
      { name: 'type', type: 'string', required: false, default: 'text' },
      { name: 'required', type: 'boolean', required: false, default: false }
    ]
  }
  // Add more components as needed...
])

const stats = computed(() => ({
  totalComponents: components.value.length,
  categories: new Set(components.value.map(c => c.category)).size,
  linesOfCode: components.value.reduce((sum, c) => sum + Math.floor(c.fileSize / 20), 0),
  testCoverage: 83
}))

const tableColumns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'fileSize', label: 'Size (bytes)', sortable: true },
  { key: 'description', label: 'Description', sortable: false }
]

const propsColumns = [
  { key: 'name', label: 'Prop Name' },
  { key: 'type', label: 'Type' },
  { key: 'required', label: 'Required' },
  { key: 'default', label: 'Default' }
]

// Computed properties
const filteredComponents = computed(() => {
  let filtered = components.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query)
    )
  }

  if (selectedCategory.value) {
    filtered = filtered.filter(c => c.category === selectedCategory.value)
  }

  if (selectedStatus.value) {
    filtered = filtered.filter(c => c.status === selectedStatus.value)
  }

  // Apply sorting
  filtered.sort((a, b) => {
    const aVal = a[sortField.value]
    const bVal = b[sortField.value]
    
    if (sortDirection.value === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
    }
  })

  return filtered
})

const totalPages = computed(() => 
  Math.ceil(filteredComponents.value.length / pageSize.value)
)

const paginatedComponents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredComponents.value.slice(start, end)
})

// Event handlers
const handleComponentClick = (component) => {
  selectedComponent.value = component
  showDetailModal.value = true
}

const handleSort = ({ field, direction }) => {
  sortField.value = field
  sortDirection.value = direction
}

const handlePageChange = (page) => {
  currentPage.value = page
}

const handlePageSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const refreshData = async () => {
  isLoading.value = true
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  isLoading.value = false
}

const exportData = () => {
  const dataStr = JSON.stringify(filteredComponents.value, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
  
  const exportFileDefaultName = 'component-library.json'
  
  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}

const viewComponentSource = () => {
  if (selectedComponent.value) {
    const url = `https://github.com/your-repo/src/components/ui/${selectedComponent.value.name}.vue`
    window.open(url, '_blank')
  }
}

onMounted(() => {
  // Initialize dashboard
  refreshData()
})
</script>