<!--
  SearchBar.vue - Text search with debouncing
  Emits: 
    - search: Debounced search term
    - clear: When search is cleared
    - input: Raw input events
-->
<template>
  <div class="search-bar">
    <div class="search-input-container">
      <input
        ref="searchInput"
        v-model="localSearchTerm"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-label="ariaLabel"
        :aria-describedby="ariaDescribedBy"
        class="search-input"
        @input="handleInput"
        @keydown.enter="handleEnter"
        @keydown.escape="handleEscape"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      
      <!-- Search icon -->
      <div class="search-icon" aria-hidden="true">
        <slot name="search-icon">
          🔍
        </slot>
      </div>

      <!-- Clear button -->
      <button
        v-if="showClearButton && localSearchTerm.trim()"
        type="button"
        class="clear-button"
        :aria-label="clearAriaLabel"
        @click="handleClear"
      >
        <slot name="clear-icon">
          ✕
        </slot>
      </button>

      <!-- Loading indicator -->
      <div
        v-if="isLoading"
        class="loading-indicator"
        aria-hidden="true"
      >
        <slot name="loading-icon">
          ⏳
        </slot>
      </div>
    </div>

    <!-- Search suggestions -->
    <div
      v-if="showSuggestions && suggestions.length > 0"
      class="suggestions-container"
      role="listbox"
      :aria-label="suggestionsAriaLabel"
    >
      <div
        v-for="(suggestion, index) in suggestions"
        :key="suggestion.id || index"
        class="suggestion-item"
        role="option"
        :aria-selected="index === selectedSuggestionIndex"
        :tabindex="index === selectedSuggestionIndex ? 0 : -1"
        @click="handleSuggestionClick(suggestion)"
        @keydown.enter="handleSuggestionClick(suggestion)"
        @keydown.space.prevent="handleSuggestionClick(suggestion)"
      >
        <slot name="suggestion" :suggestion="suggestion" :index="index">
          {{ suggestion.text || suggestion }}
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted } from 'vue'

/**
 * SearchBar component with debouncing and suggestions
 * @component
 */
