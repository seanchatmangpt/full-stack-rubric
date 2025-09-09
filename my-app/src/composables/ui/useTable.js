/**
 * Table sorting and filtering logic composable
 * Provides reactive table state management with sorting, filtering, and pagination
 * @module useTable
 */

import { ref, computed, reactive, watch } from 'vue'

/**
 * Advanced table management with sorting, filtering, and pagination
 * @param {Array} data - Initial data array
 * @param {Object} options - Table configuration options
 * @param {number} options.pageSize - Items per page
 * @param {string} options.defaultSort - Default sort column
 * @param {string} options.defaultOrder - Default sort order (asc|desc)
 * @param {boolean} options.serverSide - Server-side processing
 * @returns {Object} Table utilities and state
 */
export function useTable(data = [], options = {}) {
  // Configuration
  const config = reactive({
    pageSize: options.pageSize || 10,
    defaultSort: options.defaultSort || null,
    defaultOrder: options.defaultOrder || 'asc',
    serverSide: options.serverSide || false
  })
  
  // State
  const tableData = ref([...data])
  const currentPage = ref(1)
  const sortColumn = ref(config.defaultSort)
  const sortOrder = ref(config.defaultOrder)
  const filters = reactive({})
  const searchQuery = ref('')
  const selectedRows = ref(new Set())
  const loading = ref(false)
  
  /**
   * Update table data
   * @param {Array} newData - New data array
   */
  const setData = (newData) => {
    tableData.value = [...newData]
    currentPage.value = 1
    selectedRows.value.clear()
  }
  
  /**
   * Sort data by column
   * @param {string} column - Column key to sort by
   * @param {string} order - Sort order (asc|desc)
   */
  const sortBy = (column, order = null) => {
    if (column === sortColumn.value && !order) {
      // Toggle order if same column
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortColumn.value = column
      sortOrder.value = order || 'asc'
    }
    
    currentPage.value = 1
    
    if (config.serverSide) {
      // Emit sort change for server-side handling
      return { column: sortColumn.value, order: sortOrder.value }
    }
  }
  
  /**
   * Add or update filter
   * @param {string} column - Column to filter
   * @param {*} value - Filter value
   * @param {string} operator - Filter operator (equals|contains|starts|ends|gt|lt)
   */
  const addFilter = (column, value, operator = 'contains') => {
    if (value === '' || value === null || value === undefined) {
      delete filters[column]
    } else {
      filters[column] = { value, operator }
    }
    currentPage.value = 1
  }
  
  /**
   * Remove filter for column
   * @param {string} column - Column to remove filter from
   */
  const removeFilter = (column) => {
    delete filters[column]
    currentPage.value = 1
  }
  
  /**
   * Clear all filters
   */
  const clearFilters = () => {
    Object.keys(filters).forEach(key => {
      delete filters[key]
    })
    searchQuery.value = ''
    currentPage.value = 1
  }
  
  /**
   * Set search query
   * @param {string} query - Search query
   */
  const setSearchQuery = (query) => {
    searchQuery.value = query
    currentPage.value = 1
  }
  
  /**
   * Go to specific page
   * @param {number} page - Page number
   */
  const goToPage = (page) => {
    const maxPage = Math.ceil(filteredData.value.length / config.pageSize)
    currentPage.value = Math.max(1, Math.min(page, maxPage))
  }
  
  /**
   * Go to next page
   */
  const nextPage = () => {
    goToPage(currentPage.value + 1)
  }
  
  /**
   * Go to previous page
   */
  const prevPage = () => {
    goToPage(currentPage.value - 1)
  }
  
  /**
   * Toggle row selection
   * @param {string|number} rowId - Row identifier
   */
  const toggleRowSelection = (rowId) => {
    if (selectedRows.value.has(rowId)) {
      selectedRows.value.delete(rowId)
    } else {
      selectedRows.value.add(rowId)
    }
  }
  
  /**
   * Select all filtered rows
   */
  const selectAll = () => {
    filteredData.value.forEach(row => {
      const rowId = getRowId(row)
      selectedRows.value.add(rowId)
    })
  }
  
  /**
   * Clear all selections
   */
  const clearSelection = () => {
    selectedRows.value.clear()
  }
  
  /**
   * Get row ID (uses id field or generates from index)
   * @param {Object} row - Data row
   * @param {number} index - Row index
   * @returns {string|number} Row ID
   */
  const getRowId = (row, index = null) => {
    return row.id || row._id || index || Math.random()
  }
  
  /**
   * Check if value matches filter
   * @param {*} value - Value to check
   * @param {Object} filter - Filter configuration
   * @returns {boolean} Matches filter
   */
  const matchesFilter = (value, filter) => {
    if (!filter || filter.value === '') return true
    
    const stringValue = String(value).toLowerCase()
    const filterValue = String(filter.value).toLowerCase()
    
    switch (filter.operator) {
      case 'equals':
        return stringValue === filterValue
      case 'contains':
        return stringValue.includes(filterValue)
      case 'starts':
        return stringValue.startsWith(filterValue)
      case 'ends':
        return stringValue.endsWith(filterValue)
      case 'gt':
        return Number(value) > Number(filter.value)
      case 'lt':
        return Number(value) < Number(filter.value)
      case 'gte':
        return Number(value) >= Number(filter.value)
      case 'lte':
        return Number(value) <= Number(filter.value)
      default:
        return stringValue.includes(filterValue)
    }
  }
  
  /**
   * Get nested property value from object
   * @param {Object} obj - Object to get value from
   * @param {string} path - Dot notation path
   * @returns {*} Property value
   */
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null
    }, obj)
  }
  
  // Computed properties
  
  /**
   * Filtered data based on filters and search query
   */
  const filteredData = computed(() => {
    if (config.serverSide) return tableData.value
    
    let result = [...tableData.value]
    
    // Apply column filters
    Object.entries(filters).forEach(([column, filter]) => {
      result = result.filter(row => {
        const value = getNestedValue(row, column)
        return matchesFilter(value, filter)
      })
    })
    
    // Apply global search
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(row => {
        return Object.values(row).some(value => {
          return String(value).toLowerCase().includes(query)
        })
      })
    }
    
    return result
  })
  
  /**
   * Sorted data
   */
  const sortedData = computed(() => {
    if (config.serverSide || !sortColumn.value) return filteredData.value
    
    return [...filteredData.value].sort((a, b) => {
      const aVal = getNestedValue(a, sortColumn.value)
      const bVal = getNestedValue(b, sortColumn.value)
      
      let result = 0
      
      // Handle different data types
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        result = aVal - bVal
      } else if (aVal instanceof Date && bVal instanceof Date) {
        result = aVal.getTime() - bVal.getTime()
      } else {
        result = String(aVal).localeCompare(String(bVal))
      }
      
      return sortOrder.value === 'desc' ? -result : result
    })
  })
  
  /**
   * Paginated data for current page
   */
  const paginatedData = computed(() => {
    if (config.serverSide) return tableData.value
    
    const start = (currentPage.value - 1) * config.pageSize
    const end = start + config.pageSize
    
    return sortedData.value.slice(start, end)
  })
  
  /**
   * Pagination info
   */
  const pagination = computed(() => {
    const totalItems = config.serverSide ? tableData.value.length : filteredData.value.length
    const totalPages = Math.ceil(totalItems / config.pageSize)
    const startItem = (currentPage.value - 1) * config.pageSize + 1
    const endItem = Math.min(currentPage.value * config.pageSize, totalItems)
    
    return {
      currentPage: currentPage.value,
      totalPages,
      totalItems,
      startItem,
      endItem,
      hasNext: currentPage.value < totalPages,
      hasPrev: currentPage.value > 1
    }
  })
  
  /**
   * Selection info
   */
  const selection = computed(() => {
    const selectedCount = selectedRows.value.size
    const totalCount = filteredData.value.length
    const isAllSelected = selectedCount === totalCount && totalCount > 0
    const isIndeterminate = selectedCount > 0 && selectedCount < totalCount
    
    return {
      selectedCount,
      totalCount,
      isAllSelected,
      isIndeterminate,
      selectedIds: Array.from(selectedRows.value)
    }
  })
  
  return {
    // State
    tableData,
    currentPage,
    sortColumn,
    sortOrder,
    filters,
    searchQuery,
    selectedRows,
    loading,
    config,
    
    // Computed
    filteredData,
    sortedData,
    paginatedData,
    pagination,
    selection,
    
    // Actions
    setData,
    sortBy,
    addFilter,
    removeFilter,
    clearFilters,
    setSearchQuery,
    goToPage,
    nextPage,
    prevPage,
    toggleRowSelection,
    selectAll,
    clearSelection,
    
    // Utilities
    getRowId,
    getNestedValue,
    matchesFilter
  }
}