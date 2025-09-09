/**
 * Shared filter logic composable
 * @typedef {Object} FilterState
 * @property {string} searchTerm - Current search term
 * @property {Array} selectedFilters - Array of selected filter values
 * @property {Object} rangeFilters - Object containing min/max range values
 * @property {Array} tags - Array of selected tags
 */

import { ref, computed, watch } from 'vue'

/**
 * Composable for managing filter state and operations
 * @param {Object} options - Configuration options
 * @param {number} options.debounceDelay - Debounce delay in milliseconds
 * @param {Function} options.onFilterChange - Callback when filters change
 * @returns {Object} Filter state and methods
 */
export function useFilters(options = {}) {
  const { debounceDelay = 300, onFilterChange } = options

  // Reactive state
  const searchTerm = ref('')
  const selectedFilters = ref([])
  const rangeFilters = ref({})
  const tags = ref([])
  const isLoading = ref(false)

  // Debounce timer
  let debounceTimer = null

  /**
   * Debounced search term
   */
  const debouncedSearchTerm = ref('')

  /**
   * Combined filter state
   */
  const filterState = computed(() => ({
    searchTerm: debouncedSearchTerm.value,
    selectedFilters: selectedFilters.value,
    rangeFilters: rangeFilters.value,
    tags: tags.value
  }))

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = computed(() => {
    return debouncedSearchTerm.value.trim() !== '' ||
           selectedFilters.value.length > 0 ||
           Object.keys(rangeFilters.value).length > 0 ||
           tags.value.length > 0
  })

  /**
   * Debounced search implementation
   */
  watch(searchTerm, (newTerm) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debouncedSearchTerm.value = newTerm
    }, debounceDelay)
  })

  /**
   * Watch for filter changes and trigger callback
   */
  watch(filterState, (newState) => {
    if (onFilterChange) {
      onFilterChange(newState)
    }
  }, { deep: true })

  /**
   * Set search term
   * @param {string} term - Search term
   */
  const setSearchTerm = (term) => {
    searchTerm.value = term
  }

  /**
   * Add filter to selected filters
   * @param {string} filter - Filter value to add
   */
  const addFilter = (filter) => {
    if (!selectedFilters.value.includes(filter)) {
      selectedFilters.value.push(filter)
    }
  }

  /**
   * Remove filter from selected filters
   * @param {string} filter - Filter value to remove
   */
  const removeFilter = (filter) => {
    const index = selectedFilters.value.indexOf(filter)
    if (index > -1) {
      selectedFilters.value.splice(index, 1)
    }
  }

  /**
   * Toggle filter selection
   * @param {string} filter - Filter value to toggle
   */
  const toggleFilter = (filter) => {
    if (selectedFilters.value.includes(filter)) {
      removeFilter(filter)
    } else {
      addFilter(filter)
    }
  }

  /**
   * Set multiple filters
   * @param {Array} filters - Array of filter values
   */
  const setFilters = (filters) => {
    selectedFilters.value = [...filters]
  }

  /**
   * Set range filter
   * @param {string} key - Range filter key
   * @param {Object} range - Range object with min/max values
   */
  const setRangeFilter = (key, range) => {
    rangeFilters.value = {
      ...rangeFilters.value,
      [key]: range
    }
  }

  /**
   * Remove range filter
   * @param {string} key - Range filter key to remove
   */
  const removeRangeFilter = (key) => {
    const { [key]: removed, ...rest } = rangeFilters.value
    rangeFilters.value = rest
  }

  /**
   * Add tag
   * @param {string} tag - Tag to add
   */
  const addTag = (tag) => {
    if (!tags.value.includes(tag)) {
      tags.value.push(tag)
    }
  }

  /**
   * Remove tag
   * @param {string} tag - Tag to remove
   */
  const removeTag = (tag) => {
    const index = tags.value.indexOf(tag)
    if (index > -1) {
      tags.value.splice(index, 1)
    }
  }

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    searchTerm.value = ''
    debouncedSearchTerm.value = ''
    selectedFilters.value = []
    rangeFilters.value = {}
    tags.value = []
    clearTimeout(debounceTimer)
  }

  /**
   * Clear search only
   */
  const clearSearch = () => {
    searchTerm.value = ''
    debouncedSearchTerm.value = ''
    clearTimeout(debounceTimer)
  }

  return {
    // State
    searchTerm,
    debouncedSearchTerm,
    selectedFilters,
    rangeFilters,
    tags,
    isLoading,
    filterState,
    hasActiveFilters,

    // Methods
    setSearchTerm,
    addFilter,
    removeFilter,
    toggleFilter,
    setFilters,
    setRangeFilter,
    removeRangeFilter,
    addTag,
    removeTag,
    clearFilters,
    clearSearch
  }
}