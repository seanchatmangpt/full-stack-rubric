<template>
  <div v-if="totalPages > 1" class="pagination">
    <!-- Items per page selector -->
    <div class="page-size-selector" v-if="showPageSize">
      <label for="page-size" class="page-size-label">Items per page:</label>
      <select
        id="page-size"
        v-model="internalPageSize"
        @change="handlePageSizeChange"
        class="page-size-select"
      >
        <option
          v-for="size in pageSizeOptions"
          :key="size"
          :value="size"
        >
          {{ size }}
        </option>
      </select>
    </div>

    <!-- Pagination controls -->
    <div class="pagination-controls">
      <!-- First page -->
      <button
        v-if="showFirstLast"
        :disabled="currentPage === 1"
        @click="goToPage(1)"
        class="page-button first-button"
        :title="'Go to first page'"
      >
        <span v-if="buttonStyle === 'text'">First</span>
        <span v-else>⟪</span>
      </button>

      <!-- Previous page -->
      <button
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
        class="page-button prev-button"
        :title="'Go to previous page'"
      >
        <span v-if="buttonStyle === 'text'">Previous</span>
        <span v-else>‹</span>
      </button>

      <!-- Page numbers -->
      <div class="page-numbers">
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="['page-number', {
            'active': page === currentPage,
            'ellipsis': page === '...'
          }]"
          :disabled="page === '...'"
          @click="page !== '...' && goToPage(page)"
        >
          {{ page }}
        </button>
      </div>

      <!-- Next page -->
      <button
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
        class="page-button next-button"
        :title="'Go to next page'"
      >
        <span v-if="buttonStyle === 'text'">Next</span>
        <span v-else>›</span>
      </button>

      <!-- Last page -->
      <button
        v-if="showFirstLast"
        :disabled="currentPage === totalPages"
        @click="goToPage(totalPages)"
        class="page-button last-button"
        :title="'Go to last page'"
      >
        <span v-if="buttonStyle === 'text'">Last</span>
        <span v-else>⟫</span>
      </button>
    </div>

    <!-- Page info -->
    <div class="page-info" v-if="showInfo">
      <slot name="info" :current="currentPage" :total="totalPages" :itemCount="totalItems">
        <span class="page-summary">
          Page {{ currentPage }} of {{ totalPages }}
          <span v-if="totalItems">
            ({{ startItem }}-{{ endItem }} of {{ totalItems }} items)
          </span>
        </span>
      </slot>
    </div>

    <!-- Jump to page -->
    <div class="page-jumper" v-if="showJumper">
      <label for="page-input" class="jumper-label">Go to page:</label>
      <input
        id="page-input"
        v-model="jumpToPageValue"
        @keyup.enter="handleJumpToPage"
        @blur="handleJumpToPage"
        type="number"
        :min="1"
        :max="totalPages"
        class="page-input"
      />
      <button
        @click="handleJumpToPage"
        class="jump-button"
      >
        Go
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

/**
 * Pagination component props
 */
const props = defineProps({
  /** Current page number */
  currentPage: {
    type: Number,
    default: 1
  },
  /** Total number of pages */
  totalPages: {
    type: Number,
    required: true
  },
  /** Total number of items (optional) */
  totalItems: {
    type: Number,
    default: 0
  },
  /** Items per page */
  pageSize: {
    type: Number,
    default: 10
  },
  /** Show page size selector */
  showPageSize: {
    type: Boolean,
    default: true
  },
  /** Page size options */
  pageSizeOptions: {
    type: Array,
    default: () => [10, 20, 50, 100]
  },
  /** Show first/last buttons */
  showFirstLast: {
    type: Boolean,
    default: true
  },
  /** Show page info */
  showInfo: {
    type: Boolean,
    default: true
  },
  /** Show jump to page */
  showJumper: {
    type: Boolean,
    default: false
  },
  /** Button style: icons or text */
  buttonStyle: {
    type: String,
    default: 'icons',
    validator: (value) => ['icons', 'text'].includes(value)
  },
  /** Maximum visible page buttons */
  maxVisible: {
    type: Number,
    default: 7
  },
  /** Component size */
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  /** Pagination alignment */
  align: {
    type: String,
    default: 'center',
    validator: (value) => ['left', 'center', 'right'].includes(value)
  }
})

/**
 * Component emits
 */
const emit = defineEmits([
  'page-change',
  'page-size-change'
])

/**
 * Reactive state
 */
const internalPageSize = ref(props.pageSize)
const jumpToPageValue = ref('')

/**
 * Computed properties
 */

/**
 * Visible page numbers with ellipsis
 * @type {import('vue').ComputedRef<Array>}
 */
