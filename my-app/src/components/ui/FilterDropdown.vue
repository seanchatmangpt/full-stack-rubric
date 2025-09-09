<!--
  FilterDropdown.vue - Single/multi-select filtering dropdown
  Emits:
    - change: When selection changes
    - select: When option is selected
    - deselect: When option is deselected
-->
<template>
  <div class="filter-dropdown" ref="dropdownRef">
    <!-- Dropdown trigger -->
    <button
      type="button"
      class="dropdown-trigger"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      :aria-labelledby="triggerId"
      :disabled="disabled"
      @click="toggleDropdown"
      @keydown.enter="toggleDropdown"
      @keydown.space.prevent="toggleDropdown"
      @keydown.escape="closeDropdown"
      @keydown.arrow-down.prevent="openDropdown"
    >
      <span :id="triggerId" class="dropdown-label">
        <slot name="trigger" :selected="selectedOptions" :isOpen="isOpen">
          {{ triggerText }}
        </slot>
      </span>
      
      <span class="dropdown-arrow" aria-hidden="true">
        <slot name="arrow" :isOpen="isOpen">
          {{ isOpen ? '▲' : '▼' }}
        </slot>
      </span>
    </button>

    <!-- Dropdown menu -->
    <div
      v-if="isOpen"
      class="dropdown-menu"
      role="listbox"
      :aria-multiselectable="multiple"
      :aria-labelledby="triggerId"
      @keydown.escape="closeDropdown"
      @keydown.arrow-up.prevent="navigateOptions(-1)"
      @keydown.arrow-down.prevent="navigateOptions(1)"
      @keydown.home.prevent="navigateToFirst"
      @keydown.end.prevent="navigateToLast"
    >
      <!-- Search input (if searchable) -->
      <div v-if="searchable" class="dropdown-search">
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          class="search-input"
          :placeholder="searchPlaceholder"
          @keydown.escape="closeDropdown"
          @click.stop
        />
      </div>

      <!-- Options list -->
      <div class="options-container">
        <div
          v-for="(option, index) in filteredOptions"
          :key="getOptionKey(option, index)"
          class="dropdown-option"
          role="option"
          :aria-selected="isSelected(option)"
          :data-value="getOptionValue(option)"
          :tabindex="focusedOptionIndex === index ? 0 : -1"
          @click="selectOption(option)"
          @keydown.enter="selectOption(option)"
          @keydown.space.prevent="selectOption(option)"
        >
          <!-- Checkbox for multi-select -->
          <div
            v-if="multiple"
            class="option-checkbox"
            :aria-checked="isSelected(option)"
            role="checkbox"
          >
            <slot name="checkbox" :checked="isSelected(option)" :option="option">
              {{ isSelected(option) ? '☑️' : '☐' }}
            </slot>
          </div>

          <!-- Option content -->
          <div class="option-content">
            <slot name="option" :option="option" :selected="isSelected(option)" :index="index">
              {{ getOptionLabel(option) }}
            </slot>
          </div>

          <!-- Selection indicator for single select -->
          <div
            v-if="!multiple && isSelected(option)"
            class="selection-indicator"
            aria-hidden="true"
          >
            <slot name="selected-indicator" :option="option">
              ✓
            </slot>
          </div>
        </div>

        <!-- No options message -->
        <div v-if="filteredOptions.length === 0" class="no-options">
          <slot name="no-options" :searchQuery="searchQuery">
            {{ noOptionsText }}
          </slot>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="loading-options">
          <slot name="loading">
            Loading options...
          </slot>
        </div>
      </div>

      <!-- Actions (clear, select all, etc.) -->
      <div v-if="showActions" class="dropdown-actions">
        <button
          v-if="multiple && hasSelection"
          type="button"
          class="action-button clear-all"
          @click="clearSelection"
        >
          <slot name="clear-action">
            Clear All
          </slot>
        </button>
        
        <button
          v-if="multiple && !allSelected"
          type="button"
          class="action-button select-all"
          @click="selectAll"
        >
          <slot name="select-all-action">
            Select All
          </slot>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

/**
 * FilterDropdown component for single/multi-select filtering
 * @component
 */
