<template>
  <div class="card-grid">
    <!-- Header -->
    <div class="grid-header" v-if="showHeader">
      <slot name="header">
        <h3>{{ title }}</h3>
        <div class="grid-actions">
          <slot name="actions"></slot>
        </div>
      </slot>
    </div>

    <!-- Controls -->
    <div class="grid-controls" v-if="searchable || sortable">
      <div class="control-group">
        <!-- Search -->
        <div class="search-box" v-if="searchable">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="searchPlaceholder"
            class="search-input"
          />
          <div class="search-icon">🔍</div>
        </div>

        <!-- Sort -->
        <div class="sort-box" v-if="sortable">
          <select v-model="sortBy" class="sort-select">
            <option value="">Default order</option>
            <option
              v-for="option in sortOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          
          <button
            v-if="sortBy"
            @click="toggleSortOrder"
            class="sort-order-button"
            :title="`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`"
          >
            {{ sortOrder === 'asc' ? '↑' : '↓' }}
          </button>
        </div>
      </div>

      <!-- Layout toggle -->
      <div class="layout-toggle" v-if="layoutSwitcher">
        <button
          v-for="layout in availableLayouts"
          :key="layout.value"
          @click="currentLayout = layout.value"
          :class="['layout-button', { active: currentLayout === layout.value }]"
          :title="layout.label"
        >
          {{ layout.icon }}
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="grid-loading">
      <slot name="loading">
        <div class="loading-spinner"></div>
        <p>Loading cards...</p>
      </slot>
    </div>

    <!-- Card Grid -->
    <div v-else-if="filteredData.length > 0" :class="['card-container', layoutClass]">
      <div
        v-for="(item, index) in paginatedData"
        :key="getItemKey(item, index)"
        :class="['card-item', {
          'selectable': selectable,
          'selected': isItemSelected(item),
          'clickable': cardClickable
        }]"
        @click="handleCardClick(item, index)"
      >
        <!-- Selection checkbox -->
        <div v-if="selectable" class="card-select">
          <input
            type="checkbox"
            :checked="isItemSelected(item)"
            @click.stop
            @change="toggleItemSelection(item)"
          />
        </div>

        <!-- Card content -->
        <div class="card-content">
          <slot name="card" :item="item" :index="index">
            <!-- Default card rendering -->
            <div class="card-header" v-if="item[imageField] || item[titleField]">
              <div v-if="item[imageField]" class="card-image">
                <img :src="item[imageField]" :alt="item[titleField] || 'Card image'" />
              </div>
              <div class="card-title-section">
                <h4 v-if="item[titleField]" class="card-title">
                  {{ item[titleField] }}
                </h4>
                <p v-if="item[subtitleField]" class="card-subtitle">
                  {{ item[subtitleField] }}
                </p>
              </div>
            </div>

            <div class="card-body">
              <p v-if="item[descriptionField]" class="card-description">
                {{ truncateText(item[descriptionField], descriptionLimit) }}
              </p>
              
              <div v-if="item[metaField]" class="card-meta">
                <div
                  v-for="(value, key) in item[metaField]"
                  :key="key"
                  class="meta-item"
                >
                  <span class="meta-label">{{ formatMetaLabel(key) }}:</span>
                  <span class="meta-value">{{ value }}</span>
                </div>
              </div>

              <div v-if="item[tagsField]" class="card-tags">
                <span
                  v-for="tag in item[tagsField]"
                  :key="tag"
                  class="tag"
                >
                  {{ tag }}
                </span>
              </div>
            </div>

            <div v-if="item[statusField] || item[dateField]" class="card-footer">
              <div v-if="item[statusField]" class="card-status">
                <span :class="['status-badge', `status-${item[statusField]}`]">
                  {{ item[statusField] }}
                </span>
              </div>
              
              <div v-if="item[dateField]" class="card-date">
                {{ formatDate(item[dateField]) }}
              </div>
            </div>
          </slot>
        </div>

        <!-- Card actions -->
        <div v-if="$slots.actions" class="card-actions">
          <slot name="actions" :item="item" :index="index"></slot>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <slot name="empty">
        <div class="empty-icon">🃏</div>
        <h3>No cards found</h3>
        <p v-if="searchQuery">
          Try a different search term
        </p>
        <p v-else>No data available</p>
      </slot>
    </div>

    <!-- Pagination -->
    <div v-if="paginated && filteredData.length > pageSize" class="grid-pagination">
      <button
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
        class="page-button"
      >
        Previous
      </button>
      
      <div class="page-numbers">
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="goToPage(page)"
          :class="['page-number', { active: currentPage === page }]"
        >
          {{ page }}
        </button>
      </div>
      
      <button
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
        class="page-button"
      >
        Next
      </button>
    </div>

    <!-- Footer -->
    <div class="grid-footer" v-if="showFooter">
      <slot name="footer">
        <div class="grid-stats">
          <span>{{ filteredData.length }} {{ filteredData.length === 1 ? 'card' : 'cards' }}</span>
          <span v-if="selectable && selectedItems.length > 0">
            • {{ selectedItems.length }} selected
          </span>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

