<template>
  <div class="form-checkbox" :class="{ 'has-error': error, 'is-disabled': disabled }">
    <label :for="checkboxId" class="form-checkbox__container">
      <input
        :id="checkboxId"
        ref="checkboxRef"
        v-model="checkboxValue"
        type="checkbox"
        class="form-checkbox__input"
        :disabled="disabled"
        :required="required"
        :indeterminate.prop="indeterminate"
        :aria-describedby="error ? `${checkboxId}-error` : undefined"
        :aria-invalid="error ? 'true' : 'false'"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
      >
      
      <div class="form-checkbox__box" :class="{
        'is-checked': isChecked,
        'is-indeterminate': indeterminate,
        'is-focused': isFocused
      }">
        <Transition name="check" mode="out-in">
          <svg
            v-if="indeterminate"
            key="indeterminate"
            viewBox="0 0 16 16"
            fill="currentColor"
            class="form-checkbox__icon"
          >
            <path d="M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          <svg
            v-else-if="isChecked"
            key="checked"
            viewBox="0 0 16 16"
            fill="currentColor"
            class="form-checkbox__icon"
          >
            <path
              fill-rule="evenodd"
              d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
              clip-rule="evenodd"
            />
          </svg>
        </Transition>
      </div>
      
      <div v-if="$slots.default || label" class="form-checkbox__content">
        <div class="form-checkbox__label">
          <slot>{{ label }}</slot>
          <span v-if="required" class="form-checkbox__required" aria-label="required">*</span>
        </div>
        
        <div v-if="description" class="form-checkbox__description">
          {{ description }}
        </div>
      </div>
    </label>
    
    <div v-if="error" :id="`${checkboxId}-error`" class="form-checkbox__error" role="alert" aria-live="polite">
      {{ error }}
    </div>
    
    <div v-else-if="hint" class="form-checkbox__hint">
      {{ hint }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

/**
 * Enhanced checkbox component with indeterminate state support
 * @component FormCheckbox
 */

const props = defineProps({
  /** Checkbox label */
  label: {
    type: String,
    default: ''
  },
  /** Checkbox description/help text */
  description: {
    type: String,
    default: ''
  },
  /** Checked state (v-model) */
  modelValue: {
    type: [Boolean, Array],
    default: false
  },
  /** Value when used in array (for checkbox groups) */
  value: {
    type: [String, Number, Boolean],
    default: null
  },
  /** Indeterminate state (for parent checkboxes) */
  indeterminate: {
    type: Boolean,
    default: false
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
  /** Custom checkbox size */
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'focus', 'blur'])

// Reactive state
const checkboxRef = ref(null)
const isFocused = ref(false)
const checkboxId = computed(() => `checkbox-${Math.random().toString(36).substr(2, 9)}`)

// Computed properties
const isChecked = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.value !== null && props.modelValue.includes(props.value)
  }
  return Boolean(props.modelValue)
})

const checkboxValue = computed({
  get() {
    if (Array.isArray(props.modelValue)) {
      return props.value !== null && props.modelValue.includes(props.value)
    }
    return Boolean(props.modelValue)
  },
  set(checked) {
    if (Array.isArray(props.modelValue)) {
      const newValue = [...props.modelValue]
      if (checked && props.value !== null) {
        if (!newValue.includes(props.value)) {
          newValue.push(props.value)
        }
      } else {
        const index = newValue.indexOf(props.value)
        if (index > -1) {
          newValue.splice(index, 1)
        }
      }
      emit('update:modelValue', newValue)
    } else {
      emit('update:modelValue', checked)
    }
  }
})

// Event handlers
const handleChange = (event) => {
  emit('change', {
    checked: event.target.checked,
    value: props.value,
    originalEvent: event
  })
}

const handleFocus = (event) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event) => {
  isFocused.value = false
  emit('blur', event)
}

// Methods
const focus = () => {
  nextTick(() => {
    checkboxRef.value?.focus()
  })
}

const blur = () => {
  checkboxRef.value?.blur()
}

const toggle = () => {
  if (props.disabled) return
  checkboxRef.value?.click()
}

