<template>
  <div class="form-textarea" :class="{ 'has-error': error, 'is-focused': isFocused }">
    <label v-if="label" :for="textareaId" class="form-textarea__label">
      {{ label }}
      <span v-if="required" class="form-textarea__required" aria-label="required">*</span>
    </label>
    
    <div class="form-textarea__container">
      <textarea
        :id="textareaId"
        ref="textareaRef"
        v-model="textareaValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :maxlength="maxlength"
        :rows="computedRows"
        :aria-describedby="error ? `${textareaId}-error` : undefined"
        :aria-invalid="error ? 'true' : 'false'"
        class="form-textarea__field"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      ></textarea>
      
      <div v-if="showResize" class="form-textarea__resize-handle">
        <svg viewBox="0 0 16 16" class="resize-icon">
          <path d="M16 0v16H0V0h16zm-1 1H1v14h14V1zm-3 10l-1-1 1-1h-1l-1 1-1-1h1l1-1-1-1 1 1 1-1v1l1 1-1 1v-1zm-4 0l-1-1 1-1H7l-1 1-1-1h1l1-1-1-1 1 1 1-1v1l1 1-1 1V11z"/>
        </svg>
      </div>
    </div>
    
    <div class="form-textarea__footer">
      <div class="form-textarea__info">
        <div v-if="error" :id="`${textareaId}-error`" class="form-textarea__error" role="alert" aria-live="polite">
          {{ error }}
        </div>
        
        <div v-else-if="hint" class="form-textarea__hint">
          {{ hint }}
        </div>
      </div>
      
      <div v-if="showCharCount" class="form-textarea__char-count" :class="{
        'is-warning': charCountWarning,
        'is-error': charCountError
      }">
        {{ currentLength }}{{ maxlength ? `/${maxlength}` : '' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'

/**
 * Enhanced textarea component with auto-resize and character counting
 * @component FormTextarea
 */

const props = defineProps({
  /** Textarea label */
  label: {
    type: String,
    default: ''
  },
  /** Textarea placeholder */
  placeholder: {
    type: String,
    default: ''
  },
  /** Textarea value (v-model) */
  modelValue: {
    type: String,
    default: ''
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
  },
  /** Maximum character length */
  maxlength: {
    type: Number,
    default: null
  },
  /** Minimum rows */
  minRows: {
    type: Number,
    default: 3
  },
  /** Maximum rows (for auto-resize) */
  maxRows: {
    type: Number,
    default: 10
  },
  /** Enable auto-resize */
  autoResize: {
    type: Boolean,
    default: true
  },
  /** Show character count */
  showCharCount: {
    type: Boolean,
    default: false
  },
  /** Show resize handle */
  showResize: {
    type: Boolean,
    default: false
  },
  /** Character count warning threshold (percentage) */
  charCountWarningThreshold: {
    type: Number,
    default: 0.8
  },
  /** Validation rules function */
  validator: {
    type: Function,
    default: null
  },
  /** Auto-focus on mount */
  autofocus: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur', 'input', 'validate', 'keydown'])

// Reactive state
const textareaRef = ref(null)
const isFocused = ref(false)
const currentRows = ref(props.minRows)

const textareaId = computed(() => `textarea-${Math.random().toString(36).substr(2, 9)}`)

// Two-way binding with v-model
const textareaValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Character counting
const currentLength = computed(() => textareaValue.value.length)

const charCountWarning = computed(() => {
  if (!props.maxlength || !props.showCharCount) return false
  return currentLength.value >= props.maxlength * props.charCountWarningThreshold
})

const charCountError = computed(() => {
  if (!props.maxlength || !props.showCharCount) return false
  return currentLength.value > props.maxlength
})

// Auto-resize logic
const computedRows = computed(() => {
  return props.autoResize ? currentRows.value : props.minRows
})

const updateTextareaHeight = () => {
  if (!props.autoResize || !textareaRef.value) return
  
  const textarea = textareaRef.value
  const minHeight = parseInt(getComputedStyle(textarea).lineHeight) * props.minRows
  const maxHeight = parseInt(getComputedStyle(textarea).lineHeight) * props.maxRows
  
  // Reset height to auto to get the natural height
  textarea.style.height = 'auto'
  
  // Calculate the new height
  let newHeight = Math.max(textarea.scrollHeight, minHeight)
  newHeight = Math.min(newHeight, maxHeight)
  
  // Apply the new height
  textarea.style.height = `${newHeight}px`
  
  // Update rows for proper baseline
  const lineHeight = parseInt(getComputedStyle(textarea).lineHeight)
  currentRows.value = Math.max(
    props.minRows,
    Math.min(Math.ceil(newHeight / lineHeight), props.maxRows)
  )
}

// Event handlers
const handleInput = (event) => {
  emit('input', event)
  
  if (props.autoResize) {
    nextTick(() => updateTextareaHeight())
  }
  
  // Debounced validation could be added here
  if (props.validator && typeof props.validator === 'function') {
    const validationResult = props.validator(textareaValue.value)
    emit('validate', {
      isValid: !validationResult,
      error: validationResult,
      value: textareaValue.value,
      length: currentLength.value
    })
  }
}

const handleFocus = (event) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event) => {
  isFocused.value = false
  validateTextarea()
  emit('blur', event)
}

const handleKeydown = (event) => {
  emit('keydown', event)
  
  // Handle Ctrl+Enter for form submission
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.target.form?.requestSubmit?.()
  }
  
  // Handle Tab key for proper indentation (optional)
  if (event.key === 'Tab' && !event.shiftKey) {
    event.preventDefault()
    const start = event.target.selectionStart
    const end = event.target.selectionEnd
    
    // Insert tab character
    const newValue = textareaValue.value.substring(0, start) + '\t' + textareaValue.value.substring(end)
    emit('update:modelValue', newValue)
    
    // Restore cursor position
    nextTick(() => {
      event.target.selectionStart = event.target.selectionEnd = start + 1
    })
  }
}

// Validation logic
const validateTextarea = () => {
  if (props.validator && typeof props.validator === 'function') {
    const validationResult = props.validator(textareaValue.value)
    emit('validate', {
      isValid: !validationResult,
      error: validationResult,
      value: textareaValue.value,
      length: currentLength.value
    })
  }
}

// Focus management
const focus = () => {
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

const blur = () => {
  textareaRef.value?.blur()
}

// Text manipulation methods
const insertText = (text, position) => {
  if (!textareaRef.value) return
  
  const textarea = textareaRef.value
  const start = position !== undefined ? position : textarea.selectionStart
  const end = textarea.selectionEnd
  
  const newValue = textareaValue.value.substring(0, start) + text + textareaValue.value.substring(end)
  emit('update:modelValue', newValue)
  
  // Restore cursor position after text
  nextTick(() => {
    textarea.selectionStart = textarea.selectionEnd = start + text.length
    textarea.focus()
  })
}

const selectAll = () => {
  if (textareaRef.value) {
    textareaRef.value.select()
  }
}

const getSelectionInfo = () => {
  if (!textareaRef.value) return null
  
  const textarea = textareaRef.value
  return {
    start: textarea.selectionStart,
    end: textarea.selectionEnd,
    selectedText: textareaValue.value.substring(textarea.selectionStart, textarea.selectionEnd),
    beforeSelection: textareaValue.value.substring(0, textarea.selectionStart),
    afterSelection: textareaValue.value.substring(textarea.selectionEnd)
  }
}

// Watchers
watch(() => textareaValue.value, () => {
  if (props.autoResize) {
    nextTick(() => updateTextareaHeight())
  }
})

watch(() => props.autofocus, (shouldFocus) => {
  if (shouldFocus) {
    nextTick(() => focus())
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  if (props.autoResize) {
    nextTick(() => updateTextareaHeight())
  }
})

// Expose methods
defineExpose({
  focus,
  blur,
  validate: validateTextarea,
  insertText,
  selectAll,
  getSelectionInfo,
  updateHeight: updateTextareaHeight
})
</script>

<style scoped>
.form-textarea {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.form-textarea__label {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--text-primary, #374151);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.form-textarea__required {
  color: var(--error-color, #dc2626);
  font-weight: 600;
}

.form-textarea__container {
  position: relative;
}

.form-textarea__field {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 0.5rem;
  font-size: 1rem;
  line-height: 1.5;
  font-family: inherit;
  color: var(--text-primary, #374151);
  background-color: var(--bg-color, #ffffff);
  transition: all 0.2s ease-in-out;
  outline: none;
  resize: none; /* Control resize through auto-resize */
  min-height: 4.5rem;
}

.form-textarea__field:focus {
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 3px var(--primary-color-alpha, rgba(59, 130, 246, 0.1));
}

.form-textarea__field:disabled {
  background-color: var(--bg-disabled, #f9fafb);
  color: var(--text-disabled, #9ca3af);
  cursor: not-allowed;
}

.form-textarea__field::placeholder {
  color: var(--text-placeholder, #9ca3af);
}

.form-textarea.has-error .form-textarea__field {
  border-color: var(--error-color, #dc2626);
}

.form-textarea.has-error .form-textarea__field:focus {
  box-shadow: 0 0 0 3px var(--error-color-alpha, rgba(220, 38, 38, 0.1));
}

.form-textarea__resize-handle {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  width: 1rem;
  height: 1rem;
  color: var(--text-secondary, #6b7280);
  pointer-events: none;
  opacity: 0.5;
}

.resize-icon {
  width: 100%;
  height: 100%;
}

.form-textarea__footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  min-height: 1.25rem;
}

.form-textarea__info {
  flex: 1;
  min-width: 0;
}

.form-textarea__error {
  font-size: 0.875rem;
  color: var(--error-color, #dc2626);
}

.form-textarea__hint {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
}

.form-textarea__char-count {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.form-textarea__char-count.is-warning {
  color: var(--warning-color, #d97706);
  font-weight: 500;
}

.form-textarea__char-count.is-error {
  color: var(--error-color, #dc2626);
  font-weight: 600;
}

/* Auto-resize enabled styles */
.form-textarea[data-auto-resize="true"] .form-textarea__field {
  overflow-y: hidden;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .form-textarea__field {
    background-color: var(--bg-dark, #1f2937);
    border-color: var(--border-dark, #374151);
    color: var(--text-dark, #f9fafb);
  }
  
  .form-textarea__field:disabled {
    background-color: var(--bg-disabled-dark, #111827);
    color: var(--text-disabled-dark, #6b7280);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .form-textarea__field {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .form-textarea__field {
    transition: none;
  }
}
</style>