/**
 * Card grid component props
 */
const props = defineProps({
  /** Card data array */
  data: {
    type: Array,
    default: () => []
  },
  /** Grid title */
  title: {
    type: String,
    default: ''
  },
  /** Show grid header */
  showHeader: {
    type: Boolean,
    default: true
  },
  /** Show grid footer */
  showFooter: {
    type: Boolean,
    default: true
  },
  /** Grid layout: grid, masonry, list */
  layout: {
    type: String,
    default: 'grid',
    validator: (value) => ['grid', 'masonry', 'list'].includes(value)
  },
  /** Allow layout switching */
  layoutSwitcher: {
    type: Boolean,
    default: false
  },
  /** Card columns */
  columns: {
    type: Object,
    default: () => ({
      xs: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5
    })
  },
  /** Enable card selection */
  selectable: {
    type: Boolean,
    default: false
  },
  /** Item key field */
  itemKey: {
    type: String,
    default: 'id'
  },
  /** Loading state */
  loading: {
    type: Boolean,
    default: false
  },
  /** Card clickable */
  cardClickable: {
    type: Boolean,
    default: false
  },
  /** Enable search */
  searchable: {
    type: Boolean,
    default: false
  },
  /** Search placeholder */
  searchPlaceholder: {
    type: String,
    default: 'Search cards...'
  },
  /** Search fields */
  searchFields: {
    type: Array,
    default: () => []
  },
  /** Enable sorting */
  sortable: {
    type: Boolean,
    default: false
  },
  /** Sort options */
  sortOptions: {
    type: Array,
    default: () => []
  },
  /** Enable pagination */
  paginated: {
    type: Boolean,
    default: false
  },
  /** Page size */
  pageSize: {
    type: Number,
    default: 12
  },
  /** Card field mappings */
  titleField: {
    type: String,
    default: 'title'
  },
  subtitleField: {
    type: String,
    default: 'subtitle'
  },
  descriptionField: {
    type: String,
    default: 'description'
  },
  imageField: {
    type: String,
    default: 'image'
  },
  metaField: {
    type: String,
    default: 'meta'
  },
  tagsField: {
    type: String,
    default: 'tags'
  },
  statusField: {
    type: String,
    default: 'status'
  },
  dateField: {
    type: String,
    default: 'date'
  },
  /** Description character limit */
  descriptionLimit: {
    type: Number,
    default: 150
  }
})

/**
 * Component emits
 */
const emit = defineEmits([
  'card-click',
  'card-select',
  'selection-change',
  'search',
  'sort'
])

/**
 * Reactive state
 */
const selectedItems = ref([])
const searchQuery = ref('')
const sortBy = ref('')
const sortOrder = ref('asc')
const currentPage = ref(1)
const currentLayout = ref(props.layout)

/**
 * Available layouts for switching
 */
const availableLayouts = [
  { value: 'grid', label: 'Grid View', icon: '⊞' },
  { value: 'masonry', label: 'Masonry View', icon: '⊡' },
  { value: 'list', label: 'List View', icon: '☰' }
]

/**
 * Computed properties
 */

/**
 * Layout CSS class
 * @type {import('vue').ComputedRef<string>}
 */
const layoutClass = computed(() => `layout-${currentLayout.value}`)

