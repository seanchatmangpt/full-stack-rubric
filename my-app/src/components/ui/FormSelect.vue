<template>
  <div class="form-select" :class="{ 'has-error': error, 'is-open': isOpen }">
    <label v-if="label" :for="selectId" class="form-select__label">
      {{ label }}
      <span v-if="required" class="form-select__required" aria-label="required">*</span>
    </label>
    
    <div class="form-select__container">
      <div 
        ref="selectRef"
        :id="selectId"
        class="form-select__field"
        :class="{ 'is-disabled': disabled }"
        :tabindex="disabled ? -1 : 0"
        role="combobox"
        :aria-expanded="isOpen"
        :aria-haspopup="listbox"
        :aria-describedby="error ? `${selectId}-error` : undefined"
        :aria-invalid="error ? 'true' : 'false'"
        @click="toggleDropdown"
        @keydown="handleKeydown"
        @blur="handleBlur"
      >
        <div class="form-select__display">
          <span v-if="displayValue" class="form-select__value">{{ displayValue }}</span>
          <span v-else class="form-select__placeholder">{{ placeholder }}</span>
        </div>
        
        <div class="form-select__arrow" :class="{ 'is-rotated': isOpen }">
          <svg viewBox="0 0 20 20" fill="currentColor" class="chevron">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
      
      <Transition name="dropdown">
        <div v-if="isOpen" ref="dropdownRef" class="form-select__dropdown">
          <div v-if="searchable" class="form-select__search">
            <input
              ref="searchRef"
              v-model="searchQuery"
              type="text"
              class="form-select__search-input"
              :placeholder="searchPlaceholder"
              @keydown.stop="handleSearchKeydown"
              @click.stop
            >
          </div>
          
          <ul 
            class="form-select__options"
            role="listbox"
            :aria-labelledby="selectId"
          >
            <li
              v-for="(option, index) in filteredOptions"
              :key="getOptionValue(option)"
              class="form-select__option"
              :class="{ 
                'is-selected': isSelected(option),
                'is-highlighted': highlightedIndex === index
              }"
              role="option"
              :aria-selected="isSelected(option)"
              @click="selectOption(option)"
              @mouseenter="highlightedIndex = index"
            >
              <slot name="option" :option="option" :is-selected="isSelected(option)">
                {{ getOptionLabel(option) }}
              </slot>
              
              <div v-if="isSelected(option)" class="form-select__check">
                <svg viewBox="0 0 20 20" fill="currentColor" class="check">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
            </li>
            
            <li v-if="filteredOptions.length === 0" class="form-select__empty">
              <slot name="empty">{{ noOptionsText }}</slot>
            </li>
          </ul>
        </div>
      </Transition>
    </div>
    
    <div v-if="error" :id="`${selectId}-error`" class="form-select__error" role="alert" aria-live="polite">
      {{ error }}
    </div>
    
    <div v-else-if="hint" class="form-select__hint">
      {{ hint }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

/**
 * Enhanced select dropdown with search functionality
 * @component FormSelect
 */

const props = defineProps({
  /** Select label */
  label: {
    type: String,
    default: ''
  },
  /** Select placeholder */
  placeholder: {
    type: String,
    default: 'Select an option...'
  },
  /** Selected value (v-model) */
  modelValue: {
    type: [String, Number, Object],
    default: null
  },
  /** Options array */
  options: {
    type: Array,
    default: () => []
  },
  /** Option label key for objects */
  labelKey: {
    type: String,
    default: 'label'
  },
  /** Option value key for objects */
  valueKey: {
    type: String,
    default: 'value'
  },
  /** Enable search functionality */
  searchable: {
    type: Boolean,
    default: false
  },
  /** Search input placeholder */
  searchPlaceholder: {
    type: String,
    default: 'Search...'
  },
  /** No options message */
  noOptionsText: {
    type: String,
    default: 'No options available'
  },
  /** Validation error message */
  error: {
    type: String,
    default: ''
  },
  /** Hint text */
  hint: {
    type: String,
    default: ''
  },
  /** Disabled state */
  disabled: {
    type: Boolean,
    default: false
  },
  /** Required field */
  required: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'open', 'close', 'search'])

// Reactive state
const selectRef = ref(null)
const dropdownRef = ref(null)
const searchRef = ref(null)
const isOpen = ref(false)
const searchQuery = ref('')
const highlightedIndex = ref(-1)

const selectId = computed(() => `select-${Math.random().toString(36).substr(2, 9)}`)

// Option utilities
const getOptionLabel = (option) => {
  if (typeof option === 'string' || typeof option === 'number') {
    return option
  }
  return option[props.labelKey] || option.label || option.name || String(option)
}

const getOptionValue = (option) => {
  if (typeof option === 'string' || typeof option === 'number') {
    return option
  }
  return option[props.valueKey] || option.value || option.id || option
}

// Selected value display
const displayValue = computed(() => {
  if (!props.modelValue) return ''
  
  const selectedOption = props.options.find(option => 
    getOptionValue(option) === props.modelValue
  )
  
  return selectedOption ? getOptionLabel(selectedOption) : props.modelValue
})

// Search filtering
const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value) {
    return props.options
  }
  
  const query = searchQuery.value.toLowerCase()
  return props.options.filter(option => {
    const label = getOptionLabel(option).toString().toLowerCase()
    return label.includes(query)
  })
})

