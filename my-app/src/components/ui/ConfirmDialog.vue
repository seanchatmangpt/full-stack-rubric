<template>
  <Modal
    v-model="dialogVisible"
    :title="title || 'Confirm Action'"
    size="small"
    :close-on-backdrop="!persistent"
    :close-on-escape="!persistent"
    :show-close="!persistent"
    @close="handleCancel"
    @opened="handleOpened"
  >
    <div class="confirm-dialog">
      <!-- Icon -->
      <div v-if="showIcon" class="confirm-dialog__icon" :class="`confirm-dialog__icon--${type}`">
        <component :is="iconComponent" class="icon" />
      </div>
      
      <!-- Content -->
      <div class="confirm-dialog__content">
        <div v-if="message" class="confirm-dialog__message">
          {{ message }}
        </div>
        
        <div v-else class="confirm-dialog__slot">
          <slot></slot>
        </div>
        
        <div v-if="detail" class="confirm-dialog__detail">
          {{ detail }}
        </div>
      </div>
    </div>
    
    <!-- Actions -->
    <template #footer>
      <div class="confirm-dialog__actions" :class="{
        'confirm-dialog__actions--reverse': reverseButtons,
        'confirm-dialog__actions--stack': stackButtons
      }">
        <button
          ref="cancelButtonRef"
          type="button"
          class="confirm-dialog__button confirm-dialog__button--cancel"
          :disabled="loading"
          @click="handleCancel"
        >
          {{ cancelLabel }}
        </button>
        
        <button
          ref="confirmButtonRef"
          type="button"
          class="confirm-dialog__button confirm-dialog__button--confirm"
          :class="`confirm-dialog__button--${type}`"
          :disabled="loading"
          @click="handleConfirm"
        >
          <div v-if="loading" class="confirm-dialog__loading">
            <div class="spinner"></div>
          </div>
          <span v-else>{{ confirmLabel }}</span>
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import Modal from './Modal.vue'

/**
 * Confirmation dialog with customizable actions and states
 * @component ConfirmDialog
 */

const props = defineProps({
  /** Dialog visibility state (v-model) */
  modelValue: {
    type: Boolean,
    default: false
  },
  /** Dialog title */
  title: {
    type: String,
    default: ''
  },
  /** Main message */
  message: {
    type: String,
    default: ''
  },
  /** Detail/description text */
  detail: {
    type: String,
    default: ''
  },
  /** Dialog type affects styling and icon */
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'warning', 'danger', 'success'].includes(value)
  },
  /** Show type icon */
  showIcon: {
    type: Boolean,
    default: true
  },
  /** Confirm button label */
  confirmLabel: {
    type: String,
    default: 'Confirm'
  },
  /** Cancel button label */
  cancelLabel: {
    type: String,
    default: 'Cancel'
  },
  /** Reverse button order (confirm first) */
  reverseButtons: {
    type: Boolean,
    default: false
  },
  /** Stack buttons vertically on mobile */
  stackButtons: {
    type: Boolean,
    default: true
  },
  /** Prevent closing without explicit action */
  persistent: {
    type: Boolean,
    default: false
  },
  /** Loading state */
  loading: {
    type: Boolean,
    default: false
  },
  /** Auto-focus confirm button */
  focusConfirm: {
    type: Boolean,
    default: false
  },
  /** Confirmation callback (async supported) */
  onConfirm: {
    type: Function,
    default: null
  },
  /** Cancellation callback */
  onCancel: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel', 'close'])

// Reactive state
const cancelButtonRef = ref(null)
const confirmButtonRef = ref(null)

// Computed properties
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Icon components based on type
const iconComponent = computed(() => {
  const icons = {
    info: 'InfoIcon',
    warning: 'WarningIcon', 
    danger: 'DangerIcon',
    success: 'SuccessIcon'
  }
  return icons[props.type] || 'InfoIcon'
})

// Event handlers
const handleConfirm = async () => {
  emit('confirm')
  
  if (props.onConfirm && typeof props.onConfirm === 'function') {
    try {
      const result = await props.onConfirm()
      
      // Only close if the callback doesn't return false
      if (result !== false) {
        dialogVisible.value = false
      }
    } catch (error) {
      console.error('Confirmation callback error:', error)
      // Don't close on error - let parent handle
    }
  } else {
    dialogVisible.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
  emit('close')
  
  if (props.onCancel && typeof props.onCancel === 'function') {
    props.onCancel()
  }
  
  dialogVisible.value = false
}

const handleOpened = () => {
  // Auto-focus appropriate button
  nextTick(() => {
    if (props.focusConfirm) {
      confirmButtonRef.value?.focus()
    } else {
      cancelButtonRef.value?.focus()
    }
  })
}

// Static methods for programmatic usage
const createConfirmDialog = (options = {}) => {
  return new Promise((resolve) => {
    const {
      title = 'Confirm Action',
      message = 'Are you sure you want to continue?',
      detail = '',
      type = 'info',
      confirmLabel = 'Confirm',
      cancelLabel = 'Cancel',
      persistent = false,
      focusConfirm = false
    } = options
    
    // Create a temporary component instance
    // This would typically be done through a service/plugin
    resolve({
      show: () => {
        // Implementation would depend on how you want to handle programmatic dialogs
        console.log('Showing confirm dialog:', { title, message, type })
      }
    })
  })
}

// Expose methods and properties
defineExpose({
  confirm: handleConfirm,
  cancel: handleCancel,
  createConfirmDialog
})
</script>

<script>
// Icon components (inline SVGs for this example)
const InfoIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
    </svg>
  `
}

const WarningIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
    </svg>
  `
}

const DangerIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
    </svg>
  `
}

const SuccessIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  `
}

export { InfoIcon, WarningIcon, DangerIcon, SuccessIcon }
</script>

<style scoped>
.confirm-dialog {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.5rem 0;
}

.confirm-dialog__icon {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-dialog__icon--info {
  background-color: var(--info-bg, #dbeafe);
  color: var(--info-color, #3b82f6);
}

.confirm-dialog__icon--warning {
  background-color: var(--warning-bg, #fef3c7);
  color: var(--warning-color, #f59e0b);
}

.confirm-dialog__icon--danger {
  background-color: var(--danger-bg, #fecaca);
  color: var(--danger-color, #ef4444);
}

.confirm-dialog__icon--success {
  background-color: var(--success-bg, #d1fae5);
  color: var(--success-color, #10b981);
}

.icon {
  width: 1.5rem;
  height: 1.5rem;
}

.confirm-dialog__content {
  flex: 1;
  min-width: 0;
}

.confirm-dialog__message {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary, #111827);
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.confirm-dialog__detail {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  line-height: 1.5;
}

.confirm-dialog__slot {
  color: var(--text-primary, #111827);
  line-height: 1.5;
}

.confirm-dialog__actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.confirm-dialog__actions--reverse {
  flex-direction: row-reverse;
  justify-content: flex-start;
}

.confirm-dialog__button {
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 5rem;
  height: 2.5rem;
  border: 1px solid transparent;
  outline: none;
}

.confirm-dialog__button:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.confirm-dialog__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.confirm-dialog__button--cancel {
  background-color: var(--bg-secondary, #ffffff);
  color: var(--text-primary, #374151);
  border-color: var(--border-color, #d1d5db);
}

.confirm-dialog__button--cancel:hover:not(:disabled) {
  background-color: var(--bg-hover, #f9fafb);
  border-color: var(--border-hover, #9ca3af);
}

.confirm-dialog__button--confirm {
  color: white;
}

.confirm-dialog__button--info {
  background-color: var(--info-color, #3b82f6);
}

.confirm-dialog__button--info:hover:not(:disabled) {
  background-color: var(--info-hover, #2563eb);
}

.confirm-dialog__button--warning {
  background-color: var(--warning-color, #f59e0b);
}

.confirm-dialog__button--warning:hover:not(:disabled) {
  background-color: var(--warning-hover, #d97706);
}

.confirm-dialog__button--danger {
  background-color: var(--danger-color, #ef4444);
}

.confirm-dialog__button--danger:hover:not(:disabled) {
  background-color: var(--danger-hover, #dc2626);
}

.confirm-dialog__button--success {
  background-color: var(--success-color, #10b981);
}

.confirm-dialog__button--success:hover:not(:disabled) {
  background-color: var(--success-hover, #059669);
}

.confirm-dialog__loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Mobile responsive */
@media (max-width: 640px) {
  .confirm-dialog {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.5rem;
  }
  
  .confirm-dialog__actions--stack {
    flex-direction: column;
    width: 100%;
  }
  
  .confirm-dialog__actions--stack .confirm-dialog__button {
    width: 100%;
  }
  
  .confirm-dialog__icon {
    width: 4rem;
    height: 4rem;
  }
  
  .confirm-dialog__icon .icon {
    width: 2rem;
    height: 2rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .confirm-dialog__message {
    color: var(--text-dark, #f9fafb);
  }
  
  .confirm-dialog__detail {
    color: var(--text-secondary-dark, #9ca3af);
  }
  
  .confirm-dialog__slot {
    color: var(--text-dark, #f9fafb);
  }
  
  .confirm-dialog__button--cancel {
    background-color: var(--bg-secondary-dark, #374151);
    color: var(--text-dark, #f9fafb);
    border-color: var(--border-dark, #4b5563);
  }
  
  .confirm-dialog__button--cancel:hover:not(:disabled) {
    background-color: var(--bg-hover-dark, #4b5563);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .confirm-dialog__button {
    border-width: 2px;
  }
  
  .confirm-dialog__button:focus {
    box-shadow: 0 0 0 3px #000000;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .confirm-dialog__button,
  .spinner {
    transition: none;
    animation: none;
  }
}
</style>