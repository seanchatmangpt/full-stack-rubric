<template>
  <div class="data-list">
    <!-- Header -->
    <div class="list-header" v-if="showHeader">
      <slot name="header">
        <h3>{{ title }}</h3>
        <div class="list-actions">
          <slot name="actions"></slot>
        </div>
      </slot>
    </div>

    <!-- Search/Filter -->
    <div class="list-controls" v-if="searchable || filterable">
      <div class="search-box" v-if="searchable">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="searchPlaceholder"
          class="search-input"
        />
        <div class="search-icon">🔍</div>
      </div>
      
      <div class="filter-box" v-if="filterable">
        <select v-model="activeFilter" class="filter-select">
          <option value="">All items</option>
          <option
            v-for="filter in filters"
            :key="filter.value"
            :value="filter.value"
          >
            {{ filter.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="list-loading">
      <slot name="loading">
        <div class="loading-spinner"></div>
        <p>Loading items...</p>
      </slot>
    </div>

    <!-- List -->
    <div v-else-if="filteredData.length > 0" :class="['list-container', layoutClass]">
      <div
        v-for="(item, index) in paginatedData"
        :key="getItemKey(item, index)"
        :class="['list-item', {
          'selectable': selectable,
          'selected': isItemSelected(item),
          'clickable': itemClickable
        }]"
        @click="handleItemClick(item, index)"
      >
        <div class="item-content">
          <!-- Selection checkbox -->
          <div v-if="selectable" class="item-select">
            <input
              type="checkbox"
              :checked="isItemSelected(item)"
              @click.stop
              @change="toggleItemSelection(item)"
            />
          </div>

          <!-- Item content slot -->
          <div class="item-body">
            <slot name="item" :item="item" :index="index">
              <!-- Default item rendering -->
              <div class="item-main">
                <h4 v-if="item[titleField]" class="item-title">
                  {{ item[titleField] }}
                </h4>
                <p v-if="item[descriptionField]" class="item-description">
                  {{ item[descriptionField] }}
                </p>
                <div v-if="item[metaField]" class="item-meta">
                  <span v-if="typeof item[metaField] === 'object'">
                    <span
                      v-for="(value, key) in item[metaField]"
                      :key="key"
                      class="meta-item"
                    >
                      {{ key }}: {{ value }}
                    </span>
                  </span>
                  <span v-else class="meta-item">
                    {{ item[metaField] }}
                  </span>
                </div>
              </div>
            </slot>
          </div>

          <!-- Item actions -->
          <div v-if="$slots.actions" class="item-actions">
            <slot name="actions" :item="item" :index="index"></slot>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <slot name="empty">
        <div class="empty-icon">📄</div>
        <h3>No items found</h3>
        <p v-if="searchQuery || activeFilter">
          Try adjusting your search or filter criteria
        </p>
        <p v-else>No data available</p>
      </slot>
    </div>

    <!-- Pagination -->
    <div v-if="paginated && filteredData.length > pageSize" class="list-pagination">
      <button
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
        class="page-button"
      >
        Previous
      </button>
      
      <div class="page-info">
        Page {{ currentPage }} of {{ totalPages }}
        ({{ filteredData.length }} items)
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
    <div class="list-footer" v-if="showFooter">
      <slot name="footer">
        <div class="selection-info" v-if="selectable">
          {{ selectedItems.length }} of {{ filteredData.length }} selected
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

/**
 * List component props
 */
const props = defineProps({
  /** List data array */
  data: {
    type: Array,
    default: () => []
  },
  /** List title */
  title: {
    type: String,
    default: ''
  },
  /** Show list header */
  showHeader: {
    type: Boolean,
    default: true
  },
  /** Show list footer */
  showFooter: {
    type: Boolean,
    default: true
  },
  /** List layout: list, grid, compact */
  layout: {
    type: String,
    default: 'list',
    validator: (value) => ['list', 'grid', 'compact'].includes(value)
  },
  /** Enable item selection */
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
  /** Item clickable */
  itemClickable: {
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
    default: 'Search items...'
  },
  /** Search fields */
  searchFields: {
    type: Array,
    default: () => []
  },
  /** Enable filtering */
  filterable: {
    type: Boolean,
    default: false
  },
  /** Filter options */
  filters: {
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
    default: 10
  },
  /** Default item title field */
  titleField: {
    type: String,
    default: 'title'
  },
  /** Default item description field */
  descriptionField: {
    type: String,
    default: 'description'
  },
  /** Default item meta field */
  metaField: {
    type: String,
    default: 'meta'
  }
})

