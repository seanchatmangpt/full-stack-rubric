<!--
  TagFilter.vue - Tag-based filtering with dynamic tag management
  Emits:
    - change: When selected tags change
    - add: When tag is added
    - remove: When tag is removed
    - create: When new tag is created
-->
<template>
  <div class="tag-filter">
    <!-- Label -->
    <div v-if="label" class="tag-filter-label">
      {{ label }}
    </div>

    <!-- Tag input/search -->
    <div class="tag-input-container" :class="{ 'is-focused': isInputFocused }">
      <div class="selected-tags">
        <div
          v-for="tag in selectedTagObjects"
          :key="getTagKey(tag)"
          class="selected-tag"
          :class="{ 'is-removable': !isTagDisabled(tag) }"
        >
          <span class="tag-content">
            <slot name="selected-tag" :tag="tag" :remove="() => removeTag(tag)">
              <span class="tag-label">{{ getTagLabel(tag) }}</span>
              <button
                v-if="!isTagDisabled(tag)"
                type="button"
                class="tag-remove-button"
                :aria-label="`Remove ${getTagLabel(tag)} tag`"
                @click="removeTag(tag)"
              >
                <slot name="remove-icon" :tag="tag">
                  ×
                </slot>
              </button>
            </slot>
          </span>
        </div>
      </div>

      <input
        ref="tagInput"
        v-model="inputValue"
        type="text"
        class="tag-input"
        :placeholder="effectivePlaceholder"
        :disabled="disabled"
        :maxlength="maxLength"
        @input="handleInput"
        @keydown="handleKeyDown"
        @focus="handleInputFocus"
        @blur="handleInputBlur"
        @paste="handlePaste"
      />

      <!-- Clear all button -->
      <button
        v-if="showClearAll && selectedTags.length > 0"
        type="button"
        class="clear-all-button"
        :aria-label="clearAllAriaLabel"
        @click="clearAllTags"
      >
        <slot name="clear-all-icon">
          ⌫
        </slot>
      </button>
    </div>

    <!-- Tag suggestions dropdown -->
    <div
      v-if="showSuggestions && (filteredSuggestions.length > 0 || canCreateNew)"
      class="tag-suggestions"
      role="listbox"
      :aria-label="suggestionsAriaLabel"
    >
      <!-- Existing tag suggestions -->
      <div
        v-for="(suggestion, index) in filteredSuggestions"
        :key="getTagKey(suggestion)"
        class="suggestion-item"
        :class="{ 'is-selected': index === focusedSuggestionIndex }"
        role="option"
        :aria-selected="index === focusedSuggestionIndex"
        @click="selectSuggestion(suggestion)"
        @mouseenter="focusedSuggestionIndex = index"
      >
        <slot name="suggestion" :tag="suggestion" :index="index">
          <span class="suggestion-label">{{ getTagLabel(suggestion) }}</span>
          <span v-if="getTagCount(suggestion)" class="suggestion-count">
            ({{ getTagCount(suggestion) }})
          </span>
        </slot>
      </div>

      <!-- Create new tag option -->
      <div
        v-if="canCreateNew && inputValue.trim()"
        class="suggestion-item create-new"
        :class="{ 'is-selected': focusedSuggestionIndex === filteredSuggestions.length }"
        role="option"
        :aria-selected="focusedSuggestionIndex === filteredSuggestions.length"
        @click="createNewTag"
        @mouseenter="focusedSuggestionIndex = filteredSuggestions.length"
      >
        <slot name="create-new" :value="inputValue.trim()">
          <span class="create-label">Create tag: </span>
          <strong>"{{ inputValue.trim() }}"</strong>
        </slot>
      </div>

      <!-- No suggestions message -->
      <div v-if="filteredSuggestions.length === 0 && !canCreateNew && inputValue.trim()" class="no-suggestions">
        <slot name="no-suggestions" :input="inputValue">
          No matching tags found
        </slot>
      </div>
    </div>

    <!-- Popular/recent tags -->
    <div v-if="showPopularTags && popularTags.length > 0" class="popular-tags">
      <div class="popular-tags-label">
        <slot name="popular-label">
          Popular tags:
        </slot>
      </div>
      
      <div class="popular-tags-list">
        <button
          v-for="tag in visiblePopularTags"
          :key="getTagKey(tag)"
          type="button"
          class="popular-tag"
          :class="{ 'is-selected': isTagSelected(tag) }"
          :disabled="isTagSelected(tag) || isTagDisabled(tag)"
          @click="addTag(tag)"
        >
          <slot name="popular-tag" :tag="tag" :selected="isTagSelected(tag)">
            {{ getTagLabel(tag) }}
            <span v-if="getTagCount(tag)" class="popular-tag-count">
              ({{ getTagCount(tag) }})
            </span>
          </slot>
        </button>

        <button
          v-if="popularTags.length > maxVisiblePopular"
          type="button"
          class="show-more-popular"
          @click="toggleShowAllPopular"
        >
          {{ showAllPopular ? 'Show less' : `+${popularTags.length - maxVisiblePopular} more` }}
        </button>
      </div>
    </div>

    <!-- Selected tags summary -->
    <div v-if="showSummary && selectedTags.length > 0" class="tag-summary">
      <slot name="summary" :count="selectedTags.length" :tags="selectedTagObjects">
        {{ selectedTags.length }} tag{{ selectedTags.length === 1 ? '' : 's' }} selected
      </slot>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted } from 'vue'