/**
 * Filtered and sorted data
 * @type {import('vue').ComputedRef<Array>}
 */
const filteredData = computed(() => {
  let result = [...props.data]

  // Apply search filter
  if (searchQuery.value && props.searchable) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item => {
      if (props.searchFields.length > 0) {
        return props.searchFields.some(field => {
          const value = getFieldValue(item, field)
          return String(value).toLowerCase().includes(query)
        })
      } else {
        return Object.values(item).some(value => 
          String(value).toLowerCase().includes(query)
        )
      }
    })
  }

  // Apply sorting
  if (sortBy.value && props.sortable) {
    result.sort((a, b) => {
      const aVal = getFieldValue(a, sortBy.value)
      const bVal = getFieldValue(b, sortBy.value)
      
      let comparison = 0
      if (aVal < bVal) comparison = -1
      else if (aVal > bVal) comparison = 1
      
      return sortOrder.value === 'desc' ? -comparison : comparison
    })
  }

  return result
})

/**
 * Total pages for pagination
 * @type {import('vue').ComputedRef<number>}
 */
const totalPages = computed(() => {
  if (!props.paginated) return 1
  return Math.ceil(filteredData.value.length / props.pageSize)
})

/**
 * Visible page numbers for pagination
 * @type {import('vue').ComputedRef<number[]>}
 */
const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    pages.push(1)
    if (current > 4) pages.push('...')
    
    const start = Math.max(2, current - 2)
    const end = Math.min(total - 1, current + 2)
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    if (current < total - 3) pages.push('...')
    pages.push(total)
  }
  
  return pages.filter(page => page !== '...')
})

/**
 * Current page data
 * @type {import('vue').ComputedRef<Array>}
 */
const paginatedData = computed(() => {
  if (!props.paginated) return filteredData.value
  
  const start = (currentPage.value - 1) * props.pageSize
  const end = start + props.pageSize
  return filteredData.value.slice(start, end)
})

/**
 * Methods
 */

/**
 * Get field value from item
 * @param {Object} item - Data item
 * @param {string} field - Field path
 * @returns {any} Field value
 */
function getFieldValue(item, field) {
  return field.split('.').reduce((obj, prop) => obj?.[prop], item)
}

/**
 * Get item key
 * @param {Object} item - Data item
 * @param {number} index - Item index
 * @returns {string|number} Item key
 */
function getItemKey(item, index) {
  return getFieldValue(item, props.itemKey) ?? index
}

/**
 * Handle card click
 * @param {Object} item - Clicked item
 * @param {number} index - Item index
 */
function handleCardClick(item, index) {
  if (props.cardClickable) {
    emit('card-click', { item, index })
  }
}

/**
 * Check if item is selected
 * @param {Object} item - Data item
 * @returns {boolean} Is selected
 */
function isItemSelected(item) {
  const itemKey = getItemKey(item, 0)
  return selectedItems.value.some(selectedItem => 
    getItemKey(selectedItem, 0) === itemKey
  )
}

/**
 * Toggle item selection
 * @param {Object} item - Data item
 */
function toggleItemSelection(item) {
  const itemKey = getItemKey(item, 0)
  const index = selectedItems.value.findIndex(selectedItem => 
    getItemKey(selectedItem, 0) === itemKey
  )
  
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(item)
  }
  
  emit('card-select', { item, selected: index === -1 })
  emit('selection-change', [...selectedItems.value])
}

/**
 * Toggle sort order
 */
function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  emit('sort', { field: sortBy.value, order: sortOrder.value })
}

/**
 * Go to specific page
 * @param {number} page - Page number
 */
function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

/**
 * Truncate text to specified limit
 * @param {string} text - Text to truncate
 * @param {number} limit - Character limit
 * @returns {string} Truncated text
 */
function truncateText(text, limit) {
  if (!text || text.length <= limit) return text
  return text.substring(0, limit).trim() + '...'
}

/**
 * Format meta label
 * @param {string} key - Meta key
 * @returns {string} Formatted label
 */
function formatMetaLabel(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}

/**
 * Format date
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

/**
 * Watchers
 */
watch(searchQuery, (newQuery) => {
  currentPage.value = 1
  emit('search', newQuery)
})