export default {
  name: 'SearchBar',
  props: {
    /**
     * Initial search term
     */
    modelValue: {
      type: String,
      default: ''
    },
    /**
     * Placeholder text for the input
     */
    placeholder: {
      type: String,
      default: 'Search...'
    },
    /**
     * Debounce delay in milliseconds
     */
    debounceDelay: {
      type: Number,
      default: 300
    },
    /**
     * Whether the search bar is disabled
     */
    disabled: {
      type: Boolean,
      default: false
    },
    /**
     * Whether to show the clear button
     */
    showClearButton: {
      type: Boolean,
      default: true
    },
    /**
     * Whether search is currently loading
     */
    isLoading: {
      type: Boolean,
      default: false
    },
    /**
     * Array of search suggestions
     */
    suggestions: {
      type: Array,
      default: () => []
    },
    /**
     * Whether to show suggestions dropdown
     */
    showSuggestions: {
      type: Boolean,
      default: false
    },
    /**
     * Auto-focus the input on mount
     */
    autofocus: {
      type: Boolean,
      default: false
    },
    /**
     * Minimum characters before searching
     */
    minLength: {
      type: Number,
      default: 0
    },
    /**
     * ARIA label for the search input
     */
    ariaLabel: {
      type: String,
      default: 'Search'
    },
    /**
     * ARIA described by attribute
     */
    ariaDescribedBy: {
      type: String,
      default: null
    },
    /**
     * ARIA label for clear button
     */
    clearAriaLabel: {
      type: String,
      default: 'Clear search'
    },
    /**
     * ARIA label for suggestions
     */
    suggestionsAriaLabel: {
      type: String,
      default: 'Search suggestions'
    }
  },
  emits: [
    /**
     * Emitted with debounced search term
     * @param {string} searchTerm - The debounced search term
     */
    'search',
    /**
     * Emitted when search is cleared
     */
    'clear',
    /**
     * Emitted on raw input events
     * @param {string} value - The current input value
     */
    'input',
    /**
     * Emitted when Enter is pressed
     * @param {string} searchTerm - The current search term
     */
    'enter',
    /**
     * Emitted when input gains focus
     * @param {Event} event - The focus event
     */
    'focus',
    /**
     * Emitted when input loses focus
     * @param {Event} event - The blur event
     */
    'blur',
    /**
     * Emitted when a suggestion is selected
     * @param {Object|string} suggestion - The selected suggestion
     */
    'suggestion-select',
    /**
     * Update model value
     * @param {string} value - The new value
     */
    'update:modelValue'
  ],
  setup(props, { emit }) {
    const searchInput = ref(null)
    const localSearchTerm = ref(props.modelValue)
    const selectedSuggestionIndex = ref(-1)
    let debounceTimer = null

    // Watch for external model value changes
    watch(() => props.modelValue, (newValue) => {
      localSearchTerm.value = newValue
    })

    // Debounced search term
    const debouncedSearchTerm = ref(props.modelValue)

    // Watch local search term and debounce
    watch(localSearchTerm, (newTerm) => {
      emit('update:modelValue', newTerm)
      emit('input', newTerm)
      
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        if (newTerm.length >= props.minLength) {
          debouncedSearchTerm.value = newTerm
          emit('search', newTerm)
        } else if (newTerm.length === 0) {
          debouncedSearchTerm.value = ''
          emit('search', '')
        }
      }, props.debounceDelay)
    })

    /**
     * Handle input events
     */
    const handleInput = () => {
      selectedSuggestionIndex.value = -1
    }

    /**
     * Handle Enter key press
     */
    const handleEnter = () => {
      if (selectedSuggestionIndex.value >= 0 && props.suggestions[selectedSuggestionIndex.value]) {
        handleSuggestionClick(props.suggestions[selectedSuggestionIndex.value])
      } else {
        emit('enter', localSearchTerm.value)
      }
    }

    /**
     * Handle Escape key press
     */
    const handleEscape = () => {
      if (props.showSuggestions && props.suggestions.length > 0) {
        selectedSuggestionIndex.value = -1
      } else {
        handleClear()
      }
    }

    /**
     * Handle clear button click
     */
    const handleClear = () => {
      localSearchTerm.value = ''
      selectedSuggestionIndex.value = -1
      clearTimeout(debounceTimer)
      debouncedSearchTerm.value = ''
      emit('clear')
      emit('search', '')
      emit('update:modelValue', '')
      
      // Focus back to input
      if (searchInput.value) {
        searchInput.value.focus()
      }
    }

    /**
     * Handle input focus
     */
    const handleFocus = (event) => {
      emit('focus', event)
    }

    /**
     * Handle input blur
     */
    const handleBlur = (event) => {
      // Delay blur to allow suggestion clicks
      setTimeout(() => {
        emit('blur', event)
      }, 150)
    }

    /**
     * Handle suggestion click
     */
    const handleSuggestionClick = (suggestion) => {
      const suggestionText = suggestion.text || suggestion
      localSearchTerm.value = suggestionText
      selectedSuggestionIndex.value = -1
      emit('suggestion-select', suggestion)
      
      // Focus back to input
      if (searchInput.value) {
        searchInput.value.focus()
      }
    }

    /**
     * Focus the search input
     */
    const focus = () => {
      if (searchInput.value) {
        searchInput.value.focus()
      }
    }

    /**
     * Clear the search
     */
    const clear = () => {
      handleClear()
    }

    // Auto-focus on mount if specified
    onMounted(() => {
      if (props.autofocus && searchInput.value) {
        nextTick(() => {
          searchInput.value.focus()
        })
      }
    })

    return {
      searchInput,
      localSearchTerm,
      selectedSuggestionIndex,
      handleInput,
      handleEnter,
      handleEscape,
      handleClear,
      handleFocus,
      handleBlur,
      handleSuggestionClick,
      focus,
      clear
    }
  }
}
</script>