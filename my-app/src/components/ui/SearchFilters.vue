<!--
  SearchFilters.vue - Combined search + filters component
  Emits:
    - filter: When any filter changes
    - search: When search term changes
    - clear: When filters are cleared
    - apply: When filters are applied (if manual mode)
-->
<template>
  <div class="search-filters" :class="{ 'is-loading': isLoading }">
    <!-- Header with title and controls -->
    <div v-if="showHeader" class="filters-header">
      <div class="filters-title">
        <slot name="title">
          <h3>{{ title }}</h3>
        </slot>
      </div>
      
      <div class="filters-controls">
        <!-- Results count -->
        <div v-if="showResultsCount && resultsCount !== null" class="results-count">
          <slot name="results-count" :count="resultsCount" :total="totalResults">
            {{ resultsCount.toLocaleString() }} 
            {{ resultsCount === 1 ? 'result' : 'results' }}
            <span v-if="totalResults && totalResults !== resultsCount">
              of {{ totalResults.toLocaleString() }}
            </span>
          </slot>
        </div>
        
        <!-- Toggle filters button (mobile) -->
        <button
          v-if="collapsible"
          type="button"
          class="toggle-filters-button"
          :class="{ 'is-active': filtersExpanded }"
          :aria-expanded="filtersExpanded"
          @click="toggleFiltersExpanded"
        >
          <slot name="toggle-icon" :expanded="filtersExpanded">
            {{ filtersExpanded ? 'Hide Filters' : 'Show Filters' }}
          </slot>
        </button>
        
        <!-- Clear all button -->
        <button
          v-if="showClearAll && hasActiveFilters"
          type="button"
          class="clear-all-filters-button"
          @click="clearAllFilters"
        >
          <slot name="clear-all">
            Clear All
          </slot>
        </button>
      </div>
    </div>

    <!-- Filters container -->
    <div
      v-show="!collapsible || filtersExpanded"
      class="filters-container"
      :class="{ 'is-collapsed': collapsible && !filtersExpanded }"
    >
      <!-- Search bar -->
      <div v-if="searchable" class="filter-section search-section">
        <SearchBar
          v-model="searchTerm"
          :placeholder="searchPlaceholder"
          :debounce-delay="searchDebounceDelay"
          :disabled="disabled"
          :is-loading="isSearching"
          :suggestions="searchSuggestions"
          :show-suggestions="showSearchSuggestions"
          @search="handleSearch"
          @clear="handleSearchClear"
          @suggestion-select="handleSearchSuggestion"
        >
          <template #search-icon>
            <slot name="search-icon">🔍</slot>
          </template>
        </SearchBar>
      </div>

      <!-- Filter sections -->
      <div class="filter-sections">
        <!-- Dropdown filters -->
        <div
          v-for="filter in dropdownFilters"
          :key="filter.key"
          class="filter-section dropdown-section"
        >
          <label v-if="filter.label" class="filter-label">
            {{ filter.label }}
          </label>
          
          <FilterDropdown
            v-model="filterValues[filter.key]"
            :options="filter.options"
            :multiple="filter.multiple"
            :placeholder="filter.placeholder"
            :disabled="disabled || filter.disabled"
            :searchable="filter.searchable"
            :loading="filter.loading"
            @change="handleFilterChange(filter.key, $event)"
          />
        </div>

        <!-- Checkbox filters -->
        <div
          v-for="filter in checkboxFilters"
          :key="filter.key"
          class="filter-section checkbox-section"
        >
          <FilterCheckboxes
            v-model="filterValues[filter.key]"
            :options="filter.options"
            :label="filter.label"
            :disabled="disabled || filter.disabled"
            :searchable="filter.searchable"
            :show-controls="filter.showControls"
            :show-summary="filter.showSummary"
            @change="handleFilterChange(filter.key, $event)"
          />
        </div>

        <!-- Range filters -->
        <div
          v-for="filter in rangeFilters"
          :key="filter.key"
          class="filter-section range-section"
        >
          <RangeSlider
            v-model="filterValues[filter.key]"
            :label="filter.label"
            :min="filter.min"
            :max="filter.max"
            :step="filter.step"
            :disabled="disabled || filter.disabled"
            :formatter="filter.formatter"
            :unit="filter.unit"
            @change="handleFilterChange(filter.key, $event)"
          />
        </div>

        <!-- Tag filters -->
        <div
          v-for="filter in tagFilters"
          :key="filter.key"
          class="filter-section tag-section"
        >
          <TagFilter
            v-model="filterValues[filter.key]"
            :label="filter.label"
            :suggestions="filter.suggestions"
            :popular-tags="filter.popularTags"
            :disabled="disabled || filter.disabled"
            :allow-create="filter.allowCreate"
            :max-tags="filter.maxTags"
            @change="handleFilterChange(filter.key, $event)"
            @create="handleTagCreate(filter.key, $event)"
          />
        </div>

        <!-- Custom filter sections -->
        <div
          v-for="filter in customFilters"
          :key="filter.key"
          class="filter-section custom-section"
        >
          <div class="custom-filter-content">
            <slot
              :name="`filter-${filter.key}`"
              :filter="filter"
              :value="filterValues[filter.key]"
              :onChange="(value) => handleFilterChange(filter.key, value)"
            >
              <!-- Fallback content -->
              <div class="custom-filter-placeholder">
                Custom filter: {{ filter.key }}
              </div>
            </slot>
          </div>
        </div>
      </div>

      <!-- Active filters display -->
      <div v-if="showActiveFilters && activeFilters.length > 0" class="active-filters">
        <div class="active-filters-label">
          <slot name="active-filters-label">
            Active Filters:
          </slot>
        </div>
        
        <div class="active-filters-list">
          <div
            v-for="activeFilter in activeFilters"
            :key="`${activeFilter.key}-${activeFilter.valueKey}`"
            class="active-filter-item"
          >
            <slot
              name="active-filter"
              :filter="activeFilter"
              :remove="() => removeActiveFilter(activeFilter)"
            >
              <span class="active-filter-label">{{ activeFilter.label }}</span>
              <span class="active-filter-value">{{ activeFilter.displayValue }}</span>
              <button
                type="button"
                class="remove-active-filter"
                :aria-label="`Remove ${activeFilter.label} filter`"
                @click="removeActiveFilter(activeFilter)"
              >
                ×
              </button>
            </slot>
          </div>
        </div>
      </div>

      <!-- Apply/Reset buttons (manual mode) -->
      <div v-if="manualMode" class="filters-actions">
        <button
          type="button"
          class="apply-filters-button"
          :disabled="!hasChanges || isLoading"
          @click="applyFilters"
        >
          <slot name="apply-button" :hasChanges="hasChanges">
            Apply Filters
          </slot>
        </button>
        
        <button
          type="button"
          class="reset-filters-button"
          :disabled="!hasActiveFilters"
          @click="resetFilters"
        >
          <slot name="reset-button" :hasActiveFilters="hasActiveFilters">
            Reset
          </slot>
        </button>
      </div>
    </div>

    <!-- Loading overlay -->
    <div v-if="isLoading" class="filters-loading-overlay">
      <slot name="loading">
        <div class="loading-spinner" aria-label="Loading results...">
          Loading...
        </div>
      </slot>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, reactive } from 'vue'