/**
 * Component emits
 */
const emit = defineEmits([
  'item-click',
  'item-select',
  'selection-change',
  'search',
  'filter'
])

/**
 * Reactive state
 */
const selectedItems = ref([])
const searchQuery = ref('')
const activeFilter = ref('')
const currentPage = ref(1)

/**
 * Computed properties
 */

/**
 * Layout CSS class
 * @type {import('vue').ComputedRef<string>}
 */
const layoutClass = computed(() => `layout-${props.layout}`)

/**
 * Filtered data based on search and filters
 * @type {import('vue').ComputedRef<Array>}
 */
const filteredData = computed(() => {
  let result = props.data

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
        // Search all string fields
        return Object.values(item).some(value => 
          String(value).toLowerCase().includes(query)
        )
      }
    })
  }

  // Apply active filter
  if (activeFilter.value && props.filterable) {
    const filter = props.filters.find(f => f.value === activeFilter.value)
    if (filter && filter.predicate) {
      result = result.filter(filter.predicate)
    }
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
 * Handle item click
 * @param {Object} item - Clicked item
 * @param {number} index - Item index
 */
function handleItemClick(item, index) {
  if (props.itemClickable) {
    emit('item-click', { item, index })
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
  
  emit('item-select', { item, selected: index === -1 })
  emit('selection-change', [...selectedItems.value])
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
 * Watchers
 */
watch(searchQuery, (newQuery) => {
  currentPage.value = 1
  emit('search', newQuery)
})

watch(activeFilter, (newFilter) => {
  currentPage.value = 1
  emit('filter', newFilter)
})

watch(() => props.data, () => {
  selectedItems.value = []
  currentPage.value = 1
}, { deep: true })
</script>

<style scoped>
.data-list {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  overflow: hidden;
}

.list-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
}

.list-header h3 {
  margin: 0;
  color: #374151;
}

.list-controls {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
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

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  outline: none;
  min-width: 150px;
}

.filter-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

.list-loading {
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

/* List Layout */
.list-container.layout-list {
  display: flex;
  flex-direction: column;
}

.list-container.layout-list .list-item {
  border-bottom: 1px solid #e5e7eb;
}

.list-container.layout-list .list-item:last-child {
  border-bottom: none;
}

/* Grid Layout */
.list-container.layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.list-container.layout-grid .list-item {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

/* Compact Layout */
.list-container.layout-compact .list-item {
  border-bottom: 1px solid #e5e7eb;
  min-height: auto;
}

.list-container.layout-compact .item-content {
  padding: 0.5rem 1rem;
}

.list-item {
  background: white;
  transition: background-color 0.2s;
}

.list-item:hover {
  background: #f9fafb;
}

.list-item.selected {
  background: #dbeafe;
}

.list-item.clickable {
  cursor: pointer;
}

.item-content {
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.item-select {
  padding-top: 0.25rem;
}

.item-body {
  flex: 1;
}

.item-title {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
}

.item-description {
  margin: 0 0 0.75rem 0;
  color: #6b7280;
  line-height: 1.5;
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
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

.list-pagination {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.page-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.list-footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Responsive design */
@media (max-width: 768px) {
  .list-controls {
    flex-direction: column;
  }
  
  .search-box {
    min-width: unset;
  }
  
  .list-container.layout-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .item-content {
    padding: 0.75rem;
    gap: 0.75rem;
  }
  
  .item-meta {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .list-pagination {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>