// Watch indeterminate prop and sync with DOM
watch(() => props.indeterminate, (newVal) => {
  if (checkboxRef.value) {
    checkboxRef.value.indeterminate = newVal
  }
}, { immediate: true })

// Expose methods
defineExpose({
  focus,
  blur,
  toggle,
  checked: isChecked
})
</script>

<style scoped>
.form-checkbox {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-checkbox__container {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  position: relative;
}

.form-checkbox.is-disabled .form-checkbox__container {
  cursor: not-allowed;
  opacity: 0.6;
}

.form-checkbox__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  margin: 0;
  padding: 0;
  pointer-events: none;
}

.form-checkbox__box {
  position: relative;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--border-color, #d1d5db);
  border-radius: 0.375rem;
  background-color: var(--bg-color, #ffffff);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;
  flex-shrink: 0;
  margin-top: 0.125rem; /* Align with first line of text */
}

.form-checkbox__box:hover {
  border-color: var(--primary-color, #3b82f6);
}

.form-checkbox__box.is-focused {
  box-shadow: 0 0 0 3px var(--primary-color-alpha, rgba(59, 130, 246, 0.1));
}

.form-checkbox__box.is-checked,
.form-checkbox__box.is-indeterminate {
  background-color: var(--primary-color, #3b82f6);
  border-color: var(--primary-color, #3b82f6);
}

.form-checkbox.has-error .form-checkbox__box {
  border-color: var(--error-color, #dc2626);
}

.form-checkbox.has-error .form-checkbox__box.is-checked,
.form-checkbox.has-error .form-checkbox__box.is-indeterminate {
  background-color: var(--error-color, #dc2626);
  border-color: var(--error-color, #dc2626);
}

.form-checkbox.has-error .form-checkbox__box.is-focused {
  box-shadow: 0 0 0 3px var(--error-color-alpha, rgba(220, 38, 38, 0.1));
}

.form-checkbox__icon {
  width: 0.875rem;
  height: 0.875rem;
  color: white;
  flex-shrink: 0;
}

.form-checkbox__content {
  flex: 1;
  min-width: 0;
}

.form-checkbox__label {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--text-primary, #374151);
  line-height: 1.5;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  word-break: break-word;
}

.form-checkbox__required {
  color: var(--error-color, #dc2626);
  font-weight: 600;
  flex-shrink: 0;
}

.form-checkbox__description {
  font-size: 0.8125rem;
  color: var(--text-secondary, #6b7280);
  line-height: 1.4;
  margin-top: 0.25rem;
}

.form-checkbox__error {
  font-size: 0.875rem;
  color: var(--error-color, #dc2626);
  margin-left: 2rem; /* Align with content */
}

.form-checkbox__hint {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  margin-left: 2rem; /* Align with content */
}

/* Size variants */
.form-checkbox[data-size="small"] .form-checkbox__box {
  width: 1rem;
  height: 1rem;
}

.form-checkbox[data-size="small"] .form-checkbox__icon {
  width: 0.75rem;
  height: 0.75rem;
}

.form-checkbox[data-size="small"] .form-checkbox__label {
  font-size: 0.8125rem;
}

.form-checkbox[data-size="large"] .form-checkbox__box {
  width: 1.5rem;
  height: 1.5rem;
}

.form-checkbox[data-size="large"] .form-checkbox__icon {
  width: 1rem;
  height: 1rem;
}

.form-checkbox[data-size="large"] .form-checkbox__label {
  font-size: 1rem;
}

/* Transitions */
.check-enter-active,
.check-leave-active {
  transition: all 0.2s ease-in-out;
}

.check-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.check-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .form-checkbox__box {
    background-color: var(--bg-dark, #1f2937);
    border-color: var(--border-dark, #374151);
  }
  
  .form-checkbox__label {
    color: var(--text-dark, #f9fafb);
  }
  
  .form-checkbox__description {
    color: var(--text-secondary-dark, #9ca3af);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .form-checkbox__box {
    border-width: 2px;
  }
  
  .form-checkbox__box.is-focused {
    box-shadow: 0 0 0 3px var(--focus-ring-color, #000000);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .form-checkbox__box,
  .form-checkbox__icon,
  .check-enter-active,
  .check-leave-active {
    transition: none;
  }
}
</style>