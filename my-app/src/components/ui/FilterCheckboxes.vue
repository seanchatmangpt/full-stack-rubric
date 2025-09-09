<!--
  FilterCheckboxes.vue - Multiple option selection with checkboxes
  Emits:
    - change: When selection changes
    - check: When option is checked
    - uncheck: When option is unchecked
-->
<template>
  <div class="filter-checkboxes" role="group" :aria-labelledby="groupLabelId">
    <!-- Group label -->
    <div v-if="label" :id="groupLabelId" class="checkbox-group-label">
      {{ label }}
    </div>

    <!-- Search input (if searchable) -->
    <div v-if="searchable" class="checkbox-search">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        :placeholder="searchPlaceholder"
        :aria-label="`Search ${label || 'options'}`"
      />
    </div>

    <!-- Select all/none controls -->
    <div v-if="showControls" class="checkbox-controls">
      <button
        type="button"
        class="control-button select-all"
        :disabled="allSelected"
        @click="selectAll"
      >
        Select All
      </button>
      
      <button
        type="button"
        class="control-button select-none"
        :disabled="!hasSelection"
        @click="selectNone"
      >
        Select None
      </button>
      
      <button
        type="button"
        class="control-button invert-selection"
        :disabled="options.length === 0"
        @click="invertSelection"
      >
        Invert
      </button>
    </div>

    <!-- Checkbox options -->
    <div class="checkbox-options" :style="{ maxHeight: maxHeight }">
      <label
        v-for="(option, index) in filteredOptions"
        :key="getOptionKey(option, index)"
        class="checkbox-option"
        :class="{
          'is-checked': isSelected(option),
          'is-disabled': isDisabled(option)
        }"
      >
        <input
          type="checkbox"
          class="checkbox-input"
          :value="getOptionValue(option)"
          :checked="isSelected(option)"
          :disabled="isDisabled(option)"
          :aria-describedby="getOptionDescriptionId(option, index)"
          @change="toggleOption(option, $event.target.checked)"
        />
        
        <!-- Custom checkbox appearance -->
        <span class="checkbox-visual" aria-hidden="true">
          <slot name="checkbox" :checked="isSelected(option)" :disabled="isDisabled(option)">
            <span v-if="isSelected(option)" class="checkbox-check">✓</span>
          </slot>
        </span>
        
        <!-- Option content -->
        <span class="option-content">
          <span class="option-label">
            <slot name="option" :option="option" :selected="isSelected(option)" :index="index">
              {{ getOptionLabel(option) }}
            </slot>
          </span>
          
          <span
            v-if="getOptionDescription(option)"
            :id="getOptionDescriptionId(option, index)"
            class="option-description"
          >
            {{ getOptionDescription(option) }}
          </span>
        </span>
        
        <!-- Option count/badge -->
        <span
          v-if="getOptionCount(option)"
          class="option-count"
          :title="`${getOptionCount(option)} items`"
        >
          {{ getOptionCount(option) }}
        </span>
      </label>
      
      <!-- No options message -->
      <div v-if="filteredOptions.length === 0" class="no-options">
        <slot name="no-options" :searchQuery="searchQuery" :allOptions="options">
          {{ searchQuery ? 'No matching options found' : 'No options available' }}
        </slot>
      </div>
    </div>

    <!-- Selection summary -->
    <div v-if="showSummary && hasSelection" class="selection-summary">
      <slot name="summary" :selectedCount="selectedOptions.length" :totalCount="filteredOptions.length">
        {{ selectedOptions.length }} of {{ filteredOptions.length }} selected
      </slot>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

/**
 * FilterCheckboxes component for multiple option selection
 * @component
 */