import { useFilters } from '@/composables/useFilters'
import SearchBar from './SearchBar.vue'
import FilterDropdown from './FilterDropdown.vue'
import FilterCheckboxes from './FilterCheckboxes.vue'
import RangeSlider from './RangeSlider.vue'
import TagFilter from './TagFilter.vue'

/**
 * SearchFilters component combining search and filtering functionality
 * @component
 */
export default {
  name: 'SearchFilters',
  components: {
    SearchBar,
    FilterDropdown,
    FilterCheckboxes,
    RangeSlider,
    TagFilter
  },
  props: {
    /**
     * Filter configuration array
     */
    filters: {
      type: Array,
      required: true
    },
    /**
     * Initial filter values
     */
    modelValue: {
      type: Object,
      default: () => ({})
    },
    /**
     * Component title
     */
    title: {
      type: String,
      default: 'Filters'
    },
    /**
     * Enable search functionality
     */
    searchable: {
      type: Boolean,
      default: true
    },
    /**
     * Search input placeholder
     */
    searchPlaceholder: {
      type: String,
      default: 'Search...'
    },
    /**
     * Search debounce delay
     */
    searchDebounceDelay: {
      type: Number,
      default: 300
    },
    /**
     * Search suggestions
     */
    searchSuggestions: {
      type: Array,
      default: () => []
    },
    /**
     * Show search suggestions
     */
    showSearchSuggestions: {
      type: Boolean,
      default: false
    },
    /**
     * Whether filters are disabled
     */
    disabled: {
      type: Boolean,
      default: false
    },
    /**
     * Loading state
     */
    isLoading: {
      type: Boolean,
      default: false
    },
    /**
     * Search loading state
     */
    isSearching: {
      type: Boolean,
      default: false
    },
    /**
     * Results count
     */
    resultsCount: {
      type: Number,
      default: null
    },
    /**
     * Total results (before filtering)
     */
    totalResults: {
      type: Number,
      default: null
    },
    /**
     * Show header section
     */
    showHeader: {
      type: Boolean,
      default: true
    },
    /**
     * Show results count
     */
    showResultsCount: {
      type: Boolean,
      default: true
    },
    /**
     * Show clear all button
     */
    showClearAll: {
      type: Boolean,
      default: true
    },
    /**
     * Show active filters
     */
    showActiveFilters: {
      type: Boolean,
      default: true
    },
    /**
     * Collapsible on mobile
     */
    collapsible: {
      type: Boolean,
      default: false
    },
    /**
     * Manual mode (requires apply button)
     */
    manualMode: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    /**
     * Emitted when filters change
     * @param {Object} filters - Current filter values
     */
    'filter',
    /**
     * Emitted when search term changes
     * @param {string} searchTerm - Current search term
     */
    'search',
    /**
     * Emitted when filters are cleared
     */
    'clear',
    /**
     * Emitted when filters are applied (manual mode)
     * @param {Object} filters - Applied filter values
     */
    'apply',
    /**
     * Emitted when new tag is created
     * @param {string} filterKey - Filter key
     * @param {string} tagValue - New tag value
     */
    'tag-create',
    /**
     * Emitted when search suggestion is selected
     * @param {*} suggestion - Selected suggestion
     */
    'search-suggestion',
    /**
     * Update model value
     * @param {Object} value - New filter values
     */
    'update:modelValue'
  ],
  setup(props, { emit }) {
    const filtersExpanded = ref(!props.collapsible)
    const filterValues = reactive({ ...props.modelValue })
    const searchTerm = ref(props.modelValue.search || '')
    const pendingChanges = ref(false)

    // Initialize useFilters composable
    const {
      hasActiveFilters: filtersHasActive,
      clearFilters: filtersClear
    } = useFilters({
      onFilterChange: (state) => {
        if (!props.manualMode) {
          emit('filter', state)
        } else {
          pendingChanges.value = true
        }
      }
    })

    // Watch for external model value changes
    watch(() => props.modelValue, (newValue) => {
      Object.assign(filterValues, newValue)
      searchTerm.value = newValue.search || ''
    }, { deep: true })

    /**
     * Filter configurations by type
     */
    const dropdownFilters = computed(() => 
      props.filters.filter(f => f.type === 'dropdown')
    )

    const checkboxFilters = computed(() => 
      props.filters.filter(f => f.type === 'checkbox')
    )

    const rangeFilters = computed(() => 
      props.filters.filter(f => f.type === 'range')
    )

    const tagFilters = computed(() => 
      props.filters.filter(f => f.type === 'tag')
    )

    const customFilters = computed(() => 
      props.filters.filter(f => f.type === 'custom')
    )

    /**
     * Whether there are active filters
     */
    const hasActiveFilters = computed(() => {
      return searchTerm.value.trim() !== '' || 
             Object.values(filterValues).some(value => {
               if (Array.isArray(value)) return value.length > 0
               if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0
               return value !== null && value !== undefined && value !== ''
             })
    })

    /**
     * Whether there are pending changes (manual mode)
     */
    const hasChanges = computed(() => pendingChanges.value)

    /**
     * Active filters for display
     */
    const activeFilters = computed(() => {
      const active = []
      
      // Add search term
      if (searchTerm.value.trim()) {
        active.push({
          key: 'search',
          label: 'Search',
          value: searchTerm.value,
          displayValue: `"${searchTerm.value}"`,
          valueKey: 'term'
        })
      }

      // Add other filters
      props.filters.forEach(filter => {
        const value = filterValues[filter.key]
        if (!value) return

        if (Array.isArray(value) && value.length > 0) {
          if (filter.type === 'tag' || filter.type === 'checkbox') {
            value.forEach(item => {
              active.push({
                key: filter.key,
                label: filter.label || filter.key,
                value: item,
                displayValue: String(item),
                valueKey: item,
                filterType: filter.type
              })
            })
          }
        } else if (filter.type === 'range' && Array.isArray(value)) {
          active.push({
            key: filter.key,
            label: filter.label || filter.key,
            value: value,
            displayValue: `${value[0]} - ${value[1]}`,
            valueKey: 'range',
            filterType: filter.type
          })
        } else if (value !== null && value !== undefined && value !== '') {
          active.push({
            key: filter.key,
            label: filter.label || filter.key,
            value: value,
            displayValue: String(value),
            valueKey: 'single',
            filterType: filter.type
          })
        }
      })

      return active
    })

    /**
     * Handle search term changes
     */
    const handleSearch = (term) => {
      filterValues.search = term
      emit('search', term)
      
      if (!props.manualMode) {
        emitFilterChange()
      }
    }

    /**
     * Handle search clear
     */
    const handleSearchClear = () => {
      searchTerm.value = ''
      delete filterValues.search
      emit('search', '')
      
      if (!props.manualMode) {
        emitFilterChange()
      }
    }

    /**
     * Handle search suggestion selection
     */
    const handleSearchSuggestion = (suggestion) => {
      emit('search-suggestion', suggestion)
    }

    /**
     * Handle individual filter changes
     */
    const handleFilterChange = (key, value) => {
      if (Array.isArray(value) && value.length === 0) {
        delete filterValues[key]
      } else {
        filterValues[key] = value
      }

      if (!props.manualMode) {
        emitFilterChange()
      } else {
        pendingChanges.value = true
      }
    }

    /**
     * Handle tag creation
     */
    const handleTagCreate = (filterKey, tagValue) => {
      emit('tag-create', filterKey, tagValue)
    }

    /**
     * Remove active filter
     */
    const removeActiveFilter = (activeFilter) => {
      if (activeFilter.key === 'search') {
        handleSearchClear()
      } else if (activeFilter.filterType === 'range') {
        delete filterValues[activeFilter.key]
      } else if (Array.isArray(filterValues[activeFilter.key])) {
        const newValue = filterValues[activeFilter.key].filter(v => v !== activeFilter.value)
        if (newValue.length === 0) {
          delete filterValues[activeFilter.key]
        } else {
          filterValues[activeFilter.key] = newValue
        }
      } else {
        delete filterValues[activeFilter.key]
      }

      if (!props.manualMode) {
        emitFilterChange()
      }
    }

    /**
     * Clear all filters
     */
    const clearAllFilters = () => {
      searchTerm.value = ''
      Object.keys(filterValues).forEach(key => {
        delete filterValues[key]
      })
      
      pendingChanges.value = false
      emit('clear')
      
      if (!props.manualMode) {
        emitFilterChange()
      }
    }

    /**
     * Apply filters (manual mode)
     */
    const applyFilters = () => {
      pendingChanges.value = false
      const currentFilters = { ...filterValues }
      if (searchTerm.value.trim()) {
        currentFilters.search = searchTerm.value
      }
      emit('apply', currentFilters)
      emitFilterChange()
    }

    /**
     * Reset filters (manual mode)
     */
    const resetFilters = () => {
      clearAllFilters()
      if (props.manualMode) {
        applyFilters()
      }
    }

    /**
     * Toggle filters expanded state
     */
    const toggleFiltersExpanded = () => {
      filtersExpanded.value = !filtersExpanded.value
    }

    /**
     * Emit filter change event
     */
    const emitFilterChange = () => {
      const currentFilters = { ...filterValues }
      if (searchTerm.value.trim()) {
        currentFilters.search = searchTerm.value
      }
      emit('update:modelValue', currentFilters)
      emit('filter', currentFilters)
    }

    return {
      filtersExpanded,
      filterValues,
      searchTerm,
      dropdownFilters,
      checkboxFilters,
      rangeFilters,
      tagFilters,
      customFilters,
      hasActiveFilters,
      hasChanges,
      activeFilters,
      handleSearch,
      handleSearchClear,
      handleSearchSuggestion,
      handleFilterChange,
      handleTagCreate,
      removeActiveFilter,
      clearAllFilters,
      applyFilters,
      resetFilters,
      toggleFiltersExpanded
    }
  }
}
</script>