watch(sortBy, (newSortBy) => {
  if (newSortBy) {
    emit('sort', { field: newSortBy, order: sortOrder.value })
  }
})

watch(() => props.data, () => {
  selectedItems.value = []
  currentPage.value = 1
}, { deep: true })
</script>

<style scoped>
.card-grid {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  overflow: hidden;
}

.grid-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
}

.grid-header h3 {
  margin: 0;
  color: #374151;
}

.grid-controls {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.control-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  min-width: 200px;
}

.search-input {
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  pointer-events: none;
}

.sort-box {
  display: flex;
  gap: 0.5rem;
}

.sort-select {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  outline: none;
  min-width: 150px;
}

.sort-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

.sort-order-button {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  width: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sort-order-button:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.layout-toggle {
  display: flex;
  gap: 0.25rem;
}

.layout-button {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  background: white;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.layout-button:first-child {
  border-radius: 6px 0 0 6px;
}

.layout-button:last-child {
  border-radius: 0 6px 6px 0;
}

.layout-button.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.layout-button:hover:not(.active) {
  background: #f3f4f6;
}

.grid-loading {
  padding: 3rem;
  text-align: center;
  color: #6b7280;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-left-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Grid Layout */
.card-container.layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

/* Masonry Layout */
.card-container.layout-masonry {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  grid-auto-rows: max-content;
  gap: 1rem;
  padding: 1rem;
}

/* List Layout */
.card-container.layout-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.card-container.layout-list .card-item {
  display: flex;
  align-items: flex-start;
  max-width: none;
}

.card-container.layout-list .card-content {
  flex: 1;
  display: flex;
  gap: 1rem;
}

.card-container.layout-list .card-header {
  flex: 0 0 200px;
}

.card-container.layout-list .card-body {
  flex: 1;
}

.card-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
  position: relative;
}

.card-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.card-item.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

.card-item.clickable {
  cursor: pointer;
}

.card-select {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 1;
  background: white;
  border-radius: 4px;
  padding: 0.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-header {
  position: relative;
}

.card-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-title-section {
  padding: 1rem 1rem 0 1rem;
}

.card-title {
  margin: 0 0 0.25rem 0;
  color: #374151;
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.4;
}

.card-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.card-body {
  padding: 1rem;
  flex: 1;
}

.card-description {
  margin: 0 0 1rem 0;
  color: #6b7280;
  line-height: 1.5;
}

.card-meta {
  margin-bottom: 1rem;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.meta-label {
  color: #6b7280;
}

.meta-value {
  color: #374151;
  font-weight: 500;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  color: #374151;
  border-radius: 4px;
  font-size: 0.75rem;
}

.card-footer {
  padding: 0 1rem 1rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  margin-top: auto;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-active { background: #dcfce7; color: #166534; }
.status-inactive { background: #fef3c7; color: #92400e; }
.status-pending { background: #fef2f2; color: #991b1b; }

.card-date {
  color: #6b7280;
}

.card-actions {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.empty-state p {
  margin: 0;
  color: #6b7280;
}

.grid-pagination {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  background: #f9fafb;
}

.page-button {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.page-button:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 2.5rem;
  text-align: center;
}

.page-number:hover:not(.active) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.page-number.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.grid-footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Responsive design */
@media (max-width: 768px) {
  .grid-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .control-group {
    flex-direction: column;
  }
  
  .search-box {
    min-width: unset;
  }
  
  .card-container.layout-grid,
  .card-container.layout-masonry {
    grid-template-columns: 1fr;
  }
  
  .card-container.layout-list .card-content {
    flex-direction: column;
  }
  
  .card-container.layout-list .card-header {
    flex: unset;
  }
  
  .grid-pagination {
    flex-wrap: wrap;
  }
  
  .page-numbers {
    order: 2;
    width: 100%;
    justify-content: center;
    margin-top: 1rem;
  }
}

@media (max-width: 640px) {
  .card-container.layout-grid,
  .card-container.layout-masonry {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 0.75rem;
  }
  
  .card-title {
    font-size: 1rem;
  }
  
  .card-body {
    padding: 0.75rem;
  }
}
</style>