const visiblePages = computed(() => {
  const pages = []
  const total = props.totalPages
  const current = props.currentPage
  const maxVisible = props.maxVisible

  if (total <= maxVisible) {
    // Show all pages if total is less than max visible
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)

    // Calculate range around current page
    let start = Math.max(2, current - Math.floor((maxVisible - 3) / 2))
    let end = Math.min(total - 1, current + Math.floor((maxVisible - 3) / 2))

    // Adjust range if near boundaries
    if (current <= Math.floor((maxVisible - 1) / 2)) {
      end = maxVisible - 2
    } else if (current >= total - Math.floor((maxVisible - 1) / 2)) {
      start = total - maxVisible + 3
    }

    // Add ellipsis before range if needed
    if (start > 2) {
      pages.push('...')
    }

    // Add page range
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Add ellipsis after range if needed
    if (end < total - 1) {
      pages.push('...')
    }

    // Always show last page
    if (total > 1) {
      pages.push(total)
    }
  }

  return pages
})

/**
 * Starting item number for current page
 * @type {import('vue').ComputedRef<number>}
 */
const startItem = computed(() => {
  return (props.currentPage - 1) * internalPageSize.value + 1
})

/**
 * Ending item number for current page
 * @type {import('vue').ComputedRef<number>}
 */
const endItem = computed(() => {
  const end = props.currentPage * internalPageSize.value
  return Math.min(end, props.totalItems || end)
})

/**
 * Component CSS classes
 * @type {import('vue').ComputedRef<Object>}
 */
const cssClasses = computed(() => ({
  [`pagination-${props.size}`]: true,
  [`pagination-${props.align}`]: true
}))

/**
 * Methods
 */

/**
 * Go to specific page
 * @param {number} page - Page number
 */
function goToPage(page) {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page)
  }
}

/**
 * Handle page size change
 */
function handlePageSizeChange() {
  emit('page-size-change', internalPageSize.value)
}

/**
 * Handle jump to page
 */
function handleJumpToPage() {
  const page = parseInt(jumpToPageValue.value)
  if (page >= 1 && page <= props.totalPages) {
    goToPage(page)
    jumpToPageValue.value = ''
  }
}

/**
 * Watchers
 */
watch(() => props.pageSize, (newSize) => {
  internalPageSize.value = newSize
})

watch(() => props.currentPage, () => {
  jumpToPageValue.value = ''
})
</script>

<style scoped>
.pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  font-size: 0.875rem;
}

.pagination-left {
  justify-content: flex-start;
}

.pagination-center {
  justify-content: center;
}

.pagination-right {
  justify-content: flex-end;
}

.pagination-small {
  font-size: 0.75rem;
  gap: 0.5rem;
  padding: 0.5rem 0;
}

.pagination-large {
  font-size: 1rem;
  gap: 1.5rem;
  padding: 1.5rem 0;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
}

.page-size-label {
  white-space: nowrap;
  font-size: 0.875rem;
}

.page-size-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  outline: none;
}

.page-size-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.page-button {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  font-size: inherit;
  line-height: 1;
}

.page-button:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-small .page-button {
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
}

.pagination-large .page-button {
  padding: 0.75rem 1rem;
  font-size: 1rem;
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
  font-size: inherit;
  line-height: 1;
  min-width: 2.5rem;
  text-align: center;
}

.pagination-small .page-number {
  padding: 0.375rem 0.5rem;
  min-width: 2rem;
  font-size: 0.75rem;
}

.pagination-large .page-number {
  padding: 0.75rem 1rem;
  min-width: 3rem;
  font-size: 1rem;
}

.page-number:hover:not(.active):not(.ellipsis) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.page-number.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.page-number.ellipsis {
  border: none;
  background: none;
  cursor: default;
  color: #6b7280;
}

.page-number.ellipsis:hover {
  background: none;
  border: none;
}

.page-info {
  color: #6b7280;
  font-size: 0.875rem;
}

.pagination-small .page-info {
  font-size: 0.75rem;
}

.pagination-large .page-info {
  font-size: 1rem;
}

.page-summary {
  white-space: nowrap;
}

.page-jumper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
}

.jumper-label {
  white-space: nowrap;
  font-size: 0.875rem;
}

.page-input {
  width: 4rem;
  padding: 0.375rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  text-align: center;
  outline: none;
}

.page-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

.jump-button {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.jump-button:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

/* Responsive design */
@media (max-width: 768px) {
  .pagination {
    flex-direction: column;
    gap: 1rem;
  }
  
  .pagination-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .page-numbers {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .page-size-selector,
  .page-info,
  .page-jumper {
    order: -1;
  }
  
  .page-info {
    text-align: center;
  }
}

@media (max-width: 480px) {
  .page-button,
  .page-number {
    padding: 0.375rem 0.5rem;
    min-width: 2rem;
    font-size: 0.75rem;
  }
  
  .page-size-selector {
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }
  
  .page-jumper {
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }
}
</style>