// Selection utilities
const isSelected = (option) => {
  return getOptionValue(option) === props.modelValue
}

// Event handlers
const toggleDropdown = () => {
  if (props.disabled) return
  
  if (isOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

const openDropdown = () => {
  isOpen.value = true
  highlightedIndex.value = -1
  emit('open')
  
  // Focus search input if searchable
  if (props.searchable) {
    nextTick(() => {
      searchRef.value?.focus()
    })
  }
}

const closeDropdown = () => {
  isOpen.value = false
  searchQuery.value = ''
  highlightedIndex.value = -1
  emit('close')
}

const selectOption = (option) => {
  const value = getOptionValue(option)
  emit('update:modelValue', value)
  emit('change', { option, value })
  closeDropdown()
  
  // Return focus to select
  nextTick(() => {
    selectRef.value?.focus()
  })
}

// Keyboard navigation
const handleKeydown = (event) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (isOpen.value && highlightedIndex.value >= 0) {
        selectOption(filteredOptions.value[highlightedIndex.value])
      } else {
        toggleDropdown()
      }
      break
      
    case 'Escape':
      event.preventDefault()
      closeDropdown()
      break
      
    case 'ArrowDown':
      event.preventDefault()
      if (!isOpen.value) {
        openDropdown()
      } else {
        highlightedIndex.value = Math.min(
          highlightedIndex.value + 1,
          filteredOptions.value.length - 1
        )
      }
      break
      
    case 'ArrowUp':
      event.preventDefault()
      if (isOpen.value) {
        highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      }
      break
      
    case 'Home':
      if (isOpen.value) {
        event.preventDefault()
        highlightedIndex.value = 0
      }
      break
      
    case 'End':
      if (isOpen.value) {
        event.preventDefault()
        highlightedIndex.value = filteredOptions.value.length - 1
      }
      break
  }
}

const handleSearchKeydown = (event) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(
        highlightedIndex.value + 1,
        filteredOptions.value.length - 1
      )
      break
      
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      break
      
    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0) {
        selectOption(filteredOptions.value[highlightedIndex.value])
      }
      break
      
    case 'Escape':
      event.preventDefault()
      closeDropdown()
      break
  }
}

const handleBlur = (event) => {
  // Close dropdown if clicking outside
  setTimeout(() => {
    const focusedElement = document.activeElement
    const isInsideComponent = selectRef.value?.contains(focusedElement) || 
                             dropdownRef.value?.contains(focusedElement)
    
    if (!isInsideComponent) {
      closeDropdown()
    }
  }, 150)
}

