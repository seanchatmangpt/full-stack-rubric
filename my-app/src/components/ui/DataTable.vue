<template>
  <div class="data-table">
    <!-- Header -->
    <div class="table-header" v-if="showHeader">
      <slot name="header">
        <h3>{{ title }}</h3>
        <div class="table-actions">
          <slot name="actions"></slot>
        </div>
      </slot>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="table-loading">
      <slot name="loading">
        <div class="loading-spinner"></div>
        <p>Loading data...</p>
      </slot>
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <table class="table">
        <!-- Table Header -->
        <thead>
          <tr>
            <th v-if="selectable" class="select-column">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="toggleSelectAll"
              />
            </th>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="['table-header-cell', {
                'sortable': column.sortable,
                'sorted-asc': sortBy === column.key && sortOrder === 'asc',
                'sorted-desc': sortBy === column.key && sortOrder === 'desc'
              }]"
              @click="column.sortable && handleSort(column.key)"
            >
              {{ column.label }}
              <span v-if="column.sortable" class="sort-icon">
                <span v-if="sortBy === column.key">
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
                <span v-else>↕</span>
              </span>
            </th>
          </tr>
        </thead>

        <!-- Table Body -->
        <tbody>
          <tr
            v-for="(row, index) in sortedData"
            :key="getRowKey(row, index)"
            :class="['table-row', {
              'selected': isRowSelected(row),
              'clickable': rowClickable
            }]"
            @click="handleRowClick(row, index)"
          >
            <td v-if="selectable" class="select-column">
              <input
                type="checkbox"
                :checked="isRowSelected(row)"
                @click.stop
                @change="toggleRowSelection(row)"
              />
            </td>
            <td
              v-for="column in columns"
              :key="column.key"
              :class="['table-cell', column.class]"
            >
              <slot :name="`cell-${column.key}`" :row="row" :column="column" :value="getCellValue(row, column.key)">
                {{ formatCellValue(getCellValue(row, column.key), column) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty state -->
      <div v-if="sortedData.length === 0" class="empty-state">
        <slot name="empty">
          <p>No data available</p>
        </slot>
      </div>
    </div>

    <!-- Footer -->
    <div class="table-footer" v-if="showFooter">
      <slot name="footer">
        <div class="selection-info" v-if="selectable">
          {{ selectedRows.length }} of {{ data.length }} selected
        </div>
        <div class="table-info">
          Showing {{ sortedData.length }} {{ sortedData.length === 1 ? 'item' : 'items' }}
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

/**
 * Table component props
 * @typedef {Object} Column
 * @property {string} key - Column key
 * @property {string} label - Column display label
 * @property {boolean} sortable - Whether column is sortable
 * @property {string} class - CSS class for column
 * @property {Function} formatter - Custom formatter function
 */

/**
 * @type {import('vue').PropType<Column[]>}
 */
const props = defineProps({
  /** Table data array */
  data: {
    type: Array,
    default: () => []
  },
  /** Column definitions */
  columns: {
    type: Array,
    required: true
  },
  /** Table title */
  title: {
    type: String,
    default: ''
  },
  /** Show table header */
  showHeader: {
    type: Boolean,
    default: true
  },
  /** Show table footer */
  showFooter: {
    type: Boolean,
    default: true
  },
  /** Enable row selection */
  selectable: {
    type: Boolean,
    default: false
  },
  /** Multiple row selection */
  multiSelect: {
    type: Boolean,
    default: true
  },
  /** Row key field */
  rowKey: {
    type: String,
    default: 'id'
  },
  /** Loading state */
  loading: {
    type: Boolean,
    default: false
  },
  /** Row clickable */
  rowClickable: {
    type: Boolean,
    default: false
  },
  /** Default sort column */
  defaultSort: {
    type: String,
    default: ''
  },
  /** Default sort order */
  defaultSortOrder: {
    type: String,
    default: 'asc',
    validator: (value) => ['asc', 'desc'].includes(value)
  }
})

/**
 * Component emits
 */
const emit = defineEmits([
  'row-click',
  'row-select',
  'sort-change',
  'selection-change'
])

/**
 * Reactive state
 */
const sortBy = ref(props.defaultSort)
const sortOrder = ref(props.defaultSortOrder)
const selectedRows = ref([])

/**
 * Computed properties
 */

/**
 * Sorted data based on current sort settings
 * @type {import('vue').ComputedRef<Array>}
 */
const sortedData = computed(() => {
  if (!sortBy.value) return props.data
  
  const column = props.columns.find(col => col.key === sortBy.value)
  if (!column?.sortable) return props.data
  
  return [...props.data].sort((a, b) => {
    const aVal = getCellValue(a, sortBy.value)
    const bVal = getCellValue(b, sortBy.value)
    
    let result = 0
    if (aVal < bVal) result = -1
    else if (aVal > bVal) result = 1
    
    return sortOrder.value === 'desc' ? -result : result
  })
})

/**
 * Check if all rows are selected
 * @type {import('vue').ComputedRef<boolean>}
 */
const isAllSelected = computed(() => {
  return props.data.length > 0 && selectedRows.value.length === props.data.length
})

/**
 * Check if selection is indeterminate
 * @type {import('vue').ComputedRef<boolean>}
 */
const isIndeterminate = computed(() => {
  return selectedRows.value.length > 0 && selectedRows.value.length < props.data.length
})

/**
 * Methods
 */

/**
 * Get cell value from row
 * @param {Object} row - Data row
 * @param {string} key - Column key
 * @returns {any} Cell value
 */
function getCellValue(row, key) {
  return key.split('.').reduce((obj, prop) => obj?.[prop], row)
}

/**
 * Format cell value
 * @param {any} value - Cell value
 * @param {Column} column - Column definition
 * @returns {string} Formatted value
 */
function formatCellValue(value, column) {
  if (column.formatter && typeof column.formatter === 'function') {
    return column.formatter(value)
  }
  return value ?? ''
}

/**
 * Get row key
 * @param {Object} row - Data row
 * @param {number} index - Row index
 * @returns {string|number} Row key
 */
function getRowKey(row, index) {
  return getCellValue(row, props.rowKey) ?? index
}

/**
 * Handle column sort
 * @param {string} key - Column key
 */
function handleSort(key) {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }
  
  emit('sort-change', { column: key, order: sortOrder.value })
}

/**
 * Handle row click
 * @param {Object} row - Clicked row
 * @param {number} index - Row index
 */
function handleRowClick(row, index) {
  if (props.rowClickable) {
    emit('row-click', { row, index })
  }
}

/**
 * Check if row is selected
 * @param {Object} row - Data row
 * @returns {boolean} Is selected
 */
function isRowSelected(row) {
  const rowKey = getRowKey(row, 0)
  return selectedRows.value.some(selectedRow => 
    getRowKey(selectedRow, 0) === rowKey
  )
}

/**
 * Toggle row selection
 * @param {Object} row - Data row
 */
function toggleRowSelection(row) {
  const rowKey = getRowKey(row, 0)
  const index = selectedRows.value.findIndex(selectedRow => 
    getRowKey(selectedRow, 0) === rowKey
  )
  
  if (index > -1) {
    selectedRows.value.splice(index, 1)
  } else {
    if (props.multiSelect) {
      selectedRows.value.push(row)
    } else {
      selectedRows.value = [row]
    }
  }
  
  emit('row-select', { row, selected: index === -1 })
  emit('selection-change', [...selectedRows.value])
}

/**
 * Toggle select all rows
 */
function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedRows.value = []
  } else {
    selectedRows.value = [...props.data]
  }
  
  emit('selection-change', [...selectedRows.value])
}

