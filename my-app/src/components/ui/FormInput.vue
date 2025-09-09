<template>
  <div class="form-input" :class="{ 'has-error': error, 'is-focused': isFocused }">
    <label v-if="label" :for="inputId" class="form-input__label">
      {{ label }}
      <span v-if="required" class="form-input__required" aria-label="required">*</span>
    </label>
    
    <div class="form-input__container">
      <input
        :id="inputId"
        ref="inputRef"
        v-model="inputValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :aria-describedby="error ? `${inputId}-error` : undefined"
        :aria-invalid="error ? 'true' : 'false'"
        class="form-input__field"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="handleInput"
        @keydown="handleKeydown"
      >
      
      <div v-if="$slots.suffix || loading" class="form-input__suffix">
        <div v-if="loading" class="form-input__loading" aria-label="Loading">
          <div class="spinner"></div>
        </div>
        <slot v-else name="suffix"></slot>
      </div>
    </div>
    
    <div v-if="error" :id="`${inputId}-error`" class="form-input__error" role="alert" aria-live="polite">
      {{ error }}
    </div>
    
    <div v-else-if="hint" class="form-input__hint">
      {{ hint }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

/**
 * Enhanced form input component with validation and accessibility
 * @component FormInput
 */

const props = defineProps({
  /** Input field type */
  type: {
    type: String,
    default: 'text',
    validator: (value) => ['text', 'email', 'password', 'number', 'tel', 'url', 'search'].includes(value)
  },
  /** Input label */
  label: {
    type: String,
    default: ''
  },
  /** Input placeholder */
  placeholder: {
    type: String,
    default: ''
  },
  /** Input value (v-model) */
  modelValue: {
    type: [String, Number],
    default: ''
  },
  /** Validation error message */
  error: {
    type: String,
    default: ''
  },
  /** Hint text when no error */
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
  /** Loading state */
  loading: {
    type: Boolean,
    default: false
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
const inputRef = ref(null)
const isFocused = ref(false)
const inputId = computed(() => `input-${Math.random().toString(36).substr(2, 9)}`)

// Two-way binding with v-model
const inputValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Event handlers
const handleFocus = (event) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event) => {
  isFocused.value = false
  validateInput()
  emit('blur', event)
}

const handleInput = (event) => {
  emit('input', event)
  // Debounced validation could be added here
}

const handleKeydown = (event) => {
  emit('keydown', event)
  
  // Handle Enter key for form submission
  if (event.key === 'Enter' && !event.shiftKey) {
    event.target.form?.requestSubmit?.()
  }
}

// Validation logic
const validateInput = () => {
  if (props.validator && typeof props.validator === 'function') {
    const validationResult = props.validator(inputValue.value)
    emit('validate', {
      isValid: !validationResult,
      error: validationResult,
      value: inputValue.value
    })
  }
}

// Focus management
const focus = () => {
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const blur = () => {
  inputRef.value?.blur()
}

// Auto-focus on mount
watch(() => props.autofocus, (shouldFocus) => {
  if (shouldFocus) {
    nextTick(() => focus())
  }
}, { immediate: true })

// Expose methods
defineExpose({
  focus,
  blur,
  validate: validateInput
})
</script>

<style scoped>
.form-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.form-input__label {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--text-primary, #374151);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.form-input__required {
  color: var(--error-color, #dc2626);
  font-weight: 600;
}

.form-input__container {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input__field {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 0.5rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text-primary, #374151);
  background-color: var(--bg-color, #ffffff);
  transition: all 0.2s ease-in-out;
  outline: none;
}

.form-input__field:focus {
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 3px var(--primary-color-alpha, rgba(59, 130, 246, 0.1));
}

.form-input__field:disabled {
  background-color: var(--bg-disabled, #f9fafb);
  color: var(--text-disabled, #9ca3af);
  cursor: not-allowed;
}

.form-input__field::placeholder {
  color: var(--text-placeholder, #9ca3af);
}

.form-input.has-error .form-input__field {
  border-color: var(--error-color, #dc2626);
}

.form-input.has-error .form-input__field:focus {
  box-shadow: 0 0 0 3px var(--error-color-alpha, rgba(220, 38, 38, 0.1));
}

.form-input__suffix {
  position: absolute;
  right: 1rem;
  display: flex;
  align-items: center;
  pointer-events: none;
}

.form-input__loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--border-color, #d1d5db);
  border-top: 2px solid var(--primary-color, #3b82f6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.form-input__error {
  font-size: 0.875rem;
  color: var(--error-color, #dc2626);
  margin-top: -0.25rem;
}

.form-input__hint {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  margin-top: -0.25rem;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .form-input__field {
    background-color: var(--bg-dark, #1f2937);
    border-color: var(--border-dark, #374151);
    color: var(--text-dark, #f9fafb);
  }
  
  .form-input__field:disabled {
    background-color: var(--bg-disabled-dark, #111827);
    color: var(--text-disabled-dark, #6b7280);
  }
}
</style>