// Click outside handler
const handleClickOutside = (event) => {
  const isInsideComponent = selectRef.value?.contains(event.target) || 
                           dropdownRef.value?.contains(event.target)
  
  if (!isInsideComponent && isOpen.value) {
    closeDropdown()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Watch search query
watch(searchQuery, (newQuery) => {
  highlightedIndex.value = -1
  emit('search', newQuery)
})

// Expose methods
defineExpose({
  open: openDropdown,
  close: closeDropdown,
  focus: () => selectRef.value?.focus()
})
</script>

<style scoped>
.form-select {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  position: relative;
}

.form-select__label {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--text-primary, #374151);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.form-select__required {
  color: var(--error-color, #dc2626);
  font-weight: 600;
}

.form-select__container {
  position: relative;
}

.form-select__field {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 0.5rem;
  background-color: var(--bg-color, #ffffff);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  outline: none;
  transition: all 0.2s ease-in-out;
}

.form-select__field:focus {
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 3px var(--primary-color-alpha, rgba(59, 130, 246, 0.1));
}

.form-select__field.is-disabled {
  background-color: var(--bg-disabled, #f9fafb);
  cursor: not-allowed;
  color: var(--text-disabled, #9ca3af);
}

.form-select.has-error .form-select__field {
  border-color: var(--error-color, #dc2626);
}

.form-select.has-error .form-select__field:focus {
  box-shadow: 0 0 0 3px var(--error-color-alpha, rgba(220, 38, 38, 0.1));
}

.form-select__display {
  flex: 1;
  text-align: left;
}

.form-select__value {
  color: var(--text-primary, #374151);
}

.form-select__placeholder {
  color: var(--text-placeholder, #9ca3af);
}

.form-select__arrow {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--text-secondary, #6b7280);
  transition: transform 0.2s ease-in-out;
}

.form-select__arrow.is-rotated {
  transform: rotate(180deg);
}

.chevron {
  width: 100%;
  height: 100%;
}

.form-select__dropdown {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  background: var(--bg-color, #ffffff);
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  max-height: 16rem;
  overflow-y: auto;
}

.form-select__search {
  padding: 0.5rem;
  border-bottom: 1px solid var(--border-color, #d1d5db);
}

.form-select__search-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 0.375rem;
  outline: none;
  font-size: 0.875rem;
}

.form-select__search-input:focus {
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 3px var(--primary-color-alpha, rgba(59, 130, 246, 0.1));
}

.form-select__options {
  list-style: none;
  margin: 0;
  padding: 0.25rem;
  max-height: 12rem;
  overflow-y: auto;
}

.form-select__option {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--text-primary, #374151);
  transition: background-color 0.15s ease-in-out;
}

.form-select__option:hover,
.form-select__option.is-highlighted {
  background-color: var(--bg-hover, #f3f4f6);
}

.form-select__option.is-selected {
  background-color: var(--primary-color-light, #dbeafe);
  color: var(--primary-color, #3b82f6);
}

.form-select__option.is-selected.is-highlighted {
  background-color: var(--primary-color-light-hover, #bfdbfe);
}

.form-select__check {
  width: 1rem;
  height: 1rem;
  color: var(--primary-color, #3b82f6);
}

.check {
  width: 100%;
  height: 100%;
}

.form-select__empty {
  padding: 1rem 0.75rem;
  text-align: center;
  color: var(--text-placeholder, #9ca3af);
  font-size: 0.875rem;
  font-style: italic;
}

.form-select__error {
  font-size: 0.875rem;
  color: var(--error-color, #dc2626);
  margin-top: -0.25rem;
}

.form-select__hint {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  margin-top: -0.25rem;
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease-in-out, transform 0.15s ease-in-out;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .form-select__field {
    background-color: var(--bg-dark, #1f2937);
    border-color: var(--border-dark, #374151);
    color: var(--text-dark, #f9fafb);
  }
  
  .form-select__dropdown {
    background-color: var(--bg-dark, #1f2937);
    border-color: var(--border-dark, #374151);
  }
  
  .form-select__search-input {
    background-color: var(--bg-dark, #1f2937);
    border-color: var(--border-dark, #374151);
    color: var(--text-dark, #f9fafb);
  }
}
</style>