/**
 * Watch for data changes to reset selection
 */
watch(() => props.data, () => {
  selectedRows.value = []
}, { deep: true })
</script>

<style scoped>
.data-table {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  overflow: hidden;
}

.table-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
}

.table-header h3 {
  margin: 0;
  color: #374151;
}

.table-loading {
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

.table-container {
  overflow: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table-header-cell {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.table-header-cell.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
}

.table-header-cell.sortable:hover {
  background: #f3f4f6;
}

.sort-icon {
  margin-left: 0.5rem;
  color: #6b7280;
}

.table-header-cell.sorted-asc .sort-icon,
.table-header-cell.sorted-desc .sort-icon {
  color: #3b82f6;
}

.table-row {
  border-bottom: 1px solid #e5e7eb;
}

.table-row:hover {
  background: #f9fafb;
}

.table-row.selected {
  background: #dbeafe;
}

.table-row.clickable {
  cursor: pointer;
}

.table-cell {
  padding: 0.75rem 1rem;
  color: #374151;
  vertical-align: top;
}

.select-column {
  width: 40px;
  text-align: center;
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: #6b7280;
}

.table-footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Responsive design */
@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .table {
    font-size: 0.875rem;
  }
  
  .table-cell,
  .table-header-cell {
    padding: 0.5rem;
  }
  
  .table-footer {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>