export default {
  name: 'FilterCheckboxes',
  props: {
    /**
     * Array of selected values
     */
    modelValue: {
      type: Array,
      default: () => []
    },
    /**
     * Array of checkbox options
     */
    options: {
      type: Array,
      required: true
    },
    /**
     * Group label
     */
    label: {
      type: String,
      default: null
    },
    /**
     * Property name for option labels (if options are objects)
     */
    labelKey: {
      type: String,
      default: 'label'
    },
    /**
     * Property name for option values (if options are objects)
     */
    valueKey: {
      type: String,
      default: 'value'
    },
    /**
     * Property name for option descriptions (if options are objects)
     */
    descriptionKey: {
      type: String,
      default: 'description'
    },
    /**
     * Property name for option counts (if options are objects)
     */
    countKey: {
      type: String,
      default: 'count'
    },
    /**
     * Property name for option disabled state (if options are objects)
     */
    disabledKey: {
      type: String,
      default: 'disabled'
    },
    /**
     * Enable search/filter within options
     */
    searchable: {
      type: Boolean,
      default: false
    },
    /**
     * Search input placeholder
     */
    searchPlaceholder: {
      type: String,
      default: 'Search options...'
    },
    /**
     * Show control buttons (select all, none, invert)
     */
    showControls: {
      type: Boolean,
      default: true
    },
    /**
     * Show selection summary
     */
    showSummary: {
      type: Boolean,
      default: false
    },
    /**
     * Maximum height for options container
     */
    maxHeight: {
      type: String,
      default: '300px'
    },
    /**
     * Whether all options are disabled
     */
    disabled: {
      type: Boolean,
      default: false
    },
    /**
     * Array of values that should be disabled
     */
    disabledValues: {
      type: Array,
      default: () => []
    }
  },
  emits: [
    /**
     * Emitted when selection changes
     * @param {Array} value - Array of selected values
     */
    'change',
    /**
     * Emitted when option is checked
     * @param {*} option - The checked option
     * @param {*} value - The option value
     */
    'check',
    /**
     * Emitted when option is unchecked
     * @param {*} option - The unchecked option
     * @param {*} value - The option value
     */
    'uncheck',
    /**
     * Update model value
     * @param {Array} value - The new array of selected values
     */
    'update:modelValue'
  ],
  setup(props, { emit }) {
    const searchQuery = ref('')
    const groupLabelId = ref(`checkbox-group-${Math.random().toString(36).substr(2, 9)}`)

    /**
     * Current selected options
     */
    const selectedOptions = computed(() => props.modelValue || [])

    /**
     * Filtered options based on search query
     */
    const filteredOptions = computed(() => {
      if (!props.searchable || !searchQuery.value.trim()) {
        return props.options
      }

      const query = searchQuery.value.toLowerCase()
      return props.options.filter(option => {
        const label = getOptionLabel(option).toLowerCase()
        const description = getOptionDescription(option)?.toLowerCase() || ''
        return label.includes(query) || description.includes(query)
      })
    })

    /**
     * Whether there's any selection
     */
    const hasSelection = computed(() => selectedOptions.value.length > 0)

    /**
     * Whether all options are selected
     */
    const allSelected = computed(() => {
      if (filteredOptions.value.length === 0) return false
      return filteredOptions.value.every(option => 
        isSelected(option) || isDisabled(option)
      )
    })

    /**
     * Get option label
     */
    const getOptionLabel = (option) => {
      if (typeof option === 'object' && option !== null) {
        return option[props.labelKey] || option.text || option.name || String(option)
      }
      return String(option)
    }

    /**
     * Get option value
     */
    const getOptionValue = (option) => {
      if (typeof option === 'object' && option !== null) {
        return option[props.valueKey] !== undefined ? option[props.valueKey] : option
      }
      return option
    }

    /**
     * Get option description
     */
    const getOptionDescription = (option) => {
      if (typeof option === 'object' && option !== null) {
        return option[props.descriptionKey] || null
      }
      return null
    }

    /**
     * Get option count
     */
    const getOptionCount = (option) => {
      if (typeof option === 'object' && option !== null) {
        return option[props.countKey] || null
      }
      return null
    }

    /**
     * Get option key for v-for
     */
    const getOptionKey = (option, index) => {
      const value = getOptionValue(option)
      return value !== null && value !== undefined ? String(value) : index
    }

    /**
     * Get option description ID for accessibility
     */
    const getOptionDescriptionId = (option, index) => {
      return `option-desc-${groupLabelId.value}-${index}`
    }

    /**
     * Check if option is selected
     */
    const isSelected = (option) => {
      const optionValue = getOptionValue(option)
      return selectedOptions.value.some(selectedValue => selectedValue === optionValue)
    }

    /**
     * Check if option is disabled
     */
    const isDisabled = (option) => {
      if (props.disabled) return true
      
      const optionValue = getOptionValue(option)
      if (props.disabledValues.includes(optionValue)) return true
      
      if (typeof option === 'object' && option !== null) {
        return option[props.disabledKey] === true
      }
      
      return false
    }

    /**
     * Toggle option selection
     */
    const toggleOption = (option, checked) => {
      if (isDisabled(option)) return
      
      const optionValue = getOptionValue(option)
      let newValue
      
      if (checked) {
        // Add to selection
        newValue = [...selectedOptions.value, optionValue]
        emit('check', option, optionValue)
      } else {
        // Remove from selection
        newValue = selectedOptions.value.filter(value => value !== optionValue)
        emit('uncheck', option, optionValue)
      }
      
      emit('update:modelValue', newValue)
      emit('change', newValue)
    }

    /**
     * Select all options
     */
    const selectAll = () => {
      const allValues = filteredOptions.value
        .filter(option => !isDisabled(option))
        .map(option => getOptionValue(option))
      
      // Merge with existing selections from other groups
      const existingValues = selectedOptions.value.filter(value => 
        !filteredOptions.value.some(option => getOptionValue(option) === value)
      )
      
      const newValue = [...existingValues, ...allValues]
      emit('update:modelValue', newValue)
      emit('change', newValue)
    }

    /**
     * Select none
     */
    const selectNone = () => {
      const currentFilteredValues = filteredOptions.value.map(option => getOptionValue(option))
      const newValue = selectedOptions.value.filter(value => 
        !currentFilteredValues.includes(value)
      )
      
      emit('update:modelValue', newValue)
      emit('change', newValue)
    }

    /**
     * Invert selection
     */
    const invertSelection = () => {
      const currentFilteredValues = filteredOptions.value.map(option => getOptionValue(option))
      const currentlySelected = selectedOptions.value.filter(value => 
        currentFilteredValues.includes(value)
      )
      
      // Keep selections from other groups
      const otherSelections = selectedOptions.value.filter(value => 
        !currentFilteredValues.includes(value)
      )
      
      // Get inverted selection for current filtered options
      const invertedSelection = filteredOptions.value
        .filter(option => !isDisabled(option) && !currentlySelected.includes(getOptionValue(option)))
        .map(option => getOptionValue(option))
      
      const newValue = [...otherSelections, ...invertedSelection]
      emit('update:modelValue', newValue)
      emit('change', newValue)
    }

    return {
      searchQuery,
      groupLabelId,
      selectedOptions,
      filteredOptions,
      hasSelection,
      allSelected,
      getOptionLabel,
      getOptionValue,
      getOptionDescription,
      getOptionCount,
      getOptionKey,
      getOptionDescriptionId,
      isSelected,
      isDisabled,
      toggleOption,
      selectAll,
      selectNone,
      invertSelection
    }
  }
}
</script>