/**
 * TagFilter component for tag-based filtering
 * @component
 */
export default {
  name: 'TagFilter',
  props: {
    /**
     * Array of selected tag values
     */
    modelValue: {
      type: Array,
      default: () => []
    },
    /**
     * Available tag suggestions
     */
    suggestions: {
      type: Array,
      default: () => []
    },
    /**
     * Popular/featured tags to display
     */
    popularTags: {
      type: Array,
      default: () => []
    },
    /**
     * Label for the tag filter
     */
    label: {
      type: String,
      default: null
    },
    /**
     * Placeholder text for input
     */
    placeholder: {
      type: String,
      default: 'Add tags...'
    },
    /**
     * Placeholder when tags are selected
     */
    selectedPlaceholder: {
      type: String,
      default: 'Add more tags...'
    },
    /**
     * Whether the input is disabled
     */
    disabled: {
      type: Boolean,
      default: false
    },
    /**
     * Allow creating new tags
     */
    allowCreate: {
      type: Boolean,
      default: true
    },
    /**
     * Maximum number of selected tags
     */
    maxTags: {
      type: Number,
      default: null
    },
    /**
     * Maximum length for tag input
     */
    maxLength: {
      type: Number,
      default: 50
    },
    /**
     * Show clear all button
     */
    showClearAll: {
      type: Boolean,
      default: true
    },
    /**
     * Show popular tags section
     */
    showPopularTags: {
      type: Boolean,
      default: true
    },
    /**
     * Show tag count summary
     */
    showSummary: {
      type: Boolean,
      default: false
    },
    /**
     * Maximum popular tags to show initially
     */
    maxVisiblePopular: {
      type: Number,
      default: 8
    },
    /**
     * Property name for tag labels (if tags are objects)
     */
    labelKey: {
      type: String,
      default: 'label'
    },
    /**
     * Property name for tag values (if tags are objects)
     */
    valueKey: {
      type: String,
      default: 'value'
    },
    /**
     * Property name for tag counts (if tags are objects)
     */
    countKey: {
      type: String,
      default: 'count'
    },
    /**
     * Property name for tag disabled state (if tags are objects)
     */
    disabledKey: {
      type: String,
      default: 'disabled'
    },
    /**
     * Characters that separate tags on paste/input
     */
    separators: {
      type: Array,
      default: () => [',', ';', '\n', '\t']
    },
    /**
     * Case sensitivity for tag matching
     */
    caseSensitive: {
      type: Boolean,
      default: false
    },
    /**
     * ARIA label for clear all button
     */
    clearAllAriaLabel: {
      type: String,
      default: 'Clear all tags'
    },
    /**
     * ARIA label for suggestions
     */
    suggestionsAriaLabel: {
      type: String,
      default: 'Tag suggestions'
    }
  },
  emits: [
    /**
     * Emitted when selected tags change
     * @param {Array} tags - Array of selected tag values
     */
    'change',
    /**
     * Emitted when tag is added
     * @param {*} tag - Added tag
     */
    'add',
    /**
     * Emitted when tag is removed
     * @param {*} tag - Removed tag
     */
    'remove',
    /**
     * Emitted when new tag is created
     * @param {string} value - New tag value
     */
    'create',
    /**
     * Emitted when input value changes
     * @param {string} value - Current input value
     */
    'input-change',
    /**
     * Update model value
     * @param {Array} tags - Array of selected tag values
     */
    'update:modelValue'
  ],
  setup(props, { emit }) {
    const tagInput = ref(null)
    const inputValue = ref('')
    const isInputFocused = ref(false)
    const focusedSuggestionIndex = ref(-1)
    const showAllPopular = ref(false)

    /**
     * Current selected tags
     */
    const selectedTags = computed(() => props.modelValue || [])

    /**
     * Selected tag objects with metadata
     */
    const selectedTagObjects = computed(() => {
      return selectedTags.value.map(tagValue => {
        // Try to find full tag object from suggestions
        const fullTag = props.suggestions.find(suggestion => 
          getTagValue(suggestion) === tagValue
        )
        return fullTag || createTagObject(tagValue)
      })
    })

    /**
     * Whether suggestions should be shown
     */
    const showSuggestions = computed(() => {
      return isInputFocused.value && (inputValue.value.length > 0 || filteredSuggestions.value.length > 0)
    })

    /**
     * Filtered suggestions based on input
     */
    const filteredSuggestions = computed(() => {
      if (!inputValue.value.trim()) {
        // Show all available suggestions when input is empty
        return props.suggestions.filter(suggestion => 
          !isTagSelected(suggestion) && !isTagDisabled(suggestion)
        ).slice(0, 10)
      }

      const query = props.caseSensitive ? inputValue.value : inputValue.value.toLowerCase()
      return props.suggestions.filter(suggestion => {
        if (isTagSelected(suggestion) || isTagDisabled(suggestion)) return false
        
        const label = props.caseSensitive ? getTagLabel(suggestion) : getTagLabel(suggestion).toLowerCase()
        return label.includes(query)
      }).slice(0, 10)
    })

    /**
     * Whether new tag can be created
     */
    const canCreateNew = computed(() => {
      if (!props.allowCreate || !inputValue.value.trim()) return false
      if (props.maxTags && selectedTags.value.length >= props.maxTags) return false
      
      const newTagValue = inputValue.value.trim()
      return !selectedTags.value.includes(newTagValue) &&
             !filteredSuggestions.value.some(suggestion => 
               getTagValue(suggestion) === newTagValue
             )
    })

    /**
     * Effective placeholder text
     */
    const effectivePlaceholder = computed(() => {
      if (selectedTags.value.length > 0) {
        return props.selectedPlaceholder
      }
      return props.placeholder
    })

    /**
     * Visible popular tags
     */
    const visiblePopularTags = computed(() => {
      const filtered = props.popularTags.filter(tag => !isTagSelected(tag))
      return showAllPopular.value ? filtered : filtered.slice(0, props.maxVisiblePopular)
    })

    /**
     * Get tag label
     */
    const getTagLabel = (tag) => {
      if (typeof tag === 'object' && tag !== null) {
        return tag[props.labelKey] || tag.text || tag.name || String(tag)
      }
      return String(tag)
    }

    /**
     * Get tag value
     */
    const getTagValue = (tag) => {
      if (typeof tag === 'object' && tag !== null) {
        return tag[props.valueKey] !== undefined ? tag[props.valueKey] : tag
      }
      return tag
    }

    /**
     * Get tag count
     */
    const getTagCount = (tag) => {
      if (typeof tag === 'object' && tag !== null) {
        return tag[props.countKey] || null
      }
      return null
    }

    /**
     * Get tag key for v-for
     */
    const getTagKey = (tag) => {
      const value = getTagValue(tag)
      return value !== null && value !== undefined ? String(value) : Math.random().toString(36)
    }

    /**
     * Check if tag is selected
     */
    const isTagSelected = (tag) => {
      const tagValue = getTagValue(tag)
      return selectedTags.value.includes(tagValue)
    }

    /**
     * Check if tag is disabled
     */
    const isTagDisabled = (tag) => {
      if (typeof tag === 'object' && tag !== null) {
        return tag[props.disabledKey] === true
      }
      return false
    }

    /**
     * Create tag object from value
     */
    const createTagObject = (value) => {
      return {
        [props.labelKey]: value,
        [props.valueKey]: value
      }
    }

    /**
     * Add tag to selection
     */
    const addTag = (tag) => {
      if (props.maxTags && selectedTags.value.length >= props.maxTags) return
      if (isTagSelected(tag) || isTagDisabled(tag)) return

      const tagValue = getTagValue(tag)
      const newTags = [...selectedTags.value, tagValue]
      
      emit('update:modelValue', newTags)
      emit('add', tag)
      emit('change', newTags)
    }

    /**
     * Remove tag from selection
     */
    const removeTag = (tag) => {
      const tagValue = getTagValue(tag)
      const newTags = selectedTags.value.filter(value => value !== tagValue)
      
      emit('update:modelValue', newTags)
      emit('remove', tag)
      emit('change', newTags)
    }

    /**
     * Clear all selected tags
     */
    const clearAllTags = () => {
      emit('update:modelValue', [])
      emit('change', [])
      
      if (tagInput.value) {
        tagInput.value.focus()
      }
    }

    /**
     * Create new tag from input
     */
    const createNewTag = () => {
      if (!canCreateNew.value) return

      const newTagValue = inputValue.value.trim()
      const newTag = createTagObject(newTagValue)
      
      addTag(newTag)
      emit('create', newTagValue)
      
      inputValue.value = ''
      focusedSuggestionIndex.value = -1
    }

    /**
     * Select suggestion
     */
    const selectSuggestion = (suggestion) => {
      addTag(suggestion)
      inputValue.value = ''
      focusedSuggestionIndex.value = -1
      
      nextTick(() => {
        if (tagInput.value) {
          tagInput.value.focus()
        }
      })
    }

    /**
     * Handle input events
     */
    const handleInput = () => {
      focusedSuggestionIndex.value = -1
      emit('input-change', inputValue.value)
    }

    /**
     * Handle keyboard navigation and actions
     */
    const handleKeyDown = (event) => {
      const totalSuggestions = filteredSuggestions.value.length + (canCreateNew.value ? 1 : 0)

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          if (totalSuggestions > 0) {
            focusedSuggestionIndex.value = Math.min(focusedSuggestionIndex.value + 1, totalSuggestions - 1)
          }
          break

        case 'ArrowUp':
          event.preventDefault()
          focusedSuggestionIndex.value = Math.max(focusedSuggestionIndex.value - 1, -1)
          break

        case 'Enter':
          event.preventDefault()
          if (focusedSuggestionIndex.value >= 0) {
            if (focusedSuggestionIndex.value < filteredSuggestions.value.length) {
              selectSuggestion(filteredSuggestions.value[focusedSuggestionIndex.value])
            } else if (canCreateNew.value) {
              createNewTag()
            }
          } else if (canCreateNew.value && inputValue.value.trim()) {
            createNewTag()
          }
          break

        case 'Escape':
          inputValue.value = ''
          focusedSuggestionIndex.value = -1
          break

        case 'Backspace':
          if (!inputValue.value && selectedTags.value.length > 0) {
            const lastTag = selectedTagObjects.value[selectedTagObjects.value.length - 1]
            if (!isTagDisabled(lastTag)) {
              removeTag(lastTag)
            }
          }
          break

        case 'Tab':
          if (canCreateNew.value && inputValue.value.trim()) {
            event.preventDefault()
            createNewTag()
          }
          break
      }
    }

    /**
     * Handle paste events
     */
    const handlePaste = (event) => {
      const pastedText = (event.clipboardData || window.clipboardData).getData('text')
      const tags = pastedText.split(new RegExp(`[${props.separators.join('')}]+`))
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      if (tags.length > 1) {
        event.preventDefault()
        tags.forEach(tagValue => {
          if (!selectedTags.value.includes(tagValue)) {
            const tag = createTagObject(tagValue)
            addTag(tag)
          }
        })
        inputValue.value = ''
      }
    }

    /**
     * Handle input focus
     */
    const handleInputFocus = () => {
      isInputFocused.value = true
    }

    /**
     * Handle input blur
     */
    const handleInputBlur = () => {
      // Delay to allow suggestion clicks
      setTimeout(() => {
        isInputFocused.value = false
        focusedSuggestionIndex.value = -1
      }, 200)
    }

    /**
     * Toggle show all popular tags
     */
    const toggleShowAllPopular = () => {
      showAllPopular.value = !showAllPopular.value
    }

    /**
     * Focus the input
     */
    const focus = () => {
      if (tagInput.value) {
        tagInput.value.focus()
      }
    }

    return {
      tagInput,
      inputValue,
      isInputFocused,
      focusedSuggestionIndex,
      showAllPopular,
      selectedTags,
      selectedTagObjects,
      showSuggestions,
      filteredSuggestions,
      canCreateNew,
      effectivePlaceholder,
      visiblePopularTags,
      getTagLabel,
      getTagValue,
      getTagCount,
      getTagKey,
      isTagSelected,
      isTagDisabled,
      addTag,
      removeTag,
      clearAllTags,
      createNewTag,
      selectSuggestion,
      handleInput,
      handleKeyDown,
      handlePaste,
      handleInputFocus,
      handleInputBlur,
      toggleShowAllPopular,
      focus
    }
  }
}
</script>