export default {
  name: 'FilterDropdown',
  props: {
    /**
     * Selected value(s) - array for multi-select, single value otherwise
     */
    modelValue: {
      type: [String, Number, Array, Object],
      default: null
    },
    /**
     * Array of options
     */
    options: {
      type: Array,
      required: true
    },
    /**
     * Enable multiple selection
     */
    multiple: {
      type: Boolean,
      default: false
    },
    /**
     * Whether the dropdown is disabled
     */
    disabled: {
      type: Boolean,
      default: false
    },
    /**
     * Placeholder text for the trigger
     */
    placeholder: {
      type: String,
      default: 'Select option'
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
     * Whether options are currently loading
     */
    isLoading: {
      type: Boolean,
      default: false
    },
    /**
     * Text to show when no options are available
     */
    noOptionsText: {
      type: String,
      default: 'No options available'
    },
    /**
     * Show action buttons (clear all, select all)
     */
    showActions: {
      type: Boolean,
      default: true
    },
    /**
     * Close dropdown on option select (single select only)
     */
    closeOnSelect: {
      type: Boolean,
      default: true
    },
    /**
     * Maximum height for the dropdown menu
     */
    maxHeight: {
      type: String,
      default: '200px'
    }
  },
  emits: [
    /**
     * Emitted when selection changes
     * @param {*} value - The new selected value(s)
     */
    'change',
    /**
     * Emitted when option is selected
     * @param {*} option - The selected option
     */
    'select',
    /**
     * Emitted when option is deselected
     * @param {*} option - The deselected option
     */
    'deselect',
    /**
     * Emitted when dropdown opens
     */
    'open',
    /**
     * Emitted when dropdown closes
     */
    'close',
    /**
     * Update model value
     * @param {*} value - The new value
     */
    'update:modelValue'
  ],
  setup(props, { emit }) {
    const dropdownRef = ref(null)
    const searchInput = ref(null)
    const isOpen = ref(false)
    const searchQuery = ref('')
    const focusedOptionIndex = ref(-1)
    const triggerId = ref(`dropdown-trigger-${Math.random().toString(36).substr(2, 9)}`)

    /**
     * Current selected options as array
     */
    const selectedOptions = computed(() => {
      if (props.modelValue === null || props.modelValue === undefined) {
        return []
      }
      return Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue]
    })

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
        return label.includes(query)
      })
    })

    /**
     * Text to display on trigger button
     */
    const triggerText = computed(() => {
      if (selectedOptions.value.length === 0) {
        return props.placeholder
      }

      if (props.multiple) {
        if (selectedOptions.value.length === 1) {
          return getOptionLabel(selectedOptions.value[0])
        }
        return `${selectedOptions.value.length} selected`
      }

      return getOptionLabel(selectedOptions.value[0])
    })

    /**
     * Whether there's any selection
     */
    const hasSelection = computed(() => selectedOptions.value.length > 0)

    /**
     * Whether all options are selected (multi-select only)
     */
    const allSelected = computed(() => {
      if (!props.multiple) return false
      return filteredOptions.value.length > 0 && 
             filteredOptions.value.every(option => isSelected(option))
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
     * Get option key for v-for
     */
    const getOptionKey = (option, index) => {
      const value = getOptionValue(option)
      return value !== null && value !== undefined ? String(value) : index
    }

    /**
     * Check if option is selected
     */
    const isSelected = (option) => {
      const optionValue = getOptionValue(option)
      return selectedOptions.value.some(selected => {
        const selectedValue = getOptionValue(selected)
        return selectedValue === optionValue
      })
    }

    /**
     * Toggle dropdown open/close
     */
    const toggleDropdown = () => {
      if (isOpen.value) {
        closeDropdown()
      } else {
        openDropdown()
      }
    }

    /**
     * Open dropdown
     */
    const openDropdown = () => {
      if (props.disabled) return
      
      isOpen.value = true
      focusedOptionIndex.value = -1
      emit('open')
      
      if (props.searchable) {
        nextTick(() => {
          if (searchInput.value) {
            searchInput.value.focus()
          }
        })
      }
    }

    /**
     * Close dropdown
     */
    const closeDropdown = () => {
      isOpen.value = false
      searchQuery.value = ''
      focusedOptionIndex.value = -1
      emit('close')
    }

    /**
     * Select an option
     */
    const selectOption = (option) => {
      if (props.multiple) {
        if (isSelected(option)) {
          // Deselect
          const newValue = selectedOptions.value.filter(selected => {
            return getOptionValue(selected) !== getOptionValue(option)
          })
          emit('update:modelValue', newValue)
          emit('deselect', option)
        } else {
          // Select
          const newValue = [...selectedOptions.value, option]
          emit('update:modelValue', newValue)
          emit('select', option)
        }
      } else {
        // Single select
        if (!isSelected(option)) {
          emit('update:modelValue', option)
          emit('select', option)
        }
        
        if (props.closeOnSelect) {
          closeDropdown()
        }
      }
      
      emit('change', props.multiple ? selectedOptions.value : option)
    }

    /**
     * Clear all selections
     */
    const clearSelection = () => {
      const newValue = props.multiple ? [] : null
      emit('update:modelValue', newValue)
      emit('change', newValue)
    }

    /**
     * Select all options (multi-select only)
     */
    const selectAll = () => {
      if (!props.multiple) return
      
      const newValue = [...filteredOptions.value]
      emit('update:modelValue', newValue)
      emit('change', newValue)
    }

    /**
     * Navigate through options with keyboard
     */
    const navigateOptions = (direction) => {
      if (filteredOptions.value.length === 0) return
      
      const maxIndex = filteredOptions.value.length - 1
      const newIndex = focusedOptionIndex.value + direction
      
      if (newIndex < 0) {
        focusedOptionIndex.value = maxIndex
      } else if (newIndex > maxIndex) {
        focusedOptionIndex.value = 0
      } else {
        focusedOptionIndex.value = newIndex
      }
    }

    /**
     * Navigate to first option
     */
    const navigateToFirst = () => {
      focusedOptionIndex.value = 0
    }

    /**
     * Navigate to last option
     */
    const navigateToLast = () => {
      focusedOptionIndex.value = filteredOptions.value.length - 1
    }

    /**
     * Handle clicks outside dropdown
     */
    const handleClickOutside = (event) => {
      if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
        closeDropdown()
      }
    }

    // Setup click outside listener
    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    return {
      dropdownRef,
      searchInput,
      isOpen,
      searchQuery,
      focusedOptionIndex,
      triggerId,
      selectedOptions,
      filteredOptions,
      triggerText,
      hasSelection,
      allSelected,
      getOptionLabel,
      getOptionValue,
      getOptionKey,
      isSelected,
      toggleDropdown,
      openDropdown,
      closeDropdown,
      selectOption,
      clearSelection,
      selectAll,
      navigateOptions,
      navigateToFirst,
      navigateToLast
    }
  }
}
</script>